# Migration Example: Creature Encounter

This document shows exactly how to migrate the creature encounter from callback-based to queue-based dialogue.

---

## Current Implementation (Callback Hell)

### game.js - Current Code

```javascript
handleCreatureInteraction() {
    this.creatureEncounter = {
        stage: 'introduction',
        choice: null,
        creatureName: '',
        active: true
    };

    // Show first narrative sequence - CALLBACK HELL STARTS HERE
    this.showCreatureNarrative("Something small is huddled between the rocks.", () => {
        this.showCreatureNarrative("It's shivering. One of its wings is tucked at a strange angle.", () => {
            this.showCreatureNarrative("It sees you and tenses, ready to flee.", () => {
                this.showCreatureChoice();  // Finally show choices after 3 levels of nesting
            });
        });
    });
}

showCreatureNarrative(text, onContinue) {
    // Don't use single choices for narrative - they auto-advance instantly!
    // Instead, use onClose handler so player can read the story
    this.startDialogue([text], null, onContinue);
}

showCreatureChoice() {
    this.startDialogue(["What do you do?"], [
        {
            text: "Approach slowly",
            action: () => this.handleCreatureChoice('slow')
        },
        {
            text: "Stay still and wait",
            action: () => this.handleCreatureChoice('wait')
        },
        {
            text: "Try to grab it quickly",
            action: () => this.handleCreatureChoice('grab')
        }
    ]);
}

handleCreatureChoice(choice) {
    this.creatureEncounter.choice = choice;

    if (choice === 'slow') {
        // MORE CALLBACK HELL
        this.showCreatureNarrative("You take a slow step forward. It watches you but doesn't run.", () => {
            this.showCreatureNarrative("Another step. It makes a small sound—not fear. Something else.", () => {
                this.showCreatureNarrative("You kneel down. It hesitates... then hops toward you.", () => {
                    this.finishCreatureEncounter();
                });
            });
        });
    } else if (choice === 'wait') {
        // EVEN MORE CALLBACK HELL
        this.showCreatureNarrative("You sit down on the rocks and wait.", () => {
            this.showCreatureNarrative("Minutes pass. The creature watches you.", () => {
                this.showCreatureNarrative("Eventually, curiosity wins. It inches closer, closer...", () => {
                    this.showCreatureNarrative("It stops just out of reach, but it's not afraid anymore.", () => {
                        this.finishCreatureEncounter();
                    });
                });
            });
        });
    } else if (choice === 'grab') {
        // YET MORE CALLBACK HELL
        this.showCreatureNarrative("You lunge forward. The creature bolts.", () => {
            this.showCreatureNarrative("It scrambles over the rocks, injured wing dragging.", () => {
                this.showCreatureNarrative("But it doesn't get far. It's too hurt.", () => {
                    this.showCreatureNarrative("You approach more carefully this time. It has no choice but to let you.", () => {
                        this.finishCreatureEncounter();
                    });
                });
            });
        });
    }
}
```

**Problems:**
- 13 levels of callback nesting
- Hard to read (where does each branch end?)
- Hard to test (must simulate exact sequence of A presses)
- Race conditions when callbacks trigger new dialogues
- Can't inspect dialogue queue
- Can't debug "which callback didn't fire?"

---

## New Implementation (Queue-Based)

### game.js - New Code

