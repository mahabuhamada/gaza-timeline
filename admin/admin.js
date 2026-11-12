/* لوحة تحكم بنك المبادرات
 * - تعمل كلها في المتصفح: التعديلات تُحفظ كمسودة محلية، ثم تُنشر إلى GitHub أو تُصدَّر كملف.
 * - طلبات «قدّم فكرتك» تحتوي بيانات شخصية: تُحفظ محليًا فقط ولا تُنشر أبدًا مع بيانات الموقع.
 */
(function () {
  'use strict';
  const { esc, icon, fmtDate, num } = IB;
  const SUBS_KEY = 'ib_admin_submissions';
  const GH_KEY = 'ib_gh';
  let view; // يُعاد إنشاؤه في كل تنقّل لإزالة المستمعين السابقين
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const src = (p) => (!p ? '' : /^(https?:|data:|blob:)/.test(p) ? p : '../' + p);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => Date.now() + Math.floor(Math.random() * 1000);
  const GOVS = ['شمال غزة', 'غزة', 'الوسطى', 'خان يونس', 'رفح', 'الضفة الغربية'];
  const STATUS = { published: ['منشورة', 'pub'], draft: ['مسودة', 'draft'], archived: ['مؤرشفة', 'archived'] };
  const SUB_STATUS = { new: ['جديد', 'new'], review: ['قيد المراجعة', 'review'], accepted: ['مقبول', 'accepted'], rejected: ['مرفوض', 'rejected'] };
  const BLOCK_KINDS = { section: 'قسم نصي', quote: 'اقتباس', info: 'بطاقات معلومات', gallery: 'معرض صور', team: 'فريق المبادرة', closing: 'خاتمة' };

  /* ---------------- الحالة ---------------- */
  const PUB = IB.published();
  let D = IB.draft() || clone(PUB);
  D.ideas = D.ideas || []; D.site.forms = D.site.forms || { endpoint: '' };
  delete D.submissions; // لا تُخزَّن الطلبات ضمن بيانات الموقع
  let SUBS = loadSubs();

  function loadSubs() {
    let list = []; try { list = JSON.parse(IB.safeGet(SUBS_KEY) || '[]'); } catch (e) { list = []; }
    // دمج الطلبات التي أرسلها نموذج الموقع على هذا الجهاز
    let incoming = []; try { incoming = JSON.parse(IB.safeGet('ib_submissions') || '[]'); } catch (e) { incoming = []; }
    const ids = new Set(list.map((s) => s.id));
    incoming.forEach((s) => { if (!ids.has(s.id)) list.unshift(s); });
    return list;
  }
  function saveSubs() { IB.safeSet(SUBS_KEY, JSON.stringify(SUBS)); updateBadges(); }

  function dirty() { return JSON.stringify(strip(D)) !== JSON.stringify(strip(PUB)); }
  function strip(o) { const c = clone(o); delete c.generatedAt; delete c.submissions; return c; }
  let saveT;
  function save(silent) {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      if (!IB.safeSet(IB.DRAFT_KEY, JSON.stringify(D))) toast('تعذّر حفظ المسودة: مساحة المتصفح ممتلئة (الصور المرفوعة محليًا كبيرة). انشر أو صدّر البيانات.', true);
      updateStatus(); if (!silent) toast('تم الحفظ في المسودة');
    }, 250);
  }
  function updateStatus() {
    const s = $('#status'); const d = dirty();
    s.className = 'status' + (d ? ' dirty' : '');
    s.innerHTML = `<span class="dot"></span>${d ? 'تغييرات غير منشورة' : 'متزامن مع المنشور'}`;
  }
  function updateBadges() {
    const n = SUBS.filter((s) => s.status === 'new').length;
    const b = $('[data-badge="subs"]'); if (b) { b.textContent = n; b.hidden = !n; }
  }

  function toast(m, err) {
    const t = $('#toast'); t.textContent = m; t.className = 'toast on' + (err ? ' err' : '');
    clearTimeout(t._t); t._t = setTimeout(() => { t.className = 'toast'; }, 2600);
  }

  /* ---------------- ربط الحقول بالمسار ---------------- */
  function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, p, v) { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }
  function readVal(el) {
    const t = el.dataset.t;
    if (el.type === 'checkbox') return el.checked;
    if (t === 'num') return el.value === '' ? null : Number(el.value);
    if (t === 'lines') return el.value.split('\n').map((x) => x.trim()).filter(Boolean);
    if (t === 'tags') return el.value.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    return el.value;
  }
  function fmtVal(v, t) {
    if (t === 'lines') return (v || []).join('\n');
    if (t === 'tags') return (v || []).join('، ');
    return v == null ? '' : v;
  }
  function bind(root, base, onChange) {
    const h = (e) => {
      const el = e.target.closest('[data-p]'); if (!el) return;
      setPath(base, el.dataset.p, readVal(el)); save(true);
      if (onChange) onChange(el);
    };
    root.addEventListener('input', h); root.addEventListener('change', h);
  }
  // مولّدات حقول
  const fIn = (p, label, v, o = {}) => `<div class="fld ${o.cls || ''}"><label>${label}</label><input class="in" data-p="${p}" ${o.t ? `data-t="${o.t}"` : ''} type="${o.type || 'text'}" value="${esc(fmtVal(v, o.t))}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.list ? `list="${o.list}"` : ''} ${o.dir ? `dir="${o.dir}"` : ''}>${o.h ? `<div class="h">${o.h}</div>` : ''}</div>`;
  const fTa = (p, label, v, o = {}) => `<div class="fld ${o.cls || ''}"><label>${label}</label><textarea class="ta ${o.code ? 'code' : ''}" data-p="${p}" ${o.t ? `data-t="${o.t}"` : ''} ${o.rows ? `rows="${o.rows}"` : ''}>${esc(fmtVal(v, o.t))}</textarea>${o.h ? `<div class="h">${o.h}</div>` : ''}</div>`;
  const fSel = (p, label, v, opts, o = {}) => `<div class="fld ${o.cls || ''}"><label>${label}</label><select class="sel" data-p="${p}">${opts.map((x) => { const [val, t] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select></div>`;
  const fSw = (p, label, v) => `<label class="sw"><input type="checkbox" data-p="${p}"${v ? ' checked' : ''}> ${label}</label>`;
  const fImg = (p, label, v) => `<div class="fld"><span class="l">${label}</span><div class="img-pick">${v ? `<img src="${esc(src(v))}" alt="">` : '<span class="ph"></span>'}<div class="grow"><input class="in" data-p="${p}" dir="ltr" value="${esc(v || '')}" placeholder="assets/uploads/… أو رابط"><div class="row"><button type="button" class="btn sm" data-upload="${p}">${icon('image', 'i')} رفع صورة</button><button type="button" class="btn sm" data-pickmedia="${p}">من المكتبة</button></div></div></div></div>`;

  /* ---------------- رفع الصور ---------------- */
  function gh() { try { return JSON.parse(IB.safeGet(GH_KEY) || sessionStorage.getItem(GH_KEY) || 'null'); } catch (e) { return null; } }
  function resize(file, max = 1600) {
    return new Promise((res, rej) => {
      const img = new Image(); const u = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = rej; img.src = u;
    });
  }
  async function uploadImage(file) {
    const dataUrl = await resize(file);
    const cfg = gh();
    if (!cfg || !cfg.token) { toast('حُفظت الصورة داخل المسودة. اربط GitHub لرفعها كملف مستقل.'); return dataUrl; }
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[^\w؀-ۿ-]+/g, '-').slice(0, 40) || 'image';
    const path = `assets/uploads/dashboard/${new Date().toISOString().slice(0, 7)}/${Date.now().toString(36)}-${name}.jpg`;
    await ghPut(cfg, path, dataUrl.split(',')[1], 'رفع صورة من لوحة التحكم: ' + name);
    toast('تم رفع الصورة إلى المستودع'); return path;
  }
  function pickFile() {
    return new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = () => res([...i.files]); i.click(); });
  }
  // أزرار الرفع/الاختيار العامة داخل أي نموذج مربوط
  function wireImages(root, base, rerender) {
    root.addEventListener('click', async (e) => {
      const up = e.target.closest('[data-upload]'); const pk = e.target.closest('[data-pickmedia]');
      if (up) { const [f] = await pickFile(); if (!f) return; try { setPath(base, up.dataset.upload, await uploadImage(f)); save(); rerender(); } catch (err) { toast('فشل رفع الصورة: ' + err.message, true); } }
      if (pk) { const v = await mediaPicker(); if (v) { setPath(base, pk.dataset.pickmedia, v); save(); rerender(); } }
    });
  }

  /* ---------------- تجميع الإحصاءات ---------------- */
  const tally = (arr, f) => arr.reduce((m, x) => { [].concat(f(x) || []).forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; }); return m; }, {});
  function hbars(m, cls, limit) {
    const ks = Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, limit || 99); const max = Math.max(1, ...ks.map((k) => m[k]));
    return ks.length ? `<div class="hbars">${ks.map((k) => `<div class="hbar ${cls || ''}"><span class="t" title="${esc(k)}">${esc(k)}</span><span class="track"><span class="fill" style="width:${(m[k] / max) * 100}%"></span></span><span class="n">${m[k]}</span></div>`).join('')}</div>` : '<div class="empty">لا توجد بيانات</div>';
  }

  /* ====================== نظرة عامة ====================== */
  function overview() {
    const I = D.initiatives; const live = I.filter((i) => i.status === 'published');
    const photos = I.reduce((n, i) => n + (i.gallery || []).length, 0);
    const team = I.reduce((n, i) => n + (i.team || []).length, 0);
    const govs = new Set(live.map((i) => i.governorate).filter(Boolean));
    const newSubs = SUBS.filter((s) => s.status === 'new').length;
    // آخر 12 شهرًا تحتوي بيانات
    const months = tally(live, (i) => i.date.slice(0, 7));
    const mk = Object.keys(months).sort();
    const first = mk[0] ? new Date(mk[0] + '-01') : new Date();
    const last = mk.length ? new Date(mk[mk.length - 1] + '-01') : new Date();
    const series = []; for (let d = new Date(first); d <= last; d.setMonth(d.getMonth() + 1)) { const k = d.toISOString().slice(0, 7); series.push([k, months[k] || 0]); }
    const maxM = Math.max(1, ...series.map((x) => x[1]));
    const issues = [
      ['بدون محافظة', I.filter((i) => !i.governorate)],
      ['بدون صورة غلاف', I.filter((i) => !i.cover)],
      ['بدون معرض صور', I.filter((i) => !(i.gallery || []).length)],
      ['بدون أعضاء فريق', I.filter((i) => !(i.team || []).length)],
      ['بدون عدد مستفيدين', I.filter((i) => !i.beneficiaries)],
      ['ملخص قصير جدًا', I.filter((i) => (i.summary || '').length < 40)],
    ];
    view.innerHTML = `
    <div class="kpis">
      <div class="kpi hl"><div class="lbl">${icon('spark', 'i')} مبادرات منشورة</div><div class="v">${live.length}</div><div class="d">من أصل ${I.length} في المكتبة</div></div>
      <div class="kpi"><div class="lbl">${icon('pin', 'i')} المحافظات</div><div class="v">${govs.size}</div><div class="d">${[...govs].join('، ')}</div></div>
      <div class="kpi"><div class="lbl">${icon('image', 'i')} صور موثّقة</div><div class="v">${num(photos)}</div><div class="d">في معارض المبادرات</div></div>
      <div class="kpi"><div class="lbl">${icon('team', 'i')} أعضاء فرق</div><div class="v">${num(team)}</div><div class="d">مُبادِر/ة موثّق</div></div>
      <div class="kpi"><div class="lbl">${icon('megaphone', 'i')} أخبار وإعلانات</div><div class="v">${D.posts.length}</div><div class="d">${D.posts.filter((p) => p.kind === 'call').length} دعوات مفتوحة</div></div>
      <div class="kpi"><div class="lbl">${icon('bulb', 'i')} طلبات جديدة</div><div class="v">${newSubs}</div><div class="d">${SUBS.length} طلب على هذا الجهاز</div></div>
    </div>
    <div class="cols side-r">
      <div>
        <div class="panel"><div class="panel-head"><div><h2>المبادرات المنشورة شهريًا</h2><div class="sub">حسب تاريخ النشر في المكتبة</div></div><a class="btn sm" href="#initiatives">إدارة المبادرات</a></div>
          <div class="cols-chart">${series.map(([k, v]) => `<div class="c" title="${k}: ${v}"><span class="n">${v || ''}</span><span class="bar" style="height:${(v / maxM) * 100}%"></span></div>`).join('')}</div>
          <div class="cols-x">${series.map(([k]) => `<span>${IB.fmtMonth(k + '-01')}</span>`).join('')}</div>
        </div>
        <div class="cols c2" style="margin-top:18px">
          <div class="panel"><h2>حسب المحافظة</h2><div class="sub">مكان التنفيذ</div>${hbars(tally(live, (i) => i.governorate))}</div>
          <div class="panel"><h2>حسب المسار / المشروع</h2><div class="sub">الإطار الذي نُفذت ضمنه</div>${hbars(tally(live, (i) => i.project), 'blue')}</div>
          <div class="panel"><h2>حسب المجال</h2><div class="sub">قد تنتمي المبادرة لأكثر من مجال</div>${hbars(tally(live, (i) => i.themes))}</div>
          <div class="panel"><h2>حسب الفئة المستهدفة</h2><div class="sub">قد تستهدف المبادرة أكثر من فئة</div>${hbars(tally(live, (i) => i.audienceGroups), 'blue')}</div>
        </div>
      </div>
      <div>
        <div class="panel"><h2>جودة البيانات</h2><div class="sub">عناصر تحتاج استكمالًا لتظهر بأفضل شكل</div>
          <div class="checks">${issues.map(([t, arr]) => `<a href="#initiatives?issue=${encodeURIComponent(t)}">${arr.length ? icon('target', 'i') : icon('check', 'i')} ${t}<span class="c tag ${arr.length ? 'draft' : 'pub'}">${arr.length}</span></a>`).join('')}</div></div>
        <div class="panel"><div class="panel-head"><div><h2>أحدث الطلبات</h2><div class="sub">من نموذج «قدّم فكرتك»</div></div><a class="btn sm" href="#submissions">الكل</a></div>
          ${SUBS.length ? `<div class="checks">${SUBS.slice(0, 5).map((s) => `<a href="#submissions?open=${esc(s.id)}">${esc(s.title)}<span class="c tag ${SUB_STATUS[s.status][1]}">${SUB_STATUS[s.status][0]}</span></a>`).join('')}</div>` : '<div class="empty small">لا توجد طلبات بعد. اربط رابط استقبال النماذج من «محتوى الموقع» أو استورد ملف طلبات.</div>'}</div>
        <div class="panel"><h2>إجراءات سريعة</h2><div class="sub">&nbsp;</div><div class="row">
          <a class="btn pri" href="#initiative/new">${icon('spark', 'i')} مبادرة جديدة</a><a class="btn" href="#post/new">${icon('megaphone', 'i')} خبر جديد</a><a class="btn blue" href="#publish">${icon('send', 'i')} النشر</a></div></div>
      </div>
    </div>`;
  }

  /* ====================== المبادرات ====================== */
  function initiatives(params) {
    const issue = params.get('issue');
    const st = { q: '', status: '', gov: '', project: '' };
    const issueF = {
      'بدون محافظة': (i) => !i.governorate, 'بدون صورة غلاف': (i) => !i.cover, 'بدون معرض صور': (i) => !(i.gallery || []).length,
      'بدون أعضاء فريق': (i) => !(i.team || []).length, 'بدون عدد مستفيدين': (i) => !i.beneficiaries, 'ملخص قصير جدًا': (i) => (i.summary || '').length < 40,
    }[issue];
    const projects = [...new Set(D.initiatives.map((i) => i.project).filter(Boolean))];
    view.innerHTML = `
    ${issue ? `<div class="note warn" style="margin-bottom:14px">تعرض المبادرات: <b>${esc(issue)}</b> — <a href="#initiatives">إلغاء</a></div>` : ''}
    <div class="toolbar">
      <input class="in grow" id="q" type="search" placeholder="ابحث بالعنوان أو المكان…">
      <select class="sel" id="fs" style="width:auto"><option value="">كل الحالات</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
      <select class="sel" id="fg" style="width:auto"><option value="">كل المحافظات</option>${GOVS.map((g) => `<option>${g}</option>`).join('')}</select>
      <select class="sel" id="fp" style="width:auto"><option value="">كل المسارات</option>${projects.map((g) => `<option>${esc(g)}</option>`).join('')}</select>
      <a class="btn pri" href="#initiative/new">${icon('spark', 'i')} مبادرة جديدة</a>
    </div>
    <div class="table-wrap"><table><thead><tr><th></th><th>المبادرة</th><th>المحافظة</th><th>المسار</th><th>التاريخ</th><th>محتوى</th><th>الحالة</th><th>مميزة</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    <p class="muted small" id="cnt"></p>`;
    const render = () => {
      const q = st.q.toLowerCase();
      const rows = D.initiatives.filter((i) => (!issueF || issueF(i)) && (!q || (i.title + i.location).toLowerCase().includes(q)) && (!st.status || i.status === st.status) && (!st.gov || i.governorate === st.gov) && (!st.project || i.project === st.project))
        .sort((a, b) => b.date.localeCompare(a.date));
      $('#rows').innerHTML = rows.map((i) => `<tr>
        <td>${i.cover ? `<img class="thumb" src="${esc(src(i.cover))}" alt="" loading="lazy">` : '<span class="thumb ph"></span>'}</td>
        <td><a class="ttl" href="#initiative/${i.id}">${esc(i.title)}</a><span class="muted small">${esc(i.location)}</span></td>
        <td>${esc(i.governorate || '—')}</td><td class="small">${esc(i.project || '')}</td><td class="small">${fmtDate(i.date)}</td>
        <td class="small muted">${(i.blocks || []).length} كتلة · ${(i.gallery || []).length} صورة · ${(i.team || []).length} عضو</td>
        <td><span class="tag ${STATUS[i.status][1]}">${STATUS[i.status][0]}</span></td>
        <td><button class="star ${i.featured ? 'on' : ''}" data-star="${i.id}" aria-label="تمييز">${icon('spark', 'i')}</button></td>
        <td><div class="row" style="flex-wrap:nowrap"><a class="btn sm" href="#initiative/${i.id}">تحرير</a><button class="btn sm icon" data-dup="${i.id}" title="نسخ">${icon('box', 'i')}</button><button class="btn sm icon danger" data-del="${i.id}" title="حذف">${icon('x', 'i')}</button></div></td></tr>`).join('') || `<tr><td colspan="9" class="empty">لا توجد نتائج</td></tr>`;
      $('#cnt').textContent = `${rows.length} مبادرة`;
    };
    $('#q').oninput = (e) => { st.q = e.target.value; render(); };
    $('#fs').onchange = (e) => { st.status = e.target.value; render(); };
    $('#fg').onchange = (e) => { st.gov = e.target.value; render(); };
    $('#fp').onchange = (e) => { st.project = e.target.value; render(); };
    $('#rows').addEventListener('click', (e) => {
      const s = e.target.closest('[data-star]'); const d = e.target.closest('[data-del]'); const c = e.target.closest('[data-dup]');
      if (s) { const i = D.initiatives.find((x) => x.id == s.dataset.star); i.featured = !i.featured; save(); render(); }
      if (d && confirm('حذف هذه المبادرة نهائيًا من المسودة؟')) { D.initiatives = D.initiatives.filter((x) => x.id != d.dataset.del); save(); render(); }
      if (c) { const i = clone(D.initiatives.find((x) => x.id == c.dataset.dup)); i.id = uid(); i.title += ' (نسخة)'; i.status = 'draft'; i.featured = false; D.initiatives.unshift(i); save(); location.hash = '#initiative/' + i.id; }
    });
    render();
  }

  function newInitiative() {
    return {
      id: uid(), slug: '', title: 'مبادرة جديدة', summary: '', date: new Date().toISOString().slice(0, 10), status: 'draft', featured: false,
      location: '', governorate: '', audience: '', audienceGroups: [], type: '', themes: [], project: 'بنك المبادرات', beneficiaries: null,
      cover: '', gallery: [], team: [], sourceUrl: '',
      blocks: [
        { kind: 'section', icon: 'ℹ', title: 'ما هي؟', paragraphs: [] },
        { kind: 'section', icon: '❔', title: 'لماذا المُبادرة؟', paragraphs: [] },
        { kind: 'info', icon: '👥', title: 'الفئة المُستهدفة ومكان التنفيذ', cards: [{ label: 'الفئة المُستهدفة', lines: [] }, { label: 'مكان التنفيذ', lines: [] }] },
        { kind: 'section', icon: '🎯', title: 'أهداف المُبادرة', paragraphs: [], items: [] },
        { kind: 'section', icon: '🎲', title: 'أنشطة تفاعليّة.. أجواء مُميّزة', paragraphs: [] },
        { kind: 'section', icon: '📚', title: 'السياق والتفاصيل', paragraphs: [] },
        { kind: 'gallery', icon: '🖼', title: 'صور من المُبادرة', images: [] },
        { kind: 'team', icon: '🧑‍🤝‍🧑', title: 'فريق المُبادرة', paragraphs: [], members: [] },
      ],
    };
  }

  function syncDerived(i) {
    const g = (i.blocks || []).find((b) => b.kind === 'gallery'); i.gallery = g ? g.images.slice() : [];
    const t = (i.blocks || []).find((b) => b.kind === 'team'); i.team = t ? clone(t.members) : [];
  }

  function blockEditor(b, k, n) {
    const p = `blocks.${k}`;
    const head = `<div class="blk-h"><span class="k">${BLOCK_KINDS[b.kind]}</span><span class="t">${esc(b.title || (b.kind === 'quote' ? (b.text || '').slice(0, 60) : ''))}</span>
      <button type="button" class="btn sm icon" data-bup="${k}" ${k === 0 ? 'disabled' : ''} title="أعلى">${icon('arrowR', 'i')}</button>
      <button type="button" class="btn sm icon" data-bdown="${k}" ${k === n - 1 ? 'disabled' : ''} title="أسفل">${icon('arrowL', 'i')}</button>
      <button type="button" class="btn sm icon" data-bfold="${k}" title="طي">${icon('menu', 'i')}</button>
      <button type="button" class="btn sm icon danger" data-bdel="${k}" title="حذف">${icon('x', 'i')}</button></div>`;
    let body = '';
    const titleRow = `<div class="f title-row">${fIn(p + '.icon', 'أيقونة', b.icon, { ph: '🎯' })}${fIn(p + '.title', 'العنوان', b.title)}</div>`;
    if (b.kind === 'section') body = `<div class="f">${titleRow}${fTa(p + '.paragraphs', 'الفقرات (كل سطر فقرة)', b.paragraphs, { t: 'lines', h: 'السطر القصير بدون نقطة يتبعه نص يظهر كعنوان فرعي.' })}${fTa(p + '.items', 'قائمة نقاط (كل سطر نقطة) — اختياري', b.items, { t: 'lines' })}</div>`;
    if (b.kind === 'quote') body = `<div class="f">${fTa(p + '.text', 'نص الاقتباس', b.text)}${fIn(p + '.author', 'القائل', b.author)}</div>`;
    if (b.kind === 'closing') body = `<div class="f">${fTa(p + '.paragraphs', 'الفقرات (كل سطر فقرة)', b.paragraphs, { t: 'lines' })}</div>`;
    if (b.kind === 'info') body = `<div class="f">${titleRow}<div class="sub-list">${(b.cards || []).map((c, j) => `<div class="sub-item">${fIn(`${p}.cards.${j}.label`, 'عنوان البطاقة', c.label)}${fTa(`${p}.cards.${j}.lines`, 'الأسطر', c.lines, { t: 'lines' })}<button type="button" class="btn sm icon danger" data-rm="${p}.cards.${j}">${icon('x', 'i')}</button></div>`).join('')}</div><div><button type="button" class="btn sm" data-add="${p}.cards" data-tpl='{"label":"","lines":[]}'>+ بطاقة</button></div></div>`;
    if (b.kind === 'gallery') body = `<div class="f">${titleRow}<div class="thumbs">${(b.images || []).map((im, j) => `<div class="th"><img src="${esc(src(im))}" alt="" loading="lazy"><button type="button" data-rm="${p}.images.${j}" title="إزالة">${icon('x', 'i')}</button><span class="ord"><button type="button" data-mv="${p}.images.${j}" data-d="-1" title="تقديم">${icon('arrowR', 'i')}</button><button type="button" data-mv="${p}.images.${j}" data-d="1" title="تأخير">${icon('arrowL', 'i')}</button></span></div>`).join('')}</div>
      <div class="row"><button type="button" class="btn sm" data-gup="${p}.images">${icon('image', 'i')} رفع صور</button><button type="button" class="btn sm" data-gpick="${p}.images">من المكتبة</button><button type="button" class="btn sm" data-gurl="${p}.images">إضافة رابط</button></div></div>`;
    if (b.kind === 'team') body = `<div class="f">${titleRow}${fTa(p + '.paragraphs', 'مقدمة (اختياري)', b.paragraphs, { t: 'lines' })}<div class="sub-list">${(b.members || []).map((m, j) => `<div class="sub-item three">${m.photo ? `<img src="${esc(src(m.photo))}" alt="">` : '<span class="ph"></span>'}${fIn(`${p}.members.${j}.name`, 'الاسم', m.name)}${fIn(`${p}.members.${j}.role`, 'الدور', m.role)}<div class="row" style="flex-direction:column"><button type="button" class="btn sm icon" data-upload="${p}.members.${j}.photo" title="صورة">${icon('image', 'i')}</button><button type="button" class="btn sm icon danger" data-rm="${p}.members.${j}">${icon('x', 'i')}</button></div></div>`).join('')}</div><div><button type="button" class="btn sm" data-add="${p}.members" data-tpl='{"name":"","role":"","photo":""}'>+ عضو</button></div></div>`;
    return `<div class="blk" data-k="${k}">${head}<div class="blk-b">${body}</div></div>`;
  }

  function initiativeEditor(id) {
    let i = id === 'new' ? null : D.initiatives.find((x) => String(x.id) === id);
    if (!i) { if (id !== 'new') return notFound(); i = newInitiative(); D.initiatives.unshift(i); save(true); history.replaceState(null, '', '#initiative/' + i.id); }
    const themes = [...new Set(D.initiatives.flatMap((x) => x.themes || []))];
    const groups = [...new Set(D.initiatives.flatMap((x) => x.audienceGroups || []))];
    const projects = [...new Set(D.initiatives.map((x) => x.project).filter(Boolean))];
    const folded = new Set();
    const render = () => {
      syncDerived(i);
      setTop(i.title, '<a href="#initiatives">المبادرات</a> / تحرير');
      view.innerHTML = `
      <datalist id="dl-proj">${projects.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
      <div class="cols side-r">
        <div>
          <div class="panel"><h2>الأساسيات</h2><div class="sub">ما يظهر في بطاقة المبادرة وأعلى صفحتها</div>
            <div class="f g2">
              ${fIn('title', 'عنوان المبادرة', i.title, { cls: 'full' })}
              ${fTa('summary', 'الملخص', i.summary, { cls: 'full', h: `${(i.summary || '').length} حرف — يُفضّل 120–220 حرفًا` })}
              ${fIn('location', 'مكان التنفيذ (مختصر)', i.location, { ph: 'مخيم…، المحافظة' })}
              ${fSel('governorate', 'المحافظة', i.governorate, [['', '— اختر —'], ...GOVS])}
              ${fIn('audience', 'الفئة المستهدفة (نص)', i.audience)}
              ${fIn('type', 'نوع المبادرة', i.type, { ph: 'شبابية توعوية مجتمعية' })}
              ${fIn('themes', 'المجالات (افصل بفاصلة)', i.themes, { t: 'tags', h: 'المتاح: ' + themes.join('، ') })}
              ${fIn('audienceGroups', 'مجموعات الفئات (افصل بفاصلة)', i.audienceGroups, { t: 'tags', h: 'المتاح: ' + groups.join('، ') })}
              ${fIn('project', 'المسار / المشروع', i.project, { list: 'dl-proj' })}
              ${fIn('beneficiaries', 'عدد المستفيدين', i.beneficiaries, { t: 'num', type: 'number' })}
            </div>
          </div>
          <div class="panel"><div class="panel-head"><div><h2>محتوى الصفحة</h2><div class="sub">كتل تُعرض بالترتيب في صفحة المبادرة</div></div>
            <div class="row"><select class="sel" id="addKind" style="width:auto">${Object.entries(BLOCK_KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><button type="button" class="btn sm pri" id="addBlock">+ إضافة كتلة</button></div></div>
            <div class="blocks">${(i.blocks || []).map((b, k, a) => blockEditor(b, k, a.length)).join('')}</div>
          </div>
        </div>
        <div style="position:sticky;top:76px">
          <div class="panel"><h2>النشر</h2><div class="sub">&nbsp;</div><div class="f">
            ${fSel('status', 'الحالة', i.status, Object.entries(STATUS).map(([k, v]) => [k, v[0]]))}
            ${fIn('date', 'تاريخ النشر', i.date, { type: 'date' })}
            ${fSw('featured', 'مبادرة مميزة (تظهر أولًا في الرئيسية)', i.featured)}
            <div class="row"><button type="button" class="btn blue" id="prev">${icon('link', 'i')} معاينة</button><button type="button" class="btn danger" id="del">${icon('x', 'i')} حذف</button></div>
          </div></div>
          <div class="panel">${fImg('cover', 'صورة الغلاف', i.cover)}</div>
          <div class="panel small muted">المعرف: <b dir="ltr">${i.id}</b>${i.sourceUrl ? `<br>المصدر الأصلي: <a href="${esc(i.sourceUrl)}" target="_blank" rel="noopener">initiativesbank.ps</a>` : ''}<br>${(i.gallery || []).length} صورة · ${(i.team || []).length} عضو فريق</div>
        </div>
      </div>`;
      $$('.blk').forEach((el) => { if (folded.has(+el.dataset.k)) el.classList.add('collapsed'); });
    };
    render();
    bind(view, i, (el) => { if (el.dataset.p === 'title') setTop(i.title, '<a href="#initiatives">المبادرات</a> / تحرير'); });
    wireImages(view, i, render);
    view.addEventListener('click', async (e) => {
      const t = e.target.closest('button'); if (!t) return;
      const B = i.blocks; const d = t.dataset;
      if (t.id === 'addBlock') { const k = $('#addKind').value; B.push({ section: { kind: 'section', icon: '•', title: 'عنوان القسم', paragraphs: [] }, quote: { kind: 'quote', text: '', author: '' }, info: { kind: 'info', icon: '👥', title: 'معلومات', cards: [{ label: '', lines: [] }] }, gallery: { kind: 'gallery', icon: '🖼', title: 'صور من المُبادرة', images: [] }, team: { kind: 'team', icon: '🧑‍🤝‍🧑', title: 'فريق المُبادرة', paragraphs: [], members: [] }, closing: { kind: 'closing', paragraphs: [] } }[k]); }
      else if (d.bup) { const k = +d.bup; [B[k - 1], B[k]] = [B[k], B[k - 1]]; }
      else if (d.bdown) { const k = +d.bdown; [B[k + 1], B[k]] = [B[k], B[k + 1]]; }
      else if (d.bdel) { if (!confirm('حذف هذه الكتلة؟')) return; B.splice(+d.bdel, 1); }
      else if (d.bfold) { const k = +d.bfold; folded.has(k) ? folded.delete(k) : folded.add(k); t.closest('.blk').classList.toggle('collapsed'); return; }
      else if (d.rm) { const ks = d.rm.split('.'); const j = +ks.pop(); getPath(i, ks.join('.')).splice(j, 1); }
      else if (d.mv) { const ks = d.mv.split('.'); const j = +ks.pop(); const arr = getPath(i, ks.join('.')); const to = j + +d.d; if (to < 0 || to >= arr.length) return; [arr[j], arr[to]] = [arr[to], arr[j]]; }
      else if (d.add) { getPath(i, d.add).push(JSON.parse(d.tpl)); }
      else if (d.gup) { const fs = await pickFile(); if (!fs.length) return; toast('جارٍ رفع الصور…'); try { for (const f of fs) getPath(i, d.gup).push(await uploadImage(f)); } catch (err) { toast('فشل الرفع: ' + err.message, true); } }
      else if (d.gpick) { const v = await mediaPicker(); if (!v) return; getPath(i, d.gpick).push(v); }
      else if (d.gurl) { const v = prompt('رابط الصورة أو مسارها داخل الموقع:'); if (!v) return; getPath(i, d.gurl).push(v.trim()); }
      else if (t.id === 'prev') { syncDerived(i); IB.safeSet(IB.DRAFT_KEY, JSON.stringify(D)); IB.safeSet(IB.PREVIEW_KEY, '1'); window.open('../initiative.html?id=' + i.id, '_blank'); return; }
      else if (t.id === 'del') { if (!confirm('حذف المبادرة؟')) return; D.initiatives = D.initiatives.filter((x) => x !== i); save(); location.hash = '#initiatives'; return; }
      else return;
      save(true); render();
    });
  }

  /* ====================== الأخبار ====================== */
  function posts() {
    view.innerHTML = `<div class="toolbar"><input class="in grow" id="q" type="search" placeholder="ابحث في الأخبار…"><a class="btn pri" href="#post/new">${icon('megaphone', 'i')} خبر جديد</a></div>
    <div class="table-wrap"><table><thead><tr><th></th><th>العنوان</th><th>النوع</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>`;
    const render = (q = '') => {
      $('#rows').innerHTML = D.posts.filter((p) => !q || p.title.includes(q)).sort((a, b) => b.date.localeCompare(a.date)).map((p) => `<tr>
        <td>${p.cover ? `<img class="thumb" src="${esc(src(p.cover))}" alt="" loading="lazy">` : '<span class="thumb ph"></span>'}</td><td><a class="ttl" href="#post/${p.id}">${esc(p.title)}</a></td>
        <td><span class="tag ${p.kind === 'call' ? 'or' : 'new'}">${p.kind === 'call' ? 'دعوة مفتوحة' : 'قصة مبادرة'}</span></td><td class="small">${fmtDate(p.date)}</td>
        <td><span class="tag ${STATUS[p.status][1]}">${STATUS[p.status][0]}</span></td>
        <td><div class="row" style="flex-wrap:nowrap"><a class="btn sm" href="#post/${p.id}">تحرير</a><button class="btn sm icon danger" data-del="${p.id}">${icon('x', 'i')}</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="empty">لا توجد أخبار</td></tr>';
    };
    $('#q').oninput = (e) => render(e.target.value);
    $('#rows').onclick = (e) => { const d = e.target.closest('[data-del]'); if (d && confirm('حذف الخبر؟')) { D.posts = D.posts.filter((p) => p.id != d.dataset.del); save(); render(); } };
    render();
  }

  function postEditor(id) {
    let p = id === 'new' ? null : D.posts.find((x) => String(x.id) === id);
    if (!p) { if (id !== 'new') return notFound(); p = { id: uid(), title: 'خبر جديد', date: new Date().toISOString().slice(0, 10), category: 'إعلانات', kind: 'story', status: 'draft', cover: '', excerpt: '', content: '<p></p>', sourceUrl: '' }; D.posts.unshift(p); save(true); history.replaceState(null, '', '#post/' + p.id); }
    const render = () => {
      setTop(p.title, '<a href="#posts">الأخبار</a> / تحرير');
      view.innerHTML = `<div class="cols side-r"><div>
        <div class="panel"><div class="f">${fIn('title', 'العنوان', p.title)}${fTa('excerpt', 'المقتطف (يظهر في البطاقات)', p.excerpt)}</div></div>
        <div class="panel"><h2>المحتوى</h2><div class="sub">HTML بسيط: فقرات، عناوين، اقتباسات، قوائم، صور</div>
          <div class="ed-tools">${[['p', 'فقرة'], ['h3', 'عنوان'], ['strong', 'غامق'], ['blockquote', 'اقتباس'], ['ul', 'قائمة'], ['img', 'صورة']].map(([t, l]) => `<button type="button" data-wrap="${t}">${l}</button>`).join('')}</div>
          <div class="cols c2">${fTa('content', 'HTML', p.content, { code: true })}<div class="fld"><span class="l">معاينة</span><div class="preview-pane" id="pv"></div></div></div></div>
      </div><div style="position:sticky;top:76px">
        <div class="panel"><div class="f">${fSel('status', 'الحالة', p.status, Object.entries(STATUS).map(([k, v]) => [k, v[0]]))}${fSel('kind', 'النوع', p.kind, [['story', 'قصة مبادرة'], ['call', 'دعوة مفتوحة / إعلان']])}${fIn('date', 'التاريخ', p.date, { type: 'date' })}${fIn('category', 'التصنيف', p.category)}
          <div class="row"><button class="btn blue" type="button" id="prev">${icon('link', 'i')} معاينة</button></div></div></div>
        <div class="panel">${fImg('cover', 'صورة الغلاف', p.cover)}</div></div></div>`;
      pv();
    };
    const pv = () => { $('#pv').innerHTML = p.content.replace(/src="(?!https?:|data:)([^"]+)"/g, 'src="../$1"'); };
    render();
    bind(view, p, (el) => { if (el.dataset.p === 'content') pv(); });
    wireImages(view, p, render);
    view.addEventListener('click', async (e) => {
      const w = e.target.closest('[data-wrap]');
      if (w) {
        const ta = $('[data-p="content"]'); const [s, en] = [ta.selectionStart, ta.selectionEnd]; const sel = ta.value.slice(s, en) || 'نص';
        let ins;
        if (w.dataset.wrap === 'img') { const v = await mediaPicker(true); if (!v) return; ins = `<figure><img src="${v}" alt=""></figure>`; }
        else if (w.dataset.wrap === 'ul') ins = `<ul>\n${sel.split('\n').map((l) => `<li>${l}</li>`).join('\n')}\n</ul>`;
        else if (w.dataset.wrap === 'blockquote') ins = `<blockquote><p>${sel}</p><p><em>القائل</em></p></blockquote>`;
        else ins = `<${w.dataset.wrap}>${sel}</${w.dataset.wrap}>`;
        ta.setRangeText(ins, s, en, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
      }
      if (e.target.closest('#prev')) { IB.safeSet(IB.DRAFT_KEY, JSON.stringify(D)); IB.safeSet(IB.PREVIEW_KEY, '1'); window.open('../post.html?id=' + p.id, '_blank'); }
    });
  }

  /* ====================== الطلبات ====================== */
  function submissions(params) {
    view.innerHTML = `
    <div class="note" style="margin-bottom:14px">${icon('target', 'i')} الطلبات تحتوي بيانات شخصية لأعضاء الفرق، لذلك تُحفظ على هذا الجهاز فقط ولا تُنشر مع بيانات الموقع. لاستقبال الطلبات من كل الزوار ضع رابط استقبال في «محتوى الموقع ← النماذج»، ثم استورد ملف الطلبات هنا.</div>
    <div class="toolbar"><input class="in grow" id="q" type="search" placeholder="ابحث في الطلبات…">
      <select class="sel" id="fs" style="width:auto"><option value="">كل الحالات</option>${Object.entries(SUB_STATUS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
      <button class="btn" id="imp">${icon('box', 'i')} استيراد JSON</button><button class="btn" id="csv">${icon('send', 'i')} تصدير CSV</button></div>
    <div class="table-wrap"><table><thead><tr><th>رقم</th><th>المبادرة</th><th>النموذج</th><th>الموقع</th><th>المجالات</th><th>الاستلام</th><th>الحالة</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    <div class="drawer-bg" id="dbg"></div><aside class="drawer" id="drw" aria-label="تفاصيل الطلب"></aside>`;
    let st = { q: '', s: '' };
    const render = () => {
      const r = SUBS.filter((s) => (!st.s || s.status === st.s) && (!st.q || JSON.stringify(s).includes(st.q)));
      $('#rows').innerHTML = r.map((s) => `<tr><td class="small" dir="ltr">${esc(s.id)}</td><td><a class="ttl" href="#" data-open="${esc(s.id)}">${esc(s.title)}</a></td>
        <td><span class="tag ${s.form === 'pwd' ? 'or' : ''}">${s.form === 'pwd' ? 'ذوو الإعاقة' : 'عام'}</span></td><td class="small">${esc(s.location)}</td><td class="small">${esc((s.domains || []).join('، '))}</td>
        <td class="small">${fmtDate((s.receivedAt || '').slice(0, 10))}</td>
        <td><select class="sel" data-st="${esc(s.id)}" style="width:auto;padding:4px 8px">${Object.entries(SUB_STATUS).map(([k, v]) => `<option value="${k}"${k === s.status ? ' selected' : ''}>${v[0]}</option>`).join('')}</select></td>
        <td><button class="btn sm" data-open="${esc(s.id)}">عرض</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty">لا توجد طلبات</td></tr>';
    };
    const open = (id) => {
      const s = SUBS.find((x) => x.id === id); if (!s) return;
      $('#drw').innerHTML = `<div class="row between" style="margin-bottom:14px"><h2>${esc(s.title)}</h2><button class="btn icon" id="cls">${icon('x', 'i')}</button></div>
        <dl class="kv"><dt>رقم الطلب</dt><dd dir="ltr">${esc(s.id)}</dd><dt>تاريخ الاستلام</dt><dd>${esc((s.receivedAt || '').replace('T', ' ').slice(0, 16))}</dd><dt>النموذج</dt><dd>${s.form === 'pwd' ? 'مبادرات ذوي الإعاقة' : 'عام'}</dd>
        <dt>المجالات</dt><dd>${esc((s.domains || []).join('، '))}</dd><dt>الفئات</dt><dd>${esc((s.audiences || []).join('، '))}</dd><dt>الموقع</dt><dd>${esc(s.location)}</dd><dt>المدة</dt><dd>${esc(s.duration)}</dd><dt>الميزانية</dt><dd>${esc(s.budget)}</dd>
        <dt>المشكلة</dt><dd>${esc(s.problem)}</dd><dt>الأهداف</dt><dd>${esc(s.goals)}</dd><dt>الأنشطة</dt><dd>${esc(s.activities)}</dd>${s.access ? `<dt>المواءمة</dt><dd>${esc(s.access)}</dd>` : ''}
        <dt>الفريق</dt><dd>${(s.members || []).map((m) => `${esc(m.name)} — <span dir="ltr">${esc(m.phone)}</span> — ${esc(m.email)}`).join('<br>')}</dd></dl>
        <div class="fld" style="margin:16px 0"><label>ملاحظات الفريق</label><textarea class="ta" id="notes">${esc(s.notes || '')}</textarea></div>
        <div class="row"><button class="btn pri" id="toInit">${icon('spark', 'i')} تحويل إلى مبادرة (مسودة)</button><button class="btn" id="toIdea">${icon('bulb', 'i')} إضافة لبنك الأفكار</button>
          <a class="btn" href="mailto:${esc((s.members[0] || {}).email || '')}?subject=${encodeURIComponent('بنك المبادرات: ' + s.title)}">${icon('mail', 'i')} مراسلة</a><button class="btn danger" id="rmS">حذف</button></div>`;
      $('#drw').classList.add('open'); $('#dbg').classList.add('open');
      const close = () => { $('#drw').classList.remove('open'); $('#dbg').classList.remove('open'); };
      $('#cls').onclick = close; $('#dbg').onclick = close;
      $('#notes').oninput = (e) => { s.notes = e.target.value; saveSubs(); };
      $('#rmS').onclick = () => { if (!confirm('حذف الطلب من هذا الجهاز؟')) return; SUBS = SUBS.filter((x) => x !== s); saveSubs(); close(); render(); };
      $('#toIdea').onclick = () => { D.ideas.unshift({ id: uid(), title: s.title, summary: (s.problem || '').slice(0, 260), domains: s.domains || [], location: s.location || '', status: 'draft', fromSubmission: s.id }); save(); toast('أُضيفت إلى بنك الأفكار كمسودة (بدون بيانات شخصية)'); };
      $('#toInit').onclick = () => {
        const i = newInitiative(); i.title = s.title; i.summary = (s.problem || '').slice(0, 220); i.location = s.location || ''; i.themes = s.domains || []; i.audience = (s.audiences || []).join('، ');
        i.blocks[1].paragraphs = (s.problem || '').split('\n').filter(Boolean); i.blocks[3].items = (s.goals || '').split('\n').filter(Boolean); i.blocks[4].paragraphs = (s.activities || '').split('\n').filter(Boolean);
        D.initiatives.unshift(i); s.status = 'accepted'; saveSubs(); save(true); location.hash = '#initiative/' + i.id;
      };
    };
    $('#q').oninput = (e) => { st.q = e.target.value; render(); };
    $('#fs').onchange = (e) => { st.s = e.target.value; render(); };
    $('#rows').addEventListener('change', (e) => { const s = SUBS.find((x) => x.id === e.target.dataset.st); if (s) { s.status = e.target.value; saveSubs(); } });
    $('#rows').addEventListener('click', (e) => { const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); open(o.dataset.open); } });
    $('#imp').onclick = async () => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
      i.onchange = async () => { try { const arr = [].concat(JSON.parse(await i.files[0].text())); const ids = new Set(SUBS.map((s) => s.id)); let n = 0; arr.forEach((s) => { if (s && s.title && !ids.has(s.id)) { s.id = s.id || 'S' + uid().toString(36); s.status = s.status || 'new'; SUBS.unshift(s); n++; } }); saveSubs(); render(); toast(`تم استيراد ${n} طلب`); } catch (err) { toast('ملف غير صالح', true); } };
      i.click();
    };
    $('#csv').onclick = () => {
      const cols = ['id', 'receivedAt', 'status', 'form', 'title', 'domains', 'location', 'duration', 'audiences', 'budget', 'problem', 'goals', 'activities', 'access', 'contact_name', 'contact_phone', 'contact_email', 'team', 'notes'];
      const rows = SUBS.map((s) => cols.map((c) => {
        let v = c === 'contact_name' ? (s.members[0] || {}).name : c === 'contact_phone' ? (s.members[0] || {}).phone : c === 'contact_email' ? (s.members[0] || {}).email : c === 'team' ? (s.members || []).map((m) => m.name).join(' | ') : s[c];
        v = Array.isArray(v) ? v.join('، ') : (v == null ? '' : String(v));
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(','));
      download('initiatives-bank-submissions.csv', '﻿' + [cols.join(','), ...rows].join('\n'), 'text/csv');
    };
    render();
    if (params.get('open')) open(params.get('open'));
  }

  /* ====================== بنك الأفكار ====================== */
  function ideas() {
    const render = () => {
      view.innerHTML = `<div class="note" style="margin-bottom:14px">الأفكار المنشورة هنا تظهر في صفحة «بنك الأفكار» العامة. لا تضع بيانات تواصل شخصية.</div>
      <div class="toolbar"><span class="grow muted">${D.ideas.length} فكرة</span><button class="btn pri" id="add">+ فكرة جديدة</button></div>
      <div class="cols c2">${D.ideas.map((x, k) => `<div class="panel"><div class="f">${fIn(`${k}.title`, 'عنوان الفكرة', x.title)}${fTa(`${k}.summary`, 'وصف مختصر', x.summary)}<div class="f g2">${fIn(`${k}.domains`, 'المجالات', x.domains, { t: 'tags' })}${fIn(`${k}.location`, 'المنطقة', x.location)}</div>
        <div class="row between">${fSel(`${k}.status`, 'الحالة', x.status, [['draft', 'مسودة'], ['published', 'منشورة']])}<button class="btn sm danger" data-rm="${k}">حذف</button></div></div></div>`).join('') || '<div class="panel empty">لا توجد أفكار بعد. أضف فكرة أو حوّل طلبًا من صفحة الطلبات.</div>'}</div>`;
    };
    render(); bind(view, D.ideas);
    view.addEventListener('click', (e) => {
      if (e.target.closest('#add')) { D.ideas.unshift({ id: uid(), title: '', summary: '', domains: [], location: '', status: 'draft' }); save(true); render(); }
      const r = e.target.closest('[data-rm]'); if (r && confirm('حذف الفكرة؟')) { D.ideas.splice(+r.dataset.rm, 1); save(); render(); }
    });
  }

  /* ====================== محتوى الموقع ====================== */
  function listEditor(path, arr, fields, tpl, title) {
    return `<div class="panel"><div class="panel-head"><div><h2>${title}</h2></div><button type="button" class="btn sm" data-add="${path}" data-tpl='${esc(JSON.stringify(tpl))}'>+ إضافة</button></div>
      <div class="sub-list">${arr.map((x, j) => `<div class="sub-item" style="grid-template-columns:repeat(${fields.length},1fr) auto">${fields.map(([k, l, o]) => (o && o.img) ? fImg(`${path}.${j}.${k}`, l, x[k]) : (o && o.ta) ? fTa(`${path}.${j}.${k}`, l, x[k], o) : fIn(`${path}.${j}.${k}`, l, x[k], o || {})).join('')}
      <div class="row" style="flex-direction:column"><button type="button" class="btn sm icon" data-mv="${path}.${j}" data-d="-1" title="تقديم">${icon('arrowR', 'i')}</button><button type="button" class="btn sm icon danger" data-rm="${path}.${j}">${icon('x', 'i')}</button></div></div>`).join('')}</div></div>`;
  }
  function content() {
    const S = D.site;
    const tabs = { brand: 'الهوية والرئيسية', about: 'من نحن', partners: 'الشركاء', stories: 'قصص الميدان', contact: 'التواصل', submit: 'نموذج التقديم', legal: 'الصفحات القانونية' };
    let tab = 'brand';
    const render = () => {
      let body = '';
      if (tab === 'brand') body = `<div class="panel"><h2>الهوية</h2><div class="sub">&nbsp;</div><div class="f g2">${fIn('brand.name', 'الاسم', S.brand.name)}${fIn('brand.nameEn', 'الاسم بالإنجليزية', S.brand.nameEn)}${fIn('brand.tagline', 'الشعار', S.brand.tagline)}${fIn('brand.org', 'الجهة المنفذة', S.brand.org)}${fTa('brand.intro', 'النص التعريفي', S.brand.intro, { cls: 'full' })}${fImg('brand.logo', 'الشعار (خلفية فاتحة)', S.brand.logo)}${fImg('brand.logoLight', 'الشعار (خلفية داكنة)', S.brand.logoLight)}${fImg('heroImages.0', 'الصورة الرئيسية في الواجهة', S.heroImages[0])}</div></div>`
        + listEditor('stats', S.stats, [['value', 'الرقم', { t: 'num', type: 'number' }], ['label', 'الوصف'], ['icon', 'الأيقونة', { h: 'spark, bulb, people, hands' }]], { value: 0, label: '', icon: 'spark' }, 'أرقام الإنجازات')
        + listEditor('values', S.values, [['title', 'القيمة'], ['text', 'الوصف', { ta: 1 }], ['icon', 'الأيقونة']], { title: '', text: '', icon: 'spark' }, 'القيم');
      if (tab === 'about') body = `<div class="panel"><div class="f">${fTa('about.text', 'نص «من نحن» (كل سطر فقرة)', S.about.text, { t: 'lines', rows: 8 })}${fTa('about.vision', 'الرؤية', S.about.vision)}${fTa('about.mission', 'الرسالة', S.about.mission)}</div></div>`
        + listEditor('supportWays', S.supportWays, [['title', 'طريقة الدعم'], ['text', 'الوصف', { ta: 1 }], ['icon', 'الأيقونة']], { title: '', text: '', icon: 'hands' }, 'طرق التعاون (صفحة ادعم البنك)');
      if (tab === 'partners') body = listEditor('partners', S.partners, [['name', 'الاسم'], ['nameEn', 'بالإنجليزية'], ['role', 'الدور'], ['url', 'الرابط', { dir: 'ltr' }], ['logo', 'الشعار', { img: 1 }]], { name: '', nameEn: '', role: 'شريك', url: '', logo: '' }, 'الشركاء');
      if (tab === 'stories') body = listEditor('testimonials', S.testimonials, [['quote', 'الشهادة', { ta: 1 }], ['name', 'الاسم'], ['role', 'المكان / المبادرة']], { quote: '', name: '', role: '' }, 'ماذا يقول المبادرون');
      if (tab === 'contact') body = `<div class="panel"><div class="f g3">${fIn('contact.phone', 'الهاتف', S.contact.phone, { dir: 'ltr' })}${fIn('contact.ibEmail', 'بريد بنك المبادرات', S.contact.ibEmail, { dir: 'ltr' })}${fIn('contact.email', 'بريد المنتدى', S.contact.email, { dir: 'ltr' })}</div></div>`
        + listEditor('contact.offices', S.contact.offices, [['city', 'المدينة'], ['address', 'العنوان']], { city: '', address: '' }, 'المكاتب')
        + listEditor('contact.social', S.contact.social, [['name', 'المنصة', { h: 'Facebook, Instagram, X, LinkedIn, YouTube, TikTok' }], ['url', 'الرابط', { dir: 'ltr' }]], { name: '', url: '' }, 'حسابات التواصل');
      if (tab === 'submit') body = `<div class="panel"><h2>استقبال الطلبات</h2><div class="sub">بدون هذا الرابط تُحفظ الطلبات في متصفح المتقدّم فقط، ويُعرض عليه إرسال نسخة بالبريد.</div><div class="f">${fIn('forms.endpoint', 'رابط استقبال النماذج (POST JSON)', S.forms.endpoint, { dir: 'ltr', ph: 'https://formspree.io/f/xxxx أو رابط Google Apps Script', h: 'مثل Formspree أو Google Apps Script. تصل البيانات بصيغة JSON.' })}</div></div>
        <div class="panel"><div class="f g2">${fIn('submit.title', 'عنوان الصفحة', S.submit.title, { cls: 'full' })}${fTa('submit.intro', 'المقدمة', S.submit.intro, { cls: 'full' })}${fTa('submit.domains', 'المجالات (كل سطر مجال)', S.submit.domains, { t: 'lines', rows: 8 })}${fTa('submit.audiences', 'الفئات (كل سطر فئة)', S.submit.audiences, { t: 'lines', rows: 8 })}${fTa('submit.consent', 'بنود الموافقة المستنيرة', S.submit.consent, { t: 'lines', cls: 'full', rows: 6 })}</div></div>`
        + listEditor('submit.steps', S.submit.steps, [['title', 'الخطوة'], ['text', 'الوصف']], { title: '', text: '' }, 'خطوات التقديم')
        + listEditor('submit.faq', S.submit.faq, [['q', 'السؤال'], ['a', 'الجواب', { ta: 1 }]], { q: '', a: '' }, 'الأسئلة الشائعة');
      if (tab === 'legal') body = ['privacy', 'terms'].map((k) => `<div class="panel"><div class="f">${fIn(`legal.${k}.title`, 'العنوان', S.legal[k].title)}${fIn(`legal.${k}.updated`, 'آخر تحديث', S.legal[k].updated, { type: 'date' })}${fTa(`legal.${k}.content`, 'المحتوى (HTML)', S.legal[k].content, { code: true })}</div></div>`).join('');
      view.innerHTML = `<div class="row" style="margin-bottom:16px">${Object.entries(tabs).map(([k, v]) => `<button class="btn ${k === tab ? 'pri' : ''}" data-tab="${k}">${v}</button>`).join('')}</div>${body}`;
    };
    render(); bind(view, S); wireImages(view, S, render);
    view.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
      if (d.tab) { tab = d.tab; render(); return; }
      if (d.add) { getPath(S, d.add).push(JSON.parse(d.tpl)); }
      else if (d.rm) { const ks = d.rm.split('.'); const j = +ks.pop(); getPath(S, ks.join('.')).splice(j, 1); }
      else if (d.mv) { const ks = d.mv.split('.'); const j = +ks.pop(); const a = getPath(S, ks.join('.')); if (j > 0) [a[j - 1], a[j]] = [a[j], a[j - 1]]; }
      else return;
      save(); render();
    });
  }

  /* ====================== مكتبة الوسائط ====================== */
  function allMedia() {
    const m = new Map();
    const add = (p, where) => { if (!p || typeof p !== 'string') return; if (!m.has(p)) m.set(p, []); m.get(p).push(where); };
    D.initiatives.forEach((i) => { add(i.cover, i.title); (i.gallery || []).forEach((g) => add(g, i.title)); (i.team || []).forEach((t) => add(t.photo, i.title)); });
    D.posts.forEach((p) => { add(p.cover, p.title); (p.content.match(/src="([^"]+)"/g) || []).forEach((s) => add(s.slice(5, -1), p.title)); });
    D.site.partners.forEach((p) => add(p.logo, 'الشركاء')); D.site.about.images.forEach((p) => add(p, 'من نحن')); add(D.site.heroImages[0], 'الرئيسية');
    return m;
  }
  function media() {
    const m = allMedia();
    view.innerHTML = `<div class="toolbar"><input class="in grow" id="q" type="search" placeholder="ابحث باسم الملف أو المبادرة…"><button class="btn pri" id="up">${icon('image', 'i')} رفع صور</button></div>
      <p class="muted small">${m.size} صورة مستخدمة في الموقع</p><div class="media-grid" id="grid"></div>`;
    const render = (q = '') => {
      $('#grid').innerHTML = [...m.entries()].filter(([p, w]) => !q || (p + w.join()).includes(q)).map(([p, w]) => `<figure><img src="${esc(src(p))}" alt="" loading="lazy"><figcaption><span title="${esc(w[0])}">${esc(p.startsWith('data:') ? 'صورة مضمّنة' : p.split('/').pop())}</span><button class="btn sm icon" data-copy="${esc(p.startsWith('data:') ? '' : p)}" title="نسخ المسار">${icon('link', 'i')}</button></figcaption></figure>`).join('');
    };
    $('#q').oninput = (e) => render(e.target.value);
    $('#grid').onclick = (e) => { const c = e.target.closest('[data-copy]'); if (c && c.dataset.copy) { navigator.clipboard && navigator.clipboard.writeText(c.dataset.copy); toast('تم نسخ المسار'); } };
    $('#up').onclick = async () => { const fs = await pickFile(); for (const f of fs) { try { const p = await uploadImage(f); m.set(p, ['مرفوعة الآن']); } catch (err) { toast(err.message, true); } } render(); };
    render();
  }
  function mediaPicker() {
    return new Promise((res) => {
      const m = allMedia();
      const bg = document.createElement('div'); bg.className = 'drawer-bg open';
      const dr = document.createElement('aside'); dr.className = 'drawer open';
      dr.innerHTML = `<div class="row between" style="margin-bottom:12px"><h2>اختر صورة</h2><button class="btn icon" data-x>${icon('x', 'i')}</button></div><div class="media-grid">${[...m.keys()].filter((p) => !p.startsWith('data:')).map((p) => `<figure style="cursor:pointer" data-p="${esc(p)}"><img src="${esc(src(p))}" alt="" loading="lazy"></figure>`).join('')}</div>`;
      document.body.append(bg, dr);
      const done = (v) => { bg.remove(); dr.remove(); res(v); };
      bg.onclick = () => done(null);
      dr.onclick = (e) => { if (e.target.closest('[data-x]')) done(null); const f = e.target.closest('[data-p]'); if (f) done(f.dataset.p); };
    });
  }

  /* ====================== النشر ====================== */
  function siteJS(data) { return '/* بيانات موقع بنك المبادرات — يُولَّد ويُحدَّث من لوحة التحكم */\nwindow.IB_DATA = ' + JSON.stringify(data, null, 1) + ';\n'; }
  function exportData() { const o = clone(D); o.generatedAt = new Date().toISOString().slice(0, 10); delete o.submissions; o.initiatives.forEach(syncDerived); return o; }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
  async function ghReq(cfg, path, opt) {
    const r = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}${opt && opt.method ? '' : '?ref=' + encodeURIComponent(cfg.branch)}`, Object.assign({ headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json' } }, opt || {}));
    if (!r.ok && r.status !== 404) { const j = await r.json().catch(() => ({})); throw new Error(j.message || 'HTTP ' + r.status); }
    return r.status === 404 ? null : r.json();
  }
  async function ghPut(cfg, path, contentB64, message) {
    const cur = await ghReq(cfg, path);
    return ghReq(cfg, path, { method: 'PUT', headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message, content: contentB64, branch: cfg.branch, sha: cur ? cur.sha : undefined }) });
  }
  function diffSummary() {
    const c = (a, b, key) => { const A = new Map(a.map((x) => [String(x.id), JSON.stringify(x)])); const B = new Map(b.map((x) => [String(x.id), JSON.stringify(x)])); let add = 0, mod = 0, del = 0; A.forEach((v, k) => { if (!B.has(k)) add++; else if (B.get(k) !== v) mod++; }); B.forEach((v, k) => { if (!A.has(k)) del++; }); return `${key}: ${add} جديد، ${mod} معدّل، ${del} محذوف`; };
    return [c(D.initiatives, PUB.initiatives, 'المبادرات'), c(D.posts, PUB.posts, 'الأخبار'), c(D.ideas || [], PUB.ideas || [], 'الأفكار'), 'محتوى الموقع: ' + (JSON.stringify(D.site) === JSON.stringify(PUB.site) ? 'بدون تغيير' : 'معدّل')];
  }
  function publish() {
    const cfg = gh() || { owner: 'mahabuhamada', repo: 'gaza-timeline', branch: 'main', token: '' };
    const inlined = JSON.stringify(D).match(/data:image\/[^"]+/g) || [];
    view.innerHTML = `<div class="cols c2">
      <div class="panel"><h2>ملخص التغييرات</h2><div class="sub">مقارنة المسودة بالنسخة المنشورة</div>
        <div class="checks">${diffSummary().map((x) => `<a>${icon('check', 'i')} ${esc(x)}</a>`).join('')}</div>
        ${inlined.length ? `<div class="note warn" style="margin-top:12px">${inlined.length} صورة مخزّنة داخل المسودة (لم تُرفع كملفات). اربط GitHub وأعد رفعها لتقليل حجم البيانات.</div>` : ''}
        <div class="row" style="margin-top:16px"><button class="btn blue" id="pv">${icon('link', 'i')} معاينة الموقع بالمسودة</button><button class="btn danger" id="reset">تجاهل المسودة</button></div></div>
      <div class="panel"><h2>النشر إلى GitHub</h2><div class="sub">يحدّث ملف data/site-data.js في المستودع، وينشره GitHub Pages تلقائيًا.</div>
        <div class="f g2">
          <div class="fld"><label>المالك</label><input class="in" id="gOwner" dir="ltr" value="${esc(cfg.owner)}"></div>
          <div class="fld"><label>المستودع</label><input class="in" id="gRepo" dir="ltr" value="${esc(cfg.repo)}"></div>
          <div class="fld"><label>الفرع</label><input class="in" id="gBranch" dir="ltr" value="${esc(cfg.branch)}"></div>
          <div class="fld"><label>رمز الوصول (Fine-grained token)</label><input class="in" id="gToken" dir="ltr" type="password" value="${esc(cfg.token)}" placeholder="github_pat_…"><div class="h">صلاحية Contents: Read & Write على هذا المستودع فقط.</div></div>
          <label class="sw full"><input type="checkbox" id="gRemember"${IB.safeGet(GH_KEY) ? ' checked' : ''}> تذكّر الرمز على هذا الجهاز (وإلا يُحذف بإغلاق المتصفح)</label>
        </div>
        <div class="row" style="margin-top:14px"><button class="btn" id="gSave">حفظ الإعدادات</button><button class="btn pri" id="gPub">${icon('send', 'i')} نشر الآن</button></div>
        <div id="gMsg" style="margin-top:12px"></div></div>
      <div class="panel"><h2>تصدير واستيراد</h2><div class="sub">للنسخ الاحتياطي أو للنشر اليدوي: ضع site-data.js داخل مجلد data</div>
        <div class="row"><button class="btn" id="exJs">${icon('box', 'i')} تنزيل site-data.js</button><button class="btn" id="exJson">تنزيل JSON</button><button class="btn" id="imJson">استيراد JSON</button></div></div>
      <div class="panel"><h2>عن الأمان</h2><div class="sub">&nbsp;</div><p class="small muted" style="margin:0">لوحة التحكم صفحة ثابتة: أي شخص يفتحها يرى نسخة من البيانات العامة فقط. الحماية الحقيقية هي رمز GitHub، فبدونه لا يمكن تعديل الموقع المنشور. لا تشارك الرمز، واستخدم رمزًا محدود الصلاحية بمستودع واحد.</p></div>
    </div>`;
    const readCfg = () => ({ owner: $('#gOwner').value.trim(), repo: $('#gRepo').value.trim(), branch: $('#gBranch').value.trim() || 'main', token: $('#gToken').value.trim() });
    const storeCfg = () => { const c = readCfg(); const s = JSON.stringify(c); if ($('#gRemember').checked) { IB.safeSet(GH_KEY, s); } else { IB.safeDel(GH_KEY); try { sessionStorage.setItem(GH_KEY, s); } catch (e) { /* ignore */ } } return c; };
    $('#gSave').onclick = () => { storeCfg(); toast('تم حفظ الإعدادات'); };
    $('#gPub').onclick = async () => {
      const c = storeCfg(); const msg = $('#gMsg');
      if (!c.token) { msg.innerHTML = '<div class="note bad">أدخل رمز الوصول أولًا.</div>'; return; }
      $('#gPub').disabled = true; msg.innerHTML = '<div class="note">جارٍ النشر…</div>';
      try {
        const data = exportData();
        await ghPut(c, 'data/site-data.js', b64(siteJS(data)), 'تحديث بيانات الموقع من لوحة التحكم');
        await ghPut(c, 'data/site-data.json', b64(JSON.stringify(data, null, 1)), 'تحديث نسخة JSON من بيانات الموقع');
        window.IB_DATA = data; Object.assign(PUB, clone(data)); IB.safeDel(IB.DRAFT_KEY); D = clone(data); D.ideas = D.ideas || [];
        msg.innerHTML = `<div class="note">${icon('check', 'i')} تم النشر إلى <b dir="ltr">${esc(c.owner)}/${esc(c.repo)}@${esc(c.branch)}</b>. يظهر التحديث على الموقع خلال دقيقة تقريبًا.</div>`;
        updateStatus();
      } catch (err) { msg.innerHTML = `<div class="note bad">فشل النشر: ${esc(err.message)}</div>`; }
      $('#gPub').disabled = false;
    };
    $('#exJs').onclick = () => download('site-data.js', siteJS(exportData()), 'text/javascript');
    $('#exJson').onclick = () => download('site-data.json', JSON.stringify(exportData(), null, 1));
    $('#imJson').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { const o = JSON.parse(await i.files[0].text()); if (!o.site || !o.initiatives) throw new Error(); D = o; D.ideas = D.ideas || []; save(); publish(); toast('تم الاستيراد إلى المسودة'); } catch (e) { toast('ملف غير صالح', true); } }; i.click(); };
    $('#pv').onclick = () => { IB.safeSet(IB.DRAFT_KEY, JSON.stringify(D)); IB.safeSet(IB.PREVIEW_KEY, '1'); window.open('../index.html', '_blank'); };
    $('#reset').onclick = () => { if (!confirm('تجاهل كل التغييرات غير المنشورة؟')) return; IB.safeDel(IB.DRAFT_KEY); IB.safeDel(IB.PREVIEW_KEY); D = clone(PUB); D.ideas = D.ideas || []; updateStatus(); publish(); toast('تمت استعادة النسخة المنشورة'); };
  }

  function notFound() { view.innerHTML = '<div class="panel empty">العنصر غير موجود. <a href="#overview">العودة</a></div>'; }

  /* ---------------- التوجيه ---------------- */
  const ROUTES = {
    overview: ['نظرة عامة', overview], initiatives: ['المبادرات', initiatives], posts: ['الأخبار والإعلانات', posts], submissions: ['طلبات «قدّم فكرتك»', submissions],
    ideas: ['بنك الأفكار', ideas], content: ['محتوى الموقع', content], media: ['مكتبة الوسائط', media], publish: ['النشر والنسخ الاحتياطي', publish],
  };
  function setTop(t, crumb) { $('#ttl').textContent = t; $('#crumb').innerHTML = crumb || ''; document.title = t + ' | لوحة تحكم بنك المبادرات'; }
  function route() {
    const [h, q] = (location.hash.slice(1) || 'overview').split('?'); const [r, id] = h.split('/'); const params = new URLSearchParams(q || '');
    $$('.side nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + ({ initiative: 'initiatives', post: 'posts' }[r] || r)));
    $('.side').classList.remove('open');
    const old = document.getElementById('view'); view = old.cloneNode(false); old.replaceWith(view);
    if (r === 'initiative') return initiativeEditor(id);
    if (r === 'post') return postEditor(id);
    const R = ROUTES[r] || ROUTES.overview; setTop(R[0], ''); R[1](params);
    window.scrollTo(0, 0);
  }

  // بناء الهيكل
  document.getElementById('app').innerHTML = `
  <aside class="side" id="side">
    <div class="logo"><img src="../${esc(D.site.brand.logoLight)}" alt="بنك المبادرات"><div><small>لوحة التحكم</small></div></div>
    <nav aria-label="أقسام اللوحة">
      <a href="#overview">${icon('grid', 'i')} نظرة عامة</a>
      <div class="grp">المحتوى</div>
      <a href="#initiatives">${icon('spark', 'i')} المبادرات</a>
      <a href="#posts">${icon('megaphone', 'i')} الأخبار والإعلانات</a>
      <a href="#ideas">${icon('bulb', 'i')} بنك الأفكار</a>
      <a href="#media">${icon('image', 'i')} مكتبة الوسائط</a>
      <div class="grp">التواصل</div>
      <a href="#submissions">${icon('mail', 'i')} الطلبات <span class="badge" data-badge="subs" hidden></span></a>
      <div class="grp">الإعدادات</div>
      <a href="#content">${icon('folder', 'i')} محتوى الموقع</a>
      <a href="#publish">${icon('send', 'i')} النشر</a>
    </nav>
    <div class="foot"><a href="../index.html" target="_blank" rel="noopener">${icon('link', 'i')} فتح الموقع</a><a href="https://initiativesbank.ps" target="_blank" rel="noopener">${icon('globe', 'i')} الموقع القديم</a></div>
  </aside>
  <div class="main">
    <header class="top"><button class="menu-t" id="mt" aria-label="القائمة">${icon('menu', 'i')}</button><div><div class="crumb" id="crumb"></div><h1 id="ttl"></h1></div><span class="sp"></span><span class="status" id="status"></span><a class="btn pri sm" href="#publish">${icon('send', 'i')} نشر</a></header>
    <div class="view" id="view"></div>
  </div>`;
  $('#mt').onclick = () => $('#side').classList.toggle('open');

  window.addEventListener('hashchange', route);

  updateStatus(); updateBadges(); route();
})();
