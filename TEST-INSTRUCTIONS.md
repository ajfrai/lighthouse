# Testing Instructions for Creature Encounter

## Static Test (Verifies Code Structure)

Run this first to verify the code structure is correct:

```bash
node test-encounter-flow.js
```

Expected output:
```
✓ bonding has creature_bonding_complete trigger
✓ creature_path_complete listener registered
✓ creature_bonding_complete listener registered
✓ creature_bonding_complete listener calls showCreatureNaming
✓ finishCreatureEncounter queues bonding flow
✓ showCreatureNaming shows encounterUI
✓ ALL STATIC TESTS PASSED
```

## Runtime Test (Verify In-Game)

1. **Clear browser cache** (important!)
   - Chrome/Edge: Ctrl+Shift+Delete → Clear cached images and files
   - Firefox: Ctrl+Shift+Delete → Clear cache
   - Or use hard refresh: Ctrl+F5

2. **Open the game** and open browser console (F12)

3. **Look for listener registration logs** at startup:
   ```
   [DialogueQueue] Registered listener for 'trigger:creature_path_complete' (total: 1)
   [DialogueQueue] Registered listener for 'trigger:creature_bonding_complete' (total: 1)
   [DialogueQueue] Registered listener for 'trigger:creature_naming_complete' (total: 1)
   ```

   ✓ If you see these, listeners are registered correctly

4. **Trigger the creature encounter** (go west to beach, approach the rocks)

5. **Watch for these logs** as you progress through the dialogues:

   When you complete the slow/wait/grab path:
   ```
   [DialogueQueue] >>>>>> Emitting trigger:creature_path_complete to 1 handler(s)
   [DialogueQueue] >>>>>> Calling handler 1 for trigger:creature_path_complete
   ========================================
   CREATURE PATH COMPLETE TRIGGER FIRED
   ========================================
   ========================================
   FINISH CREATURE ENCOUNTER CALLED
   ========================================
   BONDING FLOW QUEUED
   [DialogueQueue] >>>>>> Handler 1 completed
   ```

   When bonding dialogue completes:
   ```
   [DialogueQueue] >>>>>> Emitting trigger:creature_bonding_complete to 1 handler(s)
   [DialogueQueue] >>>>>> Calling handler 1 for trigger:creature_bonding_complete
   ========================================
   BONDING COMPLETE TRIGGER FIRED
   ========================================
   [Game] showCreatureNaming() called
   [DialogueQueue] >>>>>> Handler 1 completed
   ```

6. **The dedicated naming UI should appear** with:
   - Large creature sprite (6x scale)
   - Text: "It needs a name."
   - Choice buttons: Shimmer, Lumina, Spark, Glow, Nova
   - Navigate with arrow keys, select with Enter/Space

## If It Still Doesn't Work

Copy the ENTIRE console output and share it. The diagnostic logs will show exactly where the flow breaks:

- If no listener registration logs → `setupDialogueListeners()` not called
- If creature_path_complete doesn't emit → trigger not set on dialogue
- If handler doesn't execute → check for errors in handler stack trace
- If bonding_complete doesn't emit → trigger not set on bonding dialogue
- If showCreatureNaming() not called → check handler execution logs

## Expected Flow Summary

```
1. Player chooses path (slow/wait/grab)
   ↓
2. Last dialogue emits: trigger:creature_path_complete
   ↓
3. Handler calls: finishCreatureEncounter()
   ↓
4. finishCreatureEncounter() queues: CREATURE_FLOWS.bonding
   ↓
5. Bonding dialogue shows: "The creature settles against you..."
   ↓
6. Bonding dialogue emits: trigger:creature_bonding_complete
   ↓
7. Handler calls: showCreatureNaming()
   ↓
8. Dedicated naming UI appears
```

All of these steps should be visible in the console logs now.
