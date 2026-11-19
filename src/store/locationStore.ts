import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from './safeStorage';

interface LocationState {
  address: string;
  setAddress: (address: string) => void;
}

type PersistedLocation = Pick<LocationState, 'address'>;

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      address: '',
      setAddress: (address) => set({ address: address.trim() }),
    }),
    {
      name: 'freshcart.location',
      version: 1,
      storage: createSafeStorage<PersistedLocation>(),
      partialize: (state): PersistedLocation => ({ address: state.address }),
      merge: (persisted, current) => {
        const address = (persisted as Partial<PersistedLocation> | undefined)?.address;
        return { ...current, address: typeof address === 'string' ? address : '' };
      },
    },
  ),
);
