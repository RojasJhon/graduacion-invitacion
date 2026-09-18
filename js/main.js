// ===== Fondo animado de partículas doradas =====
(function () {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let width, height;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    // Densidad ligera: 1 partícula cada ~9000px² de pantalla
    const count = Math.floor((width * height) / 9000);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.4 + 0.3,
      speedY: Math.random() * 0.15 + 0.03,
      opacity: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.twinklePhase += p.twinkleSpeed;
      const twinkle = (Math.sin(p.twinklePhase) + 1) / 2; // 0 a 1
      const alpha = p.opacity * (0.5 + twinkle * 0.5);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 228, 166, ${alpha})`;
      ctx.fill();

      // Sube lentamente y reaparece abajo (efecto flotante)
      p.y -= p.speedY;
      if (p.y < -5) {
        p.y = height + 5;
        p.x = Math.random() * width;
      }
    }
    requestAnimationFrame(draw);
  }

  function init() {
    resize();
    createParticles();
  }

  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });

  init();
  draw();
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