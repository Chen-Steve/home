class TextFormatter {
  constructor(element) {
    this.element = element;
    this.initializeFontSize();
    this.element.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  initializeFontSize() {
    if (!this.element.style.fontSize) {
      this.element.style.fontSize = '16px';
    }
  }

  handleKeydown(e) {
    if (e.ctrlKey) this.handleFormattingShortcuts(e);
    if (e.altKey) this.handleFontSizeShortcuts(e);
  }

  handleFormattingShortcuts(e) {
    const tagMap = { b: 'strong', i: 'em', u: 'u' };
    const tag = tagMap[e.key.toLowerCase()];
    if (!tag) return;
    e.preventDefault();
    this.toggleInlineFormat(tag);
  }

  toggleInlineFormat(tagName) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const parentTag = this.getParentWithTag(range.commonAncestorContainer, tagName);
    if (parentTag) {
      this.unwrapTag(parentTag);
    } else {
      const wrapper = document.createElement(tagName);
      try {
        range.surroundContents(wrapper);
      } catch (_) {
        const fragment = range.extractContents();
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);
      }
    }

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(this.element);
    selection.addRange(newRange);
    selection.collapseToEnd();
  }

  getParentWithTag(node, tagName) {
    const match = tagName.toLowerCase();
    let current = node;
    while (current && current !== this.element) {
      if (current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() === match) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

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
      Add: 2,
      Subtract: -2
    };
    const change = sizeChanges[e.key];
    if (!change) return;
    e.preventDefault();
    this.changeFontSize(change);
  }

  changeFontSize(change) {
    const currentSize = parseInt(window.getComputedStyle(this.element).fontSize, 10);
    const newSize = formatters.clampFontSize(currentSize + change);
    this.element.style.fontSize = `${newSize}px`;
    this.element.dispatchEvent(new CustomEvent('fontSizeChanged', {
      detail: { fontSizePx: newSize }
    }));
  }
}

window.TextFormatter = TextFormatter;
