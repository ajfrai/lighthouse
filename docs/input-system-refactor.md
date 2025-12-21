# Input System Refactor - Framework-Level Solutions

## Problem
Current system has multiple handlers listening for same input independently:
- DialogueQueueSystem listens for 'a' keydown
- Game.handleKeyPress('Enter') also triggered by A button
- No coordination → race conditions and infinite loops

## Solution 1: Input Router with Priority ✅ RECOMMENDED

Centralized router that processes inputs in priority order and allows "consuming" events.

### Architecture
```javascript
class InputRouter {
    constructor() {
        this.handlers = []; // [{priority, handler, enabled}]
        this.setupListeners();
    }

    register(handler, priority = 0) {
        // Higher priority = processed first
        // Priority levels:
        //   100: Dialogue system
        //   50: Menus
        //   10: Battle system
        //   0: Game exploration/movement
        this.handlers.push({ handler, priority, enabled: true });
        this.handlers.sort((a, b) => b.priority - a.priority);
    }

    setupListeners() {
        document.addEventListener('keydown', (e) => {
            const input = {
                key: e.key,
                code: e.code,
                consumed: false,
                consume: () => { input.consumed = true; }
            };

            // Process handlers in priority order
            for (const {handler, enabled} of this.handlers) {
                if (!enabled) continue;

                handler.handleInput(input);

                // Stop if input was consumed
                if (input.consumed) {
                    e.preventDefault();
                    break;
                }
            }
        });
    }

    setEnabled(handler, enabled) {
        const entry = this.handlers.find(h => h.handler === handler);
        if (entry) entry.enabled = enabled;
    }
}
```

### Usage Example
```javascript
// In game initialization
this.inputRouter = new InputRouter();

// Register handlers with priority
this.inputRouter.register(this.dialogue, 100);  // Highest
this.inputRouter.register(this.menu, 50);
this.inputRouter.register(this, 0);  // Game movement/interact - lowest

// In DialogueQueueSystem
handleInput(input) {
    if (this.state === 'ANIMATING' || this.state === 'WAITING_FOR_INPUT') {
        if (input.key === 'a' || input.key === 'A' || input.key === ' ') {
            this.advance();
            input.consume(); // ✅ Prevents game.interact() from running!
        }
    } else if (this.state === 'WAITING_FOR_CHOICE') {
        if (input.key === 'a' || input.key === 'A') {
            this.selectChoice(0);
            input.consume();
        }
    }
    // If dialogue is IDLE, don't consume - let game handle it
}

// In Game
handleInput(input) {
    // Only processes if dialogue didn't consume input
    if (this.state === GameState.EXPLORING) {
        if (input.key === 'Enter' || input.key === 'a') {
            this.interact();
            input.consume();
        }
    }
}
```

### Benefits
- ✅ Explicit priority order
- ✅ No duplicate handling (consumed inputs stop propagation)
- ✅ Easy to debug (single entry point)
- ✅ Handlers declare if they consumed input
- ✅ Can enable/disable handlers dynamically

---

## Solution 2: Exclusive Input Modes

Use game state to completely disable handlers when not applicable.

### Architecture
```javascript
class Game {
    constructor() {
        this.inputMode = 'EXPLORING'; // EXPLORING | DIALOGUE | MENU | BATTLE
        this.inputHandlers = {
            EXPLORING: this.handleExploringInput.bind(this),
            DIALOGUE: this.dialogue.handleInput.bind(this.dialogue),
            MENU: this.menu.handleInput.bind(this.menu),
            BATTLE: this.battle.handleInput.bind(this.battle)
        };
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            const handler = this.inputHandlers[this.inputMode];
            if (handler) {
                handler(e);
            }
        });
    }

    setInputMode(mode) {
        console.log(`[InputMode] ${this.inputMode} → ${mode}`);
        this.inputMode = mode;
    }
}

// In DialogueQueueSystem
show(dialogue) {
    this.game.setInputMode('DIALOGUE'); // ✅ Exclusively handles input
    // ... show dialogue
}

close() {
    this.game.setInputMode('EXPLORING'); // ✅ Return control to game
    // ... close dialogue
}
```

