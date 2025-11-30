// Lighthouse - Enhanced Game Engine with Character Selection

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dataLoader = gameDataLoader;
        this.jobGenerator = null;

        // Game state
        this.state = null;
        this.player = null;
        this.tiles = null;
        this.map = null;
        this.creatures = null;
        this.npcs = null;
        this.shop = null;

        // Input state with improved handling
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveDelay = 120; // Faster, more responsive
        this.inputQueue = [];

        // Combat state
        this.combatState = null;
        this.currentNPC = null;
        this.currentJob = null;
    }

    async init() {
        // Load all game data
        const loaded = await this.dataLoader.loadAll();
        if (!loaded) {
            alert('Failed to load game data. Please refresh the page.');
            return;
        }

        // Preload all SVG assets
        await svgLoader.preloadAll();

        // Initialize job generator
        this.jobGenerator = new JobGenerator(this.dataLoader.data.jobs);

        // Load static data
        this.tiles = this.dataLoader.getTiles();
        this.map = this.dataLoader.getMap();
        this.creatures = this.dataLoader.data.creatures;
        this.npcs = this.dataLoader.data.npcs;
        this.shop = this.dataLoader.data.shop;

        // Show character selection
        this.showCharacterSelection();
    }

    showCharacterSelection() {
        const grid = document.getElementById('characterGrid');
        grid.innerHTML = '';

        this.dataLoader.data.characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.innerHTML = `
                <div class="emoji">${char.emoji}</div>
                <h3>${char.name}</h3>
                <p>${char.description}</p>
            `;
            card.onclick = () => this.selectCharacter(char);
            grid.appendChild(card);
        });

        document.getElementById('characterSelect').classList.remove('hidden');
    }

    selectCharacter(character) {
        // Initialize game state
        this.state = this.dataLoader.getInitialState();
        this.state.character = character;
        this.state.gamePhase = 'start'; // Track story progression for Keeper dialogue

        // Set up player
        const startPos = this.dataLoader.getPlayerStart();
        this.player = {
            x: startPos.x,
            y: startPos.y,
            character: character
        };

        // Set canvas size
        this.canvas.width = this.map.main.width * this.dataLoader.TILE_SIZE;
        this.canvas.height = this.map.main.height * this.dataLoader.TILE_SIZE;

        // Hide character selection
        document.getElementById('characterSelect').classList.add('hidden');

        // Start game
        this.setupControls();
        this.setupMobileControls();
        this.render();
        this.gameLoop();
    }

    // ===== IMPROVED CONTROLS =====

    setupControls() {
        // Keyboard controls with better handling
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(key)) {
                e.preventDefault();
                this.keys[key] = true;

                // Add to input queue for immediate response
                if (!this.inputQueue.includes(key)) {
                    this.inputQueue.push(key);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            this.inputQueue = this.inputQueue.filter(k => k !== key);
        });

        // Sidebar toggle
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('collapsed');
            });
        }
    }

    setupMobileControls() {
        // D-pad with better touch handling
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            ['touchstart', 'mousedown'].forEach(event => {
                btn.addEventListener(event, (e) => {
                    e.preventDefault();
                    const direction = btn.dataset.direction;
                    this.handleMove(direction);

                    // Allow continuous movement on hold
                    btn.dataset.holding = 'true';
                    setTimeout(() => {
                        if (btn.dataset.holding === 'true') {
                            this.continuousMove(btn, direction);
                        }
                    }, 300);
                });
            });

            ['touchend', 'mouseup', 'mouseleave'].forEach(event => {
                btn.addEventListener(event, (e) => {
                    e.preventDefault();
                    btn.dataset.holding = 'false';
                });
            });
        });

        // Action button
        const actionBtn = document.getElementById('actionBtn');
        if (actionBtn) {
            ['touchstart', 'mousedown'].forEach(event => {
                actionBtn.addEventListener(event, (e) => {
                    e.preventDefault();
                    this.handleAction();
                });
            });
        }
    }

    continuousMove(btn, direction) {
        if (btn.dataset.holding === 'true') {
            this.handleMove(direction);
            setTimeout(() => this.continuousMove(btn, direction), this.moveDelay);
        }
    }

    handleMove(direction) {
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveDelay) return;

        let newX = this.player.x;
        let newY = this.player.y;

        switch(direction) {
            case 'up': case 'w': case 'arrowup':
                newY--;
                break;
            case 'down': case 's': case 'arrowdown':
                newY++;
                break;
            case 'left': case 'a': case 'arrowleft':
                newX--;
                break;
            case 'right': case 'd': case 'arrowright':
                newX++;
                break;
            default:
                return;
        }

        if (this.canMoveTo(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            this.lastMoveTime = now;
            this.checkEncounter();
            this.updateLocationDisplay();
        }
    }

    handleAction() {
        this.checkInteraction();
    }

    canMoveTo(x, y) {
        if (x < 0 || y < 0 || x >= this.map.main.width || y >= this.map.main.height) {
            return false;
        }

        const tileIndex = this.map.main.tiles[y][x];
        const tileType = this.map.main.tileKey[tileIndex];
        const tile = this.tiles[tileType];

        return tile.walkable;
    }

    // ===== GAME LOOP =====

    gameLoop(timestamp = 0) {
        // Update animations
        svgLoader.updateAnimation(timestamp);

        // Process input queue
        const now = Date.now();
        if (now - this.lastMoveTime >= this.moveDelay && this.inputQueue.length > 0) {
            const input = this.inputQueue[0];

            if (['w', 'arrowup'].includes(input)) this.handleMove('up');
            else if (['s', 'arrowdown'].includes(input)) this.handleMove('down');
            else if (['a', 'arrowleft'].includes(input)) this.handleMove('left');
            else if (['d', 'arrowright'].includes(input)) this.handleMove('right');
            else if ([' ', 'enter'].includes(input)) {
                this.handleAction();
                this.inputQueue.shift(); // Remove action from queue
            }
        }

        this.render();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    // ===== RENDERING =====

    render() {
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderMap();
        this.renderLighthouse(); // Large lighthouse structure
        this.renderNPCs();
        this.renderPlayer();
        this.updateUI();
    }

    renderMap() {
        const map = this.map.main;
        const tileSize = this.dataLoader.TILE_SIZE;

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tileIndex = map.tiles[y][x];
                const tileType = map.tileKey[tileIndex];

                // Skip lighthouse tiles - they're rendered separately as one large structure
                if (tileType === 'lighthouse') {
                    continue;
                }

                // Get the correct tile variant or animated frame
                let tileSVG;
                if (tileType === 'water') {
                    // Water is animated
                    tileSVG = svgLoader.getWaterFrame();
                } else {
                    // Get tile variant based on position (or single tile if not an array)
                    const baseTile = SVGAssets.tiles[tileType];
                    tileSVG = svgLoader.getTileVariant(baseTile, x, y);
                }

                if (tileSVG) {
                    const img = svgLoader.cache.get(`${tileSVG}-${tileSize}-${tileSize}`);
                    if (img) {
                        this.ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                }
            }
        }
    }

    renderLighthouse() {
        // Render the large lighthouse structure at fixed position (2x4 tiles)
        const tileSize = this.dataLoader.TILE_SIZE;
        const lighthouseSVG = SVGAssets.structures.lighthouse;
        const img = svgLoader.cache.get(`${lighthouseSVG}-64-128`);

        if (img) {
            // Position: x=2, y=1 (top-left corner of lighthouse in tile coordinates)
            this.ctx.drawImage(img, 2 * tileSize, 1 * tileSize, 64, 128);
        }
    }

    renderNPCs() {
        const tileSize = this.dataLoader.TILE_SIZE;

        Object.entries(this.npcs).forEach(([npcId, npc]) => {
            // Get SVG for this NPC type
            const npcSVG = SVGAssets.npcs[npcId] || SVGAssets.npcs.fisherman;
            const img = svgLoader.cache.get(`${npcSVG}-${tileSize}-${tileSize}`);

            if (img) {
                this.ctx.drawImage(img, npc.x * tileSize, npc.y * tileSize, tileSize, tileSize);
            } else {
                // Fallback to colored circle
                this.ctx.fillStyle = npc.color;
                this.ctx.beginPath();
                this.ctx.arc(
                    npc.x * tileSize + tileSize / 2,
                    npc.y * tileSize + tileSize / 2,
                    tileSize / 3,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }

            // Show interaction hint if nearby
            const isNearby = this.isAdjacent(this.player.x, this.player.y, npc.x, npc.y);
            if (isNearby) {
                // Yellow glow effect
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(
                    npc.x * tileSize + tileSize / 2,
                    npc.y * tileSize + tileSize / 2,
                    tileSize / 2 + 2,
                    0,
                    Math.PI * 2
                );
                this.ctx.stroke();

                // Text hint removed - use HTML overlay instead
            }
        });
    }

    renderPlayer() {
        const tileSize = this.dataLoader.TILE_SIZE;
        const char = this.player.character;

        // Get SVG for player character
        const playerSVG = SVGAssets.player[char.id];
        const img = svgLoader.cache.get(`${playerSVG}-${tileSize}-${tileSize}`);

        if (img) {
            this.ctx.drawImage(img, this.player.x * tileSize, this.player.y * tileSize, tileSize, tileSize);
        }
    }

    // ===== INTERACTIONS =====

    checkInteraction() {
        Object.entries(this.npcs).forEach(([id, npc]) => {
            if (this.isAdjacent(this.player.x, this.player.y, npc.x, npc.y)) {
                this.talkToNPC(id);
            }
        });

        if (this.isAdjacent(this.player.x, this.player.y, 10, 7) ||
            this.isAdjacent(this.player.x, this.player.y, 10, 9)) {
            this.openShop();
        }
    }

    isAdjacent(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) <= 2 && Math.abs(y1 - y2) <= 2;
    }

    checkEncounter() {
        this.dataLoader.getEncounterZones().forEach(zone => {
            if (this.player.x >= zone.x && this.player.x < zone.x + zone.width &&
                this.player.y >= zone.y && this.player.y < zone.y + zone.height) {

                if (Math.random() < zone.chance) {
                    const encounterId = `${zone.x},${zone.y},${Date.now()}`;
                    if (!this.state.defeatedEncounters.includes(encounterId)) {
                        this.state.defeatedEncounters.push(encounterId);
                        this.startCombat(zone.creature);
                    }
                }
            }
        });
    }

    updateLocationDisplay() {
        let location = "Exploring";

        if (this.player.x >= 2 && this.player.x <= 5 && this.player.y >= 2 && this.player.y <= 4) {
            location = "The Lighthouse";
        } else if (this.player.x >= 15 && this.player.x <= 18 && this.player.y >= 2 && this.player.y <= 4) {
            location = "Fisherman's Dock";
        } else if (this.player.x >= 9 && this.player.x <= 11 && this.player.y >= 8 && this.player.y <= 10) {
            location = "Village Shop";
        } else if (this.player.x >= 9 && this.player.x <= 11 && this.player.y >= 2 && this.player.y <= 4) {
            location = "Tall Grass (Watch out!)";
        }

        document.getElementById('location-name').textContent = location;
    }

    // ===== COMBAT SYSTEM (unchanged) =====

    startCombat(creatureType) {
        const wildCreature = JSON.parse(JSON.stringify(this.creatures[creatureType]));
        wildCreature.stats.maxHeart = wildCreature.stats.heart;

        this.combatState = {
            wildCreature: wildCreature,
            playerCreature: this.state.creatures[0],
            log: [],
            canCatch: false
        };

        this.addCombatLog(`A wild ${wildCreature.name} appeared!`);
        this.showModal('combatModal');
        this.renderCombat();
    }

    addCombatLog(message) {
        this.combatState.log.push(message);
    }

    executeCombatTurn(action) {
        const { wildCreature, playerCreature } = this.combatState;

        if (action === 'run') {
            this.addCombatLog("You fled from battle!");
            setTimeout(() => this.hideModal('combatModal'), 1000);
            return;
        }

        if (action === 'catch') {
            this.state.creatures.push({
                name: wildCreature.name,
                stats: {
                    heart: wildCreature.stats.maxHeart,
                    maxHeart: wildCreature.stats.maxHeart,
                    power: wildCreature.stats.power,
                    guard: wildCreature.stats.guard,
                    speed: wildCreature.stats.speed
                }
            });
            this.addCombatLog(`You caught the ${wildCreature.name}!`);

            // Update game phase when catching first creature (after starter)
            if (this.state.creatures.length === 2 && this.state.gamePhase === 'searching') {
                this.state.gamePhase = 'metCreature';
            }

            setTimeout(() => this.hideModal('combatModal'), 1500);
            this.renderCombat();
            return;
        }

        if (action === 'attack') {
            const playerFirst = playerCreature.stats.speed >= wildCreature.stats.speed;

            if (playerFirst) {
                this.performAttack(playerCreature, wildCreature, true);
                if (wildCreature.stats.heart > 0) {
                    this.performAttack(wildCreature, playerCreature, false);
                }
            } else {
                this.performAttack(wildCreature, playerCreature, false);
                if (playerCreature.stats.heart > 0) {
                    this.performAttack(playerCreature, wildCreature, true);
                }
            }

            if (wildCreature.stats.heart > 0 && wildCreature.stats.heart < wildCreature.stats.maxHeart * 0.3) {
                this.combatState.canCatch = true;
                this.addCombatLog(`The ${wildCreature.name} looks weak enough to catch!`);
            }

            if (wildCreature.stats.heart <= 0) {
                this.addCombatLog(`The wild ${wildCreature.name} fainted!`);
                setTimeout(() => this.hideModal('combatModal'), 1500);
            } else if (playerCreature.stats.heart <= 0) {
                this.addCombatLog("Your creature fainted! Returning to lighthouse...");
                setTimeout(() => {
                    playerCreature.stats.heart = playerCreature.stats.maxHeart;
                    const startPos = this.dataLoader.getPlayerStart();
                    this.player.x = startPos.x;
                    this.player.y = startPos.y;
                    this.hideModal('combatModal');
                }, 2000);
            }

            this.renderCombat();
        }
    }

    performAttack(attacker, defender, isPlayer) {
        const damage = Math.max(1, attacker.stats.power - defender.stats.guard);
        defender.stats.heart = Math.max(0, defender.stats.heart - damage);

        const attackerName = isPlayer ? attacker.name : `Wild ${attacker.name}`;
        const defenderName = isPlayer ? `Wild ${defender.name}` : defender.name;

        this.addCombatLog(`${attackerName} attacks ${defenderName} for ${damage} damage!`);
    }

    renderCombat() {
        const { wildCreature, playerCreature, log, canCatch } = this.combatState;

        document.getElementById('wild-creature-name').textContent = wildCreature.name;
        document.getElementById('wild-creature-stats').innerHTML = `
            ❤️ ${wildCreature.stats.heart}/${wildCreature.stats.maxHeart} |
            ⚔️ ${wildCreature.stats.power} |
            🛡️ ${wildCreature.stats.guard} |
            ⚡ ${wildCreature.stats.speed}
        `;

        document.getElementById('player-creature-stats').innerHTML = `
            <strong>${playerCreature.name}</strong><br>
            ❤️ ${playerCreature.stats.heart}/${playerCreature.stats.maxHeart} |
            ⚔️ ${playerCreature.stats.power} |
            🛡️ ${playerCreature.stats.guard} |
            ⚡ ${playerCreature.stats.speed}
        `;

        document.getElementById('combat-log').innerHTML = log.map(msg => `<p>${msg}</p>`).join('');
        document.getElementById('combat-log').scrollTop = document.getElementById('combat-log').scrollHeight;

        const actionsDiv = document.getElementById('combat-actions');
        actionsDiv.innerHTML = '';

        if (wildCreature.stats.heart > 0 && playerCreature.stats.heart > 0) {
            const attackBtn = document.createElement('button');
            attackBtn.textContent = 'Attack';
            attackBtn.onclick = () => this.executeCombatTurn('attack');
            actionsDiv.appendChild(attackBtn);

            if (canCatch) {
                const catchBtn = document.createElement('button');
                catchBtn.textContent = 'Catch';
                catchBtn.onclick = () => this.executeCombatTurn('catch');
                actionsDiv.appendChild(catchBtn);
            }

            const runBtn = document.createElement('button');
            runBtn.textContent = 'Run';
            runBtn.onclick = () => this.executeCombatTurn('run');
            actionsDiv.appendChild(runBtn);
        }
    }

    // ===== NPC & JOB SYSTEM (with generator) =====

    talkToNPC(npcId) {
        this.currentNPC = npcId;
        const npc = this.npcs[npcId];

        // Handle Keeper's dialogue system (story-based)
        if (npcId === 'keeper' && npc.dialogues) {
            this.currentJob = null; // Keeper doesn't give jobs
        } else if (npc.jobType) {
            // Generate a new job for NPCs that give work
            this.currentJob = this.jobGenerator.generateJob(npc.jobType);
        } else {
            this.currentJob = null;
        }

        this.showModal('npcModal');
        this.renderNPC();
    }

    renderNPC() {
        const npc = this.npcs[this.currentNPC];

        document.getElementById('npc-name').textContent = npc.name;

        // Handle Keeper's dialogue system
        if (this.currentNPC === 'keeper' && npc.dialogues) {
            const currentPhase = this.state.gamePhase || 'start';
            const dialogue = npc.dialogues[currentPhase] || npc.dialogues.start;

            document.getElementById('npc-dialog').innerHTML = `<p>${dialogue.text}</p>`;

            const actionsDiv = document.getElementById('npc-actions');
            actionsDiv.innerHTML = '';

            // Update game phase if needed
            if (dialogue.nextPhase && dialogue.nextPhase !== this.state.gamePhase) {
                const continueBtn = document.createElement('button');
                continueBtn.textContent = 'Continue';
                continueBtn.onclick = () => {
                    if (this.state.gamePhase === 'start') {
                        this.state.gamePhase = dialogue.nextPhase;
                    }
                    this.hideModal('npcModal');
                };
                actionsDiv.appendChild(continueBtn);
            }

            const leaveBtn = document.createElement('button');
            leaveBtn.textContent = 'Leave';
            leaveBtn.onclick = () => this.hideModal('npcModal');
            actionsDiv.appendChild(leaveBtn);

        } else {
            // Handle regular NPCs with jobs
            document.getElementById('npc-dialog').innerHTML = `<p>${npc.dialog}</p>`;

            const actionsDiv = document.getElementById('npc-actions');
            actionsDiv.innerHTML = '';

            if (this.currentJob) {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'job-question';
                questionDiv.innerHTML = `
                    <p><strong>${this.currentJob.name}</strong></p>
                    <p>${this.currentJob.question}</p>
                    <div class="answer-input">
                        <input type="number" id="job-answer" placeholder="Your answer" autofocus>
                        <button onclick="game.submitJobAnswer()">Submit</button>
                    </div>
                `;
                document.getElementById('npc-dialog').appendChild(questionDiv);
            }

            const leaveBtn = document.createElement('button');
            leaveBtn.textContent = 'Leave';
            leaveBtn.onclick = () => this.hideModal('npcModal');
            actionsDiv.appendChild(leaveBtn);
        }
    }

    submitJobAnswer() {
        const answerInput = document.getElementById('job-answer');
        const answer = parseInt(answerInput.value);

        if (answer === this.currentJob.correctAnswer) {
            this.state.coins += this.currentJob.reward;

            // Advance to 'working' phase after first successful job
            if (this.state.gamePhase === 'metCreature' && !this.state.completedFirstJob) {
                this.state.gamePhase = 'working';
                this.state.completedFirstJob = true;
            }

            document.getElementById('npc-dialog').innerHTML = `
                <p>${this.currentJob.correctAnswerDialog}</p>
                <p style="color: #ffd700; font-weight: bold;">+${this.currentJob.reward} coins!</p>
                <p style="color: #aaa; margin-top: 10px;">Talk to me again for more work!</p>
            `;
        } else {
            document.getElementById('npc-dialog').innerHTML = `
                <p>${this.currentJob.wrongAnswerDialog}</p>
                <p style="color: #ff6b6b;">The answer was: ${this.currentJob.correctAnswer}</p>
            `;
        }

        this.updateUI();
    }

    // ===== SHOP SYSTEM =====

    openShop() {
        this.showModal('shopModal');
        this.renderShop();
    }

    renderShop() {
        const itemsDiv = document.getElementById('shop-items');
        itemsDiv.innerHTML = '';

        Object.entries(this.shop).forEach(([itemId, item]) => {
            const alreadyOwned = this.state.inventory.includes(itemId);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <h4>${item.emoji || ''} ${item.name}</h4>
                    <p>${item.description}</p>
                    <p class="shop-item-price">💰 ${item.price} coins</p>
                </div>
                <button
                    onclick="game.buyItem('${itemId}')"
                    ${alreadyOwned || this.state.coins < item.price ? 'disabled' : ''}>
                    ${alreadyOwned ? 'Owned' : this.state.coins < item.price ? 'Not enough' : 'Buy'}
                </button>
            `;
            itemsDiv.appendChild(itemDiv);
        });

        const actionsDiv = document.getElementById('shop-actions');
        actionsDiv.innerHTML = '';

        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = 'Leave Shop';
        leaveBtn.onclick = () => this.hideModal('shopModal');
        actionsDiv.appendChild(leaveBtn);
    }

    buyItem(itemId) {
        const item = this.shop[itemId];

        if (this.state.coins >= item.price) {
            this.state.coins -= item.price;
            this.state.inventory.push(itemId);
            this.renderShop();
            this.updateUI();
        }
    }

    // ===== UI UPDATES =====

    updateUI() {
        document.getElementById('coin-count').textContent = this.state.coins;

        const itemsList = document.getElementById('items-list');
        if (this.state.inventory.length === 0) {
            itemsList.innerHTML = '<p class="empty-state">No items</p>';
        } else {
            itemsList.innerHTML = this.state.inventory.map(itemId => {
                const item = this.shop[itemId];
                return `<div class="creature">${item.emoji || ''} ${item.name}</div>`;
            }).join('');
        }

        const creaturesList = document.getElementById('creatures-list');
        if (this.state.creatures.length === 0) {
            creaturesList.innerHTML = '<p class="empty-state">No creatures</p>';
        } else {
            creaturesList.innerHTML = this.state.creatures.map(creature => `
                <div class="creature">
                    <h4>${creature.name}</h4>
                    ❤️${creature.stats.heart}/${creature.stats.maxHeart}
                    ⚔️${creature.stats.power}
                    🛡️${creature.stats.guard}
                    ⚡${creature.stats.speed}
                </div>
            `).join('');
        }
    }

    // ===== MODAL HELPERS =====

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        this.combatState = null;
        this.currentNPC = null;
        this.currentJob = null;
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', async () => {
    game = new Game();
    await game.init();
});
