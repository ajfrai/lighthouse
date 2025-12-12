/**
 * Rendering System - Handles all game rendering
 * Extracted from main game engine for modularity
 */

class RenderingSystem {
    constructor(game) {
        this.game = game;
    }

    render() {
        const ctx = this.game.ctx;
        const canvas = this.game.canvas;

        // Clear
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render layers
        this.renderTerrain();
        this.renderObjects();
        this.game.questSystem.renderQuestMarkers(ctx);
        this.renderPlayer();
        this.game.questSystem.renderQuestObjective(ctx, canvas.height, canvas.width);
    }

    renderTerrain() {
        const ctx = this.game.ctx;
        const map = this.game.map;
        const tileSize = map.tileSize;

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const index = y * map.width + x;
                const terrain = map.ground[index];

                let tileName;
                if (terrain === 'water') {
                    tileName = `water_${spriteLoader.getWaterFrame()}`;
                } else if (terrain === 'grass') {
                    tileName = spriteLoader.getTileVariant('grass', x, y, 4);
                } else if (terrain === 'sand') {
                    tileName = spriteLoader.getTileVariant('sand', x, y, 3);
                }

                spriteLoader.drawTile(
                    ctx,
                    tileName,
                    x * tileSize,
                    y * tileSize,
                    tileSize
                );
            }
        }
    }

    renderObjects() {
        const ctx = this.game.ctx;
        const map = this.game.map;
        const tileSize = map.tileSize;

        for (const obj of map.objects) {
            if (obj.type === 'lighthouse') {
                spriteLoader.drawLighthouse(
                    ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'tree') {
                spriteLoader.drawTree(
                    ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'store') {
                spriteLoader.drawStore(
                    ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'boat') {
                spriteLoader.drawBoat(
                    ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'rock') {
                spriteLoader.drawRock(
                    ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'tallgrass') {
                spriteLoader.drawTallGrass(
                    ctx,
                    obj.x * tileSize,
                    obj.y * tileSize
                );
            } else if (obj.type === 'npc') {
                spriteLoader.drawCharacter(
                    ctx,
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
        const ctx = this.game.ctx;
        const tileSize = this.game.map.tileSize;
        const frame = this.game.player.moving ? this.game.player.walkFrame : 0;

        spriteLoader.drawCharacter(
            ctx,
            'player',                          // Character type
            this.game.player.direction,        // Direction
            frame,                             // Animation frame
            this.game.player.x * tileSize,
            this.game.player.y * tileSize
        );
    }

    renderDebugInfo() {
        const ctx = this.game.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, 300, 140);

        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        ctx.fillText(`Speed Run: ${this.game.speedRunMode ? 'ON' : 'OFF'}`, 10, 20);
        ctx.fillText(`Phase: ${this.game.plotPhase}`, 10, 35);
        ctx.fillText(`State: ${this.game.state}`, 10, 50);
        ctx.fillText(`Position: (${this.game.player.x}, ${this.game.player.y})`, 10, 65);
        ctx.fillText(`Creatures: ${this.game.discoveredCreatures.size}/8`, 10, 80);

        // Shortcuts
        ctx.fillStyle = '#ffff00';
        ctx.font = '10px monospace';
        ctx.fillText('F1:Speed F2:Debug T:Teleport 1-9:Phases', 10, 140);
    }
}
