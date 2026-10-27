'use strict';
// Preserve old campaign links to SignHub sections without forwarding unknown
// query strings or fragments (which could contain authentication credentials).
const signHubAnchors = new Set(['proyecto', 'planes', 'texto-presentacion', 'texto-proyecto', 'texto-personal', 'texto-comunidad', 'texto-funcionamiento', 'texto-captura', 'texto-organiza', 'texto-conecta', 'texto-planes', 'texto-plan-comunidad', 'texto-plan-institucion', 'texto-plan-organizacion', 'texto-condiciones', 'texto-audiencia', 'texto-autorizaciones', 'texto-ensenanza', 'texto-menores', 'texto-demo', 'texto-plataformas', 'texto-descarga', 'texto-contacto']);
const oldProjectHost = location.hostname === 'ozzydevspa.github.io';
if (signHubAnchors.has(location.hash.slice(1)) || (oldProjectHost && location.hash === '#contacto')) {
  location.replace(new URL(`signhub/${location.hash}`, location.href.split('#')[0]).href);
}
