/* ============================================================
   Main JavaScript — Portfolio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================
     0. Welcome Modal — 遊びモード選択
     ========================================================== */
  const welcomeModal = document.getElementById('welcome-modal');
  const welcomePlayBtn = document.getElementById('welcome-play-btn');
  const welcomeNormalBtn = document.getElementById('welcome-normal-btn');

  function closeWelcomeModal(callback) {
    if (!welcomeModal) return;
    welcomeModal.classList.add('is-hidden');
    sessionStorage.setItem('welcomeShown', 'true');
    welcomeModal.addEventListener('animationend', function handler() {
      welcomeModal.removeEventListener('animationend', handler);
      welcomeModal.style.display = 'none';
      if (callback) callback();
    });
  }

  if (welcomeModal) {
    // 同一セッション中は再表示しない
    if (sessionStorage.getItem('welcomeShown')) {
      welcomeModal.style.display = 'none';
    } else {
      welcomeModal.style.display = 'flex';
    }
  }

  if (welcomePlayBtn) {
    welcomePlayBtn.addEventListener('click', () => {
      closeWelcomeModal(() => {
        // テキスト隠しモードを起動
        if (window.PlayMode) window.PlayMode.activate();
      });
    });
  }

  if (welcomeNormalBtn) {
    welcomeNormalBtn.addEventListener('click', () => {
      closeWelcomeModal();
    });
  }

  /* ---------- Elements ---------- */
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.header__nav-link');
  const sections = document.querySelectorAll('.section, .hero');
  const animTargets = document.querySelectorAll('.animate-on-scroll');

  /* ==========================================================
     1. Scroll — Header shadow & active nav link
     ========================================================== */
  const onScroll = () => {
    /* header shadow */
    header.classList.toggle('scrolled', window.scrollY > 40);

    /* active section highlight */
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });

    navLinks.forEach(link => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === `#${current}`
      );
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();                       /* run once on load */

  /* ==========================================================
     2. Scroll animations — Intersection Observer
     ========================================================== */
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.15,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);   /* animate only once */
      }
    });
  }, observerOptions);

  animTargets.forEach(el => observer.observe(el));

  /* ==========================================================
     3. Mobile menu
     ========================================================== */
  const toggleMenu = () => {
    hamburger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
    document.body.style.overflow = nav.classList.contains('is-open')
      ? 'hidden'
      : '';
  };

  hamburger.addEventListener('click', toggleMenu);

  /* Close menu when a nav link is clicked */
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) toggleMenu();
    });
  });

  /* ==========================================================
     4. Smooth scroll for nav links (fallback / enhancement)
     ========================================================== */
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* Same for hero CTA */
  const heroCta = document.querySelector('.hero__cta');
  if (heroCta) {
    heroCta.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(heroCta.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  /* ==========================================================
     5. My Ability — カードクリックで中央にコンテンツ表示
     ========================================================== */
  const abilityStage   = document.getElementById('ability-stage');
  const abilityCenter  = document.getElementById('ability-center');
  const abilityButtons = document.querySelectorAll('.ability__card');

  if (abilityStage && abilityCenter) {
    let activeIndex = null;

    abilityButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);

        // 同じボタン再クリックで閉じる
        if (activeIndex === idx) {
          // 閉じる
          abilityStage.classList.remove('is-open');
          abilityButtons.forEach(b => b.classList.remove('is-active'));
          activeIndex = null;
          return;
        }

        // コンテンツを切り替える
        document.querySelectorAll('.ability__content').forEach(c => {
          c.classList.add('ability__content--hidden');
        });
        const target = document.getElementById(`ability-content-${idx}`);
        if (target) target.classList.remove('ability__content--hidden');

        // ステージを開く & アクティブボタン
        abilityStage.classList.add('is-open');
        abilityButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeIndex = idx;
      });
    });
  }
});
