"""Build data/site-data.js for the new Initiatives Bank site from the scraped WordPress content.

usage: python3 -I build_data.py <scratch-dir> <repo-dir>
"""
import glob, html, json, os, re, sys, urllib.parse
from bs4 import BeautifulSoup

S, REPO = sys.argv[1], sys.argv[2]
RAW = os.path.join(S, 'raw')
initiatives = json.load(open(os.path.join(S, 'initiatives.json')))
media = {}
for f in glob.glob(os.path.join(RAW, 'media.*.json')):
    for m in json.load(open(f)):
        media[m['id']] = m

ORIGIN = 'https://initiativesbank.ps/wp-content/uploads/'
images = {}  # remote url -> local path (relative to repo root)


def local(url):
    """Register a remote upload for download and return its local path."""
    if not url:
        return ''
    url = html.unescape(url)
    if not url.startswith(ORIGIN):
        return url
    rel = urllib.parse.unquote(url[len(ORIGIN):])
    path = 'assets/uploads/' + rel
    images[url] = path
    return path


def large(media_id, fallback=''):
    m = media.get(media_id)
    if not m:
        return fallback
    sizes = m.get('media_details', {}).get('sizes', {})
    for k in ('large', '1536x1536', 'medium_large', 'full'):
        if k in sizes:
            return sizes[k]['source_url']
    return m['source_url']


def clean(t):
    return re.sub(r'\s+', ' ', t or '').strip()


# ---------- initiatives ----------
CATS = [
    ('دمج ذوي الإعاقة', ['إعاقة', 'الشمول', 'شاملة', 'الوصول بكرامة']),
    ('دعم نفسي وترفيهي', ['نفسي', 'ترفيه', 'فرح', 'طمأنينة', 'آمن', 'أمان', 'توازن']),
    ('صحة وتوعية', ['صحي', 'صحة', 'توعي', 'ووعي', 'الوعي', 'الاستغلال', 'التنمر']),
    ('فنون وثقافة', ['فني', 'ثقافي', 'الفن', 'الهوية', 'خيال', 'إبداع']),
    ('تمكين اقتصادي', ['اقتصادي', 'تمكين النساء', 'للسيدات']),
    ('رياضة', ['رياض', 'كرة سلة', 'كرة القدم']),
    ('تعليم', ['تعليم']),
    ('استجابة إنسانية', ['إنساني', 'عاجلة', 'يروي', 'تعمر']),
]


def themes(d):
    text = ' '.join([d['title'], d['type']])
    out = [name for name, keys in CATS if any(k in text for k in keys)]
    return out[:3] or ['مبادرات مجتمعية']


def audience_groups(d):
    a = d['audience']
    g = []
    for name, keys in [('أشخاص ذوو إعاقة', ['إعاقة']), ('نساء', ['نساء', 'سيدات', 'الأمهات', 'النساء']), ('فتيات ويافعات', ['الفتيات', 'يافعات']),
                       ('أطفال ويافعون', ['أطفال', 'الأطفال', 'الأطفل', 'اليافعين', '12 إلى', '12–15', 'سنة']), ('شباب', ['الشباب', 'شاب', '18 إلى']),
                       ('نازحون', ['نازح', 'النازحين', 'النازحون', 'نزوح']), ('مجتمع محلي', ['المجتمع المحلي', 'المجتمع']), ('كبار السن', ['كبار السن']),
                       ('معلمون وطلاب', ['المعلمين', 'الطلاب'])]:
        if name == 'أطفال ويافعون' and 'الفتيات' in a:
            continue
        if any(k in a for k in keys):
            g.append(name)
    return g or ['المجتمع المحلي']


def beneficiaries(d):
    """Sum numbers mentioned in the target-audience card (best effort, editable from the dashboard)."""
    total = 0
    for b in d['blocks']:
        if b['kind'] == 'info':
            for c in b['cards']:
                if 'الفئة' in c['label']:
                    for line in c['lines']:
                        m = re.match(r'\s*(\d{1,4})\s', line)
                        if m:
                            total += int(m.group(1))
    return total


