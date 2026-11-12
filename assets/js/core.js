/* بنك المبادرات — أدوات مشتركة بين الموقع ولوحة التحكم */
(function () {
  'use strict';

  const DRAFT_KEY = 'ib_data_draft';
  const PREVIEW_KEY = 'ib_preview';

  // مسار الجذر محسوباً من موقع هذا الملف (يعمل على GitHub Pages أو من الملفات مباشرة)
  const me = document.currentScript && document.currentScript.src;
  const BASE = me ? me.replace(/assets\/js\/core\.js.*$/, '') : '';

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function safeDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  function published() { return window.IB_DATA ? JSON.parse(JSON.stringify(window.IB_DATA)) : null; }
  function draft() { const r = safeGet(DRAFT_KEY); if (!r) return null; try { return JSON.parse(r); } catch (e) { return null; } }
  function previewOn() { return safeGet(PREVIEW_KEY) === '1' && !!draft(); }

  /** البيانات التي يعرضها الموقع: المنشورة، أو المسودة إن فُعّلت المعاينة من اللوحة */
  function data() { return previewOn() ? draft() : published(); }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const src = (p) => !p ? '' : (/^(https?:|data:|blob:|\/)/.test(p) ? p : BASE + p);
  const url = (p) => BASE + p;
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const num = (n) => Number(n || 0).toLocaleString('en-US');

  const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'short', year: 'numeric' });
  function fmtDate(d) { if (!d) return ''; const x = new Date(d + 'T12:00:00'); return isNaN(x) ? d : dateFmt.format(x); }
  function fmtMonth(d) { const x = new Date(d + 'T12:00:00'); return isNaN(x) ? d : monthFmt.format(x); }

  // أيقونات خطية بسيطة (SVG)
  const P = {
    spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
    hands: '<path d="M2 14l4-4 3 2 3-3 3 3 3-2 4 4"/><path d="M6 10v6l4 4h4l4-4v-6"/>',
    rocket: '<path d="M14 4c3 0 6 3 6 6l-6 6-6-6c0-3 3-6 6-6z"/><circle cx="14" cy="10" r="1.8"/><path d="M8 16l-3 3M10 18l-2 3M6 14l-3 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    box: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
    megaphone: '<path d="M3 10v4l11 5V5L3 10z"/><path d="M14 8a4 4 0 0 1 0 8M6 14l1 6h3l-1-5"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>',
    team: '<circle cx="12" cy="7" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/><circle cx="4.5" cy="10" r="2"/><circle cx="19.5" cy="10" r="2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    arrowL: '<path d="M15 6l-6 6 6 6"/>',
    arrowR: '<path d="M9 6l6 6-6 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    filter: '<path d="M4 5h16l-6 8v5l-4 2v-7L4 5z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
    quote: '<path d="M10 7H6a2 2 0 0 0-2 2v4h5v5H4M20 7h-4a2 2 0 0 0-2 2v4h5v5h-5" />',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    send: '<path d="M21 3L3 10.5l7 3 3 7L21 3z"/><path d="M10 13.5L21 3"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    x_: '<path d="M4 4l16 16M20 4L4 20"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
    youtube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9v6l5-3z"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3-3.46M14 3c.5 2.5 2.3 4 5 4"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z"/><path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2L9 9z"/>',
  };
  function icon(name, cls) {
    const p = P[name] || P.spark;
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }
  const socialIcon = { Facebook: 'facebook', Instagram: 'instagram', X: 'x_', LinkedIn: 'linkedin', YouTube: 'youtube', TikTok: 'tiktok' };

  const NAV = [
    ['index.html', 'الرئيسية', 'home'],
    ['initiatives.html', 'مكتبة المبادرات', 'initiatives'],
    ['ideas.html', 'بنك الأفكار', 'ideas'],
    ['news.html', 'الإعلانات', 'news'],
    ['about.html', 'من نحن', 'about'],
    ['partners.html', 'الشركاء', 'partners'],
    ['support.html', 'ادعم البنك', 'support'],
    ['contact.html', 'تواصل معنا', 'contact'],
  ];

  function header(active) {
    const d = data();
    return `
<a class="skip" href="#main">تخطَّ إلى المحتوى</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${url('index.html')}" aria-label="${esc(d.site.brand.name)} – الرئيسية">
      <img src="${src(d.site.brand.logoLight)}" alt="${esc(d.site.brand.name)}" width="160" height="45">
    </a>
    <nav class="nav" id="nav" aria-label="القائمة الرئيسية">
      ${NAV.map(([h, t, k]) => `<a href="${url(h)}"${k === active ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
    </nav>
    <div class="header-cta">
      <a class="btn btn-primary btn-sm" href="${url('submit.html')}">${icon('bulb')}<span class="btn-text">قدّم فكرتك</span></a>
    </div>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="القائمة">${icon('menu')}</button>
  </div>
</header>`;
  }

  function footer() {
    const d = data(); const s = d.site;
    return `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="about">
        <img src="${src(s.brand.logoLight)}" alt="${esc(s.brand.name)}" width="160" height="45">
        <p>${esc(s.about.text[0])}</p>
        <div class="socials">${s.contact.social.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener" aria-label="${esc(x.name)}">${icon(socialIcon[x.name] || 'link')}</a>`).join('')}</div>
      </div>
      <div>
        <h4>روابط سريعة</h4>
        <ul>${NAV.slice(1).map(([h, t]) => `<li><a href="${url(h)}">${t}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>شارك معنا</h4>
        <ul>
          <li><a href="${url('submit.html')}">قدّم فكرتك</a></li>
          <li><a href="${url('submit.html?form=pwd')}">مبادرة لذوي الإعاقة</a></li>
          <li><a href="${url('support.html')}">كن شريكًا</a></li>
          <li><a href="${url('privacy.html')}">سياسة الخصوصية</a></li>
          <li><a href="${url('terms.html')}">الشروط والأحكام</a></li>
          <li><a href="${url('admin/index.html')}">لوحة التحكم</a></li>
        </ul>
      </div>
      <div>
        <h4>تواصل مباشر</h4>
        <ul>
          <li><a href="tel:${esc(s.contact.phone)}" dir="ltr">${esc(s.contact.phone)}</a></li>
          <li><a href="mailto:${esc(s.contact.ibEmail)}">${esc(s.contact.ibEmail)}</a></li>
          <li><a href="mailto:${esc(s.contact.email)}">${esc(s.contact.email)}</a></li>
          <li>${esc(s.contact.offices[0].city)}: ${esc(s.contact.offices[0].address)}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${esc(s.brand.name)} — مبادرة من <a href="${esc(s.brand.orgUrl)}" target="_blank" rel="noopener">${esc(s.brand.org)}</a></span>
      <span>شباب يصنعون الواقع… ويعيدون رسم المستقبل</span>
    </div>
  </div>
</footer>`;
  }

  function mountChrome(active) {
    document.body.insertAdjacentHTML('afterbegin', header(active));
    document.body.insertAdjacentHTML('beforeend', footer());
    const btn = document.querySelector('.menu-btn'); const nav = document.getElementById('nav');
    btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    if (previewOn()) {
      document.body.insertAdjacentHTML('beforeend', `<div class="preview-bar" role="status">وضع المعاينة: تعرض مسودة لوحة التحكم <button type="button">إيقاف</button></div>`);
      document.querySelector('.preview-bar button').onclick = () => { safeDel(PREVIEW_KEY); location.reload(); };
    }
  }

  function reveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -40px' });
    els.forEach((e) => io.observe(e));
  }

  function countUp(root) {
    (root || document).querySelectorAll('[data-count]').forEach((el) => {
      const to = +el.dataset.count; const plus = el.dataset.plus ? '+' : '';
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = num(to) + plus; return; }
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; io.disconnect();
        const t0 = performance.now(); const dur = 1400;
        const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = num(Math.round(to * (1 - Math.pow(1 - k, 3)))) + plus; if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
      io.observe(el);
    });
  }

  /** عناصر الواجهة العامة المعروضة فقط */
  const live = (arr) => (arr || []).filter((x) => (x.status || 'published') === 'published');

  window.IB = {
    BASE, DRAFT_KEY, PREVIEW_KEY, data, published, draft, previewOn, safeGet, safeSet, safeDel,
    esc, src, url, qs, num, fmtDate, fmtMonth, icon, mountChrome, reveal, countUp, live,
  };
})();
