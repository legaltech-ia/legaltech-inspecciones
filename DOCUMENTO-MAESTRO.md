# Documento Maestro — Legaltech

Versión 1.1 · Documento vivo. Fuente única de visión, alcance, metas y decisiones del proyecto.
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
4. **Confianza jurídica es un requisito, no una mejora.** Todo texto normativo tiene estado de validación visible (validado / pendiente de validación / inferido). Ver §3.1.
5. **Cero datos personales reales en repositorios ni en logs.** Los datos de ciudadanos y expedientes reales viven fuera de Git, cifrados, con control de acceso. Los ejemplos son ficticios. Ver §3.2.
6. **Respetar lo existente.** Código de otros autores se extiende o se marca `@Deprecated` con razón; no se borra ni se renombra sin acuerdo.
7. **Español jurídico en contenido, inglés en identificadores de código.**
8. **Un solo stack de IA: Amazon Bedrock.** Un proveedor, un modo de facturación, un modo de seguridad. Bedrock ofrece modelos de varias compañías; el código depende de la API Converse, no de un proveedor concreto.
9. **Privacidad por diseño.** Ningún dato personal llega a un modelo sin seudonimización y sin base jurídica documentada.

## 3.1 Metas no negociables: confianza jurídica

**Definición operativa de "alucinación"**: cualquier afirmación jurídica (norma, artículo, sentencia, decreto, plazo, cuantía, sanción) que no esté respaldada por un pasaje verificable del corpus versionado.

Un LLM no puede garantizar matemáticamente cero errores. Sí podemos garantizar **por diseño** y **medir**:

| Meta | Cómo se garantiza | Cómo se mide | Criterio de paso |
|---|---|---|---|
| **0 citas inventadas** | Cada cita (norma, artículo, radicado) se verifica por máquina: el texto citado debe existir en la fuente versionada | Verificador automático en cada respuesta y en CI sobre el conjunto de oro | 0 citas no verificables |
| **0 afirmaciones sin fuente** | Una afirmación jurídica sin pasaje recuperado no se muestra como afirmación; se muestra como "no verificado" o se omite | Auditoría de muestras por área | 0 afirmaciones sin fuente en respuestas marcadas como jurídicas |
| **Abstención cuando no hay fuente** | Si la recuperación no encuentra soporte suficiente, el sistema responde que no tiene fuente | Preguntas sin respuesta en el corpus | 100% de abstención en el conjunto de control |
| **Error de contenido medido** | Conjunto de oro por área, validado por abogado | Por release, por área | Umbral a definir con validación jurídica (ver §11) |

Reglas:
- Ninguna respuesta jurídica se publica si no pasa el verificador de citas.
- El conjunto de oro (preguntas, respuestas esperadas, pasajes fuente) lo valida un abogado del área. Sin conjunto de oro validado no hay release.
- Un cambio normativo cambia el corpus con fecha y fuente; las respuestas anteriores no se reescriben, se reevalúan.

## 3.2 Metas no negociables: datos personales y Ley 1581

Marco de referencia: **Ley 1581 de 2012** (habeas data), **Decreto 1377 de 2013** (compilado en el Decreto 1074 de 2015) y la guía de la Superintendencia de Industria y Comercio (SIC). **Todo lo de esta sección debe validarse con un abogado especializado en protección de datos antes de operar con datos reales.**

Obligaciones de diseño:
- **Autorización previa, expresa e informada** del titular. Debe quedar prueba de la autorización.
- **Política de tratamiento de datos** publicada y accesible: finalidades, derechos del titular, canal de consultas y reclamos, responsable.
- **Responsable y encargados.** Con cada encargado (incluido el proveedor de nube) debe existir contrato de transmisión.
- **Transferencias internacionales** (art. 26, Ley 1581). Usar Bedrock en una región de AWS implica enviar datos fuera de Colombia. Requiere análisis jurídico y base contractual antes de datos reales.
- **Datos sensibles** (art. 5, Ley 1581). Los expedientes de policía y de justicia pueden contener datos sensibles o de menores. Tratamiento reforzado y minimización.
- **Seudonimización antes de cualquier modelo.** Los nombres, cédulas, direcciones y datos de salud se reemplazan antes de enviar texto a un LLM. Existe `CasePseudonymizer` en `legal`; se audita su cobertura, no se asume completa.
- **Minimización y retención.** Solo se guarda lo necesario y cada colección tiene plazo de borrado definido.
- **Derechos ARCO** (acceso, rectificación, cancelación, oposición) con flujo operativo.
- **Logs sin datos personales.**
- **Registro Nacional de Bases de Datos** ante la SIC, según los umbrales vigentes.
- **Incidentes de seguridad:** procedimiento de reporte a la SIC y a los titulares.
- **Responsable designado** de protección de datos en el proyecto (ver §11).

## 4. Alcance del núcleo (MVP)

