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

        // First creature (Lumina) - visible on beach during find_creature phase
        { type: 'creature', id: 'lumina_first', x: 7, y: 8, emoji: '🦋' },  // Western beach, near rocks

        // NPCs positioned in story-meaningful locations
        { type: 'npc', id: 'marlowe', x: 15, y: 17, sprite: 'down', charType: 'teacher' },  // Just south of lighthouse
        { type: 'npc', id: 'fisherman', x: 8, y: 7, sprite: 'down', charType: 'fisherman' },  // On the beach (west)
        { type: 'npc', id: 'dr_nova', x: 18, y: 24, sprite: 'up', charType: 'scientist' },  // In southern clearing
        { type: 'npc', id: 'callum', x: 9, y: 19, sprite: 'right', charType: 'teacher' },  // In western clearing
        { type: 'npc', id: 'marina', x: 23, y: 20, sprite: 'down', charType: 'shopkeeper' },  // Near store

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
        habitats: ['sand'],  // Changed from tallgrass - first creature found on beach
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

// Quest Step Handler Registry - Pluggable handlers for different step types
const QUEST_STEP_HANDLERS = {
    'visit_location': {
        // Called when step becomes active
        onStart: (game, step) => {
            game.questObjective = step.description;
            // Don't show dialog - just set objective (shown on screen)
            // This prevents dialogue conflict when starting from quest menu
            game.state = GameState.EXPLORING;
        },

        // Called each frame while step is active
        onUpdate: (game, step) => {
            // Check if player is within radius of objective
            const dx = game.player.x - step.location.x;
            const dy = game.player.y - step.location.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= step.radius) {
                // Player reached objective!
                return {
                    completed: true,
                    message: step.onArrive.message,
                    choices: [
                        {
                            text: "Continue Quest",
                            action: () => game.advanceQuestStep()
                        },
                        {
                            text: "Abandon Quest",
                            action: () => {
                                game.activeQuest = null;
                                game.questObjective = null;
                                game.showDialog("Quest abandoned.");
                            }
                        }
                    ]
                };
            }
            return { completed: false };
        },

        // Called when rendering (for markers, etc.)
        onRender: (game, step) => {
            const tileSize = game.map.tileSize;
            const x = step.location.x * tileSize + tileSize / 2;
            const y = step.location.y * tileSize + tileSize / 2;

            // Draw pulsing marker
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.2 + 0.8;

            game.ctx.save();
            game.ctx.globalAlpha = pulse;
            game.ctx.font = '24px Arial';
            game.ctx.textAlign = 'center';
            game.ctx.textBaseline = 'middle';
            game.ctx.fillText(step.markerText, x, y);
            game.ctx.restore();

            // Draw radius circle
            game.ctx.save();
            game.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            game.ctx.lineWidth = 2;
            game.ctx.beginPath();
            game.ctx.arc(x, y, step.radius * tileSize, 0, Math.PI * 2);
            game.ctx.stroke();
            game.ctx.restore();
        }
    },

    'problem': {
        onStart: (game, step) => {
            const quest = game.activeQuest.quest;
            const stepNum = game.activeQuest.currentStep + 1;
            const totalSteps = quest.steps.length;
            // Use NPC name, not quest name
            game.showQuestProblem(step, game.activeQuest.npcName, stepNum, totalSteps);
        },

        onUpdate: (game, step) => {
            // Problems are handled by UI callbacks, not update loop
            return { completed: false };
        },

        onRender: (game, step) => {
            // No rendering needed for problems
        }
    },

    'visit_and_solve': {
        onStart: (game, step) => {
            game.questObjective = step.description;
            game.state = GameState.EXPLORING;
        },

        onUpdate: (game, step) => {
            // Check if player reached location
            const dx = game.player.x - step.location.x;
            const dy = game.player.y - step.location.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= step.radius) {
                // Player arrived - show message and problem
                const problem = step.onArrive.problem;
                const choices = problem.answers.map(answer => ({
                    text: String(answer),
                    action: () => {
                        if (answer === problem.correct) {
                            // Correct! Advance to next step
                            game.activeQuest.currentStep++;

                            // Check if quest is complete
                            if (game.activeQuest.currentStep >= game.activeQuest.quest.steps.length) {
                                // Quest complete - show success message then complete
                                game.questObjective = null;
                                game.dialogue.queue({
                                    text: "Correct! The records have been updated.",
                                    trigger: 'quest_step_completed'  // This will complete the quest
                                });
                            } else {
                                // More steps remaining - initialize next step
                                const nextStep = game.activeQuest.quest.steps[game.activeQuest.currentStep];
                                const handler = QUEST_STEP_HANDLERS[nextStep.type];

                                // Show success message first
                                game.dialogue.queue({
                                    text: "Correct! The records have been updated."
                                });

                                // Initialize next step after dialogue closes
                                if (handler && handler.onStart) {
                                    handler.onStart(game, nextStep);
                                }
                            }
                        } else {
                            // Wrong answer - don't advance step, player can try again
                            game.showDialog("That's not quite right. Let me review the records again.");
                        }
                    }
                }));

                return {
                    completed: true,
                    message: step.onArrive.message + "\n\n" + problem.question,
                    choices: choices
                };
            }
            return { completed: false };
        },

        onRender: (game, step) => {
            // Same rendering as visit_location
            const tileSize = game.map.tileSize;
            const x = step.location.x * tileSize + tileSize / 2;
            const y = step.location.y * tileSize + tileSize / 2;

            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.2 + 0.8;

            game.ctx.save();
            game.ctx.globalAlpha = pulse;
            game.ctx.font = '24px Arial';
            game.ctx.textAlign = 'center';
            game.ctx.textBaseline = 'middle';
            game.ctx.fillText(step.markerText, x, y);
            game.ctx.restore();

            game.ctx.save();
            game.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            game.ctx.lineWidth = 2;
            game.ctx.beginPath();
            game.ctx.arc(x, y, step.radius * tileSize, 0, Math.PI * 2);
            game.ctx.stroke();
            game.ctx.restore();
        }
    },

    'talk_to': {
        onStart: (game, step) => {
            game.questObjective = step.description;
            game.showDialog(step.description);
            game.state = GameState.EXPLORING;
        },

        onUpdate: (game, step) => {
            // Checked by interact() method when player talks to NPC
            return { completed: false };
        },

        onRender: (game, step) => {
            // Render indicator above target NPC
            const npc = game.map.objects.find(obj => obj.type === 'npc' && obj.id === step.npcId);
            if (npc) {
                const tileSize = game.map.tileSize;
                const x = npc.x * tileSize + tileSize / 2;
                const y = npc.y * tileSize - 10;

                game.ctx.save();
                game.ctx.font = '20px Arial';
                game.ctx.textAlign = 'center';
                game.ctx.fillText('❗', x, y);
                game.ctx.restore();
            }
        }
    },

    'fetch_item': {
        onStart: (game, step) => {
            game.questObjective = step.description;
            game.showDialog(step.description);
            game.state = GameState.EXPLORING;
        },

        onUpdate: (game, step) => {
            // Check if player has the required item
            if (game.inventory.has(step.itemId)) {
                return {
                    completed: true,
                    message: step.onComplete.message,
                    choices: [
                        {
                            text: "Continue",
                            action: () => {
                                // Remove item if consumable
                                if (step.consumeItem) {
                                    game.inventory.delete(step.itemId);
                                }
                                game.advanceQuestStep();
                            }
                        }
                    ]
                };
            }
            return { completed: false };
        },

        onRender: (game, step) => {
            // No special rendering for fetch quests
        }
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
                type: 'visit_and_solve',
                description: 'Check the nets on the western beach',
                location: { x: 6, y: 8 },
                radius: 2,
                markerText: '🎣',
                onArrive: {
                    message: "You count 47 fish in the western nets, but the record says 58 fish were caught.",
                    problem: {
                        question: "If 58 fish were caught but only 47 are here, how many are missing?",
                        answers: [9, 11, 13, 15],
                        correct: 11
                    }
                }
            },
            {
                type: 'visit_and_solve',
                description: 'Check the nets on the eastern shore',
                location: { x: 25, y: 8 },
                radius: 2,
                markerText: '🎣',
                onArrive: {
                    message: "The eastern nets have 13 sections, each holds 12 fish. The record says 144 total.",
                    problem: {
                        question: "Are the records correct? What is 13 × 12?",
                        answers: [144, 156, 132, 148],
                        correct: 156
                    }
                }
            },
            {
                type: 'visit_and_solve',
                description: 'Check the storage in the boat',
                location: { x: 5, y: 7 },
                radius: 2,
                markerText: '📦',
                onArrive: {
                    message: "The boat has 8 crates. Each crate holds 23 fish. Records show 184 fish stored.",
                    problem: {
                        question: "How many fish are actually in storage? (8 × 23)",
                        answers: [164, 184, 204, 189],
                        correct: 184
                    }
                }
            }
        ]
    }
};

