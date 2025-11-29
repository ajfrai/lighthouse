// Main Game Logic
// Lighthouse Educational Creature Game

class Game {
    constructor() {
        // Initialize game state from data
        this.state = JSON.parse(JSON.stringify(GameData.initialPlayerState));
        this.currentView = 'location'; // location, combat, npc, shop
        this.combatState = null;
        this.currentNPC = null;
        this.encounterTriggered = {}; // Track which locations have triggered encounters

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Keyboard controls for movement
        document.addEventListener('keydown', (e) => {
            if (this.currentView !== 'location') return;

            const key = e.key.toLowerCase();
            // For now, we'll use keyboard to navigate between locations
            // In a more advanced version, this would move the player within a location

            // Show available connections as shortcuts
            const connections = GameData.locations[this.state.location].connections;
            if (key === 'escape' || key === 'esc') {
                this.render();
            }
        });
    }

    // ===== NAVIGATION SYSTEM =====

    travelTo(locationId) {
        this.state.location = locationId;

        // Track visited locations
        if (!this.state.visitedLocations.includes(locationId)) {
            this.state.visitedLocations.push(locationId);
        }

        // Check for random encounter
        const location = GameData.locations[locationId];
        if (location.encounterChance > 0 &&
            !this.encounterTriggered[locationId] &&
            Math.random() < location.encounterChance) {

            this.encounterTriggered[locationId] = true;
            const creatureType = location.encounterCreature;
            this.startCombat(creatureType);
            return;
        }

        // Check if location is a shop
        if (location.isShop) {
            this.openShop();
            return;
        }

        this.currentView = 'location';
        this.render();
    }

    // ===== COMBAT SYSTEM =====

    startCombat(creatureType) {
        const wildCreature = JSON.parse(JSON.stringify(GameData.creatures[creatureType]));

        // Player needs a creature to fight
        // For demo: give player a starter creature if they don't have one
        if (this.state.creatures.length === 0) {
            this.state.creatures.push({
                name: "Shellback", // Starter creature
                stats: {
                    heart: 30,
                    maxHeart: 30,
                    power: 6,
                    guard: 6,
                    speed: 8
                }
            });
        }

        wildCreature.stats.maxHeart = wildCreature.stats.heart;

        this.combatState = {
            wildCreature: wildCreature,
            playerCreature: this.state.creatures[0],
            turn: 0,
            log: [],
            canCatch: false
        };

        this.currentView = 'combat';
        this.addCombatLog(`A wild ${wildCreature.name} appeared!`);
        this.render();
    }

    addCombatLog(message) {
        this.combatState.log.push(message);
    }

    executeCombatTurn(playerAction) {
        const { wildCreature, playerCreature } = this.combatState;

        if (playerAction === 'run') {
            this.addCombatLog("You fled from battle!");
            setTimeout(() => {
                this.currentView = 'location';
                this.combatState = null;
                this.render();
            }, 1000);
            this.render();
            return;
        }

        if (playerAction === 'catch') {
            // Attempt to catch
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
            setTimeout(() => {
                this.currentView = 'location';
                this.combatState = null;
                this.render();
            }, 1500);
            this.render();
            return;
        }

        if (playerAction === 'attack') {
            // Determine turn order based on speed
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

            // Check if wild creature can be caught (HP below 30%)
            if (wildCreature.stats.heart > 0 &&
                wildCreature.stats.heart < wildCreature.stats.maxHeart * 0.3) {
                this.combatState.canCatch = true;
                this.addCombatLog(`The ${wildCreature.name} looks weak enough to catch!`);
            }

            // Check win/loss conditions
            if (wildCreature.stats.heart <= 0) {
                this.addCombatLog(`The wild ${wildCreature.name} fainted!`);
                setTimeout(() => {
                    this.currentView = 'location';
                    this.combatState = null;
                    this.render();
                }, 1500);
            } else if (playerCreature.stats.heart <= 0) {
                this.addCombatLog("Your creature fainted! You return to the lighthouse...");
                setTimeout(() => {
                    // Reset player creature HP
                    playerCreature.stats.heart = playerCreature.stats.maxHeart;
                    this.state.location = 'lighthouse';
                    this.currentView = 'location';
                    this.combatState = null;
                    this.render();
                }, 2000);
            }

            this.combatState.turn++;
            this.render();
        }
    }

