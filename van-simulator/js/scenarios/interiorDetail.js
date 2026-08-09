import * as THREE from 'three';
import { PlayerController } from '../core/playerController.js';
import { defaultPrompt } from '../core/interactionSystem.js';
import { ScoreEngine } from '../core/scoreEngine.js';
import { createGround, createServiceVan, createCustomerCar, createTowelRack, createFabricTextureMesh, makeHitbox, playAreaBounds } from '../core/propKit.js';

const DURATION = 150;

export function createInteriorDetailScenario(ctx) {
  const { scene, camera, domElement, hud, interactionSystem, onFinish } = ctx;

  const scoreEngine = new ScoreEngine([
    { key: 'mats_first', labelKey: 'cat_mats_first', weight: 25, tipKey: 'tip_mats_first' },
    { key: 'towel_discipline', labelKey: 'cat_towel_discipline', weight: 20, tipKey: 'tip_towel_stays_in_zone' },
    { key: 'cleaning_thoroughness', labelKey: 'cat_cleaning_thoroughness', weight: 25, tipKey: 'tip_no_one_watches' },
    { key: 'glass_qc', labelKey: 'cat_glass_qc', weight: 20, tipKey: 'tip_no_streaks' },
    { key: 'safety_ppe', labelKey: 'cat_safety_ppe', weight: 10, tipKey: 'tip_no_torn_gloves' },
  ]);

  const tasks = [
    { key: 'ppe', labelKey: 'task_ppe', done: false },
    { key: 'mats_out', labelKey: 'task_mats_out', done: false },
    { key: 'vacuum', labelKey: 'task_vacuum', done: false, hitsRemaining: 3, requiresPrior: 'mats_out', tool: { type: 'tool', id: 'vacuum' } },
    { key: 'dashboard', labelKey: 'task_dashboard', done: false, hitsRemaining: 2, requiresPrior: 'mats_out', tool: { type: 'towel', color: 'blue' } },
    { key: 'glass', labelKey: 'task_glass', done: false, hitsRemaining: 3, requiresPrior: 'mats_out', tool: { type: 'towel', color: 'green' } },
    { key: 'mats_return', labelKey: 'task_mats_return', done: false },
  ];

  const state = { heldItem: null, ppeChecked: false, matsLocation: 'car', finished: false, matsOrderViolations: 0 };
  let timeLeft = DURATION;

  // ---- Environment ----
  scene.add(createGround(30));

  const van = createServiceVan();
  van.position.set(-3.4, 0, -3.5);
  van.rotation.y = Math.PI * 0.15;
  scene.add(van);

  const car = createCustomerCar({ doorsOpen: true, paintHex: '#2f6fe0' });
  car.position.set(0, 0, -2.5);
  scene.add(car);
  car.updateMatrixWorld(true);

  const floorPos = car.position.clone().add(car.userData.floorPosition);
  const matsPos = floorPos.clone().add(new THREE.Vector3(0, 0, 0.75));
  const dashboardPos = car.position.clone().add(car.userData.dashboardPosition);
  const glassPos = car.position.clone().add(car.userData.interiorGlassPosition);

  const matMesh = createFabricTextureMesh('#2a2a2a', [0.55, 0.02, 0.45]);
  matMesh.position.copy(matsPos);
  scene.add(matMesh);

  const matsRackGroup = new THREE.Group();
  matsRackGroup.position.set(-2.6, 0, 0.6);
  const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.06), new THREE.MeshStandardMaterial({ color: '#5b5b5b', roughness: 0.6, metalness: 0.4 }));
  rackFrame.position.y = 0.55;
  matsRackGroup.add(rackFrame);
  scene.add(matsRackGroup);

  const rackDef = createTowelRack(['blue', 'green', 'yellow', 'red'], [2.6, 0, 0.4]);
  rackDef.group.rotation.y = -Math.PI / 3;
  scene.add(rackDef.group);
  rackDef.group.updateMatrixWorld(true);

  const vacuumGroup = new THREE.Group();
  vacuumGroup.position.set(-2.6, 0, 1.7);
  const vacBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.5, 14), new THREE.MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.5, metalness: 0.3 }));
  vacBody.position.y = 0.3;
  const vacHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), new THREE.MeshStandardMaterial({ color: '#3a3a3a' }));
  vacHandle.position.set(0, 0.8, 0);
  vacuumGroup.add(vacBody, vacHandle);
  scene.add(vacuumGroup);

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

  reg(makeHitbox([0.5, 1.0, 0.5], [vacuumGroup.position.x, 0.5, vacuumGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_pick_up'),
    onInteract: () => { state.heldItem = { type: 'tool', id: 'vacuum' }; refreshHeld(); },
  });

  rackDef.towels.forEach((towelMesh) => {
    const worldPos = new THREE.Vector3();
    towelMesh.getWorldPosition(worldPos);
    reg(makeHitbox([0.3, 0.25, 0.3], [worldPos.x, worldPos.y, worldPos.z]), {
      getPrompt: defaultPrompt('prompt_pick_up'),
      onInteract: () => { state.heldItem = { type: 'towel', color: towelMesh.userData.colorKey }; refreshHeld(); },
    });
  });

  // Mats spot inside the car — pick up first, place back last.
  reg(makeHitbox([0.6, 0.4, 0.6], [matsPos.x, matsPos.y, matsPos.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: handleMatsSpotInteract,
  });

  // Mats rack — hang mats after pulling them, pick them back up before returning.
  reg(makeHitbox([0.6, 1.0, 0.4], [matsRackGroup.position.x, 0.5, matsRackGroup.position.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: handleRackInteract,
  });

  reg(makeHitbox([0.6, 0.5, 0.6], [floorPos.x, floorPos.y, floorPos.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptTaskHit('vacuum'),
  });

  reg(makeHitbox([0.7, 0.4, 0.7], [dashboardPos.x, dashboardPos.y, dashboardPos.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptTaskHit('dashboard'),
  });

  reg(makeHitbox([0.4, 0.6, 0.7], [glassPos.x, glassPos.y, glassPos.z]), {
    getPrompt: defaultPrompt('prompt_use'),
    onInteract: () => attemptTaskHit('glass'),
  });

  function taskFor(key) { return tasks.find((t) => t.key === key); }

  function handleMatsSpotInteract() {
    if (state.matsLocation === 'car' && !state.heldItem) {
      state.matsLocation = 'held';
      state.heldItem = { type: 'mats' };
      matMesh.visible = false;
      refreshHeld();
      return;
    }
    if (state.matsLocation === 'held_again' && state.heldItem?.type === 'mats') {
      const cleaningDone = taskFor('vacuum').done && taskFor('dashboard').done && taskFor('glass').done;
      if (!cleaningDone) {
        scoreEngine.penalize('mats_first', 15);
        return;
      }
      state.matsLocation = 'car';
      state.heldItem = null;
      matMesh.visible = true;
      matMesh.position.copy(matsPos);
      refreshHeld();
      completeTask('mats_return');
    }
  }

  function handleRackInteract() {
    if (state.matsLocation === 'held' && state.heldItem?.type === 'mats') {
      state.matsLocation = 'on_rack';
      state.heldItem = null;
      matMesh.visible = true;
      matMesh.position.set(matsRackGroup.position.x, 0.55, matsRackGroup.position.z + 0.05);
      matMesh.rotation.x = -Math.PI / 2.4;
      refreshHeld();
      completeTask('mats_out');
      return;
    }
    if (state.matsLocation === 'on_rack' && !state.heldItem) {
      state.matsLocation = 'held_again';
      state.heldItem = { type: 'mats' };
      matMesh.visible = false;
      matMesh.rotation.x = 0;
      refreshHeld();
    }
  }

  function attemptTaskHit(key) {
    const task = taskFor(key);
    if (!task || task.done) return;

    if (task.requiresPrior && !taskFor(task.requiresPrior)?.done) {
      state.matsOrderViolations += 1;
      scoreEngine.penalize('mats_first', 20);
      return;
    }

    const holding = state.heldItem;
    const matches = holding && task.tool && holding.type === task.tool.type &&
      (task.tool.type === 'tool' ? holding.id === task.tool.id : holding.color === task.tool.color);

    if (!matches) {
      if (task.tool.type === 'tool') scoreEngine.penalize('cleaning_thoroughness', 8);
      else if (key === 'glass') scoreEngine.penalize('glass_qc', 12);
      else scoreEngine.penalize('towel_discipline', 10);
      return;
    }

    task.hitsRemaining -= 1;
    if (task.hitsRemaining <= 0) completeTask(key);
    else refreshTasks();
  }

  function completeTask(key) {
    const task = taskFor(key);
    if (!task) return;
    task.done = true;
    refreshTasks();
    if (tasks.every((t) => t.done)) finish();
  }

  function refreshHeld() {
    if (!state.heldItem) { hud.setHeld(null); return; }
    if (state.heldItem.type === 'tool') hud.setHeld('tool_vacuum');
    else if (state.heldItem.type === 'mats') hud.setHeld('task_mats_out');
    else hud.setHeld(`towel_${state.heldItem.color}`);
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
    scoreEngine.setValue('safety_ppe', state.ppeChecked ? 100 : 40);
    scoreEngine.penalize('mats_first', state.matsOrderViolations * 5);

    const incomplete = tasks.filter((t) => !t.done);
    incomplete.forEach((t) => {
      if (t.key === 'mats_out' || t.key === 'mats_return') scoreEngine.penalize('mats_first', 20);
      if (t.key === 'vacuum') scoreEngine.penalize('cleaning_thoroughness', 25);
      if (t.key === 'dashboard') scoreEngine.penalize('cleaning_thoroughness', 15);
      if (t.key === 'glass') scoreEngine.penalize('glass_qc', 30);
    });
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
