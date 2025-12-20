/**
 * Trace Callum Quest Interaction
 * Step-by-step walkthrough of selecting 100 coin quest
 */

const { NPCS, QUESTS } = require('./loadGameData.js');

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║  CALLUM 100 COIN QUEST INTERACTION TRACE            ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Simulate game state when player first talks to Callum for quests
const gameState = {
    plotPhase: 'boat_quest',
    hasInspectedBoat: true,
    completedQuests: new Set(),  // No quests completed yet
    activeQuest: null
};

console.log('INITIAL STATE:');
console.log('  plotPhase:', gameState.plotPhase);
console.log('  hasInspectedBoat:', gameState.hasInspectedBoat);
console.log('  completedQuests:', gameState.completedQuests.size);
console.log('  activeQuest:', gameState.activeQuest);

// STEP 1: Player approaches Callum and presses A
console.log('\n' + '='.repeat(60));
console.log('STEP 1: Player talks to Callum');
console.log('='.repeat(60));

const callum = NPCS.callum;
const matchingDialogue = callum.dialogues.find(d => d.condition(gameState));

console.log('\nMatching dialogue condition check:');
callum.dialogues.forEach((d, i) => {
    const matches = d.condition(gameState);
    console.log(`  Dialogue ${i + 1}: ${matches ? '✓ MATCHES' : '✗ no match'}`);
    if (matches) {
        console.log(`    Text: "${typeof d.text === 'string' ? d.text : '[Array/Function]'}"`);
        console.log(`    Choices: ${d.choices ? d.choices.length : 0}`);
    }
});

if (matchingDialogue) {
    console.log('\n✓ Dialogue shown:', typeof matchingDialogue.text === 'string' ? matchingDialogue.text : '[Array]');
    if (matchingDialogue.choices) {
        console.log('  Choices available:');
        matchingDialogue.choices.forEach((c, i) => {
            console.log(`    ${i + 1}. "${c.text}"`);
        });
    }
}

// STEP 2: Player selects "Show me the work"
console.log('\n' + '='.repeat(60));
console.log('STEP 2: Player selects "Show me the work"');
console.log('='.repeat(60));

console.log('\nAction triggered: game.questSystem.showQuestMenu(\'callum\', NPCS.callum)');
console.log('\nQuest menu greeting logic:');
console.log('  npc.questGreeting:', callum.questGreeting || '(undefined)');
console.log('  Fallback: "Choose a task:"');
console.log('  ✓ Quest menu shows: "Choose a task:"');

// Simulate quest menu
const oneOffQuests = callum.quests.oneOff;
const fullQuest = callum.quests.full;

console.log('\nQuest menu choices:');
let choiceNum = 1;

// One-off quest choice
const nextOneOff = oneOffQuests.find(qId => !gameState.completedQuests.has(qId));
if (nextOneOff) {
    const quest = QUESTS[nextOneOff];
    const completed = oneOffQuests.filter(q => gameState.completedQuests.has(q)).length;
    console.log(`  ${choiceNum++}. "Quick Problem (${quest.reward} coins) - ${completed}/${oneOffQuests.length}"`);
}

// Full quest choice
if (!gameState.completedQuests.has(fullQuest)) {
    const quest = QUESTS[fullQuest];
    console.log(`  ${choiceNum++}. "${quest.name} (${quest.reward} coins)" ← 100 COIN QUEST`);
}

console.log(`  ${choiceNum}. "Not right now"`);

// STEP 3: Player selects 100 coin quest
console.log('\n' + '='.repeat(60));
console.log('STEP 3: Player selects "Check the Catch Records (100 coins)"');
console.log('='.repeat(60));

const selectedQuest = QUESTS[fullQuest];
console.log('\nSelected quest:', selectedQuest.name);
console.log('  Type:', selectedQuest.type);
console.log('  Reward:', selectedQuest.reward);
console.log('  Steps:', selectedQuest.steps.length);

console.log('\nAction triggered: this.startQuest(\'fishing_records\')');
console.log('\nIn startQuest():');
console.log('  1. Sets activeQuest = { questId: "fishing_records", quest: {...}, currentStep: 0 }');
console.log('  2. Hides jobUI (quest menu)');
console.log('  3. Quest type is "multi_step", so calls advanceQuestStep()');

console.log('\nIn advanceQuestStep():');
const firstStep = selectedQuest.steps[0];
console.log('  First step type:', firstStep.type);
console.log('  First step description:', firstStep.description);

if (firstStep.type === 'visit_location') {
    console.log('\n  Handler: QUEST_STEP_HANDLERS.visit_location.onStart()');
    console.log('  This should:');
    console.log('    1. Set questObjective = "' + firstStep.description + '"');
    console.log('    2. Show dialogue about the quest');
    console.log('    3. Player should see quest objective on screen');
}

// STEP 4: What does player actually see?
console.log('\n' + '='.repeat(60));
console.log('STEP 4: What dialogue appears after selecting quest?');
console.log('='.repeat(60));

console.log('\n⚠️  USER REPORTS: Callum says "You want work?..."');
console.log('\n❓ INVESTIGATING: Why does this dialogue appear?');

console.log('\nPossible causes:');
console.log('  1. Quest menu greeting showing wrong text');
console.log('  2. Quest selection not properly closing dialogue');
console.log('  3. Quest step handler showing Callum dialogue');
console.log('  4. Dialogue reopening after quest menu closes');

// Check if quest menu is using correct greeting
console.log('\n' + '='.repeat(60));
console.log('DIAGNOSIS');
console.log('='.repeat(60));

console.log('\nChecking quest menu code in questSystem.js:');
console.log('  Line 55: const questGreeting = npc.questGreeting || "Choose a task:";');
console.log('  Line 56-61: startDialogue([questGreeting], choices, null, npc.name);');

console.log('\n🔍 WAIT - The quest menu shows the SPEAKER as "Callum"!');
console.log('   This means the quest menu dialogue looks like:');
console.log('   Speaker: "Callum"');
console.log('   Text: "Choose a task:"');
console.log('   [Quest choices...]');

console.log('\n🔍 But the user might be seeing the PREVIOUS dialogue text!');
console.log('   When dialogue.choices are shown, dialogContent keeps the LAST message.');
console.log('   From dialogueSystem.js line 252:');
console.log('   "dialogContent.textContent = this.game.dialogue.currentText"');

console.log('\n🔍 CHECKING: What was the last dialogue text before quest menu?');
console.log('   Last dialogue: "You want work? I\'ve got fish that need counting."');
console.log('   This text might PERSIST when showing quest choices!');

console.log('\n💡 HYPOTHESIS: The quest menu is showing:');
console.log('   Content: "You want work?..." (from previous dialogue)');
console.log('   Choices: [Quick Problem, Check Catch Records, Not right now]');
console.log('\n   Instead of:');
console.log('   Content: "Choose a task:"');
console.log('   Choices: [Quest choices...]');

console.log('\n❌ BUG IDENTIFIED: Quest menu greeting not replacing dialogue content!');
console.log('   The questGreeting is passed as dialogue lines, but the dialogue');
console.log('   system might not be properly displaying it as new text.');
