/**
 * Quest System - Handles all quest-related functionality
 * Extracted from main game engine for modularity
 */

class QuestSystem {
    constructor(game) {
        this.game = game;
    }

    showQuestMenu(npcId, npc) {
        // Count completed one-off quests
        let completedOneOffs = 0;
        npc.quests.oneOff.forEach(questId => {
            if (this.game.completedQuests.has(questId)) {
                completedOneOffs++;
            }
        });

        // Check if full quest is completed
        const fullQuestCompleted = this.game.completedQuests.has(npc.quests.full);

        // Build choice list
        const choices = [];

        // One-off problem choice
        if (completedOneOffs < npc.quests.oneOff.length) {
            const nextQuestId = npc.quests.oneOff.find(qId => !this.game.completedQuests.has(qId));
            const nextQuest = QUESTS[nextQuestId];
            choices.push({
                text: `Quick Problem (${nextQuest.reward} coins) - ${completedOneOffs}/${npc.quests.oneOff.length}`,
                action: () => this.startQuest(nextQuestId)
            });
        }

        // Full quest choice
        if (!fullQuestCompleted) {
            const fullQuest = QUESTS[npc.quests.full];
            choices.push({
                text: `${fullQuest.name} (${fullQuest.reward} coins)`,
                action: () => this.startQuest(npc.quests.full)
            });
        }

        // Always add cancel option
        choices.push({
            text: 'Not right now',
            action: () => {
                // Just dismiss, return to EXPLORING
            }
        });

        // Show as dialogue with choices (D-pad compatible)
        // Use quest-specific greeting if available, otherwise a contextual default
        const questGreeting = npc.questGreeting || "Choose a task:";
        this.game.dialogueSystem.startDialogue(
            [questGreeting],
            choices,
            null,
            npc.name
        );
    }

    startQuest(questId) {
        const quest = QUESTS[questId];
        if (!quest) {
            console.error(`Quest not found: ${questId}`);
            return;
        }

        // Set up active quest
        this.game.activeQuest = {
            questId: questId,
            quest: quest,
            currentStep: 0
        };

        document.getElementById('jobUI').classList.add('hidden');

        // Handle different quest types
        if (quest.type === 'one_off') {
            // Simple one-problem quest
            this.showQuestProblem(quest.problem, quest.name);
        } else if (quest.type === 'multi_step') {
            // CRITICAL: Close quest menu dialogue before starting multi-step quest
            // This prevents infinite dialogue loop where dialogBox is visible but unresponsive
            this.game.dialogueSystem.endDialogue();

            // Start multi-step quest
            this.advanceQuestStep();
        }
    }

    advanceQuestStep() {
        const quest = this.game.activeQuest.quest;
        const step = quest.steps[this.game.activeQuest.currentStep];

        if (!step) {
            // Quest complete!
            this.completeQuest();
            return;
        }

        // Use handler registry for extensibility
        const handler = QUEST_STEP_HANDLERS[step.type];
        if (handler && handler.onStart) {
            handler.onStart(this.game, step);
        } else {
            console.error(`Unknown quest step type: ${step.type}`);
        }
    }

    checkQuestObjectives() {
        if (!this.game.activeQuest) return;

        const quest = this.game.activeQuest.quest;
        if (quest.type !== 'multi_step') return;

        const step = quest.steps[this.game.activeQuest.currentStep];
        if (!step) return;

        // Use handler registry for update logic
        const handler = QUEST_STEP_HANDLERS[step.type];
        if (handler && handler.onUpdate) {
            const result = handler.onUpdate(this.game, step);

            if (result.completed) {
                // Step completed!
                this.game.activeQuest.currentStep++;
                this.game.questObjective = null;

                // Show completion message and choices
                if (result.message) {
                    this.game.startDialogue([result.message], result.choices);
                }
            }
        }
    }

    showQuestProblem(problem, npcName, problemNum = null, totalProblems = null) {
        // Build title with problem number if multi-problem quest
        const titleText = problemNum ? `${npcName} - Problem ${problemNum}/${totalProblems}` : npcName;

        // Convert answers to dialogue choices (D-pad compatible)
        const choices = problem.answers.map(answer => ({
            text: answer,
            action: () => this.submitQuestAnswer(answer)
        }));

        // Add cancel option
        choices.push({
            text: 'Cancel',
            action: () => {
                this.game.activeQuest = null;
                this.game.questObjective = null;
            }
        });

        // Show as dialogue (fully D-pad controlled)
        this.game.dialogueSystem.startDialogue(
            [problem.question],
            choices,
            null,
            titleText
        );
    }

    submitQuestAnswer(answer) {
        if (!this.game.activeQuest) return;

        const quest = this.game.activeQuest.quest;
        let problem;

        // Get the current problem based on quest type
        if (quest.type === 'one_off') {
            problem = quest.problem;
        } else if (quest.type === 'multi_step') {
            const step = quest.steps[this.game.activeQuest.currentStep];
            if (step.type !== 'problem') return;
            problem = step;
        }

        if (answer !== problem.correct) {
            // Wrong answer
            this.game.showDialog(`Not quite right. Try again next time!`);
            document.getElementById('jobUI').classList.add('hidden');
            this.game.state = GameState.EXPLORING;
            this.game.questObjective = null;
            this.game.activeQuest = null;
            return;
        }

        // Correct answer - advance to next step
        this.game.activeQuest.currentStep++;
        document.getElementById('jobUI').classList.add('hidden');

        // Continue quest or complete it
        if (quest.type === 'one_off') {
            this.completeQuest();
        } else if (quest.type === 'multi_step') {
            if (this.game.activeQuest.currentStep >= quest.steps.length) {
                this.completeQuest();
            } else {
                this.advanceQuestStep();
            }
        }
    }

    completeQuest() {
        const quest = this.game.activeQuest.quest;

        // Award coins
        this.game.coins += quest.reward;
        this.game.updateUI();

        // Mark as completed
        this.game.completedQuests.add(this.game.activeQuest.questId);

        // Clear quest state BEFORE showing dialog
        document.getElementById('jobUI').classList.add('hidden');
        this.game.questObjective = null;
        this.game.activeQuest = null;

        // Show success message (this properly manages state transition)
        this.game.showDialog(`Excellent work! You earned ${quest.reward} coins!`);
    }

    renderQuestMarkers(ctx) {
        if (!this.game.activeQuest) return;

        const quest = this.game.activeQuest.quest;
        if (quest.type !== 'multi_step') return;

        const step = quest.steps[this.game.activeQuest.currentStep];
        if (!step) return;

        // Use handler registry for rendering
        const handler = QUEST_STEP_HANDLERS[step.type];
        if (handler && handler.onRender) {
            handler.onRender(this.game, step);
        }
    }

    renderQuestObjective(ctx, canvasHeight, canvasWidth) {
        if (!this.game.questObjective) return;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, canvasHeight - 50, canvasWidth - 20, 40);

        ctx.fillStyle = '#ffff00';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Quest: ${this.game.questObjective}`, canvasWidth / 2, canvasHeight - 25);
        ctx.restore();
    }
}
