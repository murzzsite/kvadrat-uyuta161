const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/GVPNL2N7FM';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/[  ]/g, ' ');

  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* header: hide on scroll down, show on up */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('is-hide', y > lastY && y > 300 && !nav.classList.contains('is-open'));
    lastY = y;
  }, { passive: true });
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open'); nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
  }));

  /* hero title split */
  const title = $('[data-split]');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  }

  /* phone mask (keeps messenger nicks) */
  $$('input[type="tel"]').forEach(input => input.addEventListener('input', e => {
    const raw = e.target.value;
    if (/[a-zA-Zа-яА-Я@]/.test(raw)) return;
    let v = raw.replace(/\D/g, '');
    if (!v) { e.target.value = ''; return; }
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let out = '+7';
    if (v.length > 1) out += ' (' + v.slice(1, 4);
    if (v.length >= 4) out += ') ' + v.slice(4, 7);
    if (v.length >= 7) out += '-' + v.slice(7, 9);
    if (v.length >= 9) out += '-' + v.slice(9, 11);
    e.target.value = out;
  }));

  /* smooth anchors */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const t = $(href); if (!t) return;
    e.preventDefault();
    let top = t.getBoundingClientRect().top + scrollY - 64;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* страницы блога подключают этот файл ради шапки: сцены и формы там нет */
  if (!document.getElementById('floor')) return;

  /* ============ hero: laser scan ============ */
  const scan = $('#scan'), tag = $('#scanTag');
  let sp = 0, sweeping = true;
  const setScan = p => {
    sp = clamp(p, 0, 100);
    scan.style.setProperty('--p', sp + '%');
    tag.textContent = (sp / 100 * 8.6).toFixed(1).replace('.', ',') + ' м';
    tag.style.left = sp > 82 ? 'auto' : '12px';
    tag.style.right = sp > 82 ? '12px' : 'auto';
  };
  if (scan) {
    setScan(0);
    const dur = 2600, t0 = performance.now() + 900;
    const sweep = now => {
      if (!sweeping) return;
      const k = clamp((now - t0) / dur, 0, 1);
      setScan((1 - Math.pow(1 - k, 3)) * 100);
      if (k < 1) requestAnimationFrame(sweep); else sweeping = false;
    };
    if (reduce) { sweeping = false; setScan(100); } else requestAnimationFrame(sweep);
    const move = e => {
      const r = scan.getBoundingClientRect();
      sweeping = false;
      setScan((e.clientX - r.left) / r.width * 100);
    };
    scan.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) move(e); });
    scan.addEventListener('pointerdown', move);
  }

  /* ============ marquee (speed follows scroll velocity) ============ */
  const track = $('#runTrack');
  let mx = 0, vel = 0, prevY = scrollY, halfW = 0;
  const measure = () => { halfW = track ? track.children[0].getBoundingClientRect().width : 0; };
  measure(); addEventListener('resize', measure);
  const loop = () => {
    const y = scrollY; vel += ((y - prevY) - vel) * .12; prevY = y;
    if (track && !reduce) {
      mx -= .6 + Math.min(Math.abs(vel) * .35, 14);
      if (halfW && -mx >= halfW) mx += halfW;
      track.style.transform = `translate3d(${mx}px,0,0)`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ============ scene: floor builds by m² ============ */
  const COLS = 8, ROWS = 6;
  const floor = $('#floor'), scene = $('.scene');
  const tiles = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const el = document.createElement('i');
    el.className = 'tile'; el.dataset.l = 0;
    if (c >= 6 && r <= 1) el.dataset.w = '1';
    el.wave = (c + r) / (COLS + ROWS - 2);
    floor.appendChild(el); tiles.push(el);
  }
  const steps = $$('.step'), mDone = $('#mDone');
  let target = 0, cur = 0, lastS = -1;
  const calcTarget = () => {
    const r = scene.getBoundingClientRect();
    target = clamp(-r.top / (r.height - innerHeight), 0, 1);
  };
  const paintScene = () => {
    const s = cur * 4.999;
    const idx = Math.floor(s);
    let done = 0;
    tiles.forEach(t => {
      const lv = clamp(Math.floor(s - t.wave * .85), 0, 4);
      if (t.dataset.l != lv) t.dataset.l = lv;
      if (lv >= 3) done++;
    });
    if (idx !== lastS) {
      lastS = idx;
      floor.dataset.s = idx;
      steps.forEach((st, i) => st.classList.toggle('is-on', i === idx));
    }
    mDone.textContent = done;
  };
  const sceneTick = () => {
    calcTarget();
    cur += (target - cur) * (reduce ? 1 : .14);
    if (Math.abs(target - cur) < .0004) cur = target;
    paintScene();
    requestAnimationFrame(sceneTick);
  };
  requestAnimationFrame(sceneTick);

  /* ============ price: photo follows rows ============ */
  const pImgs = $$('.price__photo img'), rows = $$('.row');
  const showImg = i => pImgs.forEach(im => im.classList.toggle('on', im.dataset.i === String(i)));
  rows.forEach(r => {
    r.addEventListener('mouseenter', () => showImg(r.dataset.i));
    r.addEventListener('focus', () => showImg(r.dataset.i));
  });

  /* ============ calculator ============ */
  const area = $('#area'), areaOut = $('#areaOut'), totalEl = $('#total'), note = $('#totalNote'), tilesBox = $('#tiles'), tilesN = $('#tilesN');
  const FILL = { 6000: '#9C9E99', 8000: '#D8B98E', 10000: '#D8B98E', 12000: '#D8B98E', 15000: '#C79F68', 18000: '#A9BDB8' };
  const cells = [];
  for (let i = 0; i < 260; i++) { const el = document.createElement('i'); tilesBox.appendChild(el); cells.push(el); }
  let summary = '', shown = 0, anim, prevN = 0;
  const calc = () => {
    const k = $('input[name="kind"]:checked');
    const rate = +k.value, min = +k.dataset.min, max = +k.dataset.max;
    if (+area.min !== min || +area.max !== max) {
      area.min = min; area.max = max;
      area.value = clamp(+area.value, min, max);
      if (rate === 18000) area.value = 6;
      else if (+area.value < min) area.value = min;
    }
    const a = +area.value;
    areaOut.textContent = a;
    const total = a * rate;
    const fill = FILL[rate];
    tilesBox.style.setProperty('--fill', fill);
    cells.forEach((c, i) => {
      const on = i < a;
      if (on && !c.classList.contains('on')) c.style.setProperty('--d', Math.min(Math.max(0, i - prevN) * 5, 500) + 'ms');
      else c.style.setProperty('--d', '0ms');
      c.classList.toggle('on', on);
    });
    prevN = a; tilesN.textContent = a;
    note.textContent = rate === 18000
      ? 'Ориентир стоимости работ по площади пола. Сантехника и плитка не входят. Точную смету инженер сделает на бесплатном замере.'
      : 'Ориентир стоимости работ, материалы не входят. Точную смету с учётом состояния стен инженер сделает на бесплатном замере.';
    cancelAnimationFrame(anim);
    const from = shown, t0 = performance.now();
    const step = t => {
      const p = reduce ? 1 : clamp((t - t0) / 450, 0, 1);
      shown = from + (total - from) * (1 - Math.pow(1 - p, 3));
      totalEl.textContent = 'от ' + fmt(shown) + ' ₽';
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    summary = `Калькулятор: ${k.dataset.k}, ${a} м², ориентир от ${fmt(total)} ₽ (${fmt(rate)} ₽/м²)`;
  };
  $$('input[name="kind"]').forEach(i => i.addEventListener('change', calc));
  area.addEventListener('input', calc);
  calc();
  $('#calcGo')?.addEventListener('click', () => {
    const f = $('#fArea'); if (f && !f.value) f.value = `${$('input[name="kind"]:checked').dataset.k}, ${area.value} м²`;
    $('#calcField').value = summary;
  });

  /* ============ works rail ============ */
  const rail = $('#rail');
  const by = dir => rail.scrollBy({ left: dir * Math.min(rail.clientWidth * .7, 720), behavior: reduce ? 'auto' : 'smooth' });
  $('#wPrev')?.addEventListener('click', () => by(-1));
  $('#wNext')?.addEventListener('click', () => by(1));
  let dragging = false, dx = 0, sl = 0, moved = false;
  rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; dragging = true; moved = false; dx = e.clientX; sl = rail.scrollLeft; });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    const d = e.clientX - dx;
    if (Math.abs(d) > 4) { moved = true; rail.classList.add('drag'); }
    rail.scrollLeft = sl - d;
  });
  addEventListener('pointerup', () => { if (dragging) { dragging = false; rail.classList.remove('drag'); } });

  /* ============ reveal on scroll ============ */
  const rv = $$('[data-reveal], .work');
  rv.forEach((el, i) => {
    const sibs = [...el.parentElement.children].filter(c => rv.includes(c));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 80 + 'ms');
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));
  setTimeout(() => rv.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }), 1500);

  /* magnetic buttons */
  if (matchMedia('(pointer:fine)').matches && !reduce) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .14}px,${(e.clientY - r.top - r.height / 2) * .28}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* fab */
  const fab = $('#fab'), contact = $('#contact');
  const fabTick = () => {
    const r = contact.getBoundingClientRect(), sr = scene.getBoundingClientRect();
    fab.classList.toggle('is-hide', scrollY < 500 || (r.top < innerHeight && r.bottom > 0) || (sr.top < 80 && sr.bottom > innerHeight * .5));
  };
  addEventListener('scroll', fabTick, { passive: true }); fabTick();

  /* ============ form -> Worker -> Telegram ============ */
  const form = $('#leadForm'), fnote = $('#formNote');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span'), orig = label.textContent;
    const fd = new FormData(form), payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { fnote.textContent = 'Заполните имя и телефон или ник в мессенджере'; return; }
    if (!form.consent.checked) { fnote.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    if (!payload.calc) payload.calc = summary;
    btn.disabled = true; label.textContent = 'Отправляем…'; fnote.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена';
      try { if (window.ym) window.ym(114698940, 'reachGoal', 'lead'); } catch (_) {}
      fnote.textContent = 'Спасибо! Мы свяжемся с вами и договоримся о времени замера.';
      form.reset();
    } catch (err) {
      console.error(err);
      label.textContent = 'Ошибка, попробуйте ещё раз';
      fnote.textContent = 'Не удалось отправить. Позвоните нам: +7 (993) 086-68-34';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });
})();
