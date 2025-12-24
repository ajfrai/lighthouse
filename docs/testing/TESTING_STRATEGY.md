# Game Testing Strategy

**Version:** 1.0
**Date:** 2025-12-24
**Author:** Testing Agent
**Status:** Proposed

---

## Executive Summary

Current test suite has **31 tests** that check code structure but **miss critical runtime bugs**. The codebase has documented instances where:

- **26 structural tests passed** while dialogue showed `[object Object]` to players
- **Quest completion freezes** after correct answers due to race conditions
- **Dialogue loops** or shows incorrect text based on game state

**Root Cause**: Tests validate that code *exists* but not that it *works correctly* for players.

**Recommendation**: Implement a **4-layer testing pyramid** focusing on runtime behavior, input handling, and state transitions.

---

## Current State Analysis

### What Tests Exist Today

| Layer | Test Count | What They Check | What They Miss |
|-------|-----------|-----------------|----------------|
| Golden Tree Tests | 12 | Dialogue data structure | Text rendering, state transitions |
| Behavior Pattern Tests | 14 | Code patterns used | Actual execution flow |
| Runtime Integration Tests | 5 | Text rendering works | Full dialogue sequences |
| **Total** | **31** | **Architecture only** | **Player experience** |

### Critical Finding

The `[object Object]` bug demonstrates the fundamental problem:

```javascript
// What structural tests verified
✅ dialogueQueueSystem.queue() method exists
✅ dialogue.text property exists
✅ NPCS data structure is valid

// What actually happened in production
❌ DialogueQueueSystem received {speaker, text} but displayed it as "[object Object]"
❌ Players saw broken text
❌ Zero tests caught this before deployment
```

**Lesson**: We need tests that **execute the actual game code** and **validate player-visible output**.

---

## Testing Philosophy

### Shift from "Does it exist?" to "Does it work?"

**Old Approach** (Structural Testing):
```bash
# tests/test-dialogue-structure.sh
grep -q "class DialogueQueueSystem" src/dialogueQueueSystem.js
echo "✓ DialogueQueueSystem class exists"
```

**New Approach** (Runtime Testing):
```javascript
// tests/integration/dialogue-flow.test.js
test('dialogue renders text correctly', () => {
    const game = createTestGame();
    game.dialogue.queue({ speaker: "NPC", text: "Hello" });
    game.dialogue.advance();

    const rendered = game.dialogue.getCurrentText();
    expect(rendered).toBe("Hello");  // NOT "[object Object]"
});
```

### Test Player Experience, Not Code Structure

| Instead of Testing | Test This Instead |
|--------------------|-------------------|
| "Does quest handler exist?" | "Can player complete quest from start to finish?" |
| "Does dialogue have text property?" | "Does text render correctly on screen?" |
| "Does input router have priority?" | "Does A button advance dialogue when pressed?" |
| "Does NPC have condition function?" | "Does NPC show correct dialogue for current plot phase?" |

---

## Bug Categories & Root Causes

### Bug Type 1: Seemingly Unresponsive Buttons

**Player Experience**:
- Press A button, nothing happens
- Press Space, dialogue doesn't advance
- Click mobile D-pad, character doesn't move

**Root Causes Identified**:

1. **Input Priority Conflicts** (`src/inputRouter.js:50-80`)
   - Multiple handlers registered at same priority
   - First handler consumes input, second never runs
   - No test validates priority ordering

2. **State-Based Input Blocking** (`src/game.js:200-250`)
   - Movement disabled during DIALOGUE state (correct)
   - But event listeners still fire (incorrect)
   - Creates illusion of broken buttons

3. **Mobile Touch Event Propagation** (`src/game.js:150-200`)
   - Virtual D-pad buttons emit keyboard events
   - Touch event AND keyboard event both fire
   - Double-processing or event cancellation

4. **Dialogue State Machine Stuck** (`src/dialogueQueueSystem.js:150-200`)
   - DialogueQueueSystem in WAITING_FOR_INPUT state
   - But input not routed correctly
   - Appears frozen from player perspective

**Testing Gaps**:
- ❌ No tests for input routing priority
- ❌ No tests for state-based input handling
- ❌ No tests for mobile touch events
- ❌ No tests for dialogue state transitions

### Bug Type 2: Looping Dialogue

**Player Experience**:
- NPC says same thing repeatedly
- Dialogue doesn't advance to next plot phase
- Stuck in conversation loop

**Root Causes Identified**:

1. **Condition Overlap** (`src/data.js:548-750`)
   - Multiple dialogues have overlapping conditions
   - First matching dialogue always selected
   - No progression because condition always true

2. **Missing onClose Handlers** (`src/data.js:600-650`)
   - Dialogue shown but doesn't update game state
   - Next interaction matches same condition
   - Infinite loop of same dialogue

3. **Race Conditions in Callbacks** (documented in `docs/dialogue-bugs-analysis.md`)
   - onClose handler updates plotPhase
   - But dialogue closed event fires before state updates
   - Next dialogue check uses stale state

