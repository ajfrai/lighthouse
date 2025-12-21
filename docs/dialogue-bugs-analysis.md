# Dialogue System Bugs: Root Cause Analysis

This document traces the bugs we've encountered and shows how the proposed queue-based architecture would prevent them.

---

## Bug #1: Creature Encounter Auto-Skips Story

### What Happened
First narrative "Something small is huddled..." appeared but immediately skipped to naming screen.

### Root Cause (Attempt 1)
Used single-choice array `[{text: "Continue"}]` for narrative. Single choices auto-advance instantly.

**Fix**: Changed to use `onClose` handler instead of single choice.

### Root Cause (Attempt 2 - Current Session)
The `game.startDialogue()` wrapper didn't accept/pass the `onClose` parameter.

**Fix**: Added `onClose` parameter to wrapper.

### Root Cause (Attempt 3 - Current Session)
When first narrative's `onClose` started second narrative, the first `endDialogue()` continued executing and reset `game.state = EXPLORING`, breaking the second narrative.

**Fix**: Added early return check in `endDialogue()` if new dialogue started.

### How Queue Architecture Prevents This

```javascript
// Queue-based: No callbacks, no race conditions
game.dialogue.queueFlow({
    dialogues: [
        { text: "Something small is huddled between the rocks." },
        { text: "It's shivering..." },
        { text: "It sees you and tenses..." }
    ]
});
// System processes one at a time, waits for player input, advances to next
// No callbacks = no race conditions
```

**Why it works**:
- Each dialogue is data in a queue
- System processes strictly one at a time
- No overlapping state changes possible
- Control flow is explicit (FIFO queue)

---

## Bug #2: Quest Menu Freezes After Correct Answer

### What Happened
Player answers math problem correctly, sees "Correct! The records have been updated.", then game freezes.

### Root Cause (Current Session - Not Yet Fixed)
Same as Bug #1 Attempt 3: Quest completion dialogue uses `dialogueSystem.startDialogue()` with `onClose` handler. The handler advances quest step, but `endDialogue()` races with the new state.

```javascript
// Current broken code (src/data.js:320-330)
game.dialogueSystem.startDialogue(
    ["Correct! The records have been updated."],
    null,
    () => {
        // This runs, but then endDialogue() interferes
        if (game.activeQuest.currentStep >= game.activeQuest.quest.steps.length) {
            game.questSystem.completeQuest();
        } else {
            game.questSystem.advanceQuestStep();
        }
    }
);
```

### Current System Problems
1. Quest handler directly calls `dialogueSystem.startDialogue()`
2. onClose callback mixes dialogue and quest logic
3. Quest state changes during dialogue cleanup
4. Hard to debug: where did the freeze happen?

### How Queue Architecture Prevents This

```javascript
// In quest handler (src/data.js)
game.dialogue.queue({
    text: "Correct! The records have been updated.",
    trigger: 'quest:step_completed'
});

// In game initialization (src/game.js)
game.on('trigger:quest:step_completed', () => {
    // Runs AFTER dialogue fully closes
    if (game.activeQuest.currentStep >= game.activeQuest.quest.steps.length) {
        game.questSystem.completeQuest();
    } else {
        game.questSystem.advanceQuestStep();
    }
});
```

**Why it works**:
- Dialogue and quest logic completely separated
- Events fire AFTER dialogue fully closes (queue processed)
- No timing dependencies
- Easy to debug: check event log to see what triggered

---

## Bug #3: Callum "Back for More" After All Quests Complete

### What Happened
After completing all 4 Callum quests, he still says "Back for more? Good. Let's see what we've got today." with no work available.

### Root Cause
Condition only checked `completedCallumsQuests.length > 0` (ANY quests done), not distinguishing between SOME vs ALL complete.

### Fix
Split into two dialogues:
- One for ALL complete (directs to Marlowe)
- One for SOME complete (offers more work)

### How Queue Architecture Helps

```javascript
// Define dialogue tree with clear conditions
const CALLUM_DIALOGUES = {
    all_quests_done: {
        condition: (game) => {
            const done = game.getCompletedCallumsQuests();
            return done.length === 4;
        },
        dialogue: {
            text: "You've finished all my work. Talk to Marlowe.",
            trigger: 'plot:callum_work_complete'
        }
    },
    some_quests_done: {
        condition: (game) => {
            const done = game.getCompletedCallumsQuests();
            return done.length > 0 && done.length < 4;
        },
        dialogue: {
            text: "Back for more? Good.",
            choices: [/* work options */]
        }
    }
};
```

**Why it's better**:
- Conditions are explicit and testable
- Can validate: "Exactly one condition matches for any game state"
- Can visualize dialogue tree
- Can unit test conditions independently

---

## Pattern: The Callback Problem

All three bugs share a root cause: **Callbacks create implicit control flow**.

### Callback-Based (Current)
```javascript
function showNarrative(text, onDone) {
    startDialogue(text, null, () => {
        // What state is game in now?
        // Is dialogue still active?
        // Can I start another dialogue?
        onDone();  // Hope for the best!
    });
}
```

