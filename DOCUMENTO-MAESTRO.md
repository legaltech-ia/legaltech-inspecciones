# Documento Maestro — Legaltech

Versión 1.0 · Documento vivo. Fuente única de visión, alcance y decisiones del proyecto.
Cualquier repo, prototipo o sesión de desarrollo debe alinearse con este documento.

---

## 1. Misión a 10 años

Convertirnos en **la plataforma web de consulta jurídica y apoyo jurídico virtual de referencia para todos los abogados de Colombia y de habla hispana**: jueces, fiscales, inspectores de policía, litigantes, defensores, conciliadores, consultorios jurídicos, y los que vengan.

El derecho es el **contenido necesario** del producto. El producto fundamental es la **oficina virtual**: un espacio de trabajo cómodo e indispensable, que el abogado abre cada mañana.

## 2. Visión del producto

> Una oficina virtual donde el abogado organiza su día, sus expedientes y sus documentos, y donde el conocimiento jurídico correcto está al alcance de un clic.

Tres capas, en este orden de importancia:

1. **Oficina virtual (núcleo)**: agenda, plazos, expedientes, documentos, plantillas, tareas, partes, tiempos. Es lo que el usuario usa todos los días.
2. **Motor de procedimientos**: máquinas de estado que codifican cómo avanza un proceso según la ley (ej. ciclo del comparendo). Es lo que hace que la oficina sea confiable, no solo ordenada.
3. **Conocimiento jurídico (verticales)**: corpus versionado por área (inspección, tránsito, familia, penal, civil, etc.). Se enchufa al núcleo sin reescribirlo.

## 3. Principios

1. **Indispensable antes que completo.** Gana el producto que el abogado abre a diario, no el que tiene más funciones.
2. **"Mi día" es la pantalla de inicio.** Audiencias, plazos que vencen, pendientes. Si esa pantalla no se abre cada mañana, el producto falla.
3. **El derecho es un módulo, no el núcleo.** Cada área es un paquete. El núcleo no sabe de derecho específico.
4. **Confianza jurídica es un requisito, no una mejora.** Todo texto normativo tiene estado de validación visible (validado / pendiente de validación / inferido). Nunca se presenta como verificado lo que no lo está.
5. **Cero datos reales en repositorios.** Los datos de ciudadanos y expedientes reales viven fuera de Git. Los ejemplos son ficticios.
6. **Respetar lo existente.** Código de otros autores se extiende o se marca `@Deprecated` con razón; no se borra ni se renombra sin acuerdo.
7. **Español jurídico en contenido, inglés en identificadores de código.**

## 4. Alcance del núcleo (MVP)

Orden de construcción, cada bloque debe funcionar antes de empezar el siguiente:

| # | Bloque | Qué hace | Estado actual (prototipo) |
|---|---|---|---|
| 1 | **Mi día** | Agenda + plazos + pendientes en una sola pantalla | No existe. Pantalla de inicio prioritaria |
| 2 | **Expedientes** | Partes, documentos, historial, estado del proceso | Parcial en `legalcase` (casos, estados) |
| 3 | **Plantillas y documentos** | Generar documentos desde plantillas con campos (slots) | Parcial: plantillas en `okf-bundles`, generación en `inspecciones-redesign` |
| 4 | **Tareas y responsables** | Pendientes asignables dentro del expediente | No existe |
| 5 | **Partes y contactos** | Personas y entidades ligadas a expedientes | No existe como módulo común |
| 6 | **Tiempos y facturación básica** | Registro de horas y cobro simple | No existe |

Fuera del MVP (no tocar todavía): marketplace, consultoría en línea, IA generativa abierta para redactar fallos, integraciones con sistemas judiciales oficiales.

## 5. Verticales

Una vertical = corpus OKF (brains + roles profesionales + workspaces) + flujos de estado + plantillas propias.

| Orden | Vertical | Razón | Riesgo |
|---|---|---|---|
| 1 | **Inspección de policía** | Procedimiento acotado y definido por ley; corpus ya existe | Compra pública lenta (B2G) |
| 2 | **Litigante independiente** | Compra rápida, paga con tarjeta, decide solo | Exige muchas funciones generales desde el inicio |
| 3 | Tránsito, familia, consultorios jurídicos | Se agregan sobre el núcleo estable | — |
| 4 | Jueces, fiscales, defensores, conciliadores | Requieren validación institucional y seguridad reforzada | Ciclo de venta largo |

**Estrategia de entrada:** inspección prueba que el motor de flujos funciona. Litigante independiente da el primer ingreso. La marca se construye sobre la ubicuidad del abogado, no sobre una sola vertical.

## 6. Cliente y usuario

- **Usuario final**: el abogado (primero el que ejerce, luego el que trabaja en entidad pública).
- **Cliente que paga**: el abogado independiente, o la oficina/entidad en el caso institucional.
- **Ciudadano**: no es usuario del producto, pero sí es la parte afectada. El producto no debe generar consejo jurídico directo al ciudadano sin supervisión profesional.

## 6.1 Piloto de validación

