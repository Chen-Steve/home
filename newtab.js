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
      chrome.system.memory.getInfo(info => {
        const availableCapacity = info.availableCapacity;
        const capacity = info.capacity;
        const usedMemory = capacity - availableCapacity;
        const usagePercentage = (usedMemory / capacity * 100).toFixed(1);
  
        this.memoryInfo.innerHTML = `
          <div class="metric">
            <span>Used:&nbsp;</span>
            <span>${this.formatBytes(usedMemory)}/${this.formatBytes(capacity)}</span>
          </div>
          <div class="metric">
            <span>Usage:&nbsp;</span>
            <span>${usagePercentage}%</span>
          </div>
          ${this.createProgressBar(usagePercentage)}
        `;
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
  
  class LavaLamp {
    constructor() {
      this.canvas = document.getElementById('background');
      this.ctx = this.canvas.getContext('2d');
      this.blobs = [];
      this.resize();
      this.init();
      
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    init() {
      // Create 3-4 blobs
      for (let i = 0; i < 4; i++) {
        this.blobs.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: 100 + Math.random() * 100,
          xSpeed: Math.random() * 2 - 1,
          ySpeed: Math.random() * 2 - 1,
          hue: 200 + Math.random() * 20,  // Blue-ish hue
          points: this.generateBlobPoints(),
          angleOffsets: Array(8).fill(0).map(() => Math.random() * Math.PI * 2),
          angleSpeeds: Array(8).fill(0).map(() => (Math.random() - 0.5) * 0.02)
        });
      }
      this.animate();
    }

    generateBlobPoints() {
      return Array(8).fill(0).map(() => ({
        radius: 0.8 + Math.random() * 0.4,  // Random radius between 0.8 and 1.2
        angle: 0
      }));
    }

    drawBlob(blob) {
      this.ctx.beginPath();
      
      // Update point angles
      blob.points.forEach((point, i) => {
        blob.angleOffsets[i] += blob.angleSpeeds[i];
        point.angle = (i / blob.points.length) * Math.PI * 2 + blob.angleOffsets[i];
      });

      // Calculate points around the blob
      const points = blob.points.map(point => ({
        x: blob.x + Math.cos(point.angle) * blob.radius * point.radius,
        y: blob.y + Math.sin(point.angle) * blob.radius * point.radius
      }));

      // Start the path
      this.ctx.moveTo(points[0].x, points[0].y);

      // Draw curves between points
      points.forEach((point, i) => {
        const nextPoint = points[(i + 1) % points.length];
        const controlPoint1 = {
          x: point.x + (nextPoint.x - points[(i - 1 + points.length) % points.length].x) * 0.25,
          y: point.y + (nextPoint.y - points[(i - 1 + points.length) % points.length].y) * 0.25
        };
        const controlPoint2 = {
          x: nextPoint.x - (points[(i + 2) % points.length].x - point.x) * 0.25,
          y: nextPoint.y - (points[(i + 2) % points.length].y - point.y) * 0.25
        };
        this.ctx.bezierCurveTo(
          controlPoint1.x, controlPoint1.y,
          controlPoint2.x, controlPoint2.y,
          nextPoint.x, nextPoint.y
        );
      });

      this.ctx.fillStyle = `hsla(${blob.hue}, 70%, 60%, 0.1)`;
      this.ctx.fill();
    }

    updateBlob(blob) {
      // Move blob
      blob.x += blob.xSpeed;
      blob.y += blob.ySpeed;

      // Bounce off walls
      if (blob.x < 0 || blob.x > this.canvas.width) blob.xSpeed *= -1;
      if (blob.y < 0 || blob.y > this.canvas.height) blob.ySpeed *= -1;

      // Slowly change speed
      blob.xSpeed += (Math.random() - 0.5) * 0.1;
      blob.ySpeed += (Math.random() - 0.5) * 0.1;

      // Limit speed
      blob.xSpeed = Math.max(Math.min(blob.xSpeed, 2), -2);
      blob.ySpeed = Math.max(Math.min(blob.ySpeed, 2), -2);
    }

    animate() {
      // Clear canvas with slight fade effect
      this.ctx.fillStyle = 'rgba(46, 52, 64, 0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Update and draw blobs
      this.blobs.forEach(blob => {
        this.updateBlob(blob);
        this.drawBlob(blob);
      });

      requestAnimationFrame(() => this.animate());
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const timeElement = document.getElementById('time');
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
    new SystemMonitor();
    new LavaLamp();
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