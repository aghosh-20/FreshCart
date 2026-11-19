/** Converts a decimal price to integer cents to avoid floating point drift. */
export function toCents(price: number): number {
  return Math.round(price * 100);
}

/** Formats integer cents as a USD string, e.g. 1099 becomes "$10.99". */
export function formatCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (abs % 100).toString().padStart(2, '0');
  return `${negative ? '-' : ''}$${whole}.${fraction}`;
}

export function formatPrice(price: number): string {
  return formatCents(toCents(price));
}
