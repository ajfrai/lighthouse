/**
 * Simple direct test - skip game loop, just test handler registration and execution
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log('=== Simple Handler Registration Test ===\n');

// Create minimal HTML
const html = `
<!DOCTYPE html>
<html>
<head></head>
<body>
    <canvas id="gameCanvas" width="512" height="512"></canvas>
    <div id="firstEncounterUI" class="hidden">
        <canvas id="encounterCreatureCanvas" width="128" height="128"></canvas>
        <div id="encounterText"></div>
        <div id="encounterChoices"></div>
    </div>
</body>
</html>
`;

const dom = new JSDOM(html);
const { window } = dom;
global.window = window;
global.document = window.document;

// Mock minimal canvas
window.HTMLCanvasElement.prototype.getContext = function() {
    return new Proxy({}, {
        get() { return () => {}; }
    });
};

// Load only necessary files
const loadScript = (path) => {
    const code = fs.readFileSync(path, 'utf8');
    eval(code);
};

console.log('Loading minimal dependencies...');
eval(fs.readFileSync('src/data.js', 'utf8'));
eval(`
    // Minimal spriteLoader mock
    var spriteLoader = {
        load: async () => {},
        drawCreature: () => {}
    };
`);
eval(fs.readFileSync('src/dialogueQueueSystem.js', 'utf8'));
eval(fs.readFileSync('src/inputRouter.js', 'utf8'));

console.log('✓ Dependencies loaded\n');

// Ensure classes are available
if (typeof InputRouter === 'undefined') {
    console.log('✗ InputRouter not loaded');
    process.exit(1);
}
if (typeof DialogueQueueSystem === 'undefined') {
    console.log('✗ DialogueQueueSystem not loaded');
    process.exit(1);
}

// Create minimal game-like object
const mockGame = {
    speedRunMode: false,
    keys: {},
    keysPressed: {},
    player: { moving: false },
    inputRouter: new InputRouter(),
    finalizeCreatureNaming: (name) => {
        console.log(`  [Mock] finalizeCreatureNaming called with: ${name}`);
    }
};

// Create dialogue system
const dialogue = new DialogueQueueSystem(mockGame);
mockGame.dialogue = dialogue;

// NOW register the handler (simulate what setupDialogueListeners does)
console.log('Registering handler...');

dialogue.on('trigger:creature_bonding_complete', function() {
    console.log('[DialogueQueue] ★ BONDING HANDLER STARTED ★');

    // Clear all held keys
    mockGame.keys = {};
    mockGame.keysPressed = {};
    mockGame.player.moving = false;

    const nameOptions = ['Shimmer', 'Lumina', 'Spark', 'Glow', 'Nova'];
    const encounterUI = document.getElementById('firstEncounterUI');
    const encounterText = document.getElementById('encounterText');
    const encounterChoices = document.getElementById('encounterChoices');
    const encounterCanvas = document.getElementById('encounterCreatureCanvas');

    // Draw creature on canvas
    const ctx = encounterCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.save();
    ctx.scale(6, 6);
    spriteLoader.drawCreature(ctx, 'lumina', 16, 16);
    ctx.restore();

    // Set text
    encounterText.textContent = "It needs a name.";

    // Create choice buttons
    encounterChoices.innerHTML = '';
    let selectedIndex = 0;

    const updateSelection = () => {
        const buttons = encounterChoices.querySelectorAll('.encounter-choice');
        buttons.forEach((btn, i) => {
            btn.classList.toggle('selected', i === selectedIndex);
        });
    };

    nameOptions.forEach((name, index) => {
        const button = document.createElement('button');
        button.className = 'encounter-choice';
        button.textContent = name;
        button.onclick = () => {
            selectedIndex = index;
            updateSelection();
            mockGame.finalizeCreatureNaming(name);
            encounterUI.classList.add('hidden');
            mockGame.inputRouter.pop();
        };
        encounterChoices.appendChild(button);
    });

    // Set up InputRouter for D-pad navigation
    mockGame.inputRouter.push({
        priority: 100,
        handleInput: (key) => {
            if (key === 'ArrowUp') {
                selectedIndex = (selectedIndex - 1 + nameOptions.length) % nameOptions.length;
                updateSelection();
                return true;
            } else if (key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % nameOptions.length;
                updateSelection();
                return true;
            } else if (key === 'Enter' || key === ' ') {
                mockGame.finalizeCreatureNaming(nameOptions[selectedIndex]);
                encounterUI.classList.add('hidden');
                mockGame.inputRouter.pop();
                return true;
            }
            return false;
        }
    });

    // Show UI and set initial selection
    encounterUI.classList.remove('hidden');
    updateSelection();
    console.log('[DialogueQueue] ★★★ BONDING HANDLER COMPLETE - UI SHOWN ★★★');
});

console.log('✓ Handler registered\n');

// Check listener count
const listenerCount = dialogue.listeners['trigger:creature_bonding_complete']?.length || 0;
console.log(`Listeners registered: ${listenerCount}\n`);

if (listenerCount === 0) {
    console.log('✗✗✗ Handler not registered!\n');
    process.exit(1);
}

// Trigger the event
console.log('=== Emitting trigger:creature_bonding_complete ===\n');
dialogue.emit('trigger:creature_bonding_complete');

// Check results
const encounterUI = document.getElementById('firstEncounterUI');
const encounterText = document.getElementById('encounterText');
const buttons = document.querySelectorAll('.encounter-choice');

console.log('\n=== Results ===');
console.log(`UI visible: ${!encounterUI.classList.contains('hidden')}`);
console.log(`Buttons created: ${buttons.length}`);
console.log(`Text content: "${encounterText.textContent}"`);

if (!encounterUI.classList.contains('hidden') &&
    buttons.length === 5 &&
    encounterText.textContent === "It needs a name.") {
    console.log('\n✓✓✓ TEST PASSED - Handler executed successfully!\n');
    process.exit(0);
} else {
    console.log('\n✗✗✗ TEST FAILED\n');
    process.exit(1);
}