**Problems**:
- Can't inspect what will happen next
- Timing dependencies (when does callback run?)
- State unclear (is dialogue active when callback runs?)
- Hard to test (must mock entire game state)

### Queue-Based (Proposed)
```javascript
function showNarrative(text, nextEvent) {
    game.dialogue.queue({
        text: text,
        trigger: nextEvent
    });
}

game.on(nextEvent, () => {
    // Guaranteed: dialogue is fully closed
    // Guaranteed: game.state is EXPLORING
    // Guaranteed: no other dialogue active
    // Can test: just check event was emitted
});
```

**Benefits**:
- Explicit: can see what's in the queue
- No timing issues: FIFO queue guarantees order
- State clear: dialogue closed before events fire
- Easy to test: mock event emitter, check events

---

## Testing Comparison

### Current System (Hard to Test)
```javascript
// Need full game state, UI, timing
test('Creature encounter advances through narratives', async () => {
    const game = new Game();
    await game.init();
    game.handleCreatureInteraction();

    // How do we simulate A button presses?
    // How do we wait for typewriter?
    // How do we check if second narrative started?
    // This is nearly impossible to test!
});
```

### Queue System (Easy to Test)
```javascript
test('Creature encounter queues 3 narratives', () => {
    const game = new Game({ headless: true });
    game.handleCreatureInteraction();

    // Just check the queue
    assert.equal(game.dialogue.queue.length, 3);
    assert.equal(game.dialogue.queue[0].text, "Something small is huddled...");
    assert.equal(game.dialogue.queue[1].text, "It's shivering...");
    assert.equal(game.dialogue.queue[2].text, "It sees you and tenses...");
});

test('Creature encounter emits correct events', () => {
    const game = new Game({ headless: true });
    const events = [];

    game.dialogue.on('started', (id) => events.push(`started:${id}`));
    game.dialogue.on('closed', (id) => events.push(`closed:${id}`));

    game.handleCreatureInteraction();
    game.dialogue.advance();  // First narrative
    game.dialogue.advance();  // Second narrative
    game.dialogue.advance();  // Third narrative

    assert.deepEqual(events, [
        'started:narrative_1', 'closed:narrative_1',
        'started:narrative_2', 'closed:narrative_2',
        'started:narrative_3', 'closed:narrative_3'
    ]);
});
```

---

## Debugging Comparison

### Current System
```
Player: "Game froze after math problem"
Developer: "Uh... let me add console.logs everywhere and try to reproduce..."
[Adds 20 console.logs]
[Tries to reproduce]
[Can't figure out which callback didn't fire]
```

### Queue System
```
Player: "Game froze after math problem"
Developer: "Let me check the dialogue queue state"

> game.dialogue.debug()
{
    state: 'SHOWING',
    current: { text: "Correct! The records...", trigger: "quest:step_completed" },
    queue: [],
    lastEvent: 'dialogue_started',
    eventLog: [
        { time: 1234, event: 'dialogue_started', id: 'quest_feedback' },
        // Waiting for advance() call
    ]
}

Developer: "Ah, dialogue is stuck in SHOWING state. The A button handler isn't working."
```

---

## Migration Risk Assessment

### Low Risk
- Creature encounter (isolated, no dependencies)
- Quest feedback dialogues (simple, no branches)
- Simple NPC greetings (one dialogue, no choices)

### Medium Risk
- NPC dialogues with choices (need to map choices to triggers)
- Quest menus (currently auto-advance, need to preserve behavior)

### High Risk
- Plot-critical sequences (wake up, meet creature, etc.)
- Complex dialogue trees with branching
- Any dialogue that changes game state

### Recommendation
1. Start with low-risk: creature encounter
2. Prove the pattern works
3. Document migration guide
4. Tackle medium/high risk with confidence

---

## Decision Points

### Should we migrate now or after this island?

**Migrate Now (Recommended)**:
- Every new dialogue adds to technical debt
- Bugs will compound as we add more content
- Easier to migrate 20 dialogues than 200
- Sets us up for success on next island

**Migrate Later**:
- Finish current island with workarounds
- Risk: accumulate more bugs
- Risk: migration becomes harder
- Risk: lose confidence in system

### Should we do full rewrite or incremental?

**Incremental (Recommended)**:
- Add queue system alongside current system
- Feature flag: `USE_QUEUE_SYSTEM = false`
- Migrate piece by piece
- Can rollback if issues
- Less risky

**Full Rewrite**:
- Cleaner final result
- Removes all legacy code
- Risk: breaks everything at once
- Harder to debug issues
- All-or-nothing deployment

---

## Recommendation

**Implement queue-based dialogue system incrementally, starting with creature encounter.**

This gives us:
1. Proof of concept with real code
2. Pattern to follow for other dialogues
3. Ability to compare old vs new side-by-side
4. Confidence before migrating critical paths
5. Escape hatch if it doesn't work

**Estimated effort**:
- DialogueQueueSystem class: 2-3 hours
- Migrate creature encounter: 1 hour
- Migrate quest feedback: 1 hour
- Migrate all NPCs: 3-4 hours
- **Total: ~1 day of work**

**Return**: No more dialogue race conditions, scalable to hundreds of NPCs, testable, debuggable.

Worth it? **Absolutely.**