// NPC dialogues - framework-based system
// Each NPC has dialogue entries with conditions, text, and optional choices
const NPCS = {
    marlowe: {
        id: 'marlowe',
        name: 'Marlowe',
        role: 'keeper',
        type: 'dialogue_npc',
        dialogues: [
            {
                condition: (game) => game.plotPhase === 'wake_up',
                text: [
                    { speaker: "Marlowe", text: "Morning. Sleep well?" },
                    { speaker: "Marlowe", text: "I heard something on the rocks last night. Sounded small... maybe hurt." },
                    { speaker: "Marlowe", text: "My eyes aren't what they were. Would you go look for me?" },
                    { speaker: "Marlowe", text: "Head west to the beach. Check near the rocks. Be careful." },
                    { speaker: "Marlowe", text: "Come back and tell me what you find." }
                ],
                choices: null,
                onClose: (game) => {
                    game.plotPhase = 'find_creature';
                    game.firstEncounterTriggered = false;
                }
            },
            {
                condition: (game) => game.plotPhase === 'find_creature',
                text: "Find anything yet? Head west to the beach. Check near the rocks. Something's out there, I'm certain.",
                repeatText: "Still searching? Check the beach, near the rocks.",
                choices: null  // Just dismisses
            },
            {
                condition: (game) => game.plotPhase === 'creature_found',
                text: (game) => {
                    // Get the creature's name from party
                    const starter = game.party.find(c => c.isStarter);
                    const creatureName = starter ? starter.name : 'Shimmer';

                    return [
                        { speaker: "Marlowe", text: "You found something, didn't you? I can tell by your footsteps." },
                        { speaker: "You", text: "I did. A small creature, injured." },
                        { speaker: "Marlowe", text: "Injured and alone. Good thing you found it." },
                        { speaker: "Marlowe", text: "Does it have a name?" },
                        { speaker: "You", text: `I call it ${creatureName}.` },
                        { speaker: "Marlowe", text: `${creatureName}. Good name.` },
                        { speaker: "Marlowe", text: "Listen—there's a fisherman nearby who might have work." },
                        { speaker: "Marlowe", text: "We could use the coin. You could use the experience." },
                        { speaker: "Marlowe", text: "His name is Callum. Rough hands, good heart." },
                        { speaker: "Marlowe", text: "You'll find him just down the path from here." }
                    ];
                },
                choices: null,
                onClose: (game) => {
                    game.plotPhase = 'meet_villager';
                }
            },
            {
                condition: (game) => game.plotPhase === 'meet_villager',
                text: "The village is south and west. Look for Callum near the western clearing.",
                repeatText: "Find Callum. He'll have work for you.",
                choices: null
            },
            {
                // HIGH PRIORITY: Check if all Callum's quests are complete
                condition: (game) => {
                    const callumsQuests = ['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records'];
                    const allComplete = callumsQuests.every(q => game.completedQuests && game.completedQuests.has(q));
                    return (game.plotPhase === 'boat_quest' || game.plotPhase === 'working') && allComplete;
                },
                text: [
                    { speaker: "Marlowe", text: "You finished Callum's work? I heard. He doesn't praise easily, so that means something." },
                    { speaker: "Marlowe", text: "You've earned good coin. Now comes the hard part—gathering materials for the boat." },
                    { speaker: "Marlowe", text: "We'll need rope, driftwood, and sturdy planks. Marina at the shop can help with some of it." },
                    { speaker: "Marlowe", text: "The rest you'll have to find or craft yourself. It won't be easy, but neither is leaving." }
                ],
                choices: null,
                onClose: (game) => {
                    game.plotPhase = 'working';
                }
            },
            {
                // Priority 1: If coins < 20, show "money's tight" message
                condition: (game) => (game.plotPhase === 'boat_quest' || game.plotPhase === 'working') && (game.coins || 0) < 20,
                text: "How's the work going? Money's tight, I know. One job at a time.",
                repeatText: "Keep working. The coin will come.",
                choices: null
            },
            {
                // Priority 2: If coins >= 20 AND planks >= 4, show "good progress" message
                condition: (game) => (game.plotPhase === 'boat_quest' || game.plotPhase === 'working')
                    && (game.coins || 0) >= 20
                    && game.boatQuest && game.boatQuest.planks.collected >= 4,
                text: "I heard you've been gathering driftwood. Good. That boat won't fix itself.",
                repeatText: "Good progress on those planks.",
                choices: null
            },
            {
                // Priority 3: Catch-all for boat_quest/working when neither above applies
                // This matches when: coins >= 20 AND planks < 4
                condition: (game) => {
                    const inWorkingPhase = game.plotPhase === 'boat_quest' || game.plotPhase === 'working';
                    const coins = game.coins || 0;
                    const hasEnoughCoins = coins >= 20;
                    const notEnoughPlanks = !game.boatQuest || game.boatQuest.planks.collected < 4;
                    return inWorkingPhase && hasEnoughCoins && notEnoughPlanks;
                },
                text: "How's the work going? Callum's rough, but he's fair. Do good work and he'll pay honest.",
                repeatText: "Keep at it. You're doing well.",
                choices: null
            },
            {
                condition: (game) => game.plotPhase === 'boat_ready',
                text: "Storm's coming. I'd estimate three days, maybe four. Can you feel the pressure in the air? My ears tell me what my eyes can't.",
                repeatText: "The storm's getting closer.",
                choices: null
            },
            {
                condition: (game) => game.plotPhase === 'departure',
                text: "Time to set sail. The storm approaches, but we're ready.",
                repeatText: "Time to leave this island behind.",
                choices: null
            }
        ]
    },
    marina: {
        id: 'marina',
        name: 'Marina',
        role: 'shopkeeper',
        greeting: 'Welcome to the Lighthouse Shop! I sell helpful items.',
        shop: true
    },
    callum: {
        id: 'callum',
        name: 'Callum',
        role: 'fisherman',
        type: 'dialogue_npc',
        dialogues: [
            {
                condition: (game) => game.plotPhase === 'meet_villager',
                text: [
                    { speaker: "Callum", text: "Marlowe sent you? Hm. You're smaller than I expected." },
                    { speaker: "You", text: "He said you might have work." },
                    { speaker: "Callum", text: "I've got work if you can count." },
                    { speaker: "Callum", text: "But that's not the real reason you're here, is it?" },
                    { speaker: "You", text: "I... I need to leave the island." },
                    { speaker: "Callum", text: "Everyone does, eventually. Lucky for you, there's a boat." }
                ],
                choices: null,
                repeatText: "We should talk about that boat.",
                onClose: (game) => {
                    // Change phase FIRST so we don't get stuck in meet_villager
                    game.plotPhase = 'boat_quest';
                    game.showBoatQuestExplanation();
                }
            },
            {
                condition: (game) => game.plotPhase === 'boat_quest' && !game.hasInspectedBoat,
                text: "Go take a look at the boat first. It's on the western shore. You'll see what we're working with.",
                repeatText: "Check the boat on the western shore.",
                choices: null
            },
            {
                condition: (game) => {
                    // Only shown if player hasn't completed any of CALLUM's quests yet
                    const callumsQuests = ['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records'];
                    const completedCallumsQuests = callumsQuests.filter(q => game.completedQuests && game.completedQuests.has(q));
                    return (game.plotPhase === 'boat_quest' || game.plotPhase === 'working')
                        && game.hasInspectedBoat
                        && completedCallumsQuests.length === 0;
                },
                text: "You want work? I've got fish that need counting.",
                choices: [
                    {
                        text: "Show me the work",
                        action: (game) => {
                            game.questSystem.showQuestMenu('callum', NPCS.callum);
                        }
                    },
                    {
                        text: "Not right now",
                        action: (game) => {}
                    }
                ]
            },
            {
                condition: (game) => {
                    // Shown when player has completed ALL of Callum's quests
                    const callumsQuests = ['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records'];
                    const completedCallumsQuests = callumsQuests.filter(q => game.completedQuests && game.completedQuests.has(q));
                    return (game.plotPhase === 'boat_quest' || game.plotPhase === 'working')
                        && game.hasInspectedBoat
                        && completedCallumsQuests.length === callumsQuests.length;
                },
                text: "You've finished all my work. Not bad. Talk to Marlowe—he'll have the next steps for you.",
                repeatText: "All done here. Go see Marlowe.",  // FIX: Prevent infinite loop
                choices: null
            },
            {
                condition: (game) => {
                    // Shown if player HAS completed SOME (but not all) of Callum's quests
                    const callumsQuests = ['fishing_crates', 'fishing_nets', 'fishing_baskets', 'fishing_records'];
                    const completedCallumsQuests = callumsQuests.filter(q => game.completedQuests && game.completedQuests.has(q));
                    return (game.plotPhase === 'boat_quest' || game.plotPhase === 'working')
                        && game.hasInspectedBoat
                        && completedCallumsQuests.length > 0
                        && completedCallumsQuests.length < callumsQuests.length;
                },
                text: "Back for more? Good. Let's see what we've got today.",
                choices: [
                    {
                        text: "Show me the work",
                        action: (game) => {
                            game.questSystem.showQuestMenu('callum', NPCS.callum);
                        }
                    },
                    {
                        text: "Not right now",
                        action: (game) => {}
                    }
                ]
            },
            {
                // FIX: Add boat_ready phase dialogue (prevents dead end)
                condition: (game) => game.plotPhase === 'boat_ready',
                text: "The boat's ready. When the storm comes, you'll be ready too.",
                repeatText: "We're all set. Just waiting on the storm now.",
                choices: null
            },
            {
                // FIX: Add departure phase dialogue (prevents dead end)
                condition: (game) => game.plotPhase === 'departure',
                text: "Safe travels. May the winds be kind.",
                repeatText: "Time to go. Good luck out there.",
                choices: null
            }
        ],
        // Keep quest data for the quest system
        quests: {
            oneOff: ['fishing_crates', 'fishing_nets', 'fishing_baskets'],
            full: 'fishing_records'
        }
    },
    dr_nova: {
        id: 'dr_nova',
        name: 'Dr. Nova',
        role: 'scientist',
        greeting: 'Greetings! I study creatures and need help with multiplication.',
        job: 'multiplication',
        jobDescription: 'Help me with multiplication and earn 10 coins!',
        payment: 10
    },
    fisherman: {
        id: 'fisherman',
        name: 'Old Salt',
        role: 'fisherman',
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
    },
    {
        id: 'rope',
        name: 'Rope',
        description: 'Sturdy rope for boat repairs (x5)',
        price: 10,
        icon: '🪢',
        consumable: true,
        quantity: 5
    },
    {
        id: 'driftwood',
        name: 'Driftwood',
        description: 'Weathered wood for crafting planks (x3)',
        price: 8,
        icon: '🪵',
        consumable: true,
        quantity: 3
    },
    {
        id: 'planks',
        name: 'Wood Planks',
        description: 'Finished planks for boat hull (x2)',
        price: 15,
        icon: '🪚',
        consumable: true,
        quantity: 2
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

// ============================================================================
// Dialogue Flows - Declarative dialogue sequences for queue system
// ============================================================================

const CREATURE_FLOWS = {
    // Introduction flow - shown when player first finds creature
    intro: {
        id: 'creature_intro',
        dialogues: [
            { text: "Something small is huddled between the rocks." },
            { text: "It's shivering. One of its wings is tucked at a strange angle." },
            { text: "It sees you and tenses, ready to flee." },
            {
                text: "What do you do?",
                choices: [
                    { text: "Approach slowly", trigger: 'creature_choice_slow' },
                    { text: "Stay still and wait", trigger: 'creature_choice_wait' },
                    { text: "Try to grab it quickly", trigger: 'creature_choice_grab' }
                ]
            }
        ]
    },

    // Slow approach path
    slow: {
        id: 'creature_slow',
        dialogues: [
            { text: "You take a slow step forward. It watches you but doesn't run." },
            { text: "Another step. It makes a small sound—not fear. Something else." },
            { text: "You kneel down. It hesitates... then hops toward you.", trigger: 'creature_path_complete' }
        ]
    },

    // Wait path
    wait: {
        id: 'creature_wait',
        dialogues: [
            { text: "You sit down on the rocks and wait." },
            { text: "Minutes pass. The creature watches you." },
            { text: "Eventually, curiosity wins. It inches closer, closer..." },
            { text: "It stops just out of reach, but it's not afraid anymore.", trigger: 'creature_path_complete' }
        ]
    },

    // Grab path
    grab: {
        id: 'creature_grab',
        dialogues: [
            { text: "You lunge forward. The creature bolts." },
            { text: "It scrambles over the rocks, injured wing dragging." },
            { text: "But it doesn't get far. It's too hurt." },
            { text: "You approach more carefully this time. It has no choice but to let you.", trigger: 'creature_path_complete' }
        ]
    },

    // Bonding sequence (shown after any path completes)
    bonding: {
        id: 'creature_bonding',
        dialogues: [
            { text: "The creature settles against you. It's warm despite the sea wind.", trigger: 'creature_bonding_complete' }
        ]
    }
};