def project(d):
    ctx = ' '.join(p for b in d['blocks'] if b.get('title', '').startswith('السياق') for p in b.get('paragraphs', []))
    if 'الوصول للجميع' in ctx or 'MAP' in ctx:
        return 'الوصول للجميع (A4A) – بالشراكة مع MAP'
    if 'Youth Hub' in ctx or 'YOUTH HUB' in ctx.upper():
        return 'SDF Youth Hub'
    return 'بنك المبادرات'


out_inits = []
for d in initiatives:
    blocks = []
    for b in d['blocks']:
        b = dict(b)
        if b['kind'] == 'gallery':
            b['images'] = [local(u) for u in b['images']]
        if b['kind'] == 'team':
            b['members'] = [dict(m, photo=local(m['photo'])) for m in b['members']]
        blocks.append(b)
    cover = large(next((x['featured_media'] for x in json.load(open(os.path.join(RAW, 'sdf_initiative.1.json'))) if x['id'] == d['id']), 0), d['cover'])
    out_inits.append({
        'id': d['id'],
        'slug': d['slug'],
        'title': d['title'],
        'summary': d['summary'],
        'date': d['date'],
        'status': 'published',
        'featured': False,
        'location': d['location'],
        'governorate': d['governorate'],
        'audience': d['audience'],
        'audienceGroups': audience_groups(d),
        'type': d['type'],
        'themes': themes(d),
        'project': project(d),
        'beneficiaries': None,
        'cover': local(cover),
        'gallery': [local(u) for u in d['gallery']],
        'team': [dict(m, photo=local(m['photo'])) for m in d['team']],
        'blocks': blocks,
        'sourceUrl': d['link'],
    })
for d in out_inits[:3]:
    d['featured'] = True

# ---------- news posts ----------
ALLOWED = {'p', 'strong', 'b', 'em', 'i', 'blockquote', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'figure', 'img', 'a', 'br', 'figcaption'}


def sanitize(h):
    s = BeautifulSoup(h, 'lxml')
    for t in s.find_all(True):
        if t.name in ('html', 'body'):
            continue
        if t.name not in ALLOWED:
            t.unwrap()
            continue
        attrs = {}
        if t.name == 'img':
            src = t.get('src', '')
            attrs = {'src': local(src), 'alt': t.get('alt', ''), 'loading': 'lazy'}
        if t.name == 'a' and t.get('href', '').startswith('http'):
            attrs = {'href': t['href'], 'target': '_blank', 'rel': 'noopener'}
        t.attrs = attrs
    body = s.body or s
    out = ''.join(str(c) for c in body.contents)
    out = re.sub(r'<p>\s*(&nbsp;)?\s*</p>', '', out)
    return re.sub(r'\n{2,}', '\n', out).strip()


cats = {c['id']: c['name'] for c in json.load(open(os.path.join(RAW, 'categories.1.json')))}
posts = []
for p in json.load(open(os.path.join(RAW, 'posts.1.json'))):
    ex = clean(BeautifulSoup(p['excerpt']['rendered'], 'lxml').get_text())
    ex = re.sub(r'\s*\[…\]|\s*\[&hellip;\]', '…', ex)
    posts.append({
        'id': p['id'],
        'title': clean(html.unescape(p['title']['rendered'])),
        'date': p['date'][:10],
        'category': cats.get(p['categories'][0], 'إعلانات') if p['categories'] else 'إعلانات',
        'kind': 'call' if any(k in p['title']['rendered'] for k in ('دعوة', 'فرص', 'تقديم')) else 'story',
        'status': 'published',
        'cover': local(large(p['featured_media'])),
        'excerpt': ex,
        'content': sanitize(p['content']['rendered']),
        'sourceUrl': p['link'],
    })

# ---------- testimonials (home page) ----------
home = BeautifulSoup(open(os.path.join(RAW, 'pages', 'home.html'), encoding='utf8'), 'lxml')
testimonials = []
for t in home.select('.elementskit-testimonial-slider .swiper-slide, .elementskit-single-testimonial-slider'):
    q = t.select_one('.elementskit-commentor-coment, .elementskit-commentor-content p, p')
    n = t.select_one('.elementskit-author-name, strong.author-name, .author-name')
    r = t.select_one('.elementskit-author-des, .author-des')
    if q and n:
        item = {'quote': clean(q.get_text()), 'name': clean(n.get_text()), 'role': clean(r.get_text()) if r else ''}
        if item not in testimonials:
            testimonials.append(item)

