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
     * @param {string} direction - Direction ('down', 'up', 'left', 'right')
     * @param {number} frame - Animation frame (0 or 1)
     * @param {number} dx - Destination X
     * @param {number} dy - Destination Y
     */
    drawCharacter(ctx, direction, frame, dx, dy) {
        if (!this.loaded) return;

        const index = this.indexes.characters;
        const anim = index.animations[direction];
        if (!anim) return;

        const frameData = anim.frames[frame % 2];
        const sx = frameData.x * index.spriteWidth;
        const sy = frameData.y * index.spriteHeight;

        ctx.drawImage(
            this.images.characters,
            sx, sy, index.spriteWidth, index.spriteHeight,
            dx, dy - 8, index.spriteWidth, index.spriteHeight  // -8 to center vertically on tile
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
