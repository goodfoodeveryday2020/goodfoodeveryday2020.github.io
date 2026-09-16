/* 日日好食｜官方連結頁
   資料來源：Google 試算表（設定 / 連結 兩個分頁）→ CSV → 前端渲染；
   讀不到時退回 index.html 內建的快照資料（#gf-data）。 */
(() => {
  const cfg = window.GF_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ── 讀取快照 ───────────────────────────────────────── */
  let snapshot = { settings: {}, links: [] };
  try { snapshot = JSON.parse($('#gf-data').textContent); } catch (e) { console.warn('[gf] 內建快照解析失敗', e); }

  /* ── Google 試算表 → CSV ────────────────────────────── */
  const csvUrl = sheet =>
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(cfg.sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&_=${Date.now()}`;

  // RFC 4180：處理引號、引號內換行與逗號
  function parseCsv(text) {
    const rows = []; let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    const nonEmpty = rows.filter(r => r.some(v => v.trim() !== ''));
    if (!nonEmpty.length) return [];
    const headers = nonEmpty[0].map(h => h.trim());
    return nonEmpty.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
  }

  async function fetchSheet(name) {
    const res = await fetch(csvUrl(name), { cache: 'no-store' });
    if (!res.ok) throw new Error(`「${name}」HTTP ${res.status}`);
    const text = await res.text();
    if (/^\s*</.test(text)) throw new Error(`「${name}」回傳的不是 CSV（試算表是否已設為「知道連結的任何人可檢視」？）`);
    return parseCsv(text);
  }

  async function loadFromSheet() {
    if (!cfg.sheetId) return null;
    const [settingsRows, linkRows] = await Promise.all([
      fetchSheet(cfg.settingsSheet || '設定'),
      fetchSheet(cfg.linksSheet || '連結'),
    ]);
    const settings = {};
    for (const r of settingsRows) {
      const k = (r['項目'] ?? r['key'] ?? Object.values(r)[0] ?? '').trim();
      const v = (r['內容'] ?? r['value'] ?? Object.values(r)[1] ?? '').trim();
      if (k) settings[k] = v;
    }
    return { settings, links: linkRows };
  }

  /* ── 資料正規化 ─────────────────────────────────────── */
  const pick = (o, ...keys) => { for (const k of keys) if (o[k] != null && String(o[k]).trim() !== '') return String(o[k]).trim(); return ''; };
  const isNo = v => /^(否|no|n|0|false|隱藏)$/i.test(String(v).trim());

  function videoId(url) {
    try {
      const u = new URL(url);
      if (/youtu\.be$/.test(u.hostname)) return u.pathname.slice(1).split('/')[0];
      if (/youtube\.com$/.test(u.hostname) || /youtube-nocookie\.com$/.test(u.hostname)) {
        if (u.searchParams.get('v')) return u.searchParams.get('v');
        const m = u.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{6,})/);
        if (m) return m[2];
      }
    } catch (e) { /* not a URL */ }
    return '';
  }
  const domainOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

  function normalizeLinks(rows) {
    const items = rows.map((r, i) => {
      const type = pick(r, '類型', 'type').toLowerCase();
      const url = pick(r, '連結', '網址', 'url', 'link');
      const item = {
        order: Number(pick(r, '順序', 'order')) || (i + 1),
        title: pick(r, '標題', 'title'),
        url, image: pick(r, '圖片', 'image'),
        kind: /影片|video|youtube/.test(type) ? 'video' : /標題|header|section/.test(type) ? 'header' : 'link',
        embed: /嵌入|embed/.test(pick(r, '顯示方式', 'display', 'layout').toLowerCase()),
        show: !isNo(pick(r, '顯示', 'show', 'visible') || '是'),
      };
      if (item.kind === 'video') {
        item.videoId = videoId(url);
        if (!item.image && item.videoId) item.image = `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
      }
      return item;
    }).filter(it => it.show && (it.kind === 'header' ? it.title : it.title || it.url));
    return items.sort((a, b) => a.order - b.order);
  }

  /* ── 渲染 ───────────────────────────────────────────── */
  const ICONS = {
    facebook: '<path d="M14 8h2V5h-2.5C11.6 5 10 6.6 10 8.5V10H8v3h2v6h3v-6h2.3l.7-3h-3V8.8c0-.4.4-.8 1-.8Z"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/>',
    youtube: '<rect x="2.5" y="6" width="19" height="12" rx="3.5"/><path d="M10 9.5v5l4.5-2.5Z" fill="currentColor" stroke="none"/>',
    tiktok: '<path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46"/><path d="M14 4c.4 2.6 2 4.2 4.5 4.5"/>',
    line: '<path d="M12 4.5c-4.7 0-8.5 3.1-8.5 6.9 0 3.4 3 6.2 7 6.8.3 0 .6.2.7.5l.1 1.6c0 .3.3.5.6.3 2.5-1.4 6-4 7.4-6.3.7-1 1.2-1.9 1.2-2.9 0-3.8-3.8-6.9-8.5-6.9Z"/>',
    email: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    website: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
  };
  const SOCIAL_ORDER = [
    ['Facebook', 'facebook', 'Facebook'], ['Instagram', 'instagram', 'Instagram'], ['YouTube', 'youtube', 'YouTube'],
    ['TikTok', 'tiktok', 'TikTok'], ['LINE', 'line', 'LINE'], ['Email', 'email', '電子郵件'], ['官方網站', 'website', '官方網站'],
  ];
  const ARROW = '<svg class="card__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14l11-7z"/></svg>';

  function renderHeader(s) {
    const get = (...k) => pick(s, ...k);
    const name = get('名稱', 'name') || '日日好食';
    const custom = name !== '日日好食';           // CI 字標只對應「日日好食」，改名就退回文字
    $('.brand').classList.toggle('brand--custom', custom);
    $('.brand__name-text').textContent = name;
    $('.brand__en').textContent = get('英文名稱', 'english', 'en');
    $('.brand__tagline').textContent = get('標語', 'tagline', 'description');
    const avatar = get('頭像', 'avatar');
    const markBox = $('.brand__mark');
    if (avatar && !markBox.dataset.custom) {
      markBox.innerHTML = `<img src="${esc(avatar)}" alt="" width="104" height="104">`;
      markBox.dataset.custom = '1';
    }
    const socials = SOCIAL_ORDER.map(([key, icon, label]) => {
      let v = get(key, key.toLowerCase());
      if (!v) return '';
      if (icon === 'email' && !/^mailto:/i.test(v)) v = 'mailto:' + v;
      if (icon !== 'email' && !/^https?:\/\//i.test(v)) v = 'https://' + v;
      return `<li><a class="social__btn" href="${esc(v)}" target="_blank" rel="noopener" aria-label="${esc(label)}" title="${esc(label)}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[icon]}</svg></a></li>`;
    }).join('');
    $('.social').innerHTML = socials;
    const title = get('分頁標題', 'pageTitle');
    if (title) document.title = title;
    const desc = get('說明', 'meta');
    const metaDesc = $('meta[name="description"]');
    if (desc && metaDesc) metaDesc.content = desc;
    const site = get('官方網站', 'website');
    const footLink = $('.foot__site');
    if (footLink) { if (site) { footLink.href = /^https?:/.test(site) ? site : 'https://' + site; footLink.hidden = false; } else footLink.hidden = true; }
    const footText = get('頁尾文字', 'footer');
    if (footText) $('.foot__text').textContent = footText.replace(/©\s*(?!\d)/, `© ${new Date().getFullYear()} `);
  }

  function thumb(item) {
    if (item.image) return `<span class="card__thumb"><img src="${esc(item.image)}" alt="" loading="lazy" decoding="async" onerror="this.closest('.card__thumb').classList.add('card__thumb--brand');this.remove()"></span>`;
    // 沒有指定圖片時用品牌圓標，比網域首字母更像刻意設計
    return `<span class="card__thumb card__thumb--brand" aria-hidden="true"></span>`;
  }

  function renderLinks(items) {
    const html = items.map(item => {
      if (item.kind === 'header') return `<li class="section-head"><div class="rule">${esc(item.title)}</div></li>`;
      if (item.kind === 'video' && item.embed && item.videoId) {
        return `<li class="video" data-video="${esc(item.videoId)}">
  <div class="video__frame">
    <img src="${esc(item.image)}" alt="" loading="lazy" decoding="async">
    <button class="video__play" type="button" aria-label="播放影片：${esc(item.title)}"><span>${PLAY}</span></button>
  </div>
  <a class="video__caption" href="${esc(item.url)}" target="_blank" rel="noopener">
    <p class="card__title">${esc(item.title || 'YouTube 影片')}</p>${ARROW}
  </a>
</li>`;
      }
      const meta = item.kind === 'video' ? 'YouTube' : domainOf(item.url);
      return `<li><a class="card" href="${esc(item.url)}" target="_blank" rel="noopener">
  ${thumb(item)}
  <span class="card__body"><span class="card__title">${esc(item.title || item.url)}</span>${meta ? `<span class="card__meta">${esc(meta)}</span>` : ''}</span>
  ${ARROW}
</a></li>`;
    }).join('');
    $('.links').innerHTML = html;
  }

  // 影片：點播放鍵才載入 YouTube 播放器（youtube-nocookie）
  document.addEventListener('click', e => {
    const btn = e.target.closest('.video__play');
    if (!btn) return;
    const box = btn.closest('.video');
    const frame = box.querySelector('.video__frame');
    const id = box.dataset.video;
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1" title="YouTube 影片" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  });

  // 資料來源只記錄在主控台，不顯示在頁面上
  function setSource(text) { console.info('[gf] ' + text); }

  function renderAll(data, sourceLabel) {
    renderHeader(data.settings || {});
    renderLinks(normalizeLinks(data.links || []));
    setSource(sourceLabel);
  }

  /* ── 啟動 ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    renderAll(snapshot, cfg.sheetId ? '先以內建快照顯示，試算表讀取中' : '資料來源：內建快照');
    const sheetP = loadFromSheet()
      .then(d => { if (d) renderAll(d, '資料來源：Google 試算表'); })
      .catch(err => { console.warn('[gf] 讀取 Google 試算表失敗，改用內建快照：', err.message); setSource('資料來源：內建快照（試算表讀取失敗）'); });
    const timeout = new Promise(r => setTimeout(r, Number(cfg.maxWait) || 8000));
    const loader = window.gfLoader;
    await Promise.all([loader ? loader.done : null, Promise.race([sheetP, timeout])]);
    if (loader) await loader.finish($('.brand__mark'));
  });
})();
