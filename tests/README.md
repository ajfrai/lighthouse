# Dialogue Tree Testing

This directory contains tools for testing and verifying dialogue/quest trees in the game.

## Purpose

The Dialogue Tree Analyzer helps prevent dialogue bugs by:
1. **Detecting conflicts** - Multiple dialogues matching the same game state
2. **Finding gaps** - Game states with no matching dialogue
3. **Visualizing flows** - See all possible dialogue paths
4. **Verifying logic** - Ensure dialogue conditions work correctly

## Quick Start

```javascript
// Load the analyzer
const DialogueTreeAnalyzer = require('./dialogueTreeAnalyzer.js');
const analyzer = new DialogueTreeAnalyzer(NPCS, QUESTS);

// Test an NPC
const states = analyzer.generateTestStates('callum');
const analysis = analyzer.analyzeNPC('callum', states);
console.log(analyzer.visualizeTree(analysis));
```

## Running Tests

```bash
# Run dialogue tests
node tests/dialogue.test.js

# Run full test suite
const results = analyzer.runFullTest();
```

## Example: Catching the Callum Bug

The bug we just fixed (wrong greeting on first interaction) would be caught by this tool:

```javascript
const analysis = analyzer.analyzeNPC('callum', [
    { plotPhase: 'boat_quest', hasInspectedBoat: true, completedQuests: new Set() }
]);

// Expected: "You want work? I've got fish that need counting."
// Bug would show: "Back for more? Good. Let's see what we've got today."
```

The analyzer checks:
- Does the dialogue condition properly filter by Callum's specific quests?
- Are there overlapping conditions that would match multiple dialogues?
- Is every reachable game state covered?

## Output Format

```
=== Callum (callum) ===
Type: dialogue_npc

✓ DIALOGUES (5):

1. State: phase=meet_villager, boat=false, quests=0
   Text: "Marlowe sent you? Hm. You're smaller than I expected. | ..."
   Has onClose handler

2. State: phase=boat_quest, boat=true, quests=0
   Text: "You want work? I've got fish that need counting."
   Choices: 2

3. State: phase=boat_quest, boat=true, quests=1
   Text: "Back for more? Good. Let's see what we've got today."
   Choices: 2
```

## API Reference

### `analyzeNPC(npcId, gameStates)`

Analyzes an NPC's dialogue tree across multiple game states.

**Parameters:**
- `npcId` (string): NPC identifier (e.g., 'callum', 'marlowe')
- `gameStates` (Array): Game states to test

**Returns:**
```javascript
{
    npcId: 'callum',
    npcName: 'Callum',
    type: 'dialogue_npc',
    dialogues: [...],  // Matched dialogues
    warnings: [...],   // Missing dialogues
    errors: [...]      // Conflicts
}
```

### `analyzeQuestNPC(npcId)`

Analyzes quest structure for a quest-giving NPC.

**Returns:**
```javascript
{
    npcId: 'callum',
    npcName: 'Callum',
    oneOffQuests: [...],
    fullQuest: {...},
    warnings: [...]
}
```

### `visualizeTree(analysis)`

Converts analysis into readable text output.

### `runFullTest()`

Runs complete test suite on all NPCs.

**Returns:**
```javascript
{
    tested: [...],
    totalErrors: 0,
    totalWarnings: 2
}
```

## Common Issues to Check

1. **Dialogue Conflicts**
   ```
   ❌ ERRORS: Multiple dialogues match
   State: phase=boat_quest, quests=0
   Issue: Multiple dialogues match (2)
   ```

2. **Missing Coverage**
   ```
   ⚠️  WARNINGS: No matching dialogue for this state
   State: phase=working, boat=true, quests=3
   ```

3. **Quest Structure**
   ```
   ⚠️  Quest structure has warnings
   - One-off quest 'fishing_invalid' not found
   ```

## Integration with CI/CD

Add to your test pipeline:

```bash
#!/bin/bash
# In tests/run-tests.sh

node tests/dialogue.test.js
if [ $? -ne 0 ]; then
    echo "Dialogue tests failed!"
    exit 1
fi
```

## Best Practices

1. **Run before committing** - Catch dialogue bugs early
2. **Update test states** - When adding new plot phases, add test states
3. **Check visualization** - Review full dialogue flows for narrative coherence
4. **Monitor warnings** - Even warnings might indicate design issues

## Extending the Tool

To add new NPCs to testing:

1. Add test state generator in `generateTestStates()`:
   ```javascript
   } else if (npcId === 'new_npc') {
       states.push(
           { plotPhase: 'some_phase', customState: true },
           // ... more states
       );
   }
   ```

2. Add test function in `dialogue.test.js`:
   ```javascript
   function testNewNPC() {
       const analyzer = new DialogueTreeAnalyzer(NPCS, QUESTS);
       const states = analyzer.generateTestStates('new_npc');
       const analysis = analyzer.analyzeNPC('new_npc', states);
       // ... assertions
   }
   ```

## Future Enhancements

- [ ] Visual graph output (DOT format for Graphviz)
- [ ] Exhaustive state space exploration
- [ ] Quest step flow verification
- [ ] Choice tree depth analysis
- [ ] Unreachable dialogue detection
- [ ] Narrative consistency checks
