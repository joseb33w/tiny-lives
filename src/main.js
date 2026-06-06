import './style.css';
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { buildWorld } from './world.js';
import { setupSky } from './daynight.js';
import { createPet } from './pet.js';
import { Needs } from './needs.js';
import { Input } from './input.js';
import { LocalPlayer } from './localPlayer.js';
import { RemotePlayers } from './remotePlayers.js';
import { Net } from './net.js';
import { Ambient } from './audio.js';
import { initStartScreen, initControls } from './ui.js';
import { makeRoomCode, makeId, EMOTES } from './config.js';

function getRoom() {
  const u = new URL(location.href);
  let r = (u.searchParams.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (!r) {
    r = makeRoomCode();
    u.searchParams.set('room', r);
    history.replaceState({}, '', u);
  }
  return r;
}

async function main() {
  const room = getRoom();
  document.getElementById('room-label').textContent = room;

  const ambient = new Ambient();
  const choice = await initStartScreen({ roomCode: room, onGesture: () => ambient.start() });

  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('controls').classList.remove('hidden');

  // renderer
  const gameEl = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  gameEl.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(innerWidth, innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  gameEl.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 220);
  camera.domElement = renderer.domElement;

  const sky = setupSky(scene);
  const world = buildWorld(scene);
  const pet = createPet(scene);

  const needs = new Needs(document.getElementById('needs-mount'));
  const input = new Input(renderer.domElement);
  const id = makeId();
  const local = new LocalPlayer(scene, camera, input, {
    id, name: choice.name, color: choice.color, hat: choice.hat,
    needs, interactables: world.interactables, colliders: world.colliders,
  });
  const remote = new RemotePlayers(scene);
  const net = new Net(room, id);

  const controls = initControls({
    onInteract: () => local.toggleInteract(),
    onEmote: (name) => { local.playEmote(name); net.sendEmote(name); },
    onChat: (text) => { local.setBubble(text); net.sendChat(choice.name, text); },
    onToggleMute: () => { ambient.setMuted(!ambient.muted); controls.setMuteIcon(ambient.muted); },
    onCopyRoom: () => {
      const link = location.href;
      const done = () => controls.toast('Link copied — send it to a friend!');
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(done).catch(done);
      else done();
    },
  });

  net.on('state', (s) => remote.applyState(s));
  net.on('emote', (e) => remote.applyEmote(e));
  net.on('chat', (c) => remote.applyChat(c));
  net.on('leave', (lid) => remote.remove(lid));
  await net.join();
  net.sendState(local.netState());
  controls.toast('Share the room link to play together!');

  // desktop shortcuts
  const emoteKeys = Object.keys(EMOTES);
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key >= '1' && e.key <= '4') {
      const name = emoteKeys[+e.key - 1];
      if (name) { local.playEmote(name); net.sendEmote(name); }
    } else if (e.key === 'Enter') {
      const f = document.getElementById('chat-form');
      f.classList.remove('hidden');
      document.getElementById('chat-input').focus();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    labelRenderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  let netAcc = 0, countAcc = 0;
  const NET_DT = 1 / 11;

  function frame() {
    let dt = clock.getDelta();
    if (dt > 0.05) dt = 0.05;
    const time = clock.elapsedTime;

    sky.update(dt);
    pet.update(dt, time);
    local.update(dt, time, remote);
    remote.update(dt, time);
    needs.drain(dt);
    needs.render();

    // interaction prompt text
    if (local.interacting) {
      controls.setPrompt(local.interacting.seat ? '✋ Tap to get up' : '✋ Tap to stop');
    } else if (local.prompt) {
      controls.setPrompt(`${local.prompt.icon}  ${local.prompt.label}`);
    } else {
      controls.setPrompt(null);
    }

    if (input.consumeAction()) local.toggleInteract();

    netAcc += dt;
    if (netAcc >= NET_DT) { netAcc = 0; net.sendState(local.netState()); }
    countAcc += dt;
    if (countAcc >= 1) { countAcc = 0; controls.setPlayers(remote.count() + 1); }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // expose a tiny state probe for automated smoke checks
  window.__tiny = {
    get pos() { const p = local.position; return { x: p.x, y: p.y, z: p.z }; },
    get remotes() { return remote.count(); },
    get prompt() { return local.prompt ? local.prompt.id : null; },
    needs: needs.values,
    emote: (n) => { local.playEmote(n); net.sendEmote(n); },
    warp: (x, z) => { local.position.set(x, 0, z); },
  };

  requestAnimationFrame(frame);
}

main();
