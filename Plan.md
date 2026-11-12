# Plan de implementación: TikTok LIVE Chat Overlay

## Objetivo

Añadir a Kuraii's Widgets un overlay de chat independiente del widget musical, compatible con OBS Browser Source y con la salida HTTPS para TikTok LIVE Studio. El documento raíz del overlay conserva un fondo 100% transparente.

## Arquitectura

- Node.js/Electron en el proceso principal.
- Socket.IO para distribuir chat, regalos, configuración y estado de conexión a los overlays, sin controles de administración desde la fuente del navegador.
- tiktok-live-connector, cargado mediante import dinámico, para leer un directo por nombre de usuario. Es un conector no oficial; puede requerir una clave de firma de Euler Stream según la disponibilidad del servicio. No se solicitan cookies ni la contraseña de TikTok.
- Una única conexión al directo compartida por las fuentes locales y HTTPS.
- Endpoint local `/chat`; `?mock=true` genera ejemplos en el navegador sin conectarse a un directo.
- El túnel temporal comparte también `/chat` y su ruta Socket.IO protegida por el secreto del enlace. No se utiliza SSE para esta salida.

## Seguridad y límites

- nickname, comment y nombres de regalos se insertan exclusivamente mediante textContent.
- Deduplicación con TTL y mapas acotados, límite por usuario y filtro por cantidad de emojis.
- Los regalos de racha se contabilizan una sola vez al finalizar la racha.
- Historial de servidor, cola de renderizado, nodos DOM y caché de identificadores con límites fijos.
- Entradas por lotes con requestAnimationFrame; limpieza con un temporizador compartido y fade-out opcional.
- Credenciales de firma solo en memoria; nunca en URLs, perfiles exportados, eventos Socket.IO o snapshots públicos.
- Desconectar detiene el conector y sus reintentos. Cerrar la app libera conectores, sockets y túnel.

## Configuración y experiencia

- Sección Chat LIVE con nombre de creador, conexión/desconexión, estado y limpieza.
- Vista previa fija y selector de modo mock.
- URLs independientes para OBS, pruebas y HTTPS.
- Fuente, tamaño, colores, fondo por mensaje, número máximo de mensajes, tiempo de desvanecimiento y filtros.
- Renombrado a Kuraii's Widgets conservando el appId y el perfil anterior para facilitar actualizaciones.

## Validación

- Pruebas de filtros, deduplicación, rachas y límites de memoria.
- Pruebas Socket.IO para emisión, reconexión de fuente y configuración.
- Pruebas de navegador para XSS, transparencia, modo mock, límite DOM y fade-out.
- Regresión del widget musical y prueba de la versión empaquetada.
- La conexión a un directo real requiere un creador en vivo y disponibilidad del servicio externo; no se presenta el modo mock como prueba de una sesión real.
