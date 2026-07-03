import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatUZS(amount) {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Math.round(amount)) + " so'm";
}
