import * as THREE from 'three';
import { PlayerController } from '../core/playerController.js';
import { defaultPrompt } from '../core/interactionSystem.js';
import { ScoreEngine } from '../core/scoreEngine.js';
import { createGround, createServiceVan, createCustomerCar, createTowelRack, makeHitbox, playAreaBounds } from '../core/propKit.js';

const DURATION = 150; // seconds
const HOSE_IDEAL_SECONDS = 22;
const HOSE_PENALTY_PER_SECOND = 2.2;

const TASKS = [
  { key: 'ppe', labelKey: 'task_ppe', requiresPrior: null },
  { key: 'prerinse', labelKey: 'task_prerinse', requiresPrior: null, tool: { type: 'tool', id: 'hose' }, hitsRequired: 2 },
  { key: 'foam', labelKey: 'task_foam', requiresPrior: 'prerinse', tool: { type: 'tool', id: 'foam_gun' }, hitsRequired: 2 },
  { key: 'wash_body', labelKey: 'task_wash_body', requiresPrior: 'foam', tool: { type: 'towel', color: 'yellow' }, hitsRequired: 3 },
  { key: 'wash_wheels', labelKey: 'task_wash_wheels', requiresPrior: 'foam', tool: { type: 'towel', color: 'gray' }, hitsRequired: 4 },
  { key: 'rinse', labelKey: 'task_rinse', requiresPrior: 'wash_wheels', tool: { type: 'tool', id: 'hose' }, hitsRequired: 2 },
  { key: 'dry', labelKey: 'task_dry', requiresPrior: 'rinse', tool: { type: 'towel', color: 'white' }, hitsRequired: 3 },
];

