#!/bin/bash
# Unroll All Dialogue Trees - Comprehensive testing
# Tests all NPCs across multiple game states

cd "$(dirname "$0")"

OUTPUT_FILE="${1:-all-dialogues.txt}"

echo "Unrolling all dialogue trees to $OUTPUT_FILE..."

node > "$OUTPUT_FILE" << 'NODESCRIPT'
const { NPCS, QUESTS, QUEST_STEP_HANDLERS, GameState } = require('./loadGameData.js');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║      COMPLETE DIALOGUE TREE UNROLL - ALL NPCS        ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Create mock game object that tracks state changes
function createMockGame(initialState) {
    const stateLog = [];
    const eventLog = [];

    const game = {
        // Game state
        state: initialState.state || GameState.EXPLORING,
        plotPhase: initialState.plotPhase || 'boat_quest',
        hasInspectedBoat: initialState.hasInspectedBoat !== undefined ? initialState.hasInspectedBoat : true,
        completedQuests: initialState.completedQuests || new Set(),
        activeQuest: null,
        questObjective: null,

        // Track state changes
        _stateLog: stateLog,
        _eventLog: eventLog,

        // Intercept state setter
        set state(newState) {
            stateLog.push({ type: 'state', from: this._state, to: newState });
            this._state = newState;
        },
        get state() {
            return this._state;
        },
        _state: initialState.state || GameState.EXPLORING,

        // Mock player
        player: { x: 10, y: 10 },

        // Mock dialogue system
        dialogue: {
            active: false,
            currentText: '',
            choices: null
        },

        dialogueSystem: {
            startDialogue: function(lines, choices, onClose, speaker) {
                eventLog.push({
                    type: 'startDialogue',
                    lines,
                    choices: choices ? choices.length : 0,
                    speaker,
                    hasOnClose: !!onClose
                });
                game.dialogue.active = true;
                game.state = choices ? GameState.DIALOGUE_CHOICE : GameState.DIALOGUE;
            },

            endDialogue: function() {
                eventLog.push({ type: 'endDialogue' });
                game.dialogue.active = false;
                game.state = GameState.EXPLORING;
            }
        },

        // Mock quest system
        questSystem: {
            showQuestMenu: function(npcId, npc) {
                eventLog.push({ type: 'showQuestMenu', npcId });
                // Quest menu shows dialogue with choices
                game.dialogueSystem.startDialogue(
                    [npc.questGreeting || "Choose a task:"],
                    [{text: "Mock choice"}],
                    null,
                    npc.name
                );
            },

            startQuest: function(questId) {
                eventLog.push({ type: 'startQuest', questId });
                const quest = QUESTS[questId];
                game.activeQuest = {
                    questId: questId,
                    quest: quest,
                    currentStep: 0
                };

                if (quest.type === 'multi_step') {
                    // This should call endDialogue() first
                    game.dialogueSystem.endDialogue();
                    this.advanceQuestStep();
                }
            },

            advanceQuestStep: function() {
                const quest = game.activeQuest.quest;
                const step = quest.steps[game.activeQuest.currentStep];
                const handler = QUEST_STEP_HANDLERS[step.type];
                if (handler && handler.onStart) {
                    handler.onStart(game, step);
                }
            }
        },

        // Mock methods that handlers might call
        showDialog: function(text, onClose) {
            eventLog.push({ type: 'showDialog', text, hasOnClose: !!onClose });
        },

        // Helper to get logs
        getStateLog: function() {
            return stateLog.slice();
        },

        getEventLog: function() {
            return eventLog.slice();
        },

        clearLogs: function() {
            stateLog.length = 0;
            eventLog.length = 0;
        }
    };

    return game;
}

// Test states for each NPC
const testStates = {
    marlowe: [
        { plotPhase: 'wake_up', state: GameState.EXPLORING },
        { plotPhase: 'find_creature', state: GameState.EXPLORING },
        { plotPhase: 'creature_found', state: GameState.EXPLORING },
        { plotPhase: 'meet_villager', state: GameState.EXPLORING },
        { plotPhase: 'boat_quest', state: GameState.EXPLORING }
    ],
    callum: [
        { plotPhase: 'meet_villager', hasInspectedBoat: false, state: GameState.EXPLORING },
        { plotPhase: 'boat_quest', hasInspectedBoat: true, completedQuests: new Set(), state: GameState.EXPLORING },
        { plotPhase: 'boat_quest', hasInspectedBoat: true, completedQuests: new Set(['fishing_crates']), state: GameState.EXPLORING }
    ]
};

// Test Marlowe
console.log('\n' + '='.repeat(70));
console.log('MARLOWE DIALOGUE TREE');
console.log('='.repeat(70));

