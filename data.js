/**
 * Game Data
 * Map, creatures, NPCs, jobs, shop items
 */

// Map data with layers (32x32 tiles, 16px each = 512x512 canvas)
const MAP_DATA = {
    width: 32,
    height: 32,
    tileSize: 16,

    // Ground layer - base terrain with more variety
    ground: [
        // Row 0-5: Water (ocean)
        ...Array(6).fill(null).map(() => Array(32).fill('water')),

        // Row 6-8: Beach with sand
        ...Array(3).fill(null).map(() => Array(32).fill('sand')),

        // Row 9: Transition row (mostly grass, some sand near edges)
        ...Array(1).fill(null).map(() => {
            const row = Array(32).fill('grass');
            row[0] = 'sand'; row[1] = 'sand'; row[30] = 'sand'; row[31] = 'sand';
            return row;
        }),

        // Rows 10-31: Grassland with lighthouse area
        ...Array(22).fill(null).map((_, rowIdx) => {
            const row = Array(32).fill('grass');
            // Keep some sand patches near western edge (storytelling: path from beach)
            if (rowIdx < 5 && (rowIdx % 2 === 0)) {
                row[2] = 'sand';
                row[3] = 'sand';
            }
            return row;
        })
    ].flat(),

    // Collision objects (structures, NPCs)
    objects: [
        // Lighthouse (center-top, 3x5 tiles) - the focal point
        { type: 'lighthouse', x: 14, y: 11, width: 3, height: 5 },

        // Dense tree clusters creating "forest" areas
        // Western forest (left side)
        { type: 'tree', x: 3, y: 15 },
        { type: 'tree', x: 5, y: 14 },
        { type: 'tree', x: 4, y: 17 },
        { type: 'tree', x: 2, y: 19 },
        { type: 'tree', x: 6, y: 19 },
        { type: 'tree', x: 3, y: 22 },
        { type: 'tree', x: 7, y: 23 },

        // Eastern forest (right side)
        { type: 'tree', x: 25, y: 14 },
        { type: 'tree', x: 27, y: 15 },
        { type: 'tree', x: 24, y: 17 },
        { type: 'tree', x: 28, y: 18 },
        { type: 'tree', x: 26, y: 20 },
        { type: 'tree', x: 29, y: 22 },

        // Southern grove (bottom area)
        { type: 'tree', x: 10, y: 28 },
        { type: 'tree', x: 13, y: 27 },
        { type: 'tree', x: 15, y: 29 },
        { type: 'tree', x: 18, y: 28 },
        { type: 'tree', x: 21, y: 27 },
        { type: 'tree', x: 23, y: 29 },

        // Lighthouse garden trees (near building)
        { type: 'tree', x: 11, y: 12 },
        { type: 'tree', x: 19, y: 12 },

        // Rocks scattered around the beach and shoreline
        { type: 'rock', x: 6, y: 9 },    // Western shore
        { type: 'rock', x: 8, y: 9 },
        { type: 'rock', x: 11, y: 9 },
        { type: 'rock', x: 14, y: 9 },   // Near lighthouse base
        { type: 'rock', x: 17, y: 9 },
        { type: 'rock', x: 20, y: 9 },   // Eastern shore
        { type: 'rock', x: 23, y: 9 },
        { type: 'rock', x: 25, y: 9 },
        { type: 'rock', x: 5, y: 8 },    // Beach rocks
        { type: 'rock', x: 19, y: 8 },
        { type: 'rock', x: 27, y: 8 },

        // Tall grass patch - large area east of lighthouse for creature encounters
        { type: 'tallgrass', x: 18, y: 10 },
        { type: 'tallgrass', x: 19, y: 10 },
        { type: 'tallgrass', x: 20, y: 10 },
        { type: 'tallgrass', x: 21, y: 10 },
        { type: 'tallgrass', x: 18, y: 11 },
        { type: 'tallgrass', x: 19, y: 11 },
        { type: 'tallgrass', x: 20, y: 11 },
        { type: 'tallgrass', x: 21, y: 11 },
        { type: 'tallgrass', x: 18, y: 12 },
        { type: 'tallgrass', x: 19, y: 12 },
        { type: 'tallgrass', x: 20, y: 12 },
        { type: 'tallgrass', x: 21, y: 12 },
        { type: 'tallgrass', x: 18, y: 13 },
        { type: 'tallgrass', x: 19, y: 13 },
        { type: 'tallgrass', x: 20, y: 13 },
        { type: 'tallgrass', x: 21, y: 13 },
        { type: 'tallgrass', x: 18, y: 14 },
        { type: 'tallgrass', x: 19, y: 14 },
        { type: 'tallgrass', x: 20, y: 14 },
        { type: 'tallgrass', x: 21, y: 14 },

        // NPCs positioned in story-meaningful locations
        { type: 'npc', id: 'keeper', x: 15, y: 17, sprite: 'down', charType: 'teacher' },  // Just south of lighthouse
        { type: 'npc', id: 'fisherman', x: 8, y: 7, sprite: 'down', charType: 'fisherman' },  // On the beach (west)
        { type: 'npc', id: 'scientist', x: 18, y: 24, sprite: 'up', charType: 'scientist' },  // In southern clearing
        { type: 'npc', id: 'mathTeacher', x: 9, y: 19, sprite: 'right', charType: 'teacher' },  // In western clearing

        // Store building (2x2 tiles)
        { type: 'store', x: 22, y: 18 },  // Near eastern path

        // Boat to repair (3x2 tiles) - on western beach
        { type: 'boat', x: 4, y: 7 }  // Western beach, near fisherman

        // Creatures are now spawned via habitat-based encounters, not fixed coordinates
    ]
};

