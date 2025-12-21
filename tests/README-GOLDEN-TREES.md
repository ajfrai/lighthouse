# Golden Interaction Tree Testing System

## Overview

The Golden Tree system prevents dialogue regressions by maintaining reference snapshots of all NPC interactions and validating that current code produces identical results.

## How It Works

### 1. Golden Tree Generation
```bash
./generate-golden-trees.sh
```

Creates reference files in `golden-trees/` directory:
- **Dialogue trees**: NPC responses for each game state
- **Quest flows**: Complete quest step sequences with problems/answers

**Example**: `golden-trees/callum/quest_fishing_records.txt`
```
Quest: Check the Catch Records
ID: fishing_records
Type: multi_step
Reward: 100 coins
Steps: 3

Step 1/3:
  Type: visit_and_solve
  Description: "Check the nets on the western beach"
  Location: (6, 8)
  Problem:
    Question: "If 58 fish were caught but only 47 are here, how many are missing?"
    Answers: [9, 11, 13, 15]
    Correct: 11
...
```

### 2. Validation Testing
```bash
./run-golden-tests.sh
# OR
npm test
```

For each golden tree:
1. Recreates same game state
2. Runs dialogue/quest handlers
3. Serializes output
4. Compares to golden reference
5. **FAILS if any mismatch detected** ❌

### 3. Release Blocking

Tests run automatically before deployment via package.json:
```json
{
  "scripts": {
    "prerelease": "npm test",
    "predeploy": "npm test"
  }
}
```

**Release is blocked if dialogue has regressed!**

## Usage

### Initial Setup
```bash
# Generate golden trees from current (verified correct) code
./generate-golden-trees.sh

# Commit them as the "truth"
git add golden-trees/
git commit -m "Add golden interaction trees"
```

### During Development
```bash
# Make code changes...

# Test for regressions
npm test
```

**If tests fail:**
- ❌ Unintentional change = BUG - fix your code
- ✅ Intentional change = expected - update golden trees:
  ```bash
  ./generate-golden-trees.sh
  git add golden-trees/
  git commit -m "Update golden trees: improved Callum dialogue"
  ```

### Before Release
```bash
npm test
# Must pass before deploying!
```

## What Gets Tested

### NPC Dialogues
- **Dialogue NPCs** (Marlowe): Every plot phase
  - wake_up, find_creature, creature_found, meet_villager, boat_quest, working
- **Quest NPCs** (Callum): Quest completion states
  - no_boat, no_quests, some_quests, all_quests

### Quest Flows
- **All quests**: Complete step-by-step flow
  - Step types, descriptions, locations
  - Problems, answers, correct solutions
  - Validates quest doesn't skip steps or change difficulty

### Coverage
Current: **12 tests** across 2 NPCs
- 6 Marlowe dialogue states
- 2 Callum dialogue states
- 4 Callum quests (3 one-off + 1 multi-step)

## Architecture

### Test Flow
```
Current Code → Mock Game State → Execute Handlers
                                       ↓
                              Serialize Output
                                       ↓
                    Compare vs Golden Reference
                                       ↓
                        PASS ✅ / FAIL ❌
```

### File Structure
```
tests/
├── generate-golden-trees.sh  # Creates reference files
├── run-golden-tests.sh       # Validates against references
├── golden-trees/             # Reference snapshots (committed)
│   ├── marlowe/
│   │   ├── wake_up.txt
│   │   ├── find_creature.txt
│   │   └── ...
│   └── callum/
│       ├── meet_villager.txt
│       ├── quest_fishing_records.txt
│       └── ...
└── README-GOLDEN-TREES.md    # This file
```

## Detected Bug Examples

### Example 1: Dialogue Regression
**Before fix:**
```
Text: "Back for more? Good. Let's see what we've got today."
Choices: 2
  1. "Show me the work"
  2. "Not right now"
```

**After accidental change:**
```
Text: "Back for more? Good. Let's see what we've got today."
Choices: none (press A to continue)  # ❌ REGRESSION
```

**Test output:**
```
❌ callum/all_quests.txt
  EXPECTED: Choices: 2
  ACTUAL:   Choices: none
```

### Example 2: Quest Step Skip
**Before fix:**
```
Steps: 3
Step 1/3:
  Description: "Check the nets on the western beach"
Step 2/3:
  Description: "Check the nets on the eastern shore"
Step 3/3:
  Description: "Check the storage in the boat"
```

**After bug introduction:**
```
Steps: 2  # ❌ Step 2 missing!
Step 1/2:
  Description: "Check the nets on the western beach"
Step 2/2:
  Description: "Check the storage in the boat"
```

**Test output:**
```
❌ callum/quest_fishing_records.txt
  EXPECTED: Steps: 3
  ACTUAL:   Steps: 2
```

## Benefits

✅ **Catches regressions** - Dialogue changes detected immediately
✅ **Zero maintenance** - Tests auto-update as NPCs/quests added
✅ **Fast feedback** - Run in <1 second
✅ **Release blocking** - Can't deploy broken dialogues
✅ **Git-friendly** - Text diffs show exactly what changed

## Best Practices

1. **Always run tests before committing dialogue changes**
   ```bash
   npm test
   ```

2. **Update golden trees after intentional dialogue changes**
   ```bash
   ./generate-golden-trees.sh
   git add golden-trees/
   ```

3. **Review golden tree diffs in PRs**
   - Verify changes match intent
   - Catch accidental modifications

4. **Never commit failing tests**
   - Fix code OR update golden trees
   - Tests must always pass on main branch

## Troubleshooting

### "Golden trees not found"
```bash
./generate-golden-trees.sh
```

### Tests failing unexpectedly
```bash
# See what changed
git diff golden-trees/

# If intentional
./generate-golden-trees.sh && git add golden-trees/

# If bug
# Fix your code!
```

### Adding new NPC
1. Add NPC to src/data.js
2. Regenerate golden trees: `./generate-golden-trees.sh`
3. Tests automatically include new NPC
4. Commit golden trees: `git add golden-trees/`

## Future Enhancements

- [ ] Test choice actions (what happens when player selects each choice)
- [ ] Test quest completion rewards
- [ ] Test dialogue sequencing (multi-turn conversations)
- [ ] HTML report generation for CI/CD
- [ ] Performance benchmarks
