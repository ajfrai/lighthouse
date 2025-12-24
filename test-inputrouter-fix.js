/**
 * Test that InputRouter has push/pop methods and they work correctly
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log('=== Testing InputRouter push/pop Fix ===\n');

// Create minimal DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load InputRouter - it's a Node module
const InputRouter = require('./src/inputRouter.js');

console.log('✓ InputRouter loaded\n');

// Test 1: Check methods exist
console.log('Test 1: Checking methods exist...');
const router = new InputRouter();

if (typeof router.push !== 'function') {
    console.error('✗ FAIL: push() method missing');
    process.exit(1);
}
console.log('  ✓ push() exists');

if (typeof router.pop !== 'function') {
    console.error('✗ FAIL: pop() method missing');
    process.exit(1);
}
console.log('  ✓ pop() exists');

// Test 2: Test push() works
console.log('\nTest 2: Testing push() functionality...');
const mockHandler = {
    handleInput: (input) => {
        console.log('    [Mock handler called]');
        return true;
    }
};

const initialCount = router.handlers.length;
router.push(mockHandler);
const afterPushCount = router.handlers.length;

if (afterPushCount !== initialCount + 1) {
    console.error(`✗ FAIL: Handler count wrong. Expected ${initialCount + 1}, got ${afterPushCount}`);
    process.exit(1);
}
console.log('  ✓ push() adds handler to stack');

// Test 3: Test pop() works
console.log('\nTest 3: Testing pop() functionality...');
router.pop();
const afterPopCount = router.handlers.length;

if (afterPopCount !== initialCount) {
    console.error(`✗ FAIL: Handler count wrong after pop. Expected ${initialCount}, got ${afterPopCount}`);
    process.exit(1);
}
console.log('  ✓ pop() removes handler from stack');

// Test 4: Test chaining
console.log('\nTest 4: Testing method chaining...');
try {
    const result = router.push(mockHandler).pop();
    if (result !== router) {
        console.error('✗ FAIL: Methods do not chain properly');
        process.exit(1);
    }
    console.log('  ✓ push() and pop() support chaining');
} catch (error) {
    console.error('✗ FAIL: Chaining threw error:', error.message);
    process.exit(1);
}

// Test 5: Test with handler object containing priority
console.log('\nTest 5: Testing handler with priority...');
const priorityHandler = {
    priority: 50,
    handleInput: (input) => true
};

router.push(priorityHandler);
const topHandler = router.handlers[0];

if (topHandler.priority !== 50) {
    console.error(`✗ FAIL: Priority not set correctly. Expected 50, got ${topHandler.priority}`);
    process.exit(1);
}
console.log('  ✓ push() respects priority setting');

router.pop(); // clean up

// Test 6: Test the actual game.js use case
console.log('\nTest 6: Testing game.js usage pattern...');
try {
    router.push({
        priority: 100,
        handleInput: (key) => {
            if (key === 'ArrowUp') return true;
            if (key === 'ArrowDown') return true;
            if (key === 'Enter' || key === ' ') return true;
            return false;
        }
    });
    console.log('  ✓ Game.js handler pattern works');

    router.pop();
    console.log('  ✓ Handler cleanup works');
} catch (error) {
    console.error('✗ FAIL: Game.js pattern failed:', error.message);
    process.exit(1);
}

console.log('\n✓✓✓ ALL TESTS PASSED!\n');
console.log('InputRouter push/pop methods are working correctly.');
console.log('The naming UI handler should now execute fully.\n');

process.exit(0);