Orden de construcción, cada bloque debe funcionar antes de empezar el siguiente:

| # | Bloque | Qué hace | Estado actual (prototipo) |
|---|---|---|---|
| 1 | **Mi día** | Agenda + plazos + pendientes en una sola pantalla | No existe. Pantalla de inicio prioritaria |
| 2 | **Expedientes** | Partes, documentos, historial, estado del proceso | Parcial en `legalcase` (casos, estados) |
| 3 | **Plantillas y documentos** | Generar documentos desde plantillas con campos (slots) | Parcial: plantillas en `okf-bundles`, generación en `legaltech-inspecciones` (DOCX/PDF) |
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
- **Métricas secundarias**: minutos para preparar un documento, errores de plazo detectados por el sistema, veces que el usuario dice "no lo usaría", citas verificadas frente a no verificadas.
- **Condición de salida**: avanzar a uso real solo con la validación jurídica de los casos que se usen cerrada y con el marco de §3.2 resuelto.

## 7. Arquitectura

### 7.1 Stack objetivo

Un solo proveedor de IA: **Amazon Bedrock**, API Converse para chat y API de embeddings para indexación.

| Rol | Modelo propuesto (ID de API) | Invocación | Estado |
|---|---|---|---|
| Auditor / deliberación | `us.anthropic.claude-sonnet-5-5` | perfil de inferencia `us.` | Propuesto |
| Analizador rápido | `us.anthropic.claude-haiku-5-5` | perfil `us.` | Propuesto |
| Tercera voz del consenso (otro proveedor) | `deepseek.v3.2` | directa | Propuesto |
| Embeddings | `amazon.titan-embed-text-v2:0` | directa | Propuesto; comparar contra `cohere.embed-v4:0` |

Reglas del stack:
- Perfiles `us.` por defecto. Los perfiles `global.` pueden enrutar fuera de Estados Unidos; no se usan hasta resolver §3.2.
- La elección de modelo es configuración, no código. Cambiar de modelo no cambia el derecho: el conocimiento vive en el corpus, no en los pesos.
- Los IDs se confirman con `list-foundation-models` y `list-inference-profiles` en la cuenta antes de cada release.
- La dimensión de embeddings se fija una sola vez por colección. Cambiarla exige reindexar.

Estado actual en código, antes de migrar:
- `legal`: chat con Gemini (flash y pro) y NVIDIA (vía API compatible con OpenAI); embeddings `gemini-embedding-001` a 768 dimensiones en tres colecciones de MongoDB Atlas (casos, bases/fuentes de derecho, conceptos OKF); memoria de chat en Redis.
- `legal`: no encontré verificación programática de citas. Las reglas de citación están en los prompts (`legalRules.st`, `auditorRules.st`), no en código que compruebe el texto citado contra la fuente.

### 7.2 Repos y componentes (inventario verificado 2026-11-10)

| Repo / componente | Rol | Estado verificado |
|---|---|---|
| `okf-bundles` | Corpus jurídico versionado (brains, roles, workspaces) | Datos, no código. Capa vertical |
| `legal` | Agentes de IA, consenso, citación, chat jurídico | Spring Boot. Gemini + NVIDIA + Mongo Atlas + Redis. Sin verificador de citas |
| `legalcase` | Expedientes y máquinas de estado | Spring Boot, Postgres, Flyway, Cognito |
| `authentication` | Identidad | Cognito y Postgres |
| `orchestrator` | BFF que une frontend con servicios | Spring Boot, Postgres, Redis. `envs.env` versionado (ver §9) |
| `legaltech-chat` | Historial de conversación | Spring Boot, Postgres, Flyway |
| `legaltech-tools` | Extracción de texto y almacenamiento de expedientes | Spring Boot. Almacenamiento compatible con S3, claves por variables de entorno |
| `legaltech-inspecciones` | Frontend Vite/TS del flujo de comparendo y generación de documentos | Lógica de derecho en TypeScript (multas, actas de firmeza, plantillas DOCX/PDF). Es el prototipo con más funciones de documento |
| `web` | Frontend Angular heredado | Fix de proxy pendiente |
| `Legaltech-Unified-claude` | Beta monolítica, fuera de los 9 repos | No es destino. Solo referencia de ideas |
| `legalbases`, `core-monitoring-service` | Referidos en el handoff, no clonados | Por confirmar |

**Regla:** los repos actuales son **prototipos materializados de ideas**, no el producto final. Pueden reescribirse, fusionarse o descartarse si sirven al núcleo.

**Dirección técnica (en replanteo):** un único núcleo de oficina virtual con verticales como paquetes cargables, sobre el stack Bedrock. La arquitectura final se define en un documento de diseño que parta de este inventario, no de supuestos.

## 8. Confianza jurídica (gate obligatorio)

