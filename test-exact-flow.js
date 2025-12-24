/**
 * Minimal reproduction - tests the EXACT flow from the real game
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Create DOM
const dom = new JSDOM(`
<!DOCTYPE html>
<html><body>
    <div id="firstEncounterUI" class="hidden">
        <canvas id="encounterCreatureCanvas"></canvas>
        <div id="encounterText"></div>
        <div id="encounterChoices"></div>
    </div>
</body></html>
`);

global.window = dom.window;
global.document = dom.window.document;

// Mock canvas
dom.window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });

// Load scripts into window context
console.log('Loading scripts...');
const loadScript = (path) => {
    const code = fs.readFileSync(path, 'utf8');
    const script = dom.window.document.createElement('script');
    script.textContent = code;
    dom.window.document.body.appendChild(script);
};

loadScript('src/dialogueQueueSystem.js');
loadScript('src/data.js');

const { DialogueQueueSystem, CREATURE_FLOWS } = dom.window;

console.log('Creating mock game...');
const mockGame = {
    speedRunMode: false,
    inputRouter: { push: () => {}, pop: () => {} },
    finalizeCreatureNaming: (name) => console.log(`  → finalized with name: ${name}`)
};

// Create dialogue system
const dialogue = new DialogueQueueSystem(mockGame);

console.log('\n=== Registering Handler ===');
// Register EXACT handler from game.js
dialogue.on('trigger:creature_bonding_complete', () => {
    console.log('[DialogueQueue] ★ BONDING HANDLER STARTED ★');

    const nameOptions = ['Shimmer', 'Lumina', 'Spark', 'Glow', 'Nova'];
    const encounterUI = document.getElementById('firstEncounterUI');
    const encounterText = document.getElementById('encounterText');
    const encounterChoices = document.getElementById('encounterChoices');
    const encounterCanvas = document.getElementById('encounterCreatureCanvas');

    console.log('  → Got DOM elements');

    // Draw creature (mock)
    const ctx = encounterCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    console.log('  → Drew creature');

    // Set text
    encounterText.textContent = "It needs a name.";
    console.log('  → Set text');

    // Create buttons
    encounterChoices.innerHTML = '';
    nameOptions.forEach((name) => {
        const button = document.createElement('button');
        button.className = 'encounter-choice';
        button.textContent = name;
        encounterChoices.appendChild(button);
    });
    console.log('  → Created buttons');

    // Show UI
    encounterUI.classList.remove('hidden');
    console.log('[DialogueQueue] ★★★ BONDING HANDLER COMPLETE - UI SHOWN ★★★');
});

const listenerCount = dialogue.listeners['trigger:creature_bonding_complete']?.length || 0;
console.log(`✓ Handler registered (${listenerCount} listeners)\n`);

console.log('=== Queueing Bonding Flow ===');
// Queue the EXACT flow from data.js
dialogue.queueFlow(CREATURE_FLOWS.bonding);
console.log(`✓ Queued bonding flow (queue length: ${dialogue._queue.length})\n`);

console.log('=== Processing Dialogue ===');
// Start processing
dialogue.processNext();

console.log('\n=== Advancing Dialogue (simulating A button press) ===');
// Simulate player pressing A to close the dialogue
dialogue.advance();

// Check results
setTimeout(() => {
    const encounterUI = document.getElementById('firstEncounterUI');
    const buttons = document.querySelectorAll('.encounter-choice');
    const text = document.getElementById('encounterText').textContent;

    console.log('\n=== RESULTS ===');
    console.log(`UI visible: ${!encounterUI.classList.contains('hidden')}`);
    console.log(`Buttons created: ${buttons.length}`);
    console.log(`Text: "${text}"`);

    if (!encounterUI.classList.contains('hidden') && buttons.length === 5) {
        console.log('\n✓✓✓ TEST PASSED!\n');
        process.exit(0);
    } else {
        console.log('\n✗✗✗ TEST FAILED!\n');
        process.exit(1);
    }
}, 100);
