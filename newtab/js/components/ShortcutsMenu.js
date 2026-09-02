class ShortcutsMenu {
  constructor() {
    this.isOpen = false;
    this.button = this.createButton();
    this.panel = this.createPanel();
    this.bindEvents();
  }

  createButton() {
    const button = document.createElement('button');
    button.className = 'shortcuts-button icon-btn';
    button.type = 'button';
    button.innerHTML = Icons.keyboard();
    button.setAttribute('aria-label', 'Keyboard shortcuts');
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'shortcuts-panel');
    document.body.appendChild(button);
    return button;
  }

  createPanel() {
    const panel = document.createElement('div');
    panel.className = 'shortcuts-panel';
    panel.id = 'shortcuts-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'Keyboard shortcuts');

    const shortcuts = [
      { keys: ['Alt', 'F'], description: 'Open search bar' },
      { keys: ['Ctrl', 'S'], description: 'Add shortcut' },
      { keys: ['Alt', 'A'], description: 'Create new note' },
      { keys: ['Alt', 'S'], description: 'Select next note' },
      { keys: ['Alt', 'D'], description: 'Delete selected note' },
      { keys: ['Arrow keys'], description: 'Move selected note' },
      { keys: ['Enter'], description: 'New line in note' },
      { keys: ['Alt', '+'], description: 'Increase font size' },
      { keys: ['Alt', '-'], description: 'Decrease font size' },
      { keys: ['Ctrl', 'B'], description: 'Bold text' },
      { keys: ['Ctrl', 'I'], description: 'Italic text' },
      { keys: ['Ctrl', 'U'], description: 'Underline text' }
    ];

    panel.innerHTML = `
      <h3>Keyboard Shortcuts</h3>
      <ul>
        ${shortcuts.map((shortcut) => `
          <li>
            <div class="shortcut-keys">
              ${shortcut.keys.map((key) => `<kbd>${key}</kbd>`).join(' + ')}
            </div>
            <span class="shortcut-description">${shortcut.description}</span>
          </li>
        `).join('')}
      </ul>
    `;

    document.body.appendChild(panel);
    return panel;
  }

  setOpen(open) {
    this.isOpen = open;
    this.panel.classList.toggle('show', open);
    this.button.classList.toggle('active', open);
    this.button.setAttribute('aria-expanded', String(open));
  }

  close() {
    this.setOpen(false);
  }

  bindEvents() {
    this.button.addEventListener('click', () => this.setOpen(!this.isOpen));

    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.panel.contains(e.target) && !this.button.contains(e.target)) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        this.button.focus();
      }
    });
  }
}
