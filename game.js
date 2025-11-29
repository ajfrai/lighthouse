// Lighthouse - Canvas-based Game Engine

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = GameData.map.main.width * GameData.TILE_SIZE;
        this.canvas.height = GameData.map.main.height * GameData.TILE_SIZE;

        // Game state
        this.state = JSON.parse(JSON.stringify(GameData.initialState));
        this.player = {
            x: GameData.playerStart.x,
            y: GameData.playerStart.y,
            color: '#e94560' // Player color
        };

        // Input state
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveDelay = 150; // ms between moves

        // Combat state
        this.combatState = null;
        this.currentNPC = null;

        this.init();
    }

    init() {
        this.setupControls();
        this.setupMobileControls();
        this.render();
        this.gameLoop();
    }

    // ===== CONTROLS =====

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Sidebar toggle for mobile
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    }

    setupMobileControls() {
        // D-pad controls
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.handleMove(direction);
            });
        });

        // Action button (for interactions)
        document.getElementById('actionBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleAction();
        });
    }

    handleMove(direction) {
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveDelay) return;

        let newX = this.player.x;
        let newY = this.player.y;

        switch(direction) {
            case 'up':
            case 'w':
            case 'arrowup':
                newY--;
                break;
            case 'down':
            case 's':
            case 'arrowdown':
                newY++;
                break;
            case 'left':
            case 'a':
            case 'arrowleft':
                newX--;
                break;
            case 'right':
            case 'd':
            case 'arrowright':
                newX++;
                break;
            default:
                return;
        }

        // Check if new position is valid
        if (this.canMoveTo(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            this.lastMoveTime = now;

            // Check for encounters and interactions
            this.checkEncounter();
            this.updateLocationDisplay();
        }
    }

    handleAction() {
        // Check for nearby interactions
        this.checkInteraction();
    }

    canMoveTo(x, y) {
        // Check bounds
        if (x < 0 || y < 0 || x >= GameData.map.main.width || y >= GameData.map.main.height) {
            return false;
        }

        // Check tile walkability
        const tileIndex = GameData.map.main.tiles[y][x];
        const tileType = GameData.map.main.tileKey[tileIndex];
        const tile = GameData.tiles[tileType];

        return tile.walkable;
    }

    // ===== GAME LOOP =====

    gameLoop() {
        // Handle keyboard input
        const now = Date.now();
        if (now - this.lastMoveTime >= this.moveDelay) {
            if (this.keys['w'] || this.keys['arrowup']) this.handleMove('up');
            else if (this.keys['s'] || this.keys['arrowdown']) this.handleMove('down');
            else if (this.keys['a'] || this.keys['arrowleft']) this.handleMove('left');
            else if (this.keys['d'] || this.keys['arrowright']) this.handleMove('right');
            else if (this.keys[' '] || this.keys['enter']) this.handleAction();
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    // ===== RENDERING =====

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render map tiles
        this.renderMap();

        // Render NPCs
        this.renderNPCs();

        // Render player
        this.renderPlayer();

        // Update UI
        this.updateUI();
    }

    renderMap() {
        const map = GameData.map.main;
        const tileSize = GameData.TILE_SIZE;

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tileIndex = map.tiles[y][x];
                const tileType = map.tileKey[tileIndex];
                const tile = GameData.tiles[tileType];

                this.ctx.fillStyle = tile.color;
                this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

                // Add simple border for visual clarity
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }

    renderNPCs() {
        const tileSize = GameData.TILE_SIZE;

        Object.values(GameData.npcs).forEach(npc => {
            if (!npc.job.completed) {
                // Draw NPC as colored circle
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

                // Add outline (pulsing if player is nearby)
                const isNearby = this.isAdjacent(this.player.x, this.player.y, npc.x, npc.y);
                this.ctx.strokeStyle = isNearby ? '#ffff00' : '#fff';
                this.ctx.lineWidth = isNearby ? 3 : 2;
                this.ctx.stroke();

                // Show interaction hint if nearby
                if (isNearby) {
                    this.ctx.fillStyle = '#ffff00';
                    this.ctx.font = '10px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Press Space/Action', npc.x * tileSize + tileSize / 2, npc.y * tileSize - 5);
                }
            }
        });
    }

    renderPlayer() {
        const tileSize = GameData.TILE_SIZE;

        // Draw player as colored circle
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(
            this.player.x * tileSize + tileSize / 2,
            this.player.y * tileSize + tileSize / 2,
            tileSize / 3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Add outline
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // ===== INTERACTIONS =====

    checkInteraction() {
        // Check for NPC interactions
        Object.entries(GameData.npcs).forEach(([id, npc]) => {
            if (this.isAdjacent(this.player.x, this.player.y, npc.x, npc.y)) {
                this.talkToNPC(id);
            }
        });

        // Check for shop (door at 10, 7 or nearby shop area)
        if (this.isAdjacent(this.player.x, this.player.y, 10, 7) ||
            this.isAdjacent(this.player.x, this.player.y, 10, 9)) {
            this.openShop();
        }
    }

    isAdjacent(x1, y1, x2, y2) {
        // Allow interaction within 2 tiles distance
        return Math.abs(x1 - x2) <= 2 && Math.abs(y1 - y2) <= 2;
    }

    checkEncounter() {
        // Check if player is in encounter zone
        GameData.encounterZones.forEach(zone => {
            if (this.player.x >= zone.x && this.player.x < zone.x + zone.width &&
                this.player.y >= zone.y && this.player.y < zone.y + zone.height) {

                // Random encounter check
                if (Math.random() < zone.chance) {
                    const encounterId = `${zone.x},${zone.y}`;
                    if (!this.state.defeatedEncounters.includes(encounterId)) {
                        this.state.defeatedEncounters.push(encounterId);
                        this.startCombat(zone.creature);
                    }
                }
            }
        });
    }

    updateLocationDisplay() {
        // Simple location detection
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

    // ===== COMBAT SYSTEM =====

    startCombat(creatureType) {
        const wildCreature = JSON.parse(JSON.stringify(GameData.creatures[creatureType]));
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
                    this.player.x = GameData.playerStart.x;
                    this.player.y = GameData.playerStart.y;
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

    // ===== NPC SYSTEM =====

    talkToNPC(npcId) {
        this.currentNPC = npcId;
        this.showModal('npcModal');
        this.renderNPC();
    }

    renderNPC() {
        const npc = GameData.npcs[this.currentNPC];

        document.getElementById('npc-name').textContent = npc.name;
        document.getElementById('npc-dialog').innerHTML = `<p>${npc.dialog}</p>`;

        const actionsDiv = document.getElementById('npc-actions');
        actionsDiv.innerHTML = '';

        if (npc.job && !npc.job.completed) {
            const jobId = npc.job.id;
            const job = GameData.jobs[jobId];

            if (!this.state.activeJobs.includes(jobId) && !this.state.completedJobs.includes(jobId)) {
                const acceptBtn = document.createElement('button');
                acceptBtn.textContent = 'Accept Job';
                acceptBtn.onclick = () => this.offerJob(jobId);
                actionsDiv.appendChild(acceptBtn);
            }

            if (this.state.activeJobs.includes(jobId)) {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'job-question';
                questionDiv.innerHTML = `
                    <p><strong>${job.name}</strong></p>
                    <p>${job.question}</p>
                    <div class="answer-input">
                        <input type="number" id="job-answer" placeholder="Your answer">
                        <button onclick="game.submitJobAnswer('${jobId}', document.getElementById('job-answer').value)">Submit</button>
                    </div>
                `;
                document.getElementById('npc-dialog').appendChild(questionDiv);
            }
        }

        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = 'Leave';
        leaveBtn.onclick = () => this.hideModal('npcModal');
        actionsDiv.appendChild(leaveBtn);
    }

    offerJob(jobId) {
        if (!this.state.activeJobs.includes(jobId)) {
            this.state.activeJobs.push(jobId);
        }
        this.renderNPC();
    }

    submitJobAnswer(jobId, answer) {
        const job = GameData.jobs[jobId];
        const npc = GameData.npcs[this.currentNPC];
        const answerNum = parseInt(answer);

        if (answerNum === job.correctAnswer) {
            this.state.coins += job.reward;
            this.state.completedJobs.push(jobId);
            this.state.activeJobs = this.state.activeJobs.filter(j => j !== jobId);
            npc.job.completed = true;

            document.getElementById('npc-dialog').innerHTML = `
                <p>${job.correctAnswerDialog}</p>
                <p style="color: #ffd700; font-weight: bold;">+${job.reward} coins!</p>
            `;
        } else {
            document.getElementById('npc-dialog').innerHTML = `<p>${job.wrongAnswerDialog}</p>`;
        }

        const existingQuestion = document.querySelector('.job-question');
        if (existingQuestion) existingQuestion.remove();

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

        Object.entries(GameData.shopItems).forEach(([itemId, item]) => {
            const alreadyOwned = this.state.inventory.includes(itemId);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <div class="shop-item-info">
                    <h4>${item.name}</h4>
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
        const item = GameData.shopItems[itemId];

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
                const item = GameData.shopItems[itemId];
                return `<div class="creature">${item.name}</div>`;
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
    }
}

// Initialize game
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
