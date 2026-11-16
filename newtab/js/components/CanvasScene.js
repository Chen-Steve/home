class CanvasScene {
  static TARGET_FPS = 30;
  static MAX_DPR = 2;
  static IDLE_TIMEOUT_MS = 30000;
  static ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel'];

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, CanvasScene.MAX_DPR);
    this.viewSize = 0;
    this.mainBlob = new MainBlob(this);
    this.rafId = null;
    this.delayId = null;
    this.frameInterval = 1000 / CanvasScene.TARGET_FPS;
    this.lastFrameTime = 0;
    this.lastInteractionTime = Date.now();
    this.isIdlePaused = false;
    this.reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.boundAnimate = this.animate.bind(this);
    this.boundOnActivity = this.onUserActivity.bind(this);
    this.debouncedResize = formatters.debounce(this.resize.bind(this), 250);

    this.mainBlob.bindPointerEvents();
    this.bindActivityListeners();
    this.resize();
    window.addEventListener('resize', this.debouncedResize);
    this.reducedMotionMq.addEventListener('change', () => this.onReducedMotionChange());
    this.onReducedMotionChange();
  }

  bindActivityListeners() {
    for (const event of CanvasScene.ACTIVITY_EVENTS) {
      document.addEventListener(event, this.boundOnActivity, { passive: true });
    }
  }

  unbindActivityListeners() {
    for (const event of CanvasScene.ACTIVITY_EVENTS) {
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
    return this.viewSize;
  }

  get height() {
    return this.viewSize;
  }

  prefersReducedMotion() {
    return this.reducedMotionMq.matches;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CanvasScene.MAX_DPR);
    const size = this.mainBlob.canvasSize();
    if (this.viewSize === size && this.dpr === dpr) return;
    this.dpr = dpr;
    this.viewSize = size;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.canvas.width = Math.round(size * dpr);
    this.canvas.height = Math.round(size * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.mainBlob.onResize(size, size);
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
    if (this.prefersReducedMotion() || this.rafId != null || this.delayId != null) return;
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
    if (this.delayId != null) {
      clearTimeout(this.delayId);
      this.delayId = null;
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
      const wait = interval - (timestamp - this.lastFrameTime);
      if (wait > 4) {
        this.rafId = null;
        this.delayId = setTimeout(() => {
          this.delayId = null;
          this.rafId = requestAnimationFrame(this.boundAnimate);
        }, wait);
      } else {
        this.rafId = requestAnimationFrame(this.boundAnimate);
      }
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
