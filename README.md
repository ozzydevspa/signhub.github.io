# OZZYDEV y SignHub — presentación y documentos públicos

Sitio estático sin dependencias de producción, cookies propias, backend, claves Supabase ni cobros. Titular: OZZYDEV SpA. El domicilio residencial no está incluido.

## Interpretación en lengua de señas

La landing de SignHub incluye un espacio de interpretación por bloque y reproducción por fragmentos de texto. Configura videos y tiempos en `interpretations.json`; consulta [INTERPRETACION.md](INTERPRETACION.md) para publicar los primeros archivos. Hasta entonces aparece «Video pendiente». Las pruebas de navegador utilizan un video sintético que no se publica.

## Publicar en el repositorio solicitado

Este directorio es el repositorio independiente `https://github.com/ozzydevspa/signhub.github.io`. Los cambios se publican con commit y push a `main`. No subir el proyecto Android, `local.properties`, credenciales ni documentos internos.

1. Revisar los textos legales y el inventario de operaciones antes del lanzamiento. La página identifica el estado de piloto; no anuncia cobros activos ni certificación legal.
2. Ejecutar `npm ci`, `npm run build`, `npm test` y `npm run test:browser` (Node 24). La primera vez, instalar Chromium con `npx playwright install chromium`.
3. En GitHub: Settings → Pages → Build and deployment → Source → GitHub Actions.
4. Subir a `main` o ejecutar el workflow `Publish informational website`.
5. Comprobar la URL devuelta por Actions. Antes de conectar el dominio será `https://ozzydevspa.github.io/signhub.github.io/`; la landing estará en `signhub/` debajo de esa raíz. La estructura preparada para el dominio es `https://www.ozzydev.cl/` (empresa) y `https://www.ozzydev.cl/signhub/` (aplicación). Seguir [PUBLICACION.md](PUBLICACION.md) para verificar el dominio, conectar DNS y activar HTTPS sin cambiar el correo.

Mantener GitHub Actions como fuente. No configurar una segunda publicación desde rama en paralelo. `corporate.html` genera la portada corporativa y `index.html` la landing; los documentos legales conservan copias en las rutas antiguas para las apps instaladas.

## Enlaces para la aplicación y Play Console

- `signhub/legal/privacidad.html`
- `signhub/legal/terminos.html`
- `signhub/legal/eliminar-cuenta.html`
- `signhub/legal/menores.html`
- `signhub/legal/comunidad.html`
- `signhub/legal/promociones.html`

Los documentos HTML se generan desde `content/*.md`; editar allí y reconstruir. `site.config.json` contiene los datos públicos de la empresa. Si se modifica el correo también actualizar `index.html`, `assets/request.js` y los documentos, y comprobar todas las referencias.

El formulario de derechos **prepara un correo**; no lo envía ni almacena. La dirección es visible y funciona también sin JavaScript. El operador debe vigilar esa casilla y atender realmente las solicitudes. GitHub registra IP y otros datos técnicos por seguridad.

## Límites del alojamiento

GitHub Pages prohíbe usar su hosting gratuito para operar un SaaS, e-commerce o un sitio principalmente orientado a facilitar transacciones. Este paquete es presentación y documentación, sin cuentas, canje, checkout ni panel del producto. La descripción de precios no convierte Pages en una pasarela de contratación. Revisar la adecuación del uso concreto a los [límites de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits); si la página pasa a ser principalmente comercial/transaccional, moverla a un hosting apto antes de añadir esas funciones.
