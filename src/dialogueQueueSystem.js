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
        this.verboseLogging = options.verboseLogging || false; // Enable detailed debug logs

        // Queue state
        this._queue = [];             // Pending dialogues (internal array)
        this.current = null;          // Currently showing dialogue
        this.state = 'IDLE';          // IDLE | ANIMATING | WAITING_FOR_INPUT | WAITING_FOR_CHOICE

        // Typewriter animation state
        this.typewriterSpeed = game.speedRunMode ? 1000 : 30; // chars per second
        this.fullText = '';
        this.currentText = '';
        this.textIndex = 0;
        this.lastTypewriterUpdate = 0;

        // Choice selection state (for multi-choice dialogues)
        this.selectedChoiceIndex = 0;  // Which choice is currently highlighted

        // FSM: Dialogue visit tracking (prevents infinite loops)
        this.visitCounts = new Map(); // Maps dialogue state key -> visit count
        this.maxVisitsBeforeWarning = 3; // Industry standard: warn after 3 repeats

        // Event system
        this.listeners = {};

        // Debug & performance tracking
        this.eventLog = [];
        this.maxLogSize = 100;
        this.lastDialogueStartTime = 0;

        // UI elements (null in headless mode)
        this.ui = this.headless ? null : {
            dialogBox: document.getElementById('dialogBox'),
            content: document.getElementById('dialogContent'),
            speaker: document.getElementById('dialogSpeaker'),
            choices: document.getElementById('dialogChoices')
        };

        // Input handling is now done by InputRouter (registered in Game constructor)
        // No need to set up event listeners here anymore
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

        this._queue.push(dialogue);
        this.log('queued', dialogue.id);

        // If idle, start processing immediately
        if (this.state === 'IDLE') {
            this.processNext();
        }

        return dialogue.id;
    }

    /**
     * Legacy API compatibility - matches old dialogueSystem.startDialogue() signature
     * @param {Array|string} lines - Dialogue lines (array or single string)
     * @param {Array} [choices] - Choice objects with text and action
     * @param {Function} [onClose] - Callback when dialogue closes
     * @param {string} [speaker] - Speaker name
     */
    startDialogue(lines, choices = null, onClose = null, speaker = null) {
        // Convert to queue format
        const linesArray = Array.isArray(lines) ? lines : [lines];

        // Queue each line (multi-line dialogues are separate queue entries)
        linesArray.forEach((line, index) => {
            const isLast = index === linesArray.length - 1;

            // Handle object format: {speaker: "Name", text: "..."}
            let dialogueText, dialogueSpeaker;
            if (typeof line === 'object' && line.text) {
                dialogueText = line.text;
                dialogueSpeaker = line.speaker || speaker;
            } else {
                dialogueText = line;
                dialogueSpeaker = speaker;
            }

            this.queue({
                text: dialogueText,
                speaker: dialogueSpeaker,
                choices: isLast ? choices : null,  // Only last line gets choices
                trigger: isLast && onClose ? '_onclose_callback' : null
            });
        });

        // Set up one-time onClose handler if provided
        if (onClose && typeof onClose === 'function') {
            console.log('[DialogueQueue] Setting up onClose handler');
            const handler = () => {
                console.log('[DialogueQueue] ★★★ onClose handler RUNNING ★★★');
                console.log('[DialogueQueue]   Plot phase BEFORE onClose:', this.game.plotPhase);
                this.off('trigger:_onclose_callback', handler);
                onClose(this.game);
                console.log('[DialogueQueue]   Plot phase AFTER onClose:', this.game.plotPhase);
                console.log('[DialogueQueue] ★★★ onClose handler COMPLETE ★★★');
            };
            this.on('trigger:_onclose_callback', handler);
        }
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
     * Show NPC dialogue based on NPC framework conditions
     * @param {string} npcId - NPC identifier
     */
    showNPCDialog(npcId) {
        console.log(`[DialogueQueue] showNPCDialog called for ${npcId}, current state:`, this.state);
        const npc = NPCS[npcId];
        if (!npc) return;

        // Clear all held keys to prevent movement after dialogue
        if (this.game && this.game.clearAllKeys) {
            this.game.clearAllKeys();
        }

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
                    console.log(`[DialogueQueue] Repeat interaction with ${npcId} in ${this.game.plotPhase} - showing short message`);
                    this.startDialogue([dialogue.repeatText], null, null, npc.name);
                    return;
                }

                // Mark as spoken (increment counter)
                this.game.npcInteractions.set(interactionKey, timesSpoken + 1);
                console.log(`[DialogueQueue] First/important interaction with ${npcId} in ${this.game.plotPhase} - showing full dialogue`);

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

                this.startDialogue(lines, choices, onClose, npc.name);
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

    /**
     * Show simple message dialogue
     * @param {string} message - Message to display
     */
    showDialog(message) {
        this.startDialogue([message]);
    }

    /**
     * Update typewriter animation (call every frame)
     * @param {number} timestamp - Current timestamp in ms
     */
    update(timestamp) {
        if (this.state !== 'ANIMATING') return;

        const timeSinceLastChar = timestamp - this.lastTypewriterUpdate;
        const msPerChar = 1000 / this.typewriterSpeed;

        if (timeSinceLastChar >= msPerChar && this.textIndex < this.fullText.length) {
            this.textIndex++;
            this.currentText = this.fullText.substring(0, this.textIndex);
            this.lastTypewriterUpdate = timestamp;

            // Update UI
            if (this.ui && this.ui.content) {
                this.ui.content.textContent = this.currentText;
            }

            // When animation completes, transition to WAITING_FOR_INPUT
            if (this.textIndex >= this.fullText.length) {
                this.state = 'WAITING_FOR_INPUT';
                console.log('[DialogueQueue] Animation complete, state:', this.state);
                this.log('animation_complete', this.current?.id);
            }
        }
    }

    /**
     * Advance current dialogue or process next in queue
     * Called when player presses A button
     * Implements double-tap: first tap completes animation, second tap advances
     */
    advance() {
        if (this.verboseLogging) {
            console.log('[DialogueQueue] advance() called, state:', this.state);
        }

        // State: ANIMATING - Complete animation instantly (first tap)
        if (this.state === 'ANIMATING') {
            this.textIndex = this.fullText.length;
            this.currentText = this.fullText;
            if (this.ui && this.ui.content) {
                this.ui.content.textContent = this.currentText;
            }
            this.state = 'WAITING_FOR_INPUT';
            this.log('animation_skipped', this.current?.id);
            return; // Double-tap: wait for second press
        }

        // State: WAITING_FOR_INPUT - Close dialogue (second tap)
        if (this.state === 'WAITING_FOR_INPUT') {
            this.closeCurrentDialogue();
            return;
        }

        // State: WAITING_FOR_CHOICE - Should not reach here (handled in handleInput)
        if (this.state === 'WAITING_FOR_CHOICE') {
            console.error('[DialogueQueue] BUG: advance() called in WAITING_FOR_CHOICE state - this should be handled by handleInput!');
            return;
        }

        console.warn('[DialogueQueue] Cannot advance - no dialogue showing');
    }

    /**
     * Select a dialogue choice
     * @param {number} index - Choice index
     */
    selectChoice(index) {
        console.log(`[DialogueQueue] selectChoice(${index}) called, state=${this.state}, current=${!!this.current}`);

        if (this.state !== 'WAITING_FOR_CHOICE') {
            console.warn('[DialogueQueue] selectChoice: Not in choice state, aborting');
            return;
        }

        if (!this.current || !this.current.choices) {
            console.error('[DialogueQueue] selectChoice: No current dialogue or choices!');
            return;
        }

        const choice = this.current.choices[index];
        if (!choice) {
            console.warn(`[DialogueQueue] selectChoice: Invalid choice index ${index}, only have ${this.current.choices.length} choices`);
            return;
        }

        console.log(`[DialogueQueue] selectChoice: Executing choice "${choice.text}"`);

        this.log('choice_selected', { dialogue: this.current.id, choice: index });
        this.emit('choice', choice, this.current.id, index);

        // If choice has trigger, emit it
        if (choice.trigger) {
            console.log(`[DialogueQueue] selectChoice: Emitting trigger ${choice.trigger}`);
            this.emit('trigger:' + choice.trigger, choice, this.current.id);
        }

        // If choice has action callback (old pattern), execute it
        if (choice.action && typeof choice.action === 'function') {
            console.log(`[DialogueQueue] selectChoice: Executing choice action function`);
            choice.action();
        }

        // Close current dialogue and process next
        console.log(`[DialogueQueue] selectChoice: Closing dialogue and processing next`);
        this.closeCurrentDialogue();
    }

    /**
     * Clear entire queue and current dialogue
     */
    clear() {
        this._queue = [];
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
            queueLength: this._queue.length,
            queuePreview: this._queue.slice(0, 3).map(d => ({
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
        console.log(`[DialogueQueue] Registered listener for '${event}' (total: ${this.listeners[event].length})`);
    }

    off(event, handler) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }

    emit(event, ...args) {
        this.log('event', { event, args });

        if (this.listeners[event]) {
            console.log(`[DialogueQueue] >>>>>> Emitting ${event} to ${this.listeners[event].length} handler(s)`);
            this.listeners[event].forEach((handler, index) => {
                console.log(`[DialogueQueue] >>>>>> Handler ${index + 1} type:`, typeof handler, 'is function:', typeof handler === 'function');
                try {
                    console.log(`[DialogueQueue] >>>>>> Calling handler ${index + 1} for ${event}`);
                    const result = handler(...args);
                    console.log(`[DialogueQueue] >>>>>> Handler ${index + 1} returned:`, result);
                    console.log(`[DialogueQueue] >>>>>> Handler ${index + 1} completed successfully`);
                } catch (error) {
                    console.error(`[DialogueQueue] !!!!! ERROR in ${event} handler ${index + 1}:`);
                    console.error('!!!!! Error message:', error?.message);
                    console.error('!!!!! Error type:', error?.constructor?.name);
                    console.error('!!!!! Full error:', error);
                    if (error?.stack) {
                        console.error('!!!!! Stack trace:', error.stack);
                    }
                }
            });
            console.log(`[DialogueQueue] >>>>>> All handlers for ${event} completed`);
        } else {
            console.log(`[DialogueQueue] No listeners registered for ${event}`);
        }
    }

    // ========================================================================
    // INTERNAL QUEUE PROCESSING
    // ========================================================================

    processNext() {
        if (this.verboseLogging) {
            console.log(`[DialogueQueue] processNext called, queue length: ${this._queue.length}, current state: ${this.state}`);
        }
        if (this._queue.length === 0) {
            this.state = 'IDLE';
            this.emit('queue_empty');
            this.log('queue_empty');
            console.log('[CHOICE DEBUG] ❌ Queue empty, state now IDLE (no dialogue to show)');
            return;
        }

        // Performance tracking (industry standard: <100ms response time)
        const startTime = performance.now();

        this.current = this._queue.shift();
        if (this.verboseLogging) {
            console.log('[DialogueQueue] Starting dialogue:', this.current.text?.substring(0, 50));
        }

        // Initialize typewriter animation
        this.fullText = this.current.text || '';
        this.textIndex = 0;
        this.currentText = '';
        this.lastTypewriterUpdate = performance.now();

        // FSM: Track visit count for this dialogue state
        const stateKey = this.getDialogueStateKey(this.current);
        const visitCount = (this.visitCounts.get(stateKey) || 0) + 1;
        this.visitCounts.set(stateKey, visitCount);

        // Warn about potential infinite loops (industry best practice)
        if (visitCount > this.maxVisitsBeforeWarning) {
            console.warn(`[DialogueQueue] WARNING: Dialogue state "${stateKey}" shown ${visitCount} times - potential infinite loop!`);
        }

        this.log('started', this.current.id);
        this.emit('started', this.current.id, this.current);

        // Show in UI (if not headless)
        console.log(`[CHOICE DEBUG] ⚡⚡⚡ BEFORE showUI, current.choices=${!!this.current.choices}, headless=${this.headless}`);
        if (!this.headless) {
            console.log(`[CHOICE DEBUG] ⚡⚡⚡ CALLING showUI now`);
            this.showUI(this.current);
            console.log(`[CHOICE DEBUG] ⚡⚡⚡ RETURNED from showUI`);
        }

        // If has choices, skip animation and go straight to choice state
        console.log(`[CHOICE DEBUG] ⚡ processNext checking choices: current.choices=${!!this.current.choices}, length=${this.current.choices?.length}`);
        if (this.current.choices && this.current.choices.length > 0) {
            console.log(`[CHOICE DEBUG] ⚡ ENTERING choice branch (has ${this.current.choices.length} choices)`);
            // Skip typewriter for choices (prevents A-button confusion)
            this.textIndex = this.fullText.length;
            this.currentText = this.fullText;
            if (this.ui && this.ui.content) {
                this.ui.content.textContent = this.currentText;
            }

            console.log(`[CHOICE DEBUG] ⚡ About to set state to WAITING_FOR_CHOICE (current state: ${this.state})`);
            this.state = 'WAITING_FOR_CHOICE';
            console.log(`[CHOICE DEBUG] ⚡ State is now: ${this.state}`);
            this.log('waiting_for_choice', this.current.id);
            console.log(`[CHOICE DEBUG] ✓ State set to WAITING_FOR_CHOICE for ${this.current.choices.length} choices`);
            console.log(`[CHOICE DEBUG] Current dialogue:`, this.current.text);
            console.log(`[CHOICE DEBUG] Choices:`, this.current.choices.map(c => c.text));

            // Auto-select if only one choice (quest menu pattern)
            if (this.current.choices.length === 1) {
                // Small delay to allow UI to render
                setTimeout(() => this.selectChoice(0), 50);
            }
        } else {
            // Start typewriter animation
            this.state = 'ANIMATING';
        }

        // Performance benchmark (<100ms is target)
        const responseTime = performance.now() - startTime;
        if (responseTime > 100) {
            console.warn(`[DialogueQueue] PERFORMANCE: Dialogue start took ${responseTime.toFixed(2)}ms (target: <100ms)`);
        }
    }

    /**
     * Generate unique state key for FSM tracking
     * @param {Object} dialogue - Dialogue object
     * @returns {string} State key
     */
    getDialogueStateKey(dialogue) {
        // Combine speaker + plot phase + text snippet for unique state
        const speaker = dialogue.speaker || 'unknown';
        const phase = this.game.plotPhase || 'none';
        const textSnippet = (dialogue.text || '').substring(0, 30);
        return `${speaker}_${phase}_${textSnippet}`;
    }

    closeCurrentDialogue() {
        if (this.verboseLogging) {
            console.log('[DialogueQueue] closeCurrentDialogue called, state:', this.state);
        }
        if (!this.current) {
            console.warn('[DialogueQueue] No current dialogue to close');
            return;
        }

        const closedDialogue = this.current;
        if (this.verboseLogging) {
            console.log('[DialogueQueue] Closing dialogue:', closedDialogue.text?.substring(0, 50));
        }
        this.log('closed', closedDialogue.id);

        // Emit trigger if specified
        if (closedDialogue.trigger) {
            const triggerName = 'trigger:' + closedDialogue.trigger;
            console.log('[DialogueQueue] Emitting trigger:', closedDialogue.trigger, '>>> CODE VERSION: LATEST');
            const listenerCount = this.listeners[triggerName]?.length || 0;
            console.log('[DialogueQueue] Listeners for', triggerName, ':', listenerCount);
            try {
                this.emit(triggerName, closedDialogue);
                console.log('[DialogueQueue] Trigger emitted successfully');
            } catch (error) {
                console.error('[DialogueQueue] Error in trigger handler:', error);
            }
        }

        console.log('[DialogueQueue] About to emit closed event');
        // Emit closed event
        try {
            this.emit('closed', closedDialogue.id, closedDialogue);
            console.log('[DialogueQueue] Closed event emitted');
        } catch (error) {
            console.error('[DialogueQueue] Error in closed handler:', error);
        }

        console.log('[DialogueQueue] About to hide UI and process next');
        // Clear current and hide UI
        this.current = null;
        if (!this.headless) {
            this.hideUI();
        }

        // Process next dialogue in queue
        if (this.verboseLogging) {
            console.log('[DialogueQueue] About to call processNext from closeCurrentDialogue');
        }
        this.processNext();
    }

    // ========================================================================
    // UI RENDERING
    // ========================================================================

    showUI(dialogue) {
        if (!this.ui) return;

        if (this.verboseLogging) {
            console.log('[DialogueQueue] showUI() called');
            console.log('  dialogue.text:', dialogue.text?.substring?.(0, 50));
            console.log('  dialogue.choices:', dialogue.choices ? `${dialogue.choices.length} choices` : 'none');
            console.log('  this.ui.choices:', this.ui.choices ? 'exists' : 'NULL!!!');
        }

        // Set speaker
        if (this.ui.speaker) {
            this.ui.speaker.textContent = dialogue.speaker || '???';
        }

        // Initialize text (empty for animation, or full for choices)
        if (this.ui.content) {
            // If this dialogue has choices, show full text immediately
            // Otherwise, start empty and let typewriter animate it
            if (dialogue.choices && dialogue.choices.length > 0) {
                this.ui.content.textContent = dialogue.text;
            } else {
                this.ui.content.textContent = ''; // Typewriter will fill this
            }
        }

        // Render choices
        if (dialogue.choices && this.ui.choices) {
            this.selectedChoiceIndex = 0; // Reset to first choice
            if (this.verboseLogging) {
                console.log(`[DialogueQueue] Rendering ${dialogue.choices.length} choices:`);
                dialogue.choices.forEach((choice, i) => console.log(`  ${i}: ${choice.text}`));
            }

            const html = dialogue.choices.map((choice, index) =>
                `<div class="choice ${index === this.selectedChoiceIndex ? 'selected' : ''}" data-index="${index}">
                    ${choice.text}
                </div>`
            ).join('');
            this.ui.choices.innerHTML = html;

            if (this.verboseLogging) {
                console.log(`[DialogueQueue] Choices HTML rendered, state: ${this.state}`);
            }
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

    /**
     * Update choice highlight when arrow keys navigate
     * Called when selectedChoiceIndex changes
     */
    updateChoiceHighlight() {
        if (!this.ui || !this.ui.choices) return;

        const choiceElements = this.ui.choices.querySelectorAll('.choice');
        choiceElements.forEach((el, index) => {
            if (index === this.selectedChoiceIndex) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    }

    // ========================================================================
    // INPUT HANDLING - Used by InputRouter
    // ========================================================================

    /**
     * Handle input from InputRouter
     * Called in priority order - dialogue has highest priority (100)
     *
     * @param {Object} input - Input object from router
     * @param {string} input.key - Key that was pressed
     * @param {Function} input.consume - Call to prevent lower-priority handlers from seeing this input
     */
    handleInput(input) {
        console.log(`[DialogueQueue] handleInput: key='${input.key}', state='${this.state}'`);

        // Only handle input when dialogue is active
        if (this.state === 'IDLE') {
            return; // Don't consume - let game handle it
        }

        // CRITICAL: Handle choice selection FIRST before anything else
        if (this.state === 'WAITING_FOR_CHOICE') {
            console.log(`[DialogueQueue] In WAITING_FOR_CHOICE state, handling choice input`);
            const numChoices = this.current?.choices?.length || 0;

            // Arrow keys navigate choices
            if (input.key === 'ArrowUp') {
                this.selectedChoiceIndex = (this.selectedChoiceIndex - 1 + numChoices) % numChoices;
                this.updateChoiceHighlight();
                input.consume();
                return;
            }

            if (input.key === 'ArrowDown') {
                this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % numChoices;
                this.updateChoiceHighlight();
                input.consume();
                return;
            }

            // A button or Enter confirms selection
            if (input.key === 'a' || input.key === 'A' || input.key === ' ' || input.key === 'Enter') {
                console.log(`[DialogueQueue] Selecting choice ${this.selectedChoiceIndex}`);
                try {
                    console.log(`[DialogueQueue] About to call this.selectChoice(${this.selectedChoiceIndex})`);
                    console.log(`[DialogueQueue] this.selectChoice exists: ${typeof this.selectChoice === 'function'}`);
                    this.selectChoice(this.selectedChoiceIndex);
                    console.log(`[DialogueQueue] selectChoice returned successfully`);
                } catch (error) {
                    console.error(`[DialogueQueue] ERROR calling selectChoice:`, error);
                    console.error(`[DialogueQueue] Error stack:`, error.stack);
                }
                input.consume();
                return;
            }

            // Consume all other input when in choice mode
            input.consume();
            return;
        }

        // Handle advancing dialogue (animation or waiting for input)
        if (this.state === 'ANIMATING' || this.state === 'WAITING_FOR_INPUT') {
            if (input.key === 'a' || input.key === 'A' || input.key === ' ' || input.key === 'Enter') {
                this.advance();
                input.consume();
                return;
            }
        }

        // Consume any other input while dialogue is active
        input.consume();
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
