(() => {
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#statusDialog');
  const preview = $('#statusPreview');
  if (!dialog || !preview) return;

  const ctx = preview.getContext('2d');
  const siteSnow = $('#snowLayer');
  if (siteSnow && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let i = 0; i < 38; i++) {
      const flake = document.createElement('span');
      flake.className = 'site-flake'; flake.textContent = i % 3 === 0 ? '❅' : '❄';
      flake.style.left = `${(i * 47.3) % 100}%`;
      flake.style.fontSize = `${9 + (i * 13) % 13}px`;
      flake.style.opacity = `${.22 + ((i * 7) % 45) / 100}`;
      flake.style.animationDuration = `${12 + (i * 11) % 18}s`;
      flake.style.animationDelay = `${-((i * 17) % 28)}s`;
      flake.style.setProperty('--sway', `${((i * 19) % 130) - 65}px`);
      siteSnow.append(flake);
    }
  }
  const form = {
    song: $('#statusSong'), artist: $('#statusArtist'), lyrics: $('#statusLyrics'),
    format: $('#statusFormat'), duration: $('#statusDuration'), theme: $('#statusTheme'),
    font: $('#statusFont'), background: $('#statusBackground'), audio: $('#statusAudio'),
    snow: $('#statusSnow'), label: $('#statusLabel'), message: $('#statusMessage'),
    download: $('#statusDownload'), share: $('#statusShare')
  };
  const palettes = {
    ice: ['#07111a', '#112c3d', '#9ce5ff', '#f5fbff'],
    neon: ['#07120c', '#153622', '#b6ff68', '#f7fff1'],
    violet: ['#100b19', '#322044', '#c8a5ff', '#fbf7ff'],
    rose: ['#1c0d17', '#462034', '#ff9bc5', '#fff6fa'],
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

  function lines() { return form.lyrics.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean); }
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
    const bodyLines = lines();
    const duration = Number(form.duration.value) || 12;
    const idx = bodyLines.length ? Math.min(bodyLines.length - 1, Math.floor((time % duration) / duration * bodyLines.length)) : 0;
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

    const centerY = h * (labelOn ? .52 : .5);
    const maxTextW = w - safe * 2.4;
    const face = form.font.value === 'serif' ? 'Georgia, serif' : form.font.value === 'clean' ? 'Arial, sans-serif' : 'Arial, sans-serif';
    if (bodyLines.length) {
      const prev = bodyLines[(idx - 1 + bodyLines.length) % bodyLines.length];
      const next = bodyLines[(idx + 1) % bodyLines.length];
      const base = Math.round(w * .075);
      const fontSize = Math.max(Math.round(w * .055), Math.min(base, Math.round(w * 5.4 / Math.max(11, bodyLines[idx].length))));
      for (const [text, y, alpha, scale] of [[prev, centerY - h * .115, .36, .76], [next, centerY + h * .14, .34, .76]]) {
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
      active.slice(0, 3).forEach((line, n) => ctx.fillText(line, w / 2, centerY + (n - (Math.min(3, active.length) - 1) / 2) * fontSize * 1.12, maxTextW));
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
  function previewLoop(now) { draw(now / 1000); animationFrame = requestAnimationFrame(previewLoop); }
  function setMessage(text) { form.message.textContent = text; }
  function openCreator() {
    const currentTitle = $('#featuredTitle')?.textContent?.trim();
    const currentArtist = $('#featuredArtist')?.textContent?.split('·')[0]?.trim();
    if (currentTitle) form.song.value = currentTitle;
    if (currentArtist) form.artist.value = currentArtist;
    form.share.disabled = true; generatedFile = null;
    dialog.showModal(); draw(0);
    cancelAnimationFrame(animationFrame); animationFrame = requestAnimationFrame(previewLoop);
  }
  function closeCreator() { cancelAnimationFrame(animationFrame); }
  $('#statusOpen')?.addEventListener('click', openCreator);
  dialog.addEventListener('close', closeCreator);
  for (const control of [form.song, form.artist, form.lyrics, form.format, form.duration, form.theme, form.font, form.snow, form.label]) {
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

  async function readAudioBuffer(file, duration, AudioBufferSource) {
    const audioContext = new AudioContext();
    try {
      const decoded = await audioContext.decodeAudioData(await file.arrayBuffer());
      const length = Math.min(decoded.length, Math.ceil(duration * decoded.sampleRate));
      const clipped = audioContext.createBuffer(Math.min(2, decoded.numberOfChannels), length, decoded.sampleRate);
      for (let channel = 0; channel < clipped.numberOfChannels; channel++) clipped.copyToChannel(decoded.getChannelData(channel).subarray(0, length), channel);
      return { audioContext, clipped };
    } catch (error) { await audioContext.close(); throw error; }
  }

  async function buildMp4() {
    if (busy) return;
    if (!lines().length) { setMessage('Escribí al menos una línea de letra.'); form.lyrics.focus(); return; }
    busy = true; form.download.disabled = true; form.share.disabled = true;
    const [w, h] = dimensions(); preview.width = w; preview.height = h;
    const duration = Number(form.duration.value) || 12, fps = 24, frames = Math.ceil(duration * fps);
    let audioContext;
    try {
      setMessage('Preparando el creador de MP4…');
      const media = await import('https://cdn.jsdelivr.net/npm/mediabunny@1.66.4/+esm');
      const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, canEncodeVideo, canEncodeAudio } = media;
      if (!await canEncodeVideo('avc', { width: w, height: h, frameRate: fps, bitrate: 1_800_000 })) {
        throw new Error('Este navegador no puede crear MP4 en este dispositivo. Probá desde una versión reciente de Chrome o Safari.');
      }
      const target = new BufferTarget();
      const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
      const videoSource = new CanvasSource(preview, { codec: 'avc', bitrate: 1_800_000, frameRate: fps });
      output.addVideoTrack(videoSource);
      let audioSource = null, clippedAudio = null;
      const audioFile = form.audio.files?.[0];
      if (audioFile) {
        setMessage('Preparando el audio en este dispositivo…');
        const decoded = await readAudioBuffer(audioFile, duration, AudioBufferSource);
        audioContext = decoded.audioContext; clippedAudio = decoded.clipped;
        if (await canEncodeAudio('aac', { sampleRate: clippedAudio.sampleRate, numberOfChannels: clippedAudio.numberOfChannels, bitrate: 128_000 })) {
          audioSource = new AudioBufferSource({ codec: 'aac', bitrate: 128_000 }); output.addAudioTrack(audioSource);
        } else {
          await audioContext.close(); audioContext = null;
          throw new Error('Este dispositivo no puede incluir audio AAC en el MP4. Podés descargar el video sin audio.');
        }
      }
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
      setMessage('¡Listo! Ya se descargó el MP4; podés subirlo a tu Estado de WhatsApp.');
    } catch (error) {
      if (audioContext) await audioContext.close().catch(() => {});
      setMessage(error?.message || 'No se pudo generar el video. Probá de nuevo o quitá el audio.');
    } finally { busy = false; form.download.disabled = false; draw(0); }
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