```javascript
handleCreatureInteraction() {
    this.creatureEncounter = {
        stage: 'introduction',
        choice: null,
        creatureName: '',
        active: true
    };

    // Queue the introduction flow
    this.dialogue.queueFlow({
        id: 'creature_intro',
        dialogues: [
            { text: "Something small is huddled between the rocks." },
            { text: "It's shivering. One of its wings is tucked at a strange angle." },
            { text: "It sees you and tenses, ready to flee." },
            {
                text: "What do you do?",
                choices: [
                    { text: "Approach slowly", trigger: 'creature_choice_slow' },
                    { text: "Stay still and wait", trigger: 'creature_choice_wait' },
                    { text: "Try to grab it quickly", trigger: 'creature_choice_grab' }
                ]
            }
        ]
    });
}

// Listen to choice events (set up once in game initialization)
setupCreatureEncounterListeners() {
    this.dialogue.on('trigger:creature_choice_slow', () => {
        this.creatureEncounter.choice = 'slow';
        this.dialogue.queueFlow(CREATURE_FLOWS.slow);
    });

    this.dialogue.on('trigger:creature_choice_wait', () => {
        this.creatureEncounter.choice = 'wait';
        this.dialogue.queueFlow(CREATURE_FLOWS.wait);
    });

    this.dialogue.on('trigger:creature_choice_grab', () => {
        this.creatureEncounter.choice = 'grab';
        this.dialogue.queueFlow(CREATURE_FLOWS.grab);
    });

    // When any path completes, finish encounter
    this.dialogue.on('trigger:creature_path_complete', () => {
        this.finishCreatureEncounter();
    });
}
```

### data.js - Flow Definitions

```javascript
const CREATURE_FLOWS = {
    slow: {
        id: 'creature_slow',
        dialogues: [
            { text: "You take a slow step forward. It watches you but doesn't run." },
            { text: "Another step. It makes a small sound—not fear. Something else." },
            { text: "You kneel down. It hesitates... then hops toward you.", trigger: 'creature_path_complete' }
        ]
    },

    wait: {
        id: 'creature_wait',
        dialogues: [
            { text: "You sit down on the rocks and wait." },
            { text: "Minutes pass. The creature watches you." },
            { text: "Eventually, curiosity wins. It inches closer, closer..." },
            { text: "It stops just out of reach, but it's not afraid anymore.", trigger: 'creature_path_complete' }
        ]
    },

    grab: {
        id: 'creature_grab',
        dialogues: [
            { text: "You lunge forward. The creature bolts." },
            { text: "It scrambles over the rocks, injured wing dragging." },
            { text: "But it doesn't get far. It's too hurt." },
            { text: "You approach more carefully this time. It has no choice but to let you.", trigger: 'creature_path_complete' }
        ]
    }
};
```

**Benefits:**
- No nesting - flat structure
- Easy to read - each flow is separate
- Easy to test - just check queue contents
- No race conditions - queue processes sequentially
- Can inspect queue at any time
- Can debug by checking event log
- Can modify flows without touching code (just edit data)

---

## Testing Comparison

### Old System - Hard to Test

```javascript
// How would you even test this?
test('Creature encounter shows all narratives', async () => {
    const game = new Game();
    game.handleCreatureInteraction();

    // ??? How do we wait for typewriter
    // ??? How do we simulate A button press
    // ??? How do we check if next narrative started
    // ??? This is basically impossible
});
```

### New System - Easy to Test

```javascript
test('Creature intro queues 4 dialogues', () => {
    const game = new Game({ headless: true });
    game.handleCreatureInteraction();

    assert.equal(game.dialogue.queue.length, 4);
    assert.equal(game.dialogue.queue[0].text, "Something small is huddled...");
    assert.equal(game.dialogue.queue[3].choices.length, 3);
});

test('Slow path queues 3 narratives', () => {
    const game = new Game({ headless: true });

    // Trigger slow path
    game.dialogue.emit('trigger:creature_choice_slow');

    assert.equal(game.dialogue.queue.length, 3);
    assert.equal(game.dialogue.queue[0].text, "You take a slow step forward...");
});

test('Slow path emits completion trigger', () => {
    const game = new Game({ headless: true });
    const events = [];

    game.dialogue.on('trigger:creature_path_complete', () => {
        events.push('complete');
    });

    game.dialogue.queueFlow(CREATURE_FLOWS.slow);

    // Simulate player advancing through all dialogues
    game.dialogue.advance(); // 1st narrative
    game.dialogue.advance(); // 2nd narrative
    game.dialogue.advance(); // 3rd narrative

    assert.deepEqual(events, ['complete']);
});
```

