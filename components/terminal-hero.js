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
