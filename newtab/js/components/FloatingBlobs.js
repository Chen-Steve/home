class FloatingBlob {
  constructor(x, y, radius = 25) {
    this.centerX = x;
    this.centerY = y;
    this.radius = radius;
    this.numPoints = 25;
    this.angle = (Math.PI * 2) / this.numPoints;
    this.points = new Array(this.numPoints);
    this.time = Math.random() * 1000;
    this.animationSpeed = 0.002;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    this.velocityX = (Math.random() - 0.5) * 1.2;
    this.velocityY = (Math.random() - 0.5) * 1.2;
    this.maxSpeed = 0.8;
    this.bounceDamping = 0.9;
    this.noiseX = Math.random() * 1000;
    this.noiseY = Math.random() * 1000;
    this.noiseSpeed = 0.003;
    this.baseRadius = radius;
    this.noiseAmplitude = 15;
    this.boundsWidth = 0;
    this.boundsHeight = 0;
  }

  noise(t) {
    return Math.sin(t) * 0.5 + Math.sin(t * 2.3) * 0.3 + Math.sin(t * 3.7) * 0.2;
  }

  setBounds(width, height) {
    this.boundsWidth = width;
    this.boundsHeight = height;
  }

  update() {
    this.time += this.animationSpeed;
    this.noiseX += this.noiseSpeed;
    this.noiseY += this.noiseSpeed;

    const noiseFactor = 0.008;
    this.velocityX += this.noise(this.noiseX) * noiseFactor;
    this.velocityY += this.noise(this.noiseY) * noiseFactor;

    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    if (speed > this.maxSpeed) {
      this.velocityX = (this.velocityX / speed) * this.maxSpeed;
      this.velocityY = (this.velocityY / speed) * this.maxSpeed;
    }

    this.centerX += this.velocityX;
    this.centerY += this.velocityY;

    const margin = this.baseRadius + 10;

    if (this.centerX - margin < 0) {
      this.centerX = margin;
      this.velocityX = Math.abs(this.velocityX) * this.bounceDamping;
    }
    if (this.centerX + margin > this.boundsWidth) {
      this.centerX = this.boundsWidth - margin;
      this.velocityX = -Math.abs(this.velocityX) * this.bounceDamping;
    }
    if (this.centerY - margin < 0) {
      this.centerY = margin;
      this.velocityY = Math.abs(this.velocityY) * this.bounceDamping;
    }
    if (this.centerY + margin > this.boundsHeight) {
      this.centerY = this.boundsHeight - margin;
      this.velocityY = -Math.abs(this.velocityY) * this.bounceDamping;
    }

    this.rotation += this.rotationSpeed;
  }

  draw(ctx) {
    for (let i = 0; i < this.numPoints; i++) {
      const noise = Math.sin(this.time + i * 0.5) * this.noiseAmplitude;
      const currentAngle = this.angle * i + this.rotation;
      const x = this.centerX + Math.cos(currentAngle) * (this.baseRadius + noise);
      const y = this.centerY + Math.sin(currentAngle) * (this.baseRadius + noise);
      this.points[i] = { x, y };
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 0; i < this.numPoints; i++) {
      const next = this.points[(i + 1) % this.numPoints];
      const nextNext = this.points[(i + 2) % this.numPoints];
      ctx.quadraticCurveTo(next.x, next.y, (next.x + nextNext.x) / 2, (next.y + nextNext.y) / 2);
    }

    ctx.closePath();

    const gradient = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, this.radius * 1.5
    );
    gradient.addColorStop(0, 'rgba(44, 62, 80, 0.1)');
    gradient.addColorStop(1, 'rgba(44, 62, 80, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

class FloatingBlobGroup {
  constructor(scene) {
    this.scene = scene;
    this.blobs = [];
    this.numBlobs = 6;
  }

  onResize(width, height) {
    if (this.blobs.length === 0) {
      this.createBlobs(width, height);
    } else {
      this.blobs.forEach((blob) => blob.setBounds(width, height));
    }
  }

  createBlobs(width, height) {
    this.blobs = [];

    for (let i = 0; i < this.numBlobs; i++) {
      const borderMargin = 100;
      let x;
      let y;
      const borderChoice = Math.floor(Math.random() * 4);

      switch (borderChoice) {
        case 0:
          x = borderMargin + Math.random() * (width - 2 * borderMargin);
          y = borderMargin;
          break;
        case 1:
          x = width - borderMargin;
          y = borderMargin + Math.random() * (height - 2 * borderMargin);
          break;
        case 2:
          x = borderMargin + Math.random() * (width - 2 * borderMargin);
          y = height - borderMargin;
          break;
        default:
          x = borderMargin;
          y = borderMargin + Math.random() * (height - 2 * borderMargin);
          break;
      }

      const radius = 30 + Math.random() * 40;
      const blob = new FloatingBlob(x, y, radius);
      blob.setBounds(width, height);
      this.blobs.push(blob);
    }
  }

  update() {
    this.blobs.forEach((blob) => blob.update());
  }

  draw(ctx) {
    this.blobs.forEach((blob) => blob.draw(ctx));
  }
}
