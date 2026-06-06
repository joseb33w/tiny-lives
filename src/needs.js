import { NEEDS, NEED_META, DRAIN } from './config.js';

export class Needs {
  constructor(container) {
    this.values = { hunger: 0.78, energy: 0.82, fun: 0.7, social: 0.66 };
    this.bars = {};
    const wrap = document.createElement('div');
    wrap.className = 'needs';

    this.face = document.createElement('div');
    this.face.className = 'mood-face';
    wrap.appendChild(this.face);

    const list = document.createElement('div');
    list.className = 'needs-list';
    for (const n of NEEDS) {
      const row = document.createElement('div');
      row.className = 'need-row';
      const ico = document.createElement('span');
      ico.className = 'need-ico';
      ico.textContent = NEED_META[n].icon;
      const track = document.createElement('div');
      track.className = 'need-track';
      const fill = document.createElement('div');
      fill.className = 'need-fill';
      fill.style.background = NEED_META[n].color;
      track.appendChild(fill);
      row.appendChild(ico);
      row.appendChild(track);
      list.appendChild(row);
      this.bars[n] = fill;
    }
    wrap.appendChild(list);
    container.appendChild(wrap);
    this.render();
  }

  drain(dt) {
    for (const n of NEEDS) {
      this.values[n] = Math.max(0, this.values[n] - DRAIN[n] * dt);
    }
  }

  refill(need, amount) {
    this.values[need] = Math.min(1, this.values[need] + amount);
  }

  avg() {
    return NEEDS.reduce((s, n) => s + this.values[n], 0) / NEEDS.length;
  }

  moodFace() {
    const a = this.avg();
    if (a > 0.75) return '😄';
    if (a > 0.55) return '🙂';
    if (a > 0.35) return '😐';
    if (a > 0.18) return '😟';
    return '😫';
  }

  render() {
    for (const n of NEEDS) {
      const v = this.values[n];
      this.bars[n].style.width = (v * 100).toFixed(1) + '%';
      this.bars[n].style.opacity = v < 0.25 ? '0.6' : '1';
    }
    this.face.textContent = this.moodFace();
  }
}
