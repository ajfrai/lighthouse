# Directory Structure

Production-ready organization for Lighthouse Adventure.

```
lighthouse/
├── index.html              # Main entry point
├── README.md              # Project overview and setup
├── LICENSE                # GPLv3 license
├── .gitignore            # Git ignore rules
│
├── src/                   # Source code
│   ├── game.js           # Main game engine
│   ├── data.js           # Game data (NPCs, quests, creatures)
│   ├── dialogueSystem.js # Dialogue system
│   ├── questSystem.js    # Quest management
│   ├── renderingSystem.js # Rendering engine
│   └── spriteLoader.js   # Sprite loading and management
│
├── assets/               # Static assets
│   ├── style.css        # Game stylesheet
│   └── sprites/         # Sprite images and JSON indexes
│       ├── tileset.png
│       ├── tileset.json
│       ├── characters.png
│       ├── characters.json
│       ├── tree.png
│       └── lighthouse.png
│
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md  # System architecture
│   ├── SCALING_AUDIT.md # Scaling analysis
│   ├── dialogue/        # Dialogue system docs
│   │   ├── DIALOGUE_AUDIT.md
│   │   ├── DIALOGUE_FLOW_AUDIT.md
│   │   ├── DIALOGUE_REFACTOR.md
│   │   └── DIALOGUE_UI_REBUILD.md
│   └── testing/         # Testing documentation
│       ├── A_BUTTON_TEST_PROTOCOL.md
│       ├── REFACTORING_ISSUE.md
│       └── dialogue_trees.txt
│
└── tools/               # Development tools
    ├── generate_sprites.py    # Sprite generation script
    ├── audit_dialogue.py      # Dialogue tree generator
    └── create_keyboard_test.py # Keyboard event tester
```

## File Purposes

### Source Code (`src/`)
- **game.js** - Main game loop, state management, input handling
- **data.js** - All game content (NPCs, dialogues, quests, creatures)
- **dialogueSystem.js** - Event-driven dialogue system with auto-advance
- **questSystem.js** - Quest management and problem generation
- **renderingSystem.js** - Canvas rendering for tiles, sprites, NPCs
- **spriteLoader.js** - Async sprite loading with JSON indexes

### Assets (`assets/`)
- **style.css** - All game styling
- **sprites/** - PNG sprite sheets and coordinate JSON files

### Documentation (`docs/`)
- **ARCHITECTURE.md** - System design and patterns
- **SCALING_AUDIT.md** - Analysis of scaling bottlenecks
- **dialogue/** - Complete dialogue system documentation
- **testing/** - Test protocols and procedures

### Tools (`tools/`)
- **generate_sprites.py** - Procedurally generate game sprites
- **audit_dialogue.py** - Parse and analyze dialogue trees
- **create_keyboard_test.py** - Generate keyboard event test pages

## Development Workflow

1. **Code changes**: Edit files in `src/`
2. **Asset updates**: Run `python tools/generate_sprites.py`
3. **Documentation**: Update relevant files in `docs/`
4. **Testing**: Use protocols in `docs/testing/`

## Production Deployment

Deploy these files/folders:
- `index.html`
- `src/`
- `assets/`

Optional for production:
- `README.md`
- `LICENSE`

NOT needed in production:
- `docs/`
- `tools/`
- `.gitignore`
