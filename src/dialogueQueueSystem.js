/**
 * DialogueQueueSystem - Event-driven, queue-based dialogue system
 *
 * Eliminates callback hell and race conditions by:
 * 1. Queuing dialogues (FIFO) instead of nesting callbacks
 * 2. Emitting events instead of calling callbacks
 * 3. Processing one dialogue at a time with clear state machine
 *
 * Usage:
 *   game.dialogue.queue({ text: "Hello", speaker: "NPC" });
 *   game.dialogue.queue({ text: "How are you?", speaker: "NPC" });
 *   game.dialogue.on('closed', () => console.log('Dialogue ended'));
 *   game.dialogue.advance(); // Player presses A
 */

class DialogueQueueSystem {
    constructor(game, options = {}) {
        this.game = game;
        this.headless = options.headless || false; // For testing without UI

        // Queue state
        this.queue = [];              // Pending dialogues
        this.current = null;          // Currently showing dialogue
        this.state = 'IDLE';          // IDLE | SHOWING | WAITING_FOR_CHOICE

        // Event system
        this.listeners = {};

        // Debug
        this.eventLog = [];
        this.maxLogSize = 100;

        // UI elements (null in headless mode)
        this.ui = this.headless ? null : {
            dialogBox: document.getElementById('dialogBox'),
            content: document.getElementById('dialogContent'),
            speaker: document.getElementById('dialogSpeaker'),
            choices: document.getElementById('dialogChoices')
        };

        if (!this.headless) {
            this.setupInputHandlers();
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Add dialogue to queue
     * @param {Object} dialogue - Dialogue configuration
     * @param {string} dialogue.text - Dialogue text
     * @param {string} [dialogue.speaker] - Speaker name
     * @param {Array} [dialogue.choices] - Choice objects
     * @param {string} [dialogue.trigger] - Event to emit when closed
     * @param {string} [dialogue.id] - Unique ID for this dialogue
     */
    queue(dialogue) {
        // Generate ID if not provided
        if (!dialogue.id) {
            dialogue.id = `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        this.queue.push(dialogue);
        this.log('queued', dialogue.id);

        // If idle, start processing immediately
        if (this.state === 'IDLE') {
            this.processNext();
        }

        return dialogue.id;
    }

    /**
     * Queue multiple dialogues from a flow definition
     * @param {Object} flow - Flow definition
     * @param {string} flow.id - Flow ID
     * @param {Array} flow.dialogues - Array of dialogue objects
     */
    queueFlow(flow) {
        const flowDialogues = Array.isArray(flow) ? flow : flow.dialogues;

        flowDialogues.forEach((dialogue, index) => {
            // Auto-generate IDs for flow dialogues
            if (!dialogue.id && flow.id) {
                dialogue.id = `${flow.id}_${index}`;
            }
            this.queue(dialogue);
        });

        this.emit('flow_queued', flow.id || 'anonymous');
    }

    /**
     * Advance current dialogue or process next in queue
     * Called when player presses A button
     */
    advance() {
        if (this.state === 'SHOWING') {
            this.closeCurrentDialogue();
        } else if (this.state === 'WAITING_FOR_CHOICE') {
            // In choice state, need to select first
            console.warn('[DialogueQueue] Cannot advance - waiting for choice selection');
        } else {
            console.warn('[DialogueQueue] Cannot advance - no dialogue showing');
        }
    }

    /**
     * Select a dialogue choice
     * @param {number} index - Choice index
     */
    selectChoice(index) {
        if (this.state !== 'WAITING_FOR_CHOICE') {
            console.warn('[DialogueQueue] Not in choice state');
            return;
        }

        const choice = this.current.choices[index];
        if (!choice) {
            console.warn('[DialogueQueue] Invalid choice index:', index);
            return;
        }

        this.log('choice_selected', { dialogue: this.current.id, choice: index });
        this.emit('choice', choice, this.current.id, index);

        // If choice has trigger, emit it
        if (choice.trigger) {
            this.emit('trigger:' + choice.trigger, choice, this.current.id);
        }

        // Close current dialogue and process next
        this.closeCurrentDialogue();
    }

    /**
     * Clear entire queue and current dialogue
     */
    clear() {
        this.queue = [];
        if (this.current) {
            this.hideUI();
            this.current = null;
        }
        this.state = 'IDLE';
        this.log('cleared');
    }

    /**
     * Get debug information
     */
    debug() {
        return {
            state: this.state,
            current: this.current,
            queueLength: this.queue.length,
            queuePreview: this.queue.slice(0, 3).map(d => ({
                id: d.id,
                text: d.text.substring(0, 30) + '...'
            })),
            recentEvents: this.eventLog.slice(-10)
        };
    }

    // ========================================================================
    // EVENT SYSTEM
    // ========================================================================

    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
    }

    off(event, handler) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }

    emit(event, ...args) {
        this.log('event', { event, args });

        if (this.listeners[event]) {
            this.listeners[event].forEach(handler => {
                try {
                    handler(...args);
                } catch (error) {
                    console.error(`[DialogueQueue] Error in ${event} handler:`, error);
                }
            });
        }
    }

    // ========================================================================
    // INTERNAL QUEUE PROCESSING
    // ========================================================================

    processNext() {
        if (this.queue.length === 0) {
            this.state = 'IDLE';
            this.emit('queue_empty');
            this.log('queue_empty');
            return;
        }

        this.current = this.queue.shift();
        this.state = 'SHOWING';

        this.log('started', this.current.id);
        this.emit('started', this.current.id, this.current);

        // Show in UI (if not headless)
        if (!this.headless) {
            this.showUI(this.current);
        }

        // If has choices, transition to choice state
        if (this.current.choices && this.current.choices.length > 0) {
            this.state = 'WAITING_FOR_CHOICE';
            this.log('waiting_for_choice', this.current.id);

            // Auto-select if only one choice (quest menu pattern)
            if (this.current.choices.length === 1) {
                // Small delay to allow UI to render
                setTimeout(() => this.selectChoice(0), 50);
            }
        }
    }

    closeCurrentDialogue() {
        if (!this.current) {
            console.warn('[DialogueQueue] No current dialogue to close');
            return;
        }

        const closedDialogue = this.current;
        this.log('closed', closedDialogue.id);

        // Emit trigger if specified
        if (closedDialogue.trigger) {
            this.emit('trigger:' + closedDialogue.trigger, closedDialogue);
        }

        // Emit closed event
        this.emit('closed', closedDialogue.id, closedDialogue);

        // Clear current and hide UI
        this.current = null;
        if (!this.headless) {
            this.hideUI();
        }

        // Process next dialogue in queue
        this.processNext();
    }

    // ========================================================================
    // UI RENDERING
    // ========================================================================

    showUI(dialogue) {
        if (!this.ui) return;

        // Set speaker
        if (this.ui.speaker) {
            this.ui.speaker.textContent = dialogue.speaker || '???';
        }

        // Set text
        if (this.ui.content) {
            this.ui.content.textContent = dialogue.text;
        }

        // Render choices
        if (dialogue.choices && this.ui.choices) {
            const html = dialogue.choices.map((choice, index) =>
                `<div class="dialogue-choice ${index === 0 ? 'selected' : ''}" data-index="${index}">
                    ${choice.text}
                </div>`
            ).join('');
            this.ui.choices.innerHTML = html;
        } else if (this.ui.choices) {
            this.ui.choices.innerHTML = '';
        }

        // Show dialog box
        if (this.ui.dialogBox) {
            this.ui.dialogBox.classList.remove('hidden');
        }
    }

    hideUI() {
        if (!this.ui || !this.ui.dialogBox) return;

        this.ui.dialogBox.classList.add('hidden');
        if (this.ui.content) this.ui.content.textContent = '';
        if (this.ui.choices) this.ui.choices.innerHTML = '';
    }

    // ========================================================================
    // INPUT HANDLING
    // ========================================================================

    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            if (this.state === 'SHOWING') {
                if (e.key === 'a' || e.key === 'A' || e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.advance();
                }
            } else if (this.state === 'WAITING_FOR_CHOICE') {
                if (e.key === 'a' || e.key === 'A' || e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    // Select currently highlighted choice (always 0 for now)
                    this.selectChoice(0);
                }
                // TODO: Add up/down arrow support for multiple choices
            }
        });
    }

    // ========================================================================
    // LOGGING
    // ========================================================================

    log(type, data) {
        const entry = {
            time: Date.now(),
            type,
            data
        };

        this.eventLog.push(entry);

        // Trim log if too large
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxLogSize);
        }

        // Console log in development
        if (typeof DEBUG !== 'undefined' && DEBUG) {
            console.log('[DialogueQueue]', type, data);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DialogueQueueSystem;
}
