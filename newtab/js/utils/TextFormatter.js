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
    const tagMap = {
      'b': 'strong',
      'i': 'em',
      'u': 'u'
    };

    const tag = tagMap[e.key.toLowerCase()];
    if (tag) {
      e.preventDefault();
      this.toggleInlineFormat(tag);
    }
  }

  /**
   * Toggle inline formatting using modern Selection API (replaces deprecated execCommand)
   * @param {string} tagName - The HTML tag to wrap selection with (e.g., 'strong', 'em', 'u')
   */
  toggleInlineFormat(tagName) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // No text selected

    // Check if selection is already wrapped in this tag
    const parentTag = this.getParentWithTag(range.commonAncestorContainer, tagName);
    
    if (parentTag) {
      // Remove formatting: unwrap the tag
      this.unwrapTag(parentTag);
    } else {
      // Apply formatting: wrap selection in tag
      const wrapper = document.createElement(tagName);
      try {
        range.surroundContents(wrapper);
      } catch (e) {
        // If surroundContents fails (partial selection across elements), extract and wrap
        const fragment = range.extractContents();
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);
      }
    }

    // Restore selection
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(this.element);
    selection.addRange(newRange);
    selection.collapseToEnd();
  }

  /**
   * Find parent element with specified tag name
   */
  getParentWithTag(node, tagName) {
    let current = node;
    while (current && current !== this.element) {
      if (current.nodeType === Node.ELEMENT_NODE && 
          current.tagName.toLowerCase() === tagName.toLowerCase()) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  /**
   * Unwrap a tag, keeping its contents
   */
  unwrapTag(element) {
    const parent = element.parentNode;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
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
