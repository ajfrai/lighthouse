# 'A' Button Test Protocol

**Date**: 2025-12-14
**Purpose**: Verify 'a' button works for advancing dialogue
**Debug Version**: Added console logging to trace event handling

---

## How to Test

1. **Open the game in browser**
2. **Open Developer Console** (F12)
3. **Start a new game**
4. **Talk to Marlowe** (press Space to interact)

---

## Expected Behavior

### Test 1: First Line (Typewriter Animation)

**Marlowe says**: "Morning. Sleep well?"

**Action**: Press 'a' while text is still typing

**Expected Console Output**:
```
[DialogueSystem] Key "a" pressed in DIALOGUE state - advancing
[DialogueSystem] Completing typewriter: "Morning. Sleep well?"
```

**Expected Visual**:
- Text should complete instantly (stop typing, show full line)
- Dialogue should NOT advance to next line yet

---

### Test 2: Advance to Next Line

**Marlowe says**: "Morning. Sleep well?" (fully displayed)

**Action**: Press 'a' again

**Expected Console Output**:
```
[DialogueSystem] Key "a" pressed in DIALOGUE state - advancing
[DialogueSystem] Advancing to next line (current: 0/5)
```

**Expected Visual**:
- Next line should appear: "I heard something on the rocks last night..."
- Should start typing (or complete instantly if you press 'a' again)

---

### Test 3: Press 'a' 5 Times to Complete Dialogue

**Action**: Press 'a' repeatedly through all 5 lines

**Expected**: Dialogue should close after final line

**Expected Console Output** (abbreviated):
```
[DialogueSystem] Key "a" pressed...
[DialogueSystem] Advancing to next line (current: 1/5)
[DialogueSystem] Key "a" pressed...
[DialogueSystem] Advancing to next line (current: 2/5)
[DialogueSystem] Key "a" pressed...
[DialogueSystem] Advancing to next line (current: 3/5)
[DialogueSystem] Key "a" pressed...
[DialogueSystem] Advancing to next line (current: 4/5)
[DialogueSystem] Key "a" pressed...
[DialogueSystem] Advancing to next line (current: 5/5)
```

---

## Comparison Tests

### Test 4: Space Bar Should Work Identically

**Action**: Repeat Test 1-3 with **Space** instead of 'a'

**Expected**: Exact same behavior and console output (but "Key " " instead of "Key a")

---

### Test 5: Enter Should Work Identically

**Action**: Repeat Test 1-3 with **Enter** instead of 'a'

**Expected**: Exact same behavior and console output (but "Key Enter")

---

### Test 6: 'A' (Shift+a) Should Work

**Action**: Press **Shift+a** (capital A)

**Expected Console Output**:
```
[DialogueSystem] Key "A" pressed in DIALOGUE state - advancing
```

**Expected**: Same behavior as lowercase 'a'

---

## Potential Issues to Check

### Issue 1: Event Listener Not Firing

**Symptom**: No console output when pressing 'a'

**Diagnosis**: dialogueSystem event listener not registered

**Check**:
1. Look for "dialogueSystem.js loaded" or similar
2. Check browser console for JavaScript errors

---

### Issue 2: State Not Set to DIALOGUE

**Symptom**: Console shows nothing, or shows different state

**Diagnosis**: Game state might not be DIALOGUE when dialogue is shown

**Check**: Add `console.log(this.game.state)` to verify state

---

### Issue 3: Movement Key Conflict

**Symptom**: Pressing 'a' makes player try to move left instead of advancing dialogue

**Diagnosis**: Movement system might be processing 'a' key

**Check**: Look for movement-related console output or player sprite animation

**Note**: Movement should be disabled in DIALOGUE state (see game.js:322)

---

### Issue 4: Event Prevented by game.js

**Symptom**: Console shows event fired but nothing happens

**Diagnosis**: game.js preventDefault() might be blocking it

**Check**: Look for both dialogueSystem and game.js event logs

---

## What Should NOT Happen

❌ Pressing 'a' makes player move left
❌ Pressing 'a' does nothing (no console output, no dialogue advance)
❌ Pressing 'a' closes dialogue immediately (skipping all lines)
❌ Pressing 'a' behaves differently than Space/Enter

---

## Debug Information

### Current Implementation

**File**: `dialogueSystem.js:58-65`
```javascript
document.addEventListener('keydown', (e) => {
    if (this.game.state === GameState.DIALOGUE) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
            console.log(`[DialogueSystem] Key "${e.key}" pressed in DIALOGUE state - advancing`);
            e.preventDefault();
            this.advanceDialogue();
        }
    }
});
```

**File**: `dialogueSystem.js:170-182`
```javascript
advanceDialogue() {
    // If typewriter still going, complete it instantly
    if (this.game.dialogue.textIndex < this.game.dialogue.fullText.length) {
        console.log(`[DialogueSystem] Completing typewriter: "${this.game.dialogue.fullText}"`);
        this.game.dialogue.textIndex = this.game.dialogue.fullText.length;
        this.game.dialogue.currentText = this.game.dialogue.fullText;
        document.getElementById('dialogContent').textContent = this.game.dialogue.currentText;
        return;
    }

    console.log(`[DialogueSystem] Advancing to next line (current: ${this.game.dialogue.currentLine}/${this.game.dialogue.lines.length})`);
    this.game.dialogue.currentLine++;
    // ... rest of function
}
```

### Known Conflicts

**Movement**: 'a' key is ALSO used for "move left" (game.js:322)
- But movement is disabled during DIALOGUE state
- Should not interfere

**Game.js preventDefault**: game.js calls `e.preventDefault()` on all keys
- Both document and window listeners should still fire
- Should not prevent dialogue advancement

---

## Success Criteria

✅ Pressing 'a' shows console output
✅ Pressing 'a' completes typewriter if still typing
✅ Pressing 'a' advances to next line if typewriter complete
✅ Pressing 'a' works identically to Space and Enter
✅ Pressing 'A' (shift+a) also works
✅ No movement happens when pressing 'a' during dialogue

---

## If Test Fails

1. **Copy all console output** and report it
2. **Describe exactly what happened** (or didn't happen)
3. **Note which test failed** (Test 1, 2, 3, etc.)
4. **Check for JavaScript errors** in console

---

## Next Steps After Testing

Based on test results, we may need to:
- Fix event listener registration
- Fix state checking
- Fix event handler priority
- Add better visual feedback
- Adjust typewriter speed for testing