# ---------- static content ----------
site = {
    'brand': {
        'name': 'بنك المبادرات', 'nameEn': 'Initiatives Bank',
        'tagline': 'نبادر اليوم لنصنع غدًا أفضل',
        'intro': 'نؤمن بأن التغيير يبدأ بفكرة، وأن الشباب هم القوة المحركة لهذا التغيير في مجتمعاتهم المحليّة.',
        'logo': local(ORIGIN + '2024/03/inb.png'), 'logoLight': local(ORIGIN + '2024/03/inb2.png'),
        'icon': local(ORIGIN + '2024/08/cropped-00-192x192.png'),
        'org': 'المنتدى الاجتماعي التنموي', 'orgUrl': 'https://sdf-pal.org/',
    },
    'heroImages': [local(ORIGIN + '2024/10/WhatsApp-Image-2024-08-28-at-1.23.14-PM.jpg')],
    'stats': [
        {'value': 80, 'label': 'مُبادرة ناجحة', 'icon': 'spark'},
        {'value': 500, 'label': 'مُبادرة مقدّمة', 'icon': 'bulb'},
        {'value': 3000, 'label': 'مُبادر/ة ومتطوع/ة', 'icon': 'people'},
        {'value': 40, 'label': 'شريك متعاون', 'icon': 'hands'},
    ],
    'values': [
        {'title': 'الابتكار', 'text': 'نشجع التفكير الإبداعي والمبادرات التي تقدم حلولًا جديدة للمشاكل المجتمعية.', 'icon': 'bulb'},
        {'title': 'التمكين', 'text': 'نعمل على تمكين الشباب بالمهارات والمعرفة والموارد التي يحتاجونها للنجاح.', 'icon': 'rocket'},
        {'title': 'التعاون', 'text': 'نؤمن بأن النجاح يأتي من العمل الجماعي والشراكات المجتمعية القوية.', 'icon': 'hands'},
        {'title': 'الاستدامة', 'text': 'نسعى إلى إحداث تأثير طويل الأمد في المجتمع من خلال مبادرات ذات قيمة مستدامة.', 'icon': 'globe'},
        {'title': 'الشمولية', 'text': 'نؤمن بأن لكل فرد في المجتمع دورًا في التغيير، وأن تحظى جميع الأفكار بالدعم ومشاركة الجميع.', 'icon': 'people'},
    ],
    'about': {
        'title': 'بنك المبادرات',
        'text': [
            'مساحة لدعم الأفكار والمبادرات الشبابية في فلسطين، نتطلع لدعم أفكار وتدخلات الشباب من أجل المجتمع لتعزيز مشاركتهم وبناء الثقة مع المجتمع المحلي.',
            'بنك المبادرات يعمل على خلق مساحة مشتركة تجمع المبادرين/ات والمنظمات والجهات الفاعلة في المجتمع الفلسطيني من أجل التعاون وتعميق العلاقة من أكثر الفئات المجتمعية قدرة على التأثير.',
            'فكرة مشروع بنك المبادرات هي واحدة من مبادرات المنتدى الاجتماعي التنموي في فلسطين ونسعى بشكل مستمر لتعزيز الشراكة مع مختلف المنظمات والجهات النشطة في المجتمع الفلسطيني.',
            'تتيح المنصة الفرصة أمام المبادرين/ات لتقديم أفكارهم وكذلك الأمر توفر المنصة مساحة للجهات الراعية والراغبة في دعم الجهود المجتمعية بالمساهمة في دعم أفكار المبادرات.',
        ],
        'vision': 'تمكين الشباب في فلسطين لبناء مجتمع أفضل من خلال الابتكار والمبادرات المجتمعية.',
        'mission': 'توفير الدعم اللازم لتحقيق مبادرات شبابية مؤثرة ومستدامة تعود بالنفع على المجتمع الفلسطيني.',
        'images': [local(ORIGIN + '2025/08/ngo-img-2.jpg'), local(ORIGIN + '2025/08/ngo-img-3.jpg'), local(ORIGIN + '2025/08/ngo-img-4.jpg')],
        'illustration': local(ORIGIN + '2025/08/543543443.png'),
    },
    'partners': [
        {'name': 'المنتدى الاجتماعي التنموي', 'nameEn': 'Social Development Forum', 'logo': local(ORIGIN + '2024/10/sdflogo.png'), 'url': 'https://sdf-pal.org/', 'role': 'الجهة المنفذة'},
        {'name': 'جمعية العون الطبي للفلسطينيين', 'nameEn': 'Medical Aid for Palestinians (MAP)', 'logo': local(ORIGIN + '2025/08/MAP3.png'), 'url': 'https://www.map.org.uk/arabic/home-ar', 'role': 'شريك – مشروع الوصول للجميع'},
        {'name': 'صندوق الأمم المتحدة للسكان', 'nameEn': 'UNFPA Palestine', 'logo': local(ORIGIN + '2024/10/unflogo.png'), 'url': 'https://palestine.unfpa.org/ar/unfpa-palestine', 'role': 'شريك'},
        {'name': 'منظمة الأمم المتحدة للطفولة', 'nameEn': 'UNICEF State of Palestine', 'logo': local(ORIGIN + '2024/10/unclogo.png'), 'url': 'https://www.unicef.org/sop/ar', 'role': 'شريك'},
    ],
    'supportWays': [
        {'title': 'فرص التعاون', 'text': 'شارك في مشاريع تتماشى مع أهداف مؤسستك. تعاون معنا لتطوير وتنفيذ مبادرات تفيد المجتمعات وتحقق القيمة المضافة.', 'icon': 'hands'},
        {'title': 'تبادل الموارد', 'text': 'ساهم بمواردك أو خبراتك أو تقنياتك لتعزيز مبادراتنا. دعمك يمكن أن يساعدنا في تحقيق نتائج أكثر كفاءة وتأثيرًا.', 'icon': 'box'},
        {'title': 'الفعاليات والحملات المشتركة', 'text': 'انضم إلينا في تنظيم الفعاليات وورش العمل وحملات التوعية التي تدعم أهدافنا المشتركة. تعاون معنا في إنشاء برامج توعية ذات تأثير كبير.', 'icon': 'megaphone'},
    ],
    'submit': {
        'title': 'قدّم فكرتك، ونساعدك في تحويلها إلى مبادرة على أرض الواقع',
        'intro': 'نرحّب بأفكار الشباب والفرق والمؤسسات التي تُحدث تغييرًا إيجابيًا في المجتمع الفلسطيني، في غزة والضفة الغربية.',
        'badges': ['التقديم مجاني', 'نموذج مخصص لمبادرات ذوي الإعاقة', 'يُحفظ ما تكتبه تلقائيًا'],
        'consent': [
            'يجمع بنك المبادرات البيانات الواردة في هذا النموذج لغرض واحد: دراسة فكرة المبادرة والتواصل مع فريقها بشأنها.',
            'تتضمّن البيانات معلومات شخصية عن أعضاء الفريق، ونتعامل معها بسرّية تامة.',
            'لا يطّلع على البيانات إلا الفريق المختص في بنك المبادرات، ولا تُشارَك مع أي جهة خارجية بصورة تكشف هوية أحد دون موافقة صاحبها.',
            'تقديم الطلب طوعي، ويحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت عبر info@initiativesbank.ps.',
        ],
        'domains': ['التعليم', 'الصحة', 'البيئة', 'التحول الرقمي', 'الفنون والثقافة', 'الرياضة', 'الصحة الجنسية والإنجابية', 'حقوق الإنسان',
                    'المشاركة الاجتماعية', 'ريادة الأعمال', 'المواءمة والشمول', 'نفسي وترفيهي', 'الدعم الإنساني', 'أخرى'],
        'audiences': ['الشباب', 'النساء', 'الأطفال', 'الفتيان/ات', 'كبار السن', 'الأشخاص ذوي الإعاقة', 'أخرى'],
        'steps': [
            {'title': 'اختر النموذج المناسب', 'text': 'بحسب الفئة التي تستهدفها مبادرتك.'},
            {'title': 'اكتب فكرتك', 'text': 'المشكلة، والأهداف، والأنشطة، والموازنة.'},
            {'title': 'أرسل الطلب', 'text': 'يصلك بريد تأكيد باسم مبادرتك.'},
            {'title': 'نراجع ونتواصل', 'text': 'يدرس الفريق الطلب ويتواصل مع شخص التواصل.'},
        ],
        'faq': [
            {'q': 'من يمكنه التقديم؟', 'a': 'الأفراد والفرق الشبابية والمؤسسات، ومنها مؤسسات الأشخاص ذوي الإعاقة.'},
            {'q': 'هل أستطيع إكمال الطلب لاحقًا؟', 'a': 'نعم، يحفظ النموذج إجاباتك على جهازك تلقائيًا، وتعود إليها من المتصفح نفسه.'},
            {'q': 'كيف تُستخدم بياناتي؟', 'a': 'لدراسة الطلب والتواصل معك فقط، ولا يطّلع عليها إلا الفريق المختص. تجد تفاصيل الموافقة المستنيرة في بداية النموذج.'},
        ],
    },
    'contact': {
        'phone': '00970562525204', 'email': 'info@sdf-pal.org', 'ibEmail': 'info@initiativesbank.ps',
        'offices': [
            {'city': 'مدينة غزة', 'address': 'شارع حبوش (المؤسسات) – عمارة حجي – الطابق السادس'},
            {'city': 'مدينة غزة', 'address': 'شارع اليرموك – بجوار التاج مول – عمارة حندوقة – الأرضي'},
            {'city': 'دير البلح', 'address': 'البلد – دوار المدفع – عمارة المركز – الطابق الأول'},
            {'city': 'خانيونس', 'address': 'المواصي – أرض المجايدة – عمارة فتحي المجايدة'},
            {'city': 'رام الله', 'address': 'المنارة – مجمع المنارة – الطابق التاسع'},
            {'city': 'نابلس', 'address': 'شارع ابن رشد، درج العقاد، عمارة نادي جبل النار'},
        ],
        'social': [
            {'name': 'Facebook', 'url': 'https://www.facebook.com/sdf.pal/'},
            {'name': 'Instagram', 'url': 'https://www.instagram.com/sdf.pal/'},
            {'name': 'X', 'url': 'https://twitter.com/SdfPal'},
            {'name': 'LinkedIn', 'url': 'https://www.linkedin.com/company/social-forum-sdf/'},
            {'name': 'YouTube', 'url': 'https://www.youtube.com/@socialdevelopmentalforum-s652'},
            {'name': 'TikTok', 'url': 'https://www.tiktok.com/@sdf.pal'},
        ],
    },
}


