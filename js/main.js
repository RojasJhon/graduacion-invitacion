// ===== Fondo animado de toda la página: estrellas + confeti (solo portada) + fuegos artificiales =====
(function () {
  const canvas = document.getElementById("fireworks-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let ambientParticles = [];
  let confettiLayers = [[], [], []];
  let fireworks = [];

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

  // Config de profundidad: [lejos, medio, cerca]
  const CONFETTI_LAYERS = [
    { scale: 0.55, speedMul: 0.5, alphaMul: 0.45, blur: 2,   proportion: 0.4 },
    { scale: 0.85, speedMul: 0.8, alphaMul: 0.75, blur: 0.8, proportion: 0.35 },
    { scale: 1.25, speedMul: 1.3, alphaMul: 1,    blur: 0,   proportion: 0.25 },
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  // ----- Estrellitas de fondo (ambiente, en toda la página) -----
  function createAmbientParticles() {
    const count = Math.floor((width * height) / 16000);
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

  // ----- Confeti cayendo con profundidad (SOLO visible mientras se ve la portada) -----
  function createConfetti() {
    const totalCount = Math.floor((width * height) / 11000);
    confettiLayers = [[], [], []];

    CONFETTI_LAYERS.forEach((cfg, li) => {
      const layerCount = Math.floor(totalCount * cfg.proportion);
      for (let i = 0; i < layerCount; i++) {
        confettiLayers[li].push({
          x: Math.random() * width,
          y: Math.random() * height,
          width: (5 + Math.random() * 5) * cfg.scale,
          height: (8 + Math.random() * 6) * cfg.scale,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          alpha: (0.6 + Math.random() * 0.4) * cfg.alphaMul,
          speedY: (0.6 + Math.random() * 1.3) * cfg.speedMul,
          swingSpeed: 0.015 + Math.random() * 0.02,
          swingPhase: Math.random() * Math.PI * 2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.06,
        });
      }
    });
  }

  function drawConfetti() {
    // Solo se dibuja/anima mientras el panel de portada está activo
    const panelInicio = document.getElementById("panel-inicio");
    if (!panelInicio || !panelInicio.classList.contains("active")) return;

    // Se dibuja de atrás hacia adelante: lejos → medio → cerca
    CONFETTI_LAYERS.forEach((cfg, li) => {
      ctx.filter = cfg.blur > 0 ? `blur(${cfg.blur}px)` : "none";

      for (const c of confettiLayers[li]) {
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
    });

    ctx.filter = "none"; // resetear para que no afecte fuegos artificiales/estrellas
  }

  // ----- Fuegos artificiales (en TODA la página, grandes y brillantes) -----
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
      small: inHero(), // si nace en la portada, será una explosión chica
    });

    // En la portada: disparos más espaciados. En el resto: seguidos.
    const nextDelay = inHero()
      ? 4200 + Math.random() * 2600   // portada: cada 4.2 a 6.8s
      : 1000 + Math.random() * 1400;  // resto: cada 1 a 2.4s
    setTimeout(spawnFirework, nextDelay);
  }

  function explode(fw) {
    // Cada partícula elige su propio color al azar → explosión multicolor
    const count = fw.small
      ? 20 + Math.floor(Math.random() * 12)   // portada: explosión chica
      : 80 + Math.floor(Math.random() * 40);  // resto: explosión grande

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
      const speed = (fw.small ? 1.6 : 2.8) + Math.random() * (fw.small ? 2.6 : 5.5);
      fw.particles.push({
        x: fw.x,
        y: fw.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        radius: (fw.small ? 1.3 : 2.2) + Math.random() * (fw.small ? 1.2 : 2.2),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }
    fw.exploded = true;
  }

  function updateAndDrawFireworks() {
    for (let f = fireworks.length - 1; f >= 0; f--) {
      const fw = fireworks[f];

      if (!fw.exploded) {
        // Estela mientras sube
        fw.trail.push({ x: fw.x, y: fw.y, alpha: 1 });
        if (fw.trail.length > 14) fw.trail.shift();

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
          p.vx *= 0.985; // fricción del aire, hace la explosión más "redonda"
          p.vy += 0.04; // gravedad suave
          p.alpha *= 0.965;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          ctx.shadowColor = `rgba(${p.color}, ${Math.min(p.alpha + 0.2, 1)})`;
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        if (!alive) fireworks.splice(f, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawAmbient();
    drawConfetti();
    updateAndDrawFireworks();
    requestAnimationFrame(draw);
  }

  function init() {
    resize();
    createAmbientParticles();
    createConfetti();
    setTimeout(spawnFirework, 700); // primer fuego artificial
  }

  window.addEventListener("resize", () => {
    resize();
    createAmbientParticles();
    createConfetti();
  });

  init();
  draw();
})();

// ===== Botón "Ver detalles": destello dorado + cambio de panel =====
(function () {
  const scrollBtn = document.getElementById("scroll-cta");
  const panelInicio = document.getElementById("panel-inicio");
  const panelDatos = document.getElementById("panel-datos");
  const flash = document.getElementById("flash-overlay");
  if (!scrollBtn || !panelInicio || !panelDatos || !flash) return;

  scrollBtn.addEventListener("click", () => {
    // Fase 1: destello rápido (la pantalla se llena de luz dorada)
    flash.style.transition = "opacity 0.15s ease-in";
    flash.style.opacity = "1";

    // Fase 2: en el punto máximo del destello, cambiamos de panel (queda oculto por la luz)
    setTimeout(() => {
      panelInicio.classList.remove("active");
      panelDatos.classList.add("active");
      window.scrollTo({ top: 0, behavior: "instant" });

      // Iniciar la música automáticamente (aprovechando este clic del usuario)
      const musicBtn = document.getElementById("music-toggle");
      if (musicBtn && !musicBtn.classList.contains("playing")) {
        musicBtn.click();
      }

      // Fase 3: el destello se apaga lentamente, revelando el contenido nuevo
      flash.style.transition = "opacity 0.6s ease-out";
      flash.style.opacity = "0";
    }, 150);
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
          observer.unobserve(entry.target); // ya apareció, no repetir
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

  if (!daysEl) return; // esta sección no existe en la página, no hacer nada

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

  // Cerrar al hacer clic fuera de la imagen (en el fondo oscuro)
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Cerrar con la tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
})();

// ===== Botón de confirmación por WhatsApp =====
(function () {
  const waButton = document.getElementById("whatsapp-button");
  if (!waButton) return;

  // 👇 CAMBIA el número por el tuyo, con código de país y SIN el símbolo +
  // Ojo: el código de Bolivia es 591 (revisa si tu número lo tiene bien escrito)
  const phone = "59173555357";
  const message = "¡Hola! Quiero confirmar mi asistencia a tu graduación 🎓";

  waButton.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
