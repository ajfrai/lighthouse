// SVG Assets - Modern Pixel Art Aesthetic
// Inspired by Pokémon DS era, Stardew Valley, Celeste - polished retro with modern touches
// Color palette: muted, cohesive, intentional

// PALETTE
const PALETTE = {
    grass: { light: '#6aaa64', mid: '#538d4e', dark: '#3d6b3d' },
    water: { light: '#5b8fb9', mid: '#4a7a9e', dark: '#3a5f7a' },
    sand: { light: '#d4c4a8', shadow: '#b8a88c' },
    wood: { light: '#a08060', mid: '#8b7355', dark: '#6b5340' },
    lighthouse: { white: '#f5f0e6', roof: '#c06060' },
    ui: { dark: '#1a1a2e', accent: '#e94560' }
};

const SVGAssets = {
    // ===== CHARACTERS - Pixel art with shadows and outlines for visibility =====
    player: {
        // Explorer with subtle pixel detail
        explorer: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="16" cy="28" rx="7" ry="2.5" fill="#000" opacity="0.35"/>
            <!-- Outline for visibility -->
            <rect x="11" y="9" width="10" height="19" fill="none" stroke="#1a1a2e" stroke-width="1"/>
            <!-- Body -->
            <rect x="12" y="20" width="8" height="8" fill="${PALETTE.wood.mid}"/>
            <!-- Head -->
            <rect x="12" y="12" width="8" height="8" fill="#f4d4b0"/>
            <!-- Eyes -->
            <rect x="13" y="15" width="2" height="2" fill="#3d2817"/>
            <rect x="17" y="15" width="2" height="2" fill="#3d2817"/>
            <!-- Hat -->
            <rect x="11" y="10" width="10" height="3" fill="${PALETTE.wood.dark}"/>
            <rect x="12" y="9" width="8" height="1" fill="${PALETTE.wood.dark}"/>
            <!-- Hat highlight -->
            <rect x="13" y="10" width="2" height="1" fill="${PALETTE.wood.mid}"/>
        </svg>`,

        scholar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="28" rx="7" ry="2.5" fill="#000" opacity="0.35"/>
            <rect x="11" y="10" width="10" height="18" fill="none" stroke="#1a1a2e" stroke-width="1"/>
            <rect x="12" y="20" width="8" height="8" fill="#3d7fa8"/>
            <rect x="12" y="12" width="8" height="8" fill="#f4d4b0"/>
            <rect x="13" y="15" width="2" height="2" fill="#3d2817"/>
            <rect x="17" y="15" width="2" height="2" fill="#3d2817"/>
            <rect x="11" y="10" width="10" height="3" fill="#1a1a2e"/>
            <rect x="14" y="11" width="4" height="1" fill="#ffd700"/>
        </svg>`,

        sailor: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="28" rx="7" ry="2.5" fill="#000" opacity="0.35"/>
            <rect x="11" y="10" width="10" height="18" fill="none" stroke="#1a1a2e" stroke-width="1"/>
            <rect x="12" y="20" width="8" height="8" fill="#4aa87c"/>
            <rect x="13" y="22" width="6" height="2" fill="#fff"/>
            <rect x="12" y="12" width="8" height="8" fill="#f4d4b0"/>
            <rect x="13" y="15" width="2" height="2" fill="#3d2817"/>
            <rect x="17" y="15" width="2" height="2" fill="#3d2817"/>
            <rect x="11" y="10" width="10" height="3" fill="#fff"/>
            <rect x="11" y="11" width="10" height="1" fill="#2c5d8f"/>
        </svg>`,

        mage: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="28" rx="7" ry="2.5" fill="#000" opacity="0.35"/>
            <rect x="11" y="6" width="10" height="22" fill="none" stroke="#1a1a2e" stroke-width="1"/>
            <rect x="12" y="20" width="8" height="8" fill="#8b5fbf"/>
            <rect x="12" y="12" width="8" height="8" fill="#f4d4b0"/>
            <rect x="13" y="15" width="2" height="2" fill="#3d2817"/>
            <rect x="17" y="15" width="2" height="2" fill="#3d2817"/>
            <!-- Wizard hat -->
            <path d="M 16,6 L 12,12 L 20,12 Z" fill="#8b5fbf" stroke="#1a1a2e" stroke-width="0.5"/>
            <rect x="11" y="12" width="10" height="2" fill="#8b5fbf"/>
            <rect x="15" y="8" width="2" height="2" fill="#ffd700"/>
        </svg>`
    },

    npcs: {
        keeper: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="28" rx="6" ry="2" fill="#000" opacity="0.25"/>
            <rect x="12" y="20" width="8" height="8" fill="${PALETTE.wood.mid}"/>
            <rect x="12" y="12" width="8" height="8" fill="#e8d4b8"/>
            <rect x="13" y="15" width="2" height="2" fill="#5a5a5a"/>
            <rect x="17" y="15" width="2" height="2" fill="#5a5a5a"/>
            <!-- Gray hair -->
            <rect x="11" y="11" width="10" height="2" fill="#d4d4d4"/>
            <rect x="12" y="10" width="8" height="1" fill="#d4d4d4"/>
            <!-- Cane -->
            <rect x="22" y="20" width="2" height="8" fill="${PALETTE.wood.dark}"/>
            <rect x="23" y="28" width="2" height="2" fill="${PALETTE.wood.dark}"/>
        </svg>`,

        fisherman: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="28" rx="6" ry="2" fill="#000" opacity="0.25"/>
            <rect x="12" y="20" width="8" height="8" fill="#e67a42"/>
            <rect x="12" y="12" width="8" height="8" fill="#f4d4b0"/>
            <rect x="13" y="15" width="2" height="2" fill="#3d2817"/>
            <rect x="17" y="15" width="2" height="2" fill="#3d2817"/>
            <!-- Yellow hat -->
            <rect x="11" y="10" width="10" height="3" fill="#ffd966"/>
            <rect x="14" y="11" width="4" height="1" fill="#d4a83d"/>
        </svg>`
    },

    creatures: {
        shellback: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="26" rx="10" ry="3" fill="#000" opacity="0.3"/>
            <!-- Shell body -->
            <ellipse cx="16" cy="18" rx="10" ry="8" fill="${PALETTE.wood.mid}"/>
            <ellipse cx="16" cy="18" rx="8" ry="6" fill="${PALETTE.wood.light}"/>
            <ellipse cx="16" cy="18" rx="5" ry="4" fill="${PALETTE.wood.dark}"/>
            <!-- Shell pattern -->
            <rect x="15" y="15" width="2" height="6" fill="${PALETTE.wood.dark}"/>
            <rect x="12" y="17" width="8" height="2" fill="${PALETTE.wood.dark}"/>
            <!-- Head -->
            <ellipse cx="11" cy="14" rx="3" ry="2" fill="${PALETTE.wood.light}"/>
            <ellipse cx="21" cy="14" rx="3" ry="2" fill="${PALETTE.wood.light}"/>
            <!-- Eyes -->
            <rect x="10" y="13" width="2" height="2" fill="#3d2817"/>
            <rect x="20" y="13" width="2" height="2" fill="#3d2817"/>
        </svg>`,

        seasprite: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="26" rx="8" ry="3" fill="#000" opacity="0.3"/>
            <!-- Jellyfish-like body -->
            <ellipse cx="16" cy="14" rx="8" ry="8" fill="${PALETTE.water.light}"/>
            <ellipse cx="16" cy="14" rx="6" ry="6" fill="${PALETTE.water.mid}"/>
            <!-- Eyes -->
            <rect x="12" y="13" width="2" height="2" fill="#2c5d8f"/>
            <rect x="18" y="13" width="2" height="2" fill="#2c5d8f"/>
            <rect x="12" y="13" width="1" height="1" fill="#fff"/>
            <rect x="18" y="13" width="1" height="1" fill="#fff"/>
            <!-- Tentacles (pixelated) -->
            <rect x="11" y="21" width="2" height="4" fill="${PALETTE.water.mid}"/>
            <rect x="15" y="22" width="2" height="5" fill="${PALETTE.water.mid}"/>
            <rect x="19" y="21" width="2" height="4" fill="${PALETTE.water.mid}"/>
        </svg>`
    },

    // ===== TILES - Multiple variants with pixel art style =====
    tiles: {
        // GRASS - 4 variants (SUBTLE - barely noticeable variation)
        grass: [
            // Base grass (70% usage probability)
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.grass.mid}"/>
                <rect x="8" y="24" width="1" height="2" fill="${PALETTE.grass.light}" opacity="0.4"/>
                <rect x="20" y="26" width="1" height="2" fill="${PALETTE.grass.light}" opacity="0.4"/>
            </svg>`,
            // Variant A (subtle light blades)
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.grass.mid}"/>
                <rect x="12" y="22" width="1" height="3" fill="${PALETTE.grass.light}" opacity="0.5"/>
                <rect x="24" y="24" width="1" height="2" fill="${PALETTE.grass.light}" opacity="0.4"/>
                <rect x="6" y="26" width="1" height="2" fill="${PALETTE.grass.dark}" opacity="0.3"/>
            </svg>`,
            // Variant B (subtle dark patches)
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.grass.mid}"/>
                <rect x="16" y="24" width="1" height="2" fill="${PALETTE.grass.dark}" opacity="0.3"/>
                <rect x="10" y="26" width="1" height="2" fill="${PALETTE.grass.light}" opacity="0.4"/>
            </svg>`,
            // Base variant (same as first for weighted distribution)
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.grass.mid}"/>
                <rect x="14" y="26" width="1" height="2" fill="${PALETTE.grass.light}" opacity="0.4"/>
                <rect x="28" y="24" width="1" height="2" fill="${PALETTE.grass.dark}" opacity="0.3"/>
            </svg>`
        ],

        // TALL GRASS - 3 variants (encounter zones)
        tallGrass: [
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.grass.dark}"/>
                <rect x="2" y="16" width="2" height="16" fill="${PALETTE.grass.mid}"/>
                <rect x="6" y="12" width="2" height="20" fill="${PALETTE.grass.mid}"/>
                <rect x="10" y="14" width="2" height="18" fill="${PALETTE.grass.mid}"/>
                <rect x="14" y="10" width="2" height="22" fill="${PALETTE.grass.mid}"/>
                <rect x="18" y="16" width="2" height="16" fill="${PALETTE.grass.mid}"/>
                <rect x="22" y="12" width="2" height="20" fill="${PALETTE.grass.mid}"/>
                <rect x="26" y="14" width="2" height="18" fill="${PALETTE.grass.mid}"/>
                <rect x="30" y="18" width="2" height="14" fill="${PALETTE.grass.mid}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.grass.dark}"/>
                <rect x="4" y="14" width="2" height="18" fill="${PALETTE.grass.mid}"/>
                <rect x="8" y="10" width="2" height="22" fill="${PALETTE.grass.mid}"/>
                <rect x="12" y="16" width="2" height="16" fill="${PALETTE.grass.mid}"/>
                <rect x="16" y="12" width="2" height="20" fill="${PALETTE.grass.mid}"/>
                <rect x="20" y="14" width="2" height="18" fill="${PALETTE.grass.mid}"/>
                <rect x="24" y="10" width="2" height="22" fill="${PALETTE.grass.mid}"/>
                <rect x="28" y="16" width="2" height="16" fill="${PALETTE.grass.mid}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.grass.dark}"/>
                <rect x="0" y="18" width="2" height="14" fill="${PALETTE.grass.mid}"/>
                <rect x="4" y="12" width="2" height="20" fill="${PALETTE.grass.mid}"/>
                <rect x="8" y="14" width="2" height="18" fill="${PALETTE.grass.mid}"/>
                <rect x="12" y="10" width="2" height="22" fill="${PALETTE.grass.mid}"/>
                <rect x="16" y="14" width="2" height="18" fill="${PALETTE.grass.mid}"/>
                <rect x="20" y="12" width="2" height="20" fill="${PALETTE.grass.mid}"/>
                <rect x="24" y="16" width="2" height="16" fill="${PALETTE.grass.mid}"/>
                <rect x="28" y="14" width="2" height="18" fill="${PALETTE.grass.mid}"/>
            </svg>`
        ],

        // WATER - 3 animated frames
        water: [
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.water.mid}"/>
                <rect x="0" y="8" width="32" height="2" fill="${PALETTE.water.light}"/>
                <rect x="0" y="16" width="32" height="2" fill="${PALETTE.water.dark}"/>
                <rect x="0" y="24" width="32" height="2" fill="${PALETTE.water.light}"/>
                <rect x="4" y="12" width="2" height="2" fill="${PALETTE.water.light}"/>
                <rect x="16" y="20" width="2" height="2" fill="${PALETTE.water.light}"/>
                <rect x="24" y="14" width="2" height="2" fill="${PALETTE.water.light}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.water.mid}"/>
                <rect x="0" y="10" width="32" height="2" fill="${PALETTE.water.light}"/>
                <rect x="0" y="18" width="32" height="2" fill="${PALETTE.water.dark}"/>
                <rect x="0" y="26" width="32" height="2" fill="${PALETTE.water.light}"/>
                <rect x="8" y="14" width="2" height="2" fill="${PALETTE.water.light}"/>
                <rect x="20" y="22" width="2" height="2" fill="${PALETTE.water.light}"/>
                <rect x="28" y="16" width="2" height="2" fill="${PALETTE.water.light}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.water.mid}"/>
                <rect x="0" y="12" width="32" height="2" fill="${PALETTE.water.light}"/>
                <rect x="0" y="20" width="32" height="2" fill="${PALETTE.water.dark}"/>
                <rect x="0" y="28" width="32" height="2" fill="${PALETTE.water.light}"/>
                <rect x="12" y="16" width="2" height="2" fill="${PALETTE.water.light}"/>
                <rect x="24" y="24" width="2" height="2" fill="${PALETTE.water.light}"/>
                <rect x="6" y="18" width="2" height="2" fill="${PALETTE.water.light}"/>
            </svg>`
        ],

        // SAND - 3 variants
        sand: [
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.sand.light}"/>
                <rect x="6" y="8" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="14" y="6" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="22" y="12" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="10" y="18" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="20" y="24" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="28" y="20" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.sand.light}"/>
                <rect x="4" y="10" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="18" y="8" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="26" y="14" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="8" y="20" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="16" y="26" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="24" y="22" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.sand.light}"/>
                <rect x="8" y="6" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="20" y="10" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="12" y="16" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="6" y="22" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="18" y="24" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
                <rect x="28" y="26" width="2" height="2" fill="${PALETTE.sand.shadow}"/>
            </svg>`
        ],

        // PATH - 4 variants with wear patterns
        path: [
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.wood.mid}"/>
                <rect x="8" y="10" width="4" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="18" y="8" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="12" y="18" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="22" y="20" width="4" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="6" y="24" width="3" height="2" fill="${PALETTE.wood.dark}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.wood.mid}"/>
                <rect x="10" y="6" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="20" y="12" width="4" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="14" y="16" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="24" y="22" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="8" y="26" width="4" height="2" fill="${PALETTE.wood.dark}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.wood.mid}"/>
                <rect x="6" y="8" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="16" y="10" width="4" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="10" y="20" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="20" y="18" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="26" y="24" width="4" height="2" fill="${PALETTE.wood.dark}"/>
            </svg>`,
            `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" fill="${PALETTE.wood.mid}"/>
                <rect x="12" y="8" width="4" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="22" y="14" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="16" y="22" width="3" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="8" y="18" width="4" height="2" fill="${PALETTE.wood.dark}"/>
                <rect x="28" y="26" width="3" height="2" fill="${PALETTE.wood.dark}"/>
            </svg>`
        ],

        // BUILDING - Simple structure
        building: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="${PALETTE.wood.dark}"/>
            <!-- Roof -->
            <path d="M 2,16 L 16,4 L 30,16 Z" fill="${PALETTE.lighthouse.roof}"/>
            <rect x="3" y="16" width="26" height="2" fill="${PALETTE.lighthouse.roof}"/>
            <!-- Walls -->
            <rect x="6" y="18" width="20" height="14" fill="${PALETTE.wood.mid}"/>
            <!-- Door -->
            <rect x="12" y="22" width="8" height="10" fill="${PALETTE.wood.dark}"/>
            <!-- Windows -->
            <rect x="8" y="20" width="4" height="4" fill="${PALETTE.water.light}"/>
            <rect x="20" y="20" width="4" height="4" fill="${PALETTE.water.light}"/>
        </svg>`,

        // DOOR
        door: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="${PALETTE.wood.mid}"/>
            <rect x="10" y="6" width="12" height="20" fill="${PALETTE.wood.dark}"/>
            <rect x="18" y="16" width="2" height="2" fill="${PALETTE.wood.light}"/>
        </svg>`,

        // LIGHTHOUSE - Placeholder tile (actual lighthouse is drawn separately)
        lighthouse: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="${PALETTE.sand.light}"/>
        </svg>`,

        // TREE - Pixelated
        tree: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Trunk -->
            <rect x="14" y="18" width="4" height="10" fill="${PALETTE.wood.dark}"/>
            <!-- Canopy - layered squares -->
            <rect x="8" y="12" width="16" height="8" fill="${PALETTE.grass.dark}"/>
            <rect x="10" y="10" width="12" height="6" fill="${PALETTE.grass.mid}"/>
            <rect x="12" y="8" width="8" height="6" fill="${PALETTE.grass.light}"/>
        </svg>`,

        // SHOP
        shop: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Awning -->
            <rect x="4" y="14" width="24" height="2" fill="${PALETTE.lighthouse.roof}"/>
            <path d="M 4,16 L 4,18 L 28,18 L 28,16" fill="${PALETTE.lighthouse.roof}"/>
            <!-- Building -->
            <rect x="6" y="18" width="20" height="14" fill="${PALETTE.wood.mid}"/>
            <!-- Window -->
            <rect x="10" y="20" width="12" height="6" fill="${PALETTE.water.light}"/>
            <rect x="10" y="20" width="12" height="1" fill="#fff"/>
            <!-- Door -->
            <rect x="14" y="28" width="4" height="4" fill="${PALETTE.wood.dark}"/>
        </svg>`,

        // COUNTER
        counter: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="${PALETTE.wood.mid}"/>
            <rect x="4" y="12" width="24" height="8" fill="${PALETTE.wood.dark}"/>
            <rect x="4" y="12" width="24" height="2" fill="${PALETTE.wood.light}"/>
        </svg>`
    },

    // ===== STRUCTURES - Large multi-tile structures =====
    structures: {
        // Large lighthouse (2x4 tiles = 64x128 pixels) - THE focal point
        lighthouse: `<svg viewBox="0 0 64 128" xmlns="http://www.w3.org/2000/svg">
            <!-- Base platform -->
            <rect x="8" y="110" width="48" height="18" fill="${PALETTE.sand.shadow}"/>
            <!-- Main tower -->
            <rect x="20" y="30" width="24" height="80" fill="${PALETTE.lighthouse.white}"/>
            <!-- Tower highlights -->
            <rect x="20" y="30" width="2" height="80" fill="#fff" opacity="0.3"/>
            <!-- Red stripes -->
            <rect x="20" y="50" width="24" height="6" fill="${PALETTE.lighthouse.roof}"/>
            <rect x="20" y="70" width="24" height="6" fill="${PALETTE.lighthouse.roof}"/>
            <rect x="20" y="90" width="24" height="6" fill="${PALETTE.lighthouse.roof}"/>
            <!-- Top housing -->
            <rect x="16" y="20" width="32" height="10" fill="${PALETTE.lighthouse.roof}"/>
            <rect x="16" y="20" width="32" height="2" fill="#d47070"/>
            <!-- Light chamber -->
            <rect x="22" y="10" width="20" height="10" fill="#ffd700"/>
            <rect x="24" y="12" width="16" height="6" fill="#ffed4e"/>
            <!-- Light top -->
            <rect x="28" y="6" width="8" height="4" fill="${PALETTE.lighthouse.roof}"/>
            <!-- Light beam effect -->
            <rect x="30" y="0" width="4" height="6" fill="#ffd700" opacity="0.6"/>
            <rect x="0" y="14" width="20" height="2" fill="#ffd700" opacity="0.3"/>
            <rect x="44" y="14" width="20" height="2" fill="#ffd700" opacity="0.3"/>
            <!-- Door -->
            <rect x="26" y="96" width="12" height="14" fill="${PALETTE.wood.dark}"/>
            <rect x="28" y="98" width="8" height="10" fill="${PALETTE.wood.mid}" opacity="0.3"/>
            <rect x="35" y="103" width="2" height="2" fill="${PALETTE.wood.light}"/>
            <!-- Windows (multiple floors) -->
            <rect x="24" y="40" width="4" height="6" fill="${PALETTE.water.light}"/>
            <rect x="36" y="40" width="4" height="6" fill="${PALETTE.water.light}"/>
            <rect x="24" y="60" width="4" height="6" fill="${PALETTE.water.light}"/>
            <rect x="36" y="60" width="4" height="6" fill="${PALETTE.water.light}"/>
            <rect x="24" y="80" width="4" height="6" fill="${PALETTE.water.light}"/>
            <rect x="36" y="80" width="4" height="6" fill="${PALETTE.water.light}"/>
            <!-- Window highlights -->
            <rect x="24" y="40" width="4" height="1" fill="#e0f3ff" opacity="0.6"/>
            <rect x="36" y="40" width="4" height="1" fill="#e0f3ff" opacity="0.6"/>
            <rect x="24" y="60" width="4" height="1" fill="#e0f3ff" opacity="0.6"/>
            <rect x="36" y="60" width="4" height="1" fill="#e0f3ff" opacity="0.6"/>
        </svg>`
    },

    // ===== UI ICONS - Pixel style =====
    icons: {
        coin: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" fill="#ffd700"/>
            <circle cx="8" cy="8" r="4" fill="none" stroke="#d4a83d" stroke-width="1"/>
            <text x="8" y="11" text-anchor="middle" font-size="8" font-weight="bold" fill="#d4a83d">$</text>
        </svg>`,

        heart: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="3" height="3" fill="#ff6b6b"/>
            <rect x="9" y="4" width="3" height="3" fill="#ff6b6b"/>
            <rect x="3" y="7" width="10" height="3" fill="#ff6b6b"/>
            <rect x="4" y="10" width="8" height="2" fill="#ff6b6b"/>
            <rect x="6" y="12" width="4" height="2" fill="#ff6b6b"/>
        </svg>`,

        compass: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" fill="${PALETTE.sand.light}" stroke="${PALETTE.wood.dark}" stroke-width="1"/>
            <circle cx="8" cy="8" r="4" fill="none" stroke="${PALETTE.wood.mid}" stroke-width="1"/>
            <!-- N marker -->
            <rect x="7" y="3" width="2" height="3" fill="${PALETTE.lighthouse.roof}"/>
            <!-- Center -->
            <circle cx="8" cy="8" r="1.5" fill="${PALETTE.wood.dark}"/>
        </svg>`
    }
};

// SVG Loader with animation support
class SVGLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
        this.animationFrame = 0; // Global animation counter
        this.lastAnimationTime = 0;
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

    // Get tile variant based on position (deterministic randomness)
    getTileVariant(tileArray, x, y) {
        if (!Array.isArray(tileArray)) return tileArray;
        const index = (x * 7 + y * 13) % tileArray.length;
        return tileArray[index];
    }

    // Get animated water frame
    getWaterFrame() {
        return SVGAssets.tiles.water[this.animationFrame % SVGAssets.tiles.water.length];
    }

    // Update animation frame
    updateAnimation(timestamp) {
        if (timestamp - this.lastAnimationTime > 500) { // 500ms per frame
            this.animationFrame++;
            this.lastAnimationTime = timestamp;
        }
    }

    async preloadAll() {
        const promises = [];

        // Characters
        for (const char of Object.values(SVGAssets.player)) {
            promises.push(this.loadSVG(char));
        }

        // NPCs
        for (const npc of Object.values(SVGAssets.npcs)) {
            promises.push(this.loadSVG(npc));
        }

        // Creatures
        for (const creature of Object.values(SVGAssets.creatures)) {
            promises.push(this.loadSVG(creature));
        }

        // Tiles - load all variants
        for (const [key, tile] of Object.entries(SVGAssets.tiles)) {
            if (Array.isArray(tile)) {
                for (const variant of tile) {
                    promises.push(this.loadSVG(variant));
                }
            } else {
                promises.push(this.loadSVG(tile));
            }
        }

        // Structures (large multi-tile sprites)
        for (const structure of Object.values(SVGAssets.structures)) {
            promises.push(this.loadSVG(structure, 64, 128));
        }

        // Icons
        for (const icon of Object.values(SVGAssets.icons)) {
            promises.push(this.loadSVG(icon, 16, 16));
        }

        await Promise.all(promises);
    }
}

const svgLoader = new SVGLoader();