- **Alcance del piloto**: un inspector de policía, una oficina, una semana en paralelo al papel. Mismo alcance que el MVP.
- **Métrica principal**: uso diario sin que se lo pidan (¿abre el sistema cada mañana?).
- **Métricas secundarias**: minutos para preparar un documento, errores de plazo detectados por el sistema, veces que el usuario dice "no lo usaría".
- **Condición de salida**: avanzar a uso real solo con la validación jurídica de los casos que se usen cerrada.

## 7. Arquitectura: qué ya existe y cómo se usa

| Repo / componente | Rol en la visión | Estado |
|---|---|---|
| `okf-bundles` | Corpus jurídico versionado (brains, roles, workspaces). Es la capa vertical | Prototipo funcional, anonimizado |
| `legalcase` | Backend de expedientes y máquinas de estado. Núcleo de procedimientos | Prototipo, Flyway + Spring Boot |
| `orchestrator` | BFF: une frontend con servicios | Prototipo |
| `authentication` | Identidad (AWS Cognito) | Prototipo, layered |
| `legaltech-chat` / `legaltech-chat-history` | Historial de conversación con asistente | Prototipo |
| `legaltech-tools` | Herramientas de extracción (Tika, expedientes) | Prototipo |
| `legal` | Extensión de agentes OKF | Prototipo |
| `web` | Frontend Angular (heredado) | Prototipo, fix de proxy pendiente |
| `legaltech-inspecciones` (`inspecciones-redesign`) | Frontend Vite/TS del flujo de comparendo | Prototipo más avanzado en UX |
| `legalbases`, `core-monitoring-service` | Referidos en el handoff, no clonados aún | Por confirmar |

**Regla:** los repos actuales son **prototipos materializados de ideas**, no el producto final. Pueden reescribirse, fusionarse o descartarse si sirven al núcleo.

**Dirección técnica sugerida (a validar):** un único núcleo de oficina virtual con verticales como paquetes cargables. Hoy esa separación está parcialmente en `okf-bundles` y `legalcase`; no está en el frontend.

## 8. Confianza jurídica (gate obligatorio)

- Todo artículo, guía o plantilla de origen no verificado lleva marca de estado.
- Ningún contenido marcado "pendiente de validación" se presenta al usuario final como vigente sin aviso.
- La lista de pendientes vive en `VALIDACION-JURIDICA-PENDIENTE.md` (en `inspecciones-redesign`) y en `okf-bundles`.
- Cambios normativos (ej. Decreto 768 de 2025) se reflejan en el corpus con fecha y fuente. Nunca se edita un texto normativo sin registrar la versión.
- Revisión por abogado antes de publicar cualquier guía al ciudadano.

## 9. Seguridad y privacidad

- Cumplimiento de Ley 1581 de 2012 (habeas data) desde el diseño.
- Datos reales fuera de Git; secretos solo en variables de entorno (nunca en archivos comprometidos).
- Credenciales de desarrollo fuera del repo; `local-dev/` no se versiona con datos reales.
- Auditoría de hallazgos sensibles (secretos hardcodeados) es prioridad inmediata si se encuentra alguno.

## 10. Hoja de ruta a 10 años

| Horizonte | Meta | Criterio de éxito |
|---|---|---|
| **0–6 meses** | Núcleo MVP (bloques 1–4) + piloto inspector | Piloto con uso diario sostenido |
| **6–18 meses** | Litigante independiente pagando; bloques 5–6; vertical tránsito y familia | Ingresos recurrentes; retención mensual |
| **18–36 meses** | Verticales: consultorios, defensores, conciliadores; marketplace de plantillas validadas | Varias verticales activas sobre el mismo núcleo |
| **3–5 años** | Jueces, fiscales y entidades; consulta jurídica verificada por área | Uso institucional con validación formal |
| **5–10 años** | Oficina virtual de referencia para todo el gremio en Colombia y Latinoamérica | Abogado que no usa la plataforma es la excepción |

## 11. Decisiones abiertas

1. ¿Cuál es el primer ingreso: inspección (B2G) o litigante independiente (tarjeta)?
2. ¿Hosting del piloto: nube propia o servidor de la oficina?
3. ¿Se mantiene `okf-bundles` como repo separado o pasa a ser módulo del núcleo?
4. ¿Qué parte del corpus es licenciable a terceros y cuál es propietaria?
5. ¿Modelo de precio: suscripción por usuario, por expediente o por vertical?
6. ¿Quién valida jurídicamente cada vertical y con qué contrato?

## 12. Glosario

- **Oficina virtual**: espacio de trabajo del abogado en la plataforma.
- **Mi día**: pantalla de inicio con agenda, plazos y pendientes.
- **Vertical**: área del derecho empaquetada (corpus + flujos + plantillas).
- **OKF**: Open Knowledge Format, formato del corpus jurídico versionado.
- **Brain**: corpus de derecho sustancial por área.
- **Rol profesional**: flujos y plantillas de una profesión.
- **Workspace**: configuración de una oficina, sus instancias y personas.
- **Máquina de estados**: definición de cómo avanza un proceso según la ley.
- **Gate de validación**: condición jurídica que debe cumplirse antes de publicar contenido.

---

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-11-09 | Versión inicial: misión, visión, alcance del núcleo, verticales, piloto, decisiones abiertas |
