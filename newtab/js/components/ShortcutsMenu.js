class ShortcutsMenu {
    constructor() {
      this.createShortcutsButton();
      this.createShortcutsPanel();
      this.bindEvents();
    }
  
    createShortcutsButton() {
      const button = document.createElement('button');
      button.className = 'shortcuts-button';
      button.innerHTML = '<i class="fas fa-keyboard"></i>';
      document.body.appendChild(button);
    }
  
    createShortcutsPanel() {
      const panel = document.createElement('div');
      panel.className = 'shortcuts-panel';
      
      const shortcuts = [
        { keys: ['Alt', 'A'], description: 'Create new note' },
        { keys: ['Alt', 'S'], description: 'Select next note' },
        { keys: ['Alt', 'D'], description: 'Delete selected note' },
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
          ${shortcuts.map(shortcut => `
            <li>
              <div class="shortcut-keys">
                ${shortcut.keys.map(key => `<kbd>${key}</kbd>`).join(' + ')}
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
      });
  
      // Close panel when clicking outside
      document.addEventListener('click', (e) => {
        if (isOpen && !panel.contains(e.target) && !button.contains(e.target)) {
          isOpen = false;
          panel.classList.remove('show');
          button.classList.remove('active');
        }
      });
    }
  } 