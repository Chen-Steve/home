// Utility functions for formatting text and values
const formatters = {
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  clampFontSize: (size) => {
    return Math.min(Math.max(size, 12), 32); // Min 12px, Max 32px
  }
};

// Make the functions available globally or as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = formatters;
} else {
  window.formatters = formatters;
}
