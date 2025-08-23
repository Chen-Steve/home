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
      const padding = 20; // Keep notes away from edges
      return Math.floor(Math.random() * (max - padding * 2)) + padding;
    }
  }
  
  class PostItManager {
    constructor() {
      this.notes = [];
      this.currentNoteIndex = -1;
      this.moveStep = 5; // Reduced step size for smoother movement
      this.moveInterval = null; // deprecated in favor of rAF
      this.moveRafId = null;
      this.keyboardMoveOffset = { x: 0, y: 0 };
      this.activeKeys = new Set();
      
      this.pastelColors = [
        'rgba(255, 224, 178, 0.8)', // peach
        'rgba(255, 235, 205, 0.8)', // almond
        'rgba(255, 245, 157, 0.8)', // soft yellow
        'rgba(200, 230, 201, 0.8)', // mint
        'rgba(179, 229, 252, 0.8)', // pale blue
        'rgba(207, 216, 220, 0.8)', // light blue-grey
        'rgba(215, 204, 255, 0.8)', // lavender
        'rgba(255, 204, 213, 0.8)', // rose
        'rgba(255, 224, 230, 0.8)', // pink
        'rgba(255, 236, 179, 0.8)'  // soft amber
      ];
      this.nextColorIndex = 0;
      this.bindEventListeners();
      this.createCreateNoteButton();
      this.loadNotes();
    }

    debounce(func, wait) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), wait);
      };
    }

    createCreateNoteButton() {
      // Floating "+" button to create notes without keyboard shortcuts
      const existing = document.querySelector('.create-postit');
      if (existing) return;
      const button = document.createElement('button');
      button.className = 'create-postit';
      // Use a text fallback so it works even if Font Awesome is blocked by CSP
      button.setAttribute('aria-label', 'Create new note');
      button.textContent = '+';
      button.addEventListener('click', () => {
        this.createNewNote();
      });
      document.body.appendChild(button);
    }

    getNextNoteColor() {
      const color = this.pastelColors[this.nextColorIndex % this.pastelColors.length];
      this.nextColorIndex += 1;
      return color;
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
  
        // Handle arrow key movement
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

      this.onResize = this.debounce(() => this.adjustNotesPosition(), 200);
      window.addEventListener('resize', this.onResize);
    }
  
    selectNextNote() {
      if (this.notes.length === 0) return;
      
      // Remove focus from current note if any
      if (this.currentNoteIndex >= 0) {
        const currentNote = document.getElementById(`note-${this.notes[this.currentNoteIndex].id}`);
        if (currentNote) {
          currentNote.classList.remove('selected');
        }
      }
  
      // Move to next note or back to start
      this.currentNoteIndex = (this.currentNoteIndex + 1) % this.notes.length;
      
      // Focus on new note
      const nextNote = document.getElementById(`note-${this.notes[this.currentNoteIndex].id}`);
      if (nextNote) {
        nextNote.classList.add('selected');
        const contentDiv = nextNote.querySelector('.post-it-content');
        contentDiv.focus();
      }
    }
  
    createNewNote() {
      const note = new PostItNote(Date.now());
      note.color = this.getNextNoteColor();
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
          <div class="drag-handle">
            <i class="fas fa-grip-lines"></i>
          </div>
          <button class="delete-note">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="post-it-content" contenteditable="true" placeholder="Write your note...">${note.content}</div>
        <div class="resize-handle"></div>
      `;
  
      document.body.appendChild(postIt);
      
      // Initialize text formatter
      const contentDiv = postIt.querySelector('.post-it-content');
      contentDiv.style.fontSize = note.fontSize;
      const formatter = new TextFormatter(contentDiv);
  
      this.makeNoteDraggable(postIt);
      this.makeNoteResizable(postIt);
      this.setupNoteEvents(postIt, note);
  
      // Add tabindex to make note focusable
      postIt.setAttribute('tabindex', '-1');
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

        // Clamp movement so the note cannot be dragged outside the viewport.
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
        // Commit the transform delta to absolute left/top
        const noteId = parseInt(noteElement.id.replace('note-', ''));
        const note = this.notes.find(n => n.id === noteId);
        let newX = startLeft + deltaX;
        let newY = startTop + deltaY;

        // While 'moving' class is still applied (no transition), commit position
        noteElement.style.left = `${newX}px`;
        noteElement.style.top = `${newY}px`;
        noteElement.style.transform = '';
        // Remove 'moving' on the next frame to avoid any flicker
        requestAnimationFrame(() => {
          noteElement.classList.remove('moving');
        });

        if (note) {
          note.position = { x: newX, y: newY };
          this.saveNotes();
        }

        window.removeEventListener('pointermove', onPointerMove);
        // release capture if supported
        try {
          if (e.pointerId != null && noteElement.releasePointerCapture) {
            noteElement.releasePointerCapture(e.pointerId);
          }
        } catch (_) {}
      };

      handle.addEventListener('pointerdown', (e) => {
        if (!(e.target === handle || e.target.parentElement === handle)) return;
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
        // capture to keep receiving moves even if pointer leaves window
        try {
          if (e.pointerId != null && noteElement.setPointerCapture) {
            noteElement.setPointerCapture(e.pointerId);
          }
        } catch (_) {}
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp, { once: true });
        window.addEventListener('pointercancel', onPointerUp, { once: true });
      });
    }
  
    setupNoteEvents(noteElement, note) {
      const contentDiv = noteElement.querySelector('.post-it-content');
      const deleteBtn = noteElement.querySelector('.delete-note');
  
      // Handle shift+enter for new lines
      contentDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); // Prevent default enter behavior
        }
      });
  
      // Auto-save on content change (debounced to reduce frequent writes)
      const debouncedSave = this.debounce(() => this.saveNotes(), 600);
      contentDiv.addEventListener('input', () => {
        note.content = contentDiv.innerHTML;
        debouncedSave();
      });
      // Ensure a save when editing ends
      contentDiv.addEventListener('blur', () => {
        this.saveNotes();
      });
  
      // Save font size changes
      contentDiv.addEventListener('fontSizeChanged', () => {
        note.fontSize = contentDiv.style.fontSize;
        this.saveNotes();
      });
  
      // Delete note
      deleteBtn.addEventListener('click', () => {
        noteElement.remove();
        this.notes = this.notes.filter(n => n.id !== note.id);
        this.saveNotes();
      });
    }
  
    adjustNotesPosition() {
      this.notes.forEach(note => {
        const noteElement = document.getElementById(`note-${note.id}`);
        if (noteElement) {
          // Ensure notes stay within viewport
          note.position.x = Math.min(note.position.x, window.innerWidth - 200);
          note.position.y = Math.min(note.position.y, window.innerHeight - 200);
          noteElement.style.left = `${note.position.x}px`;
          noteElement.style.top = `${note.position.y}px`;
        }
      });
      this.saveNotes();
    }
  
    saveNotes() {
      localStorage.setItem('postItNotes', JSON.stringify(this.notes));
    }
  
    loadNotes() {
      const savedNotes = localStorage.getItem('postItNotes');
      this.notes = savedNotes ? JSON.parse(savedNotes) : [];
      // Ensure each note has a pastel background color
      let assigned = false;
      this.notes.forEach((note, idx) => {
        if (!note.color) {
          note.color = this.pastelColors[idx % this.pastelColors.length];
          assigned = true;
        }
        this.renderNote(note);
      });
      if (assigned) {
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
  
      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        originalWidth = noteElement.offsetWidth;
        originalHeight = noteElement.offsetHeight;
        originalX = e.clientX;
        originalY = e.clientY;
        
        e.preventDefault();
        e.stopPropagation();
      });
  
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
  
        const width = originalWidth + (e.clientX - originalX);
        const height = originalHeight + (e.clientY - originalY);
  
        // Minimum size constraints
        const newWidth = Math.max(150, width);
        const newHeight = Math.max(150, height);
  
        noteElement.style.width = `${newWidth}px`;
        noteElement.style.height = `${newHeight}px`;
  
        // Update note size in storage
        const noteId = parseInt(noteElement.id.replace('note-', ''));
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
          note.size = {
            width: newWidth,
            height: newHeight
          };
          this.saveNotes();
        }
      });
  
      document.addEventListener('mouseup', () => {
        isResizing = false;
      });
    }
  
    deleteSelectedNote() {
      if (this.currentNoteIndex < 0 || this.notes.length === 0) return;
  
      const noteToDelete = this.notes[this.currentNoteIndex];
      const noteElement = document.getElementById(`note-${noteToDelete.id}`);
      
      if (noteElement) {
        noteElement.remove();
        this.notes = this.notes.filter(n => n.id !== noteToDelete.id);
        this.saveNotes();
        
        // Reset selection index if we deleted the last note
        if (this.currentNoteIndex >= this.notes.length) {
          this.currentNoteIndex = this.notes.length - 1;
        }
        
        // If there are remaining notes, select the next one
        if (this.notes.length > 0) {
          this.selectNextNote();
        } else {
          this.currentNoteIndex = -1;
        }
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
          this.activeKeys.forEach(key => this.moveSelectedNote(key));
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
      
      // Commit the transform delta to absolute left/top and clear transform
      const noteId = parseInt(noteElement.id.replace('note-', ''));
      const note = this.notes.find(n => n.id === noteId);
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
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.postItManager = new PostItManager();
  }); 