4. **Incorrect repeatText Logic** (`src/dialogueQueueSystem.js:300-350`)
   - repeatText meant for subsequent visits
   - But condition still matches, showing full dialogue again
   - Visit count tracking not reliable

**Testing Gaps**:
- ❌ No tests for dialogue condition conflicts (analyzer exists but not in CI/CD)
- ❌ No tests for onClose handler execution order
- ❌ No tests for plot phase progression
- ❌ No tests for repeatText behavior

### Bug Type 3: Gaps in Game Plot

**Player Experience**:
- Found 6 creatures but game still says "find more"
- Talked to NPC but quest didn't start
- Completed quest but NPC doesn't acknowledge

**Root Causes Identified**:

1. **Plot Phase Transition Logic** (`src/game.js:1060-1090`)
   - Automatic transitions based on creature count
   - But conditions checked only once per frame
   - Edge cases (exactly 3 creatures vs 4+) not tested

2. **Dialogue Condition Gaps** (`src/data.js:548-750`)
   - NPCs have dialogues for specific phases
   - But some phase combinations missing
   - Falls back to generic dialogue or silence

3. **Quest Completion State** (`src/questSystem.js:100-150`)
   - Quest marked complete in completedQuests Set
   - But NPC dialogue condition checks different variable
   - Desync between quest system and dialogue system

4. **Multi-Step Quest Bugs** (`src/questSystem.js:150-200`)
   - Quest steps advance but UI doesn't update
   - Location markers disappear
   - Player thinks quest broken

**Testing Gaps**:
- ❌ No tests for plot phase transition conditions
- ❌ No tests for dialogue coverage across all phases
- ❌ No tests for quest completion state sync
- ❌ No tests for multi-step quest progression

---

## Multi-Layer Testing Strategy

### Layer 1: Unit Tests (Foundation)

**Purpose**: Test individual functions and methods in isolation

**Coverage**:

```javascript
// tests/unit/dialogueQueueSystem.test.js
describe('DialogueQueueSystem', () => {
    test('queue adds dialogue to queue', () => {
        const system = new DialogueQueueSystem();
        system.queue({ text: "Hello" });
        expect(system.queueLength()).toBe(1);
    });

    test('advance moves to next dialogue', () => {
        const system = new DialogueQueueSystem();
        system.queue({ text: "Hello" });
        system.queue({ text: "World" });
        system.advance();
        expect(system.getCurrentText()).toBe("World");
    });

    test('state transitions from IDLE to ANIMATING', () => {
        const system = new DialogueQueueSystem();
        system.queue({ text: "Hello" });
        expect(system.state).toBe('ANIMATING');
    });
});
```

**Key Unit Tests Needed**:

| File | Unit Tests |
|------|-----------|
| dialogueQueueSystem.js | queue(), advance(), handleInput(), state transitions |
| inputRouter.js | register(), handleInput(), priority ordering |
| questSystem.js | startQuest(), advanceStep(), completeQuest() |
| data.js | NPC condition evaluation, quest step handlers |

**Tooling**: Jest, Vitest, or Mocha

### Layer 2: Integration Tests (Critical)

**Purpose**: Test multiple systems working together

**Priority 1: Dialogue Flow**

```javascript
// tests/integration/dialogue-flow.test.js
describe('Dialogue Flow Integration', () => {
    test('NPC shows correct dialogue for plot phase', () => {
        const game = createTestGame({ plotPhase: 'wake_up' });
        const dialogue = game.npcs.marlowe.getDialogue(game);

        expect(dialogue).toBeDefined();
        expect(dialogue.text).toContain("You're awake");
    });

    test('dialogue onClose updates plot phase', (done) => {
        const game = createTestGame({ plotPhase: 'wake_up' });
        const dialogue = game.npcs.marlowe.getDialogue(game);

        game.dialogue.queue(dialogue);
        game.dialogue.on('closed', () => {
            expect(game.plotPhase).toBe('find_creature');
            done();
        });

        // Simulate advancing through all dialogue
        while (game.dialogue.hasMore()) {
            game.dialogue.advance();
        }
    });

    test('multi-line dialogue advances correctly', () => {
        const game = createTestGame();
        game.dialogue.queue({
            text: ["Line 1", "Line 2", "Line 3"]
        });

        game.dialogue.advance();
        expect(game.dialogue.getCurrentText()).toBe("Line 1");

        game.dialogue.advance();
        expect(game.dialogue.getCurrentText()).toBe("Line 2");

        game.dialogue.advance();
        expect(game.dialogue.getCurrentText()).toBe("Line 3");
    });
});
```

**Priority 2: Button Input Handling**

