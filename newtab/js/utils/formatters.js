const formatters = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  },

  clamp(value, min, max) {
    const numeric = Number(value);
    const lower = Number(min);
    const upper = Number(max);
    if (!Number.isFinite(numeric)) return lower;
    return Math.min(Math.max(numeric, lower), upper);
  },

  clampFontSize(size, min = 12, max = 32) {
    return formatters.clamp(size, min, max);
  },

  clampToViewport(x, y, width, height) {
    return {
      x: formatters.clamp(x, 0, Math.max(0, window.innerWidth - width)),
      y: formatters.clamp(y, 0, Math.max(0, window.innerHeight - height))
    };
  },

  readStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      if (saved == null) return fallback;
      return JSON.parse(saved);
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e.message);
      return fallback;
    }
  },

  writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to save ${key}:`, e.message);
    }
  },

  capturePointer(el, e) {
    try {
      if (e.pointerId != null) el.setPointerCapture(e.pointerId);
    } catch (_) {}
  },

  releasePointer(el, e) {
    try {
      if (e.pointerId != null) el.releasePointerCapture(e.pointerId);
    } catch (_) {}
  },

  onResize(handler, wait = 200) {
    const fn = formatters.debounce(handler, wait);
    window.addEventListener('resize', fn);
    return fn;
  }
};

window.formatters = formatters;
