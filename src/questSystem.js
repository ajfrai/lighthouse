/**
 * Quest System - Handles all quest-related functionality
 * Extracted from main game engine for modularity
 */

class QuestSystem {
    constructor(game) {
        this.game = game;
    }

    showQuestMenu(npcId, npc) {
        this.game.state = GameState.JOB;  // Reuse JOB state for quest menu
        const jobUI = document.getElementById('jobUI');
        const jobTitle = document.getElementById('jobTitle');
        const jobQuestion = document.getElementById('jobQuestion');
        const jobAnswers = document.getElementById('jobAnswers');

        jobTitle.textContent = npc.name;
        jobQuestion.textContent = npc.greeting;
        jobAnswers.innerHTML = '';

        // Count completed one-off quests
        let completedOneOffs = 0;
        npc.quests.oneOff.forEach(questId => {
            if (this.game.completedQuests.has(questId)) {
                completedOneOffs++;
            }
        });

        // Check if full quest is completed
        const fullQuestCompleted = this.game.completedQuests.has(npc.quests.full);

        // One-off problem button
        const oneOffBtn = document.createElement('button');
        oneOffBtn.className = 'quest-menu-btn';
        if (completedOneOffs >= npc.quests.oneOff.length) {
            oneOffBtn.textContent = `Quick Problem (${completedOneOffs}/${npc.quests.oneOff.length} completed)`;
            oneOffBtn.disabled = true;
        } else {
            const nextQuestId = npc.quests.oneOff.find(qId => !this.game.completedQuests.has(qId));
            const nextQuest = QUESTS[nextQuestId];
            oneOffBtn.textContent = `Quick Problem (${nextQuest.reward} coins) - ${completedOneOffs}/${npc.quests.oneOff.length} done`;
            oneOffBtn.onclick = () => this.startQuest(nextQuestId);
        }
        jobAnswers.appendChild(oneOffBtn);

        // Full quest button
        const fullQuest = QUESTS[npc.quests.full];
        const fullQuestBtn = document.createElement('button');
        fullQuestBtn.className = 'quest-menu-btn';
        if (fullQuestCompleted) {
            fullQuestBtn.textContent = `${fullQuest.name} (Completed)`;
            fullQuestBtn.disabled = true;
        } else {
            fullQuestBtn.textContent = `${fullQuest.name} (${fullQuest.reward} coins)`;
            fullQuestBtn.onclick = () => this.startQuest(npc.quests.full);
        }
        jobAnswers.appendChild(fullQuestBtn);

        // Add cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'job-cancel';
        cancelBtn.onclick = () => {
            jobUI.classList.add('hidden');
            this.game.state = GameState.EXPLORING;
        };
        jobAnswers.appendChild(cancelBtn);

        jobUI.classList.remove('hidden');
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
        const jobUI = document.getElementById('jobUI');
        const jobTitle = document.getElementById('jobTitle');
        const jobQuestion = document.getElementById('jobQuestion');
        const jobAnswers = document.getElementById('jobAnswers');

        // Show problem number for multi-problem quests
        const titleText = problemNum ? `${npcName} - Problem ${problemNum}/${totalProblems}` : npcName;
        jobTitle.textContent = titleText;
        jobQuestion.textContent = problem.question;
        jobAnswers.innerHTML = '';

        problem.answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.textContent = answer;
            btn.onclick = () => this.submitQuestAnswer(answer);
            jobAnswers.appendChild(btn);
        });

        // Add cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'job-cancel';
        cancelBtn.onclick = () => {
            jobUI.classList.add('hidden');
            this.game.state = GameState.EXPLORING;
            this.game.activeQuest = null;
        };
        jobAnswers.appendChild(cancelBtn);

        jobUI.classList.remove('hidden');
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
