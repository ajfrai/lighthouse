#!/usr/bin/env node

/**
 * Runtime Integration Tests - Actually simulate dialogues rendering
 * These tests catch bugs that structural tests miss (like [object Object])
 */

const fs = require('fs');
const path = require('path');

// Load game code - make globals available
const dataCode = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf8');

// Transform const declarations to global assignments for testing
const transformedCode = dataCode
    .replace(/^const (NPCS|QUESTS|CREATURES|JOBS|PROBLEM_TYPES|CREATURE_FLOWS) =/gm, 'global.$1 =');

// Evaluate transformed code
eval(transformedCode);

// Extract globals for convenience
const { NPCS, QUESTS, CREATURES, JOBS, PROBLEM_TYPES, CREATURE_FLOWS } = global;

// Minimal game mock
class MockGame {
    constructor() {
        this.plotPhase = 'wake_up';
        this.party = [];
        this.coins = 0;
        this.boatQuest = { planks: { collected: 0 } };
        this.npcInteractions = new Map();
    }
}

// Simplified DialogueQueueSystem for testing
class TestDialogueQueue {
    constructor(game) {
        this.game = game;
        this._queue = [];
        this.renderedDialogues = [];
    }

    startDialogue(lines, choices = null, onClose = null, speaker = null) {
        const linesArray = Array.isArray(lines) ? lines : [lines];

        linesArray.forEach((line) => {
            let dialogueText, dialogueSpeaker;
            if (typeof line === 'object' && line.text) {
                dialogueText = line.text;
                dialogueSpeaker = line.speaker || speaker;
            } else {
                dialogueText = line;
                dialogueSpeaker = speaker;
            }

            this.renderedDialogues.push({ text: dialogueText, speaker: dialogueSpeaker });
        });
    }

    showNPCDialog(npcId) {
        const npc = NPCS[npcId];
        if (!npc || npc.type !== 'dialogue_npc') return;

        const dialogue = npc.dialogues.find(d => d.condition(this.game));
        if (!dialogue) return;

        let textContent = dialogue.text;
        if (typeof textContent === 'function') {
            textContent = textContent(this.game);
        }

        const lines = Array.isArray(textContent) ? textContent : [textContent];
        this.startDialogue(lines, null, null, npc.name);
    }
}

// Test helpers
let passed = 0;
let failed = 0;
let failures = [];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (error) {
        console.log(`  ✗ ${name}`);
        failed++;
        failures.push({ name, error: error.message });
    }
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║      RUNTIME INTEGRATION TESTS                        ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log('Testing actual dialogue rendering...\n');

// ============================================================================
// TEST 1: Marlowe Dialogues Render Correctly
// ============================================================================

test('Marlowe wake_up dialogue renders as strings, not objects', () => {
    const game = new MockGame();
    game.plotPhase = 'wake_up';
    const dialogue = new TestDialogueQueue(game);

    dialogue.showNPCDialog('marlowe');

    assert(dialogue.renderedDialogues.length > 0, 'Should render at least one dialogue');

    dialogue.renderedDialogues.forEach((d, index) => {
        assert(typeof d.text === 'string', `Dialogue ${index} text should be string, got ${typeof d.text}: ${d.text}`);
        assert(!d.text.includes('[object Object]'), `Dialogue ${index} should not contain [object Object]`);
        assert(d.text.length > 0, `Dialogue ${index} text should not be empty`);
    });
});

test('Marlowe creature_found dialogue handles dynamic text correctly', () => {
    const game = new MockGame();
    game.plotPhase = 'creature_found';
    game.party = [{ name: 'TestCreature', isStarter: true }];
    const dialogue = new TestDialogueQueue(game);

    dialogue.showNPCDialog('marlowe');

    assert(dialogue.renderedDialogues.length > 0, 'Should render dialogues');

    dialogue.renderedDialogues.forEach((d, index) => {
        assert(typeof d.text === 'string', `Dialogue ${index} should be string`);
        assert(!d.text.includes('undefined'), `Dialogue ${index} should not contain undefined`);
        assert(!d.text.includes('[object'), `Dialogue ${index} should not contain [object`);
    });

    // Check that creature name was interpolated
    const hasCreatureName = dialogue.renderedDialogues.some(d => d.text.includes('TestCreature'));
    assert(hasCreatureName, 'Should include creature name in dialogue');
});

// ============================================================================
// TEST 2: All NPCs Render Without Errors
// ============================================================================

test('All NPCs render text as strings, never objects', () => {
    const game = new MockGame();

    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc') continue;

        // Test each dialogue condition
        for (const dialogueDef of npc.dialogues) {
            // Skip if condition doesn't match (just test structure)
            let textContent = dialogueDef.text;
            if (typeof textContent === 'function') {
                textContent = textContent(game);
            }

            const lines = Array.isArray(textContent) ? textContent : [textContent];

            lines.forEach((line, index) => {
                if (typeof line === 'object' && line.text) {
                    assert(typeof line.text === 'string', `${npcId} dialogue line ${index} .text should be string`);
                    assert(typeof line.speaker === 'string', `${npcId} dialogue line ${index} .speaker should be string`);
                } else {
                    assert(typeof line === 'string', `${npcId} dialogue line ${index} should be string or object with .text`);
                }
            });
        }
    }
});

// ============================================================================
// TEST 3: Speaker Names Are Correct
// ============================================================================

test('Marlowe wake_up dialogue shows correct speaker names', () => {
    const game = new MockGame();
    game.plotPhase = 'wake_up';
    const dialogue = new TestDialogueQueue(game);

    dialogue.showNPCDialog('marlowe');

    dialogue.renderedDialogues.forEach((d, index) => {
        assert(d.speaker, `Dialogue ${index} should have a speaker`);
        assert(typeof d.speaker === 'string', `Dialogue ${index} speaker should be string`);
        assert(d.speaker === 'Marlowe' || d.speaker === 'marlowe', `Dialogue ${index} speaker should be Marlowe, got ${d.speaker}`);
    });
});

test('Marlowe creature_found shows multi-speaker dialogue', () => {
    const game = new MockGame();
    game.plotPhase = 'creature_found';
    game.party = [{ name: 'Shimmer', isStarter: true }];
    const dialogue = new TestDialogueQueue(game);

    dialogue.showNPCDialog('marlowe');

    const speakers = [...new Set(dialogue.renderedDialogues.map(d => d.speaker))];
    assert(speakers.length > 1, 'Should have multiple speakers in conversation');
    assert(speakers.includes('Marlowe'), 'Should include Marlowe as speaker');
    assert(speakers.includes('You'), 'Should include You as speaker');
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('');

if (failed > 0) {
    console.log('❌ RUNTIME TESTS FAILED!\n');
    failures.forEach((failure, i) => {
        console.log(`${i + 1}. ${failure.name}`);
        console.log(`   Error: ${failure.error}\n`);
    });
    process.exit(1);
} else {
    console.log('✅ ALL RUNTIME TESTS PASSED!');
    console.log('Dialogues render correctly at runtime.');
    process.exit(0);
}
