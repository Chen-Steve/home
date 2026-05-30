// Inline SVG icons (no external CDN)
const Icons = {
  gripLines(size = 16) {
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M32 288C14.3 288 0 273.7 0 256s14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32zM0 128C0 110.3 14.3 96 32 96h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 160 0 145.7 0 128zM32 416c-17.7 0-32-14.3-32-32s14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32z"/></svg>`;
  },

  times(size = 14) {
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
  },

  keyboard(size = 18) {
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 576 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zM176 192h32v32H176V192zm64 0h32v32H240V192zM112 256h32v32H112V256zm64 0h32v32H176V256zm64 0h32v32H240V256zm64 0h32v32H304V256zm64 0h32v32H368V256zm64 0h32v32H432V256zM112 320h32v32H112V320zm64 0h32v32H176V320zm64 0h32v32H240V320zm64 0h32v32H304V320zm64 0h32v32H368V320zm64 0h32v32H432V320zM112 384h352v32H112V384z"/></svg>`;
  }
};

window.Icons = Icons;
