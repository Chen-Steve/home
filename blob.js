class Blob {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.radius = 150;
    this.points = 25;
    this.angle = (Math.PI * 2) / this.points;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    this.animationSpeed = 0.002;
    this.time = 0;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    
    const points = [];
    for (let i = 0; i < this.points; i++) {
      const currentAngle = this.angle * i;
      const noise = Math.sin(this.time + i) * 15;
      const x = this.centerX + Math.cos(currentAngle) * (this.radius + noise);
      const y = this.centerY + Math.sin(currentAngle) * (this.radius + noise);
      points.push({ x, y });
    }
    
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const nextNext = points[(i + 2) % points.length];
      
      const controlX = (next.x + current.x) / 2;
      const controlY = (next.y + current.y) / 2;
      const controlX2 = (next.x + nextNext.x) / 2;
      const controlY2 = (next.y + nextNext.y) / 2;
      
      this.ctx.quadraticCurveTo(next.x, next.y, controlX2, controlY2);
    }

    this.ctx.closePath();
    
    const gradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, this.radius * 1.5
    );
    gradient.addColorStop(0, 'rgba(44, 62, 80, 0.2)');
    gradient.addColorStop(1, 'rgba(44, 62, 80, 0.1)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  animate() {
    this.time += this.animationSpeed;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('background');
  new Blob(canvas);
}); 