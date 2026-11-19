import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/product';
import { normalizeProduct } from '../utils/products';
import { createSafeStorage } from './safeStorage';

interface WishlistState {
  items: Product[];
  toggle: (product: Product) => void;
  remove: (productId: number) => void;
}

type PersistedWishlist = Pick<WishlistState, 'items'>;

function sanitizeWishlist(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const result: Product[] = [];
  for (const entry of raw) {
    const product = normalizeProduct(entry);
    if (product && !seen.has(product.id)) {
      seen.add(product.id);
      result.push(product);
    }
  }
  return result;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (product) =>
        set((state) =>
          state.items.some((p) => p.id === product.id)
            ? { items: state.items.filter((p) => p.id !== product.id) }
            : { items: [product, ...state.items] },
        ),
      remove: (productId) => set((state) => ({ items: state.items.filter((p) => p.id !== productId) })),
    }),
    {
      name: 'freshcart.wishlist',
      version: 1,
      storage: createSafeStorage<PersistedWishlist>(),
      partialize: (state): PersistedWishlist => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitizeWishlist((persisted as Partial<PersistedWishlist> | undefined)?.items),
      }),
    },
  ),
);

export const useIsWishlisted = (productId: number) =>
  useWishlistStore((state) => state.items.some((p) => p.id === productId));
