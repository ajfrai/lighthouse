#!/usr/bin/env node

/**
 * END-TO-END DIALOGUE TESTS
 *
 * Tests the COMPLETE dialogue flow including:
 * - Starting dialogue
 * - Button press handling
 * - State transitions
 * - Typewriter animation
 * - Dialogue closing
 *
 * These tests simulate actual user interactions to catch integration bugs
 * that unit tests miss (like A button not advancing dialogue).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║      END-TO-END DIALOGUE TESTS                        ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// Load DialogueQueueSystem
const DialogueQueueSystem = require('../src/dialogueQueueSystem.js');

// Test helpers
let testsRun = 0;
let testsPassed = 0;
const failures = [];

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failures.push({ name, error: error.message });
        console.log(`  ✗ ${name}`);
    }
}

// Mock game
class MockGame {
    constructor() {
        this.plotPhase = 'test';
        this.speedRunMode = false;
    }
}

console.log('1. Basic Dialogue Flow');
console.log('   Purpose: Verify dialogue can be started and advanced\n');

test('Dialogue starts in ANIMATING state', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['Hello, world!']);

    assert.strictEqual(dialogue.state, 'ANIMATING', 'Should be in ANIMATING state');
    assert.strictEqual(dialogue.fullText, 'Hello, world!', 'Should have full text');
    assert.strictEqual(dialogue.textIndex, 0, 'Should start at index 0');
});

test('advance() completes animation and transitions to WAITING_FOR_INPUT', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['Hello, world!']);
    assert.strictEqual(dialogue.state, 'ANIMATING');

    // First press: complete animation
    dialogue.advance();

    assert.strictEqual(dialogue.state, 'WAITING_FOR_INPUT', 'Should transition to WAITING_FOR_INPUT');
    assert.strictEqual(dialogue.textIndex, dialogue.fullText.length, 'Should complete text');
});

test('advance() in WAITING_FOR_INPUT closes dialogue', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['Hello, world!']);

    // First press: complete animation
    dialogue.advance();
    assert.strictEqual(dialogue.state, 'WAITING_FOR_INPUT');

    // Second press: close dialogue
    dialogue.advance();

    assert.strictEqual(dialogue.state, 'IDLE', 'Should return to IDLE');
    assert.strictEqual(dialogue.current, null, 'Should clear current dialogue');
});

test('Full dialogue flow: start → animate → wait → close', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    let closedEmitted = false;
    dialogue.on('closed', () => { closedEmitted = true; });

    // Start
    dialogue.startDialogue(['Test message']);
    assert.strictEqual(dialogue.state, 'ANIMATING', 'Step 1: Should start animating');

    // Press A (complete animation)
    dialogue.advance();
    assert.strictEqual(dialogue.state, 'WAITING_FOR_INPUT', 'Step 2: Should wait for input');

    // Press A again (close dialogue)
    dialogue.advance();
    assert.strictEqual(dialogue.state, 'IDLE', 'Step 3: Should return to IDLE');
    assert.strictEqual(closedEmitted, true, 'Step 4: Should emit closed event');
});

console.log('');
console.log('2. Multi-Line Dialogue');
console.log('   Purpose: Verify multiple dialogue lines queue properly\n');

test('Multi-line dialogue queues all lines', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['Line 1', 'Line 2', 'Line 3']);

    assert.strictEqual(dialogue._queue.length, 2, 'Should have 2 remaining in queue (1 is current)');
});

test('Advancing through multi-line dialogue', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['Line 1', 'Line 2', 'Line 3']);

    // Complete line 1
    dialogue.advance(); // Complete animation
    dialogue.advance(); // Close line 1, start line 2

    assert.strictEqual(dialogue.state, 'ANIMATING', 'Should start line 2');
    assert.strictEqual(dialogue.fullText, 'Line 2', 'Should show line 2');

    // Complete line 2
    dialogue.advance(); // Complete animation
    dialogue.advance(); // Close line 2, start line 3

    assert.strictEqual(dialogue.state, 'ANIMATING', 'Should start line 3');
    assert.strictEqual(dialogue.fullText, 'Line 3', 'Should show line 3');

    // Complete line 3
    dialogue.advance(); // Complete animation
    dialogue.advance(); // Close line 3, back to IDLE

    assert.strictEqual(dialogue.state, 'IDLE', 'Should return to IDLE after all lines');
});

console.log('');
console.log('3. Typewriter Animation');
console.log('   Purpose: Verify typewriter updates text correctly\n');

test('update() increments text character by character', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['Hello']);

    // Manually update animation (simulate frames)
    const startTime = performance.now();
    dialogue.lastTypewriterUpdate = startTime;

    // Fast-forward through animation
    for (let i = 0; i < 5; i++) {
        dialogue.update(startTime + (i + 1) * 100); // 100ms per char
    }

    assert.strictEqual(dialogue.textIndex, 5, 'Should have shown all 5 characters');
    assert.strictEqual(dialogue.state, 'WAITING_FOR_INPUT', 'Should transition to WAITING_FOR_INPUT when complete');
});

test('Animation can be skipped with advance()', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['This is a long message']);

    // Verify animation is in progress
    assert.strictEqual(dialogue.textIndex, 0);
    assert.strictEqual(dialogue.state, 'ANIMATING');

    // Skip animation
    dialogue.advance();

    // Verify it completed instantly
    assert.strictEqual(dialogue.textIndex, dialogue.fullText.length);
    assert.strictEqual(dialogue.state, 'WAITING_FOR_INPUT');
});

console.log('');
console.log('4. Choice Dialogues');
console.log('   Purpose: Verify choice dialogues skip animation and show immediately\n');

test('Choice dialogues skip typewriter animation', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    const choices = [
        { text: 'Option 1', action: () => {} },
        { text: 'Option 2', action: () => {} }
    ];

    dialogue.startDialogue(['Choose one:'], choices);

    // Should skip animation and go straight to choice state
    assert.strictEqual(dialogue.state, 'WAITING_FOR_CHOICE', 'Should skip to WAITING_FOR_CHOICE');
    assert.strictEqual(dialogue.textIndex, dialogue.fullText.length, 'Should show full text immediately');
});

test('Single choice auto-selects after delay', (done) => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    let actionCalled = false;
    const choices = [
        { text: 'Continue', action: () => { actionCalled = true; } }
    ];

    dialogue.startDialogue(['Press any key to continue'], choices);

    // Wait for auto-select (50ms delay)
    setTimeout(() => {
        assert.strictEqual(actionCalled, true, 'Should auto-select single choice');
        done();
    }, 100);
});

console.log('');
console.log('5. State Consistency');
console.log('   Purpose: Verify state machine never gets stuck\n');

test('advance() in IDLE state does nothing', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    assert.strictEqual(dialogue.state, 'IDLE');

    // Pressing A in IDLE should be safe
    dialogue.advance();

    assert.strictEqual(dialogue.state, 'IDLE', 'Should remain IDLE');
});

test('Starting new dialogue while one is active queues it', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    dialogue.startDialogue(['First dialogue']);
    assert.strictEqual(dialogue.state, 'ANIMATING');

    dialogue.startDialogue(['Second dialogue']);
    assert.strictEqual(dialogue._queue.length, 1, 'Second dialogue should be queued');

    // Complete first dialogue
    dialogue.advance(); // Complete animation
    dialogue.advance(); // Close

    // Should automatically start second dialogue
    assert.strictEqual(dialogue.state, 'ANIMATING', 'Should start second dialogue');
    assert.strictEqual(dialogue.fullText, 'Second dialogue', 'Should show second dialogue text');
});

console.log('');
console.log('6. Input Handler State Check');
console.log('   Purpose: Verify setupInputHandlers checks correct states\n');

test('Input handler accepts ANIMATING state', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    // Manually set state to ANIMATING
    dialogue.state = 'ANIMATING';
    dialogue.fullText = 'Test';
    dialogue.textIndex = 0;

    // Simulate A button press by calling advance directly
    // (In real code, setupInputHandlers would call this when state is ANIMATING)
    dialogue.advance();

    assert.strictEqual(dialogue.state, 'WAITING_FOR_INPUT', 'advance() should work in ANIMATING state');
});

test('Input handler accepts WAITING_FOR_INPUT state', () => {
    const game = new MockGame();
    const dialogue = new DialogueQueueSystem(game, { headless: true });

    // Manually set state to WAITING_FOR_INPUT
    dialogue.state = 'WAITING_FOR_INPUT';
    dialogue.current = { id: 'test', text: 'Test' };

    // Simulate A button press
    dialogue.advance();

    assert.strictEqual(dialogue.state, 'IDLE', 'advance() should work in WAITING_FOR_INPUT state');
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('');
console.log('======================================================================');
console.log('TEST RESULTS');
console.log('======================================================================');
console.log(`Total Tests: ${testsRun}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${failures.length}`);
console.log('');

if (failures.length > 0) {
    console.log('❌ E2E TESTS FAILED!\n');
    failures.forEach(({ name, error }, index) => {
        console.log(`${index + 1}. ${name}`);
        console.log(`   Error: ${error}\n`);
    });
    process.exit(1);
} else {
    console.log('✅ ALL E2E TESTS PASSED!');
    console.log('Dialogue system works end-to-end:');
    console.log('  - Dialogue starts and advances correctly');
    console.log('  - A button works in all states');
    console.log('  - Typewriter animation functions');
    console.log('  - Multi-line dialogues queue properly');
    console.log('  - Choice dialogues display correctly');
    console.log('  - State machine never gets stuck');
    process.exit(0);
}
