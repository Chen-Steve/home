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
              <span>Used:&nbsp;</span>
              <span>${this.formatBytes(usedMemory)}/${this.formatBytes(capacity)}</span>
            </div>
            <div class="metric">
              <span>Usage:&nbsp;</span>
              <span>${usagePercentage}%</span>
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
  
  class Point {
    constructor(azimuth, parent) {
      this.parent = parent;
      this.azimuth = Math.PI - azimuth;
      this._components = { 
        x: Math.cos(this.azimuth),
        y: Math.sin(this.azimuth)
      };
      this._acceleration = -0.01 + Math.random() * 0.02;
      this._speed = 0;
      this._radialEffect = 0;
      this._elasticity = 0.01;
      this._friction = 0.035;
    }

    solveWith(leftPoint, rightPoint) {
      this.acceleration = (
        -0.03 * this.radialEffect +
        (leftPoint.radialEffect - this.radialEffect) * 0.9 +
        (rightPoint.radialEffect - this.radialEffect) * 0.9
      ) * this.elasticity - this.speed * this.friction;
    }

    get position() {
      return { 
        x: this.parent.center.x + this.components.x * (this.parent.radius + this.radialEffect), 
        y: this.parent.center.y + this.components.y * (this.parent.radius + this.radialEffect) 
      };
    }

    set acceleration(value) {
      if (typeof value === 'number') {
        this._acceleration = value;
        this.speed += this._acceleration * 2;
      }
    }
    get acceleration() { return this._acceleration; }

    set speed(value) {
      if (typeof value === 'number') {
        this._speed = value;
        this.radialEffect += this._speed * 3;
      }
    }
    get speed() { return this._speed; }

    set radialEffect(value) {
      if (typeof value === 'number') {
        this._radialEffect = value;
      }
    }
    get radialEffect() { return this._radialEffect; }

    get components() { return this._components; }
    get elasticity() { return this._elasticity; }
    get friction() { return this._friction; }
  }
  
  class Blob {
    constructor() {
      this.canvas = document.getElementById('background');
      this.ctx = this.canvas.getContext('2d');
      this.points = [];
      this.numPoints = 48;
      this.radius = 150;
      this.position = { x: 0.5, y: 0.5 };
      this.mousePos = null;
      this._color = '#000000';
      
      this.resize();
      this.init();
      
      window.addEventListener('resize', () => this.resize());
      
      let oldMousePoint = { x: 0, y: 0 };
      let hover = false;
      
      window.addEventListener('pointermove', (e) => {
        let pos = this.center;
        let diff = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        let dist = Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
        let angle = Math.atan2(diff.y, diff.x);
        
        this.mousePos = { x: pos.x - e.clientX, y: pos.y - e.clientY };
        
        if (dist < this.radius + 100) {
          this.points.forEach(point => {
            const angleDiff = Math.abs(angle - point.azimuth);
            const wrappedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
            
            if (wrappedDiff < 0.5) {
              let strength = { 
                x: oldMousePoint.x - e.clientX, 
                y: oldMousePoint.y - e.clientY 
              };
              strength = Math.sqrt((strength.x * strength.x) + (strength.y * strength.y)) * 2;
              if (strength > 25) strength = 25;
              
              const effect = (1 - wrappedDiff / 0.5) * (strength / 100) * 0.25;
              point.acceleration = effect;
            }
          });
        }
        
        oldMousePoint.x = e.clientX;
        oldMousePoint.y = e.clientY;
      });
    }

    init() {
      for (let i = 0; i < this.numPoints; i++) {
        let point = new Point(this.divisional * (i + 1), this);
        this.points.push(point);
      }
      requestAnimationFrame(() => this.render());
    }

    render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      const points = this.points;
      points[0].solveWith(points[points.length - 1], points[1]);

      let p0 = points[points.length - 1].position;
      let p1 = points[0].position;
      let _p2 = p1;

      this.ctx.beginPath();
      this.ctx.moveTo(this.center.x, this.center.y);
      this.ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);

      for (let i = 1; i < this.points.length; i++) {
        points[i].solveWith(points[i - 1], points[i + 1] || points[0]);

        let p2 = points[i].position;
        let xc = (p1.x + p2.x) / 2;
        let yc = (p1.y + p2.y) / 2;
        
        this.ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
        p1 = p2;
      }

      let xc = (p1.x + _p2.x) / 2;
      let yc = (p1.y + _p2.y) / 2;
      this.ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);

      this.ctx.fillStyle = this.color;
      this.ctx.fill();
      
      requestAnimationFrame(() => this.render());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    get center() {
      return { 
        x: this.canvas.width * this.position.x, 
        y: this.canvas.height * this.position.y 
      };
    }

    get divisional() {
      return Math.PI * 2 / this.numPoints;
    }

    get color() {
      return this._color || '#000000';
    }
    set color(value) {
      this._color = value;
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
    }

    const canvas = document.getElementById('background');
    if (canvas) {
      new Blob();
    }
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