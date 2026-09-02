const CHROME_TRAY_STORAGE_KEY = 'chromeTrayCollapsed';

class ChromeTray {
  constructor() {
    this.collapsed = this.loadCollapsed();
    this.createTray();
    this.collectButtons();
    this.applyCollapsed(this.collapsed, { save: false });
    this.toggleButton.addEventListener('click', () => this.toggle());
  }

  loadCollapsed() {
    try {
      const saved = localStorage.getItem(CHROME_TRAY_STORAGE_KEY);
      if (saved === null) return true;
      return saved === '1';
    } catch (_) {
      return true;
    }
  }

  createTray() {
    this.tray = document.createElement('div');
    this.tray.className = 'chrome-tray';
    this.tray.id = 'chrome-tray';

    this.tools = document.createElement('div');
    this.tools.className = 'chrome-tray-tools';
    this.tools.id = 'chrome-tray-tools';

    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'chrome-tray-toggle icon-btn';
    this.toggleButton.type = 'button';
    this.toggleButton.setAttribute('aria-controls', 'chrome-tray-tools');
    this.toggleButton.innerHTML = Icons.chevronLeft();

    this.tray.append(this.toggleButton, this.tools);
    document.body.appendChild(this.tray);
  }

  collectButtons() {
    ['.shortcuts-button', '.search-toggle', '.postit-trash-toggle'].forEach((selector) => {
      const button = document.querySelector(selector);
      if (button) this.tools.appendChild(button);
    });
  }

  applyCollapsed(collapsed, { save = true } = {}) {
    this.collapsed = collapsed;
    const label = collapsed ? 'Show tools' : 'Hide tools';
    this.tray.classList.toggle('collapsed', collapsed);
    this.toggleButton.setAttribute('aria-label', label);
    this.toggleButton.setAttribute('aria-expanded', String(!collapsed));
    this.toggleButton.title = label;
    this.tools.toggleAttribute('inert', collapsed);
    this.tools.setAttribute('aria-hidden', String(collapsed));

    if (collapsed) window.shortcutsMenu?.close();
    if (save) {
      try {
        localStorage.setItem(CHROME_TRAY_STORAGE_KEY, collapsed ? '1' : '0');
      } catch (e) {
        console.warn('Failed to save toolbar state:', e.message);
      }
    }
  }

  toggle() {
    this.applyCollapsed(!this.collapsed);
    this.toggleButton.focus();
  }
}
