import { describe, expect, it } from 'vitest';
import { NOMBRE_PLANTILLA, tieneEjemploPlantilla } from './ejemploPlantillas';

/**
 * Documentos del ítem `plantillas-personalizadas` del checklist OKF
 * inspector-policia-checklist-configuracion-despacho. No son la fuente de
 * verdad —esa es el nodo OKF— sino el recordatorio de que el lado TS cubre
 * los que el despacho ya ve en la tabla de Configuración del despacho.
 */
const DOCUMENTOS_DEL_CHECKLIST = [
  'auto-avoca-cita-audiencia',
  'auto-decreta-pruebas-suspende',
  'auto-inasistencia',
  'fallo-comparendo',
  'declaracion-testigo',
  'constancia-incumplimiento-pronto-pago',
  'constancia-incumplimiento-actividad-pedagogica',
  'acta-firmeza',
  'acta-conmutacion',
  'acta-pronto-pago',
];

describe('plantillas del checklist de configuración', () => {
  it('todas tienen nombre legible (ninguna muestra la clave cruda)', () => {
    const sinNombre = DOCUMENTOS_DEL_CHECKLIST.filter((k) => !NOMBRE_PLANTILLA[k]);
    expect(sinNombre).toEqual([]);
  });

  it('todas tienen generador de ejemplo (ningún botón de vista previa sin salida)', () => {
    const sinEjemplo = DOCUMENTOS_DEL_CHECKLIST.filter((k) => !tieneEjemploPlantilla(k));
    expect(sinEjemplo).toEqual([]);
  });

  it('una clave desconocida se declara sin ejemplo, para poder deshabilitar el botón', () => {
    expect(tieneEjemploPlantilla('documento-que-no-existe')).toBe(false);
  });
});
