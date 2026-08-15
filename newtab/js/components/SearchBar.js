const SEARCH_STORAGE_KEY = 'searchBarState';
const SEARCH_STORAGE_VERSION = 1;

class SearchBar {
  constructor() {
    this.state = this.loadState();
    this.toggleButton = null;
    this.bar = null;
    this.input = null;

    this.createToggleButton();
    this.createSearchBar();
    this.makeDraggable();
    this.applyState();
    this.bindEvents();
  }

  loadState() {
    const fallback = { visible: true, position: null };
    try {
      const saved = localStorage.getItem(SEARCH_STORAGE_KEY);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      return {
        visible: Boolean(parsed.visible),
        position: parsed.position && typeof parsed.position === 'object'
          ? { x: Number(parsed.position.x), y: Number(parsed.position.y) }
          : null
      };
    } catch (e) {
      console.warn('Failed to load search bar state:', e.message);
      return fallback;
    }
  }

  saveState() {
    try {
      localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({
        version: SEARCH_STORAGE_VERSION,
        visible: this.state.visible,
        position: this.state.position
      }));
    } catch (e) {
      console.warn('Failed to save search bar state:', e.message);
    }
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.className = 'search-toggle';
    button.type = 'button';
    button.innerHTML = Icons.search();
    button.setAttribute('aria-label', 'Toggle search bar');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'search-bar');
    document.body.appendChild(button);
    this.toggleButton = button;
  }

  createSearchBar() {
    const bar = document.createElement('div');
    bar.className = 'search-bar';
    bar.id = 'search-bar';
    bar.setAttribute('role', 'search');
    bar.innerHTML = `
      <input class="search-input" type="text" placeholder="Search the web..." aria-label="Search the web" autocomplete="off" spellcheck="false" />
      <button class="search-close" type="button" aria-label="Hide search bar">${Icons.times()}</button>
    `;
    document.body.appendChild(bar);
    this.bar = bar;
    this.input = bar.querySelector('.search-input');
  }

  applyState() {
    if (this.state.position) {
      this.setPosition(this.state.position.x, this.state.position.y);
    } else {
      this.centerHorizontally();
    }
    this.setVisible(this.state.visible, { focus: false, save: false });
  }

  centerHorizontally() {
    const rect = this.bar.getBoundingClientRect();
    const width = rect.width || 360;
    const x = Math.max(10, (window.innerWidth - width) / 2);
    const y = 90;
    this.setPosition(x, y);
    this.state.position = { x, y };
  }

  setPosition(x, y) {
    const width = this.bar.offsetWidth || 360;
    const height = this.bar.offsetHeight || 48;
    const clampedX = Math.max(0, Math.min(x, window.innerWidth - width));
    const clampedY = Math.max(0, Math.min(y, window.innerHeight - height));
    this.bar.style.left = `${clampedX}px`;
    this.bar.style.top = `${clampedY}px`;
    return { x: clampedX, y: clampedY };
  }

  setVisible(visible, { focus = true, save = true } = {}) {
    this.state.visible = visible;
    this.bar.classList.toggle('show', visible);
    this.toggleButton.classList.toggle('active', visible);
    this.toggleButton.setAttribute('aria-expanded', String(visible));
    if (visible) {
      this.bringToFront();
      if (focus) {
        this.input.focus();
        this.input.select();
      }
    }
    if (save) this.saveState();
  }

  bringToFront() {
    const base = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--z-ui'),
      10
    ) || 1000;
    let next;
    if (window.postItManager && typeof window.postItManager.topZIndex === 'number') {
      window.postItManager.topZIndex += 1;
      next = window.postItManager.topZIndex;
    } else {
      this.topZIndex = (this.topZIndex || base) + 1;
      next = this.topZIndex;
    }
    this.bar.style.zIndex = String(next);
  }

  toggle() {
    this.setVisible(!this.state.visible);
  }

  performSearch(rawValue) {
    const value = rawValue.trim();
    if (!value) return;
    const isUrl = /^(https?:\/\/)/i.test(value) ||
      /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value);
    const target = isUrl
      ? (/^https?:\/\//i.test(value) ? value : `https://${value}`)
      : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
    window.location.href = target;
  }

  makeDraggable() {
    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onPointerMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - startPointerX;
      const dy = e.clientY - startPointerY;
      this.setPosition(startLeft + dx, startTop + dy);
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.bar.classList.remove('moving');
      const rect = this.bar.getBoundingClientRect();
      this.state.position = { x: rect.left, y: rect.top };
      this.saveState();
      window.removeEventListener('pointermove', onPointerMove);
      try {
        if (e.pointerId != null) this.bar.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    this.bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 2) return;
      if (e.target.closest('.search-close')) return;
      isDragging = true;
      const rect = this.bar.getBoundingClientRect();
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      this.bar.classList.add('moving');
      e.preventDefault();
      try {
        if (e.pointerId != null) this.bar.setPointerCapture(e.pointerId);
      } catch (_) {}
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
    });

    this.bar.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  bindEvents() {
    this.toggleButton.addEventListener('click', () => this.toggle());

    this.bar.addEventListener('pointerdown', () => this.bringToFront());

    this.bar.querySelector('.search-close').addEventListener('click', () => {
      this.setVisible(false);
      this.toggleButton.focus();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch(this.input.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.setVisible(false);
        this.toggleButton.focus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.setVisible(true);
      }
    });

    this.onResize = window.formatters?.debounce
      ? window.formatters.debounce(() => this.handleResize(), 200)
      : () => this.handleResize();
    window.addEventListener('resize', this.onResize);
  }

  handleResize() {
    if (this.state.position) {
      const clamped = this.setPosition(this.state.position.x, this.state.position.y);
      this.state.position = clamped;
      this.saveState();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.searchBar = new SearchBar();
}, { once: true });
