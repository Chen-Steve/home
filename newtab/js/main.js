(function () {
  function pauseAll() {
    try { window.clock?.stopClock?.(); } catch (_) {}
    try { window.canvasScene?.stop?.(); } catch (_) {}
  }

  function resumeAll() {
    if (document.hidden) return;
    try { window.clock?.startClock?.(); } catch (_) {}
    try { window.canvasScene?.start?.(); } catch (_) {}
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll();
    else resumeAll();
  });

  window.addEventListener('blur', pauseAll);
  window.addEventListener('focus', resumeAll);
})();
