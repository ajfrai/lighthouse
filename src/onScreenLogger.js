/**
 * On-Screen Debug Logger
 * Shows console logs directly in the game UI for mobile debugging
 */

class OnScreenLogger {
    constructor() {
        this.enabled = true;
        this.maxLines = 10;
        this.logs = [];
        this.createUI();
        this.interceptConsole();
    }

    createUI() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'onScreenLogger';
        this.overlay.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: #0f0;
            font-family: monospace;
            font-size: 11px;
            padding: 10px;
            border: 1px solid #0f0;
            max-height: 200px;
            overflow-y: auto;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(this.overlay);

        // Toggle button
        const toggle = document.createElement('button');
        toggle.textContent = '📋';
        toggle.style.cssText = `
            position: fixed;
            bottom: 50px;
            right: 10px;
            width: 40px;
            height: 40px;
            font-size: 20px;
            z-index: 10000;
            background: #333;
            color: #0f0;
            border: 2px solid #0f0;
            border-radius: 5px;
        `;
        toggle.onclick = () => {
            this.enabled = !this.enabled;
            this.overlay.style.display = this.enabled ? 'block' : 'none';
        };
        document.body.appendChild(toggle);
    }

    interceptConsole() {
        const originalLog = console.log;
        const self = this;

        console.log = function(...args) {
            // Call original
            originalLog.apply(console, args);

            // Add to on-screen logger
            const msg = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            // Only log DialogueQueue messages
            if (msg.includes('[DialogueQueue]') || msg.includes('[Dialogue]')) {
                self.addLog(msg);
            }
        };
    }

    addLog(msg) {
        this.logs.push(msg);
        if (this.logs.length > this.maxLines) {
            this.logs.shift();
        }
        this.render();
    }

    render() {
        if (!this.enabled) return;
        this.overlay.innerHTML = this.logs
            .map(log => {
                // Color-code important messages
                if (log.includes('★★★')) {
                    return `<div style="color: #ff0; font-weight: bold;">${this.escapeHtml(log)}</div>`;
                } else if (log.includes('showNPCDialog')) {
                    return `<div style="color: #0ff;">${this.escapeHtml(log)}</div>`;
                } else if (log.includes('ERROR') || log.includes('BUG')) {
                    return `<div style="color: #f00;">${this.escapeHtml(log)}</div>`;
                }
                return `<div>${this.escapeHtml(log)}</div>`;
            })
            .join('');
        this.overlay.scrollTop = this.overlay.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize
if (typeof window !== 'undefined') {
    window.onScreenLogger = new OnScreenLogger();
}
