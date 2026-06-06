import * as THREE from 'three';

const CYCLE = 200; // seconds for a full day

export function setupSky(scene) {
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0xa6c47e, 0.7);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
  sun.position.set(12, 20, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  const S = 18;
  sun.shadow.camera.left = -S;
  sun.shadow.camera.right = S;
  sun.shadow.camera.top = S;
  sun.shadow.camera.bottom = -S;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  scene.add(sun.target);

  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff1c4 })
  );
  scene.add(sunMesh);

  const fog = new THREE.Fog(0xbfe6ff, 32, 70);
  scene.fog = fog;

  const nightSky = new THREE.Color(0x222f50);
  const daySky = new THREE.Color(0xafe6ff);
  const duskSky = new THREE.Color(0xffc59e);
  const tmp = new THREE.Color();
  const tmp2 = new THREE.Color();

  let elapsed = CYCLE * 0.4; // start on a sunny morning

  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function update(dt) {
    elapsed += dt;
    const phase = (elapsed / CYCLE) % 1;
    const ang = phase * Math.PI * 2 - Math.PI / 2;
    const el = Math.sin(ang);
    const day = smooth(el * 0.5 + 0.6);

    sun.position.set(Math.cos(ang) * 22, Math.max(1.5, el * 24), Math.sin(ang) * 14 + 4);
    sunMesh.position.copy(sun.position).multiplyScalar(1.6);
    sunMesh.visible = el > -0.1;
    sun.intensity = 0.2 + Math.max(0, el) * 1.4;

    const warm = 1 - Math.min(1, Math.abs(el) * 2.4);
    tmp.set(0xfff4d8).lerp(tmp2.set(0xff9d5c), warm * 0.8);
    sun.color.copy(tmp);

    hemi.intensity = 0.45 + day * 0.7;
    ambient.intensity = 0.3 + day * 0.4;

    // sky color
    tmp.copy(nightSky).lerp(daySky, day);
    tmp.lerp(duskSky, warm * 0.55 * (el > -0.2 ? 1 : 0.3));
    scene.background = tmp.clone();
    scene.fog.color.copy(tmp);
  }

  return { update, sun, sunMesh };
}
