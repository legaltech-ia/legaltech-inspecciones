import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { crearStoragePorUsuario } from '@/shared/estado/storagePorUsuario';
import type { PropuestaRadicacion } from '@/shared/catalogo/types';

/**
 * El borrador de una radicación: lo que el inspector escribió, lo que el agente
 * leyó del documento y lo que él corrigió encima, antes de pulsar guardar.
 *
 * Vivía en `useState`, así que cualquier interrupción lo borraba — y la que importa
 * no es rara: una sesión vencida devuelve un 401, `apiFetch` manda al login y el
 * trabajo se pierde entero. Persistido, el inspector vuelve y sigue donde estaba.
 *
 * Por inspector autenticado (`crearStoragePorUsuario`), nunca en una clave global:
 * dos inspectores que comparten navegador no se ven el borrador del otro.
 */
interface BorradorState {
  texto: string;
  /** La prosa del agente, sin marcadores: sin ella el formulario vuelve sin explicación. */
  respuesta: string | null;
  propuesta: PropuestaRadicacion | null;
  /** Solo los nombres: un File no se puede persistir, y hay que decir cuáles faltan. */
  documentos: string[];
  setTexto: (texto: string) => void;
  setPropuesta: (propuesta: PropuestaRadicacion | null) => void;
  proponer: (respuesta: string, propuesta: PropuestaRadicacion | null, documentos: string[]) => void;
  limpiar: () => void;
}

const CLAVE = 'borrador-radicacion';

const VACIO = { texto: '', respuesta: null, propuesta: null, documentos: [] } as const;

export const useBorradorRadicacion = create<BorradorState>()(
  persist(
    (set) => ({
      ...VACIO,
      documentos: [...VACIO.documentos],
      setTexto: (texto) => set({ texto }),
      setPropuesta: (propuesta) => set({ propuesta }),
      proponer: (respuesta, propuesta, documentos) => set({ respuesta, propuesta, documentos }),
      limpiar: () => set({ ...VACIO, documentos: [] }),
    }),
    {
      name: CLAVE,
      storage: crearStoragePorUsuario(CLAVE),
      // Sin esto, entrar con otro usuario sin borrador propio heredaría por
      // merge superficial el que quedó en memoria del anterior.
      merge: (persistido, actual) =>
        persistido
          ? { ...actual, ...(persistido as BorradorState) }
          : { ...actual, ...VACIO, documentos: [] },
    },
  ),
);
