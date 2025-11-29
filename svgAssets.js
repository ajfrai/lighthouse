// SVG Assets - Modern 2025 quality with depth and polish
// Professional indie game aesthetic with gradients, shadows, and refined details

const SVGAssets = {
    // ===== CHARACTERS - Top-down view with depth and detail =====
    player: {
        explorer: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="explorerShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#000;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="explorerSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#fde8d0"/>
                    <stop offset="100%" style="stop-color:#f4d4b0"/>
                </linearGradient>
                <linearGradient id="explorerHat" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#d4a574"/>
                    <stop offset="100%" style="stop-color:#a8834e"/>
                </linearGradient>
            </defs>
            <ellipse cx="16" cy="28" rx="8" ry="3" fill="url(#explorerShadow)"/>
            <ellipse cx="16" cy="22" rx="7" ry="9" fill="#8b6f47" stroke="#5d4937" stroke-width="0.8"/>
            <circle cx="16" cy="13" r="7" fill="url(#explorerSkin)" stroke="#d4a574" stroke-width="0.8"/>
            <path d="M 9,9 Q 16,6 23,9 L 23,13 Q 16,15 9,13 Z" fill="url(#explorerHat)" stroke="#8b6f47" stroke-width="0.8"/>
            <circle cx="13" cy="13" r="1.2" fill="#3d2817"/>
            <circle cx="19" cy="13" r="1.2" fill="#3d2817"/>
            <path d="M 13,16 Q 16,17 19,16" stroke="#d4a574" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <path d="M 12,10 L 14,11" stroke="#a8834e" stroke-width="1.2" stroke-linecap="round"/>
        </svg>`,
        scholar: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="scholarShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#000;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="scholarSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#fde8d0"/>
                    <stop offset="100%" style="stop-color:#f4d4b0"/>
                </linearGradient>
                <linearGradient id="scholarRobe" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#5fa8d3"/>
                    <stop offset="100%" style="stop-color:#3d7fa8"/>
                </linearGradient>
            </defs>
            <ellipse cx="16" cy="28" rx="8" ry="3" fill="url(#scholarShadow)"/>
            <ellipse cx="16" cy="22" rx="7" ry="9" fill="url(#scholarRobe)" stroke="#2c5d8f" stroke-width="0.8"/>
            <circle cx="16" cy="13" r="7" fill="url(#scholarSkin)" stroke="#d4a574" stroke-width="0.8"/>
            <rect x="10" y="7" width="12" height="5" rx="1" fill="#1a1a2e" stroke="#0d0d17" stroke-width="0.8"/>
            <rect x="14" y="9" width="4" height="1.5" fill="#ffd700" opacity="0.8"/>
            <circle cx="13" cy="13" r="1.2" fill="#3d2817"/>
            <circle cx="19" cy="13" r="1.2" fill="#3d2817"/>
            <path d="M 13,16 Q 16,17 19,16" stroke="#d4a574" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <path d="M 14,22 L 16,26 L 18,22" stroke="#2c5d8f" stroke-width="0.8" fill="none" opacity="0.6"/>
        </svg>`,
        sailor: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="sailorShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#000;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="sailorSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#fde8d0"/>
                    <stop offset="100%" style="stop-color:#f4d4b0"/>
                </linearGradient>
                <linearGradient id="sailorShirt" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#6dd4a8"/>
                    <stop offset="100%" style="stop-color:#4aa87c"/>
                </linearGradient>
            </defs>
            <ellipse cx="16" cy="28" rx="8" ry="3" fill="url(#sailorShadow)"/>
            <ellipse cx="16" cy="22" rx="7" ry="9" fill="url(#sailorShirt)" stroke="#3d8266" stroke-width="0.8"/>
            <rect x="13" y="20" width="6" height="2" fill="#fff" opacity="0.9"/>
            <circle cx="16" cy="13" r="7" fill="url(#sailorSkin)" stroke="#d4a574" stroke-width="0.8"/>
            <path d="M 11,8 L 11,11 L 21,11 L 21,8 Q 16,7 11,8" fill="#fff" stroke="#2c5d8f" stroke-width="0.8"/>
            <rect x="11" y="9" width="10" height="1.5" fill="#2c5d8f"/>
            <circle cx="13" cy="13" r="1.2" fill="#3d2817"/>
            <circle cx="19" cy="13" r="1.2" fill="#3d2817"/>
            <path d="M 13,16 Q 16,17 19,16" stroke="#d4a574" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </svg>`,
        mage: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="mageShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#000;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="mageSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#fde8d0"/>
                    <stop offset="100%" style="stop-color:#f4d4b0"/>
                </linearGradient>
                <linearGradient id="mageRobe" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#b888d6"/>
                    <stop offset="100%" style="stop-color:#8b5fbf"/>
                </linearGradient>
                <radialGradient id="starGlow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#fff;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#ffd700;stop-opacity:0"/>
                </radialGradient>
            </defs>
            <ellipse cx="16" cy="28" rx="8" ry="3" fill="url(#mageShadow)"/>
            <ellipse cx="16" cy="22" rx="7" ry="9" fill="url(#mageRobe)" stroke="#6a3d7c" stroke-width="0.8"/>
            <circle cx="16" cy="13" r="7" fill="url(#mageSkin)" stroke="#d4a574" stroke-width="0.8"/>
            <path d="M 16,4 L 13,9 L 19,9 Z" fill="url(#mageRobe)" stroke="#6a3d7c" stroke-width="0.8"/>
            <path d="M 14,8 Q 16,6 18,8" stroke="#6a3d7c" stroke-width="0.5" fill="none"/>
            <circle cx="16" cy="7" r="2" fill="url(#starGlow)"/>
            <path d="M 16,5.5 L 16,8.5 M 14.5,7 L 17.5,7" stroke="#ffd700" stroke-width="1.2" stroke-linecap="round"/>
            <circle cx="13" cy="13" r="1.2" fill="#3d2817"/>
            <circle cx="19" cy="13" r="1.2" fill="#3d2817"/>
            <path d="M 13,16 Q 16,17 19,16" stroke="#d4a574" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <path d="M 12,24 Q 14,26 16,24 Q 18,26 20,24" stroke="#6a3d7c" stroke-width="0.8" fill="none" opacity="0.4"/>
        </svg>`
    },

    npcs: {
        keeper: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="keeperShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#000;stop-opacity:0.4"/>
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="keeperCoat" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#7a9b87"/>
                    <stop offset="100%" style="stop-color:#5d7a68"/>
                </linearGradient>
                <linearGradient id="keeperSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#e8d4b8"/>
                    <stop offset="100%" style="stop-color:#d4bfa0"/>
                </linearGradient>
            </defs>
            <ellipse cx="16" cy="28" rx="7" ry="3" fill="url(#keeperShadow)"/>
            <ellipse cx="15" cy="21" rx="6" ry="8" fill="url(#keeperCoat)" stroke="#4a5f52" stroke-width="0.8"/>
            <circle cx="15" cy="12" r="6" fill="url(#keeperSkin)" stroke="#b8a890" stroke-width="0.8"/>
            <path d="M 10,11 Q 11,10 12,11" stroke="#999" stroke-width="1.2" fill="none" stroke-linecap="round"/>
            <path d="M 10,10 Q 13,8 16,10" stroke="#d4d4d4" stroke-width="0.8" fill="none"/>
            <circle cx="12" cy="12" r="0.9" fill="#5a5a5a"/>
            <circle cx="18" cy="12" r="0.9" fill="#5a5a5a"/>
            <path d="M 12,15 Q 14,15.5 16,15" stroke="#b8a890" stroke-width="0.8" fill="none" stroke-linecap="round"/>
            <line x1="21" y1="18" x2="25" y2="28" stroke="#8b7355" stroke-width="2" stroke-linecap="round"/>
            <circle cx="25" cy="28" r="1.5" fill="#6b5b3e"/>
            <path d="M 13,19 L 15,22" stroke="#4a5f52" stroke-width="0.8" opacity="0.6"/>
        </svg>`,
        fisherman: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="fishermanShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#000;stop-opacity:0.3"/>
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="fishermanJacket" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff9d5c"/>
                    <stop offset="100%" style="stop-color:#e67a42"/>
                </linearGradient>
                <linearGradient id="fishermanSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#f4d4b0"/>
                    <stop offset="100%" style="stop-color:#d4b890"/>
                </linearGradient>
            </defs>
            <ellipse cx="16" cy="28" rx="8" ry="3" fill="url(#fishermanShadow)"/>
            <ellipse cx="16" cy="21" rx="7" ry="9" fill="url(#fishermanJacket)" stroke="#c45d2f" stroke-width="0.8"/>
            <circle cx="16" cy="12" r="6.5" fill="url(#fishermanSkin)" stroke="#c4a880" stroke-width="0.8"/>
            <path d="M 11,9 L 21,9 L 21,11 Q 16,12 11,11 Z" fill="#ffd966" stroke="#d4a83d" stroke-width="0.8"/>
            <rect x="14" y="10" width="4" height="0.8" fill="#d4a83d"/>
            <circle cx="13" cy="12" r="1.1" fill="#3d2817"/>
            <circle cx="19" cy="12" r="1.1" fill="#3d2817"/>
            <path d="M 13,15 Q 16,16 19,15" stroke="#c4a880" stroke-width="0.9" fill="none" stroke-linecap="round"/>
            <path d="M 11,17 Q 13,18 15,17" stroke="#8b6f47" stroke-width="0.8" fill="none"/>
            <path d="M 12,21 L 14,25" stroke="#c45d2f" stroke-width="0.8" opacity="0.6"/>
            <circle cx="18" cy="23" r="1.2" fill="#ffd966" opacity="0.8"/>
        </svg>`
    },

    creatures: {
        shellback: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="shellbackShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#000;stop-opacity:0.4"/>
                    <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="shellGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#a89674"/>
                    <stop offset="50%" style="stop-color:#8b7355"/>
                    <stop offset="100%" style="stop-color:#6b5b3e"/>
                </linearGradient>
                <radialGradient id="shellHighlight" cx="30%" cy="30%">
                    <stop offset="0%" style="stop-color:#c4a880;stop-opacity:0.6"/>
                    <stop offset="100%" style="stop-color:#8b7355;stop-opacity:0"/>
                </radialGradient>
            </defs>
            <ellipse cx="16" cy="26" rx="12" ry="4" fill="url(#shellbackShadow)"/>
            <ellipse cx="16" cy="19" rx="11" ry="9" fill="url(#shellGradient)" stroke="#5d4e37" stroke-width="1"/>
            <ellipse cx="16" cy="19" rx="11" ry="9" fill="url(#shellHighlight)"/>
            <path d="M 16,10 Q 12,14 10,18 Q 12,16 16,16 Q 20,16 22,18 Q 20,14 16,10"
                  fill="#6b5b3e" stroke="#4a3d2a" stroke-width="0.8" opacity="0.7"/>
            <circle cx="16" cy="19" r="6" fill="#5d4e37" opacity="0.4"/>
            <path d="M 16,13 L 13,16 L 16,19 L 19,16 Z" stroke="#4a3d2a" stroke-width="0.8" fill="none"/>
            <path d="M 13,16 L 10,19 L 13,22 Z M 19,16 L 22,19 L 19,22 Z"
                  fill="#7a6b4f" stroke="#5d4e37" stroke-width="0.8"/>
            <ellipse cx="11" cy="14" rx="2.5" ry="2" fill="#7a6b4f" stroke="#5d4e37" stroke-width="0.8"/>
            <ellipse cx="21" cy="14" rx="2.5" ry="2" fill="#7a6b4f" stroke="#5d4e37" stroke-width="0.8"/>
            <circle cx="11" cy="14" r="1.2" fill="#3d2817"/>
            <circle cx="21" cy="14" r="1.2" fill="#3d2817"/>
            <circle cx="11.5" cy="13.5" r="0.4" fill="#fff" opacity="0.8"/>
            <circle cx="21.5" cy="13.5" r="0.4" fill="#fff" opacity="0.8"/>
        </svg>`,
        seasprite: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="spriteShadow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#1e4d8b;stop-opacity:0.4"/>
                    <stop offset="100%" style="stop-color:#1e4d8b;stop-opacity:0"/>
                </radialGradient>
                <linearGradient id="spriteBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#6db8ff"/>
                    <stop offset="50%" style="stop-color:#4da6ff"/>
                    <stop offset="100%" style="stop-color:#2c7fb8"/>
                </linearGradient>
                <radialGradient id="spriteGlow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#e0f3ff;stop-opacity:0.9"/>
                    <stop offset="100%" style="stop-color:#4da6ff;stop-opacity:0"/>
                </radialGradient>
            </defs>
            <ellipse cx="16" cy="26" rx="10" ry="3" fill="url(#spriteShadow)"/>
            <path d="M 16,6 Q 11,10 12,15 Q 9,17 10,21 Q 12,19 14,21 Q 15,19 16,21 Q 17,19 18,21 Q 20,19 22,21 Q 23,17 20,15 Q 21,10 16,6"
                  fill="url(#spriteBody)" stroke="#2c7fb8" stroke-width="1" opacity="0.9"/>
            <ellipse cx="16" cy="14" rx="8" ry="10" fill="url(#spriteGlow)"/>
            <circle cx="13" cy="13" r="2.5" fill="#e0f3ff" opacity="0.9"/>
            <circle cx="19" cy="13" r="2.5" fill="#e0f3ff" opacity="0.9"/>
            <circle cx="12.5" cy="13" r="1" fill="#2c5d8f"/>
            <circle cx="18.5" cy="13" r="1" fill="#2c5d8f"/>
            <circle cx="12.8" cy="12.5" r="0.4" fill="#fff"/>
            <circle cx="18.8" cy="12.5" r="0.4" fill="#fff"/>
            <path d="M 10,23 Q 12,26 14,24 Q 15,25 16,24 Q 17,25 18,24 Q 20,26 22,23"
                  stroke="#2c7fb8" stroke-width="1.2" fill="none" opacity="0.6" stroke-linecap="round"/>
            <path d="M 12,18 Q 14,19 16,18 Q 18,19 20,18"
                  stroke="#e0f3ff" stroke-width="0.8" fill="none" opacity="0.5" stroke-linecap="round"/>
            <circle cx="16" cy="10" r="1.5" fill="#fff" opacity="0.6"/>
        </svg>`
    },

    // ===== TILES - Professional quality with depth =====
    tiles: {
        grass: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grassBase" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#3d6b21"/>
                    <stop offset="100%" style="stop-color:#2d5016"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="url(#grassBase)"/>
            <path d="M 4,28 Q 4,23 6,23 Q 6,28 8,28" fill="#4a7c2f" opacity="0.5"/>
            <path d="M 12,30 Q 12,25 14,25 Q 14,30 16,30" fill="#4a7c2f" opacity="0.6"/>
            <path d="M 20,27 Q 20,22 22,22 Q 22,27 24,27" fill="#4a7c2f" opacity="0.5"/>
            <path d="M 28,29 Q 28,24 30,24 Q 30,29 32,29" fill="#4a7c2f" opacity="0.4"/>
            <circle cx="8" cy="12" r="1.5" fill="#4a7c2f" opacity="0.3"/>
            <circle cx="18" cy="18" r="1" fill="#4a7c2f" opacity="0.3"/>
            <circle cx="26" cy="8" r="1.2" fill="#4a7c2f" opacity="0.3"/>
        </svg>`,
        tallGrass: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="tallGrassBase" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#4a7c2f"/>
                    <stop offset="100%" style="stop-color:#3d6b21"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="url(#tallGrassBase)"/>
            <path d="M 3,32 Q 4,16 5,32" stroke="#2d5016" stroke-width="2" fill="none" opacity="0.7"/>
            <path d="M 8,32 Q 9,14 10,32" stroke="#2d5016" stroke-width="2.5" fill="none" opacity="0.8"/>
            <path d="M 13,32 Q 14,18 15,32" stroke="#2d5016" stroke-width="2" fill="none" opacity="0.7"/>
            <path d="M 18,32 Q 19,12 20,32" stroke="#2d5016" stroke-width="2.5" fill="none" opacity="0.8"/>
            <path d="M 23,32 Q 24,16 25,32" stroke="#2d5016" stroke-width="2" fill="none" opacity="0.7"/>
            <path d="M 28,32 Q 29,20 30,32" stroke="#2d5016" stroke-width="2" fill="none" opacity="0.7"/>
            <path d="M 6,32 Q 6.5,22 7,32" stroke="#5a8f3d" stroke-width="1.5" fill="none" opacity="0.5"/>
            <path d="M 16,32 Q 16.5,24 17,32" stroke="#5a8f3d" stroke-width="1.5" fill="none" opacity="0.5"/>
            <path d="M 26,32 Q 26.5,26 27,32" stroke="#5a8f3d" stroke-width="1.5" fill="none" opacity="0.5"/>
        </svg>`,
        water: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#2c7fb8"/>
                    <stop offset="100%" style="stop-color:#1e4d8b"/>
                </linearGradient>
                <radialGradient id="waterHighlight" cx="30%" cy="30%">
                    <stop offset="0%" style="stop-color:#4da6ff;stop-opacity:0.4"/>
                    <stop offset="100%" style="stop-color:#1e4d8b;stop-opacity:0"/>
                </radialGradient>
            </defs>
            <rect width="32" height="32" fill="url(#waterGradient)"/>
            <rect width="32" height="32" fill="url(#waterHighlight)"/>
            <path d="M 0,10 Q 6,8 12,10 Q 18,12 24,10 Q 28,9 32,10"
                  stroke="#4da6ff" stroke-width="1.5" fill="none" opacity="0.5"/>
            <path d="M 0,18 Q 8,16 16,18 Q 24,20 32,18"
                  stroke="#4da6ff" stroke-width="1.5" fill="none" opacity="0.5"/>
            <path d="M 0,26 Q 6,24 12,26 Q 20,28 28,26 L 32,26"
                  stroke="#4da6ff" stroke-width="1.5" fill="none" opacity="0.5"/>
            <circle cx="10" cy="14" r="1.5" fill="#6db8ff" opacity="0.4"/>
            <circle cx="22" cy="22" r="1.2" fill="#6db8ff" opacity="0.4"/>
            <circle cx="8" cy="28" r="1" fill="#6db8ff" opacity="0.3"/>
        </svg>`,
        sand: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#f0e0c0"/>
                    <stop offset="100%" style="stop-color:#d4c4a0"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="url(#sandGradient)"/>
            <circle cx="6" cy="8" r="0.6" fill="#c9b880" opacity="0.6"/>
            <circle cx="14" cy="6" r="0.5" fill="#c9b880" opacity="0.5"/>
            <circle cx="10" cy="14" r="0.7" fill="#c9b880" opacity="0.6"/>
            <circle cx="22" cy="12" r="0.6" fill="#c9b880" opacity="0.5"/>
            <circle cx="18" cy="20" r="0.5" fill="#c9b880" opacity="0.6"/>
            <circle cx="26" cy="18" r="0.7" fill="#c9b880" opacity="0.5"/>
            <circle cx="8" cy="26" r="0.6" fill="#c9b880" opacity="0.6"/>
            <circle cx="20" cy="28" r="0.5" fill="#c9b880" opacity="0.5"/>
            <circle cx="28" cy="26" r="0.6" fill="#c9b880" opacity="0.6"/>
            <path d="M 4,16 Q 6,15 8,16" stroke="#c9b880" stroke-width="0.3" opacity="0.3"/>
            <path d="M 24,8 Q 26,7 28,8" stroke="#c9b880" stroke-width="0.3" opacity="0.3"/>
        </svg>`,
        path: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#9d8668"/>
                    <stop offset="100%" style="stop-color:#8b7355"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="url(#pathGradient)"/>
            <ellipse cx="8" cy="10" rx="3" ry="1.5" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="22" cy="8" rx="2.5" ry="1.2" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="14" cy="16" rx="2" ry="1" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="24" cy="18" rx="3" ry="1.5" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="10" cy="24" rx="2.5" ry="1.2" fill="#6b5b3e" opacity="0.3"/>
            <ellipse cx="26" cy="26" rx="2" ry="1" fill="#6b5b3e" opacity="0.3"/>
            <circle cx="18" cy="12" r="0.6" fill="#a8936e" opacity="0.4"/>
            <circle cx="6" cy="20" r="0.5" fill="#a8936e" opacity="0.4"/>
            <circle cx="28" cy="14" r="0.6" fill="#a8936e" opacity="0.4"/>
        </svg>`,
        building: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#a05d3d"/>
                    <stop offset="100%" style="stop-color:#8b4513"/>
                </linearGradient>
                <linearGradient id="wallGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#9d8668"/>
                    <stop offset="100%" style="stop-color:#8b7355"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="#6b5b3e"/>
            <path d="M 3,17 L 16,5 L 29,17" fill="url(#roofGradient)" stroke="#5d3620" stroke-width="1"/>
            <path d="M 3,17 L 16,5" stroke="#b87d5d" stroke-width="0.5" opacity="0.6"/>
            <rect x="6" y="17" width="20" height="15" fill="url(#wallGradient)" stroke="#6b5b3e" stroke-width="1"/>
            <rect x="12" y="21" width="8" height="11" fill="#5d4e37" stroke="#3d2b17" stroke-width="0.8"/>
            <rect x="13" y="22" width="6" height="5" fill="#4a3520" opacity="0.6"/>
            <rect x="8" y="19" width="4" height="5" fill="#6db8ff" stroke="#4da6ff" stroke-width="0.6" opacity="0.7"/>
            <rect x="20" y="19" width="4" height="5" fill="#6db8ff" stroke="#4da6ff" stroke-width="0.6" opacity="0.7"/>
            <line x1="8" y1="21.5" x2="12" y2="21.5" stroke="#4da6ff" stroke-width="0.5" opacity="0.8"/>
            <line x1="20" y1="21.5" x2="24" y2="21.5" stroke="#4da6ff" stroke-width="0.5" opacity="0.8"/>
        </svg>`,
        door: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="doorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#6b5b3e"/>
                    <stop offset="100%" style="stop-color:#4a3520"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="#5d4e37"/>
            <rect x="9" y="6" width="14" height="20" fill="url(#doorGradient)" stroke="#3d2b17" stroke-width="1"/>
            <rect x="10" y="7" width="12" height="18" fill="#654321" opacity="0.3"/>
            <circle cx="19" cy="17" r="1.2" fill="#c9a870"/>
            <circle cx="19" cy="17" r="0.6" fill="#3d2b17"/>
            <line x1="10" y1="26" x2="22" y2="26" stroke="#3d2b17" stroke-width="1"/>
            <line x1="16" y1="7" x2="16" y2="25" stroke="#3d2b17" stroke-width="0.5" opacity="0.5"/>
            <rect x="11" y="9" width="4" height="6" fill="#4a3520" opacity="0.3"/>
            <rect x="17" y="9" width="4" height="6" fill="#4a3520" opacity="0.3"/>
        </svg>`,
        lighthouse: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="towerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#fff"/>
                    <stop offset="100%" style="stop-color:#e8e8e8"/>
                </linearGradient>
                <linearGradient id="topGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#e85d5d"/>
                    <stop offset="100%" style="stop-color:#cc3333"/>
                </linearGradient>
                <radialGradient id="lightGlow" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#fff;stop-opacity:1"/>
                    <stop offset="50%" style="stop-color:#ffd700;stop-opacity:0.8"/>
                    <stop offset="100%" style="stop-color:#ffd700;stop-opacity:0"/>
                </radialGradient>
            </defs>
            <rect x="11" y="8" width="10" height="20" fill="url(#towerGradient)" stroke="#d4d4d4" stroke-width="1"/>
            <rect x="11.5" y="8" width="1" height="20" fill="#fff" opacity="0.5"/>
            <rect x="9" y="4" width="14" height="4" fill="url(#topGradient)" stroke="#991111" stroke-width="0.8"/>
            <rect x="9" y="4" width="14" height="1" fill="#ff8d8d" opacity="0.6"/>
            <circle cx="16" cy="6" r="3" fill="url(#lightGlow)"/>
            <circle cx="16" cy="6" r="1.5" fill="#ffd700"/>
            <line x1="16" y1="6" x2="16" y2="1" stroke="#ffd700" stroke-width="1.5" opacity="0.8" stroke-linecap="round"/>
            <line x1="16" y1="6" x2="10" y2="8" stroke="#ffd700" stroke-width="1" opacity="0.5"/>
            <line x1="16" y1="6" x2="22" y2="8" stroke="#ffd700" stroke-width="1" opacity="0.5"/>
            <rect x="14" y="20" width="4" height="8" fill="#5d4e37" stroke="#3d2b17" stroke-width="0.8"/>
            <rect x="14.5" y="21" width="3" height="3" fill="#4a3520" opacity="0.4"/>
            <rect x="12" y="12" width="2" height="2" fill="#6db8ff" stroke="#4da6ff" stroke-width="0.4" opacity="0.7"/>
            <rect x="18" y="12" width="2" height="2" fill="#6db8ff" stroke="#4da6ff" stroke-width="0.4" opacity="0.7"/>
            <rect x="12" y="16" width="2" height="2" fill="#6db8ff" stroke="#4da6ff" stroke-width="0.4" opacity="0.7"/>
            <rect x="18" y="16" width="2" height="2" fill="#6db8ff" stroke="#4da6ff" stroke-width="0.4" opacity="0.7"/>
        </svg>`,
        tree: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#5d4e37"/>
                    <stop offset="50%" style="stop-color:#6b5b3e"/>
                    <stop offset="100%" style="stop-color:#4a3d2a"/>
                </linearGradient>
                <radialGradient id="canopy1" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#3d6b21"/>
                    <stop offset="100%" style="stop-color:#1a3d0f"/>
                </radialGradient>
                <radialGradient id="canopy2" cx="40%" cy="40%">
                    <stop offset="0%" style="stop-color:#4a7c2f"/>
                    <stop offset="100%" style="stop-color:#2d5016"/>
                </radialGradient>
            </defs>
            <rect x="13" y="18" width="6" height="12" rx="1" fill="url(#trunkGradient)" stroke="#3d2b17" stroke-width="0.8"/>
            <rect x="13.5" y="18" width="1" height="12" fill="#8b7355" opacity="0.3"/>
            <circle cx="16" cy="12" r="11" fill="url(#canopy1)"/>
            <circle cx="12" cy="10" r="7" fill="url(#canopy2)" opacity="0.8"/>
            <circle cx="20" cy="10" r="7" fill="url(#canopy2)" opacity="0.8"/>
            <circle cx="16" cy="8" r="6" fill="#3d6b21" opacity="0.9"/>
            <circle cx="18" cy="11" r="3" fill="#4a7c2f" opacity="0.5"/>
            <circle cx="14" cy="13" r="2.5" fill="#4a7c2f" opacity="0.4"/>
        </svg>`,
        shop: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="shopRoof" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#b87d5d"/>
                    <stop offset="100%" style="stop-color:#a0522d"/>
                </linearGradient>
                <linearGradient id="shopWall" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#9d8668"/>
                    <stop offset="100%" style="stop-color:#8b7355"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="#8b4513"/>
            <path d="M 3,15 L 16,6 L 29,15" fill="url(#shopRoof)" stroke="#654321" stroke-width="1"/>
            <path d="M 3,15 L 16,6" stroke="#d4a574" stroke-width="0.5" opacity="0.6"/>
            <rect x="5" y="15" width="22" height="15" fill="url(#shopWall)" stroke="#6b5b3e" stroke-width="1"/>
            <rect x="9" y="18" width="14" height="7" fill="#5da8d3" stroke="#3d7fa8" stroke-width="0.8" opacity="0.9"/>
            <rect x="9" y="18" width="14" height="2" fill="#4da6ff" opacity="0.3"/>
            <line x1="16" y1="18" x2="16" y2="25" stroke="#3d7fa8" stroke-width="0.6"/>
            <line x1="9" y1="21.5" x2="23" y2="21.5" stroke="#3d7fa8" stroke-width="0.6"/>
            <rect x="14" y="26" width="4" height="4" fill="#5d4e37" stroke="#3d2b17" stroke-width="0.6"/>
            <path d="M 10,19 L 22,19 L 22,24 L 10,24 Z" stroke="#fff" stroke-width="0.4" fill="none" opacity="0.3"/>
        </svg>`,
        counter: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="counterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#8b7355"/>
                    <stop offset="100%" style="stop-color:#6b5b3e"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" fill="#5d4e37"/>
            <rect x="3" y="12" width="26" height="10" fill="url(#counterGradient)" stroke="#4a3d2a" stroke-width="1"/>
            <rect x="3" y="12" width="26" height="2" fill="#9d8668" opacity="0.6"/>
            <line x1="3" y1="17" x2="29" y2="17" stroke="#4a3d2a" stroke-width="0.5"/>
            <rect x="8" y="15" width="3" height="2" fill="#c9a870" opacity="0.4"/>
            <rect x="20" y="15" width="4" height="2" fill="#c9a870" opacity="0.4"/>
        </svg>`
    },

    // ===== UI ICONS =====
    icons: {
        coin: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="coinGradient" cx="40%" cy="40%">
                    <stop offset="0%" style="stop-color:#ffe066"/>
                    <stop offset="100%" style="stop-color:#d4a83d"/>
                </radialGradient>
            </defs>
            <circle cx="8" cy="8" r="7" fill="url(#coinGradient)" stroke="#b8860b" stroke-width="1"/>
            <circle cx="8" cy="8" r="5.5" stroke="#b8860b" stroke-width="0.5" fill="none"/>
            <text x="8" y="11" text-anchor="middle" font-size="9" font-weight="bold" fill="#b8860b">$</text>
        </svg>`,
        heart: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff8d8d"/>
                    <stop offset="100%" style="stop-color:#ff6b6b"/>
                </linearGradient>
            </defs>
            <path d="M 8,14 Q 2,9 2,5 Q 2,2 5,2 Q 7,2 8,4 Q 9,2 11,2 Q 14,2 14,5 Q 14,9 8,14"
                  fill="url(#heartGradient)" stroke="#cc3333" stroke-width="0.6"/>
            <path d="M 5,5 Q 6,4 7,5" stroke="#ffb3b3" stroke-width="0.8" fill="none" opacity="0.6" stroke-linecap="round"/>
        </svg>`,
        compass: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="compassFace" cx="50%" cy="50%">
                    <stop offset="0%" style="stop-color:#fff"/>
                    <stop offset="100%" style="stop-color:#e8e8e8"/>
                </radialGradient>
            </defs>
            <circle cx="8" cy="8" r="7" fill="url(#compassFace)" stroke="#8b7355" stroke-width="1.2"/>
            <circle cx="8" cy="8" r="5.5" stroke="#c9a870" stroke-width="0.4" fill="none"/>
            <path d="M 8,3 L 6.5,8 L 8,13 L 9.5,8 Z" fill="#cc3333" stroke="#991111" stroke-width="0.6"/>
            <path d="M 8,3 L 9.5,8 L 8,13" fill="#e8e8e8" opacity="0.4"/>
            <circle cx="8" cy="8" r="1.8" fill="#3d2817" stroke="#1a1a1a" stroke-width="0.4"/>
            <circle cx="8" cy="8" r="0.8" fill="#c9a870"/>
        </svg>`
    }
};

// SVG Loader remains the same
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

        for (const char of Object.values(SVGAssets.player)) {
            promises.push(this.loadSVG(char));
        }

        for (const npc of Object.values(SVGAssets.npcs)) {
            promises.push(this.loadSVG(npc));
        }

        for (const creature of Object.values(SVGAssets.creatures)) {
            promises.push(this.loadSVG(creature));
        }

        for (const tile of Object.values(SVGAssets.tiles)) {
            promises.push(this.loadSVG(tile));
        }

        for (const icon of Object.values(SVGAssets.icons)) {
            promises.push(this.loadSVG(icon, 16, 16));
        }

        await Promise.all(promises);
    }
}

const svgLoader = new SVGLoader();
