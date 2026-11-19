import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';
import { getItemCount, getSubtotalCents, getTotalCents } from '../utils/calculations';
import { addToCart, changeQuantity, removeFromCart, sanitizeCartItems } from '../utils/cartLogic';
import { createSafeStorage } from './safeStorage';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
}

type PersistedCart = Pick<CartState, 'items'>;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => ({ items: addToCart(state.items, product, quantity) })),
      increment: (productId) => set((state) => ({ items: changeQuantity(state.items, productId, 1) })),
      decrement: (productId) => set((state) => ({ items: changeQuantity(state.items, productId, -1) })),
      removeItem: (productId) => set((state) => ({ items: removeFromCart(state.items, productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'freshcart.cart',
      version: 1,
      storage: createSafeStorage<PersistedCart>(),
      partialize: (state): PersistedCart => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitizeCartItems((persisted as Partial<PersistedCart> | undefined)?.items),
      }),
    },
  ),
);

export const useCartItemCount = () => useCartStore((state) => getItemCount(state.items));
export const useCartSubtotalCents = () => useCartStore((state) => getSubtotalCents(state.items));
export const useCartTotalCents = () => useCartStore((state) => getTotalCents(state.items));
export const useCartQuantity = (productId: number) =>
  useCartStore((state) => state.items.find((item) => item.product.id === productId)?.quantity ?? 0);
