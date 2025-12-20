#!/bin/bash
# Unroll Dialogue Trees
# Generates a complete interaction trace to a file for inspection

# Change to tests directory
cd "$(dirname "$0")"

OUTPUT_FILE="${1:-dialogue-trace.txt}"

echo "Unrolling dialogue trees to $OUTPUT_FILE..."

node > "$OUTPUT_FILE" << 'NODESCRIPT'
const { NPCS, QUESTS } = require('./loadGameData.js');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║         COMPLETE DIALOGUE TREE UNROLL                ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Callum interaction flow
console.log('\n' + '='.repeat(70));
console.log('CALLUM - FIRST QUEST INTERACTION (100 COIN QUEST)');
console.log('='.repeat(70));

const gameState = {
    plotPhase: 'boat_quest',
    hasInspectedBoat: true,
    completedQuests: new Set(),
    activeQuest: null
};

console.log('\n[PLAYER APPROACHES CALLUM AND PRESSES A]');
console.log('─'.repeat(70));

const callum = NPCS.callum;
let dialogue = callum.dialogues.find(d => d.condition(gameState));

console.log(`Speaker: ${callum.name}`);
console.log(`Text: "${dialogue.text}"`);
console.log(`\nChoices:`);
dialogue.choices.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.text}`);
});

console.log('\n[PLAYER SELECTS "Show me the work"]');
console.log('─'.repeat(70));

console.log(`\nAction: game.questSystem.showQuestMenu('callum', NPCS.callum)`);
console.log(`\nQuest Menu Opens:`);
console.log(`Speaker: ${callum.name}`);
console.log(`Text: "Choose a task:" (questGreeting fallback)`);

console.log(`\nQuest Choices:`);
let choiceNum = 1;

// Show one-off quests
callum.quests.oneOff.forEach(qId => {
    const quest = QUESTS[qId];
    console.log(`  ${choiceNum++}. Quick Problem (${quest.reward} coins) - 0/3`);
});

// Show full quest
const fullQuest = QUESTS[callum.quests.full];
console.log(`  ${choiceNum++}. ${fullQuest.name} (${fullQuest.reward} coins) ← 100 COIN QUEST`);
console.log(`  ${choiceNum}. Not right now`);

console.log('\n[PLAYER SELECTS "Check the Catch Records (100 coins)"]');
console.log('─'.repeat(70));

console.log(`\nQuest: ${fullQuest.name}`);
console.log(`Type: ${fullQuest.type}`);
console.log(`Reward: ${fullQuest.reward} coins`);
console.log(`Total Steps: ${fullQuest.steps.length}`);

console.log(`\n┌─ QUEST FLOW ────────────────────────────────────────────┐`);
fullQuest.steps.forEach((step, i) => {
    console.log(`│ Step ${i + 1}: ${step.type.toUpperCase()}`);
    if (step.type === 'visit_location') {
        console.log(`│   Description: ${step.description}`);
        console.log(`│   Location: (${step.location.x}, ${step.location.y})`);
        console.log(`│   On Arrive: "${step.onArrive.message}"`);
    } else if (step.type === 'problem') {
        console.log(`│   Question: "${step.question}"`);
        console.log(`│   Answers: [${step.answers.join(', ')}]`);
        console.log(`│   Correct: ${step.correct}`);
    }
    if (i < fullQuest.steps.length - 1) console.log(`│`);
});
console.log(`└─────────────────────────────────────────────────────────┘`);

console.log('\n[QUEST STARTS - FIRST STEP]');
console.log('─'.repeat(70));

const firstStep = fullQuest.steps[0];
console.log(`\nHandler: QUEST_STEP_HANDLERS.visit_location.onStart()`);
console.log(`\nActions:`);
console.log(`  1. game.questObjective = "${firstStep.description}"`);
console.log(`  2. game.showDialog("${firstStep.description}")`);
console.log(`  3. game.state = GameState.EXPLORING`);

console.log(`\n⚠️  EXPECTED DIALOGUE:`);
console.log(`Speaker: System/Game`);
console.log(`Text: "${firstStep.description}"`);

console.log(`\n❌ USER REPORTS SEEING:`);
console.log(`Text: "You want work?..." (OLD DIALOGUE PERSISTING!)`);

console.log('\n\n' + '='.repeat(70));
console.log('BUGS IDENTIFIED');
console.log('='.repeat(70));

console.log(`
1. DIALOGUE CLEARING BUG
   - When quest starts, old dialogue text persists
   - "You want work?..." shown instead of quest objective
   - Cause: showDialog() called while quest menu dialogue is closing
   - Fix: Ensure dialogue is fully cleared before starting quest

2. QUEST STRUCTURE ISSUE
   - User expects 3 tasks total, but there are 6 steps
   - Current: 3 visit_location + 3 problem = 6 steps
   - Expected: 3 combined location+problem steps
   - Fix: Restructure quest to embed problems in locations

3. DIFFICULTY TOO LOW
   - Math: 12-15=?, 9×2=?, 5×7=?
   - These are very easy for the 100 coin reward
   - Fix: Use harder math (2-digit multiplication, division)

4. MENU FREEZE WITH MATH ANSWERS
   - After visiting location, math problem appears
   - Menu freezes, still showing previous answer choices
   - Cause: Dialogue state machine not transitioning properly
   - Fix: Ensure problem dialogue replaces location dialogue
`);

NODESCRIPT

echo "✓ Dialogue trace written to $OUTPUT_FILE"
echo "  Run: cat $OUTPUT_FILE | less"
