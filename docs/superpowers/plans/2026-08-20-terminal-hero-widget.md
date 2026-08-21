# Terminal Hero Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the "variant E" draggable terminal-widget prototype into the final feature: drag-to-float (stays fixed on screen through scroll), expand/collapse with a purple blurred backdrop and a resize handle, a real interactive command line with 9 documented commands plus one secret easter-egg command (10 total), and a single reset control — then merge it into the real `index.html` and delete the four losing preview variants.

**Architecture:** Split into two small vanilla-JS scripts with no framework and no build step. `components/terminal-hero.js` owns everything *inside* the window: the autoplay typewriter script and the interactive command engine (parsing typed input, running commands, updating the screen-reader transcript). `components/terminal-widget.js` owns everything about *how the window behaves on the page*: drag/dock/float positioning, expand/collapse, resize, and the reset control — it composes one `terminal-hero.js` instance and knows nothing about what a "command" is.

**Tech Stack:** Plain HTML/CSS/JS (ES5-compatible syntax, no bundler, no npm). Verification is manual, via the project's browser tool (`mcp__Claude_Browser__*`), dispatching real DOM/pointer events and reading back computed styles and text content — this repo has no test framework, so that manual browser-driven check is this project's equivalent of "run the tests."

## Global Constraints

- No localStorage/sessionStorage persistence — position, size, and the interactive transcript are in-memory only and reset on page reload.
- No drag/expand/resize on mobile — the whole widget is `display: none` below 950px viewport width (same breakpoint the existing polaroid photo uses).
- No automated test suite exists in this repo — every verification step below is a manual browser-tool check, not a unit test run.
- Every command's output is a static, developer-authored string; only `contact`'s output uses `innerHTML` (with fixed, hardcoded markup — never built from visitor input). All other output uses `textContent`.
- The widget must never block or replace the existing hero content (headline, photo, CTA row) — it's an addition, not a redesign.
- Command matching is case-insensitive on the verb; unknown input prints `'<input>' is not recognized as a command. Type 'help' to see available commands.`

---

## Task 1: Interactive command engine in `terminal-hero.js`

**Files:**
- Modify: `components/terminal-hero.js` (full rewrite)
- Modify: `components/terminal-hero.css` (append new rules)

**Interfaces:**
- Produces: `window.createTerminalHero(mountEl, opts)` where `opts = { lines?, loop?, commands?, controls?, onExit? }`.
  - `controls`: optional array of `{ icon: string, ariaLabel: string, onClick: Function }`, rendered as buttons in the title bar's right side, in array order. Each button calls `e.stopPropagation()` on `pointerdown` and `click` before invoking `onClick`, so a draggable title bar (added in Task 3) never starts a drag from a button click.
  - `onExit`: optional callback invoked when the visitor types the `exit` command.
  - Returns `{ destroy(), reset(), enterInteractiveMode() }`.
- Consumes: nothing from other tasks (this is the foundation).

- [ ] **Step 1: Replace `components/terminal-hero.js` with the full new engine**

