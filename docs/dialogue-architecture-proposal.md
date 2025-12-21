# Dialogue Architecture Proposal

## Problem Statement

The current dialogue system is fragile and prone to regressions:

1. **Callback Hell**: onClose handlers call new dialogues, creating complex chains
2. **State Race Conditions**: Multiple state flags (game.state, dialogue.active) fall out of sync
3. **Implicit Control Flow**: Hard to trace what happens when dialogue ends
4. **Mixed Concerns**: Dialogue UI, game logic, and quest updates are intertwined
5. **Hard to Test**: Can't test dialogue flows without full game state
6. **Not Scalable**: Each new dialogue type requires careful state management

**Root Cause**: We're using callbacks to sequence dialogues, which creates timing dependencies and makes control flow implicit.

---

## Proposed Architecture: Event-Driven Dialogue Queue

### Core Principles

1. **Single Queue**: All dialogues queued and processed sequentially (FIFO)
2. **Events Not Callbacks**: System emits events, game logic listens
3. **Declarative Flows**: Dialogue sequences defined as data
4. **Clear Separation**: UI layer, dialogue layer, game logic layer
5. **Testable**: Each layer independently testable

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GAME LOGIC LAYER                     │
│  (Handles events, makes decisions, queues dialogues)   │
└────────────────────┬────────────────────────────────────┘
                     │ events ↑
                     ↓ commands
┌─────────────────────────────────────────────────────────┐
│                  DIALOGUE QUEUE SYSTEM                  │
│  - Queue of dialogue requests (FIFO)                    │
│  - Processes one at a time                              │
│  - Emits events (started, advanced, closed, choice)     │
└────────────────────┬────────────────────────────────────┘
                     │ render ↓
                     ↑ input events
┌─────────────────────────────────────────────────────────┐
│                   DIALOGUE UI LAYER                     │
│  (Renders dialogue box, handles typewriter, choices)   │
└─────────────────────────────────────────────────────────┘
```

---

## API Design

### 1. Queue Dialogues (not execute immediately)

```javascript
// Instead of startDialogue() which executes immediately
// Queue dialogues that will be processed in order

game.dialogue.queue({
    text: "Hello, traveler.",
    speaker: "Marlowe"
});

game.dialogue.queue({
    text: "What brings you here?",
    speaker: "Marlowe",
    choices: [
        { text: "Just exploring", next: "exploring_branch" },
        { text: "Looking for work", next: "work_branch" }
    ]
});
```

### 2. Listen to Events (not callbacks)

```javascript
// Game logic listens to events
game.dialogue.on('closed', (dialogueId) => {
    // Decide what to do based on game state
    if (game.justCompletedQuestStep) {
        game.questSystem.advanceQuestStep();
    }
});

game.dialogue.on('choice', (choiceId, dialogueId) => {
    // Handle choice
    if (choiceId === 'accept_quest') {
        game.questSystem.startQuest('fishing_crates');
    }
});
```

### 3. Declarative Dialogue Flows

```javascript
// Define entire dialogue trees as data
const DIALOGUE_FLOWS = {
    marlowe_wake_up: {
        type: 'sequence',
        dialogues: [
            { id: 'wake_1', text: "You're awake. Good.", speaker: "Marlowe" },
            { id: 'wake_2', text: "The lighthouse needs a keeper.", speaker: "Marlowe" },
            {
                id: 'wake_3',
                text: "Will you help?",
                speaker: "Marlowe",
                choices: [
                    { text: "Yes", trigger: 'quest:accept_lighthouse' },
                    { text: "No", trigger: 'quest:reject_lighthouse' }
                ]
            }
        ]
    }
};

// Execute entire flow
game.dialogue.queueFlow('marlowe_wake_up');
```

### 4. Clear State Management

```javascript
// Single source of truth
class DialogueQueueSystem {
    constructor() {
        this.queue = [];           // Pending dialogues
        this.current = null;       // Currently showing dialogue
        this.state = 'IDLE';       // IDLE | SHOWING | WAITING_FOR_CHOICE
    }

    enqueue(dialogue) {
        this.queue.push(dialogue);
        if (this.state === 'IDLE') {
            this.processNext();
        }
    }

    processNext() {
        if (this.queue.length === 0) {
            this.state = 'IDLE';
            this.emit('queue_empty');
            return;
        }

        this.current = this.queue.shift();
        this.state = 'SHOWING';
        this.ui.show(this.current);
        this.emit('dialogue_started', this.current.id);
    }

