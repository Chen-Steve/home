const storedJson = new Map();

const formatters = {
  debounce(func, wait) {
    let timeout = null;
    function executedFunction(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    }
    executedFunction.cancel = () => {
      clearTimeout(timeout);
      timeout = null;
    };
    executedFunction.pending = () => timeout != null;
    return executedFunction;
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
      storedJson.set(key, saved);
      return JSON.parse(saved);
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e.message);
      return fallback;
    }
  },

  writeStorage(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (storedJson.get(key) === serialized) return;
      localStorage.setItem(key, serialized);
      storedJson.set(key, serialized);
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
  },

  // Moves `element` with a transform, then commits left/top once on release.
  trackPointerDrag(element, { button = 2, ignore = null, threshold = 0, onCommit } = {}) {
    let dragging = false;
    let gesture = 0;

    element.addEventListener('pointerdown', (e) => {
      if (dragging || e.button !== button) return;
      if (ignore && e.target.closest(ignore)) return;

      const rect = element.getBoundingClientRect();
      const startPointerX = e.clientX;
      const startPointerY = e.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      const width = rect.width;
      const height = rect.height;
      let deltaX = 0;
      let deltaY = 0;
      let rafId = null;
      let engaged = threshold <= 0;
      const gestureId = ++gesture;

      dragging = true;
      if (engaged) element.classList.add('moving');
      e.preventDefault();
      formatters.capturePointer(element, e);

      const applyTransform = () => {
        rafId = null;
        element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      };

      const onPointerMove = (ev) => {
        ev.preventDefault();
        const rawDx = ev.clientX - startPointerX;
        const rawDy = ev.clientY - startPointerY;
        if (!engaged) {
          if (Math.hypot(rawDx, rawDy) <= threshold) return;
          engaged = true;
          element.classList.add('moving');
        }
        deltaX = Math.max(-startLeft, Math.min(window.innerWidth - width - startLeft, rawDx));
        deltaY = Math.max(-startTop, Math.min(window.innerHeight - height - startTop, rawDy));
        if (rafId === null) rafId = requestAnimationFrame(applyTransform);
      };

      const onPointerUp = (ev) => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        dragging = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        formatters.releasePointer(element, ev);
        if (!engaged) return;

        if (deltaX !== 0 || deltaY !== 0) {
          const x = startLeft + deltaX;
          const y = startTop + deltaY;
          element.style.left = `${x}px`;
          element.style.top = `${y}px`;
          if (onCommit) onCommit({ x, y });
        }
        element.style.transform = '';
        requestAnimationFrame(() => {
          if (gesture === gestureId) element.classList.remove('moving');
        });
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }
};

window.formatters = formatters;