```javascript
/* Terminal Hero: mock PowerShell widget — typewriter intro + interactive command line.
   Usage: const hero = createTerminalHero(mountEl, { lines, loop, commands, controls, onExit }) */
(function () {
  const PROMPT = 'PS C:\\Users\\dareen> ';

  const WHOAMI_LINE = "Dareen Nasreldin — Comp Eng @ UofT (PEY '29) · Systems, ML & Algorithms";
  const STACK_LINE = '[C++, PyTorch, C, Python, Verilog, Bash, LLMs]';

  const DEFAULT_SCRIPT = [
    { type: 'cmd', text: 'whoami' },
    { type: 'out', text: WHOAMI_LINE },
    { type: 'cmd', text: 'Get-Stack --core' },
    { type: 'out', text: STACK_LINE },
    { type: 'cmd', text: 'Get-Impact --recent' },
    { type: 'out', text: '> Exiger: cut E2E QA testing 3hrs -> 4mins via k6 automation' },
    { type: 'out', text: '> NeurotechUofT: dropped PyTorch model run-to-run variance 9x' },
    { type: 'cmd', text: 'Start-Conversation', final: true }
  ];

  const HELP_LINES = [
    'Available commands:',
    '  help              show this list',
    '  whoami            who I am',
    '  Get-Stack         my core tech stack',
    '  Get-Projects      featured projects',
    '  Get-Experience    work & research history',
    '  contact           how to reach me',
    '  cd <section>      jump to a page section',
    '  clear             clear the screen',
    '  exit              reset this widget'
  ];

  const PROJECT_LINES = [
    '> GIS Mapping & Courier Routing Engine — C++ pathfinding across 100,000+ nodes',
    '> LinkedIn-to-Notion Automation Pipeline — Python automation synced via REST APIs',
    '> Flappy Bird FPGA Game Engine — bare-metal Verilog on an Altera DE1-SoC'
  ];

  const EXPERIENCE_LINES = [
    '> Incoming Software Engineering Intern @ Exiger — Summer 2026',
    '> Software Subsystem Member @ NeurotechUofT — Sep 2024 – Present',
    '> Team Lead, Bilaminar Skin Flap Biomodel @ UofT & Sunnybrook — Jan–Apr 2025'
  ];

  const CONTACT_HTML_LINES = [
    'Email: <a href="mailto:dareennasreldin@gmail.com">dareennasreldin@gmail.com</a>',
    'LinkedIn: <a href="https://linkedin.com/in/dareen-nasreldin" target="_blank" rel="noopener">linkedin.com/in/dareen-nasreldin</a>',
    'GitHub: <a href="https://github.com/dareen-nasreldin" target="_blank" rel="noopener">github.com/dareen-nasreldin</a>'
  ];

  const SECTION_TARGETS = ['work', 'experience', 'skills', 'about', 'contact'];
  const SANDWICH_PHRASE = 'sudo make-me-a-sandwich';

  const TYPE_MS = 26;
  const LINE_PAUSE_MS = 420;
  const RESTART_PAUSE_MS = 2600;

  function cdCommand(args) {
    const target = (args[0] || '').toLowerCase();
    if (!target) {
      return { lines: ['Usage: cd <section> — try: ' + SECTION_TARGETS.join(', ')] };
    }
    if (SECTION_TARGETS.indexOf(target) === -1) {
      return { lines: ["'" + args[0] + "' is not a valid section. Try: " + SECTION_TARGETS.join(', ')] };
    }
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return { lines: ['Navigating to #' + target + '...'] };
  }

  const DEFAULT_COMMANDS = {
    help: () => ({ lines: HELP_LINES }),
    whoami: () => ({ lines: [WHOAMI_LINE] }),
    'get-stack': () => ({ lines: [STACK_LINE] }),
    'get-projects': () => ({ lines: PROJECT_LINES }),
    'get-experience': () => ({ lines: EXPERIENCE_LINES }),
    contact: () => ({ htmlLines: CONTACT_HTML_LINES }),
    cd: (args) => cdCommand(args),
    clear: () => ({ clear: true }),
    exit: () => ({ exit: true })
  };

  function fullTranscript(script) {
    return script
      .map((line) => (line.type === 'cmd' ? PROMPT : '') + line.text)
      .join('\n') + ' _';
  }

  function createTerminalHero(mountEl, opts) {
    const script = (opts && opts.lines) || DEFAULT_SCRIPT;
    const loop = !!(opts && opts.loop);
    const commands = (opts && opts.commands) || DEFAULT_COMMANDS;
    const controls = (opts && opts.controls) || [];
    const onExit = opts && opts.onExit;

    mountEl.classList.add('term-window');
    mountEl.innerHTML =
      '<div class="term-titlebar">' +
      '<span class="term-dot"></span><span class="term-dot"></span><span class="term-dot"></span>' +
      '<span class="term-title">Windows PowerShell</span>' +
      '<span class="term-titlebar-controls"></span>' +
      '</div>' +
      '<div class="term-body" aria-hidden="true"></div>' +
      '<p class="term-sr-only" aria-live="polite"></p>';

    const body = mountEl.querySelector('.term-body');
    const srEl = mountEl.querySelector('.term-sr-only');
    const controlsEl = mountEl.querySelector('.term-titlebar-controls');

    controls.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'term-icon-btn';
      btn.textContent = c.icon;
      btn.setAttribute('aria-label', c.ariaLabel);
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        c.onClick();
      });
      controlsEl.appendChild(btn);
    });

    srEl.textContent = fullTranscript(script);

    let destroyed = false;
    let interactive = false;
    let timeoutId = null;
    const schedule = (fn, ms) => { timeoutId = setTimeout(fn, ms); };

    function typeChar(lineIndex, charIndex, line, textSpan) {
      if (destroyed || interactive) return;
      if (charIndex <= line.text.length) {
        textSpan.textContent = line.text.slice(0, charIndex);
        body.scrollTop = body.scrollHeight;
        schedule(() => typeChar(lineIndex, charIndex + 1, line, textSpan), TYPE_MS);
        return;
      }
      if (line.final) {
        if (loop) schedule(() => { body.innerHTML = ''; runLine(0); }, RESTART_PAUSE_MS);
        return;
      }
      schedule(() => runLine(lineIndex + 1), LINE_PAUSE_MS);
    }

    function runLine(lineIndex) {
      if (destroyed || interactive || lineIndex >= script.length) return;
      const line = script[lineIndex];
      const lineEl = document.createElement('div');
      lineEl.className = 'term-line';
      if (line.type === 'cmd') {
        const promptEl = document.createElement('span');
        promptEl.className = 'term-prompt';
        promptEl.textContent = PROMPT;
        lineEl.appendChild(promptEl);
      }
      const textSpan = document.createElement('span');
      textSpan.className = 'term-text';
      const cursorEl = document.createElement('span');
      cursorEl.className = 'term-cursor';
      cursorEl.textContent = '_';
      lineEl.appendChild(textSpan);
      lineEl.appendChild(cursorEl);
      body.appendChild(lineEl);
      body.scrollTop = body.scrollHeight;
      typeChar(lineIndex, 0, line, textSpan);
    }

    function appendStaticLine(prefixText, text, isHtml) {
      const lineEl = document.createElement('div');
      lineEl.className = 'term-line';
      if (prefixText) {
        const promptEl = document.createElement('span');
        promptEl.className = 'term-prompt';
        promptEl.textContent = prefixText;
        lineEl.appendChild(promptEl);
      }
      const textSpan = document.createElement('span');
      if (isHtml) {
        textSpan.innerHTML = text;
      } else {
        textSpan.textContent = text;
      }
      lineEl.appendChild(textSpan);
      body.appendChild(lineEl);
      body.scrollTop = body.scrollHeight;
      return lineEl;
    }

    function addPromptRow() {
      const rowEl = document.createElement('div');
      rowEl.className = 'term-line term-input-row';
      const promptEl = document.createElement('span');
      promptEl.className = 'term-prompt';
      promptEl.textContent = PROMPT;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'term-prompt-input';
      input.setAttribute('aria-label', 'Terminal command input');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');
      input.placeholder = 'type here...';
      rowEl.appendChild(promptEl);
      rowEl.appendChild(input);
      body.appendChild(rowEl);
      body.scrollTop = body.scrollHeight;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitCommand(input, rowEl);
        }
      });
      input.focus();
      return input;
    }

    function runCommandOutput(raw) {
      const trimmed = raw.trim();
      if (trimmed.toLowerCase() === SANDWICH_PHRASE) {
        appendStaticLine('', 'Okay.', false);
        addPromptRow();
        srEl.textContent = 'Okay.';
        return;
      }
      const parts = trimmed.split(/\s+/);
      const verb = (parts[0] || '').toLowerCase();
      const args = parts.slice(1);
      const handler = commands[verb];
      if (!handler) {
        const msg = "'" + trimmed + "' is not recognized as a command. Type 'help' to see available commands.";
        appendStaticLine('', msg, false);
        addPromptRow();
        srEl.textContent = msg;
        return;
      }
      const result = handler(args) || {};
      if (result.exit) {
        if (onExit) onExit();
        return;
      }
      if (result.clear) {
        body.innerHTML = '';
        srEl.textContent = 'Terminal cleared';
        addPromptRow();
        return;
      }
      const lines = result.lines || [];
      const htmlLines = result.htmlLines || [];
      lines.forEach((l) => appendStaticLine('', l, false));
      htmlLines.forEach((l) => appendStaticLine('', l, true));
      addPromptRow();
      srEl.textContent = lines.concat(htmlLines.map((h) => h.replace(/<[^>]*>/g, ''))).join('. ');
    }

    function submitCommand(input, rowEl) {
      const value = input.value;
      rowEl.classList.remove('term-input-row');
      const textSpan = document.createElement('span');
      textSpan.textContent = value;
      rowEl.replaceChild(textSpan, input);
      runCommandOutput(value);
    }

    function enterInteractiveMode() {
      if (interactive) return;
      interactive = true;
      if (timeoutId) clearTimeout(timeoutId);
      appendStaticLine(PROMPT, 'help', false);
      runCommandOutput('help');
    }

    body.addEventListener('click', () => {
      if (!interactive) enterInteractiveMode();
    });

    runLine(0);

    return {
      destroy() {
        destroyed = true;
        if (timeoutId) clearTimeout(timeoutId);
      },
      reset() {
        interactive = false;
        if (timeoutId) clearTimeout(timeoutId);
        body.innerHTML = '';
        srEl.textContent = fullTranscript(script);
        runLine(0);
      },
      enterInteractiveMode
    };
  }

  window.createTerminalHero = createTerminalHero;
})();
```

