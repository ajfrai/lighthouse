#!/usr/bin/env node

/**
 * Test the actual handler execution with real DOM
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Create a DOM environment
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;

// Mock canvas context
const mockContext = {
    clearRect: (x, y, w, h) => {
        console.log(`  [Mock] clearRect(${x}, ${y}, ${w}, ${h})`);
    },
    save: () => {
        console.log(`  [Mock] save()`);
    },
    restore: () => {
        console.log(`  [Mock] restore()`);
    },
    scale: (x, y) => {
        console.log(`  [Mock] scale(${x}, ${y})`);
    }
};

// Mock spriteLoader
global.spriteLoader = {
    drawCreature: (ctx, id, x, y) => {
        console.log(`  [Mock] Drawing creature ${id} at ${x},${y}`);
    }
};

// Mock getContext for all canvas elements
const originalGetElementById = document.getElementById.bind(document);
document.getElementById = function(id) {
    const element = originalGetElementById(id);
    if (element && element.tagName === 'CANVAS') {
        element.getContext = () => mockContext;
    }
    return element;
};

// Load the dialogue queue system
const DialogueQueueSystem = require('./src/dialogueQueueSystem.js');

// Test the handler
console.log('Testing handler execution with real DOM...\n');

const encounterUI = document.getElementById('firstEncounterUI');
const encounterText = document.getElementById('encounterText');
const encounterChoices = document.getElementById('encounterChoices');
const encounterCanvas = document.getElementById('encounterCreatureCanvas');

console.log('DOM elements:', {
    encounterUI: !!encounterUI,
    encounterText: !!encounterText,
    encounterChoices: !!encounterChoices,
    encounterCanvas: !!encounterCanvas
});

// Create a mock InputRouter
global.InputRouter = class {
    constructor() {
        this.handlers = [];
    }
    push(handler) {
        console.log('  [Mock] InputRouter.push() called');
        this.handlers.push(handler);
        return this;
    }
    pop() {
        console.log('  [Mock] InputRouter.pop() called');
        this.handlers.pop();
        return this;
    }
};

// Create mock game object
const mockGame = {
    speedRunMode: false,
    keys: {},
    keysPressed: {},
    player: { moving: false }
};

// Create dialogue system
const dialogue = new DialogueQueueSystem(mockGame);

// Register the ACTUAL handler from game.js (lines 175-256)
dialogue.on('trigger:creature_bonding_complete', () => {
    console.log('[DialogueQueue] ★ BONDING HANDLER STARTED ★');

    try {
        const nameOptions = ['Shimmer', 'Lumina', 'Spark', 'Glow', 'Nova'];

        // Draw creature on canvas
        const ctx = encounterCanvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);
        ctx.save();
        ctx.scale(6, 6);
        spriteLoader.drawCreature(ctx, 'lumina', 16, 16);
        ctx.restore();
        console.log('  ✓ Drew creature');

        // Set text
        encounterText.textContent = "It needs a name.";
        console.log('  ✓ Set text');

        // Create choice buttons
        encounterChoices.innerHTML = '';
        let selectedIndex = 0;

        for (let i = 0; i < nameOptions.length; i++) {
            const button = document.createElement('button');
            button.className = 'encounter-choice';
            button.textContent = nameOptions[i];
            encounterChoices.appendChild(button);
        }
        console.log(`  ✓ Created ${nameOptions.length} buttons`);

        // Show UI
        encounterUI.classList.remove('hidden');
        console.log('  ✓ Showed UI');

        console.log('[DialogueQueue] ★ BONDING HANDLER COMPLETED ★');
    } catch (error) {
        console.error('[DialogueQueue] ✗ HANDLER ERROR:', error.message);
        throw error;
    }
});

// Emit the trigger
try {
    console.log('\n→ Emitting trigger:creature_bonding_complete...\n');
    dialogue.emit('trigger:creature_bonding_complete');

    console.log('\n=== Results ===');
    console.log('Buttons created:', encounterChoices.querySelectorAll('.encounter-choice').length);
    console.log('UI visible:', !encounterUI.classList.contains('hidden'));
    console.log('Text content:', encounterText.textContent);

    if (!encounterUI.classList.contains('hidden') &&
        encounterChoices.querySelectorAll('.encounter-choice').length === 5 &&
        encounterText.textContent === "It needs a name.") {
        console.log('\n✓✓✓ TEST PASSED - Handler executed successfully!');
        process.exit(0);
    } else {
        console.log('\n✗✗✗ TEST FAILED - Handler did not complete correctly');
        process.exit(1);
    }

} catch (error) {
    console.error('\n✗✗✗ TEST FAILED WITH ERROR:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
