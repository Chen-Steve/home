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
    
    // Drag state
    this.isDragging = false;
    this.dragRadius = 120; // Max distance the blob can be dragged from its center
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.snapEase = 0.12; // Higher is snappier
    
    // SPIN SPEED WHILE DRAGGING: change this value to adjust how fast the blob spins during drag
    this.dragSpinSpeed = 0.06;
    
    this.boundAnimate = this.animate.bind(this);
    this.debouncedResize = this.debounce(this.resize.bind(this), 250);
    
    this.resize();
    window.addEventListener('resize', this.debouncedResize);
    this.boundAnimate();
    
    // Pointer handlers for dragging within a radius with snap-back
    this.onPointerDown = (e) => {
      const { x, y } = this.getPointerPos(e);
      const cx = this.centerX + this.dragOffsetX;
      const cy = this.centerY + this.dragOffsetY;
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      const approxBlobRadius = this.radius + 30; // allowance for organic edge
      if (dist2 <= approxBlobRadius * approxBlobRadius) {
        this.isDragging = true;
        this.updateDrag({ x, y });
        // Ensure subsequent moves go to the canvas even if pointer crosses other elements
        try { this.canvas.setPointerCapture && this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
        document.body.classList.add('dragging-blob');
        e.preventDefault();
      }
    };

    this.onPointerMove = (e) => {
      if (!this.isDragging) return;
      const { x, y } = this.getPointerPos(e);
      this.updateDrag({ x, y });
      e.preventDefault();
    };

    this.onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      try { this.canvas.releasePointerCapture && this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      document.body.classList.remove('dragging-blob');
    };

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '1';
    this.canvas.style.pointerEvents = 'auto';
    this.canvas.style.touchAction = 'none';
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
    // Keep current drag offsets; re-centering maintains relative offset visually
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    
    const cx = this.centerX + this.dragOffsetX;
    const cy = this.centerY + this.dragOffsetY;
    
    for (let i = 0; i < this.numPoints; i++) {
      const noise = Math.sin(this.time + i) * 15;
      const currentAngle = this.angle * i + this.rotation;
      const x = cx + Math.cos(currentAngle) * (this.radius + noise);
      const y = cy + Math.sin(currentAngle) * (this.radius + noise);
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
    
    // Recompute gradient each frame so it follows the blob center
    const gradient = this.ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      this.radius * 1.5
    );
    gradient.addColorStop(0, 'rgba(44, 62, 80, 0.1)');
    gradient.addColorStop(1, 'rgba(44, 62, 80, 0.05)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  animate() {
    this.time += this.animationSpeed;
    
    // Ease drag offset back to center when not dragging
    if (!this.isDragging) {
      this.dragOffsetX += (0 - this.dragOffsetX) * this.snapEase;
      this.dragOffsetY += (0 - this.dragOffsetY) * this.snapEase;
      if (Math.abs(this.dragOffsetX) < 0.01) this.dragOffsetX = 0;
      if (Math.abs(this.dragOffsetY) < 0.01) this.dragOffsetY = 0;
    }
    
    // Maintain previous rotation behavior (slow down over time)
    this.rotationSpeed *= this.deceleration;
    
    // While dragging, force a constant spin speed
    if (this.isDragging) {
      this.rotationSpeed = this.dragSpinSpeed; // adjust via this.dragSpinSpeed (see constructor)
    }
    
    this.rotation += this.rotationSpeed;
    this.draw();
    requestAnimationFrame(this.boundAnimate);
  }

  getPointerPos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  }

  updateDrag(pointer) {
    // Desired vector from original center to pointer
    const dx = pointer.x - this.centerX;
    const dy = pointer.y - this.centerY;
    const clamped = this.clampVector(dx, dy, this.dragRadius);
    this.dragOffsetX = clamped.x;
    this.dragOffsetY = clamped.y;
  }

  clampVector(x, y, maxLength) {
    const lengthSq = x * x + y * y;
    const maxSq = maxLength * maxLength;
    if (lengthSq <= maxSq || lengthSq === 0) return { x, y };
    const length = Math.sqrt(lengthSq);
    const scale = maxLength / length;
    return { x: x * scale, y: y * scale };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('background');
  if (canvas) {
    new Blob(canvas);
  }
}); 