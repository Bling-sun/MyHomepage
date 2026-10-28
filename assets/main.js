(() => {
  'use strict';
  const root = document.documentElement;
  const translations = JSON.parse(document.getElementById('translations').textContent);
  const languageButton = document.getElementById('language-toggle');
  const themeButton = document.getElementById('theme-toggle');
  // Storage is optional: language and theme controls also work when it is blocked.
  const stored = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  let language = new URLSearchParams(location.search).get('lang') || stored('bing-language') || 'en';
  let theme = stored('bing-theme') || 'light';
  if (!['en', 'zh'].includes(language)) language = 'en';
  if (!['light', 'dark'].includes(theme)) theme = 'light';

  function renderLanguage() {
    root.lang = language === 'zh' ? 'zh-CN' : 'en';
    for (const element of document.querySelectorAll('[data-i18n]')) {
      const translation = translations[element.dataset.i18n];
      if (translation) element.textContent = translation[language];
    }
    document.getElementById('language-label').textContent = language === 'en' ? '中文' : 'EN';
    languageButton.setAttribute('aria-label', language === 'en' ? '切换为中文' : 'Switch to English');
    document.title = language === 'zh' ? `孙冰${document.body.classList.contains('cv-page') ? ' — 简历' : ' | 机器人与具身智能'}` : `Bing Sun${document.body.classList.contains('cv-page') ? ' — CV' : ' | Robotics & Embodied AI'}`;
    // Carry the selected language between the homepage and CV, even without storage.
    for (const link of document.querySelectorAll('[data-profile-link]')) {
      const url = new URL(link.getAttribute('href'), location.href);
      url.searchParams.set('lang', language);
      link.href = url.href;
    }
    renderTheme();
  }

  function renderTheme() {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-label', language === 'zh' ? (theme === 'light' ? '切换为深色主题' : '切换为浅色主题') : (theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'));
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
  }

  languageButton.addEventListener('click', () => {
    language = language === 'en' ? 'zh' : 'en';
    save('bing-language', language);
    // Keep an explicit CV language query in sync with the chosen language.
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url);
    }
    renderLanguage();
  });
  themeButton.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    save('bing-theme', theme);
    renderTheme();
  });
  document.getElementById('print-cv')?.addEventListener('click', () => window.print());
  renderLanguage();

  const emailDialog = document.getElementById('email-contact');
  const emailStatus = document.getElementById('email-status');
  for (const link of document.querySelectorAll('[data-email-contact]')) {
    link.addEventListener('click', event => {
      if (typeof emailDialog?.showModal !== 'function') return;
      event.preventDefault();
      emailStatus.textContent = '';
      emailDialog.showModal();
    });
  }
  for (const button of document.querySelectorAll('[data-copy-email]')) button.addEventListener('click', async () => {
    const emailAddress = document.getElementById(button.dataset.copyEmail);
    try {
      await navigator.clipboard.writeText(emailAddress.value);
      emailStatus.textContent = `${language === 'zh' ? '已复制：' : 'Copied: '}${emailAddress.value}`;
    } catch {
      emailAddress.focus();
      emailAddress.select();
      emailStatus.textContent = language === 'zh' ? '请复制上方已选中的邮箱地址。' : 'Please copy the selected email address above.';
    }
  });
  emailDialog?.addEventListener('click', event => {
    if (event.target !== emailDialog) return;
    const bounds = emailDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) emailDialog.close();
  });

  // Galleries request a video only after an explicit play action.
  const demoLabel = (button, key) => {
    const labels = {play: ['Play demo', '播放演示'], stop: ['Stop demo', '停止演示'], retry: ['Retry demo', '重试播放']};
    const target = button.querySelector('[data-demo-text]');
    if (target) target.textContent = labels[key][language === 'zh' ? 1 : 0];
    button.dataset.label = key;
  };
  const stopDemo = figure => {
    const video = figure.querySelector('video');
    const button = figure.querySelector('.demo-toggle');
    if (video) video.pause();
    if (button?.dataset.kind === 'gif' && button.dataset.playing === 'true') {
      const img = figure.querySelector('img');
      img.removeAttribute('src');
      if (button.dataset.poster) img.src = button.dataset.poster;
      else img.hidden = true;
      button.dataset.playing = 'false';
      button.setAttribute('aria-pressed', 'false');
      demoLabel(button, 'play');
    }
  };
  for (const gallery of document.querySelectorAll('.media-gallery')) {
    const figures = [...gallery.querySelectorAll('.entry-media')];
    for (const selector of gallery.querySelectorAll('[data-media-index]')) {
      selector.addEventListener('click', () => {
        figures.forEach((figure, index) => {
          if (index !== Number(selector.dataset.mediaIndex)) stopDemo(figure);
          figure.hidden = index !== Number(selector.dataset.mediaIndex);
        });
        gallery.querySelectorAll('[data-media-index]').forEach(button => button.setAttribute('aria-pressed', String(button === selector)));
      });
    }
    for (const figure of figures) {
      const button = figure.querySelector('.demo-toggle');
      if (!button) continue;
      const video = figure.querySelector('video');
      const image = figure.querySelector('img');
      const onError = () => {
        button.dataset.playing = 'false';
        button.setAttribute('aria-pressed', 'false');
        demoLabel(button, 'retry');
      };
      if (video) {
        video.addEventListener('error', onError);
        video.addEventListener('play', () => {
          document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
          button.dataset.playing = 'true';
        });
      } else image?.addEventListener('error', onError);
      button.addEventListener('click', async () => {
        if (video) {
          if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
          try { video.controls = true; await video.play(); button.dataset.playing = 'true'; } catch { onError(); }
        } else if (button.dataset.playing === 'true') stopDemo(figure);
        else { image.src = image.dataset.src; image.hidden = false; button.dataset.playing = 'true'; button.setAttribute('aria-pressed', 'true'); demoLabel(button, 'stop'); }
      });
    }
  }
  const updateMediaLanguage = () => {
    for (const element of document.querySelectorAll('[data-i18n-alt]')) {
      const label = translations[element.dataset.i18nAlt]?.[language];
      if (label) element.setAttribute(element.tagName === 'IMG' ? 'alt' : 'aria-label', label);
    }
    document.querySelectorAll('.demo-toggle').forEach(button => demoLabel(button, button.dataset.label || 'play'));
  };
  languageButton.addEventListener('click', updateMediaLanguage);
  updateMediaLanguage();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('.entry-media').forEach(stopDemo);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (!entry.isIntersecting) entry.target.pause();
    }, {threshold: 0.05});
    document.querySelectorAll('video').forEach(video => observer.observe(video));
  }
  const navLinks = [...document.querySelectorAll('.section-nav a')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
  let scrollPending = false;
  const updateSection = () => {
    scrollPending = false;
    let active = -1;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= 150) active = index; });
    if (active >= 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) active = sections.length - 1;
    navLinks.forEach((link, index) => { if (index === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  };
  window.addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateSection); } }, {passive:true});
  updateSection();
  let printDetails = [];
  window.addEventListener('beforeprint', () => { printDetails = [...document.querySelectorAll('details:not([open])')]; printDetails.forEach(detail => { detail.open = true; }); });
  window.addEventListener('afterprint', () => { printDetails.forEach(detail => { detail.open = false; }); });


})();
