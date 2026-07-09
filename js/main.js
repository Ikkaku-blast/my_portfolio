/* ============================================================
   Main JavaScript — Portfolio
   ============================================================ */

const loadPortfolioContent = async () => {
  try {
    const response = await fetch('content/portfolio.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to load content: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Portfolio content JSON could not be loaded. Falling back to inline HTML.', error);
    return null;
  }
};

const applyPortfolioContent = (content) => {
  if (!content) return;

  const cleanDisplayText = (value) => String(value)
    .replace(/\u3000/g, '')
    .replace(/[ \t]*\r?\n+[ \t]*/g, '')
    .replace(/([\u3040-\u30ff\u3400-\u9fff々〆〤]) +(?=[\u3040-\u30ff\u3400-\u9fff々〆〤])/g, '$1')
    .replace(/([。！？、]) +(?=[\u3040-\u30ff\u3400-\u9fff々〆〤「『])/g, '$1')
    .replace(/([\u3040-\u30ff\u3400-\u9fff々〆〤]) +(?=[。！？、])/g, '$1')
    .replace(/\s*\/\s*/g, '/');

  const setText = (selector, value, root = document) => {
    const element = root.querySelector(selector);
    if (!element || value === undefined || value === null) return;
    element.textContent = cleanDisplayText(value);
  };

  const setAttr = (selector, name, value, root = document) => {
    const element = root.querySelector(selector);
    if (!element || value === undefined || value === null) return;
    element.setAttribute(name, cleanDisplayText(value));
  };

  const setLines = (element, lines) => {
    if (!element || !Array.isArray(lines)) return;
    element.replaceChildren();
    lines.forEach((line, index) => {
      if (index > 0) element.appendChild(document.createElement('br'));
      element.appendChild(document.createTextNode(cleanDisplayText(line)));
    });
  };

  const setParagraphs = (container, selector, paragraphs, className) => {
    if (!container || !Array.isArray(paragraphs)) return;
    const existing = Array.from(container.querySelectorAll(selector));
    existing.forEach(element => element.remove());
    const anchor = container.querySelector('.ability__content-title');
    let insertAfter = anchor;
    paragraphs.forEach(paragraph => {
      const element = document.createElement('p');
      element.className = className;
      element.textContent = cleanDisplayText(paragraph);
      if (insertAfter) {
        insertAfter.insertAdjacentElement('afterend', element);
        insertAfter = element;
      } else {
        container.appendChild(element);
      }
    });
  };

  const makeSlideFigure = (slide) => {
    const figure = document.createElement('figure');
    figure.className = 'work-slide';

    const button = document.createElement('button');
    button.className = 'ability-zoom work-slide__zoom';
    button.type = 'button';
    button.dataset.lightboxSrc = slide.image || '';
    button.dataset.lightboxCaption = cleanDisplayText(slide.lightboxCaption || slide.caption || '');

    const image = document.createElement('img');
    image.src = slide.image || '';
    image.alt = cleanDisplayText(slide.alt || slide.lightboxCaption || slide.caption || '');
    image.className = 'work-slide__image';

    const icon = document.createElement('span');
    icon.className = 'ability-zoom__icon';
    icon.setAttribute('aria-hidden', 'true');

    const caption = document.createElement('figcaption');
    caption.textContent = cleanDisplayText(slide.caption || '');

    button.append(image, icon);
    figure.append(button, caption);
    return figure;
  };

  const syncWorkPlayLink = (panel, item) => {
    const summary = panel.querySelector('.work-detail__summary');
    let actions = panel.querySelector('.work-detail__actions');
    let link = panel.querySelector('.work-detail__play-link');
    if (!actions && summary) {
      actions = document.createElement('div');
      actions.className = 'work-detail__actions';
      summary.insertAdjacentElement('afterend', actions);
    }
    if (link && actions && link.parentElement !== actions) {
      actions.appendChild(link);
    }
    if (!link && actions) {
      link = document.createElement('a');
      link.className = 'work-detail__play-link';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.appendChild(link);
    }
    if (!actions || !link) return;

    link.textContent = cleanDisplayText(item.playLabel || content.works?.playLinkLabel || 'プレイページを見る');
    if (item.playUrl) {
      link.href = item.playUrl;
      link.hidden = false;
      actions.hidden = false;
      link.setAttribute('aria-label', `${cleanDisplayText(item.detailTitle || '作品')}をUnityroomで開く`);
    } else {
      link.hidden = true;
      actions.hidden = true;
      link.removeAttribute('href');
      link.removeAttribute('aria-label');
    }
  };

  const syncWorksCardPlayLink = (tab, item) => {
    const card = tab.closest('.works-card');
    if (!card) return;
    let link = card.querySelector('.works-card__play');
    if (!link && item.playUrl) {
      link = document.createElement('a');
      link.className = 'works-card__play';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      tab.insertAdjacentElement('afterend', link);
    }
    if (!link) return;

    link.textContent = cleanDisplayText(item.previewPlayLabel || content.works?.previewPlayLabel || 'Play');
    if (item.playUrl) {
      link.href = item.playUrl;
      link.hidden = false;
      link.setAttribute('aria-label', `${cleanDisplayText(item.detailTitle || '作品')}をUnityroomで開く`);
    } else {
      link.hidden = true;
      link.removeAttribute('href');
      link.removeAttribute('aria-label');
    }
  };

  if (content.meta) {
    if (content.meta.title) document.title = content.meta.title;
    setAttr('meta[name="description"]', 'content', content.meta.description);
  }

  if (content.header) {
    setText('.header__logo', content.header.logo);
    setAttr('#hamburger', 'aria-label', content.header.menuLabel);
    const navLinks = Array.from(document.querySelectorAll('.header__nav-link'));
    content.header.nav?.forEach((item, index) => {
      const link = navLinks[index];
      if (!link) return;
      link.textContent = item.label || '';
      if (item.href) link.setAttribute('href', item.href);
    });
  }

  if (content.hero) {
    const interests = document.querySelector('.hero__interests');
    if (interests && Array.isArray(content.hero.interests)) {
      interests.replaceChildren();
      content.hero.interests.forEach((label, index) => {
        const item = document.createElement('li');
        item.className = `hero__interest hero__interest--${String(index + 1).padStart(2, '0')}`;
        item.dataset.heroInterest = '';
        item.textContent = label;
        interests.appendChild(item);
      });
    }
    setText('.hero__greeting', content.hero.greeting);
    setText('.hero__name', content.hero.name);
    setText('.hero__tagline', content.hero.tagline);
    setText('.hero__cta', content.hero.cta);
  }

  if (content.about) {
    setText('#about .section__title', content.about.title);
    setText('.about__photo-placeholder span', content.about.photoLabel);
    setText('.about__name', content.about.name);
    setText('.about__role', content.about.role);
    setText('.about__description', content.about.description);
    const skills = document.querySelector('.about__skills');
    if (skills && Array.isArray(content.about.skills)) {
      skills.replaceChildren();
      content.about.skills.forEach(label => {
        const skill = document.createElement('span');
        skill.className = 'skill-tag';
        skill.textContent = label;
        skills.appendChild(skill);
      });
    }
  }

  if (content.ability) {
    setText('.ability__title', content.ability.title);
    const panels = Array.from(document.querySelectorAll('.ability-panel'));
    content.ability.panels?.forEach((panelData, index) => {
      const panel = panels[index];
      if (!panel) return;
      setText('.ability__content-title', panelData.title, panel);
      setParagraphs(panel.querySelector('.ability-article__text'), '.ability__content-text', panelData.paragraphs, 'ability__content-text');
      const figures = Array.from(panel.querySelectorAll('.ability-doc-image'));
      panelData.figures?.forEach((figureData, figureIndex) => {
        const figure = figures[figureIndex];
        if (!figure) return;
        const button = figure.querySelector('[data-lightbox-src]');
        const image = figure.querySelector('img');
        if (button) {
          button.dataset.lightboxSrc = figureData.image || '';
          button.dataset.lightboxCaption = cleanDisplayText(figureData.lightboxCaption || figureData.caption || '');
        }
        if (image) {
          image.src = figureData.image || '';
          image.alt = cleanDisplayText(figureData.alt || figureData.lightboxCaption || figureData.caption || '');
        }
        setText('figcaption', figureData.caption, figure);
      });
    });
  }

  if (content.works) {
    setText('#works .section__title', content.works.title);
    setText('#works .section__subtitle', content.works.subtitle);

    const toggle = document.getElementById('works-preview-toggle');
    if (toggle && content.works.previewToggle) {
      toggle.dataset.pauseLabel = content.works.previewToggle.pauseLabel || '';
      toggle.dataset.playLabel = content.works.previewToggle.playLabel || '';
      setText('.works-preview-toggle__label', content.works.previewToggle.pauseLabel, toggle);
    }

    document.querySelectorAll('.work-slides__nav--prev').forEach(button => {
      if (content.works.slidePrevLabel) button.setAttribute('aria-label', content.works.slidePrevLabel);
    });
    document.querySelectorAll('.work-slides__nav--next').forEach(button => {
      if (content.works.slideNextLabel) button.setAttribute('aria-label', content.works.slideNextLabel);
    });
    document.querySelectorAll('.works-back').forEach(button => {
      if (content.works.backLabel) button.textContent = content.works.backLabel;
    });

    content.works.items?.forEach(item => {
      const tab = document.querySelector(`[data-work-target="${item.id}"]`);
      const panel = document.getElementById(`work-panel-${item.id}`);

      if (tab) {
        setText('.works-node__date', item.date, tab);
        setLines(tab.querySelector('.works-node__title'), item.previewTitleLines);
        setLines(tab.querySelector('.works-node__meta'), item.previewMeta);
        setText('.works-node__hint', item.previewHint, tab);
        syncWorksCardPlayLink(tab, item);
        const video = tab.querySelector('.works-node__video');
        const source = tab.querySelector('.works-node__video source');
        if (video && item.poster) video.setAttribute('poster', item.poster);
        if (source && item.video) {
          source.setAttribute('src', item.video);
          video?.load();
        }
      }

      if (panel) {
        setText('.work-detail__title', item.detailTitle, panel);
        setText('.work-detail__meta', item.meta, panel);
        setText('.work-detail__summary', item.summary, panel);
        syncWorkPlayLink(panel, item);
        const slider = panel.querySelector('[data-work-slider]');
        if (slider && item.sliderLabel) slider.setAttribute('aria-label', item.sliderLabel);
        const track = panel.querySelector('.work-slides__track');
        if (track && Array.isArray(item.slides)) {
          track.replaceChildren(...item.slides.map(makeSlideFigure));
        }
      }
    });
  }

  if (content.activities) {
    setText('#activities .section__title', content.activities.title);
    setText('#activities .section__subtitle', content.activities.subtitle);
    const timeline = document.querySelector('.activities__timeline');
    if (timeline && Array.isArray(content.activities.items)) {
      timeline.replaceChildren();
      content.activities.items.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'timeline-item animate-on-scroll';

        const dot = document.createElement('div');
        dot.className = 'timeline-item__dot';

        const card = document.createElement('div');
        card.className = 'timeline-item__card';

        const date = document.createElement('span');
        date.className = 'timeline-item__date';
        date.textContent = activity.date || '';

        const title = document.createElement('h3');
        title.className = 'timeline-item__title';
        title.textContent = activity.title || '';

        const description = document.createElement('p');
        description.className = 'timeline-item__desc';
        description.textContent = activity.description || '';

        card.append(date, title, description);
        item.append(dot, card);
        timeline.appendChild(item);
      });
    }
  }

  if (content.footer) {
    setText('.footer__copy', content.footer.copy);
  }

  if (content.lightbox) {
    setAttr('.image-lightbox__close', 'aria-label', content.lightbox.closeLabel);
    setAttr('.image-lightbox__backdrop', 'aria-label', content.lightbox.backdropLabel);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const portfolioContent = await loadPortfolioContent();
  applyPortfolioContent(portfolioContent);

  /* ---------- Elements ---------- */
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.header__nav-link');
  const sections = document.querySelectorAll('.section, .hero');
  const animTargets = document.querySelectorAll('.animate-on-scroll');
  const heroName = document.getElementById('hero-name');
  const heroInterests = Array.from(document.querySelectorAll('[data-hero-interest]'));
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
     0. Hero — staggered interests & name font cycling
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
    }, 300);
  }

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

  const journeyRails = document.querySelector('[data-journey-rails]');
  const journeyStart = document.getElementById('about');
  const journeyAbility = document.getElementById('visual-ability');
  const journeyWorks = document.getElementById('works');
  if (journeyRails && journeyStart && journeyAbility && journeyWorks) {
    let journeyStage = 0;
    let journeyProgress = 0;
    const journeyStops = [0, 0, 0, 0];
    const baseJourneyDuration = 780;

    const measureJourneyRails = () => {
      const start = journeyStart.getBoundingClientRect().top + window.scrollY;
      const abilityTop = journeyAbility.getBoundingClientRect().top + window.scrollY;
      const worksTop = journeyWorks.getBoundingClientRect().top + window.scrollY;
      const worksBottom = journeyWorks.getBoundingClientRect().bottom + window.scrollY;
      const height = Math.max(worksBottom - start, 0);

      journeyStops[0] = 0;
      journeyStops[1] = Math.max(abilityTop - start, 0);
      journeyStops[2] = Math.max(worksTop - start, 0);
      journeyStops[3] = height;

      journeyRails.style.setProperty('--journey-start', `${start}px`);
      journeyRails.style.setProperty('--journey-height', `${height}px`);
    };

    const applyJourneyStage = (animate = false) => {
      const progress = journeyStops[journeyStage] || 0;
      const baseDistance = Math.max(journeyStops[1], 1);
      const distance = Math.abs(progress - journeyProgress);
      const duration = animate
        ? Math.max(baseJourneyDuration, Math.min(5200, (distance / baseDistance) * baseJourneyDuration))
        : 0;

      journeyRails.style.setProperty('--journey-duration', `${duration}ms`);
      journeyRails.style.setProperty('--journey-progress', `${progress}px`);
      journeyRails.classList.toggle('is-active', journeyStage > 0);
      journeyProgress = progress;
    };

    const setJourneyStage = (stage) => {
      const nextStage = Math.max(journeyStage, stage);
      if (nextStage === journeyStage) return;
      journeyStage = nextStage;
      applyJourneyStage(true);
    };

    const syncJourneyRails = () => {
      measureJourneyRails();
      applyJourneyStage();
    };

    const setInitialJourneyStage = () => {
      const anchor = window.scrollY + window.innerHeight * 0.5;
      const worksTop = journeyWorks.getBoundingClientRect().top + window.scrollY;
      const abilityTop = journeyAbility.getBoundingClientRect().top + window.scrollY;
      const aboutTop = journeyStart.getBoundingClientRect().top + window.scrollY;
      if (anchor >= worksTop) {
        journeyStage = 3;
      } else if (anchor >= abilityTop) {
        journeyStage = 2;
      } else if (anchor >= aboutTop) {
        journeyStage = 1;
      }
      applyJourneyStage();
    };

    const journeyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target === journeyStart) setJourneyStage(1);
        if (entry.target === journeyAbility) setJourneyStage(2);
        if (entry.target === journeyWorks) setJourneyStage(3);
      });
    }, {
      root: null,
      rootMargin: '0px 0px -42% 0px',
      threshold: 0.08,
    });

    window.addEventListener('resize', syncJourneyRails);
    window.addEventListener('load', syncJourneyRails);
    journeyObserver.observe(journeyStart);
    journeyObserver.observe(journeyAbility);
    journeyObserver.observe(journeyWorks);
    syncJourneyRails();
    setInitialJourneyStage();
    window.setTimeout(() => {
      syncJourneyRails();
      setInitialJourneyStage();
    }, 300);
  }

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
     6. Works — 制作順マップの詳細表示
     ========================================================== */
  const workTabs = Array.from(document.querySelectorAll('.works-node'));
  const workPanels = Array.from(document.querySelectorAll('.work-detail'));
  const workSliders = Array.from(document.querySelectorAll('[data-work-slider]'));
  const worksSection = document.getElementById('works');
  const worksDetails = document.querySelector('.works-details');
  const worksBackButtons = document.querySelectorAll('.works-back');
  const worksPreviewToggle = document.getElementById('works-preview-toggle');
  const worksPreviewVideos = Array.from(document.querySelectorAll('.works-node__video'));

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

  /* ==========================================================
     7. Image lightbox — 画像クリックで拡大表示
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
});
