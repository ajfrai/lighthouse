#!/bin/bash
# Run Golden Tree Tests
# Validates current dialogue against golden reference files
# RELEASE BLOCKING - must pass before deployment

cd "$(dirname "$0")"

GOLDEN_DIR="golden-trees"
EXIT_CODE=0

if [ ! -d "$GOLDEN_DIR" ]; then
    echo "❌ ERROR: Golden trees not found!"
    echo "Run ./generate-golden-trees.sh first to create reference files."
    exit 1
fi

echo "╔═══════════════════════════════════════════════════════╗"
echo "║      GOLDEN TREE VALIDATION - RELEASE BLOCKING        ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');
const { NPCS, QUESTS, QUEST_STEP_HANDLERS, GameState } = require('./loadGameData.js');

const GOLDEN_DIR = path.join(__dirname, 'golden-trees');

// ============================================================================
// SAME SERIALIZATION AS generate-golden-trees.sh
// ============================================================================

function createMockGame(state) {
    return {
        state: state.state || GameState.EXPLORING,
        plotPhase: state.plotPhase || 'boat_quest',
        hasInspectedBoat: state.hasInspectedBoat !== undefined ? state.hasInspectedBoat : false,
        completedQuests: state.completedQuests || new Set(),
        activeQuest: null,
        questObjective: null,
        player: { x: 10, y: 10 },
        npcInteractions: new Map(),
        discoveredCreatures: new Set()
    };
}

function serializeDialogue(dialogue, npcName) {
    const lines = [];

    lines.push(`Speaker: ${npcName}`);

    if (Array.isArray(dialogue.text)) {
        lines.push(`Text: [${dialogue.text.length} lines]`);
        dialogue.text.forEach((line, i) => {
            if (typeof line === 'string') {
                lines.push(`  Line ${i + 1}: "${line}"`);
            } else if (line.speaker && line.text) {
                lines.push(`  Line ${i + 1}: [${line.speaker}] "${line.text}"`);
            } else {
                lines.push(`  Line ${i + 1}: [complex]`);
            }
        });
    } else if (typeof dialogue.text === 'string') {
        lines.push(`Text: "${dialogue.text}"`);
    } else {
        lines.push(`Text: [complex type]`);
    }

    if (dialogue.choices && dialogue.choices.length > 0) {
        lines.push(`Choices: ${dialogue.choices.length}`);
        dialogue.choices.forEach((choice, i) => {
            lines.push(`  ${i + 1}. "${choice.text}"`);
        });
    } else {
        lines.push(`Choices: none (press A to continue)`);
    }

    lines.push(`Has onClose: ${!!dialogue.onClose}`);

    return lines.join('\n');
}

