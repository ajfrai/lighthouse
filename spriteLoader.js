/**
 * Sprite Loader
 * Loads PNG sprite sheets and provides methods to draw sprites
 */

class SpriteLoader {
    constructor() {
        this.images = {};
        this.indexes = {};
        this.loaded = false;
        this.waterFrame = 0;
        this.lastWaterUpdate = 0;
    }

    async load() {
        const sprites = [
            { name: 'tileset', hasIndex: true },
            { name: 'characters', hasIndex: true },
            { name: 'tree', hasIndex: false },
            { name: 'lighthouse', hasIndex: false }
        ];

        const promises = sprites.map(async (sprite) => {
            // Load image
            const img = new Image();
            img.src = `static/sprites/${sprite.name}.png`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            this.images[sprite.name] = img;

            // Load index JSON if it exists
            if (sprite.hasIndex) {
                const response = await fetch(`static/sprites/${sprite.name}.json`);
                this.indexes[sprite.name] = await response.json();
            }
        });

        await Promise.all(promises);
        this.loaded = true;
        console.log('✓ All sprites loaded');
    }

    /**
     * Draw a tile from the tileset
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} tileName - Name of tile (e.g., 'grass_0', 'water_1')
     * @param {number} dx - Destination X
     * @param {number} dy - Destination Y
     * @param {number} size - Tile size (default 16)
     */
    drawTile(ctx, tileName, dx, dy, size = 16) {
        if (!this.loaded) return;

        const index = this.indexes.tileset;
        const tile = index.tiles[tileName];
        if (!tile) {
            console.warn(`Tile not found: ${tileName}`);
            return;
        }

        const sx = tile.x * index.tileSize;
        const sy = tile.y * index.tileSize;

        ctx.drawImage(
            this.images.tileset,
            sx, sy, index.tileSize, index.tileSize,  // Source
            dx, dy, size, size                        // Destination
        );
    }

    /**
     * Draw character sprite
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} charType - Character type ('player', 'shopkeeper', 'teacher', 'scientist', 'fisherman')
     * @param {string} direction - Direction ('down', 'up', 'left', 'right')
     * @param {number} frame - Animation frame (0 or 1)
     * @param {number} dx - Destination X
     * @param {number} dy - Destination Y
     */
    drawCharacter(ctx, charType, direction, frame, dx, dy) {
        if (!this.loaded) return;

        const index = this.indexes.characters;
        const charData = index.characters[charType];
        if (!charData) {
            console.warn(`Character type not found: ${charType}`);
            return;
        }

        const anim = charData.animations[direction];
        if (!anim) return;

        const frameData = anim.frames[frame % 2];
        const sx = frameData.x * index.spriteWidth;
        const sy = frameData.y * index.spriteHeight;

        ctx.drawImage(
            this.images.characters,
            sx, sy, index.spriteWidth, index.spriteHeight,
            dx, dy - 16, index.spriteWidth, index.spriteHeight  // -16 to center vertically on tile (24x32 chars)
        );
    }

    /**
     * Draw tree (32x32, 2x2 tiles)
     */
    drawTree(ctx, dx, dy) {
        if (!this.loaded) return;
        ctx.drawImage(this.images.tree, dx, dy, 32, 32);
    }

    /**
     * Draw lighthouse (48x80, 3x5 tiles)
     */
    drawLighthouse(ctx, dx, dy) {
        if (!this.loaded) return;
        ctx.drawImage(this.images.lighthouse, dx, dy, 48, 80);
    }

    /**
     * Draw store building (32x32, 2x2 tiles)
     */
    drawStore(ctx, dx, dy) {
        if (!this.loaded) return;

        ctx.save();

        // Store building - simple shop structure
        // Base building (brown/tan)
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(dx, dy + 8, 32, 24);

        // Roof (darker brown)
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(dx - 2, dy + 8);
        ctx.lineTo(dx + 16, dy);
        ctx.lineTo(dx + 34, dy + 8);
        ctx.lineTo(dx + 32, dy + 10);
        ctx.lineTo(dx + 16, dy + 3);
        ctx.lineTo(dx, dy + 10);
        ctx.closePath();
        ctx.fill();

        // Door (dark)
        ctx.fillStyle = '#3d2817';
        ctx.fillRect(dx + 11, dy + 18, 10, 14);

        // Window (light blue)
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(dx + 4, dy + 14, 6, 6);
        ctx.fillRect(dx + 22, dy + 14, 6, 6);

        // Window frames
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(dx + 4, dy + 14, 6, 6);
        ctx.strokeRect(dx + 22, dy + 14, 6, 6);

        // Sign above door
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(dx + 9, dy + 12, 14, 4);
        ctx.fillStyle = '#654321';
        ctx.font = '6px monospace';
        ctx.fillText('SHOP', dx + 11, dy + 15);

        ctx.restore();
    }

