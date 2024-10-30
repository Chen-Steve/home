class PostItNote {
  constructor(id, content, position) {
    this.id = id;
    this.content = content || '';
    this.position = position || {
      x: this.getRandomPosition(window.innerWidth - 200),
      y: this.getRandomPosition(window.innerHeight - 200)
    };
  }

  getRandomPosition(max) {
    return Math.floor(Math.random() * (max * 0.8));
  }
}

class PostItManager {
  constructor() {
    this.notes = [];
    this.loadNotes();
    this.bindEventListeners();
  }

  bindEventListeners() {
    const createBtn = document.getElementById('createPostIt');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.createNewNote());
    }
    window.addEventListener('resize', () => this.adjustNotesPosition());
  }

  createNewNote() {
    const note = new PostItNote(Date.now());
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

    postIt.innerHTML = `
      <div class="post-it-header">
        <div class="drag-handle">
          <i class="fas fa-grip-lines"></i>
        </div>
        <button class="delete-note">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <textarea class="post-it-content" placeholder="Write your note...">${note.content}</textarea>
    `;

    document.body.appendChild(postIt);
    this.makeNoteDraggable(postIt);
    this.setupNoteEvents(postIt, note);
  }

  makeNoteDraggable(noteElement) {
    const handle = noteElement.querySelector('.drag-handle');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    handle.addEventListener('mousedown', (e) => {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === handle || e.target.parentElement === handle) {
        isDragging = true;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;

        noteElement.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        // Update note position in storage
        const noteId = parseInt(noteElement.id.replace('note-', ''));
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
          const rect = noteElement.getBoundingClientRect();
          note.position = {
            x: rect.left,
            y: rect.top
          };
          this.saveNotes();
        }
      }
    });
  }

  setupNoteEvents(noteElement, note) {
    const textarea = noteElement.querySelector('.post-it-content');
    const deleteBtn = noteElement.querySelector('.delete-note');

    // Auto-save on content change
    textarea.addEventListener('input', () => {
      note.content = textarea.value;
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
    this.notes.forEach(note => this.renderNote(note));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.postItManager = new PostItManager();
}); 