export function createExteriorWashScenario(ctx) {
  const { scene, camera, domElement, hud, interactionSystem, onFinish } = ctx;

  const scoreEngine = new ScoreEngine([
    { key: 'technique_order', labelKey: 'cat_technique_order', weight: 25, tipKey: 'tip_first_time_right' },
    { key: 'towel_discipline', labelKey: 'cat_towel_discipline', weight: 25, tipKey: 'tip_towel_stays_in_zone' },
    { key: 'water_efficiency', labelKey: 'cat_water_efficiency', weight: 20, tipKey: 'tip_water_discipline' },
    { key: 'final_qc', labelKey: 'cat_final_qc', weight: 20, tipKey: 'tip_first_time_right' },
    { key: 'safety_ppe', labelKey: 'cat_safety_ppe', weight: 10, tipKey: 'tip_no_torn_gloves' },
  ]);

  const tasks = TASKS.map((t) => ({ ...t, done: false, hitsRemaining: t.hitsRequired || 1 }));
  const state = { heldItem: null, ppeChecked: false, hoseEquippedSeconds: 0, wrongToolMistakes: 0, wrongOrderMistakes: 0, finished: false };
  let timeLeft = DURATION;

  // ---- Environment ----
  const ground = createGround(30);
  scene.add(ground);

  const van = createServiceVan();
  van.position.set(-3.4, 0, -3.5);
  van.rotation.y = Math.PI * 0.15;
  scene.add(van);

  const car = createCustomerCar({ doorsOpen: false, paintHex: '#c23b3b' });
  car.position.set(0, 0, -2.5);
  scene.add(car);
  car.updateMatrixWorld(true);

  const rackDef = createTowelRack(['yellow', 'blue', 'green', 'gray', 'red', 'white'], [2.6, 0, 0.4]);
  rackDef.group.rotation.y = -Math.PI / 3;
  scene.add(rackDef.group);
  rackDef.group.updateMatrixWorld(true);

  const hoseReelGroup = new THREE.Group();
  hoseReelGroup.position.set(-2.6, 0, 1.0);
  const reelPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10), new THREE.MeshStandardMaterial({ color: '#3d4148', roughness: 0.6 }));
  reelPost.position.y = 0.5;
  const reelDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 20), new THREE.MeshStandardMaterial({ color: '#2f6fe0', roughness: 0.5 }));
  reelDisc.rotation.z = Math.PI / 2;
  reelDisc.position.set(0, 0.85, 0);
  hoseReelGroup.add(reelPost, reelDisc);
  scene.add(hoseReelGroup);

  const foamGunGroup = new THREE.Group();
  foamGunGroup.position.set(-2.6, 0, 2.0);
  const foamStand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 10), new THREE.MeshStandardMaterial({ color: '#5b5b5b', roughness: 0.6 }));
  foamStand.position.y = 0.45;
  const foamBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.4, 14), new THREE.MeshStandardMaterial({ color: '#f2c53d', roughness: 0.4 }));
  foamBottle.position.set(0, 0.95, 0);
  foamGunGroup.add(foamStand, foamBottle);
  scene.add(foamGunGroup);

  const ppeBox = new THREE.Group();
  ppeBox.position.set(-3.6, 0, -1.4);
  const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: '#f2a33c', roughness: 0.7 }));
  boxMesh.position.y = 0.18;
  ppeBox.add(boxMesh);
  scene.add(ppeBox);

  const colliders = [van.userData.footprint.clone().translate(van.position), car.userData.footprint.clone().translate(car.position)];
  const playerController = new PlayerController(camera, domElement, { colliders, bounds: playAreaBounds(6, 6), spawn: new THREE.Vector3(0, 0, 2.5) });

  // ---- Interaction registration ----
  const registered = [];
  function reg(mesh, opts) {
    interactionSystem.register(mesh, opts);
    registered.push(mesh);
  }

  reg(makeHitbox([0.7, 0.7, 0.7], [ppeBox.position.x, 0.3, ppeBox.position.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => { state.ppeChecked = true; completeTask('ppe'); },
  });

  reg(makeHitbox([0.5, 1.2, 0.5], [hoseReelGroup.position.x, 0.5, hoseReelGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_pick_up'),
    onInteract: () => { state.heldItem = { type: 'tool', id: 'hose' }; refreshHeld(); },
  });

  reg(makeHitbox([0.4, 1.1, 0.4], [foamGunGroup.position.x, 0.5, foamGunGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_pick_up'),
    onInteract: () => { state.heldItem = { type: 'tool', id: 'foam_gun' }; refreshHeld(); },
  });

  rackDef.towels.forEach((towelMesh, i) => {
    const worldPos = new THREE.Vector3();
    towelMesh.getWorldPosition(worldPos);
    reg(makeHitbox([0.3, 0.25, 0.3], [worldPos.x, worldPos.y, worldPos.z]), {
      getPrompt: defaultPrompt('prompt_pick_up'),
      onInteract: () => { state.heldItem = { type: 'towel', color: towelMesh.userData.colorKey }; refreshHeld(); },
    });
  });

  // Body / rinse / dry share one central hitbox on the car's flank.
  const bodyHitbox = makeHitbox([1.6, 1.2, 1.2], [car.position.x, 0.9, car.position.z + 1.3]);
  reg(bodyHitbox, {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptZoneAction(['prerinse', 'foam', 'wash_body', 'rinse', 'dry']),
  });

  Object.entries(car.userData.wheels).forEach(([wheelKey, wheelMesh]) => {
    const worldPos = new THREE.Vector3();
    wheelMesh.getWorldPosition(worldPos);
    const hb = makeHitbox([0.5, 0.5, 0.5], [worldPos.x, worldPos.y, worldPos.z]);
    hb.userData.wheelDone = false;
    reg(hb, {
      getPrompt: defaultPrompt('prompt_use'),
      enabled: () => !hb.userData.wheelDone,
      onInteract: () => {
        const result = attemptTaskHit('wash_wheels');
        if (result === 'ok-progress' || result === 'ok-complete') hb.userData.wheelDone = true;
      },
    });
  });

  function currentTaskFor(key) {
    return tasks.find((t) => t.key === key);
  }

  // Returns which of the given candidate task keys is "active" right now (first not-done, in TASKS order).
  function attemptZoneAction(candidateKeys) {
    const active = candidateKeys.map((k) => currentTaskFor(k)).find((t) => t && !t.done);
    if (!active) return;
    attemptTaskHit(active.key);
  }

  function attemptTaskHit(key) {
    const task = currentTaskFor(key);
    if (!task || task.done) return 'noop';

    if (task.requiresPrior && !currentTaskFor(task.requiresPrior)?.done) {
      state.wrongOrderMistakes += 1;
      scoreEngine.penalize('technique_order', 12);
      refreshTasks();
      return 'wrong-order';
    }

    const holding = state.heldItem;
    const matches = holding && task.tool && holding.type === task.tool.type &&
      (task.tool.type === 'tool' ? holding.id === task.tool.id : holding.color === task.tool.color);

    if (!matches) {
      state.wrongToolMistakes += 1;
      scoreEngine.penalize('towel_discipline', 10);
      scoreEngine.penalize('final_qc', 4);
      refreshTasks();
      return 'wrong-tool';
    }

    task.hitsRemaining -= 1;
    if (task.hitsRemaining <= 0) {
      completeTask(key);
      return 'ok-complete';
    }
    refreshTasks();
    return 'ok-progress';
  }

  function completeTask(key) {
    const task = currentTaskFor(key);
    if (!task) return;
    task.done = true;
    task.hitsRemaining = 0;
    refreshTasks();
    maybeAutoFinish();
  }

  function maybeAutoFinish() {
    if (tasks.every((t) => t.done)) finish();
  }

  function refreshHeld() {
    if (!state.heldItem) { hud.setHeld(null); return; }
    if (state.heldItem.type === 'tool') {
      hud.setHeld(state.heldItem.id === 'hose' ? 'tool_hose' : 'tool_foam_gun');
    } else {
      hud.setHeld(`towel_${state.heldItem.color}`);
    }
  }

  function refreshTasks() {
    let currentAssigned = false;
    const view = tasks.map((t) => {
      let taskState = 'pending';
      if (t.done) taskState = 'done';
      else if (!currentAssigned) { taskState = 'current'; currentAssigned = true; }
      return { key: t.key, labelKey: t.labelKey, state: taskState };
    });
    hud.setTasks(view);
  }

  function finalizeScoring() {
    scoreEngine.setValue('safety_ppe', state.ppeChecked ? 100 : 40);

    const efficiencyPenalty = Math.max(0, state.hoseEquippedSeconds - HOSE_IDEAL_SECONDS) * HOSE_PENALTY_PER_SECOND;
    scoreEngine.setValue('water_efficiency', 100 - efficiencyPenalty);

    const incompleteCore = tasks.filter((t) => t.key !== 'ppe' && !t.done).length;
    if (incompleteCore > 0) {
      scoreEngine.penalize('technique_order', incompleteCore * 10);
      scoreEngine.penalize('final_qc', incompleteCore * 12);
    }
  }

  function finish() {
    if (state.finished) return;
    state.finished = true;
    finalizeScoring();
    onFinish(scoreEngine);
  }

  refreshHeld();
  refreshTasks();
  hud.setTime(timeLeft);
  hud.setScore(scoreEngine.computeFinalScore());

  return {
    playerController,
    update(dt) {
      if (state.finished || !playerController.isLocked) return;
      timeLeft -= dt;
      if (state.heldItem?.type === 'tool' && (state.heldItem.id === 'hose')) {
        state.hoseEquippedSeconds += dt;
      }
      hud.setTime(timeLeft);
      hud.setScore(scoreEngine.computeFinalScore());
      if (timeLeft <= 0) finish();
    },
    dispose() {
      registered.forEach((mesh) => interactionSystem.unregister(mesh));
      playerController.dispose();
    },
  };
}
