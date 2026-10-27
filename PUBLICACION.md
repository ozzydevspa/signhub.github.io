# Publicar OZZYDEV y SignHub

**Estado verificado el 27-10-2026:** `https://www.ozzydev.cl/` y `/signhub/` disponibles con certificado válido. HTTP y el dominio sin `www` redirigen a HTTPS de `www.ozzydev.cl`. Las URLs antiguas de GitHub Pages redirigen al dominio y los documentos legales antiguos siguen disponibles. Los pasos de conexión siguientes quedan como referencia de mantenimiento.

## Estructura y edición

Este repositorio publica **un sitio estático**, sin cuentas ni panel web:

| Ruta publicada | Fuente |
|---|---|
| `/` | `corporate.html` |
| `/signhub/` | `index.html`, `interpretations.json` |
| `/signhub/legal/*.html` | `content/*.md` |
| `/legal/*.html` | Copias de compatibilidad generadas desde los mismos documentos |
| `/assets/` | `assets/` compartido |

`build.mjs` genera `dist/`. No editar ni versionar `dist/`. Para otra aplicación, agregar su fuente, salida con nombre en minúsculas y tarjeta corporativa; no hace falta un registro DNS por ruta. `index.html` sigue siendo la fuente de SignHub para conservar el flujo de edición existente. No borrar las rutas legales antiguas: las usan versiones instaladas.

```powershell
npm ci
npm run build
npm test
npm run test:browser
```

El workflow de `main` valida antes de desplegar. Recibe el prefijo real de Pages para la página 404. Los enlaces y recursos usan rutas relativas y funcionan tanto bajo `/signhub.github.io/` como en el dominio propio. Los videos locales se configuran con `assets/...`; el build adapta su ubicación para `/signhub/`.

## Conectar www.ozzydev.cl (referencia de configuración)

1. En la cuenta GitHub **propietaria del repositorio**, abrir Settings → Pages → Add a domain. Añadir `ozzydev.cl`, copiar el nombre y valor TXT que entregue GitHub y crearlo en Cloudflare. Volver a GitHub y verificar. Conservar ese TXT. La API identifica actualmente `ozzydevspa` como cuenta de tipo **User**; no confundir su nombre comercial con una organización GitHub. [Verificación oficial](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).
2. En `ozzydevspa/signhub.github.io` → Settings → Pages, mantener **GitHub Actions**, introducir **`www.ozzydev.cl`** en Custom domain y guardar. No escribir `https://` ni `/signhub/`. Hacerlo después de verificar propiedad y antes de apuntar los registros web.
3. En Cloudflare → DNS agregar los registros siguientes, inicialmente **DNS only**, TTL automático. Revisar conflictos en `@` y `www`; no reemplazar registros de correo.

| Tipo | Nombre | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `ozzydevspa.github.io` |

4. Esperar la comprobación DNS y certificado en Pages; activar **Enforce HTTPS**. Verificar que `https://ozzydev.cl/` redirige a `https://www.ozzydev.cl/` y mantiene rutas. No usar modo Flexible, comodines DNS ni reglas que envíen todas las rutas a `/`.
5. Volver a ejecutar el workflow tras asociar el dominio. Este proyecto usa Actions; añadir únicamente un archivo CNAME no sustituye el ajuste de Pages. [Dominio y DNS de Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

No cambiar los nameservers de NIC: ya delegan en Cloudflare. Conservar MX, SPF/TXT, DKIM, verificaciones, DMARC si existe y todos los registros de Zoho y `auth.ozzydev.cl`/Resend. No añadir un segundo SPF a la misma etiqueta. Este cambio web no necesita modificar SMTP.

## Compatibilidad y comprobación

Antes de la asociación, la raíz publicada es `https://ozzydevspa.github.io/signhub.github.io/` y SignHub vive debajo de `signhub/`. Tras asociar el dominio, GitHub administra la redirección desde su host antiguo; comprobarla, no asumir qué URL concreta terminará recibiendo el navegador.

Se conservan `/legal/*.html` con contenido completo y sin depender de JavaScript. Los enlaces antiguos a secciones exclusivas de SignHub (`#proyecto`, `#planes`, `#texto-…`) se trasladan a la landing. La raíz sin fragmento muestra OZZYDEV y una entrada visible a SignHub. El script no propaga consultas o fragmentos desconocidos, que podrían contener credenciales.

Comprobar con HTTPS y recarga directa: `/`, `/signhub/`, `/signhub/legal/privacidad.html`, `/signhub/legal/eliminar-cuenta.html` y `/legal/privacidad.html`. `/signhub` debe añadir la barra; `/SignHub/` no es una ruta válida. Revisar recursos sin 404, teléfono estrecho, documentos sin JavaScript y enlaces mailto. Probar también las URLs antiguas completas después del cambio DNS.

## Contactos públicos

- Empresa: `contacto@ozzydev.cl`.
- Soporte SignHub: `soporte@ozzydev.cl`.
- Privacidad, derechos, eliminación y coordinación de representantes: `privacidad@ozzydev.cl`.

Actualizar en `site.config.json`, plantillas HTML, `content/` y `assets/request.js` cuando cambien. El formulario de derechos solo prepara un correo: no lo envía ni acredita recepción. No sustituir el correo usado para iniciar sesión en servicios internos.

Con HTTPS verificado, actualizar Google Play y perfiles públicos: sitio de la app `https://www.ozzydev.cl/signhub/`, política `https://www.ozzydev.cl/signhub/legal/privacidad.html`, eliminación `https://www.ozzydev.cl/signhub/legal/eliminar-cuenta.html`, soporte `soporte@ozzydev.cl`; sitio y contacto del desarrollador `https://www.ozzydev.cl/` y `contacto@ozzydev.cl`. No publicar enlaces aún inaccesibles.
