const NOTE_STORAGE_KEY = 'postItNotes';
const NOTE_STORAGE_VERSION = 2;
const MAX_DELETED_NOTES = 100;
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

class PostItNote {
  constructor(id, content, position) {
    this.id = id;
    this.content = content || '';
    this.fontSize = '16px';
    this.position = position || {
      x: this.getRandomPosition(window.innerWidth - 200),
      y: this.getRandomPosition(window.innerHeight - 200)
    };
    this.size = {
      width: 200,
      height: 200
    };
  }

  getRandomPosition(max) {
    const padding = 20;
    return Math.floor(Math.random() * (max - padding * 2)) + padding;
  }
}

class PostItManager {
  constructor() {
    this.notes = [];
    this.deletedNotes = [];
    this.selectedDeletedNoteIds = new Set();
    this.currentNoteIndex = -1;
    this.topZIndex = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--z-ui'),
      10
    ) || 1000;
    this.moveStep = 5;
    this.moveRafId = null;
    this.keyboardMoveOffset = { x: 0, y: 0 };
    this.activeKeys = new Set();
    this.contentSync = new Map();
    this.contentSavers = new Map();
    this.dirtyContent = new Set();

    this.pastelColors = [
      'rgba(255, 224, 178, 0.8)',
      'rgba(255, 235, 205, 0.8)',
      'rgba(255, 245, 157, 0.8)',
      'rgba(200, 230, 201, 0.8)',
      'rgba(179, 229, 252, 0.8)',
      'rgba(207, 216, 220, 0.8)',
      'rgba(215, 204, 255, 0.8)',
      'rgba(255, 204, 213, 0.8)',
      'rgba(255, 224, 230, 0.8)',
      'rgba(255, 236, 179, 0.8)'
    ];
    this.bindEventListeners();
    this.createCreateNoteButton();
    this.createTrashButton();
    this.createTrashDialog();
    this.loadNotes();
  }

  generateNoteId() {
    return crypto.randomUUID();
  }

  createCreateNoteButton() {
    const button = document.createElement('button');
    button.className = 'create-postit';
    button.type = 'button';
    button.setAttribute('aria-label', 'Create new note');
    button.textContent = 'Add note';
    button.addEventListener('click', () => this.createNewNote());
    document.body.appendChild(button);
  }

  createTrashButton() {
    const button = document.createElement('button');
    button.className = 'postit-trash-toggle icon-btn';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open deleted notes');
    button.innerHTML = `${Icons.trash()}<span class="postit-trash-count" aria-hidden="true"></span>`;
    button.addEventListener('click', () => this.openTrashDialog());
    document.body.appendChild(button);
    this.trashButton = button;
    this.trashCount = button.querySelector('.postit-trash-count');
  }

  createTrashDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'postit-trash-dialog';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Deleted notes');
    overlay.innerHTML = `
      <div class="postit-trash-panel">
        <div class="postit-trash-header">
          <h3 class="postit-trash-title">Deleted notes</h3>
          <button class="postit-trash-close" type="button" aria-label="Close deleted notes">${Icons.times()}</button>
        </div>
        <div class="postit-trash-bulk-actions">
          <label class="postit-trash-select-all">
            <input type="checkbox" class="postit-trash-select-all-input" />
            <span>Select all</span>
          </label>
          <button class="postit-trash-action postit-trash-restore-selected" type="button">Restore selected</button>
          <button class="postit-trash-action postit-trash-delete-selected" type="button">Delete selected</button>
        </div>
        <div class="postit-trash-list"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.trashDialog = overlay;
    this.trashList = overlay.querySelector('.postit-trash-list');
    this.selectAllTrashInput = overlay.querySelector('.postit-trash-select-all-input');
    this.restoreSelectedButton = overlay.querySelector('.postit-trash-restore-selected');
    this.deleteSelectedButton = overlay.querySelector('.postit-trash-delete-selected');

    overlay.querySelector('.postit-trash-close').addEventListener('click', () => this.closeTrashDialog());
    this.selectAllTrashInput.addEventListener('change', () => {
      this.setAllDeletedNotesSelected(this.selectAllTrashInput.checked);
    });
    this.restoreSelectedButton.addEventListener('click', () => this.restoreSelectedDeletedNotes());
    this.deleteSelectedButton.addEventListener('click', () => this.deleteSelectedForever());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeTrashDialog();
    });
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeTrashDialog();
    });
  }

  updateTrashButton() {
    if (!this.trashButton) return;
    const count = this.deletedNotes.length;
    if (this.trashCount) {
      this.trashCount.textContent = count > 0 ? String(count) : '';
    }
    this.trashButton.setAttribute('aria-label', count > 0
      ? `Open deleted notes, ${count} in trash`
      : 'Open deleted notes');
    this.trashButton.disabled = count === 0;
  }

  getRandomNoteColor() {
    const randomIndex = Math.floor(Math.random() * this.pastelColors.length);
    return this.pastelColors[randomIndex];
  }

  getNoteIdFromElement(element) {
    return element.id.replace('note-', '');
  }

  getNoteFromElement(element) {
    const noteId = this.getNoteIdFromElement(element);
    return this.notes.find((n) => n.id === noteId);
  }

  getNotePreview(note) {
    const text = (note.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
    return text || 'Blank note';
  }

  formatDeletedAt(deletedAt) {
    if (!deletedAt) return 'Deleted recently';
    const date = new Date(deletedAt);
    if (Number.isNaN(date.getTime())) return 'Deleted recently';
    return `Deleted ${date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  }

  bringNoteToFront(noteElement) {
    if (!noteElement) return;
    this.topZIndex += 1;
    noteElement.style.zIndex = String(this.topZIndex);
  }

  bindEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          this.createNewNote();
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          this.selectNextNote();
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          this.deleteSelectedNote();
        }
      }

      if (this.currentNoteIndex >= 0 && ARROW_KEYS.includes(e.key)) {
        e.preventDefault();
        this.activeKeys.add(e.key);
        this.startMoving();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (ARROW_KEYS.includes(e.key)) {
        this.activeKeys.delete(e.key);
        if (this.activeKeys.size === 0) {
          this.stopMoving();
        }
      }
    });

    window.addEventListener('blur', () => {
      if (!this.moveRafId) return;
      this.activeKeys.clear();
      this.stopMoving();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.dirtyContent.size > 0) this.saveNotes();
    });

    formatters.onResize(() => {
      if (this.adjustNotesPosition()) this.saveNotes();
    });
  }

  selectNextNote() {
    if (this.notes.length === 0) return;

    const wasMoving = this.moveRafId != null;
    if (wasMoving) this.stopMoving();

    const currentNoteElement = this.getCurrentNoteElement();
    if (currentNoteElement) {
      currentNoteElement.classList.remove('selected');
    }

    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.notes.length;

    const nextNote = this.getCurrentNoteElement();
    if (nextNote) {
      this.bringNoteToFront(nextNote);
      nextNote.classList.add('selected');
      nextNote.querySelector('.post-it-content').focus();
    }

    if (wasMoving && this.activeKeys.size > 0) this.startMoving();
  }

  createNewNote() {
    const note = new PostItNote(this.generateNoteId());
    note.color = this.getRandomNoteColor();
    this.notes.push(note);
    this.renderNote(note);
    this.saveNotes();
  }

  renderNote(note) {
    const postIt = document.createElement('div');
    postIt.className = 'post-it';
    postIt.id = `note-${note.id}`;
    postIt.style.left = `${note.position.x}px`;
    postIt.style.top = `${note.position.y}px`;
    postIt.style.width = `${note.size.width}px`;
    postIt.style.height = `${note.size.height}px`;
    if (note.color) {
      postIt.style.background = note.color;
    }

    postIt.innerHTML = `
      <div class="post-it-header">
        <button class="delete-note" type="button" aria-label="Delete note">${Icons.times()}</button>
      </div>
      <div class="post-it-content" contenteditable="true">${note.content}</div>
      <div class="resize-handle" aria-hidden="true"></div>
    `;

    document.body.appendChild(postIt);

    const contentDiv = postIt.querySelector('.post-it-content');
    contentDiv.style.fontSize = note.fontSize;
    new TextFormatter(contentDiv);

    this.makeNoteDraggable(postIt);
    this.makeNoteResizable(postIt);
    this.setupNoteEvents(postIt, note);
    postIt.setAttribute('tabindex', '-1');
    this.topZIndex += 1;
    postIt.style.zIndex = String(this.topZIndex);
  }

  makeNoteDraggable(noteElement) {
    formatters.trackPointerDrag(noteElement, {
      ignore: '.delete-note, .resize-handle',
      onCommit: ({ x, y }) => {
        const note = this.getNoteFromElement(noteElement);
        if (!note) return;
        note.position = { x, y };
        this.saveNotes();
      }
    });

    noteElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  setupNoteEvents(noteElement, note) {
    const contentDiv = noteElement.querySelector('.post-it-content');
    const deleteBtn = noteElement.querySelector('.delete-note');

    noteElement.addEventListener('pointerdown', () => {
      this.bringNoteToFront(noteElement);
    });

    this.contentSync.set(note.id, () => {
      note.content = contentDiv.innerHTML;
    });
    const debouncedSave = formatters.debounce(() => this.saveNotes(), 600);
    this.contentSavers.set(note.id, debouncedSave);
    contentDiv.addEventListener('input', () => {
      this.dirtyContent.add(note.id);
      debouncedSave();
    });
    contentDiv.addEventListener('blur', () => {
      if (this.dirtyContent.has(note.id)) this.saveNotes();
    });
    contentDiv.addEventListener('fontSizeChanged', () => {
      note.fontSize = contentDiv.style.fontSize;
      this.saveNotes();
    });

    deleteBtn.addEventListener('click', () => this.moveNoteToTrash(note, noteElement));
  }

  adjustNotesPosition() {
    let changed = false;
    this.notes.forEach((note) => {
      const noteElement = document.getElementById(`note-${note.id}`);
      if (!noteElement) return;
      const next = formatters.clampToViewport(
        note.position.x,
        note.position.y,
        note.size.width,
        note.size.height
      );
      if (next.x === note.position.x && next.y === note.position.y) return;
      note.position = next;
      noteElement.style.left = `${next.x}px`;
      noteElement.style.top = `${next.y}px`;
      changed = true;
    });
    return changed;
  }

  normalizeNote(raw) {
    return {
      id: String(raw.id),
      content: raw.content || '',
      fontSize: raw.fontSize || '16px',
      position: raw.position || { x: 20, y: 20 },
      size: raw.size || { width: 200, height: 200 },
      color: raw.color || null
    };
  }

  normalizeDeletedNote(raw) {
    return {
      ...this.normalizeNote(raw),
      deletedAt: raw.deletedAt || new Date().toISOString()
    };
  }

  migrateStoredNotes(parsed) {
    if (Array.isArray(parsed)) {
      return {
        notes: parsed.map((note) => this.normalizeNote(note)),
        deletedNotes: []
      };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.notes)) {
      return {
        notes: parsed.notes.map((note) => this.normalizeNote(note)),
        deletedNotes: Array.isArray(parsed.deletedNotes)
          ? parsed.deletedNotes.map((note) => this.normalizeDeletedNote(note))
          : []
      };
    }
    return { notes: [], deletedNotes: [] };
  }

  syncDirtyContent() {
    if (this.dirtyContent.size === 0) return;
    const ids = this.dirtyContent;
    this.dirtyContent = new Set();
    ids.forEach((id) => {
      this.contentSync.get(id)?.();
      this.contentSavers.get(id)?.cancel();
    });
  }

  saveNotes() {
    this.syncDirtyContent();
    formatters.writeStorage(NOTE_STORAGE_KEY, {
      version: NOTE_STORAGE_VERSION,
      notes: this.notes,
      deletedNotes: this.deletedNotes
    });
  }

  createWelcomeNote() {
    const width = 320;
    const height = 420;
    return {
      id: this.generateNoteId(),
      fontSize: '15px',
      color: 'rgba(255, 245, 157, 0.9)',
      size: { width, height },
      position: formatters.clampToViewport(
        Math.max(24, Math.round(window.innerWidth / 2 - width - 40)),
        Math.max(88, Math.round(window.innerHeight * 0.16)),
        width,
        height
      ),
      content: [
        '<strong>Welcome to Note Tab</strong>',
        'A few tips to get started:',
        '',
        '<strong>Notes</strong>',
        '• Add note (or Alt+A) to create one',
        '• Right-click and drag to move',
        '• Drag the bottom-right corner to resize',
        '• Enter starts a new line',
        '',
        '<strong>Search &amp; shortcuts</strong>',
        '• Alt+F opens search — right-click to move it',
        '• Ctrl+S adds a website shortcut you can drag around',
        '',
        '<strong>Tools</strong>',
        '• The arrow in the bottom-left shows search, trash, and keyboard shortcuts',
        '',
        'Delete this note whenever you like.'
      ].join('<br>')
    };
  }

  loadNotes() {
    let migratedFromLegacy = false;
    const parsed = formatters.readStorage(NOTE_STORAGE_KEY, null);
    if (Array.isArray(parsed)) migratedFromLegacy = true;
    const migrated = this.migrateStoredNotes(parsed);
    this.notes = migrated.notes;
    this.deletedNotes = migrated.deletedNotes.slice(0, MAX_DELETED_NOTES);

    const isFirstRun = parsed == null;
    if (isFirstRun) {
      this.notes.push(this.createWelcomeNote());
    }

    let assigned = false;
    this.notes.forEach((note) => {
      if (!note.color) {
        note.color = this.getRandomNoteColor();
        assigned = true;
      }
      this.renderNote(note);
    });

    if (assigned || migratedFromLegacy || isFirstRun) {
      this.saveNotes();
    }
    this.updateTrashButton();
    this.renderTrashDialog();
  }

  moveNoteToTrash(note, noteElement = null) {
    if (!note) return;
    this.syncDirtyContent();
    this.contentSync.delete(note.id);
    this.contentSavers.get(note.id)?.cancel();
    this.contentSavers.delete(note.id);
    const activeNoteId = this.notes[this.currentNoteIndex]?.id;
    const deletedNote = {
      ...this.normalizeNote(note),
      deletedAt: new Date().toISOString()
    };

    if (noteElement) noteElement.remove();
    this.notes = this.notes.filter((n) => n.id !== note.id);
    this.deletedNotes = [
      deletedNote,
      ...this.deletedNotes.filter((n) => n.id !== note.id)
    ].slice(0, MAX_DELETED_NOTES);

    if (activeNoteId === note.id || this.currentNoteIndex >= this.notes.length) {
      this.currentNoteIndex = Math.min(this.currentNoteIndex, this.notes.length - 1);
      if (this.notes.length === 0) this.currentNoteIndex = -1;
    }

    this.saveNotes();
    this.updateTrashButton();
    this.renderTrashDialog();
  }

  openTrashDialog() {
    this.renderTrashDialog();
    this.trashDialog.classList.add('show');
    this.trashDialog.querySelector('.postit-trash-close').focus();
  }

  closeTrashDialog() {
    this.trashDialog.classList.remove('show');
  }

  renderTrashDialog() {
    if (!this.trashList) return;
    const deletedIds = new Set(this.deletedNotes.map((note) => note.id));
    this.selectedDeletedNoteIds = new Set(
      [...this.selectedDeletedNoteIds].filter((id) => deletedIds.has(id))
    );
    this.updateTrashBulkActions();
    this.trashList.replaceChildren();

    if (this.deletedNotes.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'postit-trash-empty';
      empty.textContent = 'No deleted notes.';
      this.trashList.appendChild(empty);
      return;
    }

    this.deletedNotes.forEach((note) => {
      const item = document.createElement('article');
      item.className = 'postit-trash-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'postit-trash-item-checkbox';
      checkbox.dataset.noteId = note.id;
      checkbox.setAttribute('aria-label', `Select ${this.getNotePreview(note)}`);
      checkbox.checked = this.selectedDeletedNoteIds.has(note.id);
      checkbox.addEventListener('change', () => {
        this.setDeletedNoteSelected(note.id, checkbox.checked);
      });

      const preview = document.createElement('div');
      preview.className = 'postit-trash-preview';
      preview.textContent = this.getNotePreview(note);

      const meta = document.createElement('div');
      meta.className = 'postit-trash-meta';
      meta.textContent = this.formatDeletedAt(note.deletedAt);

      const actions = document.createElement('div');
      actions.className = 'postit-trash-actions';

      const restoreButton = document.createElement('button');
      restoreButton.type = 'button';
      restoreButton.className = 'postit-trash-action postit-trash-restore';
      restoreButton.textContent = 'Restore';
      restoreButton.addEventListener('click', () => this.restoreNoteFromTrash(note.id));

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'postit-trash-action postit-trash-delete';
      deleteButton.textContent = 'Delete forever';
      deleteButton.addEventListener('click', () => this.deleteForever(note.id));

      actions.append(restoreButton, deleteButton);
      const body = document.createElement('div');
      body.className = 'postit-trash-item-body';
      body.append(preview, meta, actions);

      item.append(checkbox, body);
      this.trashList.appendChild(item);
    });
  }

  updateTrashBulkActions() {
    const totalCount = this.deletedNotes.length;
    const selectedCount = this.selectedDeletedNoteIds.size;
    const hasSelected = selectedCount > 0;

    if (this.selectAllTrashInput) {
      this.selectAllTrashInput.checked = totalCount > 0 && selectedCount === totalCount;
      this.selectAllTrashInput.indeterminate = selectedCount > 0 && selectedCount < totalCount;
      this.selectAllTrashInput.disabled = totalCount === 0;
    }

    if (this.restoreSelectedButton) {
      this.restoreSelectedButton.disabled = !hasSelected;
      this.restoreSelectedButton.textContent = hasSelected
        ? `Restore selected (${selectedCount})`
        : 'Restore selected';
    }

    if (this.deleteSelectedButton) {
      this.deleteSelectedButton.disabled = !hasSelected;
      this.deleteSelectedButton.textContent = hasSelected
        ? `Delete selected (${selectedCount})`
        : 'Delete selected';
    }
  }

  setDeletedNoteSelected(id, selected) {
    if (selected) this.selectedDeletedNoteIds.add(id);
    else this.selectedDeletedNoteIds.delete(id);
    this.updateTrashBulkActions();
  }

  setAllDeletedNotesSelected(selected) {
    this.selectedDeletedNoteIds = selected
      ? new Set(this.deletedNotes.map((note) => note.id))
      : new Set();
    this.trashList.querySelectorAll('.postit-trash-item-checkbox').forEach((checkbox) => {
      checkbox.checked = selected;
    });
    this.updateTrashBulkActions();
  }

  restoreNoteFromTrash(id, { persist = true } = {}) {
    const note = this.deletedNotes.find((n) => n.id === id);
    if (!note) return false;

    const restoredNote = this.normalizeNote(note);
    if (this.notes.some((n) => n.id === restoredNote.id)) {
      restoredNote.id = this.generateNoteId();
    }

    this.deletedNotes = this.deletedNotes.filter((n) => n.id !== id);
    this.selectedDeletedNoteIds.delete(id);
    this.notes.push(restoredNote);
    this.renderNote(restoredNote);

    if (persist) this.persistRestoredNotes();
    return true;
  }

  persistRestoredNotes() {
    this.adjustNotesPosition();
    this.saveNotes();
    this.updateTrashButton();
    this.renderTrashDialog();
  }

  deleteForever(id) {
    this.deletedNotes = this.deletedNotes.filter((note) => note.id !== id);
    this.selectedDeletedNoteIds.delete(id);
    this.saveNotes();
    this.updateTrashButton();
    this.renderTrashDialog();
  }

  restoreSelectedDeletedNotes() {
    [...this.selectedDeletedNoteIds].forEach((id) => {
      this.restoreNoteFromTrash(id, { persist: false });
    });
    this.selectedDeletedNoteIds.clear();
    this.persistRestoredNotes();
  }

  deleteSelectedForever() {
    this.deletedNotes = this.deletedNotes.filter((note) => !this.selectedDeletedNoteIds.has(note.id));
    this.selectedDeletedNoteIds.clear();
    this.saveNotes();
    this.updateTrashButton();
    this.renderTrashDialog();
  }

  makeNoteResizable(noteElement) {
    const resizeHandle = noteElement.querySelector('.resize-handle');

    resizeHandle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const note = this.getNoteFromElement(noteElement);
      const originalWidth = noteElement.offsetWidth;
      const originalHeight = noteElement.offsetHeight;
      const originalX = e.clientX;
      const originalY = e.clientY;
      let rafId = null;
      let nextWidth = originalWidth;
      let nextHeight = originalHeight;

      noteElement.classList.add('moving');
      formatters.capturePointer(resizeHandle, e);

      const applySize = () => {
        rafId = null;
        noteElement.style.width = `${nextWidth}px`;
        noteElement.style.height = `${nextHeight}px`;
        if (note) note.size = { width: nextWidth, height: nextHeight };
      };

      const onPointerMove = (ev) => {
        ev.preventDefault();
        nextWidth = Math.max(150, originalWidth + (ev.clientX - originalX));
        nextHeight = Math.max(150, originalHeight + (ev.clientY - originalY));
        if (rafId === null) rafId = requestAnimationFrame(applySize);
      };

      const onPointerUp = (ev) => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          applySize();
        }
        noteElement.classList.remove('moving');
        formatters.releasePointer(resizeHandle, ev);
        if (note && (nextWidth !== originalWidth || nextHeight !== originalHeight)) {
          note.size = { width: nextWidth, height: nextHeight };
          this.saveNotes();
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  deleteSelectedNote() {
    if (this.currentNoteIndex < 0 || this.notes.length === 0) return;
    if (this.moveRafId) this.stopMoving();
    this.activeKeys.clear();

    const noteElement = this.getCurrentNoteElement();
    if (!noteElement) return;

    const noteToDelete = this.notes[this.currentNoteIndex];
    this.moveNoteToTrash(noteToDelete, noteElement);

    if (this.currentNoteIndex >= this.notes.length) {
      this.currentNoteIndex = this.notes.length - 1;
    }

    if (this.notes.length > 0) {
      this.selectNextNote();
    } else {
      this.currentNoteIndex = -1;
    }
  }

  startMoving() {
    if (this.moveRafId) return;
    const noteElement = this.getCurrentNoteElement();
    if (!noteElement) return;
    noteElement.classList.add('moving');
    this.keyboardMoveOffset = { x: 0, y: 0 };
    const step = this.moveStep;
    const animate = () => {
      if (!noteElement.isConnected) {
        this.moveRafId = null;
        this.activeKeys.clear();
        return;
      }
      let dx = 0;
      let dy = 0;
      if (this.activeKeys.has('ArrowLeft')) dx -= step;
      if (this.activeKeys.has('ArrowRight')) dx += step;
      if (this.activeKeys.has('ArrowUp')) dy -= step;
      if (this.activeKeys.has('ArrowDown')) dy += step;
      if (dx !== 0 || dy !== 0) {
        this.keyboardMoveOffset.x += dx;
        this.keyboardMoveOffset.y += dy;
        noteElement.style.transform = `translate(${this.keyboardMoveOffset.x}px, ${this.keyboardMoveOffset.y}px)`;
      }
      this.moveRafId = requestAnimationFrame(animate);
    };
    this.moveRafId = requestAnimationFrame(animate);
  }

  stopMoving() {
    if (this.moveRafId) {
      cancelAnimationFrame(this.moveRafId);
      this.moveRafId = null;
    }
    const noteElement = this.getCurrentNoteElement();
    const offsetX = this.keyboardMoveOffset.x;
    const offsetY = this.keyboardMoveOffset.y;
    this.keyboardMoveOffset = { x: 0, y: 0 };
    if (!noteElement) return;

    if (offsetX !== 0 || offsetY !== 0) {
      const note = this.getNoteFromElement(noteElement);
      if (note) {
        const next = formatters.clampToViewport(
          note.position.x + offsetX,
          note.position.y + offsetY,
          note.size.width,
          note.size.height
        );
        if (next.x !== note.position.x || next.y !== note.position.y) {
          note.position = next;
          noteElement.style.left = `${next.x}px`;
          noteElement.style.top = `${next.y}px`;
          this.saveNotes();
        }
      }
    }
    noteElement.style.transform = '';
    noteElement.classList.remove('moving');
  }

  getCurrentNoteElement() {
    if (this.currentNoteIndex < 0) return null;
    const note = this.notes[this.currentNoteIndex];
    return document.getElementById(`note-${note.id}`);
  }
}
