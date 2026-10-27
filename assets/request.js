'use strict';
document.getElementById('privacy-request')?.addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(event.currentTarget);
  const kind=String(data.get('kind'));const email=String(data.get('email'));const details=String(data.get('details'));
  const body=`Solicitud: ${kind}\nCorreo de la cuenta: ${email}\n\n${details}\n\nSolicito coordinar la verificación de identidad necesaria. No adjunto contraseñas ni códigos.`;
  window.location.href=`mailto:privacidad@ozzydev.cl?subject=${encodeURIComponent('SignHub · '+kind)}&body=${encodeURIComponent(body)}`;
  document.getElementById('request-status').textContent='Revisa y envía el mensaje en tu aplicación de correo. Aún no se ha enviado ninguna solicitud desde esta web. Si no se abre, escribe a privacidad@ozzydev.cl.';
});
