/* ============================================================
   Worksの動作
   作品カード、プレビュー動画、詳細スライダー、Play導線を制御。
   ============================================================ */
window.PortfolioWorks = {
  init() {
    /* ==========================================================
       Works：作品詳細表示、プレビュー動画、スライダー
       - プレビュー横幅は syncWorksPreviewFrame()
       - スライド移動は moveSlider()
       - 作品クリック後のスクロールは activateWork()
       ========================================================== */
    const workTabs = Array.from(document.querySelectorAll('.works-node'));
    const workPanels = Array.from(document.querySelectorAll('.work-detail'));
    const workSliders = Array.from(document.querySelectorAll('[data-work-slider]'));
    const worksSection = document.getElementById('works');
    const worksDetails = document.querySelector('.works-details');
    const worksBackButtons = document.querySelectorAll('.works-back');
    const worksPreviewToggle = document.getElementById('works-preview-toggle');
    const worksPreviewVideos = Array.from(document.querySelectorAll('.works-node__video'));
    const worksPreviewDesktopQuery = window.matchMedia('(min-width: 769px)');
    
    /* プレビュー枠を初期状態に戻す。スマホ表示やリサイズ時の再計算前に使う。 */
    const resetWorksPreviewFrame = (video) => {
      const frame = video.closest('.works-node__image-wrap');
      if (!frame) return;
      frame.classList.remove('is-aspect-ready');
      frame.style.removeProperty('--work-preview-frame-width');
      frame.style.removeProperty('--work-preview-frame-height');
      frame.style.removeProperty('--work-preview-object-fit');
    };
    
    /* PC表示のみ、動画メタデータの比率から枠の横幅を計算する。縦幅はCSS側の高さを維持。 */
    const syncWorksPreviewFrame = (video) => {
      const frame = video.closest('.works-node__image-wrap');
      if (!frame) return;
    
      resetWorksPreviewFrame(video);
      if (!worksPreviewDesktopQuery.matches || !video.videoWidth || !video.videoHeight) return;
    
      const defaultRect = frame.getBoundingClientRect();
      const defaultHeight = defaultRect.height;
      const maxWidth = defaultRect.width;
      const videoRatio = video.videoWidth / video.videoHeight;
      const targetRatio = videoRatio;
      if (!defaultHeight || !maxWidth || !Number.isFinite(videoRatio)) return;
    
      const targetWidth = Math.min(maxWidth, defaultHeight * targetRatio);
      frame.style.setProperty('--work-preview-frame-height', `${defaultHeight}px`);
      frame.style.setProperty('--work-preview-frame-width', `${targetWidth}px`);
      frame.style.setProperty('--work-preview-object-fit', 'fill');
      frame.classList.add('is-aspect-ready');
    };
    
    /* 全作品のプレビュー枠をまとめて再計算する。リサイズ時にも使用。 */
    const syncAllWorksPreviewFrames = () => {
      worksPreviewVideos.forEach(video => syncWorksPreviewFrame(video));
    };
    
    worksPreviewVideos.forEach(video => {
      if (video.readyState >= 1) {
        syncWorksPreviewFrame(video);
      } else {
        video.addEventListener('loadedmetadata', () => syncWorksPreviewFrame(video), { once: true });
      }
      if (video.readyState >= 2) {
        syncWorksPreviewFrame(video);
      } else {
        video.addEventListener('loadeddata', () => syncWorksPreviewFrame(video), { once: true });
      }
      video.addEventListener('playing', () => {
        window.setTimeout(() => syncWorksPreviewFrame(video), 240);
      }, { once: true });
    });
    
    let worksPreviewResizeFrame = null;
    window.addEventListener('resize', () => {
      if (worksPreviewResizeFrame) cancelAnimationFrame(worksPreviewResizeFrame);
      worksPreviewResizeFrame = requestAnimationFrame(syncAllWorksPreviewFrames);
    });
    
    if (typeof worksPreviewDesktopQuery.addEventListener === 'function') {
      worksPreviewDesktopQuery.addEventListener('change', syncAllWorksPreviewFrames);
    } else if (typeof worksPreviewDesktopQuery.addListener === 'function') {
      worksPreviewDesktopQuery.addListener(syncAllWorksPreviewFrames);
    }
    
    const getSliderPositions = (viewport, track, slides) => {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      return slides.map(slide => {
        const centeredPosition = slide.offsetLeft
          - track.offsetLeft
          - (viewport.clientWidth - slide.offsetWidth) / 2;
        return Math.min(Math.max(centeredPosition, 0), maxScroll);
      });
    };
    
    const updateSliderState = (slider) => {
      const viewport = slider.querySelector('.work-slides__viewport');
      const track = slider.querySelector('.work-slides__track');
      const slides = Array.from(slider.querySelectorAll('.work-slide'));
      const current = slider.querySelector('[data-slide-current]');
      const total = slider.querySelector('[data-slide-total]');
      const prev = slider.querySelector('.work-slides__nav--prev');
      const next = slider.querySelector('.work-slides__nav--next');
      if (!viewport || !track || !slides.length || !current || !total || !prev || !next) return;
    
      const positions = getSliderPositions(viewport, track, slides);
      const index = positions.reduce((nearest, position, candidate) => (
        Math.abs(position - viewport.scrollLeft) < Math.abs(positions[nearest] - viewport.scrollLeft)
          ? candidate
          : nearest
      ), 0);
    
      current.textContent = String(index + 1);
      total.textContent = String(slides.length);
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
    };
    
    const moveSlider = (slider, direction) => {
      const viewport = slider.querySelector('.work-slides__viewport');
      const track = slider.querySelector('.work-slides__track');
      const slides = Array.from(slider.querySelectorAll('.work-slide'));
      if (!viewport || !track || !slides.length) return;
    
      const positions = getSliderPositions(viewport, track, slides);
      const currentIndex = positions.reduce((nearest, position, candidate) => (
        Math.abs(position - viewport.scrollLeft) < Math.abs(positions[nearest] - viewport.scrollLeft)
          ? candidate
          : nearest
      ), 0);
      const targetIndex = Math.min(Math.max(currentIndex + direction, 0), slides.length - 1);
      viewport.scrollTo({ left: positions[targetIndex], behavior: 'smooth' });
    };
    
    const resetSlider = (panel) => {
      const slider = panel?.querySelector('[data-work-slider]');
      const viewport = slider?.querySelector('.work-slides__viewport');
      if (!slider || !viewport) return;
      viewport.scrollTo({ left: 0, behavior: 'auto' });
      updateSliderState(slider);
    };
    
    workSliders.forEach(slider => {
      const viewport = slider.querySelector('.work-slides__viewport');
      const prev = slider.querySelector('.work-slides__nav--prev');
      const next = slider.querySelector('.work-slides__nav--next');
      if (!viewport || !prev || !next) return;
    
      prev.addEventListener('click', () => moveSlider(slider, -1));
      next.addEventListener('click', () => moveSlider(slider, 1));
    
      let scrollFrame = null;
      viewport.addEventListener('scroll', () => {
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => updateSliderState(slider));
      }, { passive: true });
    
      updateSliderState(slider);
    });
    
    if (workTabs.length && workPanels.length) {
      const activateWork = (targetId, shouldFocus = false, shouldScroll = false) => {
        let activePanel = null;
    
        workTabs.forEach(tab => {
          const isActive = tab.dataset.workTarget === targetId;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
          tab.setAttribute('tabindex', isActive ? '0' : '-1');
          if (isActive && shouldFocus) tab.focus();
        });
    
        workPanels.forEach(panel => {
          const isActive = panel.id === `work-panel-${targetId}`;
          panel.classList.toggle('is-active', isActive);
          panel.hidden = !isActive;
          if (isActive) activePanel = panel;
        });
    
        resetSlider(activePanel);
    
        if (shouldScroll && worksDetails) {
          requestAnimationFrame(() => {
            worksDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      };
    
      workTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
          activateWork(tab.dataset.workTarget, false, true);
        });
    
        tab.addEventListener('keydown', (event) => {
          const isNext = event.key === 'ArrowRight' || event.key === 'ArrowDown';
          const isPrev = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
          if (!isNext && !isPrev) return;
    
          event.preventDefault();
          const nextIndex = isNext
            ? (index + 1) % workTabs.length
            : (index - 1 + workTabs.length) % workTabs.length;
          activateWork(workTabs[nextIndex].dataset.workTarget, true, true);
        });
      });
    
      const initialTab = workTabs.find(tab => tab.classList.contains('is-active')) || workTabs[0];
      activateWork(initialTab.dataset.workTarget);
    }
    
    worksBackButtons.forEach(button => {
      button.addEventListener('click', () => {
        worksSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    
    if (worksPreviewToggle && worksPreviewVideos.length) {
      const setPreviewsPaused = (paused) => {
        worksPreviewVideos.forEach(video => {
          if (paused) {
            video.pause();
          } else {
            video.play().catch(() => {});
          }
        });
        worksPreviewToggle.setAttribute('aria-pressed', String(paused));
        const label = worksPreviewToggle.querySelector('.works-preview-toggle__label');
        if (label) {
          const playLabel = worksPreviewToggle.dataset.playLabel || 'プレビュー再生';
          const pauseLabel = worksPreviewToggle.dataset.pauseLabel || 'プレビュー停止';
          label.textContent = paused ? playLabel : pauseLabel;
        }
      };
    
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPreviewsPaused(prefersReducedMotion.matches);
    
      worksPreviewToggle.addEventListener('click', () => {
        setPreviewsPaused(worksPreviewToggle.getAttribute('aria-pressed') !== 'true');
      });
    }
  },
};
