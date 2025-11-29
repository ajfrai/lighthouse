# Lighthouse - Educational Creature Game

A minimal playable demo of a Pokémon-style educational game combining exploration, creature battles, and math challenges.

## How to Play

1. Open `index.html` in your web browser
2. Use the buttons to navigate between locations
3. Encounter wild creatures, complete math jobs, and earn coins!

## Demo Features

### Exploration
- **4 connected locations**: Lighthouse, Coastal Path, Tidemark Village, and General Store
- Navigate between locations using the "Go to" buttons
- Each location has unique descriptions and interactions

### Creature Combat
- Trigger a wild **Seasprite** encounter on the Coastal Path
- Turn-based combat system with 4 stats:
  - ❤️ **Heart** (HP)
  - ⚔️ **Power** (Attack)
  - 🛡️ **Guard** (Defense)
  - ⚡ **Speed** (Turn order)
- **Damage formula**: Attacker's Power - Defender's Guard (minimum 1 damage)
- Speed determines who attacks first
- When wild creature's HP drops below 30%, you can **catch** it!
- You start with a "Shellback" creature to help you in battle

### NPC Jobs (Math Challenge)
- Talk to the **Old Fisherman** in Tidemark Village
- Accept his job to count the fish catch
- **Question**: "I caught 7 silverfish and 3 redmouths. Silverfish fetch 1 coin each, and redmouths fetch 2 coins each. How many coins is my catch worth?"
- Submit your answer to earn coins (or get gentle correction if wrong)

### Shop System
- Visit the **General Store** in Tidemark Village
- Buy a **Brass Compass** for 50 coins
- Track your progress toward purchasing in the sidebar

### Inventory & Progress Tracking
- View your coins in the sidebar
- See all caught creatures with their stats
- Track owned items

## Game Flow

1. **Start** at the Lighthouse
2. **Travel** to Coastal Path → encounter wild Seasprite
3. **Battle** the creature (attack, run, or catch when weak)
4. **Go to Village** → talk to the Old Fisherman
5. **Complete the math job** → earn 13 coins
6. **Repeat jobs** or explore to earn more coins
7. **Buy the compass** from the shop when you have 50 coins

## Technical Notes

### Architecture
- **Data-driven design**: All game content (creatures, locations, NPCs, jobs) defined in `data.js`
- **Modular structure**: Easy to add new locations, creatures, or jobs
- **No dependencies**: Pure vanilla JavaScript and CSS
- **Prepared for procedural generation**: Data structures designed to be generated/modified at runtime

### File Structure
```
lighthouse/
├── index.html    # Main HTML structure
├── style.css     # Game styling
├── data.js       # Game data (locations, creatures, NPCs, jobs, shop)
├── game.js       # Core game logic
└── README.md     # This file
```

### Future Expansion Points
- Currently hardcoded values are marked with comments in code
- Add more creature types in `GameData.creatures`
- Add more locations in `GameData.locations`
- Create procedurally generated jobs in `GameData.jobs`
- Expand combat with multiple moves (currently just "attack")
- Add save/load functionality
- Implement the full storm/time mechanic
- Add creature evolution and leveling
- Implement negotiation system

## Success Criteria ✓

- [x] Walk around connected locations
- [x] Fight one wild creature
- [x] Catch the creature when its HP is low
- [x] Complete one math job
- [x] Earn coins
- [x] See progress toward buying the compass
- [x] Purchase the compass when you have enough coins

## Tech Stack

- Vanilla JavaScript (ES6+)
- CSS3
- HTML5
- No external dependencies or frameworks

---

**Note**: This is a minimal demo focused on proving the core game loop. Polish, sound, save systems, and advanced features are intentionally omitted for rapid prototyping.
