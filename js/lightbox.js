/* ============================================================
   画像拡大ライトボックス
   data-lightbox-src を持つ画像ボタンの拡大表示を制御。
   ============================================================ */
window.PortfolioLightbox = {
  init() {
    /* ==========================================================
       画像拡大ライトボックス
       data-lightbox-src を持つボタンをクリックすると拡大表示。
       ========================================================== */
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('image-lightbox-img');
    const lightboxCaption = document.getElementById('image-lightbox-caption');
    const lightboxCloseButtons = document.querySelectorAll('.image-lightbox__backdrop, .image-lightbox__close');
    
    const closeLightbox = () => {
      if (!lightbox || !lightboxImg || !lightboxCaption) return;
      lightbox.hidden = true;
      lightboxImg.src = '';
      lightboxImg.alt = '';
      lightboxCaption.textContent = '';
    };
    
    if (lightbox && lightboxImg && lightboxCaption) {
      document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-lightbox-src]');
        if (!button) return;
    
        const src = button.dataset.lightboxSrc;
        const caption = button.dataset.lightboxCaption || '';
        const image = button.querySelector('img');
        if (!src) return;
    
        event.preventDefault();
        lightboxImg.src = src;
        lightboxImg.alt = image?.alt || caption;
        lightboxCaption.textContent = caption;
        lightbox.hidden = false;
      });
    
      lightboxCloseButtons.forEach(button => {
        button.addEventListener('click', closeLightbox);
      });
    
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !lightbox.hidden) {
          closeLightbox();
        }
      });
    }
  },
};