- Todo artículo, guía o plantilla de origen no verificado lleva marca de estado.
- Ningún contenido marcado "pendiente de validación" se presenta al usuario final como vigente sin aviso.
- La lista de pendientes vive en `VALIDACION-JURIDICA-PENDIENTE.md` (en `legaltech-inspecciones`) y en `okf-bundles`.
- Cambios normativos (ej. Decreto 768 de 2025) se reflejan en el corpus con fecha y fuente. Nunca se edita un texto normativo sin registrar la versión.
- Revisión por abogado antes de publicar cualquier guía al ciudadano.
- Ningún release de IA jurídica sin conjunto de oro validado (§3.1).

## 9. Seguridad y privacidad

### 9.1 Hallazgos verificados (sin valores de secretos)

| Hallazgo | Ubicación | Riesgo | Acción requerida |
|---|---|---|---|
| Clave de API de NVIDIA como valor por defecto en el yaml | `legal/src/main/resources/application.yaml` (línea 54), versionado en Git | Crítico: secreto en el historial | Rotar la clave ya. Quitar el valor por defecto. Usar variable de entorno o gestor de secretos |
| Archivo de entorno con patrones de clave | `orchestrator/envs.env`, versionado en Git desde al menos `v1.0.0` | Crítico: secreto en el historial | Rotar las claves. Purgar del historial. Agregar a `.gitignore` |
| Dump SQL con datos reales de ciudadanos, y archivos de entorno con patrones de clave | Carpeta `local/` en la raíz Legaltech, fuera de Git. Incluye `tysbackup.sql` (según el handoff) | Alto: datos personales reales sin control | Cifrar. Mover fuera de carpetas sincronizadas. Definir retención. Revisar si el dump debe existir |
| Claves de AWS guardadas en texto plano en `~/.aws/config` (perfil `default`) | Equipo del desarrollador | Alto si el equipo se comparte o respalda | Rotar. Usar IAM Identity Center (SSO) o credenciales con permisos mínimos |

Los valores no se copian a ningún documento ni a ningún chat. Quien rote una clave debe revisar también los logs de uso de esa clave.

### 9.2 Reglas

- Ley 1581 de 2012 desde el diseño (ver §3.2).
- Datos reales fuera de Git. Secretos solo en variables de entorno o gestor de secretos, nunca en archivos versionados.
- Credenciales de desarrollo fuera del repo. `local-dev/` no se versiona con datos reales.
- Un hallazgo de secreto hardcodeado es prioridad inmediata: rotar primero, analizar después.

## 10. Hoja de ruta a 10 años

| Horizonte | Meta | Criterio de éxito |
|---|---|---|
| **0–3 meses** | Replanteo de arquitectura sobre Bedrock. Saneamiento de secretos y datos. Conjunto de oro inicial por área. Marco de datos validado | Hallazgos de §9.1 cerrados. Primer conjunto de oro aprobado por abogado |
| **3–6 meses** | Núcleo MVP (bloques 1–4) sobre el stack objetivo. Verificador de citas en producción. Piloto inspector | Piloto con uso diario sostenido. 0 citas no verificables en el conjunto de oro |
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
7. **Embeddings:** `amazon.titan-embed-text-v2:0` (propuesta de la dirección del proyecto, por indexar español con español) frente a `cohere.embed-v4:0`. Criterio: recuperación sobre el conjunto de oro en español jurídico. Dimensión a fijar antes de reindexar.
8. **Residencia de datos:** perfiles `us.` (propuesta) frente a `global.`. Requiere concepto jurídico sobre transferencias (art. 26, Ley 1581).
9. **Responsable de protección de datos** del proyecto y dueño de la política de tratamiento.
10. **Umbral de error de contenido** aceptable por área, distinto de la meta de 0 citas inventadas. Lo fija el abogado validador.
11. **Contrato de encargado** con el proveedor de nube y revisión de transferencias internacionales.
12. **Migración de índices:** reindexar las tres colecciones de Atlas y definir ventana de corte.

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
- **Alucinación (definición operativa)**: afirmación jurídica sin pasaje verificable en el corpus versionado (§3.1).
- **Conjunto de oro**: preguntas con respuesta y pasajes fuente validados por abogado, usado para medir.
- **Verificador de citas**: componente que comprueba que el texto citado existe en la fuente versionada.
- **Seudonimización**: reemplazo de datos personales por identificadores antes de procesar.
- **Perfil de inferencia (`us.` / `global.`)**: ruta de Bedrock que enruta la solicitud entre regiones.

---

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-11-09 | Versión inicial: misión, visión, alcance del núcleo, verticales, piloto, decisiones abiertas |
| 1.1 | 2026-11-10 | Metas de confianza (0 citas inventadas, abstención, conjunto de oro) y marco Ley 1581. Stack único Bedrock con modelos propuestos. Inventario verificado y hallazgos de seguridad sin valores. Decisiones 7–12 |
