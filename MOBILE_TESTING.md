# Mobile Testing Guidelines

## CRITICAL: Testing on Mobile Devices

**PRIMARY TESTING ENVIRONMENT**: This game is tested on mobile devices (deployed to Vercel).

**DEBUGGING REQUIREMENT**: All debugging MUST use the in-app debug console, NOT browser console.

---

## Debug Console Usage

### Enabling the Debug Console

1. Deploy to Vercel
2. Open game on mobile device
3. Tap the **⚙️** (settings) button
4. Tap **"Debug Console: OFF"** to enable
5. The debug console will appear at the bottom of the screen

### What the Debug Console Shows

- All `console.log()` output from the game
- Timestamps for each log entry
- Auto-scrolls to show latest messages
- Keeps last 50 log entries

### Debug Console Features

- **Green text on black background** - Easy to read
- **Auto-scroll** - Latest logs always visible
- **Timestamps** - Track when events occur
- **JSON formatting** - Objects are stringified
- **Toggle on/off** - Enable only when needed

---

## For Developers: Adding Debug Output

### ✅ CORRECT - Use console.log()

```javascript
console.log('[DialogueSystem] Advancing to next line');
console.log(`[State] Current: ${this.state}, textIndex: ${this.textIndex}`);
console.log('[Event] Key pressed:', e.key);
```

All `console.log()` calls are automatically captured and displayed in the on-screen debug console when enabled.

### ❌ INCORRECT - Don't assume browser console

```javascript
// DON'T assume user can see browser DevTools
// DON'T use debugger statements
// DON'T rely on browser-only debugging features
```

---

## Testing Workflow

### 1. Add Debug Logging

```javascript
console.log('[Component] Function called with:', param);
console.log('[Component] Current state:', this.state);
console.log('[Component] Result:', result);
```

### 2. Deploy to Vercel

```bash
git add -A
git commit -m "Add debug logging for X"
git push
```

### 3. Test on Mobile

1. Open deployed app on mobile
2. Enable debug console (⚙️ → Debug Console: ON)
3. Perform the action being tested
4. Read debug console output
5. Report exact log messages

### 4. Analyze Results

- Look for errors or unexpected values in logs
- Verify execution order
- Check that expected logs appear
- Share log output for diagnosis

---

## Debug Console Location

- **File**: `src/debugLogger.js`
- **HTML**: `index.html` (lines 65-71) - console UI
- **CSS**: `assets/style.css` - console styling
- **Toggle**: `src/game.js` - button handler

---

## Current Debug Features

### Dialogue System Logging

The dialogue system has extensive logging:

```
[DialogueSystem] advanceDialogue() called
[DialogueSystem] - active: true
[DialogueSystem] - textIndex: 0, fullText.length: 45
[DialogueSystem] - currentLine: 0, total lines: 6
[DialogueSystem] Completing typewriter: "Marlowe sent you? Hm. You're smaller than I expected."
[DialogueSystem] Typewriter completed, RETURNING (double-tap mode)
```

### Mobile Controls Logging

```
[MobileControls] A button pressed - dispatching "a" keydown event
```

### Keyboard Events Logging

```
[DialogueSystem] Keydown event: key="a", state=dialogue, DIALOGUE=dialogue
[DialogueSystem] In DIALOGUE state, checking if key matches...
[DialogueSystem] Key "a" MATCHED - advancing dialogue
```

---

## Common Testing Scenarios

### Testing Dialogue Advancement

1. Enable debug console
2. Talk to NPC
3. Tap A button twice (complete typewriter, then advance)
4. Observe logs:
   - First tap: "Completing typewriter" + "RETURNING"
   - Second tap: "Advancing to next line" + "Starting next line (line 1)"
5. Verify speaker name and text appear

### Testing Mobile A Button

1. Enable debug console
2. Enter dialogue state
3. Tap on-screen A button
4. Should see: `[MobileControls] A button pressed - dispatching "a" keydown event`
5. Should see: `[DialogueSystem] Keydown event: key="a"`

---

## Troubleshooting

### Debug Console Not Showing Logs

**Check:**
- Is debug console enabled? (Green text should appear)
- Are you calling `console.log()` correctly?
- Is debugLogger.js loaded? (Check network tab)

### Debug Console Disabled After Reload

**Expected Behavior**: Debug console state resets on page reload.

**Workaround**: Re-enable after each reload via ⚙️ menu.

---

## Performance Considerations

- Debug logging has minimal performance impact
- Logs only captured when console is **enabled**
- Limited to 50 most recent entries
- Auto-cleanup prevents memory issues

---

## Best Practices

1. **Always test on mobile** - Desktop browser is not representative
2. **Enable debug console first** - Before performing test actions
3. **Report exact log output** - Copy/paste or screenshot logs
4. **Include timestamps** - Helps track timing issues
5. **Test with console disabled too** - Ensure no performance impact

---

## Future Enhancements

Potential improvements to debug console:

- Filter logs by component (e.g., show only [DialogueSystem])
- Export logs to file
- Persistent enable/disable state
- Color-coded log levels (info, warn, error)
- Larger scrollback buffer
