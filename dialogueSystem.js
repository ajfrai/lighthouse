/**
 * Dialogue System - Handles all dialogue and NPC interaction
 * Extracted from main game engine for modularity
 */

class DialogueSystem {
    constructor(game) {
        this.game = game;
    }

    showNPCDialog(npcId) {
        const npc = NPCS[npcId];
        if (!npc) return;

        // Framework-based dialogue system
        if (npc.type === 'dialogue_npc' && npc.dialogues) {
            // Find the first matching dialogue based on conditions
            const dialogue = npc.dialogues.find(d => d.condition(this.game));

            if (dialogue) {
                // Convert framework choices to game choices
                const choices = dialogue.choices ? dialogue.choices.map(choice => ({
                    text: choice.text,
                    action: () => choice.action(this.game)
                })) : null;

                this.game.startDialogue([dialogue.text], choices);
            } else {
                // Fallback if no dialogue matches
                this.showDialog("...");
            }
            return;
        }

        // Quest system for quest NPCs
        if (npc.type === 'quest_npc') {
            this.game.questSystem.showQuestMenu(npcId, npc);
            return;
        }

        // Legacy system for other NPCs
        if (npc.shop) {
            this.game.openShop();
        } else if (npc.job) {
            this.game.showJob(npcId, npc);
        } else {
            this.showDialog(npc.greeting);
        }
    }

    showDialog(message) {
        this.game.startDialogue([message]);
    }

    startDialogue(lines, choices = null) {
        this.game.state = GameState.DIALOGUE;
        this.game.dialogue.active = true;
        this.game.dialogue.lines = Array.isArray(lines) ? lines : [lines];
        this.game.dialogue.currentLine = 0;
        this.game.dialogue.textIndex = 0;
        this.game.dialogue.currentText = '';
        this.game.dialogue.fullText = this.game.dialogue.lines[0];
        this.game.dialogue.choices = choices;
        this.game.dialogue.selectedChoice = 0;

        const dialogBox = document.getElementById('dialogBox');
        const dialogClose = document.getElementById('dialogClose');

        // Show/hide close button based on whether there are choices
        if (dialogClose) {
            dialogClose.style.display = choices ? 'none' : 'inline-block';
        }

        dialogBox.classList.remove('hidden');
    }

    updateDialogue(timestamp) {
        if (!this.game.dialogue.active) return;

        const timeSinceLastChar = timestamp - this.game.dialogue.lastTypewriterUpdate;
        const msPerChar = 1000 / this.game.dialogue.typewriterSpeed;

        if (timeSinceLastChar >= msPerChar && this.game.dialogue.textIndex < this.game.dialogue.fullText.length) {
            this.game.dialogue.textIndex++;
            this.game.dialogue.currentText = this.game.dialogue.fullText.substring(0, this.game.dialogue.textIndex);
            this.game.dialogue.lastTypewriterUpdate = timestamp;

            // Update UI
            const dialogContent = document.getElementById('dialogContent');
            dialogContent.textContent = this.game.dialogue.currentText;
        }
    }

    advanceDialogue() {
        // If typewriter still going, complete it instantly
        if (this.game.dialogue.textIndex < this.game.dialogue.fullText.length) {
            this.game.dialogue.textIndex = this.game.dialogue.fullText.length;
            this.game.dialogue.currentText = this.game.dialogue.fullText;
            document.getElementById('dialogContent').textContent = this.game.dialogue.currentText;
            return;
        }

        // Move to next line
        this.game.dialogue.currentLine++;

        if (this.game.dialogue.currentLine < this.game.dialogue.lines.length) {
            // Start next line
            this.game.dialogue.textIndex = 0;
            this.game.dialogue.currentText = '';
            this.game.dialogue.fullText = this.game.dialogue.lines[this.game.dialogue.currentLine];
        } else if (this.game.dialogue.choices) {
            // Show choices
            this.game.state = GameState.DIALOGUE_CHOICE;
            this.showDialogueChoices();
        } else {
            // End dialogue
            this.endDialogue();
        }
    }

    showDialogueChoices() {
        const dialogContent = document.getElementById('dialogContent');
        const dialogChoices = document.getElementById('dialogChoices');
        const dialogClose = document.getElementById('dialogClose');

        // Keep the last message in dialogContent
        dialogContent.textContent = this.game.dialogue.currentText;

        // Hide close button when showing choices
        if (dialogClose) {
            dialogClose.style.display = 'none';
        }

        // Show choices in separate div
        let html = '<div class="dialogue-choices">';
        this.game.dialogue.choices.forEach((choice, index) => {
            const selected = index === this.game.dialogue.selectedChoice ? 'selected' : '';
            html += `<div class="choice ${selected}">${choice.text}</div>`;
        });
        html += '</div>';
        dialogChoices.innerHTML = html;
    }

    selectDialogueChoice() {
        const choice = this.game.dialogue.choices[this.game.dialogue.selectedChoice];
        if (choice.action) {
            choice.action.call(this.game);
        }
        this.endDialogue();
    }

    endDialogue() {
        this.game.dialogue.active = false;
        this.game.state = GameState.EXPLORING;

        // Clear dialogue content
        const dialogContent = document.getElementById('dialogContent');
        const dialogChoices = document.getElementById('dialogChoices');
        const dialogClose = document.getElementById('dialogClose');

        if (dialogContent) dialogContent.textContent = '';
        if (dialogChoices) dialogChoices.innerHTML = '';
        if (dialogClose) dialogClose.style.display = 'inline-block';

        document.getElementById('dialogBox').classList.add('hidden');
    }
}
