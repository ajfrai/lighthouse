# Lighthouse Adventure - Scaling and Architecture Audit

**Date**: 2025-12-14
**Purpose**: Identify architectural bottlenecks and recommend changes for scaling to arbitrary regions, stories, exercises, and encounters.

---

## Executive Summary

**Current State**: The game has a solid foundation with modular subsystems (dialogue, quest, rendering) but suffers from **hardcoded data structures** that prevent scaling beyond the initial island region.

**Critical Bottlenecks**:
1. **Single-map architecture** - Cannot add new regions without rewriting map system
2. **Hardcoded plot phases** - Story progression locked to enum values
3. **Mixed NPC identification** - NPCs referenced by both id and role (mathTeacher/Callum)
4. **Terrain-coupled creature spawns** - Creature habitats tied to specific terrain strings
5. **Monolithic data.js** - All game content in one 740-line file

**Recommendation**: Implement a **region/scene system** with **data-driven content loading** before adding more content.

---

## 1. Map and Region System

### Current Architecture
```javascript
const MAP_DATA = {
    width: 32,
    height: 32,
    ground: [...], // 1024-element flat array
    objects: [...] // NPCs, buildings positioned absolutely
}
```

### ❌ Scaling Issues

1. **Single Hardcoded Map**
   - All terrain defined as one flat array
   - Cannot transition between regions (village → forest → cave)
   - No way to represent indoor spaces separately

2. **Absolute Positioning**
   - NPCs/objects use global coordinates (x: 15, y: 17)
   - Moving to new region requires recalculating all positions

3. **Fixed Size**
   - Map dimensions hardcoded (32x32)
   - Expanding requires changing canvas size and all coordinates

4. **No Regional Metadata**
   - No spawn points, boundaries, or connections between areas
   - No regional encounter tables or music zones

### ✅ What Works
- Tile-based system is solid
- Object collision detection works well
- Ground layer + object layer separation is good

### 🔧 Recommended Changes

**Priority 1: Region System**
```javascript
const REGIONS = {
    lighthouse_island: {
        id: 'lighthouse_island',
        name: 'Lighthouse Island',
        width: 32,
        height: 32,
        ground: [...],
        objects: [...],
        spawnPoint: { x: 15, y: 19 },
        connections: [
            { x: 0, y: 16, toRegion: 'mainland', toPoint: { x: 31, y: 16 } }
        ],
        encounterTable: 'island_creatures',
        music: 'lighthouse_theme'
    },
    mainland: {
        id: 'mainland',
        name: 'Mainland Village',
        // ...
    }
}
```

**Priority 2: Relative Positioning**
```javascript
// Instead of absolute coordinates
{ type: 'npc', id: 'keeper', x: 15, y: 17 }

// Use region-relative with anchors
{
    type: 'npc',
    id: 'keeper',
    anchor: 'lighthouse',
    offset: { x: 0, y: 2 }, // 2 tiles south of lighthouse
    sprite: 'down'
}
```

**Priority 3: Map Loading System**
```javascript
class MapManager {
    loadRegion(regionId) { /* ... */ }
    transitionToRegion(regionId, spawnPoint) { /* ... */ }
    unloadCurrentRegion() { /* ... */ }
}
```

---

## 2. Story and Dialogue System

### Current Architecture
```javascript
// Hardcoded story progression
const PlotPhase = {
    WAKE_UP: 'wake_up',
    FIND_CREATURE: 'find_creature',
    // ... 9 total phases
}

// Condition-based dialogue selection
dialogues: [
    {
        condition: (game) => game.plotPhase === 'wake_up',
        text: [...],
        choices: [...]
    }
]
```

### ❌ Scaling Issues

1. **Enum-Based Story Progression**
   - Adding new story arcs requires modifying PlotPhase enum
   - Cannot have parallel storylines (main quest + side quests)
   - No way to track multiple quest chains

