/**
 * Debug Logger - Captures console.log and displays on screen for mobile testing
 */

class DebugLogger {
    constructor() {
        this.enabled = false;
        this.logs = [];
        this.maxLogs = 50;
        this.originalConsoleLog = console.log;
        this.setupLogger();
    }

    setupLogger() {
        // Override console.log to capture messages
        const self = this;
        const originalLog = this.originalConsoleLog.bind(console);

        console.log = function(...args) {
            // Call original console.log with proper binding
            originalLog(...args);

            // If debug console enabled, add to visual log
            if (self.enabled) {
                const message = args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' ');

                self.addLog(message);
            }
        };
    }

    addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.push({ time: timestamp, message });

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.render();
    }

    render() {
        const content = document.getElementById('debugConsoleContent');
        if (!content) return;

        content.innerHTML = this.logs.map(log =>
            `<div class="debug-log-entry"><span class="debug-log-time">[${log.time}]</span> ${log.message}</div>`
        ).join('');

        // Auto-scroll to bottom
        content.scrollTop = content.scrollHeight;
    }

    toggle() {
        this.enabled = !this.enabled;
        const consoleDiv = document.getElementById('debugConsole');

        if (this.enabled) {
            consoleDiv.classList.remove('hidden');
            this.addLog('=== Debug Console Enabled ===');
        } else {
            consoleDiv.classList.add('hidden');
        }

        return this.enabled;
    }

    clear() {
        this.logs = [];
        this.render();
    }
}

// Create global debug logger
const debugLogger = new DebugLogger();
