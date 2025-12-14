# Refactor: Implement registry pattern and break up large files

## Current State

The codebase has grown to the point where refactoring would improve maintainability:

**Large Files:**
- `game.js`: ~1150 lines (main game engine)
- `data.js`: ~440 lines (all game data)
- `spriteLoader.js`: ~325 lines (sprite rendering)

**Existing Registries:**
- ✅ `QUESTS` - Quest registry
- ✅ `NPCS` - NPC registry
- ✅ `CREATURES` - Creature registry
- ✅ `JOBS` - Job generator registry

## Proposed Improvements

### 1. Registry Pattern Enhancements

Add new registries for extensibility:

- **Quest Step Handlers Registry**: Pluggable handlers for different step types
  ```javascript
  const QUEST_STEP_HANDLERS = {
      'visit_location': (game, step) => { /* ... */ },
      'problem': (game, step) => { /* ... */ },
      'talk_to': (game, step) => { /* ... */ },
      'fetch_item': (game, step) => { /* ... */ },
      'combat': (game, step) => { /* ... */ }
  };
  ```

- **Game State Handlers Registry**: Clean separation of state-specific logic
  ```javascript
  const STATE_HANDLERS = {
      EXPLORING: { handleInput, handleKeyPress, render },
      DIALOGUE: { handleInput, handleKeyPress, render },
      COMBAT: { handleInput, handleKeyPress, render }
  };
  ```

- **Dialogue System Registry**: Different dialogue types
  ```javascript
  const DIALOGUE_TYPES = {
      'narrative': (game, dialogue) => { /* ... */ },
      'choice': (game, dialogue) => { /* ... */ },
      'trade': (game, dialogue) => { /* ... */ }
  };
  ```

### 2. File Breakdown Strategy

**Break `game.js` into modules:**
```
/src/
  gameCore.js          (~200 lines) - Main loop, init, input handling
  questSystem.js       (~250 lines) - Quest framework, objectives, markers
  dialogueSystem.js    (~200 lines) - Dialogue, typewriter, choices
  encounterSystem.js   (~200 lines) - Creature encounters, first encounter
  renderingSystem.js   (~300 lines) - All render methods
  uiSystem.js          (~200 lines) - Shop, jobs, menus
  playerSystem.js      (~100 lines) - Player movement, collision
```

**Break `data.js` into modules:**
```
/data/
  quests/
    callumsQuests.js   - Fishing quests
    scientistQuests.js - Science quests
    questRegistry.js   - Master quest registry
  npcs/
    dialogueNPCs.js    - Keeper and story NPCs
    questNPCs.js       - Quest givers
    vendorNPCs.js      - Shop, job NPCs
  creatures.js
  map.js
  shop.js
```

## Benefits

1. **Extensibility**: Easy to add new quest types, NPC behaviors, dialogue systems
2. **Maintainability**: Smaller, focused files are easier to understand and modify
3. **Testing**: Isolated systems are easier to unit test
4. **Community**: Plugin-like architecture enables community content/mods
5. **Collaboration**: Multiple developers can work on different systems without conflicts

## Implementation Steps

### Phase 1: Registry Pattern
- [ ] Create quest step handler registry
- [ ] Refactor `advanceQuestStep()` to use handlers
- [ ] Test with existing quests
- [ ] Add new quest step types (talk_to, fetch_item)

### Phase 2: Extract Systems
- [ ] Extract quest system to `questSystem.js`
- [ ] Extract dialogue system to `dialogueSystem.js`
- [ ] Extract rendering to `renderingSystem.js`
- [ ] Extract UI handlers to `uiSystem.js`
- [ ] Update imports in `index.html`

### Phase 3: Break Up Data
- [ ] Split quests by NPC/theme
- [ ] Split NPCs by type
- [ ] Create data loader/registry
- [ ] Test all game systems

### Phase 4: Documentation
- [ ] Document registry pattern usage
- [ ] Create guide for adding new quest types
- [ ] Create guide for adding new NPCs
- [ ] Update architecture diagram

## Success Criteria

- All existing functionality works unchanged
- No file exceeds 400 lines
- New quest types can be added without modifying core engine
- Test coverage for all registries
- Documentation for extensibility points

## Priority

**Medium** - Not blocking current development, but important for long-term maintainability and scalability.

## Labels

`refactoring`, `architecture`, `technical-debt`, `enhancement`
