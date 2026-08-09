import { STRINGS } from './data/strings.js';

const STORAGE_KEY = 'sp_van_sim_lang';
const listeners = new Set();

let currentLang = localStorage.getItem(STORAGE_KEY) || 'ar';

export function t(key) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[currentLang] ?? entry.en ?? key;
}

export function getLang() {
  return currentLang;
}

export function isRTL() {
  return currentLang === 'ar';
}

export function setLang(lang) {
  if (lang !== 'ar' && lang !== 'en') return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyDocumentDirection();
  listeners.forEach((fn) => fn(currentLang));
}

export function toggleLang() {
  setLang(currentLang === 'ar' ? 'en' : 'ar');
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyDocumentDirection() {
  document.documentElement.setAttribute('lang', currentLang);
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  document.body?.classList.toggle('lang-ar', currentLang === 'ar');
  document.body?.classList.toggle('lang-en', currentLang === 'en');
}

// Walks the DOM for [data-i18n] elements and fills their text content.
// Call after any DOM subtree is (re)built to translate it in place.
export function translateDOM(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const spec = el.getAttribute('data-i18n-attr');
    spec.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}
