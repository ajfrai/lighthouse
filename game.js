/**
 * Lighthouse Adventure - Main Game Engine
 * Educational creature collection game with modern pixel art
 */

class LighthouseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;  // Crisp pixels

        // Player state
        this.player = {
            x: 16,  // Grid position
            y: 22,
            direction: 'down',
            moving: false,
            walkFrame: 0,
            walkTimer: 0
        };

        // Game state
        this.coins = 0;
        this.discoveredCreatures = new Set();
        this.inventory = new Set();
        this.currentDialog = null;
        this.currentJob = null;

        // Input
        this.keys = {};
        this.moveTimer = 0;
        this.moveCooldown = 150;  // ms between moves

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

        // Start game loop
        this.gameLoop();

        console.log('✓ Lighthouse Adventure started!');
    }

    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            // Space for interaction
            if (e.key === ' ') {
                e.preventDefault();
                this.interact();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Mobile controls
        const buttons = document.querySelectorAll('.dpad-btn, .action-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;
                if (key) {
                    this.keys[key] = true;
                } else if (btn.id === 'btnAction') {
                    this.interact();
                }
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;
                if (key) {
                    this.keys[key] = false;
                }
            });
        });
    }

    handleInput(deltaTime) {
        // Only move if cooldown passed
        this.moveTimer += deltaTime;
        if (this.moveTimer < this.moveCooldown) return;

        let dx = 0, dy = 0;
        let newDirection = this.player.direction;

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

        if (npc.shop) {
            this.showShop();
        } else if (npc.job) {
            this.showJob(npcId, npc);
        } else {
            this.showDialog(npc.greeting);
        }
    }

    showDialog(text) {
        const dialogBox = document.getElementById('dialogBox');
        const dialogContent = document.getElementById('dialogContent');
        dialogContent.textContent = text;
        dialogBox.classList.remove('hidden');

        document.getElementById('dialogClose').onclick = () => {
            dialogBox.classList.add('hidden');
        };
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
        // Random encounter chance
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
        spriteLoader.updateWaterAnimation(timestamp);

        // Render
        this.render();

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
                    obj.sprite,
                    0,
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
            this.player.direction,
            frame,
            this.player.x * tileSize,
            this.player.y * tileSize
        );
    }
}

// Start game when page loads
let game;
window.addEventListener('load', () => {
    game = new LighthouseGame();
});
