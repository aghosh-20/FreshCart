import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';
import { normalizeProduct } from './products';

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.floor(value)));
}

/** Adds a product. An existing product has its quantity increased, never duplicated. */
export function addToCart(items: CartItem[], product: Product, quantity = 1): CartItem[] {
  const amount = clampQuantity(quantity);
  const exists = items.some((item) => item.product.id === product.id);
  if (!exists) return [...items, { product, quantity: amount }];
  return items.map((item) =>
    item.product.id === product.id
      ? { product, quantity: clampQuantity(item.quantity + amount) }
      : item,
  );
}

/** Changes a quantity by a delta. The result never falls below one. */
export function changeQuantity(items: CartItem[], productId: number, delta: number): CartItem[] {
  return items.map((item) =>
    item.product.id === productId
      ? { ...item, quantity: clampQuantity(item.quantity + delta) }
      : item,
  );
}

export function removeFromCart(items: CartItem[], productId: number): CartItem[] {
  return items.filter((item) => item.product.id !== productId);
}

/** Validates data read from storage: drops malformed entries and merges duplicates. */
export function sanitizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  let result: CartItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { product, quantity } = entry as { product?: unknown; quantity?: unknown };
    const normalized = normalizeProduct(product);
    if (!normalized || typeof quantity !== 'number') continue;
    result = addToCart(result, normalized, quantity);
  }
  return result;
}
