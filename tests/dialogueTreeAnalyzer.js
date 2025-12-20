/**
 * Dialogue Tree Analyzer
 * Tool for testing and visualizing dialogue/quest trees
 * Call from tests to verify dialogue flows stay correct
 */

class DialogueTreeAnalyzer {
    constructor(npcs, quests) {
        this.npcs = npcs;
        this.quests = quests;
    }

    /**
     * Analyze an NPC's dialogue tree and return all possible paths
     * @param {string} npcId - NPC identifier
     * @param {Object} gameStates - Array of game states to test
     * @returns {Object} Analysis results
     */
    analyzeNPC(npcId, gameStates) {
        const npc = this.npcs[npcId];
        if (!npc) {
            return { error: `NPC '${npcId}' not found` };
        }

        const results = {
            npcId,
            npcName: npc.name,
            type: npc.type,
            dialogues: [],
            warnings: [],
            errors: []
        };

        if (npc.type === 'dialogue_npc' && npc.dialogues) {
            // Test each game state
            gameStates.forEach(state => {
                const matchingDialogues = npc.dialogues.filter(d =>
                    d.condition(state)
                );

                if (matchingDialogues.length === 0) {
                    results.warnings.push({
                        state: this.stringifyState(state),
                        issue: 'No matching dialogue for this state'
                    });
                } else if (matchingDialogues.length > 1) {
                    results.errors.push({
                        state: this.stringifyState(state),
                        issue: `Multiple dialogues match (${matchingDialogues.length})`,
                        dialogues: matchingDialogues.map(d => this.extractDialogueText(d.text))
                    });
                } else {
                    const dialogue = matchingDialogues[0];
                    results.dialogues.push({
                        state: this.stringifyState(state),
                        text: this.extractDialogueText(dialogue.text),
                        hasChoices: !!dialogue.choices,
                        choiceCount: dialogue.choices ? dialogue.choices.length : 0,
                        hasOnClose: !!dialogue.onClose,
                        repeatText: dialogue.repeatText || null
                    });
                }
            });
        }

        return results;
    }

    /**
     * Analyze quest NPC and verify quest flows
     * @param {string} npcId - NPC identifier
     * @returns {Object} Analysis results
     */
    analyzeQuestNPC(npcId) {
        const npc = this.npcs[npcId];
        if (!npc || !npc.quests) {
            return { error: `Quest NPC '${npcId}' not found or has no quests` };
        }

        const results = {
            npcId,
            npcName: npc.name,
            oneOffQuests: [],
            fullQuest: null,
            warnings: []
        };

        // Analyze one-off quests
        if (npc.quests.oneOff) {
            npc.quests.oneOff.forEach(questId => {
                const quest = this.quests[questId];
                if (!quest) {
                    results.warnings.push(`One-off quest '${questId}' not found`);
                } else {
                    results.oneOffQuests.push({
                        id: questId,
                        name: quest.name,
                        reward: quest.reward,
                        type: quest.type
                    });
                }
            });
        }

        // Analyze full quest
        if (npc.quests.full) {
            const quest = this.quests[npc.quests.full];
            if (!quest) {
                results.warnings.push(`Full quest '${npc.quests.full}' not found`);
            } else {
                results.fullQuest = {
                    id: npc.quests.full,
                    name: quest.name,
                    reward: quest.reward,
                    type: quest.type,
                    steps: quest.steps ? quest.steps.length : 0
                };
            }
        }

        return results;
    }

    /**
     * Generate all reasonable game states for an NPC
     * @param {string} npcId - NPC identifier
     * @returns {Array} Array of game states to test
     */
    generateTestStates(npcId) {
        const npc = this.npcs[npcId];
        const states = [];

        if (npcId === 'marlowe') {
            // Keeper/Marlowe states
            states.push(
                { plotPhase: 'wake_up', discoveredCreatures: new Set(), party: [] },
                { plotPhase: 'find_creature', discoveredCreatures: new Set(), party: [] },
                { plotPhase: 'creature_found', discoveredCreatures: new Set(['lumina']), party: [{ id: 'lumina_1', species: 'Lumina' }] },
                { plotPhase: 'meet_villager', discoveredCreatures: new Set(['lumina']), party: [{ id: 'lumina_1' }] },
                { plotPhase: 'boat_quest', discoveredCreatures: new Set(['lumina']), party: [{ id: 'lumina_1' }] }
            );
        } else if (npcId === 'callum') {
            // Callum/fisherman states
            const completedQuests = new Set();
            states.push(
                { plotPhase: 'meet_villager', hasInspectedBoat: false, completedQuests },
                { plotPhase: 'boat_quest', hasInspectedBoat: false, completedQuests },
                { plotPhase: 'boat_quest', hasInspectedBoat: true, completedQuests },
                { plotPhase: 'boat_quest', hasInspectedBoat: true, completedQuests: new Set(['fishing_crates']) },
                { plotPhase: 'working', hasInspectedBoat: true, completedQuests: new Set(['fishing_crates', 'fishing_nets']) }
            );
        }

        return states;
    }

