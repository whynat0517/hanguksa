from pathlib import Path
from bs4 import BeautifulSoup
import json, re, sys

ROOT=Path(".")
FILES={
    "history": ROOT/"index.html",
    "social": ROOT/"social"/"index.html",
    "english": ROOT/"english"/"index.html",
}
LABELS=[
    ("history","📜","한국사","/"),
    ("social","🌐","통합사회","/social/"),
    ("english","🔤","공통영어","/english/"),
]

CSS=r"""/* ===== Study Suite global subject navigation v39 ===== */
.studySuiteBar{position:relative;z-index:1200;padding:12px max(14px,env(safe-area-inset-right)) 12px max(14px,env(safe-area-inset-left));border-bottom:1px solid transparent}
.studySuiteInner{width:min(1180px,100%);margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:7px;border-radius:20px}
.studySuiteTab{min-width:0;min-height:48px;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 12px;border:1px solid transparent;border-radius:14px;text-decoration:none!important;font-size:15px;font-weight:950;line-height:1.2;white-space:nowrap;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .14s ease,box-shadow .14s ease,background .14s ease}
.studySuiteTab:active{transform:scale(.985)}
.studySuiteTab .suiteEmoji{font-size:17px;line-height:1}
.portal-history .studySuiteBar{background:#0d0910;border-bottom-color:#2c2430}
.portal-history .studySuiteInner{background:#171119;border:1px solid #3a2d3b;box-shadow:0 8px 28px #0005}
.portal-history .studySuiteTab{color:#d8ccd5;background:#211a22;border-color:#3b303c}
.portal-history .studySuiteTab.active{color:#291822;background:linear-gradient(180deg,#ffd5e6,#f2a2c6);border-color:#f4b0cd;box-shadow:0 6px 20px #f39bc342}
.portal-social .studySuiteBar{background:#f4f6fc;border-bottom-color:#dce2ef}
.portal-social .studySuiteInner{background:#eef2fa;border:1px solid #d7deec;box-shadow:0 8px 24px #334b8b14}
.portal-social .studySuiteTab{color:#344054;background:#fff;border-color:#d9e0ed}
.portal-social .studySuiteTab.active{color:#fff;background:linear-gradient(135deg,#3159d8,#7287ef);border-color:#3159d8;box-shadow:0 7px 20px #3159d832}
.portal-english .studySuiteBar{background:#fffaf0;border-bottom-color:#f0dfc2}
.portal-english .studySuiteInner{background:#fff7e7;border:1px solid #ead4a9;box-shadow:0 8px 24px #a26c2717}
.portal-english .studySuiteTab{color:#6f4b23;background:#fffdf8;border-color:#ead8b7}
.portal-english .studySuiteTab.active{color:#4b2c0e;background:linear-gradient(135deg,#ffdd6e,#ffad39);border-color:#efa43a;box-shadow:0 7px 20px #ef9f3738}
.portal-social header .head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;flex-wrap:wrap!important;grid-template-columns:none!important}
.portal-social header .head>.nav{margin-left:auto!important;justify-content:flex-end!important;min-width:0}
.portal-english .top .head{display:flex!important;align-items:center!important;gap:14px!important;flex-wrap:wrap!important;grid-template-columns:none!important}
.portal-english .mainnav{margin-left:auto!important;min-width:0}
.portal-history header{top:0!important;box-shadow:0 8px 30px #0002}
.portal-social header{top:0!important;box-shadow:0 7px 24px #3159d80e}
.portal-english .top{top:0!important;box-shadow:0 7px 24px #9d692312}
@media(max-width:900px){
 .studySuiteBar{padding:9px 10px}
 .studySuiteInner{gap:6px;padding:6px;border-radius:17px}
 .studySuiteTab{min-height:46px;padding:9px 7px;font-size:14px;border-radius:12px}
 .portal-social header .head{display:block!important;padding-top:10px!important}
 .portal-social header .head>.logo{margin-bottom:9px!important}
 .portal-social header .head>.nav{margin-left:0!important;overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:3px!important}
 .portal-social header .head>.nav button{flex:0 0 auto!important}
 .portal-english .top .head{display:flex!important;align-items:center!important;padding-top:9px!important}
 .portal-english .brand{flex:1 1 auto!important}
 .portal-english .mainnav{order:3!important;width:100%!important;margin-left:0!important;overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:4px!important}
 .portal-english .mainnav button{flex:0 0 auto!important}
 .portal-english .top-right{display:none!important}
}
@media(max-width:520px){
 .studySuiteBar{padding:8px 7px}
 .studySuiteInner{gap:5px;padding:5px;border-radius:15px}
 .studySuiteTab{min-height:44px;padding:8px 4px;font-size:13px;letter-spacing:-.025em}
 .studySuiteTab .suiteEmoji{font-size:15px}
}
"""

