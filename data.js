// Game Data - Tile-based map system
// Tile size: 32x32 pixels

const GameData = {
    TILE_SIZE: 32,

    // Tile types with colors (simple colored rectangles for now)
    tiles: {
        grass: { color: '#2d5016', walkable: true },
        path: { color: '#8b7355', walkable: true },
        water: { color: '#1e4d8b', walkable: false },
        sand: { color: '#e0d0a0', walkable: true },
        building: { color: '#6b5b3e', walkable: false },
        door: { color: '#4a3520', walkable: true, isInteraction: true },
        tallGrass: { color: '#3d6b21', walkable: true, encounter: true },
        lighthouse: { color: '#c0c0c0', walkable: false },
        tree: { color: '#1a3d0f', walkable: false },
        shop: { color: '#8b4513', walkable: false },
        counter: { color: '#654321', walkable: false }
    },

    // Game world map (each area is a 2D grid)
    // Map format: each cell is a tile type
    // 0 = grass, 1 = path, 2 = water, 3 = sand, 4 = building, 5 = door, 6 = tallGrass, 7 = lighthouse, 8 = tree, 9 = shop, 10 = counter
    map: {
        // Starting area - 20x15 tiles (640x480 pixels)
        main: {
            width: 20,
            height: 15,
            tiles: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,3,3,3,3,3,3,8,0,0,0,0,0,8,3,3,3,3,3,2],
                [2,3,7,7,7,3,3,0,0,6,6,6,0,0,3,4,4,4,3,2],
                [2,3,7,7,7,3,1,1,1,6,6,6,1,1,1,4,5,4,3,2],
                [2,3,3,5,3,3,1,0,0,6,6,6,0,0,1,4,4,4,3,2],
                [2,3,3,3,3,3,1,0,0,0,0,0,0,0,1,3,3,3,3,2],
                [2,8,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,8,2],
                [2,0,0,0,0,0,1,1,1,1,5,1,1,1,1,0,0,0,0,2],
                [2,0,0,0,8,0,0,0,0,4,4,4,0,0,0,0,8,0,0,2],
                [2,0,0,0,0,0,0,0,0,4,9,4,0,0,0,0,0,0,0,2],
                [2,0,8,0,0,0,0,0,0,4,4,4,0,0,0,0,0,8,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,8,0,0,0,0,0,0,0,8,0,0,0,0,2],
                [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            tileKey: ['grass', 'path', 'water', 'sand', 'building', 'door', 'tallGrass', 'lighthouse', 'tree', 'shop', 'counter']
        }
    },

    // Interaction points on the map
    interactions: {
        // Shop entrance
        shop: { x: 10, y: 7, type: 'shop' },
        // Fisherman NPC
        fisherman: { x: 16, y: 3, type: 'npc', npcId: 'fisherman' },
        // Lighthouse entrance
        lighthouseEntrance: { x: 3, y: 4, type: 'info', message: 'The lighthouse stands tall. Its beacon is dark.' }
    },

    // NPCs with positions on map
    npcs: {
        fisherman: {
            name: "Old Fisherman",
            x: 16,
            y: 3,
            color: '#ff8c42', // Orange color for NPC
            dialog: "Ahoy there! I've got a job for ye if you're interested. I'll pay good coin for help counting my catch.",
            job: {
                id: "fish_count",
                given: false,
                completed: false
            }
        }
    },

    // Job definitions
    jobs: {
        fish_count: {
            name: "Count the Catch",
            description: "Help the fisherman calculate his earnings.",
            question: "I caught 7 silverfish and 3 redmouths today. Silverfish fetch 1 coin each, redmouths fetch 2 coins each. How many coins total?",
            correctAnswer: 13,
            reward: 13,
            wrongAnswerDialog: "Let me check... 7 silverfish at 1 coin = 7 coins, 3 redmouths at 2 coins = 6 coins. That's 13 total. Try again!",
            correctAnswerDialog: "That's right! You've got a good head for numbers. Here's your payment."
        }
    },

    // Creatures
    creatures: {
        seasprite: {
            name: "Seasprite",
            color: '#4da6ff', // Light blue
            stats: {
                heart: 25,
                power: 8,
                guard: 4,
                speed: 12
            }
        }
    },

    // Shop items
    shopItems: {
        compass: {
            name: "Brass Compass",
            description: "A finely crafted compass. Always points home.",
            price: 50,
            id: "compass"
        }
    },

    // Encounter zones (tall grass areas)
    encounterZones: [
        { x: 9, y: 2, width: 3, height: 3, creature: 'seasprite', chance: 0.3 }
    ],

    // Player starting position
    playerStart: {
        x: 3,
        y: 5
    },

    // Initial game state
    initialState: {
        coins: 0,
        inventory: [],
        creatures: [
            // Starter creature
            {
                name: "Shellback",
                stats: {
                    heart: 30,
                    maxHeart: 30,
                    power: 6,
                    guard: 6,
                    speed: 8
                }
            }
        ],
        completedJobs: [],
        activeJobs: [],
        defeatedEncounters: []
    }
};
