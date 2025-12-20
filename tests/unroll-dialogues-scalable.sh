#!/bin/bash
# Scalable Dialogue Unroller
# Automatically discovers and tests ALL NPCs, quests, and dialogue paths

cd "$(dirname "$0")"

OUTPUT_FILE="${1:-dialogue-full-report.txt}"

echo "Generating comprehensive dialogue report to $OUTPUT_FILE..."

node > "$OUTPUT_FILE" << 'NODESCRIPT'
const { NPCS, QUESTS, QUEST_STEP_HANDLERS, GameState } = require('./loadGameData.js');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     SCALABLE DIALOGUE UNROLLER - FULL COVERAGE       ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PLOT_PHASES = ['wake_up', 'find_creature', 'creature_found', 'meet_villager', 'boat_quest', 'working'];

// ============================================================================
// UTILITIES
// ============================================================================

function createMockGame(state) {
    return {
        state: state.state || GameState.EXPLORING,
        plotPhase: state.plotPhase || 'boat_quest',
        hasInspectedBoat: state.hasInspectedBoat || false,
        completedQuests: state.completedQuests || new Set(),
        activeQuest: null,
        questObjective: null,
        player: { x: 10, y: 10 },
        npcInteractions: new Map()
    };
}

function generateStatesForNPC(npcId, npc) {
    const states = [];

    if (npc.type === 'dialogue_npc') {
        // Test each plot phase
        PLOT_PHASES.forEach(phase => {
            states.push({ npcId, plotPhase: phase });
        });
    } else if (npc.type === 'quest_npc') {
        // Test states: no quests, some quests, all quests
        const allQuests = [...(npc.quests.oneOff || []), npc.quests.full].filter(q => q);

        // State 1: No quests completed
        states.push({
            npcId,
            plotPhase: 'boat_quest',
            hasInspectedBoat: true,
            completedQuests: new Set()
        });

        // State 2: Some quests completed
        if (allQuests.length > 1) {
            states.push({
                npcId,
                plotPhase: 'boat_quest',
                hasInspectedBoat: true,
                completedQuests: new Set([allQuests[0]])
            });
        }

        // State 3: All quests completed
        states.push({
            npcId,
            plotPhase: 'boat_quest',
            hasInspectedBoat: true,
            completedQuests: new Set(allQuests)
        });
    }

    return states;
}

// ============================================================================
// DIALOGUE TESTING
// ============================================================================

function testDialogueNPC(npcId, npc, states) {
    const results = {
        npcId,
        name: npc.name,
        type: npc.type,
        states: []
    };

    states.forEach(state => {
        const game = createMockGame(state);
        const dialogue = npc.dialogues.find(d => d.condition(game));

        const stateResult = {
            state: JSON.stringify(state),
            matched: !!dialogue,
            dialogue: null
        };

        if (dialogue) {
            let textPreview;
            if (Array.isArray(dialogue.text)) {
                textPreview = `[${dialogue.text.length} lines]`;
            } else if (typeof dialogue.text === 'string') {
                textPreview = dialogue.text.substring(0, 50);
            } else {
                textPreview = '[complex dialogue]';
            }

            stateResult.dialogue = {
                text: textPreview,
                hasChoices: !!dialogue.choices,
                numChoices: dialogue.choices ? dialogue.choices.length : 0,
                hasOnClose: !!dialogue.onClose
            };
        }

        results.states.push(stateResult);
    });

    return results;
}

function testQuestNPC(npcId, npc, states) {
    const results = {
        npcId,
        name: npc.name,
        type: npc.type,
        quests: {
            oneOff: [],
            full: null
        },
        states: []
    };

    // Catalog quests
    if (npc.quests.oneOff) {
        npc.quests.oneOff.forEach(qId => {
            const quest = QUESTS[qId];
            if (quest) {
                results.quests.oneOff.push({
                    id: qId,
                    name: quest.name || qId,
                    reward: quest.reward,
                    type: quest.type
                });
            }
        });
    }

    if (npc.quests.full) {
        const quest = QUESTS[npc.quests.full];
        if (quest) {
            results.quests.full = {
                id: npc.quests.full,
                name: quest.name || npc.quests.full,
                reward: quest.reward,
                type: quest.type,
                steps: quest.steps ? quest.steps.length : 0
            };
        }
    }

    // Test dialogue states
    states.forEach(state => {
        const game = createMockGame(state);
        const dialogue = npc.dialogues ? npc.dialogues.find(d => d.condition(game)) : null;

        let dialoguePreview = null;
        if (dialogue) {
            let textPreview;
            if (typeof dialogue.text === 'string') {
                textPreview = dialogue.text.substring(0, 50);
            } else {
                textPreview = '[complex dialogue]';
            }
            dialoguePreview = {
                text: textPreview,
                hasChoices: !!dialogue.choices
            };
        }

        results.states.push({
            state: JSON.stringify(state),
            matched: !!dialogue,
            dialogue: dialoguePreview
        });
    });

    return results;
}

// ============================================================================
// QUEST HANDLER TESTING
// ============================================================================

