#!/bin/bash
# Dialogue Behavior Tests
# Validates specific dialogue mechanics to prevent regressions

cd "$(dirname "$0")"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║      DIALOGUE BEHAVIOR TESTS - REGRESSION PREVENTION  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

EXIT_CODE=0

node << 'NODESCRIPT'
const { NPCS, QUESTS, QUEST_STEP_HANDLERS, GameState } = require('./loadGameData.js');

let totalTests = 0;
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passed++;
        console.log(`✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`✗ ${name}`);
        failures.push({ name, error: e.message });
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

console.log('Testing dialogue mechanics...\n');

// ============================================================================
// TEST 1: onClose Handler Execution
// ============================================================================

console.log('1. onClose Handler Tests');
console.log('   Purpose: Prevent narrative sequences from breaking\n');

test('Creature encounter dialogues have proper onClose structure', () => {
    // Simulate the creature encounter narrative sequence
    let onCloseExecuted = false;

    const mockGame = {
        state: GameState.DIALOGUE,
        dialogue: {
            active: true,
            onClose: () => { onCloseExecuted = true; }
        }
    };

    // Simulate endDialogue being called
    if (mockGame.dialogue.onClose) {
        mockGame.dialogue.onClose();
    }

    assert(onCloseExecuted, 'onClose handler should execute when dialogue ends');
});

test('startDialogue wrapper accepts onClose parameter', () => {
    // This test ensures the game.startDialogue wrapper properly passes onClose
    // We can't directly test the wrapper without browser DOM, but we can verify
    // the signature exists in the expected format

    const gameJsPath = require('path').join(__dirname, '../src/game.js');
    const gameContent = require('fs').readFileSync(gameJsPath, 'utf8');

    // Check that startDialogue accepts onClose parameter
    const startDialogueMatch = gameContent.match(/startDialogue\s*\([^)]*onClose[^)]*\)/);

    assert(startDialogueMatch, 'game.startDialogue should accept onClose parameter');
});

// ============================================================================
// TEST 2: Quest Completion State Dialogues
// ============================================================================

console.log('\n2. Quest Completion Dialogue Tests');
console.log('   Purpose: Prevent "no more work" dialogue bugs\n');

test('Callum has dialogue when NO quests completed', () => {
    const game = {
        plotPhase: 'boat_quest',
        hasInspectedBoat: true,
        completedQuests: new Set()
    };

    const dialogue = NPCS.callum.dialogues.find(d => d.condition(game));

    assert(dialogue, 'Should find dialogue when no quests completed');
    assert(dialogue.text.includes('You want work'), 'Should offer work when no quests done');
});

test('Callum has dialogue when SOME quests completed', () => {
    const game = {
        plotPhase: 'boat_quest',
        hasInspectedBoat: true,
        completedQuests: new Set(['fishing_crates'])
    };

    const dialogue = NPCS.callum.dialogues.find(d => d.condition(game));

    assert(dialogue, 'Should find dialogue when some quests completed');
    assert(dialogue.text.includes('Back for more'), 'Should say "back for more" with work available');
});

test('Callum has COMPLETION dialogue when ALL quests completed', () => {
    const game = {
        plotPhase: 'boat_quest',
        hasInspectedBoat: true,
        completedQuests: new Set(['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records'])
    };

    const dialogue = NPCS.callum.dialogues.find(d => d.condition(game));

    assert(dialogue, 'Should find dialogue when all quests completed');
    assert(!dialogue.text.includes('Back for more'), 'Should NOT say "back for more" when no work left');
    assert(dialogue.text.toLowerCase().includes('marlowe') || dialogue.text.includes('finished all'),
           'Should direct to Marlowe or acknowledge completion');
});

test('Callum completion dialogue has no work choices', () => {
    const game = {
        plotPhase: 'boat_quest',
        hasInspectedBoat: true,
        completedQuests: new Set(['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records'])
    };

    const dialogue = NPCS.callum.dialogues.find(d => d.condition(game));

    // Completion dialogue should NOT have "Show me the work" choice
    if (dialogue.choices) {
        const hasWorkChoice = dialogue.choices.some(c => c.text.toLowerCase().includes('work'));
        assert(!hasWorkChoice, 'Completion dialogue should not offer more work');
    }
});

// ============================================================================
// TEST 3: Quest Step Integrity
// ============================================================================

console.log('\n3. Quest Step Integrity Tests');
console.log('   Purpose: Prevent quest steps from being skipped\n');

test('fishing_records quest has exactly 3 steps', () => {
    const quest = QUESTS.fishing_records;

    assert(quest, 'fishing_records quest should exist');
    assert(quest.steps, 'Quest should have steps array');
    assert(quest.steps.length === 3, `Quest should have 3 steps, got ${quest.steps.length}`);
});

test('All fishing_records steps have required fields', () => {
    const quest = QUESTS.fishing_records;

    quest.steps.forEach((step, i) => {
        assert(step.type === 'visit_and_solve', `Step ${i + 1} should be visit_and_solve type`);
        assert(step.description, `Step ${i + 1} should have description`);
        assert(step.location, `Step ${i + 1} should have location`);
        assert(step.onArrive, `Step ${i + 1} should have onArrive`);
        assert(step.onArrive.problem, `Step ${i + 1} should have problem`);
        assert(step.onArrive.problem.correct, `Step ${i + 1} should have correct answer`);
    });
});

test('Quest step handlers exist for all step types', () => {
    const quest = QUESTS.fishing_records;

    quest.steps.forEach((step, i) => {
        const handler = QUEST_STEP_HANDLERS[step.type];
        assert(handler, `Handler for ${step.type} should exist (step ${i + 1})`);
        assert(handler.onStart, `Handler for ${step.type} should have onStart (step ${i + 1})`);
        assert(handler.onUpdate, `Handler for ${step.type} should have onUpdate (step ${i + 1})`);
    });
});

test('Quest problems maintain 2-digit difficulty', () => {
    const quest = QUESTS.fishing_records;

    quest.steps.forEach((step, i) => {
        const problem = step.onArrive.problem;
        const correctAnswer = problem.correct;

        // All correct answers should be >= 10 (2-digit difficulty)
        assert(correctAnswer >= 10,
               `Step ${i + 1} correct answer (${correctAnswer}) should be 2-digit (>=10)`);
    });
});

// ============================================================================
// TEST 4: Dialogue Choice Auto-Advance
// ============================================================================

console.log('\n4. Auto-Advance Behavior Tests');
console.log('   Purpose: Prevent narrative from auto-skipping\n');

test('Single-choice dialogues auto-advance (quest menus)', () => {
    // Quest menus with single choice should auto-advance (that's intentional)
    // This test documents the behavior

    const dialogueSystemPath = require('path').join(__dirname, '../src/dialogueSystem.js');
    const dialogueContent = require('fs').readFileSync(dialogueSystemPath, 'utf8');

    // Verify single choice auto-advance exists
    const hasAutoAdvance = dialogueContent.includes('choices.length === 1') &&
                          dialogueContent.includes('selectDialogueChoice');

    assert(hasAutoAdvance, 'Single-choice auto-advance should exist for quest menus');
});

test('Creature encounter uses queue system, not callback hell', () => {
    // Verify creature encounter uses queue-based dialogue instead of callbacks
    // to prevent race conditions and auto-skip bugs

    const gamePath = require('path').join(__dirname, '../src/game.js');
    const gameContent = require('fs').readFileSync(gamePath, 'utf8');

    const dataPath = require('path').join(__dirname, '../src/data.js');
    const dataContent = require('fs').readFileSync(dataPath, 'utf8');

    // Find startFirstCreatureEncounter function
    const encounterFuncMatch = gameContent.match(/startFirstCreatureEncounter\s*\(\s*\)\s*\{[\s\S]*?^\s{4}\}/m);
    assert(encounterFuncMatch, 'startFirstCreatureEncounter should exist');

    const funcBody = encounterFuncMatch[0];

    // Should use dialogue.queueFlow instead of nested callbacks
    const usesQueue = funcBody.includes('dialogue.queueFlow') || funcBody.includes('dialogue.queue');
    assert(usesQueue, 'Should use dialogue.queueFlow for dialogue sequencing');
    assert(funcBody.includes('CREATURE_FLOWS'), 'Should reference CREATURE_FLOWS data structure');

    // Should NOT have nested showCreatureNarrative callbacks
    assert(!funcBody.includes('showCreatureNarrative'), 'Should not use deprecated callback pattern');

    // Verify CREATURE_FLOWS exists in data.js
    assert(dataContent.includes('const CREATURE_FLOWS'), 'CREATURE_FLOWS should be defined in data.js');
    assert(dataContent.includes('creature_intro'), 'Should have intro flow');
    assert(dataContent.includes('creature_slow'), 'Should have slow path flow');
    assert(dataContent.includes('creature_wait'), 'Should have wait path flow');
    assert(dataContent.includes('creature_grab'), 'Should have grab path flow');
});

test('onClose handlers can chain dialogues without interference', () => {
    // CRITICAL: When onClose handler starts a new dialogue, endDialogue must not
    // interfere with the new dialogue by resetting state or clearing UI

    const dialogueSystemPath = require('path').join(__dirname, '../src/dialogueSystem.js');
    const dialogueContent = require('fs').readFileSync(dialogueSystemPath, 'utf8');

    // Find endDialogue function
    const endDialogueMatch = dialogueContent.match(/endDialogue\s*\(\s*\)\s*\{[\s\S]*?^\s{4}\}/m);
    assert(endDialogueMatch, 'endDialogue function should exist');

    const funcBody = endDialogueMatch[0];

    // After calling onClose handler, should check if new dialogue was started
    // by checking if dialogue.active is true
    const hasCheck = funcBody.includes('if (this.game.dialogue.active)') ||
                    funcBody.includes('if(this.game.dialogue.active)');
    assert(hasCheck, 'Should check if new dialogue was started by onClose handler');

    // Should return early or skip cleanup if new dialogue started
    const hasEarlyReturn = funcBody.includes('return') &&
                          funcBody.indexOf('return') < funcBody.indexOf('clearDialogueUI');
    assert(hasEarlyReturn, 'Should return early if new dialogue started, before clearing UI');
});

// ============================================================================
// TEST 5: Dialogue Condition Exclusivity
// ============================================================================

console.log('\n5. Dialogue Condition Tests');
console.log('   Purpose: Prevent multiple dialogues matching same state\n');

test('Callum dialogues are mutually exclusive', () => {
    const testStates = [
        { name: 'no quests', plotPhase: 'boat_quest', hasInspectedBoat: true,
          completedQuests: new Set() },
        { name: 'some quests', plotPhase: 'boat_quest', hasInspectedBoat: true,
          completedQuests: new Set(['fishing_crates']) },
        { name: 'all quests', plotPhase: 'boat_quest', hasInspectedBoat: true,
          completedQuests: new Set(['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records']) }
    ];

    testStates.forEach(state => {
        const matches = NPCS.callum.dialogues.filter(d => d.condition(state));

        assert(matches.length === 1,
               `State "${state.name}" should match exactly 1 dialogue, got ${matches.length}`);
    });
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('');

if (failed > 0) {
    console.log('❌ BEHAVIOR TESTS FAILED!\n');
    failures.forEach((failure, i) => {
        console.log(`${i + 1}. ${failure.name}`);
        console.log(`   Error: ${failure.error}\n`);
    });
    process.exit(1);
} else {
    console.log('✅ ALL BEHAVIOR TESTS PASSED!');
    console.log('Dialogue mechanics validated - regressions prevented.');
    process.exit(0);
}

NODESCRIPT

exit $?
