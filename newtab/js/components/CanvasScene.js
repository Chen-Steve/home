class CanvasScene {
  static TARGET_FPS = 30;
  static IDLE_TIMEOUT_MS = 30000;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.mainBlob = new MainBlob(this);
    this.rafId = null;
    this.frameInterval = 1000 / CanvasScene.TARGET_FPS;
    this.lastFrameTime = 0;
    this.lastInteractionTime = Date.now();
    this.isIdlePaused = false;
    this.reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.boundAnimate = this.animate.bind(this);
    this.boundOnActivity = this.onUserActivity.bind(this);
    this.debouncedResize = window.formatters.debounce(this.resize.bind(this), 250);

    this.mainBlob.bindPointerEvents();
    this.bindActivityListeners();
    this.resize();
    window.addEventListener('resize', this.debouncedResize);
    this.reducedMotionMq.addEventListener('change', () => this.onReducedMotionChange());
    this.onReducedMotionChange();
  }

  bindActivityListeners() {
    const events = ['pointerdown', 'keydown', 'wheel'];
    for (const event of events) {
      document.addEventListener(event, this.boundOnActivity, { passive: true });
    }
  }

  unbindActivityListeners() {
    const events = ['pointerdown', 'keydown', 'wheel'];
    for (const event of events) {
      document.removeEventListener(event, this.boundOnActivity);
    }
  }

  onUserActivity() {
    this.lastInteractionTime = Date.now();
    if (this.isIdlePaused && !document.hidden && !this.prefersReducedMotion()) {
      this.isIdlePaused = false;
      this.start();
    }
  }

  isBlobAtRest() {
    const blob = this.mainBlob;
    return !blob.isDragging &&
      Math.abs(blob.dragOffsetX) < 0.5 &&
      Math.abs(blob.dragOffsetY) < 0.5 &&
      Math.abs(blob.rotationSpeed) < 0.001;
  }

  shouldPauseForIdle() {
    return Date.now() - this.lastInteractionTime >= CanvasScene.IDLE_TIMEOUT_MS &&
      this.isBlobAtRest();
  }

  getEffectiveFrameInterval() {
    return this.mainBlob.isDragging ? 1000 / 60 : this.frameInterval;
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
    this.isIdlePaused = false;
    this.lastInteractionTime = Date.now();
    this.lastFrameTime = 0;
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
  }

  animate(timestamp) {
    if (this.shouldPauseForIdle()) {
      this.isIdlePaused = true;
      this.rafId = null;
      return;
    }

    const interval = this.getEffectiveFrameInterval();
    if (this.lastFrameTime && timestamp - this.lastFrameTime < interval) {
      this.rafId = requestAnimationFrame(this.boundAnimate);
      return;
    }
    this.lastFrameTime = timestamp;

    this.mainBlob.update();
    this.drawFrame();
    this.rafId = requestAnimationFrame(this.boundAnimate);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.debouncedResize);
    this.unbindActivityListeners();
    this.mainBlob.unbindPointerEvents();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('background');
  if (canvas) {
    window.canvasScene = new CanvasScene(canvas);
  }
}, { once: true });