- [ ] **Step 2: Append the new CSS rules to `components/terminal-hero.css`**

Use the Edit tool with this exact anchor (the file's last block today):

old_string:
```css
/* Screen-reader-only transcript: full text available immediately,
   independent of the animation's pacing. */
.term-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

new_string:
```css
/* Screen-reader-only transcript: full text available immediately,
   independent of the animation's pacing. */
.term-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.term-titlebar-controls {
  margin-left: auto;
  display: flex;
  gap: 6px;
}

.term-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--fg3);
  padding: 2px 4px;
  line-height: 1;
}

.term-icon-btn:hover {
  color: var(--fg);
}

.term-input-row {
  display: flex;
  align-items: center;
}

.term-prompt-input {
  flex: 1;
  font-family: var(--fm);
  font-size: inherit;
  color: var(--fg);
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
}

.term-prompt-input::placeholder {
  color: var(--fg3);
  opacity: 0.6;
}
```

- [ ] **Step 3: Start a static server and manually verify the engine**

Run (pick any free port; 8000 used here as an example):

```bash
python -m http.server 8000
```

Using the browser tool, navigate to `http://localhost:8000/preview-terminal-b.html` (its existing `createTerminalHero(el, { loop: true, size: 'compact' })` call still works — the now-unused `size` key is simply ignored).

