import { App } from 'antd';
import { useInspeccionStore } from '@/store/inspeccionStore';
import { LIMITE_MEMBRETE_BYTES, membreteExcedeLimite } from './membrete';

/** Handler `beforeUpload` del membrete, compartido por Ajustes y Configuración del despacho. */
export function useCargarMembrete() {
  const { message } = App.useApp();
  const guardarConfig = useInspeccionStore((s) => s.guardarConfig);

  return function onMembreteCargado(archivo: File): false {
    if (membreteExcedeLimite(archivo)) {
      message.error(
        `El membrete pesa ${(archivo.size / 1_000_000).toFixed(1)} MB y el máximo es ` +
          `${LIMITE_MEMBRETE_BYTES / 1_000_000} MB. Use la imagen del encabezado (800x200), no una foto.`,
      );
      return false;
    }
    const lector = new FileReader();
    lector.onload = () => {
      guardarConfig({ membreteDataUrl: String(lector.result) });
      message.success('Membrete guardado.');
    };
    lector.onerror = () => message.error('No se pudo leer la imagen del membrete.');
    lector.readAsDataURL(archivo);
    return false;
  };
}
