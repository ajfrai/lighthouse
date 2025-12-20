#!/bin/bash
# Trace Specific Dialogue Flows - Debug Issues
cd "$(dirname "$0")"

node << 'NODESCRIPT'
const { NPCS, QUESTS, QUEST_STEP_HANDLERS, GameState } = require('./loadGameData.js');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║       TRACING SPECIFIC DIALOGUE FLOWS (DEBUG)        ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// ============================================================================
// BUG 1: Initial creature encounter missing story
// ============================================================================

console.log('='.repeat(70));
console.log('BUG 1: INITIAL CREATURE ENCOUNTER FLOW');
console.log('='.repeat(70));

console.log('\nExpected flow:');
console.log('1. Player finds creature near beach');
console.log('2. Story plays: "You kneel down..."');
console.log('3. Player helps creature');
console.log('4. THEN player names creature');
console.log('5. Creature found phase completes\n');

console.log('Checking game.js for startFirstCreatureEncounter()...');
console.log('This method should handle the narrative sequence.');
console.log('⚠️  Need to check actual game.js code - can\'t simulate UI sequence here\n');

// ============================================================================
// BUG 2: Second task in long quest was skipped
// ============================================================================

console.log('='.repeat(70));
console.log('BUG 2: LONG QUEST (fishing_records) TASK SKIP');
console.log('='.repeat(70));

const fishingRecords = QUESTS.fishing_records;
console.log(`\nQuest: ${fishingRecords.name}`);
console.log(`Type: ${fishingRecords.type}`);
console.log(`Total Steps: ${fishingRecords.steps.length}\n`);

fishingRecords.steps.forEach((step, i) => {
    console.log(`Step ${i + 1}: ${step.type}`);
    console.log(`  Description: "${step.description}"`);
    console.log(`  Location: (${step.location.x}, ${step.location.y})`);
    if (step.onArrive && step.onArrive.problem) {
        console.log(`  Problem: "${step.onArrive.problem.question}"`);
        console.log(`  Correct Answer: ${step.onArrive.problem.correct}`);
    }
    console.log('');
});

console.log('Testing step advancement...\n');

// Mock game to test step progression
const mockGame = {
    activeQuest: {
        quest: fishingRecords,
        currentStep: 0
    },
    questObjective: null,
    state: GameState.EXPLORING,
    player: { x: 0, y: 0 },
    dialogueSystem: {
        startDialogue: (lines, choices, onClose) => {
            console.log(`  📝 startDialogue called`);
            console.log(`     Lines: ${lines.length}`);
            console.log(`     Choices: ${choices ? choices.length : 0}`);
            console.log(`     OnClose: ${!!onClose}\n`);

            // Simulate selecting correct answer
            if (choices && onClose) {
                console.log(`  🎯 Simulating correct answer selection...`);
                onClose(); // This should advance quest
            }
        }
    },
    questSystem: {
        completeQuest: () => {
            console.log(`  ✅ Quest completed!\n`);
        },
        advanceQuestStep: () => {
            console.log(`  ➡️  advanceQuestStep() called`);
            mockGame.activeQuest.currentStep++;
            const nextStep = fishingRecords.steps[mockGame.activeQuest.currentStep];

            if (nextStep) {
                console.log(`     Moving to step ${mockGame.activeQuest.currentStep + 1}: "${nextStep.description}"\n`);
                const handler = QUEST_STEP_HANDLERS[nextStep.type];
                if (handler && handler.onStart) {
                    handler.onStart(mockGame, nextStep);
                }
            } else {
                console.log(`     No more steps - quest should complete\n`);
                mockGame.questSystem.completeQuest();
            }
        }
    }
};

