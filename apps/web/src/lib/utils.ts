import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('en-GY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('en-GY', { dateStyle: 'medium' });
}
