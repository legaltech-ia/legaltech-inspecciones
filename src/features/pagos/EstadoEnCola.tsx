import { Tag, Tooltip } from 'antd';
import type { TipoMulta } from '@/derecho';
import { viaAdmiteTipo, type ViaAcogida } from './viaAcogida';

/** La vía manda sobre la edición en curso: un tipo que no la admite nunca está "Pendiente". */
export function EstadoEnCola({
  via,
  tipoMulta,
  enEdicion,
}: {
  via: ViaAcogida;
  tipoMulta: TipoMulta;
  enEdicion: boolean;
}) {
  return viaAdmiteTipo(via, tipoMulta) ? (
    <Tag color={enEdicion ? 'processing' : 'default'}>{enEdicion ? 'En edición' : 'Pendiente'}</Tag>
  ) : (
    <Tooltip title={via.restriccion?.(tipoMulta)}>
      <Tag color="default" style={{ cursor: 'help' }}>No procede</Tag>
    </Tooltip>
  );
}