// Creature encyclopedia - habitat-based spawning system
// Legal habitats: 'tallgrass', 'sand' (beach), 'water', 'cave'
const CREATURES = {
    lumina: {
        name: 'Lumina',
        description: 'A glowing moth that appears near lighthouses on foggy nights.',
        fact: 'Lumina can see ultraviolet light invisible to humans!',
        emoji: '🦋',
        habitats: ['tallgrass'],
        encounterRate: 0.15,  // 15% chance per step (first creature - higher rate)
        requiresAbility: null
    },
    sprout: {
        name: 'Sprout',
        description: 'A cheerful seedling that grows wherever it travels.',
        fact: 'Some plants can communicate through underground networks!',
        emoji: '🌱',
        habitats: ['tallgrass'],
        encounterRate: 0.08,
        requiresAbility: null
    },
    spark: {
        name: 'Spark',
        description: 'An energetic firefly that powers the lighthouse.',
        fact: 'Fireflies produce light through a chemical reaction with almost no heat!',
        emoji: '✨',
        habitats: ['tallgrass'],
        encounterRate: 0.08,
        requiresAbility: null
    },
    dusty: {
        name: 'Dusty',
        description: 'A tiny sand crab that builds intricate castles.',
        fact: 'Some crabs can regenerate lost claws!',
        emoji: '🦀',
        habitats: ['sand'],
        encounterRate: 0.10,
        requiresAbility: null
    },
    pebble: {
        name: 'Pebble',
        description: 'A smooth river stone that mysteriously moves on its own.',
        fact: 'This creature is actually a colony of tiny organisms.',
        emoji: '🪨',
        habitats: ['sand'],
        encounterRate: 0.10,
        requiresAbility: null
    },
    marina: {
        name: 'Marina',
        description: 'A friendly dolphin that loves to help sailors navigate.',
        fact: 'Dolphins sleep with one eye open to watch for predators.',
        emoji: '🐬',
        habitats: ['water'],
        encounterRate: 0.12,
        requiresAbility: 'surf'  // Can't encounter until player can surf
    },
    frost: {
        name: 'Frost',
        description: 'A crystalline creature that appears only in cold water.',
        fact: 'Ice crystals form in hexagonal patterns due to water molecule bonds.',
        emoji: '❄️',
        habitats: ['water'],
        encounterRate: 0.12,
        requiresAbility: 'surf'
    },
    blaze: {
        name: 'Blaze',
        description: 'A warm salamander found near the lighthouse furnace.',
        fact: 'Salamanders can regenerate entire limbs and even parts of their heart!',
        emoji: '🦎',
        habitats: ['cave'],
        encounterRate: 0.10,
        requiresAbility: 'torch'  // Placeholder for future cave exploration
    }
};

