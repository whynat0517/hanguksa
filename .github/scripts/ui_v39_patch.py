from pathlib import Path
import re, json

NAV_CSS = r"""
/* ===== unified 3-subject navigation v39 ===== */
.unifiedSubjectsShell{position:sticky;top:0;z-index:9999;padding:10px 14px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.unifiedSubjects{max-width:1350px;margin:0 auto;padding:6px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;border-radius:18px}
.unifiedSubjects a{min-width:0;min-height:46px;padding:10px 12px;border-radius:13px;display:flex;align-items:center;justify-content:center;gap:7px;text-decoration:none!important;font-weight:900;font-size:14px;line-height:1.1;white-space:nowrap;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,filter .12s ease}
.unifiedSubjects a:active{transform:scale(.985)}.unifiedSubjects .emoji{font-size:17px;line-height:1}
.unifiedSubjectsShell.theme-history{background:rgba(10,7,12,.96)}.unifiedSubjectsShell.theme-history .unifiedSubjects{background:#171119;border:1px solid #352a37}.unifiedSubjectsShell.theme-history a{background:#211922;color:#e4d8e0;border:1px solid #433345}
.unifiedSubjectsShell.theme-social{background:rgba(247,249,255,.96)}.unifiedSubjectsShell.theme-social .unifiedSubjects{background:#f8faff;border:1px solid #dce3f2}.unifiedSubjectsShell.theme-social a{background:#fff;color:#354052;border:1px solid #d9e0ed}
.unifiedSubjectsShell.theme-english{background:rgba(255,251,242,.96)}.unifiedSubjectsShell.theme-english .unifiedSubjects{background:#fff7e6;border:1px solid #ecd4a8}.unifiedSubjectsShell.theme-english a{background:#fffdf8;color:#674825;border:1px solid #ead7b6}
.unifiedSubjects a.active.history{background:linear-gradient(180deg,#ffd4e6,#f3a1c5);color:#291923;border-color:#f2a7c7}.unifiedSubjects a.active.social{background:linear-gradient(135deg,#3159d8,#7185f2);color:#fff;border-color:#3159d8}.unifiedSubjects a.active.english{background:linear-gradient(135deg,#ffdd70,#ffb13b);color:#4c2d0c;border-color:#efa63a}
@media(max-width:680px){.unifiedSubjectsShell{padding:8px 10px}.unifiedSubjects{gap:6px;padding:5px;border-radius:16px}.unifiedSubjects a{min-height:44px;padding:9px 7px;font-size:12px;border-radius:11px}.unifiedSubjects .emoji{font-size:15px}}
"""

def nav(active):
    items=[("history","📜","한국사","/"),("social","🌐","통합사회","/social/"),("english","🔤","공통영어","/english/")]
    links=[]
    for key,emoji,label,href in items:
        cls=f"active {key}" if key==active else ""
        aria=' aria-current="page"' if key==active else ""
        links.append(f'<a class="{cls}" href="{href}" target="_self"{aria}><span class="emoji">{emoji}</span><span>{label}</span></a>')
    return f'<div class="unifiedSubjectsShell theme-{active}"><nav class="unifiedSubjects" aria-label="과목 전환">{"".join(links)}</nav></div>'

def remove_old(text):
    patterns=[
        r'<nav\b[^>]*class="[^"]*subjectPortal[^"]*"[^>]*>.*?</nav>',
        r'<div\b[^>]*class="[^"]*xSubjectSwitch[^"]*"[^>]*>.*?</div>',
        r'<div\b[^>]*class="[^"]*kx-switch[^"]*"[^>]*>.*?</div>',
        r'<div\b[^>]*class="[^"]*unifiedSubjectsShell[^"]*"[^>]*>.*?</div>',
    ]
    for p in patterns:
        text=re.sub(p,'',text,flags=re.S|re.I)
    text=re.sub(r'<script\b[^>]*id="(?:subject-nav-fallback|unified-subject-fallback)"[^>]*>.*?</script>','',text,flags=re.S|re.I)
    return text

def patch(path, active):
    p=Path(path)
    if not p.exists():
        return
    text=remove_old(p.read_text(encoding='utf-8'))

    if active=='social':
        reset='header .head{display:flex!important;align-items:center!important;gap:14px!important;flex-wrap:wrap!important}header .head>.nav{display:flex!important;justify-content:flex-start!important;flex:1 1 auto!important}@media(max-width:900px){header .head{display:flex!important}.nav{width:100%!important;overflow-x:auto!important}}'
    elif active=='english':
        reset='.top .head{display:flex!important;align-items:center!important;gap:19px!important;flex-wrap:wrap!important}.top .mainnav{margin-left:auto!important}@media(max-width:1000px){.top .head{display:flex!important}.top .mainnav{width:100%!important;margin:0 0 7px!important}}'
    else:
        reset='header{padding-top:14px!important}'

    if '</style>' not in text:
        raise RuntimeError(f'No style tag: {path}')
    text=text.replace('</style>',NAV_CSS+reset+'</style>',1)

    m=re.search(r'<body\b[^>]*>',text,re.I)
    if not m:
        raise RuntimeError(f'No body: {path}')
    text=text[:m.end()]+nav(active)+text[m.end():]

    fallback='<script id="unified-subject-fallback">document.addEventListener("click",function(e){var a=e.target.closest?e.target.closest(".unifiedSubjects a"):null;if(!a)return;var href=a.getAttribute("href");if(!href)return;e.preventDefault();try{window.location.assign(href)}catch(_){window.location.href=href}},false);</script>'
    text=text.replace('</body>',fallback+'</body>',1)

    assert text.count('class="unifiedSubjectsShell')==1, path
    assert 'href="/"' in text and 'href="/social/"' in text and 'href="/english/"' in text, path
    assert 'class="subjectPortal"' not in text, path
    p.write_text(text,encoding='utf-8')

patch('index.html','history')
patch('social.html','social')
patch('social/index.html','social')
patch('english.html','english')
patch('english/index.html','english')

v=Path('vercel.json')
cfg=json.loads(v.read_text(encoding='utf-8')) if v.exists() else {}
cfg['cleanUrls']=False
cfg['trailingSlash']=False
cfg['rewrites']=[
    {'source':'/history','destination':'/index.html'},
    {'source':'/social','destination':'/social/index.html'},
    {'source':'/english','destination':'/english/index.html'}
]
cfg['headers']=[{'source':'/(.*)','headers':[
    {'key':'X-Content-Type-Options','value':'nosniff'},
    {'key':'Cache-Control','value':'public, max-age=0, must-revalidate'},
    {'key':'Referrer-Policy','value':'strict-origin-when-cross-origin'}
]}]
v.write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf-8')
print('v39 UI patch complete')
