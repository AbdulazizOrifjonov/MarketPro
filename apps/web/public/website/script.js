// DELUX Presentation — Apple 3D Scroll Reveal, Dynamic System Monitor & Liquid Animations

document.addEventListener('DOMContentLoaded', () => {

  // 1. Live System Monitor Simulation (CPU/GPU/RAM Meters & FPS Counter)
  const cpuFill = document.querySelector('.metric-fill[style*="92%"]');
  const gpuFill = document.querySelector('.metric-fill[style*="99%"]');
  const ramFill = document.querySelector('.metric-fill[style*="64%"]');
  const sysLiveBadge = document.querySelector('.sys-live');

  if (cpuFill && gpuFill && ramFill) {
    setInterval(() => {
      const cpuVal = Math.floor(88 + Math.random() * 10);
      const gpuVal = Math.floor(95 + Math.random() * 5);
      const ramVal = Math.floor(60 + Math.random() * 12);
      const fpsVal = Math.floor(158 + Math.random() * 16);

      cpuFill.style.width = `${cpuVal}%`;
      if (cpuFill.nextElementSibling) cpuFill.nextElementSibling.textContent = `${cpuVal}%`;

      gpuFill.style.width = `${gpuVal}%`;
      if (gpuFill.nextElementSibling) gpuFill.nextElementSibling.textContent = `${gpuVal}%`;

      ramFill.style.width = `${ramVal}%`;
      if (ramFill.nextElementSibling) ramFill.nextElementSibling.textContent = `${ramVal}%`;

      if (sysLiveBadge) {
        sysLiveBadge.textContent = `LIVE ${fpsVal} FPS`;
      }
    }, 2000);
  }

  // 2. 3D Tilt Card Effect with Dynamic Mouse Tracking Light Sheen
  const tiltCards = document.querySelectorAll('.liquid-glass:not(.navbar), .prod-card-official');

  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
    });
  });

  // 3. Apple-Style 3D Scroll Reveal Observer
  const appleElements = document.querySelectorAll('.apple-card-3d, .apple-card-left, .apple-card-right');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1,
  };

  const appleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('apple-revealed');
      }
    });
  }, observerOptions);

  appleElements.forEach((el) => {
    // Add initial reveal check
    appleObserver.observe(el);
  });

  // 4. Mouse Parallax Motion for Liquid Ambient Blobs
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    const blobs = document.querySelectorAll('.liquid-blob');
    blobs.forEach((blob, idx) => {
      const speed = (idx + 1) * 25;
      const x = (mouseX - 0.5) * speed;
      const y = (mouseY - 0.5) * speed;
      blob.style.transform = `translate(${x}px, ${y}px)`;
    });
  });

  // 5. Smooth Scroll Anchor Navigation
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

});
