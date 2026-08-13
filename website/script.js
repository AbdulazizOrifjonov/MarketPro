// DELUX Presentation — Apple 3D Scroll Reveal & Liquid Glass Script

document.addEventListener('DOMContentLoaded', () => {
  // 1. Modal Trigger Logic ("Qanday Sotib Olish Mumkin?")
  const modalOverlay = document.getElementById('howToBuyModal');
  const openModalBtns = document.querySelectorAll('.open-how-to-buy');
  const closeModalBtn = document.querySelector('.modal-close');

  openModalBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // 2. 3D Tilt Effect on Liquid Glass Cards (excluding fixed navbar)
  const tiltCards = document.querySelectorAll('.liquid-glass:not(.navbar)');

  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // 3. Apple-Style 3D Scroll Reveal Observer
  const appleElements = document.querySelectorAll('.apple-card-3d, .apple-card-left, .apple-card-right');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.15,
  };

  const appleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('apple-revealed');
      }
    });
  }, observerOptions);

  appleElements.forEach((el) => appleObserver.observe(el));

  // 4. Mouse parallax effect for Liquid Ambient Blobs
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    const blobs = document.querySelectorAll('.liquid-blob');
    blobs.forEach((blob, idx) => {
      const speed = (idx + 1) * 20;
      const x = (mouseX - 0.5) * speed;
      const y = (mouseY - 0.5) * speed;
      blob.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
});
