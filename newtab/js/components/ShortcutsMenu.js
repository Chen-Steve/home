class ShortcutsMenu {
  constructor() {
    this.createShortcutsButton();
    this.createShortcutsPanel();
    this.bindEvents();
  }

  createShortcutsButton() {
    const button = document.createElement('button');
    button.className = 'shortcuts-button';
    button.innerHTML = Icons.keyboard();
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Keyboard shortcuts');
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'shortcuts-panel');
    document.body.appendChild(button);
  }

  createShortcutsPanel() {
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
      { keys: ['Shift', 'Enter'], description: 'New line in note' },
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
  }

  bindEvents() {
    const button = document.querySelector('.shortcuts-button');
    const panel = document.querySelector('.shortcuts-panel');
    let isOpen = false;

    button.addEventListener('click', () => {
      isOpen = !isOpen;
      panel.classList.toggle('show');
      button.classList.toggle('active');
      button.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (isOpen && !panel.contains(e.target) && !button.contains(e.target)) {
        isOpen = false;
        panel.classList.remove('show');
        button.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        isOpen = false;
        panel.classList.remove('show');
        button.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === button) {
        e.preventDefault();
        button.click();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ShortcutsMenu();
}, { once: true });