Verify with `mcp__Claude_Browser__read_console_messages` (`onlyErrors: true`) — expect no errors.

Verify interactivity with `mcp__Claude_Browser__javascript_tool`:

```javascript
const body = document.querySelector('#terminal-mount-b .term-body');
body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
JSON.stringify({
  hasInput: !!document.querySelector('.term-prompt-input'),
  ariaLabel: document.querySelector('.term-prompt-input').getAttribute('aria-label'),
  helpShown: body.textContent.indexOf('Available commands:') !== -1
});
```
Expected: `hasInput: true`, `ariaLabel: "Terminal command input"`, `helpShown: true`.

Then verify each command by setting the input's value and dispatching Enter:

```javascript
function runCmd(text) {
  const input = document.querySelector('.term-prompt-input');
  input.value = text;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}
runCmd('whoami');
JSON.stringify({ bodyText: document.querySelector('#terminal-mount-b .term-body').textContent });
```
Expected: body text contains `"Dareen Nasreldin — Comp Eng @ UofT (PEY '29)"`.

Repeat `runCmd(...)` for `'Get-Stack'`, `'Get-Projects'`, `'Get-Experience'`, `'contact'`, `'cd skills'`, `'blahblah'` (expect the "not recognized" message), `'sudo make-me-a-sandwich'` (expect `"Okay."`), and `'clear'` (expect the body to contain only the fresh prompt row afterward). Confirm `contact`'s output contains real `<a href="mailto:...">` markup via `document.querySelector('#terminal-mount-b .term-body a[href^="mailto:"]')` being non-null.

Note: `'exit'` is not meaningfully testable yet — with no `onExit` callback wired (that happens in Task 3), typing `exit` currently no-ops safely (no error, no visible effect). That's expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add components/terminal-hero.js components/terminal-hero.css
git commit -m "Add interactive command engine to terminal-hero.js"
```

---

## Task 2: Window-sizing CSS (compact base, expand, backdrop, resize, widget positioning)

**Files:**
- Modify: `components/terminal-hero.css`

**Interfaces:**
- Consumes: nothing new from Task 1's JS (pure CSS task).
- Produces: CSS classes `terminal-widget.js` (Task 3) will toggle: `.term-window--expanded`, `.term-backdrop`, `.term-resize-handle`, `.term-widget`, `.term-widget--floating`.

- [ ] **Step 1: Replace the window/titlebar/body sizing rules**

Use the Edit tool. old_string (the current compact/full split, unchanged since the file was first written):

```css
.term-window {
  font-family: var(--fm);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06), 0 4px 10px rgba(0, 0, 0, 0.03);
}

.term-window--full {
  max-width: 640px;
}

.term-window--compact {
  max-width: 360px;
}

.term-titlebar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.term-window--compact .term-titlebar {
  padding: 8px 12px;
}

.term-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #c9ab7c;
  opacity: 0.8;
}

.term-window--compact .term-dot {
  width: 9px;
  height: 9px;
}

.term-title {
  margin-left: 8px;
  font-size: 11px;
  color: var(--fg3);
  letter-spacing: 0.04em;
}

.term-body {
  padding: 18px 20px 22px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--fg);
  min-height: 210px;
}

.term-window--compact .term-body {
  padding: 14px 16px 16px;
  font-size: 12px;
  line-height: 1.65;
  max-height: 200px;
  overflow-y: auto;
}
```

new_string:

```css
.term-window {
  position: relative;
  font-family: var(--fm);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06), 0 4px 10px rgba(0, 0, 0, 0.03);
  width: 360px;
  display: flex;
  flex-direction: column;
}

.term-window--expanded {
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12), 0 6px 14px rgba(0, 0, 0, 0.06);
}

.term-titlebar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  flex: 0 0 auto;
  cursor: grab;
}

.term-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #c9ab7c;
  opacity: 0.8;
}

.term-title {
  margin-left: 8px;
  font-size: 11px;
  color: var(--fg3);
  letter-spacing: 0.04em;
}

.term-body {
  padding: 14px 16px 16px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--fg);
  flex: 1 1 auto;
  min-height: 0;
  max-height: 200px;
  overflow-y: auto;
}

.term-window--expanded .term-body {
  max-height: none;
}
```

Note: `position: relative` moves from being implicit to explicit on `.term-window` here, since the resize handle (added below) is positioned absolutely within it.

- [ ] **Step 2: Append expand-backdrop, resize-handle, and widget-positioning rules**

old_string: the `.term-prompt-input::placeholder` block added in Task 1 (this file's current last rule):

```css
.term-prompt-input::placeholder {
  color: var(--fg3);
  opacity: 0.6;
}
```

new_string:

```css
.term-prompt-input::placeholder {
  color: var(--fg3);
  opacity: 0.6;
}

