import { t, translateDOM } from '../i18n.js';

// Thin DOM-updating wrapper around the HUD markup already present in index.html.
export class HUD {
  constructor() {
    this.timeEl = document.getElementById('hud-time-value');
    this.timeStatEl = document.getElementById('hud-time-stat');
    this.scoreEl = document.getElementById('hud-score-value');
    this.taskListEl = document.getElementById('hud-task-list');
    this.heldEl = document.getElementById('hud-held-value');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.root = document.getElementById('hud');
  }

  setTime(secondsLeft) {
    const clamped = Math.max(0, secondsLeft);
    const m = Math.floor(clamped / 60);
    const s = Math.floor(clamped % 60);
    this.timeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    this.timeStatEl.classList.toggle('time-warn', clamped <= 30 && clamped > 10);
    this.timeStatEl.classList.toggle('time-critical', clamped <= 10);
  }

  setScore(pct) {
    this.scoreEl.textContent = `${Math.round(pct)}%`;
  }

  setHeld(labelKey) {
    this.heldEl.textContent = labelKey ? t(labelKey) : t('hud_nothing_held');
  }

  // tasks: [{ key, labelKey, state: 'pending' | 'current' | 'done' }]
  setTasks(tasks) {
    this.taskListEl.innerHTML = '';
    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = task.state;
      const tick = document.createElement('span');
      tick.className = 'tick';
      tick.textContent = task.state === 'done' ? '✓' : '';
      const label = document.createElement('span');
      label.textContent = t(task.labelKey);
      li.append(tick, label);
      this.taskListEl.appendChild(li);
    });
  }

  setPaused(paused) {
    this.pauseOverlay.classList.toggle('visible', paused);
  }

  retranslateStatic() {
    translateDOM(this.root);
  }
}
