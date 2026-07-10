/* ============================================================
   Heroの動作
   興味語の段階表示と名前フォント切り替えを制御。
   ============================================================ */
window.PortfolioHero = {
  init() {
    const heroName = document.getElementById('hero-name');
    const heroInterests = Array.from(document.querySelectorAll('[data-hero-interest]'));
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ==========================================================
       Hero：興味語の段階表示と名前フォント切り替え
       - 興味語の出現間隔は index * 500
       - 名前フォント切り替え間隔は setInterval(..., 300)
       ========================================================== */
    if (heroInterests.length) {
      if (reducedMotionQuery.matches) {
        heroInterests.forEach(item => item.classList.add('is-visible'));
      } else {
        const batchSizes = [1, 2, 4, 8, Number.POSITIVE_INFINITY];
        let start = 0;
    
        batchSizes.forEach((batchSize, index) => {
          const batch = heroInterests.slice(start, start + batchSize);
          start += batchSize;
          if (!batch.length) return;
    
          window.setTimeout(() => {
            batch.forEach(item => item.classList.add('is-visible'));
          }, index * 500);
        });
      }
    }
    
    if (heroName && !reducedMotionQuery.matches) {
      const fontSteps = ['0', '1', '2', '3', '4', '5', '6', '7'];
      let fontIndex = 0;
    
      window.setInterval(() => {
        fontIndex = (fontIndex + 1) % fontSteps.length;
        heroName.dataset.fontStep = fontSteps[fontIndex];
      }, 250);
    }
  },
};
