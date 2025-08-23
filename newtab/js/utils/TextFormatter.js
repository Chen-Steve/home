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
      const detail = { html: this.element.innerHTML, text: this.element.textContent };
      this.element.dispatchEvent(new CustomEvent('contentChanged', { detail }));
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
      '-': -2,
      'Add': 2,    // Numpad + (some browsers)
      'Subtract': -2 // Numpad -
    };

    const change = sizeChanges[e.key];
    if (change) {
      e.preventDefault();
      this.changeFontSize(change);
    }
  }

  changeFontSize(change) {
    const currentSize = parseInt(window.getComputedStyle(this.element).fontSize);
    const clamp = (val, min = 12, max = 32) => Math.min(Math.max(val, min), max);
    const newSize = (window.formatters && window.formatters.clampFontSize)
      ? window.formatters.clampFontSize(currentSize + change, 12, 32)
      : clamp(currentSize + change, 12, 32);
    this.element.style.fontSize = `${newSize}px`;

    const detail = { fontSizePx: newSize, html: this.element.innerHTML, text: this.element.textContent };
    this.element.dispatchEvent(new CustomEvent('contentChanged', { detail }));
    this.element.dispatchEvent(new CustomEvent('fontSizeChanged', { detail }));
  }
}

// Make it globally available for the extension
window.TextFormatter = TextFormatter;
