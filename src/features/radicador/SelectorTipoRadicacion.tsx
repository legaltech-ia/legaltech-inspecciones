import { FileText, Paperclip } from 'lucide-react';
import { PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';
import type { TipologiaCatalogo } from '@/shared/catalogo/types';

/**
 * Lo que este despacho radica, según el catálogo de su cerebro.
 *
 * No trae lista propia: antes declaraba tres tipologías en TypeScript y había que
 * tocar este fichero para que una oficina nueva pudiera radicar lo suyo.
 *
 * El icono y el color se eligen por el MODO de guardado —abre expediente o se adjunta
 * a uno— y no por la tipología: eso es presentación de un rol, no del dominio.
 */
export function SelectorTipoRadicacion({
  tipologias,
  tipo,
  onChange,
}: {
  tipologias: TipologiaCatalogo[];
  tipo: string | null;
  onChange: (tipo: string) => void;
}) {
  return (
    <nav aria-label="Tipo de radicación" style={estilos.lista}>
      {tipologias.map((entrada) => {
        const estilo = APARIENCIA[entrada.filing];
        const activo = entrada.key === tipo;
        return (
          <button
            key={entrada.key}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(entrada.key)}
            style={{
              ...estilos.opcion,
              borderColor: activo ? estilo.color : PALETA.borde,
              background: activo ? estilo.fondo : PALETA.superficie,
            }}
          >
            <estilo.Icono size={16} color={estilo.color} aria-hidden />
            <span style={estilos.titulo}>{entrada.label}</span>
            <span style={estilos.pie}>
              {entrada.filing === 'ATTACH' ? 'Se adjunta' : 'Abre expediente'}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const APARIENCIA = {
  CREATE: { Icono: FileText, color: PALETA.azul, fondo: PALETA.azulBg },
  ATTACH: { Icono: Paperclip, color: PALETA.morado, fondo: PALETA.moradoBg },
} as const;

const estilos = {
  lista: { display: 'grid', gap: 6 },
  opcion: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gridTemplateAreas: '"icono titulo" "icono pie"',
    alignItems: 'center',
    gap: '0 8px',
    padding: '6px 8px',
    border: '1px solid',
    borderRadius: 6,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  titulo: { gridArea: 'titulo', fontSize: TEXTO.base, fontWeight: 600, color: PALETA.texto },
  pie: { gridArea: 'pie', fontSize: TEXTO.nota, color: PALETA.textoSuave },
} as const;
