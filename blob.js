class Blob {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.radius = 150;
    this.numPoints = 25;
    this.angle = (Math.PI * 2) / this.numPoints;
    this.points = new Array(this.numPoints);
    this.animationSpeed = 0.002;
    this.time = 0;
    this.rotation = 0;
    this.isHovered = false;
    this.rotationSpeed = 0;
    this.targetRotationSpeed = 0;
    this.maxRotationSpeed = 0.05;
    this.deceleration = 0.98;
    
    this.boundAnimate = this.animate.bind(this);
    this.debouncedResize = this.debounce(this.resize.bind(this), 250);
    
    this.resize();
    window.addEventListener('resize', this.debouncedResize);
    this.boundAnimate();
    
    this.canvas.addEventListener('mousedown', () => {
      this.rotationSpeed = this.maxRotationSpeed;
    });
    
    this.canvas.addEventListener('mouseup', () => {
      // Let deceleration handle slowing down
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      // Also handle mouse leaving canvas while clicked
    });
    
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '1';
    this.canvas.style.pointerEvents = 'auto';
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.gradient = null;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    
    for (let i = 0; i < this.numPoints; i++) {
      const noise = Math.sin(this.time + i) * 15;
      const currentAngle = this.angle * i + this.rotation;
      const x = this.centerX + Math.cos(currentAngle) * (this.radius + noise);
      const y = this.centerY + Math.sin(currentAngle) * (this.radius + noise);
      this.points[i] = { x, y };
    }
    
    const firstPoint = this.points[0];
    this.ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 0; i < this.numPoints; i++) {
      const next = this.points[(i + 1) % this.numPoints];
      const nextNext = this.points[(i + 2) % this.numPoints];
      
      const controlX = (next.x + nextNext.x) / 2;
      const controlY = (next.y + nextNext.y) / 2;
      
      this.ctx.quadraticCurveTo(next.x, next.y, controlX, controlY);
    }

    this.ctx.closePath();
    
    if (!this.gradient) {
      this.gradient = this.ctx.createRadialGradient(
        this.centerX, this.centerY, 0,
        this.centerX, this.centerY, this.radius * 1.5
      );
      this.gradient.addColorStop(0, 'rgba(44, 62, 80, 0.2)');
      this.gradient.addColorStop(1, 'rgba(44, 62, 80, 0.1)');
    }
    
    this.ctx.fillStyle = this.gradient;
    this.ctx.fill();
  }

  animate() {
    this.time += this.animationSpeed;
    
    this.rotationSpeed *= this.deceleration;
    
    this.rotation += this.rotationSpeed;
    this.draw();
    requestAnimationFrame(this.boundAnimate);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('background');
  if (canvas) {
    new Blob(canvas);
  }
}); 