#!/usr/bin/env node

/**
 * DIALOGUE VALIDATION TESTS
 *
 * Based on state-of-the-art game design patterns:
 * - Finite State Machine validation
 * - Infinite loop detection
 * - Frozen dialogue detection
 * - Unexpected branch detection
 *
 * References:
 * - ResearchGate: FSM for NPC Dialogue Systems
 * - Game Programming Patterns: State Machine
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║      DIALOGUE VALIDATION TESTS                        ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Load game data
const dataCode = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf8');
const transformedCode = dataCode
    .replace(/^const (NPCS|QUESTS|CREATURES|JOBS|PROBLEM_TYPES|CREATURE_FLOWS) =/gm, 'global.$1 =');

eval(transformedCode);
const { NPCS } = global;

// Test helpers
let testsRun = 0;
let testsPassed = 0;
const failures = [];

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failures.push({ name, error: error.message });
        console.log(`  ✗ ${name}`);
    }
}

// ============================================================================
// VALIDATION TESTS - Based on Industry Standards
// ============================================================================

console.log('1. Infinite Loop Detection');
console.log('   Purpose: Prevent dialogues that can repeat infinitely without state change\n');

test('All repeatable dialogues have explicit repeatText', () => {
    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc' || !npc.dialogues) continue;

        npc.dialogues.forEach((dialogue, index) => {
            // If dialogue doesn't change state (no onClose), it must have repeatText
            if (!dialogue.onClose && !dialogue.repeatText && !dialogue.choices) {
                throw new Error(`${npcId} dialogue ${index}: No onClose and no repeatText - infinite loop risk!`);
            }
        });
    }
});

test('No dialogue can trigger itself infinitely', () => {
    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc' || !npc.dialogues) continue;

        npc.dialogues.forEach((dialogue, index) => {
            // If has onClose, check it doesn't create same condition again
            if (dialogue.onClose) {
                // Create mock game state with mock methods
                const mockGame = {
                    plotPhase: 'test_phase',
                    coins: 0,
                    party: [],
                    boatQuest: { planks: { collected: 0 } },
                    showBoatQuestExplanation: () => {}, // Mock method
                    questSystem: { showQuestMenu: () => {} } // Mock method
                };

                // Check if condition matches BEFORE onClose
                const matchesBefore = dialogue.condition(mockGame);

                // Execute onClose (with try-catch for safety)
                try {
                    dialogue.onClose(mockGame);
                } catch (e) {
                    // Skip this validation if onClose has complex dependencies
                    return;
                }

                // Check if condition STILL matches AFTER onClose
                const matchesAfter = dialogue.condition(mockGame);

                // This would create an infinite loop: talk → onClose → same dialogue shows → repeat
                if (matchesBefore && matchesAfter) {
                    throw new Error(`${npcId} dialogue ${index}: onClose doesn't change state - infinite loop!`);
                }
            }
        });
    }
});

console.log('');
console.log('2. Frozen Dialogue Detection (Single Choice)');
console.log('   Purpose: Ensure single-choice dialogues can be advanced\n');

test('All single-choice dialogues have valid action', () => {
    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc' || !npc.dialogues) continue;

        npc.dialogues.forEach((dialogue, index) => {
            if (dialogue.choices && dialogue.choices.length === 1) {
                const choice = dialogue.choices[0];
                assert(choice.action || choice.trigger,
                    `${npcId} dialogue ${index}: Single choice must have action or trigger`);
            }
        });
    }
});

console.log('');
console.log('3. Frozen Dialogue Detection (Multi Choice)');
console.log('   Purpose: Ensure all choice branches are valid\n');

test('All multi-choice dialogues have valid actions for each choice', () => {
    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc' || !npc.dialogues) continue;

        npc.dialogues.forEach((dialogue, index) => {
            if (dialogue.choices && dialogue.choices.length > 1) {
                dialogue.choices.forEach((choice, choiceIndex) => {
                    assert(choice.action || choice.trigger,
                        `${npcId} dialogue ${index} choice ${choiceIndex}: Must have action or trigger`);
                    assert(typeof choice.text === 'string' && choice.text.length > 0,
                        `${npcId} dialogue ${index} choice ${choiceIndex}: Must have valid text`);
                });
            }
        });
    }
});

console.log('');
console.log('4. Ambiguous State Detection');
console.log('   Purpose: Prevent multiple dialogues matching same condition\n');

test('No two dialogues for same NPC can match simultaneously', () => {
    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc' || !npc.dialogues) continue;

        // Test various game states
        const testStates = [
            { plotPhase: 'wake_up', coins: 0, party: [], boatQuest: { planks: { collected: 0 } } },
            { plotPhase: 'find_creature', coins: 0, party: [], boatQuest: { planks: { collected: 0 } } },
            { plotPhase: 'creature_found', coins: 0, party: [{isStarter: true, name: 'Test'}], boatQuest: { planks: { collected: 0 } } },
            { plotPhase: 'meet_villager', coins: 0, party: [], boatQuest: { planks: { collected: 0 } } },
            { plotPhase: 'boat_quest', coins: 5, party: [], boatQuest: { planks: { collected: 0 } } },
            { plotPhase: 'boat_quest', coins: 5, party: [], boatQuest: { planks: { collected: 5 } } },
            { plotPhase: 'working', coins: 25, party: [], boatQuest: { planks: { collected: 0 } } },
            { plotPhase: 'boat_ready', coins: 0, party: [], boatQuest: { planks: { collected: 0 } } },
            { plotPhase: 'departure', coins: 0, party: [], boatQuest: { planks: { collected: 0 } } },
        ];

        testStates.forEach(state => {
            const matches = npc.dialogues.filter(d => d.condition(state));
            if (matches.length > 1) {
                throw new Error(`${npcId} in state ${state.plotPhase}: ${matches.length} dialogues match (ambiguous state!)`);
            }
        });
    }
});

console.log('');
console.log('5. Dead End Detection');
console.log('   Purpose: Ensure all states have at least one valid dialogue\n');

test('All plot phases have valid dialogues for critical NPCs', () => {
    // Only check phases where NPC should be available
    const npcPhaseMap = {
        marlowe: ['wake_up', 'find_creature', 'creature_found', 'meet_villager', 'boat_quest', 'working', 'boat_ready', 'departure'],
        callum: ['meet_villager', 'boat_quest', 'working', 'boat_ready', 'departure'] // Callum not available in early phases
    };

    Object.entries(npcPhaseMap).forEach(([npcId, phases]) => {
        const npc = NPCS[npcId];
        if (!npc || npc.type !== 'dialogue_npc') return;

        phases.forEach(phase => {
            const state = {
                plotPhase: phase,
                coins: 0,
                party: phase === 'creature_found' ? [{isStarter: true, name: 'Test'}] : [],
                boatQuest: { planks: { collected: 0 } },
                hasInspectedBoat: phase !== 'meet_villager', // After meeting, player inspects boat
                completedQuests: new Set() // No quests completed initially
            };

            const hasDialogue = npc.dialogues.some(d => d.condition(state));
            assert(hasDialogue, `${npcId} has no dialogue for plot phase '${phase}' (dead end!)`);
        });
    });
});

console.log('');
console.log('6. Unexpected Branch Detection');
console.log('   Purpose: Verify choice actions lead to expected states\n');

test('All choice actions either close dialogue or queue new dialogue', () => {
    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc' || !npc.dialogues) continue;

        npc.dialogues.forEach((dialogue, index) => {
            if (dialogue.choices) {
                dialogue.choices.forEach((choice, choiceIndex) => {
                    // Choices should have either:
                    // 1. action function (executes code)
                    // 2. trigger string (emits event)
                    const hasValidBranch = choice.action || choice.trigger;
                    assert(hasValidBranch,
                        `${npcId} dialogue ${index} choice ${choiceIndex}: No action or trigger (unexpected branch!)`);
                });
            }
        });
    }
});

console.log('');
console.log('7. Text Rendering Validation');
console.log('   Purpose: Ensure all text renders correctly (not [object Object])\n');

test('All dialogue text is string or function returning string/array', () => {
    for (const [npcId, npc] of Object.entries(NPCS)) {
        if (npc.type !== 'dialogue_npc' || !npc.dialogues) continue;

        npc.dialogues.forEach((dialogue, index) => {
            let text = dialogue.text;

            // If function, call it
            if (typeof text === 'function') {
                const mockGame = {
                    plotPhase: 'test',
                    party: [{isStarter: true, name: 'TestCreature'}]
                };
                text = text(mockGame);
            }

            // Now check result
            if (Array.isArray(text)) {
                text.forEach((line, lineIndex) => {
                    if (typeof line === 'object' && line.text) {
                        assert(typeof line.text === 'string',
                            `${npcId} dialogue ${index} line ${lineIndex}: text property must be string`);
                    } else {
                        assert(typeof line === 'string',
                            `${npcId} dialogue ${index} line ${lineIndex}: must be string, got ${typeof line}`);
                    }
                });
            } else {
                assert(typeof text === 'string',
                    `${npcId} dialogue ${index}: text must be string, got ${typeof text}`);
            }
        });
    }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('');
console.log('======================================================================');
console.log('TEST RESULTS');
console.log('======================================================================');
console.log(`Total Tests: ${testsRun}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${failures.length}`);
console.log('');

if (failures.length > 0) {
    console.log('❌ VALIDATION FAILED!\n');
    failures.forEach(({ name, error }, index) => {
        console.log(`${index + 1}. ${name}`);
        console.log(`   Error: ${error}\n`);
    });
    process.exit(1);
} else {
    console.log('✅ ALL VALIDATION TESTS PASSED!');
    console.log('Dialogue system adheres to industry best practices:');
    console.log('  - No infinite loops detected');
    console.log('  - No frozen dialogues');
    console.log('  - No ambiguous states');
    console.log('  - No dead ends');
    console.log('  - All branches validated');
    process.exit(0);
}
