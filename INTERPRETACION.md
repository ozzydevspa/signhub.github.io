# Interpretación por bloques en Lengua de Señas Chilena

La portada tiene siete reproductores independientes: presentación, proyecto, funcionamiento, planes, privacidad, preguntas y contacto. Permanecen dentro de su bloque, también en móvil. Los documentos legales conservan su texto; esta primera implementación cubre la portada.

## Publicar los primeros videos

1. Prepara la interpretación con una persona competente en LSCh y revisa que corresponda al texto publicado. El sitio reproduce videos; no traduce automáticamente ni genera señas.
2. Guarda los archivos en `assets/videos/`, por ejemplo `assets/videos/presentacion.mp4`. Para amplia compatibilidad, usa MP4 con video H.264, optimizado para reproducción web (fast start). No recortes las manos ni el rostro. El reproductor mantiene la proporción original y permite pantalla completa. Este contenido no tiene el límite de 15 segundos de las señas dentro de la app.
3. Edita `interpretations.json`. En el bloque correspondiente cambia `src: null` por la ruta del video, sin `/` inicial. Opcionalmente indica una imagen de portada en `poster`; puede seguir en `null`.
4. Indica `start` y `end` **en segundos**, admitiendo decimales, para cada texto. Ejemplo: `12.5` representa 12 segundos y medio. Usa tiempos medidos en el video definitivo, ordenados y sin solapamientos. El final debe estar dentro de la duración real del archivo.
5. Ejecuta `npm ci`, `npm run build`, `npm test` y `npm run test:browser` (la primera vez instala el navegador con `npx playwright install chromium`). Para revisar visualmente: `npm run preview` y abre `http://127.0.0.1:4173`.
6. Haz commit de los archivos y push a `main`. GitHub Actions valida y publica `dist/`; no edites `dist/` directamente.

Ejemplo para sustituir el bloque `presentacion` (los tiempos son ilustrativos, deben ajustarse):

```json
{
  "id": "presentacion",
  "title": "Cada seña, un lugar en común",
  "src": "assets/videos/presentacion.mp4",
  "poster": null,
  "segments": [
    {
      "target": "texto-presentacion",
      "label": "Conoce SignHub",
      "start": 0,
      "end": 24.5
    }
  ]
}
```

Con `src: null`, se muestra **Video pendiente**, sin controles falsos ni descargas. Puedes publicar los bloques progresivamente. Con video y tiempos todavía en `null`, funciona **Ver bloque completo**; solo aparecen botones de párrafo cuando ambos tiempos están configurados. Los IDs `target` corresponden a textos de `index.html`; no los cambies sin actualizar ambas partes. Los títulos, listas, precios y notas de cada bloque también deben incluirse en la interpretación, no solo el párrafo introductorio.

## Un video por bloque o un archivo compartido

- **Un archivo por bloque:** el botón de bloque completo reproduce ese archivo desde el principio. Es la opción recomendada.
- **Un archivo compartido:** varios bloques pueden usar el mismo `src`, con tiempos absolutos del archivo en cada fragmento. El botón de bloque completo reproduce **todo el archivo compartido**; si no quieres ese comportamiento, exporta un archivo por bloque.
- También se aceptan URLs HTTPS públicas y estables de archivos de video, no páginas de YouTube u otros reproductores incrustados. Nunca incluyas claves, credenciales ni URLs firmadas que expiren. Si cambias de proveedor, revisa el aviso de privacidad correspondiente. Los archivos grandes conviene servirlos desde un alojamiento de medios adecuado; no guardes masters de producción en Git.

El servidor de los videos debe permitir saltos mediante solicitudes HTTP de rango (`Accept-Ranges: bytes`). GitHub Pages y el servidor local de este proyecto permiten esos saltos. Si un archivo no permite buscar el instante configurado, se muestra un aviso y se ofrece reproducirlo completo en vez de presentar otro fragmento.

## Interacción y accesibilidad

- No hay reproducción automática ni descarga de videos al entrar. Se cargan después de una acción del visitante, inicialmente silenciados.
- **Ver en LSCh** abre el reproductor dentro de la sección. Los fragmentos se pueden elegir desde sus botones, pulsando el texto o usando Tab y Enter/Espacio. Los enlaces dentro de los textos conservan su función.
- El texto correspondiente se resalta mientras avanza el video. Cada fragmento se pausa al terminar. Los controles nativos permiten pausa, búsqueda y pantalla completa.
- Reproducir otro bloque pausa el anterior. Cerrar el reproductor o dejar la pestaña también pausa la reproducción. Los avisos de carga, error y finalización son visuales.
- Sin JavaScript, los textos siguen legibles y los videos publicados tienen un enlace directo.
- La precisión depende de los tiempos configurados y del navegador; verifica los cortes con el video real para no interrumpir una seña. Las pruebas automáticas usan un patrón sintético de seis segundos, solo en `tests/fixtures/`, que no se publica.

## Si cambia el texto

Revisa la interpretación y sus tiempos antes de publicar una modificación del contenido. Si el video queda desactualizado, devuelve `src` a `null` hasta disponer de la revisión. No cambies un precio o una condición manteniendo una interpretación que dice algo distinto.

La compilación detecta IDs inexistentes, archivos locales ausentes, tiempos negativos, incompletos o solapados y URLs no admitidas. El navegador además comprueba que el fragmento quepa en la duración del video y permite reintentar ante un error. Se debe revisar el video final también en Safari/iPhone y en Android antes de anunciar la disponibilidad de la interpretación.
