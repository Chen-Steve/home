const Icons = {
  el(name, size = 18) {
    return `<i class="ph ph-${name} icon" style="font-size:${size}px" aria-hidden="true"></i>`;
  },

  times(size = 14) {
    return Icons.el('x', size);
  },

  keyboard(size = 18) {
    return Icons.el('keyboard', size);
  },

  search(size = 18) {
    return Icons.el('magnifying-glass', size);
  },

  trash(size = 18) {
    return Icons.el('trash', size);
  },

  chevronLeft(size = 16) {
    return Icons.el('caret-left', size);
  },

  globe(size = 18) {
    return Icons.el('globe', size);
  }
};

window.Icons = Icons;
