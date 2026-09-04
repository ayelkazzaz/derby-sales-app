export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
export function hoursLeft(ts: number) {
  return Math.max(0, Math.round((ts - Date.now()) / 3600000));
}
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
export function dailyIndex(poolLen: number) {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return dayOfYear % poolLen;
}
