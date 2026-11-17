import { Button, Result } from 'antd';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

/**
 * Pantalla de error de la aplicación. Sin un `errorElement`, React Router pinta
 * su propia pantalla de desarrollo — "Unexpected Application Error!" y un
 * recado al programador — que es lo que veía cualquiera que escribiera mal una
 * URL. Un inspector no tiene por qué leer eso.
 *
 * El detalle técnico se registra en consola, no se muestra: el mensaje de una
 * excepción puede llevar rutas, identificadores o fragmentos del expediente.
 */
export function PaginaDeError() {
  const error = useRouteError();
  // Sin error en el contexto, el componente llegó como `element` de la ruta
  // comodín: la URL no casó con nada, que es exactamente un 404.
  const esRutaInexistente =
    error == null || (isRouteErrorResponse(error) && error.status === 404);

  // eslint-disable-next-line no-console
  if (error != null) console.error('Error de navegación', error);

  return (
    <Result
      status={esRutaInexistente ? '404' : 'error'}
      title={esRutaInexistente ? 'Esta página no existe' : 'Algo falló al abrir la página'}
      subTitle={
        esRutaInexistente
          ? 'La dirección no corresponde a ninguna sección del despacho. Puede que el enlace esté mal copiado.'
          : 'No se perdió nada del expediente: el error ocurrió al mostrar la página, no al guardar.'
      }
      extra={
        <Link to="/panel">
          <Button type="primary">Volver al inicio</Button>
        </Link>
      }
    />
  );
}
