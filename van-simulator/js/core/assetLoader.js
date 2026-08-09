// Realism is built from real PBR materials + procedural studio lighting rather than
// fetched binary assets (car model / HDRI files) — this keeps the game fully
// self-contained (no external CDN asset dependency beyond three.js itself, no
// broken-link risk) while still getting real image-based-lighting reflections,
// the thing that reads as "semi-realistic" for a glossy car body under moving light.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let cachedEnvMap = null;

// A neutral studio-style environment (walls/lights baked into an equirect map via
// PMREM) — the same technique three.js's own physical-material demos use to make
// MeshPhysicalMaterial read as glossy/reflective without a real photographed HDRI.
export function getStudioEnvironment(renderer) {
  if (cachedEnvMap) return cachedEnvMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  cachedEnvMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return cachedEnvMap;
}

// Procedural tileable-ish asphalt texture: a canvas of mottled gray noise, used as
// both the color map and (inverted/greyscaled) the roughness map so the ground
// isn't a single flat, unrealistic color under the studio lighting.
export function createAsphaltTexture({ size = 512, repeat = [10, 10] } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a4d52';
  ctx.fillRect(0, 0, size, size);
  const speckCount = 9000;
  for (let i = 0; i < speckCount; i++) {
    const shade = 55 + Math.random() * 40;
    ctx.fillStyle = `rgba(${shade | 0},${shade | 0},${(shade + 4) | 0},${0.15 + Math.random() * 0.25})`;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.6 + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // faint expansion-joint lines for a driveway feel
  ctx.strokeStyle = 'rgba(20,20,22,0.35)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    const y = (size / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Small tinted fabric-weave canvas texture, reused for towel/mat materials so
// they don't look like flat plastic under the studio environment.
export function createFabricTexture(hexColor, { size = 128 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? '#000000' : '#ffffff';
    ctx.fillRect(0, y, size, 1);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