def legal(slug):
    s = BeautifulSoup(open(os.path.join(RAW, 'pages', slug + '.html'), encoding='utf8'), 'lxml')
    page = json.load(open(os.path.join(RAW, 'pages.1.json')))
    p = next(x for x in page if x['slug'] == slug)
    return {'title': clean(html.unescape(p['title']['rendered'])), 'updated': '2024-10-23', 'content': sanitize(p['content']['rendered'])}


site['legal'] = {'privacy': legal('privacy-policy'), 'terms': legal('terms-and-conditions')}
site['forms'] = {'endpoint': '', 'note': 'ضع رابط استقبال النماذج (مثل Formspree أو Google Apps Script) ليصل كل طلب تلقائيًا.'}
site['testimonials'] = testimonials

data = {
    'version': 1,
    'generatedAt': '2026-11-12',
    'source': 'https://initiativesbank.ps',
    'site': site,
    'initiatives': out_inits,
    'posts': posts,
    'ideas': [],
    'submissions': [],
}
os.makedirs(os.path.join(REPO, 'data'), exist_ok=True)
js = json.dumps(data, ensure_ascii=False, indent=1)
open(os.path.join(REPO, 'data', 'site-data.js'), 'w').write(
    '/* بيانات موقع بنك المبادرات — يُولَّد ويُحدَّث من لوحة التحكم */\nwindow.IB_DATA = ' + js + ';\n')
open(os.path.join(REPO, 'data', 'site-data.json'), 'w').write(js)
json.dump(images, open(os.path.join(S, 'images.json'), 'w'), ensure_ascii=False, indent=1)
print('initiatives', len(out_inits), 'posts', len(posts), 'testimonials', len(testimonials), 'images', len(images))
