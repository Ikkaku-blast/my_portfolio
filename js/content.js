/* ============================================================
   ポートフォリオ全体の動作制御
   - content/portfolio.json の本文反映
   - スクロール連動アニメーション
   - Worksのプレビュー/スライダー/ライトボックス
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

  /* JSONから読み込んだ本文に紛れた不要な改行・スペースを整える。 */
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

  const setHighlightedSegments = (selector, value, highlights, className, root = document) => {
    const element = root.querySelector(selector);
    if (!element || value === undefined || value === null) return;

    const text = cleanDisplayText(value);
    const targets = (Array.isArray(highlights) ? highlights : [highlights])
      .map(item => cleanDisplayText(item || ''))
      .filter(Boolean);

    if (!targets.length) {
      element.textContent = text;
      return;
    }

    const ranges = [];
    targets.forEach(target => {
      let start = text.indexOf(target);
      while (start >= 0) {
        ranges.push({ start, end: start + target.length });
        start = text.indexOf(target, start + target.length);
      }
    });
    ranges.sort((a, b) => a.start - b.start);

    const merged = [];
    ranges.forEach(range => {
      const previous = merged[merged.length - 1];
      if (previous && range.start < previous.end) return;
      merged.push(range);
    });

    element.replaceChildren();
    let cursor = 0;
    merged.forEach(range => {
      if (range.start > cursor) {
        element.appendChild(document.createTextNode(text.slice(cursor, range.start)));
      }
      const accent = document.createElement('span');
      accent.className = className;
      accent.textContent = text.slice(range.start, range.end);
      element.appendChild(accent);
      cursor = range.end;
    });
    if (cursor < text.length) {
      element.appendChild(document.createTextNode(text.slice(cursor)));
    }
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
    setText('.about__name', content.about.name);
    setText('.about__role', content.about.role);
    setHighlightedSegments(
      '.about__description',
      content.about.description,
      content.about.descriptionHighlights,
      'about__description-highlight'
    );
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

window.PortfolioContent = {
  loadPortfolioContent,
  applyPortfolioContent,
};
