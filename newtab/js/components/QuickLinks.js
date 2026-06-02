const QUICK_LINKS_STORAGE_KEY = 'quickLinks';
const QUICK_LINKS_STORAGE_VERSION = 1;

class QuickLinks {
  constructor() {
    this.links = this.loadLinks();
    this.editingId = null;
    this.container = null;
    this.dialog = null;

    this.createContainer();
    this.createDialog();
    this.render();
  }

  generateId() {
    return crypto.randomUUID();
  }

  loadLinks() {
    try {
      const saved = localStorage.getItem(QUICK_LINKS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      const list = Array.isArray(parsed) ? parsed : parsed.links;
      if (!Array.isArray(list)) return [];
      return list
        .filter((l) => l && l.url)
        .map((l) => ({
          id: String(l.id || this.generateId()),
          name: l.name || this.hostnameOf(l.url),
          url: this.normalizeUrl(l.url),
          position: l.position && typeof l.position === 'object'
            ? { x: Number(l.position.x), y: Number(l.position.y) }
            : null
        }));
    } catch (e) {
      console.warn('Failed to load quick links:', e.message);
      return [];
    }
  }

  saveLinks() {
    try {
      localStorage.setItem(QUICK_LINKS_STORAGE_KEY, JSON.stringify({
        version: QUICK_LINKS_STORAGE_VERSION,
        links: this.links
      }));
    } catch (e) {
      console.warn('Failed to save quick links:', e.message);
    }
  }

  normalizeUrl(url) {
    const trimmed = String(url).trim();
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  }

  hostnameOf(url) {
    try {
      return new URL(this.normalizeUrl(url)).hostname.replace(/^www\./, '');
    } catch (_) {
      return url;
    }
  }

  faviconFor(url) {
    try {
      const host = new URL(this.normalizeUrl(url)).hostname;
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
    } catch (_) {
      return '';
    }
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'quick-links';
    document.body.appendChild(container);
    this.container = container;

    this.onResize = window.formatters?.debounce
      ? window.formatters.debounce(() => this.render(), 200)
      : () => this.render();
    window.addEventListener('resize', this.onResize);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.openDialog();
      }
    });
  }

  defaultPosition(index) {
    const tileW = 92;
    const rowH = 104;
    const gap = 14;
    const maxWidth = Math.min(720, window.innerWidth - 40);
    const cols = Math.max(1, Math.floor((maxWidth + gap) / (tileW + gap)));
    const rowWidth = cols * tileW + (cols - 1) * gap;
    const originX = Math.max(20, (window.innerWidth - rowWidth) / 2);
    const originY = Math.round(window.innerHeight * 0.42);
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: Math.round(originX + col * (tileW + gap)),
      y: Math.round(originY + row * rowH)
    };
  }

  setTilePosition(tile, x, y) {
    const w = tile.offsetWidth || 92;
    const h = tile.offsetHeight || 92;
    const clampedX = Math.max(0, Math.min(x, window.innerWidth - w));
    const clampedY = Math.max(0, Math.min(y, window.innerHeight - h));
    tile.style.left = `${clampedX}px`;
    tile.style.top = `${clampedY}px`;
    return { x: clampedX, y: clampedY };
  }

  render() {
    this.container.innerHTML = '';

    let assignedDefaults = false;
    this.links.forEach((link, index) => {
      if (!link.position) {
        link.position = this.defaultPosition(index);
        assignedDefaults = true;
      }
      const tile = this.createTile(link);
      this.container.appendChild(tile);
      link.position = this.setTilePosition(tile, link.position.x, link.position.y);
    });

    const addTile = document.createElement('button');
    addTile.type = 'button';
    addTile.className = 'quick-link quick-link-add';
    addTile.setAttribute('aria-label', 'Add shortcut');
    addTile.textContent = 'Add shortcut';
    addTile.addEventListener('click', () => this.openDialog());
    this.container.appendChild(addTile);

    if (assignedDefaults) this.saveLinks();
  }

  createTile(link) {
    const tile = document.createElement('a');
    tile.className = 'quick-link';
    tile.href = link.url;
    tile.title = link.name;
    tile.setAttribute('draggable', 'false');

    const iconWrap = document.createElement('span');
    iconWrap.className = 'quick-link-icon';

    const favicon = this.faviconFor(link.url);
    if (favicon) {
      const img = document.createElement('img');
      img.src = favicon;
      img.alt = '';
      img.loading = 'lazy';
      img.setAttribute('draggable', 'false');
      img.addEventListener('error', () => {
        iconWrap.innerHTML = Icons.globe(20);
      });
      iconWrap.appendChild(img);
    } else {
      iconWrap.innerHTML = Icons.globe(20);
    }

    const name = document.createElement('span');
    name.className = 'quick-link-name';
    name.textContent = link.name;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'quick-link-remove';
    remove.setAttribute('aria-label', `Remove ${link.name}`);
    remove.innerHTML = Icons.times(12);
    remove.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeLink(link.id);
    });

    tile.appendChild(iconWrap);
    tile.appendChild(name);
    tile.appendChild(remove);

    this.makeTileDraggable(tile, link);
    return tile;
  }

  makeTileDraggable(tile, link) {
    let startPointerX = 0;
    let startPointerY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;

    const onPointerMove = (e) => {
      const dx = e.clientX - startPointerX;
      const dy = e.clientY - startPointerY;
      if (!dragging && Math.hypot(dx, dy) > 4) {
        dragging = true;
        tile.classList.add('moving');
      }
      if (!dragging) return;
      e.preventDefault();
      link.position = this.setTilePosition(tile, startLeft + dx, startTop + dy);
    };

    const onPointerUp = (e) => {
      window.removeEventListener('pointermove', onPointerMove);
      try {
        if (e.pointerId != null) tile.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (dragging) {
        tile.classList.remove('moving');
        this.saveLinks();
        tile.addEventListener('click', this.suppressClick, { capture: true, once: true });
      }
      dragging = false;
    };

    tile.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest('.quick-link-remove')) return;
      const rect = tile.getBoundingClientRect();
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      dragging = false;
      try {
        if (e.pointerId != null) tile.setPointerCapture(e.pointerId);
      } catch (_) {}
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
    });

    tile.addEventListener('dragstart', (e) => e.preventDefault());
  }

  suppressClick(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  removeLink(id) {
    this.links = this.links.filter((l) => l.id !== id);
    this.saveLinks();
    this.render();
  }

  createDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'quick-link-dialog';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Add shortcut');
    overlay.innerHTML = `
      <div class="quick-link-dialog-panel">
        <h3 class="quick-link-dialog-title">Add shortcut</h3>
        <label class="quick-link-field">
          <span>Name</span>
          <input type="text" class="quick-link-input" data-field="name" placeholder="My site" autocomplete="off" />
        </label>
        <label class="quick-link-field">
          <span>URL</span>
          <input type="text" class="quick-link-input" data-field="url" placeholder="example.com" autocomplete="off" spellcheck="false" />
        </label>
        <div class="quick-link-dialog-actions">
          <button type="button" class="quick-link-btn quick-link-cancel">Cancel</button>
          <button type="button" class="quick-link-btn quick-link-save">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.dialog = overlay;

    this.nameInput = overlay.querySelector('[data-field="name"]');
    this.urlInput = overlay.querySelector('[data-field="url"]');

    overlay.querySelector('.quick-link-cancel').addEventListener('click', () => this.closeDialog());
    overlay.querySelector('.quick-link-save').addEventListener('click', () => this.submitDialog());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeDialog();
    });

    overlay.querySelectorAll('.quick-link-input').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitDialog();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closeDialog();
        }
      });
    });
  }

  openDialog(link = null) {
    this.editingId = link ? link.id : null;
    this.dialog.querySelector('.quick-link-dialog-title').textContent =
      link ? 'Edit shortcut' : 'Add shortcut';
    this.nameInput.value = link ? link.name : '';
    this.urlInput.value = link ? link.url : '';
    this.dialog.classList.add('show');
    this.urlInput.focus();
  }

  closeDialog() {
    this.dialog.classList.remove('show');
    this.editingId = null;
  }

  submitDialog() {
    const url = this.urlInput.value.trim();
    if (!url) {
      this.urlInput.focus();
      return;
    }
    const name = this.nameInput.value.trim() || this.hostnameOf(url);
    const normalizedUrl = this.normalizeUrl(url);

    if (this.editingId) {
      const existing = this.links.find((l) => l.id === this.editingId);
      if (existing) {
        existing.name = name;
        existing.url = normalizedUrl;
      }
    } else {
      this.links.push({ id: this.generateId(), name, url: normalizedUrl });
    }

    this.saveLinks();
    this.render();
    this.closeDialog();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.quickLinks = new QuickLinks();
}, { once: true });
