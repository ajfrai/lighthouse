/**
 * Dialogue System - Completely rebuilt for simplicity and reliability
 *
 * Design principles:
 * 1. Single choices NEVER require clicking - auto-advance immediately
 * 2. Click handlers registered once with event delegation - never recreated
 * 3. No race conditions - clear order of operations
 * 4. Simple state machine - only 3 states: typing, waiting, choices
 */

class DialogueSystem {
    constructor(game) {
        console.log('[DialogueSystem] Constructor called');
        this.game = game;
        console.log('[DialogueSystem] game.state =', game.state);
        this.setupEventListeners();
        console.log('[DialogueSystem] Initialization complete');
    }

    /**
     * Set up event listeners ONCE - use event delegation
     * This prevents the bug where choices have no click handlers
     */
    setupEventListeners() {
        console.log('[DialogueSystem] Setting up event listeners...');

        const dialogBox = document.getElementById('dialogBox');
        const dialogChoices = document.getElementById('dialogChoices');
        const dialogClose = document.getElementById('dialogClose');

        // Click anywhere on dialog box to advance (when not showing choices)
        dialogBox.addEventListener('click', (e) => {
            // Don't advance if clicking on a choice or close button
            if (e.target.closest('.choice') || e.target === dialogClose) {
                return;
            }

            if (this.game.state === GameState.DIALOGUE) {
                this.advanceDialogue();
            }
        });

        // Event delegation for choices - handle clicks on any .choice element
        dialogChoices.addEventListener('click', (e) => {
            const choiceElement = e.target.closest('.choice');
            if (!choiceElement) return;

            const choiceIndex = parseInt(choiceElement.dataset.index);
            if (!isNaN(choiceIndex)) {
                this.game.dialogue.selectedChoice = choiceIndex;
                this.selectDialogueChoice();
            }
        });

        // Close button
        if (dialogClose) {
            dialogClose.addEventListener('click', () => {
                this.endDialogue();
            });
        }

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            console.log(`[DialogueSystem] Keydown event: key="${e.key}", state=${this.game.state}, DIALOGUE=${GameState.DIALOGUE}`);

            if (this.game.state === GameState.DIALOGUE) {
                console.log(`[DialogueSystem] In DIALOGUE state, checking if key matches...`);
                // Space, Enter, or 'A' button to advance
                if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
                    console.log(`[DialogueSystem] Key "${e.key}" MATCHED - advancing dialogue`);
                    e.preventDefault();
                    this.advanceDialogue();
                } else {
                    console.log(`[DialogueSystem] Key "${e.key}" did not match Space/Enter/a/A`);
                }
            } else if (this.game.state === GameState.DIALOGUE_CHOICE) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    e.preventDefault();
                    this.moveChoiceSelection(-1);
                } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    this.moveChoiceSelection(1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectDialogueChoice();
                }
            }
        });
    }

    showNPCDialog(npcId) {
        const npc = NPCS[npcId];
        if (!npc) return;

        // Framework-based dialogue system
        if (npc.type === 'dialogue_npc' && npc.dialogues) {
            const dialogue = npc.dialogues.find(d => d.condition(this.game));

            if (dialogue) {
                const choices = dialogue.choices ? dialogue.choices.map(choice => ({
                    text: choice.text,
                    action: () => choice.action(this.game)
                })) : null;

                // Support dynamic text (function that returns array/string)
                let textContent = dialogue.text;
                if (typeof textContent === 'function') {
                    textContent = textContent(this.game);
                }

                const lines = Array.isArray(textContent) ? textContent : [textContent];
                const onClose = dialogue.onClose || null;

                this.startDialogue(lines, choices, onClose, npc.name);  // Pass NPC name
            } else {
                this.showDialog("...");
            }
            return;
        }

        // Quest system for quest NPCs
        if (npc.type === 'quest_npc') {
            this.game.questSystem.showQuestMenu(npcId, npc);
            return;
        }

        // Legacy system
        if (npc.shop) {
            this.game.openShop();
        } else if (npc.job) {
            this.game.showJob(npcId, npc);
        } else {
            this.showDialog(npc.greeting);
        }
    }

    showDialog(message) {
        this.startDialogue([message]);
    }

    startDialogue(lines, choices = null, onClose = null, npcName = null) {
        this.game.state = GameState.DIALOGUE;
        this.game.dialogue.active = true;
        this.game.dialogue.lines = Array.isArray(lines) ? lines : [lines];
        this.game.dialogue.npcName = npcName;  // Store NPC name for default speaker
        this.game.dialogue.currentLine = 0;
        this.game.dialogue.textIndex = 0;
        this.game.dialogue.currentText = '';

        // Extract text and speaker from first line
        const firstLine = this.game.dialogue.lines[0];
        if (typeof firstLine === 'object' && firstLine.text) {
            this.game.dialogue.fullText = firstLine.text;
            this.game.dialogue.currentSpeaker = firstLine.speaker || npcName || '???';
        } else {
            this.game.dialogue.fullText = firstLine;
            this.game.dialogue.currentSpeaker = npcName || '???';
        }

        this.game.dialogue.choices = choices;
        this.game.dialogue.selectedChoice = 0;
        this.game.dialogue.onClose = onClose;

        const dialogBox = document.getElementById('dialogBox');
        const dialogClose = document.getElementById('dialogClose');
        const dialogSpeaker = document.getElementById('dialogSpeaker');

        // Show speaker name
        if (dialogSpeaker) {
            dialogSpeaker.textContent = this.game.dialogue.currentSpeaker;
        }

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

            const dialogContent = document.getElementById('dialogContent');
            dialogContent.textContent = this.game.dialogue.currentText;
        }
    }

    advanceDialogue() {
        // If typewriter still going, complete it instantly
        if (this.game.dialogue.textIndex < this.game.dialogue.fullText.length) {
            console.log(`[DialogueSystem] Completing typewriter: "${this.game.dialogue.fullText}"`);
            this.game.dialogue.textIndex = this.game.dialogue.fullText.length;
            this.game.dialogue.currentText = this.game.dialogue.fullText;
            document.getElementById('dialogContent').textContent = this.game.dialogue.currentText;
            return;
        }

        // Move to next line
        console.log(`[DialogueSystem] Advancing to next line (current: ${this.game.dialogue.currentLine}/${this.game.dialogue.lines.length})`);
        this.game.dialogue.currentLine++;

        if (this.game.dialogue.currentLine < this.game.dialogue.lines.length) {
            // Start next line
            this.game.dialogue.textIndex = 0;
            this.game.dialogue.currentText = '';

            const nextLine = this.game.dialogue.lines[this.game.dialogue.currentLine];
            if (typeof nextLine === 'object' && nextLine.text) {
                this.game.dialogue.fullText = nextLine.text;
                this.game.dialogue.currentSpeaker = nextLine.speaker || this.game.dialogue.npcName || '???';
            } else {
                this.game.dialogue.fullText = nextLine;
                this.game.dialogue.currentSpeaker = this.game.dialogue.npcName || '???';
            }

            // Update speaker name in UI
            const dialogSpeaker = document.getElementById('dialogSpeaker');
            if (dialogSpeaker) {
                dialogSpeaker.textContent = this.game.dialogue.currentSpeaker;
            }
        } else if (this.game.dialogue.choices) {
            // Show choices
            this.game.state = GameState.DIALOGUE_CHOICE;
            this.showDialogueChoices();

            // CRITICAL: Single choices auto-advance IMMEDIATELY
            // No timeout, no delay - just do it
            if (this.game.dialogue.choices.length === 1) {
                // Execute the single choice immediately
                this.selectDialogueChoice();
            }
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

        // Build choices HTML with data-index for click handling
        let html = '<div class="dialogue-choices">';
        this.game.dialogue.choices.forEach((choice, index) => {
            const selected = index === this.game.dialogue.selectedChoice ? 'selected' : '';
            // CRITICAL: Include data-index so click handler knows which choice was clicked
            html += `<div class="choice ${selected}" data-index="${index}">${choice.text}</div>`;
        });
        html += '</div>';
        dialogChoices.innerHTML = html;
    }

    moveChoiceSelection(direction) {
        const numChoices = this.game.dialogue.choices.length;
        this.game.dialogue.selectedChoice = (this.game.dialogue.selectedChoice + direction + numChoices) % numChoices;
        this.showDialogueChoices();
    }

    selectDialogueChoice() {
        const choice = this.game.dialogue.choices[this.game.dialogue.selectedChoice];

        // Clear dialogue state FIRST
        this.game.dialogue.active = false;

        // Execute action
        if (choice.action) {
            choice.action.call(this.game);
        }

        // Clean up UI
        // If action started new dialogue, this does nothing (dialogue.active is true again)
        // If action didn't start new dialogue, this cleans up properly
        if (!this.game.dialogue.active) {
            this.clearDialogueUI();

            // Only set to EXPLORING if we're still in dialogue state
            if (this.game.state === GameState.DIALOGUE ||
                this.game.state === GameState.DIALOGUE_CHOICE) {
                this.game.state = GameState.EXPLORING;
            }
        }
    }

    endDialogue() {
        // Execute onClose handler if present (before clearing state)
        if (this.game.dialogue.onClose) {
            const onCloseHandler = this.game.dialogue.onClose;
            this.game.dialogue.onClose = null;  // Clear it first
            onCloseHandler(this.game);
        }

        this.game.dialogue.active = false;

        // Only set to EXPLORING if currently in dialogue
        if (this.game.state === GameState.DIALOGUE ||
            this.game.state === GameState.DIALOGUE_CHOICE) {
            this.game.state = GameState.EXPLORING;
        }

        this.clearDialogueUI();
    }

    clearDialogueUI() {
        const dialogContent = document.getElementById('dialogContent');
        const dialogChoices = document.getElementById('dialogChoices');
        const dialogClose = document.getElementById('dialogClose');

        if (dialogContent) dialogContent.textContent = '';
        if (dialogChoices) dialogChoices.innerHTML = '';
        if (dialogClose) dialogClose.style.display = 'inline-block';

        document.getElementById('dialogBox').classList.add('hidden');
    }
}
