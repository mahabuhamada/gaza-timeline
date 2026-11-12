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
        <div class="badges">${i.governorate ? `<span class="gov">${esc(i.governorate)}</span>` : ''}</div></div>
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
  const partnersHTML = () => `<div class="partners">${S.partners.map((p) => `<a class="partner reveal" href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(p.name)}"><span class="pf"><span><img src="${src(p.logo)}" alt="${esc(p.name)}" loading="lazy"></span></span><small>${esc(p.role)}</small></a>`).join('')}</div>`;
  const ctaHTML = () => ''; // دعوة التقديم صارت أعلى التذييل في كل الصفحات

  /* ====================== الرئيسية ====================== */
  function home() {
    setTitle('', S.brand.intro);
    const feat = INITS.filter((i) => i.featured).concat(INITS.filter((i) => !i.featured));
    const themes = count(INITS, (i) => i.themes);
    const themeKeys = sortedKeys(themes).slice(0, 8);
    const themeIcon = { 'دعم نفسي وترفيهي': 'people', 'صحة وتوعية': 'bulb', 'فنون وثقافة': 'image', 'استجابة إنسانية': 'hands', 'تمكين اقتصادي': 'rocket', 'دمج ذوي الإعاقة': 'globe', 'رياضة': 'target', 'تعليم': 'folder' };
    const projects = count(INITS, (i) => i.project); const pk = sortedKeys(projects).slice(0, 2);
    const N = INITS.length || 1;
    const pct = (f) => Math.round((INITS.filter(f).length / N) * 100);
    const ind = [
      ['دامجة لذوي الإعاقة', pct((i) => /إعاقة/.test(i.audience + (i.audienceGroups || []).join() + (i.themes || []).join()))],
      ['في المخيمات والإيواء', pct((i) => /مخيم|إيواء|نزوح|نازح/.test(i.location + i.audience + i.summary))],
      ['دعم نفسي ومساحات آمنة', pct((i) => (i.themes || []).includes('دعم نفسي وترفيهي'))],
      ['صحة وتوعية', pct((i) => (i.themes || []).includes('صحة وتوعية'))],
      ['موثّقة بالصور والفرق', pct((i) => (i.gallery || []).length > 0 || (i.team || []).length > 0)],
    ];
    // رادار خماسي
    const R = 120, ang = (k) => (-90 + k * 72) * Math.PI / 180, P = (k, r) => [Math.cos(ang(k)) * r, Math.sin(ang(k)) * r];
    const ring = (f) => [0, 1, 2, 3, 4].map((k) => P(k, R * f).map((v) => v.toFixed(1)).join(',')).join(' ');
    const area = ind.map(([, v], k) => P(k, R * Math.max(v, 4) / 100).map((x) => x.toFixed(1)).join(',')).join(' ');
    const radar = `<svg class="radar" viewBox="-230 -175 460 350" style="direction:ltr" role="img" aria-label="مؤشرات أثر المبادرات">
      ${[.25, .5, .75, 1].map((f) => `<polygon class="grid-l" points="${ring(f)}"/>`).join('')}
      ${[0, 1, 2, 3, 4].map((k) => { const [x, y] = P(k, R); return `<line class="axis" x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('')}
      <polygon class="area" points="${area}"/>
      ${ind.map(([l, v], k) => { const [x, y] = P(k, R * Math.max(v, 4) / 100); const [lx, ly] = P(k, R + 26); const anc = Math.abs(lx) < 10 ? 'middle' : lx > 0 ? 'start' : 'end';
        return `<circle class="pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/><text x="${lx.toFixed(1)}" y="${(ly + (k === 0 ? -6 : 4)).toFixed(1)}" text-anchor="${anc}">${esc(l)}</text><text class="v" x="${lx.toFixed(1)}" y="${(ly + (k === 0 ? 10 : 20)).toFixed(1)}" text-anchor="${anc}">${v}%</text>`; }).join('')}
    </svg>`;
    // الكوكبة الخماسية (رؤوس الخماسي + صورة وسطى)
    const V = [[50, 7], [93, 38], [77, 90], [23, 90], [7, 38]];
    const imgs = feat.slice(0, 6);
    const photos = INITS.reduce((n, i) => n + (i.gallery || []).length, 0);
    const team = INITS.reduce((n, i) => n + (i.team || []).length, 0);
    const govs = new Set(INITS.map((i) => i.governorate).filter(Boolean)).size;
    const steps = [['الفكرة', 'مشكلة في مجتمعك تبحث عن حل'], ['التقديم', 'املأ نموذج «قدّم فكرتك»'], ['الدراسة', 'يراجع الفريق الطلب ويتواصل معك'], ['التنفيذ', 'دعم وتشبيك لتنفيذ المبادرة'], ['الأثر', 'توثيق القصة ونشرها في المكتبة']];

    main.innerHTML = `
    <section class="hero"><div class="wrap">
      <div>
        <span class="tag-line"><i></i>مبادرة من ${esc(S.brand.org)}</span>
        <h1>نبادر <span class="b">اليوم</span>..<br>لنصنع غدًا <span class="o">أفضل</span></h1>
        <p class="lead">${esc(S.brand.intro)} نحوّل أفكار الشباب في قطاع غزة إلى مبادرات على الأرض، ونوثّق قصصها وأثرها.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${url('submit.html')}">${icon('bulb')} قدّم فكرتك</a>
          <a class="btn btn-outline" href="${url('initiatives.html')}">${icon('grid')} مكتبة المبادرات</a>
        </div>
        <div class="penta-stats">${S.stats.slice(0, 3).map((s) => `<div class="pstat"><span class="pg">${icon(s.icon)}</span><div><b data-count="${s.value}" data-plus="1">0</b><span>${esc(s.label)}</span></div></div>`).join('')}</div>
      </div>
      <div class="constellation" aria-hidden="true">
        <svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="${V.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="#0561A0" stroke-width=".5" stroke-dasharray="1.6 1.2"/>${V.map(([x, y]) => `<line x1="${x}" y1="${y}" x2="50" y2="56" stroke="#F27731" stroke-width=".35" stroke-opacity=".6"/>`).join('')}</svg>
        ${V.map(([x, y], k) => `<span class="node n${k}" style="right:${100 - x}%;top:${y}%"><img src="${src((imgs[k + 1] || imgs[0]).cover)}" alt=""></span>`).join('')}
        <span class="center"><img src="${src(imgs[0].cover)}" alt="" fetchpriority="high"></span>
        <span class="chip-float" style="right:-4%;top:58%"><i></i>${INITS.length} مبادرة موثّقة</span>
        <span class="chip-float c2" style="left:-2%;top:18%"><i></i>${govs} محافظات</span>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="sec-head center"><div><span class="eyebrow">كيف يعمل البنك</span><h2>من <span class="b">الفكرة</span> إلى <span class="hl">الأثر</span></h2><p>خمس محطات متصلة، مثل رؤوس الخماسي في شعارنا.</p></div></div>
      <div class="journey">${steps.map(([t, d], k) => `<div class="jstep reveal"><span class="pg">${k + 1}</span><div><b>${t}</b><span>${d}</span></div></div>`).join('')}</div>
    </div></section>

    <section class="section alt"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow">مكتبة المبادرات</span><h2>أحدث <span class="b">المبادرات</span></h2><p>مبادرات نفّذها شباب وشابات في الخيام ومراكز الإيواء، موثّقة بالصور والأهداف والأثر.</p></div><a class="link-arrow" href="${url('initiatives.html')}">كل المبادرات (${INITS.length}) ${icon('arrowL')}</a></div>
      <div class="bento">${feat.slice(0, 5).map((i, k) => `<article class="card${k ? '' : ' big'} reveal"><div class="media"><img src="${src(i.cover)}" alt="" loading="lazy">${i.governorate ? `<div class="badges"><span class="gov">${esc(i.governorate)}</span></div>` : ''}</div>
        <div class="body"><div class="chips-row">${(i.themes || []).slice(0, 2).map((t) => `<span class="pill${k ? '' : ' solid'}">${esc(t)}</span>`).join('')}</div><h3><a href="${initUrl(i)}">${esc(i.title)}</a></h3>${k ? '' : `<p class="desc">${esc(i.summary)}</p>`}
        <div class="meta"><span>${icon('pin')}${esc(i.location)}</span><span>${icon('cal')}${fmtDate(i.date)}</span></div></div></article>`).join('')}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow">المجالات</span><h2>لكل تحدٍّ <span class="hl">مبادرة</span></h2><p>اختر مجالًا لتصفّح مبادراته.</p></div></div>
      <div class="pentas">${themeKeys.map((t) => `<a class="ptile reveal" href="${url('initiatives.html?theme=' + encodeURIComponent(t))}"><span class="pg">${icon(themeIcon[t] || 'spark')}</span><span class="n">${themes[t]}</span><b>${esc(t)}</b><span>مبادرة</span></a>`).join('')}</div>
    </div></section>

    <section class="section impact"><div class="wrap">
      <div>
        <div class="sec-head" style="margin-bottom:10px"><div><span class="eyebrow">الأثر بالأرقام</span><h2>خماسي الأثر</h2></div></div>
        <p class="lead">خمسة مؤشرات تُحسب تلقائيًا من مكتبة المبادرات، وتتحدّث مع كل مبادرة جديدة تُضاف من لوحة التحكم.</p>
        <div class="ind-list">${ind.map(([l, v]) => `<div class="ind"><span>${esc(l)}</span><b>${v}%</b><span class="bar"><i style="width:${v}%"></i></span></div>`).join('')}</div>
        <div class="impact-nums"><div><b>${INITS.length}</b><span>مبادرة</span></div><div><b>${govs}</b><span>محافظات</span></div><div><b>${photos}</b><span>صورة موثّقة</span></div><div><b>${team}</b><span>مُبادِر/ة</span></div></div>
      </div>
      <div class="reveal">${radar}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow">مساراتنا</span><h2>مساران <span class="b">يحتضنان</span> المبادرات</h2></div><a class="link-arrow" href="${url('partners.html')}">الشركاء ${icon('arrowL')}</a></div>
      <div class="halves reveal">${pk.map((k, n) => { const its = INITS.filter((i) => i.project === k); const im = its.find((i) => i.cover) || INITS[0]; const g = new Set(its.map((i) => i.governorate).filter(Boolean)).size; const ph = its.reduce((s2, i) => s2 + (i.gallery || []).length, 0);
        return `<article class="half ${n ? 'h-orange' : 'h-blue'}"><span class="ghost">${/A4A|الوصول/.test(k) ? 'A4A' : /Youth/i.test(k) ? 'HUB' : 'IB'}</span><div class="dome"><img src="${src(im.cover)}" alt="" loading="lazy"></div><h3>${esc(k)}</h3>
          <p>${/A4A|الوصول/.test(k) ? 'مبادرات شبابية تعزّز إدماج الأشخاص ذوي الإعاقة واستقلاليتهم، بالشراكة مع جمعية العون الطبي للفلسطينيين.' : 'مبادرات يقودها متطوعو المساحة الشبابية في المنتدى، في التوعية الصحية والدعم النفسي والفنون.'}</p>
          <div class="nums"><span><b>${its.length}</b>مبادرة</span><span><b>${g}</b>محافظات</span><span><b>${ph}</b>صورة</span></div>
          <a class="btn btn-white btn-sm" href="${url('initiatives.html?project=' + encodeURIComponent(k))}">اكتشف المسار ${icon('arrowL')}</a></article>`; }).join('')}</div>
    </div></section>

    <section class="section alt"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow">الإعلانات</span><h2>آخر <span class="b">التحديثات</span></h2></div><a class="link-arrow" href="${url('news.html')}">كل الإعلانات ${icon('arrowL')}</a></div>
      <div class="grid grid-3">${POSTS.slice(0, 3).map(postCard).join('')}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow">ماذا يقول المبادرون</span><h2>أصوات من <span class="hl">الميدان</span></h2></div>
        <div class="scroller-nav"><button type="button" data-dir="1" aria-label="السابق">${icon('arrowR')}</button><button type="button" data-dir="-1" aria-label="التالي">${icon('arrowL')}</button></div></div>
      <div class="stories" id="stories" tabindex="0">${S.testimonials.map((t) => `<figure class="story">${icon('quote', 'q')}<blockquote>${esc(t.quote)}</blockquote><figcaption class="who"><b>${esc(t.name)}</b><span>${esc(t.role)}</span></figcaption></figure>`).join('')}</div>
    </div></section>

    <section class="section alt" style="padding-bottom:150px"><div class="wrap">
      <div class="sec-head center"><div><span class="eyebrow">شركاء النجاح</span><h2>شبكة <span class="b">تدعم</span> المبادرات</h2></div></div>
      ${partnersHTML()}
    </div></section>`;
    const st = document.getElementById('stories');
    document.querySelectorAll('.scroller-nav button').forEach((b) => b.addEventListener('click', () => st.scrollBy({ left: -b.dataset.dir * st.clientWidth * 0.9, behavior: 'smooth' })));
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
      <div style="margin-top:60px" class="cta blue reveal"><div><h2>كن شريكًا في التغيير</h2><p>انضم إلينا لتعزيز مبادراتنا وتحقيق تأثير دائم في المجتمعات.</p></div><a class="btn btn-light" href="${url('support.html')}">طرق التعاون</a></div>
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
    <section class="section"><div class="wrap"><div class="cta blue reveal"><div><h2>لنتحدث عن شراكة</h2><p>راسلنا على ${esc(S.contact.ibEmail)} أو اتصل بنا مباشرة وسيتواصل معك فريق الشراكات.</p></div><a class="btn btn-light" href="${url('contact.html')}">تواصل معنا</a></div></div></section>`;
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

  /* ====================== قدّم فكرتك ====================== */
  function submit() {
    setTitle('قدّم فكرتك', S.submit.intro);
    const F = S.submit; const AUTO = 'ib_form_autosave';
    const person = (n, label) => `<fieldset class="form-grid member-set" data-n="${n}" style="border:0;padding:0;margin:0 0 18px"${n > 1 ? ' hidden' : ''}>
      <legend class="label full" style="font-weight:700;margin-bottom:8px">${label}</legend>
      <div class="field"><label>الاسم <span class="req">*</span></label><input class="input" name="m${n}_name"${n === 1 ? ' required' : ''}></div>
      <div class="field"><label>تاريخ الميلاد</label><input class="input" type="date" name="m${n}_dob"></div>
      <div class="field"><label>رقم الجوال <span class="req">*</span></label><input class="input" type="tel" dir="ltr" name="m${n}_phone"${n === 1 ? ' required' : ''}></div>
      <div class="field"><label>البريد الإلكتروني <span class="req">*</span></label><input class="input" type="email" dir="ltr" name="m${n}_email"${n === 1 ? ' required' : ''}></div>
    </fieldset>`;
    main.innerHTML = pageHero(F.title, F.intro, [['قدّم فكرتك']]) + `
    <section class="section" style="padding-top:44px"><div class="wrap form-shell">
      <form class="form-card" id="idea" novalidate>
        <div id="msg"></div>
        <div class="label" style="font-weight:700;margin-bottom:10px">هل تستهدف مبادرتك الأشخاص ذوي الإعاقة بشكل أساسي؟</div>
        <div class="choice">
          <label><input type="radio" name="form" value="pwd"><span><b>نعم، تستهدف ذوي الإعاقة</b><small>نموذج مخصص يراعي مشاركة الأشخاص ذوي الإعاقة، والمواءمة، والترتيبات التيسيرية.</small></span></label>
          <label><input type="radio" name="form" value="general" checked><span><b>لا، مبادرة لفئات أخرى</b><small>النموذج العام لأفكار المبادرات المجتمعية الموجّهة للشباب والنساء والأطفال وغيرهم.</small></span></label>
        </div>
        <div class="consent"><b>قبل البدء، نرجو قراءة ما يلي:</b><ul>${F.consent.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          <label class="check"><input type="checkbox" name="consent" required> قرأت ما سبق وفهمته، وأوافق على جمع البيانات واستخدامها لهذا الغرض، وقد حصلت على موافقة أعضاء الفريق.</label></div>

        <h3><span class="n">1</span> المعلومات الأساسية للمبادرة</h3>
        <div class="form-grid">
          <div class="field full"><label for="title">اسم المبادرة <span class="req">*</span></label><input class="input" id="title" name="title" required><div class="hint">عنوان مختصر وجذاب يعبّر عن المشكلة والحل المقترح.</div></div>
          <div class="field full"><span class="label">مجال المبادرة <span class="req">*</span></span><div class="tick-grid">${F.domains.map((d) => `<label><input type="checkbox" name="domains" value="${esc(d)}">${esc(d)}</label>`).join('')}</div></div>
          <div class="field"><label for="location">موقع التنفيذ <span class="req">*</span></label><input class="input" id="location" name="location" required placeholder="المحافظة، المنطقة، المخيم/المركز"></div>
          <div class="field"><label for="duration">مدة تنفيذ المبادرة <span class="req">*</span></label><input class="input" id="duration" name="duration" required placeholder="مثال: 3 أيام"></div>
          <div class="field full"><span class="label">الفئات المستهدفة <span class="req">*</span></span><div class="tick-grid">${F.audiences.map((d) => `<label><input type="checkbox" name="audiences" value="${esc(d)}">${esc(d)}</label>`).join('')}</div></div>
          <div class="field full pwd-only" hidden><label for="access">الترتيبات التيسيرية والمواءمة</label><textarea class="textarea" id="access" name="access" placeholder="كيف ستضمن وصول الأشخاص ذوي الإعاقة ومشاركتهم الفاعلة؟ (مكان موائم، لغة إشارة، مواصلات…)"></textarea></div>
          <div class="field full"><label for="problem">المشكلة التي تسعى المبادرة لحلها <span class="req">*</span></label><textarea class="textarea" id="problem" name="problem" required></textarea></div>
          <div class="field full"><label for="goals">أهداف المبادرة <span class="req">*</span></label><textarea class="textarea" id="goals" name="goals" required></textarea></div>
          <div class="field full"><label for="activities">أنشطة المبادرة <span class="req">*</span></label><textarea class="textarea" id="activities" name="activities" required placeholder="النشاط / الوصف / مدة التنفيذ"></textarea></div>
          <div class="field"><label for="budget">الميزانية المتوقعة <span class="req">*</span></label><input class="input" id="budget" name="budget" required placeholder="مع تحديد العملة"></div>
        </div>

        <h3><span class="n">2</span> فريق المبادرة</h3>
        <div class="field" style="margin-bottom:16px;max-width:260px"><label for="teamSize">عدد الفريق <span class="req">*</span></label>
          <select class="select" id="teamSize" name="teamSize">${['شخص واحد', 'شخصان', 'ثلاث أشخاص', 'أربع أشخاص', 'خمس أشخاص'].map((t, k) => `<option value="${k + 1}">${t}</option>`).join('')}</select></div>
        ${person(1, 'شخص التواصل')}${person(2, 'الشخص الثاني')}${person(3, 'الشخص الثالث')}${person(4, 'الشخص الرابع')}${person(5, 'الشخص الخامس')}
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><button class="btn btn-primary" type="submit">${icon('send')} قدّم فكرتك</button><span class="hint" id="saved" style="font-size:13px;color:var(--muted)"></span></div>
      </form>
      <aside>
        <div class="form-card" style="margin-bottom:20px"><h3 style="margin-top:0">كيف يتم التقديم؟</h3><div class="steps">${F.steps.map((s) => `<div class="step"><div><b>${esc(s.title)}</b><span>${esc(s.text)}</span></div></div>`).join('')}</div></div>
        <div class="form-card"><h3 style="margin-top:0">أسئلة شائعة</h3>${F.faq.map((q) => `<details class="faq"><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join('')}</div>
      </aside>
    </div></section>`;

    const form = document.getElementById('idea');
    const sync = () => {
      const pwd = form.form.value === 'pwd';
      form.querySelectorAll('.pwd-only').forEach((e) => { e.hidden = !pwd; });
      const n = +form.teamSize.value;
      form.querySelectorAll('.member-set').forEach((f) => { const on = +f.dataset.n <= n; f.hidden = !on; f.querySelectorAll('input:not([type=date])').forEach((x) => { x.required = on; }); });
    };
    // استعادة ما حُفظ تلقائياً
    try {
      const saved = JSON.parse(IB.safeGet(AUTO) || 'null');
      if (saved) Object.entries(saved).forEach(([k, v]) => {
        const els = form.querySelectorAll(`[name="${k}"]`);
        els.forEach((el) => { if (el.type === 'checkbox' || el.type === 'radio') el.checked = [].concat(v).includes(el.value) || (el.type === 'checkbox' && el.name === 'consent' && v === true); else el.value = v; });
      });
    } catch (e) { /* ignore */ }
    if (qs('form') === 'pwd') form.querySelector('[value=pwd]').checked = true;
    sync();

    const collect = () => {
      const o = {};
      new FormData(form).forEach((v, k) => { if (k === 'domains' || k === 'audiences') (o[k] = o[k] || []).push(v); else o[k] = v; });
      o.consent = form.consent.checked;
      return o;
    };
    let t;
    form.addEventListener('input', () => { sync(); clearTimeout(t); t = setTimeout(() => { IB.safeSet(AUTO, JSON.stringify(collect())); document.getElementById('saved').textContent = 'تم حفظ المسودة تلقائيًا على جهازك'; }, 500); });
    form.addEventListener('change', sync);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('msg');
      const o = collect();
      const missing = [...form.querySelectorAll('[required]')].filter((x) => !x.closest('[hidden]') && !(x.type === 'checkbox' ? x.checked : x.value.trim()));
      if (!o.domains || !o.audiences) missing.push(form.querySelector('[name=domains]'));
      if (missing.length) {
        msg.innerHTML = `<div class="notice warn" role="alert">يرجى تعبئة الحقول الإلزامية (${missing.length}) والموافقة على شروط جمع البيانات.</div>`;
        (missing[0].focus && missing[0].focus()); msg.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
      }
      const members = [];
      for (let n = 1; n <= +o.teamSize; n++) members.push({ name: o[`m${n}_name`], dob: o[`m${n}_dob`], phone: o[`m${n}_phone`], email: o[`m${n}_email`] });
      const rec = {
        id: 'S' + Date.now().toString(36), receivedAt: new Date().toISOString(), status: 'new', form: o.form,
        title: o.title, domains: o.domains, location: o.location, duration: o.duration, audiences: o.audiences, problem: o.problem,
        goals: o.goals, activities: o.activities, budget: o.budget, access: o.access || '', members, notes: '',
      };
      const endpoint = (S.forms && S.forms.endpoint) || '';
      let sent = false;
      if (endpoint) {
        try { const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(rec) }); sent = r.ok; } catch (err) { sent = false; }
      }
      // نسخة محلية تظهر في لوحة التحكم على نفس الجهاز
      try { const list = JSON.parse(IB.safeGet('ib_submissions') || '[]'); list.unshift(rec); IB.safeSet('ib_submissions', JSON.stringify(list)); } catch (err) { /* ignore */ }
      IB.safeDel(AUTO);
      const mail = `mailto:${S.contact.ibEmail}?subject=${encodeURIComponent('فكرة مبادرة: ' + rec.title)}&body=${encodeURIComponent(`اسم المبادرة: ${rec.title}\nالمجالات: ${rec.domains.join('، ')}\nالموقع: ${rec.location}\nالمدة: ${rec.duration}\nالفئات: ${rec.audiences.join('، ')}\n\nالمشكلة:\n${rec.problem}\n\nالأهداف:\n${rec.goals}\n\nالأنشطة:\n${rec.activities}\n\nالميزانية: ${rec.budget}\n\nالفريق:\n${members.map((m) => `${m.name} – ${m.phone} – ${m.email}`).join('\n')}`)}`;
      form.innerHTML = `<div class="notice ok" role="status" style="font-size:16px"><b>شكرًا لك! تم استلام فكرة «${esc(rec.title)}».</b><br>رقم الطلب: <b dir="ltr">${rec.id}</b>. سيدرس فريق بنك المبادرات الطلب ويتواصل مع شخص التواصل.</div>
        ${sent ? '' : `<p>لضمان وصول طلبك، أرسل نسخة عبر البريد الإلكتروني:</p><a class="btn btn-primary" href="${mail}">${icon('mail')} إرسال نسخة بالبريد</a>`}
        <p style="margin-top:20px"><a class="btn btn-ghost btn-sm" style="color:var(--orange)" href="${url('initiatives.html')}">تصفّح مبادرات ملهمة</a></p>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