    performAttack(attacker, defender, isPlayer) {
        const damage = Math.max(1, attacker.stats.power - defender.stats.guard);
        defender.stats.heart = Math.max(0, defender.stats.heart - damage);

        const attackerName = isPlayer ? attacker.name : `Wild ${attacker.name}`;
        const defenderName = isPlayer ? `Wild ${defender.name}` : defender.name;

        this.addCombatLog(`${attackerName} attacks ${defenderName} for ${damage} damage!`);
    }

    // ===== NPC SYSTEM =====

    talkToNPC(npcId) {
        this.currentNPC = npcId;
        this.currentView = 'npc';
        this.render();
    }

    offerJob(jobId) {
        if (!this.state.activeJobs.includes(jobId)) {
            this.state.activeJobs.push(jobId);
        }
        this.render();
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

            // Show success message
            document.getElementById('npc-dialog').innerHTML = `
                <p>${job.correctAnswerDialog}</p>
                <p style="color: #ffd700; font-weight: bold;">+${job.reward} coins!</p>
            `;
        } else {
            // Show failure message
            document.getElementById('npc-dialog').innerHTML = `<p>${job.wrongAnswerDialog}</p>`;
        }

        // Update UI
        this.updateInventoryDisplay();

        // Clear the job question
        const existingQuestion = document.querySelector('.job-question');
        if (existingQuestion) {
            existingQuestion.remove();
        }
    }

    // ===== SHOP SYSTEM =====

    openShop() {
        this.currentView = 'shop';
        this.render();
    }

    buyItem(itemId) {
        const item = GameData.shopItems[itemId];

        if (this.state.coins >= item.price) {
            this.state.coins -= item.price;
            this.state.inventory.push(itemId);
            this.render();
        }
    }

    // ===== RENDERING SYSTEM =====

    render() {
        // Hide all views
        document.getElementById('location-view').classList.add('hidden');
        document.getElementById('combat-view').classList.add('hidden');
        document.getElementById('npc-view').classList.add('hidden');
        document.getElementById('shop-view').classList.add('hidden');

        // Render appropriate view
        if (this.currentView === 'location') {
            this.renderLocation();
        } else if (this.currentView === 'combat') {
            this.renderCombat();
        } else if (this.currentView === 'npc') {
            this.renderNPC();
        } else if (this.currentView === 'shop') {
            this.renderShop();
        }

        // Always update sidebar
        this.updateInventoryDisplay();
    }

    renderLocation() {
        const view = document.getElementById('location-view');
        view.classList.remove('hidden');

        const location = GameData.locations[this.state.location];

        document.getElementById('location-name').textContent = location.name;
        document.getElementById('location-description').textContent = location.description;

        // Render connections (travel options)
        const connectionsDiv = document.getElementById('location-connections');
        connectionsDiv.innerHTML = '<h3 style="margin-bottom: 10px;">Where to?</h3>';

        location.connections.forEach(connId => {
            const conn = GameData.locations[connId];
            const btn = document.createElement('button');
            btn.textContent = `Go to ${conn.name}`;
            btn.onclick = () => this.travelTo(connId);
            connectionsDiv.appendChild(btn);
        });

        // Render NPCs
        if (location.npcs && location.npcs.length > 0) {
            const npcsDiv = document.createElement('div');
            npcsDiv.style.marginTop = '20px';
            npcsDiv.innerHTML = '<h3 style="margin-bottom: 10px;">People</h3>';

            location.npcs.forEach(npcId => {
                const npc = GameData.npcs[npcId];
                const btn = document.createElement('button');
                btn.textContent = `Talk to ${npc.name}`;
                btn.onclick = () => this.talkToNPC(npcId);
                npcsDiv.appendChild(btn);
            });

            connectionsDiv.appendChild(npcsDiv);
        }
    }

    renderCombat() {
        const view = document.getElementById('combat-view');
        view.classList.remove('hidden');

        const { wildCreature, playerCreature, log, canCatch } = this.combatState;

        // Wild creature display
        document.getElementById('wild-creature-name').textContent = wildCreature.name;
        document.getElementById('wild-creature-stats').innerHTML = `
            <div class="stat"><strong>❤️ Heart:</strong> ${wildCreature.stats.heart}/${wildCreature.stats.maxHeart}</div>
            <div class="stat"><strong>⚔️ Power:</strong> ${wildCreature.stats.power}</div>
            <div class="stat"><strong>🛡️ Guard:</strong> ${wildCreature.stats.guard}</div>
            <div class="stat"><strong>⚡ Speed:</strong> ${wildCreature.stats.speed}</div>
        `;

        // Player creature display
        document.getElementById('player-creature-stats').innerHTML = `
            <div><strong>${playerCreature.name}</strong></div>
            <div class="stat"><strong>❤️ Heart:</strong> ${playerCreature.stats.heart}/${playerCreature.stats.maxHeart}</div>
            <div class="stat"><strong>⚔️ Power:</strong> ${playerCreature.stats.power}</div>
            <div class="stat"><strong>🛡️ Guard:</strong> ${playerCreature.stats.guard}</div>
            <div class="stat"><strong>⚡ Speed:</strong> ${playerCreature.stats.speed}</div>
        `;

        // Combat log
        const logDiv = document.getElementById('combat-log');
        logDiv.innerHTML = log.map(msg => `<p>${msg}</p>`).join('');
        logDiv.scrollTop = logDiv.scrollHeight;

        // Combat actions
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

    renderNPC() {
        const view = document.getElementById('npc-view');
        view.classList.remove('hidden');

        const npc = GameData.npcs[this.currentNPC];

        document.getElementById('npc-name').textContent = npc.name;
        document.getElementById('npc-dialog').innerHTML = `<p>${npc.dialog}</p>`;

        const actionsDiv = document.getElementById('npc-actions');
        actionsDiv.innerHTML = '';

        // Job interaction
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
                // Show job question
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
        leaveBtn.onclick = () => {
            this.currentView = 'location';
            this.currentNPC = null;
            this.render();
        };
        actionsDiv.appendChild(leaveBtn);
    }

    renderShop() {
        const view = document.getElementById('shop-view');
        view.classList.remove('hidden');

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
                    ${alreadyOwned ? 'Owned' : this.state.coins < item.price ? 'Not enough coins' : 'Buy'}
                </button>
            `;
            itemsDiv.appendChild(itemDiv);
        });

        const actionsDiv = document.getElementById('shop-actions');
        actionsDiv.innerHTML = '';

        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = 'Leave Shop';
        leaveBtn.onclick = () => this.travelTo('village');
        actionsDiv.appendChild(leaveBtn);
    }

    updateInventoryDisplay() {
        // Update coins
        document.getElementById('coin-count').textContent = this.state.coins;

        // Update items
        const itemsList = document.getElementById('items-list');
        if (this.state.inventory.length === 0) {
            itemsList.innerHTML = '<p class="empty-state">No items yet</p>';
        } else {
            itemsList.innerHTML = '';
            this.state.inventory.forEach(itemId => {
                const item = GameData.shopItems[itemId];
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item';
                itemDiv.textContent = item.name;
                itemsList.appendChild(itemDiv);
            });
        }

        // Update creatures
        const creaturesList = document.getElementById('creatures-list');
        if (this.state.creatures.length === 0) {
            creaturesList.innerHTML = '<p class="empty-state">No creatures yet</p>';
        } else {
            creaturesList.innerHTML = '';
            this.state.creatures.forEach(creature => {
                const creatureDiv = document.createElement('div');
                creatureDiv.className = 'creature';
                creatureDiv.innerHTML = `
                    <h4>${creature.name}</h4>
                    <div class="creature-stats">
                        <div>❤️ ${creature.stats.heart}/${creature.stats.maxHeart}</div>
                        <div>⚔️ ${creature.stats.power}</div>
                        <div>🛡️ ${creature.stats.guard}</div>
                        <div>⚡ ${creature.stats.speed}</div>
                    </div>
                `;
                creaturesList.appendChild(creatureDiv);
            });
        }
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
