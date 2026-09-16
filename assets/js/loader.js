/* 載入動畫：「食」書寫 → 上色成 logo → 飛入頁首頭像位置。
   移植自「Logo 書寫動畫｜Logo Draw-On Animation」（時間軸與 easing 相同），
   對外提供 window.gfLoader = { done: Promise, finish(targetEl): Promise, seek(秒), END }。 */
(() => {
  const cfg = window.GF_CONFIG || {};
  const overlay = document.getElementById('gf-loader');
  if (!overlay) return;
  const svg = overlay.querySelector('.loader__mark');
  const $$ = s => [...svg.querySelectorAll(s)];
  const html = document.documentElement;
  html.classList.add('is-loading');

  /* ── easing ─────────────────────────────────────────── */
  const inOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // power2.inOut
  const out = t => 1 - Math.pow(1 - t, 3);                                   // power3.out
  const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;

  const els = {
    ren: $$('.stroke-ren'), liang: $$('.stroke-liang'), bars: $$('.stroke-bar'),
    ring: $$('.ring-line'), fleck: $$('.ring-fleck'),
    inkG: $$('.glyph .ink'), inkR: $$('.ring .ink'),
    disc: $$('.disc'), arms: $$('.arm'), white: $$('.liang-fill'),
  };
  const setDash = (el, p) => { el.style.strokeDashoffset = 1 - p; el.style.visibility = p > 0 ? 'visible' : 'hidden'; };
  const setOpacity = (el, p) => { el.style.opacity = p; };

  /* 時間軸（秒）：圓框與文字同時進行，最後一起收筆再上色 */
  const tracks = [
    { els: els.ring,  t0: 0.10, dur: 2.95, ease: inOut, set: setDash },
    { els: els.ren,   t0: 0.20, dur: 1.00, ease: inOut, set: setDash },
    { els: els.liang, t0: 1.05, dur: 1.67, ease: inOut, set: setDash },
    { els: els.bars,  t0: 2.30, dur: 0.47, ease: inOut, set: setDash, stagger: 0.09 },
    { els: els.fleck, t0: 2.70, dur: 0.28, ease: out,   set: setDash, stagger: 0.035 },
    { els: els.disc,  t0: 3.15, dur: 0.50, ease: out, set: (el, p) => { el.style.opacity = p; el.style.transform = `scale(${(0.955 + 0.045 * p).toFixed(4)})`; } },
    { els: els.inkR,  t0: 3.18, dur: 0.40, ease: out, set: (el, p) => setOpacity(el, 1 - p) },
    { els: els.arms,  t0: 3.40, dur: 0.45, ease: out, set: setOpacity, stagger: 0.05 },
    { els: els.white, t0: 3.50, dur: 0.45, ease: out, set: setOpacity },
    { els: els.inkG,  t0: 3.50, dur: 0.50, ease: out, set: (el, p) => setOpacity(el, 1 - p) },
  ];
  const END = Math.max(...tracks.map(t => t.t0 + t.dur + (t.stagger || 0) * Math.max(0, t.els.length - 1)));
  const render = now => {
    for (const tr of tracks) {
      const st = tr.stagger || 0;
      tr.els.forEach((el, i) => tr.set(el, tr.ease(clamp((now - tr.t0 - i * st) / tr.dur))));
    }
  };

  /* ── 播放策略 ───────────────────────────────────────
     預設每次載入都完整播放（速度由 GF_CONFIG.loaderSpeed 調整）；
     GF_CONFIG.loaderEvery = false 時同一分頁只播第一次。 */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 減少動態效果：仍然畫（這是靜態筆畫顯現，不是位移），但加速並省略飛入
  const speed = (Number(cfg.loaderSpeed) > 0 ? Number(cfg.loaderSpeed) : 1) * (reduced ? 1.6 : 1);
  let played = false;
  if (cfg.loaderEvery === false) {
    try { played = sessionStorage.getItem('gf-loader') === '1'; } catch (e) { /* 無法使用 sessionStorage 時每次都播 */ }
  }
  const quick = played;

  let raf = null;
  const done = new Promise(resolve => {
    if (quick) { render(END); setTimeout(resolve, 200); return; }
    const t0 = performance.now();
    const step = ts => {
      const now = ((ts - t0) / 1000) * speed;
      render(Math.min(now, END));
      if (now < END) raf = requestAnimationFrame(step);
      else resolve();
    };
    render(0);
    raf = requestAnimationFrame(step);
  });
  done.then(() => { try { sessionStorage.setItem('gf-loader', '1'); } catch (e) { /* ignore */ } });

  /* ── 收尾：FLIP 飛入頁首的頭像位置，覆蓋層同時淡出 ── */
  let finished = null;
  const finish = target => finished || (finished = new Promise(resolve => {
    const end = () => { if (overlay.isConnected) overlay.remove(); html.classList.remove('is-loading'); resolve(); };
    const a = svg.getBoundingClientRect();
    const b = target && target.getBoundingClientRect();
    if (reduced || !b || !b.width || !a.width) {
      overlay.classList.add('is-leaving');
      setTimeout(end, reduced ? 0 : 500);
      return;
    }
    const s = b.width / a.width;
    svg.style.transformOrigin = '0 0';
    svg.style.transition = 'transform .8s cubic-bezier(.25,1,.5,1)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      svg.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})`;
      overlay.classList.add('is-leaving');
    }));
    svg.addEventListener('transitionend', end, { once: true });
    setTimeout(end, 1300); // 保險：任何情況都不讓覆蓋層卡住
  }));

  window.gfLoader = {
    done, finish, END,
    seek: t => { cancelAnimationFrame(raf); render(clamp(t / END) * END); },
  };
})();
