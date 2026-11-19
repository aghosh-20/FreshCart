import { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import { useWishlistStore } from '../store/wishlistStore';

const stores = [useCartStore, useWishlistStore, useLocationStore];
const FALLBACK_MS = 3000;

/** True once persisted cart, wishlist and location are restored (or after a safety timeout). */
export function useStoresHydrated(): boolean {
  const [ready, setReady] = useState(() => stores.every((s) => s.persist.hasHydrated()));

  useEffect(() => {
    const check = () => {
      if (stores.every((s) => s.persist.hasHydrated())) setReady(true);
    };
    const unsubscribes = stores.map((s) => s.persist.onFinishHydration(check));
    const timeout = setTimeout(() => setReady(true), FALLBACK_MS);
    check();
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      clearTimeout(timeout);
    };
  }, []);

  return ready;
}
