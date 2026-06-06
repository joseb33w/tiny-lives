import * as THREE from 'three';

const SKIN = 0xffd7b0;
const PANTS = 0x586a8f;

function mat(color, rough = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });
}

function limb(radius, len, color) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 4, 8), mat(color));
  mesh.position.y = -(len / 2 + radius);
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

function buildHat(type, color) {
  const g = new THREE.Group();
  if (type === 'cap') {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe8556d));
    crown.position.y = 0.02;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12, 1, false, 0, Math.PI), mat(0xe8556d));
    brim.position.set(0, 0.02, 0.26);
    brim.scale.z = 1.6;
    g.add(crown, brim);
  } else if (type === 'party') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 5), mat(0xffc94d));
    cone.position.y = 0.26;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xff7ab0));
    pom.position.y = 0.52;
    g.add(cone, pom);
  } else if (type === 'flower') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 5), mat(0x6cbf6c));
    stem.position.y = 0.16;
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xffd23f));
    center.position.y = 0.3;
    g.add(stem, center);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat(0xff8fc2));
      p.scale.set(1, 0.4, 1);
      p.position.set(Math.cos((i / 5) * Math.PI * 2) * 0.1, 0.3, Math.sin((i / 5) * Math.PI * 2) * 0.1);
      g.add(p);
    }
  } else if (type === 'beanie') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), mat(0x7b6cff));
    cap.position.y = -0.02;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.05, 8, 16), mat(0x5f4fe0));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.02;
    g.add(cap, band);
  } else {
    return null;
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.y = 0.34;
  return g;
}