.term-resize-handle {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  opacity: 0.5;
}

.term-resize-handle:hover {
  opacity: 0.9;
}

.term-resize-handle::before {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);
}

.term-backdrop {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: rgba(127, 119, 221, 0.10);
  pointer-events: none;
  z-index: 4;
}

.term-widget {
  position: absolute;
  right: 40px;
  bottom: 40px;
  z-index: 5;
}

.term-widget--floating {
  position: fixed;
  right: auto;
  bottom: auto;
}

@media (max-width: 950px) {
  .term-widget {
    display: none;
  }
}
```

- [ ] **Step 3: Manually verify the CSS with the running Task 1 page**

With the same server from Task 1 still serving `preview-terminal-b.html`, use `javascript_tool`:

```javascript
const el = document.getElementById('terminal-mount-b');
el.classList.add('term-window--expanded');
el.style.width = '420px';
el.style.height = '340px';
const bodyEl = el.querySelector('.term-body');
const result = {
  display: getComputedStyle(el).display,
  flexDirection: getComputedStyle(el).flexDirection,
  bodyMaxHeight: getComputedStyle(bodyEl).maxHeight,
  elWidth: el.getBoundingClientRect().width
};
el.classList.remove('term-window--expanded');
el.style.width = '';
el.style.height = '';
JSON.stringify(result);
```
Expected: `display: "flex"`, `flexDirection: "column"`, `bodyMaxHeight: "none"`, `elWidth: 420`.

Then verify the backdrop and widget classes in isolation:

```javascript
const bd = document.createElement('div');
bd.className = 'term-backdrop';
document.body.appendChild(bd);
const cs = getComputedStyle(bd);
const result = {
  backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
  background: cs.backgroundColor,
  pointerEvents: cs.pointerEvents
};
bd.remove();
JSON.stringify(result);
```
Expected: `backdropFilter` contains `"blur"`, `background` is `"rgba(127, 119, 221, 0.1)"`, `pointerEvents: "none"`.

- [ ] **Step 4: Commit**

```bash
git add components/terminal-hero.css
git commit -m "Restructure terminal-hero.css for expand/resize/widget positioning"
```

---

## Task 3: `terminal-widget.js` — drag, dock/float, expand/collapse, resize, reset

**Files:**
- Create: `components/terminal-widget.js`
- Modify: `preview-terminal-e.html` (swap its ad-hoc drag script for the new module, as the integration test harness)

**Interfaces:**
- Consumes: `window.createTerminalHero(mountEl, opts)` and its returned `{ destroy, reset, enterInteractiveMode }` from Task 1. CSS classes `.term-window--expanded`, `.term-backdrop`, `.term-resize-handle`, `.term-widget`, `.term-widget--floating` from Task 2.
- Produces: `window.createTerminalWidget(mountEl, heroOpts)` → `{ destroy() }`. `mountEl` must already carry class `term-widget` before calling this (the page's HTML sets it, matching how `term-window` is added by `createTerminalHero` itself).

- [ ] **Step 1: Create `components/terminal-widget.js`**

```javascript
/* Terminal Widget: window-manager around a TerminalHero instance.
   Adds drag-to-float, expand/collapse with a blurred backdrop, resize, and reset.
   Usage: const widget = createTerminalWidget(mountEl, { lines, loop, commands }) */