    advance() {
        if (this.state === 'SHOWING') {
            this.emit('dialogue_closed', this.current.id);
            this.current = null;
            this.processNext();  // Process next in queue
        }
    }
}
```

---

## Migration Strategy

### Phase 1: Add Queue System (non-breaking)
- Implement DialogueQueueSystem alongside existing system
- Keep old system working
- Add feature flag: `USE_QUEUE_SYSTEM = false`

### Phase 2: Migrate Critical Paths
- Convert creature encounter to use queue system
- Convert quest completion dialogues
- Verify no regressions

### Phase 3: Full Migration
- Convert all NPCs to use queue system
- Remove old callback-based system
- Enable queue system by default

### Phase 4: Add Declarative Flows
- Define dialogue flows as data structures
- Build flow interpreter
- Convert complex dialogue trees to declarative format

---

## Benefits

### 1. **No More Race Conditions**
Queue ensures one dialogue at a time, no overlapping state changes.

### 2. **Testable**
```javascript
// Test dialogue flow without UI
const queue = new DialogueQueueSystem({ headless: true });
queue.enqueue({ text: "First" });
queue.enqueue({ text: "Second" });

queue.on('dialogue_started', (id) => {
    console.log('Started:', id);
});

queue.advance(); // "Started: First"
queue.advance(); // "Started: Second"
```

### 3. **Debuggable**
```javascript
// See entire dialogue queue at any time
console.log(game.dialogue.queue);
// See current dialogue state
console.log(game.dialogue.current);
// See event history
console.log(game.dialogue.eventLog);
```

### 4. **Scalable**
Adding new dialogue types is just adding data, not complex state management.

### 5. **Replayable**
```javascript
// Record dialogue choices for replay/testing
const transcript = game.dialogue.getTranscript();
game.dialogue.replay(transcript);
```

---

## Example: Creature Encounter (Old vs New)

### Old (Callback Hell)
```javascript
showCreatureNarrative("Something small is huddled...", () => {
    showCreatureNarrative("It's shivering...", () => {
        showCreatureNarrative("It sees you and tenses...", () => {
            showCreatureChoice();
        });
    });
});
```

### New (Queue-Based)
```javascript
game.dialogue.queueFlow({
    id: 'creature_encounter',
    dialogues: [
        { text: "Something small is huddled between the rocks." },
        { text: "It's shivering. One of its wings is tucked at a strange angle." },
        { text: "It sees you and tenses, ready to flee." },
        {
            text: "What do you do?",
            choices: [
                { text: "Approach slowly", trigger: 'creature:approach_slow' },
                { text: "Stay still and wait", trigger: 'creature:wait' },
                { text: "Try to grab it quickly", trigger: 'creature:grab' }
            ]
        }
    ]
});

game.on('trigger:creature:approach_slow', () => {
    game.dialogue.queueFlow('creature_approach_slow_path');
});
```

---

## Example: Quest Completion (Old vs New)

### Old (Race Condition)
```javascript
game.dialogueSystem.startDialogue(
    ["Correct! The records have been updated."],
    null,
    () => {
        if (game.activeQuest.currentStep >= game.activeQuest.quest.steps.length) {
            game.questSystem.completeQuest();
        } else {
            game.questSystem.advanceQuestStep();
        }
    }
);
```

### New (Event-Driven)
```javascript
game.dialogue.queue({
    text: "Correct! The records have been updated.",
    trigger: 'quest:step_completed'
});

game.on('trigger:quest:step_completed', () => {
    if (game.activeQuest.currentStep >= game.activeQuest.quest.steps.length) {
        game.questSystem.completeQuest();
    } else {
        game.questSystem.advanceQuestStep();
    }
});
```

---

## Implementation Checklist

- [ ] Create DialogueQueueSystem class
- [ ] Implement event emitter pattern
- [ ] Build dialogue queue (FIFO)
- [ ] Add state machine (IDLE → SHOWING → WAITING_FOR_CHOICE)
- [ ] Implement UI layer separation
- [ ] Add event listeners (closed, choice, queue_empty)
- [ ] Create flow interpreter for declarative flows
- [ ] Add debugging tools (inspect queue, view state, event log)
- [ ] Write unit tests for queue system
- [ ] Write integration tests for dialogue flows
- [ ] Migrate creature encounter
- [ ] Migrate quest completions
- [ ] Migrate NPC dialogues
- [ ] Remove old system
- [ ] Update golden tests

---

## Alternative Considered: Async/Await

Could also use async/await for sequential dialogues:

```javascript
async function creatureEncounter() {
    await game.dialogue.show("Something small is huddled...");
    await game.dialogue.show("It's shivering...");
    const choice = await game.dialogue.showChoice("What do you do?", [
        "Approach slowly",
        "Stay still",
        "Grab it"
    ]);

    if (choice === 0) {
        await creatureApproachSlow();
    }
}
```

**Pros**: Familiar pattern, reads sequentially
**Cons**: Still uses promises (callback-like), harder to inspect/debug, no declarative format

**Recommendation**: Queue-based is better for games because:
- Can inspect entire dialogue queue at runtime
- Can pause/resume/replay
- Easier to integrate with save/load system
- Declarative flows are more designer-friendly

---

## Recommendation

**Start with Phase 1**: Implement DialogueQueueSystem alongside existing system with a feature flag. This lets us:
1. Test the new system without breaking existing code
2. Migrate incrementally
3. Compare old vs new behavior
4. Roll back if needed

Once proven stable, proceed with full migration.
