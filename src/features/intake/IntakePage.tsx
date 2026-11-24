import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { legalCasesKeys } from '@/shared/legalCases/api';
import { uid } from '@/shared/util/uid';
import { Button, Input, Tooltip } from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentTypeFromFileName, type CaseDocumentType } from '@/shared/documentos/types';
import { DESPACHO, CNSCC } from '@/derecho';
import type { ChatMessage } from './useIntakeChat';
import { useIntakeChat } from './useIntakeChat';
import dayjs from 'dayjs';
import { fechaLarga } from '@/shared/util/fechas';
import { NormaMark } from '@/shared/ai/NormaMark';
import { Markdown } from '@/shared/ai/Markdown';
import { PanelPropuesta } from '@/features/radicador/PanelPropuesta';
import { useBorradorRadicacion } from '@/features/radicador/borradorStore';
import { ELEVACION, PALETA } from '@/theme/theme';
import { TEXTO } from '@/theme/escala';

// Anexo aportado en el chat antes de radicar (prueba documental del caso).
// Conserva el File real: sin él no hay nada que enviarle a /api/legal/recepcion.
interface Anexo {
  id: string;
  nombre: string;
  tipo: CaseDocumentType;
  tamano: string;
  archivo: File;
}

const ICONO_ANEXO: Record<CaseDocumentType, ReactNode> = {
  PDF: <FilePdfOutlined style={{ color: PALETA.rojo }} />,
  IMAGEN: <FileImageOutlined style={{ color: PALETA.verde }} />,
  WORD: <FileTextOutlined style={{ color: PALETA.azul }} />,
  AUDIO: <FileTextOutlined style={{ color: PALETA.morado }} />,
  OTRO: <FileOutlined style={{ color: PALETA.textoSuave }} />,
};

