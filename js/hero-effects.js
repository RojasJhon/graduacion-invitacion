// Decorative WebGL layer: the invitation and its controls remain ordinary HTML.
(function () {
  'use strict';
  const hero = document.getElementById('panel-inicio');
  const canvas = document.getElementById('hero-distortion');
  if (!hero || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return;

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error('Decorative shader unavailable');
    }
    return result;
  }
  let program;
  try {
    const vertex = shader(gl.VERTEX_SHADER, `
      attribute vec2 position;
      varying vec2 uv;
      void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
    `);
    const fragment = shader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D artwork;
      uniform vec2 pointer;
      uniform vec2 velocity;
      uniform float aspect;
      uniform float strength;
      uniform float time;
      void main() {
        vec2 delta = uv - pointer;
        vec2 metric = delta * vec2(aspect, 1.);
        float distance = length(metric);
        float influence = 1. - smoothstep(0., .46, distance);
        influence = pow(influence, 1.35);
        vec2 direction = metric / max(distance, .001);
        vec2 wave = vec2(direction.x / aspect, direction.y);
        vec2 offset = wave * sin(distance * 32. - time * 4.) * .085;
        offset += vec2(sin(uv.y * 105. + time * 3.) / aspect, cos(uv.x * 60. - time * 2.) * .3) * .035;
        offset -= velocity * 1.1;
        vec2 sampleUV = uv + offset * influence * strength;
        vec4 color = texture2D(artwork, sampleUV);
        gl_FragColor = vec4(color.rgb * color.a, color.a);
      }
    `);
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
  } catch (_) {
    if (program) gl.deleteProgram(program);
    return;
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = {};
  ['artwork', 'pointer', 'velocity', 'aspect', 'strength', 'time'].forEach(name => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(uniforms.artwork, 0);
  const art = document.createElement('canvas');
  const ctx = art.getContext('2d');
  if (!ctx) return;
  let aspect = 1;
  let frame = 0;
  let last = 0;
  let clock = 0;
  let strength = 0;
  let targetStrength = 0;
  let x = .5, y = .5, targetX = .5, targetY = .5;
  let visible = true;
  let lost = false;
  const titleElement = hero.querySelector('.hero-title');
  // Title glitch uses hard horizontal scanlines, independent of the liquid background.
  const svgNS = 'http://www.w3.org/2000/svg';
  const filterHost = document.createElementNS(svgNS, 'svg');
  filterHost.setAttribute('width', '0');
  filterHost.setAttribute('height', '0');
  filterHost.setAttribute('aria-hidden', 'true');
  filterHost.style.cssText = 'position:absolute;pointer-events:none';
  filterHost.innerHTML = `<defs><filter id="title-pointer-warp" x="-50%" y="-100%" width="200%" height="300%" color-interpolation-filters="sRGB">
    <feImage result="scanlines" preserveAspectRatio="none"/>
    <feFlood flood-color="#808080" result="neutral"/>
    <feMerge result="field"><feMergeNode in="neutral"/><feMergeNode in="scanlines"/></feMerge>
    <feDisplacementMap in="SourceGraphic" in2="field" scale="0" xChannelSelector="R" yChannelSelector="G"/>
  </filter></defs>`;
  hero.appendChild(filterHost);
  const scanlines = filterHost.querySelector('feImage');
  const displacement = filterHost.querySelector('feDisplacementMap');
  let titleStrength = 0, targetTitleStrength = 0;
  let glitchStep = -1;
  function updateScanlines() {
    const step = Math.floor(clock * 15);
    if (step === glitchStep) return;
    glitchStep = step;
    const width = titleElement.offsetWidth;
    const height = titleElement.offsetHeight;
    // One solid value per band moves that entire slice sideways without bending it.
    let bands = '';
    for (let row = 0; row < height; row += 2) {
      const noise = Math.sin(row * 71.31 + step * 97.17) * 43758.5453;
      const value = Math.round((noise - Math.floor(noise)) * 255);
      bands += `<rect y="${row}" width="${width}" height="2" fill="rgb(${value},127.5,128)"/>`;
    }
    scanlines.setAttribute('x', '0');
    scanlines.setAttribute('y', '0');
    scanlines.setAttribute('width', `${width}px`);
    scanlines.setAttribute('height', `${height}px`);
    scanlines.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${bands}</svg>`));
  }

  function resize() {
    const bounds = hero.getBoundingClientRect();
    if (!bounds.width || !bounds.height || lost) return;
    glitchStep = -1;
    const scale = Math.min(devicePixelRatio || 1, fine.matches ? 1.5 : 1, 1920 / bounds.width);
    canvas.width = art.width = Math.round(bounds.width * scale);
    canvas.height = art.height = Math.round(bounds.height * scale);
    const w = art.width, h = art.height;
    aspect = w / h;
    ctx.clearRect(0, 0, w, h);
    const radius = Math.min(w * .36, h * .43);
    const cx = w * .5, cy = h * .48;
    for (let ring = 0; ring < 15; ring++) {
      ctx.beginPath();
      for (let step = 0; step <= 240; step++) {
        const angle = step / 240 * Math.PI * 2;
        const r = radius + ring * 2.5 * scale + Math.sin(angle * 3 + ring * .12) * radius * .11
          + Math.cos(angle * 5 - ring * .09) * radius * .045;
        const px = cx + Math.cos(angle) * r * 1.12;
        const py = cy + Math.sin(angle) * r;
        if (!step) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = ring % 4 === 0 ? 'rgba(212,175,55,0.42)' : 'rgba(143,121,218,0.38)';
      ctx.lineWidth = scale * 1.1;
      ctx.stroke();
    }
    const title = hero.querySelector('.hero-title').textContent;
    ctx.font = `700 ${w * .15}px "Playfair Display", serif`;
    const measured = ctx.measureText(title).width;
    ctx.font = `700 ${w * .15 * Math.min(1, w * .94 / measured)}px "Playfair Display", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(185,180,207,0.24)';
    ctx.fillText(title, cx, h * .36);
    gl.viewport(0, 0, w, h);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
    render();
  }
  function allowed() {
    return !lost && visible && !document.hidden && hero.classList.contains('active');
  }
  function render() {
    if (lost) return;
    const warp = reduced.matches ? 0 : titleStrength;
    if (warp > .002) {
      titleElement.style.filter = 'url(#title-pointer-warp) drop-shadow(0 0 18px rgba(212,175,55,.45))';
      updateScanlines();
      displacement.setAttribute('scale', String(26 * warp));
    } else {
      titleElement.style.removeProperty('filter');
      displacement.setAttribute('scale', '0');
    }
    gl.uniform2f(uniforms.pointer, x, y);
    gl.uniform2f(uniforms.velocity, targetX - x, targetY - y);
    gl.uniform1f(uniforms.aspect, aspect);
    gl.uniform1f(uniforms.strength, reduced.matches ? 0 : strength);
    gl.uniform1f(uniforms.time, clock);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function tick(now) {
    frame = 0;
    if (!allowed() || reduced.matches) return;
    const dt = Math.min((now - (last || now)) / 1000, .05);
    last = now;
    clock += dt;
    const easing = 1 - Math.exp(-dt * 12);
    x += (targetX - x) * easing;
    y += (targetY - y) * easing;
    strength += (targetStrength - strength) * easing;
    titleStrength += (targetTitleStrength - titleStrength) * easing;
    render();
    if (targetStrength || strength > .002 || titleStrength > .002) frame = requestAnimationFrame(tick);
    else { strength = 0; render(); last = 0; }
  }
  function wake() {
    if (allowed() && !reduced.matches && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  function reset() {
    targetStrength = 0;
    targetTitleStrength = 0;
    wake();
  }
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType === 'touch' || reduced.matches) return;
    const rect = hero.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width;
    targetY = 1 - (event.clientY - rect.top) / rect.height;
    targetStrength = 1;
    const titleBounds = titleElement.getBoundingClientRect();
    const dx = Math.max(titleBounds.left - event.clientX, 0, event.clientX - titleBounds.right);
    const dy = Math.max(titleBounds.top - event.clientY, 0, event.clientY - titleBounds.bottom);
    targetTitleStrength = Math.max(0, 1 - Math.hypot(dx, dy) / 110);
    wake();
  }, { passive: true });
  hero.addEventListener('pointerleave', reset);
  hero.addEventListener('pointercancel', reset);
  function sync() {
    if (!allowed() || reduced.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      strength = targetStrength = 0;
      titleStrength = targetTitleStrength = 0;
      render();
    }
  }
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  fine.addEventListener('change', reset);
  new MutationObserver(sync).observe(hero, { attributes: true, attributeFilter: ['class'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(hero);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    titleElement.style.removeProperty('filter');
    sync();
    canvas.style.visibility = 'hidden';
  });
  resize();
  document.fonts?.ready.then(resize);
})();
