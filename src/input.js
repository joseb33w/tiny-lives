export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this._action = false;
    this.look = { dx: 0, dy: 0 };
    this.joy = { active: false, id: -1, cx: 0, cy: 0, x: 0, y: 0 };
    this.lookId = -1;
    this.lastX = 0;
    this.lastY = 0;
    this.R = 56;
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this._buildJoystick();
    this._bind();
  }

  _buildJoystick() {
    const j = document.createElement('div');
    j.className = 'joystick';
    j.innerHTML = '<div class="joy-base"></div><div class="joy-thumb"></div>';
    j.style.display = 'none';
    document.body.appendChild(j);
    this.joyEl = j;
    this.joyBase = j.querySelector('.joy-base');
    this.joyThumb = j.querySelector('.joy-thumb');
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'e' || k === ' ') { this._action = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    this.canvas.addEventListener('pointerdown', (e) => this._down(e));
    window.addEventListener('pointermove', (e) => this._move(e), { passive: false });
    window.addEventListener('pointerup', (e) => this._up(e));
    window.addEventListener('pointercancel', (e) => this._up(e));
  }

  _down(e) {
    const touch = e.pointerType !== 'mouse';
    if (touch && e.clientX < window.innerWidth * 0.5 && !this.joy.active) {
      this.joy.active = true;
      this.joy.id = e.pointerId;
      this.joy.cx = e.clientX;
      this.joy.cy = e.clientY;
      this.joy.x = 0; this.joy.y = 0;
      this.joyEl.style.left = e.clientX + 'px';
      this.joyEl.style.top = e.clientY + 'px';
      this.joyEl.style.display = 'block';
      this.joyThumb.style.transform = 'translate(-50%, -50%)';
    } else if (this.lookId === -1) {
      if (!touch && e.button !== 0) return;
      this.lookId = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    }
  }

  _move(e) {
    if (e.pointerId === this.joy.id) {
      let dx = e.clientX - this.joy.cx;
      let dy = e.clientY - this.joy.cy;
      const len = Math.hypot(dx, dy);
      if (len > this.R) { dx = (dx / len) * this.R; dy = (dy / len) * this.R; }
      this.joy.x = dx / this.R;
      this.joy.y = dy / this.R;
      this.joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    } else if (e.pointerId === this.lookId) {
      this.look.dx += e.clientX - this.lastX;
      this.look.dy += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    }
  }

  _up(e) {
    if (e.pointerId === this.joy.id) {
      this.joy.active = false;
      this.joy.id = -1;
      this.joy.x = 0; this.joy.y = 0;
      this.joyEl.style.display = 'none';
    } else if (e.pointerId === this.lookId) {
      this.lookId = -1;
    }
  }

  getMove() {
    let x = 0, y = 0;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y -= 1;
    if (this.joy.active) { x += this.joy.x; y += -this.joy.y; }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  takeLook() {
    const r = { dx: this.look.dx, dy: this.look.dy };
    this.look.dx = 0; this.look.dy = 0;
    return r;
  }

  consumeAction() {
    if (this._action) { this._action = false; return true; }
    return false;
  }

  triggerAction() { this._action = true; }
}
