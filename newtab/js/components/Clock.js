class Clock {
  constructor() {
    this.timeElement = document.getElementById('time');
    this.rafId = null;
    this.timerId = null;
    this.init();
  }

  init() {
    if (this.timeElement) {
      this.startClock();
    }
  }

  updateTime() {
    const now = new Date();
    this.timeElement.textContent = now.toLocaleTimeString();
  }

  startClock() {
    const tick = () => {
      // Driftless ticking: schedule next tick based on the next whole second
      const now = Date.now();
      this.updateTime();
      const next = 1000 - (now % 1000);
      this.timerId = setTimeout(() => {
        this.rafId = requestAnimationFrame(tick);
      }, next);
    };
    tick();
  }

  stopClock() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stopClock();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.clock = new Clock();
}, { once: true });
