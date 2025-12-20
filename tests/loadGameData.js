/**
 * Load game data for testing
 * Extracts NPCS, QUESTS, QUEST_STEP_HANDLERS from data.js
 * and GameState from game.js
 */

const fs = require('fs');
const path = require('path');

// Read game.js to extract GameState
const gamePath = path.join(__dirname, '../src/game.js');
const gameContent = fs.readFileSync(gamePath, 'utf8');

// Extract GameState definition
const gameStateMatch = gameContent.match(/const GameState = \{[^}]+\}/s);
if (!gameStateMatch) {
    throw new Error('Could not find GameState in game.js');
}

// Evaluate GameState
const gameStateFunc = new Function(gameStateMatch[0] + '\nreturn GameState;');
const GameState = gameStateFunc();

// Read data.js
const dataPath = path.join(__dirname, '../src/data.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');

// Create a mock environment for the browser-based code
global.PlotPhase = {
    WAKE_UP: 'wake_up',
    FIND_CREATURE: 'find_creature',
    CREATURE_ENCOUNTER: 'creature_encounter',
    CREATURE_FOUND: 'creature_found',
    MEET_VILLAGER: 'meet_villager',
    BOAT_QUEST: 'boat_quest',
    WORKING: 'working'
};

// Use Function constructor to safely evaluate the code
const func = new Function('PlotPhase', 'GameState', dataContent + '\nreturn { NPCS, QUESTS, CREATURES, MAP_DATA, QUEST_STEP_HANDLERS };');
const data = func(PlotPhase, GameState);

module.exports = {
    ...data,
    GameState
};