2. **Phase Names Leak Implementation**
   - 'boat_quest' vs BOAT_QUEST_START inconsistency
   - No separation between story beats and game state

3. **No Story Arc Management**
   - Cannot disable/enable story arcs
   - No way to branch stories based on player choices
   - Cannot serialize story state for save games

4. **Dialogue Tightly Coupled to Game State**
   - Condition functions access `game.plotPhase`, `game.coins`, etc.
   - Hard to test dialogue in isolation
   - Cannot reuse dialogue for similar scenarios

### ✅ What Works
- Dialogue framework with conditions is flexible
- Multi-line dialogue with typewriter effect works well
- Choice system is clean and functional

### 🔧 Recommended Changes

**Priority 1: Quest Chain System**
```javascript
const QUEST_CHAINS = {
    main_story: {
        id: 'main_story',
        name: 'The Lighthouse',
        quests: [
            'wake_up',
            'find_first_creature',
            'return_to_keeper',
            'meet_village',
            'repair_boat',
            'departure'
        ],
        currentQuest: 'wake_up'
    },
    callum_fishing: {
        id: 'callum_fishing',
        name: "Callum's Tasks",
        quests: ['fishing_crates', 'fishing_nets', 'fishing_baskets'],
        repeatable: true
    }
}

// Track progress separately
state.questChains = {
    main_story: { currentIndex: 0, completed: false },
    callum_fishing: { currentIndex: 1, completed: false }
}
```

**Priority 2: Dialogue State Abstraction**
```javascript
// Instead of accessing game state directly
condition: (game) => game.plotPhase === 'wake_up'

// Use story state queries
condition: (story) => story.isQuestActive('main_story', 'wake_up')
```

**Priority 3: Reusable Dialogue Templates**
```javascript
const DIALOGUE_TEMPLATES = {
    merchant_greeting: (npcName, shopType) => [
        `Welcome to ${npcName}'s ${shopType}!`,
        "What can I get for you today?"
    ],
    quest_complete: (questName, reward) => [
        `Excellent work on ${questName}!`,
        `You earned ${reward} coins!`
    ]
}
```

---

## 3. Creature and Encounter System

### Current Architecture
```javascript
const CREATURES = {
    lumina: {
        name: 'Lumina',
        habitats: ['tallgrass'],
        encounterRate: 0.15,
        requiresAbility: null
    }
}

// Encounter check
if (creature.habitats.includes(terrain)) {
    // trigger encounter
}
```

### ❌ Scaling Issues

1. **Terrain String Coupling**
   - Habitats use raw terrain strings ('tallgrass', 'water')
   - Cannot have region-specific spawns (island water vs ocean water)
   - No time-of-day or weather-based spawns

2. **Flat Creature List**
   - All creatures in one global object
   - No way to organize by region or type
   - Cannot lazy-load creature data

3. **Hardcoded First Encounter**
   - Lumina encounter at specific coordinates (19, 11)
   - Tightly coupled to plot phase
   - Cannot reuse encounter system for other scripted events

4. **No Encounter Zones**
   - Encounters trigger per-tile, not per-zone
   - Cannot define "safe zones" or "danger zones"
   - No spawn density control

### ✅ What Works
- Random encounter rate system is solid
- Habitat-based spawning makes sense
- Ability requirements (surf, torch) are good gates

### 🔧 Recommended Changes

**Priority 1: Encounter Tables**
```javascript
const ENCOUNTER_TABLES = {
    island_grassland: {
        encounters: [
            { creatureId: 'lumina', weight: 30, minLevel: 1 },
            { creatureId: 'sprout', weight: 25, minLevel: 1 },
            { creatureId: 'spark', weight: 15, minLevel: 3 }
        ],
        baseRate: 0.10
    },
    ocean_deep: {
        encounters: [
            { creatureId: 'marina', weight: 50, minLevel: 5 },
            { creatureId: 'frost', weight: 20, minLevel: 8 }
        ],
        baseRate: 0.12,
        requiresAbility: 'surf'
    }
}

