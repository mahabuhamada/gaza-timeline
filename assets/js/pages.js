/* بنك المبادرات — عرض صفحات الموقع من البيانات */
(function () {
  'use strict';
  const { esc, src, url, qs, num, fmtDate, icon, live } = IB;
  const D = IB.data();
  const S = D.site;
  const INITS = live(D.initiatives).sort((a, b) => b.date.localeCompare(a.date));
  const POSTS = live(D.posts).sort((a, b) => b.date.localeCompare(a.date));
  const main = document.getElementById('main');
  const page = document.body.dataset.page;

  const pretty = IB.built && !IB.previewOn();
  const initUrl = (i) => url(pretty ? `initiative-${i.id}.html` : 'initiative.html?id=' + i.id);
  const postUrl = (p) => url(pretty ? `post-${p.id}.html` : 'post.html?id=' + p.id);
  const count = (arr, f) => arr.reduce((m, x) => { [].concat(f(x) || []).forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; }); return m; }, {});
  const sortedKeys = (m) => Object.keys(m).sort((a, b) => m[b] - m[a]);

  const SEO = Object.assign({ baseUrl: 'https://initiativesbank.ps/' }, S.seo || {});
  const abs = (path) => SEO.baseUrl.replace(/\/?$/, '/') + String(path || '').replace(/^\.?\//, '');
  function meta(attr, key, val) {
    let m = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
    m.setAttribute('content', val);
  }
  function setTitle(t, desc, image) {
    const title = t ? `${t} | ${S.brand.name}` : `${S.brand.name} | ${S.brand.tagline}`;
    const d = (desc || S.brand.intro).replace(/\s+/g, ' ').slice(0, 300);
    document.title = title;
    meta('name', 'description', d);
    meta('property', 'og:title', title); meta('property', 'og:description', d); meta('property', 'og:type', t ? 'article' : 'website');
    meta('property', 'og:site_name', S.brand.name); meta('property', 'og:locale', 'ar_PS');
    meta('property', 'og:image', abs(image || S.heroImages[0]));
    meta('name', 'twitter:card', 'summary_large_image'); meta('name', 'twitter:title', title); meta('name', 'twitter:description', d);
    const file = (location.pathname.split('/').pop() || 'index.html');
    const canon = abs(file === 'index.html' ? '' : file) + (IB.built ? '' : location.search);
    meta('property', 'og:url', canon);
    let l = document.head.querySelector('link[rel="canonical"]');
    if (!l) { l = document.createElement('link'); l.rel = 'canonical'; document.head.appendChild(l); }
    l.href = canon;
  }
  function ld(obj) {
    document.querySelectorAll('script[data-ld]').forEach((x) => x.remove());
    const org = { '@type': 'Organization', '@id': abs('#org'), name: S.brand.name, alternateName: S.brand.nameEn, url: abs(''), logo: abs(S.brand.logo),
      parentOrganization: { '@type': 'Organization', name: S.brand.org, url: S.brand.orgUrl }, email: S.contact.ibEmail, sameAs: S.contact.social.map((x) => x.url) };
    const graph = [org, { '@type': 'WebSite', '@id': abs('#site'), url: abs(''), name: S.brand.name, inLanguage: 'ar', publisher: { '@id': abs('#org') } }].concat(obj ? [].concat(obj) : []);
    const sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.dataset.ld = '1';
    sc.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(sc);
  }
  const crumbsLD = (items) => ({ '@type': 'BreadcrumbList', itemListElement: [['الرئيسية', abs('')]].concat(items).map(([n, u], k) => ({ '@type': 'ListItem', position: k + 1, name: n, item: u })) });
  const HOME_DEFAULT = {
    order: ['now', 'themes', 'impact', 'stories', 'values', 'join'],
    now: { title: 'الآن في البنك', sub: 'أحدث ما نُشر من الميدان: مبادرات منفّذة، ودعوات مفتوحة للتقديم.' },
    themes: { title: 'لكل تحدٍّ مبادرة', sub: 'مجالات يعمل فيها المبادرون، من الدعم النفسي إلى الصحة والتوعية والفنون.' },
    impact: { title: 'أثر المبادرات بالأرقام', sub: 'أربعة مؤشرات بعدد بتلات شعارنا، تُحسب تلقائيًا من المبادرات الموثّقة.' },
    stories: { title: 'قصص تصنع الفرق', sub: 'شباب وشابات حوّلوا التحدي إلى مساحة أمل في الخيام ومراكز الإيواء.' },
    values: { title: 'نعمل مع الجميع من أجل', sub: '' },
    join: { title: 'شارك في صناعة التغيير' },
  };
  function homeCfg() {
    const h = S.home || {}; const o = JSON.parse(JSON.stringify(HOME_DEFAULT));
    Object.keys(o).forEach((k) => { if (k !== 'order' && h[k]) Object.assign(o[k], h[k]); });
    if (Array.isArray(h.order) && h.order.length) o.order = h.order.filter((k) => o[k]);
    return o;
  }

  function pageHero(title, lead, crumbs) {
    return `<section class="page-hero"><div class="wrap"><div class="box">
      <nav class="crumbs" aria-label="مسار التنقل"><a href="${url('index.html')}">الرئيسية</a>${(crumbs || []).map((c) => `<span aria-hidden="true">/</span>${c[1] ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span>${esc(c[0])}</span>`}`).join('')}</nav>
      <h1>${esc(title)}</h1>${lead ? `<p>${esc(lead)}</p>` : ''}</div></div></section>`;
  }

  function initCard(i) {
    return `<article class="card reveal">
      <div class="media"><img src="${src(i.cover)}" alt="${esc(i.title)}" loading="lazy">
        <div class="badges">${i.governorate ? `<span class="pill solid">${esc(i.governorate)}</span>` : ''}</div></div>
      <div class="body">
        <div class="chips-row">${(i.themes || []).slice(0, 2).map((t) => `<span class="pill">${esc(t)}</span>`).join(' ')}</div>
        <h3><a href="${initUrl(i)}">${esc(i.title)}</a></h3>
        <p class="desc">${esc(i.summary)}</p>
        <div class="meta">
          <span>${icon('pin')}${esc(i.location)}</span>
          <span>${icon('cal')}${fmtDate(i.date)}</span>
        </div>
      </div></article>`;
  }

  function postCard(p) {
    return `<article class="card news-card reveal">
      <div class="media"><img src="${src(p.cover)}" alt="${esc(p.title)}" loading="lazy">
        <div class="badges"><span class="pill ${p.kind === 'call' ? 'yellow' : 'blue'}">${p.kind === 'call' ? 'دعوة مفتوحة' : 'قصة مبادرة'}</span></div></div>
      <div class="body">
        <span class="date">${fmtDate(p.date)}</span>
        <h3><a href="${postUrl(p)}">${esc(p.title)}</a></h3>
        <p class="desc">${esc(p.excerpt)}</p>
        <span class="more">اقرأ المزيد ${icon('arrowL')}</span>
      </div></article>`;
  }

  const statsHTML = () => `<div class="stats">${S.stats.map((s) => `<div class="stat reveal">${icon(s.icon, 'ic')}<div class="num" data-count="${s.value}" data-plus="1">${num(s.value)}+</div><div class="lbl">${esc(s.label)}</div></div>`).join('')}</div>`;
  const valuesHTML = () => `<div class="values">${S.values.map((v) => `<div class="value reveal"><div class="ic">${icon(v.icon)}</div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join('')}</div>`;
  const partnersHTML = () => `<div class="partners">${S.partners.map((p) => `<a class="partner reveal" href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(p.name)}"><img src="${src(p.logo)}" alt="${esc(p.name)}" loading="lazy"></a>`).join('')}</div>`;
  const ctaHTML = () => `<div class="cta reveal"><div><h2>عندك فكرة تخدم مجتمعك؟</h2><p>${esc(S.submit.intro)}</p></div><a class="btn btn-light" href="${url('submit.html')}">${icon('bulb')} قدّم فكرتك الآن</a></div>`;

  /* ====================== الرئيسية ====================== */
  function home() {
    setTitle('', S.brand.intro);
    ld();
    const H = homeCfg();
    const feat = INITS.filter((i) => i.featured).concat(INITS.filter((i) => !i.featured)).slice(0, 6);
    const themes = count(INITS, (i) => i.themes);
    const topThemes = sortedKeys(themes).slice(0, 4);
    const latest = [...POSTS.map((p) => ({ t: 'post', d: p.date, x: p })), ...INITS.map((i) => ({ t: 'init', d: i.date, x: i }))].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 4);
    const statCls = ['c-orange', 'c-yellow', 'c-blue'];
    const N = INITS.length || 1;
    const pct = (f) => Math.round((INITS.filter(f).length / N) * 100);
    // أربعة مؤشرات = البتلات الأربع في الشعار
    const ind = [
      [pct((i) => /إعاقة/.test(i.audience + (i.audienceGroups || []).join() + (i.themes || []).join())), 'دامجة', 'من المبادرات تستهدف الأشخاص ذوي الإعاقة أو تدمجهم', 'مواءمة ووصول بكرامة، وإشراك الأشخاص ذوي الإعاقة في كل نشاط.', 'y'],
      [pct((i) => /مخيم|إيواء|نزوح|نازح/.test(i.location + i.audience + i.summary)), 'في الميدان', 'نُفذت في مخيمات النزوح ومراكز الإيواء', 'وصلت المبادرات إلى الناس حيث يعيشون اليوم: الخيام ومراكز الإيواء.', 'o'],
      [pct((i) => (i.themes || []).includes('دعم نفسي وترفيهي')), 'مساحات آمنة', 'تقدّم دعمًا نفسيًا ومساحات آمنة', 'مساحات للتفريغ واستعادة التوازن للأطفال واليافعين والشباب.', 'o'],
      [pct((i) => (i.gallery || []).length > 0 || (i.team || []).length > 0), 'موثّقة', 'موثّقة بالصور وبأسماء فرقها', 'كل مبادرة موثّقة بقصتها وصورها وأسماء المبادرين الذين نفّذوها.', 'y'],
    ];
    const PET = [[-36, 'p-tl'], [36, 'p-tr'], [-108, 'p-ml'], [108, 'p-mr']]; // مواقع البتلات كما في الشعار
    const govs = new Set(INITS.map((i) => i.governorate).filter(Boolean)).size;
    const photos = INITS.reduce((n, i) => n + (i.gallery || []).length, 0);
    const team = INITS.reduce((n, i) => n + (i.team || []).length, 0);
    const ticker = ['شباب يصنعون الواقع', 'من الفكرة إلى الأثر', 'مساحات آمنة للجميع', 'الوصول بكرامة', 'مبادرات يقودها الشباب', 'نبادر لنصنع غدًا أفضل'];
    const tIcons = ['spark', 'bulb', 'hands', 'people', 'rocket', 'globe'];
    const tickerRow = ticker.map((t, k) => `<span><i>${icon(tIcons[k % tIcons.length])}</i>${esc(t)}</span>`).join('');
    const kind = (t, x) => (t === 'post' ? (x.kind === 'call' ? ['دعوة مفتوحة', 'yellow'] : ['خبر', 'blue']) : ['مبادرة', '']);
    const featHTML = (i) => `<img src="${src(i.cover)}" alt="${esc(i.title)}" loading="lazy"><div class="in"><span class="pill yellow">${esc((i.themes || [])[0] || 'مبادرة')}</span><h3>${esc(i.title)}</h3><p>${esc(i.summary)}</p><span class="btn btn-white btn-sm">اقرأ القصة كاملة ${icon('arrowL')}</span></div>`;
    const head = (k, link) => `<div class="sec-head"><div><h2>${esc(H[k].title)}</h2>${H[k].sub ? `<p>${esc(H[k].sub)}</p>` : ''}</div>${link || ''}</div>`;

    // الشكل السائل للصورة (شكل الشعار بزوايا مستديرة)
    // شكل الشعار (خماسي) بزوايا مستديرة وحواف تتموّج كالماء
    const liquidPath = (jit) => {
      const base = [[0.5, 0.02], [0.98, 0.37], [0.8, 0.97], [0.2, 0.97], [0.02, 0.37]].map(([x, y], k) => [x + jit[k][0], y + jit[k][1]]);
      const n = base.length; const r = 0.2; const f = (v) => v.toFixed(3);
      const towards = (a, b) => [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r];
      const pin = (k) => towards(base[k], base[(k + n - 1) % n]);
      const pout = (k) => towards(base[k], base[(k + 1) % n]);
      let d = 'M' + f(pout(0)[0]) + ' ' + f(pout(0)[1]);
      for (let k = 1; k <= n; k++) {
        const i = k % n; const p1 = pout((k - 1) % n); const p2 = pin(i);
        const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, bulge = jit[i][2];
        d += ' Q' + f(mx + (mx - 0.5) * bulge) + ' ' + f(my + (my - 0.55) * bulge) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
        d += ' Q' + f(base[i][0]) + ' ' + f(base[i][1]) + ' ' + f(pout(i)[0]) + ' ' + f(pout(i)[1]);
      }
      return d + 'Z';
    };
    const LQ = [
      [[0, 0, 0.06], [0, 0.01, 0.1], [-0.01, 0, 0.04], [0.01, -0.01, 0.09], [0, 0, 0.05]],
      [[0.01, 0.015, 0.1], [-0.015, -0.01, 0.05], [0, -0.015, 0.1], [-0.01, 0.01, 0.04], [0.015, 0.01, 0.1]],
      [[-0.012, -0.005, 0.04], [0.01, 0.015, 0.1], [0.015, 0.01, 0.06], [0, -0.01, 0.1], [-0.01, -0.01, 0.06]],
      [[0.008, 0.01, 0.09], [-0.01, 0, 0.06], [-0.01, 0.012, 0.1], [0.012, 0.005, 0.05], [0, 0.015, 0.09]],
    ].map(liquidPath);

    const sections = {
      now: () => `
    <section class="section"><div class="wrap">
      ${head('now', `<a class="link-btn" href="${url('news.html')}">كل الإعلانات ${icon('arrowL')}</a>`)}
      <div class="timeline reveal">${latest.map(({ t, x }, k) => { const [lb, cl] = kind(t, x); return `<div class="tl-item" style="--i:${k}"><span class="when">${fmtDate(x.date)}</span>
        <article class="card soft-card"><div class="media"><img src="${src(x.cover)}" alt="${esc(x.title)}" loading="lazy"></div><span class="pill ${cl} tl-kind">${lb}</span><div class="body">
          <h3><a href="${t === 'post' ? postUrl(x) : initUrl(x)}">${esc(x.title)}</a></h3>
          <span class="more">اقرأ المزيد ${icon('arrowL')}</span></div></article></div>`; }).join('')}</div>
    </div></section>`,
      themes: () => `
    <section class="section soft"><div class="wrap">
      ${head('themes', `<a class="link-btn" href="${url('initiatives.html')}">كل المجالات ${icon('arrowL')}</a>`)}
      <div class="panels reveal">${topThemes.map((th, k) => { const i = INITS.find((x) => (x.themes || []).includes(th) && x.cover) || INITS[k];
        return `<a class="panel${k ? '' : ' on'}" href="${url('initiatives.html?theme=' + encodeURIComponent(th))}"><img src="${src(i.cover)}" alt="${esc(th)}" loading="lazy"><span class="ic">${icon(['hands', 'bulb', 'spark', 'people'][k % 4])}</span>
          <div class="txt"><small>${themes[th]} مبادرة</small><h3>${esc(th)}</h3><p>${esc(i.summary)}</p><span class="go">استكشف المبادرات ${icon('arrowL')}</span></div></a>`; }).join('')}</div>
    </div></section>`,
      impact: () => `
    <section class="section"><div class="bloom-band reveal"><div class="wrap bloom-wrap">
      <div class="bloom" aria-hidden="true">
        <svg class="bloom-frame" viewBox="0 0 100 100"><polygon points="50,6 93,37 77,90 23,90 7,37"/>${[[50, 6], [93, 37], [77, 90], [23, 90], [7, 37]].map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="3.2" style="--k:${k}"/>`).join('')}</svg>
        ${ind.map((it, k) => { const [a, cls] = PET[k]; return `<button type="button" class="petal ${cls} ${it[4]}" style="--a:${a}deg;--k:${k}" data-k="${k}" tabindex="-1"><span>${it[0]}%</span></button>`; }).join('')}
        <span class="b-head"><b id="bN">${ind[0][0]}%</b><small id="bL">${esc(ind[0][1])}</small></span>
        <span class="b-body"><b>${INITS.length}</b><small>مبادرة</small></span>
      </div>
      <div class="bloom-text">
        <div class="sec-head light"><div><h2>${esc(H.impact.title)}</h2>${H.impact.sub ? `<p>${esc(H.impact.sub)}</p>` : ''}</div></div>
        <div class="b-pick" role="tablist" aria-label="مؤشرات الأثر">${ind.map((it, k) => `<button type="button" role="tab" data-k="${k}" aria-selected="${!k}" class="${it[4]}"><b>${it[0]}%</b>${esc(it[1])}</button>`).join('')}</div>
        <div class="b-detail" id="bD"><h3>${esc(ind[0][2])}</h3><p>${esc(ind[0][3])}</p></div>
        <div class="b-nums">${[[govs, 'محافظات'], [photos, 'صورة من الميدان'], [team, 'مُبادِر ومُبادِرة']].map(([v, l]) => `<div><b data-count="${v}">${v}</b><span>${l}</span></div>`).join('')}</div>
      </div>
    </div></div></section>`,
      stories: () => `
    <section class="section soft"><div class="wrap">
      ${head('stories', `<a class="link-btn" href="${url('initiatives.html')}">كل القصص ${icon('arrowL')}</a>`)}
      <div class="stories-grid">
        <a class="feat reveal" id="feat" href="${initUrl(feat[0])}">${featHTML(feat[0])}</a>
        <div class="side-list reveal">${feat.slice(0, 5).map((i, k) => `<a href="${initUrl(i)}" data-k="${k}"${k ? '' : ' aria-current="true"'}><img src="${src(i.cover)}" alt="" loading="lazy"><div><small>${esc(i.governorate || '')} · ${esc((i.themes || [])[0] || '')}</small><b>${esc(i.title)}</b></div></a>`).join('')}</div>
      </div>
    </div></section>`,
      values: () => `
    <section class="section"><div class="wrap">
      <div class="sec-head center"><div><h2>${esc(H.values.title)}</h2>${H.values.sub ? `<p>${esc(H.values.sub)}</p>` : ''}</div></div>
      ${valuesHTML()}
    </div></section>`,
      join: () => `
    <section class="section soft"><div class="wrap">
      <div class="sec-head center"><div><h2>${esc(H.join.title)}</h2></div></div>
      <div class="join">
        <a href="${url('submit.html')}" class="reveal"><span class="ic">${icon('bulb')}</span><b>قدّم فكرتك</b><small>حوّل فكرتك إلى مبادرة على أرض الواقع</small></a>
        <a href="${url('submit.html?form=pwd')}" class="reveal"><span class="ic">${icon('people')}</span><b>مبادرة دامجة</b><small>نموذج خاص لمبادرات الأشخاص ذوي الإعاقة</small></a>
        <a href="${url('support.html')}" class="reveal"><span class="ic">${icon('hands')}</span><b>كن شريكًا</b><small>ادعم المبادرات بالموارد والخبرات</small></a>
        <a href="${url('ideas.html')}" class="reveal"><span class="ic">${icon('spark')}</span><b>بنك الأفكار</b><small>استلهم من أفكار الآخرين وابنِ عليها</small></a>
      </div>
      <div class="partners-row">${S.partners.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(p.name)}"><img src="${src(p.logo)}" alt="${esc(p.name)}" loading="lazy"></a>`).join('')}</div>
    </div></section>`,
    };

    main.innerHTML = `
    <section class="hero"><div class="wrap">
      <div>
        <span class="badge"><span class="dot"></span>مبادرة من ${esc(S.brand.org)}</span>
        <h1>نبادر اليوم..<br><span class="grad-text">لنصنع غدًا أفضل</span></h1>
        <p class="lead">${esc(S.brand.intro)} نحوّل أفكار الشباب في قطاع غزة إلى مبادرات على الأرض، ونوثّق أثرها.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${url('submit.html')}">${icon('bulb')} قدّم فكرتك</a>
          <a class="btn btn-white" href="${url('initiatives.html')}">استكشف ${INITS.length} مبادرة ${icon('arrowL')}</a>
        </div>
        <div class="hero-stats">${S.stats.slice(0, 3).map((s, k) => `<div><b class="${statCls[k]}" data-count="${s.value}" data-plus="1">${num(s.value)}+</b><span>${esc(s.label)}</span></div>`).join('')}</div>
      </div>
      <div class="hero-photo">
        <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
          <clipPath id="liq" clipPathUnits="objectBoundingBox"><path d="${LQ[0]}"><animate attributeName="d" dur="11s" repeatCount="indefinite" values="${[LQ[0], LQ[1], LQ[2], LQ[3], LQ[0]].join(';')}" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/></path></clipPath>
          <clipPath id="liq2" clipPathUnits="objectBoundingBox"><path d="${LQ[2]}"><animate attributeName="d" dur="13s" repeatCount="indefinite" values="${[LQ[2], LQ[3], LQ[0], LQ[1], LQ[2]].join(';')}" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/></path></clipPath>
        </defs></svg>
        <div class="liquid"><span class="liq-glow"></span><span class="liq-back"></span>
          <div class="frame"><img class="on" src="${src(S.heroImages[0])}" alt="شابة من مبادري بنك المبادرات" fetchpriority="high"></div>
        </div>
      </div>
    </div></section>
    <div class="ticker" aria-hidden="true"><div class="ticker-track">${tickerRow}${tickerRow}${tickerRow}${tickerRow}</div></div>
    ${H.order.filter((k) => H[k] && H[k].show !== false && sections[k]).map((k) => sections[k]()).join('')}`;

    // الأثر: البتلات (مؤشرات) والرأس يعرض المؤشر المختار
    const setInd = (k) => {
      const [v, short, title, desc] = ind[k];
      document.querySelectorAll('.petal').forEach((p) => p.classList.toggle('on', +p.dataset.k === k));
      document.querySelectorAll('.b-pick button').forEach((b) => b.setAttribute('aria-selected', +b.dataset.k === k));
      const hN = document.getElementById('bN'); if (!hN) return;
      hN.textContent = v + '%'; document.getElementById('bL').textContent = short;
      const d = document.getElementById('bD'); d.classList.remove('swap'); void d.offsetWidth; d.classList.add('swap');
      d.innerHTML = `<h3>${esc(title)}</h3><p>${esc(desc)}</p>`;
    };
    document.querySelectorAll('.petal, .b-pick button').forEach((b) => { b.addEventListener('click', () => setInd(+b.dataset.k)); b.addEventListener('mouseenter', () => setInd(+b.dataset.k)); });
    if (document.getElementById('bN')) setInd(0);
    // القصص: المرور على عنصر القائمة يبدّل القصة المميزة بسلاسة
    const featEl = document.getElementById('feat'); let fk = 0;
    const swap = (k) => { if (!featEl || k === fk) return; fk = k; featEl.classList.add('fade'); setTimeout(() => { featEl.innerHTML = featHTML(feat[k]); featEl.href = initUrl(feat[k]); featEl.classList.remove('fade'); }, 220);
      document.querySelectorAll('.side-list a').forEach((a) => a.toggleAttribute('aria-current', +a.dataset.k === k)); };
    document.querySelectorAll('.side-list a').forEach((a) => { a.addEventListener('mouseenter', () => swap(+a.dataset.k)); a.addEventListener('focus', () => swap(+a.dataset.k)); });
    // اللوحات
    document.querySelectorAll('.panel').forEach((p) => { const on = () => document.querySelectorAll('.panel').forEach((x) => x.classList.toggle('on', x === p)); p.addEventListener('focus', on); p.addEventListener('mouseenter', on); });
  }

  /* ====================== مكتبة المبادرات ====================== */
  function library() {
    setTitle('مكتبة المبادرات', `مكتبة بنك المبادرات: ${INITS.length} مبادرة شبابية موثّقة في قطاع غزة، مصنّفة حسب المحافظة والمجال والفئة المستهدفة.`);
    const facets = [
      ['governorate', 'المحافظة', (i) => i.governorate, 'pin'],
      ['theme', 'المجال', (i) => i.themes, 'tag'],
      ['audience', 'الفئة المستهدفة', (i) => i.audienceGroups, 'people'],
      ['project', 'المسار', (i) => i.project, 'folder'],
      ['year', 'السنة', (i) => i.date.slice(0, 4), 'cal'],
    ];
    const p = new URLSearchParams(location.search);
    const state = { q: p.get('q') || '', sort: p.get('sort') || 'new', view: IB.safeGet('ib_view') || 'grid' };
    facets.forEach(([k]) => { state[k] = p.getAll(k); });
    const anyFromUrl = facets.some(([k]) => state[k].length);
    let open = anyFromUrl || IB.safeGet('ib_fp') === '1';

    main.innerHTML = pageHero('مكتبة المبادرات', 'استكشف مبادرات الشباب والمجتمع، وتعرّف على الأفكار التي تحوّل التحديات إلى فرص حقيقية للتغيير.', [['مكتبة المبادرات']]) + `
    <section class="section lib-sec"><div class="wrap">
      <div class="lib-bar">
        <div class="lib-search">${icon('search')}<label class="sr-only" for="q">ابحث في المبادرات</label><input id="q" type="search" placeholder="ابحث باسم المبادرة أو المكان أو الفئة…" value="${esc(state.q)}" autocomplete="off"><button type="button" class="clr" id="qc" aria-label="مسح البحث" hidden>${icon('x')}</button></div>
        <button type="button" class="f-toggle" id="ft" aria-expanded="${open}" aria-controls="fp">${icon('filter')}<span>التصفية</span><b id="fn" hidden>0</b><i class="chev">${icon('arrowL')}</i></button>
        <label class="sort-wrap">${icon('list')}<span class="sr-only">الترتيب</span><select id="sort"><option value="new">الأحدث أولًا</option><option value="old">الأقدم أولًا</option><option value="az">العنوان أ–ي</option><option value="za">العنوان ي–أ</option></select></label>
        <div class="view-seg" role="group" aria-label="طريقة العرض"><button type="button" data-view="grid" aria-label="عرض شبكي">${icon('grid')}</button><button type="button" data-view="list" aria-label="عرض قائمة">${icon('list')}</button></div>
      </div>
      <div class="f-panel${open ? ' open' : ''}" id="fp" role="region" aria-label="خيارات التصفية"><div class="f-inner">
        ${facets.map(([k, label, f, ic]) => {
          const m = count(INITS, f);
          const keys = k === 'year' ? Object.keys(m).sort().reverse() : sortedKeys(m);
          return `<div class="f-group"><span class="f-label">${icon(ic)}${label}</span><div class="f-chips">${keys.map((v) => `<button type="button" class="f-chip" data-f="${k}" data-v="${esc(v)}" aria-pressed="${state[k].includes(v)}">${esc(v)}<i>${m[v]}</i></button>`).join('')}</div></div>`;
        }).join('')}
        <div class="f-actions"><button type="button" class="f-reset" id="reset">${icon('x')} مسح كل الخيارات</button><button type="button" class="btn btn-blue btn-sm" id="fdone">عرض النتائج</button></div>
      </div></div>
      <div class="lib-meta"><div class="count" aria-live="polite" id="count"></div><div class="a-tags" id="tags"></div></div>
      <div class="grid grid-3" id="results"></div>
    </div></section>`;

    const $ = (id) => document.getElementById(id);
    $('sort').value = state.sort;
    const fp = $('fp'), ft = $('ft');
    const setOpen = (o) => { open = o; fp.classList.toggle('open', o); ft.setAttribute('aria-expanded', o); IB.safeSet('ib_fp', o ? '1' : '0'); };
    ft.onclick = () => setOpen(!open);
    $('fdone').onclick = () => { setOpen(false); $('results').scrollIntoView({ behavior: 'smooth', block: 'start' }); };

    function apply(first) {
      const q = state.q.trim().toLowerCase();
      const r = INITS.filter((i) => {
        if (q && ![i.title, i.summary, i.location, i.audience, i.type, (i.themes || []).join(' ')].join(' ').toLowerCase().includes(q)) return false;
        return facets.every(([k, , f]) => !state[k].length || [].concat(f(i) || []).some((v) => state[k].includes(v)));
      });
      r.sort({ new: (a, b) => b.date.localeCompare(a.date), old: (a, b) => a.date.localeCompare(b.date), az: (a, b) => a.title.localeCompare(b.title, 'ar'), za: (a, b) => b.title.localeCompare(a.title, 'ar') }[state.sort]);
      const active = facets.flatMap(([k]) => state[k].map((v) => [k, v]));
      $('fn').textContent = active.length; $('fn').hidden = !active.length;
      $('qc').hidden = !state.q;
      $('count').innerHTML = `<b>${r.length}</b> ${r.length === INITS.length ? 'مبادرة' : `من أصل ${INITS.length} مبادرة`}`;
      $('tags').innerHTML = active.map(([k, v]) => `<button type="button" class="a-tag" data-f="${k}" data-v="${esc(v)}">${esc(v)} ${icon('x')}</button>`).join('') + (active.length > 1 ? `<button type="button" class="a-tag clear" id="tclear">مسح الكل</button>` : '');
      fp.querySelectorAll('.f-chip').forEach((c) => c.setAttribute('aria-pressed', state[c.dataset.f].includes(c.dataset.v)));
      const res = $('results');
      res.classList.toggle('list-view', state.view === 'list');
      res.innerHTML = r.length ? r.map(initCard).join('') : `<div class="empty" style="grid-column:1/-1">${icon('search', 'ic')}<p>لا توجد مبادرات مطابقة. جرّب تخفيف خيارات التصفية.</p></div>`;
      res.querySelectorAll('.reveal').forEach((e, n) => { e.style.transitionDelay = `${Math.min(n, 8) * 40}ms`; requestAnimationFrame(() => e.classList.add('in')); });
      document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === state.view));
      if (!first) {
        const u = new URLSearchParams();
        if (state.q) u.set('q', state.q);
        if (state.sort !== 'new') u.set('sort', state.sort);
        active.forEach(([k, v]) => u.append(k, v));
        history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
      }
    }
    const toggle = (k, v) => { state[k] = state[k].includes(v) ? state[k].filter((x) => x !== v) : [...state[k], v]; apply(); };
    let qt; $('q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value; apply(); }, 160); });
    $('qc').onclick = () => { $('q').value = ''; state.q = ''; apply(); $('q').focus(); };
    $('sort').addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
    fp.addEventListener('click', (e) => { const c = e.target.closest('.f-chip'); if (c) toggle(c.dataset.f, c.dataset.v); });
    $('tags').addEventListener('click', (e) => { const t = e.target.closest('.a-tag'); if (!t) return; if (t.id === 'tclear') $('reset').click(); else toggle(t.dataset.f, t.dataset.v); });
    document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { state.view = b.dataset.view; IB.safeSet('ib_view', state.view); apply(); }));
    $('reset').onclick = () => { facets.forEach(([k]) => { state[k] = []; }); apply(); };
    apply(true);
    ld([crumbsLD([['مكتبة المبادرات', abs('initiatives.html')]]), { '@type': 'CollectionPage', name: 'مكتبة المبادرات', url: abs('initiatives.html'), inLanguage: 'ar',
      mainEntity: { '@type': 'ItemList', numberOfItems: INITS.length, itemListElement: INITS.map((i, k) => ({ '@type': 'ListItem', position: k + 1, url: abs(`initiative-${i.id}.html`), name: i.title })) } }]);
  }

  /* ====================== صفحة مبادرة ====================== */
  function lightbox(images) {
    let lb = document.querySelector('.lightbox');
    if (!lb) {
      document.body.insertAdjacentHTML('beforeend', `<div class="lightbox" role="dialog" aria-modal="true" aria-label="معرض الصور"><img alt=""><button class="x" aria-label="إغلاق">${icon('x')}</button><button class="prev" aria-label="السابق">${icon('arrowR')}</button><button class="next" aria-label="التالي">${icon('arrowL')}</button><span class="counter"></span></div>`);
      lb = document.querySelector('.lightbox');
    }
    let i = 0; const img = lb.querySelector('img');
    const show = (k) => { i = (k + images.length) % images.length; img.src = src(images[i]); lb.querySelector('.counter').textContent = `${i + 1} / ${images.length}`; };
    const close = () => { lb.classList.remove('open'); document.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(i + 1); if (e.key === 'ArrowRight') show(i - 1); };
    lb.querySelector('.x').onclick = close;
    lb.querySelector('.prev').onclick = () => show(i - 1);
    lb.querySelector('.next').onclick = () => show(i + 1);
    lb.onclick = (e) => { if (e.target === lb) close(); };
    return (k) => { show(k); lb.classList.add('open'); document.addEventListener('keydown', key); lb.querySelector('.x').focus(); };
  }

  function paragraphs(list) {
    // سطر قصير بلا نقطة يليه نص = عنوان فرعي
    return (list || []).map((t, k, a) => {
      const isSub = t.length < 60 && !/[.،:؟!…]$/.test(t) && a[k + 1] && a[k + 1].length > 80;
      return isSub ? `<h4 class="sub">${esc(t)}</h4>` : `<p>${esc(t)}</p>`;
    }).join('');
  }

  function initiative() {
    const wanted = qs('id') || document.body.dataset.id;
    const i = INITS.find((x) => String(x.id) === wanted || x.slug === qs('slug'));
    if (!i) return notFound('لم نعثر على هذه المبادرة.');
    setTitle(i.title, i.summary, i.cover);
    ld([crumbsLD([['مكتبة المبادرات', abs('initiatives.html')], [i.title, abs(`initiative-${i.id}.html`)]]), {
      '@type': 'CreativeWork', '@id': abs(`initiative-${i.id}.html`), name: i.title, headline: i.title, description: i.summary, inLanguage: 'ar',
      image: [i.cover].concat(i.gallery || []).filter(Boolean).slice(0, 6).map(abs), datePublished: i.date, keywords: (i.themes || []).join('، '),
      genre: i.type, about: (i.themes || []).map((t) => ({ '@type': 'Thing', name: t })), audience: { '@type': 'Audience', audienceType: i.audience },
      locationCreated: { '@type': 'Place', name: i.location, address: { '@type': 'PostalAddress', addressRegion: i.governorate, addressCountry: 'PS' } },
      contributor: (i.team || []).map((m) => ({ '@type': 'Person', name: m.name })), publisher: { '@id': abs('#org') }, isPartOf: { '@type': 'CreativeWorkSeries', name: i.project } }]);
    const blocks = i.blocks || [];
    const anchors = [];
    let gi = 0;
    const body = blocks.map((b, k) => {
      if (b.kind === 'quote') return `<figure class="quote reveal">${icon('quote')}<p>${esc(b.text)}</p><cite>${esc(b.author)}</cite></figure>`;
      if (b.kind === 'closing') return `<div class="closing block reveal">${(b.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
      const id = 'b' + k; anchors.push([id, b.title]);
      let inner = '';
      if (b.kind === 'info') inner = `<div class="info-grid">${b.cards.map((c) => `<div class="info-card"><b>${esc(c.label)}</b><div>${c.lines.map(esc).join('<br>')}</div></div>`).join('')}</div>`;
      else if (b.kind === 'gallery') { gi = k; inner = `<div class="gallery">${b.images.map((im, n) => `<button type="button" data-img="${n}" aria-label="عرض الصورة ${n + 1}"><img src="${src(im)}" alt="صورة من ${esc(i.title)}" loading="lazy"></button>`).join('')}</div>`; }
      else if (b.kind === 'team') inner = paragraphs(b.paragraphs) + `<div class="team">${b.members.map((m) => `<div class="member">${m.photo ? `<img src="${src(m.photo)}" alt="" loading="lazy">` : `<span class="ph">${esc((m.name || '؟').trim()[0])}</span>`}<div><b>${esc(m.name)}</b><small>${esc(m.role)}</small></div></div>`).join('')}</div>`;
      else if (b.items && b.items.length && /أهداف/.test(b.title)) inner = paragraphs(b.paragraphs) + `<ol class="objectives">${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
      else inner = paragraphs(b.paragraphs) + (b.items && b.items.length ? `<ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
      return `<section class="block reveal" id="${id}"><div class="block-head"><span class="ic" aria-hidden="true">${esc(b.icon || '•')}</span><h2>${esc(b.title)}</h2></div>${inner}</section>`;
    }).join('');

    const related = INITS.filter((x) => x.id !== i.id).map((x) => ({ x, s: (x.project === i.project ? 1 : 0) + (x.themes || []).filter((t) => (i.themes || []).includes(t)).length + (x.governorate === i.governorate ? 0.5 : 0) }))
      .sort((a, b) => b.s - a.s).slice(0, 3).map((o) => o.x);
    const shareUrl = encodeURIComponent(location.href); const shareT = encodeURIComponent(i.title);

    main.innerHTML = `
    <section class="init-hero"><div class="wrap">
      <div>
        <nav class="crumbs" aria-label="مسار التنقل"><a href="${url('index.html')}">الرئيسية</a><span>/</span><a href="${url('initiatives.html')}">مكتبة المبادرات</a></nav>
        <span class="badge"><span class="dot"></span>مبادرة من بنك المبادرات</span>
        <h1>${esc(i.title)}</h1>
        <p class="sub">${esc(i.summary)}</p>
        <div class="tags"><span class="pill">${icon('pin')} ${esc(i.location)}</span><span class="pill">${icon('people')} ${esc(i.audience)}</span><span class="pill">${icon('target')} ${esc(i.type)}</span></div>
      </div>
      <div class="cover"><img src="${src(i.cover)}" alt="" fetchpriority="high"></div>
    </div></section>
    <div class="wrap init-layout">
      <article>${body}</article>
      <aside class="facts" aria-label="معلومات المبادرة">
        <h3>بطاقة المبادرة</h3>
        <div class="fact"><span class="ic">${icon('cal')}</span><div><small>تاريخ النشر</small><b>${fmtDate(i.date)}</b></div></div>
        <div class="fact"><span class="ic">${icon('pin')}</span><div><small>المحافظة</small><b>${esc(i.governorate || '—')}</b></div></div>
        <div class="fact"><span class="ic">${icon('folder')}</span><div><small>المسار / المشروع</small><b>${esc(i.project)}</b></div></div>
        <div class="fact"><span class="ic">${icon('tag')}</span><div><small>المجالات</small><b>${(i.themes || []).map(esc).join('، ')}</b></div></div>
        ${i.team && i.team.length ? `<div class="fact"><span class="ic">${icon('team')}</span><div><small>فريق المبادرة</small><b>${i.team.length} أعضاء</b></div></div>` : ''}
        ${i.gallery && i.gallery.length ? `<div class="fact"><span class="ic">${icon('image')}</span><div><small>الصور</small><b>${i.gallery.length} صورة</b></div></div>` : ''}
        ${i.beneficiaries ? `<div class="fact"><span class="ic">${icon('people')}</span><div><small>المستفيدون</small><b>${num(i.beneficiaries)}</b></div></div>` : ''}
        <nav class="toc" aria-label="محتويات الصفحة">${anchors.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>
        <div class="share" aria-label="مشاركة">
          <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener" aria-label="فيسبوك">${icon('facebook')}</a>
          <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareT}" target="_blank" rel="noopener" aria-label="إكس">${icon('x_')}</a>
          <a href="https://wa.me/?text=${shareT}%20${shareUrl}" target="_blank" rel="noopener" aria-label="واتساب">${icon('whatsapp')}</a>
          <button type="button" id="copy" aria-label="نسخ الرابط">${icon('link')}</button>
        </div>
      </aside>
    </div>
    <section class="section cream"><div class="wrap">
      <div class="sec-head"><h2>مبادرات <span class="hl">ذات صلة</span></h2><a class="btn btn-primary" href="${url('initiatives.html')}">العودة إلى المكتبة</a></div>
      <div class="grid grid-3">${related.map(initCard).join('')}</div>
    </div></section>`;

    const gal = blocks[gi] && blocks[gi].images;
    if (gal) { const open = lightbox(gal); document.querySelectorAll('[data-img]').forEach((b) => b.addEventListener('click', () => open(+b.dataset.img))); }
    document.getElementById('copy').onclick = (e) => { navigator.clipboard && navigator.clipboard.writeText(location.href); e.currentTarget.innerHTML = icon('check'); };
  }

  /* ====================== الأخبار ====================== */
  function news() {
    setTitle('الإعلانات والأخبار', 'استكشف أحدث الفرص والمبادرات المجتمعية');
    main.innerHTML = pageHero('الإعلانات والأخبار', 'استكشف أحدث الفرص والدعوات المفتوحة وقصص المبادرات المجتمعية.', [['الإعلانات والأخبار']]) + `
    <section class="section" style="padding-top:44px"><div class="wrap">
      <div class="chips" role="group" aria-label="تصفية" style="margin-bottom:28px">
        <button class="chip" data-k="" aria-pressed="true">الكل <span class="n">${POSTS.length}</span></button>
        <button class="chip" data-k="call" aria-pressed="false">دعوات مفتوحة <span class="n">${POSTS.filter((p) => p.kind === 'call').length}</span></button>
        <button class="chip" data-k="story" aria-pressed="false">قصص المبادرات <span class="n">${POSTS.filter((p) => p.kind !== 'call').length}</span></button>
      </div>
      <div class="grid grid-3" id="posts"></div>
    </div></section>`;
    const box = document.getElementById('posts');
    const render = (k) => { box.innerHTML = POSTS.filter((p) => !k || (k === 'call' ? p.kind === 'call' : p.kind !== 'call')).map(postCard).join(''); box.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')); };
    document.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', x === b)); render(b.dataset.k); }));
    render('');
  }

  function post() {
    const wanted = qs('id') || document.body.dataset.id;
    const p = POSTS.find((x) => String(x.id) === wanted);
    if (!p) return notFound('لم نعثر على هذا الخبر.');
    setTitle(p.title, p.excerpt, p.cover);
    ld([crumbsLD([['الإعلانات', abs('news.html')], [p.title, abs(`post-${p.id}.html`)]]), { '@type': 'NewsArticle', '@id': abs(`post-${p.id}.html`), headline: p.title, description: p.excerpt,
      image: p.cover ? [abs(p.cover)] : undefined, datePublished: p.date, inLanguage: 'ar', author: { '@id': abs('#org') }, publisher: { '@id': abs('#org') }, mainEntityOfPage: abs(`post-${p.id}.html`) }]);
    const more = POSTS.filter((x) => x.id !== p.id).slice(0, 3);
    main.innerHTML = pageHero(p.title, '', [['الإعلانات والأخبار', url('news.html')], [fmtDate(p.date)]]) + `
    <div class="wrap"><article class="article">
      ${p.cover ? `<div class="cover"><img src="${src(p.cover)}" alt=""></div>` : ''}
      <div class="prose">${p.content.replace(/src="(?!https?:|data:)([^"]+)"/g, (m, s) => `src="${src(s)}"`)}</div>
      ${p.kind === 'call' ? `<div class="cta" style="margin-top:30px"><div><h2>جاهز لتقديم فكرتك؟</h2><p>املأ نموذج التقديم وسيتواصل معك فريق بنك المبادرات.</p></div><a class="btn btn-light" href="${url('submit.html')}">قدّم فكرتك</a></div>` : ''}
    </article></div>
    <section class="section cream"><div class="wrap"><div class="sec-head"><h2>أخبار <span class="hl">أخرى</span></h2></div><div class="grid grid-3">${more.map(postCard).join('')}</div></div></section>`;
  }

  /* ====================== من نحن ====================== */
  function about() {
    setTitle('من نحن', S.about.text[0]);
    const a = S.about;
    main.innerHTML = pageHero('تعرّف علينا أكثر', a.text[0], [['من نحن']]) + `
    <section class="section"><div class="wrap split about-split">
      <div class="reveal"><span class="kicker">من نحن</span><h2>${esc(a.title)}</h2>${a.text.slice(1).map((t) => `<p style="color:var(--muted)">${esc(t)}</p>`).join('')}
        <a class="btn btn-primary" href="${url('initiatives.html')}">استكشف المبادرات</a></div>
      <div class="photo-stack reveal">${a.images.map((im) => `<img src="${src(im)}" alt="" loading="lazy">`).join('')}</div>
    </div></section>
    <section class="section cream"><div class="wrap">
      <div class="sec-head center"><h2>رؤية ورسالة <span class="hl">بنك المبادرات</span></h2></div>
      <div class="vm"><div class="reveal"><h3>رؤيتنا</h3><p>${esc(a.vision)}</p></div><div class="reveal"><h3>رسالتنا</h3><p>${esc(a.mission)}</p></div></div>
    </div></section>
    <section class="section"><div class="wrap"><div class="sec-head center"><h2>إنجازاتنا في <span class="hl">بنك المبادرات</span></h2></div>${statsHTML()}</div></section>
    <section class="section cream"><div class="wrap"><div class="sec-head center"><h2>قيمنا</h2></div>${valuesHTML()}</div></section>
    <section class="section"><div class="wrap">
      <div class="sec-head"><div><h2>ماذا يقول المبادرون</h2><p>أصوات من الميدان: مبادرون ومشاركون في مبادرات بنك المبادرات.</p></div>
        <div class="scroller-nav"><button type="button" data-dir="1" aria-label="السابق">${icon('arrowR')}</button><button type="button" data-dir="-1" aria-label="التالي">${icon('arrowL')}</button></div></div>
      <div class="stories" id="stories" tabindex="0">${S.testimonials.map((t) => `<figure class="story">${icon('quote', 'q')}<blockquote>${esc(t.quote)}</blockquote><figcaption class="who"><b>${esc(t.name)}</b><span>${esc(t.role)}</span></figcaption></figure>`).join('')}</div>
    </div></section>
    <section class="section"><div class="wrap"><div class="sec-head center"><div><h2>شركاؤنا</h2></div></div>${partnersHTML()}</div></section>`;
    const st = document.getElementById('stories');
    document.querySelectorAll('.scroller-nav button').forEach((b) => b.addEventListener('click', () => st.scrollBy({ left: -b.dataset.dir * st.clientWidth * 0.9, behavior: 'smooth' })));
  }

  function partners() {
    setTitle('الشركاء', 'تعرف على شركائنا الذين يعملون معنا لتعزيز الابتكار ودعم المبادرات المجتمعية.');
    main.innerHTML = pageHero('الشركاء', 'تعرف على شركائنا الذين يعملون معنا لتعزيز الابتكار ودعم المبادرات المجتمعية.', [['الشركاء']]) + `
    <section class="section"><div class="wrap">
      <div class="grid grid-4">${S.partners.map((p) => `<a class="card reveal" href="${esc(p.url)}" target="_blank" rel="noopener"><div class="partner" style="border:0;min-height:150px"><img src="${src(p.logo)}" alt="" loading="lazy" style="filter:none;opacity:1"></div><div class="body"><h3>${esc(p.name)}</h3><p class="desc">${esc(p.nameEn)}</p><span class="pill blue">${esc(p.role)}</span></div></a>`).join('')}</div>
      <div style="margin-top:60px" class="cta reveal"><div><h2>كن شريكًا في التغيير</h2><p>انضم إلينا لتعزيز مبادراتنا وتحقيق تأثير دائم في المجتمعات.</p></div><a class="btn btn-light" href="${url('support.html')}">طرق التعاون</a></div>
    </div></section>`;
  }

  function support() {
    setTitle('ادعم بنك المبادرات');
    main.innerHTML = pageHero('ادعم بنك المبادرات', 'انضم إلينا لتعزيز مبادراتنا وتحقيق تأثير دائم في المجتمعات من خلال الشراكات الاستراتيجية لتحقيق التغيير المستدام.', [['ادعم البنك']]) + `
    <section class="section"><div class="wrap">
      <div class="sec-head center"><span class="kicker">طرق التعاون معنا</span><h2>كيف يمكنك <span class="hl">المساهمة</span>؟</h2></div>
      <div class="grid grid-3">${S.supportWays.map((w) => `<div class="value reveal" style="text-align:start"><div class="ic" style="margin:0 0 14px">${icon(w.icon)}</div><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div>`).join('')}</div>
    </div></section>
    <section class="section cream"><div class="wrap">${statsHTML()}</div></section>
    <section class="section"><div class="wrap"><div class="cta reveal"><div><h2>لنتحدث عن شراكة</h2><p>راسلنا على ${esc(S.contact.ibEmail)} أو اتصل بنا مباشرة وسيتواصل معك فريق الشراكات.</p></div><a class="btn btn-light" href="${url('contact.html')}">تواصل معنا</a></div></div></section>`;
  }

  function contact() {
    setTitle('تواصل معنا');
    const c = S.contact;
    main.innerHTML = pageHero('تواصل/ي معنا', 'هل لديك سؤال، استفسار، أو شكوى؟ فريقنا متواجد دائمًا.', [['تواصل معنا']]) + `
    <section class="section"><div class="wrap form-shell">
      <form class="form-card" id="cform">
        <h3>أرسل رسالتك</h3>
        <div class="form-grid">
          <div class="field"><label for="cn">الاسم <span class="req">*</span></label><input class="input" id="cn" required></div>
          <div class="field"><label for="ce">البريد الإلكتروني <span class="req">*</span></label><input class="input" id="ce" type="email" required></div>
          <div class="field full"><label for="ct">نوع الرسالة</label><select class="select" id="ct"><option>سؤال</option><option>استفسار</option><option>شكوى</option><option>شراكة</option></select></div>
          <div class="field full"><label for="cm">الرسالة <span class="req">*</span></label><textarea class="textarea" id="cm" required></textarea></div>
        </div>
        <button class="btn btn-primary" style="margin-top:16px">${icon('send')} إرسال</button>
        <p class="hint" style="font-size:13px;color:var(--muted);margin-top:10px">يفتح الإرسال تطبيق البريد لديك مع رسالة جاهزة إلى ${esc(c.ibEmail)}.</p>
      </form>
      <aside class="contact-box">
        <h3>تواصل مباشر</h3>
        <a href="tel:${esc(c.phone)}">${esc(c.phone)} ${icon('phone')}</a>
        <a href="mailto:${esc(c.ibEmail)}">${esc(c.ibEmail)} ${icon('mail')}</a>
        <a href="mailto:${esc(c.email)}">${esc(c.email)} ${icon('mail')}</a>
        <div class="socials">${c.social.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener" aria-label="${esc(x.name)}">${icon({ Facebook: 'facebook', Instagram: 'instagram', X: 'x_', LinkedIn: 'linkedin', YouTube: 'youtube', TikTok: 'tiktok' }[x.name] || 'link')}</a>`).join('')}</div>
      </aside>
    </div></section>
    <section class="section cream"><div class="wrap">
      <div class="sec-head"><div><h2>مكاتب <span class="hl">${esc(S.brand.org)}</span></h2><p>بنك المبادرات مبادرة من ${esc(S.brand.org)}. لمزيد من المعلومات زوروا <a href="${esc(S.brand.orgUrl)}" target="_blank" rel="noopener" style="color:var(--blue)">sdf-pal.org</a>.</p></div></div>
      <div class="offices">${c.offices.map((o) => `<div class="office">${icon('pin')}<div><b>${esc(o.city)}</b><span>${esc(o.address)}</span></div></div>`).join('')}</div>
    </div></section>`;
    document.getElementById('cform').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = (id) => document.getElementById(id).value;
      location.href = `mailto:${c.ibEmail}?subject=${encodeURIComponent(v('ct') + ' – ' + v('cn'))}&body=${encodeURIComponent(v('cm') + '\n\n' + v('cn') + ' – ' + v('ce'))}`;
    });
  }

  /* ====================== قدّم فكرتك (نموذج بخطوات) ====================== */
  /* ====================== قدّم فكرتك: نماذج تُبنى من لوحة التحكم ====================== */
  function submit() {
    const F = S.submit; const FM = S.forms || {}; const LIST = (FM.list || []).filter((f) => f.open !== false);
    const GW = FM.gateway || {};
    setTitle('قدّم فكرتك', F.intro);
    const SICON = ['flag', 'bulb', 'list', 'team', 'target', 'folder', 'check'];
    main.innerHTML = `<section class="page-hero submit-hero"><div class="wrap"><div class="box">
      <nav class="crumbs" aria-label="مسار التنقل"><a href="${url('index.html')}">الرئيسية</a><span aria-hidden="true">/</span><span>قدّم فكرتك</span></nav>
      <h1>قدّم <span class="grad-text">فكرتك</span></h1>
      <p>${esc(F.title)}. ${esc(F.intro)}</p>
      <ul class="sh-badges"><li>${icon('check')}التقديم مجاني</li><li>${icon('folder')}حفظ تلقائي للمسودة</li><li>${icon('people')}نموذج دامج لذوي الإعاقة</li></ul>
    </div></div></section>
    <section class="section" style="padding-top:40px"><div class="wrap wiz-shell">
      <div id="formHost"></div>
      <aside class="wiz-side">
        <div class="tip" id="tip"></div>
        ${(F.steps || []).length ? `<div class="side-card"><h3>كيف يتم التقديم؟</h3><ol class="how">${F.steps.map((s) => `<li><b>${esc(s.title)}</b><small>${esc(s.text)}</small></li>`).join('')}</ol></div>` : ''}
        <div class="side-card"><h3>أسئلة شائعة</h3>${(F.faq || []).map((q) => `<details class="faq"><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join('')}</div>
      </aside>
    </div></section>`;
    const host = document.getElementById('formHost'); const tipEl = document.getElementById('tip');
    const tip = (ic, t, p) => { tipEl.innerHTML = `<div class="tip-anim"><span class="ti">${icon(ic)}</span><b>${esc(t)}</b>${p ? `<p>${esc(p)}</p>` : ''}</div>`; };

    // ---------- البوابة: اختيار النموذج ----------
    function gateway() {
      const yes = LIST.find((f) => f.id === (GW.yes || {}).form); const no = LIST.find((f) => f.id === (GW.no || {}).form);
      const cards = (yes && no) ? [[GW.yes, yes, 'pwd'], [GW.no, no, '']] : LIST.map((f) => [{ label: f.short || f.title, cta: 'ابدأ النموذج' }, f, '']);
      host.innerHTML = `<div class="wiz gate"><div class="wiz-body">
        <span class="kicker">${esc(GW.title || 'اختر النموذج المناسب')}</span>
        <h2 class="gate-q">${esc(GW.question || 'أي نموذج يناسب مبادرتك؟')}</h2>
        <div class="gate-cards">${cards.map(([g, f, cls], k) => `<button type="button" class="gate-card ${cls}" data-form="${esc(f.id)}" style="--k:${k}">
          <span class="ki">${icon(f.icon || (k ? 'people' : 'hands'))}</span><b>${esc(g.label)}</b><small>${esc(f.desc || f.subtitle || '')}</small>
          <span class="go">${esc(g.cta || 'ابدأ')} ${icon('arrowL')}</span></button>`).join('')}</div>
        ${LIST.length ? '' : '<p class="empty">التقديم مغلق حاليًا. تابعنا لمعرفة موعد الدورة القادمة.</p>'}
      </div></div>`;
      host.querySelectorAll('[data-form]').forEach((b) => b.onclick = () => { history.replaceState(null, '', location.pathname + '?form=' + b.dataset.form); wizard(LIST.find((f) => f.id === b.dataset.form)); });
      tip('flag', 'اختر النموذج المناسب', 'النموذج المخصص لذوي الإعاقة يسأل عن المشاركة والمواءمة والترتيبات التيسيرية، ليصل الجميع إلى مبادرتك بكرامة.');
    }

    // ---------- المعالج ----------
    function wizard(schema) {
      const AUTO = 'ib_form_' + schema.id; let V = {};
      try { V = JSON.parse(IB.safeGet(AUTO) || '{}') || {}; } catch (e) { V = {}; }
      const steps = schema.steps || [];
      const allFields = (list) => list.flatMap((f) => [f]);
      const nm = (path) => path.join('.');
      const getP = (path) => path.reduce((o, k) => (o == null ? undefined : o[k]), V);
      const cond = (f, scope) => { const c = f.showIf; if (!c) return true; const v = (scope && c.key in scope) ? scope[c.key] : V[c.key];
        if (c.op === 'includes') return [].concat(v || []).includes(c.value); if (c.op === 'neq') return v !== c.value; if (c.op === 'filled') return !!(v && String(v).length); return v === c.value; };
      const hintH = (f) => f.hint ? `<div class="help">${esc(f.hint).replace(/\n/g, '<br>')}</div>` : '';
      const req = (f) => f.required ? ' <i class="req" aria-hidden="true">*</i>' : '';

      function fieldHTML(f, path, scope) {
        const id = 'f_' + path.join('_'); const v = getP(path); const name = nm(path);
        const show = cond(f, scope) ? '' : ' hidden';
        const wrap = (inner, lbl = true) => `<div class="q${f.width === 'half' ? ' half' : ''} t-${f.type}" data-path="${esc(name)}"${f.showIf ? ` data-show='${esc(JSON.stringify(f.showIf))}'` : ''}${show}>${lbl ? `<label for="${id}">${esc(f.label)}${req(f)}${f.max ? ` <small data-cnt="${id}" data-max="${f.max}">0 / ${f.max}</small>` : ''}</label>` : ''}${inner}${hintH(f)}<div class="err">${esc(f.type === 'confirm' ? 'يلزم الإقرار للمتابعة' : (f.type === 'checks' || f.type === 'radio') ? 'اختر خيارًا على الأقل' : 'هذا الحقل مطلوب أو غير صحيح')}</div></div>`;
        const opts = (f.options || []); const lab = (k) => (f.labels && f.labels[k]) || opts[k];
        switch (f.type) {
          case 'heading': return `<div class="q-head"${show} data-path="${esc(name)}"${f.showIf ? ` data-show='${esc(JSON.stringify(f.showIf))}'` : ''}><h3>${esc(f.label)}</h3>${f.hint ? `<div class="q-note">${esc(f.hint).split('\n').map((l) => `<p>${l}</p>`).join('')}</div>` : ''}</div>`;
          case 'confirm': return wrap(`<label class="switch-row"><input type="checkbox" id="${id}" name="${name}"${v ? ' checked' : ''} data-t="confirm"><span class="sw"></span><span>${esc(f.text || f.label)}</span></label>`, false);
          case 'textarea': return wrap(`<textarea class="fin" id="${id}" name="${name}"${f.max ? ` maxlength="${f.max}"` : ''} rows="4" placeholder="${esc(f.placeholder || '')}">${esc(v || '')}</textarea>`);
          case 'select': {
            const groups = f.groups ? f.groups.map((g) => `<optgroup label="${esc(g.label)}">${g.options.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</optgroup>`).join('')
              : opts.map((o, k) => `<option value="${esc(o)}"${o === v ? ' selected' : ''}>${esc(lab(k))}</option>`).join('');
            return wrap(`<select class="fin" id="${id}" name="${name}"><option value="">اختر…</option>${groups}</select>`);
          }
          case 'radio': case 'checks': return wrap(`<div class="opts" role="${f.type === 'radio' ? 'radiogroup' : 'group'}" aria-label="${esc(f.label)}">${opts.map((o, k) => `<label class="opt"><input type="${f.type === 'radio' ? 'radio' : 'checkbox'}" name="${name}" value="${esc(o)}"${[].concat(v || []).includes(o) ? ' checked' : ''}><span>${esc(lab(k))}</span></label>`).join('')}</div>`, false).replace('<div class="opts"', `<span class="ql">${esc(f.label)}${req(f)}</span><div class="opts"`);
          case 'money': return wrap(`<div class="money"><input class="fin" id="${id}" name="${name}" inputmode="decimal" dir="ltr" value="${esc((v && v.amount) || '')}" data-t="amount"><select class="fin" name="${name}.cur" aria-label="العملة">${(f.currencies || ['دولار', 'شيكل']).map((c) => `<option${v && v.cur === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>`);
          case 'file': return wrap(`<label class="file-drop"><input type="file" id="${id}" name="${name}" multiple accept="${(f.ext || []).map((e) => '.' + e).join(',')}">${icon('folder')}<span>اسحب الملفات هنا أو اضغط للاختيار</span><small>حتى ${f.maxFiles || 5} ملفات، ${f.maxMb || 10} ميغابايت للملف · ${(f.ext || []).join('، ')}</small></label><ul class="file-list">${[].concat(v || []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`);
          case 'repeater': case 'budget': return repeaterHTML(f, path);
          default: {
            const t = { number: 'number', date: 'date', tel: 'tel', email: 'email' }[f.type] || 'text';
            const ltr = ['tel', 'email', 'number'].includes(t) ? ' dir="ltr"' : '';
            const ac = { contactName: 'name', contactPhone: 'tel', contactEmail: 'email' }[f.role] || 'off';
            return wrap(`<input class="fin" type="${t}" id="${id}" name="${name}"${ltr} value="${esc(v == null ? '' : v)}"${f.max ? ` maxlength="${f.max}"` : ''}${t === 'number' ? ' min="0" inputmode="numeric"' : ''} autocomplete="${ac}" placeholder="${esc(f.placeholder || (t === 'tel' ? '059XXXXXXX' : t === 'email' ? 'name@example.com' : ''))}">${f.quick ? `<div class="quick">${f.quick.map((x) => `<button type="button" data-quick="${esc(name)}">${esc(x)}</button>`).join('')}</div>` : ''}`);
          }
        }
      }
      function itemCount(f) {
        const it = f.item || {}; const arr = getP([f.key]) || [];
        if (it.countFrom) return Math.max(it.min || 1, Math.min(it.max || 20, +V[it.countFrom] || it.min || 1));
        return Math.max(it.min || 1, arr.length);
      }
      function repeaterHTML(f, path) {
        const it = f.item || {}; const n = itemCount(f); const arr = getP(path) || [];
        const items = Array.from({ length: n }, (_, i) => {
          const scope = arr[i] || {};
          const title = i === 0 && it.firstTitle ? it.firstTitle : `${it.title || 'عنصر'} ${i + 1}`;
          const line = f.type === 'budget' ? `<div class="b-line">إجمالي البند: <b data-line="${i}">${num((+scope.qty || 0) * (+scope.cost || 0))}</b></div>` : '';
          return `<div class="mcard rep-item" data-i="${i}"><header><span class="av">${i + 1}</span><div><b>${esc(title)}</b></div>${!it.countFrom && n > (it.min || 1) ? `<button type="button" class="rm" data-rm="${esc(f.key)}" data-i="${i}" aria-label="حذف">${icon('x')}</button>` : ''}</header>
            <div class="grid2">${(it.fields || []).map((sf) => fieldHTML(sf, path.concat([i, sf.key]), scope)).join('')}</div>${line}</div>`;
        }).join('');
        const add = !it.countFrom && n < (it.max || 20) ? `<button type="button" class="btn btn-outline btn-sm add-item" data-add="${esc(f.key)}">+ ${esc(it.addLabel || 'إضافة')}</button>` : '';
        const sum = f.type === 'budget' ? `<div class="b-sum" data-sum="${esc(f.key)}"></div>` : '';
        return `<div class="q rep t-${f.type}" data-path="${esc(nm(path))}" data-rep="${esc(f.key)}"${f.showIf ? ` data-show='${esc(JSON.stringify(f.showIf))}'` : ''}${cond(f) ? '' : ' hidden'}><span class="ql">${esc(f.label)}</span>${hintH(f)}<div class="rep-list">${items}</div>${add}${sum}</div>`;
      }

      host.innerHTML = `<form class="wiz" id="idea" novalidate>
        <div class="wiz-top"><div class="wiz-title"><button type="button" class="link-btn" id="chg">${icon('arrowR')} تغيير النموذج</button><b>${esc(schema.title)}</b></div>
          <ol class="wiz-steps" style="grid-template-columns:repeat(${steps.length},1fr)">${steps.map((s, k) => `<li data-k="${k}"><span class="d">${k + 1}</span><span class="sl">${esc(s.title)}</span></li>`).join('')}</ol><div class="wiz-bar"><i id="bar"></i></div></div>
        <div class="wiz-body" id="body">${steps.map((s, k) => `<fieldset class="wstep" data-step="${k}"><legend>${esc(s.title)}</legend>${s.intro ? `<p class="lead">${esc(s.intro)}</p>` : ''}
          <div class="grid2">${(s.fields || []).map((f) => fieldHTML(f, [f.key])).join('')}</div>${s.review ? '<div class="review" id="review"></div>' : ''}</fieldset>`).join('')}</div>
        <div class="wiz-nav">
          <button type="button" class="btn btn-outline" id="prev">${icon('arrowR')} السابق</button>
          <span class="saved" id="saved">حُفظت المسودة</span>
          <button type="button" class="btn btn-blue" id="next">التالي ${icon('arrowL')}</button>
          <button type="submit" class="btn btn-primary" id="send" hidden>${icon('send')} أرسل الطلب</button>
        </div></form>`;
      const form = document.getElementById('idea'); const $ = (s) => form.querySelector(s);
      const stepsEl = [...form.querySelectorAll('.wstep')]; let cur = 0;

      // قراءة القيم من النموذج
      function collect() {
        const O = {};
        const set = (path, val, multi) => { const ks = path.split('.'); let o = O; ks.forEach((k, i) => { const key = /^\d+$/.test(k) ? +k : k; if (i === ks.length - 1) { if (multi) (o[key] = o[key] || []).push(val); else o[key] = val; } else { if (o[key] == null) o[key] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[key]; } }); };
        form.querySelectorAll('input[name],select[name],textarea[name]').forEach((el) => {
          const n = el.name;
          if (el.type === 'checkbox' && el.dataset.t === 'confirm') set(n, el.checked);
          else if (el.type === 'checkbox') { if (el.checked) set(n, el.value, true); else set(n, getAt(O, n) || [], false); }
          else if (el.type === 'radio') { if (el.checked) set(n, el.value); }
          else if (el.type === 'file') set(n, el.files.length ? [...el.files].map((x) => x.name) : [].concat(getP(n.split('.')) || []));
          else if (el.dataset.t === 'amount') set(n + '.amount', el.value);
          else if (/\.cur$/.test(n)) set(n, el.value);
          else set(n, el.value);
        });
        return O;
      }
      const getAt = (o, n) => n.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
      // إظهار/إخفاء الحقول الشرطية
      function sync() {
        form.querySelectorAll('[data-show]').forEach((el) => {
          const c = JSON.parse(el.dataset.show); const item = el.closest('.rep-item'); let scope;
          if (item) { const rp = item.closest('[data-rep]').dataset.path; scope = getAt(V, rp + '.' + item.dataset.i) || {}; }
          el.hidden = !cond({ showIf: c }, scope);
        });
        form.querySelectorAll('[data-cnt]').forEach((c) => { const el = form.querySelector('#' + c.dataset.cnt); if (el) c.textContent = `${el.value.length} / ${c.dataset.max}`; });
        form.querySelectorAll('[data-sum]').forEach((box) => {
          const f = findField(box.dataset.sum); const arr = V[f.key] || []; let total = 0, admin = 0;
          arr.forEach((r, i) => { const t = (+r.qty || 0) * (+r.cost || 0); total += t; if (r.cat && r.cat === f.adminCategory) admin += t; const l = box.parentElement.querySelector(`[data-line="${i}"]`); if (l) l.textContent = num(t); });
          const contrib = +V[f.contribKey] || 0; const pct = total ? Math.round((admin / total) * 100) : 0;
          box.innerHTML = `<div><span>إجمالي الموازنة</span><b>${num(total)}</b></div><div><span>المصاريف الإدارية</span><b class="${pct > 10 ? 'warn' : ''}">${pct}%</b></div><div><span>المساهمة الذاتية</span><b>${num(contrib)}</b></div><div class="hl"><span>المبلغ المطلوب</span><b>${num(Math.max(0, total - contrib))}</b></div>`;
        });
      }
      const findField = (key) => steps.flatMap((s) => s.fields || []).find((f) => f.key === key);
      function rerenderRep(key) {
        const f = findField(key); const box = form.querySelector(`[data-rep="${key}"]`); if (!f || !box) return;
        V = collect(); box.outerHTML = repeaterHTML(f, [key]); sync();
      }
      let tm; const save = () => { clearTimeout(tm); tm = setTimeout(() => { V = collect(); V._step = cur; IB.safeSet(AUTO, JSON.stringify(V)); const s = $('#saved'); s.classList.add('on'); clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove('on'), 1600); }, 350); };

      function valid(el, f) {
        if (el.hidden || el.closest('[hidden]')) return true;
        const path = el.dataset.path; const v = getAt(V, path);
        if (f.type === 'confirm') return !f.required || v === true;
        if (f.type === 'checks') return !f.required || (v && v.length);
        if (f.type === 'money') return !f.required || (v && String(v.amount).trim() && !isNaN(+String(v.amount).replace(/,/g, '')));
        const s = v == null ? '' : String(v).trim();
        if (!s) return !f.required;
        if (f.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
        if (f.type === 'tel') return s.replace(/\D/g, '').length >= 9;
        if (f.type === 'number') return !isNaN(+s) && +s >= 0;
        return true;
      }
      function fieldsWithPaths(k) {
        const out = [];
        (steps[k].fields || []).forEach((f) => {
          if (f.type === 'repeater' || f.type === 'budget') { const n = itemCount(f); for (let i = 0; i < n; i++) (f.item.fields || []).forEach((sf) => out.push([sf, `${f.key}.${i}.${sf.key}`])); }
          else if (f.type !== 'heading' && f.type !== 'file') out.push([f, f.key]);
        });
        return out;
      }
      function validate(k) {
        V = collect(); sync(); let ok = true;
        stepsEl[k].querySelectorAll('.q').forEach((q) => q.classList.remove('bad'));
        fieldsWithPaths(k).forEach(([f, p]) => { const el = form.querySelector(`.q[data-path="${CSS.escape(p)}"]`); if (el && !valid(el, f)) { el.classList.add('bad'); ok = false; } });
        if (!ok) { const first = stepsEl[k].querySelector('.q.bad'); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = first.querySelector('input,textarea,select'); if (i) setTimeout(() => i.focus({ preventScroll: true }), 350); }
        return ok;
      }
      function show(k, back) {
        stepsEl.forEach((s, i) => { s.classList.toggle('on', i === k); s.classList.toggle('back', !!back); });
        form.querySelectorAll('.wiz-steps li').forEach((li, i) => { li.className = i < k ? 'done' : i === k ? 'now' : ''; li.querySelector('.d').innerHTML = i < k ? icon('check') : i + 1; });
        $('#bar').style.width = `${(k / Math.max(1, steps.length - 1)) * 100}%`;
        $('#prev').style.visibility = k ? 'visible' : 'hidden';
        const last = k === steps.length - 1; $('#next').hidden = last; $('#send').hidden = !last;
        const s = steps[k]; tip(SICON[k % SICON.length], s.title, s.intro || '');
        if (s.review) renderReview();
        cur = k; save();
        if (window.scrollY > form.getBoundingClientRect().top + window.scrollY) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const fmtVal = (f, v) => {
        if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
        if (f.type === 'confirm') return v ? 'نعم' : '';
        if (f.type === 'money') return v.amount ? `${v.amount} ${v.cur || ''}` : '';
        if (f.type === 'select' && f.labels) { const i = (f.options || []).indexOf(v); return i >= 0 ? f.labels[i] : v; }
        return Array.isArray(v) ? v.join('، ') : String(v);
      };
      function renderReview() {
        V = collect();
        const rows = (list, scope) => list.filter((f) => f.type !== 'heading' && cond(f, scope)).map((f) => {
          if (f.type === 'repeater' || f.type === 'budget') { const arr = (scope || V)[f.key] || []; return arr.map((it, i) => `<dt>${esc((i === 0 && f.item.firstTitle) || `${f.item.title || ''} ${i + 1}`)}</dt><dd>${esc(f.item.fields.filter((sf) => cond(sf, it)).map((sf) => fmtVal(sf, it[sf.key])).filter(Boolean).join(' · '))}</dd>`).join(''); }
          const val = fmtVal(f, (scope || V)[f.key]); return val ? `<dt>${esc(f.label)}</dt><dd>${esc(val)}</dd>` : '';
        }).join('');
        $('#review').innerHTML = steps.map((s, k) => s.review ? '' : `<div class="rv"><header><b>${esc(s.title)}</b><button type="button" data-go="${k}">تعديل</button></header><dl>${rows(s.fields || [])}</dl></div>`).join('');
      }

      form.addEventListener('input', (e) => { const q = e.target.closest('.q'); if (q) q.classList.remove('bad'); V = collect(); sync(); save(); });
      form.addEventListener('change', (e) => {
        V = collect();
        const top = e.target.name && e.target.name.split('.')[0];
        steps.forEach((s) => (s.fields || []).forEach((f) => { if (f.item && f.item.countFrom === top) rerenderRep(f.key); }));
        if (e.target.type === 'file') { const ul = e.target.closest('.q').querySelector('.file-list'); ul.innerHTML = [...e.target.files].map((x) => `<li>${esc(x.name)}</li>`).join(''); }
        sync(); save();
      });
      form.addEventListener('click', (e) => {
        const qb = e.target.closest('[data-quick]'); if (qb) { const inp = form.querySelector(`[name="${qb.dataset.quick}"]`); inp.value = qb.textContent; inp.dispatchEvent(new Event('input', { bubbles: true })); }
        const add = e.target.closest('[data-add]'); if (add) { V = collect(); const k = add.dataset.add; V[k] = (V[k] || []).concat([{}]); const f = findField(k); const box = form.querySelector(`[data-rep="${k}"]`); box.outerHTML = repeaterHTML(f, [k]); sync(); save(); }
        const rm = e.target.closest('[data-rm]'); if (rm) { V = collect(); const k = rm.dataset.rm; V[k].splice(+rm.dataset.i, 1); const f = findField(k); const box = form.querySelector(`[data-rep="${k}"]`); box.outerHTML = repeaterHTML(f, [k]); sync(); save(); }
        const go = e.target.closest('[data-go]'); if (go) show(+go.dataset.go, true);
        const li = e.target.closest('.wiz-steps li.done'); if (li) show(+li.dataset.k, true);
      });
      $('#next').onclick = () => { if (validate(cur)) show(cur + 1); };
      $('#prev').onclick = () => show(cur - 1, true);
      $('#chg').onclick = () => { history.replaceState(null, '', location.pathname); gateway(); };

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        for (let k = 0; k < steps.length; k++) if (!steps[k].review && !validate(k)) { show(k, true); setTimeout(() => validate(k), 60); return; }
        V = collect(); delete V._step;
        const all = steps.flatMap((s) => s.fields || []);
        const byRole = (r) => { const f = all.find((x) => x.role === r); return f ? V[f.key] : ''; };
        const rep = all.find((f) => f.item && (f.item.fields || []).some((x) => x.role === 'contactName')); const c0 = rep ? ((V[rep.key] || [])[0] || {}) : {};
        const rec = { id: (schema.refPrefix || 'IB') + '-' + Date.now().toString(36).toUpperCase().slice(-6), form: schema.id, formTitle: schema.title, receivedAt: new Date().toISOString(), status: 'new',
          title: byRole('title') || V.name || '', contact: { name: c0.name || '', phone: c0.phone || '', email: c0.email || '' }, data: V, notes: '' };
        const btn = $('#send'); btn.disabled = true; btn.innerHTML = 'جارٍ الإرسال…';
        const endpoint = FM.endpoint || ''; let sent = false;
        if (endpoint) { try { const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(rec) }); sent = r.ok; } catch (err) { sent = false; } }
        try { const list = JSON.parse(IB.safeGet('ib_submissions') || '[]'); list.unshift(rec); IB.safeSet('ib_submissions', JSON.stringify(list.slice(0, 300))); } catch (err) { /* */ }
        IB.safeDel(AUTO);
        const lines = all.filter((f) => f.type !== 'heading' && cond(f)).map((f) => (f.item ? (V[f.key] || []).map((it, i) => `${f.item.title || ''} ${i + 1}: ${f.item.fields.map((sf) => fmtVal(sf, it[sf.key])).filter(Boolean).join(' · ')}`).join('\n') : `${f.label}: ${fmtVal(f, V[f.key])}`)).join('\n');
        const mail = `mailto:${S.contact.ibEmail}?subject=${encodeURIComponent(`${schema.title}: ${rec.title} (${rec.id})`)}&body=${encodeURIComponent(lines)}`;
        form.innerHTML = `<div class="done-screen"><svg class="check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45"/><path d="M30 52 L44 66 L71 37"/></svg>
          <h2>وصلتنا فكرتك! شكرًا لك</h2><p style="color:var(--muted);max-width:30em;margin:0 auto">«${esc(rec.title)}» الآن لدى فريق بنك المبادرات، وسيتواصل مع شخص التواصل بعد دراسة الطلب.</p>
          <div>رقم الطلب</div><span class="ref">${rec.id}</span>
          ${sent ? '' : `<p style="color:var(--muted);font-size:14px">لضمان الوصول، أرسل نسخة من طلبك بالبريد الإلكتروني أيضًا${(V.files || []).length ? ' وأرفق ملفاتك بها' : ''}.</p>`}
          <div class="acts">${sent ? '' : `<a class="btn btn-primary" href="${mail}">${icon('mail')} إرسال نسخة بالبريد</a>`}<a class="btn btn-outline" href="${url('initiatives.html')}">تصفّح المبادرات</a></div></div>`;
        tip('check', 'ماذا بعد؟', 'يدرس الفريق الطلبات بشكل دوري. احتفظ برقم الطلب للمتابعة.');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      sync(); show(Math.min(V._step || 0, steps.length - 1));
    }

    const want = LIST.find((f) => f.id === qs('form'));
    if (want) wizard(want); else if (LIST.length === 1) wizard(LIST[0]); else gateway();
  }

  /* ====================== بنك الأفكار ====================== */
  function ideas() {
    setTitle('بنك الأفكار', 'استكشف وشارك الأفكار المُلهمة التي قدمها الآخرون');
    const list = live(D.ideas || []);
    main.innerHTML = pageHero('بنك الأفكار', 'استكشف وشارك الأفكار المُلهمة التي قدمها الآخرون، وابنِ عليها مبادرتك القادمة.', [['بنك الأفكار']]) + `
    <section class="section" style="padding-top:44px"><div class="wrap">
      ${list.length ? `<div class="grid grid-3">${list.map((x) => `<article class="card reveal"><div class="body"><div class="chips-row">${(x.domains || []).map((d) => `<span class="pill">${esc(d)}</span>`).join(' ')}</div><h3>${esc(x.title)}</h3><p class="desc">${esc(x.summary)}</p>${x.location ? `<div class="meta"><span>${icon('pin')}${esc(x.location)}</span></div>` : ''}</div></article>`).join('')}</div>`
        : `<div class="empty">${icon('bulb', 'ic')}<h3 style="margin-top:12px">بنك الأفكار يستقبل أفكاركم</h3><p>لم تُنشر أفكار بعد. كن أول من يشارك فكرة تخدم مجتمعه.</p><a class="btn btn-primary" href="${url('submit.html')}">قدّم فكرتك</a></div>`}
      <div style="margin-top:60px">${ctaHTML()}</div>
    </div></section>`;
  }

  function legal(key) {
    const L = S.legal[key];
    setTitle(L.title);
    main.innerHTML = pageHero(L.title, 'آخر تحديث: ' + fmtDate(L.updated), [[L.title]]) + `<div class="wrap"><article class="article prose">${L.content}</article></div>`;
  }

  function notFound(m) {
    setTitle('الصفحة غير موجودة');
    main.innerHTML = pageHero('الصفحة غير موجودة', m || 'الرابط الذي فتحته غير صحيح أو تم نقله.') + `<section class="section"><div class="wrap" style="text-align:center"><a class="btn btn-primary" href="${url('initiatives.html')}">العودة إلى مكتبة المبادرات</a></div></section>`;
  }

  const routes = { home, ideas, initiatives: library, initiative, news, post, about, partners, support, contact, submit, privacy: () => legal('privacy'), terms: () => legal('terms'), '404': () => notFound() };
  const activeNav = { initiative: 'initiatives', post: 'news' }[page] || page;
  IB.mountChrome(activeNav);
  (routes[page] || notFound)();
  if (!document.querySelector('script[data-ld]')) {
    const h1 = document.querySelector('main h1');
    ld(page === 'home' ? null : crumbsLD([[h1 ? h1.textContent.trim() : document.title, abs((location.pathname.split('/').pop()) || '')]]));
  }
  if (!document.querySelector('link[rel="canonical"]')) setTitle(null);
  IB.reveal();
  IB.countUp();
})();
