import * as THREE from 'three';

function pmat(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true }); }

function petLeg(color) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.26, 6), pmat(color));
  mesh.position.y = -0.13;
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

export function createPet(scene, color = 0xc98f5a) {
  const g = new THREE.Group();
  g.position.set(6, 0, 4);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), pmat(color));
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.42;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Group();
  head.position.set(0, 0.5, 0.42);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), pmat(color));
  skull.castShadow = true;
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.16), pmat(0x6f4a2f));
  snout.position.set(0, -0.03, 0.18);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 5), pmat(0x9c6a3e)); earL.position.set(-0.12, 0.16, 0); earL.rotation.x = -0.3;
  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 5), pmat(0x9c6a3e)); earR.position.set(0.12, 0.16, 0); earR.rotation.x = -0.3;
  const eyeMat = pmat(0x1f1f29);
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), eyeMat); eL.position.set(-0.08, 0.03, 0.18);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), eyeMat); eR.position.set(0.08, 0.03, 0.18);
  head.add(skull, snout, earL, earR, eL, eR);
  g.add(head);

  const tail = new THREE.Group();
  tail.position.set(0, 0.5, -0.42);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.34, 5), pmat(color));
  tailMesh.position.y = 0.14; tailMesh.rotation.x = -0.6;
  tail.add(tailMesh);
  g.add(tail);

  const legs = [petLeg(0x9c6a3e), petLeg(0x9c6a3e), petLeg(0x9c6a3e), petLeg(0x9c6a3e)];
  const lp = [[-0.13, 0.26, 0.28], [0.13, 0.26, 0.28], [-0.13, 0.26, -0.24], [0.13, 0.26, -0.24]];
  legs.forEach((l, i) => { l.position.set(...lp[i]); g.add(l); });

  scene.add(g);

  let mode = 'pause';
  let timer = 1.5;
  const target = new THREE.Vector3(6, 0, 4);
  let facing = 0;

  function pickTarget() {
    const ang = Math.random() * Math.PI * 2;
    const rad = 2 + Math.random() * 7;
    let x = 6 + Math.cos(ang) * rad;
    let z = 4 + Math.sin(ang) * rad;
    x = Math.max(-11.5, Math.min(11.5, x));
    z = Math.max(-11.5, Math.min(11.5, z));
    target.set(x, 0, z);
  }

  function update(dt, time) {
    timer -= dt;
    if (mode === 'pause') {
      if (timer <= 0) { mode = 'walk'; pickTarget(); }
      legs.forEach((l) => l.rotation.x *= 0.9);
      tail.rotation.y = Math.sin(time * 4) * 0.4;
    } else {
      const dx = target.x - g.position.x, dz = target.z - g.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.3) { mode = 'pause'; timer = 1.5 + Math.random() * 3; }
      else {
        const sp = 1.7;
        g.position.x += (dx / d) * sp * dt;
        g.position.z += (dz / d) * sp * dt;
        facing = Math.atan2(dx, dz);
        const w = Math.sin(time * 12);
        legs[0].rotation.x = w * 0.7; legs[3].rotation.x = w * 0.7;
        legs[1].rotation.x = -w * 0.7; legs[2].rotation.x = -w * 0.7;
        tail.rotation.y = Math.sin(time * 10) * 0.5;
      }
    }
    let cur = g.rotation.y;
    let diff = ((facing - cur + Math.PI) % (Math.PI * 2)) - Math.PI;
    g.rotation.y = cur + diff * Math.min(1, dt * 6);
    body.position.y = 0.42 + Math.abs(Math.sin(time * 12)) * (mode === 'walk' ? 0.02 : 0);
  }

  return { group: g, update };
}
