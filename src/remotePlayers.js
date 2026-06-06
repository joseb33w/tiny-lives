import * as THREE from 'three';
import { createAvatar } from './avatar.js';
import { createLabel } from './labels.js';
import { EMOTES } from './config.js';

function lerpAngle(a, b, k) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

export class RemotePlayers {
  constructor(scene) {
    this.scene = scene;
    this.players = new Map();
    this._tmp = new THREE.Vector3();
  }

  applyState(s) {
    let p = this.players.get(s.id);
    if (!p) {
      const avatar = createAvatar({ color: s.color, hat: s.hat });
      avatar.root.position.set(s.x, s.y || 0, s.z);
      avatar.root.rotation.y = s.ry || 0;
      const label = createLabel({ name: s.name || 'Friend', showName: true });
      avatar.root.add(label.object);
      this.scene.add(avatar.root);
      p = {
        avatar, label,
        cur: { x: s.x, y: s.y || 0, z: s.z, ry: s.ry || 0 },
        tgt: { x: s.x, y: s.y || 0, z: s.z, ry: s.ry || 0 },
        pose: s.pose || null, icon: s.icon || null,
        moving: false, emote: null, emoteUntil: 0,
      };
      this.players.set(s.id, p);
    }
    p.tgt.x = s.x; p.tgt.y = s.y || 0; p.tgt.z = s.z; p.tgt.ry = s.ry ?? p.tgt.ry;
    p.pose = s.pose || null;
    p.icon = s.icon || null;
  }

  applyEmote({ id, emote }) {
    const p = this.players.get(id);
    if (!p || !EMOTES[emote]) return;
    p.emote = emote;
    p.emoteUntil = performance.now() + 2400;
    p.label.popEmote(EMOTES[emote].icon);
  }

  applyChat({ id, text }) {
    const p = this.players.get(id);
    if (!p) return;
    p.label.setBubble(text);
  }

  remove(id) {
    const p = this.players.get(id);
    if (!p) return;
    p.label.dispose();
    this.scene.remove(p.avatar.root);
    p.avatar.dispose();
    this.players.delete(id);
  }

  socialNeighbors(pos, range) {
    let n = 0;
    for (const p of this.players.values()) {
      const dx = p.cur.x - pos.x, dz = p.cur.z - pos.z;
      if (dx * dx + dz * dz < range * range) n++;
    }
    return n;
  }

  count() { return this.players.size; }

  update(dt, time) {
    const k = Math.min(1, dt * 10);
    const now = performance.now();
    for (const p of this.players.values()) {
      const px = p.cur.x, pz = p.cur.z;
      p.cur.x += (p.tgt.x - p.cur.x) * k;
      p.cur.y += (p.tgt.y - p.cur.y) * k;
      p.cur.z += (p.tgt.z - p.cur.z) * k;
      p.cur.ry = lerpAngle(p.cur.ry, p.tgt.ry, k);
      const moved = Math.hypot(p.cur.x - px, p.cur.z - pz);
      p.moving = moved > 0.004;

      p.avatar.root.position.set(p.cur.x, p.cur.y, p.cur.z);
      p.avatar.root.rotation.y = p.cur.ry;

      const emoteActive = now < p.emoteUntil;
      const pose = emoteActive ? p.emote : (p.pose || null);
      p.avatar.update(dt, pose, p.moving && !p.pose && !emoteActive, time);
      p.label.setStatus(emoteActive ? null : p.icon);
    }
  }
}