export function createAvatar({ color = '#6ec6ff', hat = 'none' } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); // tilts for lie-down
  root.add(body);

  const bodyColor = new THREE.Color(color).getHex();

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.46, 5, 10), mat(bodyColor));
  torso.position.y = 0.98;
  torso.castShadow = true;
  body.add(torso);

  const head = new THREE.Group();
  head.position.y = 1.5;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.31, 18, 14), mat(SKIN, 0.7));
  skull.castShadow = true;
  head.add(skull);
  const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const eyeMat = mat(0x2b2b3a, 0.4);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.11, 0.04, 0.28);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.11, 0.04, 0.28);
  const cheekMat = mat(0xff9aa9, 0.6);
  const chL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cheekMat); chL.position.set(-0.17, -0.05, 0.24); chL.scale.z = 0.4;
  const chR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cheekMat); chR.position.set(0.17, -0.05, 0.24); chR.scale.z = 0.4;
  head.add(eyeL, eyeR, chL, chR);
  const hatMesh = buildHat(hat, bodyColor);
  if (hatMesh) head.add(hatMesh);
  body.add(head);

  const armL = limb(0.1, 0.42, bodyColor); armL.position.set(-0.4, 1.22, 0);
  const armR = limb(0.1, 0.42, bodyColor); armR.position.set(0.4, 1.22, 0);
  const legL = limb(0.12, 0.44, PANTS); legL.position.set(-0.16, 0.56, 0);
  const legR = limb(0.12, 0.44, PANTS); legR.position.set(0.16, 0.56, 0);
  body.add(armL, armR, legL, legR);

  const parts = { armL, armR, legL, legR, head, torso, body };

  // current eased rotations
  const cur = {
    armLx: 0, armLz: 0, armRx: 0, armRz: 0, legLx: 0, legRx: 0,
    bodyTiltX: 0, bodyY: 0, headTiltZ: 0,
  };

  function ease(a, b, k) { return a + (b - a) * k; }

  function update(dt, pose, moving, t) {
    const k = Math.min(1, dt * 12);
    const tgt = { armLx: 0, armLz: 0, armRx: 0, armRz: 0, legLx: 0, legRx: 0, bodyTiltX: 0, bodyY: 0, headTiltZ: 0 };
    const w = Math.sin(t * 9);

    if (pose === 'sleep') {
      tgt.bodyTiltX = -Math.PI / 2; tgt.bodyY = 0.32;
      tgt.armLx = -0.3; tgt.armRx = -0.3; tgt.legLx = 0.15; tgt.legRx = -0.15;
      tgt.headTiltZ = 0.2;
    } else if (pose === 'sit' || pose === 'tv' || pose === 'bench') {
      tgt.bodyY = -0.42; tgt.legLx = -1.5; tgt.legRx = -1.5;
      tgt.armLx = -0.3; tgt.armRx = -0.3;
      tgt.headTiltZ = Math.sin(t * 1.5) * 0.04;
    } else if (pose === 'cook') {
      tgt.armLx = -1.1 + Math.sin(t * 6) * 0.25;
      tgt.armRx = -1.1 - Math.sin(t * 6) * 0.25;
      tgt.bodyY = Math.sin(t * 6) * 0.01;
    } else if (pose === 'garden') {
      tgt.bodyTiltX = 0.5; tgt.armLx = -1.0; tgt.armRx = -1.0 + Math.sin(t * 5) * 0.3;
    } else if (pose === 'wave') {
      tgt.armRz = -2.5; tgt.armRx = -0.2 + Math.sin(t * 11) * 0.4;
    } else if (pose === 'dance') {
      tgt.bodyY = Math.abs(Math.sin(t * 7)) * 0.12;
      tgt.armLz = 0.6 + Math.sin(t * 7) * 0.5; tgt.armRz = -0.6 + Math.sin(t * 7) * 0.5;
      tgt.armLx = Math.sin(t * 7) * 0.6; tgt.armRx = -Math.sin(t * 7) * 0.6;
      tgt.headTiltZ = Math.sin(t * 7) * 0.18;
    } else if (pose === 'laugh') {
      tgt.bodyTiltX = -0.18 + Math.sin(t * 14) * 0.06;
      tgt.armLx = -0.5; tgt.armRx = -0.5; tgt.bodyY = Math.abs(Math.sin(t * 14)) * 0.05;
    } else if (pose === 'heart') {
      tgt.armLz = 1.4; tgt.armRz = -1.4; tgt.armLx = -1.2; tgt.armRx = -1.2;
      tgt.headTiltZ = Math.sin(t * 3) * 0.08;
    } else if (moving) {
      const amp = 0.9;
      tgt.legLx = w * amp; tgt.legRx = -w * amp;
      tgt.armLx = -w * amp * 0.7; tgt.armRx = w * amp * 0.7;
      tgt.bodyY = Math.abs(w) * 0.04;
    } else {
      const b = Math.sin(t * 1.6) * 0.06;
      tgt.armLx = b; tgt.armRx = b; tgt.bodyY = Math.sin(t * 1.6) * 0.015;
    }

    cur.armLx = ease(cur.armLx, tgt.armLx, k); cur.armLz = ease(cur.armLz, tgt.armLz, k);
    cur.armRx = ease(cur.armRx, tgt.armRx, k); cur.armRz = ease(cur.armRz, tgt.armRz, k);
    cur.legLx = ease(cur.legLx, tgt.legLx, k); cur.legRx = ease(cur.legRx, tgt.legRx, k);
    cur.bodyTiltX = ease(cur.bodyTiltX, tgt.bodyTiltX, k);
    cur.bodyY = ease(cur.bodyY, tgt.bodyY, k);
    cur.headTiltZ = ease(cur.headTiltZ, tgt.headTiltZ, k);

    armL.rotation.x = cur.armLx; armL.rotation.z = cur.armLz;
    armR.rotation.x = cur.armRx; armR.rotation.z = cur.armRz;
    legL.rotation.x = cur.legLx; legR.rotation.x = cur.legRx;
    body.rotation.x = cur.bodyTiltX;
    body.position.y = cur.bodyY;
    head.rotation.z = cur.headTiltZ;
  }

  function dispose() {
    root.traverse((o) => {
      if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); }
    });
  }

  return { root, parts, update, dispose };
}
