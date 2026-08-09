import * as THREE from 'three';
import { createAsphaltTexture, createFabricTexture, getStudioEnvironment } from './assetLoader.js';

// Manual §9 Towel Color Coding.
export const TOWEL_COLORS = {
  yellow: { hex: '#f2c53d', labelKey: 'towel_yellow', zone: 'body' },
  blue: { hex: '#3a7bf0', labelKey: 'towel_blue', zone: 'interior' },
  green: { hex: '#3fae5c', labelKey: 'towel_green', zone: 'glass' },
  gray: { hex: '#3d4148', labelKey: 'towel_gray', zone: 'wheels' },
  red: { hex: '#d1483f', labelKey: 'towel_red', zone: 'dirty' },
  white: { hex: '#f1f1ee', labelKey: 'towel_white', zone: 'final' },
};

export function setupLighting(scene, renderer) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.environment = getStudioEnvironment(renderer);
  scene.background = new THREE.Color('#bcd4e6');
  scene.fog = new THREE.Fog('#bcd4e6', 18, 46);

  const hemi = new THREE.HemisphereLight('#cfe4f7', '#33302b', 0.65);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight('#fff3d6', 2.4);
  sun.position.set(8, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0015;
  scene.add(sun);

  return { hemi, sun };
}

export function createGround(size = 30) {
  const texture = createAsphaltTexture({ repeat: [size / 3, size / 3] });
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92, metalness: 0.02 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

// Invisible-but-raycastable interaction volume.
export function makeHitbox(size = [0.6, 0.6, 0.6], position = [0, 0, 0]) {
  const geo = new THREE.BoxGeometry(...size);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...position);
  return mesh;
}

// A stylized service van block — set dressing + collider, parked behind the player.
export function createServiceVan() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#eef1f4', roughness: 0.45, metalness: 0.35 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: '#f2a33c', roughness: 0.5, metalness: 0.1 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#12222f', roughness: 0.1, metalness: 0, transmission: 0.4, transparent: true });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 4.6), bodyMat);
  body.position.y = 1.05;
  body.castShadow = body.receiveShadow = true;
  group.add(body);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.1, 1.3), bodyMat);
  cab.position.set(0, 1.75, 1.85);
  cab.castShadow = true;
  group.add(cab);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 0.05), glassMat);
  windshield.position.set(0, 1.8, 2.5);
  group.add(windshield);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.35, 4.62), stripeMat);
  stripe.position.y = 0.5;
  group.add(stripe);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 20);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.8 });
  [[-1.1, 0.38, 1.6], [1.1, 0.38, 1.6], [-1.1, 0.38, -1.6], [1.1, 0.38, -1.6]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  });

  group.userData.footprint = new THREE.Box3(
    new THREE.Vector3(-1.25, 0, -2.35),
    new THREE.Vector3(1.25, 2.4, 2.6)
  );
  return group;
}

