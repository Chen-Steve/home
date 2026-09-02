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

  function init() {
    window.clock = new Clock();
    window.postItManager = new PostItManager();
    window.shortcutsMenu = new ShortcutsMenu();
    window.searchBar = new SearchBar();
    window.chromeTray = new ChromeTray();
    window.quickLinks = new QuickLinks();

    const canvas = document.getElementById('background');
    if (canvas) window.canvasScene = new CanvasScene(canvas);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll();
    else resumeAll();
  });

  window.addEventListener('blur', pauseAll);
  window.addEventListener('focus', resumeAll);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
