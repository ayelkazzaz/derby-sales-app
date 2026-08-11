import * as THREE from 'three';
import { PlayerController } from '../core/playerController.js';
import { defaultPrompt } from '../core/interactionSystem.js';
import { ScoreEngine } from '../core/scoreEngine.js';
import { createGround, createServiceVan, createCustomerCar, createTowelRack, makeHitbox, playAreaBounds } from '../core/propKit.js';

const DURATION = 170;

const TASKS = [
  { key: 'ppe', labelKey: 'task_ppe' },
  { key: 'protect_floor', labelKey: 'task_protect_floor' },
  { key: 'confirm_oil', labelKey: 'task_confirm_oil', requiresPrior: 'protect_floor' },
  { key: 'drain', labelKey: 'task_drain', requiresPrior: 'confirm_oil', hitsRequired: 2, tool: { type: 'tool', id: 'drain_pan' } },
  { key: 'filter', labelKey: 'task_filter', requiresPrior: 'drain', hitsRequired: 1, tool: { type: 'tool', id: 'filter' } },
  { key: 'refill', labelKey: 'task_refill', requiresPrior: 'filter', hitsRequired: 3, tool: { type: 'tool', id: 'oil_mobil1' } },
  { key: 'run_engine', labelKey: 'task_run_engine', requiresPrior: 'refill', hitsRequired: 1 },
  { key: 'leak_check', labelKey: 'task_leak_check', requiresPrior: 'run_engine', hitsRequired: 2 },
  { key: 'double_check', labelKey: 'task_double_check', requiresPrior: 'leak_check', hitsRequired: 1 },
  { key: 'cleanup', labelKey: 'task_cleanup', requiresPrior: 'double_check', hitsRequired: 2, tool: { type: 'towel', color: 'red' } },
];

