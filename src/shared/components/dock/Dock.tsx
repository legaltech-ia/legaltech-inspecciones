import { type ReactNode } from 'react';
import {
  Home,
  FileText,
  Gavel,
  Stamp,
  HeartHandshake,
  Wallet,
  Scale,
  Sparkles,
  SquareSlash,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOCK_SECTIONS, type DockIconKey } from './dockItems';
import { DockItemBoton } from './DockItemBoton';
import { PALETA } from '@/theme/palette';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';
import { TEXTO } from '@/theme/escala';
import { useDockStore } from '@/store/dockStore';

/** Ancho del riel. AppLayout compensa este mismo valor con su paddingLeft. */
export const ANCHO_RIEL = 228;
export const ANCHO_RIEL_COLAPSADO = 56;

// Trazo fino y monocromo, sin relleno — lenguaje uniforme.
const ICONO_TAMANO = 18;
const ICONO_TRAZO = 1.75;

const ICONOS_DOCK: Record<DockIconKey, ReactNode> = {
  inicio: <Home size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  querellas: <FileText size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  quejas: <Gavel size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  firmeza: <Stamp size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  conmutacion: <HeartHandshake size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  'pronto-pago': <Wallet size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  apelaciones: <Scale size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  'chat-ia': <Sparkles size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  asistente: <SquareSlash size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
  configuracion: <Settings size={ICONO_TAMANO} strokeWidth={ICONO_TRAZO} />,
};

function esActiva(ruta: string, pathname: string): boolean {
  return ruta === '/panel' ? pathname === '/panel' : pathname.startsWith(ruta);
}

export function Dock() {
  const reducirTransparencia = usePrefersReducedTransparency();
  const location = useLocation();
  const navigate = useNavigate();
  const { colapsado, toggle } = useDockStore();

  const ancho = colapsado ? ANCHO_RIEL_COLAPSADO : ANCHO_RIEL;

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: ancho,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        padding: colapsado ? '14px 8px 18px' : '14px 10px 18px',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 200ms ease, padding 200ms ease',
        ...glassChrome(reducirTransparencia),
        borderRight: `1px solid ${PALETA.borde}`,
        userSelect: 'none',
      }}
    >
      <div style={{ flex: 1 }}>
        {DOCK_SECTIONS.map((section, i) => (
          <div key={section.titulo || `grupo-${i}`} style={{ marginBottom: 10 }}>
            {section.titulo && !colapsado && (
              <div
                style={{
                  fontSize: TEXTO.nota,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: PALETA.textoTenue,
                  padding: '10px 14px 6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {section.titulo}
              </div>
            )}
            {section.titulo && colapsado && <div style={{ height: 16 }} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map((item) => (
                <DockItemBoton
                  key={item.key}
                  icon={ICONOS_DOCK[item.iconKey]}
                  label={colapsado ? '' : item.label}
                  ayuda={colapsado ? item.label : item.ayuda}
                  color={item.color}
                  destacado={item.destacado}
                  activo={esActiva(item.ruta, location.pathname)}
                  onClick={() => navigate(item.ruta)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Botón plegar/desplegar */}
      <button
        onClick={toggle}
        title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: colapsado ? 'center' : 'flex-end',
          width: '100%',
          padding: '8px 10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: PALETA.textoTenue,
          borderRadius: 8,
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = PALETA.borde)}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
      >
        {colapsado
          ? <ChevronRight size={16} strokeWidth={1.75} />
          : <ChevronLeft size={16} strokeWidth={1.75} />
        }
      </button>
    </nav>
  );
}
