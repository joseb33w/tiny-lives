import * as THREE from 'three';

function m(color, rough = 0.92, flat = true) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: flat });
}

function box(parent, w, h, d, color, x, y, z, opt = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(color, opt.rough ?? 0.92, opt.flat ?? true));
  mesh.position.set(x, y, z);
  if (opt.rotY) mesh.rotation.y = opt.rotY;
  mesh.castShadow = opt.cast ?? true;
  mesh.receiveShadow = opt.receive ?? true;
  parent.add(mesh);
  return mesh;
}

function tree(parent, x, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.4, 6), m(0x9a6b3f));
  trunk.position.y = 0.7; trunk.castShadow = true;
  g.add(trunk);
  const greens = [0x86c98a, 0x77bd86, 0x9bd69a];
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 - i * 0.18, 0), m(greens[i % 3]));
    f.position.y = 1.5 + i * 0.55;
    f.castShadow = true;
    g.add(f);
  }
  parent.add(g);
}

function flower(parent, x, z, color) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 4), m(0x6cbf6c));
  stem.position.y = 0.17;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), m(color));
  head.position.y = 0.38;
  g.add(stem, head);
  parent.add(g);
}

export function buildWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // ground
  const grass = new THREE.Mesh(new THREE.CircleGeometry(34, 48), m(0x9ad080, 1, false));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  group.add(grass);

  // house floor
  box(group, 10, 0.12, 14, 0xf0e2c8, -4, 0.06, 0, { cast: false });
  // rugs
  box(group, 3.4, 0.04, 2.6, 0xd98a86, -6, 0.14, 4.6, { cast: false });
  box(group, 2.4, 0.04, 2.2, 0xa9c6e0, -1.4, 0.14, -4.8, { cast: false });

  const WALL = 0xfbe9d2, H = 2.4, T = 0.2;
  const wallY = H / 2 + 0.12;
  const seg = (w, d, x, z) => box(group, w, H, d, WALL, x, wallY, z, { rough: 0.95 });
  // outer walls (open-top dollhouse). Front wall z=7 has a door gap near x=-4
  seg(10, T, -4, -7);            // back
  seg(T, 14, -9, 0);            // left
  seg(T, 14, 1, 0);            // right
  seg(4.1, T, -6.95, 7);       // front-left  (x: -9..-4.9)
  seg(4.1, T, -1.05, 7);       // front-right (x: -3.1..1)
  // interior divider at z=0 with two doorways
  seg(1.8, T, -8.1, 0);        // x -9..-7.2
  seg(3.2, T, -4.2, 0);        // x -5.8..-2.6
  seg(1.8, T, 0.1, 0);         // x -0.8..1
  // interior divider x=-4 (kitchen|bedroom) z -7..0 with doorway near z=-2
  box(group, T, H, 4, WALL, -4, wallY, -5, { rough: 0.95 });   // z -7..-3
  box(group, T, H, 1, WALL, -4, wallY, -0.5, { rough: 0.95 }); // z -1..0

  const interactables = [];
  const add = (o) => { interactables.push(o); };

  // ---------- KITCHEN (back-left) ----------
  // fridge
  box(group, 0.9, 1.7, 0.8, 0xeef3f6, -8.4, 0.97, -6.1);
  box(group, 0.06, 0.5, 0.06, 0xcfd7dd, -7.96, 1.1, -6.1);
  add({ id: 'fridge', need: 'hunger', pose: 'cook', icon: '🍔', label: 'Tap to eat', x: -8.4, z: -5.2, radius: 2.1 });
  // stove + counter
  box(group, 1.6, 0.85, 0.7, 0xe7ddca, -8.1, 0.5, -3.6);
  box(group, 0.5, 0.06, 0.5, 0x3a3a44, -8.1, 0.92, -3.6, { cast: false });
  add({ id: 'stove', need: 'hunger', pose: 'cook', icon: '🍳', label: 'Tap to cook', x: -7.3, z: -3.6, radius: 2.1 });
  // little dining table
  box(group, 1.1, 0.1, 1.1, 0xc89b6a, -6, 0.7, -2, { });
  box(group, 0.1, 0.6, 0.1, 0xb0875a, -6.45, 0.35, -2.45);
  box(group, 0.1, 0.6, 0.1, 0xb0875a, -5.55, 0.35, -2.45);

  // ---------- BEDROOM (back-right) ----------
  const bedColor = 0xb8d2ff;
  box(group, 2.0, 0.45, 1.5, 0x8a6f57, -1.4, 0.32, -5.1);     // frame
  box(group, 1.9, 0.22, 1.4, bedColor, -1.4, 0.6, -5.1, { cast: false }); // mattress
  box(group, 0.7, 0.18, 0.5, 0xffffff, -1.4, 0.78, -5.7, { cast: false }); // pillow
  add({ id: 'bed', need: 'energy', pose: 'sleep', icon: '💤', label: 'Tap to sleep', x: -1.4, z: -4.0, radius: 2.2,
        seat: { x: -1.4, y: 0.7, z: -5.0, ry: Math.PI } });
  // nightstand + lamp
  box(group, 0.5, 0.5, 0.5, 0xc89b6a, -0.2, 0.37, -5.6);
  box(group, 0.18, 0.4, 0.18, 0xffe08a, -0.2, 0.8, -5.6, { cast: false });

  // ---------- LIVING ROOM (front) ----------
  // couch facing the TV (north wall divider)
  const couch = new THREE.Group(); group.add(couch); couch.position.set(-6, 0, 5.0);
  box(couch, 2.3, 0.5, 0.9, 0xe98aa6, 0, 0.4, 0);
  box(couch, 2.3, 0.5, 0.25, 0xe07a98, 0, 0.7, 0.42);
  box(couch, 0.25, 0.6, 0.9, 0xe07a98, -1.15, 0.55, 0);
  box(couch, 0.25, 0.6, 0.9, 0xe07a98, 1.15, 0.55, 0);
  add({ id: 'couch', need: 'fun', pose: 'tv', icon: '📺', label: 'Tap to watch TV', x: -6, z: 5.0, radius: 2.3,
        seat: { x: -6, y: 0.66, z: 5.0, ry: Math.PI } });
  // TV on a stand against the z=0 divider
  box(group, 1.6, 0.4, 0.4, 0x6b5743, -6, 0.5, 0.6);
  const tv = box(group, 1.7, 1.0, 0.16, 0x23232e, -6, 1.3, 0.42);
  box(group, 1.5, 0.82, 0.04, 0x6fd3ff, -6, 1.32, 0.51, { cast: false, receive: false, rough: 0.4 });
  // arcade machine
  const arc = new THREE.Group(); group.add(arc); arc.position.set(-0.2, 0, 1.4);
  box(arc, 0.8, 1.7, 0.7, 0x7b5bd6, 0, 0.85, 0);
  box(arc, 0.62, 0.5, 0.08, 0x9af0ff, 0, 1.25, 0.34, { cast: false, rough: 0.4 });
  box(arc, 0.6, 0.2, 0.3, 0x3a2f5e, 0, 0.95, 0.36, { cast: false });
  add({ id: 'arcade', need: 'fun', pose: 'arcade', icon: '🕹️', label: 'Tap to play', x: -0.6, z: 2.4, radius: 2.0 });
  // potted plant
  box(group, 0.4, 0.4, 0.4, 0xc56b4a, 0.2, 0.32, 6.2);
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), m(0x77bd86));
  plant.position.set(0.2, 0.95, 6.2); plant.castShadow = true; group.add(plant);

  // ---------- YARD ----------
  // garden plot
  box(group, 2.6, 0.18, 2.0, 0x7a5235, 6.0, 0.09, 8.6, { });
  const gcolors = [0xff8fb8, 0xffd23f, 0xc89bff, 0x6ec6ff];
  for (let i = 0; i < 8; i++) {
    flower(group, 5.0 + (i % 4) * 0.66, 7.9 + Math.floor(i / 4) * 0.9, gcolors[i % 4]);
  }
  add({ id: 'garden', need: 'fun', pose: 'garden', icon: '🌱', label: 'Tap to garden', x: 6.0, z: 7.2, radius: 2.2 });
  // park bench
  const bench = new THREE.Group(); group.add(bench); bench.position.set(8.4, 0, 2.5); bench.rotation.y = -Math.PI / 2;
  box(bench, 1.8, 0.12, 0.6, 0xb98a5a, 0, 0.5, 0);
  box(bench, 1.8, 0.5, 0.12, 0xb98a5a, 0, 0.75, -0.3);
  box(bench, 0.12, 0.5, 0.6, 0x8a6740, -0.8, 0.25, 0);
  box(bench, 0.12, 0.5, 0.6, 0x8a6740, 0.8, 0.25, 0);
  add({ id: 'bench', need: 'energy', pose: 'bench', icon: '🪑', label: 'Tap to rest', x: 7.4, z: 2.5, radius: 2.1,
        seat: { x: 8.4, y: 0.66, z: 2.5, ry: -Math.PI / 2 } });

  // stone path from house door to yard
  for (let i = 0; i < 6; i++) {
    box(group, 1.0, 0.04, 0.7, 0xd9cdb0, -4, 0.13, 7.8 + i * 1.1, { cast: false });
  }

  // trees + fence
  tree(group, 10, 9, 1.1); tree(group, 11, -4, 1.0); tree(group, -12, 8, 1.2);
  tree(group, -12, -6, 1.0); tree(group, 6, -9, 0.9); tree(group, 12, 3, 0.95);
  const fenceMat = 0xf2e6cf;
  for (let x = -13; x <= 13; x += 1.3) {
    box(group, 0.14, 0.9, 0.14, fenceMat, x, 0.45, 13, { receive: false });
    box(group, 0.14, 0.9, 0.14, fenceMat, x, 0.45, -13, { receive: false });
  }
  for (let z = -13; z <= 13; z += 1.3) {
    box(group, 0.14, 0.9, 0.14, fenceMat, 13, 0.45, z, { receive: false });
    box(group, 0.14, 0.9, 0.14, fenceMat, -13, 0.45, z, { receive: false });
  }

  // soft clouds
  const clouds = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Group();
    const cm = m(0xffffff, 1, false);
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 - j * 0.2, 0), cm);
      puff.position.set(j * 1.3 - 1.3, Math.random() * 0.3, 0);
      c.add(puff);
    }
    c.position.set(-18 + i * 9, 12 + (i % 2) * 2, -10 + (i % 3) * 6);
    clouds.add(c);
  }
  group.add(clouds);

  const colliders = [
    // outer walls
    [-4, -7, 10, 0.2], [-9, 0, 0.2, 14], [1, 0, 0.2, 14],
    [-6.95, 7, 4.1, 0.2], [-1.05, 7, 4.1, 0.2],
    // z=0 divider
    [-8.1, 0, 1.8, 0.2], [-4.2, 0, 3.2, 0.2], [0.1, 0, 1.8, 0.2],
    // x=-4 divider
    [-4, -5, 0.2, 4], [-4, -0.5, 0.2, 1],
    // furniture
    [-8.4, -6.1, 0.9, 0.8], [-8.1, -3.6, 1.6, 0.7], [-6, -2, 1.1, 1.1],
    [-1.4, -5.1, 2.0, 1.5], [-0.2, -5.6, 0.5, 0.5],
    [-6, 5.0, 2.3, 0.9], [-6, 0.6, 1.6, 0.4], [-0.2, 1.4, 0.8, 0.7],
    [6.0, 8.6, 2.6, 2.0], [8.4, 2.5, 0.7, 1.9],
  ].map(([cx, cz, w, d]) => ({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 }));

  return { group, interactables, colliders, grass, clouds, tvScreen: tv };
}
