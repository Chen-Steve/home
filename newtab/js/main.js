// Global pause/resume controller for background work to reduce memory/CPU
(function () {
  function pauseAll() {
    try { window.clock && window.clock.stopClock && window.clock.stopClock(); } catch (_) {}
    try { window.blob && window.blob.stop && window.blob.stop(); } catch (_) {}
    try { window.floatingBlobs && window.floatingBlobs.stop && window.floatingBlobs.stop(); } catch (_) {}
  }

  function resumeAll() {
    if (document.hidden) return; // don't resume if still hidden
    try { window.clock && window.clock.startClock && window.clock.startClock(); } catch (_) {}
    try { window.blob && window.blob.start && window.blob.start(); } catch (_) {}
    try { window.floatingBlobs && window.floatingBlobs.start && window.floatingBlobs.start(); } catch (_) {}
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll(); else resumeAll();
  });

  window.addEventListener('blur', pauseAll);
  window.addEventListener('focus', resumeAll);
})();


