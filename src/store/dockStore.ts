import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DockStore {
  colapsado: boolean;
  toggle: () => void;
  /** Cajón del riel en pantalla estrecha: fuera del lienzo salvo que se abra. */
  movilAbierto: boolean;
  abrirMovil: () => void;
  cerrarMovil: () => void;
}

export const useDockStore = create<DockStore>()(
  persist(
    (set) => ({
      colapsado: false,
      toggle: () => set((s) => ({ colapsado: !s.colapsado })),
      movilAbierto: false,
      abrirMovil: () => set({ movilAbierto: true }),
      cerrarMovil: () => set({ movilAbierto: false }),
    }),
    // Solo se recuerda el riel plegado: un cajón abierto no sobrevive a la recarga.
    { name: 'dock-estado', partialize: (s) => ({ colapsado: s.colapsado }) },
  ),
);