// ── Burbuja de mensaje ────────────────────────────────────────────────────
function Burbuja({ m }: { m: ChatMessage }) {
  const esAgente = m.rol === 'agente';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: esAgente ? 'flex-start' : 'flex-end',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      {esAgente && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <NormaMark size={30} />
        </div>
      )}
      <div
        style={{
          maxWidth: '76%',
          padding: '11px 16px',
          borderRadius: esAgente ? '6px 20px 20px 20px' : '20px 6px 20px 20px',
          background: esAgente ? PALETA.superficie : PALETA.azul,
          color: esAgente ? PALETA.texto : '#ffffff',
          boxShadow: esAgente ? ELEVACION.base : 'none',
          fontSize: TEXTO.base,
          lineHeight: 1.55,
        }}
      >
        {m.streaming && m.texto === '' ? (
          <span style={{ opacity: 0.45, letterSpacing: 3 }}>●●●</span>
        ) : (
          <Markdown texto={m.texto} />
        )}
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────
export function IntakePage({ selector }: { selector?: ReactNode } = {}) {
  const navigate = useNavigate();
  const { mensajes, cargando, enviar, casoRadicado } = useIntakeChat();
  const propuesta = useBorradorRadicacion((s) => s.propuesta);
  const queryClient = useQueryClient();

  // Aquí radica el backend, no el frontend: el expediente aparece sin que esta
  // pantalla lo cree. Si no se invalida, Mis procesos lo muestra solo porque
  // useLegalCases refetchea al montar — un accidente que se pierde el día que
  // alguien le declare un staleTime.
  useEffect(() => {
    if (casoRadicado) void queryClient.invalidateQueries({ queryKey: legalCasesKeys.all });
  }, [casoRadicado, queryClient]);
  const [inputText, setInputText] = useState('');
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function agregarAnexos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const nuevos: Anexo[] = Array.from(files).map((f) => ({
      id: `anexo-${uid().slice(0, 8)}`,
      nombre: f.name,
      tipo: documentTypeFromFileName(f.name),
      tamano: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      archivo: f,
    }));
    setAnexos((prev) => [...prev, ...nuevos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  function handleEnviar() {
    const texto = inputText.trim();
    if (!texto) return;
    setInputText('');
    // anexos stays populated (not cleared here): el agente vuelve a ver todos
    // los adjuntos en cada turno, no solo los nuevos, hasta que radique.
    void enviar(
      texto,
      anexos.map((a) => a.archivo),
    );
  }

  const fechaHoy = fechaLarga(dayjs(), 'dddd, D [de] MMMM [de] YYYY');

  // El caso se radica solo, en el backend, cuando la IA marca
  // listoParaRadicar=true (ver IntakeCaseCreationGate + recepcionRules.st) -
  // este progreso es solo informativo, no gatea ninguna acción del inspector.
  const camposClave = [
    Boolean(propuesta?.tipoSolicitud),
    (propuesta?.partes.length ?? 0) > 0,
    Object.values(propuesta?.campos ?? {}).some((v) => v != null && v !== ''),
  ];
  const progreso = propuesta?.listoParaRadicar ? 1 : camposClave.filter(Boolean).length / camposClave.length;

  return (
    <>
      {/* El resto de las áreas de trabajo (firmeza, querellas…) tienen un
          maxWidth homogéneo; este panel iba borde a borde en pantallas
          anchas. Se conserva el split-pane, solo se acota el ancho. */}
      <div
        style={{
          height: 'calc(100vh - 64px)',
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          background: '#f4f6f9',
        }}
      >
        {/* ── Panel izquierdo: chat ──────────────────────────── */}
        <div
          style={{
            flex: '1 1 62%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Encabezado del chat — ligero, sin barras */}
          <div style={{ padding: '20px 32px 6px', flexShrink: 0 }}>
            <div style={{ fontSize: TEXTO.titulo, fontWeight: 600, color: PALETA.texto, lineHeight: 1.2 }}>
              Asistente de radicación
            </div>
            <div style={{ fontSize: TEXTO.menor, color: PALETA.textoSuave, marginTop: 3 }}>
              Cuénteme la situación: iré completando la ficha automáticamente
            </div>
          </div>

          {casoRadicado && (
            <div
              style={{
                margin: '0 32px 12px',
                padding: '12px 16px',
                borderRadius: 10,
                background: PALETA.verdeBg,
                border: `1px solid ${PALETA.verde}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: TEXTO.base }}>
                <strong>Caso radicado:</strong> {casoRadicado.filingNumber} · estado{' '}
                <strong>{casoRadicado.currentStateCode}</strong>
              </div>
              {casoRadicado.readyForFallo && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate(`/panel/analisis?caso=${casoRadicado.id}`)}
                >
                  Ir a Fallo
                </Button>
              )}
            </div>
          )}

          {/* Lista de mensajes */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '18px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {mensajes.map((m, i) => (
              <Burbuja key={i} m={m} />
            ))}
          </div>

          {/* Barra de entrada flotante */}
          <div style={{ padding: '6px 24px 20px', flexShrink: 0 }}>
            {anexos.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '0 10px 10px',
                }}
              >
                {anexos.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      background: PALETA.superficie,
                      borderRadius: 999,
                      padding: '5px 6px 5px 12px',
                      fontSize: TEXTO.menor,
                      color: PALETA.texto,
                      boxShadow: ELEVACION.base,
                      maxWidth: 260,
                    }}
                  >
                    {ICONO_ANEXO[a.tipo]}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.nombre}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      icon={<CloseOutlined style={{ fontSize: 10 }} />}
                      aria-label={`Quitar ${a.nombre}`}
                      onClick={() => setAnexos((prev) => prev.filter((x) => x.id !== a.id))}
                    />
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 6,
                background: PALETA.superficie,
                borderRadius: 26,
                padding: '8px 8px 8px 10px',
                boxShadow: ELEVACION.media,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => agregarAnexos(e.target.files)}
              />
              <Tooltip title="Adjuntar documentos del caso (PDF, imagen o texto)">
                <Button
                  type="text"
                  shape="circle"
                  icon={<PaperClipOutlined />}
                  aria-label="Adjuntar documentos"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flexShrink: 0, color: PALETA.textoSuave }}
                />
              </Tooltip>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 5 }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviar();
                  }
                }}
                variant="borderless"
                placeholder="Describa la situación o responda al asistente…"
                style={{ resize: 'none', fontSize: TEXTO.base, padding: '8px 0' }}
                disabled={cargando}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<SendOutlined />}
                onClick={handleEnviar}
                disabled={cargando || !inputText.trim()}
                style={{ flexShrink: 0 }}
              />
            </div>
          </div>
        </div>

        {/* ── Panel derecho: ficha flotante ───────────────────── */}
        <div
          style={{
            flex: '0 0 38%',
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px 20px 4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: PALETA.superficie,
              borderRadius: 24,
              boxShadow: ELEVACION.media,
              overflow: 'hidden',
            }}
          >
            {selector && (
              <div style={{ padding: '18px 20px 4px', flexShrink: 0 }}>{selector}</div>
            )}

            {/* Encabezado suave */}
            <div style={{ padding: '18px 24px 14px', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: TEXTO.nota,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: PALETA.textoTenue,
                  marginBottom: 6,
                }}
              >
                {DESPACHO.nombre} · {CNSCC.ley}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: TEXTO.seccion, fontWeight: 600, color: PALETA.texto }}>
                  Ficha de radicación
                </span>
                {propuesta?.radicadoReferenciado && (
                  <span
                    style={{
                      fontSize: TEXTO.nota,
                      fontWeight: 600,
                      background: PALETA.azulSuave,
                      color: PALETA.azulOscuro,
                      padding: '3px 12px',
                      borderRadius: 12,
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {propuesta.radicadoReferenciado}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: TEXTO.menor,
                  color: PALETA.textoTenue,
                  marginTop: 4,
                }}
              >
                {fechaHoy}
              </div>

              {/* Progreso de la ficha — se llena con la conversación */}
              <div
                style={{
                  marginTop: 14,
                  height: 5,
                  borderRadius: 999,
                  background: '#eef0f3',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(progreso * 100, 4)}%`,
                    borderRadius: 999,
                    background: progreso >= 1 ? PALETA.verde : PALETA.azul,
                    transition: 'width 0.8s ease, background 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Campos de la ficha — reflejan lo que la IA ya extrajo */}
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 8px' }}>
              <PanelPropuesta archivos={anexos.map((a) => a.archivo)} />

              {anexos.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: TEXTO.nota,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: PALETA.textoTenue,
                      marginBottom: 6,
                      paddingLeft: 14,
                    }}
                  >
                    Anexos aportados ({anexos.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {anexos.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: '#f6f7f9',
                          borderRadius: 14,
                          padding: '8px 14px',
                          fontSize: TEXTO.base,
                          color: PALETA.texto,
                        }}
                      >
                        {ICONO_ANEXO[a.tipo]}
                        <span
                          style={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.nombre}
                        </span>
                        <span style={{ fontSize: TEXTO.nota, color: PALETA.textoTenue, flexShrink: 0 }}>
                          {a.tamano}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Estado — la radicación es automática en el backend una vez
                completa la información obligatoria, no hay acción manual. */}
            <div style={{ padding: '10px 20px 20px', flexShrink: 0 }}>
              <div
                style={{
                  textAlign: 'center' as const,
                  fontSize: TEXTO.menor,
                  color: casoRadicado ? PALETA.verde : PALETA.textoTenue,
                  fontWeight: 500,
                  padding: '8px 0',
                }}
              >
                {/* Decía que el caso se radicaba solo. Ya no: lo radica el inspector. */}
                {casoRadicado
                  ? 'Caso radicado.'
                  : propuesta?.listoParaRadicar
                    ? 'El agente ya tiene lo obligatorio. Revise la ficha y guarde.'
                    : 'Nada queda radicado hasta que usted pulse «Guardar y radicar».'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