export function createOilChangeScenario(ctx) {
  const { scene, camera, domElement, hud, interactionSystem, onFinish } = ctx;

  const scoreEngine = new ScoreEngine([
    { key: 'ppe_prep', labelKey: 'cat_ppe_prep', weight: 15, tipKey: 'tip_no_torn_gloves' },
    { key: 'procedure_order', labelKey: 'cat_procedure_order', weight: 20, tipKey: 'tip_first_time_right' },
    { key: 'correct_quantity', labelKey: 'cat_correct_quantity', weight: 20, tipKey: 'tip_correct_quantity' },
    { key: 'leak_doublecheck', labelKey: 'cat_leak_doublecheck', weight: 30, tipKey: 'tip_double_check' },
    { key: 'cleanliness_spill', labelKey: 'cat_cleanliness_spill', weight: 15, tipKey: 'tip_no_spill' },
  ]);

  const tasks = TASKS.map((t) => ({ ...t, done: false, hitsRemaining: t.hitsRequired || 1 }));
  const state = { heldItem: null, ppeChecked: false, wrongOrderMistakes: 0, finished: false };
  let timeLeft = DURATION;

  // ---- Environment ----
  scene.add(createGround(30));

  const van = createServiceVan();
  van.position.set(-3.4, 0, -3.5);
  van.rotation.y = Math.PI * 0.15;
  scene.add(van);

  const car = createCustomerCar({ doorsOpen: false, paintHex: '#5a616b' });
  car.position.set(0, 0, -2.5);
  scene.add(car);
  car.updateMatrixWorld(true);

  const enginePos = car.position.clone().add(new THREE.Vector3(0, 0.85, 1.75));
  const undersidePos = car.position.clone().add(new THREE.Vector3(0, 0.25, 0.2));
  const ignitionPos = car.position.clone().add(new THREE.Vector3(-0.95, 1.0, 0.35));

  const ppeBox = simpleProp([-3.6, 0, -1.4], 0.5, '#f2a33c');
  scene.add(ppeBox);

  const panelGroup = new THREE.Group();
  panelGroup.position.set(-2.7, 0, -1.6);
  const panelPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), new THREE.MeshStandardMaterial({ color: '#3d4148' }));
  panelPost.position.y = 0.5;
  const panelBoard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.04), new THREE.MeshStandardMaterial({ color: '#eef3f8', roughness: 0.6 }));
  panelBoard.position.set(0, 1.0, 0);
  panelGroup.add(panelPost, panelBoard);
  scene.add(panelGroup);

  const dripMat = simpleProp([-2.7, 0, -0.6], 0.45, '#2f6fe0', 0.05);
  scene.add(dripMat);

  const drainPanGroup = simpleProp([-2.6, 0, 0.2], 0.4, '#1b1c1f');
  scene.add(drainPanGroup);

  const filterGroup = simpleProp([-2.6, 0, 1.0], 0.3, '#c9cdd2');
  scene.add(filterGroup);

  const jugMobil = simpleProp([-2.6, 0, 1.8], 0.35, '#2f6fe0');
  scene.add(jugMobil);
  const jugGeneric = simpleProp([-1.9, 0, 1.8], 0.35, '#d1483f');
  scene.add(jugGeneric);

  const radioGroup = simpleProp([-3.6, 0, 0.6], 0.3, '#3d4148');
  scene.add(radioGroup);

  const rackDef = createTowelRack(['red', 'blue'], [-3.6, 0, 1.6]);
  scene.add(rackDef.group);
  rackDef.group.updateMatrixWorld(true);

  function simpleProp(position, height, hex, radius = 0.16) {
    const group = new THREE.Group();
    group.position.set(...position);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(radius * 2, height, radius * 2), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.15 }));
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }

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

  reg(makeHitbox([0.6, 0.5, 0.6], [dripMat.position.x, 0.2, dripMat.position.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => completeTask('protect_floor'),
  });

  reg(makeHitbox([0.6, 0.9, 0.4], [panelGroup.position.x, 0.5, panelGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => completeTask('confirm_oil'),
  });

  reg(makeHitbox([0.4, 0.5, 0.4], [drainPanGroup.position.x, 0.2, drainPanGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_pick_up'),
    onInteract: () => { state.heldItem = { type: 'tool', id: 'drain_pan' }; refreshHeld(); },
  });

  reg(makeHitbox([0.35, 0.4, 0.35], [filterGroup.position.x, 0.15, filterGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_pick_up'),
    onInteract: () => { state.heldItem = { type: 'tool', id: 'filter' }; refreshHeld(); },
  });

  reg(makeHitbox([0.4, 0.5, 0.4], [jugMobil.position.x, 0.2, jugMobil.position.z]), {
    getPrompt: defaultPrompt('prompt_pick_up'),
    onInteract: () => { state.heldItem = { type: 'tool', id: 'oil_mobil1' }; refreshHeld(); },
  });

  reg(makeHitbox([0.4, 0.5, 0.4], [jugGeneric.position.x, 0.2, jugGeneric.position.z]), {
    getPrompt: defaultPrompt('prompt_pick_up'),
    onInteract: () => { state.heldItem = { type: 'tool', id: 'oil_generic' }; refreshHeld(); },
  });

  reg(makeHitbox([0.4, 0.4, 0.4], [radioGroup.position.x, 0.2, radioGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptTaskHit('double_check'),
  });

  rackDef.towels.forEach((towelMesh) => {
    const worldPos = new THREE.Vector3();
    towelMesh.getWorldPosition(worldPos);
    reg(makeHitbox([0.3, 0.25, 0.3], [worldPos.x, worldPos.y, worldPos.z]), {
      getPrompt: defaultPrompt('prompt_pick_up'),
      onInteract: () => { state.heldItem = { type: 'towel', color: towelMesh.userData.colorKey }; refreshHeld(); },
    });
  });

  reg(makeHitbox([1.2, 0.9, 0.9], [enginePos.x, enginePos.y, enginePos.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptZoneAction(['drain', 'filter', 'refill', 'cleanup']),
  });

  reg(makeHitbox([1.4, 0.4, 2.0], [undersidePos.x, undersidePos.y, undersidePos.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptTaskHit('leak_check'),
  });

  reg(makeHitbox([0.4, 0.4, 0.4], [ignitionPos.x, ignitionPos.y, ignitionPos.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptTaskHit('run_engine'),
  });

  function taskFor(key) { return tasks.find((t) => t.key === key); }

  function attemptZoneAction(candidateKeys) {
    const active = candidateKeys.map(taskFor).find((t) => t && !t.done);
    if (active) attemptTaskHit(active.key);
  }

  function attemptTaskHit(key) {
    const task = taskFor(key);
    if (!task || task.done) return;

    if (task.requiresPrior && !taskFor(task.requiresPrior)?.done) {
      state.wrongOrderMistakes += 1;
      scoreEngine.penalize('procedure_order', 12);
      return;
    }

    if (task.tool) {
      const holding = state.heldItem;
      const matches = holding && holding.type === task.tool.type &&
        (task.tool.type === 'tool' ? holding.id === task.tool.id : holding.color === task.tool.color);
      if (!matches) {
        if (key === 'refill') scoreEngine.penalize('correct_quantity', 15);
        else if (key === 'cleanup') scoreEngine.penalize('cleanliness_spill', 12);
        else scoreEngine.penalize('procedure_order', 10);
        return;
      }
    }

    task.hitsRemaining -= 1;
    if (task.hitsRemaining <= 0) completeTask(key);
    else refreshTasks();
  }

  function completeTask(key) {
    const task = taskFor(key);
    if (!task) return;
    task.done = true;
    task.hitsRemaining = 0;
    refreshTasks();
    if (tasks.every((t) => t.done)) finish();
  }

  function refreshHeld() {
    if (!state.heldItem) { hud.setHeld(null); return; }
    if (state.heldItem.type === 'tool') {
      const toolLabels = { drain_pan: 'tool_drain_pan', filter: 'tool_new_filter', oil_mobil1: 'tool_oil_jug_correct', oil_generic: 'tool_oil_jug_generic' };
      hud.setHeld(toolLabels[state.heldItem.id] || 'hud_held');
    } else {
      hud.setHeld(`towel_${state.heldItem.color}`);
    }
  }

  function refreshTasks() {
    let currentAssigned = false;
    hud.setTasks(tasks.map((t) => {
      let taskState = 'pending';
      if (t.done) taskState = 'done';
      else if (!currentAssigned) { taskState = 'current'; currentAssigned = true; }
      return { key: t.key, labelKey: t.labelKey, state: taskState };
    }));
  }

  function finalizeScoring() {
    scoreEngine.setValue('ppe_prep', state.ppeChecked ? 100 : 40);
    if (!taskFor('protect_floor').done) scoreEngine.penalize('ppe_prep', 30);

    if (!taskFor('refill').done) scoreEngine.penalize('correct_quantity', 40);

    const leakDone = taskFor('leak_check').done;
    const doubleDone = taskFor('double_check').done;
    if (!leakDone || !doubleDone) {
      scoreEngine.setValue('leak_doublecheck', 20);
      scoreEngine.addCriticalBreach('tip_double_check');
    } else {
      scoreEngine.setValue('leak_doublecheck', 100);
    }

    if (!taskFor('cleanup').done) scoreEngine.penalize('cleanliness_spill', 35);

    const incompleteCount = tasks.filter((t) => !t.done).length;
    if (incompleteCount > 0) scoreEngine.penalize('procedure_order', incompleteCount * 8);
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
