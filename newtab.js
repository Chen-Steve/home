function updateTime() {
    const timeElement = document.getElementById('time');
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString();
  }
  
  function updateGreeting() {
    const greetingElement = document.getElementById('greeting');
    const hour = new Date().getHours();
    
    let greeting = 'Good ';
    if (hour < 12) greeting += 'morning';
    else if (hour < 18) greeting += 'afternoon';
    else greeting += 'evening';
    
    greetingElement.textContent = greeting;
  }
  
  class SystemMonitor {
    constructor() {
      this.memoryInfo = document.querySelector('#memoryInfo');
      this.initializeMonitoring();
    }
  
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
  
    createProgressBar(percentage) {
      return `
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${percentage}%"></div>
        </div>
      `;
    }
  
    updateMemoryInfo() {
      if (!chrome?.system?.memory) {
        this.memoryInfo.innerHTML = '<div class="metric">Memory info not available</div>';
        return;
      }

      chrome.system.memory.getInfo(info => {
        if (!info) return;
        const availableCapacity = info.availableCapacity;
        const capacity = info.capacity;
        const usedMemory = capacity - availableCapacity;
        const usagePercentage = (usedMemory / capacity * 100).toFixed(1);
  
        if (this.memoryInfo) {
          this.memoryInfo.innerHTML = `
            <div class="metric">
              <span>Used: ${this.formatBytes(usedMemory)}</span>
            </div>
            <div class="metric">
              <span>Total: ${this.formatBytes(capacity)}</span>
            </div>
            <div class="metric">
              <span>Usage: ${usagePercentage}%</span>
            </div>
            ${this.createProgressBar(usagePercentage)}
          `;
        }
      });
    }
  
    initializeMonitoring() {
      const update = () => {
        this.updateMemoryInfo();
        setTimeout(() => requestAnimationFrame(update), 5000);
      };
      update();
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const timeElement = document.getElementById('time');
    const memoryInfo = document.getElementById('memoryInfo');
    
    if (timeElement) {
      const updateTimeAndGreeting = () => {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString();
        if (!updateTimeAndGreeting.lastHour || updateTimeAndGreeting.lastHour !== now.getHours()) {
          updateGreeting();
          updateTimeAndGreeting.lastHour = now.getHours();
        }
        requestAnimationFrame(() => setTimeout(updateTimeAndGreeting, 1000));
      };
      updateTimeAndGreeting();
    }

    if (memoryInfo) {
      new SystemMonitor();
      memoryInfo.closest('.info-card')?.classList.add('expanded');
    }

    new ShortcutsMenu();
  }, { once: true });

  document.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('click', function() {
      // Toggle the expanded class on the clicked card
      this.classList.toggle('expanded');
      
      // Close other cards
      document.querySelectorAll('.info-card').forEach(otherCard => {
        if (otherCard !== this) {
          otherCard.classList.remove('expanded');
        }
      });
    });
  });