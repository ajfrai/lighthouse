// SVG Assets - Children's book illustration style
// Soft colors, hand-drawn feel, evocative but simple

const SVGAssets = {
    // ===== CHARACTERS =====
    player: {
        explorer: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Child with explorer hat -->
            <circle cx="16" cy="14" r="8" fill="#fdd8b5" stroke="#8b6f47" stroke-width="1"/>
            <ellipse cx="16" cy="20" r="6" ry="8" fill="#c45d2f" stroke="#8b4513" stroke-width="1"/>
            <path d="M 10,10 L 16,8 L 22,10 Q 22,12 16,13 Q 10,12 10,10" fill="#8b7355" stroke="#5d4e37" stroke-width="0.5"/>
            <circle cx="13" cy="13" r="1" fill="#2c1810"/>
            <circle cx="19" cy="13" r="1" fill="#2c1810"/>
        </svg>`,
        scholar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="14" r="8" fill="#fdd8b5" stroke="#8b6f47" stroke-width="1"/>
            <ellipse cx="16" cy="20" r="6" ry="8" fill="#4a90e2" stroke="#2c5d8f" stroke-width="1"/>
            <rect x="10" y="8" width="12" height="4" fill="#2c1810" stroke="#000" stroke-width="0.5"/>
            <circle cx="13" cy="13" r="1" fill="#2c1810"/>
            <circle cx="19" cy="13" r="1" fill="#2c1810"/>
        </svg>`,
        sailor: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="14" r="8" fill="#fdd8b5" stroke="#8b6f47" stroke-width="1"/>
            <ellipse cx="16" cy="20" r="6" ry="8" fill="#50c878" stroke="#2d6e4a" stroke-width="1"/>
            <rect x="12" y="9" width="8" height="3" fill="#fff" stroke="#2c5d8f" stroke-width="0.5"/>
            <circle cx="13" cy="13" r="1" fill="#2c1810"/>
            <circle cx="19" cy="13" r="1" fill="#2c1810"/>
        </svg>`,
        mage: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="14" r="8" fill="#fdd8b5" stroke="#8b6f47" stroke-width="1"/>
            <ellipse cx="16" cy="20" r="6" ry="8" fill="#9b59b6" stroke="#6a3d7c" stroke-width="1"/>
            <path d="M 16,6 L 12,10 L 20,10 Z" fill="#9b59b6" stroke="#6a3d7c" stroke-width="0.5"/>
            <circle cx="13" cy="13" r="1" fill="#2c1810"/>
            <circle cx="19" cy="13" r="1" fill="#2c1810"/>
            <circle cx="16" cy="8" r="1" fill="#ffd700"/>
        </svg>`
    },

    npcs: {
        keeper: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Older figure, slightly hunched, with cane -->
            <ellipse cx="16" cy="20" r="5" ry="7" fill="#6b8e7f" stroke="#4a5f52" stroke-width="1"/>
            <circle cx="16" cy="12" r="6" fill="#e8d4b8" stroke="#b8a890" stroke-width="1"/>
            <path d="M 10,14 Q 10,12 12,12" stroke="#888" stroke-width="1" fill="none"/>
            <circle cx="13" cy="12" r="0.8" fill="#5a5a5a"/>
            <circle cx="19" cy="12" r="0.8" fill="#5a5a5a"/>
            <line x1="20" y1="20" x2="23" y2="28" stroke="#8b7355" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M 14,10 Q 16,9 18,10" stroke="#ccc" stroke-width="0.5" fill="none"/>
        </svg>`,
        fisherman: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="20" r="6" ry="8" fill="#ff8c42" stroke="#c45d2f" stroke-width="1"/>
            <circle cx="16" cy="13" r="7" fill="#fdd8b5" stroke="#8b6f47" stroke-width="1"/>
            <rect x="12" y="10" width="8" height="2" fill="#ffd700" stroke="#b8860b" stroke-width="0.5"/>
            <circle cx="13" cy="13" r="1" fill="#2c1810"/>
            <circle cx="19" cy="13" r="1" fill="#2c1810"/>
            <path d="M 14,16 Q 16,17 18,16" stroke="#8b6f47" stroke-width="0.8" fill="none"/>
        </svg>`
    },

    creatures: {
        shellback: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Turtle-like creature -->
            <ellipse cx="16" cy="18" r="10" ry="8" fill="#8b7355" stroke="#5d4e37" stroke-width="1"/>
            <circle cx="16" cy="18" r="7" fill="#6b5b3e" stroke="#4a3d2a" stroke-width="1"/>
            <path d="M 16,11 L 12,15 L 20,15 Z M 12,15 L 9,18 L 12,21 Z M 20,15 L 23,18 L 20,21 Z"
                  fill="#8b7355" stroke="#5d4e37" stroke-width="0.5"/>
            <ellipse cx="12" cy="14" r="2" ry="1.5" fill="#7a6b4f" stroke="#5d4e37" stroke-width="0.5"/>
            <ellipse cx="20" cy="14" r="2" ry="1.5" fill="#7a6b4f" stroke="#5d4e37" stroke-width="0.5"/>
            <circle cx="13" cy="14" r="0.8" fill="#2c1810"/>
            <circle cx="19" cy="14" r="0.8" fill="#2c1810"/>
        </svg>`,
        seasprite: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Wispy water spirit -->
            <path d="M 16,8 Q 12,12 14,16 Q 10,18 12,22 Q 14,20 16,22 Q 18,20 20,22 Q 22,18 18,16 Q 20,12 16,8"
                  fill="#4da6ff" fill-opacity="0.7" stroke="#2c7fb8" stroke-width="1"/>
            <circle cx="14" cy="14" r="1.5" fill="#e0f3ff"/>
            <circle cx="18" cy="14" r="1.5" fill="#e0f3ff"/>
            <circle cx="13" cy="14" r="0.6" fill="#2c1810"/>
            <circle cx="17" cy="14" r="0.6" fill="#2c1810"/>
            <path d="M 12,24 Q 14,26 16,24 Q 18,26 20,24" stroke="#2c7fb8" stroke-width="1" fill="none" opacity="0.5"/>
        </svg>`
    },

    // ===== TILES =====
    tiles: {
        grass: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#2d5016"/>
            <path d="M 4,28 Q 4,24 6,24 Q 6,28 8,28" fill="#3d6b21" opacity="0.4"/>
            <path d="M 12,26 Q 12,22 14,22 Q 14,26 16,26" fill="#3d6b21" opacity="0.3"/>
            <path d="M 24,30 Q 24,26 26,26 Q 26,30 28,30" fill="#3d6b21" opacity="0.4"/>
            <circle cx="10" cy="16" r="1" fill="#4a7c2f" opacity="0.3"/>
            <circle cx="22" cy="12" r="1" fill="#4a7c2f" opacity="0.3"/>
        </svg>`,
        tallGrass: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#3d6b21"/>
            <path d="M 4,32 Q 5,20 6,32" stroke="#2d5016" stroke-width="1.5" fill="none"/>
            <path d="M 10,32 Q 11,18 12,32" stroke="#2d5016" stroke-width="1.5" fill="none"/>
            <path d="M 16,32 Q 17,22 18,32" stroke="#2d5016" stroke-width="1.5" fill="none"/>
            <path d="M 22,32 Q 23,20 24,32" stroke="#2d5016" stroke-width="1.5" fill="none"/>
            <path d="M 28,32 Q 29,24 30,32" stroke="#2d5016" stroke-width="1.5" fill="none"/>
        </svg>`,
        water: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#1e4d8b"/>
            <path d="M 0,12 Q 8,10 16,12 Q 24,14 32,12" stroke="#2c7fb8" stroke-width="1" fill="none" opacity="0.4"/>
            <path d="M 0,20 Q 8,18 16,20 Q 24,22 32,20" stroke="#2c7fb8" stroke-width="1" fill="none" opacity="0.4"/>
            <circle cx="8" cy="16" r="1" fill="#4da6ff" opacity="0.3"/>
            <circle cx="24" cy="24" r="1" fill="#4da6ff" opacity="0.3"/>
        </svg>`,
        sand: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#e0d0a0"/>
            <circle cx="6" cy="8" r="0.5" fill="#c9b880" opacity="0.5"/>
            <circle cx="14" cy="12" r="0.5" fill="#c9b880" opacity="0.5"/>
            <circle cx="22" cy="18" r="0.5" fill="#c9b880" opacity="0.5"/>
            <circle cx="10" cy="24" r="0.5" fill="#c9b880" opacity="0.5"/>
            <circle cx="26" cy="10" r="0.5" fill="#c9b880" opacity="0.5"/>
        </svg>`,
        path: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#8b7355"/>
            <ellipse cx="8" cy="12" rx="2" ry="1" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="20" cy="8" rx="1.5" ry="1" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="16" cy="20" rx="2" ry="1.5" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="26" cy="24" rx="1.5" ry="1" fill="#6b5b3e" opacity="0.3"/>
        </svg>`,
        building: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#6b5b3e"/>
            <path d="M 2,16 L 16,4 L 30,16" fill="#8b4513" stroke="#5d3620" stroke-width="1"/>
            <rect x="6" y="16" width="20" height="16" fill="#8b6f47" stroke="#5d4e37" stroke-width="1"/>
            <rect x="12" y="20" width="8" height="8" fill="#4a3520" stroke="#2c1810" stroke-width="0.5"/>
        </svg>`,
        door: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#4a3520"/>
            <rect x="10" y="8" width="12" height="18" fill="#654321" stroke="#3d2b17" stroke-width="1"/>
            <circle cx="18" cy="18" r="1" fill="#b8860b"/>
            <path d="M 10,26 L 22,26" stroke="#3d2b17" stroke-width="1"/>
        </svg>`,
        lighthouse: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="6" width="8" height="20" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
            <rect x="10" y="4" width="12" height="3" fill="#cc3333" stroke="#991111" stroke-width="1"/>
            <circle cx="16" cy="5" r="2" fill="#ffd700" opacity="0.8"/>
            <line x1="16" y1="5" x2="16" y2="0" stroke="#ffd700" stroke-width="1" opacity="0.6"/>
            <path d="M 16,5 L 10,8" stroke="#ffd700" stroke-width="0.5" opacity="0.4"/>
            <path d="M 16,5 L 22,8" stroke="#ffd700" stroke-width="0.5" opacity="0.4"/>
            <rect x="14" y="20" width="4" height="6" fill="#4a3520" stroke="#2c1810" stroke-width="0.5"/>
        </svg>`,
        tree: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="18" width="4" height="10" fill="#5d4e37" stroke="#3d2b17" stroke-width="0.5"/>
            <circle cx="16" cy="12" r="10" fill="#1a3d0f" opacity="0.8"/>
            <circle cx="12" cy="10" r="6" fill="#2d5016" opacity="0.7"/>
            <circle cx="20" cy="10" r="6" fill="#2d5016" opacity="0.7"/>
            <circle cx="16" cy="8" r="5" fill="#3d6b21" opacity="0.6"/>
        </svg>`,
        shop: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#8b4513"/>
            <path d="M 4,14 L 16,6 L 28,14" fill="#a0522d" stroke="#654321" stroke-width="1"/>
            <rect x="6" y="14" width="20" height="14" fill="#8b6f47" stroke="#5d4e37" stroke-width="1"/>
            <rect x="10" y="18" width="12" height="6" fill="#4a90e2" stroke="#2c5d8f" stroke-width="0.5"/>
            <text x="16" y="24" text-anchor="middle" font-size="8" fill="#fff">SHOP</text>
        </svg>`,
        counter: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="#654321"/>
            <rect x="4" y="12" width="24" height="8" fill="#8b6f47" stroke="#5d4e37" stroke-width="1"/>
        </svg>`
    },

    // ===== UI ICONS =====
    icons: {
        coin: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" fill="#ffd700" stroke="#b8860b" stroke-width="1"/>
            <text x="8" y="11" text-anchor="middle" font-size="8" font-weight="bold" fill="#b8860b">$</text>
        </svg>`,
        heart: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M 8,14 Q 2,9 2,5 Q 2,2 5,2 Q 7,2 8,4 Q 9,2 11,2 Q 14,2 14,5 Q 14,9 8,14"
                  fill="#ff6b6b" stroke="#cc3333" stroke-width="0.5"/>
        </svg>`,
        compass: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" fill="#f5f5f5" stroke="#8b7355" stroke-width="1"/>
            <path d="M 8,3 L 6,8 L 8,13 L 10,8 Z" fill="#cc3333" stroke="#991111" stroke-width="0.5"/>
            <circle cx="8" cy="8" r="1.5" fill="#2c1810"/>
        </svg>`
    }
};

