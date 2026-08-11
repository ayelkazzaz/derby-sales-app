import * as THREE from 'three';
import { t } from '../i18n.js';

// Center-screen raycast against a registry of invisible hitbox meshes.
// Each hitbox carries a { getPrompt, onInteract, enabled } descriptor.
export class InteractionSystem {
  constructor(camera, promptEl) {
    this.camera = camera;
    this.promptEl = promptEl;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3.2;
    this.entries = new Map();
    this.current = null;
  }

  register(hitboxMesh, { getPrompt, onInteract, enabled = () => true }) {
    this.entries.set(hitboxMesh, { getPrompt, onInteract, enabled });
    return hitboxMesh;
  }

  unregister(hitboxMesh) {
    this.entries.delete(hitboxMesh);
  }

  clear() {
    this.entries.clear();
    this.current = null;
  }

  update() {
    const candidates = [];
    for (const [mesh, entry] of this.entries) {
      if (mesh.visible !== false && entry.enabled()) candidates.push(mesh);
    }
    if (!candidates.length) {
      this._setPrompt(null);
      return;
    }
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const hits = this.raycaster.intersectObjects(candidates, false);
    if (hits.length) {
      const mesh = hits[0].object;
      this.current = mesh;
      const entry = this.entries.get(mesh);
      this._setPrompt(entry.getPrompt());
    } else {
      this._setPrompt(null);
    }
  }

  _setPrompt(text) {
    if (text) {
      this.promptEl.textContent = text;
      this.promptEl.classList.add('visible');
    } else {
      this.current = null;
      this.promptEl.classList.remove('visible');
    }
  }

  tryInteract() {
    if (!this.current) return false;
    const entry = this.entries.get(this.current);
    if (!entry || !entry.enabled()) return false;
    entry.onInteract();
    return true;
  }
}

export function defaultPrompt(key = 'prompt_interact') {
  return () => t(key);
}
