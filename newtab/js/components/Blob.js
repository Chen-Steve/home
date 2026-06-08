class MainBlob {
  constructor(scene) {
    this.scene = scene;
    this.radius = 150;
    this.numPoints = 25;
    this.angle = (Math.PI * 2) / this.numPoints;
    this.points = new Array(this.numPoints);
    for (let i = 0; i < this.numPoints; i++) {
      this.points[i] = { x: 0, y: 0 };
    }
    this.animationSpeed = 0.002;
    this.time = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.deceleration = 0.98;
    this.isDragging = false;
    this.dragRadius = 120;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.snapEase = 0.12;
    this.dragSpinSpeed = 0.06;
    this.centerX = 0;
    this.centerY = 0;
    this.gradient = null;
    this.gradientCx = NaN;
    this.gradientCy = NaN;
  }

  onResize(width, height) {
    this.centerX = width / 2;
    this.centerY = height / 2;
  }

  bindPointerEvents() {
    const canvas = this.scene.canvas;

    this.onPointerDown = (e) => {
      const { x, y } = this.getPointerPos(e);
      const cx = this.centerX + this.dragOffsetX;
      const cy = this.centerY + this.dragOffsetY;
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      const approxBlobRadius = this.radius + 30;
      if (dist2 <= approxBlobRadius * approxBlobRadius) {
        this.isDragging = true;
        this.updateDrag({ x, y });
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        document.body.classList.add('dragging-blob');
        e.preventDefault();
      }
    };

    this.onPointerMove = (e) => {
      if (!this.isDragging) return;
      this.updateDrag(this.getPointerPos(e));
      e.preventDefault();
    };

    this.onPointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      document.body.classList.remove('dragging-blob');
    };

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
  }

  unbindPointerEvents() {
    const canvas = this.scene.canvas;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerUp);
  }

  update() {
    this.time += this.animationSpeed;
    this.rotationSpeed *= this.deceleration;
    if (this.isDragging) {
      this.rotationSpeed = this.dragSpinSpeed;
    }
    this.rotation += this.rotationSpeed;

    if (!this.isDragging) {
      this.dragOffsetX += (0 - this.dragOffsetX) * this.snapEase;
      this.dragOffsetY += (0 - this.dragOffsetY) * this.snapEase;
      if (Math.abs(this.dragOffsetX) < 0.01) this.dragOffsetX = 0;
      if (Math.abs(this.dragOffsetY) < 0.01) this.dragOffsetY = 0;
    }
  }

  draw(ctx) {
    ctx.beginPath();

    const cx = this.centerX + this.dragOffsetX;
    const cy = this.centerY + this.dragOffsetY;

    for (let i = 0; i < this.numPoints; i++) {
      const noise = Math.sin(this.time + i) * 15;
      const currentAngle = this.angle * i + this.rotation;
      const point = this.points[i];
      point.x = cx + Math.cos(currentAngle) * (this.radius + noise);
      point.y = cy + Math.sin(currentAngle) * (this.radius + noise);
    }

    const firstPoint = this.points[0];
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 0; i < this.numPoints; i++) {
      const next = this.points[(i + 1) % this.numPoints];
      const nextNext = this.points[(i + 2) % this.numPoints];
      ctx.quadraticCurveTo(next.x, next.y, (next.x + nextNext.x) / 2, (next.y + nextNext.y) / 2);
    }

    ctx.closePath();

    if (!this.gradient || cx !== this.gradientCx || cy !== this.gradientCy) {
      this.gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.radius * 1.5);
      this.gradient.addColorStop(0, 'rgba(44, 62, 80, 0.1)');
      this.gradient.addColorStop(1, 'rgba(44, 62, 80, 0.05)');
      this.gradientCx = cx;
      this.gradientCy = cy;
    }
    ctx.fillStyle = this.gradient;
    ctx.fill();
  }

  getPointerPos(evt) {
    const rect = this.scene.canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }

  updateDrag(pointer) {
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
