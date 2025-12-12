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

                // Check quest objectives
                this.checkQuestObjectives();
            }
        } else {
            this.player.moving = false;
        }
    }

    checkQuestObjectives() {
        if (!this.activeQuest) return;

        const quest = this.activeQuest.quest;
        if (quest.type !== 'multi_step') return;

        const step = quest.steps[this.activeQuest.currentStep];
        if (!step || step.type !== 'visit_location') return;

        // Check if player is within radius of objective
        const dx = this.player.x - step.location.x;
        const dy = this.player.y - step.location.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= step.radius) {
            // Player reached objective!
            this.activeQuest.currentStep++;
            this.questObjective = null;

            // Show arrival message with callback to advance after dialog closes
            this.startDialogue([step.onArrive.message], [
                {
                    text: "Continue Quest",
                    action: () => this.advanceQuestStep()
                },
                {
                    text: "Abandon Quest",
                    action: () => {
                        this.activeQuest = null;
                        this.questObjective = null;
                        this.showDialog("Quest abandoned.");
                    }
                }
            ]);
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
                this.showNPCDialog(obj.id);
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

    showNPCDialog(npcId) {
        const npc = NPCS[npcId];
        if (!npc) return;

        // Framework-based dialogue system
        if (npc.type === 'dialogue_npc' && npc.dialogues) {
            // Find the first matching dialogue based on conditions
            const dialogue = npc.dialogues.find(d => d.condition(this));

            if (dialogue) {
                // Convert framework choices to game choices
                const choices = dialogue.choices ? dialogue.choices.map(choice => ({
                    text: choice.text,
                    action: () => choice.action(this)
                })) : null;

                this.startDialogue([dialogue.text], choices);
            } else {
                // Fallback if no dialogue matches
                this.showDialog("...");
            }
            return;
        }

        // Quest system for quest NPCs
        if (npc.type === 'quest_npc') {
            this.showQuestMenu(npcId, npc);
            return;
        }

        // Legacy system for other NPCs
        if (npc.shop) {
            this.openShop();
        } else if (npc.job) {
            this.showJob(npcId, npc);
        } else {
            this.showDialog(npc.greeting);
        }
    }

    showQuestMenu(npcId, npc) {
        this.state = GameState.JOB;  // Reuse JOB state for quest menu
        const jobUI = document.getElementById('jobUI');
        const jobTitle = document.getElementById('jobTitle');
        const jobQuestion = document.getElementById('jobQuestion');
        const jobAnswers = document.getElementById('jobAnswers');

        jobTitle.textContent = npc.name;
        jobQuestion.textContent = npc.greeting;
        jobAnswers.innerHTML = '';

        // Count completed one-off quests
        let completedOneOffs = 0;
        npc.quests.oneOff.forEach(questId => {
            if (this.completedQuests.has(questId)) {
                completedOneOffs++;
            }
        });

        // Check if full quest is completed
        const fullQuestCompleted = this.completedQuests.has(npc.quests.full);

        // One-off problem button
        const oneOffBtn = document.createElement('button');
        oneOffBtn.className = 'quest-menu-btn';
        if (completedOneOffs >= npc.quests.oneOff.length) {
            oneOffBtn.textContent = `Quick Problem (${completedOneOffs}/${npc.quests.oneOff.length} completed)`;
            oneOffBtn.disabled = true;
        } else {
            const nextQuestId = npc.quests.oneOff.find(qId => !this.completedQuests.has(qId));
            const nextQuest = QUESTS[nextQuestId];
            oneOffBtn.textContent = `Quick Problem (${nextQuest.reward} coins) - ${completedOneOffs}/${npc.quests.oneOff.length} done`;
            oneOffBtn.onclick = () => this.startQuest(nextQuestId);
        }
        jobAnswers.appendChild(oneOffBtn);

        // Full quest button
        const fullQuest = QUESTS[npc.quests.full];
        const fullQuestBtn = document.createElement('button');
        fullQuestBtn.className = 'quest-menu-btn';
        if (fullQuestCompleted) {
            fullQuestBtn.textContent = `${fullQuest.name} (Completed)`;
            fullQuestBtn.disabled = true;
        } else {
            fullQuestBtn.textContent = `${fullQuest.name} (${fullQuest.reward} coins)`;
            fullQuestBtn.onclick = () => this.startQuest(npc.quests.full);
        }
        jobAnswers.appendChild(fullQuestBtn);

        // Add cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'job-cancel';
        cancelBtn.onclick = () => {
            jobUI.classList.add('hidden');
            this.state = GameState.EXPLORING;
        };
        jobAnswers.appendChild(cancelBtn);

        jobUI.classList.remove('hidden');
    }

    startQuest(questId) {
        const quest = QUESTS[questId];
        if (!quest) {
            console.error(`Quest not found: ${questId}`);
            return;
        }

        // Set up active quest
        this.activeQuest = {
            questId: questId,
            quest: quest,
            currentStep: 0
        };

        document.getElementById('jobUI').classList.add('hidden');

        // Handle different quest types
        if (quest.type === 'one_off') {
            // Simple one-problem quest
            this.showQuestProblem(quest.problem, quest.name);
        } else if (quest.type === 'multi_step') {
            // Start multi-step quest
            this.advanceQuestStep();
        }
    }

    advanceQuestStep() {
        const quest = this.activeQuest.quest;
        const step = quest.steps[this.activeQuest.currentStep];

        if (!step) {
            // Quest complete!
            this.completeQuest();
            return;
        }

        if (step.type === 'visit_location') {
            // Set up location objective
            this.questObjective = step.description;
            this.showDialog(step.description);
            this.state = GameState.EXPLORING;
        } else if (step.type === 'problem') {
            // Show problem
            const stepNum = this.activeQuest.currentStep + 1;
            const totalSteps = quest.steps.length;
            this.showQuestProblem(step, quest.name, stepNum, totalSteps);
        }
    }

    showQuestProblem(problem, npcName, problemNum = null, totalProblems = null) {
        const jobUI = document.getElementById('jobUI');
        const jobTitle = document.getElementById('jobTitle');
        const jobQuestion = document.getElementById('jobQuestion');
        const jobAnswers = document.getElementById('jobAnswers');

        // Show problem number for multi-problem quests
        const titleText = problemNum ? `${npcName} - Problem ${problemNum}/${totalProblems}` : npcName;
        jobTitle.textContent = titleText;
        jobQuestion.textContent = problem.question;
        jobAnswers.innerHTML = '';

        problem.answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.textContent = answer;
            btn.onclick = () => this.submitQuestAnswer(answer);
            jobAnswers.appendChild(btn);
        });

        // Add cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'job-cancel';
        cancelBtn.onclick = () => {
            jobUI.classList.add('hidden');
            this.state = GameState.EXPLORING;
            this.activeQuest = null;
        };
        jobAnswers.appendChild(cancelBtn);

        jobUI.classList.remove('hidden');
    }

    submitQuestAnswer(answer) {
        if (!this.activeQuest) return;

        const quest = this.activeQuest.quest;
        let problem;

        // Get the current problem based on quest type
        if (quest.type === 'one_off') {
            problem = quest.problem;
        } else if (quest.type === 'multi_step') {
            const step = quest.steps[this.activeQuest.currentStep];
            if (step.type !== 'problem') return;
            problem = step;
        }

        if (answer !== problem.correct) {
            // Wrong answer
            this.showDialog(`Not quite right. Try again next time!`);
            document.getElementById('jobUI').classList.add('hidden');
            this.state = GameState.EXPLORING;
            this.questObjective = null;
            this.activeQuest = null;
            return;
        }

        // Correct answer - advance to next step
        this.activeQuest.currentStep++;
        document.getElementById('jobUI').classList.add('hidden');

        // Continue quest or complete it
        if (quest.type === 'one_off') {
            this.completeQuest();
        } else if (quest.type === 'multi_step') {
            if (this.activeQuest.currentStep >= quest.steps.length) {
                this.completeQuest();
            } else {
                this.advanceQuestStep();
            }
        }
    }

    completeQuest() {
        const quest = this.activeQuest.quest;

        // Award coins
        this.coins += quest.reward;
        this.updateUI();

        // Mark as completed
        this.completedQuests.add(this.activeQuest.questId);

        // Show success message
        this.showDialog(`Excellent work! You earned ${quest.reward} coins!`);

        // Clear quest
        document.getElementById('jobUI').classList.add('hidden');
        this.state = GameState.EXPLORING;
        this.questObjective = null;
        this.activeQuest = null;
    }

    // Simple dialogue helper
    showDialog(message) {
        this.startDialogue([message]);
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
            // Check if player is in tall grass (where Lumina appears)
            const terrain = this.getTerrainAt(this.player.x, this.player.y);
            if (terrain === 'tallgrass') {
                // Random chance to trigger first encounter in tall grass
                if (Math.random() < 0.15) {  // 15% chance per step
                    this.firstEncounterTriggered = true;
                    this.startFirstCreatureEncounter();
                    return;
                }
            }
        }

        // Habitat-based random encounters (for all creatures)
        this.checkRandomEncounter();
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
        this.renderQuestMarkers();
        this.renderPlayer();
        this.renderQuestObjective();
    }

    renderQuestMarkers() {
        if (!this.activeQuest) return;

        const quest = this.activeQuest.quest;
        if (quest.type !== 'multi_step') return;

        const step = quest.steps[this.activeQuest.currentStep];
        if (!step || step.type !== 'visit_location') return;

        const tileSize = this.map.tileSize;
        const x = step.location.x * tileSize + tileSize / 2;
        const y = step.location.y * tileSize + tileSize / 2;

        // Draw pulsing marker
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.2 + 0.8;

        this.ctx.save();
        this.ctx.globalAlpha = pulse;
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(step.markerText, x, y);
        this.ctx.restore();

        // Draw radius circle
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, step.radius * tileSize, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderQuestObjective() {
        if (!this.questObjective) return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 50, this.canvas.width - 20, 40);

        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Quest: ${this.questObjective}`, this.canvas.width / 2, this.canvas.height - 25);
        this.ctx.restore();
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
            } else if (obj.type === 'store') {
                spriteLoader.drawStore(
                    this.ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'boat') {
                spriteLoader.drawBoat(
                    this.ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'rock') {
                spriteLoader.drawRock(
                    this.ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'tallgrass') {
                spriteLoader.drawTallGrass(
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
}

// Start game when page loads
let game;
window.addEventListener('load', () => {
    game = new LighthouseGame();
});