// Walk through each step
for (let i = 0; i < fishingRecords.steps.length; i++) {
    console.log(`━━━ STEP ${i + 1} ━━━`);
    const step = fishingRecords.steps[i];
    const handler = QUEST_STEP_HANDLERS[step.type];

    console.log(`Starting step: "${step.description}"`);

    // Start step
    if (handler.onStart) {
        handler.onStart(mockGame, step);
        console.log(`  Quest objective set to: "${mockGame.questObjective}"`);
    }

    // Move player to location
    mockGame.player.x = step.location.x;
    mockGame.player.y = step.location.y;
    console.log(`  Player moves to (${step.location.x}, ${step.location.y})`);

    // Trigger onUpdate
    const result = handler.onUpdate(mockGame, step);
    console.log(`  Handler returned: completed=${result.completed}`);

    if (result.completed && result.choices) {
        console.log(`  Problem presented with ${result.choices.length} choices`);

        // Find correct answer
        const correctChoice = result.choices.find(c =>
            c.text === String(step.onArrive.problem.correct)
        );

        if (correctChoice) {
            console.log(`  Player selects correct answer: ${correctChoice.text}`);
            correctChoice.action();
        }
    }

    console.log('');
}

console.log('\n⚠️  BUG CHECK: Were all 3 steps executed?');
console.log(`   Final currentStep: ${mockGame.activeQuest.currentStep}`);
console.log(`   Expected: 3 (or quest completed)`);
console.log(`   If currentStep < 3, a step was skipped!\n`);

// ============================================================================
// BUG 3: Callum "back for more" after all tasks completed
// ============================================================================

console.log('='.repeat(70));
console.log('BUG 3: CALLUM DIALOGUE AFTER ALL QUESTS COMPLETED');
console.log('='.repeat(70));

const callum = NPCS.callum;
const callumsQuests = ['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records'];

console.log('\nCallum has these quests:');
callumsQuests.forEach(qId => {
    const quest = QUESTS[qId];
    console.log(`  - ${qId}: ${quest.name} (${quest.reward} coins)`);
});

console.log('\n--- TEST CASE 1: No quests completed ---');
const gameNoQuests = {
    plotPhase: 'boat_quest',
    hasInspectedBoat: true,
    completedQuests: new Set()
};

let dialogue = callum.dialogues.find(d => d.condition(gameNoQuests));
console.log(`Matched dialogue: "${dialogue ? dialogue.text.substring(0, 50) : 'NONE'}..."`);

console.log('\n--- TEST CASE 2: Some quests completed ---');
const gameSomeQuests = {
    plotPhase: 'boat_quest',
    hasInspectedBoat: true,
    completedQuests: new Set(['fishing_crates', 'fishing_nets'])
};

dialogue = callum.dialogues.find(d => d.condition(gameSomeQuests));
console.log(`Matched dialogue: "${dialogue ? dialogue.text.substring(0, 50) : 'NONE'}..."`);

console.log('\n--- TEST CASE 3: ALL quests completed ---');
const gameAllQuests = {
    plotPhase: 'boat_quest',
    hasInspectedBoat: true,
    completedQuests: new Set(callumsQuests)
};

dialogue = callum.dialogues.find(d => d.condition(gameAllQuests));
console.log(`Matched dialogue: "${dialogue ? dialogue.text.substring(0, 50) : 'NONE'}..."`);

if (dialogue) {
    console.log(`\n⚠️  BUG CONFIRMED: Dialogue found when ALL quests completed!`);
    console.log(`   Expected: No more work dialogue, or "all done" message`);
    console.log(`   Actual: "${dialogue.text.substring(0, 80)}"`);

    // Check if it's the "back for more" dialogue
    if (dialogue.text.includes('Back for more')) {
        console.log(`\n❌ CRITICAL: "Back for more" showing when there's no more work!`);
    }
} else {
    console.log(`\n✅ GOOD: No work dialogue when all quests completed`);
    console.log(`   Player should talk to Marlowe to progress story`);
}

console.log('\n--- CHECKING ALL CALLUM DIALOGUES ---');
console.log(`\nCallum has ${callum.dialogues.length} dialogue entries:\n`);

callum.dialogues.forEach((d, i) => {
    console.log(`${i + 1}. Condition: ${d.condition.toString().substring(0, 100)}...`);
    console.log(`   Text: "${d.text.substring(0, 60)}..."`);
    console.log('');
});

NODESCRIPT
