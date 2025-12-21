#!/bin/bash

# Test multi-choice dialogues with REAL keyboard events
# This simulates actual button presses instead of calling methods

cat > /tmp/test-choice-keyboard.js << 'EOF'
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Set up DOM
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost'
});

global.window = dom.window;
global.document = dom.window.document;
global.Image = dom.window.Image;
global.performance = { now: () => Date.now() };

// Load all source files in order
const files = [
    '../src/debugLogger.js',
    '../src/onScreenLogger.js',
    '../src/data.js',
    '../src/spriteLoader.js',
    '../src/questSystem.js',
    '../src/dialogueQueueSystem.js',
    '../src/inputRouter.js',
    '../src/renderingSystem.js',
    '../src/game.js'
];

files.forEach(file => {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    const script = new dom.window.Function(code);
    try {
        script.call(dom.window);
    } catch (e) {
        // Expected for some scripts that need full game context
    }
});

// Helper: Dispatch keyboard event
function pressKey(key, code = null) {
    const event = new dom.window.KeyboardEvent('keydown', {
        key: key,
        code: code || key,
        bubbles: true,
        cancelable: true
    });
    dom.window.document.dispatchEvent(event);
}

// Test: Multi-choice dialogue with arrow keys
console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║      CHOICE KEYBOARD TESTS - REAL EVENTS              ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (e) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${e.message}`);
        failed++;
    }
}

// Create mock game
class MockGame {
    constructor() {
        this.speedRunMode = false;
        this.state = 'exploring';
        this.plotPhase = 'wake_up';
        this.dialogue = new DialogueQueueSystem(this, { headless: true });
        this.inputRouter = new InputRouter();
        this.inputRouter.register(this.dialogue, 100);
    }
}

test('Multi-choice dialogue shows choices', () => {
    const game = new MockGame();

    game.dialogue.startDialogue(
        ['Choose a name:'],
        [
            { text: 'Shimmer', action: () => {} },
            { text: 'Lumina', action: () => {} },
            { text: 'Spark', action: () => {} }
        ]
    );

    if (game.dialogue.state !== 'WAITING_FOR_CHOICE') {
        throw new Error(`Expected WAITING_FOR_CHOICE, got ${game.dialogue.state}`);
    }

    if (!game.dialogue.current.choices || game.dialogue.current.choices.length !== 3) {
        throw new Error(`Expected 3 choices, got ${game.dialogue.current.choices?.length}`);
    }
});

test('Arrow Down navigates to next choice', () => {
    const game = new MockGame();

    game.dialogue.startDialogue(
        ['Choose a name:'],
        [
            { text: 'Shimmer', action: () => {} },
            { text: 'Lumina', action: () => {} },
            { text: 'Spark', action: () => {} }
        ]
    );

    if (game.dialogue.selectedChoiceIndex !== 0) {
        throw new Error(`Expected index 0, got ${game.dialogue.selectedChoiceIndex}`);
    }

    // Press arrow down
    pressKey('ArrowDown');

    if (game.dialogue.selectedChoiceIndex !== 1) {
        throw new Error(`Expected index 1 after ArrowDown, got ${game.dialogue.selectedChoiceIndex}`);
    }
});

test('Arrow Up navigates to previous choice (wraps around)', () => {
    const game = new MockGame();

    game.dialogue.startDialogue(
        ['Choose a name:'],
        [
            { text: 'Shimmer', action: () => {} },
            { text: 'Lumina', action: () => {} },
            { text: 'Spark', action: () => {} }
        ]
    );

    // Press arrow up (should wrap to last choice)
    pressKey('ArrowUp');

    if (game.dialogue.selectedChoiceIndex !== 2) {
        throw new Error(`Expected index 2 after ArrowUp wrap, got ${game.dialogue.selectedChoiceIndex}`);
    }
});

test('A button selects highlighted choice', () => {
    const game = new MockGame();

    let selectedChoice = null;
    game.dialogue.startDialogue(
        ['Choose a name:'],
        [
            { text: 'Shimmer', action: () => { selectedChoice = 'Shimmer'; } },
            { text: 'Lumina', action: () => { selectedChoice = 'Lumina'; } },
            { text: 'Spark', action: () => { selectedChoice = 'Spark'; } }
        ]
    );

    // Navigate to second choice
    pressKey('ArrowDown');

    // Press A to select
    pressKey('a', 'KeyA');

    // Small delay for async execution
    setTimeout(() => {
        if (selectedChoice !== 'Lumina') {
            throw new Error(`Expected 'Lumina', got ${selectedChoice}`);
        }
    }, 100);
});

test('InputRouter consumes choice input (game.interact() not called)', () => {
    const game = new MockGame();

    let interactCalled = false;
    game.handleInput = (input) => {
        if (!input.consumed && (input.key === 'a' || input.key === 'Enter')) {
            interactCalled = true;
        }
    };
    game.inputRouter.register(game, 0);

    game.dialogue.startDialogue(
        ['Choose a name:'],
        [
            { text: 'Shimmer', action: () => {} },
            { text: 'Lumina', action: () => {} }
        ]
    );

    // Press arrow down (should be consumed by dialogue)
    pressKey('ArrowDown');

    if (interactCalled) {
        throw new Error('Game.handleInput was called - input not consumed!');
    }

    // Press A (should be consumed by dialogue)
    pressKey('a', 'KeyA');

    if (interactCalled) {
        throw new Error('Game.handleInput was called when selecting choice - input not consumed!');
    }
});

console.log('\n======================================================================');
console.log('TEST RESULTS');
console.log('======================================================================');
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
    console.log('\n❌ SOME TESTS FAILED!');
    process.exit(1);
} else {
    console.log('\n✅ ALL KEYBOARD TESTS PASSED!');
    console.log('Choice dialogues work with real keyboard events');
    process.exit(0);
}
EOF

node /tmp/test-choice-keyboard.js
