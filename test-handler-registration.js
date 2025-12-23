#!/usr/bin/env node

/**
 * Test handler registration for creature_bonding_complete
 */

// Simulate the listener system
class TestListeners {
    constructor() {
        this.listeners = {};
    }

    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
        console.log(`✓ Registered handler for '${event}' (total: ${this.listeners[event].length})`);
    }

    emit(event, ...args) {
        console.log(`\n→ Emitting '${event}'`);
        if (this.listeners[event]) {
            console.log(`  Found ${this.listeners[event].length} listener(s)`);
            this.listeners[event].forEach((handler, index) => {
                try {
                    console.log(`  Calling handler ${index + 1}...`);
                    handler(...args);
                    console.log(`  ✓ Handler ${index + 1} completed`);
                } catch (error) {
                    console.error(`  ✗ Handler ${index + 1} error:`, error.message);
                }
            });
        } else {
            console.log(`  ✗ No listeners registered!`);
        }
    }
}

// Test
console.log('Testing handler registration and execution...\n');

const system = new TestListeners();

// Register handler (like setupDialogueListeners does)
system.on('trigger:creature_bonding_complete', () => {
    console.log('    [Inside Handler] creature_bonding_complete executing');
    console.log('    [Inside Handler] Calling showCreatureNaming...');
    console.log('    [Inside Handler] Done');
});

// Emit the trigger (like closeCurrentDialogue does)
system.emit('trigger:creature_bonding_complete');

console.log('\n✓ Test completed\n');

console.log('Expected behavior:');
console.log('  1. Handler should be registered');
console.log('  2. When emitted, handler should execute');
console.log('  3. All logs from inside handler should appear');
console.log('\nIf this works but game doesn\'t, the issue is elsewhere.');