```javascript
// tests/integration/button-handling.test.js
describe('Button Input Handling', () => {
    test('A button advances dialogue', () => {
        const game = createTestGame();
        game.dialogue.queue({ text: "Hello" });

        simulateKeyPress('a');

        expect(game.dialogue.state).toBe('IDLE');
    });

    test('Space and Enter work identically to A', () => {
        const scenarios = ['a', ' ', 'Enter'];

        scenarios.forEach(key => {
            const game = createTestGame();
            game.dialogue.queue({ text: "Hello" });

            simulateKeyPress(key);

            expect(game.dialogue.state).toBe('IDLE');
        });
    });

    test('movement keys ignored during dialogue', () => {
        const game = createTestGame();
        game.dialogue.queue({ text: "Hello" });

        const initialPosition = { x: game.player.x, y: game.player.y };

        simulateKeyPress('ArrowUp');

        expect(game.player.x).toBe(initialPosition.x);
        expect(game.player.y).toBe(initialPosition.y);
    });

    test('input routing respects priority', () => {
        const game = createTestGame();
        const handler1 = jest.fn((input) => input.consume());
        const handler2 = jest.fn((input) => input.consume());

        game.inputRouter.register(handler1, 100);  // Higher priority
        game.inputRouter.register(handler2, 50);

        simulateKeyPress('a');

        expect(handler1).toHaveBeenCalled();
        expect(handler2).not.toHaveBeenCalled();  // Consumed by handler1
    });
});
```

**Priority 3: Quest Flow**

```javascript
// tests/integration/quest-flow.test.js
describe('Quest Flow Integration', () => {
    test('one-off quest completion awards coins', () => {
        const game = createTestGame({ coins: 0 });

        game.questSystem.startQuest('fishing_crates');

        // Simulate solving problem
        game.questSystem.submitAnswer(30);  // Correct answer

        expect(game.coins).toBe(25);
        expect(game.completedQuests.has('fishing_crates')).toBe(true);
    });

    test('multi-step quest progresses through steps', () => {
        const game = createTestGame();

        game.questSystem.startQuest('fishing_records');

        expect(game.questSystem.currentStep.type).toBe('visit_location');

        // Simulate reaching location
        game.player.x = game.questSystem.currentStep.x;
        game.player.y = game.questSystem.currentStep.y;
        game.questSystem.update();

        expect(game.questSystem.currentStep.type).toBe('problem');
    });

    test('incorrect answer does not complete quest', () => {
        const game = createTestGame({ coins: 0 });

        game.questSystem.startQuest('fishing_crates');
        game.questSystem.submitAnswer(999);  // Wrong answer

        expect(game.coins).toBe(0);
        expect(game.completedQuests.has('fishing_crates')).toBe(false);
    });
});
```

**Priority 4: Plot Progression**

```javascript
// tests/integration/plot-progression.test.js
describe('Plot Progression Integration', () => {
    test('discovering first creature advances to creature_found', () => {
        const game = createTestGame({ plotPhase: 'find_creature' });

        game.addDiscoveredCreature('lumina');
        game.update();  // Trigger plot check

        expect(game.plotPhase).toBe('creature_found');
    });

    test('discovering 3+ creatures advances to working', () => {
        const game = createTestGame({ plotPhase: 'return_keeper' });

        game.addDiscoveredCreature('lumina');
        game.addDiscoveredCreature('sprout');
        game.addDiscoveredCreature('spark');
        game.update();

        expect(game.plotPhase).toBe('working');
    });

    test('NPC dialogue changes after plot phase transition', () => {
        const game = createTestGame({ plotPhase: 'wake_up' });

        const initialDialogue = game.npcs.marlowe.getDialogue(game);
        expect(initialDialogue.text).toContain("You're awake");

        game.plotPhase = 'find_creature';

        const newDialogue = game.npcs.marlowe.getDialogue(game);
        expect(newDialogue.text).toContain("head down to the beach");
    });

    test('all plot phases have NPC dialogue coverage', () => {
        const phases = [
            'wake_up', 'find_creature', 'creature_found', 'return_keeper',
            'meet_villager', 'boat_quest', 'working', 'boat_ready', 'departure'
        ];

        phases.forEach(phase => {
            const game = createTestGame({ plotPhase: phase });

            // Each NPC should have at least one matching dialogue
            Object.keys(game.npcs).forEach(npcId => {
                const dialogue = game.npcs[npcId].getDialogue(game);
                expect(dialogue).toBeDefined();
                expect(dialogue.text).toBeDefined();
            });
        });
    });
});
```

### Layer 3: End-to-End Tests (User Journeys)

**Purpose**: Test complete player workflows from start to finish

**E2E Test 1: First Creature Encounter**

