#!/bin/bash
# Generate Golden Interaction Trees
# Creates reference files for all NPC dialogue flows to detect regressions

cd "$(dirname "$0")"

GOLDEN_DIR="golden-trees"
mkdir -p "$GOLDEN_DIR"

echo "Generating golden interaction trees..."

node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');
const { NPCS, QUESTS, QUEST_STEP_HANDLERS, GameState } = require('./loadGameData.js');

const GOLDEN_DIR = path.join(__dirname, 'golden-trees');

// ============================================================================
// MOCK GAME CREATION
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

// ============================================================================
// DIALOGUE SERIALIZATION
// ============================================================================

function serializeDialogue(dialogue, npcName) {
    const lines = [];

    lines.push(`Speaker: ${npcName}`);

    // Serialize text
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

    // Serialize choices
    if (dialogue.choices && dialogue.choices.length > 0) {
        lines.push(`Choices: ${dialogue.choices.length}`);
        dialogue.choices.forEach((choice, i) => {
            lines.push(`  ${i + 1}. "${choice.text}"`);
        });
    } else {
        lines.push(`Choices: none (press A to continue)`);
    }

    // Metadata
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
// GENERATE GOLDEN TREES
// ============================================================================

console.log('Generating golden trees for all NPCs...\n');

// Generate trees for each NPC
Object.entries(NPCS).forEach(([npcId, npc]) => {
    console.log(`Processing ${npcId} (${npc.name})...`);

    const npcDir = path.join(GOLDEN_DIR, npcId);
    if (!fs.existsSync(npcDir)) {
        fs.mkdirSync(npcDir, { recursive: true });
    }

    if (npc.type === 'dialogue_npc' && npc.dialogues) {
        // Generate dialogue trees for each plot phase
        const plotPhases = ['wake_up', 'find_creature', 'creature_found', 'meet_villager', 'boat_quest', 'working'];

        plotPhases.forEach(phase => {
            const game = createMockGame({ plotPhase: phase });
            const dialogue = npc.dialogues.find(d => d.condition(game));

            if (dialogue) {
                const content = serializeDialogue(dialogue, npc.name);
                const filename = `${phase}.txt`;
                fs.writeFileSync(path.join(npcDir, filename), content);
                console.log(`  ✓ ${filename}`);
            }
        });

        // ALSO generate quest trees if this dialogue NPC has quests
        if (npc.quests) {
            if (npc.quests.oneOff) {
                npc.quests.oneOff.forEach(questId => {
                    const quest = QUESTS[questId];
                    if (quest) {
                        const content = serializeQuestFlow(questId, quest);
                        const filename = `quest_${questId}.txt`;
                        fs.writeFileSync(path.join(npcDir, filename), content);
                        console.log(`  ✓ ${filename}`);
                    }
                });
            }

            if (npc.quests.full) {
                const quest = QUESTS[npc.quests.full];
                if (quest) {
                    const content = serializeQuestFlow(npc.quests.full, quest);
                    const filename = `quest_${npc.quests.full}.txt`;
                    fs.writeFileSync(path.join(npcDir, filename), content);
                    console.log(`  ✓ ${filename}`);
                }
            }
        }
    } else if (npc.type === 'quest_npc' || (npc.quests && npc.dialogues)) {
        // Generate dialogue trees for quest states
        const states = [
            { name: 'no_boat', hasInspectedBoat: false, completedQuests: new Set() },
            { name: 'no_quests', hasInspectedBoat: true, completedQuests: new Set() },
            { name: 'some_quests', hasInspectedBoat: true, completedQuests: new Set(['fishing_crates']) },
            { name: 'all_quests', hasInspectedBoat: true, completedQuests: new Set(['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records']) }
        ];

        states.forEach(stateConfig => {
            const game = createMockGame({
                plotPhase: 'boat_quest',
                hasInspectedBoat: stateConfig.hasInspectedBoat,
                completedQuests: stateConfig.completedQuests
            });

            if (npc.dialogues) {
                const dialogue = npc.dialogues.find(d => d.condition(game));

                if (dialogue) {
                    const content = serializeDialogue(dialogue, npc.name);
                    const filename = `dialogue_${stateConfig.name}.txt`;
                    fs.writeFileSync(path.join(npcDir, filename), content);
                    console.log(`  ✓ ${filename}`);
                }
            }
        });

        // Generate quest flow trees
        if (npc.quests) {
            if (npc.quests.oneOff) {
                npc.quests.oneOff.forEach(questId => {
                    const quest = QUESTS[questId];
                    if (quest) {
                        const content = serializeQuestFlow(questId, quest);
                        const filename = `quest_${questId}.txt`;
                        fs.writeFileSync(path.join(npcDir, filename), content);
                        console.log(`  ✓ ${filename}`);
                    }
                });
            }

            if (npc.quests.full) {
                const quest = QUESTS[npc.quests.full];
                if (quest) {
                    const content = serializeQuestFlow(npc.quests.full, quest);
                    const filename = `quest_${npc.quests.full}.txt`;
                    fs.writeFileSync(path.join(npcDir, filename), content);
                    console.log(`  ✓ ${filename}`);
                }
            }
        }
    }

    console.log('');
});

console.log(`✓ Golden trees generated in ${GOLDEN_DIR}/`);
console.log('These are your dialogue regression test references.');
console.log('Commit them to git so tests can detect changes.\n');

NODESCRIPT

echo ""
echo "Golden trees generated successfully!"
echo "Next: Run ./run-golden-tests.sh to validate against these references"
