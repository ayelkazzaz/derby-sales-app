import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// First-person WASD movement with simple circle-vs-box collision against a set
// of Box3 colliders (van, car, props), clamped to a rectangular play area.
export class PlayerController {
  constructor(camera, domElement, { colliders = [], bounds = null, spawn = new THREE.Vector3(0, 0, 3) } = {}) {
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);
    this.colliders = colliders;
    this.bounds = bounds;
    this.speed = 3.4;
    this.playerRadius = 0.35;
    this.eyeHeight = 1.68;

    this.move = { forward: false, back: false, left: false, right: false };
    camera.position.set(spawn.x, this.eyeHeight, spawn.z);

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  get isLocked() {
    return this.controls.isLocked;
  }

  lock() { this.controls.lock(); }
  unlock() { this.controls.unlock(); }
  onLock(fn) { this.controls.addEventListener('lock', fn); }
  onUnlock(fn) { this.controls.addEventListener('unlock', fn); }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.move.forward = true; break;
      case 'KeyS': case 'ArrowDown': this.move.back = true; break;
      case 'KeyA': case 'ArrowLeft': this.move.left = true; break;
      case 'KeyD': case 'ArrowRight': this.move.right = true; break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': this.move.forward = false; break;
      case 'KeyS': case 'ArrowDown': this.move.back = false; break;
      case 'KeyA': case 'ArrowLeft': this.move.left = false; break;
      case 'KeyD': case 'ArrowRight': this.move.right = false; break;
    }
  }

  update(dt) {
    if (!this.controls.isLocked) return;
    const forwardInput = (this.move.forward ? 1 : 0) - (this.move.back ? 1 : 0);
    const rightInput = (this.move.right ? 1 : 0) - (this.move.left ? 1 : 0);
    if (forwardInput === 0 && rightInput === 0) return;

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();
    const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

    const dir = new THREE.Vector3()
      .addScaledVector(camDir, forwardInput)
      .addScaledVector(camRight, rightInput);
    if (dir.lengthSq() === 0) return;
    dir.normalize();

    const delta = dir.multiplyScalar(this.speed * dt);
    const pos = this.camera.position;
    const nextFull = pos.clone().add(delta);
    const nextX = pos.clone(); nextX.x += delta.x;
    const nextZ = pos.clone(); nextZ.z += delta.z;

    if (!this._collides(nextFull)) {
      pos.x = nextFull.x; pos.z = nextFull.z;
    } else if (!this._collides(nextX)) {
      pos.x = nextX.x;
    } else if (!this._collides(nextZ)) {
      pos.z = nextZ.z;
    }

    if (this.bounds) {
      pos.x = THREE.MathUtils.clamp(pos.x, this.bounds.min.x, this.bounds.max.x);
      pos.z = THREE.MathUtils.clamp(pos.z, this.bounds.min.z, this.bounds.max.z);
    }
    pos.y = this.eyeHeight;
  }

  _collides(pos) {
    for (const box of this.colliders) {
      const closestX = THREE.MathUtils.clamp(pos.x, box.min.x, box.max.x);
      const closestZ = THREE.MathUtils.clamp(pos.z, box.min.z, box.max.z);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      if (dx * dx + dz * dz < this.playerRadius * this.playerRadius) return true;
    }
    return false;
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
