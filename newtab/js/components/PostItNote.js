const NOTE_STORAGE_KEY = 'postItNotes';
const NOTE_STORAGE_VERSION = 1;

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
    this.currentNoteIndex = -1;
    this.topZIndex = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--z-ui'),
      10
    ) || 1000;
    this.moveStep = 5;
    this.moveRafId = null;
    this.keyboardMoveOffset = { x: 0, y: 0 };
    this.activeKeys = new Set();

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
    this.loadNotes();
  }

  generateNoteId() {
    return crypto.randomUUID();
  }

  createCreateNoteButton() {
    const existing = document.querySelector('.create-postit');
    if (existing) return;
    const button = document.createElement('button');
    button.className = 'create-postit';
    button.setAttribute('aria-label', 'Create new note');
    button.textContent = 'Add note';
    button.addEventListener('click', () => {
      this.createNewNote();
    });
    document.body.appendChild(button);
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

      if (this.currentNoteIndex >= 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        this.activeKeys.add(e.key);
        this.startMoving();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.activeKeys.delete(e.key);
        if (this.activeKeys.size === 0) {
          this.stopMoving();
        }
      }
    });

    this.onResize = window.formatters.debounce(() => this.adjustNotesPosition(), 200);
    window.addEventListener('resize', this.onResize);
  }

  selectNextNote() {
    if (this.notes.length === 0) return;

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
        <div class="drag-handle">${Icons.gripLines()}</div>
        <button class="delete-note" type="button" aria-label="Delete note">${Icons.times()}</button>
      </div>
      <div class="post-it-content" contenteditable="true" placeholder="Write your note...">${note.content}</div>
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
    const handle = noteElement.querySelector('.drag-handle');
    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let startLeft = 0;
    let startTop = 0;
    let deltaX = 0;
    let deltaY = 0;
    let rafId = null;
    let elementWidth = 0;
    let elementHeight = 0;

    const applyTransform = () => {
      rafId = null;
      noteElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const rawDx = e.clientX - startPointerX;
      const rawDy = e.clientY - startPointerY;
      const minX = -startLeft;
      const maxX = (window.innerWidth - elementWidth) - startLeft;
      const minY = -startTop;
      const maxY = (window.innerHeight - elementHeight) - startTop;
      deltaX = Math.max(minX, Math.min(maxX, rawDx));
      deltaY = Math.max(minY, Math.min(maxY, rawDy));
      if (rafId === null) {
        rafId = requestAnimationFrame(applyTransform);
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      const note = this.getNoteFromElement(noteElement);
      const newX = startLeft + deltaX;
      const newY = startTop + deltaY;

      noteElement.style.left = `${newX}px`;
      noteElement.style.top = `${newY}px`;
      noteElement.style.transform = '';
      requestAnimationFrame(() => {
        noteElement.classList.remove('moving');
      });

      if (note) {
        note.position = { x: newX, y: newY };
        this.saveNotes();
      }

      window.removeEventListener('pointermove', onPointerMove);
      try {
        if (e.pointerId != null) noteElement.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    handle.addEventListener('pointerdown', (e) => {
      isDragging = true;
      const rect = noteElement.getBoundingClientRect();
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      elementWidth = rect.width;
      elementHeight = rect.height;
      deltaX = 0;
      deltaY = 0;
      noteElement.classList.add('moving');
      e.preventDefault();
      try {
        if (e.pointerId != null) noteElement.setPointerCapture(e.pointerId);
      } catch (_) {}
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
    });
  }

  setupNoteEvents(noteElement, note) {
    const contentDiv = noteElement.querySelector('.post-it-content');
    const deleteBtn = noteElement.querySelector('.delete-note');

    noteElement.addEventListener('pointerdown', () => {
      this.bringNoteToFront(noteElement);
    });

    contentDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
      }
    });

    const debouncedSave = window.formatters.debounce(() => this.saveNotes(), 600);
    contentDiv.addEventListener('input', () => {
      note.content = contentDiv.innerHTML;
      debouncedSave();
    });
    contentDiv.addEventListener('blur', () => {
      this.saveNotes();
    });
    contentDiv.addEventListener('fontSizeChanged', () => {
      note.fontSize = contentDiv.style.fontSize;
      this.saveNotes();
    });

    deleteBtn.addEventListener('click', () => {
      noteElement.remove();
      this.notes = this.notes.filter((n) => n.id !== note.id);
      if (this.notes[this.currentNoteIndex]?.id === note.id) {
        this.currentNoteIndex = Math.min(this.currentNoteIndex, this.notes.length - 1);
        if (this.notes.length === 0) this.currentNoteIndex = -1;
      }
      this.saveNotes();
    });
  }

  adjustNotesPosition() {
    this.notes.forEach((note) => {
      const noteElement = document.getElementById(`note-${note.id}`);
      if (noteElement) {
        const maxX = window.innerWidth - note.size.width;
        const maxY = window.innerHeight - note.size.height;
        note.position.x = Math.max(0, Math.min(note.position.x, maxX));
        note.position.y = Math.max(0, Math.min(note.position.y, maxY));
        noteElement.style.left = `${note.position.x}px`;
        noteElement.style.top = `${note.position.y}px`;
      }
    });
    this.saveNotes();
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

  migrateStoredNotes(parsed) {
    if (Array.isArray(parsed)) {
      return parsed.map((note) => this.normalizeNote(note));
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.notes)) {
      return parsed.notes.map((note) => this.normalizeNote(note));
    }
    return [];
  }

  saveNotes() {
    try {
      localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify({
        version: NOTE_STORAGE_VERSION,
        notes: this.notes
      }));
    } catch (e) {
      console.warn('Failed to save notes to localStorage:', e.message);
    }
  }

  loadNotes() {
    let migratedFromLegacy = false;
    try {
      const savedNotes = localStorage.getItem(NOTE_STORAGE_KEY);
      const parsed = savedNotes ? JSON.parse(savedNotes) : null;
      if (Array.isArray(parsed)) migratedFromLegacy = true;
      this.notes = this.migrateStoredNotes(parsed);
    } catch (e) {
      console.warn('Failed to load notes from localStorage:', e.message);
      this.notes = [];
    }

    let assigned = false;
    this.notes.forEach((note) => {
      if (!note.color) {
        note.color = this.getRandomNoteColor();
        assigned = true;
      }
      this.renderNote(note);
    });

    if (assigned || migratedFromLegacy) {
      this.saveNotes();
    }
  }

  makeNoteResizable(noteElement) {
    const resizeHandle = noteElement.querySelector('.resize-handle');
    let isResizing = false;
    let originalWidth;
    let originalHeight;
    let originalX;
    let originalY;
    let debouncedResizeSave = window.formatters.debounce(() => this.saveNotes(), 300);

    const onPointerMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();

      const newWidth = Math.max(150, originalWidth + (e.clientX - originalX));
      const newHeight = Math.max(150, originalHeight + (e.clientY - originalY));

      noteElement.style.width = `${newWidth}px`;
      noteElement.style.height = `${newHeight}px`;

      const note = this.getNoteFromElement(noteElement);
      if (note) {
        note.size = { width: newWidth, height: newHeight };
        debouncedResizeSave();
      }
    };

    const onPointerUp = (e) => {
      if (!isResizing) return;
      isResizing = false;
      noteElement.classList.remove('moving');

      const note = this.getNoteFromElement(noteElement);
      if (note) this.saveNotes();

      window.removeEventListener('pointermove', onPointerMove);
      try {
        if (e.pointerId != null) resizeHandle.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    resizeHandle.addEventListener('pointerdown', (e) => {
      isResizing = true;
      originalWidth = noteElement.offsetWidth;
      originalHeight = noteElement.offsetHeight;
      originalX = e.clientX;
      originalY = e.clientY;
      noteElement.classList.add('moving');
      e.preventDefault();
      e.stopPropagation();
      try {
        if (e.pointerId != null) resizeHandle.setPointerCapture(e.pointerId);
      } catch (_) {}
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
    });
  }

  deleteSelectedNote() {
    if (this.currentNoteIndex < 0 || this.notes.length === 0) return;

    const noteElement = this.getCurrentNoteElement();
    if (!noteElement) return;

    const noteToDelete = this.notes[this.currentNoteIndex];
    noteElement.remove();
    this.notes = this.notes.filter((n) => n.id !== noteToDelete.id);
    this.saveNotes();

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
    if (noteElement) noteElement.classList.add('moving');
    this.keyboardMoveOffset = { x: 0, y: 0 };
    const animate = () => {
      const el = this.getCurrentNoteElement();
      if (el && this.activeKeys.size > 0) {
        this.activeKeys.forEach((key) => this.moveSelectedNote(key));
        el.style.transform = `translate(${this.keyboardMoveOffset.x}px, ${this.keyboardMoveOffset.y}px)`;
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
    if (!noteElement) return;

    const note = this.getNoteFromElement(noteElement);
    if (note) {
      const newX = Math.max(0, Math.min(window.innerWidth - note.size.width, note.position.x + this.keyboardMoveOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - note.size.height, note.position.y + this.keyboardMoveOffset.y));
      note.position.x = newX;
      note.position.y = newY;
      noteElement.style.left = `${newX}px`;
      noteElement.style.top = `${newY}px`;
    }
    this.keyboardMoveOffset = { x: 0, y: 0 };
    noteElement.style.transform = '';
    noteElement.classList.remove('moving');
    this.saveNotes();
  }

  getCurrentNoteElement() {
    if (this.currentNoteIndex < 0) return null;
    const note = this.notes[this.currentNoteIndex];
    return document.getElementById(`note-${note.id}`);
  }

  moveSelectedNote(direction) {
    if (this.currentNoteIndex < 0) return;
    switch (direction) {
      case 'ArrowUp':
        this.keyboardMoveOffset.y -= this.moveStep;
        break;
      case 'ArrowDown':
        this.keyboardMoveOffset.y += this.moveStep;
        break;
      case 'ArrowLeft':
        this.keyboardMoveOffset.x -= this.moveStep;
        break;
      case 'ArrowRight':
        this.keyboardMoveOffset.x += this.moveStep;
        break;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.postItManager = new PostItManager();
}, { once: true });