```javascript
// tests/e2e/creature-encounter.test.js
describe('First Creature Encounter Journey', () => {
    test('player can find, encounter, and name first creature', async () => {
        const game = createTestGame({ plotPhase: 'find_creature' });

        // 1. Player talks to Marlowe
        game.player.x = game.npcs.marlowe.x;
        game.player.y = game.npcs.marlowe.y;
        simulateKeyPress(' ');  // Interact

        await waitForDialogue();
        expect(game.dialogue.getCurrentText()).toContain("beach");

        // Advance through dialogue
        while (game.dialogue.hasMore()) {
            simulateKeyPress('a');
            await wait(100);
        }

        // 2. Player walks to beach
        game.player.x = 5;
        game.player.y = 25;

        // 3. Creature encounter triggers
        game.update();  // Should trigger encounter

        expect(game.state).toBe('dialogue');
        expect(game.dialogue.getCurrentText()).toContain("approaches");

        // Advance through encounter narrative
        while (game.dialogue.hasMore()) {
            simulateKeyPress('a');
            await wait(100);
        }

        // 4. Naming screen appears
        expect(game.state).toBe('creature_naming');

        game.nameCreature('Sunny');

        // 5. Plot advances
        expect(game.plotPhase).toBe('creature_found');
        expect(game.discoveredCreatures.has('lumina')).toBe(true);
        expect(game.party[0].nickname).toBe('Sunny');
    });
});
```

**E2E Test 2: Quest Completion**

```javascript
// tests/e2e/quest-completion.test.js
describe('Quest Completion Journey', () => {
    test('player can accept, complete, and collect reward for quest', async () => {
        const game = createTestGame({
            plotPhase: 'boat_quest',
            coins: 0
        });

        // 1. Talk to Callum to get quest
        game.player.x = game.npcs.callum.x;
        game.player.y = game.npcs.callum.y;
        simulateKeyPress(' ');

        await waitForDialogue();

        // Choose "Help with crates" option
        simulateKeyPress('ArrowDown');  // Navigate to choice
        simulateKeyPress('a');  // Select

        expect(game.activeQuests.has('fishing_crates')).toBe(true);

        // 2. Open quest menu
        simulateKeyPress('q');

        expect(game.state).toBe('quest_menu');

        // 3. Select quest and solve problem
        simulateKeyPress('a');  // Open problem

        // Problem: "5 crates × 6 nets each = ?"
        game.questSystem.submitAnswer(30);

        expect(game.coins).toBe(25);
        expect(game.completedQuests.has('fishing_crates')).toBe(true);
        expect(game.activeQuests.has('fishing_crates')).toBe(false);

        // 4. Talk to Callum again - should acknowledge completion
        game.player.x = game.npcs.callum.x;
        game.player.y = game.npcs.callum.y;
        simulateKeyPress(' ');

        await waitForDialogue();

        const dialogue = game.dialogue.getCurrentText();
        expect(dialogue).toContain("Thanks");  // Should acknowledge help
    });
});
```

**E2E Test 3: Game Progression (Critical Path)**

```javascript
// tests/e2e/game-progression.test.js
describe('Full Game Progression', () => {
    test('player can progress from wake_up to boat_ready', async () => {
        const game = createTestGame({ plotPhase: 'wake_up' });

        // Phase 1: Wake up and talk to Marlowe
        await talkToNPC(game, 'marlowe');
        expect(game.plotPhase).toBe('find_creature');

        // Phase 2: Find first creature
        await encounterCreature(game, 'lumina', 'Sunny');
        expect(game.plotPhase).toBe('creature_found');

        // Phase 3: Return to Marlowe
        await talkToNPC(game, 'marlowe');
        expect(game.plotPhase).toBe('return_keeper');

        // Phase 4: Find 3 more creatures
        await encounterCreature(game, 'sprout', 'Leafy');
        await encounterCreature(game, 'spark', 'Zap');
        await encounterCreature(game, 'marina', 'Splash');

        expect(game.plotPhase).toBe('working');

        // Phase 5: Complete quests to earn coins
        await completeQuest(game, 'fishing_crates');
        await completeQuest(game, 'fishing_nets');

        expect(game.coins).toBeGreaterThanOrEqual(50);

        // Phase 6: Find 3 more creatures
        await encounterCreature(game, 'dusty', 'Sandy');
        await encounterCreature(game, 'pebble', 'Rock');
        await encounterCreature(game, 'blaze', 'Fire');

        expect(game.plotPhase).toBe('boat_ready');

        // Verify complete state
        expect(game.discoveredCreatures.size).toBe(7);
        expect(game.completedQuests.size).toBeGreaterThanOrEqual(2);
    });
});
```

### Layer 4: Regression Tests (Bug Prevention)

**Purpose**: Prevent known bugs from reoccurring

