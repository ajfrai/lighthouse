/**
 * Lighthouse Adventure - Main Game Engine
 * Educational creature collection game with modern pixel art
 */

// Game States
const GameState = {
    EXPLORING: 'exploring',
    DIALOGUE: 'dialogue',
    DIALOGUE_CHOICE: 'choice',
    COMBAT: 'combat',
    MENU: 'menu',
    JOB: 'job',
    SHOP: 'shop',
    CUTSCENE: 'cutscene'
};

// Plot Phases
const PlotPhase = {
    WAKE_UP: 'wake_up',
    FIND_CREATURE: 'find_creature',
    CREATURE_ENCOUNTER: 'creature_found',
    RETURN_TO_KEEPER: 'return_keeper',
    MEET_VILLAGER: 'meet_villager',
    BOAT_QUEST_START: 'boat_quest',
    WORKING: 'working',
    BOAT_READY: 'boat_ready',
    DEPARTURE: 'departure'
};

class LighthouseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;  // Crisp pixels

        // Game state management
        this.state = GameState.EXPLORING;
        this.plotPhase = PlotPhase.WAKE_UP;

        // Player state
        this.player = {
            x: 15,  // Grid position - start inside/near lighthouse
            y: 19,  // Near the Keeper
            direction: 'up',  // Facing toward the lighthouse
            moving: false,
            walkFrame: 0,
            walkTimer: 0,
            canMove: true
        };

        // Game progression
        this.coins = 0;
        this.day = 1;
        this.discoveredCreatures = new Set();
        this.party = [];  // Creatures traveling with player
        this.inventory = new Set(['map']);  // Start with a map to navigate
        this.playerAbilities = new Set();  // surf, torch, etc.
        this.completedQuests = new Set();  // Track completed quests by ID: 'fishing_crates', 'fishing_records'
        this.activeQuest = null;  // {questId, quest, currentStep, type}
        this.questObjective = null;  // Current objective text to display
        this.firstEncounterTriggered = false;  // Track first narrative encounter
        this.encounterState = null;  // State for narrative encounter sequence

        // Debug/Speed Run Mode
        const urlParams = new URLSearchParams(window.location.search);
        this.speedRunMode = urlParams.has('speedrun') || urlParams.has('debug');
        this.showDebugInfo = this.speedRunMode;

        // Boat quest tracking
        this.boatQuest = {
            planks: { required: 8, collected: 0 },
            rope: { required: 20, collected: 0 },
            compass: { required: true, acquired: false },
            helpFromCallum: { required: true, earned: false }
        };

        // Dialogue system
        this.dialogue = {
            active: false,
            lines: [],
            currentLine: 0,
            currentText: '',
            fullText: '',
            textIndex: 0,
            typewriterSpeed: this.speedRunMode ? 1000 : 30,  // chars per second (instant in speed run)
            lastTypewriterUpdate: 0,
            choices: null,
            selectedChoice: 0
        };

        // Input
        this.keys = {};
        this.keysPressed = {};  // For single-press detection
        this.moveTimer = 0;
        this.moveCooldown = this.speedRunMode ? 50 : 150;  // ms between moves (faster in speed run)
        this.moveHoldDelay = this.speedRunMode ? 50 : 150;  // Initial delay before repeat
        this.moveRepeatRate = this.speedRunMode ? 30 : 100;  // Repeat rate when holding

        // Map
        this.map = MAP_DATA;

        // Initialize subsystems
        this.questSystem = new QuestSystem(this);
        this.dialogueSystem = new DialogueSystem(this);
        this.renderingSystem = new RenderingSystem(this);

        // Animation
        this.lastFrameTime = 0;

        this.init();
    }

    async init() {
        // Load sprites
        await spriteLoader.load();

        // Setup input
        this.setupInput();
        this.setupDebugMenu();

        // Start game loop
        this.gameLoop();

        console.log('✓ Lighthouse Adventure started!');
    }

    setupDebugMenu() {
        const debugMenuBtn = document.getElementById('debugMenuBtn');
        const debugMenu = document.getElementById('debugMenu');
        const debugMenuClose = document.getElementById('debugMenuClose');

        // Toggle debug menu
        debugMenuBtn.addEventListener('click', () => {
            debugMenu.classList.toggle('hidden');
            this.updateDebugMenuButtons();
        });

        debugMenuClose.addEventListener('click', () => {
            debugMenu.classList.add('hidden');
        });

        // Speed Run toggle
        document.getElementById('toggleSpeedRun').addEventListener('click', (e) => {
            this.speedRunMode = !this.speedRunMode;
            this.moveCooldown = this.speedRunMode ? 50 : 150;
            this.moveHoldDelay = this.speedRunMode ? 50 : 150;
            this.moveRepeatRate = this.speedRunMode ? 30 : 100;
            this.dialogue.typewriterSpeed = this.speedRunMode ? 1000 : 30;
            this.updateDebugMenuButtons();
        });

        // Debug Info toggle
        document.getElementById('toggleDebugInfo').addEventListener('click', (e) => {
            this.showDebugInfo = !this.showDebugInfo;
            this.updateDebugMenuButtons();
        });

        // Teleport to Lumina
        document.getElementById('teleportLumina').addEventListener('click', () => {
            const lumimaObj = this.map.objects.find(obj => obj.id === 'lumina');
            if (lumimaObj) {
                this.player.x = lumimaObj.x - 2;
                this.player.y = lumimaObj.y;
                debugMenu.classList.add('hidden');
            }
        });
    }

    updateDebugMenuButtons() {
        const speedRunBtn = document.getElementById('toggleSpeedRun');
        const debugInfoBtn = document.getElementById('toggleDebugInfo');

        speedRunBtn.textContent = `Speed Run: ${this.speedRunMode ? 'ON' : 'OFF'}`;
        speedRunBtn.classList.toggle('active', this.speedRunMode);

        debugInfoBtn.textContent = `Debug Info: ${this.showDebugInfo ? 'ON' : 'OFF'}`;
        debugInfoBtn.classList.toggle('active', this.showDebugInfo);
    }

    jumpToPhase(phaseIndex) {
        const phases = Object.values(PlotPhase);
        if (phaseIndex >= 0 && phaseIndex < phases.length) {
            this.plotPhase = phases[phaseIndex];
            document.getElementById('debugMenu').classList.add('hidden');
            console.log(`Jumped to phase: ${this.plotPhase}`);
        }
    }

    setupInput() {
        // Dialog close button click handler
        const dialogClose = document.getElementById('dialogClose');
        if (dialogClose) {
            dialogClose.addEventListener('click', () => {
                this.dialogueSystem.endDialogue();
            });
        }

        // Keyboard
        window.addEventListener('keydown', (e) => {
            // Track for single-press detection
            if (!this.keys[e.key]) {
                this.keysPressed[e.key] = true;
            }
            this.keys[e.key] = true;

            // Handle state-specific single-press keys
            this.handleKeyPress(e.key);
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keysPressed[e.key] = false;
        });

        // Mobile controls
        const buttons = document.querySelectorAll('.dpad-btn, .action-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;
                if (key) {
                    if (!this.keys[key]) {
                        this.keysPressed[key] = true;
                    }
                    this.keys[key] = true;
                    this.handleKeyPress(key);
                } else if (btn.id === 'btnAction') {
                    this.handleKeyPress('Enter');
                }
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;
                if (key) {
                    this.keys[key] = false;
                    this.keysPressed[key] = false;
                }
            });
        });
    }

    handleKeyPress(key) {
        // Debug shortcuts (work in any state)
        if (key === 'F1') {
            this.speedRunMode = !this.speedRunMode;
            this.moveCooldown = this.speedRunMode ? 50 : 150;
            this.moveHoldDelay = this.speedRunMode ? 50 : 150;
            this.moveRepeatRate = this.speedRunMode ? 30 : 100;
            this.dialogue.typewriterSpeed = this.speedRunMode ? 1000 : 30;
            console.log(`Speed Run Mode: ${this.speedRunMode ? 'ON' : 'OFF'}`);
            return;
        }
        if (key === 'F2') {
            this.showDebugInfo = !this.showDebugInfo;
            console.log(`Debug Info: ${this.showDebugInfo ? 'ON' : 'OFF'}`);
            return;
        }
        if (key === 'T' && this.speedRunMode) {
            // Teleport to Lumina for testing
            const lumimaObj = this.map.objects.find(obj => obj.id === 'lumina');
            if (lumimaObj) {
                this.player.x = lumimaObj.x - 2;
                this.player.y = lumimaObj.y;
                console.log(`Teleported to Lumina at (${lumimaObj.x}, ${lumimaObj.y})`);
            }
            return;
        }
        // Phase jumps (speed run mode only)
        if (this.speedRunMode && key >= '1' && key <= '9') {
            const phases = Object.values(PlotPhase);
            const phaseIndex = parseInt(key) - 1;
            if (phaseIndex < phases.length) {
                this.plotPhase = phases[phaseIndex];
                console.log(`Jumped to phase: ${this.plotPhase}`);
            }
            return;
        }

        // State-specific single-press key handling
        if (this.state === GameState.DIALOGUE) {
            if (key === ' ' || key === 'Enter') {
                this.dialogueSystem.advanceDialogue();
            } else if (key === 'Escape') {
                this.dialogueSystem.endDialogue();
            }
        } else if (this.state === GameState.DIALOGUE_CHOICE) {
            if (key === 'ArrowUp') {
                this.dialogue.selectedChoice = Math.max(0, this.dialogue.selectedChoice - 1);
                this.dialogueSystem.showDialogueChoices();  // Refresh display
            } else if (key === 'ArrowDown') {
                this.dialogue.selectedChoice = Math.min(
                    this.dialogue.choices.length - 1,
                    this.dialogue.selectedChoice + 1
                );
                this.dialogueSystem.showDialogueChoices();  // Refresh display
            } else if (key === ' ' || key === 'Enter') {
                this.dialogueSystem.selectDialogueChoice();
            } else if (key === 'Escape') {
                this.dialogueSystem.endDialogue();
            }
        } else if (this.state === GameState.EXPLORING) {
            if (key === ' ' || key === 'Enter') {
                this.interact();
            } else if (key === 'Escape' || key === 'm' || key === 'M') {
                this.openMenu();
            }
        } else if (this.state === GameState.MENU) {
            if (key === 'Escape' || key === 'm' || key === 'M') {
                this.closeMenu();
            }
        } else if (this.state === GameState.SHOP) {
            if (key === 'Escape') {
                this.closeShop();
            }
        }
    }

    handleInput(deltaTime) {
        // Only allow movement in EXPLORING state
        if (this.state !== GameState.EXPLORING) {
            this.player.moving = false;
            return;
        }

        // Only move if cooldown passed and player can move
        if (!this.player.canMove) {
            this.player.moving = false;
            return;
        }

        this.moveTimer += deltaTime;
        if (this.moveTimer < this.moveCooldown) return;

        let dx = 0, dy = 0;
        let newDirection = this.player.direction;

        // Check arrow keys and WASD
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            dy = -1;
            newDirection = 'up';
        } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            dy = 1;
            newDirection = 'down';
        } else if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            dx = -1;
            newDirection = 'left';
        } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            dx = 1;
            newDirection = 'right';
        }

        // Update direction immediately
        if (newDirection !== this.player.direction) {
            this.player.direction = newDirection;
        }

        // Try to move
        if (dx !== 0 || dy !== 0) {
            const newX = this.player.x + dx;
            const newY = this.player.y + dy;

            if (this.canMoveTo(newX, newY)) {
                this.player.x = newX;
                this.player.y = newY;
                this.player.moving = true;
                this.player.walkFrame = (this.player.walkFrame + 1) % 2;
                this.moveTimer = 0;

                // Check for creature encounters
                this.checkCreatureEncounter();

                // Check quest objectives
                this.questSystem.checkQuestObjectives();
            }
        } else {
            this.player.moving = false;
        }
    }

    canMoveTo(x, y) {
        // Check bounds
        if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height) {
            return false;
        }

        // Check terrain (water blocks)
        const tileIndex = y * this.map.width + x;
        const terrain = this.map.ground[tileIndex];
        if (terrain === 'water') {
            return false;
        }

        // Check object collisions
        for (const obj of this.map.objects) {
            if (obj.type === 'lighthouse') {
                // Lighthouse occupies 3x5 tiles
                if (x >= obj.x && x < obj.x + obj.width &&
                    y >= obj.y && y < obj.y + obj.height) {
                    return false;
                }
            } else if (obj.type === 'tree') {
                // Tree occupies 2x2 tiles
                if (x >= obj.x && x < obj.x + 2 &&
                    y >= obj.y && y < obj.y + 2) {
                    return false;
                }
            } else if (obj.type === 'store') {
                // Store occupies 2x2 tiles
                if (x >= obj.x && x < obj.x + 2 &&
                    y >= obj.y && y < obj.y + 2) {
                    return false;
                }
            } else if (obj.type === 'boat') {
                // Boat occupies 3x2 tiles
                if (x >= obj.x && x < obj.x + 3 &&
                    y >= obj.y && y < obj.y + 2) {
                    return false;
                }
            } else if (obj.type === 'rock') {
                // Rock occupies 1 tile
                if (x === obj.x && y === obj.y) {
                    return false;
                }
            } else if (obj.type === 'npc') {
                // NPC occupies 1 tile
                if (x === obj.x && y === obj.y) {
                    return false;
                }
            }
        }

        return true;
    }

    interact() {
        // Check for nearby NPCs and buildings
        const directions = {
            up: [0, -1],
            down: [0, 1],
            left: [-1, 0],
            right: [1, 0]
        };

        const [dx, dy] = directions[this.player.direction];
        const checkX = this.player.x + dx;
        const checkY = this.player.y + dy;

        // Find NPC or building at interaction position
        for (const obj of this.map.objects) {
            if (obj.type === 'npc' && obj.x === checkX && obj.y === checkY) {
                this.dialogueSystem.showNPCDialog(obj.id);
                return;
            } else if (obj.type === 'store') {
                // Check if player is adjacent to store (2x2 building)
                if (checkX >= obj.x && checkX < obj.x + 2 &&
                    checkY >= obj.y && checkY < obj.y + 2) {
                    this.openShop();
                    return;
                }
            } else if (obj.type === 'boat') {
                // Check if player is adjacent to boat (3x2 object)
                if (checkX >= obj.x && checkX < obj.x + 3 &&
                    checkY >= obj.y && checkY < obj.y + 2) {
                    this.showBoatDialogue();
                    return;
                }
            }
        }
    }

    showBoatDialogue() {
        const progress = `${this.boatQuest.planks.collected}/${this.boatQuest.planks.required} planks, ${this.boatQuest.rope.collected}/${this.boatQuest.rope.required} rope`;

        const dialogue = this.plotPhase === 'boat_ready'
            ? "The boat is repaired and ready to sail! The storm approaches—it's time to depart."
            : `The old fishing boat needs repairs before it can sail. You need: ${progress}. Earn coins from jobs to buy supplies at the shop.`;

        this.showDialog(dialogue);
    }

    // New dialogue system with typewriter effect (delegated to dialogueSystem)
    // Wrapper methods are defined later near updateUI()

    // Old dialogue/quest methods removed - now in subsystems

    // All dialogue and quest methods now in subsystems (dialogueSystem.js, questSystem.js)
    // Legacy/shop/job methods below

    openMenu() {
        this.state = GameState.MENU;
        // TODO: Implement menu UI
    }

    closeMenu() {
        this.state = GameState.EXPLORING;
        // TODO: Hide menu UI
    }

    closeShop() {
        this.state = GameState.EXPLORING;
        document.getElementById('shopUI').classList.add('hidden');
    }

    openShop() {
        this.state = GameState.SHOP;
        this.showShop();
    }

    showShop() {
        const shopUI = document.getElementById('shopUI');
        const shopItems = document.getElementById('shopItems');
        shopItems.innerHTML = '';

        SHOP_ITEMS.forEach(item => {
            const owned = this.inventory.has(item.id);
            const canAfford = this.coins >= item.price;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-header">
                    <span class="shop-item-icon">${item.icon}</span>
                    <span class="shop-item-name">${item.name}</span>
                    <span class="shop-item-price">${item.price} coins</span>
                </div>
                <p class="shop-item-desc">${item.description}</p>
                ${owned ? '<button disabled>Owned</button>' :
                  canAfford ? `<button onclick="game.buyItem('${item.id}', ${item.price})">Buy</button>` :
                  '<button disabled>Not enough coins</button>'}
            `;
            shopItems.appendChild(itemDiv);
        });

        shopUI.classList.remove('hidden');
        document.getElementById('shopClose').onclick = () => {
            this.closeShop();
        };
    }

    buyItem(itemId, price) {
        if (this.coins >= price && !this.inventory.has(itemId)) {
            this.coins -= price;
            this.inventory.add(itemId);
            this.updateUI();
            this.showShop();  // Refresh shop UI
        }
    }

    showJob(npcId, npc) {
        this.state = GameState.JOB;  // Set state to prevent movement
        const jobUI = document.getElementById('jobUI');
        const jobTitle = document.getElementById('jobTitle');
        const jobQuestion = document.getElementById('jobQuestion');
        const jobAnswers = document.getElementById('jobAnswers');

        // Generate job
        const job = JOBS[npc.job]();
        this.currentJob = { ...job, payment: npc.payment, npcId };

        jobTitle.textContent = `${npc.name} - ${npc.jobDescription}`;
        jobQuestion.textContent = job.question;
        jobAnswers.innerHTML = '';

        job.answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.textContent = answer;
            btn.onclick = () => this.submitJobAnswer(answer);
            jobAnswers.appendChild(btn);
        });

        // Add cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'job-cancel';
        cancelBtn.onclick = () => {
            jobUI.classList.add('hidden');
            this.state = GameState.EXPLORING;
            this.currentJob = null;
        };
        jobAnswers.appendChild(cancelBtn);

        jobUI.classList.remove('hidden');
    }

    submitJobAnswer(answer) {
        const jobUI = document.getElementById('jobUI');

        if (answer === this.currentJob.correct) {
            this.coins += this.currentJob.payment;
            this.updateUI();
            this.showDialog(`Correct! You earned ${this.currentJob.payment} coins!`);
        } else {
            this.showDialog(`Not quite right. Try again next time!`);
        }

        jobUI.classList.add('hidden');
        this.state = GameState.EXPLORING;
        this.currentJob = null;
    }

    getTerrainAt(x, y) {
        // Get terrain type at coordinates
        const tileIndex = y * this.map.width + x;
        const groundTerrain = this.map.ground[tileIndex];

        // Check if there's tall grass at this position (overrides ground)
        const hasTallGrass = this.map.objects.some(obj =>
            obj.type === 'tallgrass' && obj.x === x && obj.y === y
        );

        if (hasTallGrass) return 'tallgrass';
        return groundTerrain;  // 'water', 'sand', 'grass', 'cave', etc.
    }

    checkCreatureEncounter() {
        // Scripted first encounter - narrative driven (only for Lumina)
        if (this.plotPhase === PlotPhase.FIND_CREATURE && !this.firstEncounterTriggered) {
            // Specific trigger zone in tall grass (center of tall grass area)
            const triggerZone = {
                x: 19,
                y: 11,
                width: 2,
                height: 2
            };

            // Check if player is in the trigger zone
            if (this.player.x >= triggerZone.x &&
                this.player.x < triggerZone.x + triggerZone.width &&
                this.player.y >= triggerZone.y &&
                this.player.y < triggerZone.y + triggerZone.height) {

                this.firstEncounterTriggered = true;
                this.startFirstCreatureEncounter();
                return;
            }
        }

        // Habitat-based random encounters (for all creatures)
        // Disabled during scripted encounter
        if (!this.encounterState || !this.encounterState.active) {
            this.checkRandomEncounter();
        }
    }

    checkRandomEncounter() {
        const terrain = this.getTerrainAt(this.player.x, this.player.y);

        // Check each creature for possible encounter
        for (const [creatureId, creature] of Object.entries(CREATURES)) {
            // Skip already discovered creatures
            if (this.discoveredCreatures.has(creatureId)) continue;

            // Skip if not in correct habitat
            if (!creature.habitats.includes(terrain)) continue;

            // Skip if requires ability player doesn't have
            if (creature.requiresAbility && !this.playerAbilities.has(creature.requiresAbility)) {
                continue;
            }

            // Golden net doubles encounter rate
            const rate = this.inventory.has('net') ? creature.encounterRate * 2 : creature.encounterRate;

            // Roll for encounter
            if (Math.random() < rate) {
                this.triggerCreatureEncounter(creatureId);
                break;  // Only one encounter at a time
            }
        }
    }

    triggerCreatureEncounter(creatureId) {
        const creature = CREATURES[creatureId];

        // Mark as discovered
        this.discoverCreature(creatureId);

        // Show creature encounter UI
        const creatureUI = document.getElementById('creatureUI');
        const creatureInfo = document.getElementById('creatureInfo');

        creatureInfo.innerHTML = `
            <h3>${creature.emoji} ${creature.name}</h3>
            <p>${creature.description}</p>
            <p class="fact"><strong>Fun Fact:</strong> ${creature.fact}</p>
        `;

        creatureUI.classList.remove('hidden');
        document.getElementById('creatureClose').onclick = () => {
            creatureUI.classList.add('hidden');
        };
    }

    discoverCreature(creatureId) {
        if (this.discoveredCreatures.has(creatureId)) return;

        this.discoveredCreatures.add(creatureId);
        const creature = CREATURES[creatureId];

        // Progress plot phase after first creature
        if (this.plotPhase === PlotPhase.FIND_CREATURE && this.discoveredCreatures.size === 1) {
            this.plotPhase = PlotPhase.CREATURE_ENCOUNTER;
        }

        // Progress to working phase after 3 creatures
        if (this.plotPhase === PlotPhase.RETURN_TO_KEEPER && this.discoveredCreatures.size >= 3) {
            this.plotPhase = PlotPhase.WORKING;
        }

        // Progress to boat ready after 6 creatures
        if (this.plotPhase === PlotPhase.WORKING && this.discoveredCreatures.size >= 6) {
            this.plotPhase = PlotPhase.BOAT_READY;
        }

        const creatureUI = document.getElementById('creatureUI');
        const creatureInfo = document.getElementById('creatureInfo');

        creatureInfo.innerHTML = `
            <div class="creature-icon">${creature.emoji}</div>
            <h3>${creature.name}</h3>
            <p>${creature.description}</p>
            <p class="creature-fact"><strong>Did you know?</strong> ${creature.fact}</p>
        `;

        creatureUI.classList.remove('hidden');
        document.getElementById('creatureClose').onclick = () => {
            creatureUI.classList.add('hidden');
        };

        this.updateUI();
    }

    // ===== FIRST CREATURE ENCOUNTER - NARRATIVE SEQUENCE =====

    startFirstCreatureEncounter() {
        this.encounterState = {
            step: 'intro',
            choice: null,
            creatureName: '',
            active: true  // Disable random encounters during scripted sequence
        };

        // Show first narrative sequence
        this.showCreatureNarrative("Something small is huddled between the rocks.", () => {
            this.showCreatureNarrative("It's shivering. One of its wings is tucked at a strange angle.", () => {
                this.showCreatureNarrative("It sees you and tenses, ready to flee.", () => {
                    this.showCreatureChoice();
                });
            });
        });
    }

    showCreatureNarrative(text, onContinue) {
        this.startDialogue([text], onContinue ? [{
            text: "Continue",
            action: onContinue
        }] : null);
    }

    showCreatureChoice() {
        this.startDialogue(["What do you do?"], [
            {
                text: "Approach slowly",
                action: () => this.handleCreatureChoice('slow')
            },
            {
                text: "Stay still and wait",
                action: () => this.handleCreatureChoice('wait')
            },
            {
                text: "Try to grab it",
                action: () => this.handleCreatureChoice('grab')
            }
        ]);
    }

    handleCreatureChoice(choice) {
        this.encounterState.choice = choice;

        if (choice === 'slow') {
            this.showCreatureNarrative("You take a slow step forward. It watches you but doesn't run.", () => {
                this.showCreatureNarrative("Another step. It makes a small sound—not fear. Something else.", () => {
                    this.showCreatureNarrative("You kneel down. It hesitates... then hops toward you.", () => {
                        this.completeCreatureApproach();
                    });
                });
            });
        } else if (choice === 'wait') {
            this.showCreatureNarrative("You sit down on the rocks and wait.", () => {
                this.showCreatureNarrative("Minutes pass. The creature watches you.", () => {
                    this.showCreatureNarrative("Eventually, curiosity wins. It inches closer, closer...", () => {
                        this.showCreatureNarrative("It stops just out of reach, but it's not afraid anymore.", () => {
                            this.completeCreatureApproach();
                        });
                    });
                });
            });
        } else if (choice === 'grab') {
            this.showCreatureNarrative("You lunge forward. The creature bolts.", () => {
                this.showCreatureNarrative("It scrambles over the rocks, injured wing dragging.", () => {
                    this.showCreatureNarrative("But it doesn't get far. It's too hurt.", () => {
                        this.showCreatureNarrative("You approach more carefully this time. It has no choice but to let you.", () => {
                            this.completeCreatureApproach();
                        });
                    });
                });
            });
        }
    }

    completeCreatureApproach() {
        this.showCreatureNarrative("The creature settles against you. It's warm despite the sea wind.", () => {
            this.showCreatureNaming();
        });
    }

    showCreatureNaming() {
        // Show naming UI using dialogue box
        this.state = GameState.DIALOGUE;
        const dialogBox = document.getElementById('dialogBox');
        const dialogContent = document.getElementById('dialogContent');
        const dialogChoices = document.getElementById('dialogChoices');

        dialogContent.textContent = "It needs a name.";
        dialogChoices.innerHTML = `
            <div class="naming-container">
                <input type="text" id="creatureNameInput" placeholder="Shimmer" maxlength="12" value="Shimmer" />
                <button onclick="game.finalizeCreatureNaming()">Confirm Name</button>
            </div>
        `;

        // Focus input after a short delay
        setTimeout(() => {
            const input = document.getElementById('creatureNameInput');
            if (input) input.focus();
        }, 100);

        dialogBox.classList.remove('hidden');
    }

    finalizeCreatureNaming() {
        const input = document.getElementById('creatureNameInput');
        let name = input ? input.value.trim() : 'Shimmer';

        // Validate name (letters only, 1-12 characters)
        if (!name || !/^[A-Za-z]+$/.test(name) || name.length > 12) {
            name = 'Shimmer';
        }

        // Add creature to party with stats
        const creature = {
            id: 'lumina',
            name: name,
            species: CREATURES['lumina'].name,
            emoji: CREATURES['lumina'].emoji,
            description: CREATURES['lumina'].description,
            fact: CREATURES['lumina'].fact,
            stats: {
                heart: 20,
                maxHeart: 20,
                power: 6,
                guard: 4,
                speed: 10
            },
            isStarter: true
        };
        this.party.push(creature);

        // Mark as discovered
        this.discoveredCreatures.add('lumina');

        // Update plot phase to return_to_keeper
        this.plotPhase = PlotPhase.RETURN_TO_KEEPER;

        // Mark encounter as complete
        this.encounterState.active = false;

        // Update UI
        this.updateUI();

        // Show final message
        this.showCreatureNarrative(`${name} looks up at you. You should tell Marlowe what you found.`, () => {
            this.state = GameState.EXPLORING;
            document.getElementById('dialogBox').classList.add('hidden');
        });
    }

    updateUI() {
        document.getElementById('coins').textContent = `Coins: ${this.coins}`;
        document.getElementById('creatures').textContent =
            `Creatures: ${this.discoveredCreatures.size}/8`;
    }

    // Wrapper methods that delegate to subsystems
    showDialog(message) {
        this.dialogueSystem.showDialog(message);
    }

    startDialogue(lines, choices = null) {
        this.dialogueSystem.startDialogue(lines, choices);
    }

    advanceQuestStep() {
        this.questSystem.advanceQuestStep();
    }

    showQuestProblem(problem, npcName, problemNum = null, totalProblems = null) {
        this.questSystem.showQuestProblem(problem, npcName, problemNum, totalProblems);
    }

    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Update
        this.handleInput(deltaTime);
        this.dialogueSystem.updateDialogue(timestamp);
        spriteLoader.updateWaterAnimation(timestamp);

        // Render
        this.renderingSystem.render();
        if (this.showDebugInfo) {
            this.renderingSystem.renderDebugInfo();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // All rendering methods now in renderingSystem.js
}

// Start game when page loads
let game;
window.addEventListener('load', () => {
    game = new LighthouseGame();
});