(function () {
  const MIN_WIDTH = 300;
  const MIN_HEIGHT = 220;
  const DEFAULT_EXPANDED_WIDTH = 420;
  const DEFAULT_EXPANDED_HEIGHT = 340;

  function maxWidth() { return Math.min(640, window.innerWidth * 0.9); }
  function maxHeight() { return Math.min(520, window.innerHeight * 0.8); }

  function createTerminalWidget(mountEl, heroOpts) {
    let floating = false;
    let expanded = false;
    let backdropEl = null;
    let resizeHandleEl = null;
    let expandButtonEl = null;
    let hero = null;

    function doReset() {
      if (floating) {
        mountEl.classList.remove('term-widget--floating');
        mountEl.style.left = '';
        mountEl.style.top = '';
        floating = false;
      }
      collapse();
      if (hero) hero.reset();
    }

    function expand() {
      if (expanded) return;
      expanded = true;
      mountEl.classList.add('term-window--expanded');
      mountEl.style.width = DEFAULT_EXPANDED_WIDTH + 'px';
      mountEl.style.height = DEFAULT_EXPANDED_HEIGHT + 'px';
      backdropEl = document.createElement('div');
      backdropEl.className = 'term-backdrop';
      document.body.appendChild(backdropEl);
      resizeHandleEl = document.createElement('div');
      resizeHandleEl.className = 'term-resize-handle';
      mountEl.appendChild(resizeHandleEl);
      resizeHandleEl.addEventListener('pointerdown', onResizeStart);
      if (expandButtonEl) expandButtonEl.textContent = '⤡';
    }

    function collapse() {
      if (!expanded) return;
      expanded = false;
      mountEl.classList.remove('term-window--expanded');
      mountEl.style.width = '';
      mountEl.style.height = '';
      if (backdropEl) { backdropEl.remove(); backdropEl = null; }
      if (resizeHandleEl) { resizeHandleEl.remove(); resizeHandleEl = null; }
      if (expandButtonEl) expandButtonEl.textContent = '⤢';
    }

    function toggleExpand() {
      if (expanded) collapse(); else expand();
    }

    let resizeStart = null;
    function onResizeStart(e) {
      e.stopPropagation();
      const rect = mountEl.getBoundingClientRect();
      resizeStart = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };
      document.addEventListener('pointermove', onResizeMove);
      document.addEventListener('pointerup', onResizeEnd);
    }
    function onResizeMove(e) {
      if (!resizeStart) return;
      let w = resizeStart.w + (e.clientX - resizeStart.x);
      let h = resizeStart.h + (e.clientY - resizeStart.y);
      w = Math.max(MIN_WIDTH, Math.min(w, maxWidth()));
      h = Math.max(MIN_HEIGHT, Math.min(h, maxHeight()));
      mountEl.style.width = w + 'px';
      mountEl.style.height = h + 'px';
    }
    function onResizeEnd() {
      resizeStart = null;
      document.removeEventListener('pointermove', onResizeMove);
      document.removeEventListener('pointerup', onResizeEnd);
    }

    let dragStart = null;
    function onTitlebarPointerDown(e) {
      const rect = mountEl.getBoundingClientRect();
      if (!floating) {
        mountEl.classList.add('term-widget--floating');
        mountEl.style.left = rect.left + 'px';
        mountEl.style.top = rect.top + 'px';
        floating = true;
      }
      dragStart = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
    }
    function onDragMove(e) {
      if (!dragStart) return;
      const rect = mountEl.getBoundingClientRect();
      let left = dragStart.left + (e.clientX - dragStart.x);
      let top = dragStart.top + (e.clientY - dragStart.y);
      left = Math.max(0, Math.min(left, window.innerWidth - rect.width));
      top = Math.max(0, Math.min(top, window.innerHeight - rect.height));
      mountEl.style.left = left + 'px';
      mountEl.style.top = top + 'px';
    }
    function onDragEnd() {
      dragStart = null;
      document.removeEventListener('pointermove', onDragMove);
      document.removeEventListener('pointerup', onDragEnd);
    }

    const controls = [
      { icon: '⤢', ariaLabel: 'Expand terminal', onClick: toggleExpand },
      { icon: '✕', ariaLabel: 'Reset terminal position', onClick: doReset }
    ];

    hero = window.createTerminalHero(mountEl, Object.assign({}, heroOpts, {
      controls: controls,
      onExit: doReset
    }));

    expandButtonEl = mountEl.querySelectorAll('.term-icon-btn')[0];

    const titlebar = mountEl.querySelector('.term-titlebar');
    titlebar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.term-icon-btn')) return;
      onTitlebarPointerDown(e);
    });

    return {
      destroy() {
        if (backdropEl) backdropEl.remove();
        hero.destroy();
      }
    };
  }

  window.createTerminalWidget = createTerminalWidget;
})();
```

- [ ] **Step 2: Wire it into `preview-terminal-e.html`**

Use the Edit tool with these three changes.

Edit A — old_string:
```html
<style>
  /* VARIANT E: same corner-pinned compact widget as B, but draggable
     anywhere within the hero via its title bar. */
  #hero { position: relative; overflow: hidden; }
  #terminal-mount-e {
    position: absolute;
    right: 40px;
    bottom: 40px;
    z-index: 5;
  }
  #terminal-mount-e .term-titlebar {
    cursor: grab;
  }
  #terminal-mount-e.is-dragging .term-titlebar {
    cursor: grabbing;
  }
  #terminal-mount-e.is-dragging {
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12), 0 6px 14px rgba(0, 0, 0, 0.06);
  }
  @media (max-width: 950px) {
    #terminal-mount-e { display: none; }
  }
</style>
```
new_string:
```html
<style>
  /* VARIANT E: positioning/backdrop/resize classes now live in
     components/terminal-hero.css (.term-widget, .term-widget--floating,
     .term-window--expanded, .term-backdrop, .term-resize-handle). */
  #hero { position: relative; }
</style>
```

Edit B — old_string:
```html
  <!-- VARIANT E: draggable corner widget, starts pinned bottom-right -->
  <div id="terminal-mount-e"></div>
```
new_string:
```html
  <!-- VARIANT E: draggable corner widget, starts pinned bottom-right -->
  <div id="terminal-mount-e" class="term-widget"></div>
