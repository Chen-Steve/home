class TextFormatter {
  constructor(element) {
    this.element = element;
    this.bindShortcuts();
    // Set default font size if not already set
    if (!this.element.style.fontSize) {
      this.element.style.fontSize = '16px';
    }
  }

  bindShortcuts() {
    this.element.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        switch(e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            document.execCommand('bold', false, null);
            break;
          case 'i':
            e.preventDefault();
            document.execCommand('italic', false, null);
            break;
          case 'u':
            e.preventDefault();
            document.execCommand('underline', false, null);
            break;
        }
      }
      
      if (e.altKey) {
        switch(e.key) {
          case '+':
          case '=': // Handle both + and = keys (since + is typically Shift+=)
            e.preventDefault();
            this.changeFontSize(2);
            break;
          case '-':
            e.preventDefault();
            this.changeFontSize(-2);
            break;
        }
      }
    });

    // Save content when it changes
    this.element.addEventListener('input', () => {
      this.element.dispatchEvent(new Event('contentChanged'));
    });
  }

  changeFontSize(change) {
    const currentSize = parseInt(window.getComputedStyle(this.element).fontSize);
    const newSize = Math.min(Math.max(currentSize + change, 12), 32); // Min 12px, Max 32px
    this.element.style.fontSize = `${newSize}px`;
    
    // Dispatch both events
    this.element.dispatchEvent(new Event('contentChanged'));
    this.element.dispatchEvent(new Event('fontSizeChanged'));
  }
} 