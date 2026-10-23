# SignHub — presentación y documentos públicos

Sitio estático sin dependencias de producción, cookies propias, backend, claves Supabase ni cobros. Titular: OZZYDEV SpA. El domicilio residencial no está incluido.

## Publicar en el repositorio solicitado

El repositorio comprobado es `https://github.com/ozzydevspa/signhub.github.io` (sin punto final). La conexión disponible al preparar estos archivos tiene lectura, no escritura. Copiar **el contenido de esta carpeta**, incluyendo `.github`, a la raíz de ese repositorio. No subir el proyecto Android, `local.properties`, credenciales ni documentos internos.

1. Revisar los textos legales y el inventario de operaciones antes del lanzamiento. La página identifica el estado de piloto; no anuncia cobros activos ni certificación legal.
2. Ejecutar `npm run build` y `npm test` (Node 24).
3. En GitHub: Settings → Pages → Build and deployment → Source → GitHub Actions.
4. Subir a `main` o ejecutar el workflow `Publish informational website`.
5. Comprobar la URL devuelta por Actions. Con este nombre de repositorio será normalmente `https://ozzydevspa.github.io/signhub.github.io/`. Para publicar directamente en `https://ozzydevspa.github.io/` el repositorio debe llamarse `ozzydevspa.github.io`.

También se puede publicar solo el contenido de `dist/` desde la raíz de una rama, usando Pages → Deploy from a branch. En ese caso no se necesita el workflow.

## Enlaces para la aplicación y Play Console

- `legal/privacidad.html`
- `legal/terminos.html`
- `legal/eliminar-cuenta.html`
- `legal/menores.html`
- `legal/comunidad.html`
- `legal/promociones.html`

Los documentos HTML se generan desde `content/*.md`; editar allí y reconstruir. `site.config.json` contiene los datos públicos de la empresa. Si se modifica el correo también actualizar `index.html`, `assets/request.js` y los documentos, y comprobar todas las referencias.

El formulario de derechos **prepara un correo**; no lo envía ni almacena. La dirección es visible y funciona también sin JavaScript. El operador debe vigilar esa casilla y atender realmente las solicitudes. GitHub registra IP y otros datos técnicos por seguridad.

## Límites del alojamiento

GitHub Pages prohíbe usar su hosting gratuito para operar un SaaS, e-commerce o un sitio principalmente orientado a facilitar transacciones. Este paquete es presentación y documentación, sin cuentas, canje, checkout ni panel del producto. La descripción de precios no convierte Pages en una pasarela de contratación. Revisar la adecuación del uso concreto a los [límites de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits); si la página pasa a ser principalmente comercial/transaccional, moverla a un hosting apto antes de añadir esas funciones.
