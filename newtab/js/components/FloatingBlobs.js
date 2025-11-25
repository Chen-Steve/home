class FloatingBlob {
  constructor(canvas, x, y, radius = 25) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.centerX = x;
    this.centerY = y;
    this.radius = radius;
    this.numPoints = 25; // Same as main blob
    this.angle = (Math.PI * 2) / this.numPoints;
    this.points = new Array(this.numPoints);

    // Animation properties - same as main blob
    this.time = Math.random() * 1000;
    this.animationSpeed = 0.002; // Same as main blob
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.02;

    // Movement properties - faster for border bouncing
    this.velocityX = (Math.random() - 0.5) * 1.2;
    this.velocityY = (Math.random() - 0.5) * 1.2;
    this.maxSpeed = 0.8;
    this.bounceDamping = 0.9; // Slight energy loss on bounce
    
    // Smooth random movement using Perlin-like noise
    this.noiseX = Math.random() * 1000;
    this.noiseY = Math.random() * 1000;
    this.noiseSpeed = 0.003;

    // Appearance properties - same as main blob
    this.baseRadius = radius;
    this.noiseAmplitude = 15; // Same noise as main blob
    this.opacity = 0.4; // Slightly visible but not too prominent
  }

  // Simple noise function for smoother random movement
  noise(t) {
    return Math.sin(t) * 0.5 + Math.sin(t * 2.3) * 0.3 + Math.sin(t * 3.7) * 0.2;
  }

  update() {
    this.time += this.animationSpeed;
    this.noiseX += this.noiseSpeed;
    this.noiseY += this.noiseSpeed;

    // Add smooth organic movement using noise instead of pure random
    const noiseFactor = 0.008;
    this.velocityX += this.noise(this.noiseX) * noiseFactor;
    this.velocityY += this.noise(this.noiseY) * noiseFactor;

    // Limit speed
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    if (speed > this.maxSpeed) {
      this.velocityX = (this.velocityX / speed) * this.maxSpeed;
      this.velocityY = (this.velocityY / speed) * this.maxSpeed;
    }

    // Update position
    this.centerX += this.velocityX;
    this.centerY += this.velocityY;

    // Bounce off screen edges
    const margin = this.baseRadius + 10;

    // Left edge bounce
    if (this.centerX - margin < 0) {
      this.centerX = margin;
      this.velocityX = Math.abs(this.velocityX) * this.bounceDamping;
    }

    // Right edge bounce
    if (this.centerX + margin > this.canvas.width) {
      this.centerX = this.canvas.width - margin;
      this.velocityX = -Math.abs(this.velocityX) * this.bounceDamping;
    }

    // Top edge bounce
    if (this.centerY - margin < 0) {
      this.centerY = margin;
      this.velocityY = Math.abs(this.velocityY) * this.bounceDamping;
    }

    // Bottom edge bounce
    if (this.centerY + margin > this.canvas.height) {
      this.centerY = this.canvas.height - margin;
      this.velocityY = -Math.abs(this.velocityY) * this.bounceDamping;
    }

    // Update rotation
    this.rotation += this.rotationSpeed;
  }

  draw() {
    // Generate points with organic movement
    for (let i = 0; i < this.numPoints; i++) {
      const noise = Math.sin(this.time + i * 0.5) * this.noiseAmplitude;
      const currentAngle = this.angle * i + this.rotation;
      const x = this.centerX + Math.cos(currentAngle) * (this.baseRadius + noise);
      const y = this.centerY + Math.sin(currentAngle) * (this.baseRadius + noise);
      this.points[i] = { x, y };
    }

    // Draw the blob
    this.ctx.beginPath();
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

    // Create gradient - exactly the same as main blob
    const gradient = this.ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      this.radius * 1.5
    );

    // Use exact same colors as main blob
    gradient.addColorStop(0, 'rgba(44, 62, 80, 0.1)');
    gradient.addColorStop(1, 'rgba(44, 62, 80, 0.05)');

    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

}

class FloatingBlobs {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.blobs = [];
    this.numBlobs = 6; // Fixed number of floating blobs
    this.rafId = null;

    // Bind methods for better performance
    this.boundAnimate = this.animate.bind(this);
    this.debouncedResize = window.formatters.debounce(this.resize.bind(this), 250);

    this.resize();
    this.createBlobs();
    this.start();

    // Handle resize
    window.addEventListener('resize', this.debouncedResize);
  }

  start() {
    if (this.rafId != null) return;
    this.rafId = requestAnimationFrame(this.boundAnimate);
  }

  stop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  createBlobs() {
    this.blobs = [];

    for (let i = 0; i < this.numBlobs; i++) {
      // Distribute blobs around the border areas of the screen
      const borderMargin = 100; // Distance from edge
      let x, y;

      // Randomly choose which border area to place the blob
      const borderChoice = Math.floor(Math.random() * 4);

      switch (borderChoice) {
        case 0: // Top border
          x = borderMargin + Math.random() * (this.canvas.width - 2 * borderMargin);
          y = borderMargin;
          break;
        case 1: // Right border
          x = this.canvas.width - borderMargin;
          y = borderMargin + Math.random() * (this.canvas.height - 2 * borderMargin);
          break;
        case 2: // Bottom border
          x = borderMargin + Math.random() * (this.canvas.width - 2 * borderMargin);
          y = this.canvas.height - borderMargin;
          break;
        case 3: // Left border
          x = borderMargin;
          y = borderMargin + Math.random() * (this.canvas.height - 2 * borderMargin);
          break;
      }

      const radius = 30 + Math.random() * 40; // Larger sizes, similar to main blob
      const blob = new FloatingBlob(this.canvas, x, y, radius);
      this.blobs.push(blob);
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update() {
    // Respect reduced motion user preference
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.blobs.forEach(blob => {
      if (!prefersReduced) {
        blob.update();
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.blobs.forEach(blob => {
      blob.draw();
    });
  }

  animate() {
    this.update();
    this.draw();
    this.rafId = requestAnimationFrame(this.boundAnimate);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.debouncedResize);
    this.blobs = [];
  }
}

// Initialize floating blobs when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('floating-blobs-canvas');
  if (canvas) {
    window.floatingBlobs = new FloatingBlobs(canvas);
  }
});
