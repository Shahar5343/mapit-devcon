/* ==========================================================================
   Mapit DevCon — Page interactions
   nav state · reveal-on-scroll · hero pin tilt · card spotlight ·
   schedule lightbox · countdown
   ========================================================================== */
(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav background on scroll ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Hero pin: 3D tilt toward pointer ---------- */
  const stage = document.getElementById('hero-stage');
  const icon = document.getElementById('hero-icon');
  if (stage && icon && !reduceMotion && matchMedia('(pointer: fine)').matches) {
    const hero = stage.closest('.hero');
    hero.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      icon.style.transform = `rotateY(${(dx * 28).toFixed(2)}deg) rotateX(${(-dy * 22).toFixed(2)}deg)`;
    });
    hero.addEventListener('mouseleave', () => { icon.style.transform = ''; });
  }

  /* ---------- Audience card spotlight ---------- */
  document.querySelectorAll('.audience-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Schedule lightbox ---------- */
  const lb = document.getElementById('schedule-lightbox');
  const openBtn = document.getElementById('schedule-open');
  const closeBtn = document.getElementById('schedule-close');
  if (lb && openBtn && typeof lb.showModal === 'function') {
    openBtn.addEventListener('click', () => {
      lb.showModal();
      window.dispatchEvent(new CustomEvent('mapit:lightbox-open'));
    });
    closeBtn.addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); }); // backdrop click
  } else if (openBtn) {
    openBtn.addEventListener('click', () => window.open('assets/schedule.png', '_blank', 'noopener'));
  }

  /* ---------- Countdown (09:30 Israel time = 07:30 UTC on 23 Nov 2026) ---------- */
  const EVENT_START = Date.UTC(2026, 10, 23, 7, 30, 0);
  const EVENT_END = Date.UTC(2026, 10, 23, 11, 0, 0);
  const cd = {
    d: document.getElementById('cd-days'),
    h: document.getElementById('cd-hours'),
    m: document.getElementById('cd-mins'),
    s: document.getElementById('cd-secs'),
    label: document.querySelector('.countdown__label'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  function tickCountdown() {
    const now = Date.now();
    let diff = EVENT_START - now;
    if (diff <= 0) {
      cd.label.textContent = now < EVENT_END ? 'Happening now' : 'Thanks for joining us';
      cd.d.textContent = cd.h.textContent = cd.m.textContent = cd.s.textContent = '00';
      return false;
    }
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hrs = Math.floor(diff / 3600000); diff -= hrs * 3600000;
    const mins = Math.floor(diff / 60000); diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    cd.d.textContent = pad(days);
    cd.h.textContent = pad(hrs);
    cd.m.textContent = pad(mins);
    cd.s.textContent = pad(secs);
    return true;
  }
  if (cd.d && tickCountdown()) {
    const t = setInterval(() => { if (!tickCountdown()) clearInterval(t); }, 1000);
  }
})();
