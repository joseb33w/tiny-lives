import * as THREE from 'three';
import { createAvatar } from './avatar.js';
import { createLabel } from './labels.js';
import { MOVE_SPEED, TURN_SPEED, REFILL, EMOTES } from './config.js';

const SENS = 0.0045;
const BOUND = 12.4;
const PLAYER_R = 0.42;

function lerpAngle(a, b, k) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

function resolve(pos, colliders) {
  for (let pass = 0; pass < 2; pass++) {
    for (const c of colliders) {
      const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
      const dx = pos.x - cx, dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > PLAYER_R * PLAYER_R) continue;
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        pos.x = cx + (dx / d) * PLAYER_R;
        pos.z = cz + (dz / d) * PLAYER_R;
      } else {
        const pl = pos.x - c.minX, pr = c.maxX - pos.x;
        const pu = pos.z - c.minZ, pdn = c.maxZ - pos.z;
        const mn = Math.min(pl, pr, pu, pdn);
        if (mn === pl) pos.x = c.minX - PLAYER_R;
        else if (mn === pr) pos.x = c.maxX + PLAYER_R;
        else if (mn === pu) pos.z = c.minZ - PLAYER_R;
        else pos.z = c.maxZ + PLAYER_R;
      }
    }
  }
}

export class LocalPlayer {
  constructor(scene, camera, input, opts) {
    this.scene = scene;
    this.camera = camera;
    this.input = input;
    this.id = opts.id;
    this.name = opts.name;
    this.color = opts.color;
    this.hat = opts.hat;
    this.needs = opts.needs;
    this.interactables = opts.interactables;
    this.colliders = opts.colliders;

    this.avatar = createAvatar({ color: opts.color, hat: opts.hat });
    this.avatar.root.position.set(-4, 0, 10.5);
    this.avatar.root.rotation.y = Math.PI;
    scene.add(this.avatar.root);

    this.label = createLabel({ showName: false });
    this.avatar.root.add(this.label.object);

    this.camYaw = 0;
    this.camPitch = 0.42;
    this.camDist = 7.2;
    this.bodyYaw = Math.PI;

    this.interacting = null;
    this.standReturn = new THREE.Vector3(-4, 0, 9.4);
    this.emote = null;
    this.emoteUntil = 0;
    this.moving = false;
    this.prompt = null;

    this._tmpTarget = new THREE.Vector3();
    camera.domElement && camera.domElement.addEventListener('wheel', (e) => {
      this.camDist = Math.max(4, Math.min(11, this.camDist + Math.sign(e.deltaY) * 0.6));
    }, { passive: true });
  }

  get position() { return this.avatar.root.position; }

  playEmote(name) {
    if (!EMOTES[name]) return;
    this.emote = name;
    this.emoteUntil = performance.now() + 2400;
    this.label.popEmote(EMOTES[name].icon);
    if (this.interacting) this._stop(false);
  }

  setBubble(text) { this.label.setBubble(text); }

  toggleInteract() {
    if (this.interacting) { this._stop(true); return; }
    if (this.prompt) this._start(this.prompt);
  }

  _start(it) {
    this.interacting = it;
    this.standReturn.set(it.x, 0, it.z);
    if (it.seat) {
      this.avatar.root.position.set(it.seat.x, it.seat.y, it.seat.z);
      this.bodyYaw = it.seat.ry;
    } else {
      const px = this.avatar.root.position.x, pz = this.avatar.root.position.z;
      this.bodyYaw = Math.atan2(it.x - px, it.z - pz);
    }
    this.avatar.root.rotation.y = this.bodyYaw;
  }

  _stop(restorePos) {
    if (this.interacting && this.interacting.seat && restorePos) {
      this.avatar.root.position.set(this.standReturn.x, 0, this.standReturn.z);
    } else if (this.interacting && this.interacting.seat) {
      this.avatar.root.position.y = 0;
    }
    this.interacting = null;
  }

  update(dt, time, remote) {
    const move = this.input.getMove();
    const mag = Math.hypot(move.x, move.y);

    if (this.interacting && mag > 0.2) this._stop(true);

    if (!this.interacting) {
      const f = new THREE.Vector3(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      const r = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      const dir = new THREE.Vector3()
        .addScaledVector(f, move.y)
        .addScaledVector(r, move.x);
      this.moving = mag > 0.05;
      if (this.moving) {
        dir.normalize();
        const p = this.avatar.root.position;
        p.x += dir.x * MOVE_SPEED * mag * dt;
        p.z += dir.z * MOVE_SPEED * mag * dt;
        p.x = Math.max(-BOUND, Math.min(BOUND, p.x));
        p.z = Math.max(-BOUND, Math.min(BOUND, p.z));
        resolve(p, this.colliders);
        this.bodyYaw = Math.atan2(dir.x, dir.z);
      }
    } else {
      this.moving = false;
    }

    this.avatar.root.rotation.y = lerpAngle(this.avatar.root.rotation.y, this.bodyYaw, Math.min(1, TURN_SPEED * dt));

    // proximity prompt
    let best = null, bestD = Infinity;
    const p = this.avatar.root.position;
    for (const it of this.interactables) {
      const dx = it.x - p.x, dz = it.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < it.radius && d < bestD) { best = it; bestD = d; }
    }
    this.prompt = this.interacting || best;

    // fill needs
    if (this.interacting) {
      const need = this.interacting.need;
      this.needs.refill(need, REFILL[need] * dt);
      if (this.needs.values[need] >= 1) this._stop(true);
    }
    const neighbors = remote.socialNeighbors(p, 4.2);
    if (neighbors > 0) this.needs.refill('social', REFILL.social * dt * Math.min(neighbors, 3));

    // pose + label
    const now = performance.now();
    const emoteActive = now < this.emoteUntil;
    let pose = null, icon = null;
    if (emoteActive) pose = this.emote;
    else if (this.interacting) { pose = this.interacting.pose; icon = this.interacting.icon; }
    this.avatar.update(dt, pose, this.moving && !pose, time);
    this.label.setStatus(emoteActive ? null : icon);

    this._updateCamera();

    this._pose = this.interacting ? this.interacting.pose : null;
    this._icon = this.interacting ? this.interacting.icon : null;
  }

  _updateCamera() {
    const look = this.input.takeLook();
    this.camYaw += look.dx * SENS;
    this.camPitch = Math.max(0.08, Math.min(1.15, this.camPitch + look.dy * SENS));
    const cosP = Math.cos(this.camPitch), sinP = Math.sin(this.camPitch);
    const t = this._tmpTarget.copy(this.avatar.root.position);
    t.y += 1.45;
    const ox = Math.sin(this.camYaw) * cosP * this.camDist;
    const oy = sinP * this.camDist;
    const oz = Math.cos(this.camYaw) * cosP * this.camDist;
    this.camera.position.set(t.x + ox, Math.max(0.6, t.y + oy), t.z + oz);
    this.camera.lookAt(t);
  }

  netState() {
    const p = this.avatar.root.position;
    return {
      id: this.id, name: this.name, color: this.color, hat: this.hat,
      x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2),
      ry: +this.avatar.root.rotation.y.toFixed(2),
      pose: this._pose || null, icon: this._icon || null,
      t: Date.now(),
    };
  }
}
