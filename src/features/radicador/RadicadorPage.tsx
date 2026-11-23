import { useState } from 'react';
import { HerramientaRadicacion } from '@/features/asistente/HerramientaRadicacion';
import { IntakePage } from '@/features/intake/IntakePage';
import { useCaseTypeCatalog } from '@/shared/catalogo/api';
import { SelectorTipoRadicacion } from './SelectorTipoRadicacion';

/**
 * Radicador unificado: un solo chat inteligente.
 *
 * Lo que este despacho radica sale del catálogo de su cerebro, no de una lista en
 * TypeScript. El modo de guardado decide la pantalla: lo que abre expediente va al
 * chat de recepción; lo que se adjunta a uno que ya existe, al flujo de subida.
 */
export function RadicadorPage() {
  const catalogo = useCaseTypeCatalog();
  const [tipo, setTipo] = useState<string | null>(null);

  const tipologias = catalogo.data ?? [];
  const elegida = tipologias.find((t) => t.key === tipo) ?? tipologias[0];

  if (catalogo.isError || (catalogo.isSuccess && tipologias.length === 0)) {
    return (
      <div role="alert" style={{ padding: 16 }}>
        No se pudo leer qué radica este despacho. El cerebro de la oficina no declara
        tipologías o el servicio no respondió; revíselo antes de radicar.
      </div>
    );
  }

  if (!elegida) return null;

  const selector = (
    <SelectorTipoRadicacion tipologias={tipologias} tipo={elegida.key} onChange={setTipo} />
  );

  // Lo que se adjunta va al camino genérico, que resuelve el expediente destino y le
  // funde los datos. La página de recurso creaba un expediente NUEVO con un tipo fijo,
  // así que elegir una tipología distinta de ella abría un expediente del tipo
  // equivocado en vez de adjuntar nada.
  return elegida.filing === 'ATTACH' ? (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, padding: 12 }}>
      <HerramientaRadicacion key={elegida.key} />
      <aside>{selector}</aside>
    </div>
  ) : (
    <IntakePage key={elegida.key} selector={selector} />
  );
}
