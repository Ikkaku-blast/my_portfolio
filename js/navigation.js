/* ============================================================
   ヘッダー・ナビゲーションの動作
   現在地表示、スマホメニュー、スムーススクロールを制御。
   ============================================================ */
window.PortfolioNavigation = {
  init() {
    const header = document.getElementById('header');
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.header__nav-link');
    const sections = document.querySelectorAll('.section, .hero');
    if (!header || !nav) return;

    /* ==========================================================
       スクロール：ヘッダー影と現在地ナビの更新
       ========================================================== */
    const onScroll = () => {
      /* スクロール後にヘッダーへ薄い影を付ける */
      header.classList.toggle('scrolled', window.scrollY > 40);
    
      /* 現在見ているセクションに対応するナビを強調 */
      let current = '';
      Array.from(sections)
        .sort((a, b) => a.offsetTop - b.offsetTop)
        .forEach(sec => {
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
    onScroll();                       /* 初期表示時にも一度反映 */
    
    /* ==========================================================
       スマホメニュー
       ========================================================== */
    const toggleMenu = () => {
      hamburger.classList.toggle('is-open');
      nav.classList.toggle('is-open');
      document.body.style.overflow = nav.classList.contains('is-open')
        ? 'hidden'
        : '';
    };
    
    hamburger.addEventListener('click', toggleMenu);
    
    /* ナビを選んだらスマホメニューを閉じる */
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) toggleMenu();
      });
    });
    
    /* ==========================================================
       ナビとHeroボタンのスムーススクロール
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
    
    /* Heroの作品ボタンも同じ挙動にする */
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
  },
};
