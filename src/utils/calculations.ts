import type { CartItem } from '../types/cart';
import { toCents } from './currency';

export function lineTotalCents(item: CartItem): number {
  return toCents(item.product.price) * item.quantity;
}

export function getItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotalCents(item), 0);
}

/**
 * The demo has no delivery fee, tax or discount, so the final total equals the subtotal.
 * Keeping this as its own function gives one place to extend if those are ever added.
 */
export function getTotalCents(items: CartItem[]): number {
  return getSubtotalCents(items);
}