---

## Debugging Comparison

### Old System - Mystery Bug

```
Developer: "Player says creature encounter freezes after 'It sees you and tenses'"
Developer: *adds 20 console.logs*
Developer: *tries to reproduce*
Developer: *can't tell which callback didn't fire*
Developer: *cries*
```

### New System - Clear Debug

```javascript
// Player reports freeze
Developer: > game.dialogue.debug()

{
    state: 'SHOWING',
    current: {
        id: 'creature_intro_2',
        text: 'It sees you and tenses, ready to flee.'
    },
    queueLength: 1,
    queuePreview: [
        { id: 'creature_intro_3', text: 'What do you do?...' }
    ],
    recentEvents: [
        { type: 'started', data: 'creature_intro_2', time: 1234 },
        // No 'closed' event - player never pressed A!
    ]
}

Developer: "Ah! The A button handler isn't working. Let me check input system."
```

---

## Migration Steps

### Step 1: Add DialogueQueueSystem to Game

```javascript
// In game.js constructor
constructor(config = {}) {
    // ... existing initialization ...

    // Add new queue system
    this.dialogueQueue = new DialogueQueueSystem(this, { headless: config.headless });

    // Feature flag - can switch between old and new
    this.USE_QUEUE_SYSTEM = config.useQueueSystem || false;

    // Alias for convenience
    if (this.USE_QUEUE_SYSTEM) {
        this.dialogue = this.dialogueQueue;
    }
}
```

### Step 2: Set Up Event Listeners

```javascript
// In game.js initialization
init() {
    // ... existing init ...

    if (this.USE_QUEUE_SYSTEM) {
        this.setupCreatureEncounterListeners();
    }
}

setupCreatureEncounterListeners() {
    // See implementation above
}
```

### Step 3: Convert handleCreatureInteraction

```javascript
handleCreatureInteraction() {
    // ... set up creatureEncounter state ...

    if (this.USE_QUEUE_SYSTEM) {
        // New queue-based version
        this.dialogue.queueFlow({
            id: 'creature_intro',
            dialogues: [/* ... */]
        });
    } else {
        // Old callback-based version (keep for now)
        this.showCreatureNarrative("Something small...", () => {
            // ... existing code ...
        });
    }
}
```

### Step 4: Test Both Systems

```javascript
// Test old system still works
const oldGame = new Game({ useQueueSystem: false });
oldGame.handleCreatureInteraction();
// Manual test: verify it works

// Test new system
const newGame = new Game({ useQueueSystem: true });
newGame.handleCreatureInteraction();
// Manual test: verify it works the same

// Run automated tests
npm test
```

### Step 5: Switch Flag to True

```javascript
// Once confident, flip the default
this.USE_QUEUE_SYSTEM = config.useQueueSystem !== false; // Default true
```

### Step 6: Remove Old Code

```javascript
// After everything works, delete old implementation
// Remove showCreatureNarrative, showCreatureChoice, etc.
// Clean up callback-based code
```

---

## Estimated Time

- DialogueQueueSystem implementation: **Already done!** (see src/dialogueQueueSystem.js)
- Creature encounter migration: **30 minutes**
- Testing: **30 minutes**
- Total: **1 hour**

---

## Risk Assessment

**Risk**: Low
- Old system still works (feature flag)
- Can test both side-by-side
- Can rollback instantly
- Only affects creature encounter initially

**Confidence**: High
- Queue system is well-tested pattern
- Clear migration path
- Easy to debug
- Incremental approach

---

## Next Steps

1. Review this proposal
2. Approve migration approach
3. Implement creature encounter migration
4. Test thoroughly
5. If successful, migrate quest dialogues
6. If successful, migrate all NPCs
7. Remove old system

**Ready to start?**