// Map zones reference tables
zones: [
    { x: 18, y: 10, width: 4, height: 4, table: 'island_grassland' }
]
```

**Priority 2: Scripted Encounter System**
```javascript
const SCRIPTED_ENCOUNTERS = {
    first_creature: {
        id: 'first_creature',
        trigger: {
            type: 'zone',
            region: 'lighthouse_island',
            x: 19, y: 11, width: 2, height: 2
        },
        condition: (game) => game.story.isQuestActive('main_story', 'find_first_creature'),
        oneTime: true,
        encounter: {
            type: 'narrative',
            creature: 'lumina',
            sequence: 'first_creature_narrative'
        }
    }
}
```

**Priority 3: Regional Creature Registry**
```javascript
const CREATURE_REGIONS = {
    lighthouse_island: ['lumina', 'sprout', 'spark', 'dusty', 'pebble'],
    mainland: ['different_creatures'],
    ocean: ['marina', 'frost']
}
```

---

## 4. Quest and Exercise System

### Current Architecture
```javascript
// Two separate systems
const QUESTS = {
    fishing_crates: {
        type: 'one_off',
        problem: { question: '...', answers: [...], correct: '...' }
    }
}

const JOBS = {
    addition: () => { /* generate problem */ },
    multiplication: () => { /* generate problem */ }
}

// Hardcoded quest step handlers
const QUEST_STEP_HANDLERS = {
    'visit_location': { onStart, onUpdate, onRender },
    'problem': { onStart, onUpdate, onRender }
}
```

### ❌ Scaling Issues

1. **Two Competing Systems**
   - QUESTS (multi-step) vs JOBS (single problem)
   - Inconsistent interfaces
   - Cannot mix quest steps with job-style generation

2. **Hardcoded Exercise Generators**
   - JOBS.addition, JOBS.multiplication are functions
   - Cannot add new problem types without code changes
   - No difficulty scaling or adaptive learning

3. **Fixed Quest Step Types**
   - Only 4 types: visit_location, problem, talk_to, fetch_item
   - Adding new mechanics requires modifying QUEST_STEP_HANDLERS
   - Cannot create custom quest types without touching core code

4. **No Exercise Metadata**
   - No difficulty levels, categories, or prerequisites
   - Cannot track which exercise types player has mastered
   - No progression system for math skills

### ✅ What Works
- Registry pattern for quest step handlers is good
- Problem structure (question, answers, correct) is clean
- Multi-step quest system works well

### 🔧 Recommended Changes

**Priority 1: Unified Exercise System**
```javascript
const EXERCISES = {
    addition_basic: {
        id: 'addition_basic',
        category: 'arithmetic',
        difficulty: 1,
        generator: {
            type: 'math_expression',
            operation: 'addition',
            range: { min: 1, max: 20 },
            wrongAnswerStrategy: 'nearby'
        }
    },
    word_problem_fish: {
        id: 'word_problem_fish',
        category: 'word_problems',
        difficulty: 2,
        generator: {
            type: 'template',
            template: 'If I catch {a} fish and {b} more, how many total?',
            variables: { a: [1, 10], b: [1, 10] },
            answer: (vars) => vars.a + vars.b
        }
    }
}
```

**Priority 2: Pluggable Quest Step System**
```javascript
// Allow custom quest step types to be registered
questSystem.registerStepHandler('minigame', {
    onStart: (game, step) => { /* ... */ },
    onUpdate: (game, step) => { /* ... */ },
    onRender: (game, step) => { /* ... */ }
});

// Use in quest definition
steps: [
    { type: 'visit_location', location: { x: 10, y: 5 } },
    { type: 'minigame', game: 'memory_match', difficulty: 2 },
    { type: 'problem', exercise: 'addition_basic' }
]
```

**Priority 3: Exercise Progression Tracking**
```javascript
state.exerciseProgress = {
    addition_basic: { attempts: 10, correct: 8, mastered: false },
    multiplication_basic: { attempts: 5, correct: 3, mastered: false }
}

