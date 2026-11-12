# Fuentes de bienvenida / Welcome fonts

## Español

Estos archivos se incluyen en el repositorio y se dibujan con Sharp/FreeType usando directamente el archivo TTF para evitar sustituciones de fuentes en Windows. Render no necesita instalar fuentes ni descargarlas durante el build o al enviar bienvenidas. Cada familia conserva su licencia OFL en su carpeta. `manifest.json` registra los enlaces originales y SHA-256 de cada archivo sin modificar.

Se incluyen Shrikhand, Comic Relief, Arimo, Roboto, Montserrat, Poppins, Lora, Playfair Display y Bebas Neue. Arimo es una alternativa métricamente compatible con Arial; Comic Relief lo es con Comic Sans MS. No se distribuyen las fuentes propietarias de Microsoft. Se utilizan archivos TTF estáticos: peso 700 excepto Shrikhand y Bebas Neue, que tienen peso 400. Los TTF estáticos de las familias variables proceden de la API oficial de Google Fonts; los demás archivos y las licencias proceden de la revisión de google/fonts indicada en el manifiesto.

Cada capa de texto guarda `font`, `strokeEnabled`, `strokeColor` y `strokeWidth` (grosor exterior de 1 a 12 px). Las configuraciones anteriores heredan su fuente global y mantienen el contorno desactivado. Los presets cambian posiciones y tamaños, conservando la tipografía y el contorno.

## English

These files are bundled in the repository and rendered directly from TTF files with Sharp/FreeType to avoid font substitution on Windows. Render does not need to install or download fonts at build time or when sending welcomes. Each family retains its OFL license in its directory. `manifest.json` records original source URLs and SHA-256 hashes for every unmodified file.

Included: Shrikhand, Comic Relief, Arimo, Roboto, Montserrat, Poppins, Lora, Playfair Display and Bebas Neue. Arimo is a metric-compatible alternative to Arial; Comic Relief is an alternative to Comic Sans MS. Microsoft proprietary fonts are not redistributed. All TTF files are static, weight 700 except Shrikhand and Bebas Neue at 400. Static TTFs for variable families come from the official Google Fonts API; other files and licenses come from the google/fonts revision recorded in the manifest.

Each text layer stores `font`, `strokeEnabled`, `strokeColor` and `strokeWidth` (1–12 px outer thickness). Older configurations inherit their global font and keep outlines disabled. Presets change layout and sizes while preserving font and outline settings.

Sources / Fuentes:
- [Google Fonts](https://github.com/google/fonts)
- [Arimo](https://github.com/google/fonts/blob/main/ofl/arimo/DESCRIPTION.en_us.html)
- [Comic Relief](https://github.com/google/fonts/blob/main/ofl/comicrelief/DESCRIPTION.en_us.html)
