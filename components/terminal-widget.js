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
