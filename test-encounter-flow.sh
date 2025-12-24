#!/bin/bash
# Test that creature naming UI appears after bonding dialogue

set -e

echo "Testing creature encounter flow..."

# Start a test server in background
python3 -m http.server 8888 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 1

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT

# Test would go here with puppeteer/playwright
# For now, just check that required files exist
echo "✓ Checking required files..."

[ -f "index.html" ] || { echo "✗ index.html missing"; exit 1; }
[ -f "src/game.js" ] || { echo "✗ game.js missing"; exit 1; }
[ -f "src/dialogueQueueSystem.js" ] || { echo "✗ dialogueQueueSystem.js missing"; exit 1; }

# Check that naming UI elements exist in HTML
grep -q 'id="firstEncounterUI"' index.html || { echo "✗ firstEncounterUI element missing"; exit 1; }
grep -q 'id="encounterText"' index.html || { echo "✗ encounterText element missing"; exit 1; }
grep -q 'id="encounterChoices"' index.html || { echo "✗ encounterChoices element missing"; exit 1; }
grep -q 'id="encounterCreatureCanvas"' index.html || { echo "✗ encounterCreatureCanvas element missing"; exit 1; }

# Check that handler is registered
grep -q "trigger:creature_bonding_complete" src/game.js || { echo "✗ creature_bonding_complete handler not registered"; exit 1; }

# Check that emit uses for loop not forEach (regression check)
grep -q "for (let index = 0; index < this.listeners\[event\].length; index++)" src/dialogueQueueSystem.js || { echo "✗ emit() not using for loop"; exit 1; }

echo "✓ All basic checks passed"
echo ""
echo "⚠️  Note: Full browser testing requires puppeteer/playwright"
echo "   This script only validates file structure and key code patterns"

exit 0