function testQuestHandlers() {
    const results = {
        handlers: [],
        issues: []
    };

    Object.keys(QUESTS).forEach(questId => {
        const quest = QUESTS[questId];

        if (quest.type === 'multi_step' && quest.steps) {
            quest.steps.forEach((step, stepIndex) => {
                const handler = QUEST_STEP_HANDLERS[step.type];

                const handlerResult = {
                    questId,
                    questName: quest.name || questId,
                    stepIndex,
                    stepType: step.type,
                    handlerExists: !!handler
                };

                if (!handler) {
                    results.issues.push(`Quest "${questId}" step ${stepIndex}: No handler for type "${step.type}"`);
                } else {
                    handlerResult.hasOnStart = !!handler.onStart;
                    handlerResult.hasOnUpdate = !!handler.onUpdate;
                    handlerResult.hasOnRender = !!handler.onRender;

                    // Try running onStart
                    if (handler.onStart) {
                        try {
                            const mockGame = createMockGame({});
                            mockGame.activeQuest = { currentStep: stepIndex, quest };
                            handler.onStart(mockGame, step);
                            handlerResult.onStartWorks = true;
                        } catch (e) {
                            handlerResult.onStartError = e.message;
                            results.issues.push(`Quest "${questId}" step ${stepIndex}: onStart() threw: ${e.message}`);
                        }
                    }
                }

                results.handlers.push(handlerResult);
            });
        }
    });

    return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('Discovering NPCs and Quests...\n');

const npcIds = Object.keys(NPCS);
const questIds = Object.keys(QUESTS);

console.log(`Found ${npcIds.length} NPCs:`);
npcIds.forEach(id => {
    const npc = NPCS[id];
    console.log(`  - ${id} (${npc.name}) - ${npc.type}`);
});

console.log(`\nFound ${questIds.length} Quests:`);
questIds.forEach(id => {
    const quest = QUESTS[id];
    console.log(`  - ${id} (${quest.name || id}) - ${quest.type}${quest.steps ? ` (${quest.steps.length} steps)` : ''}`);
});

console.log('\n' + '='.repeat(70));
console.log('TESTING DIALOGUE NPCS');
console.log('='.repeat(70));

const dialogueNPCs = npcIds.filter(id => NPCS[id].type === 'dialogue_npc');

dialogueNPCs.forEach(npcId => {
    const npc = NPCS[npcId];
    const states = generateStatesForNPC(npcId, npc);
    const results = testDialogueNPC(npcId, npc, states);

    console.log(`\n${npc.name} (${npcId})`);
    console.log(`  Dialogues: ${npc.dialogues ? npc.dialogues.length : 0}`);
    console.log(`  States tested: ${states.length}`);

    results.states.forEach((s, i) => {
        console.log(`\n  State ${i + 1}: ${s.state}`);
        if (s.matched) {
            console.log(`    ✓ Matched dialogue`);
            console.log(`      Text: "${s.dialogue.text}"`);
            console.log(`      Choices: ${s.dialogue.numChoices}`);
        } else {
            console.log(`    ⚠️  No matching dialogue`);
        }
    });
});

console.log('\n' + '='.repeat(70));
console.log('TESTING QUEST NPCS');
console.log('='.repeat(70));

const questNPCs = npcIds.filter(id => NPCS[id].type === 'quest_npc');

questNPCs.forEach(npcId => {
    const npc = NPCS[npcId];
    const states = generateStatesForNPC(npcId, npc);
    const results = testQuestNPC(npcId, npc, states);

    console.log(`\n${npc.name} (${npcId})`);
    console.log(`  One-off quests: ${results.quests.oneOff.length}`);
    results.quests.oneOff.forEach(q => {
        console.log(`    - ${q.name} (${q.reward} coins)`);
    });

    if (results.quests.full) {
        console.log(`  Full quest: ${results.quests.full.name} (${results.quests.full.reward} coins, ${results.quests.full.steps} steps)`);
    }

    console.log(`  States tested: ${states.length}`);
    results.states.forEach((s, i) => {
        console.log(`    ${i + 1}. ${s.matched ? '✓' : '✗'} ${s.state}`);
    });
});

console.log('\n' + '='.repeat(70));
console.log('TESTING QUEST HANDLERS');
console.log('='.repeat(70));

const handlerResults = testQuestHandlers();

console.log(`\nHandlers tested: ${handlerResults.handlers.length}`);
console.log(`Issues found: ${handlerResults.issues.length}`);

const handlerTypes = new Set();
handlerResults.handlers.forEach(h => handlerTypes.add(h.stepType));

console.log(`\nHandler types in use:`);
handlerTypes.forEach(type => {
    const count = handlerResults.handlers.filter(h => h.stepType === type).length;
    console.log(`  ${type}: ${count} step(s)`);
});

if (handlerResults.issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    handlerResults.issues.forEach(issue => console.log(`  - ${issue}`));
}

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

const totalDialogues = dialogueNPCs.reduce((sum, id) =>
    sum + (NPCS[id].dialogues ? NPCS[id].dialogues.length : 0), 0
);

console.log(`
NPCs: ${npcIds.length}
  - Dialogue NPCs: ${dialogueNPCs.length} (${totalDialogues} total dialogues)
  - Quest NPCs: ${questNPCs.length}

Quests: ${questIds.length}
  - Multi-step: ${questIds.filter(id => QUESTS[id].type === 'multi_step').length}
  - One-off: ${questIds.filter(id => QUESTS[id].type === 'one_off').length}

Quest Handlers: ${Object.keys(QUEST_STEP_HANDLERS).length}
  - Used: ${handlerTypes.size}
  - Issues: ${handlerResults.issues.length}

${handlerResults.issues.length === 0 ? '✅ ALL TESTS PASSED!' : '⚠️  ISSUES NEED FIXING'}
`);

NODESCRIPT

echo "✓ Full dialogue report written to $OUTPUT_FILE"
echo "  Run: cat $OUTPUT_FILE | less"
