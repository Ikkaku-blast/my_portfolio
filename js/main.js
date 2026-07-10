/* ============================================================
   初期化入口
   各機能ファイルを順番に起動する。
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const contentApi = window.PortfolioContent;
  if (contentApi) {
    const portfolioContent = await contentApi.loadPortfolioContent();
    contentApi.applyPortfolioContent(portfolioContent);
  }

  window.PortfolioHero?.init();
  window.PortfolioNavigation?.init();
  window.PortfolioAnimations?.init();
  window.PortfolioWorks?.init();
  window.PortfolioLightbox?.init();
});
