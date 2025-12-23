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
        this.creatureEncounter = null;  // State for narrative creature encounter sequence
        this.hasInspectedBoat = false;  // Track if player has examined the boat
        this.npcInteractions = new Map();  // Track NPC conversations: Map<npcId, Set<plotPhase>>
        this.lastDialogueEndTime = 0;  // Prevent double-interaction after dialogue ends

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
        this.dialogueQueue = new DialogueQueueSystem(this);
        this.dialogue = this.dialogueQueue;  // Primary API
        this.renderingSystem = new RenderingSystem(this);

        // Initialize InputRouter - centralized input handling
        this.inputRouter = new InputRouter();

        // Register input handlers with priority
        // Higher priority = processed first
        this.inputRouter.register(this.dialogue, 100);  // Dialogue has highest priority
        this.inputRouter.register(this, 0);  // Game exploration has lowest priority


        // Set up dialogue event listeners
        this.setupDialogueListeners();

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

        // Set version display
        const versionEl = document.getElementById('version-display');
        if (versionEl) {
            fetch('VERSION.txt')
                .then(r => r.text())
                .then(v => versionEl.textContent = 'v' + v.trim())
                .catch(() => versionEl.textContent = 'v???');
        }

        // Start game loop
        this.gameLoop();

        console.log('✓ Lighthouse Adventure started!');
    }

    setupDialogueListeners() {
        console.log('[Game] setupDialogueListeners called');
        // Creature encounter event listeners
        this.dialogue.on('trigger:creature_choice_slow', () => {
            this.creatureEncounter.choice = 'slow';
            this.dialogue.queueFlow(CREATURE_FLOWS.slow);
        });

        this.dialogue.on('trigger:creature_choice_wait', () => {
            this.creatureEncounter.choice = 'wait';
            this.dialogue.queueFlow(CREATURE_FLOWS.wait);
        });

        this.dialogue.on('trigger:creature_choice_grab', () => {
            this.creatureEncounter.choice = 'grab';
            this.dialogue.queueFlow(CREATURE_FLOWS.grab);
        });

        this.dialogue.on('trigger:creature_path_complete', () => {
            this.finishCreatureEncounter();
        });

        this.dialogue.on('trigger:creature_bonding_complete', () => {
            console.log('[DialogueQueue] Creature bonding complete - showing naming UI');

            // Inline the naming logic to avoid any scoping issues
            this.clearAllKeys();

            const nameOptions = ['Shimmer', 'Lumina', 'Spark', 'Glow', 'Nova'];
            const encounterUI = document.getElementById('firstEncounterUI');
            const encounterText = document.getElementById('encounterText');
            const encounterChoices = document.getElementById('encounterChoices');
            const encounterCanvas = document.getElementById('encounterCreatureCanvas');

            // Draw creature
            const ctx = encounterCanvas.getContext('2d');
            ctx.clearRect(0, 0, 128, 128);
            ctx.save();
            ctx.scale(6, 6);
            spriteLoader.drawCreature(ctx, 'lumina', 16, 16);
            ctx.restore();

            encounterText.textContent = "It needs a name.";

            // Create choice buttons
            encounterChoices.innerHTML = '';
            let selectedIndex = 0;

            const updateSelection = () => {
                const buttons = encounterChoices.querySelectorAll('.encounter-choice');
                buttons.forEach((btn, i) => {
                    btn.classList.toggle('selected', i === selectedIndex);
                });
            };

            nameOptions.forEach((name, index) => {
                const button = document.createElement('button');
                button.className = 'encounter-choice';
                button.textContent = name;
                button.onclick = () => {
                    selectedIndex = index;
                    updateSelection();
                    this.finalizeCreatureNaming(name);
                    encounterUI.classList.add('hidden');
                };
                encounterChoices.appendChild(button);
            });

            // Set up InputRouter
            this.inputRouter.push({
                priority: 100,
                handleInput: (key) => {
                    if (key === 'ArrowUp') {
                        selectedIndex = (selectedIndex - 1 + nameOptions.length) % nameOptions.length;
                        updateSelection();
                        return true;
                    } else if (key === 'ArrowDown') {
                        selectedIndex = (selectedIndex + 1) % nameOptions.length;
                        updateSelection();
                        return true;
                    } else if (key === 'Enter' || key === ' ') {
                        this.finalizeCreatureNaming(nameOptions[selectedIndex]);
                        encounterUI.classList.add('hidden');
                        this.inputRouter.pop();
                        return true;
                    }
                    return false;
                }
            });

            encounterUI.classList.remove('hidden');
            updateSelection();
            console.log('[DialogueQueue] Naming UI shown');
        });
        console.log('[Game] Registered creature_bonding_complete handler');

        this.dialogue.on('trigger:creature_naming_complete', () => {
            console.log('[Game] Creature naming complete, returning to EXPLORING state');
            this.state = GameState.EXPLORING;
        });

        // Shop event listeners
        SHOP_ITEMS.forEach(item => {
            this.dialogue.on(`trigger:shop_owned_${item.id}`, () => {
                this.dialogue.queue({
                    text: `You already own ${item.name}.`,
                    trigger: 'shop_message_shown'
                });
            });

            this.dialogue.on(`trigger:shop_buy_${item.id}`, () => {
                this.buyItem(item.id, item.price);
            });

            this.dialogue.on(`trigger:shop_cant_afford_${item.id}`, () => {
                this.dialogue.queue({
                    text: `You need ${item.price} coins to buy ${item.name}.`,
                    trigger: 'shop_message_shown'
                });
            });
        });

        this.dialogue.on('trigger:shop_message_shown', () => {
            // After showing shop message, reopen shop
            this.showShop();
        });

        this.dialogue.on('trigger:shop_exit', () => {
            console.log('[Game] Exiting shop, returning to EXPLORING state');
            this.state = GameState.EXPLORING;
        });

        // Job event listeners
        this.dialogue.on('trigger:job_correct', () => {
            this.submitJobAnswer(true);
        });

        this.dialogue.on('trigger:job_incorrect', () => {
            this.submitJobAnswer(false);
        });

        // Quest completion event listeners
        this.dialogue.on('trigger:quest_step_completed', () => {
            if (this.activeQuest.currentStep >= this.activeQuest.quest.steps.length) {
                this.questSystem.completeQuest();
            } else {
                this.questSystem.advanceQuestStep();
            }
        });

        // General event logging (for debugging)
        this.dialogue.on('started', (id) => {
            console.log('[Dialogue] Started:', id);
        });

        this.dialogue.on('closed', (id) => {
            console.log('[Dialogue] Closed:', id);

            // CRITICAL FIX: Update lastDialogueEndTime to prevent double-interaction
            // This prevents interact() from being called by the same button press that closed the dialogue
            this.lastDialogueEndTime = Date.now();
        });
    }

    setupDebugMenu() {
        const debugMenuBtn = document.getElementById('debugMenuBtn');
        const debugMenu = document.getElementById('debugMenu');
        const debugMenuClose = document.getElementById('debugMenuClose');

        // Debug menu button is always visible (removed auto-hide logic)

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

        // Debug Console toggle - repurposed for verbose logging
        document.getElementById('toggleDebugConsole').addEventListener('click', (e) => {
            this.dialogue.verboseLogging = !this.dialogue.verboseLogging;
            console.log(`Verbose Logging: ${this.dialogue.verboseLogging ? 'ON' : 'OFF'}`);

            // Show/hide on-screen logger
            if (typeof onScreenLogger !== 'undefined') {
                onScreenLogger.setVisible(this.dialogue.verboseLogging);
            }

            this.updateDebugMenuButtons();
        });

        // Debug Console close button
        const debugConsoleClose = document.getElementById('debugConsoleClose');
        if (debugConsoleClose) {
            debugConsoleClose.addEventListener('click', () => {
                debugLogger.toggle();
                this.updateDebugMenuButtons();
            });
        }

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
        const debugConsoleBtn = document.getElementById('toggleDebugConsole');

        speedRunBtn.textContent = `Speed Run: ${this.speedRunMode ? 'ON' : 'OFF'}`;
        speedRunBtn.classList.toggle('active', this.speedRunMode);

        debugInfoBtn.textContent = `Debug Info: ${this.showDebugInfo ? 'ON' : 'OFF'}`;
        debugInfoBtn.classList.toggle('active', this.showDebugInfo);

        debugConsoleBtn.textContent = `Verbose Logs: ${this.dialogue.verboseLogging ? 'ON' : 'OFF'}`;
        debugConsoleBtn.classList.toggle('active', this.dialogue.verboseLogging);
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
        // Event listeners for dialogue are now in dialogueSystem.js
        // to prevent duplicate handlers and race conditions

        // MOBILE ONLY - No desktop keyboard support
        // The mobile A button dispatches keyboard events that dialogueSystem.js catches
        // All movement is handled by mobile touch controls below

        // Mobile controls
        const buttons = document.querySelectorAll('.dpad-btn, .action-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;
                if (key) {
                    // Set key state for movement
                    if (!this.keys[key]) {
                        this.keysPressed[key] = true;
                    }
                    this.keys[key] = true;
                    this.handleKeyPress(key);

                    // ALSO dispatch keyboard event for dialogue choice navigation
                    const keydownEvent = new KeyboardEvent('keydown', {
                        key: key,
                        code: key === 'ArrowUp' ? 'ArrowUp' :
                              key === 'ArrowDown' ? 'ArrowDown' :
                              key === 'ArrowLeft' ? 'ArrowLeft' : 'ArrowRight',
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(keydownEvent);
                } else if (btn.id === 'btnAction') {
                    // Dispatch real keyboard event so dialogueSystem can catch it
                    const keydownEvent = new KeyboardEvent('keydown', {
                        key: 'a',
                        code: 'KeyA',
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(keydownEvent);

                    // CRITICAL: Dispatch keyup immediately after to prevent key staying "pressed"
                    // This prevents player from walking left after dialogue ends
                    setTimeout(() => {
                        const keyupEvent = new KeyboardEvent('keyup', {
                            key: 'a',
                            code: 'KeyA',
                            bubbles: true,
                            cancelable: true
                        });
                        document.dispatchEvent(keyupEvent);
                    }, 50);

                    // InputRouter now handles all input - no need to call handleKeyPress
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

            // MOBILE ONLY - No click handler needed
            // touchstart/touchend handles everything
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

        // State-specific single-press key handling (MOBILE ONLY)
        // (Dialogue keyboard handling now in dialogueSystem.js to prevent race conditions)
        if (this.state === GameState.EXPLORING) {
            // Enter key from mobile A button
            if (key === 'Enter') {
                this.interact();
            }
        }
        // Menu/Shop handling removed - mobile only uses on-screen buttons
    }

    /**
     * Handle input from InputRouter
     * Called after dialogue system (priority 0 vs dialogue's 100)
     *
     * @param {Object} input - Input object from router
     * @param {string} input.key - Key that was pressed
     * @param {Function} input.consume - Call to prevent lower-priority handlers from seeing this input
     */
    handleInput(input) {
        // Only handle input in EXPLORING state
        if (this.state !== GameState.EXPLORING) {
            // Don't consume - let other systems handle it
            return;
        }

        // A button or Enter key triggers interaction
        if (input.key === 'a' || input.key === 'A' || input.key === 'Enter') {
            this.interact();
            input.consume(); // ✅ Consumed - handled the input
            return;
        }

        // Movement keys (arrow keys) - don't consume, just track state
        // Movement is handled by handleInput(deltaTime) in game loop
        // We don't consume movement keys so browser doesn't prevent scrolling if needed
    }

    updateMovement(deltaTime) {
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

        // Check mobile controls (using arrow key names from data-key attributes)
        if (this.keys['ArrowUp']) {
            dy = -1;
            newDirection = 'up';
        } else if (this.keys['ArrowDown']) {
            dy = 1;
            newDirection = 'down';
        } else if (this.keys['ArrowLeft']) {
            dx = -1;
            newDirection = 'left';
        } else if (this.keys['ArrowRight']) {
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
            } else if (obj.type === 'creature') {
                // First creature (Lumina) - only blocks during find_creature phase
                if (obj.id === 'lumina_first' && this.plotPhase === PlotPhase.FIND_CREATURE) {
                    if (x === obj.x && y === obj.y) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    interact() {
        // CRITICAL FIX: Prevent interaction while dialogue is active
        // This was causing infinite loop - A button would both advance dialogue AND trigger interact()
        if (this.dialogue.state !== 'IDLE') {
            return;
        }

        // Prevent double-interaction: don't allow interaction immediately after dialogue ends
        const now = Date.now();
        if (now - this.lastDialogueEndTime < 300) {
            return;
        }

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

        // Find NPC, creature, or building at interaction position
        for (const obj of this.map.objects) {
            if (obj.type === 'creature' && obj.x === checkX && obj.y === checkY) {
                // Trigger first creature encounter
                if (obj.id === 'lumina_first' && this.plotPhase === PlotPhase.FIND_CREATURE) {
                    this.firstEncounterTriggered = true;
                    this.startFirstCreatureEncounter();
                }
                return;
            } else if (obj.type === 'npc' && obj.x === checkX && obj.y === checkY) {
                this.dialogue.showNPCDialog(obj.id);
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
        // Boat ready - departure time
        if (this.plotPhase === 'boat_ready') {
            this.showDialog("The boat is repaired and ready. Storm's coming—it's time to leave.");
            return;
        }

        // Mark boat as inspected (unlocks exercises with Callum)
        if (!this.hasInspectedBoat && this.plotPhase === 'boat_quest') {
            this.hasInspectedBoat = true;
            console.log('[Game] Boat inspected - exercises now unlocked');
        }

        // Narrative examination based on repair progress
        const planksProgress = this.boatQuest.planks.collected / this.boatQuest.planks.required;
        const ropeProgress = this.boatQuest.rope.collected / this.boatQuest.rope.required;

        let dialogue;

        if (planksProgress < 0.25 && ropeProgress < 0.25) {
            // Early state - barely started
            dialogue = "The boat's hull is cracked and weathered. Most of the planks are rotted through. The rigging is gone—you'd need rope, and a lot of it.";
        } else if (planksProgress < 0.5) {
            // Started on planks
            dialogue = "You've replaced a few planks, but there's still a lot of work ahead. The hull won't hold without more.";
        } else if (planksProgress < 0.75) {
            // Good progress on planks
            dialogue = "The hull is taking shape. You still need more planks, though. And all that rigging to replace.";
        } else if (planksProgress >= 0.75 && ropeProgress < 0.5) {
            // Planks almost done, rope needed
            dialogue = "Most of the hull is repaired. Just a few more planks needed. But the rope situation—that'll take time.";
        } else if (ropeProgress < 0.75) {
            // Working on rope
            dialogue = "The hull is solid now. You're making progress on the rigging, but you'll need more rope before this boat can sail.";
        } else {
            // Nearly complete
            dialogue = "Almost there. Just a little more rope and Callum can finish the rigging. Won't be long now.";
        }

        this.showDialog(dialogue);
    }

    showBoatQuestExplanation() {
        this.startDialogue([
            "The boat. Everyone knows about the boat.",
            "Old ferry that runs up the coast. Been sitting broken for months.",
            "You want to leave this rock, you need that boat working.",
            "I can help with repairs. But I'll need things. And I don't work for free.",
            "Here's what we need:",
            "Planks. Driftwood works—there's plenty on the north shore.",
            "Rope. You can buy it from Marina's shop, or make it from cliff hemp if you're patient.",
            "And a compass. Can't navigate the coast without one. Marina sells those too.",
            "The compass alone is 50 coin. So you better start working."
        ], [
            {
                text: "I'll do it.",
                action: () => {
                    this.finishBoatQuestExplanation(false);
                }
            },
            {
                text: "That's a lot...",
                action: () => {
                    this.finishBoatQuestExplanation(true);
                }
            }
        ], null, 'Callum');
    }

    finishBoatQuestExplanation(showDoubtResponse) {
        const finalLines = showDoubtResponse
            ? [
                "The sea doesn't care what's easy. You want off this island or not?",
                "Talk to me when you want work. I pay fair for honest counting."
            ]
            : ["Talk to me when you want work. I pay fair for honest counting."];

        this.startDialogue(finalLines, [{
            text: "Okay",
            action: () => {
                // Phase already set by meet_villager onClose
                // Just dismiss the dialogue
            }
        }], null, 'Callum');
    }

    // Menu system (placeholder - full implementation pending)
    openMenu() {
        this.state = GameState.MENU;
    }

    closeMenu() {
        this.state = GameState.EXPLORING;
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
        // Build shop choices (D-pad compatible)
        const choices = [];

        SHOP_ITEMS.forEach(item => {
            const owned = this.inventory.has(item.id);
            const canAfford = this.coins >= item.price;

            // Consumable items can always be purchased (don't show "Owned")
            if (owned && !item.consumable) {
                choices.push({
                    text: `${item.icon} ${item.name} (Owned)`,
                    trigger: `shop_owned_${item.id}` // Use trigger instead of action
                });
            } else if (canAfford) {
                choices.push({
                    text: `${item.icon} ${item.name} (${item.price} coins)`,
                    trigger: `shop_buy_${item.id}` // Use trigger instead of action
                });
            } else {
                choices.push({
                    text: `${item.icon} ${item.name} (Need ${item.price} coins)`,
                    trigger: `shop_cant_afford_${item.id}` // Use trigger instead of action
                });
            }
        });

        // Add close option
        choices.push({
            text: 'Leave shop',
            trigger: 'shop_exit'  // Use trigger to restore state
        });

        // Show as dialogue (D-pad controlled)
        this.dialogue.startDialogue(
            ["Welcome to Marina's shop! What would you like?"],
            choices,
            null,
            'Marina'
        );
    }

    buyItem(itemId, price) {
        // Find the item definition to check if it's consumable
        const item = SHOP_ITEMS.find(i => i.id === itemId);

        if (!item) {
            console.error(`Item ${itemId} not found in shop`);
            return;
        }

        // Handle consumable items (can buy multiple times)
        if (item.consumable) {
            if (this.coins >= price) {
                this.coins -= price;

                // Update boat quest progress based on item type
                if (this.boatQuest) {
                    if (itemId === 'rope') {
                        this.boatQuest.rope.collected += item.quantity || 1;
                        console.log(`[Game] Bought rope, now have ${this.boatQuest.rope.collected}/${this.boatQuest.rope.required}`);
                    } else if (itemId === 'planks') {
                        this.boatQuest.planks.collected += item.quantity || 1;
                        console.log(`[Game] Bought planks, now have ${this.boatQuest.planks.collected}/${this.boatQuest.planks.required}`);
                    } else if (itemId === 'driftwood') {
                        // Driftwood can be crafted into planks (future feature)
                        // For now, just track in inventory
                        const currentCount = this.driftwoodCount || 0;
                        this.driftwoodCount = currentCount + (item.quantity || 1);
                        console.log(`[Game] Bought driftwood, now have ${this.driftwoodCount} pieces`);
                    }
                }

                this.updateUI();
                this.showShop();  // Refresh shop UI
            }
        } else {
            // Handle permanent items (can only buy once)
            if (this.coins >= price && !this.inventory.has(itemId)) {
                this.coins -= price;
                this.inventory.add(itemId);
                this.updateUI();
                this.showShop();  // Refresh shop UI
            }
        }
    }

    showJob(npcId, npc) {
        // Generate job
        const job = JOBS[npc.job]();
        this.currentJob = { ...job, payment: npc.payment, npcId };

        // Convert answers to dialogue choices (D-pad compatible) using triggers
        const choices = job.answers.map(answer => ({
            text: answer,
            trigger: answer === job.correct ? 'job_correct' : 'job_incorrect'
        }));

        // Add cancel option
        choices.push({
            text: 'Cancel',
            action: () => {
                this.currentJob = null;
            }
        });

        // Show as dialogue (D-pad controlled)
        this.dialogue.startDialogue(
            [job.question],
            choices,
            null,
            `${npc.name} - ${npc.jobDescription}`
        );
    }

    submitJobAnswer(isCorrect) {
        const jobUI = document.getElementById('jobUI');

        if (isCorrect) {
            this.coins += this.currentJob.payment;
            this.updateUI();
            // Queue message instead of calling showDialog directly
            this.dialogue.queue({
                text: `Correct! You earned ${this.currentJob.payment} coins!`
            });
        } else {
            // Queue message instead of calling showDialog directly
            this.dialogue.queue({
                text: `Not quite right. Try again next time!`
            });
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
        // Scripted first encounter (Lumina on beach near rocks)
        if (this.plotPhase === PlotPhase.FIND_CREATURE && !this.firstEncounterTriggered) {
            const FIRST_ENCOUNTER_ZONE = { x: 7, y: 7, width: 2, height: 2 };  // Western beach, near rocks

            if (this.player.x >= FIRST_ENCOUNTER_ZONE.x &&
                this.player.x < FIRST_ENCOUNTER_ZONE.x + FIRST_ENCOUNTER_ZONE.width &&
                this.player.y >= FIRST_ENCOUNTER_ZONE.y &&
                this.player.y < FIRST_ENCOUNTER_ZONE.y + FIRST_ENCOUNTER_ZONE.height) {

                this.firstEncounterTriggered = true;
                this.startFirstCreatureEncounter();
                return;
            }
        }

        // Random habitat-based encounters (disabled during scripted sequence)
        if (!this.creatureEncounter || !this.creatureEncounter.active) {
            this.checkRandomEncounter();
        }
    }

    checkRandomEncounter() {
        // CRITICAL: Disable random encounters during find_creature phase
        // The first creature MUST be the scripted narrative sequence
        if (this.plotPhase === PlotPhase.FIND_CREATURE && !this.firstEncounterTriggered) {
            return;  // No random encounters until scripted encounter completes
        }

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

        // Show as dialogue (D-pad controlled)
        this.dialogue.startDialogue(
            [
                `${creature.emoji} ${creature.name}`,
                creature.description,
                `Fun Fact: ${creature.fact}`
            ],
            [{
                text: 'Continue',
                action: () => {}  // Just dismiss
            }],
            null,
            'Creature Info'
        );
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

        // Show discovery as dialogue (D-pad controlled)
        this.dialogue.startDialogue(
            [
                `${creature.emoji} ${creature.name}`,
                creature.description,
                `Did you know? ${creature.fact}`
            ],
            [{
                text: 'Continue',
                action: () => {}  // Just dismiss
            }],
            null,
            'New Discovery!'
        );

        this.updateUI();
    }

    // First Creature Encounter - Narrative Sequence (Queue-Based)
    startFirstCreatureEncounter() {
        this.creatureEncounter = {
            step: 'intro',
            choice: null,
            creatureName: '',
            active: true
        };

        // Clear all held keys to prevent movement after encounter
        this.clearAllKeys();

        // Queue the introduction flow
        this.dialogue.queueFlow(CREATURE_FLOWS.intro);
    }

    clearAllKeys() {
        // Clear all key states to prevent stuck movement
        this.keys = {};
        this.keysPressed = {};
        this.player.moving = false;
    }

    finishCreatureEncounter() {
        // Queue bonding sequence (which will trigger creature_bonding_complete when done)
        this.dialogue.queueFlow(CREATURE_FLOWS.bonding);
    }

    showCreatureNaming() {
        console.log('[Game] showCreatureNaming() called');
        // Clear all held keys to prevent movement after naming
        this.clearAllKeys();

        // Show dedicated first encounter view with naming choices
        const nameOptions = ['Shimmer', 'Lumina', 'Spark', 'Glow', 'Nova'];

        // Get UI elements
        const encounterUI = document.getElementById('firstEncounterUI');
        const encounterText = document.getElementById('encounterText');
        const encounterChoices = document.getElementById('encounterChoices');
        const encounterCanvas = document.getElementById('encounterCreatureCanvas');

        // Draw creature on canvas (8x scale for 128x128 display)
        const ctx = encounterCanvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);

        // Center the creature (16x16 sprite scaled 6x = 96x96, centered in 128x128)
        ctx.save();
        ctx.scale(6, 6);
        spriteLoader.drawCreature(ctx, 'lumina', 16, 16);
        ctx.restore();

        // Set text
        encounterText.textContent = "It needs a name.";

        // Create choice buttons
        encounterChoices.innerHTML = '';
        let selectedIndex = 0;

        const updateSelection = () => {
            const buttons = encounterChoices.querySelectorAll('.encounter-choice');
            buttons.forEach((btn, i) => {
                btn.classList.toggle('selected', i === selectedIndex);
            });
        };

        nameOptions.forEach((name, index) => {
            const button = document.createElement('button');
            button.className = 'encounter-choice';
            button.textContent = name;
            button.onclick = () => {
                selectedIndex = index;
                updateSelection();
                this.finalizeCreatureNaming(name);
                encounterUI.classList.add('hidden');
            };
            encounterChoices.appendChild(button);
        });

        // Set up InputRouter for D-pad navigation
        this.inputRouter.push({
            priority: 100,
            handleInput: (key) => {
                if (key === 'ArrowUp') {
                    selectedIndex = (selectedIndex - 1 + nameOptions.length) % nameOptions.length;
                    updateSelection();
                    return true;
                } else if (key === 'ArrowDown') {
                    selectedIndex = (selectedIndex + 1) % nameOptions.length;
                    updateSelection();
                    return true;
                } else if (key === 'Enter' || key === ' ') {
                    this.finalizeCreatureNaming(nameOptions[selectedIndex]);
                    encounterUI.classList.add('hidden');
                    this.inputRouter.pop();
                    return true;
                }
                return false;
            }
        });

        // Show UI and set initial selection
        encounterUI.classList.remove('hidden');
        updateSelection();
    }

    finalizeCreatureNaming(name = 'Shimmer') {
        console.log(`[Game] finalizeCreatureNaming: ${name}`);

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

        // Update plot phase to creature_found (will trigger keeper dialogue)
        this.plotPhase = 'creature_found';

        // Mark encounter as complete
        this.creatureEncounter.active = false;

        // Update UI
        this.updateUI();

        // Queue final message instead of calling showCreatureNarrative
        // This prevents nested dialogue calls
        this.dialogue.queue({
            text: `${name} looks up at you. You should tell Marlowe what you found.`,
            trigger: 'creature_naming_complete'
        });
    }

    updateUI() {
        document.getElementById('coins').textContent = `Coins: ${this.coins}`;
        document.getElementById('creatures').textContent =
            `Creatures: ${this.discoveredCreatures.size}/8`;
    }

    // Wrapper methods that delegate to subsystems
    showDialog(message) {
        this.dialogue.showDialog(message);
    }

    startDialogue(lines, choices = null, onClose = null) {
        this.dialogue.startDialogue(lines, choices, onClose);
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
        this.updateMovement(deltaTime);
        spriteLoader.updateWaterAnimation(timestamp);
        this.dialogue.update(timestamp); // Typewriter animation

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
