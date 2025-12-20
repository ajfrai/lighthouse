/**
 * Dialogue Test Runner
 * Loads game data and runs dialogue tree analysis
 */

// Load game data
const { NPCS, QUESTS } = require('./loadGameData.js');

// Load the analyzer
const DialogueTreeAnalyzer = require('./dialogueTreeAnalyzer.js');

console.log('\n╔═══════════════════════════════════════╗');
console.log('║  Dialogue Tree Analysis Report       ║');
console.log('╚═══════════════════════════════════════╝');

const analyzer = new DialogueTreeAnalyzer(NPCS, QUESTS);

// Test Marlowe
console.log('\n' + '='.repeat(50));
console.log('MARLOWE ANALYSIS');
console.log('='.repeat(50));
const marloweStates = analyzer.generateTestStates('marlowe');
const marloweAnalysis = analyzer.analyzeNPC('marlowe', marloweStates);
console.log(analyzer.visualizeTree(marloweAnalysis));

// Test Callum
console.log('\n' + '='.repeat(50));
console.log('CALLUM ANALYSIS');
console.log('='.repeat(50));
const callumStates = analyzer.generateTestStates('callum');
const callumAnalysis = analyzer.analyzeNPC('callum', callumStates);
console.log(analyzer.visualizeTree(callumAnalysis));

// Test Callum quests
console.log('\n' + '='.repeat(50));
console.log('CALLUM QUEST STRUCTURE');
console.log('='.repeat(50));
const questAnalysis = analyzer.analyzeQuestNPC('callum');
console.log(`\nNPC: ${questAnalysis.npcName}`);
console.log(`\nOne-off quests (${questAnalysis.oneOffQuests.length}):`);
questAnalysis.oneOffQuests.forEach(q => {
    console.log(`  ✓ ${q.name} - ${q.reward} coins`);
});
if (questAnalysis.fullQuest) {
    console.log(`\nFull quest:`);
    console.log(`  ✓ ${questAnalysis.fullQuest.name} - ${questAnalysis.fullQuest.reward} coins (${questAnalysis.fullQuest.steps} steps)`);
}
if (questAnalysis.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    questAnalysis.warnings.forEach(w => console.log(`  - ${w}`));
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY');
console.log('='.repeat(50));

const totalErrors = marloweAnalysis.errors.length + callumAnalysis.errors.length;
const totalWarnings = marloweAnalysis.warnings.length + callumAnalysis.warnings.length + questAnalysis.warnings.length;

console.log(`\nTotal Errors: ${totalErrors}`);
console.log(`Total Warnings: ${totalWarnings}`);
console.log(`\nMarlowe: ${marloweAnalysis.dialogues.length} dialogues, ${marloweAnalysis.errors.length} errors, ${marloweAnalysis.warnings.length} warnings`);
console.log(`Callum: ${callumAnalysis.dialogues.length} dialogues, ${callumAnalysis.errors.length} errors, ${callumAnalysis.warnings.length} warnings`);

if (totalErrors === 0) {
    console.log('\n✅ All dialogue trees are valid!');
} else {
    console.log('\n❌ Dialogue trees have errors that need fixing!');
    process.exit(1);
}
