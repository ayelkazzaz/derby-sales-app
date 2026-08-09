// Weighted scoring modeled on the manual's Supervisor Observation Scorecard (§24):
// each category is scored 0-100, weighted, summed to a final percentage.
// Passing requires >=PASS_THRESHOLD AND zero critical breaches (critical breach = auto-fail).
export const PASS_THRESHOLD = 85;

export class ScoreEngine {
  constructor(categories) {
    // categories: [{ key, labelKey, weight }] — weights should sum to 100
    this.categories = categories.map((c) => ({ ...c, value: 100 }));
    this.breaches = [];
  }

  setValue(key, value) {
    const cat = this.categories.find((c) => c.key === key);
    if (!cat) return;
    cat.value = Math.max(0, Math.min(100, value));
  }

  penalize(key, amount) {
    const cat = this.categories.find((c) => c.key === key);
    if (!cat) return;
    cat.value = Math.max(0, cat.value - amount);
  }

  addCriticalBreach(tipKey) {
    if (!this.breaches.includes(tipKey)) this.breaches.push(tipKey);
  }

  hasCriticalBreach() {
    return this.breaches.length > 0;
  }

  computeFinalScore() {
    const totalWeight = this.categories.reduce((sum, c) => sum + c.weight, 0) || 1;
    const weighted = this.categories.reduce((sum, c) => sum + c.weight * c.value, 0);
    return Math.round(weighted / totalWeight);
  }

  isPass() {
    return this.computeFinalScore() >= PASS_THRESHOLD && !this.hasCriticalBreach();
  }

  getBreakdown() {
    return this.categories.map((c) => ({ ...c }));
  }

  getWorstCategory() {
    return this.categories.reduce((worst, c) => (c.value < worst.value ? c : worst), this.categories[0]);
  }
}
