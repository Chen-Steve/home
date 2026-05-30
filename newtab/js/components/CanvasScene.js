class CanvasScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.mainBlob = new MainBlob(this);
    this.floatingGroup = new FloatingBlobGroup(this);
    this.rafId = null;
    this.reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.boundAnimate = this.animate.bind(this);
    this.debouncedResize = window.formatters.debounce(this.resize.bind(this), 250);

    this.mainBlob.bindPointerEvents();
    this.resize();
    window.addEventListener('resize', this.debouncedResize);
    this.reducedMotionMq.addEventListener('change', () => this.onReducedMotionChange());
    this.onReducedMotionChange();
  }

  get width() {
    return this.canvas.clientWidth;
  }

  get height() {
    return this.canvas.clientHeight;
  }

  prefersReducedMotion() {
    return this.reducedMotionMq.matches;
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.mainBlob.onResize(w, h);
    this.floatingGroup.onResize(w, h);
    this.drawFrame();
  }

  onReducedMotionChange() {
    if (this.prefersReducedMotion()) {
      this.stop();
      this.drawFrame();
    } else if (!document.hidden) {
      this.start();
    }
  }

  start() {
    if (this.prefersReducedMotion() || this.rafId != null) return;
    this.rafId = requestAnimationFrame(this.boundAnimate);
  }

  stop() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  drawFrame() {
    const w = this.width;
    const h = this.height;
    this.ctx.clearRect(0, 0, w, h);
    this.mainBlob.draw(this.ctx);
    this.ctx.save();
    this.ctx.globalAlpha = 0.8;
    this.floatingGroup.draw(this.ctx);
    this.ctx.restore();
  }

  animate() {
    this.mainBlob.update();
    this.floatingGroup.update();
    this.drawFrame();
    this.rafId = requestAnimationFrame(this.boundAnimate);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.debouncedResize);
    this.mainBlob.unbindPointerEvents();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('background');
  if (canvas) {
    window.canvasScene = new CanvasScene(canvas);
  }
}, { once: true });
