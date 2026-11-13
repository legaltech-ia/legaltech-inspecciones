import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DockStore {
  colapsado: boolean;
  toggle: () => void;
}

export const useDockStore = create<DockStore>()(
  persist(
    (set) => ({
      colapsado: false,
      toggle: () => set((s) => ({ colapsado: !s.colapsado })),
    }),
    { name: 'dock-estado' },
  ),
);
