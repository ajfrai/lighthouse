/**
 * Game Data
 * Map, creatures, NPCs, jobs, shop items
 */

// Map data with layers (32x32 tiles, 16px each = 512x512 canvas)
const MAP_DATA = {
    width: 32,
    height: 32,
    tileSize: 16,

    // Ground layer - base terrain
    ground: [
        // Row 0-5: Water at top
        ...Array(6).fill(null).map(() => Array(32).fill('water')),

        // Rows 6-9: Sand beach
        ...Array(4).fill(null).map(() => Array(32).fill('sand')),

        // Rows 10-31: Grass
        ...Array(22).fill(null).map(() => Array(32).fill('grass'))
    ].flat(),

    // Collision objects (structures, NPCs)
    objects: [
        // Lighthouse (center-top, 3x5 tiles)
        { type: 'lighthouse', x: 14, y: 12, width: 3, height: 5 },

        // Trees scattered around
        { type: 'tree', x: 5, y: 15 },
        { type: 'tree', x: 25, y: 15 },
        { type: 'tree', x: 8, y: 25 },
        { type: 'tree', x: 23, y: 25 },
        { type: 'tree', x: 15, y: 28 },

        // NPCs
        { type: 'npc', id: 'shopkeeper', x: 16, y: 18, sprite: 'down' },
        { type: 'npc', id: 'mathTeacher', x: 12, y: 20, sprite: 'right' },
        { type: 'npc', id: 'scientist', x: 20, y: 20, sprite: 'left' },
        { type: 'npc', id: 'fisherman', x: 10, y: 8, sprite: 'down' },

        // Creature spawn points (hidden until discovered)
        { type: 'creature', id: 'lumina', x: 8, y: 12 },
        { type: 'creature', id: 'marina', x: 16, y: 6 },
        { type: 'creature', id: 'dusty', x: 24, y: 14 },
        { type: 'creature', id: 'pebble', x: 18, y: 8 },
        { type: 'creature', id: 'sprout', x: 5, y: 22 },
        { type: 'creature', id: 'blaze', x: 27, y: 28 },
        { type: 'creature', id: 'frost', x: 12, y: 6 },
        { type: 'creature', id: 'spark', x: 22, y: 30 }
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
    shopkeeper: {
        name: 'Marina the Shopkeeper',
        greeting: 'Welcome to the Lighthouse Shop! I sell helpful items.',
        shop: true
    },
    mathTeacher: {
        name: 'Professor Oak',
        greeting: 'Hello! I can pay you for solving math problems.',
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
