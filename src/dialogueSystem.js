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

        // MOBILE ONLY - All interaction through D-pad/A button
        // No clicking on dialogue box or choices

        // Keyboard support (mobile buttons dispatch keyboard events)
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
                // Track NPC interactions per phase
                const interactionKey = `${npcId}_${this.game.plotPhase}`;
                if (!this.game.npcInteractions.has(interactionKey)) {
                    this.game.npcInteractions.set(interactionKey, 0);
                }
                const timesSpoken = this.game.npcInteractions.get(interactionKey);

                // If already spoken AND has repeatText, show short version (skip onClose/choices)
                if (timesSpoken > 0 && dialogue.repeatText) {
                    console.log(`[DialogueSystem] Repeat interaction with ${npcId} in ${this.game.plotPhase} - showing short message`);
                    this.startDialogue([dialogue.repeatText], null, null, npc.name);
                    return;
                }

                // Mark as spoken (increment counter)
                this.game.npcInteractions.set(interactionKey, timesSpoken + 1);
                console.log(`[DialogueSystem] First/important interaction with ${npcId} in ${this.game.plotPhase} - showing full dialogue`);

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
        console.log(`[DialogueSystem] advanceDialogue() called`);
        console.log(`[DialogueSystem] - active: ${this.game.dialogue.active}`);
        console.log(`[DialogueSystem] - textIndex: ${this.game.dialogue.textIndex}, fullText.length: ${this.game.dialogue.fullText.length}`);
        console.log(`[DialogueSystem] - currentLine: ${this.game.dialogue.currentLine}, total lines: ${this.game.dialogue.lines.length}`);

        // If typewriter still going, complete it instantly
        if (this.game.dialogue.textIndex < this.game.dialogue.fullText.length) {
            console.log(`[DialogueSystem] Completing typewriter: "${this.game.dialogue.fullText}"`);
            this.game.dialogue.textIndex = this.game.dialogue.fullText.length;
            this.game.dialogue.currentText = this.game.dialogue.fullText;
            document.getElementById('dialogContent').textContent = this.game.dialogue.currentText;
            console.log(`[DialogueSystem] Typewriter completed, RETURNING (double-tap mode)`);
            return;  // Keep double-tap behavior: first tap completes, second tap advances
        }

        // Move to next line
        console.log(`[DialogueSystem] Advancing to next line (current: ${this.game.dialogue.currentLine}/${this.game.dialogue.lines.length})`);
        this.game.dialogue.currentLine++;

        if (this.game.dialogue.currentLine < this.game.dialogue.lines.length) {
            // Start next line
            console.log(`[DialogueSystem] Starting next line (line ${this.game.dialogue.currentLine})`);
            this.game.dialogue.textIndex = 0;
            this.game.dialogue.currentText = '';

            const nextLine = this.game.dialogue.lines[this.game.dialogue.currentLine];
            console.log(`[DialogueSystem] nextLine type: ${typeof nextLine}`, nextLine);

            if (typeof nextLine === 'object' && nextLine.text) {
                this.game.dialogue.fullText = nextLine.text;
                this.game.dialogue.currentSpeaker = nextLine.speaker || this.game.dialogue.npcName || '???';
                console.log(`[DialogueSystem] Object format - speaker: "${this.game.dialogue.currentSpeaker}", text: "${this.game.dialogue.fullText}"`);
            } else {
                this.game.dialogue.fullText = nextLine;
                this.game.dialogue.currentSpeaker = this.game.dialogue.npcName || '???';
                console.log(`[DialogueSystem] String format - speaker: "${this.game.dialogue.currentSpeaker}", text: "${this.game.dialogue.fullText}"`);
            }

            // Update speaker name in UI
            const dialogSpeaker = document.getElementById('dialogSpeaker');
            if (dialogSpeaker) {
                dialogSpeaker.textContent = this.game.dialogue.currentSpeaker;
                console.log(`[DialogueSystem] Updated speaker display to: "${this.game.dialogue.currentSpeaker}"`);
            }
            console.log(`[DialogueSystem] Next line setup complete, typewriter will start on next update cycle`);
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

                // Set timestamp to prevent immediate re-interaction
                this.game.lastDialogueEndTime = Date.now();
            }
        }
    }

    endDialogue() {
        console.log('[DialogueSystem] endDialogue() called');
        console.log(`[DialogueSystem] - Has onClose handler: ${!!this.game.dialogue.onClose}`);

        // Execute onClose handler if present (before clearing state)
        if (this.game.dialogue.onClose) {
            console.log('[DialogueSystem] Executing onClose handler...');
            const onCloseHandler = this.game.dialogue.onClose;
            this.game.dialogue.onClose = null;  // Clear it first
            onCloseHandler(this.game);
            console.log('[DialogueSystem] onClose handler executed');
        }

        console.log('[DialogueSystem] Setting dialogue.active = false');
        this.game.dialogue.active = false;

        // Only set to EXPLORING if currently in dialogue
        if (this.game.state === GameState.DIALOGUE ||
            this.game.state === GameState.DIALOGUE_CHOICE) {
            console.log(`[DialogueSystem] Changing state from ${this.game.state} to EXPLORING`);
            this.game.state = GameState.EXPLORING;

            // Set timestamp to prevent immediate re-interaction
            this.game.lastDialogueEndTime = Date.now();
        } else {
            console.log(`[DialogueSystem] NOT changing state (current: ${this.game.state})`);
        }

        console.log('[DialogueSystem] Clearing dialogue UI');
        this.clearDialogueUI();
        console.log('[DialogueSystem] endDialogue() complete');
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
