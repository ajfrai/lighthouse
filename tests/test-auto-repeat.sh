#!/usr/bin/env node

/**
 * AUTO-REPEAT DETECTION TEST
 *
 * Simulates talking to NPCs and detects if dialogues auto-repeat
 * without user input (infinite loops).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║      AUTO-REPEAT DETECTION TEST                       ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Load game data
const dataCode = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf8');
const transformedCode = dataCode
    .replace(/^const (NPCS|QUESTS|CREATURES|JOBS|PROBLEM_TYPES|CREATURE_FLOWS) =/gm, 'global.$1 =');

eval(transformedCode);
const { NPCS } = global;

// Load DialogueQueueSystem
const DialogueQueueSystem = require('../src/dialogueQueueSystem.js');

// Mock game for each plot phase
function createMockGame(phase) {
    return {
        plotPhase: phase,
        speedRunMode: false,
        coins: 0,
        party: phase === 'creature_found' ? [{isStarter: true, name: 'TestCreature'}] : [],
        boatQuest: { planks: { collected: 0 } },
        hasInspectedBoat: phase !== 'wake_up' && phase !== 'find_creature',
        completedQuests: new Set(),
        npcInteractions: new Map(),
        // Mock methods that dialogues might call
        showBoatQuestExplanation: () => { console.log('  [MOCK] showBoatQuestExplanation called'); },
        questSystem: {
            showQuestMenu: () => { console.log('  [MOCK] questSystem.showQuestMenu called'); }
        }
    };
}

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

console.log('Testing NPCs for auto-repeat behavior...\n');

// Test each NPC in each relevant plot phase
const testScenarios = [
    { npc: 'marlowe', phases: ['wake_up', 'find_creature', 'creature_found', 'meet_villager', 'boat_quest', 'working'] },
    { npc: 'callum', phases: ['meet_villager', 'boat_quest', 'working'] }
];

testScenarios.forEach(({ npc: npcId, phases }) => {
    const npc = NPCS[npcId];
    if (!npc || npc.type !== 'dialogue_npc') return;

    phases.forEach(phase => {
        test(`${npcId} in ${phase} doesn't auto-repeat`, () => {
            const game = createMockGame(phase);
            const dialogue = new DialogueQueueSystem(game, { headless: true });

            // Track how many dialogues are queued
            let dialoguesQueued = 0;
            const originalQueue = dialogue.queue.bind(dialogue);
            dialogue.queue = function(d) {
                dialoguesQueued++;
                console.log(`  [${npcId}/${phase}] Dialogue queued (#${dialoguesQueued}): "${d.text?.substring(0, 40)}..."`);
                return originalQueue(d);
            };

            // First interaction
            console.log(`  [${npcId}/${phase}] First interaction...`);
            dialogue.showNPCDialog(npcId);

            const firstQueueCount = dialoguesQueued;
            console.log(`  [${npcId}/${phase}] First interaction queued ${firstQueueCount} dialogue(s)`);

            // Complete first dialogue (simulate pressing A twice: skip animation, close)
            if (dialogue.state === 'ANIMATING') {
                dialogue.advance(); // Complete animation
            }
            if (dialogue.state === 'WAITING_FOR_INPUT') {
                dialogue.advance(); // Close dialogue
            }

            // Process any queued dialogues
            // Track dialogue completions (not state transitions)
            let dialoguesCompleted = 0;
            let stateTransitions = 0;
            const maxDialogues = 20; // Allow up to 20 dialogues in a conversation

            while (dialogue.state !== 'IDLE' && dialoguesCompleted < maxDialogues) {
                stateTransitions++;

                // Prevent true infinite loops at state transition level
                if (stateTransitions > 100) {
                    throw new Error(`Infinite state transition loop! Over 100 state transitions without returning to IDLE.`);
                }

                if (dialogue.state === 'ANIMATING') {
                    dialogue.advance(); // Complete animation
                } else if (dialogue.state === 'WAITING_FOR_INPUT') {
                    dialoguesCompleted++;
                    console.log(`  [${npcId}/${phase}] Dialogue #${dialoguesCompleted} completed`);
                    dialogue.advance(); // Close dialogue (may queue next)
                } else if (dialogue.state === 'WAITING_FOR_CHOICE') {
                    dialoguesCompleted++;
                    console.log(`  [${npcId}/${phase}] Choice dialogue #${dialoguesCompleted} completed`);
                    dialogue.advance(); // Select first choice
                } else {
                    // Unknown state, break to avoid infinite loop
                    console.log(`  [${npcId}/${phase}] Unknown state: ${dialogue.state}, breaking`);
                    break;
                }
            }

            // Check if we got stuck in auto-repeat
            if (dialoguesCompleted >= maxDialogues) {
                throw new Error(`Infinite auto-repeat detected! ${dialoguesCompleted} dialogues completed without returning to IDLE. First interaction queued ${firstQueueCount} dialogue(s).`);
            }

            // Should be back to IDLE after all dialogues processed
            assert.strictEqual(dialogue.state, 'IDLE', `Should return to IDLE, but state is ${dialogue.state}`);

            console.log(`  [${npcId}/${phase}] ✓ Completed without infinite loop (${dialoguesCompleted} dialogues, ${stateTransitions} transitions)`);
        });
    });
});

console.log('');
console.log('======================================================================');
console.log('TEST RESULTS');
console.log('======================================================================');
console.log(`Total Tests: ${testsRun}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${failures.length}`);
console.log('');

if (failures.length > 0) {
    console.log('❌ AUTO-REPEAT DETECTED!\n');
    failures.forEach(({ name, error }, index) => {
        console.log(`${index + 1}. ${name}`);
        console.log(`   ${error}\n`);
    });
    process.exit(1);
} else {
    console.log('✅ NO AUTO-REPEAT DETECTED!');
    console.log('All NPCs return to IDLE state after dialogue.');
    process.exit(0);
}
