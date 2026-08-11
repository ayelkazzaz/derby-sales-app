import * as THREE from 'three';
import { t, translateDOM, applyDocumentDirection, onLangChange, toggleLang } from './i18n.js';
import { HUD } from './core/hud.js';
import { InteractionSystem } from './core/interactionSystem.js';
import { setupLighting } from './core/propKit.js';
import { createExteriorWashScenario } from './scenarios/exteriorWash.js';
import { createInteriorDetailScenario } from './scenarios/interiorDetail.js';
import { createOilChangeScenario } from './scenarios/oilChange.js';

const SCENARIOS = [
  { id: 'exterior', titleKey: 'scenario_exterior_title', descKey: 'scenario_exterior_desc', icon: '🧽', factory: createExteriorWashScenario, locked: false },
  { id: 'interior', titleKey: 'scenario_interior_title', descKey: 'scenario_interior_desc', icon: '🧹', factory: createInteriorDetailScenario, locked: false },
  { id: 'oil', titleKey: 'scenario_oil_title', descKey: 'scenario_oil_desc', icon: '🛢️', factory: createOilChangeScenario, locked: false },
  { id: 'full', titleKey: 'scenario_full_title', descKey: 'scenario_full_desc', icon: '🚐', factory: null, locked: true },
];

applyDocumentDirection();

const screens = {
  menu: document.getElementById('screen-menu'),
  game: document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
};
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('active', key === name));
}

const canvasContainer = document.getElementById('game-canvas-container');
const loadingVeil = document.getElementById('loading-veil');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvasContainer.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
const hud = new HUD();
const interactionSystem = new InteractionSystem(camera, document.getElementById('interact-prompt'));
const clock = new THREE.Clock();

let scene = null;
let activeScenario = null;
let animHandle = null;
let currentDef = null;
let resultDef = null;
let resultScoreEngine = null;

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

function animate() {
  animHandle = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  activeScenario?.playerController?.update(dt);
  interactionSystem.update();
  activeScenario?.update(dt);
  if (scene) renderer.render(scene, camera);
}

function stopLoop() {
  if (animHandle) cancelAnimationFrame(animHandle);
  animHandle = null;
}

function finishScenario(scoreEngine) {
  stopLoop();
  activeScenario?.playerController?.unlock();
  resultDef = currentDef;
  resultScoreEngine = scoreEngine;
  populateResultScreen(resultDef, resultScoreEngine);
  showScreen('result');
}

function startScenario(def) {
  if (!def.factory) return;
  loadingVeil.classList.remove('hidden');
  showScreen('game');

  if (activeScenario) {
    activeScenario.dispose?.();
    activeScenario = null;
  }
  interactionSystem.clear();

  scene = new THREE.Scene();
  setupLighting(scene, renderer);

  currentDef = def;
  activeScenario = def.factory({
    THREE,
    scene,
    camera,
    renderer,
    domElement: renderer.domElement,
    hud,
    interactionSystem,
    onFinish: finishScenario,
  });

  activeScenario.playerController.onLock(() => hud.setPaused(false));
  activeScenario.playerController.onUnlock(() => hud.setPaused(true));

  hud.retranslateStatic();
  hud.setPaused(true);

  requestAnimationFrame(() => loadingVeil.classList.add('hidden'));
  clock.getDelta();
  stopLoop();
  animate();
}

function abortToMenu() {
  stopLoop();
  activeScenario?.playerController?.unlock();
  activeScenario?.dispose?.();
  activeScenario = null;
  scene = null;
  showScreen('menu');
}

// ---- Menu construction (built once; re-translated on language change) ----
function buildMenu() {
  const grid = document.getElementById('scenario-grid');
  grid.innerHTML = '';
  SCENARIOS.forEach((def) => {
    const card = document.createElement('div');
    card.className = 'scenario-card' + (def.locked ? ' locked' : '');

    if (def.locked) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.setAttribute('data-i18n', 'menu_locked');
      card.appendChild(badge);
    }

    const icon = document.createElement('div');
    icon.className = 'card-icon';
    icon.textContent = def.icon;

    const title = document.createElement('div');
    title.className = 'card-title';
    title.setAttribute('data-i18n', def.titleKey);

    const desc = document.createElement('div');
    desc.className = 'card-desc';
    desc.setAttribute('data-i18n', def.descKey);

    const btn = document.createElement('button');
    btn.className = 'card-play';
    btn.setAttribute('data-i18n', def.locked ? 'menu_locked' : 'menu_play');
    if (def.locked) {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => startScenario(def));
    }

    card.append(icon, title, desc, btn);
    grid.appendChild(card);
  });
  translateDOM(grid);
}

