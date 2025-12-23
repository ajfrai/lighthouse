#!/usr/bin/env node

// Test the creature encounter flow by inspecting the actual files
console.log('=== Creature Encounter Flow Analysis ===\n');

const fs = require('fs');

// Read files
const dataContent = fs.readFileSync('./src/data.js', 'utf8');
const gameContent = fs.readFileSync('./src/game.js', 'utf8');

function assert(condition, message) {
    if (condition) {
        console.log('✓', message);
    } else {
        console.log('✗', message);
        process.exit(1);
    }
}

console.log('Test 1: Verify bonding dialogue has trigger');
const bondingMatch = dataContent.match(/bonding:\s*{[\s\S]*?trigger:\s*['"]([^'"]+)['"]/);
if (bondingMatch) {
    console.log('  Bonding trigger found:', bondingMatch[1]);
    assert(bondingMatch[1] === 'creature_bonding_complete',
           'bonding has creature_bonding_complete trigger');
} else {
    console.log('✗ Bonding dialogue does not have a trigger!');
    // Show what we found
    const bondingSection = dataContent.match(/bonding:\s*{[\s\S]{0,300}/);
    console.log('\nBonding section:');
    console.log(bondingSection ? bondingSection[0] : 'not found');
    process.exit(1);
}

console.log('\nTest 2: Verify trigger listeners in game.js');

// Check for creature_path_complete listener
const pathCompleteMatch = gameContent.match(/on\(['"]trigger:creature_path_complete['"]/);
assert(pathCompleteMatch, 'creature_path_complete listener registered');

// Check for creature_bonding_complete listener
const bondingCompleteMatch = gameContent.match(/on\(['"]trigger:creature_bonding_complete['"]/);
assert(bondingCompleteMatch, 'creature_bonding_complete listener registered');

// Check what the bonding_complete listener does
const bondingHandlerMatch = gameContent.match(/on\(['"]trigger:creature_bonding_complete['"][\s\S]{0,300}showCreatureNaming/);
assert(bondingHandlerMatch, 'creature_bonding_complete listener calls showCreatureNaming');

console.log('\nTest 3: Verify finishCreatureEncounter queues bonding');
const finishMatch = gameContent.match(/finishCreatureEncounter\(\)\s*{[\s\S]{0,500}queueFlow\(CREATURE_FLOWS\.bonding\)/);
assert(finishMatch, 'finishCreatureEncounter queues bonding flow');

console.log('\nTest 4: Verify showCreatureNaming exists and shows UI');
const showNamingMatch = gameContent.match(/showCreatureNaming\(\)[\s\S]{0,500}encounterUI/);
assert(showNamingMatch, 'showCreatureNaming shows encounterUI');

console.log('\n=== Expected Flow ===');
console.log('1. Player chooses slow/wait/grab path');
console.log('2. Last dialogue emits: trigger:creature_path_complete');
console.log('3. Handler calls: finishCreatureEncounter()');
console.log('4. finishCreatureEncounter() queues CREATURE_FLOWS.bonding');
console.log('5. Bonding dialogue is shown');
console.log('6. Bonding dialogue emits: trigger:creature_bonding_complete');
console.log('7. Handler calls: showCreatureNaming()');
console.log('8. Dedicated naming UI appears');

console.log('\n✓ ALL STATIC TESTS PASSED');
console.log('\nThe code structure is correct. If it\'s not working in-game,');
console.log('check browser console for errors and verify listeners are registered.');
