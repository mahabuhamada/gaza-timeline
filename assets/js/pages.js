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

  const initUrl = (i) => url('initiative.html?id=' + i.id);
  const postUrl = (p) => url('post.html?id=' + p.id);
  const count = (arr, f) => arr.reduce((m, x) => { [].concat(f(x) || []).forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; }); return m; }, {});
  const sortedKeys = (m) => Object.keys(m).sort((a, b) => m[b] - m[a]);

  function setTitle(t, desc) {
    document.title = t ? `${t} | ${S.brand.name}` : `${S.brand.name} | ${S.brand.tagline}`;
    if (desc) { let m = document.querySelector('meta[name="description"]'); if (m) m.content = desc; }
  }

  function pageHero(title, lead, crumbs) {
    return `<section class="page-hero"><div class="wrap"><div class="box">
      <nav class="crumbs" aria-label="مسار التنقل"><a href="${url('index.html')}">الرئيسية</a>${(crumbs || []).map((c) => `<span aria-hidden="true">/</span>${c[1] ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span>${esc(c[0])}</span>`}`).join('')}</nav>
      <h1>${esc(title)}</h1>${lead ? `<p>${esc(lead)}</p>` : ''}</div></div></section>`;
  }

  function initCard(i) {
    return `<article class="card reveal">
      <div class="media"><img src="${src(i.cover)}" alt="" loading="lazy">
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
      <div class="media"><img src="${src(p.cover)}" alt="" loading="lazy">
        <div class="badges"><span class="pill ${p.kind === 'call' ? 'yellow' : 'blue'}">${p.kind === 'call' ? 'دعوة مفتوحة' : 'قصة مبادرة'}</span></div></div>
      <div class="body">
        <span class="date">${fmtDate(p.date)}</span>
        <h3><a href="${postUrl(p)}">${esc(p.title)}</a></h3>
        <p class="desc">${esc(p.excerpt)}</p>
        <span class="more">اقرأ المزيد ${icon('arrowL')}</span>
      </div></article>`;
  }

  const statsHTML = () => `<div class="stats">${S.stats.map((s) => `<div class="stat reveal">${icon(s.icon, 'ic')}<div class="num" data-count="${s.value}" data-plus="1">0</div><div class="lbl">${esc(s.label)}</div></div>`).join('')}</div>`;
  const valuesHTML = () => `<div class="values">${S.values.map((v) => `<div class="value reveal"><div class="ic">${icon(v.icon)}</div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join('')}</div>`;
  const partnersHTML = () => `<div class="partners">${S.partners.map((p) => `<a class="partner reveal" href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(p.name)}"><img src="${src(p.logo)}" alt="${esc(p.name)}" loading="lazy"></a>`).join('')}</div>`;
  const ctaHTML = () => `<div class="cta reveal"><div><h2>عندك فكرة تخدم مجتمعك؟</h2><p>${esc(S.submit.intro)}</p></div><a class="btn btn-light" href="${url('submit.html')}">${icon('bulb')} قدّم فكرتك الآن</a></div>`;

  /* ====================== الرئيسية ====================== */
  function home() {
    setTitle('', S.brand.intro);
    const feat = INITS.filter((i) => i.featured).concat(INITS.filter((i) => !i.featured)).slice(0, 5);
    const themes = count(INITS, (i) => i.themes);
    const topThemes = sortedKeys(themes).slice(0, 4);
    const projects = count(INITS, (i) => i.project);
    const pk = sortedKeys(projects).slice(0, 2);
    const latest = [...POSTS.map((p) => ({ t: 'post', d: p.date, x: p })), ...INITS.map((i) => ({ t: 'init', d: i.date, x: i }))].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 4);
    const stats = S.stats;
    const statCls = ['c-orange', 'c-yellow', 'c-blue'];
    const N = INITS.length || 1;
    const pct = (f) => Math.round((INITS.filter(f).length / N) * 1000) / 10;
    const ind = [
      [pct((i) => /إعاقة/.test(i.audience + (i.audienceGroups || []).join() + (i.themes || []).join())), 'من المبادرات تستهدف الأشخاص ذوي الإعاقة أو تدمجهم', 'تعمل على المواءمة والوصول بكرامة وإشراك الأشخاص ذوي الإعاقة في الأنشطة.'],
      [pct((i) => /مخيم|إيواء|نزوح|نازح/.test(i.location + i.audience + i.summary)), 'نُفذت في مخيمات النزوح ومراكز الإيواء', 'وصلت المبادرات إلى الناس حيث يعيشون اليوم: الخيام ومراكز الإيواء.'],
      [pct((i) => (i.themes || []).includes('دعم نفسي وترفيهي')), 'تقدّم دعمًا نفسيًا ومساحات آمنة', 'مساحات للتفريغ واستعادة التوازن للأطفال واليافعين والشباب.'],
      [pct((i) => (i.gallery || []).length > 0 || (i.team || []).length > 0), 'موثّقة بالصور وبأسماء فرقها', 'كل مبادرة موثّقة بقصتها وصورها وأسماء المبادرين الذين نفّذوها.'],
    ];
    const ticker = ['شباب يصنعون الواقع', 'من الفكرة إلى الأثر', 'مساحات آمنة للجميع', 'الوصول بكرامة', 'مبادرات يقودها الشباب', 'نبادر لنصنع غدًا أفضل'];
    const tIcons = ['spark', 'bulb', 'hands', 'people', 'rocket', 'globe'];
    const tickerRow = ticker.map((t, k) => `<span><i>${icon(tIcons[k % tIcons.length])}</i>${esc(t)}</span>`).join('');
    const partnerSats = S.partners.slice(0, 6);
    const angles = [270, 330, 30, 90, 150, 210];
    const trackColors = ['t1', 't2'];
    const ghost = (k) => (/A4A|الوصول/.test(k) ? 'A4A' : /Youth/i.test(k) ? 'YOUTH HUB' : 'IB');

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
    const slides = [{ cover: S.heroImages[0], title: S.brand.tagline, href: url('about.html'), tag: 'بنك المبادرات' }]
      .concat(feat.slice(0, 4).map((i) => ({ cover: i.cover, title: i.title, href: initUrl(i), tag: 'مبادرة' })));

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
        <div class="hero-stats">${stats.slice(0, 3).map((s, k) => `<div><b class="${statCls[k]}" data-count="${s.value}" data-plus="1">0</b><span>${esc(s.label)}</span></div>`).join('')}</div>
      </div>
      <div class="hero-photo">
        <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
          <clipPath id="liq" clipPathUnits="objectBoundingBox"><path d="${LQ[0]}"><animate attributeName="d" dur="11s" repeatCount="indefinite" values="${[LQ[0], LQ[1], LQ[2], LQ[3], LQ[0]].join(';')}" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/></path></clipPath>
          <clipPath id="liq2" clipPathUnits="objectBoundingBox"><path d="${LQ[2]}"><animate attributeName="d" dur="13s" repeatCount="indefinite" values="${[LQ[2], LQ[3], LQ[0], LQ[1], LQ[2]].join(';')}" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/></path></clipPath>
        </defs></svg>
        <div class="liquid"><span class="liq-glow"></span><span class="liq-back"></span>
          <div class="frame">${slides.map((im, k) => `<img src="${src(im.cover)}" alt=""${k ? ' loading="lazy"' : ' class="on" fetchpriority="high"'}>`).join('')}</div>
        </div>
        <div class="cap"><span class="pill">${esc(slides[0].tag)}</span><a id="capLink" href="${slides[0].href}"><span id="capT">${esc(slides[0].title)}</span></a></div>
        <div class="dots" role="tablist" aria-label="صور الواجهة">${slides.map((i, k) => `<button role="tab" aria-label="${esc(i.title)}" aria-current="${!k}" data-k="${k}"></button>`).join('')}</div>
      </div>
    </div></section>

    <div class="ticker" aria-hidden="true"><div class="ticker-track">${tickerRow}${tickerRow}${tickerRow}${tickerRow}</div></div>

    <section class="section"><div class="wrap">
      <div class="sec-head"><div><h2>الآن في البنك</h2><p>أحدث ما نُشر من الميدان: مبادرات منفّذة، ودعوات مفتوحة للتقديم.</p></div><a class="link-btn" href="${url('news.html')}">كل الإعلانات ${icon('arrowL')}</a></div>
      <div class="timeline">${latest.map(({ t, x }) => `<div class="tl-item reveal"><span class="when">${fmtDate(x.date)}</span>
        <article class="card"><div class="media"><img src="${src(x.cover)}" alt="" loading="lazy"></div><div class="body">
          <span class="pill ${t === 'post' ? (x.kind === 'call' ? 'yellow' : 'blue') : ''}" style="align-self:flex-start">${t === 'post' ? (x.kind === 'call' ? 'دعوة مفتوحة' : 'خبر') : 'مبادرة'}</span>
          <h3><a href="${t === 'post' ? postUrl(x) : initUrl(x)}">${esc(x.title)}</a></h3>
          <span class="more">اقرأ ${icon('arrowL')}</span></div></article></div>`).join('')}</div>
    </div></section>

    <section class="section" style="padding-top:20px"><div class="wrap">
      <div class="sec-head"><div><h2>لكل تحدٍّ مبادرة</h2><p>مجالات يعمل فيها المبادرون، من الدعم النفسي إلى الصحة والتوعية والفنون.</p></div><a class="link-btn" href="${url('initiatives.html')}">كل المجالات ${icon('arrowL')}</a></div>
      <div class="panels">${topThemes.map((th, k) => { const i = INITS.find((x) => (x.themes || []).includes(th) && x.cover) || INITS[k]; const n = themes[th];
        return `<a class="panel${k ? '' : ' on'}" href="${url('initiatives.html?theme=' + encodeURIComponent(th))}"><img src="${src(i.cover)}" alt="" loading="lazy"><span class="ic">${icon(['hands', 'bulb', 'spark', 'people'][k % 4])}</span>
          <div class="txt"><small>${n} مبادرة</small><h3>${esc(th)}</h3><p>${esc(i.summary)}</p><span class="go">استكشف المبادرات ${icon('arrowL')}</span></div><span class="bar"></span></a>`; }).join('')}</div>
    </div></section>

    <section class="section" style="padding-top:10px"><div class="impact reveal">
      <div class="impact-head"><div class="who"><span class="logo"><img src="${src(S.brand.icon)}" alt=""></span><div><h2>أثر المبادرات بالأرقام</h2><p>قراءة في ${INITS.length} مبادرة موثّقة في مكتبة بنك المبادرات</p></div></div>
        <span class="impact-tag">آخر تحديث <b>${fmtDate(INITS[0].date)}</b></span></div>
      <div class="impact-body">
        <div class="impact-big"><div><div class="num" id="impN">${ind[0][0]}%</div><h3 id="impT">${esc(ind[0][1])}</h3><p id="impD">${esc(ind[0][2])}</p></div><div class="matrix" id="mx" aria-hidden="true">${Array.from({ length: 100 }, () => '<i></i>').join('')}</div></div>
        <div class="impact-list" role="group" aria-label="المؤشرات">${ind.map(([v, l], k) => `<button type="button" data-k="${k}" aria-pressed="${!k}"><b style="color:${['#F2B12E', '#F68B47', '#5AB0EA', '#7BD8C7'][k]}">${v}%</b><span>${esc(l)}</span></button>`).join('')}</div>
      </div>
      <div class="impact-foot"><p>تُحسب المؤشرات تلقائيًا من بيانات المكتبة، وتتحدث كلما أُضيفت مبادرة جديدة من لوحة التحكم.</p><a class="btn btn-glass btn-sm" href="${url('initiatives.html')}">${icon('grid')} تصفّح المكتبة</a></div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="sec-head"><div><h2>قصص تصنع الفرق</h2><p>شباب وشابات حوّلوا التحدي إلى مساحة أمل في الخيام ومراكز الإيواء.</p></div><a class="link-btn" href="${url('initiatives.html')}">كل القصص ${icon('arrowL')}</a></div>
      <div class="stories-grid">
        <a class="feat reveal" href="${initUrl(feat[0])}"><img src="${src(feat[0].cover)}" alt="" loading="lazy"><div class="in"><span class="pill yellow">${esc((feat[0].themes || [])[0] || 'مبادرة')}</span><h3>${esc(feat[0].title)}</h3><p>${esc(feat[0].summary)}</p><span class="btn btn-white btn-sm">اقرأ القصة كاملة ${icon('arrowL')}</span></div></a>
        <div class="side-list reveal">${INITS.filter((i) => i !== feat[0]).slice(0, 5).map((i) => `<a href="${initUrl(i)}"><img src="${src(i.cover)}" alt="" loading="lazy"><div><small>${esc(i.governorate || '')} · ${esc((i.themes || [])[0] || '')}</small><b>${esc(i.title)}</b></div></a>`).join('')}</div>
      </div>
    </div></section>

    <section class="section" style="padding-top:20px"><div class="wrap">
      <div class="sec-head"><div><h2>مساراتنا</h2><p>أطر تعمل ضمنها المبادرات مع شركائنا، ولكل مسار فريقه وأثره.</p></div><a class="link-btn" href="${url('partners.html')}">الشركاء ${icon('arrowL')}</a></div>
      <div class="tracks">${pk.map((k, n) => { const its = INITS.filter((i) => i.project === k); const im = its.find((i) => i.cover) || INITS[0]; const govs = new Set(its.map((i) => i.governorate).filter(Boolean)).size; const ph = its.reduce((s, i) => s + (i.gallery || []).length, 0);
        return `<article class="track ${trackColors[n % 2]} reveal"><span class="ghost">${ghost(k)}</span><div class="txt"><span class="pill ${n % 2 ? 'blue' : ''}" style="align-self:flex-start">مسار</span><h3>${esc(k)}</h3>
          <p>${/A4A|الوصول/.test(k) ? 'مبادرات شبابية تعزّز إدماج الأشخاص ذوي الإعاقة واستقلاليتهم في قطاع غزة، بالشراكة مع جمعية العون الطبي للفلسطينيين.' : 'مبادرات يقودها متطوعو المساحة الشبابية في المنتدى، تركّز على التوعية الصحية والدعم النفسي والفنون.'}</p>
          <div class="nums"><span><b>${its.length}</b>مبادرة</span><span><b>${govs}</b>محافظات</span><span><b>${ph}</b>صورة</span></div>
          <a class="btn btn-primary btn-sm" href="${url('initiatives.html?project=' + encodeURIComponent(k))}">اكتشف المسار ${icon('arrowL')}</a></div>
          <div class="img"><img src="${src(im.cover)}" alt="" loading="lazy"></div></article>`; }).join('')}</div>
    </div></section>

    <section class="section" style="padding-top:20px"><div class="wrap">
      <div class="sec-head"><div><h2>مكتبة المبادرات</h2><p>${INITS.length} مبادرة موثّقة بأهدافها وأنشطتها وصورها وفرقها، مصنّفة حسب المحافظة والمجال.</p></div><a class="link-btn" href="${url('initiatives.html')}">تصفّح المكتبة كاملة ${icon('arrowL')}</a></div>
      <div class="shelf">
        <div class="shelf-nav" role="group" aria-label="تصفية حسب المحافظة"><button type="button" data-g="" aria-pressed="true">كل المبادرات <span>${INITS.length}</span></button>${sortedKeys(count(INITS, (i) => i.governorate)).map((g) => `<button type="button" data-g="${esc(g)}" aria-pressed="false">${esc(g)} <span>${INITS.filter((i) => i.governorate === g).length}</span></button>`).join('')}</div>
        <div class="covers" id="covers"></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap world">
      <div class="orbit reveal" aria-hidden="true"><span class="ring r1"></span><span class="ring r2"></span><span class="core"><img src="${src(S.brand.icon)}" alt=""></span>
        ${partnerSats.map((p, k) => { const a = (angles[k] * Math.PI) / 180; const r = 50; return `<span class="sat" style="right:${50 + r * Math.cos(a)}%;top:${50 + r * Math.sin(a)}%"><img src="${src(p.logo)}" alt=""></span>`; }).join('')}
        ${['SDF Youth Hub', 'A4A'].map((t, k) => { const a = (angles[4 + k] * Math.PI) / 180; return `<span class="sat" style="right:${50 + 50 * Math.cos(a)}%;top:${50 + 50 * Math.sin(a)}%">${t}</span>`; }).join('')}
      </div>
      <div>
        <div class="sec-head" style="margin-bottom:10px"><div><h2>عالم بنك المبادرات</h2><p>شبكة من الشركاء والمساحات الشبابية التي تحتضن المبادرات وتدعمها، ولكل منها دور في رحلة الفكرة.</p></div></div>
        <div class="world-list">${S.partners.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(p.name)}</b><small>${esc(p.role)}</small></a>`).join('')}
          <div><b>SDF Youth Hub</b><small>مساحة شبابية للمبادرات والتطوع</small></div><div><b>شبكة الوصول للجميع (A4A)</b><small>متطوعون من أجل الدمج والمواءمة</small></div></div>
        <a class="btn btn-white btn-sm" href="${url('about.html')}">تعرّف علينا ${icon('arrowL')}</a>
      </div>
    </div></section>

    <section class="section" style="padding-top:10px"><div class="wrap">
      <div class="sec-head center"><div><h2>شارك في صناعة التغيير</h2></div></div>
      <div class="join">
        <a href="${url('submit.html')}" class="reveal"><span class="ic">${icon('bulb')}</span><b>قدّم فكرتك</b><small>حوّل فكرتك إلى مبادرة على أرض الواقع</small></a>
        <a href="${url('submit.html?form=pwd')}" class="reveal"><span class="ic">${icon('people')}</span><b>مبادرة دامجة</b><small>نموذج خاص لمبادرات الأشخاص ذوي الإعاقة</small></a>
        <a href="${url('support.html')}" class="reveal"><span class="ic">${icon('hands')}</span><b>كن شريكًا</b><small>ادعم المبادرات بالموارد والخبرات</small></a>
        <a href="${url('ideas.html')}" class="reveal"><span class="ic">${icon('spark')}</span><b>بنك الأفكار</b><small>استلهم من أفكار الآخرين وابنِ عليها</small></a>
      </div>
    </div></section>`;

    // سلايدر الصورة الرئيسية
    let cur = 0; const imgs = main.querySelectorAll('.liquid .frame img'); const dots = main.querySelectorAll('.dots button');
    const show = (k) => { cur = k; imgs.forEach((im, n) => im.classList.toggle('on', n === k)); dots.forEach((d, n) => d.setAttribute('aria-current', n === k)); document.getElementById('capT').textContent = slides[k].title; document.getElementById('capLink').href = slides[k].href; };
    dots.forEach((d) => d.addEventListener('click', () => { show(+d.dataset.k); clearInterval(timer); }));
    const timer = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : setInterval(() => show((cur + 1) % slides.length), 5500);
    // مؤشرات الأثر
    const mx = [...document.querySelectorAll('#mx i')];
    const setInd = (k) => { const [v, l, d] = ind[k]; document.getElementById('impN').textContent = v + '%'; document.getElementById('impT').textContent = l; document.getElementById('impD').textContent = d; mx.forEach((m, n) => m.classList.toggle('on', n < Math.round(v))); document.querySelectorAll('.impact-list button').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.k === k)); };
    document.querySelectorAll('.impact-list button').forEach((b) => b.addEventListener('click', () => setInd(+b.dataset.k)));
    setInd(0);
    // المكتبة المصغّرة
    const covers = document.getElementById('covers');
    const renderCovers = (g) => { covers.innerHTML = INITS.filter((i) => !g || i.governorate === g).slice(0, 8).map((i) => `<a class="cover-card" href="${initUrl(i)}"><img src="${src(i.cover)}" alt="" loading="lazy"><span class="pill glass pin">${esc(i.governorate || '')}</span><span class="in"><small>${esc((i.themes || [])[0] || 'مبادرة')}</small><b>${esc(i.title)}</b></span></a>`).join(''); };
    document.querySelectorAll('.shelf-nav button').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.shelf-nav button').forEach((x) => x.setAttribute('aria-pressed', x === b)); renderCovers(b.dataset.g); }));
    renderCovers('');
  }

  /* ====================== مكتبة المبادرات ====================== */
  function library() {
    setTitle('مكتبة المبادرات', 'استكشف مبادرات الشباب والمجتمع في قطاع غزة.');
    const facets = [
      ['governorate', 'المحافظة', (i) => i.governorate],
      ['theme', 'المجال', (i) => i.themes],
      ['audience', 'الفئة المستهدفة', (i) => i.audienceGroups],
      ['project', 'المسار / المشروع', (i) => i.project],
      ['year', 'السنة', (i) => i.date.slice(0, 4)],
    ];
    const p = new URLSearchParams(location.search);
    const state = { q: p.get('q') || '', sort: p.get('sort') || 'new', view: IB.safeGet('ib_view') || 'grid' };
    facets.forEach(([k]) => { state[k] = p.getAll(k); });

    main.innerHTML = pageHero('مكتبة المبادرات', 'استكشف مبادرات الشباب والمجتمع، وتعرّف على الأفكار التي تحوّل التحديات إلى فرص حقيقية للتغيير.', [['مكتبة المبادرات']]) + `
    <section class="section" style="padding-top:44px"><div class="wrap library">
      <aside class="filters" id="filters" aria-label="تصفية المبادرات">
        <h3>تصفية النتائج <button class="reset" type="button" id="reset">مسح الكل</button></h3>
        <div class="search">${icon('search')}<label class="sr-only" for="q">بحث</label><input class="input" id="q" type="search" placeholder="ابحث باسم المبادرة أو المكان…" value="${esc(state.q)}"></div>
        ${facets.map(([k, label, f]) => {
          const m = count(INITS, f);
          const keys = k === 'year' ? Object.keys(m).sort().reverse() : sortedKeys(m);
          return `<fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label">${label}</legend><div class="check-list">${keys.map((v) => `<label class="check"><input type="checkbox" name="${k}" value="${esc(v)}"${state[k].includes(v) ? ' checked' : ''}>${esc(v)}<span class="n">${m[v]}</span></label>`).join('')}</div></fieldset>`;
        }).join('')}
        <button class="btn btn-primary filter-toggle" type="button" data-close>عرض النتائج</button>
      </aside>
      <div>
        <div class="toolbar">
          <div class="count" aria-live="polite" id="count"></div>
          <div class="right">
            <button class="btn btn-ghost btn-sm filter-toggle" type="button" data-open>${icon('filter')} تصفية</button>
            <label class="sr-only" for="sort">ترتيب</label>
            <select class="select" id="sort" style="width:auto"><option value="new">الأحدث أولاً</option><option value="old">الأقدم أولاً</option><option value="az">العنوان (أ–ي)</option><option value="za">العنوان (ي–أ)</option></select>
            <div class="seg" role="group" aria-label="طريقة العرض"><button type="button" data-view="grid" aria-label="شبكة">${icon('grid')}</button><button type="button" data-view="list" aria-label="قائمة">${icon('list')}</button></div>
          </div>
        </div>
        <div class="grid grid-3" id="results"></div>
      </div>
    </div></section>`;

    const $ = (id) => document.getElementById(id);
    $('sort').value = state.sort;
    const filters = $('filters');
    document.querySelector('[data-open]').onclick = () => filters.classList.add('open');
    document.querySelector('[data-close]').onclick = () => filters.classList.remove('open');

    function apply() {
      const q = state.q.trim().toLowerCase();
      let r = INITS.filter((i) => {
        if (q && ![i.title, i.summary, i.location, i.audience, i.type].join(' ').toLowerCase().includes(q)) return false;
        return facets.every(([k, , f]) => !state[k].length || [].concat(f(i) || []).some((v) => state[k].includes(v)));
      });
      const cmp = { new: (a, b) => b.date.localeCompare(a.date), old: (a, b) => a.date.localeCompare(b.date), az: (a, b) => a.title.localeCompare(b.title, 'ar'), za: (a, b) => b.title.localeCompare(a.title, 'ar') }[state.sort];
      r.sort(cmp);
      $('count').innerHTML = `<b>${r.length}</b> من أصل ${INITS.length} مبادرة`;
      const res = $('results');
      res.classList.toggle('list-view', state.view === 'list');
      res.innerHTML = r.length ? r.map(initCard).join('') : `<div class="empty" style="grid-column:1/-1">لا توجد مبادرات مطابقة. جرّب تغيير خيارات التصفية.</div>`;
      res.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
      document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === state.view));
      const u = new URLSearchParams();
      if (state.q) u.set('q', state.q);
      if (state.sort !== 'new') u.set('sort', state.sort);
      facets.forEach(([k]) => state[k].forEach((v) => u.append(k, v)));
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
    }
    $('q').addEventListener('input', (e) => { state.q = e.target.value; apply(); });
    $('sort').addEventListener('change', (e) => { state.sort = e.target.value; apply(); });
    filters.addEventListener('change', (e) => { if (e.target.type === 'checkbox') { state[e.target.name] = [...filters.querySelectorAll(`input[name="${e.target.name}"]:checked`)].map((x) => x.value); apply(); } });
    document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { state.view = b.dataset.view; IB.safeSet('ib_view', state.view); apply(); }));
    $('reset').onclick = () => { state.q = ''; $('q').value = ''; facets.forEach(([k]) => { state[k] = []; }); filters.querySelectorAll('input[type=checkbox]').forEach((c) => { c.checked = false; }); apply(); };
    apply();
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
    const i = INITS.find((x) => String(x.id) === qs('id') || x.slug === qs('slug'));
    if (!i) return notFound('لم نعثر على هذه المبادرة.');
    setTitle(i.title, i.summary);
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
    const p = POSTS.find((x) => String(x.id) === qs('id'));
    if (!p) return notFound('لم نعثر على هذا الخبر.');
    setTitle(p.title, p.excerpt);
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
    <section class="section"><div class="wrap split">
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
  function submit() {
    setTitle('قدّم فكرتك', S.submit.intro);
    const F = S.submit; const AUTO = 'ib_form_autosave';
    const STEPS = [
      ['البداية', 'flag'], ['المبادرة', 'bulb'], ['التفاصيل', 'list'], ['الفريق', 'team'], ['المراجعة', 'check'],
    ];
    const TIPS = [
      ['اختر النموذج المناسب', 'النموذج الخاص بذوي الإعاقة يسألك عن المواءمة والترتيبات التيسيرية، ليصل الجميع إلى مبادرتك بكرامة.'],
      ['عنوان يشرح نفسه', 'اختر اسمًا قصيرًا يعبّر عن المشكلة والحل معًا، مثل «دوري المعرفة.. مفاهيم صحية لليافعين».'],
      ['كن محددًا', 'اكتب المشكلة كما تراها في الميدان، والأهداف بنقاط واضحة يمكن قياسها، والأنشطة مع مدة كل نشاط.'],
      ['فريق صغير متكامل', 'يكفي من شخص إلى خمسة أشخاص. شخص التواصل هو من سيتواصل معه فريق بنك المبادرات.'],
      ['راجع قبل الإرسال', 'تأكد من البيانات وطرق التواصل. يصلك تأكيد برقم الطلب، ويتواصل معك الفريق بعد دراسته.'],
    ];
    const opt = (name, v, type = 'checkbox') => `<label class="opt"><input type="${type}" name="${name}" value="${esc(v)}"><span>${esc(v)}</span></label>`;
    const counter = (id, max) => `<small data-cnt="${id}" data-max="${max}">0 / ${max}</small>`;
    const member = (n) => `<div class="mcard" data-n="${n}"><header><span class="av">${n}</span><div><b>${n === 1 ? 'شخص التواصل' : 'عضو الفريق ' + n}</b><small>${n === 1 ? 'سيتواصل معه فريق بنك المبادرات' : 'اختياري: تاريخ الميلاد'}</small></div></header>
      <div class="grid2"><div class="q"><label for="m${n}_name">الاسم الكامل</label><input class="fin" id="m${n}_name" name="m${n}_name" autocomplete="name" data-req><div class="err">اكتب الاسم</div></div>
      <div class="q"><label for="m${n}_dob">تاريخ الميلاد</label><input class="fin" type="date" id="m${n}_dob" name="m${n}_dob"></div>
      <div class="q"><label for="m${n}_phone">رقم الجوال</label><input class="fin" type="tel" dir="ltr" id="m${n}_phone" name="m${n}_phone" autocomplete="tel" placeholder="059XXXXXXX" data-req data-phone><div class="err">رقم جوال صحيح من 9 أرقام على الأقل</div></div>
      <div class="q"><label for="m${n}_email">البريد الإلكتروني</label><input class="fin" type="email" dir="ltr" id="m${n}_email" name="m${n}_email" autocomplete="email" placeholder="name@example.com" data-req data-email><div class="err">بريد إلكتروني صحيح</div></div></div></div>`;

    main.innerHTML = pageHero(F.title, F.intro, [['قدّم فكرتك']]) + `
    <section class="section" style="padding-top:40px"><div class="wrap wiz-shell">
      <form class="wiz" id="idea" novalidate>
        <div class="wiz-top"><ol class="wiz-steps">${STEPS.map(([t, ic], k) => `<li data-k="${k}"><span class="d">${k + 1}</span>${t}</li>`).join('')}</ol><div class="wiz-bar"><i id="bar"></i></div></div>
        <div class="wiz-body" id="body">
          <fieldset class="wstep" data-step="0"><legend>لنبدأ</legend><p class="lead">التقديم مجاني ويستغرق نحو 10 دقائق، ويُحفظ ما تكتبه تلقائيًا على جهازك.</p>
            <div class="kind" role="radiogroup" aria-label="نوع النموذج">
              <label><input type="radio" name="form" value="general" checked><span class="ki">${icon('people')}</span><span><b>مبادرة مجتمعية</b><small>للشباب والنساء والأطفال وغيرهم من الفئات.</small></span><span class="tick"></span></label>
              <label><input type="radio" name="form" value="pwd"><span class="ki">${icon('hands')}</span><span><b>مبادرة دامجة لذوي الإعاقة</b><small>تراعي المواءمة والترتيبات التيسيرية والمشاركة الفاعلة.</small></span><span class="tick"></span></label>
            </div>
            <div class="q consent2"><b>قبل البدء</b><ul>${F.consent.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
              <label class="switch-row"><input type="checkbox" name="consent" data-req-check><span class="sw"></span><span>قرأت ما سبق وأوافق على جمع البيانات لهذا الغرض، وحصلت على موافقة أعضاء الفريق.</span></label>
              <div class="err">يلزم الموافقة للمتابعة</div></div>
          </fieldset>

          <fieldset class="wstep" data-step="1"><legend>عن المبادرة</legend><p class="lead">عرّفنا بفكرتك: ماذا، وأين، ولمن.</p>
            <div class="q"><label for="title">اسم المبادرة ${counter('title', 90)}</label><input class="fin" id="title" name="title" maxlength="90" placeholder="مثال: مساحة فرح.. فضاء آمن للأطفال" data-req><div class="err">اكتب اسمًا للمبادرة</div></div>
            <div class="q" data-group="domains"><span class="ql">مجال المبادرة <small>اختر مجالًا أو أكثر</small></span><div class="opts">${F.domains.map((d) => opt('domains', d)).join('')}</div><div class="err">اختر مجالًا واحدًا على الأقل</div></div>
            <div class="grid2">
              <div class="q"><label for="location">مكان التنفيذ</label><input class="fin" id="location" name="location" placeholder="المحافظة، المنطقة، المخيم أو المركز" data-req><div class="err">حدّد مكان التنفيذ</div></div>
              <div class="q"><label for="duration">مدة التنفيذ</label><input class="fin" id="duration" name="duration" placeholder="مثال: 3 أيام" data-req><div class="quick" data-for="duration">${['يوم واحد', '3 أيام', 'أسبوع', 'أسبوعان', 'شهر'].map((x) => `<button type="button">${x}</button>`).join('')}</div><div class="err">حدّد المدة</div></div>
            </div>
            <div class="q" data-group="audiences"><span class="ql">الفئات المستهدفة <small>اختر فئة أو أكثر</small></span><div class="opts">${F.audiences.map((d) => opt('audiences', d)).join('')}</div><div class="err">اختر فئة واحدة على الأقل</div></div>
            <div class="q pwd-only" hidden><label for="access">الترتيبات التيسيرية والمواءمة</label><textarea class="fin" id="access" name="access" placeholder="كيف ستضمن وصول الأشخاص ذوي الإعاقة ومشاركتهم؟ مكان موائم، لغة إشارة، مواصلات…"></textarea></div>
          </fieldset>

          <fieldset class="wstep" data-step="2"><legend>تفاصيل الفكرة</legend><p class="lead">هذا قلب الطلب. اكتب بلغتك البسيطة.</p>
            <div class="q"><label for="problem">ما المشكلة التي تعالجها المبادرة؟ ${counter('problem', 1200)}</label><textarea class="fin" id="problem" name="problem" maxlength="1200" placeholder="صف المشكلة كما تراها في مجتمعك، ومن يتأثر بها." data-req></textarea><div class="err">صف المشكلة</div></div>
            <div class="q"><label for="goals">أهداف المبادرة ${counter('goals', 900)}</label><textarea class="fin" id="goals" name="goals" maxlength="900" placeholder="هدف في كل سطر" data-req></textarea><div class="help">اكتب كل هدف في سطر مستقل.</div><div class="err">اكتب هدفًا واحدًا على الأقل</div></div>
            <div class="q"><label for="activities">الأنشطة ${counter('activities', 1500)}</label><textarea class="fin" id="activities" name="activities" maxlength="1500" placeholder="النشاط — الوصف — مدة التنفيذ" data-req></textarea><div class="err">اذكر أنشطة المبادرة</div></div>
            <div class="q"><label for="budget">الميزانية المتوقعة</label><div class="money"><input class="fin" id="budget" name="budget" inputmode="decimal" dir="ltr" placeholder="800" data-req><select class="fin" name="currency" aria-label="العملة"><option value="USD">دولار</option><option value="ILS">شيكل</option><option value="EUR">يورو</option></select></div><div class="err">اكتب الميزانية التقديرية</div></div>
          </fieldset>

          <fieldset class="wstep" data-step="3"><legend>فريق المبادرة</legend><p class="lead">من سينفّذ الفكرة معك؟</p>
            <div class="q"><span class="ql">عدد أعضاء الفريق</span><div class="stepper"><button type="button" data-d="-1" aria-label="إنقاص">−</button><output id="tsOut">شخص واحد</output><button type="button" data-d="1" aria-label="زيادة">+</button></div><input type="hidden" name="teamSize" value="1"></div>
            <div class="members" id="members">${[1, 2, 3, 4, 5].map(member).join('')}</div>
          </fieldset>

          <fieldset class="wstep" data-step="4"><legend>راجع طلبك</legend><p class="lead">تأكد من البيانات، ويمكنك تعديل أي جزء قبل الإرسال.</p><div class="review" id="review"></div></fieldset>
        </div>
        <div class="wiz-nav">
          <button type="button" class="btn btn-outline" id="prev">${icon('arrowR')} السابق</button>
          <span class="saved" id="saved">حُفظت المسودة</span>
          <button type="button" class="btn btn-blue" id="next">التالي ${icon('arrowL')}</button>
          <button type="submit" class="btn btn-primary" id="send" hidden>${icon('send')} أرسل الطلب</button>
        </div>
      </form>
      <aside class="wiz-side">
        <div class="tip" id="tip"></div>
        <div class="side-card"><h3>أسئلة شائعة</h3>${F.faq.map((q) => `<details class="faq"><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join('')}</div>
      </aside>
    </div></section>`;

    const form = document.getElementById('idea'); const $ = (sel) => form.querySelector(sel);
    const steps = [...form.querySelectorAll('.wstep')]; let cur = 0;
    const NUM = ['شخص واحد', 'شخصان', 'ثلاثة أشخاص', 'أربعة أشخاص', 'خمسة أشخاص'];
    const syncTeam = () => { const n = +form.teamSize.value; document.getElementById('tsOut').textContent = NUM[n - 1]; form.querySelectorAll('.mcard').forEach((m) => { m.hidden = +m.dataset.n > n; }); form.querySelectorAll('.stepper button').forEach((b) => { b.disabled = (b.dataset.d < 0 && n <= 1) || (b.dataset.d > 0 && n >= 5); }); };
    const syncKind = () => { const pwd = form.form.value === 'pwd'; form.querySelectorAll('.pwd-only').forEach((e) => { e.hidden = !pwd; }); };
    const syncCounts = () => form.querySelectorAll('[data-cnt]').forEach((c) => { const el = form.querySelector('#' + c.dataset.cnt); c.textContent = `${el.value.length} / ${c.dataset.max}`; });
    const show = (k, back) => {
      steps.forEach((s, i) => { s.classList.toggle('on', i === k); s.classList.toggle('back', !!back); });
      form.querySelectorAll('.wiz-steps li').forEach((li, i) => { li.className = i < k ? 'done' : i === k ? 'now' : ''; li.querySelector('.d').innerHTML = i < k ? icon('check') : i + 1; });
      document.getElementById('bar').style.width = `${(k / (STEPS.length - 1)) * 100}%`;
      $('#prev').style.visibility = k ? 'visible' : 'hidden';
      $('#next').hidden = k === STEPS.length - 1; $('#send').hidden = k !== STEPS.length - 1;
      const [tt, tp] = TIPS[k]; const tip = document.getElementById('tip');
      tip.innerHTML = `<div class="tip-anim"><span class="ti">${icon(STEPS[k][1])}</span><b>${esc(tt)}</b><p>${esc(tp)}</p></div>`;
      if (k === STEPS.length - 1) renderReview();
      cur = k; save();
      if (window.scrollY > form.offsetTop) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const validate = (k) => {
      let ok = true; const st = steps[k];
      st.querySelectorAll('.q').forEach((q) => q.classList.remove('bad'));
      st.querySelectorAll('[data-req]').forEach((el) => { if (el.closest('[hidden]')) return; let good = el.value.trim().length > 0;
        if (good && el.dataset.email !== undefined) good = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        if (good && el.dataset.phone !== undefined) good = el.value.replace(/\D/g, '').length >= 9;
        if (!good) { el.closest('.q').classList.add('bad'); ok = false; } });
      st.querySelectorAll('[data-req-check]').forEach((el) => { if (!el.checked) { el.closest('.q').classList.add('bad'); ok = false; } });
      st.querySelectorAll('[data-group]').forEach((g) => { if (!g.querySelector('input:checked')) { g.classList.add('bad'); ok = false; } });
      if (!ok) { const first = st.querySelector('.q.bad'); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); const f = first.querySelector('input,textarea'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 300); }
      return ok;
    };
    const collect = () => { const o = {}; new FormData(form).forEach((v, k) => { if (k === 'domains' || k === 'audiences') (o[k] = o[k] || []).push(v); else o[k] = v; }); o.consent = form.consent.checked; o._step = cur; return o; };
    let t; const save = () => { clearTimeout(t); t = setTimeout(() => { IB.safeSet(AUTO, JSON.stringify(collect())); const s = $('#saved'); s.classList.add('on'); clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove('on'), 1800); }, 400); };
    const renderReview = () => {
      const o = collect(); const n = +o.teamSize;
      const sec = (title, k, rows) => `<div class="rv"><header><b>${title}</b><button type="button" data-go="${k}">تعديل</button></header><dl>${rows.filter((r) => r[1]).map(([l, v]) => `<dt>${l}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
      document.getElementById('review').innerHTML =
        sec('النموذج', 0, [['النوع', o.form === 'pwd' ? 'مبادرة دامجة لذوي الإعاقة' : 'مبادرة مجتمعية']]) +
        sec('المبادرة', 1, [['الاسم', o.title], ['المجالات', (o.domains || []).join('، ')], ['المكان', o.location], ['المدة', o.duration], ['الفئات', (o.audiences || []).join('، ')], ['المواءمة', o.form === 'pwd' ? o.access : '']]) +
        sec('التفاصيل', 2, [['المشكلة', o.problem], ['الأهداف', o.goals], ['الأنشطة', o.activities], ['الميزانية', o.budget ? `${o.budget} ${{ USD: 'دولار', ILS: 'شيكل', EUR: 'يورو' }[o.currency]}` : '']]) +
        sec('الفريق', 3, Array.from({ length: n }, (_, i) => [i ? `العضو ${i + 1}` : 'شخص التواصل', [o[`m${i + 1}_name`], o[`m${i + 1}_phone`], o[`m${i + 1}_email`]].filter(Boolean).join(' · ')]));
    };

    // استعادة المسودة
    try {
      const sv = JSON.parse(IB.safeGet(AUTO) || 'null');
      if (sv) Object.entries(sv).forEach(([k, v]) => form.querySelectorAll(`[name="${k}"]`).forEach((el) => { if (el.type === 'checkbox' || el.type === 'radio') el.checked = k === 'consent' ? !!v : [].concat(v).includes(el.value); else el.value = v; }));
      if (qs('form') === 'pwd') form.querySelector('[name=form][value=pwd]').checked = true;
      syncKind(); syncTeam(); syncCounts();
      show(sv && sv._step ? Math.min(sv._step, 3) : 0);
    } catch (e) { syncKind(); syncTeam(); show(0); }

    form.addEventListener('input', (e) => { const q = e.target.closest('.q'); if (q) q.classList.remove('bad'); syncCounts(); save(); });
    form.addEventListener('change', (e) => { if (e.target.name === 'form') syncKind(); const g = e.target.closest('[data-group]'); if (g) g.classList.remove('bad'); save(); });
    form.addEventListener('click', (e) => {
      const qb = e.target.closest('.quick button'); if (qb) { const inp = form.querySelector('#' + qb.parentElement.dataset.for); inp.value = qb.textContent; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      const sb = e.target.closest('.stepper button'); if (sb) { form.teamSize.value = Math.min(5, Math.max(1, +form.teamSize.value + +sb.dataset.d)); syncTeam(); save(); }
      const go = e.target.closest('[data-go]'); if (go) show(+go.dataset.go, true);
      const li = e.target.closest('.wiz-steps li.done'); if (li) show(+li.dataset.k, true);
    });
    $('#next').addEventListener('click', () => { if (validate(cur)) show(cur + 1); });
    $('#prev').addEventListener('click', () => show(cur - 1, true));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      for (let k = 0; k < STEPS.length - 1; k++) if (!validate(k)) { show(k, true); setTimeout(() => validate(k), 60); return; }
      const o = collect(); const members = [];
      for (let n = 1; n <= +o.teamSize; n++) members.push({ name: o[`m${n}_name`], dob: o[`m${n}_dob`], phone: o[`m${n}_phone`], email: o[`m${n}_email`] });
      const cur$ = { USD: 'دولار', ILS: 'شيكل', EUR: 'يورو' }[o.currency] || '';
      const rec = { id: 'IB-' + Date.now().toString(36).toUpperCase().slice(-6), receivedAt: new Date().toISOString(), status: 'new', form: o.form, title: o.title, domains: o.domains || [], location: o.location, duration: o.duration,
        audiences: o.audiences || [], problem: o.problem, goals: o.goals, activities: o.activities, budget: `${o.budget} ${cur$}`.trim(), access: o.form === 'pwd' ? (o.access || '') : '', members, notes: '' };
      const btn = $('#send'); btn.disabled = true; btn.innerHTML = 'جارٍ الإرسال…';
      const endpoint = (S.forms && S.forms.endpoint) || ''; let sent = false;
      if (endpoint) { try { const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(rec) }); sent = r.ok; } catch (err) { sent = false; } }
      try { const list = JSON.parse(IB.safeGet('ib_submissions') || '[]'); list.unshift(rec); IB.safeSet('ib_submissions', JSON.stringify(list)); } catch (err) { /* */ }
      IB.safeDel(AUTO);
      const mail = `mailto:${S.contact.ibEmail}?subject=${encodeURIComponent('فكرة مبادرة: ' + rec.title + ' (' + rec.id + ')')}&body=${encodeURIComponent(`اسم المبادرة: ${rec.title}\nالمجالات: ${rec.domains.join('، ')}\nالموقع: ${rec.location}\nالمدة: ${rec.duration}\nالفئات: ${rec.audiences.join('، ')}\n\nالمشكلة:\n${rec.problem}\n\nالأهداف:\n${rec.goals}\n\nالأنشطة:\n${rec.activities}\n\nالميزانية: ${rec.budget}\n\nالفريق:\n${members.map((m) => `${m.name} – ${m.phone} – ${m.email}`).join('\n')}`)}`;
      form.innerHTML = `<div class="done-screen"><svg class="check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45"/><path d="M30 52 L44 66 L71 37"/></svg>
        <h2>وصلتنا فكرتك! شكرًا لك</h2><p style="color:var(--muted);max-width:30em;margin:0 auto">«${esc(rec.title)}» الآن لدى فريق بنك المبادرات، وسيتواصل مع شخص التواصل بعد دراسة الطلب.</p>
        <div>رقم الطلب</div><span class="ref">${rec.id}</span>
        ${sent ? '' : `<p style="color:var(--muted);font-size:14px">لضمان الوصول، أرسل نسخة من طلبك بالبريد الإلكتروني أيضًا.</p>`}
        <div class="acts">${sent ? '' : `<a class="btn btn-primary" href="${mail}">${icon('mail')} إرسال نسخة بالبريد</a>`}<a class="btn btn-outline" href="${url('initiatives.html')}">تصفّح مبادرات ملهمة</a></div></div>`;
      document.getElementById('tip').innerHTML = `<div class="tip-anim"><span class="ti">${icon('check')}</span><b>ماذا بعد؟</b><p>يدرس الفريق الطلبات بشكل دوري. احتفظ برقم الطلب للمتابعة عبر ${esc(S.contact.ibEmail)}.</p></div>`;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
  IB.reveal();
  IB.countUp();
})();
