/* Renders .archive-grid cards from window.PROJECTS (data/projects.js).
   Kept in sync with scripts/sync_repos.py, which appends new repos to
   that same data file rather than editing this page's HTML directly. */
(function () {
  const grid = document.querySelector('.archive-grid');
  if (!grid || !window.PROJECTS) return;

  window.PROJECTS.forEach((p) => {
    const card = document.createElement('a');
    card.href = p.url;
    card.target = '_blank';
    card.className = 'archive-card gsap-card';

    if (p.image) {
      const img = document.createElement('img');
      img.className = 'proj-img';
      img.src = p.image.src;
      img.alt = p.image.alt;
      img.loading = 'lazy';
      img.onerror = function () { this.style.display = 'none'; };
      if (p.image.imgY) img.style.setProperty('--img-y', p.image.imgY);
      card.appendChild(img);
    }

    const top = document.createElement('div');
    top.className = 'card-top';
    const folderIcon = document.createElement('span');
    folderIcon.className = 'folder-icon';
    folderIcon.textContent = '\u{1F4C1}';
    const githubLink = document.createElement('span');
    githubLink.className = 'github-link';
    githubLink.textContent = '↗';
    top.appendChild(folderIcon);
    top.appendChild(githubLink);
    card.appendChild(top);

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = p.title;
    card.appendChild(title);

    const desc = document.createElement('div');
    desc.className = 'card-desc';
    desc.textContent = p.description;
    card.appendChild(desc);

    const stack = document.createElement('div');
    stack.className = 'proj-stack';
    (p.stack || []).forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'stack-tag';
      tagEl.textContent = tag;
      stack.appendChild(tagEl);
    });
    card.appendChild(stack);

    grid.appendChild(card);
  });
})();
