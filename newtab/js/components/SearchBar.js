const SEARCH_STORAGE_KEY = 'searchBarState';
const SEARCH_STORAGE_VERSION = 1;

class SearchBar {
  constructor() {
    this.state = this.loadState();
    this.createToggleButton();
    this.createSearchBar();
    this.makeDraggable();
    this.applyState();
    this.bindEvents();
  }

  loadState() {
    const parsed = formatters.readStorage(SEARCH_STORAGE_KEY, null);
    if (!parsed) return { visible: true, position: null };
    return {
      visible: Boolean(parsed.visible),
      position: parsed.position && typeof parsed.position === 'object'
        ? { x: Number(parsed.position.x), y: Number(parsed.position.y) }
        : null
    };
  }

  saveState() {
    formatters.writeStorage(SEARCH_STORAGE_KEY, {
      version: SEARCH_STORAGE_VERSION,
      visible: this.state.visible,
      position: this.state.position
    });
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.className = 'search-toggle icon-btn';
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
    const width = this.bar.getBoundingClientRect().width || 360;
    const x = Math.max(10, (window.innerWidth - width) / 2);
    const y = 90;
    this.setPosition(x, y);
    this.state.position = { x, y };
  }

  setPosition(x, y) {
    const pos = formatters.clampToViewport(
      x,
      y,
      this.bar.offsetWidth || 360,
      this.bar.offsetHeight || 48
    );
    this.bar.style.left = `${pos.x}px`;
    this.bar.style.top = `${pos.y}px`;
    return pos;
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
    const manager = window.postItManager;
    if (manager && typeof manager.topZIndex === 'number') {
      manager.topZIndex += 1;
      this.bar.style.zIndex = String(manager.topZIndex);
      return;
    }
    const base = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--z-ui'),
      10
    ) || 1000;
    this.topZIndex = (this.topZIndex || base) + 1;
    this.bar.style.zIndex = String(this.topZIndex);
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
      this.setPosition(startLeft + e.clientX - startPointerX, startTop + e.clientY - startPointerY);
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.bar.classList.remove('moving');
      const rect = this.bar.getBoundingClientRect();
      this.state.position = { x: rect.left, y: rect.top };
      this.saveState();
      window.removeEventListener('pointermove', onPointerMove);
      formatters.releasePointer(this.bar, e);
    };

    this.bar.addEventListener('pointerdown', (e) => {
      this.bringToFront();
      if (e.button !== 2 || e.target.closest('.search-close')) return;
      isDragging = true;
      const rect = this.bar.getBoundingClientRect();
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      this.bar.classList.add('moving');
      e.preventDefault();
      formatters.capturePointer(this.bar, e);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
    });

    this.bar.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  bindEvents() {
    this.toggleButton.addEventListener('click', () => this.toggle());

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

    formatters.onResize(() => this.handleResize());
  }

  handleResize() {
    if (!this.state.position) return;
    this.state.position = this.setPosition(this.state.position.x, this.state.position.y);
    this.saveState();
  }
}
