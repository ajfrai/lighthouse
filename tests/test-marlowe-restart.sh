#!/usr/bin/env node

/**
 * Test for Marlowe wake_up auto-restart bug
 * User reports: "Come back and tell me what you find" → immediately restarts → "Morning. Sleep well?"
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load NPCS
const dataCode = fs.readFileSync(path.join(__dirname, '../src/data.js'), 'utf8');
const transformedCode = dataCode
    .replace(/^const (NPCS|QUESTS|CREATURES|JOBS|PROBLEM_TYPES|CREATURE_FLOWS) =/gm, 'global.$1 =');

eval(transformedCode);
const { NPCS } = global;

const DialogueQueueSystem = require('../src/dialogueQueueSystem.js');

console.log('Testing Marlowe wake_up auto-restart bug...\n');

// Create game in wake_up phase
const game = {
    plotPhase: 'wake_up',
    speedRunMode: false,
    coins: 0,
    party: [],
    boatQuest: { planks: { collected: 0 } },
    npcInteractions: new Map(),
    firstEncounterTriggered: false
};

const dialogue = new DialogueQueueSystem(game, { headless: true });

// Track all events
const events = [];
dialogue.on('started', (id) => events.push(`started: ${id}`));
dialogue.on('closed', (id) => events.push(`closed: ${id}`));
dialogue.on('queue_empty', () => events.push('queue_empty'));

console.log('Step 1: Talk to Marlowe (plotPhase = wake_up)');
dialogue.showNPCDialog('marlowe');

console.log(`Queue length: ${dialogue._queue.length}`);
console.log(`Current dialogue: "${dialogue.current?.text?.substring(0, 40)}..."`);
console.log(`Plot phase: ${game.plotPhase}`);

console.log('\nStep 2: Advance through all 5 dialogues');
let advances = 0;
let seenFinalLine = false; // Track if we've seen "Come back and tell me what you find"
while (dialogue.state !== 'IDLE' && advances < 30) {
    advances++;
    const stateBefore = dialogue.state;
    const phaseBefore = game.plotPhase;
    const textBefore = dialogue.current?.text?.substring(0, 50);

    dialogue.advance();

    const textAfter = dialogue.current?.text?.substring(0, 50);

    console.log(`  Advance #${advances}: ${stateBefore} → ${dialogue.state}`);
    if (textBefore) console.log(`    Text before: "${textBefore}..."`);
    if (textAfter) console.log(`    Text after: "${textAfter}..."`);
    console.log(`    Phase: ${phaseBefore} → ${game.plotPhase}`);

    // Track if we've seen the final line
    if (textBefore && textBefore.includes('Come back and tell me what you find')) {
        seenFinalLine = true;
        console.log('    ✓ Reached final line');
    }

    // Check if dialogue restarted AFTER we've seen the final line
    if (seenFinalLine && textAfter && textAfter.includes('Morning. Sleep well')) {
        console.log('\n❌ BUG DETECTED: Dialogue restarted!');
        console.log(`  After seeing final line, dialogue reset to beginning`);
        console.log(`  Plot phase: ${game.plotPhase}`);
        console.log(`  Queue length: ${dialogue._queue.length}`);
        console.log(`  Events: ${events.join(', ')}`);
        process.exit(1);
    }
}

console.log(`\nCompleted after ${advances} advances`);
console.log(`Final state: ${dialogue.state}`);
console.log(`Final plot phase: ${game.plotPhase}`);
console.log(`Events: ${events.join(', ')}`);

if (dialogue.state === 'IDLE' && game.plotPhase === 'find_creature') {
    console.log('\n✅ No auto-restart detected');
    console.log('Dialogue completed normally and plotPhase changed to find_creature');
    process.exit(0);
} else {
    console.log('\n❌ Unexpected final state');
    console.log(`  Expected: IDLE, plotPhase=find_creature`);
    console.log(`  Got: ${dialogue.state}, plotPhase=${game.plotPhase}`);
    process.exit(1);
}
