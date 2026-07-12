/* ============================================================
   初期化入口
   各機能ファイルを順番に起動する。
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  /* 画像検索・保存系のブラウザUIを出にくくする。
     画像のクリック拡大は親ボタンで受けるため、画像自体の操作は抑制する。 */
  const protectVisualAssets = () => {
    document.querySelectorAll('img').forEach((image) => {
      image.setAttribute('draggable', 'false');
      image.setAttribute('data-no-image-search', 'true');
    });
  };

  protectVisualAssets();

  const contentApi = window.PortfolioContent;
  if (contentApi) {
    const portfolioContent = await contentApi.loadPortfolioContent();
    contentApi.applyPortfolioContent(portfolioContent);
    protectVisualAssets();
  }

  document.addEventListener('dragstart', (event) => {
    if (event.target.closest('img, [data-lightbox-src], .image-lightbox__figure')) {
      event.preventDefault();
    }
  });

  document.addEventListener('contextmenu', (event) => {
    if (event.target.closest('img, [data-lightbox-src], .image-lightbox__figure')) {
      event.preventDefault();
    }
  });

  window.PortfolioHero?.init();
  window.PortfolioNavigation?.init();
  window.PortfolioAnimations?.init();
  window.PortfolioWorks?.init();
  window.PortfolioLightbox?.init();
});
