/* ============================================================
   スクロール連動アニメーション
   汎用フェードイン、縦線、Strengths/Worksの出現演出を制御。
   ============================================================ */
window.PortfolioAnimations = {
  init() {
    const animTargets = document.querySelectorAll('.animate-on-scroll');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const abilityHeadings = Array.from(document.querySelectorAll('.ability__content-title'));
    
    const fitAbilityHeadings = () => {
      abilityHeadings.forEach(heading => {
        const container = heading.parentElement;
        if (!container) return;
    
        heading.style.fontSize = '';
        heading.style.maxWidth = 'none';
        const styles = window.getComputedStyle(heading);
        const minSize = Number.parseFloat(styles.getPropertyValue('--ability-title-min-size')) || 22;
        let size = Number.parseFloat(styles.fontSize);
        const containerRect = container.getBoundingClientRect();
        const safeInset = 24;
        const availableLeft = Math.max(containerRect.left, safeInset);
        const availableRight = Math.min(containerRect.right, document.documentElement.clientWidth - safeInset);
        const maxWidth = Math.max(0, availableRight - availableLeft);
    
        if (heading.scrollWidth > maxWidth && maxWidth > 0) {
          size = Math.max(minSize, Math.floor((size * maxWidth) / heading.scrollWidth) - 2);
          heading.style.fontSize = `${size}px`;
        }
    
        while (heading.getBoundingClientRect().width > maxWidth && size > minSize) {
          size -= 1;
          heading.style.fontSize = `${size}px`;
        }
      });
    };
    
    let abilityHeadingFrame = null;
    const scheduleFitAbilityHeadings = () => {
      if (abilityHeadingFrame) cancelAnimationFrame(abilityHeadingFrame);
      abilityHeadingFrame = requestAnimationFrame(fitAbilityHeadings);
    };
    
    scheduleFitAbilityHeadings();
    window.addEventListener('resize', scheduleFitAbilityHeadings);
    window.addEventListener('load', scheduleFitAbilityHeadings);
    document.fonts?.ready?.then(scheduleFitAbilityHeadings);
    
    /* ==========================================================
       汎用スクロールアニメーション
       .animate-on-scroll が画面に入ったら .is-visible を付ける。
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
          observer.unobserve(entry.target);   /* 一度だけ再生 */
        }
      });
    }, observerOptions);
    
    animTargets.forEach(el => observer.observe(el));

    const parseCssNumber = (value, fallback) => {
      const number = Number.parseFloat(String(value || '').trim());
      return Number.isFinite(number) ? number : fallback;
    };
    
    const journeyRails = document.querySelector('[data-journey-rails]');
    const journeyStart = document.getElementById('works');
    const journeyAbout = document.getElementById('about');
    const journeyAbility = document.getElementById('visual-ability');
    if (journeyRails && journeyStart && journeyAbility && journeyAbout) {
      let journeyStage = 0;
      let journeyProgress = 0;
      let journeySyncLocked = false;
      let journeySyncTimer = 0;
      let journeyAnimationFrame = 0;
      const journeyStops = [0, 0, 0, 0];
      /* 矢印の移動時間は journey.css の初速度・加速度から距離ごとに逆算する。 */
      const getJourneyMotionSettings = () => {
        const styles = window.getComputedStyle(journeyRails);
        return {
          initialVelocity: Math.max(parseCssNumber(styles.getPropertyValue('--journey-initial-velocity'), 900), 1),
          acceleration: Math.max(parseCssNumber(styles.getPropertyValue('--journey-acceleration'), 1200), 0),
        };
      };

      const getJourneyDuration = (distance) => {
        const distancePx = Math.max(distance, 0);
        if (distancePx === 0) return 0;

        const { initialVelocity, acceleration } = getJourneyMotionSettings();
        const durationSeconds = acceleration > 0
          ? (Math.sqrt((initialVelocity ** 2) + (2 * acceleration * distancePx)) - initialVelocity) / acceleration
          : distancePx / initialVelocity;

        return durationSeconds * 1000;
      };

      const cancelJourneyAnimation = () => {
        if (!journeyAnimationFrame) return;
        window.cancelAnimationFrame(journeyAnimationFrame);
        journeyAnimationFrame = 0;
        journeyRails.classList.remove('is-physics-moving');
      };

      const setJourneyProgress = (progress) => {
        journeyRails.style.setProperty('--journey-progress', `${progress}px`);
        journeyProgress = progress;
      };

      const animateJourneyProgress = (targetProgress) => {
        cancelJourneyAnimation();

        const startProgress = journeyProgress;
        const distance = Math.abs(targetProgress - startProgress);
        if (distance === 0) {
          setJourneyProgress(targetProgress);
          return 0;
        }

        const direction = targetProgress >= startProgress ? 1 : -1;
        const { initialVelocity, acceleration } = getJourneyMotionSettings();
        const duration = getJourneyDuration(distance);
        const startTime = performance.now();

        journeyRails.classList.add('is-physics-moving');

        const step = (now) => {
          const elapsedSeconds = Math.max((now - startTime) / 1000, 0);
          const moved = acceleration > 0
            ? (initialVelocity * elapsedSeconds) + (0.5 * acceleration * (elapsedSeconds ** 2))
            : initialVelocity * elapsedSeconds;
          const clampedMove = Math.min(moved, distance);
          const nextProgress = startProgress + (direction * clampedMove);

          setJourneyProgress(nextProgress);

          if (clampedMove < distance) {
            journeyAnimationFrame = window.requestAnimationFrame(step);
            return;
          }

          journeyAnimationFrame = 0;
          journeyRails.classList.remove('is-physics-moving');
          setJourneyProgress(targetProgress);
        };

        journeyAnimationFrame = window.requestAnimationFrame(step);
        return duration;
      };
    
      const measureJourneyRails = () => {
        const start = journeyStart.getBoundingClientRect().top + window.scrollY;
        const aboutTop = journeyAbout.getBoundingClientRect().top + window.scrollY;
        const abilityTop = journeyAbility.getBoundingClientRect().top + window.scrollY;
        const abilityBottom = journeyAbility.getBoundingClientRect().bottom + window.scrollY;
        const height = Math.max(abilityBottom - start, 0);
    
        journeyStops[0] = 0;
        journeyStops[1] = Math.max(aboutTop - start, 0);
        journeyStops[2] = Math.max(abilityTop - start, 0);
        journeyStops[3] = height;
    
        journeyRails.style.setProperty('--journey-start', `${start}px`);
        journeyRails.style.setProperty('--journey-height', `${height}px`);
      };
    
      const applyJourneyStage = (animate = false) => {
        const progress = journeyStops[journeyStage] || 0;
        const shouldAnimate = animate && !reducedMotionQuery.matches;
        const duration = shouldAnimate ? animateJourneyProgress(progress) : 0;
    
        journeyRails.style.setProperty('--journey-duration', `${duration}ms`);
        if (!shouldAnimate) {
          cancelJourneyAnimation();
          setJourneyProgress(progress);
        }
        journeyRails.classList.toggle('is-active', journeyStage > 0);
        return duration;
      };
    
      const unlockJourneySyncAfter = (duration) => {
        window.clearTimeout(journeySyncTimer);
        journeySyncTimer = window.setTimeout(() => {
          journeySyncLocked = false;
          syncJourneyRails();
        }, duration + 120);
      };
    
      const setJourneyStage = (stage) => {
        const nextStage = Math.max(journeyStage, stage);
        if (nextStage === journeyStage) return;
        const isFirstActivation = journeyStage === 0 && nextStage > 0;
        journeyStage = nextStage;
    
        if (isFirstActivation) {
          journeySyncLocked = true;
          journeyRails.style.setProperty('--journey-duration', '0ms');
          journeyRails.style.setProperty('--journey-progress', '0px');
          journeyRails.classList.add('is-active');
          journeyProgress = 0;
    
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const duration = applyJourneyStage(true);
              unlockJourneySyncAfter(duration);
            });
          });
          return;
        }
    
        applyJourneyStage(true);
      };
    
      const syncJourneyRails = () => {
        measureJourneyRails();
        if (journeySyncLocked && journeyStage > 0) return;
        applyJourneyStage();
      };
    
      const setInitialJourneyStage = () => {
        const anchor = window.scrollY + window.innerHeight * 0.5;
        const worksTop = journeyStart.getBoundingClientRect().top + window.scrollY;
        const aboutTop = journeyAbout.getBoundingClientRect().top + window.scrollY;
        const abilityTop = journeyAbility.getBoundingClientRect().top + window.scrollY;
        let initialStage = 0;
        if (anchor >= abilityTop) {
          initialStage = 3;
        } else if (anchor >= aboutTop) {
          initialStage = 2;
        } else if (anchor >= worksTop) {
          initialStage = 1;
        }
        if (initialStage > 0) {
          setJourneyStage(initialStage);
        }
      };
    
      const journeyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          if (entry.target === journeyStart) setJourneyStage(1);
          if (entry.target === journeyAbout) setJourneyStage(2);
          if (entry.target === journeyAbility) setJourneyStage(3);
        });
      }, {
        root: null,
        rootMargin: '0px 0px -42% 0px',
        threshold: 0.08,
      });
    
      window.addEventListener('resize', syncJourneyRails);
      window.addEventListener('load', syncJourneyRails);
      journeyObserver.observe(journeyStart);
      journeyObserver.observe(journeyAbout);
      journeyObserver.observe(journeyAbility);
      syncJourneyRails();
      setInitialJourneyStage();
      window.setTimeout(() => {
        syncJourneyRails();
        setInitialJourneyStage();
      }, 300);
    }
    
    /* ==========================================================
       Strengths：見出し、本文、画像のスクロール出現
       発火位置は各 IntersectionObserver の rootMargin / threshold で調整。
       ========================================================== */
    const abilitySequence = document.querySelector('[data-ability-sequence]');
    const abilityPanels = Array.from(document.querySelectorAll('.ability-panel'));
    const abilityFigureGroups = Array.from(document.querySelectorAll('.ability-article__figures'));
    if (abilitySequence) {
      if (reducedMotionQuery.matches) {
        abilitySequence.classList.add('is-activated');
        abilityPanels.forEach(panel => panel.classList.add('is-revealed'));
        abilityFigureGroups.forEach(group => group.classList.add('is-revealed'));
      } else {
        const abilityObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-activated');
              abilityObserver.unobserve(entry.target);
            }
          });
        }, {
          root: null,
          rootMargin: '0px 0px -45% 0px',
          threshold: 0.01,
        });
    
        abilityObserver.observe(abilitySequence);
    
        if (abilityPanels.length) {
          const abilityPanelObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                abilityPanelObserver.unobserve(entry.target);
              }
            });
          }, {
            root: null,
            rootMargin: '0px 0px -25% 0px',
            threshold: 0.12,
          });
    
          abilityPanels.forEach(panel => abilityPanelObserver.observe(panel));
        }
    
        if (abilityFigureGroups.length) {
          const abilityFigureObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                abilityFigureObserver.unobserve(entry.target);
              }
            });
          }, {
            root: null,
            rootMargin: '0px 0px -18% 0px',
            threshold: 0.08,
          });
    
          abilityFigureGroups.forEach(group => abilityFigureObserver.observe(group));
        }
      }
    }
    
    /* ==========================================================
       Works：章見出しと作品カードのスクロール出現
       作品カードの浮き上がり速度はCSSの .works-node transition を調整。
       ========================================================== */
    const worksSequence = document.getElementById('works');
    const worksPreviewGrid = document.querySelector('.works-map');
    if (worksSequence) {
      if (reducedMotionQuery.matches) {
        worksSequence.classList.add('is-activated');
        worksPreviewGrid?.classList.add('is-revealed');
      } else {
        const worksObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-activated');
              worksObserver.unobserve(entry.target);
            }
          });
        }, {
          root: null,
          rootMargin: '0px 0px -45% 0px',
          threshold: 0.01,
        });
    
        worksObserver.observe(worksSequence);
    
        if (worksPreviewGrid) {
          const worksPreviewObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                worksPreviewObserver.unobserve(entry.target);
              }
            });
          }, {
            root: null,
            rootMargin: '0px 0px -18% 0px',
            threshold: 0.08,
          });
    
          worksPreviewObserver.observe(worksPreviewGrid);
        }
      }
    }
  },
};
