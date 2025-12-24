/**
 * INPUT ROUTER - Centralized input handling with priority
 *
 * Prevents multiple handlers from processing the same input by allowing
 * handlers to "consume" input and stop propagation.
 *
 * Architecture:
 * - Handlers registered with priority (higher = processed first)
 * - Handlers receive input object with consume() method
 * - When input is consumed, lower priority handlers don't see it
 * - Single entry point for all keyboard/gamepad input
 *
 * Priority Levels:
 *   100: Dialogue system (highest - should always handle input when active)
 *   50: Menus/UI overlays
 *   10: Battle system
 *   0: Game exploration/movement (lowest - fallback)
 */

class InputRouter {
    constructor() {
        this.handlers = []; // [{handler, priority, enabled}]
        this.setupListeners();

        console.log('[InputRouter] Initialized');
    }

    /**
     * Register an input handler with priority
     * @param {Object} handler - Object with handleInput(input) method
     * @param {number} priority - Higher priority = processed first
     */
    register(handler, priority = 0) {
        if (!handler.handleInput) {
            console.error('[InputRouter] Handler must have handleInput() method:', handler);
            return;
        }

        this.handlers.push({ handler, priority, enabled: true });

        // Sort by priority (descending)
        this.handlers.sort((a, b) => b.priority - a.priority);

        console.log(`[InputRouter] Registered handler with priority ${priority}`);
    }

    /**
     * Enable or disable a specific handler
     * @param {Object} handler - The handler to enable/disable
     * @param {boolean} enabled - Whether handler should process input
     */
    setEnabled(handler, enabled) {
        const entry = this.handlers.find(h => h.handler === handler);
        if (entry) {
            entry.enabled = enabled;
            console.log(`[InputRouter] Handler ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Push a temporary handler onto the stack (highest priority)
     * @param {Object} handlerDef - Handler definition with handleInput method
     * @returns {InputRouter} this for chaining
     */
    push(handlerDef) {
        if (!handlerDef.handleInput) {
            console.error('[InputRouter] push() requires handleInput method:', handlerDef);
            return this;
        }

        const priority = handlerDef.priority || 100;
        this.handlers.push({ handler: handlerDef, priority, enabled: true });
        this.handlers.sort((a, b) => b.priority - a.priority);

        console.log(`[InputRouter] Pushed temporary handler with priority ${priority}`);
        return this;
    }

    /**
     * Pop the most recently pushed handler
     * @returns {InputRouter} this for chaining
     */
    pop() {
        if (this.handlers.length > 0) {
            const removed = this.handlers.shift();
            console.log(`[InputRouter] Popped handler with priority ${removed.priority}`);
        }
        return this;
    }

    /**
     * Set up native browser event listeners
     * All keyboard events route through here
     */
    setupListeners() {
        document.addEventListener('keydown', (e) => {
            this.routeInput(e);
        });

        console.log('[InputRouter] Listening for keydown events');
    }

    /**
     * Route input to handlers in priority order
     * Stops when a handler consumes the input
     * @param {KeyboardEvent} nativeEvent - Browser keyboard event
     */
    routeInput(nativeEvent) {
        // Create input object that handlers can consume
        const input = {
            key: nativeEvent.key,
            code: nativeEvent.code,
            nativeEvent: nativeEvent,
            consumed: false,
            consume: function() {
                this.consumed = true;
            }
        };

        // Process handlers in priority order
        for (const {handler, priority, enabled} of this.handlers) {
            if (!enabled) continue;

            // Call handler's handleInput method
            handler.handleInput(input);

            // If input was consumed, stop propagation
            if (input.consumed) {
                nativeEvent.preventDefault();
                break;
            }
        }
    }

    /**
     * Get debug info about registered handlers
     * @returns {Array} List of handlers with priority and enabled status
     */
    getDebugInfo() {
        return this.handlers.map(({handler, priority, enabled}) => ({
            name: handler.constructor?.name || 'Unknown',
            priority,
            enabled
        }));
    }
}

// Export for Node.js (testing) and browser (game)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputRouter;
}
