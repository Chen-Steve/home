class Clock {
  constructor() {
    this.timeElement = document.getElementById('time');
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
    const update = () => {
      const now = new Date();
      this.updateTime();

      requestAnimationFrame(() => setTimeout(update, 1000));
    };
    
    update();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Clock();
}, { once: true });
