import * as THREE from 'three';
import { createAvatar } from './avatar.js';
import { BODY_COLORS, HATS } from './config.js';

export function initStartScreen({ roomCode, onGesture }) {
  const root = document.getElementById('start');
  const nameInput = document.getElementById('name-input');
  const swatches = document.getElementById('swatches');
  const hatsEl = document.getElementById('hats');
  const joinBtn = document.getElementById('join-btn');
  const roomLine = document.getElementById('room-line');
  roomLine.innerHTML = `Room <b>${roomCode}</b> · share the link to bring a friend`;

  const state = { color: BODY_COLORS[4], hat: 'none' };

  BODY_COLORS.forEach((c, i) => {
    const s = document.createElement('button');
    s.className = 'swatch' + (i === 4 ? ' sel' : '');
    s.style.background = c;
    s.addEventListener('click', () => {
      state.color = c;
      swatches.querySelectorAll('.swatch').forEach((e) => e.classList.remove('sel'));
      s.classList.add('sel');
      rebuild();
    });
    swatches.appendChild(s);
  });

  HATS.forEach((h, i) => {
    const b = document.createElement('button');
    b.className = 'hat-opt' + (i === 0 ? ' sel' : '');
    b.textContent = h;
    b.addEventListener('click', () => {
      state.hat = h;
      hatsEl.querySelectorAll('.hat-opt').forEach((e) => e.classList.remove('sel'));
      b.classList.add('sel');
      rebuild();
    });
    hatsEl.appendChild(b);
  });

  // live preview
  const mount = document.getElementById('preview');
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  cam.position.set(0, 1.4, 4.2);
  cam.lookAt(0, 1.0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b8d0, 1.0));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.2);
  key.position.set(2, 4, 3);
  scene.add(key);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  let avatar = null;
  function rebuild() {
    if (avatar) { scene.remove(avatar.root); avatar.dispose(); }
    avatar = createAvatar({ color: state.color, hat: state.hat });
    scene.add(avatar.root);
  }
  rebuild();

  function size() {
    const w = mount.clientWidth || 360, h = mount.clientHeight || 190;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  size();
  window.addEventListener('resize', size);

  const clock = new THREE.Clock();
  let running = true;
  renderer.setAnimationLoop(() => {
    if (!running) return;
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    if (avatar) { avatar.root.rotation.y = Math.sin(t * 0.5) * 0.6; avatar.update(dt, null, false, t); }
    renderer.render(scene, cam);
  });

  return new Promise((resolve) => {
    joinBtn.addEventListener('click', () => {
      if (onGesture) onGesture();
      const name = (nameInput.value || 'Tiny You').trim().slice(0, 14) || 'Tiny You';
      running = false;
      renderer.setAnimationLoop(null);
      if (avatar) avatar.dispose();
      renderer.dispose();
      renderer.forceContextLoss && renderer.forceContextLoss();
      window.removeEventListener('resize', size);
      root.classList.add('hidden');
      resolve({ name, color: state.color, hat: state.hat });
    }, { once: true });
  });
}

export function initControls(handlers) {
  const prompt = document.getElementById('prompt');
  const emoteBtn = document.getElementById('emote-btn');
  const wheel = document.getElementById('emote-wheel');
  const chatBtn = document.getElementById('chat-btn');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const muteBtn = document.getElementById('mute-btn');
  const roomChip = document.getElementById('room-chip');
  const playersCount = document.getElementById('players-count');
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  prompt.addEventListener('click', () => handlers.onInteract());

  emoteBtn.addEventListener('click', () => wheel.classList.toggle('hidden'));
  wheel.querySelectorAll('.emote-opt').forEach((b) => {
    b.addEventListener('click', () => {
      handlers.onEmote(b.dataset.emote);
      wheel.classList.add('hidden');
    });
  });

  chatBtn.addEventListener('click', () => {
    chatForm.classList.toggle('hidden');
    if (!chatForm.classList.contains('hidden')) chatInput.focus();
  });
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) handlers.onChat(text.slice(0, 80));
    chatInput.value = '';
    chatInput.blur();
    chatForm.classList.add('hidden');
  });

  muteBtn.addEventListener('click', () => handlers.onToggleMute());
  roomChip.addEventListener('click', () => handlers.onCopyRoom());

  return {
    setPrompt(text) {
      if (text) { prompt.textContent = text; prompt.classList.remove('hidden'); }
      else prompt.classList.add('hidden');
    },
    setPlayers(n) { playersCount.textContent = n; },
    setMuteIcon(muted) { muteBtn.textContent = muted ? '🔇' : '🔊'; },
    toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1900);
    },
  };
}