```

Edit C — old_string:
```html
<script src="components/terminal-hero.js"></script>
```
new_string:
```html
<script src="components/terminal-hero.js"></script>
<script src="components/terminal-widget.js"></script>
```

Edit D — old_string:
```html
<script>
  createTerminalHero(document.getElementById('terminal-mount-e'), { loop: true, size: 'compact' });

  // Drag-to-reposition: grab by the title bar, constrained to the hero bounds.
  (function enableDrag() {
    const widget = document.getElementById('terminal-mount-e');
    const hero = document.getElementById('hero');
    const titlebar = widget.querySelector('.term-titlebar');

    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    function onPointerDown(e) {
      dragging = true;
      widget.classList.add('is-dragging');
      const rect = widget.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
      widget.style.left = startLeft - hero.getBoundingClientRect().left + 'px';
      widget.style.top = startTop - hero.getBoundingClientRect().top + 'px';
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const heroRect = hero.getBoundingClientRect();
      const widgetRect = widget.getBoundingClientRect();
      let newLeft = (startLeft - heroRect.left) + (e.clientX - startX);
      let newTop = (startTop - heroRect.top) + (e.clientY - startY);
      newLeft = Math.max(0, Math.min(newLeft, heroRect.width - widgetRect.width));
      newTop = Math.max(0, Math.min(newTop, heroRect.height - widgetRect.height));
      widget.style.left = newLeft + 'px';
      widget.style.top = newTop + 'px';
    }

    function onPointerUp() {
      dragging = false;
      widget.classList.remove('is-dragging');
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    }

    titlebar.addEventListener('pointerdown', onPointerDown);
  })();
</script>
```
new_string:
```html
<script>
  createTerminalWidget(document.getElementById('terminal-mount-e'), { loop: true });
</script>
```

- [ ] **Step 3: Manually verify drag, float-through-scroll, expand, resize, and reset**

Serve the repo root again if not already running (`python -m http.server 8000`), navigate to `http://localhost:8000/preview-terminal-e.html`, confirm no console errors.

Verify initial state and drag→float:

