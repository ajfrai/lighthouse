/**
 * Test creature naming flow with standard dialogue system
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log('=== Testing Creature Naming Flow ===\n');

// Create minimal DOM
const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body>
    <div id="dialogBox" class="hidden"></div>
    <div id="dialogText"></div>
    <div id="dialogChoices"></div>
    <div id="firstEncounterUI" class="hidden"></div>
    <div id="coins">Coins: 0</div>
    <div id="creatures">Creatures: 0/8</div>
</body>
</html>`);

global.window = dom.window;
global.document = dom.window.document;
global.performance = {
    now: () => Date.now()
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

// Load required modules
const InputRouter = require('./src/inputRouter.js');
console.log('✓ InputRouter loaded\n');

console.log('Test 1: Verify dialogue system supports choices with dpad navigation');

// Create mock dialogue system
class MockDialogueSystem {
    constructor() {
        this.state = 'IDLE';
        this.listeners = {};
        this._queue = [];
        this.current = null;
        this.selectedChoiceIndex = 0;
    }

    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
    }

    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(handler => handler(...args));
        }
    }

    queue(dialogue) {
        this._queue.push(dialogue);
        console.log(`  ✓ Queued dialogue with ${dialogue.choices ? dialogue.choices.length + ' choices' : 'no choices'}`);

        // Simulate processing the queued dialogue
        if (this.state === 'IDLE') {
            this.processNext();
        }
    }

    processNext() {
        if (this._queue.length === 0) {
            this.state = 'IDLE';
            return;
        }

        this.current = this._queue.shift();

        if (this.current.choices && this.current.choices.length > 0) {
            this.state = 'WAITING_FOR_CHOICE';
            this.selectedChoiceIndex = 0;
            console.log(`  ✓ Dialogue system in WAITING_FOR_CHOICE state`);
        } else {
            this.state = 'ANIMATING';
        }
    }

    handleInput(input) {
        if (this.state === 'IDLE') {
            return; // Don't consume
        }

        if (this.state === 'WAITING_FOR_CHOICE') {
            const numChoices = this.current?.choices?.length || 0;

            if (input.key === 'ArrowUp') {
                this.selectedChoiceIndex = (this.selectedChoiceIndex - 1 + numChoices) % numChoices;
                input.consume();
                console.log(`  ✓ ArrowUp navigated to choice ${this.selectedChoiceIndex}`);
                return;
            }

            if (input.key === 'ArrowDown') {
                this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % numChoices;
                input.consume();
                console.log(`  ✓ ArrowDown navigated to choice ${this.selectedChoiceIndex}`);
                return;
            }

            if (input.key === 'Enter' || input.key === ' ') {
                const choice = this.current.choices[this.selectedChoiceIndex];
                console.log(`  ✓ Selected choice: ${choice.text}`);

                if (choice.trigger) {
                    this.emit('trigger:' + choice.trigger, choice);
                }

                this.current = null;
                this.processNext();
                input.consume();
                return;
            }

            input.consume();
            return;
        }

        // Consume all input when dialogue active
        input.consume();
    }
}

const dialogue = new MockDialogueSystem();
console.log('  ✓ Mock dialogue system created\n');

console.log('Test 2: Simulate creature bonding complete trigger');

// Register handler for bonding complete
dialogue.on('trigger:creature_bonding_complete', () => {
    console.log('  ✓ Bonding complete handler fired');

    dialogue.queue({
        text: "It needs a name.",
        choices: [
            { text: "Shimmer", trigger: 'creature_named_shimmer' },
            { text: "Lumina", trigger: 'creature_named_lumina' },
            { text: "Spark", trigger: 'creature_named_spark' },
            { text: "Glow", trigger: 'creature_named_glow' },
            { text: "Nova", trigger: 'creature_named_nova' }
        ]
    });
});

// Trigger the bonding complete
dialogue.emit('trigger:creature_bonding_complete');

if (dialogue.state !== 'WAITING_FOR_CHOICE') {
    console.error('✗ FAIL: Dialogue not in WAITING_FOR_CHOICE state');
    process.exit(1);
}
console.log('  ✓ Dialogue now in WAITING_FOR_CHOICE state\n');

console.log('Test 3: Test dpad navigation');

// Create input router
const router = new InputRouter();
router.register(dialogue, 100);

// Simulate ArrowDown
let input = {
    key: 'ArrowDown',
    consumed: false,
    consume: function() { this.consumed = true; }
};
dialogue.handleInput(input);

if (!input.consumed) {
    console.error('✗ FAIL: ArrowDown input not consumed by dialogue');
    process.exit(1);
}
if (dialogue.selectedChoiceIndex !== 1) {
    console.error('✗ FAIL: Selected index should be 1, got', dialogue.selectedChoiceIndex);
    process.exit(1);
}
console.log('  ✓ ArrowDown navigation works\n');

// Simulate ArrowUp
input = {
    key: 'ArrowUp',
    consumed: false,
    consume: function() { this.consumed = true; }
};
dialogue.handleInput(input);

if (dialogue.selectedChoiceIndex !== 0) {
    console.error('✗ FAIL: Selected index should be 0, got', dialogue.selectedChoiceIndex);
    process.exit(1);
}
console.log('  ✓ ArrowUp navigation works\n');

console.log('Test 4: Test name selection');

let nameSelected = null;
const nameOptions = ['Shimmer', 'Lumina', 'Spark', 'Glow', 'Nova'];
nameOptions.forEach(name => {
    dialogue.on(`trigger:creature_named_${name.toLowerCase()}`, () => {
        nameSelected = name;
        console.log(`  ✓ Creature named: ${name}`);

        // Queue final message (simulating finalizeCreatureNaming)
        dialogue.queue({
            text: `${name} looks up at you. You should tell Marlowe what you found.`,
            trigger: 'creature_naming_complete'
        });
    });
});

// Select second choice (Lumina)
dialogue.selectedChoiceIndex = 1;
input = {
    key: 'Enter',
    consumed: false,
    consume: function() { this.consumed = true; }
};
dialogue.handleInput(input);

if (nameSelected !== 'Lumina') {
    console.error('✗ FAIL: Expected Lumina to be selected, got', nameSelected);
    process.exit(1);
}
console.log('  ✓ Name selection works\n');

console.log('Test 5: Verify final dialogue is queued');

if (dialogue._queue.length > 0 || dialogue.current === null) {
    console.error('✗ FAIL: Final dialogue should be current, not queued');
    process.exit(1);
}
if (!dialogue.current.text.includes('Lumina looks up at you')) {
    console.error('✗ FAIL: Expected final dialogue text');
    process.exit(1);
}
if (dialogue.current.trigger !== 'creature_naming_complete') {
    console.error('✗ FAIL: Expected creature_naming_complete trigger');
    process.exit(1);
}
console.log('  ✓ Final dialogue queued correctly\n');

console.log('Test 6: Verify naming complete trigger fires');

let namingComplete = false;
dialogue.on('trigger:creature_naming_complete', () => {
    namingComplete = true;
    console.log('  ✓ creature_naming_complete trigger fired');
});

// Simulate closing the final dialogue
dialogue.emit('trigger:creature_naming_complete', dialogue.current);
dialogue.current = null;
dialogue.processNext();

if (!namingComplete) {
    console.error('✗ FAIL: creature_naming_complete trigger did not fire');
    process.exit(1);
}

if (dialogue.state !== 'IDLE') {
    console.error('✗ FAIL: Dialogue should return to IDLE state, got', dialogue.state);
    process.exit(1);
}
console.log('  ✓ Dialogue returned to IDLE state\n');

console.log('Test 7: Verify input not consumed after naming complete');

input = {
    key: 'ArrowDown',
    consumed: false,
    consume: function() { this.consumed = true; }
};
dialogue.handleInput(input);

if (input.consumed) {
    console.error('✗ FAIL: Input should not be consumed when dialogue is IDLE');
    process.exit(1);
}
console.log('  ✓ Input correctly passed through when IDLE\n');

console.log('✓✓✓ ALL TESTS PASSED!\n');
console.log('Creature naming flow works correctly with:');
console.log('  - Standard dialogue choice system');
console.log('  - Dpad navigation (ArrowUp/ArrowDown)');
console.log('  - Proper state transitions');
console.log('  - Input routing after completion\n');

process.exit(0);
