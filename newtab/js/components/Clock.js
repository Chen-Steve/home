class Clock {
  constructor() {
    this.timeElement = document.getElementById('time');
    this.greetingElement = document.getElementById('greeting');
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

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good ';
    
    if (hour < 12) {
      greeting += 'morning';
    } else if (hour < 18) {
      greeting += 'afternoon';
    } else {
      greeting += 'evening';
    }
    
    this.greetingElement.textContent = greeting;
  }

  startClock() {
    const update = () => {
      const now = new Date();
      this.updateTime();
      
      if (!update.lastHour || update.lastHour !== now.getHours()) {
        this.updateGreeting();
        update.lastHour = now.getHours();
      }
      
      requestAnimationFrame(() => setTimeout(update, 1000));
    };
    
    update();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Clock();
}, { once: true });
