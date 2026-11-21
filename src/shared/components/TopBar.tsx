import { useState } from 'react';
import { Typography, Avatar, Dropdown } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { Archive, FilePlus2, Menu, ScanLine } from 'lucide-react';
import { useDockStore } from '@/store/dockStore';
import { ModalRadicarComparendo } from '@/features/comparendos/ModalRadicarComparendo';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/auth';
import { PALETA } from '@/theme/theme';
import { glassChrome } from '@/theme/glass';
import { usePrefersReducedTransparency } from '@/shared/hooks/usePrefersReducedTransparency';
import { TEXTO } from '@/theme/escala';

const { Text } = Typography;

const RUTA_MIS_PROCESOS = '/panel/procesos';
const RUTA_RADICADOR = '/panel/radicador';

/** Las dos entradas de la barra comparten forma: entra y sale del despacho. */
function estiloEntradaSuperior(activa: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 34,
    padding: '0 12px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: TEXTO.base,
    fontWeight: 500,
    background: activa ? 'var(--accent-light)' : 'transparent',
    color: activa ? PALETA.azul : PALETA.textoSuave,
    transition: 'background 150ms ease, color 150ms ease',
  };
}

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = useAuth((s) => s.usuario);
  const cerrarSesion = useAuth((s) => s.cerrarSesion);
  const reducirTransparencia = usePrefersReducedTransparency();
  const abrirMovil = useDockStore((s) => s.abrirMovil);

  // Ninguna de las dos es un trámite: radicar es la entrada al despacho y Mis
  // procesos su archivo. Por eso viven arriba a la derecha y no en el riel, que
  // queda libre para las áreas de trabajo.
  const enMisProcesos = location.pathname.startsWith(RUTA_MIS_PROCESOS);
  const enRadicador = location.pathname.startsWith(RUTA_RADICADOR);

  // El comparendo se radica leyendo su PDF, no conversando: es un modal, no una
  // pantalla. Por eso va aquí y no como una segunda ruta del radicador general.
  const [radicarComparendo, setRadicarComparendo] = useState(false);


  return (
    <header
      className="topbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 24px',
        borderBottom: `1px solid ${PALETA.borde}`,
        position: 'sticky',
        top: 0,
        ...glassChrome(reducirTransparencia),
        zIndex: 10,
      }}
    >
      {/* Marca — un solo bloque, sin caja de despacho pegada al lado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <button
        className="solo-movil"
        onClick={abrirMovil}
        aria-label="Abrir menú"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          marginLeft: -6,
          background: 'none',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          color: PALETA.textoSuave,
          flexShrink: 0,
        }}
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>
      <Link
        to="/panel"
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0 }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: PALETA.azul,
            color: '#fff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: TEXTO.titulo,
            flexShrink: 0,
          }}
        >
          L
        </span>
        <div className="marca-texto" style={{ lineHeight: 1.15, minWidth: 0 }}>
          <div className="titulo-serif" style={{ fontSize: TEXTO.seccion, color: PALETA.texto }}>
            LegalTech <span style={{ color: PALETA.azul }}>Cloud</span>
          </div>
          <div style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue }}>{usuario?.despacho}</div>
        </div>
      </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => navigate(RUTA_RADICADOR)}
          aria-current={enRadicador ? 'page' : undefined}
          style={estiloEntradaSuperior(enRadicador)}
        >
          <FilePlus2 size={16} strokeWidth={1.75} />
          <span className="etiqueta-accion">Radicación general</span>
        </button>

        <button onClick={() => setRadicarComparendo(true)} style={estiloEntradaSuperior(false)}>
          <ScanLine size={16} strokeWidth={1.75} />
          <span className="etiqueta-accion">Radicar comparendo</span>
        </button>

        <button
          onClick={() => navigate(RUTA_MIS_PROCESOS)}
          aria-current={enMisProcesos ? 'page' : undefined}
          style={estiloEntradaSuperior(enMisProcesos)}
        >
          <Archive size={16} strokeWidth={1.75} />
          <span className="etiqueta-accion">Mis procesos</span>
        </button>

        <div className="solo-escritorio" style={{ width: 1, height: 22, background: PALETA.borde }} />

        <Dropdown
          menu={{
            items: [
              { key: 'ajustes', icon: <SettingOutlined />, label: 'Configurar inspección' },
              { type: 'divider' },
              { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión' },
            ],
            onClick: ({ key }) => {
              if (key === 'ajustes') navigate('/panel/ajustes');
              if (key === 'logout') {
                cerrarSesion();
                navigate('/login');
              }
            },
          }}
          placement="bottomRight"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <Avatar
              style={{ background: PALETA.azulSuave, color: PALETA.azulOscuro }}
              icon={<UserOutlined />}
            />
            <div className="solo-escritorio" style={{ lineHeight: 1.2, maxWidth: 180 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Text strong>{usuario?.nombre}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: TEXTO.menor, textTransform: 'capitalize' }}>
                {usuario?.rol}
              </Text>
            </div>
          </div>
        </Dropdown>
      </div>

      <ModalRadicarComparendo
        abierto={radicarComparendo}
        onCerrar={() => setRadicarComparendo(false)}
        onRadicado={(id) => {
          setRadicarComparendo(false);
          navigate(`/panel/comparendos/${id}`);
        }}
      />
    </header>
  );
}