testStates.marlowe.forEach((initialState, i) => {
    console.log(`\n[STATE ${i + 1}: plotPhase=${initialState.plotPhase}]`);
    console.log('─'.repeat(70));

    const game = createMockGame(initialState);
    const marlowe = NPCS.marlowe;
    const dialogue = marlowe.dialogues.find(d => d.condition(game));

    if (!dialogue) {
        console.log('⚠️  No matching dialogue found!');
        return;
    }

    console.log(`Speaker: ${marlowe.name}`);

    // Handle array or string text
    if (Array.isArray(dialogue.text)) {
        console.log(`Text (${dialogue.text.length} lines):`);
        dialogue.text.forEach((line, idx) => {
            if (typeof line === 'string') {
                console.log(`  ${idx + 1}. "${line}"`);
            } else {
                console.log(`  ${idx + 1}. [${line.speaker}]: "${line.text}"`);
            }
        });
    } else {
        console.log(`Text: "${dialogue.text}"`);
    }

    if (dialogue.choices) {
        console.log(`\nChoices (${dialogue.choices.length}):`);
        dialogue.choices.forEach((c, idx) => {
            console.log(`  ${idx + 1}. "${c.text}"`);
        });
    } else {
        console.log('\nNo choices (auto-advance dialogue)');
    }

    if (dialogue.onClose) {
        console.log('Has onClose handler: Yes');
    }
});

// Test Callum with quest interaction
console.log('\n\n' + '='.repeat(70));
console.log('CALLUM DIALOGUE TREE & QUEST FLOW');
console.log('='.repeat(70));

console.log('\n[TEST 1: First interaction - No quests completed]');
console.log('─'.repeat(70));

let game = createMockGame({
    plotPhase: 'boat_quest',
    hasInspectedBoat: true,
    completedQuests: new Set(),
    state: GameState.EXPLORING
});

const callum = NPCS.callum;
let dialogue = callum.dialogues.find(d => d.condition(game));

console.log(`\nStep 1: Player presses A near Callum`);
console.log(`Speaker: ${callum.name}`);
console.log(`Text: "${dialogue.text}"`);
console.log(`Choices:`);
dialogue.choices.forEach((c, i) => {
    console.log(`  ${i + 1}. "${c.text}"`);
});

console.log(`\nStep 2: Player selects "Show me the work"`);
game.clearLogs();

// Simulate selecting first choice (Show me the work)
const showWorkChoice = dialogue.choices[0];
if (showWorkChoice.action) {
    console.log(`\nExecuting choice action...`);
    showWorkChoice.action(game);

    const eventLog = game.getEventLog();
    console.log(`\n📝 EVENTS TRIGGERED:`);
    eventLog.forEach(event => {
        if (event.type === 'showQuestMenu') {
            console.log(`  ✓ showQuestMenu('${event.npcId}') called`);
        } else if (event.type === 'startDialogue') {
            console.log(`  ✓ startDialogue() called`);
            console.log(`    - Speaker: ${event.speaker}`);
            console.log(`    - Text lines: ${event.lines.length}`);
            console.log(`    - Choices: ${event.choices}`);
            console.log(`    - Text: "${event.lines[0]}"`);
        }
    });

    const stateLog = game.getStateLog();
    console.log(`\n📝 STATE CHANGES:`);
    stateLog.forEach(log => {
        if (log.type === 'state') {
            console.log(`  ✓ game.state: ${log.from} → ${log.to}`);
        }
    });

    console.log(`\n📊 CURRENT STATE:`);
    console.log(`  game.state = ${game.state}`);
    console.log(`  dialogue.active = ${game.dialogue.active}`);
}

console.log(`\n⚠️  BUG CHECK #1: Double-click A to display tasks`);
console.log(`   Current state: ${game.state}`);
console.log(`   Dialogue active: ${game.dialogue.active}`);
console.log(`   Expected: Quest menu should be visible immediately`);
console.log(`   Actual: If state is DIALOGUE_CHOICE and dialogue.active=true, quest menu IS showing`);
console.log(`   Issue: If A button handler checks for EXPLORING state, it won't work!`);

// Test quest selection
console.log(`\n\nStep 3: Player selects "Check the Catch Records (100 coins)"`);
console.log('─'.repeat(70));

game.clearLogs();
game.questSystem.startQuest('fishing_records');

const eventLog2 = game.getEventLog();
console.log(`\n📝 EVENTS TRIGGERED:`);
eventLog2.forEach(event => {
    if (event.type === 'startQuest') {
        console.log(`  ✓ startQuest('${event.questId}') called`);
    } else if (event.type === 'endDialogue') {
        console.log(`  ✓ endDialogue() called - Quest menu closed`);
    } else if (event.type === 'showDialog') {
        console.log(`  ⚠️  showDialog() called: "${event.text}"`);
    }
});

