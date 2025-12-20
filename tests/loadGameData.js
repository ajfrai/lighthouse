/**
 * Load game data for testing
 * Extracts NPCS and QUESTS from data.js
 */

const fs = require('fs');
const path = require('path');

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
const func = new Function('PlotPhase', dataContent + '\nreturn { NPCS, QUESTS, CREATURES, MAP_DATA };');
const data = func(PlotPhase);

module.exports = data;
