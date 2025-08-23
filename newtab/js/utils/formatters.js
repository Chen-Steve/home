// Utility functions for formatting text and values
/**
 * @typedef {Object} Formatters
 * @property {(bytes:number, decimals?:number)=>string} formatBytes
 * @property {(size:number, min?:number, max?:number)=>number} clampFontSize
 */

/** @type {Formatters} */
const formatters = {
  /**
   * Human-readable bytes formatter.
   * @param {number} bytes
   * @param {number} [decimals=2]
   * @returns {string}
   */
  formatBytes: (bytes, decimals = 2) => {
    const num = Number(bytes);
    if (!Number.isFinite(num) || num <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
    const i = Math.min(Math.floor(Math.log(num) / Math.log(k)), sizes.length - 1);
    const value = num / Math.pow(k, i);
    const fractionDigits = Math.max(0, Math.min(6, Number(decimals) || 0));
    return `${parseFloat(value.toFixed(fractionDigits))} ${sizes[i]}`;
  },

  /**
   * Clamp a font size between bounds.
   * @param {number} size
   * @param {number} [min=12]
   * @param {number} [max=32]
   * @returns {number}
   */
  clampFontSize: (size, min = 12, max = 32) => {
    const numeric = Number(size);
    const lower = Number(min);
    const upper = Number(max);
    if (!Number.isFinite(numeric)) return lower;
    return Math.min(Math.max(numeric, lower), upper);
  }
};

// Make the functions available globally or as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = formatters;
} else {
  window.formatters = formatters;
}
