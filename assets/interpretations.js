// Video URLs are assigned only after an explicit action; opening the page downloads no video.
const configuration = document.getElementById('sign-interpretations');
const players = new Set();
const configured = segment => Number.isFinite(segment.start) && Number.isFinite(segment.end);

if (configuration) {
  const data = JSON.parse(configuration.textContent);
  for (const block of data.blocks) {
    if (!block.src) continue;
    const card = document.querySelector(`[data-interpretation="${block.id}"]`);
    if (!card) continue;
    const opener = card.querySelector('.sign-open');
    const panel = card.querySelector('.sign-panel');
    const video = card.querySelector('video');
    const status = card.querySelector('.sign-status');
    const chapters = card.querySelector('.sign-chapters');
    const fragments = block.segments.filter(configured);
    const controls = new Map();
    let pending = null, boundary = null, generation = 0, timeout = null, frame = null;
    let returnFocus = opener;
    const say = message => { status.textContent = message; };
    const clearLoading = () => { clearTimeout(timeout); card.removeAttribute('aria-busy'); };

    function highlight(segment) {
      for (const item of fragments) {
        const active = item === segment;
        document.getElementById(item.target).classList.toggle('sign-text-active', active);
        for (const control of controls.get(item.target) || []) control.setAttribute('aria-pressed', String(active));
      }
    }
    function stop() {
      generation++;
      pending = null;
      boundary = null;
      cancelAnimationFrame(frame);
      clearLoading();
      video.pause();
      highlight(null);
    }
    const player = {video, stop};
    players.add(player);
    function pauseOthers() {
      for (const other of players) if (other !== player) other.stop();
    }
    function fail(message) {
      stop();
      say(message);
    }
    function startPending() {
      // Metadata alone is insufficient: some browsers clamp early seeks to zero.
      if (!pending || video.readyState < 2) return;
      const request = pending;
      const {segment, token} = request;
      const start = segment?.start ?? 0;
      if (!Number.isFinite(video.duration) || start >= video.duration || (segment && segment.end > video.duration + 0.1)) {
        fail('Este fragmento no coincide con la duración del video. Puedes intentar ver el bloque completo.');
        return;
      }
      const canSeek = start === 0 || Array.from({length: video.seekable.length}, (_, i) => i).some(i => start >= video.seekable.start(i) && start <= video.seekable.end(i));
      if (!canSeek) {
        if (video.readyState === 4 && video.networkState === 1) fail('Este archivo no permite saltar al fragmento solicitado. Puedes ver el bloque completo.');
        return;
      }
      pending = null;
      clearLoading();
      boundary = segment?.end ?? null;
      video.currentTime = start;
      highlight(segment);
      say(segment ? `Fragmento: ${segment.label}` : 'Bloque completo.');
      const promise = video.play();
      promise?.catch(() => {
        if (token === generation) say('Pulsa reproducir en el video para continuar.');
      });
    }
    function play(segment = null, trigger = opener) {
      stop();
      pauseOthers();
      returnFocus = trigger;
      panel.hidden = false;
      opener.setAttribute('aria-expanded', 'true');
      // Opening a FAQ fragment reveals the text it interprets, too.
      const target = segment && document.getElementById(segment.target);
      const details = target?.closest('details');
      if (details) details.open = true;
      pending = {segment, token: generation};
      say('Cargando interpretación…');
      card.setAttribute('aria-busy', 'true');
      timeout = setTimeout(() => fail('El video está tardando en cargar. Revisa tu conexión y vuelve a elegir el fragmento.'), 20000);
      if (!video.getAttribute('src') || video.error) {
        if (block.poster) video.poster = block.poster;
        video.preload = 'auto';
        video.src = block.src;
        video.load();
      }
      startPending();
      // Keep the player in its section. Scroll only when the user requests a distant fragment.
      const bounds = panel.getBoundingClientRect();
      if (bounds.top < 0 || bounds.bottom > window.innerHeight) panel.scrollIntoView({block: 'nearest', behavior: 'instant'});
    }
    opener.hidden = false;
    opener.addEventListener('click', () => {
      if (panel.hidden) play();
      else { stop(); panel.hidden = true; opener.setAttribute('aria-expanded', 'false'); }
    });
    card.querySelector('.sign-full').addEventListener('click', event => play(null, event.currentTarget));
    card.querySelector('.sign-close').addEventListener('click', () => {
      stop();
      panel.hidden = true;
      opener.setAttribute('aria-expanded', 'false');
      // A control inside the panel cannot receive focus once hidden.
      (panel.contains(returnFocus) ? opener : returnFocus).focus({preventScroll: true});
    });
    if (!fragments.length) card.querySelector('.sign-help').textContent = 'Interpretación del bloque completo. Los fragmentos por texto aún no están disponibles.';
    for (const segment of fragments) {
      const target = document.getElementById(segment.target);
      const chapter = document.createElement('button');
      chapter.type = 'button';
      chapter.textContent = segment.label;
      chapter.setAttribute('aria-controls', panel.id);
      chapter.setAttribute('aria-pressed', 'false');
      chapter.addEventListener('click', () => play(segment, chapter));
      chapters.append(chapter);
      const cue = document.createElement('button');
      cue.type = 'button';
      cue.className = 'sign-cue';
      cue.textContent = '▷ Ver este texto en señas';
      cue.setAttribute('aria-label', `Ver en Lengua de Señas Chilena: ${segment.label}`);
      cue.setAttribute('aria-controls', panel.id);
      cue.setAttribute('aria-pressed', 'false');
      cue.addEventListener('click', () => play(segment, cue));
      if (target.matches('p')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'sign-text-wrap';
        target.before(wrapper);
        wrapper.append(target, cue);
      } else target.append(cue);
      controls.set(segment.target, [cue, chapter]);
      target.classList.add('sign-text-linked');
      target.addEventListener('click', event => {
        if (event.target.closest('a, button, input, summary, select, textarea') || window.getSelection()?.toString()) return;
        play(segment, cue);
      });
    }
    video.addEventListener('loadedmetadata', startPending);
    video.addEventListener('loadeddata', startPending);
    video.addEventListener('canplay', startPending);
    video.addEventListener('progress', startPending);
    video.addEventListener('canplaythrough', startPending);
    video.addEventListener('error', () => fail('No pudimos cargar la interpretación. Vuelve a intentarlo con «Ver bloque completo» o elige un fragmento. El texto sigue disponible.'));
    video.addEventListener('play', pauseOthers);
    video.addEventListener('ended', () => { boundary = null; highlight(null); say('Interpretación finalizada. Puedes volver a reproducirla.'); });
    function updatePlayback() {
      if (pending) return;
      if (boundary !== null && video.currentTime >= boundary) {
        video.pause();
        boundary = null;
        highlight(null);
        say('Fragmento finalizado. Elige otro texto o vuelve a reproducir este fragmento.');
        return;
      }
      highlight(fragments.find(segment => video.currentTime >= segment.start && video.currentTime < segment.end));
    }
    video.addEventListener('timeupdate', updatePlayback);
    // timeupdate can be several hundred milliseconds apart. Check visible playback each frame.
    function tick() {
      updatePlayback();
      if (!video.paused) frame = requestAnimationFrame(tick);
    }
    video.addEventListener('playing', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); });
    video.addEventListener('pause', () => cancelAnimationFrame(frame));
    // Native seeking remains usable: leaving a selected fragment restores whole-video playback.
    video.addEventListener('seeking', () => {
      if (boundary === null) return;
      const selected = fragments.find(segment => segment.end === boundary);
      if (selected && (video.currentTime < selected.start || video.currentTime > selected.end)) boundary = null;
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) for (const player of players) player.stop();
  });
}