// Adaptive difficulty
function selectExercise(category, targetDifficulty) {
    const unmastered = EXERCISES.filter(e =>
        e.category === category &&
        !state.exerciseProgress[e.id]?.mastered
    );
    return weightedRandom(unmastered, targetDifficulty);
}
```

---

## 5. NPC System

### Current Architecture
```javascript
const NPCS = {
    keeper: { name: 'Marlowe', type: 'dialogue_npc', dialogues: [...] },
    mathTeacher: { name: 'Callum', type: 'dialogue_npc', dialogues: [...] },
    shopkeeper: { name: 'Marina', shop: true }
}

// Map placement
objects: [
    { type: 'npc', id: 'keeper', x: 15, y: 17, sprite: 'down' },
    { type: 'npc', id: 'mathTeacher', x: 9, y: 19, sprite: 'right' }
]
```

### ❌ Scaling Issues

1. **Inconsistent ID/Name Mapping**
   - NPC stored as 'mathTeacher' but named 'Callum'
   - Confusing: `NPCS.mathTeacher.name === 'Callum'`
   - Cannot easily search for NPC by display name

2. **Type Mixing**
   - Some NPCs have `type: 'dialogue_npc'`, others have `shop: true`
   - Inconsistent property checking
   - Hard to extend with new NPC types

3. **Absolute Map Positioning**
   - NPC coordinates hardcoded in MAP_DATA.objects
   - Cannot move NPCs between regions
   - No way to have NPCs that move or patrol

4. **No NPC State**
   - NPCs are stateless (except dialogue conditions)
   - Cannot track relationship levels, quests given, etc.
   - No way to have NPCs react to player actions

### ✅ What Works
- Dialogue framework is flexible
- NPC interaction system is clean
- Character types (teacher, fisherman, shopkeeper) work well

### 🔧 Recommended Changes

**Priority 1: Consistent NPC Identification**
```javascript
const NPCS = {
    marlowe: {  // Use actual name as key
        id: 'marlowe',
        name: 'Marlowe',
        title: 'The Keeper',
        role: 'keeper',  // Functional role separate from identity
        type: 'dialogue_npc',
        dialogues: [...]
    },
    callum: {
        id: 'callum',
        name: 'Callum',
        role: 'fisherman',
        type: 'quest_npc',
        quests: [...]
    }
}
```

**Priority 2: NPC Type System**
```javascript
const NPC_TYPES = {
    dialogue: {
        requiredProps: ['dialogues'],
        onInteract: (game, npc) => game.dialogueSystem.showNPCDialog(npc.id)
    },
    merchant: {
        requiredProps: ['shop', 'inventory'],
        onInteract: (game, npc) => game.shopSystem.openShop(npc.id)
    },
    quest_giver: {
        requiredProps: ['quests'],
        onInteract: (game, npc) => game.questSystem.showQuestMenu(npc.id)
    }
}
```

**Priority 3: NPC Instance System**
```javascript
// Definition (template)
const NPC_TEMPLATES = {
    marlowe: { name: 'Marlowe', dialogues: [...] }
}