function populateResultScreen(def, scoreEngine) {
  const score = scoreEngine.computeFinalScore();
  const pass = scoreEngine.isPass();

  document.getElementById('result-score').textContent = `${score}%`;

  const banner = document.getElementById('result-banner');
  banner.textContent = pass ? t('result_pass') : t('result_fail');
  banner.className = 'result-banner ' + (pass ? 'pass' : 'fail');

  const critTag = document.getElementById('result-critical-tag');
  if (scoreEngine.hasCriticalBreach()) {
    critTag.style.display = 'block';
    critTag.textContent = t('result_critical');
  } else {
    critTag.style.display = 'none';
  }

  const breakdownEl = document.getElementById('result-breakdown');
  breakdownEl.innerHTML = '';
  scoreEngine.getBreakdown().forEach((cat) => {
    const row = document.createElement('div');
    row.className = 'result-row';
    const labels = document.createElement('div');
    labels.className = 'row-labels';
    const name = document.createElement('span');
    name.textContent = t(cat.labelKey);
    const val = document.createElement('b');
    val.textContent = `${Math.round(cat.value)}%`;
    labels.append(name, val);
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill' + (cat.value < 60 ? ' low' : cat.value < 85 ? ' mid' : '');
    fill.style.width = `${cat.value}%`;
    track.appendChild(fill);
    row.append(labels, track);
    breakdownEl.appendChild(row);
  });

  const tipBox = document.getElementById('result-tip');
  const tipText = document.getElementById('result-tip-text');
  if (!pass) {
    const worst = scoreEngine.getWorstCategory();
    tipBox.style.display = 'block';
    tipText.textContent = t(worst?.tipKey || 'tip_no_one_watches');
  } else {
    tipBox.style.display = 'none';
  }

  const nextBtn = document.getElementById('result-next-btn');
  const currentIndex = SCENARIOS.findIndex((s) => s.id === def.id);
  const next = SCENARIOS.slice(currentIndex + 1).find((s) => !s.locked);
  nextBtn.style.display = next ? 'inline-block' : 'none';
  nextBtn.onclick = () => next && startScenario(next);
}

// ---- Global wiring ----
document.getElementById('lang-toggle-btn').addEventListener('click', () => toggleLang());
onLangChange(() => {
  translateDOM(document);
  if (resultDef && resultScoreEngine && screens.result.classList.contains('active')) {
    populateResultScreen(resultDef, resultScoreEngine);
  }
});

document.getElementById('hud-menu-btn').addEventListener('click', abortToMenu);
document.getElementById('result-menu-btn').addEventListener('click', () => showScreen('menu'));
document.getElementById('result-retry-btn').addEventListener('click', () => resultDef && startScenario(resultDef));
document.getElementById('result-share-btn').addEventListener('click', async () => {
  if (!resultDef || !resultScoreEngine) return;
  const score = resultScoreEngine.computeFinalScore();
  const status = resultScoreEngine.isPass() ? t('result_pass') : t('result_fail');
  const text = `${t('brand_name')} — ${t(resultDef.titleKey)}: ${score}% (${status})`;
  const btn = document.getElementById('result-share-btn');
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = t('result_shared');
  } catch (err) {
    console.warn('[main] clipboard write failed', err);
  }
  setTimeout(() => { btn.textContent = original; }, 1500);
});

canvasContainer.addEventListener('click', () => {
  if (activeScenario?.playerController && !activeScenario.playerController.isLocked) {
    activeScenario.playerController.lock();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE' && activeScenario?.playerController?.isLocked) {
    interactionSystem.tryInteract();
  }
});

buildMenu();
showScreen('menu');
loadingVeil.classList.add('hidden');