```javascript
const mount = document.getElementById('terminal-mount-e');
const before = {
  hasFloatingClass: mount.classList.contains('term-widget--floating'),
  position: getComputedStyle(mount).position
};

const titlebar = mount.querySelector('.term-titlebar');
const rect = titlebar.getBoundingClientRect();
const startX = rect.left + 20, startY = rect.top + 10;
function firePointer(type, target, x, y) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
}
firePointer('pointerdown', titlebar, startX, startY);
firePointer('pointermove', document, startX - 200, startY - 150);
firePointer('pointerup', document, startX - 200, startY - 150);

const afterDrag = {
  hasFloatingClass: mount.classList.contains('term-widget--floating'),
  position: getComputedStyle(mount).position,
  rectBefore: mount.getBoundingClientRect().top
};
window.scrollTo(0, 600);
const afterScroll = { rectTop: mount.getBoundingClientRect().top };
JSON.stringify({ before, afterDrag, afterScroll });
```
Expected: `before.position: "absolute"`, `afterDrag.hasFloatingClass: true`, `afterDrag.position: "fixed"`, and `afterScroll.rectTop` equal to `afterDrag.rectBefore` (proving the widget didn't move when the page scrolled).

Verify expand/backdrop/resize:

```javascript
window.scrollTo(0, 0);
const expandBtn = document.querySelectorAll('#terminal-mount-e .term-icon-btn')[0];
expandBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const mount = document.getElementById('terminal-mount-e');
const expandedState = {
  hasExpandedClass: mount.classList.contains('term-window--expanded'),
  width: mount.style.width,
  height: mount.style.height,
  hasBackdrop: !!document.querySelector('.term-backdrop'),
  hasHandle: !!mount.querySelector('.term-resize-handle')
};

const handle = mount.querySelector('.term-resize-handle');
const hRect = handle.getBoundingClientRect();
function firePointer(type, target, x, y) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 2 }));
}
firePointer('pointerdown', handle, hRect.left, hRect.top);
firePointer('pointermove', document, hRect.left + 100, hRect.top + 80);
firePointer('pointerup', document, hRect.left + 100, hRect.top + 80);
const resizedState = { width: mount.style.width, height: mount.style.height };
JSON.stringify({ expandedState, resizedState });
```
Expected: `expandedState.hasExpandedClass: true`, `width: "420px"`, `height: "340px"`, `hasBackdrop: true`, `hasHandle: true`; `resizedState.width`/`height` numerically larger than 420/340 (clamped to at most `min(640, 90vw)` × `min(520, 80vh)`).

Verify reset (✕) and the `exit` command both fully revert state:

```javascript
const resetBtn = document.querySelectorAll('#terminal-mount-e .term-icon-btn')[1];
resetBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const mount = document.getElementById('terminal-mount-e');
JSON.stringify({
  floating: mount.classList.contains('term-widget--floating'),
  expanded: mount.classList.contains('term-window--expanded'),
  hasBackdrop: !!document.querySelector('.term-backdrop'),
  hasBackdropAfterCollapse: !!document.querySelector('.term-backdrop'),
  width: mount.style.width
});
```
Expected: all `false`/empty — `floating: false`, `expanded: false`, `hasBackdrop: false`, `width: ""`.

Then confirm `exit` (typed) does the same thing: click the body to enter interactive mode, type `exit`, press Enter, and re-run the same assertion block above after first dragging/expanding again.

Finally, confirm the 950px breakpoint still hides the widget: use `mcp__Claude_Browser__resize_window` to set width below 950, reload, and confirm `getComputedStyle(document.getElementById('terminal-mount-e')).display === 'none'`.

- [ ] **Step 4: Commit**

```bash
git add components/terminal-widget.js preview-terminal-e.html
git commit -m "Add terminal-widget.js: drag/float, expand/resize, reset"
```

---

## Task 4: Merge into the real `index.html`

**Files:**
- Modify: `index.html`
- Modify: `style.css`

**Interfaces:**
- Consumes: `window.createTerminalWidget` from Task 3.
- Produces: the shipped feature on the real site.

- [ ] **Step 1: Add `position: relative` to `#hero` in `style.css`**

old_string:
```css
#hero {
  min-height: 100vh;
  display: flex; align-items: center;
  padding-top: var(--nav);
}
```
new_string:
```css
#hero {
  position: relative;
  min-height: 100vh;
  display: flex; align-items: center;
  padding-top: var(--nav);
}
```

- [ ] **Step 2: Link `terminal-hero.css` in `index.html`'s `<head>`**

old_string:
```html
<link rel="stylesheet" href="style.css">
</head>
```
new_string:
```html
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="components/terminal-hero.css">
</head>
```

- [ ] **Step 3: Add the widget mount inside `#hero`**

old_string:
```html
    <!-- Floating Polaroid -->
    <div class="polaroid gsap-polaroid">
      <img src="dareen_pic.jpg" alt="Dareen Nasreldin">
      <div class="polaroid-caption">Me!</div>
    </div>
  </div>
</section>
```
new_string:
```html
    <!-- Floating Polaroid -->
    <div class="polaroid gsap-polaroid">
      <img src="dareen_pic.jpg" alt="Dareen Nasreldin">
      <div class="polaroid-caption">Me!</div>
    </div>
  </div>

  <div id="terminal-widget" class="term-widget"></div>
</section>
```

- [ ] **Step 4: Add the scripts and init call before `</body>`**

old_string:
```html
  setInterval(drawMatrix, 60);
</script>

</body>
</html>
```
new_string:
```html
  setInterval(drawMatrix, 60);
</script>

<script src="components/terminal-hero.js"></script>
<script src="components/terminal-widget.js"></script>
<script>
  createTerminalWidget(document.getElementById('terminal-widget'), { loop: true });
</script>

</body>
</html>
```

- [ ] **Step 5: Full manual verification against the real page**

Serve the repo root (`python -m http.server 8000` if not already running) and navigate to `http://localhost:8000/index.html`. Run through the complete checklist:

1. `read_console_messages` with `onlyErrors: true` → expect none.
2. Confirm the widget is visible, bottom-right of the hero, and the existing headline/subtitle/CTA row/photo are all still present and unchanged (use `get_page_text` and confirm the headline text "Building robust software & physical systems." is still there).
3. Repeat the full drag/float/scroll-persistence, expand/backdrop/resize, and reset/exit assertions from Task 3 Step 3, targeting `#terminal-widget` instead of `#terminal-mount-e`.
4. Repeat the 9-command verification from Task 1 Step 3, targeting `#terminal-widget .term-body`.
5. Resize below 950px and confirm the widget is hidden while the rest of the hero renders normally.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css
git commit -m "Merge the terminal widget into the real hero section"
```

---

## Task 5: Cleanup — remove the losing preview variants

**Files:**
- Delete: `preview-terminal-a.html`, `preview-terminal-b.html`, `preview-terminal-c.html`, `preview-terminal-d.html`, `preview-terminal-e.html`

**Interfaces:** None — this task only removes now-unused scaffolding.

- [ ] **Step 1: Stop any still-running preview servers from earlier exploration**

If ports 3001–3005 (or 8000 from this plan's own verification steps) still have `python -m http.server` processes running in the background from this or an earlier session, stop them before deleting the files they were serving.

- [ ] **Step 2: Delete the four losing variants and the winning variant's now-superseded preview page**

```bash
git rm preview-terminal-a.html preview-terminal-b.html preview-terminal-c.html preview-terminal-d.html preview-terminal-e.html
```

(Variant E's preview page is removed too — its functionality now lives in `index.html` itself, per the design spec's §9.)

- [ ] **Step 3: Verify the real site still works standalone**

```bash
python -m http.server 8000
```

Navigate to `http://localhost:8000/index.html` and `http://localhost:8000/projects.html`. Confirm both load with no console errors and no broken links (the deleted preview files were never linked from either page, so this should be a no-op check, not a fix).

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove preview-terminal-a/b/c/d/e.html now that the widget is merged"
```