function serializeQuestFlow(questId, quest) {
    const lines = [];

    lines.push(`Quest: ${quest.name || questId}`);
    lines.push(`ID: ${questId}`);
    lines.push(`Type: ${quest.type}`);
    lines.push(`Reward: ${quest.reward} coins`);

    if (quest.type === 'multi_step' && quest.steps) {
        lines.push(`Steps: ${quest.steps.length}`);
        lines.push('');

        quest.steps.forEach((step, i) => {
            lines.push(`Step ${i + 1}/${quest.steps.length}:`);
            lines.push(`  Type: ${step.type}`);
            lines.push(`  Description: "${step.description}"`);

            if (step.location) {
                lines.push(`  Location: (${step.location.x}, ${step.location.y})`);
                lines.push(`  Radius: ${step.radius || 1}`);
            }

            if (step.markerText) {
                lines.push(`  Marker: ${step.markerText}`);
            }

            if (step.onArrive) {
                if (step.onArrive.message) {
                    lines.push(`  Arrival Message: "${step.onArrive.message}"`);
                }

                if (step.onArrive.problem) {
                    const prob = step.onArrive.problem;
                    lines.push(`  Problem:`);
                    lines.push(`    Question: "${prob.question}"`);
                    lines.push(`    Answers: [${prob.answers.join(', ')}]`);
                    lines.push(`    Correct: ${prob.correct}`);
                }
            }

            lines.push('');
        });
    } else if (quest.type === 'one_off' && quest.problem) {
        lines.push(`Problem:`);
        lines.push(`  Question: "${quest.problem.question}"`);
        lines.push(`  Answers: [${quest.problem.answers.join(', ')}]`);
        lines.push(`  Correct: ${quest.problem.correct}`);
    }

    return lines.join('\n');
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

let totalTests = 0;
let passed = 0;
let failed = 0;
const failures = [];

console.log('Running golden tree validation tests...\n');

Object.entries(NPCS).forEach(([npcId, npc]) => {
    const npcDir = path.join(GOLDEN_DIR, npcId);

    if (!fs.existsSync(npcDir)) {
        console.log(`⚠️  ${npcId}: No golden trees found (skipping)`);
        return;
    }

    console.log(`Testing ${npcId} (${npc.name})...`);

    const goldenFiles = fs.readdirSync(npcDir);

    goldenFiles.forEach(filename => {
        totalTests++;

        const goldenPath = path.join(npcDir, filename);
        const golden = fs.readFileSync(goldenPath, 'utf8');

        let current = '';
        let testName = '';

        // Dialogue tests
        if (filename.startsWith('dialogue_') || (!filename.startsWith('quest_') && filename.endsWith('.txt'))) {
            const basename = filename.replace('.txt', '');

            if (basename.includes('_no_boat')) {
                const game = createMockGame({ hasInspectedBoat: false, completedQuests: new Set() });
                const dialogue = npc.dialogues?.find(d => d.condition(game));
                current = dialogue ? serializeDialogue(dialogue, npc.name) : 'NO DIALOGUE MATCHED';
                testName = `${npcId}/dialogue (no boat)`;
            } else if (basename.includes('_no_quests')) {
                const game = createMockGame({ hasInspectedBoat: true, completedQuests: new Set() });
                const dialogue = npc.dialogues?.find(d => d.condition(game));
                current = dialogue ? serializeDialogue(dialogue, npc.name) : 'NO DIALOGUE MATCHED';
                testName = `${npcId}/dialogue (no quests)`;
            } else if (basename.includes('_some_quests')) {
                const game = createMockGame({ hasInspectedBoat: true, completedQuests: new Set(['fishing_crates']) });
                const dialogue = npc.dialogues?.find(d => d.condition(game));
                current = dialogue ? serializeDialogue(dialogue, npc.name) : 'NO DIALOGUE MATCHED';
                testName = `${npcId}/dialogue (some quests)`;
            } else if (basename.includes('_all_quests')) {
                const game = createMockGame({ hasInspectedBoat: true, completedQuests: new Set(['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records']) });
                const dialogue = npc.dialogues?.find(d => d.condition(game));
                current = dialogue ? serializeDialogue(dialogue, npc.name) : 'NO DIALOGUE MATCHED';
                testName = `${npcId}/dialogue (all quests)`;
            } else {
                // Plot phase test
                const phase = basename;
                const game = createMockGame({ plotPhase: phase });
                const dialogue = npc.dialogues?.find(d => d.condition(game));
                current = dialogue ? serializeDialogue(dialogue, npc.name) : 'NO DIALOGUE MATCHED';
                testName = `${npcId}/${phase}`;
            }
        }
        // Quest tests
        else if (filename.startsWith('quest_')) {
            const questId = filename.replace('quest_', '').replace('.txt', '');
            const quest = QUESTS[questId];
            current = quest ? serializeQuestFlow(questId, quest) : 'QUEST NOT FOUND';
            testName = `${npcId}/quest:${questId}`;
        }

        // Compare
        if (current === golden) {
            passed++;
            console.log(`  ✓ ${filename}`);
        } else {
            failed++;
            console.log(`  ❌ ${filename}`);
            failures.push({
                test: testName,
                file: path.join(npcId, filename),
                golden,
                current
            });
        }
    });

    console.log('');
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('='.repeat(70));
console.log('TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('');

if (failed > 0) {
    console.log('❌ DIALOGUE REGRESSION DETECTED!\n');

    failures.forEach((failure, i) => {
        console.log(`Failure ${i + 1}: ${failure.test}`);
        console.log(`File: ${failure.file}`);
        console.log('\n--- EXPECTED (Golden) ---');
        console.log(failure.golden);
        console.log('\n--- ACTUAL (Current) ---');
        console.log(failure.current);
        console.log('\n' + '─'.repeat(70) + '\n');
    });

    console.log('⚠️  RELEASE BLOCKED - Fix dialogue regressions before deploying!');
    console.log('\nTo update golden trees after intentional changes:');
    console.log('  ./generate-golden-trees.sh');
    console.log('  git add golden-trees/');
    console.log('  git commit -m "Update golden trees for intentional dialogue changes"');

    process.exit(1);
} else {
    console.log('✅ ALL DIALOGUE TREES MATCH GOLDEN REFERENCES!');
    console.log('Safe to release.');
    process.exit(0);
}

NODESCRIPT