    /**
     * Visualize dialogue tree as text output
     * @param {Object} analysis - Analysis result from analyzeNPC
     * @returns {string} Text visualization
     */
    visualizeTree(analysis) {
        let output = `\n=== ${analysis.npcName} (${analysis.npcId}) ===\n`;
        output += `Type: ${analysis.type}\n\n`;

        if (analysis.errors.length > 0) {
            output += `❌ ERRORS (${analysis.errors.length}):\n`;
            analysis.errors.forEach(err => {
                output += `  State: ${err.state}\n`;
                output += `  Issue: ${err.issue}\n`;
                if (err.dialogues) {
                    err.dialogues.forEach((text, i) => {
                        output += `    ${i + 1}. "${text}"\n`;
                    });
                }
                output += '\n';
            });
        }

        if (analysis.warnings.length > 0) {
            output += `⚠️  WARNINGS (${analysis.warnings.length}):\n`;
            analysis.warnings.forEach(warn => {
                output += `  State: ${warn.state}\n`;
                output += `  Issue: ${warn.issue}\n\n`;
            });
        }

        if (analysis.dialogues.length > 0) {
            output += `✓ DIALOGUES (${analysis.dialogues.length}):\n`;
            analysis.dialogues.forEach((dialogue, i) => {
                output += `\n${i + 1}. State: ${dialogue.state}\n`;
                output += `   Text: "${dialogue.text}"\n`;
                if (dialogue.repeatText) {
                    output += `   Repeat: "${dialogue.repeatText}"\n`;
                }
                if (dialogue.hasChoices) {
                    output += `   Choices: ${dialogue.choiceCount}\n`;
                }
                if (dialogue.hasOnClose) {
                    output += `   Has onClose handler\n`;
                }
            });
        }

        return output;
    }

    /**
     * Extract readable text from dialogue (handles arrays, objects, functions)
     */
    extractDialogueText(text) {
        if (typeof text === 'function') {
            return '[Dynamic function]';
        } else if (Array.isArray(text)) {
            return text.map(t =>
                typeof t === 'object' ? t.text : t
            ).join(' | ');
        } else if (typeof text === 'object' && text.text) {
            return text.text;
        } else {
            return text;
        }
    }

    /**
     * Create readable state string
     */
    stringifyState(state) {
        const parts = [];
        if (state.plotPhase) parts.push(`phase=${state.plotPhase}`);
        if (state.hasInspectedBoat !== undefined) parts.push(`boat=${state.hasInspectedBoat}`);
        if (state.completedQuests) parts.push(`quests=${state.completedQuests.size}`);
        if (state.party) parts.push(`party=${state.party.length}`);
        return parts.join(', ');
    }

    /**
     * Run full test suite on all NPCs
     * @returns {Object} Complete test results
     */
    runFullTest() {
        const results = {
            tested: [],
            totalErrors: 0,
            totalWarnings: 0
        };

        // Test dialogue NPCs
        Object.keys(this.npcs).forEach(npcId => {
            const npc = this.npcs[npcId];

            if (npc.type === 'dialogue_npc') {
                const states = this.generateTestStates(npcId);
                if (states.length > 0) {
                    const analysis = this.analyzeNPC(npcId, states);
                    results.tested.push({
                        npcId,
                        analysis,
                        visualization: this.visualizeTree(analysis)
                    });
                    results.totalErrors += analysis.errors.length;
                    results.totalWarnings += analysis.warnings.length;
                }
            }

            // Test quest NPCs
            if (npc.quests) {
                const questAnalysis = this.analyzeQuestNPC(npcId);
                results.tested.push({
                    npcId,
                    questAnalysis
                });
                if (questAnalysis.warnings) {
                    results.totalWarnings += questAnalysis.warnings.length;
                }
            }
        });

        return results;
    }
}

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DialogueTreeAnalyzer;
}