// Instance (placed in world)
state.npcInstances = {
    'lighthouse_island.marlowe': {
        templateId: 'marlowe',
        region: 'lighthouse_island',
        position: { x: 15, y: 17 },
        state: {
            relationshipLevel: 0,
            questsGiven: ['find_first_creature'],
            lastInteraction: Date.now()
        }
    }
}
```

---

## 6. Data Organization

### Current State
```
data.js - 740 lines
├── MAP_DATA (260 lines)
├── CREATURES (74 lines)
├── QUEST_STEP_HANDLERS (150 lines)
├── QUESTS (150 lines)
├── NPCS (90 lines)
└── SHOP_ITEMS, JOBS (16 lines)
```

### ❌ Scaling Issues

1. **Monolithic Data File**
   - All content in one file
   - Hard to navigate and edit
   - Merge conflicts in team development

2. **No Content Versioning**
   - Cannot A/B test different dialogue
   - Cannot roll back content changes easily
   - No way to preview changes before deploying

3. **Hardcoded Constants**
   - Magic numbers throughout (8 planks, 20 rope, 50 coin compass)
   - No central config for game balance

4. **No Content Validation**
   - Typos in quest IDs or NPC references fail silently
   - No schema validation for data structures

### 🔧 Recommended Changes

**Priority 1: Split Data Files**
```
data/
├── regions/
│   ├── lighthouse_island.js
│   └── mainland.js
├── creatures/
│   ├── island_creatures.js
│   └── ocean_creatures.js
├── npcs/
│   ├── marlowe.js
│   ├── callum.js
│   └── marina.js
├── quests/
│   ├── main_story.js
│   ├── fishing_quests.js
│   └── side_quests.js
├── exercises/
│   ├── arithmetic.js
│   └── word_problems.js
└── config/
    ├── balance.js  // Game balance constants
    └── validation.js  // Data schema validation
```

**Priority 2: Configuration Management**
```javascript
const GAME_CONFIG = {
    boat: {
        planks_required: 8,
        rope_required: 20,
        compass_price: 50
    },
    encounters: {
        base_rate: 0.10,
        golden_net_multiplier: 2.0
    },
    progression: {
        creatures_for_working_phase: 3,
        creatures_for_boat_ready: 6
    }
}
```

**Priority 3: Content Loader**
```javascript
class ContentLoader {
    async loadRegion(regionId) { /* ... */ }
    async loadCreatures(regionId) { /* ... */ }
    async loadQuests(questChainId) { /* ... */ }
    validateContent(content, schema) { /* ... */ }
}
```

---

## 7. Code Quality Issues

### Unprofessional Elements Found

1. **Inconsistent Naming**
   - `mathTeacher` → should be `callum` or `fishing_quest_giver`
   - `shopkeeper` → should be `marina`
   - `scientist` → should be `dr_nova`

2. **Orphaned Comments**
   ```javascript
   // Old dialogue/quest methods removed - now in subsystems
   // TODO: Implement menu UI
   ```

3. **Unclear Variable Names**
   - `game.firstEncounterTriggered` - triggered or completed?
   - `game.encounterState.active` - active encounter or state tracking?

4. **Magic Numbers**
   - `if (distance <= step.radius)` - what is step.radius?
   - `const pulse = Math.sin(time * 3) * 0.2 + 0.8;` - why 3, 0.2, 0.8?

5. **Inconsistent Error Handling**
   - Some functions return early on error
   - Some functions log to console
   - Some fail silently

### 🔧 Cleanup Recommendations

**Immediate Fixes**:
- Rename NPCs to use display names as keys
- Remove outdated comments
- Extract magic numbers to constants
- Add JSDoc comments to public methods

**Near-term**:
- Standardize error handling
- Add input validation to public methods
- Create coding standards document
- Set up linter with consistent rules

---

## 8. Architecture Recommendations

### Phase 1: Foundation (Before Adding Content)

1. **Extract Configuration**
   - Move magic numbers to GAME_CONFIG
   - Create balance.js for tunable parameters

2. **Rename NPCs**
   - mathTeacher → callum
   - shopkeeper → marina
   - Keep IDs consistent with names

3. **Clean Up Comments**
   - Remove TODO comments or convert to GitHub issues
   - Remove "old code" references
   - Add proper JSDoc documentation

### Phase 2: Data Layer (Enable Content Scaling)

4. **Implement Region System**
   - Create REGIONS object with metadata
   - Build MapManager for region transitions
   - Update rendering to support multiple regions

5. **Split Data Files**
   - Break data.js into modules
   - Create data/ directory structure
   - Implement ContentLoader

6. **Quest Chain System**
   - Replace PlotPhase enum with quest chains
   - Separate story state from game state
   - Allow parallel quest lines

### Phase 3: Content Tools (Enable Non-Developer Content)

7. **Exercise Generator Framework**
   - Pluggable exercise types
   - Template-based generation
   - Difficulty progression system

8. **Quest Builder**
   - JSON schema for quest definitions
   - Visual quest editor (future)
   - Quest validation tools

9. **NPC State System**
   - Relationship tracking
   - Dynamic dialogue based on state
   - NPC schedules and movement

### Phase 4: Advanced Features

10. **Save/Load System**
    - Serialize game state
    - Quest chain progress
    - NPC relationships
    - Creature collection

11. **Content Modding Support**
    - Plugin API for custom content
    - Content packs (regions, quests, creatures)
    - Workshop integration (future)

---

## 9. Testing Recommendations

### Current State
- No automated tests
- Manual playtesting only
- Syntax validation only

### Recommended Test Structure

```
tests/
├── unit/
│   ├── questSystem.test.js
│   ├── dialogueSystem.test.js
│   └── encounterSystem.test.js
├── integration/
│   ├── storyProgression.test.js
│   └── questCompletion.test.js
└── e2e/
    └── fullPlaythrough.test.js
