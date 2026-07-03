import { api } from './api';

const pending = new Map();

export function translateFromUz(text, onResult, debounceMs = 500) {
  const key = onResult;
  if (pending.has(key)) clearTimeout(pending.get(key));

  if (!text?.trim()) return;

  const timer = setTimeout(async () => {
    pending.delete(key);
    try {
      const { data } = await api.post('/translate', { text: text.trim(), targetLangs: ['ru', 'en'] });
      onResult(data.translations);
    } catch {
      onResult({});
    }
  }, debounceMs);

  pending.set(key, timer);
}

export function generateSku() {
  return `MP-${Date.now().toString(36).toUpperCase()}`;
}

export function calcDisplayPrice(salePrice) {
  const sale = parseFloat(salePrice);
  if (!sale || sale <= 0) return null;
  const markup = 0.05 + Math.random() * 0.07;
  const original = Math.round(sale * (1 + markup));
  const discountPercent = Math.round(100 - (sale / original) * 100);
  return { original, discountPercent, markup: Math.round(markup * 100) };
}

export function previewDisplayPrice(salePrice) {
  const sale = parseFloat(salePrice);
  if (!sale || sale <= 0) return null;
  const minMarkup = 0.05;
  const maxMarkup = 0.12;
  const minOriginal = Math.round(sale * (1 + minMarkup));
  const maxOriginal = Math.round(sale * (1 + maxMarkup));
  const minDiscount = Math.round(100 - (sale / maxOriginal) * 100);
  const maxDiscount = Math.round(100 - (sale / minOriginal) * 100);
  return { minOriginal, maxOriginal, minDiscount, maxDiscount };
}