// A procedurally-built sedan (no external model) with named zone sub-meshes so
// scenario scripts can target specific SOP zones (body, wheels, glass, doors...).
export function createCustomerCar({ doorsOpen = false, paintHex = '#c23b3b' } = {}) {
  const group = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: paintHex, roughness: 0.28, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08,
  });
  const trim = new THREE.MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.55, metalness: 0.3 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#0c1a24', roughness: 0.05, metalness: 0, transmission: 0.55, transparent: true, opacity: 0.9 });
  const interiorMat = new THREE.MeshStandardMaterial({ color: '#3a3630', roughness: 0.85 });

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.62, 4.3), paint);
  lowerBody.position.y = 0.5;
  lowerBody.castShadow = lowerBody.receiveShadow = true;
  lowerBody.name = 'zone_body';
  group.add(lowerBody);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 1.35), paint);
  hood.position.set(0, 0.84, 1.55);
  hood.name = 'zone_body';
  hood.castShadow = true;
  group.add(hood);

  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 1.0), paint);
  trunk.position.set(0, 0.84, -1.7);
  trunk.name = 'zone_body';
  trunk.castShadow = true;
  group.add(trunk);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.62, 2.1), paint);
  cabin.position.set(0, 1.13, -0.05);
  cabin.name = 'zone_body';
  cabin.castShadow = true;
  group.add(cabin);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 0.05), glass);
  windshield.position.set(0, 1.18, 1.0);
  windshield.rotation.x = -0.32;
  windshield.name = 'zone_glass';
  group.add(windshield);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.05), glass);
  rearGlass.position.set(0, 1.2, -1.1);
  rearGlass.rotation.x = 0.32;
  rearGlass.name = 'zone_glass';
  group.add(rearGlass);

  const sideGlassGeo = new THREE.BoxGeometry(0.04, 0.42, 1.7);
  [-0.82, 0.82].forEach((x) => {
    const sg = new THREE.Mesh(sideGlassGeo, glass);
    sg.position.set(x, 1.2, -0.05);
    sg.name = 'zone_glass';
    group.add(sg);
  });

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 24);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.75 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#c9cdd2', roughness: 0.3, metalness: 0.8 });
  const wheelPositions = { wheelFL: [-0.95, 0.34, 1.35], wheelFR: [0.95, 0.34, 1.35], wheelRL: [-0.95, 0.34, -1.35], wheelRR: [0.95, 0.34, -1.35] };
  group.userData.wheels = {};
  Object.entries(wheelPositions).forEach(([key, [x, y, z]]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.name = 'zone_wheels';
    wheel.castShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 16), rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(x, y, z);
    rim.name = 'zone_wheels';
    group.add(wheel, rim);
    group.userData.wheels[key] = wheel;
  });

  const bumperGeo = new THREE.BoxGeometry(1.9, 0.3, 0.2);
  const frontBumper = new THREE.Mesh(bumperGeo, trim);
  frontBumper.position.set(0, 0.42, 2.15);
  frontBumper.name = 'zone_body';
  group.add(frontBumper);
  const rearBumper = frontBumper.clone();
  rearBumper.position.z = -2.15;
  group.add(rearBumper);

  if (doorsOpen) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 1.1), paint);
    door.position.set(-1.15, 1.0, -0.05);
    door.rotation.y = Math.PI / 2.4;
    door.name = 'zone_body';
    group.add(door);

    const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.14, 0.35), interiorMat);
    dashboard.position.set(0, 0.92, 0.85);
    dashboard.name = 'zone_dashboard';
    group.add(dashboard);

    const seatGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    [[-0.5, 0.72, 0.25], [0.5, 0.72, 0.25], [-0.5, 0.72, -0.65], [0.5, 0.72, -0.65]].forEach(([x, y, z]) => {
      const seat = new THREE.Mesh(seatGeo, interiorMat);
      seat.position.set(x, y, z);
      seat.name = 'zone_interior';
      group.add(seat);
    });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.9), interiorMat);
    floor.position.set(0, 0.5, -0.1);
    floor.name = 'zone_floor';
    group.add(floor);
    group.userData.floorPosition = new THREE.Vector3(-0.85, 0.55, -0.1);
    group.userData.dashboardPosition = new THREE.Vector3(-0.7, 0.95, 0.85);
    group.userData.interiorGlassPosition = new THREE.Vector3(-0.84, 1.2, -0.05);
  }

  group.userData.footprint = new THREE.Box3(
    new THREE.Vector3(-1.0, 0, -2.2),
    new THREE.Vector3(1.0, 1.9, 2.2)
  );
  group.userData.bodyMaterial = paint;
  return group;
}

// Generic fabric-textured box (used for floor mats and other cloth-like props
// that aren't part of the fixed towel-color-coding set).
export function createFabricTextureMesh(hexColor, size = [0.4, 0.02, 0.4]) {
  const tex = createFabricTexture(hexColor);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createTowelMesh(colorKey) {
  const def = TOWEL_COLORS[colorKey];
  const tex = createFabricTexture(def.hex);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.2), mat);
  mesh.castShadow = true;
  mesh.userData.colorKey = colorKey;
  return mesh;
}

// A small stand holding one towel of each supplied color, spaced along X.
export function createTowelRack(colorKeys, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.position.set(...position);

  const postMat = new THREE.MeshStandardMaterial({ color: '#5b5b5b', roughness: 0.6, metalness: 0.4 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), postMat);
  post.position.y = 0.55;
  group.add(post);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(colorKeys.length * 0.36 + 0.1, 0.04, 0.28), postMat);
  shelf.position.y = 1.0;
  group.add(shelf);

  const towels = colorKeys.map((colorKey, i) => {
    const towel = createTowelMesh(colorKey);
    towel.position.set((i - (colorKeys.length - 1) / 2) * 0.36, 1.05, 0);
    group.add(towel);
    return towel;
  });

  return { group, towels };
}

export function playAreaBounds(halfX = 6, halfZ = 6) {
  return new THREE.Box3(new THREE.Vector3(-halfX, 0, -halfZ), new THREE.Vector3(halfX, 4, halfZ));
}