### Benefits
- ✅ Only ONE handler active at a time
- ✅ Clear state transitions
- ✅ Impossible for multiple handlers to fire
- ❌ Less flexible (can't have background handlers)

---

## Solution 3: Event Bus with Stop Propagation

Use an event bus similar to DOM event system.

### Architecture
```javascript
class InputEventBus {
    constructor() {
        this.listeners = [];
        this.setupNativeListeners();
    }

    on(priority, callback) {
        this.listeners.push({ priority, callback });
        this.listeners.sort((a, b) => b.priority - a.priority);
    }

    setupNativeListeners() {
        document.addEventListener('keydown', (e) => {
            const event = {
                key: e.key,
                code: e.code,
                nativeEvent: e,
                propagationStopped: false,
                stopPropagation: function() {
                    this.propagationStopped = true;
                    e.preventDefault();
                }
            };

            for (const {callback} of this.listeners) {
                callback(event);
                if (event.propagationStopped) break;
            }
        });
    }
}

// Usage
inputBus.on(100, (event) => {
    // Dialogue handler
    if (dialogue.state !== 'IDLE' && event.key === 'a') {
        dialogue.advance();
        event.stopPropagation(); // ✅ Stops here
    }
});

inputBus.on(0, (event) => {
    // Game handler (only runs if dialogue didn't stop propagation)
    if (event.key === 'a') {
        game.interact();
    }
});
```

### Benefits
- ✅ Familiar pattern (like DOM events)
- ✅ Priority support
- ✅ Clean separation
- ❌ More boilerplate than InputRouter

---

## Solution 4: Command Pattern

Decouple input from actions using a command queue.

### Architecture
```javascript
class InputCommandSystem {
    constructor(game) {
        this.game = game;
        this.commandMap = new Map();
        this.registerCommands();
    }

    registerCommands() {
        // Each key maps to a list of potential commands
        this.commandMap.set('a', [
            {
                name: 'advance_dialogue',
                canExecute: () => this.game.dialogue.state !== 'IDLE',
                execute: () => this.game.dialogue.advance(),
                priority: 100
            },
            {
                name: 'interact',
                canExecute: () => this.game.state === GameState.EXPLORING,
                execute: () => this.game.interact(),
                priority: 0
            }
        ]);
    }

    handleKey(key) {
        const commands = this.commandMap.get(key) || [];

        // Sort by priority
        commands.sort((a, b) => b.priority - a.priority);

        // Execute first valid command
        for (const cmd of commands) {
            if (cmd.canExecute()) {
                console.log(`[Command] Executing: ${cmd.name}`);
                cmd.execute();
                return; // ✅ Only ONE command executes
            }
        }
    }
}
```

### Benefits
- ✅ Declarative mapping of input → commands
- ✅ Easy to inspect what each key does
- ✅ Testable (can test commands independently)
- ✅ Rebindable (change key mappings)
- ❌ More complex setup

---

## Comparison Matrix

| Solution | Complexity | Flexibility | Testability | Migration Effort |
|----------|-----------|-------------|-------------|------------------|
| **Input Router** | Low | High | High | Low ✅ |
| **Exclusive Modes** | Very Low | Low | Medium | Low |
| **Event Bus** | Medium | High | High | Medium |
| **Command Pattern** | High | Very High | Very High | High |

## Recommendation

**Use Input Router** (Solution 1) because:
1. ✅ Minimal code changes (add router, update handlers)
2. ✅ Solves the core problem (priority + consumption)
3. ✅ Easy to understand and debug
4. ✅ Works with existing architecture
5. ✅ Can incrementally migrate

**Migration Path:**
1. Create `InputRouter` class
2. Register handlers with priorities
3. Update each handler to use `input.consume()`
4. Remove old `addEventListener` calls
5. Test each system independently

---

## Implementation Checklist

For InputRouter implementation:
- [ ] Create `src/inputRouter.js`
- [ ] Add `handleInput(input)` to DialogueQueueSystem
- [ ] Add `handleInput(input)` to Game
- [ ] Register handlers in game initialization
- [ ] Remove old event listeners
- [ ] Test dialogue → exploring transitions
- [ ] Test menu → exploring transitions
- [ ] Update E2E tests to verify no double-handling

---

## Testing Strategy

### Unit Tests
```javascript
test('Dialogue consumes input and prevents game interaction', () => {
    const router = new InputRouter();
    const dialogue = new DialogueQueueSystem(game);
    const gameMock = { interact: jest.fn() };

    router.register(dialogue, 100);
    router.register(gameMock, 0);

    dialogue.startDialogue(['Test']);

    // Simulate A button press
    router.handleKey('a');

    // Dialogue should advance
    assert(dialogue.state === 'WAITING_FOR_INPUT');

    // Game should NOT interact
    assert(gameMock.interact.callCount === 0);
});
```

### E2E Tests
```javascript
test('A button during dialogue does not trigger interact()', () => {
    game.dialogue.showNPCDialog('marlowe');

    // Track interact() calls
    let interactCalls = 0;
    const originalInteract = game.interact;
    game.interact = function() {
        interactCalls++;
        originalInteract.call(game);
    };

    // Press A button 10 times
    for (let i = 0; i < 10; i++) {
        game.inputRouter.handleKey('a');
    }

    // Should be 0 (dialogue consumed all inputs)
    assert(interactCalls === 0);
});
```

---

## Alternative: Quick Fix Enhancement

If not ready for full refactor, enhance current fix:

```javascript
// In Game class
interact() {
    // Check ALL systems that might be active
    if (this.dialogue.state !== 'IDLE') return;
    if (this.menu.isOpen) return;
    if (this.battle.inBattle) return;

    // Only allow interaction in EXPLORING state
    if (this.state !== GameState.EXPLORING) return;

    // ... rest of interact()
}
```

But this is still a band-aid - **InputRouter is the proper solution**.
