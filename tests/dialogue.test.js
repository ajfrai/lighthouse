/**
 * Dialogue Tree Tests
 * Uses DialogueTreeAnalyzer to verify NPC dialogues stay correct
 */

// Load game data (would be imported properly in actual test setup)
// For now, assume NPCS and QUESTS are available from data.js

// Import the analyzer
const DialogueTreeAnalyzer = require('./dialogueTreeAnalyzer.js');

/**
 * Test: Marlowe dialogue tree
 */
function testMarlowe() {
    console.log('\n=== Testing Marlowe Dialogue Tree ===\n');

    const analyzer = new DialogueTreeAnalyzer(NPCS, QUESTS);
    const states = analyzer.generateTestStates('marlowe');
    const analysis = analyzer.analyzeNPC('marlowe', states);

    console.log(analyzer.visualizeTree(analysis));

    // Assertions
    if (analysis.errors.length > 0) {
        console.error(`❌ FAILED: Marlowe has ${analysis.errors.length} dialogue conflicts`);
        return false;
    }

    if (analysis.warnings.length > 0) {
        console.warn(`⚠️  WARNING: Marlowe has ${analysis.warnings.length} uncovered states`);
    }

    // Verify specific dialogue exists for each phase
    const wakeUpDialogue = analysis.dialogues.find(d => d.state.includes('wake_up'));
    const findCreatureDialogue = analysis.dialogues.find(d => d.state.includes('find_creature'));

    if (!wakeUpDialogue) {
        console.error('❌ FAILED: Missing wake_up dialogue');
        return false;
    }

    if (!findCreatureDialogue) {
        console.error('❌ FAILED: Missing find_creature dialogue');
        return false;
    }

    console.log('✓ PASSED: Marlowe dialogue tree is valid');
    return true;
}

/**
 * Test: Callum dialogue tree
 */
function testCallum() {
    console.log('\n=== Testing Callum Dialogue Tree ===\n');

    const analyzer = new DialogueTreeAnalyzer(NPCS, QUESTS);
    const states = analyzer.generateTestStates('callum');
    const analysis = analyzer.analyzeNPC('callum', states);

    console.log(analyzer.visualizeTree(analysis));

    // Critical test: Verify first interaction shows correct greeting
    const firstInteraction = analysis.dialogues.find(d =>
        d.state.includes('hasInspectedBoat=true') &&
        d.state.includes('quests=0')
    );

    if (!firstInteraction) {
        console.error('❌ FAILED: No dialogue for first quest interaction');
        return false;
    }

    if (firstInteraction.text.includes('Back for more')) {
        console.error('❌ FAILED: "Back for more?" shown on FIRST interaction');
        console.error('  This was the bug we fixed! Dialogue should be "You want work?"');
        return false;
    }

    // Verify repeat interaction shows different greeting
    const repeatInteraction = analysis.dialogues.find(d =>
        d.state.includes('hasInspectedBoat=true') &&
        d.state.includes('quests=1')
    );

    if (repeatInteraction && !repeatInteraction.text.includes('Back for more')) {
        console.error('❌ FAILED: Repeat interaction should say "Back for more?"');
        return false;
    }

    console.log('✓ PASSED: Callum dialogue tree is valid');
    console.log('  ✓ First interaction greeting correct');
    console.log('  ✓ Repeat interaction greeting correct');
    return true;
}

/**
 * Test: Callum quest structure
 */
function testCallumQuests() {
    console.log('\n=== Testing Callum Quest Structure ===\n');

    const analyzer = new DialogueTreeAnalyzer(NPCS, QUESTS);
    const questAnalysis = analyzer.analyzeQuestNPC('callum');

    console.log(`NPC: ${questAnalysis.npcName}`);
    console.log(`One-off quests: ${questAnalysis.oneOffQuests.length}`);
    questAnalysis.oneOffQuests.forEach(q => {
        console.log(`  - ${q.name} (${q.reward} coins)`);
    });

    if (questAnalysis.fullQuest) {
        console.log(`Full quest: ${questAnalysis.fullQuest.name} (${questAnalysis.fullQuest.reward} coins)`);
    }

    if (questAnalysis.warnings.length > 0) {
        console.error(`❌ FAILED: Quest structure has warnings`);
        questAnalysis.warnings.forEach(w => console.error(`  - ${w}`));
        return false;
    }

    if (questAnalysis.oneOffQuests.length !== 3) {
        console.error(`❌ FAILED: Expected 3 one-off quests, got ${questAnalysis.oneOffQuests.length}`);
        return false;
    }

    console.log('✓ PASSED: Callum quest structure is valid');
    return true;
}

/**
 * Run all dialogue tests
 */
function runAllTests() {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  Dialogue Tree Test Suite            ║');
    console.log('╚═══════════════════════════════════════╝');

    const results = {
        marlowe: testMarlowe(),
        callum: testCallum(),
        callumQuests: testCallumQuests()
    };

    const totalTests = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r === true).length;
    const failed = totalTests - passed;

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  Test Results                         ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`Total: ${totalTests}`);
    console.log(`✓ Passed: ${passed}`);
    if (failed > 0) {
        console.log(`❌ Failed: ${failed}`);
    }

    return failed === 0;
}

/**
 * Usage examples:
 *
 * // In a test file:
 * const analyzer = new DialogueTreeAnalyzer(NPCS, QUESTS);
 *
 * // Test single NPC:
 * const analysis = analyzer.analyzeNPC('callum', analyzer.generateTestStates('callum'));
 * console.log(analyzer.visualizeTree(analysis));
 *
 * // Run full suite:
 * const results = analyzer.runFullTest();
 *
 * // Check for issues:
 * if (results.totalErrors > 0) {
 *   console.error('Dialogue tree has errors!');
 *   results.tested.forEach(t => {
 *     if (t.analysis && t.analysis.errors.length > 0) {
 *       console.log(t.visualization);
 *     }
 *   });
 * }
 */

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runAllTests();
}