const stateLog2 = game.getStateLog();
console.log(`\n📝 STATE CHANGES:`);
stateLog2.forEach(log => {
    if (log.type === 'state') {
        console.log(`  ✓ game.state: ${log.from} → ${log.to}`);
    }
});

console.log(`\n📊 FINAL STATE:`);
console.log(`  game.state = ${game.state}`);
console.log(`  game.questObjective = "${game.questObjective}"`);
console.log(`  game.activeQuest = ${game.activeQuest ? 'Set' : 'null'}`);

console.log(`\n⚠️  BUG CHECK #2: Tasks aren't explained after selection`);
console.log(`   Quest objective: "${game.questObjective}"`);
console.log(`   Expected: Should show "Check the nets on the western beach"`);
console.log(`   This IS being set! So the objective should appear on screen.`);

// Test quest completion (answering correctly)
console.log(`\n\nStep 4: Player reaches western beach and answers correctly`);
console.log('─'.repeat(70));

const firstStep = QUESTS.fishing_records.steps[0];
const handler = QUEST_STEP_HANDLERS[firstStep.type];

// Move player to location
game.player.x = firstStep.location.x;
game.player.y = firstStep.location.y;

console.log(`\nPlayer at (${game.player.x}, ${game.player.y})`);
console.log(`Calling handler.onUpdate()...`);

game.clearLogs();
const updateResult = handler.onUpdate(game, firstStep);

console.log(`\n📝 HANDLER RETURNED:`);
console.log(`  completed: ${updateResult.completed}`);
console.log(`  message: "${updateResult.message}"`);
console.log(`  choices: ${updateResult.choices ? updateResult.choices.length : 0}`);

if (updateResult.choices) {
    console.log(`\nChoices returned:`);
    updateResult.choices.forEach((choice, i) => {
        const isCorrect = choice.text === String(firstStep.onArrive.problem.correct);
        console.log(`  ${i + 1}. "${choice.text}" ${isCorrect ? '✓ CORRECT' : ''}`);
    });

    console.log(`\nStep 5: Player selects correct answer (11)`);
    console.log('─'.repeat(70));

    const correctChoice = updateResult.choices.find(c => c.text === String(firstStep.onArrive.problem.correct));

    console.log(`\nExecuting correct answer's action...`);
    game.clearLogs();

    // Call the action
    correctChoice.action();

    const eventLog3 = game.getEventLog();
    console.log(`\n📝 EVENTS TRIGGERED:`);
    if (eventLog3.length === 0) {
        console.log(`  (none)`);
    }
    eventLog3.forEach(event => {
        if (event.type === 'showDialog') {
            console.log(`  ✓ showDialog("${event.text}")`);
        }
    });

    console.log(`\n📊 FINAL STATE:`);
    console.log(`  game.activeQuest.currentStep = ${game.activeQuest.currentStep}`);
    console.log(`  game.questObjective = ${game.questObjective}`);
    console.log(`  game.state = ${game.state}`);

    console.log(`\n⚠️  BUG CHECK #3: Menu freezes after correct answer`);
    console.log(`   The action calls showDialog() then setTimeout(() => advanceQuestStep())`);
    console.log(`   Problem: setTimeout won't execute in this test environment!`);
    console.log(`   In real game, if dialogue isn't properly closed, menu could freeze.`);
}

console.log('\n\n' + '='.repeat(70));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(70));

console.log(`
✅ DIALOGUE TREES MAPPED:
   ✓ Marlowe: ${testStates.marlowe.length} states tested
   ✓ Callum: Quest flow traced end-to-end

⚠️  POTENTIAL BUGS IDENTIFIED:

1. DOUBLE-CLICK A BUG:
   Root cause: Quest menu puts game in DIALOGUE_CHOICE state.
   If A button handler only works in EXPLORING state, player must:
     - Press A once to close dialogue (back to EXPLORING)
     - Press A again to advance

   Fix: A button should work in DIALOGUE_CHOICE for advancing choices

2. TASKS NOT EXPLAINED BUG:
   Quest objective IS being set: "${game.questObjective}"
   If it's not showing on screen, the issue is in rendering, not logic.

   Check: Does renderingSystem.js show questObjective text?

3. MENU FREEZE BUG:
   Choice action calls showDialog("Correct!") then setTimeout
   Problem: If dialogue closes after setTimeout, timing issue

   Fix: Don't use setTimeout - immediately call advanceQuestStep()
        or ensure dialogue properly chains
`);

NODESCRIPT

echo "✓ All dialogues unrolled to $OUTPUT_FILE"
echo "  Run: cat $OUTPUT_FILE | less"
