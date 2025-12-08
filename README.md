# 🏛️ Lighthouse Adventure

An educational creature collection game featuring modern pixel art aesthetics, built with vanilla JavaScript and programmatically-generated sprites.

## 🎮 Game Features

### Educational Gameplay
- **8 Creatures to Discover**: Encounter and learn about unique creatures with real scientific facts
- **Math Jobs**: Earn coins by solving addition, multiplication, and counting problems
- **Shop System**: Purchase helpful items like treasure maps, golden nets, speed boots, and mystical compasses
- **Progressive Learning**: Multiple NPCs offer different difficulty levels

### Technical Features
- **16x16 Pixel Art**: GBA-quality graphics generated programmatically using Python/Pillow
- **Sprite Sheet System**: Optimized PNG sprite sheets with JSON indexes
- **Animated Water**: 3-frame water animation for realistic ocean movement
- **Tile Variation**: 4 grass variants and 3 sand variants for natural-looking terrain
- **Character Animation**: 4-direction movement with 2-frame walk cycles
- **Mobile-Friendly**: Touch controls with virtual D-pad
- **No Dependencies**: Pure vanilla JavaScript, no frameworks

## 🎯 How to Play

### Controls
- **Arrow Keys / D-Pad**: Move your character
- **Space / A Button**: Interact with NPCs and objects

### Objectives
1. **Explore the island** around the lighthouse
2. **Talk to NPCs** to get jobs and earn coins
3. **Discover creatures** by walking around (random encounters)
4. **Buy items** from the shop to help your quest
5. **Collect all 8 creatures** and learn their scientific facts!

## 🏗️ Technical Implementation

### File Structure
```
lighthouse/
├── index.html           # Main HTML structure
├── style.css            # Game Boy-inspired styling
├── game.js              # Game engine and logic
├── spriteLoader.js      # PNG sprite sheet loader
├── data.js              # Game data (map, creatures, NPCs, jobs)
├── generate_sprites.py  # Python script to generate pixel art
└── static/
    └── sprites/
        ├── tileset.png       # Terrain tiles (256x128)
        ├── tileset.json      # Tile index
        ├── characters.png    # Character sprites (64x48)
        ├── characters.json   # Animation index
        ├── tree.png          # 32x32 tree sprite
        └── lighthouse.png    # 48x80 lighthouse sprite
```

### Sprite Generation
The game uses a Python script to generate pixel art programmatically:

```bash
python3 generate_sprites.py
```

This creates:
- **Tileset**: 16x16 tiles with subtle shading and variation
- **Characters**: 16x24 sprites with 4 directions × 2 animation frames
- **Structures**: Multi-tile objects (trees, lighthouse)
- **Transitions**: Edge tiles for smooth terrain boundaries

### Rendering System
- **Z-Layer Rendering**: Terrain → Objects → Characters
- **Canvas-Based**: Hardware-accelerated 2D rendering
- **Pixel-Perfect**: `image-rendering: crisp-edges` for sharp pixels
- **Sprite Sheets**: Single PNG files reduce HTTP requests

### Game Data
- **32×32 Grid**: 512×512 pixel canvas
- **Layer-Based Map**: Ground terrain with collision objects
- **Deterministic Variation**: Tiles vary based on position `(x*7 + y*13) % variants`

## 🎨 Aesthetic Design

### Color Palette
Modern GBA-style with muted, cohesive colors:
- **Grass**: `#6AAA64` (mid), `#8CBF7C` (light), `#536B4E` (dark)
- **Water**: `#5BA4C8` (mid), `#8AC7E2` (light), `#3E897D` (dark)
- **Sand**: `#E4CC94` (mid), `#F1E1BA` (light), `#CBB278` (dark)

### UI Style
- **Game Boy-inspired borders**: Wood-colored frames with layered shadows
- **Monospace font**: Courier New for retro feel
- **Semi-transparent overlays**: Minimal UI that doesn't block gameplay
- **Pixel-styled buttons**: Square corners, bold borders

## 🧩 Educational Content

### Creatures & Facts
Each creature comes with real scientific information:
- **Lumina (Moth)**: Ultraviolet light vision
- **Marina (Dolphin)**: One-eye-open sleeping behavior
- **Dusty (Crab)**: Limb regeneration
- **Pebble (Stone)**: Colonial organism behavior
- **Sprout (Plant)**: Underground communication networks
- **Blaze (Salamander)**: Heart regeneration
- **Frost (Crystal)**: Hexagonal ice structure
- **Spark (Firefly)**: Bioluminescence chemistry

### Math Skills
- **Addition**: Numbers 1-20, practice mental math
- **Multiplication**: Times tables 1-10
- **Counting**: Visual counting with emoji (5-20 objects)

## 🚀 Deployment

### Local Development
Simply open `index.html` in a modern web browser. No build step required!

### Production
Deploy as static files to any web host:
- Vercel
- Netlify
- GitHub Pages
- Any static file server

## 🔧 Regenerating Sprites

To modify the pixel art:

1. Edit `generate_sprites.py` (adjust colors, sizes, or details)
2. Run the generator:
   ```bash
   python3 generate_sprites.py
   ```
3. Refresh the game - changes appear immediately!

## 📱 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 13+)
- **Mobile**: Optimized for touch screens

## 🎓 Learning Goals

This game teaches:
- **Mathematics**: Addition, multiplication, counting
- **Science**: Biology, chemistry, geology facts
- **Problem-Solving**: Resource management, exploration
- **Reading Comprehension**: NPC dialogues and facts

## 📝 Credits

- **Game Design & Code**: Programmatic generation
- **Sprite Art**: Python/Pillow algorithmic pixel art
- **Educational Content**: Real scientific facts

## 📄 License

Free to use and modify for educational purposes.

---

**Enjoy your lighthouse adventure! 🌊⚡🏛️**
