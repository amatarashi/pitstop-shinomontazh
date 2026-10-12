(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Звёздное небо ---------- */
  const canvas = $('#stars');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [], w, h, dpr;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      const n = Math.round((innerWidth * innerHeight) / 14000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 0.9 + 0.2) * dpr,
        a: Math.random() * 0.6 + 0.1,
        s: Math.random() * 0.02 + 0.004,
        p: Math.random() * Math.PI * 2
      }));
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        const a = reduceMotion ? st.a : st.a * (0.55 + 0.45 * Math.sin(t * st.s * 0.06 + st.p));
        ctx.fillStyle = `rgba(255,32,52,${a * 0.4})`;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    };
    resize();
    addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }

  /* ---------- Бегущая строка ---------- */
  const mq = $('.marquee__track');
  if (mq) mq.innerHTML += mq.innerHTML;

  /* ---------- Шапка, прогресс, «наверх» ---------- */
  const header = $('.header');
  const bar = $('.progress span');
  const totop = $('.totop');
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('is-scrolled', y > 20);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    totop.classList.toggle('is-visible', y > innerHeight);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Бургер ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeLightbox(); } });

  /* ---------- Активный пункт меню ---------- */
  const links = $$('.nav a[href^="#"]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const s = $(l.getAttribute('href')); if (s) spy.observe(s); });

  /* ---------- Reveal ---------- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 8) * 0.06}s`);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  // первый экран показываем сразу, не дожидаясь observer
  $$('.reveal').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); });

  /* ---------- Счётчики ---------- */
  const fmt = (n, d) => d ? n.toFixed(d).replace('.', ',') : Math.round(n).toLocaleString('ru-RU');
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      countIO.unobserve(el);
      const to = +el.dataset.count, dec = +(el.dataset.decimals || 0);
      if (reduceMotion) { el.textContent = fmt(to, dec); return; }
      const dur = 1600, start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)), dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Подсветка карточек под курсором ---------- */
  if (matchMedia('(hover: hover)').matches) {
    $$('.spot').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- До / После ---------- */
  $$('[data-ba]').forEach(ba => {
    const range = $('input', ba);
    const set = () => ba.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set);
    set();
    if (reduceMotion) return;
    const hint = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      hint.disconnect();
      const frames = [50, 28, 72, 50];
      let i = 0;
      const step = () => {
        if (i >= frames.length - 1) return;
        const from = frames[i], to = frames[++i], t0 = performance.now();
        const anim = (t) => {
          const p = Math.min((t - t0) / 550, 1);
          range.value = from + (to - from) * (0.5 - Math.cos(p * Math.PI) / 2); set();
          p < 1 ? requestAnimationFrame(anim) : step();
        };
        requestAnimationFrame(anim);
      };
      setTimeout(step, 400);
    }, { threshold: 0.6 });
    hint.observe(ba);
  });

  /* ---------- Лайтбокс ---------- */
  const lb = $('#lightbox');
  const lbGrid = $('.lightbox__grid', lb);
  let lastFocus = null;
  function closeLightbox() {
    if (lb.hidden) return;
    lb.hidden = true; document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  }
  $$('[data-zoom]').forEach(btn => btn.addEventListener('click', () => {
    const [before, after] = btn.dataset.zoom.split('|');
    lbGrid.innerHTML = `
      <figure><img src="${before}" alt="До ремонта"><figcaption><span class="pill">До</span></figcaption></figure>
      <figure><img src="${after}" alt="После ремонта"><figcaption><span class="pill pill--light">После</span></figcaption></figure>`;
    lastFocus = btn;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    $('.lightbox__close', lb).focus();
  }));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox__close')) closeLightbox(); });

  /* ---------- Карусель отзывов ---------- */
  const track = $('#reviewsTrack');
  const dotsBox = $('#reviewsDots');
  const cards = [...track.children];
  const perView = () => +getComputedStyle(track).getPropertyValue('--per') || 1;
  const pages = () => Math.max(1, cards.length - perView() + 1);
  const current = () => {
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    return Math.round(track.scrollLeft / step);
  };
  const goTo = (i) => {
    const n = pages();
    i = (i + n) % n;
    track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
  };
  const renderDots = () => {
    const n = pages();
    if (dotsBox.children.length !== n) dotsBox.innerHTML = '<i></i>'.repeat(n);
    const c = Math.min(current(), n - 1);
    [...dotsBox.children].forEach((d, i) => d.classList.toggle('is-active', i === c));
  };
  $$('[data-slide]').forEach(b => b.addEventListener('click', () => goTo(current() + +b.dataset.slide)));
  track.addEventListener('scroll', () => requestAnimationFrame(renderDots), { passive: true });
  addEventListener('resize', renderDots);
  renderDots();

  /* ---------- Табы технологии ---------- */
  const tech = $('#tech');
  const tabs = $$('[data-tab]', tech);
  const selectTab = (tab) => {
    tech.dataset.mode = tab.dataset.tab;
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = $('#' + t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) $$('.reveal', panel).forEach(r => r.classList.add('is-in'));
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next); next.focus();
    });
  });

  /* ---------- Открыто сейчас? (время Москвы) ---------- */
  const status = $('#openStatus');
  if (status) {
    try {
      const h = +new Intl.DateTimeFormat('ru-RU', { hour: 'numeric', hour12: false, timeZone: 'Europe/Moscow' }).format(new Date());
      const open = h >= 9 && h < 23;
      status.textContent = open ? 'Сейчас открыто' : 'Сейчас закрыто · откроемся в 9:00';
      status.classList.add(open ? 'is-open' : 'is-closed');
    } catch (_) { /* без статуса */ }
  }

  $('#year').textContent = new Date().getFullYear();
})();
