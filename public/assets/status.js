(() => {
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#statusDialog');
  const preview = $('#statusPreview');
  if (!dialog || !preview) return;

  const ctx = preview.getContext('2d');
  const siteSnow = $('#snowLayer');
  function refreshPageEffects() {
    if (!siteSnow) return;
    siteSnow.replaceChildren();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const settings = window.gustinGetVisualSettings?.() || {};
    const effect = settings.effect || 'snow', intensity = Math.max(0, Math.min(100, Number(settings.intensity ?? 55)));
    if (effect === 'none' || intensity < 2) return;
    const symbols = effect === 'stars' ? ['✦', '✧', '⋆'] : effect === 'sparkles' ? ['✧', '·', '✦', '✺'] : ['❄', '❅', '✧'];
    const amount = Math.round(18 + intensity * .64);
    for (let i = 0; i < amount; i++) {
      const particle = document.createElement('span');
      particle.className = `site-particle site-particle-${effect}`;
      particle.textContent = symbols[(i * 7) % symbols.length];
      particle.style.left = `${(i * 47.3) % 100}%`;
      particle.style.top = effect === 'stars' ? `${(i * 31.7) % 96}%` : '-30px';
      particle.style.fontSize = `${8 + (i * 13) % 14}px`;
      particle.style.opacity = String((.12 + ((i * 7) % 36) / 100) * intensity / 55);
      particle.style.animationDuration = `${effect === 'stars' ? 2 + (i % 5) : 12 + (i * 11) % 18}s`;
      particle.style.animationDelay = `${-((i * 17) % 28)}s`;
      particle.style.setProperty('--sway', `${((i * 19) % 130) - 65}px`);
      siteSnow.append(particle);
    }
  }
  refreshPageEffects();
  window.addEventListener('gustin:visual-settings', refreshPageEffects);
  const form = {
    song: $('#statusSong'), artist: $('#statusArtist'), lyrics: $('#statusLyrics'),
    format: $('#statusFormat'), duration: $('#statusDuration'), theme: $('#statusTheme'),
    font: $('#statusFont'), background: $('#statusBackground'), audio: $('#statusAudioUpload'), track: $('#statusTrack'), audioStart: $('#statusAudioStart'),
    snow: $('#statusSnow'), label: $('#statusLabel'), animation: $('#statusAnimation'), message: $('#statusMessage'),
    download: $('#statusDownload'), share: $('#statusShare'), previewPlay: $('#statusPreviewPlay'), demo: $('#statusLyricsDemo'),
    lyricsFile: $('#statusLyricsFile'), audioPreview: $('#statusAudioPreview'), markCue: $('#statusMarkCue'),
    cover: $('#statusCoverUpload'), showCover: $('#statusShowCover')
  };
  const palettes = {
    ice: ['#07111a', '#112c3d', '#9ce5ff', '#f5fbff'],
    neon: ['#07120c', '#153622', '#b6ff68', '#f7fff1'],
    violet: ['#100b19', '#322044', '#c8a5ff', '#fbf7ff'],
    rose: ['#1c0d17', '#462034', '#ff9bc5', '#fff6fa'],
    sunset: ['#1b0b16', '#4b1b2d', '#ffad70', '#fff4e7'],
    cyber: ['#08071b', '#1d1550', '#6df6ff', '#f7f3ff'],
    mono: ['#080808', '#292929', '#ffffff', '#ffffff']
  };
  const particleSeed = Array.from({ length: 56 }, (_, i) => ({
    x: ((i * 73.17) % 997) / 997,
    y: ((i * 37.91) % 991) / 991,
    size: 1.4 + ((i * 17) % 42) / 10,
    speed: 0.035 + ((i * 11) % 40) / 500,
    drift: (((i * 29) % 100) - 50) / 420,
    phase: i * 3.7
  }));
  let backgroundImage = null;
  let generatedFile = null;
  let animationFrame = 0;
  let busy = false;
  let audioPreviewUrl = '';
  let previewStart = 0;
  let coverImage = null, coverObjectUrl = '';

  function cueData() {
    const rows = form.lyrics.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const timedRows = rows.flatMap(row => {
      if (/^\[(?:ti|ar|al|by|length|re|ve|offset|kana|la|au):/i.test(row)) return [];
      const stamps = [...row.matchAll(/\[(?:(\d{1,2}):)?(\d{1,2})(?:\.(\d{1,3}))?\]/g)];
      if (!stamps.length) return [];
      const text = row.replace(/\[(?:(\d{1,2}):)?(\d{1,2})(?:\.(\d{1,3}))?\]/g, '').trim();
      if (!text) return [];
      return stamps.map(m => ({ text, start: (Number(m[1] || 0) * 60) + Number(m[2]) + Number(`0.${m[3] || 0}`) }));
    }).sort((a, b) => a.start - b.start);
    if (timedRows.length) return timedRows;
    const lyricRows = rows.filter(row => !/^\[(?:ti|ar|al|by|length|re|ve|offset|kana|la|au):/i.test(row));
    const duration = Number(form.duration.value) || 30;
    return lyricRows.map((text, i) => ({ text, start: i * duration / Math.max(1, lyricRows.length) }));
  }
  function lines() { return cueData().map(cue => cue.text); }
  function dimensions() {
    return form.format.value === 'square' ? [960, 960] : form.format.value === 'feed' ? [864, 1080] : [720, 1280];
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  }
  function wrapText(text, maxWidth, font) {
    ctx.font = font;
    const words = text.split(/\s+/);
    const result = [];
    let line = '';
    for (const word of words) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > maxWidth && line) { result.push(line); line = word; }
      else line = next;
    }
    if (line) result.push(line);
    return result;
  }
  function drawSnow(time, w, h, count = 34) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (const p of particleSeed.slice(0, count)) {
      const y = ((p.y + time * p.speed) % 1.12) * h - h * .06;
      const x = (p.x + Math.sin(time * .45 + p.phase) * p.drift + 1) % 1 * w;
      ctx.globalAlpha = .32 + ((Math.sin(time * 1.2 + p.phase) + 1) * .22);
      ctx.beginPath(); ctx.arc(x, y, p.size * w / 720, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function draw(time = 0) {
    const [w, h] = dimensions();
    if (preview.width !== w || preview.height !== h) { preview.width = w; preview.height = h; }
    const palette = palettes[form.theme.value] || palettes.ice;
    const gradient = ctx.createLinearGradient(0, 0, w * .82, h);
    gradient.addColorStop(0, palette[0]); gradient.addColorStop(.55, palette[1]); gradient.addColorStop(1, palette[0]);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    if (backgroundImage) {
      const scale = Math.max(w / backgroundImage.width, h / backgroundImage.height);
      const iw = backgroundImage.width * scale, ih = backgroundImage.height * scale;
      ctx.save(); ctx.globalAlpha = .36; ctx.drawImage(backgroundImage, (w - iw) / 2, (h - ih) / 2, iw, ih); ctx.restore();
      const veil = ctx.createLinearGradient(0, 0, 0, h);
      veil.addColorStop(0, palette[0] + 'aa'); veil.addColorStop(.52, '#05080bbb'); veil.addColorStop(1, palette[0] + 'e8');
      ctx.fillStyle = veil; ctx.fillRect(0, 0, w, h);
    }
    const glow = ctx.createRadialGradient(w * .5, h * .43, 0, w * .5, h * .43, w * .66);
    glow.addColorStop(0, palette[2] + '32'); glow.addColorStop(1, 'transparent'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    if (form.snow.checked) drawSnow(time, w, h, form.theme.value === 'ice' ? 48 : 28);

    const safe = w * .105;
    const labelOn = form.label.checked;
    const song = form.song.value.trim() || 'Mi canción';
    const artist = form.artist.value.trim();
    const cues = cueData();
    const bodyLines = cues.map(cue => cue.text);
    const duration = Number(form.duration.value) || 12;
    const localTime = time % duration;
    let idx = 0;
    for (let i = 1; i < cues.length; i++) if (cues[i].start <= localTime) idx = i;
    const cueStart = cues[idx]?.start || 0;
    const cueEnd = cues[idx + 1]?.start ?? duration;
    const lyricProgress = Math.max(0, Math.min(1, (localTime - cueStart) / Math.max(.1, cueEnd - cueStart)));
    const easedProgress = lyricProgress * lyricProgress * (3 - 2 * lyricProgress);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (labelOn) {
      ctx.fillStyle = palette[2]; ctx.font = `700 ${Math.round(w * .025)}px Arial`; ctx.letterSpacing = `${w * .005}px`;
      ctx.fillText('MI ESTADO · GUSTIN SIN A', w / 2, h * .12, w - safe * 2);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#ffffff'; ctx.font = `800 ${Math.round(w * .052)}px Arial`;
      ctx.fillText(song, w / 2, h * .19, w - safe * 2);
      ctx.fillStyle = '#ffffffa8'; ctx.font = `500 ${Math.round(w * .027)}px Arial`;
      ctx.fillText(artist, w / 2, h * .232, w - safe * 2);
    }
    if (coverImage && form.showCover.checked) {
      const size = w * .21, cy = h * (labelOn ? .345 : .30);
      ctx.save(); ctx.beginPath(); ctx.arc(w / 2, cy, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(coverImage, w / 2 - size / 2, cy - size / 2, size, size); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(w / 2, cy, size / 2 + 2, 0, Math.PI * 2); ctx.strokeStyle = palette[2] + 'cc'; ctx.lineWidth = Math.max(2, w * .006); ctx.shadowColor = palette[2]; ctx.shadowBlur = w * .045; ctx.stroke(); ctx.restore();
    }

    const centerY = h * (labelOn ? .52 : .5);
    const maxTextW = w - safe * 2.4;
    const face = form.font.value === 'serif' ? 'Georgia, serif' : form.font.value === 'clean' ? 'Arial, sans-serif' : 'Arial, sans-serif';
    if (bodyLines.length) {
      const prev = bodyLines[(idx - 1 + bodyLines.length) % bodyLines.length];
      const next = bodyLines[(idx + 1) % bodyLines.length];
      const base = Math.round(w * .075);
      const fontSize = Math.max(Math.round(w * .055), Math.min(base, Math.round(w * 5.4 / Math.max(11, bodyLines[idx].length))));
      for (const [text, y, alpha, scale] of [[prev, centerY - h * (.125 - easedProgress * .018), .28 + easedProgress * .12, .72 + easedProgress * .04], [next, centerY + h * (.15 - easedProgress * .018), .38 - easedProgress * .1, .74 + easedProgress * .04]]) {
        if (bodyLines.length < 2) continue;
        ctx.globalAlpha = alpha; ctx.fillStyle = '#ffffff';
        const f = `${form.font.value === 'bold' ? 700 : 500} ${Math.round(fontSize * scale)}px ${face}`;
        const wrapped = wrapText(text, maxTextW, f);
        wrapped.slice(0, 2).forEach((line, n) => ctx.fillText(line, w / 2, y + (n - (wrapped.length - 1) / 2) * fontSize * .9, maxTextW));
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.shadowColor = palette[2] + '88'; ctx.shadowBlur = w * .09;
      ctx.fillStyle = '#ffffff0c'; roundRect(ctx, safe * .72, centerY - h * .077, w - safe * 1.44, h * .154, w * .04);
      ctx.strokeStyle = palette[2] + '70'; ctx.lineWidth = Math.max(1, w / 480); ctx.stroke(); ctx.restore();
      ctx.fillStyle = palette[3]; ctx.font = `${form.font.value === 'bold' ? 800 : 600} ${fontSize}px ${face}`;
      const active = wrapText(bodyLines[idx], maxTextW, ctx.font);
      const animation = form.animation?.value || 'soft';
      const pulse = animation === 'pulse' ? 1 + Math.sin(time * 5.2) * .025 : 1;
      const entrance = animation === 'soft' ? .92 + easedProgress * .08 : animation === 'karaoke' ? .97 + easedProgress * .03 : pulse;
      ctx.save(); ctx.globalAlpha = animation === 'soft' ? .72 + easedProgress * .28 : 1;
      ctx.translate(w / 2, centerY + (1 - easedProgress) * h * .018); ctx.scale(entrance, entrance);
      active.slice(0, 3).forEach((line, n) => {
        const y = (n - (Math.min(3, active.length) - 1) / 2) * fontSize * 1.12;
        if (animation === 'karaoke') { const tint = ctx.createLinearGradient(-maxTextW / 2, 0, maxTextW / 2, 0); tint.addColorStop(0, palette[2]); tint.addColorStop(Math.max(.02, Math.min(.98, easedProgress)), palette[2]); tint.addColorStop(Math.min(1, easedProgress + .015), palette[3]); tint.addColorStop(1, palette[3]); ctx.fillStyle = tint; }
        else ctx.fillStyle = palette[3];
        ctx.fillText(line, 0, y, maxTextW);
      });
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffffb0'; ctx.font = `600 ${Math.round(w * .052)}px Arial`;
      ctx.fillText('Tus líneas van a aparecer acá', w / 2, centerY, w - safe * 2);
      ctx.fillStyle = '#ffffff70'; ctx.font = `400 ${Math.round(w * .03)}px Arial`;
      ctx.fillText('Escribí una frase por renglón', w / 2, centerY + h * .055, w - safe * 2);
    }

    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffffb4'; ctx.font = `600 ${Math.round(w * .024)}px Arial`;
    ctx.fillText('una canción, un momento ✦', w / 2, h * .91, w - safe * 2);
    ctx.fillStyle = '#ffffff30'; roundRect(ctx, safe, h * .95, w - safe * 2, Math.max(3, h * .004), h * .003);
    ctx.fillStyle = palette[2]; roundRect(ctx, safe, h * .95, (w - safe * 2) * ((time % duration) / duration), Math.max(3, h * .004), h * .003);
  }
  function previewLoop(now) {
    const audioStart = Math.max(0, Number(form.audioStart.value) || 0);
    const maxPlayhead = Math.max(0, Number(form.duration.value) - .001);
    const playhead = Math.min(maxPlayhead, audioPreviewUrl && form.audioPreview.readyState ? Math.max(0, form.audioPreview.currentTime - audioStart) : Math.max(0, (now - previewStart) / 1000));
    draw(playhead); animationFrame = requestAnimationFrame(previewLoop);
  }
  function setMessage(text) { form.message.textContent = text; }
  function setAudioFile(file) {
    const transfer = new DataTransfer();
    if (file) transfer.items.add(file);
    form.audio.files = transfer.files;
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    audioPreviewUrl = '';
    if (file) {
      audioPreviewUrl = URL.createObjectURL(file);
      form.audioPreview.src = audioPreviewUrl;
      form.audioPreview.onloadedmetadata = () => { form.audioPreview.currentTime = Math.min(Number(form.audioStart.value) || 0, form.audioPreview.duration || 0); };
    } else { form.audioPreview.pause(); form.audioPreview.removeAttribute('src'); form.audioPreview.load(); }
    generatedFile = null; form.share.disabled = true;
  }
  function setCover(source) {
    if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = '';
    coverImage = null;
    if (!source) return draw(0);
    const image = new Image();
    image.onload = () => { coverImage = image; generatedFile = null; form.share.disabled = true; draw(0); };
    image.onerror = () => setMessage('No pude abrir esa portada. Elegí otra imagen.');
    if (source instanceof File) { coverObjectUrl = URL.createObjectURL(source); image.src = coverObjectUrl; }
    else image.src = source;
  }
  async function chooseTrack(id) {
    const saved = window.gustinGetExportTracks?.() || [];
    const track = saved.find(item => item.id === id);
    if (!track) return;
    form.song.value = track.title || '';
    form.artist.value = track.artist || '';
    form.audioStart.value = String(track.start || 0);
    setCover(track.coverData || '');
    if (track.audio) {
      try {
        const response = await fetch(track.audio);
        const blob = await response.blob();
        setAudioFile(new File([blob], 'cancion-elegida.' + ((blob.type.split('/')[1] || 'mp3').split(';')[0]), { type: blob.type || 'audio/mpeg' }));
        setMessage('Canción y audio listos. Pegá la letra sincronizada y generá el MP4.');
      } catch { setAudioFile(null); setMessage('No pude cargar el audio guardado. Subí el archivo de audio original.'); }
    } else {
      setAudioFile(null);
      setMessage('Este tema solo tiene un enlace de YouTube/Spotify. Para poner su música en el MP4, elegí un tema con audio cargado o subí el archivo original.');
    }
  }
  function populateTracks() {
    const saved = window.gustinGetExportTracks?.() || [];
    form.track.replaceChildren(new Option('Elegir canción guardada…', ''));
    saved.forEach(item => form.track.add(new Option(`${item.audio ? '♫ ' : '♪ '}${item.title} · ${item.artist}${item.audio ? ' · audio listo' : ''}`, item.id)));
    const featured = saved.find(item => item.featured && item.audio) || saved.find(item => item.audio) || saved.find(item => item.featured) || saved[0];
    if (featured) { form.track.value = featured.id; chooseTrack(featured.id); }
  }
  function openCreator() {
    populateTracks();
    form.share.disabled = true; generatedFile = null;
    dialog.showModal(); previewStart = performance.now(); draw(0);
    cancelAnimationFrame(animationFrame); animationFrame = requestAnimationFrame(previewLoop);
  }
  function closeCreator() { cancelAnimationFrame(animationFrame); animationFrame = 0; form.audioPreview.pause(); }
  $('#statusOpen')?.addEventListener('click', openCreator);
  dialog.addEventListener('close', closeCreator);
  form.track.addEventListener('change', () => chooseTrack(form.track.value));
  form.audio.addEventListener('change', () => {
    const file=form.audio.files?.[0];
    if(file&&file.size>8*1024*1024){form.audio.value='';setAudioFile(null);setMessage('El audio supera los 8 MB. Elegí un archivo más liviano.');return}
    setAudioFile(file||null);if(file){form.track.value='';setMessage('Audio propio listo para incluirlo en el MP4.')}
  });
  form.audioStart.addEventListener('input', () => { generatedFile = null; form.share.disabled = true; if (form.audioPreview.readyState) form.audioPreview.currentTime = Math.min(Number(form.audioStart.value) || 0, form.audioPreview.duration || 0); });
  form.cover.addEventListener('change', () => {
    const file=form.cover.files?.[0];if(!file)return;
    if(file.size>3*1024*1024){form.cover.value='';setMessage('La portada supera los 3 MB. Elegí una imagen más liviana.');return}
    setCover(file);form.showCover.checked=true;setMessage('Portada lista para incluirla en el video.');
  });
  form.lyricsFile.addEventListener('change', async () => {
    const file = form.lyricsFile.files?.[0]; if (!file) return;
    try { form.lyrics.value = await file.text(); generatedFile = null; form.share.disabled = true; draw(0); setMessage('Letra cargada. Si el archivo tiene marcas de tiempo LRC, se sincroniza automáticamente.'); }
    catch { setMessage('No pude leer esa letra. Probá con un archivo .LRC o .TXT.'); }
  });
  form.markCue.addEventListener('click', () => {
    if (!audioPreviewUrl || !form.audioPreview.readyState) { setMessage('Elegí o subí el audio y reproducilo para marcar la letra.'); return; }
    const start = form.lyrics.selectionStart, end = form.lyrics.selectionEnd, text = form.lyrics.value;
    const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEndFound = text.indexOf('\n', end);
    const lineEnd = lineEndFound < 0 ? text.length : lineEndFound;
    const currentLine = text.slice(lineStart, lineEnd).trim();
    const lyric = currentLine.replace(/^(?:\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*)+/, '').trim();
    if (!lyric) { setMessage('Escribí la línea y dejá el cursor dentro de ella antes de marcarla.'); return; }
    const seconds = Math.max(0, form.audioPreview.currentTime - (Number(form.audioStart.value) || 0));
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const whole = String(Math.floor(seconds % 60)).padStart(2, '0');
    const fraction = String(Math.floor((seconds % 1) * 100)).padStart(2, '0');
    const stamped = `[${minutes}:${whole}.${fraction}] ${lyric}`;
    form.lyrics.value = text.slice(0, lineStart) + stamped + text.slice(lineEnd);
    form.lyrics.setSelectionRange(lineStart + stamped.length, lineStart + stamped.length);
    form.lyrics.dispatchEvent(new Event('input', { bubbles: true }));
    setMessage(`Línea marcada en ${minutes}:${whole}.${fraction}. Seguís con la próxima mientras escuchás.`);
  });
  form.previewPlay.addEventListener('click', () => {
    if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = 0; form.previewPlay.textContent = '▶ Reanudar vista'; }
    else { animationFrame = requestAnimationFrame(previewLoop); form.previewPlay.textContent = '❚❚ Pausar vista'; }
  });
  form.demo.addEventListener('click', () => { form.lyrics.value = '[00:00.00] Hoy te vuelvo a encontrar\n[00:08.00] aunque cambie la ciudad\n[00:16.00] esta canción sabe esperar\n[00:24.00] y me trae de vuelta a vos'; generatedFile = null; form.share.disabled = true; draw(0); });
    for (const control of [form.song, form.artist, form.lyrics, form.format, form.duration, form.theme, form.font, form.animation, form.snow, form.label, form.showCover]) {
    control.addEventListener('input', () => { generatedFile = null; form.share.disabled = true; draw(performance.now() / 1000); });
    control.addEventListener('change', () => { generatedFile = null; form.share.disabled = true; draw(performance.now() / 1000); });
  }
  form.background.addEventListener('change', () => {
    const file = form.background.files?.[0]; backgroundImage = null;
    if (!file) return draw(0);
    if (!file.type.startsWith('image/')) { setMessage('Elegí una imagen para el fondo.'); return; }
    const image = new Image(); image.onload = () => { backgroundImage = image; draw(0); };
    image.onerror = () => setMessage('No pude abrir esa imagen.'); image.src = URL.createObjectURL(file);
  });

  async function readAudioBuffer(file, duration, AudioBufferSource, startSeconds = 0) {
    const audioContext = new AudioContext();
    try {
      const decoded = await audioContext.decodeAudioData(await file.arrayBuffer());
      const offset = Math.min(decoded.length, Math.floor(Math.max(0, startSeconds) * decoded.sampleRate));
      const length = Math.ceil(duration * decoded.sampleRate);
      const available = Math.max(0, Math.min(length, decoded.length - offset));
      if (!available) throw new Error('El segundo de inicio quedó después del final del audio. Ajustá el inicio y probá otra vez.');
      const clipped = audioContext.createBuffer(Math.min(2, decoded.numberOfChannels), length, decoded.sampleRate);
      for (let channel = 0; channel < clipped.numberOfChannels; channel++) clipped.copyToChannel(decoded.getChannelData(channel).subarray(offset, offset + available), channel);
      return { audioContext, clipped };
    } catch (error) { await audioContext.close(); throw error; }
  }

  async function buildMp4() {
    if (busy) return;
    if (!lines().length) { setMessage('Escribí al menos una línea de letra.'); form.lyrics.focus(); return; }
    if (!form.audio.files?.[0]) { setMessage('Para que el video tenga la canción, elegí un tema con audio guardado o subí el archivo original. No puedo extraer el audio desde YouTube o Spotify.'); form.audio.focus(); return; }
    busy = true; form.download.disabled = true; form.share.disabled = true;
    const [w, h] = dimensions(); preview.width = w; preview.height = h;
    const duration = Number(form.duration.value) || 30;
    let fps = 60, frames = 0;
    let audioContext;
    try {
      setMessage('Preparando el creador de MP4…');
      const media = await import('https://cdn.jsdelivr.net/npm/mediabunny@1.66.4/+esm');
      const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, canEncodeVideo, canEncodeAudio } = media;
      if (!await canEncodeVideo('avc', { width: w, height: h, frameRate: fps, bitrate: 3_500_000 })) {
        fps = 30;
        if (!await canEncodeVideo('avc', { width: w, height: h, frameRate: fps, bitrate: 2_500_000 })) {
          throw new Error('Este navegador no puede crear MP4 en este dispositivo. Probá desde una versión reciente de Chrome o Safari.');
        }
        setMessage('Tu dispositivo no llega a 60 fps; estoy preparando el MP4 a 30 fps para que igual puedas descargarlo.');
      }
      frames = Math.ceil(duration * fps);
      const target = new BufferTarget();
      const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
      const videoSource = new CanvasSource(preview, { codec: 'avc', bitrate: fps === 60 ? 3_500_000 : 2_500_000, frameRate: fps });
      output.addVideoTrack(videoSource);
      let audioSource = null, clippedAudio = null;
      const audioFile = form.audio.files?.[0];
      if (audioFile) {
        setMessage('Preparando el audio en este dispositivo…');
        const decoded = await readAudioBuffer(audioFile, duration, AudioBufferSource, Number(form.audioStart.value) || 0);
        audioContext = decoded.audioContext; clippedAudio = decoded.clipped;
        if (await canEncodeAudio('aac', { sampleRate: clippedAudio.sampleRate, numberOfChannels: clippedAudio.numberOfChannels, bitrate: 128_000 })) {
          audioSource = new AudioBufferSource({ codec: 'aac', bitrate: 128_000 }); output.addAudioTrack(audioSource);
        } else {
          await audioContext.close(); audioContext = null;
          throw new Error('Este dispositivo no puede incluir audio AAC en el MP4. Podés descargar el video sin audio.');
        }
      }
      cancelAnimationFrame(animationFrame); animationFrame = 0;
      await output.start();
      for (let frame = 0; frame < frames; frame++) {
        draw(frame / fps);
        await videoSource.add(frame / fps, 1 / fps);
        if (frame % 24 === 0) setMessage(`Armando MP4… ${Math.round(frame / frames * 100)}%`);
      }
      if (audioSource && clippedAudio) await audioSource.add(clippedAudio);
      await output.finalize();
      if (audioContext) { await audioContext.close(); audioContext = null; }
      const buffer = target.buffer;
      generatedFile = new File([buffer], 'mi-estado-musical.mp4', { type: 'video/mp4' });
      const url = URL.createObjectURL(generatedFile);
      const a = document.createElement('a'); a.href = url; a.download = generatedFile.name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      form.share.disabled = false;
      setMessage(`¡Listo! MP4 de ${duration} segundos a ${fps} fps con audio. Ya podés subirlo a tu Estado de WhatsApp.`);
    } catch (error) {
      if (audioContext) await audioContext.close().catch(() => {});
      setMessage(error?.message || 'No se pudo generar el video. Probá de nuevo o quitá el audio.');
    } finally { busy = false; form.download.disabled = false; draw(0); if (dialog.open && !animationFrame) { previewStart = performance.now(); animationFrame = requestAnimationFrame(previewLoop); } }
  }
  form.download.addEventListener('click', buildMp4);
  form.share.addEventListener('click', async () => {
    if (!generatedFile) return buildMp4();
    try {
      if (navigator.canShare?.({ files: [generatedFile] })) {
        await navigator.share({ files: [generatedFile], title: 'Mi estado musical' });
        setMessage('Listo. Elegí WhatsApp en el menú para compartirlo.');
      } else {
        setMessage('El navegador no ofrece compartir archivos desde acá. El MP4 ya está descargado: adjuntalo al Estado de WhatsApp.');
      }
    } catch (error) { if (error?.name !== 'AbortError') setMessage('El video sigue descargado. Podés adjuntarlo al Estado de WhatsApp.'); }
  });
})();