    /**
     * Draw boat (48x32, 3x2 tiles)
     */
    drawBoat(ctx, dx, dy) {
        if (!this.loaded) return;

        ctx.save();

        // Boat hull (brown wood)
        ctx.fillStyle = '#8b6f47';
        ctx.beginPath();
        ctx.moveTo(dx + 4, dy + 20);
        ctx.lineTo(dx + 44, dy + 20);
        ctx.lineTo(dx + 40, dy + 32);
        ctx.lineTo(dx + 8, dy + 32);
        ctx.closePath();
        ctx.fill();

        // Boat sides (darker)
        ctx.fillStyle = '#6b5437';
        ctx.fillRect(dx + 4, dy + 20, 4, 12);
        ctx.fillRect(dx + 40, dy + 20, 4, 12);

        // Mast (vertical pole)
        ctx.fillStyle = '#654321';
        ctx.fillRect(dx + 22, dy, 4, 24);

        // Sail (white/cream)
        ctx.fillStyle = '#f5f5dc';
        ctx.beginPath();
        ctx.moveTo(dx + 26, dy + 4);
        ctx.lineTo(dx + 42, dy + 10);
        ctx.lineTo(dx + 26, dy + 16);
        ctx.closePath();
        ctx.fill();

        // Sail outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Rope/rigging
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dx + 24, dy + 4);
        ctx.lineTo(dx + 42, dy + 10);
        ctx.moveTo(dx + 24, dy + 16);
        ctx.lineTo(dx + 42, dy + 10);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw rock (16x16, 1x1 tile)
     */
    drawRock(ctx, dx, dy) {
        if (!this.loaded) return;

        ctx.save();

        // Draw a simple rock with shading
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.ellipse(dx + 8, dy + 10, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#8b8b8b';
        ctx.beginPath();
        ctx.ellipse(dx + 6, dy + 8, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = '#4b4b4b';
        ctx.beginPath();
        ctx.ellipse(dx + 10, dy + 12, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Draw tall grass (16x16, 1x1 tile)
     */
    drawTallGrass(ctx, dx, dy) {
        if (!this.loaded) return;

        ctx.save();

        // Draw several grass blades
        ctx.strokeStyle = '#4a7c3e';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Draw 5 grass blades with slight variation
        for (let i = 0; i < 5; i++) {
            const x = dx + 3 + i * 3;
            const height = 10 + (i % 3) * 2;
            const sway = Math.sin(i) * 2;

            ctx.beginPath();
            ctx.moveTo(x, dy + 16);
            ctx.quadraticCurveTo(x + sway, dy + 8, x + sway, dy + (16 - height));
            ctx.stroke();
        }

        // Lighter tips
        ctx.strokeStyle = '#6bc95d';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = dx + 3 + i * 3;
            const height = 10 + (i % 3) * 2;
            const sway = Math.sin(i) * 2;

            ctx.beginPath();
            ctx.moveTo(x + sway, dy + (16 - height));
            ctx.lineTo(x + sway, dy + (16 - height - 2));
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Get current water animation frame
     */
    getWaterFrame() {
        return this.waterFrame;
    }

    /**
     * Update water animation
     */
    updateWaterAnimation(timestamp) {
        if (timestamp - this.lastWaterUpdate > 500) {  // 500ms per frame
            this.waterFrame = (this.waterFrame + 1) % 3;
            this.lastWaterUpdate = timestamp;
        }
    }

    /**
     * Get a tile variant deterministically based on position
     */
    getTileVariant(baseName, x, y, variantCount) {
        const variant = (x * 7 + y * 13) % variantCount;
        return `${baseName}_${variant}`;
    }
}

// Global sprite loader instance
const spriteLoader = new SpriteLoader();