```javascript
// tests/regression/object-object-bug.test.js
describe('Regression: [object Object] Bug', () => {
    test('dialogue renders text, not object representation', () => {
        const game = createTestGame();

        // Queue dialogue with speaker property (the pattern that caused bug)
        game.dialogue.queue({
            speaker: "Marlowe",
            text: "Hello, player!"
        });

        game.dialogue.advance();

        const rendered = game.dialogue.getCurrentText();

        expect(rendered).toBe("Hello, player!");
        expect(rendered).not.toContain("[object Object]");
    });
});

// tests/regression/quest-freeze-bug.test.js
describe('Regression: Quest Freeze After Correct Answer', () => {
    test('quest completes and returns to normal gameplay', async () => {
        const game = createTestGame();

        game.questSystem.startQuest('fishing_crates');
        game.questSystem.submitAnswer(30);  // Correct

        await wait(500);  // Wait for async handlers

        expect(game.state).toBe('exploring');  // NOT stuck in 'job' state
        expect(game.completedQuests.has('fishing_crates')).toBe(true);
    });
});

// tests/regression/callum-greeting-bug.test.js
describe('Regression: Callum Wrong Greeting', () => {
    test('first interaction shows welcome, not "back for more"', () => {
        const game = createTestGame({
            plotPhase: 'boat_quest',
            completedQuests: new Set()  // NO quests done yet
        });

        const dialogue = game.npcs.callum.getDialogue(game);

        expect(dialogue.text).toContain("introduce myself");
        expect(dialogue.text).not.toContain("Back for more");
    });

    test('subsequent interactions show "back for more"', () => {
        const game = createTestGame({
            plotPhase: 'boat_quest',
            completedQuests: new Set(['fishing_crates'])
        });

        const dialogue = game.npcs.callum.getDialogue(game);

        expect(dialogue.text).toContain("Back for more");
    });
});
```

---

## Specific Test Plans for Each Bug Type

### Test Plan 1: Seemingly Unresponsive Buttons

**Test Matrix**:

| Test Case | Input | Expected State | Expected Behavior |
|-----------|-------|----------------|-------------------|
| A button during dialogue | 'a' | DIALOGUE | Advance to next line |
| Space during dialogue | ' ' | DIALOGUE | Advance to next line |
| Enter during dialogue | 'Enter' | DIALOGUE | Advance to next line |
| A button during choice | 'a' | DIALOGUE_CHOICE | Select highlighted choice |
| Arrow during choice | 'ArrowDown' | DIALOGUE_CHOICE | Move selection down |
| Movement during dialogue | 'ArrowUp' | DIALOGUE | Ignored (no movement) |
| A button during exploration | 'a' | EXPLORING | Ignored (or NPC interact) |
| Mobile D-pad tap | Touch event | EXPLORING | Move player |
| Mobile A button tap | Touch event | DIALOGUE | Advance dialogue |

**Critical Tests**:

```javascript
// tests/integration/button-responsiveness.test.js
describe('Button Responsiveness', () => {
    test('A button ALWAYS advances dialogue when visible', () => {
        const game = createTestGame();
        game.dialogue.queue({ text: "Test" });

        // Wait for typewriter
        game.update(1000);  // 1 second

        expect(game.dialogue.state).toBe('WAITING_FOR_INPUT');

        simulateKeyPress('a');

        expect(game.dialogue.state).toBe('IDLE');
    });

    test('buttons work identically on mobile and desktop', () => {
        const testInputs = [
            { type: 'keyboard', key: 'a' },
            { type: 'touch', button: 'A' },
            { type: 'gamepad', button: 0 }
        ];

        testInputs.forEach(input => {
            const game = createTestGame();
            game.dialogue.queue({ text: "Test" });
            game.update(1000);

            simulateInput(input);

            expect(game.dialogue.state).toBe('IDLE');
        });
    });

    test('input router does not drop inputs', () => {
        const game = createTestGame();
        const inputs = [];

        game.inputRouter.register((input) => {
            inputs.push(input.key);
        }, 0);

        // Rapid fire inputs
        simulateKeyPress('a');
        simulateKeyPress('b');
        simulateKeyPress('c');

        expect(inputs).toEqual(['a', 'b', 'c']);
    });
});
```

**Debugging Checklist**:

When "button not working" bug reported:

1. ✅ Check InputRouter priority - `game.inputRouter.handlers`
2. ✅ Check current game state - `game.state`
3. ✅ Check dialogue state - `game.dialogue.state`
4. ✅ Check input consumption - Add logging to handler
5. ✅ Check event listeners - Look for `removeEventListener` calls
6. ✅ Check mobile vs desktop - Test both platforms

### Test Plan 2: Looping Dialogue

**Test Matrix**:

| Test Case | Setup | Expected Result |
|-----------|-------|-----------------|
| Talk to NPC twice | Same plot phase | Different text (repeatText) |
| Talk to NPC after quest complete | Quest in completedQuests | Acknowledgment dialogue |
| Talk to NPC during multi-step quest | Active quest in progress | Quest-specific dialogue |
| Advance dialogue to end | Multiple lines queued | All lines shown, then close |
| Choose dialogue option | Choices array provided | Execute choice action, close |

**Critical Tests**:

```javascript
// tests/integration/dialogue-loops.test.js
describe('Dialogue Loop Prevention', () => {
    test('NPC shows different text on second visit', async () => {
        const game = createTestGame();

        // First visit
        const firstDialogue = game.npcs.marlowe.getDialogue(game);
        await showDialogue(game, firstDialogue);

        // Second visit (same state)
        const secondDialogue = game.npcs.marlowe.getDialogue(game);

        expect(secondDialogue.text).not.toEqual(firstDialogue.text);
    });

    test('onClose handler executes before next dialogue check', (done) => {
        const game = createTestGame({ plotPhase: 'wake_up' });

        const dialogue = game.npcs.marlowe.getDialogue(game);
        game.dialogue.queue(dialogue);

        game.dialogue.on('closed', () => {
            // By this point, plot phase should have changed
            expect(game.plotPhase).toBe('find_creature');

            // Next dialogue should be for new phase
            const nextDialogue = game.npcs.marlowe.getDialogue(game);
            expect(nextDialogue.text).toContain("beach");

            done();
        });

        // Advance through dialogue
        while (game.dialogue.hasMore()) {
            game.dialogue.advance();
        }
    });

    test('no dialogue matches same condition twice in a row', () => {
        const game = createTestGame();

        Object.keys(game.npcs).forEach(npcId => {
            const npc = game.npcs[npcId];

            const firstMatch = npc.getDialogue(game);

            // Execute onClose to update state
            if (firstMatch.onClose) {
                firstMatch.onClose(game);
            }

            const secondMatch = npc.getDialogue(game);

            // Either different dialogue, or uses repeatText
            if (firstMatch === secondMatch) {
                expect(firstMatch.repeatText).toBeDefined();
            }
        });
    });
});
```

**Dialogue Analyzer Integration**:

```javascript
// tests/analysis/dialogue-conflicts.test.js
const analyzeDialogues = require('../dialogueTreeAnalyzer');

describe('Dialogue Tree Analysis', () => {
    test('no NPCs have conflicting dialogue conditions', () => {
        const results = analyzeDialogues();

        const conflicts = results.filter(r => r.conflicts.length > 0);

        if (conflicts.length > 0) {
            console.error('Dialogue conflicts found:');
            conflicts.forEach(c => {
                console.error(`  ${c.npc}: ${c.conflicts.join(', ')}`);
            });
        }

        expect(conflicts).toHaveLength(0);
    });

    test('all plot phases have NPC dialogue coverage', () => {
        const results = analyzeDialogues();

        const gaps = results.filter(r => r.gaps.length > 0);

        if (gaps.length > 0) {
            console.error('Dialogue gaps found:');
            gaps.forEach(g => {
                console.error(`  ${g.npc}: missing ${g.gaps.join(', ')}`);
            });
        }

        expect(gaps).toHaveLength(0);
    });
});
```

### Test Plan 3: Gaps in Game Plot

**Test Matrix**:

| Test Case | Plot Phase | Creature Count | Expected Behavior |
|-----------|-----------|----------------|-------------------|
| Phase transition at threshold | return_keeper | 3 creatures | Transition to working |
| Phase stays below threshold | return_keeper | 2 creatures | Stay in return_keeper |
| NPC dialogue exists for phase | boat_quest | Any | Marlowe has dialogue |
| Quest available in phase | working | Any | Callum offers quests |

**Critical Tests**:

```javascript
// tests/integration/plot-coverage.test.js
describe('Plot Coverage', () => {
    test('all plot phases are reachable', () => {
        const phases = [
            'wake_up', 'find_creature', 'creature_found', 'return_keeper',
            'meet_villager', 'boat_quest', 'working', 'boat_ready', 'departure'
        ];

        let game = createTestGame({ plotPhase: 'wake_up' });

        phases.forEach(expectedPhase => {
            // Simulate actions to reach this phase
            game = progressToPhase(game, expectedPhase);

            expect(game.plotPhase).toBe(expectedPhase);
        });
    });

    test('creature count thresholds trigger transitions', () => {
        const game = createTestGame({ plotPhase: 'return_keeper' });

        // 2 creatures - should stay
        game.addDiscoveredCreature('lumina');
        game.addDiscoveredCreature('sprout');
        game.update();

        expect(game.plotPhase).toBe('return_keeper');

        // 3rd creature - should transition
        game.addDiscoveredCreature('spark');
        game.update();

        expect(game.plotPhase).toBe('working');
    });

    test('every NPC has fallback dialogue', () => {
        const game = createTestGame();

        // Set game to unexpected state
        game.plotPhase = 'invalid_phase_for_testing';
        game.completedQuests = new Set();

        Object.keys(game.npcs).forEach(npcId => {
            const dialogue = game.npcs[npcId].getDialogue(game);

            expect(dialogue).toBeDefined();
            expect(dialogue.text).toBeDefined();
            expect(dialogue.text).not.toBe('');
        });
    });

    test('quest completion updates NPC dialogue', () => {
        const game = createTestGame({ plotPhase: 'boat_quest' });

        const beforeDialogue = game.npcs.callum.getDialogue(game);

        // Complete a quest
        game.completedQuests.add('fishing_crates');

        const afterDialogue = game.npcs.callum.getDialogue(game);

        expect(afterDialogue.text).not.toEqual(beforeDialogue.text);
    });
});
```

