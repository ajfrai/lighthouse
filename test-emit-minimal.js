#!/usr/bin/env node

/**
 * Minimal reproduction of the emit bug
 */

console.log('=== Minimal Emit Test ===\n');

// Exact emit() code from dialogueQueueSystem.js (v0.0.6)
function emit(event, listeners, ...args) {
    console.log(`\n→ emit('${event}') called with ${listeners.length} listener(s)`);

    if (listeners) {
        if (event.startsWith('trigger:')) {
            const count = listeners.length;
            console.log(`[DialogueQueue] Emitting ${event} (${count} listener${count !== 1 ? 's' : ''})`);
            console.log(`[DialogueQueue] DEBUG: listeners type = ${typeof listeners}, isArray = ${Array.isArray(listeners)}`);
        }
        listeners.forEach((handler, index) => {
            if (event.startsWith('trigger:')) {
                console.log(`[DialogueQueue] → Calling handler ${index + 1}...`);
            }
            try {
                handler(...args);
                if (event.startsWith('trigger:')) {
                    console.log(`[DialogueQueue] ✓ Handler ${index + 1} completed`);
                }
            } catch (error) {
                console.error(`[DialogueQueue] ERROR in ${event} handler ${index + 1}:`, error);
            }
        });
        if (event.startsWith('trigger:')) {
            console.log(`[DialogueQueue] DEBUG: forEach completed`);
        }
    }
}

// Test 1: Working handler (like _onclose_callback)
console.log('\n--- TEST 1: Working handler ---');
const workingHandler = () => {
    console.log('[DialogueQueue] ★★★ Working handler EXECUTING ★★★');
    console.log('[DialogueQueue] ★★★ Working handler DONE ★★★');
};
emit('trigger:_onclose_callback', [workingHandler]);

// Test 2: Handler that calls another function (like creature_bonding_complete)
console.log('\n--- TEST 2: Handler calling showCreatureNaming ---');

const mockThis = {
    showCreatureNaming: function() {
        console.log('[Game] showCreatureNaming() called');
    }
};

const bondingHandler = () => {
    console.log('[DialogueQueue] ★★★ CREATURE BONDING COMPLETE HANDLER EXECUTING ★★★');
    mockThis.showCreatureNaming();
    console.log('[DialogueQueue] ★★★ CREATURE BONDING COMPLETE HANDLER DONE ★★★');
};

emit('trigger:creature_bonding_complete', [bondingHandler]);

console.log('\n=== Both tests should show handler execution ===');
