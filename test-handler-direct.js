/**
 * Direct test - does the handler execute when emit is called?
 */

console.log('=== Testing Handler Execution ===\n');

// Simulate the listeners object and emit function
const listeners = {};

function on(event, handler) {
    if (!listeners[event]) {
        listeners[event] = [];
    }
    listeners[event].push(handler);
    console.log(`✓ Registered handler for ${event}`);
}

function emit(event, ...args) {
    console.log(`\nEmitting ${event}...`);
    if (listeners[event]) {
        console.log(`  Found ${listeners[event].length} listeners`);
        for (let index = 0; index < listeners[event].length; index++) {
            const handler = listeners[event][index];
            console.log(`  → Calling handler ${index + 1}...`);
            try {
                handler(...args);
                console.log(`  ✓ Handler ${index + 1} completed`);
            } catch (error) {
                console.error(`  ✗ ERROR in handler ${index + 1}:`, error.message);
            }
        }
    } else {
        console.log(`  No listeners for ${event}`);
    }
}

// Register the EXACT handler structure from game.js
console.log('Registering handler...\n');
on('trigger:creature_bonding_complete', () => {
    console.log('[Handler] ★ BONDING HANDLER STARTED ★');
    console.log('[Handler] Simulating UI show...');
    console.log('[Handler] ★★★ BONDING HANDLER COMPLETE ★★★');
});

// Emit the event
emit('trigger:creature_bonding_complete');

console.log('\n✓✓✓ If you see the BONDING HANDLER logs above, the emit mechanism works fine.\n');
