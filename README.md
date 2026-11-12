# Kuraii's Playing

[![Windows build](https://github.com/FrancoEvil/Kuraiis-Playing/actions/workflows/windows.yml/badge.svg)](https://github.com/FrancoEvil/Kuraiis-Playing/actions/workflows/windows.yml)
[![Descargar](https://img.shields.io/github/v/release/FrancoEvil/Kuraiis-Playing?label=descargar&color=FF4A7A)](https://github.com/FrancoEvil/Kuraiis-Playing/releases/latest)

**Tu música, tu estilo, en tu stream.** Una aplicación de escritorio para Windows que transforma la canción del sistema en un widget personalizable para OBS y TikTok LIVE Studio.

[Descargar para Windows](https://github.com/FrancoEvil/Kuraiis-Playing/releases/latest) · [Reportar un problema](https://github.com/FrancoEvil/Kuraiis-Playing/issues)

![Panel de Kuraii's Playing](docs/interface.png)

## Qué puedes personalizar

- **Elementos visibles:** carátula, artista, aplicación de origen, estado, tiempos y barra de progreso.
- **Diseño:** distribución horizontal, vertical o minimalista; dimensiones, espacios y esquinas.
- **Letras:** 17 opciones de fuente, tamaños y colores independientes por texto, negrita, cursiva, espaciado, contornos y sombras.
- **Fondo:** color, transparencia y opacidad, sin atenuar las letras ni la carátula.
- **Borde del contenedor:** color, grosor y opacidad independiente.
- **Colores por álbum:** extracción local de la paleta de la portada, con estilos estándar, mate claro, mate oscuro y carátula difuminada.
- **Spotify:** recorte opcional de la franja inferior con su logo cuando viene incluida en la miniatura de Windows.
- **Vista previa fija:** prueba los cambios sin volver al inicio de los ajustes. El menú lateral se puede plegar.
- **Perfiles:** guardado automático y exportación/importación en JSON.
- **Windows:** inicio automático opcional y funcionamiento en la bandeja del sistema.
- **Actualizaciones:** búsqueda y descarga desde GitHub Releases.

La barra de progreso avanza de forma continua entre las actualizaciones del reproductor y se sincroniza al pausar, reanudar o cambiar de canción.

## Instalación

1. Abre la [última versión publicada](https://github.com/FrancoEvil/Kuraiis-Playing/releases/latest).
2. Descarga **Kuraiis-Playing-Setup-X.Y.Z.exe**. Los archivos `.blockmap` y `latest.yml` son para el actualizador.
3. Si ya tienes la app abierta, elige **Salir** desde su icono en la bandeja.
4. Ejecuta el instalador y abre **Kuraii's Playing**.

Disponible para **Windows 10/11 de 64 bits**. No necesitas instalar Node.js, .NET ni las fuentes para utilizar la aplicación. El instalador todavía no tiene firma digital.

## Conectar con OBS

1. Deja Kuraii's Playing abierta o minimizada en la bandeja.
2. En OBS, entra en **Fuentes → + → Navegador**.
3. Usa esta URL:

   ```text
   http://127.0.0.1:17834/widget
   ```

4. Configura un ancho de **1200** y un alto de **700**.
5. Recorta el espacio sobrante manteniendo **Alt** mientras arrastras los bordes de la fuente.

El widget tiene fondo transparente fuera del contenedor. Los cambios del editor llegan al widget sin recargar la fuente. Puedes copiar la URL desde **OBS y TikTok LIVE**.

## TikTok LIVE Studio

Si tu versión de LIVE Studio rechaza la URL local, usa el enlace HTTPS temporal:

1. En Kuraii's Playing, abre **OBS y TikTok LIVE**.
2. Pulsa **Crear enlace HTTPS**. La primera vez se descarga un componente oficial de Cloudflare (~55 MB), verificado por SHA-256 antes de ejecutarse.
3. Espera a que la app valide la conexión y pulsa **Copiar enlace**.
4. En LIVE Studio, añade una fuente **Enlace / Link** y pega la URL completa, incluida su ruta.
5. Usa **1200 × 700** como tamaño de fuente y coloca el widget donde prefieras.
6. Mantén Kuraii's Playing abierta o en la bandeja. Para revocar el enlace, pulsa **Desconectar**.

Los colores automáticos, las fuentes, los bordes, el progreso y la transparencia funcionan en esta salida. La app consulta snapshots en lugar de SSE para ser compatible con los túneles temporales.

**El enlace es público para quien lo tenga.** Solo expone el widget y los datos de la canción; no expone el editor, tus preferencias de inicio o los controles de actualización. No publiques la URL si quieres mantenerla privada. La conexión pasa por Cloudflare y requiere internet. No se inicia automáticamente ni requiere una cuenta de Cloudflare.

La URL cambia al volver a conectar. Los [Quick Tunnels de Cloudflare](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) son un servicio temporal sin disponibilidad garantizada. Si tu red los bloquea, o tu cuenta de LIVE Studio no dispone de fuente Enlace, puedes montar la escena en OBS y seleccionar **OBS Virtual Camera** como cámara en LIVE Studio, si tu cuenta la permite. Consulta la [guía oficial de cámara virtual de OBS](https://obsproject.com/kb/virtual-camera-guide).

## Reproducción y carátulas

La app lee la sesión multimedia activa que publica Windows. Spotify y otros reproductores o navegadores compatibles pueden compartir el título, artista, posición y portada; los datos disponibles dependen de cada reproductor.

- Reproduce una canción y desactiva **Canción de prueba** para ver los datos reales.
- Windows decide qué sesión multimedia está activa.
- Si no se comparte una portada, el modo de colores por álbum conserva los colores manuales.
- La app no captura audio ni controla la reproducción. Solo muestra sus datos.

## Colores automáticos y transparencia

En **Diseño del widget → Colores según la carátula**, activa los colores automáticos y elige qué elementos cambian con el álbum.

| Estilo | Resultado |
| --- | --- |
| Personalizado | Elige individualmente título, artista, acento, otros textos y fondo. |
| Estándar | Degradado basado en la portada. |
| Mate claro | Fondo claro con el tono del álbum; intensidad y luminosidad ajustables. |
| Mate oscuro | Fondo oscuro teñido con los colores de la portada. |
| Carátula difuminada | Portada como fondo, con desenfoque y oscurecimiento. |

La opacidad y el fondo transparente se respetan en todos los estilos. Al desactivar los colores automáticos recuperas tus colores manuales. Con fondo difuminado, el ajuste de legibilidad mantiene un oscurecimiento mínimo del 60%; puedes desactivarlo para controlar la luminosidad libremente.

El contraste sobre una fuente transparente también depende de tu escena de OBS. Los contornos de texto ayudan a mantener la lectura sobre fondos variables.

## Bandeja e inicio con Windows

- **Cerrar la ventana** la oculta y mantiene activo el widget.
- **Salir**, en el menú de la bandeja, termina la aplicación.
- En **Aplicación** puedes configurar el inicio con Windows y el inicio oculto en la bandeja.
- Windows controla si el icono se muestra directamente o en el área de iconos ocultos.

## Actualizaciones automáticas

En **Aplicación → Actualizaciones** puedes:

- Activar o desactivar la búsqueda y descarga automática.
- Buscar una versión nueva manualmente.
- Descargar una actualización disponible.
- Pulsar **Instalar y reiniciar** cuando la descarga termine.

La versión instalada busca actualizaciones al iniciar y, si está habilitado el modo automático, cada cuatro horas. Una actualización descargada también se instala cuando eliges **Salir**; cerrar la ventana solo la minimiza a la bandeja.

**Si vienes de una versión anterior a 1.4.0, instala esta versión una vez para activar el actualizador.** Después, tus amigos reciben las futuras versiones sin tener que reenviarles el instalador. No necesitan una cuenta de GitHub.

Las actualizaciones usan versiones publicadas en **GitHub Releases**, no los archivos de código sin compilar. La edición portable no se actualiza automáticamente.

## Datos y privacidad

- La lectura de la carátula y la extracción de colores se realizan localmente.
- El widget de OBS escucha únicamente en `127.0.0.1`. El enlace HTTPS opcional para TikTok comparte solo el widget a través de Cloudflare.
- No hay cuentas ni telemetría añadida por la aplicación.
- Las búsquedas y descargas de actualizaciones se conectan a GitHub.
- Al crear un enlace para TikTok, la app descarga el componente de Cloudflare desde su repositorio oficial de GitHub y comparte la salida visual a través de Cloudflare. Al desconectarlo se cierra el túnel.
- Los ajustes se conservan en `%APPDATA%/NowPlaying Studio/settings.json`. Se mantiene el nombre de carpeta anterior para conservar los perfiles de las primeras versiones.

## Desarrollo

Necesitas Node.js y Windows para ejecutar la aplicación y el lector multimedia nativo.

```powershell
npm ci
npm start
```

Pruebas y compilación:

```powershell
npm test
npm run dist
```

El instalador queda en `dist/`. Para generar una edición portable:

```powershell
npm run dist:portable
```

Las pruebas de interfaz usan perfiles y puertos separados. La prueba del lector WinRT requiere una sesión de escritorio real y se omite en CI.

### Publicar una nueva versión

El workflow de GitHub Actions prueba y compila cada cambio en `main`. Si la versión de `package.json` todavía no tiene una release, crea y publica el instalador y sus metadatos de actualización automáticamente.

```powershell
npm version patch --no-git-tag-version
# Añade también tus cambios de código al commit.
git add package.json package-lock.json
# Crea el commit y súbelo a main.
```

No hace falta reenviar los ejecutables a los usuarios. Cada actualización publicada debe tener un número de versión mayor que la anterior. El workflow usa `GITHUB_TOKEN`; no se incluyen credenciales en la app.

## Tipografías

Incluye las fuentes de sistema Segoe UI, Arial, Georgia y Consolas, y 13 familias empaquetadas: Arimo, Bebas Neue, Bubblegum Sans, Comic Relief, DynaPuff, Fredoka, Lora, Montserrat, Playfair Display, Poppins, Roboto, Shrikhand y Sniglet.

Las fuentes empaquetadas conservan sus licencias OFL y el manifiesto de procedencia en [`ui/fonts`](ui/fonts).

El componente opcional cloudflared conserva su licencia Apache-2.0 y su versión/hash fijados en [`assets/cloudflared`](assets/cloudflared). El ejecutable se descarga únicamente al crear el primer enlace HTTPS.
