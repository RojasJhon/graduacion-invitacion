// ===== Fondo animado (OPTIMIZADO para rendimiento): estrellas + confeti + fuegos artificiales =====
(function () {
  const canvas = document.getElementById("fireworks-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let ambientParticles = [];
  let confettiInicio = [[], [], []]; // multicolor, solo en la portada
  let confettiDatos = [[], [], []];  // dorado, solo en el panel de detalles
  let fireworks = [];

  // En pantallas chicas (celulares) bajamos la densidad de todo para que rinda mejor
  const isSmallScreen = window.innerWidth < 640;

  const PALETTE = [
    "212, 175, 55",  // dorado
    "244, 228, 166", // dorado claro
    "255, 255, 255", // blanco
    "255, 99, 132",  // rosa/coral
    "100, 181, 246", // celeste
    "186, 104, 200", // lila
    "129, 199, 132", // verde esmeralda
    "255, 179, 71",  // naranja suave
  ];

  const GOLD_PALETTE = [
    "212, 175, 55",  // dorado
    "244, 228, 166", // dorado claro
    "184, 134, 11",  // dorado oscuro
    "255, 223, 128", // dorado suave
  ];

  // Config de profundidad: [lejos, medio, cerca]
  // Nota: ya NO usamos blur() real (es carísimo en canvas); la profundidad
  // se logra solo con tamaño, velocidad y opacidad, que es igual de efectivo
  // visualmente y muchísimo más liviano.
  const CONFETTI_LAYERS = [
    { scale: 0.45, speedMul: 0.45, alphaMul: 0.4, proportion: 0.35 },
    { scale: 0.9,  speedMul: 0.85, alphaMul: 0.75, proportion: 0.35 },
    { scale: 1.5,  speedMul: 1.5,  alphaMul: 1,    proportion: 0.3 },
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  // ----- Estrellitas de fondo (ambiente, en toda la página) -----
  function createAmbientParticles() {
    const divisor = isSmallScreen ? 26000 : 16000;
    const count = Math.floor((width * height) / divisor);
    ambientParticles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.3 + 0.3,
      speedY: Math.random() * 0.12 + 0.03,
      opacity: Math.random() * 0.5 + 0.15,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));
  }

  function drawAmbient() {
    for (const p of ambientParticles) {
      p.twinklePhase += p.twinkleSpeed;
      const twinkle = (Math.sin(p.twinklePhase) + 1) / 2;
      const alpha = p.opacity * (0.5 + twinkle * 0.5);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 228, 166, ${alpha})`;
      ctx.fill();

      p.y -= p.speedY;
      if (p.y < -5) {
        p.y = height + 5;
        p.x = Math.random() * width;
      }
    }
  }

  // ----- Confeti con profundidad (sin blur real, solo tamaño/velocidad/opacidad) -----
  function buildConfettiLayers(palette) {
    const divisor = isSmallScreen ? 18000 : 11000;
    const totalCount = Math.floor((width * height) / divisor);
    const layers = [[], [], []];

    CONFETTI_LAYERS.forEach((cfg, li) => {
      const layerCount = Math.floor(totalCount * cfg.proportion);
      for (let i = 0; i < layerCount; i++) {
        layers[li].push({
          x: Math.random() * width,
          y: Math.random() * height,
          width: (5 + Math.random() * 5) * cfg.scale,
          height: (8 + Math.random() * 6) * cfg.scale,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: (0.6 + Math.random() * 0.4) * cfg.alphaMul,
          speedY: (0.6 + Math.random() * 1.3) * cfg.speedMul,
          swingSpeed: 0.015 + Math.random() * 0.02,
          swingPhase: Math.random() * Math.PI * 2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.06,
        });
      }
    });

    return layers;
  }

  function createConfetti() {
    confettiInicio = buildConfettiLayers(PALETTE);
    confettiDatos = buildConfettiLayers(GOLD_PALETTE);
  }

  function drawConfettiLayers(layers) {
    // Se dibuja de atrás hacia adelante: lejos → medio → cerca (sin ctx.filter)
    for (let li = 0; li < layers.length; li++) {
      for (const c of layers[li]) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = `rgba(${c.color}, ${c.alpha})`;
        ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
        ctx.restore();

        c.swingPhase += c.swingSpeed;
        c.x += Math.sin(c.swingPhase) * 0.7;
        c.y += c.speedY;
        c.rotation += c.rotationSpeed;

        if (c.y > height + 15) {
          c.y = -15;
          c.x = Math.random() * width;
        }
      }
    }
  }

  function drawConfetti() {
    const panelInicio = document.getElementById("panel-inicio");
    const panelDatos = document.getElementById("panel-datos");

    if (panelInicio && panelInicio.classList.contains("active")) {
      drawConfettiLayers(confettiInicio); // multicolor
    } else if (panelDatos && panelDatos.classList.contains("active")) {
      drawConfettiLayers(confettiDatos); // dorado
    }
  }

  // ----- Fuegos artificiales (glow SIN shadowBlur: mucho más liviano) -----
  function inHero() {
    return window.scrollY < window.innerHeight * 0.95;
  }

  function spawnFirework() {
    const x = width * (0.12 + Math.random() * 0.76);
    const apexY = height * (0.12 + Math.random() * 0.35);
    fireworks.push({
      x,
      y: height,
      apexY,
      speed: 6 + Math.random() * 3,
      trail: [],
      exploded: false,
      particles: [],
      small: inHero(),
    });

    const nextDelay = inHero()
      ? 4200 + Math.random() * 2600
      : (isSmallScreen ? 1800 : 1200) + Math.random() * 1600;
    setTimeout(spawnFirework, nextDelay);
  }

  function explode(fw) {
    const baseCount = fw.small
      ? 16 + Math.floor(Math.random() * 10)
      : (isSmallScreen ? 32 : 55) + Math.floor(Math.random() * 20);

    for (let i = 0; i < baseCount; i++) {
      const angle = (Math.PI * 2 * i) / baseCount + Math.random() * 0.25;
      const speed = (fw.small ? 1.6 : 2.6) + Math.random() * (fw.small ? 2.2 : 4.5);
      fw.particles.push({
        x: fw.x,
        y: fw.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        radius: (fw.small ? 1.3 : 2) + Math.random() * (fw.small ? 1 : 1.8),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }
    fw.exploded = true;
  }

  function updateAndDrawFireworks() {
    for (let f = fireworks.length - 1; f >= 0; f--) {
      const fw = fireworks[f];

      if (!fw.exploded) {
        fw.trail.push({ x: fw.x, y: fw.y, alpha: 1 });
        if (fw.trail.length > 10) fw.trail.shift();

        for (const t of fw.trail) {
          ctx.beginPath();
          ctx.arc(t.x, t.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(244, 228, 166, ${t.alpha * 0.8})`;
          ctx.fill();
          t.alpha *= 0.85;
        }

        fw.y -= fw.speed;
        if (fw.y <= fw.apexY) {
          explode(fw);
        }
      } else {
        let alive = false;
        for (const p of fw.particles) {
          if (p.alpha <= 0.02) continue;
          alive = true;

          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.985;
          p.vy += 0.04;
          p.alpha *= 0.965;

          // Halo suave (sin shadowBlur): círculo grande y tenue detrás...
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha * 0.22})`;
          ctx.fill();

          // ...y el núcleo brillante encima. Mismo efecto visual, sin el costo de shadowBlur.
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.fill();
        }
        if (!alive) fireworks.splice(f, 1);
      }
    }
  }

  let animationId = null;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawAmbient();
    drawConfetti();
    updateAndDrawFireworks();
    animationId = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    createAmbientParticles();
    createConfetti();
    setTimeout(spawnFirework, 700);
  }

  // Pausar/reanudar el fondo animado según si la pestaña está visible (ahorra batería/CPU)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = null;
    } else if (!animationId) {
      draw();
    }
  });

  window.addEventListener("resize", () => {
    resize();
    createAmbientParticles();
    createConfetti();
  });

  init();
  draw();
})();

// ===== Botón "Ver detalles": View Transition + fallback con destello =====
(function () {
  const scrollBtn = document.getElementById("scroll-cta");
  const panelInicio = document.getElementById("panel-inicio");
  const panelDatos = document.getElementById("panel-datos");
  const flash = document.getElementById("flash-overlay");
  if (!scrollBtn || !panelInicio || !panelDatos || !flash) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function startMusic() {
    const musicBtn = document.getElementById("music-toggle");
    if (musicBtn && !musicBtn.classList.contains("playing")) {
      musicBtn.click();
    }
  }

  function showInvitation() {
    panelInicio.classList.remove("active");
    panelDatos.classList.add("active");
    panelDatos.querySelectorAll(".quote-section .reveal").forEach((element) => {
      element.classList.add("visible");
    });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showWithFlashFallback() {
    flash.style.transition = "opacity 0.15s ease-in";
    flash.style.opacity = "1";

    setTimeout(() => {
      showInvitation();

      flash.style.transition = "opacity 0.6s ease-out";
      flash.style.opacity = "0";
    }, 150);
  }

  scrollBtn.addEventListener("click", () => {
    startMusic();

    if (prefersReducedMotion) {
      showInvitation();
      return;
    }

    if (typeof document.startViewTransition === "function") {
      document.documentElement.classList.add("is-view-transitioning");
      panelDatos.classList.add("view-transition-entered");
      const transition = document.startViewTransition(showInvitation);
      transition.finished.finally(() => {
        document.documentElement.classList.remove("is-view-transitioning");
      });
      return;
    }

    showWithFlashFallback();
  });
})();

// ===== Animación de aparición al hacer scroll (scroll-reveal) =====
(function () {
  const revealElements = document.querySelectorAll(".reveal");
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach((el) => observer.observe(el));
})();

// ===== Cuenta regresiva =====
(function () {
  // 👇 CAMBIA esta fecha por la fecha y hora reales de tu graduación
  const eventDate = new Date("2026-12-15T19:00:00").getTime();

  const daysEl = document.getElementById("days");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!daysEl) return;

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      clearInterval(timer);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
})();

// ===== Galería: abrir foto en grande (lightbox) =====
(function () {
  const galleryImages = document.querySelectorAll(".gallery-item img");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");

  if (!galleryImages.length || !lightbox) return;

  galleryImages.forEach((img) => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add("active");
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("active");
    lightboxImg.src = "";
  }

  closeBtn.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
})();

// ===== Formulario de confirmación por WhatsApp =====
(function () {
  const rsvpForm = document.getElementById("rsvp-form");
  const guestNameInput = document.getElementById("guest-name");
  const guestNameError = document.getElementById("guest-name-error");
  const attendanceOptions = document.querySelectorAll('input[name="attendance"]');
  const attendanceGroup = document.querySelector(".attendance-options");
  const attendanceError = document.getElementById("attendance-error");
  const waButton = document.getElementById("whatsapp-button");
  const buttonIcon = waButton?.querySelector(".whatsapp-button-icon");
  const buttonLabel = waButton?.querySelector(".whatsapp-button-label");

  if (
    !rsvpForm ||
    !guestNameInput ||
    !guestNameError ||
    !attendanceOptions.length ||
    !attendanceGroup ||
    !attendanceError ||
    !waButton ||
    !buttonIcon ||
    !buttonLabel
  ) return;

  // 👇 CAMBIA el número por el tuyo, con código de país y SIN el símbolo +
  const phone = "59173555357";
  const defaultButtonIcon = buttonIcon.textContent;
  const defaultButtonLabel = buttonLabel.textContent;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showNameError(message) {
    guestNameError.textContent = message;
    guestNameInput.setAttribute("aria-invalid", "true");
    guestNameInput.focus();
  }

  function clearNameError() {
    guestNameError.textContent = "";
    guestNameInput.removeAttribute("aria-invalid");
  }

  function clearAttendanceError() {
    attendanceError.textContent = "";
    attendanceGroup.removeAttribute("aria-invalid");
  }

  function resetConfirmationState() {
    rsvpForm.classList.remove("is-confirming");
    waButton.disabled = false;
    buttonIcon.textContent = defaultButtonIcon;
    buttonLabel.textContent = defaultButtonLabel;
  }

  guestNameInput.addEventListener("input", clearNameError);
  attendanceOptions.forEach((option) => {
    option.addEventListener("change", clearAttendanceError);
  });
  window.addEventListener("pageshow", resetConfirmationState);

  rsvpForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const guestName = guestNameInput.value.trim().replace(/\s+/g, " ");
    const selectedAttendance = document.querySelector('input[name="attendance"]:checked');

    if (!guestName) {
      showNameError("Por favor, escribe tu nombre para confirmar.");
      return;
    }

    clearNameError();

    if (!selectedAttendance) {
      attendanceError.textContent = "Selecciona una de las dos opciones.";
      attendanceGroup.setAttribute("aria-invalid", "true");
      attendanceOptions[0].focus();
      return;
    }

    clearAttendanceError();

    const isAttending = selectedAttendance.value === "yes";
    const message = isAttending
      ? `¡Hola! Soy ${guestName} y confirmo que sí asistiré a tu graduación 🎓✨`
      : `¡Hola! Soy ${guestName}. Muchas gracias por la invitación, pero no podré asistir a tu graduación.`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    rsvpForm.classList.add("is-confirming");
    waButton.disabled = true;
    buttonIcon.textContent = "✓";
    buttonLabel.textContent = isAttending ? "¡Asistencia confirmada!" : "¡Respuesta preparada!";

    window.setTimeout(() => {
      window.location.href = whatsappUrl;
    }, prefersReducedMotion ? 150 : 850);
  });
})();

// ===== Código QR y copia del enlace de la invitación =====
(function () {
  const qrContainer = document.getElementById("invitation-qr");
  const copyButton = document.getElementById("copy-invitation-link");
  const copyLabel = document.getElementById("copy-link-label");
  if (!qrContainer || !copyButton || !copyLabel) return;

  // URL pública que compartirán el código QR y el botón "Copiar enlace".
  const configuredInvitationUrl = "https://mi-graduacion-2026gr.netlify.app/";
  const currentUrl = new URL(window.location.href);
  currentUrl.hash = "";
  const invitationUrl = configuredInvitationUrl || currentUrl.href;

  if (typeof window.QRCode === "function") {
    new window.QRCode(qrContainer, {
      text: invitationUrl,
      width: 148,
      height: 148,
      colorDark: "#080b16",
      colorLight: "#f8f4e8",
      correctLevel: window.QRCode.CorrectLevel.H,
    });
  } else {
    qrContainer.innerHTML = '<span class="qr-unavailable">No se pudo generar el código QR.</span>';
  }

  async function copyInvitationUrl() {
    try {
      await navigator.clipboard.writeText(invitationUrl);
    } catch (error) {
      const temporaryInput = document.createElement("input");
      temporaryInput.value = invitationUrl;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      document.execCommand("copy");
      temporaryInput.remove();
    }

    copyLabel.textContent = "¡Enlace copiado!";
    window.setTimeout(() => {
      copyLabel.textContent = "Copiar enlace";
    }, 1800);
  }

  copyButton.addEventListener("click", copyInvitationUrl);
})();

// ===== Inclinación 3D sutil para tarjetas (solo escritorio) =====
(function () {
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 769px)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!supportsFinePointer || prefersReducedMotion) return;

  document.querySelectorAll(".tilt-card").forEach((card) => {
    let animationFrame = null;
    let pointerX = 0;
    let pointerY = 0;

    function updateTilt() {
      const rect = card.getBoundingClientRect();
      const normalizedX = (pointerX - rect.left) / rect.width - 0.5;
      const normalizedY = (pointerY - rect.top) / rect.height - 0.5;
      const strength = 4;

      card.style.setProperty("--tilt-x", `${(-normalizedY * strength).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(normalizedX * strength).toFixed(2)}deg`);
      animationFrame = null;
    }

    card.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!animationFrame) animationFrame = requestAnimationFrame(updateTilt);
    });

    card.addEventListener("pointerleave", () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
})();

// ===== Música de fondo (botón flotante) =====
(function () {
  const musicBtn = document.getElementById("music-toggle");
  const audio = document.getElementById("bg-audio");
  if (!musicBtn || !audio) return;

  let isPlaying = false;

  musicBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play().catch(() => {
        console.warn("No se pudo reproducir el audio. ¿Ya agregaste tu archivo en assets/audio/musica.mp3?");
      });
      musicBtn.textContent = "⏸";
      musicBtn.classList.add("playing");
      isPlaying = true;
    } else {
      audio.pause();
      musicBtn.textContent = "🎵";
      musicBtn.classList.remove("playing");
      isPlaying = false;
    }
  });
})();