---

## Test Infrastructure Requirements

### Headless Testing Setup

**Current Architecture** (`src/dialogueQueueSystem.js:50`):
```javascript
constructor(options = {}) {
    this.headless = options.headless || false;
    // ... if headless, skip canvas rendering
}
```

**Extend to Full Game**:
```javascript
// tests/helpers/testGame.js
function createTestGame(initialState = {}) {
    const game = new Game({
        headless: true,           // No canvas
        skipAnimations: true,     // Instant typewriter
        deterministicRandom: true // Fixed seed for creature encounters
    });

    // Set initial state
    Object.assign(game, initialState);

    return game;
}
```

### Simulation Helpers

```javascript
// tests/helpers/simulators.js

function simulateKeyPress(key) {
    const event = new KeyboardEvent('keydown', { key });
    document.dispatchEvent(event);
}

function simulateTouchButton(buttonId) {
    const button = document.getElementById(buttonId);
    const event = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
    });
    button.dispatchEvent(event);
}

async function talkToNPC(game, npcId) {
    const npc = game.npcs[npcId];
    game.player.x = npc.x;
    game.player.y = npc.y;

    simulateKeyPress(' ');

    while (game.dialogue.hasMore()) {
        await wait(50);
        simulateKeyPress('a');
    }
}

async function encounterCreature(game, creatureId, nickname) {
    // Move to habitat
    const creature = game.creatures[creatureId];
    const habitat = game.map.find(tile => tile.terrain === creature.habitat);

    game.player.x = habitat.x;
    game.player.y = habitat.y;

    // Force encounter (skip RNG)
    game.forceEncounter(creatureId);

    // Name creature
    game.nameCreature(nickname);
}

async function completeQuest(game, questId) {
    const quest = game.quests[questId];

    game.questSystem.startQuest(questId);

    // Solve problem
    const answer = quest.steps[0].correctAnswer;
    game.questSystem.submitAnswer(answer);

    await wait(100);
}
```

### Assertion Helpers

```javascript
// tests/helpers/assertions.js

function expectDialogueVisible(game) {
    expect(game.state).toBe('dialogue');
    expect(game.dialogue.state).not.toBe('IDLE');
}

function expectPlayerCanMove(game) {
    expect(game.state).toBe('exploring');

    const oldX = game.player.x;
    simulateKeyPress('ArrowRight');
    game.update();

    expect(game.player.x).not.toBe(oldX);
}

function expectQuestComplete(game, questId) {
    expect(game.completedQuests.has(questId)).toBe(true);
    expect(game.activeQuests.has(questId)).toBe(false);
}
```

### Test Data Factories

