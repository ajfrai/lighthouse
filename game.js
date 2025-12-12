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
        this.inventory = new Set();
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
                this.advanceDialogue();
            }
        } else if (this.state === GameState.DIALOGUE_CHOICE) {
            if (key === 'ArrowUp') {
                this.dialogue.selectedChoice = Math.max(0, this.dialogue.selectedChoice - 1);
            } else if (key === 'ArrowDown') {
                this.dialogue.selectedChoice = Math.min(
                    this.dialogue.choices.length - 1,
                    this.dialogue.selectedChoice + 1
                );
            } else if (key === ' ' || key === 'Enter') {
                this.selectDialogueChoice();
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
        // Check for nearby NPCs
        const directions = {
            up: [0, -1],
            down: [0, 1],
            left: [-1, 0],
            right: [1, 0]
        };

        const [dx, dy] = directions[this.player.direction];
        const checkX = this.player.x + dx;
        const checkY = this.player.y + dy;

        // Find NPC at interaction position
        for (const obj of this.map.objects) {
            if (obj.type === 'npc' && obj.x === checkX && obj.y === checkY) {
                this.showNPCDialog(obj.id);
                return;
            }
        }
    }

    showNPCDialog(npcId) {
        const npc = NPCS[npcId];
        if (!npc) return;

        // Handle the Keeper with state-based dialogue
        if (npc.isKeeper) {
            const dialogue = npc.dialogues[this.plotPhase];

            // After showing wake_up dialogue, transition to find_creature phase
            if (this.plotPhase === PlotPhase.WAKE_UP) {
                this.startDialogue([dialogue || npc.dialogues.wake_up], [{
                    text: "I'll go look for it",
                    action: () => {
                        this.plotPhase = PlotPhase.FIND_CREATURE;
                        this.firstEncounterTriggered = false;
                    }
                }]);
            } else {
                this.showDialog(dialogue || npc.dialogues.wake_up);
            }
            return;
        }

        if (npc.shop) {
            this.showShop();
        } else if (npc.job) {
            this.showJob(npcId, npc);
        } else {
            this.showDialog(npc.greeting);
        }
    }

    // New dialogue system with typewriter effect
    startDialogue(lines, choices = null) {
        this.state = GameState.DIALOGUE;
        this.dialogue.active = true;
        this.dialogue.lines = Array.isArray(lines) ? lines : [lines];
        this.dialogue.currentLine = 0;
        this.dialogue.textIndex = 0;
        this.dialogue.currentText = '';
        this.dialogue.fullText = this.dialogue.lines[0];
        this.dialogue.choices = choices;
        this.dialogue.selectedChoice = 0;

        const dialogBox = document.getElementById('dialogBox');
        const dialogClose = document.getElementById('dialogClose');

        // Show/hide close button based on whether there are choices
        if (dialogClose) {
            dialogClose.style.display = choices ? 'none' : 'inline-block';
        }

        dialogBox.classList.remove('hidden');
    }

    updateDialogue(timestamp) {
        if (!this.dialogue.active) return;

        const timeSinceLastChar = timestamp - this.dialogue.lastTypewriterUpdate;
        const msPerChar = 1000 / this.dialogue.typewriterSpeed;

        if (timeSinceLastChar >= msPerChar && this.dialogue.textIndex < this.dialogue.fullText.length) {
            this.dialogue.textIndex++;
            this.dialogue.currentText = this.dialogue.fullText.substring(0, this.dialogue.textIndex);
            this.dialogue.lastTypewriterUpdate = timestamp;

            // Update UI
            const dialogContent = document.getElementById('dialogContent');
            dialogContent.textContent = this.dialogue.currentText;
        }
    }

    advanceDialogue() {
        // If typewriter still going, complete it instantly
        if (this.dialogue.textIndex < this.dialogue.fullText.length) {
            this.dialogue.textIndex = this.dialogue.fullText.length;
            this.dialogue.currentText = this.dialogue.fullText;
            document.getElementById('dialogContent').textContent = this.dialogue.currentText;
            return;
        }

        // Move to next line
        this.dialogue.currentLine++;

        if (this.dialogue.currentLine < this.dialogue.lines.length) {
            // Start next line
            this.dialogue.textIndex = 0;
            this.dialogue.currentText = '';
            this.dialogue.fullText = this.dialogue.lines[this.dialogue.currentLine];
        } else if (this.dialogue.choices) {
            // Show choices
            this.state = GameState.DIALOGUE_CHOICE;
            this.showDialogueChoices();
        } else {
            // End dialogue
            this.endDialogue();
        }
    }

    showDialogueChoices() {
        const dialogContent = document.getElementById('dialogContent');
        const dialogClose = document.getElementById('dialogClose');

        // Hide close button when showing choices
        if (dialogClose) {
            dialogClose.style.display = 'none';
        }

        let html = '<div class="dialogue-choices">';
        this.dialogue.choices.forEach((choice, index) => {
            const selected = index === this.dialogue.selectedChoice ? 'selected' : '';
            html += `<div class="choice ${selected}">${choice.text}</div>`;
        });
        html += '</div>';
        dialogContent.innerHTML = html;
    }

    selectDialogueChoice() {
        const choice = this.dialogue.choices[this.dialogue.selectedChoice];
        if (choice.action) {
            choice.action.call(this);
        }
        this.endDialogue();
    }

    endDialogue() {
        this.dialogue.active = false;
        this.state = GameState.EXPLORING;
        document.getElementById('dialogBox').classList.add('hidden');
    }

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

    // Legacy dialog method for compatibility
    showDialog(text) {
        this.startDialogue([text]);
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
            shopUI.classList.add('hidden');
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
        this.currentJob = null;
    }

    checkCreatureEncounter() {
        // Scripted first encounter - narrative driven
        if (this.plotPhase === PlotPhase.FIND_CREATURE && !this.firstEncounterTriggered) {
            // Check proximity to Lumina (the first creature near lighthouse)
            const lumimaObj = this.map.objects.find(obj => obj.id === 'lumina');
            if (lumimaObj) {
                const distance = Math.hypot(
                    this.player.x - lumimaObj.x,
                    this.player.y - lumimaObj.y
                );

                // Trigger narrative encounter when close
                if (distance <= 3) {
                    this.firstEncounterTriggered = true;
                    this.startFirstCreatureEncounter();
                    return;
                }
            }
        }

        // Random encounter chance (for subsequent creatures)
        const baseChance = 0.02;  // 2% per step
        const hasNet = this.inventory.has('net') ? 2 : 1;  // Golden net doubles chance

        if (Math.random() < baseChance * hasNet) {
            // Find undiscovered creatures
            const undiscovered = this.map.objects
                .filter(obj => obj.type === 'creature' && !this.discoveredCreatures.has(obj.id));

            if (undiscovered.length > 0) {
                // Random undiscovered creature
                const creature = undiscovered[Math.floor(Math.random() * undiscovered.length)];
                this.discoverCreature(creature.id);
            }
        }
    }

    discoverCreature(creatureId) {
        if (this.discoveredCreatures.has(creatureId)) return;

        this.discoveredCreatures.add(creatureId);
        const creature = CREATURES[creatureId];

        // Progress plot phase after first creature
        if (this.plotPhase === PlotPhase.FIND_CREATURE && this.discoveredCreatures.size === 1) {
            this.plotPhase = PlotPhase.RETURN_TO_KEEPER;
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
            creatureName: ''
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

        // Validate name (letters only)
        if (!name || !/^[A-Za-z]+$/.test(name)) {
            name = 'Shimmer';
        }

        // Add creature to party with custom name
        const lumina = { ...CREATURES['lumina'] };
        lumina.customName = name;
        this.party.push(lumina);

        // Mark as discovered
        this.discoverCreature('lumina');

        // Show final message
        this.showCreatureNarrative(`${name} looks up at you. You should tell the Keeper what you found.`, () => {
            this.state = GameState.EXPLORING;
            document.getElementById('dialogBox').classList.add('hidden');
        });
    }

    updateUI() {
        document.getElementById('coins').textContent = `Coins: ${this.coins}`;
        document.getElementById('creatures').textContent =
            `Creatures: ${this.discoveredCreatures.size}/8`;
    }

    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Update
        this.handleInput(deltaTime);
        this.updateDialogue(timestamp);
        spriteLoader.updateWaterAnimation(timestamp);

        // Render
        this.render();
        if (this.showDebugInfo) {
            this.renderDebugInfo();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        // Clear
        this.ctx.fillStyle = '#0a1628';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render layers
        this.renderTerrain();
        this.renderObjects();
        this.renderPlayer();
    }

    renderTerrain() {
        const tileSize = this.map.tileSize;

        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                const index = y * this.map.width + x;
                const terrain = this.map.ground[index];

                let tileName;
                if (terrain === 'water') {
                    tileName = `water_${spriteLoader.getWaterFrame()}`;
                } else if (terrain === 'grass') {
                    tileName = spriteLoader.getTileVariant('grass', x, y, 4);
                } else if (terrain === 'sand') {
                    tileName = spriteLoader.getTileVariant('sand', x, y, 3);
                }

                spriteLoader.drawTile(
                    this.ctx,
                    tileName,
                    x * tileSize,
                    y * tileSize,
                    tileSize
                );
            }
        }
    }

    renderObjects() {
        const tileSize = this.map.tileSize;

        for (const obj of this.map.objects) {
            if (obj.type === 'lighthouse') {
                spriteLoader.drawLighthouse(
                    this.ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'tree') {
                spriteLoader.drawTree(
                    this.ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'npc') {
                spriteLoader.drawCharacter(
                    this.ctx,
                    obj.charType || 'player',  // Character type
                    obj.sprite,                 // Direction
                    0,                          // Frame (NPCs don't animate)
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            }
            // Creatures are invisible until discovered
        }
    }

    renderPlayer() {
        const tileSize = this.map.tileSize;
        const frame = this.player.moving ? this.player.walkFrame : 0;

        spriteLoader.drawCharacter(
            this.ctx,
            'player',               // Character type
            this.player.direction,  // Direction
            frame,                  // Animation frame
            this.player.x * tileSize,
            this.player.y * tileSize
        );
    }

    renderDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 300, 140);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`Speed Run: ${this.speedRunMode ? 'ON' : 'OFF'}`, 10, 20);
        this.ctx.fillText(`Phase: ${this.plotPhase}`, 10, 35);
        this.ctx.fillText(`State: ${this.state}`, 10, 50);
        this.ctx.fillText(`Position: (${this.player.x}, ${this.player.y})`, 10, 65);
        this.ctx.fillText(`Creatures: ${this.discoveredCreatures.size}/8`, 10, 80);

        // Shortcuts
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('F1:Speed F2:Debug T:Teleport 1-9:Phases', 10, 140);
    }

    game = new LighthouseGame();
});