// Quest Framework - Reusable quest system for all NPCs
const QUESTS = {
    // Callum's one-off problems
    'fishing_crates': {
        id: 'fishing_crates',
        name: 'Count the Crates',
        type: 'one_off',
        giver: 'mathTeacher',
        reward: 5,
        problem: {
            question: "I caught 24 fish and need to split them equally among 6 crates. How many fish go in each crate?",
            answers: [2, 3, 4, 5],
            correct: 4
        }
    },
    'fishing_nets': {
        id: 'fishing_nets',
        name: 'Calculate the Nets',
        type: 'one_off',
        giver: 'mathTeacher',
        reward: 5,
        problem: {
            question: "I set 3 nets with 8 fish in each net. How many fish did I catch total?",
            answers: [11, 24, 21, 18],
            correct: 24
        }
    },
    'fishing_baskets': {
        id: 'fishing_baskets',
        name: 'Pack the Lobsters',
        type: 'one_off',
        giver: 'mathTeacher',
        reward: 5,
        problem: {
            question: "I have 15 lobsters to pack. If each basket holds 3 lobsters, how many baskets do I need?",
            answers: [3, 4, 5, 6],
            correct: 5
        }
    },
    // Callum's multi-step location quest
    'fishing_records': {
        id: 'fishing_records',
        name: 'Check the Catch Records',
        type: 'multi_step',
        giver: 'mathTeacher',
        reward: 100,
        description: "Help me verify the daily catch records by checking the nets around the island!",
        steps: [
            {
                type: 'visit_location',
                description: 'Check the western beach nets',
                location: { x: 6, y: 8 },
                radius: 2,
                markerText: '🎣',
                onArrive: {
                    message: "You count the fish in the nets. There are 12 fish here, but the record says 15..."
                }
            },
            {
                type: 'problem',
                question: "The western nets had 12 fish but the record says 15. What's the difference?",
                answers: [2, 3, 4, 5],
                correct: 3
            },
            {
                type: 'visit_location',
                description: 'Check the eastern shore nets',
                location: { x: 25, y: 8 },
                radius: 2,
                markerText: '🎣',
                onArrive: {
                    message: "The eastern nets have 18 fish. The record says 9 nets with 2 fish each..."
                }
            },
            {
                type: 'problem',
                question: "If there are 9 nets with 2 fish each, how many fish should there be total?",
                answers: [11, 16, 18, 20],
                correct: 18
            },
            {
                type: 'visit_location',
                description: 'Check the boat storage',
                location: { x: 5, y: 7 },
                radius: 2,
                markerText: '📦',
                onArrive: {
                    message: "The boat has 5 crates with 7 fish in each. Let me verify this matches the records..."
                }
            },
            {
                type: 'problem',
                question: "How many fish total are stored in the boat? (5 crates × 7 fish each)",
                answers: [30, 35, 40, 42],
                correct: 35
            }
        ]
    }
};

