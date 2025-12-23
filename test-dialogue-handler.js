#!/usr/bin/env node

/**
 * Test DialogueQueueSystem handler registration and execution
 * Simulates the exact scenario from the game
 */

console.log('Testing DialogueQueueSystem handler execution...\n');

// Simplified mock of the event system
class MockDialogueSystem {
    constructor() {
        this.listeners = {};
    }

    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
        console.log(`✓ Registered handler for '${event}'`);
    }

    emit(event, ...args) {
        console.log(`\nEmitting ${event}...`);

        if (this.listeners[event]) {
            const count = this.listeners[event].length;
            console.log(`  Found ${count} listener(s)`);

            this.listeners[event].forEach((handler, index) => {
                console.log(`  → Calling handler ${index + 1}...`);
                try {
                    handler(...args);
                    console.log(`  ✓ Handler ${index + 1} completed`);
                } catch (error) {
                    console.error(`  ✗ ERROR in handler ${index + 1}:`, error.message);
                }
            });
        } else {
            console.log(`  No listeners registered!`);
        }
    }
}

// Create instance
const dialogue = new MockDialogueSystem();

// Track if handler was called
let handlerCalled = false;
let showCreatureNamingCalled = false;

// Mock showCreatureNaming function
const game = {
    showCreatureNaming: function() {
        console.log('    [Inside Handler] showCreatureNaming() called');
        showCreatureNamingCalled = true;
    }
};

// Register handler EXACTLY like game.js does with arrow function
dialogue.on('trigger:creature_bonding_complete', () => {
    console.log('    [Inside Handler] creature_bonding_complete handler executing');
    handlerCalled = true;
    game.showCreatureNaming();
    console.log('    [Inside Handler] creature_bonding_complete handler done');
});

// Verify listeners exist
const listeners = dialogue.listeners['trigger:creature_bonding_complete'];
console.log(`✓ Listener count: ${listeners ? listeners.length : 0}`);

// Emit the trigger
dialogue.emit('trigger:creature_bonding_complete', { text: 'bonding' });

// Verify results
console.log('\n=== RESULTS ===');
console.log(`Handler called: ${handlerCalled ? '✓ YES' : '✗ NO'}`);
console.log(`showCreatureNaming called: ${showCreatureNamingCalled ? '✓ YES' : '✗ NO'}`);

if (handlerCalled && showCreatureNamingCalled) {
    console.log('\n✓✓✓ MOCK TEST PASSED');
    console.log('The event system logic is correct.');
    console.log('The bug must be elsewhere in the actual code.');
} else {
    console.log('\n✗✗✗ MOCK TEST FAILED');
    console.log('The event system has a fundamental issue.');
}
