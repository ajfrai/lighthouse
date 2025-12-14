#!/usr/bin/env python3
"""
Test the 'a' button functionality
This creates an HTML test page that logs all keyboard events
"""

html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Keyboard Event Test</title>
    <style>
        body {
            font-family: monospace;
            padding: 20px;
            background: #1a1a1a;
            color: #0f0;
        }
        #log {
            border: 1px solid #0f0;
            padding: 10px;
            height: 400px;
            overflow-y: scroll;
            margin-top: 20px;
        }
        .event {
            padding: 5px;
            border-bottom: 1px solid #333;
        }
        .document { color: #00ff00; }
        .window { color: #ffff00; }
    </style>
</head>
<body>
    <h1>Keyboard Event Test</h1>
    <p>Press keys to see the event order. Testing 'a', 'A', Space, Enter.</p>
    <div id="status">State: <span id="currentState">DIALOGUE</span></div>
    <div id="log"></div>

    <script>
        let eventCount = 0;
        const log = document.getElementById('log');

        function addLog(message, className = '') {
            const div = document.createElement('div');
            div.className = 'event ' + className;
            div.textContent = `${eventCount++}: ${message}`;
            log.appendChild(div);
            log.scrollTop = log.scrollHeight;
        }

        // Simulate game state
        const GameState = {
            DIALOGUE: 'dialogue',
            EXPLORING: 'exploring'
        };
        let currentState = GameState.DIALOGUE;

        // Document listener (like dialogueSystem.js)
        document.addEventListener('keydown', (e) => {
            addLog(`DOCUMENT listener: key="${e.key}" state=${currentState}`, 'document');

            if (currentState === GameState.DIALOGUE) {
                if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
                    e.preventDefault();
                    addLog(`  → Would advance dialogue`, 'document');
                }
            }
        });

        // Window listener (like game.js)
        window.addEventListener('keydown', (e) => {
            addLog(`WINDOW listener: key="${e.key}"`, 'window');
            e.preventDefault();  // This is what game.js does
            addLog(`  → Called preventDefault()`, 'window');
        });

        addLog('=== Test Started ===');
        addLog('Try pressing: a, A, Space, Enter');
    </script>
</body>
</html>
"""

with open('keyboard_test.html', 'w') as f:
    f.write(html_content)

print("✓ Created keyboard_test.html")
print("Open this file in a browser to test keyboard event handling")
