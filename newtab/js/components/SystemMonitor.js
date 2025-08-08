function updateTime() {
  const timeElement = document.getElementById('time');
  const now = new Date();
  timeElement.textContent = now.toLocaleTimeString();
}
  
  class SystemMonitor {
    constructor() {
      this.memoryInfo = document.querySelector('#memoryInfo');
      this.initializeMonitoring();
      this.initializeCardBehavior();
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

    initializeCardBehavior() {
      // Initialize memory card as expanded
      const memoryCard = this.memoryInfo.closest('.info-card');
      if (memoryCard) {
        memoryCard.classList.add('expanded');
      }

      // Add click handlers for card expansion
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
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const timeElement = document.getElementById('time');
    const memoryInfo = document.getElementById('memoryInfo');
    
    if (timeElement) {
      const updateOnlyTime = () => {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString();
        requestAnimationFrame(() => setTimeout(updateOnlyTime, 1000));
      };
      updateOnlyTime();
    }
    
    if (memoryInfo) {
      new SystemMonitor();
    }
    
    new ShortcutsMenu();
  }, { once: true });