JS=r"""document.addEventListener('click',function(e){
  var a=e.target.closest?e.target.closest('.studySuiteTab'):null;
  if(!a)return;
  var href=a.getAttribute('href');
  if(!href)return;
  e.preventDefault();
  try{window.location.assign(href)}catch(_){window.location.href=href}
},false);"""

def is_old_switch(el):
    if not getattr(el,"name",None) or el.name not in ("nav","div","section"):
        return False
    classes=set(el.get("class",[]))
    if classes.intersection({"subjectPortal","xSubjectSwitch","kx-switch","subjectSwitcher","subject-switcher","subjectSwitch","studySuiteBar"}):
        return True
    if el.get("aria-label")=="과목 전환":
        return True
    links=el.find_all("a")
    if 2 <= len(links) <= 4:
        texts=" ".join(a.get_text(" ",strip=True) for a in links)
        if "한국사" in texts and "통합사회" in texts:
            return True
    return False

def patch(path,active):
    if not path.exists():
        raise SystemExit(f"missing required file: {path}")
    soup=BeautifulSoup(path.read_text(encoding="utf-8"),"html.parser")
    if soup.head is None or soup.body is None:
        raise SystemExit(f"invalid HTML: {path}")
    for el in list(soup.find_all(["nav","div","section"])):
        if is_old_switch(el):
            el.decompose()
    for sid in ("subject-nav-fallback","study-suite-nav"):
        node=soup.find("script",id=sid)
        if node: node.decompose()
    oldstyle=soup.find("style",id="study-suite-ui")
    if oldstyle: oldstyle.decompose()

    body=soup.body
    classes=[c for c in body.get("class",[]) if not str(c).startswith("portal-")]
    classes.append("portal-"+active)
    body["class"]=classes

    links=[]
    for key,emoji,name,href in LABELS:
        cls="studySuiteTab active" if key==active else "studySuiteTab"
        aria=' aria-current="page"' if key==active else ""
        links.append(f'<a class="{cls}"{aria} href="{href}" target="_self"><span class="suiteEmoji">{emoji}</span><span>{name}</span></a>')
    bar=BeautifulSoup('<section class="studySuiteBar"><nav class="studySuiteInner" aria-label="과목 전환">'+''.join(links)+'</nav></section>',"html.parser").section
    body.insert(0,bar)

    st=soup.new_tag("style",id="study-suite-ui"); st.string=CSS; soup.head.append(st)
    sc=soup.new_tag("script",id="study-suite-nav"); sc.string=JS; body.append(sc)

    if active=="history":
        for sm in soup.select(".brand small"):
            if sm.get_text(strip=True).startswith(("v37","v38","v39")):
                sm.string="v39 · 3과목 통합 UI · 사진자료 검증"
    elif active=="english":
        sm=soup.select_one(".brand small")
        if sm: sm.string="COMMON ENGLISH · V5.1 · SUITE UI"

    path.write_text(str(soup),encoding="utf-8")

for key,path in FILES.items():
    patch(path,key)

# Keep the fallback aliases byte-identical to their route pages.
(ROOT/"social.html").write_bytes((ROOT/"social"/"index.html").read_bytes())
(ROOT/"english.html").write_bytes((ROOT/"english"/"index.html").read_bytes())

# Structural/data integrity checks.
for key,path in FILES.items():
    soup=BeautifulSoup(path.read_text(encoding="utf-8"),"html.parser")
    tabs=soup.select(".studySuiteTab")
    assert len(soup.select(".studySuiteBar"))==1, key
    assert len(tabs)==3, key
    assert [a.get("href") for a in tabs]==["/","/social/","/english/"], key
    assert len(soup.select(".subjectPortal,.xSubjectSwitch,.kx-switch"))==0, key

hist=(ROOT/"index.html").read_text(encoding="utf-8")
img_count=hist.count("data:image/")
assert img_count>=157, f"history embedded images unexpectedly low: {img_count}"

eng=BeautifulSoup((ROOT/"english"/"index.html").read_text(encoding="utf-8"),"html.parser")
dataset=eng.find("script",id="dataset")
assert dataset is not None
obj=json.loads(dataset.string)
assert len(obj["entries"])==37
assert len(obj["questions"])==1850
ids={e["id"] for e in obj["entries"]}
assert all(q.get("pid") in ids for q in obj["questions"])
from collections import Counter
counts=Counter(q["pid"] for q in obj["questions"])
assert all(counts[e["id"]]==50 for e in obj["entries"])
assert all("�" not in e.get("text","") for e in obj["entries"])
print(f"UI normalized; history data images={img_count}; English=37 passages/1850 questions")
