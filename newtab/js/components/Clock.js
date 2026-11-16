class Clock {
  constructor() {
    this.timeElement = document.getElementById('time');
    this.timerId = null;
    this.init();
  }

  init() {
    if (this.timeElement) {
      this.startClock();
    }
  }

  updateTime() {
    this.timeElement.textContent = new Date().toLocaleTimeString();
  }

  startClock() {
    if (this.timerId != null) return;
    const tick = () => {
      this.updateTime();
      const next = 1000 - (Date.now() % 1000);
      this.timerId = setTimeout(tick, next);
    };
    tick();
  }

  stopClock() {
    if (this.timerId != null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  destroy() {
    this.stopClock();
  }
}
