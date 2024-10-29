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
      this.memoryInfo = document.getElementById('memoryInfo');
      this.cpuInfo = document.getElementById('cpuInfo');
      this.storageInfo = document.getElementById('storageInfo');
      
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
      chrome.system.memory.getInfo(info => {
        const availableCapacity = info.availableCapacity;
        const capacity = info.capacity;
        const usedMemory = capacity - availableCapacity;
        const usagePercentage = (usedMemory / capacity * 100).toFixed(1);
  
        this.memoryInfo.innerHTML = `
          <i class="fas fa-memory"></i>
          <h3>Memory</h3>
          <div class="metric">
            <span>Used:</span>
            <span>${this.formatBytes(usedMemory)}</span>
          </div>
          <div class="metric">
            <span>Total:</span>
            <span>${this.formatBytes(capacity)}</span>
          </div>
          <div class="metric">
            <span>Usage:</span>
            <span>${usagePercentage}%</span>
          </div>
          ${this.createProgressBar(usagePercentage)}
        `;
      });
    }
  
    updateCPUInfo() {
      chrome.system.cpu.getInfo(info => {
        const cpuUsage = info.processors.reduce((acc, processor) => {
          return acc + processor.usage.user;
        }, 0) / info.processors.length;
  
        const usagePercentage = (cpuUsage / 100).toFixed(1);
  
        this.cpuInfo.innerHTML = `
          <i class="fas fa-microchip"></i>
          <h3>CPU</h3>
          <div class="metric">
            <span>Processors:</span>
            <span>${info.numOfProcessors}</span>
          </div>
          <div class="metric">
            <span>Architecture:</span>
            <span>${info.archName}</span>
          </div>
          <div class="metric">
            <span>Usage:</span>
            <span>${usagePercentage}%</span>
          </div>
          ${this.createProgressBar(usagePercentage)}
        `;
      });
    }
  
    updateStorageInfo() {
      chrome.system.storage.getInfo(info => {
        const drives = info.filter(drive => drive.capacity > 0);
        
        this.storageInfo.innerHTML = `
          <i class="fas fa-hdd"></i>
          <h3>Storage</h3>
          ${drives.map(drive => {
            const usagePercentage = ((drive.capacity - drive.available) / drive.capacity * 100).toFixed(1);
            return `
              <div class="metric">
                <span>${drive.name || 'Local Storage'}:</span>
              </div>
              <div class="metric">
                <span>Free:</span>
                <span>${this.formatBytes(drive.available)}</span>
              </div>
              <div class="metric">
                <span>Total:</span>
                <span>${this.formatBytes(drive.capacity)}</span>
              </div>
              <div class="metric">
                <span>Usage:</span>
                <span>${usagePercentage}%</span>
              </div>
              ${this.createProgressBar(usagePercentage)}
            `;
          }).join('<hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">')}
        `;
      });
    }
  
    initializeMonitoring() {
      // Initial updates
      this.updateMemoryInfo();
      this.updateCPUInfo();
      this.updateStorageInfo();
  
      // Regular updates
      setInterval(() => {
        this.updateMemoryInfo();
        this.updateCPUInfo();
        this.updateStorageInfo();
      }, 2000); // Update every 2 seconds
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateTime, 1000);
    updateTime();
    updateGreeting();
    new SystemMonitor();
  });