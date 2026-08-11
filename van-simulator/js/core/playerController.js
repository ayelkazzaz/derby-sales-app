import * as THREE from 'three';

// First-person WASD movement with click-and-drag look (mouse or touch) and
// simple circle-vs-box collision against a set of Box3 colliders.
//
// Deliberately does NOT use the browser Pointer Lock API: that API is commonly
// blocked or silently unavailable inside sandboxed iframes (including the
// Artifacts viewer), which made an earlier Pointer-Lock-based version of this
// controller completely unresponsive there. Click-and-drag works everywhere —
// desktop, inside iframes, and on touchscreens — at the cost of needing to
// hold the pointer down while looking around instead of true free-look.
//
// Keeps the same public surface (isLocked / lock() / unlock() / onLock() /
// onUnlock()) as the previous Pointer-Lock-based version so callers don't
// need to change; "locked" now just means "actively receiving look/move
// input" rather than a real OS pointer grab.
export class PlayerController {
  constructor(camera, domElement, { colliders = [], bounds = null, spawn = new THREE.Vector3(0, 0, 3) } = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;
    this.bounds = bounds;
    this.speed = 3.4;
    this.playerRadius = 0.35;
    this.eyeHeight = 1.68;
    this.lookSpeed = 0.0032;
    this.pitchLimit = Math.PI / 2 - 0.05;

    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._locked = false;
    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this._lockListeners = [];
    this._unlockListeners = [];

    this.move = { forward: false, back: false, left: false, right: false };
    camera.position.set(spawn.x, this.eyeHeight, spawn.z);
    camera.rotation.order = 'YXZ';

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  get isLocked() {
    return this._locked;
  }

  lock() {
    if (this._locked) return;
    this._locked = true;
    this._lockListeners.forEach((fn) => fn());
  }

  unlock() {
    if (!this._locked) return;
    this._locked = false;
    this._dragging = false;
    this._unlockListeners.forEach((fn) => fn());
  }

  onLock(fn) { this._lockListeners.push(fn); }
  onUnlock(fn) { this._unlockListeners.push(fn); }

  _onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    this.lock();
    this._dragging = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    const dx = e.clientX - this._lastX;
    const dy = e.clientY - this._lastY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;

    this.euler.y -= dx * this.lookSpeed;
    this.euler.x -= dy * this.lookSpeed;
    this.euler.x = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  _onPointerUp() {
    this._dragging = false;
  }

  _onKeyDown(e) {
    if (e.code === 'Escape') { this.unlock(); return; }
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
    if (!this._locked) return;
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
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  }
}
