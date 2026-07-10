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

  const setHighlightedText = (selector, value, highlight, className, root = document) => {
    const element = root.querySelector(selector);
    if (!element || value === undefined || value === null) return;

    const text = cleanDisplayText(value);
    const target = cleanDisplayText(highlight || '');
    const start = target ? text.indexOf(target) : -1;

    element.replaceChildren();
    if (start < 0) {
      element.textContent = text;
      return;
    }

    const accent = document.createElement('span');
    accent.className = className;
    accent.textContent = target;

    element.append(
      document.createTextNode(text.slice(0, start)),
      accent,
      document.createTextNode(text.slice(start + target.length))
    );
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

  const renderRadarChart = (radar) => {
    const root = document.querySelector('[data-radar]');
    const grid = root?.querySelector('.about-radar__grid');
    const score = root?.querySelector('.about-radar__score');
    const labels = root?.querySelector('.about-radar__labels');
    const list = root?.querySelector('.about-radar__list');
    if (!root || !grid || !score || !labels || !list || !Array.isArray(radar?.items)) return;

    const svgNS = 'http://www.w3.org/2000/svg';
    const createSvg = (tag) => document.createElementNS(svgNS, tag);
    const center = { x: 360, y: 260 };
    const radius = 158;
    const scoreRadius = radius * 1;
    const labelRadius = 150;
    const labelOffsets = [
      { x: 0, y: -34 },
      { x: 6, y: 28 },
      { x: -6, y: 28 },
    ];
    const max = Math.max(Number(radar.max) || 75, 1);
    const items = radar.items.slice(0, 5);
    const total = items.length;
    if (total < 3) return;

    const pointAt = (index, pointRadius) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
      return {
        x: center.x + Math.cos(angle) * pointRadius,
        y: center.y + Math.sin(angle) * pointRadius,
      };
    };

    const pointString = (points) => points
      .map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' ');

    const gridLevels = 5;
    grid.replaceChildren();
    score.replaceChildren();
    labels.replaceChildren();
    list.replaceChildren();

    for (let level = 1; level <= gridLevels; level += 1) {
      const polygon = createSvg('polygon');
      polygon.classList.add('about-radar__grid-line');
      if (level === gridLevels) polygon.classList.add('about-radar__grid-line--outer');
      polygon.setAttribute('points', pointString(items.map((_, index) => pointAt(index, radius * (level / gridLevels)))));
      grid.appendChild(polygon);
    }

    items.forEach((item, index) => {
      const axis = createSvg('line');
      const edge = pointAt(index, radius);
      axis.classList.add('about-radar__axis');
      axis.setAttribute('x1', center.x);
      axis.setAttribute('y1', center.y);
      axis.setAttribute('x2', edge.x);
      axis.setAttribute('y2', edge.y);
      grid.appendChild(axis);

      const labelPoint = pointAt(index, labelRadius);
      const labelOffset = labelOffsets[index] || { x: 0, y: 0 };
      const label = createSvg('text');
      label.classList.add('about-radar__label');
      label.setAttribute('x', labelPoint.x + labelOffset.x);
      label.setAttribute('y', labelPoint.y + labelOffset.y);
      label.setAttribute('text-anchor', Math.abs(labelPoint.x - center.x) < 16 ? 'middle' : labelPoint.x > center.x ? 'start' : 'end');
      label.textContent = cleanDisplayText(item.label || '');
      labels.appendChild(label);

      const li = document.createElement('li');
      li.textContent = `${cleanDisplayText(item.label || '')}: ${Math.max(Number(item.value) || 0, 0)}/${max}`;
      list.appendChild(li);
    });

    const scorePoints = items.map((item, index) => {
      const value = Math.max(Number(item.value) || 0, 0);
      return pointAt(index, scoreRadius * (value / max));
    });

    const shapeGroup = createSvg('g');
    shapeGroup.classList.add('about-radar__score-shape');

    const fill = createSvg('polygon');
    fill.classList.add('about-radar__score-fill');
    fill.setAttribute('points', pointString(scorePoints));

    const outline = createSvg('polygon');
    outline.classList.add('about-radar__score-line');
    outline.setAttribute('points', pointString(scorePoints));

    shapeGroup.append(fill, outline);
    score.appendChild(shapeGroup);

    root.style.setProperty('--radar-center-x', `${center.x}px`);
    root.style.setProperty('--radar-center-y', `${center.y}px`);
    const title = root.querySelector('#about-radar-title');
    const desc = root.querySelector('#about-radar-desc');
    if (title) title.textContent = cleanDisplayText(radar.title || '能力バランス');
    if (desc) {
      desc.textContent = items
        .map(item => `${cleanDisplayText(item.label || '')}${Math.max(Number(item.value) || 0, 0)}点`)
        .join('、');
    }
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

    if (item.playUrl) {
      link.textContent = cleanDisplayText(item.playLabel || content.works?.playLinkLabel || 'プレイページを見る');
      link.href = item.playUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.hidden = false;
      actions.hidden = false;
      link.classList.remove('is-disabled');
      link.removeAttribute('aria-disabled');
      link.removeAttribute('role');
      link.setAttribute('aria-label', `${cleanDisplayText(item.detailTitle || '作品')}をUnityroomで開く`);
    } else {
      link.textContent = cleanDisplayText(item.playUnavailableLabel || content.works?.playUnavailableLabel || '非公開');
      link.hidden = false;
      actions.hidden = false;
      link.removeAttribute('href');
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.removeAttribute('aria-label');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('role', 'button');
      link.classList.add('is-disabled');
    }
  };

  const syncWorksCardPlayLink = (tab, item) => {
    const card = tab.closest('.works-card');
    if (!card) return;
    let link = card.querySelector('.works-card__play');
    if (!link) {
      link = document.createElement('a');
      link.className = 'works-card__play';
      tab.insertAdjacentElement('afterend', link);
    }
    if (!link) return;

    if (item.playUrl) {
      link.textContent = cleanDisplayText(item.previewPlayLabel || content.works?.previewPlayLabel || 'Play');
      link.href = item.playUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.hidden = false;
      link.classList.remove('is-disabled');
      link.removeAttribute('aria-disabled');
      link.removeAttribute('role');
      link.setAttribute('aria-label', `${cleanDisplayText(item.detailTitle || '作品')}をUnityroomで開く`);
    } else {
      link.textContent = cleanDisplayText(item.previewPlayUnavailableLabel || item.playUnavailableLabel || content.works?.playUnavailableLabel || '非公開');
      link.hidden = false;
      link.removeAttribute('href');
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.removeAttribute('aria-label');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('role', 'button');
      link.classList.add('is-disabled');
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
    setHighlightedText('.hero__tagline', content.hero.tagline, content.hero.taglineHighlight, 'hero__tagline-accent');
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
    renderRadarChart(content.about.radar);
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
    if (Array.isArray(content.works.guide)) {
      setLines(document.querySelector('#works .works__guide'), content.works.guide);
    } else {
      setText('#works .works__guide', content.works.guide);
    }

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
  const journeyStart = document.getElementById('works');
  const journeyAbout = document.getElementById('about');
  const journeyAbility = document.getElementById('visual-ability');
  if (journeyRails && journeyStart && journeyAbility && journeyAbout) {
    let journeyStage = 0;
    let journeyProgress = 0;
    let journeySyncLocked = false;
    let journeySyncTimer = 0;
    const journeyStops = [0, 0, 0, 0];
    const baseJourneyDuration = 1800;

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
      const baseDistance = Math.max(journeyStops[1], 1);
      const distance = Math.abs(progress - journeyProgress);
      const duration = animate
        ? Math.max(baseJourneyDuration, Math.min(5200, (distance / baseDistance) * baseJourneyDuration))
        : 0;

      journeyRails.style.setProperty('--journey-duration', `${duration}ms`);
      journeyRails.style.setProperty('--journey-progress', `${progress}px`);
      journeyRails.classList.toggle('is-active', journeyStage > 0);
      journeyProgress = progress;
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
  const worksPreviewDesktopQuery = window.matchMedia('(min-width: 769px)');

  const resetWorksPreviewFrame = (video) => {
    const frame = video.closest('.works-node__image-wrap');
    if (!frame) return;
    frame.classList.remove('is-aspect-ready');
    frame.style.removeProperty('--work-preview-frame-width');
    frame.style.removeProperty('--work-preview-frame-height');
    frame.style.removeProperty('--work-preview-object-fit');
  };

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
