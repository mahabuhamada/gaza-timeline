import json, re, sys, html, glob, os
from bs4 import BeautifulSoup
RAW = sys.argv[1]; OUT = sys.argv[2]
def clean(t): return re.sub(r'\s+', ' ', t or '').strip()
def lines(el):
    for br in el.find_all('br'): br.replace_with('\n')
    return [clean(x) for x in el.get_text().split('\n') if clean(x)]
meta = {x['id']: x for x in json.load(open(os.path.join(RAW, 'sdf_initiative.1.json')))}
media = {}
for f in glob.glob(os.path.join(RAW, 'media.*.json')):
    for m in json.load(open(f)): media[m['id']] = m['source_url']
res = []
for iid, m in meta.items():
    s = BeautifulSoup(open(os.path.join(RAW, 'init', f'{iid}.html'), encoding='utf8'), 'lxml')
    c = s.select_one('.initiative-container')
    d = {'id': iid, 'slug': html.unescape(m['slug']), 'title': html.unescape(m['title']['rendered']).strip(),
         'date': m['date'][:10], 'link': m['link']}
    sub = c.select_one('.initiative-subtitle'); d['summary'] = clean(sub.get_text()) if sub else ''
    chips = [clean(x.get_text().replace(x.select_one('.icon').get_text(), '')) if x.select_one('.icon') else clean(x.get_text()) for x in c.select('.initiative-meta .tag-chip')]
    icons = [clean(x.select_one('.icon').get_text()) if x.select_one('.icon') else '' for x in c.select('.initiative-meta .tag-chip')]
    d['location'] = d['audience'] = d['type'] = ''
    for ic, ch in zip(icons, chips):
        if ic == '📍': d['location'] = ch
        elif ic == '🎯': d['type'] = ch
        else: d['audience'] = ch
    img = c.select_one('.initiative-hero-image img')
    d['cover'] = (media.get(m['featured_media']) or (img['src'] if img else ''))
    if img and img.get('srcset'):
        d['cover'] = img['srcset'].split(',')[-1].strip().split(' ')[0]
    blocks = []
    for el in c.find_all(['section', 'div'], recursive=True):
        cls = el.get('class') or []
        if 'initiative-quote' in cls:
            blocks.append({'kind': 'quote', 'text': clean(el.select_one('.initiative-quote-text').get_text()),
                           'author': clean(el.select_one('.initiative-quote-author').get_text()) if el.select_one('.initiative-quote-author') else ''})
        elif 'initiative-section' in cls and not el.select_one('.section-title'):
            blocks.append({'kind': 'closing', 'paragraphs': lines(el)})
        elif 'initiative-section' in cls:
            t = clean(el.select_one('.section-title').get_text()); ic = clean(el.select_one('.section-icon').get_text()) if el.select_one('.section-icon') else ''
            body = el.select_one('.section-body')
            b = {'kind': 'section', 'icon': ic, 'title': t}
            if body.select('.team-card'):
                b['kind'] = 'team'; b['paragraphs'] = [x for p in body.find_all('p') for x in lines(p)]
                b['members'] = [{'name': clean(k.select_one('.team-info-main').get_text()) if k.select_one('.team-info-main') else '',
                                 'role': clean(k.select_one('.team-info-meta').get_text()) if k.select_one('.team-info-meta') else '',
                                 'photo': (k.select_one('img.team-photo') or {}).get('src', '') if k.select_one('img.team-photo') else ''} for k in body.select('.team-card')]
            elif body.select('.initiative-gallery img'):
                b['kind'] = 'gallery'; b['images'] = [i.get('data-full') or i['src'] for i in body.select('.initiative-gallery img')]
            elif body.select('.info-card'):
                b['kind'] = 'info'; b['cards'] = [{'label': clean(k.select_one('.info-label').get_text().replace(k.select_one('.info-dot-icon').get_text() if k.select_one('.info-dot-icon') else '', '')),
                                                   'lines': lines(k.select_one('.info-value'))} for k in body.select('.info-card')]
            else:
                lis = body.find_all('li')
                ps = []
                for p in body.find_all(['p']):
                    ps += lines(p)
                if lis:
                    # team sections often have intro paragraph + list
                    b['paragraphs'] = ps; b['items'] = [clean(x.get_text()) for x in lis]
                else:
                    b['paragraphs'] = ps or lines(body)
            blocks.append(b)
    d['blocks'] = blocks
    # convenience fields
    for b in blocks:
        if b['kind'] == 'gallery': d['gallery'] = b['images']
        if b['kind'] == 'team': d['team'] = b['members']
        if 'أهداف' in b.get('title','') and b.get('items'): d['objectives'] = b['items']
    d.setdefault('gallery', []); d.setdefault('team', []); d.setdefault('objectives', [])
    gov = ''
    place = d['location'] + ' ' + ' '.join(l for b in blocks if b['kind']=='info' for c in b['cards'] if 'مكان' in c['label'] for l in c['lines'])
    for keys, g in [(['خان يونس','خانيونس','القرارة'], 'خان يونس'), (['رفح'], 'رفح'), (['دير البلح','الوسطى','المغازي','النصيرات','البريج','الزوايدة'], 'الوسطى'), (['الشمال','جباليا','بيت لاهيا','بيت حانون'], 'شمال غزة'), (['غزة','الشيخ رضوان'], 'غزة')]:
        if any(k in place for k in keys): gov = g; break
    d['governorate'] = gov
    res.append(d)
res.sort(key=lambda x: x['date'], reverse=True)
json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=1)
for d in res: print(d['id'], d['date'], d['governorate'] or '?', '|', d['location'], '|', d['audience'], '|', d['type'], '| blocks', len(d['blocks']), 'gal', len(d['gallery']), 'team', len(d['team']))
