// Game Data Configuration
// This file contains all game data in a modular, JSON-like format
// Easy to expand and eventually generate procedurally

const GameData = {
    // Creature definitions
    creatures: {
        seasprite: {
            name: "Seasprite",
            stats: {
                heart: 25,    // HP
                power: 8,     // Attack
                guard: 4,     // Defense
                speed: 12     // Turn order
            }
        },
        // Placeholder for future creatures
        // rockshell: { ... },
        // stormwing: { ... }
    },

    // Location/Map definitions
    locations: {
        lighthouse: {
            name: "The Lighthouse",
            description: "A tall stone lighthouse stands here, its beacon dark. The path winds down toward a small village. You can hear waves crashing against the rocks below.",
            connections: ["path"],
            // Encounter trigger - placeholder for procedural generation later
            encounterChance: 0,
            npcs: []
        },
        path: {
            name: "Coastal Path",
            description: "A winding path between the lighthouse and the village. Tall grass rustles in the sea breeze. Something might be lurking here...",
            connections: ["lighthouse", "village"],
            encounterChance: 0.8, // 80% chance of encounter on first visit
            encounterCreature: "seasprite",
            npcs: []
        },
        village: {
            name: "Tidemark Village",
            description: "A small fishing village with weathered buildings. Fishermen mend their nets near the docks. You can see a shop and a villager who looks like they need help.",
            connections: ["path", "shop"],
            encounterChance: 0,
            npcs: ["fisherman"]
        },
        shop: {
            name: "General Store",
            description: "A cozy shop filled with supplies and odd trinkets. The shopkeeper nods at you from behind the counter.",
            connections: ["village"],
            encounterChance: 0,
            npcs: [],
            isShop: true
        }
    },

    // NPC definitions
    npcs: {
        fisherman: {
            name: "Old Fisherman",
            dialog: "Ahoy there! I've got a job for ye if you're interested. I'll pay good coin for help counting my catch.",
            job: {
                id: "fish_count",
                given: false,
                completed: false
            }
        }
    },

    // Job/Quest definitions
    jobs: {
        fish_count: {
            name: "Count the Catch",
            description: "The fisherman needs help counting and calculating the value of his catch.",
            // Placeholder - in full game, these would be procedurally generated
            question: "I caught 7 silverfish and 3 redmouths today. Silverfish fetch 1 coin each, and redmouths fetch 2 coins each. How many coins is my catch worth?",
            correctAnswer: 13, // (7 * 1) + (3 * 2) = 7 + 6 = 13
            reward: 13,
            wrongAnswerDialog: "Hmm, let me check... 7 silverfish at 1 coin each is 7 coins, and 3 redmouths at 2 coins each is 6 coins. That's 13 total. No pay this time, but feel free to try again!",
            correctAnswerDialog: "That's right! You've got a good head for numbers. Here's your payment."
        }
    },

    // Shop inventory
    shopItems: {
        compass: {
            name: "Brass Compass",
            description: "A finely crafted compass that always points home. Useful for navigation.",
            price: 50,
            id: "compass"
        }
    },

    // Starting player state
    initialPlayerState: {
        location: "lighthouse",
        coins: 0,
        inventory: [],
        creatures: [],
        visitedLocations: ["lighthouse"],
        completedJobs: [],
        activeJobs: []
    }
};
