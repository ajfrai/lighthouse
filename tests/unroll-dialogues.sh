#!/bin/bash
# Unroll Dialogue Trees - Exercises actual codebase
# Simulates game flow by calling real handlers and recording state changes

# Change to tests directory
cd "$(dirname "$0")"

OUTPUT_FILE="${1:-dialogue-trace.txt}"

echo "Unrolling dialogue trees to $OUTPUT_FILE..."

node > "$OUTPUT_FILE" << 'NODESCRIPT'
const { NPCS, QUESTS, QUEST_STEP_HANDLERS, GameState } = require('./loadGameData.js');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║    DIALOGUE TREE UNROLL - EXERCISING CODEBASE        ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Create mock game object that tracks state changes
function createMockGame(initialState) {
    const stateLog = [];

    const game = {
        // Game state
        state: GameState.EXPLORING,
        plotPhase: initialState.plotPhase || 'boat_quest',
        hasInspectedBoat: initialState.hasInspectedBoat !== undefined ? initialState.hasInspectedBoat : true,
        completedQuests: initialState.completedQuests || new Set(),
        activeQuest: null,
        questObjective: null,

        // Track state changes
        _stateLog: stateLog,

        // Intercept state setter
        set state(newState) {
            stateLog.push({ type: 'state', from: this._state, to: newState });
            this._state = newState;
        },
        get state() {
            return this._state;
        },
        _state: GameState.EXPLORING,

        // Mock player
        player: { x: 10, y: 10 },

        // Mock methods that handlers might call
        showDialog: function(text, onClose) {
            stateLog.push({ type: 'showDialog', text, hasOnClose: !!onClose });
        },

        dialogueSystem: {
            endDialogue: function() {
                stateLog.push({ type: 'endDialogue' });
                game.state = GameState.EXPLORING;
            }
        },

        // Helper to get state log
        getStateLog: function() {
            return stateLog.slice();
        },

        clearStateLog: function() {
            stateLog.length = 0;
        }
    };

    return game;
}

// Callum interaction flow
console.log('\n' + '='.repeat(70));
console.log('CALLUM - FIRST QUEST INTERACTION (100 COIN QUEST)');
console.log('='.repeat(70));

const game = createMockGame({
    plotPhase: 'boat_quest',
    hasInspectedBoat: true,
    completedQuests: new Set()
});

console.log('\n[PLAYER APPROACHES CALLUM AND PRESSES A]');
console.log('─'.repeat(70));

const callum = NPCS.callum;
let dialogue = callum.dialogues.find(d => d.condition(game));

