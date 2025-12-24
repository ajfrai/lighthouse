/**
 * Comprehensive test that loads ALL game JavaScript files in proper order
 * and tests the handler registration and execution
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log('=== Loading Full Game Environment ===\n');

// Load HTML template
const html = fs.readFileSync('index.html', 'utf8');

// Create JSDOM with all features
const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    beforeParse(window) {
        // Mock canvas with Proxy to handle all methods
        const mockCanvas2D = new Proxy({
            fillStyle: '#000',
            strokeStyle: '#000',
            lineWidth: 1,
            font: '10px sans-serif',
            textAlign: 'left',
            textBaseline: 'alphabetic',
            imageSmoothingEnabled: false
        }, {
            get(target, prop) {
                if (prop in target) {
                    return target[prop];
                }
                // Return no-op function for all method calls
                if (prop === 'measureText') {
                    return () => ({ width: 10 });
                }
                if (prop === 'getImageData') {
                    return () => ({ data: [] });
                }
                return () => {};
            },
            set(target, prop, value) {
                target[prop] = value;
                return true;
            }
        });

        // Override getContext for all canvases
        window.HTMLCanvasElement.prototype.getContext = function(type) {
            if (type === '2d') {
                return mockCanvas2D;
            }
            return null;
        };

        // Mock Image
        window.Image = class {
            constructor() {
                this.onload = null;
                this.onerror = null;
                setTimeout(() => {
                    if (this.onload) this.onload();
                }, 10);
            }
        };

        // Mock fetch for VERSION.txt and assets
        window.fetch = (url) => {
            if (url === 'VERSION.txt') {
                return Promise.resolve({
                    text: () => Promise.resolve('0.1.6-test')
                });
            }
            if (url.includes('tileset.json')) {
                // Return minimal tileset
                return Promise.resolve({
                    json: () => Promise.resolve({ tiles: [] })
                });
            }
            if (url.includes('.png') || url.includes('.jpg')) {
                // Return empty blob for images
                return Promise.resolve({
                    blob: () => Promise.resolve(new Blob())
                });
            }
            console.log('Fetch called for:', url);
            return Promise.resolve({
                text: () => Promise.resolve(''),
                json: () => Promise.resolve({})
            });
        };

        // Capture console logs
        const logs = [];
        const originalLog = window.console.log;
        window.console.log = function(...args) {
            const msg = args.join(' ');
            logs.push(msg);
            originalLog.apply(window.console, args);
        };
        window.__testLogs = logs;
    }
});

const { window } = dom;
const { document } = window;
global.window = window;
global.document = document;

// Helper to load script
function loadScript(path) {
    console.log(`Loading ${path}...`);
    try {
        const code = fs.readFileSync(path, 'utf8');
        const script = document.createElement('script');
        script.textContent = code;
        document.body.appendChild(script);
        console.log(`  ✓ ${path} loaded`);
        return true;
    } catch (error) {
        console.error(`  ✗ ${path} failed:`, error.message);
        return false;
    }
}

// Load all scripts in order (matching index.html)
const scripts = [
    'src/debugLogger.js',
    'src/onScreenLogger.js',
    'src/data.js',
    'src/spriteLoader.js',
    'src/questSystem.js',
    'src/dialogueQueueSystem.js',
    'src/inputRouter.js',
    'src/renderingSystem.js',
    'src/game.js'
];

console.log('\n=== Loading Game Scripts ===\n');
for (const script of scripts) {
    if (!loadScript(script)) {
        console.error('\n✗✗✗ Failed to load scripts');
        process.exit(1);
    }
}

console.log('\n=== Creating Game Instance ===\n');

// Wait for any async operations
setTimeout(() => {
    try {
        // Create game instance
        const game = new window.LighthouseGame();
        console.log('✓ Game instance created\n');

        // Check handler registration
        console.log('=== Checking Handler Registration ===\n');
        const dialogue = game.dialogue;
        const listeners = dialogue.listeners || {};
        const bondingListeners = listeners['trigger:creature_bonding_complete'] || [];

        console.log(`Registered listeners for 'trigger:creature_bonding_complete': ${bondingListeners.length}`);

        if (bondingListeners.length === 0) {
            console.error('\n✗✗✗ PROBLEM FOUND: Handler not registered!');
            console.log('\nAll registered triggers:');
            Object.keys(listeners).filter(k => k.startsWith('trigger:')).forEach(k => {
                console.log(`  - ${k}: ${listeners[k].length} listeners`);
            });
            process.exit(1);
        }

        // Wait a bit more for initialization
        setTimeout(() => {
            console.log('\n=== Triggering creature_bonding_complete ===\n');

            // Emit the trigger
            dialogue.emit('trigger:creature_bonding_complete');

            // Check results
            setTimeout(() => {
                const encounterUI = document.getElementById('firstEncounterUI');
                const encounterText = document.getElementById('encounterText');
                const buttons = document.querySelectorAll('.encounter-choice');

                console.log('\n=== Results ===');
                console.log(`encounterUI exists: ${!!encounterUI}`);
                console.log(`encounterUI hidden class: ${encounterUI?.classList.contains('hidden')}`);
                console.log(`Buttons created: ${buttons.length}`);
                console.log(`Text content: "${encounterText?.textContent}"`);

                const uiVisible = encounterUI && !encounterUI.classList.contains('hidden');

                if (uiVisible && buttons.length === 5 && encounterText.textContent === "It needs a name.") {
                    console.log('\n✓✓✓ TEST PASSED - Handler executed successfully!\n');

                    // Show some logs
                    console.log('=== Captured Console Logs ===');
                    window.__testLogs.filter(l => l.includes('BONDING') || l.includes('★')).forEach(l => {
                        console.log(l);
                    });

                    process.exit(0);
                } else {
                    console.log('\n✗✗✗ TEST FAILED - Handler did not work correctly\n');

                    console.log('=== All Captured Logs ===');
                    window.__testLogs.forEach(l => console.log(l));

                    process.exit(1);
                }
            }, 200);
        }, 500);

    } catch (error) {
        console.error('\n✗✗✗ Error creating game:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}, 100);
