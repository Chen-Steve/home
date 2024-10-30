class TextFormatter {
  constructor(element) {
    this.element = element;
    this.bindShortcuts();
    this.initializeFontSize();
  }

  initializeFontSize() {
    if (!this.element.style.fontSize) {
      this.element.style.fontSize = '16px';
    }
  }

  bindShortcuts() {
    this.element.addEventListener('keydown', this.handleKeydown.bind(this));
    this.element.addEventListener('input', () => {
      this.element.dispatchEvent(new Event('contentChanged'));
    });
  }

  handleKeydown(e) {
    if (e.ctrlKey) {
      this.handleFormattingShortcuts(e);
    }
    if (e.altKey) {
      this.handleFontSizeShortcuts(e);
    }
  }

  handleFormattingShortcuts(e) {
    const commands = {
      'b': 'bold',
      'i': 'italic',
      'u': 'underline'
    };

    const command = commands[e.key.toLowerCase()];
    if (command) {
      e.preventDefault();
      document.execCommand(command, false, null);
    }
  }

  handleFontSizeShortcuts(e) {
    const sizeChanges = {
      '+': 2,
      '=': 2,
      '-': -2
    };

    const change = sizeChanges[e.key];
    if (change) {
      e.preventDefault();
      this.changeFontSize(change);
    }
  }

  changeFontSize(change) {
    const currentSize = parseInt(window.getComputedStyle(this.element).fontSize);
    const newSize = Math.min(Math.max(currentSize + change, 12), 32);
    this.element.style.fontSize = `${newSize}px`;
    
    this.element.dispatchEvent(new Event('contentChanged'));
    this.element.dispatchEvent(new Event('fontSizeChanged'));
  }
}

// Make it globally available for the extension
window.TextFormatter = TextFormatter;
