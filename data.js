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

        // Tall grass patch east of lighthouse (creating the area mentioned in dialogue)
        { type: 'tallgrass', x: 18, y: 11 },
        { type: 'tallgrass', x: 19, y: 11 },
        { type: 'tallgrass', x: 20, y: 11 },
        { type: 'tallgrass', x: 18, y: 12 },
        { type: 'tallgrass', x: 19, y: 12 },
        { type: 'tallgrass', x: 20, y: 12 },
        { type: 'tallgrass', x: 18, y: 13 },
        { type: 'tallgrass', x: 19, y: 13 },
        { type: 'tallgrass', x: 20, y: 13 },

        // NPCs positioned in story-meaningful locations
        { type: 'npc', id: 'keeper', x: 15, y: 17, sprite: 'down', charType: 'teacher' },  // Just south of lighthouse
        { type: 'npc', id: 'fisherman', x: 8, y: 7, sprite: 'down', charType: 'fisherman' },  // On the beach (west)
        { type: 'npc', id: 'scientist', x: 18, y: 24, sprite: 'up', charType: 'scientist' },  // In southern clearing
        { type: 'npc', id: 'mathTeacher', x: 9, y: 19, sprite: 'right', charType: 'teacher' },  // In western clearing

        // Store building (2x2 tiles)
        { type: 'store', x: 22, y: 18 },  // Near eastern path

        // Creature spawn points - positioned in appropriate terrain
        { type: 'creature', id: 'lumina', x: 19, y: 12 },  // In tall grass (moth drawn to light)
        { type: 'creature', id: 'marina', x: 15, y: 5 },   // In the water (dolphin swims)
        { type: 'creature', id: 'frost', x: 10, y: 5 },    // In water (ice creature)
        { type: 'creature', id: 'dusty', x: 12, y: 8 },    // On sandy beach
        { type: 'creature', id: 'pebble', x: 25, y: 8 },   // On rocky beach
        { type: 'creature', id: 'sprout', x: 18, y: 11 },  // In tall grass (plant creature)
        { type: 'creature', id: 'blaze', x: 17, y: 8 },    // On beach near rocks (fire creature)
        { type: 'creature', id: 'spark', x: 20, y: 13 }    // In tall grass (electric creature)
    ]
};

// Creature encyclopedia (8 creatures to discover)
const CREATURES = {
    lumina: {
        name: 'Lumina',
        description: 'A glowing moth that appears near lighthouses on foggy nights.',
        fact: 'Lumina can see ultraviolet light invisible to humans!',
        emoji: '🦋'
    },
    marina: {
        name: 'Marina',
        description: 'A friendly dolphin that loves to help sailors navigate.',
        fact: 'Dolphins sleep with one eye open to watch for predators.',
        emoji: '🐬'
    },
    dusty: {
        name: 'Dusty',
        description: 'A tiny sand crab that builds intricate castles.',
        fact: 'Some crabs can regenerate lost claws!',
        emoji: '🦀'
    },
    pebble: {
        name: 'Pebble',
        description: 'A smooth river stone that mysteriously moves on its own.',
        fact: 'This creature is actually a colony of tiny organisms.',
        emoji: '🪨'
    },
    sprout: {
        name: 'Sprout',
        description: 'A cheerful seedling that grows wherever it travels.',
        fact: 'Some plants can communicate through underground networks!',
        emoji: '🌱'
    },
    blaze: {
        name: 'Blaze',
        description: 'A warm salamander found near the lighthouse furnace.',
        fact: 'Salamanders can regenerate entire limbs and even parts of their heart!',
        emoji: '🦎'
    },
    frost: {
        name: 'Frost',
        description: 'A crystalline creature that appears only in cold water.',
        fact: 'Ice crystals form in hexagonal patterns due to water molecule bonds.',
        emoji: '❄️'
    },
    spark: {
        name: 'Spark',
        description: 'An energetic firefly that powers the lighthouse.',
        fact: 'Fireflies produce light through a chemical reaction with almost no heat!',
        emoji: '✨'
    }
};

// NPC dialogues and jobs
const NPCS = {
    keeper: {
        name: 'The Keeper',
        dialogues: {
            wake_up: "Morning. I heard something on the rocks last night. Sounded small, maybe hurt. Would you go look? Take the path toward the tall grass, but be careful.",
            find_creature: "Find anything yet? The path leads to the tall grass. Something's out there, I'm certain.",
            return_keeper: "You're back. What did you find? ...A creature? Interesting. There have always been stories about strange beings near the lighthouse. Maybe they're drawn to the light.",
            meet_villager: "The fisherman in the village might have work. He's rough but fair. Bring back what you earn—we'll need supplies.",
            working: "The fisherman treats you fair? Good. Keep working—we'll need those coins for supplies.",
            boat_ready: "Storm's coming. I'd estimate three days, maybe four. Can you feel the pressure in the air? My ears tell me what my eyes can't."
        },
        isKeeper: true
    },
    shopkeeper: {
        name: 'Marina the Shopkeeper',
        greeting: 'Welcome to the Lighthouse Shop! I sell helpful items.',
        shop: true
    },
    mathTeacher: {
        name: 'Professor Beacon',
        greeting: 'Greetings, young learner! I study mathematics and can pay you for solving problems.',
        job: 'addition',
        jobDescription: 'Solve addition problems to earn 5 coins each!',
        payment: 5
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