```

### Critical Test Cases

1. **Dialogue State Management**
   - Test all dialogue conditions
   - Verify phase transitions
   - Check for dialogue deadlocks

2. **Quest Completion**
   - Test all quest step types
   - Verify rewards are granted
   - Check for quest soft-locks

3. **Encounter System**
   - Verify encounter rates
   - Test habitat filtering
   - Check ability requirements

---

## 10. Migration Path

### Minimal Disruption Approach

**Week 1: Foundation**
- Extract GAME_CONFIG constants
- Rename NPC keys to match display names
- Clean up comments and TODOs
- Add JSDoc to major classes

**Week 2: Data Separation**
- Create data/ directory structure
- Split data.js into modules
- Implement ContentLoader
- Migrate existing content

**Week 3: Region System**
- Define REGIONS structure
- Create MapManager class
- Update rendering system
- Test region transitions

**Week 4: Quest Chains**
- Implement QuestChainManager
- Convert PlotPhase to quest chains
- Update dialogue conditions
- Test story progression

**Week 5+: Iterative Improvements**
- Add new regions one at a time
- Expand exercise library
- Create additional quest chains
- Build content tools

---

## 11. Priority Matrix

| Priority | Change | Impact | Effort | Blocks |
|----------|--------|--------|--------|--------|
| P0 | Extract config constants | High | Low | Nothing |
| P0 | Rename NPC keys | Medium | Low | Nothing |
| P0 | Clean up comments | Low | Low | Nothing |
| P1 | Split data files | High | Medium | Content scaling |
| P1 | Region system | High | High | New areas |
| P2 | Quest chain system | High | High | Story branching |
| P2 | Exercise framework | Medium | Medium | New exercises |
| P3 | NPC state system | Medium | Medium | Relationships |
| P3 | Save/load system | High | High | User retention |

---

## 12. Conclusion

**The Good**: The game has a solid technical foundation with well-separated subsystems. The dialogue framework, quest registry, and rendering system are all well-designed.

**The Problem**: Content is hardcoded and tightly coupled, making it impossible to scale without major refactoring.

**The Solution**: Implement a data-driven architecture with regions, quest chains, and content loading before adding more content.

**Estimated Effort**: 4-5 weeks for full migration, but can be done incrementally without breaking existing functionality.

**Next Steps**:
1. Clean up unprofessional code (1 day)
2. Extract configuration constants (2 days)
3. Implement region system (1 week)
4. Split data files (3 days)
5. Begin adding new content with new architecture

---

**Document Status**: ✅ Complete
**Review Required**: Yes
**Action Items**: See Phase 1 recommendations
