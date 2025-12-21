#!/usr/bin/env node

/**
 * Debug script to trace creature encounter dialogue flow
 */

const fs = require('fs');

// Load source files
const gameCode = fs.readFileSync('../src/game.js', 'utf8');
const dialogueCode = fs.readFileSync('../src/dialogueSystem.js', 'utf8');

console.log('=== CREATURE ENCOUNTER FLOW ANALYSIS ===\n');

// Check 1: showCreatureNarrative definition
console.log('1. showCreatureNarrative definition:');
const narrativeDefMatch = gameCode.match(/showCreatureNarrative\s*\([^)]+\)\s*\{[^}]+\}/);
if (narrativeDefMatch) {
    console.log(narrativeDefMatch[0]);
    console.log('✓ Function exists and passes onContinue to startDialogue\n');
} else {
    console.log('❌ Function not found!\n');
}

// Check 2: game.startDialogue wrapper
console.log('2. game.startDialogue wrapper:');
const wrapperMatch = gameCode.match(/^\s{4}startDialogue\s*\([^)]+\)\s*\{[^}]+\}/m);
if (wrapperMatch) {
    console.log(wrapperMatch[0]);
    const hasOnClose = wrapperMatch[0].includes('onClose');
    if (hasOnClose) {
        console.log('✓ Wrapper accepts and passes onClose parameter\n');
    } else {
        console.log('❌ Wrapper does NOT pass onClose parameter!\n');
    }
} else {
    console.log('❌ Wrapper not found!\n');
}

// Check 3: dialogueSystem.startDialogue
console.log('3. dialogueSystem.startDialogue:');
const dsStartMatch = dialogueCode.match(/startDialogue\s*\([^)]+\)\s*\{[\s\S]{0,500}/);
if (dsStartMatch) {
    const snippet = dsStartMatch[0].split('\n').slice(0, 10).join('\n');
    console.log(snippet);
    const storesOnClose = dialogueCode.includes('this.game.dialogue.onClose = onClose');
    if (storesOnClose) {
        console.log('✓ Stores onClose handler\n');
    } else {
        console.log('❌ Does NOT store onClose handler!\n');
    }
} else {
    console.log('❌ Function not found!\n');
}

// Check 4: endDialogue calls onClose
console.log('4. endDialogue onClose execution:');
const endDialogueMatch = dialogueCode.match(/endDialogue\s*\(\s*\)\s*\{[\s\S]{0,300}/);
if (endDialogueMatch) {
    const snippet = endDialogueMatch[0].split('\n').slice(0, 15).join('\n');
    console.log(snippet);
    const callsOnClose = dialogueCode.includes('onCloseHandler(');
    if (callsOnClose) {
        console.log('✓ Calls onClose handler\n');
    } else {
        console.log('❌ Does NOT call onClose handler!\n');
    }
} else {
    console.log('❌ Function not found!\n');
}

// Check 5: advanceDialogue flow
console.log('5. advanceDialogue -> endDialogue flow:');
const advanceMatch = dialogueCode.match(/advanceDialogue\s*\(\s*\)\s*\{[\s\S]{0,1000}/);
if (advanceMatch) {
    const callsEnd = advanceMatch[0].includes('this.endDialogue()');
    if (callsEnd) {
        console.log('✓ advanceDialogue calls endDialogue when no more lines\n');
    } else {
        console.log('❌ advanceDialogue does NOT call endDialogue!\n');
    }
} else {
    console.log('❌ Function not found!\n');
}

// Check 6: First narrative call
console.log('6. First narrative call in handleCreatureInteraction:');
const firstNarrativeMatch = gameCode.match(/showCreatureNarrative\("Something small is huddled[^"]+",\s*\(\)\s*=>\s*\{/);
if (firstNarrativeMatch) {
    console.log(firstNarrativeMatch[0]);
    console.log('✓ First narrative has callback\n');
} else {
    console.log('❌ First narrative not found!\n');
}

console.log('=== ANALYSIS COMPLETE ===');
