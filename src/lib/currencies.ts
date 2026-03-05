// src/lib/currencies.ts
export const CURRENCY_SYMBOL: Record<string, string> = {
  BOB: 'Bs.',
  USD: '$',
  PEN: 'S/.',
  ARS: '$',
  BRL: 'R$',
  EUR: '€',
  MXN: '$',
  COP: '$',
  CLP: '$',
  PYG: '₲',
  UYU: '$',
};

export function getCurrencySymbol(code?: string | null): string {
  return CURRENCY_SYMBOL[code ?? 'BOB'] ?? code ?? 'Bs.';
}