// SVG Loader - converts SVG strings to Image objects for canvas rendering
class SVGLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
    }

    async loadSVG(svgString, width = 32, height = 32) {
        const key = `${svgString}-${width}-${height}`;

        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        if (this.loading.has(key)) {
            return this.loading.get(key);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                URL.revokeObjectURL(url);
                this.cache.set(key, img);
                this.loading.delete(key);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                this.loading.delete(key);
                reject(new Error('Failed to load SVG'));
            };

            img.src = url;
        });

        this.loading.set(key, promise);
        return promise;
    }

    async preloadAll() {
        const promises = [];

        // Preload all player characters
        for (const char of Object.values(SVGAssets.player)) {
            promises.push(this.loadSVG(char));
        }

        // Preload all NPCs
        for (const npc of Object.values(SVGAssets.npcs)) {
            promises.push(this.loadSVG(npc));
        }

        // Preload all creatures
        for (const creature of Object.values(SVGAssets.creatures)) {
            promises.push(this.loadSVG(creature));
        }

        // Preload all tiles
        for (const tile of Object.values(SVGAssets.tiles)) {
            promises.push(this.loadSVG(tile));
        }

        // Preload icons
        for (const icon of Object.values(SVGAssets.icons)) {
            promises.push(this.loadSVG(icon, 16, 16));
        }

        await Promise.all(promises);
    }
}

const svgLoader = new SVGLoader();