// NPC dialogues - framework-based system
// Each NPC has dialogue entries with conditions, text, and optional choices
const NPCS = {
    keeper: {
        name: 'The Keeper',
        type: 'dialogue_npc',
        dialogues: [
            {
                condition: (game) => game.plotPhase === 'wake_up',
                text: "Morning. I heard something on the rocks last night. Sounded small, maybe hurt. Would you go look? Take the path toward the tall grass, but be careful.",
                choices: [
                    {
                        text: "I'll go look for it",
                        action: (game) => {
                            game.plotPhase = 'find_creature';
                            game.firstEncounterTriggered = false;
                        }
                    }
                ]
            },
            {
                condition: (game) => game.plotPhase === 'find_creature',
                text: "Find anything yet? The path leads to the tall grass. Something's out there, I'm certain.",
                choices: null  // Just dismisses
            },
            {
                condition: (game) => game.plotPhase === 'creature_found',
                text: "What did you find out there? Tell me about it when you're ready.",
                choices: null
            },
            {
                condition: (game) => game.plotPhase === 'return_keeper',
                text: "You're back. What did you find? ...A creature? Interesting. There have always been stories about strange beings near the lighthouse. Maybe they're drawn to the light. Keep exploring—there may be more out there.",
                choices: [
                    {
                        text: "I'll keep looking",
                        action: (game) => {
                            game.plotPhase = 'meet_villager';
                        }
                    }
                ]
            },
            {
                condition: (game) => game.plotPhase === 'meet_villager' || game.plotPhase === 'boat_quest',
                text: "The fisherman in the village might have work. He's rough but fair. Bring back what you earn—we'll need supplies for the boat.",
                choices: null
            },
            {
                condition: (game) => game.plotPhase === 'working',
                text: "The fisherman treats you fair? Good. Keep working—we'll need those coins for supplies.",
                choices: null
            },
            {
                condition: (game) => game.plotPhase === 'boat_ready',
                text: "Storm's coming. I'd estimate three days, maybe four. Can you feel the pressure in the air? My ears tell me what my eyes can't.",
                choices: null
            },
            {
                condition: (game) => game.plotPhase === 'departure',
                text: "Time to set sail. The storm approaches, but we're ready.",
                choices: null
            }
        ]
    },
    shopkeeper: {
        name: 'Marina the Shopkeeper',
        greeting: 'Welcome to the Lighthouse Shop! I sell helpful items.',
        shop: true
    },
    mathTeacher: {
        name: 'Callum the Fisherman',
        type: 'quest_npc',
        greeting: 'Ahoy! I need help with me fishing calculations.',
        quests: {
            oneOff: ['fishing_crates', 'fishing_nets', 'fishing_baskets'],
            full: 'fishing_records'
        }
    },
    scientist: {
        name: 'Dr. Nova',
        greeting: 'Greetings! I study creatures and need help with multiplication.',
        job: 'multiplication',
        jobDescription: 'Help me with multiplication and earn 10 coins!',
        payment: 10
    },
    fisherman: {
        name: 'Old Salt',
        greeting: 'Ahoy! Help me count my catch and I\'ll pay ye well.',
        job: 'counting',
        jobDescription: 'Count the fish correctly for 3 coins!',
        payment: 3
    }
};

// Shop items
const SHOP_ITEMS = [
    {
        id: 'map',
        name: 'Treasure Map',
        description: 'Reveals all creature locations',
        price: 25,
        icon: '🗺️'
    },
    {
        id: 'net',
        name: 'Golden Net',
        description: 'Increases creature encounter chance',
        price: 30,
        icon: '🥅'
    },
    {
        id: 'boots',
        name: 'Speed Boots',
        description: 'Move faster across the island',
        price: 20,
        icon: '👟'
    },
    {
        id: 'compass',
        name: 'Mystical Compass',
        description: 'Points toward the nearest undiscovered creature',
        price: 35,
        icon: '🧭'
    }
];

// Math job generators
const JOBS = {
    addition: () => {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const answer = a + b;
        const wrong1 = answer + Math.floor(Math.random() * 5) + 1;
        const wrong2 = answer - Math.floor(Math.random() * 5) - 1;
        const answers = [answer, wrong1, wrong2].sort(() => Math.random() - 0.5);

        return {
            question: `What is ${a} + ${b}?`,
            answers: answers,
            correct: answer
        };
    },

    multiplication: () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const answer = a * b;
        const wrong1 = answer + a;
        const wrong2 = answer - b;
        const answers = [answer, wrong1, wrong2].sort(() => Math.random() - 0.5);

        return {
            question: `What is ${a} × ${b}?`,
            answers: answers,
            correct: answer
        };
    },

    counting: () => {
        const count = Math.floor(Math.random() * 15) + 5;
        const fishEmoji = '🐟'.repeat(count);
        const answer = count;
        const wrong1 = count + Math.floor(Math.random() * 3) + 1;
        const wrong2 = count - Math.floor(Math.random() * 3) - 1;
        const answers = [answer, wrong1, wrong2].sort(() => Math.random() - 0.5);

        return {
            question: `How many fish are there?\n${fishEmoji}`,
            answers: answers,
            correct: answer
        };
    }
};