console.log(`Speaker: ${callum.name}`);
console.log(`Text: "${dialogue.text}"`);
console.log(`\nChoices:`);
dialogue.choices.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.text}`);
});

console.log('\n[PLAYER SELECTS "Show me the work"]');
console.log('─'.repeat(70));

console.log(`\nAction: game.questSystem.showQuestMenu('callum', NPCS.callum)`);
console.log(`\nQuest Menu Opens:`);
console.log(`Speaker: ${callum.name}`);
console.log(`Text: "Choose a task:" (questGreeting fallback)`);

console.log(`\nQuest Choices:`);
let choiceNum = 1;

// Show one-off quests
callum.quests.oneOff.forEach(qId => {
    const quest = QUESTS[qId];
    console.log(`  ${choiceNum++}. Quick Problem (${quest.reward} coins) - 0/3`);
});

// Show full quest
const fullQuest = QUESTS[callum.quests.full];
console.log(`  ${choiceNum++}. ${fullQuest.name} (${fullQuest.reward} coins) ← 100 COIN QUEST`);
console.log(`  ${choiceNum}. Not right now`);

console.log('\n[PLAYER SELECTS "Check the Catch Records (100 coins)"]');
console.log('─'.repeat(70));

console.log(`\nQuest: ${fullQuest.name}`);
console.log(`Type: ${fullQuest.type}`);
console.log(`Reward: ${fullQuest.reward} coins`);
console.log(`Total Steps: ${fullQuest.steps.length}`);

console.log(`\n┌─ QUEST FLOW ────────────────────────────────────────────┐`);
fullQuest.steps.forEach((step, i) => {
    console.log(`│ Step ${i + 1}: ${step.type.toUpperCase()}`);
    if (step.type === 'visit_and_solve') {
        console.log(`│   Task: ${step.description}`);
        console.log(`│   Location: (${step.location.x}, ${step.location.y}) ${step.markerText}`);
        console.log(`│   Arrival: "${step.onArrive.message}"`);
        if (step.onArrive.problem) {
            console.log(`│   Problem: "${step.onArrive.problem.question}"`);
            console.log(`│   Answers: [${step.onArrive.problem.answers.join(', ')}]`);
            console.log(`│   Correct: ${step.onArrive.problem.correct}`);
        }
    } else if (step.type === 'visit_location') {
        console.log(`│   Description: ${step.description}`);
        console.log(`│   Location: (${step.location.x}, ${step.location.y})`);
        console.log(`│   On Arrive: "${step.onArrive.message}"`);
    } else if (step.type === 'problem') {
        console.log(`│   Question: "${step.question}"`);
        console.log(`│   Answers: [${step.answers.join(', ')}]`);
        console.log(`│   Correct: ${step.correct}`);
    }
    if (i < fullQuest.steps.length - 1) console.log(`│`);
});
console.log(`└─────────────────────────────────────────────────────────┘`);

console.log('\n[SIMULATING: startQuest() called]');
console.log('─'.repeat(70));

// SIMULATE: startQuest() would call endDialogue() for multi_step quests
game.clearStateLog();
console.log('\nCalling: game.dialogueSystem.endDialogue()');
game.dialogueSystem.endDialogue();

let stateLog = game.getStateLog();
console.log('\n📝 STATE CHANGES:');
stateLog.forEach(log => {
    if (log.type === 'endDialogue') {
        console.log('  ✓ endDialogue() called');
    } else if (log.type === 'state') {
        console.log(`  ✓ game.state changed: ${log.from} → ${log.to}`);
    }
});

console.log('\n[SIMULATING: advanceQuestStep() - First step]');
console.log('─'.repeat(70));

// Set up active quest
game.activeQuest = {
    questId: 'fishing_records',
    quest: fullQuest,
    currentStep: 0
};

const firstStep = fullQuest.steps[0];
const handler = QUEST_STEP_HANDLERS[firstStep.type];

if (!handler) {
    console.log(`\n❌ ERROR: No handler found for step type "${firstStep.type}"`);
    process.exit(1);
}

console.log(`\n✓ Handler found: QUEST_STEP_HANDLERS['${firstStep.type}']`);
console.log(`\nCalling: handler.onStart(game, step)`);

game.clearStateLog();
handler.onStart(game, firstStep);

stateLog = game.getStateLog();
console.log('\n📝 STATE CHANGES:');
stateLog.forEach(log => {
    if (log.type === 'state') {
        console.log(`  ✓ game.state changed: ${log.from} → ${log.to}`);
    } else if (log.type === 'showDialog') {
        console.log(`  ⚠️  showDialog() called: "${log.text}"`);
    }
});

console.log('\n📊 FINAL STATE:');
console.log(`  game.state = ${game.state}`);
console.log(`  game.questObjective = "${game.questObjective}"`);
console.log(`  game.activeQuest.currentStep = ${game.activeQuest.currentStep}`);

console.log(`\n✅ EXPECTED: Player can explore, quest objective shown on screen`);
console.log(`   Player walks to (${firstStep.location.x}, ${firstStep.location.y})`);

console.log(`\n[SIMULATING: Player reaches western beach]`);
console.log('─'.repeat(70));

// Move player to location
game.player.x = firstStep.location.x;
game.player.y = firstStep.location.y;

console.log(`\nPlayer position: (${game.player.x}, ${game.player.y})`);
console.log(`\nCalling: handler.onUpdate(game, step)`);

game.clearStateLog();
const updateResult = handler.onUpdate(game, firstStep);

console.log('\n📝 HANDLER RETURNED:');
console.log(`  completed: ${updateResult.completed}`);
if (updateResult.message) {
    console.log(`  message: "${updateResult.message}"`);
}
if (updateResult.choices) {
    console.log(`  choices: ${updateResult.choices.length} choices`);
    updateResult.choices.forEach((choice, i) => {
        const mark = choice.text === String(firstStep.onArrive.problem.correct) ? '✓ CORRECT' : '';
        console.log(`    ${i + 1}. ${choice.text} ${mark}`);
    });
}

console.log('\n\n' + '='.repeat(70));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(70));

// Check for issues
const issues = [];
const successes = [];

if (QUEST_STEP_HANDLERS['visit_and_solve']) {
    successes.push('visit_and_solve handler exists');
} else {
    issues.push('visit_and_solve handler not found');
}

if (game.questObjective === firstStep.description) {
    successes.push(`Quest objective set correctly: "${game.questObjective}"`);
} else {
    issues.push(`Quest objective mismatch: expected "${firstStep.description}", got "${game.questObjective}"`);
}

if (updateResult && updateResult.completed) {
    successes.push('Handler.onUpdate() returns completed=true at location');
} else {
    issues.push('Handler.onUpdate() did not complete at location');
}

if (updateResult && updateResult.choices && updateResult.choices.length > 0) {
    successes.push(`Choices provided: ${updateResult.choices.length} options`);
} else {
    issues.push('No choices returned by handler');
}

console.log('\n✅ VERIFIED:');
successes.forEach(s => console.log(`   ✓ ${s}`));

if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(i => console.log(`   ✗ ${i}`));
    console.log('\n⚠️  CODEBASE HAS BUGS - Fix required!');
} else {
    console.log('\n🎉 ALL CHECKS PASSED - Codebase working as expected!');
}

NODESCRIPT

echo "✓ Dialogue trace written to $OUTPUT_FILE"
echo "  Run: cat $OUTPUT_FILE | less"