```javascript
// tests/helpers/factories.js

function createTestGame(overrides = {}) {
    return {
        plotPhase: 'wake_up',
        player: { x: 10, y: 10 },
        coins: 0,
        discoveredCreatures: new Set(),
        completedQuests: new Set(),
        activeQuests: new Set(),
        party: [],
        ...overrides,

        // Add headless systems
        dialogue: new DialogueQueueSystem({ headless: true }),
        questSystem: new QuestSystem(),
        inputRouter: new InputRouter(),
        npcs: NPCS,
        creatures: CREATURES,
        quests: QUESTS
    };
}

function createTestDialogue(overrides = {}) {
    return {
        speaker: "Test NPC",
        text: "Test dialogue",
        condition: () => true,
        onClose: () => {},
        ...overrides
    };
}

function createTestQuest(overrides = {}) {
    return {
        id: 'test_quest',
        title: 'Test Quest',
        reward: 10,
        steps: [
            { type: 'problem', problem: { answer: 42 } }
        ],
        ...overrides
    };
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Set up test infrastructure

- [ ] Install test framework (Jest/Vitest)
- [ ] Create `tests/helpers/` directory
- [ ] Implement `createTestGame()` headless mode
- [ ] Implement input simulators
- [ ] Write 10 basic unit tests
- [ ] Configure CI/CD to run tests

**Success Criteria**: `npm test` runs and passes

### Phase 2: Critical Integration Tests (Week 2)

**Goal**: Cover the 3 bug types

- [ ] Write 15 dialogue flow tests
- [ ] Write 10 button input tests
- [ ] Write 10 plot progression tests
- [ ] Write 5 quest flow tests
- [ ] Integrate dialogue analyzer into CI/CD

**Success Criteria**: All known bugs have regression tests

### Phase 3: E2E Coverage (Week 3)

**Goal**: Test complete player journeys

- [ ] Write creature encounter E2E test
- [ ] Write quest completion E2E test
- [ ] Write game progression E2E test
- [ ] Write mobile controls E2E test

**Success Criteria**: Full game playthrough automated

### Phase 4: Mobile Testing (Week 4)

**Goal**: Ensure mobile parity

- [ ] Set up mobile emulation in tests
- [ ] Test touch event handling
- [ ] Test virtual D-pad
- [ ] Test on-screen A button
- [ ] Test responsive layout

**Success Criteria**: All tests pass on mobile viewport

### Phase 5: Continuous Improvement (Ongoing)

**Goal**: Maintain high test quality

- [ ] Add test for every bug reported
- [ ] Require tests for new features
- [ ] Monitor test coverage (aim for 80%+)
- [ ] Refactor slow tests
- [ ] Update test docs

**Success Criteria**: No regression bugs in production

---

## Success Metrics

### Quantitative Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Total Tests | 31 | 100+ | 4 weeks |
| Runtime Tests | 5 | 50+ | 3 weeks |
| Test Coverage | ~20% | 80%+ | 6 weeks |
| Bug Escape Rate | 3/month | 0/month | 8 weeks |
| Test Execution Time | 5s | <30s | 4 weeks |

### Qualitative Metrics

**Player Experience**:
- Zero "[object Object]" bugs in production
- Buttons always responsive
- No dialogue loops
- No plot progression gaps

**Developer Experience**:
- Bugs caught in CI/CD before merge
- Confident refactoring (tests verify behavior)
- Easy to add new features (test helpers available)
- Fast feedback loop (<30s test run)

### Test Health Indicators

**Green Flags** ✅:
- All tests pass on main branch
- New features include tests
- Bugs have regression tests
- Test coverage increasing

**Red Flags** 🚩:
- Tests skipped or ignored
- Flaky tests (intermittent failures)
- Tests take >1 minute
- Test coverage decreasing

---

## Conclusion

The current test suite validates **code structure** but misses **runtime bugs**. To catch the three bug types (unresponsive buttons, looping dialogue, plot gaps), we need to shift to **runtime integration testing**.

**Key Recommendations**:

1. **Prioritize integration tests** over structural tests
2. **Test player experience**, not code existence
3. **Automate E2E journeys** to prevent regressions
4. **Use dialogue analyzer** in CI/CD pipeline
5. **Require tests for every bug** before fixing

By implementing this 4-layer testing strategy, we can **prevent bugs before they reach players** and build confidence in the codebase for future development.

---

## Appendix: Test Examples

### Complete Test File Example

```javascript
// tests/integration/dialogue-flow.test.js
const { createTestGame, simulateKeyPress, wait } = require('../helpers');

describe('Dialogue Flow Integration', () => {
    let game;

    beforeEach(() => {
        game = createTestGame();
    });

    describe('NPC Interaction', () => {
        test('talking to Marlowe in wake_up phase shows intro', async () => {
            game.plotPhase = 'wake_up';

            const dialogue = game.npcs.marlowe.getDialogue(game);
            game.dialogue.queue(dialogue);

            expect(game.dialogue.getCurrentText()).toContain("You're awake");
        });

        test('advancing through dialogue updates plot phase', async () => {
            game.plotPhase = 'wake_up';

            const dialogue = game.npcs.marlowe.getDialogue(game);
            game.dialogue.queue(dialogue);

            // Advance through all lines
            while (game.dialogue.hasMore()) {
                simulateKeyPress('a');
                await wait(50);
            }

            expect(game.plotPhase).toBe('find_creature');
        });
    });

    describe('Dialogue Choices', () => {
        test('D-pad navigates choices', () => {
            game.dialogue.queue({
                text: "What will you do?",
                choices: [
                    { text: "Option 1", action: jest.fn() },
                    { text: "Option 2", action: jest.fn() }
                ]
            });

            expect(game.dialogue.selectedChoice).toBe(0);

            simulateKeyPress('ArrowDown');
            expect(game.dialogue.selectedChoice).toBe(1);

            simulateKeyPress('ArrowUp');
            expect(game.dialogue.selectedChoice).toBe(0);
        });

        test('A button selects choice and executes action', () => {
            const action = jest.fn();

            game.dialogue.queue({
                text: "Choose:",
                choices: [
                    { text: "Option 1", action }
                ]
            });

            simulateKeyPress('a');

            expect(action).toHaveBeenCalledWith(game);
            expect(game.dialogue.state).toBe('IDLE');
        });
    });

    describe('Regression Tests', () => {
        test('[object Object] bug does not occur', () => {
            game.dialogue.queue({
                speaker: "Marlowe",
                text: "Hello, player!"
            });

            const rendered = game.dialogue.getCurrentText();

            expect(rendered).toBe("Hello, player!");
            expect(rendered).not.toContain("[object Object]");
        });
    });
});
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',  // Browser environment
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/debugLogger.js'  // Exclude debug tools
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
};
```

```javascript
// tests/setup.js
// Global test setup
global.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock canvas for headless tests
HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
});
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-24
**Next Review**: After Phase 2 completion
