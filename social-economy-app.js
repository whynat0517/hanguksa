(function(){
"use strict";
const data=window.SOCIAL_ECONOMY_DATA,bank=window.SOCIAL_ECONOMY_BANK,units=data&&data.units,app=document.getElementById("app"),tabs=document.getElementById("tabs");
if(!data||!Array.isArray(bank)||!bank.length||!app){document.getElementById("app").innerHTML='<div class="empty">학습 자료 로딩 오류: 문제은행 스크립트를 확인해 주세요.</div>';return}
const keys=Object.keys(units);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shuffle=a=>{let b=a.slice();for(let i=b.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const getStore=k=>{try{return new Set(JSON.parse(localStorage.getItem("social_eco_v1_"+k)||"[]"))}catch(e){return new Set()}};
const putStore=(k,v)=>{try{localStorage.setItem("social_eco_v1_"+k,JSON.stringify([...v]))}catch(e){}};
const wrong=getStore("wrong"),saved=getStore("saved");
const state={page:"home",unit:"all",keyword:"",difficulty:"all",type:"all",count:20,session:[],index:0,answered:null,correct:0,started:0,timer:null,review:false,graphD:0,graphS:0};
const count=u=>bank.filter(x=>u==="all"||x.unit===u).length;
const shortTime=()=>{let sec=Math.floor((Date.now()-state.started)/1000);return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")};
const head=(title,sub)=>'<div class="section"><h2>'+title+'</h2><p class="muted">'+sub+'</p></div>';
const unitOptions=()=>'<label class="field">범위<select id="unitPick"><option value="all">경제 전 범위</option>'+keys.map(k=>'<option value="'+k+'" '+(state.unit===k?"selected":"")+'>'+esc(units[k].name)+'</option>').join("")+'</select></label>';
const showToast=m=>{let el=document.getElementById("toast");if(!el){el=document.createElement("div");el.id="toast";document.body.appendChild(el)}el.textContent=m;el.style.display="block";clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.style.display="none",1500)};
function stopClock(){if(state.timer){clearInterval(state.timer);state.timer=null}}
function go(page){stopClock();state.page=page;tabs.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===page));render();window.scrollTo(0,0)}
function home(){
app.innerHTML='<section class="hero"><div class="eyebrow">2022 개정 통합사회2 · 시장경제와 지속가능발전</div><h1>경제 파트 기말고사 실전 훈련</h1><p>자본주의의 변천부터 기회비용·시장 균형·무역·금융까지. 개념과 계산, 사료형 사례를 함께 연습하세요.</p><div class="statRow"><div class="stat"><strong>'+keys.length+'</strong><span>학습 영역</span></div><div class="stat"><strong>'+data.glossary.length+'</strong><span>개념 설명</span></div><div class="stat"><strong>'+bank.length+'</strong><span>문제 후보</span></div><div class="stat"><strong>'+wrong.size+'</strong><span>오답 기록</span></div></div><div class="actions"><button class="btn" data-go="quiz">기말 실전 문제풀기</button><button class="btn outline" data-go="concept">개념 먼저 보기</button></div></section>'+
head("경제 6개 영역","아래 카드를 선택하면 해당 단원만 출제할 수 있습니다.")+
'<div class="grid">'+keys.map(k=>'<button class="card unit" data-unit="'+k+'"><span class="label">'+k+' · '+count(k)+'문항</span><h3>'+esc(units[k].name)+'</h3><p class="muted">'+esc(units[k].tag)+'</p></button>').join("")+'</div><p class="footer">자료의 문제와 개념 설명은 학습용 자체 제작 콘텐츠이며 특정 교과서 원문·기출문항을 그대로 복제한 것이 아닙니다. 학교 기말고사 범위는 수업 자료에 맞춰 선택하세요.</p>';
}
function quizSetup(){
app.innerHTML=head("기말 실전 문제풀이","5지선다 · 기본/심화/최상 난이도 · 문항별 모든 선지 해설을 제공합니다.")+
'<section class="card"><div class="filters">'+unitOptions()+
'<label class="field">난이도<select id="diffPick"><option value="all">전체</option><option value="basic">기본</option><option value="advanced">심화</option><option value="extreme">최상</option></select></label>'+
'<label class="field">유형<select id="typePick"><option value="all">전체</option><option value="term">개념</option><option value="case">사례</option><option value="calc">계산</option><option value="graph">그래프·시장 균형</option><option value="trade">비교 우위</option></select></label>'+
'<label class="field">문항 수<select id="countPick"><option value="10">10문항</option><option value="20" selected>20문항</option><option value="30">30문항</option><option value="50">50문항</option><option value="9999">해당 범위 전체</option></select></label></div>'+
'<div class="actions"><button class="btn primary" id="start">문제 출제 시작</button><button class="btn" data-go="wrong">오답 복습 '+wrong.size+'개</button></div><p class="tiny">무작위 출제 및 선지 셔플, 오답 자동 저장, 한 문제씩 정답 공개. 문제의 조건과 근거를 꼼꼼하게 확인하세요.</p></section>';
}
function start(review=false,selection=null){
const v=id=>document.getElementById(id)?.value;
if(!review&&!selection){state.unit=v("unitPick")||state.unit;state.difficulty=v("diffPick")||"all";state.type=v("typePick")||"all";state.count=Number(v("countPick")||20)}
const eligible=selection||bank.filter(q=>(state.unit==="all"||q.unit===state.unit)&&(state.difficulty==="all"||q.difficulty===state.difficulty)&&(state.type==="all"||q.type===state.type)&&(!review||wrong.has(q.id)));
state.session=shuffle(eligible).slice(0,review||selection?9999:state.count);
if(!state.session.length){showToast("선택한 조건에 해당하는 문제가 없습니다.");return}
state.index=0;state.correct=0;state.answered=null;state.started=Date.now();state.review=review;question();
}
function question(){
stopClock();
if(state.index>=state.session.length){finish();return}
const q=state.session[state.index],answered=state.answered;
const typeLabel={calc:"계산",graph:"그래프",trade:"비교 우위",term:"개념",case:"사례"}[q.type]||q.type;
app.innerHTML='<div class="quiz"><div class="quizMeta"><span class="label">'+esc(units[q.unit].name)+'</span><span id="clock" class="mono">'+shortTime()+'</span></div><div class="quizMeta"><strong>'+(state.index+1)+' / '+state.session.length+'문항</strong><span class="tiny">'+({basic:"기본",advanced:"심화",extreme:"최상"}[q.difficulty]||"기본")+' · '+typeLabel+'</span></div><div class="barProgress"><div style="width:'+(state.index*100/state.session.length)+'%"></div></div>'+
'<section class="card"><div class="actions" style="justify-content:flex-end"><button class="btn" id="bookmark">'+(saved.has(q.id)?"★ 저장됨":"☆ 즐겨찾기")+'</button></div><div class="question">'+esc(q.stem)+'</div><div class="choices">'+q.options.map((opt,i)=>'<button data-choice="'+i+'" '+(answered===null?"":"disabled")+' class="choice '+(answered===null?"":opt===q.correct?"correct":i===answered?"wrong":"")+'"><span class="num">'+(i+1)+'</span><span>'+esc(opt)+'</span></button>').join("")+'</div>'+
(answered===null?"":answerInfo(q,answered))+'</section><div class="actions"><button class="btn" id="leave">문제 설정으로</button>'+(answered===null?"":'<button class="btn primary" id="next">'+(state.index+1===state.session.length?"결과 확인":"다음 문제")+'</button>')+'</div></div>';
if(answered===null){const clock=document.getElementById("clock");state.timer=setInterval(()=>{if(clock)clock.textContent=shortTime()},1000)}
}
function answerInfo(q,sel){
const correct=q.options[sel]===q.correct;
return '<section class="feedback '+(correct?"":"bad")+'"><h3>'+(correct?"✅ 정답입니다!":"❌ 오답 · 정답 "+(q.options.indexOf(q.correct)+1)+"번")+'</h3><p>'+esc(q.explain)+'</p><details><summary class="summary">5개 선지의 정오 해설 펼치기</summary><div class="reasons">'+q.options.map((v,i)=>'<div class="reason"><b>'+(i+1)+'번 '+(v===q.correct?"[정답]":"[오답]")+'</b> '+esc(q.why[v]||q.explain)+'</div>').join("")+'</div></details></section>';
}
function choose(n){if(state.answered!==null)return;const q=state.session[state.index];state.answered=n;if(q.options[n]===q.correct){state.correct++;if(state.review){wrong.delete(q.id);putStore("wrong",wrong)}}else{wrong.add(q.id);putStore("wrong",wrong)}question()}
function finish(){stopClock();const t=state.session.length,score=Math.round(100*state.correct/t);app.innerHTML='<div class="quiz"><div class="card"><p class="eyebrow">경제 기말고사 학습 완료</p><h1>문제풀이 결과 🎯</h1><div class="score">'+score+'점</div><p>정답 '+state.correct+' / '+t+'문항 · 학습 시간 '+shortTime()+'</p><p class="muted">틀린 문제는 오답노트에 저장됩니다. 복습에서 맞힌 문제는 오답 목록에서 제외됩니다.</p><div class="actions"><button class="btn primary" data-go="quiz">새 문제 출제</button><button class="btn" data-go="wrong">오답노트 ('+wrong.size+')</button><button class="btn" data-go="concept">핵심 개념</button></div></div></div>'}
function concept(){
const word=state.keyword.toLowerCase().trim(),arr=data.glossary.filter(g=>(state.unit==="all"||g.unit===state.unit)&&(!word||(g.term+" "+g.definition+" "+g.example+" "+g.trap).toLowerCase().includes(word)));
app.innerHTML=head("개념 정리","핵심 개념, 적용 예시, 자주 틀리는 포인트를 연결해 공부하세요.")+'<div class="filters">'+unitOptions()+'<label class="field">개념 검색<input id="keyword" type="search" placeholder="개념명·설명 검색" value="'+esc(state.keyword)+'"></label><button class="btn" id="reset">초기화</button></div>'+
'<div class="grid">'+(arr.length?arr.map(g=>'<article class="card"><div class="conceptHead"><h3>'+esc(g.term)+'</h3><span class="label">'+esc(units[g.unit].name)+'</span></div><p>'+esc(g.definition)+'</p><div class="note"><strong>적용:</strong> '+esc(g.example)+'</div><div class="note dangerNote"><strong>함정:</strong> '+esc(g.trap)+'</div></article>').join(""):'<div class="empty">검색 결과가 없습니다.</div>')+'</div>';
}
function graphSvg(){
const d=state.graphD,s=state.graphS,p=(100+d-s)/4,q=20+s+2*p;
const XY=(q,p)=>[60+q*3.5,332-p*5.4];
const ln=(p0,p1,fun,color,name)=>{
const [x1,y1]=XY(fun(p0),p0),[x2,y2]=XY(fun(p1),p1);
return '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" stroke="'+color+'" stroke-width="4" fill="none" stroke-linecap="round"/><text x="'+(x2+5)+'" y="'+(y2+4)+'" font-size="14" font-weight="800" fill="'+color+'">'+name+'</text>'};
const [cx,cy]=XY(q,p);
return '<svg viewBox="0 0 650 390" role="img" aria-label="수요와 공급 곡선 및 현재 균형점 시각화"><rect x="0" y="0" width="650" height="390" fill="#fbfffe"/>'+
[0,10,20,30,40,50].map(z=>'<line x1="60" y1="'+(332-z*5.4)+'" x2="575" y2="'+(332-z*5.4)+'" stroke="#e2eef0"/><text x="33" y="'+(336-z*5.4)+'" font-size="12" fill="#607889">'+z+'</text>').join("")+
'<line x1="60" y1="332" x2="590" y2="332" stroke="#173b51" stroke-width="2"/><line x1="60" y1="332" x2="60" y2="40" stroke="#173b51" stroke-width="2"/><text x="17" y="36" font-size="15" fill="#183f53">가격 P</text><text x="575" y="362" font-size="15" fill="#183f53">거래량 Q</text>'+
ln(0,50,t=>120+d-2*t,"#2877ba","D")+ln(0,50,t=>20+s+2*t,"#c87837","S")+
'<line x1="'+cx+'" y1="'+cy+'" x2="'+cx+'" y2="332" stroke="#16877c" stroke-dasharray="5 5"/><line x1="60" y1="'+cy+'" x2="'+cx+'" y2="'+cy+'" stroke="#16877c" stroke-dasharray="5 5"/><circle cx="'+cx+'" cy="'+cy+'" r="8" fill="#137d72" stroke="#fff" stroke-width="3"/><text x="'+(cx+12)+'" y="'+(cy-10)+'" font-size="16" font-weight="900" fill="#087c72">E ('+q+', '+p+')</text></svg>';
}
function graph(){
const d=state.graphD,s=state.graphS,p=(100+d-s)/4,q=20+s+2*p;
app.innerHTML=head("수요·공급 균형 그래프","두 곡선을 직접 이동시키고 균형 가격과 거래량이 어떻게 달라지는지 관찰하세요.")+
'<div class="graphGrid"><div class="card graph">'+graphSvg()+'</div><div class="card"><h3>시장 변화 조절</h3><label class="field">수요 변화 (−20~+20)<input id="graphDemand" type="range" min="-20" max="20" step="10" value="'+d+'"></label><p class="mono">수요 변화: '+(d>0?"+":"")+d+'</p><label class="field">공급 변화 (−20~+20)<input id="graphSupply" type="range" min="-20" max="20" step="10" value="'+s+'"></label><p class="mono">공급 변화: '+(s>0?"+":"")+s+'</p><div class="tip"><strong>균형 가격: '+p+'</strong><p>균형 거래량: '+q+'</p></div><button class="btn" id="graphReset">그래프 초기화</button></div></div>'+
'<div class="card section"><h3>균형 계산 원리</h3><p>수요 Qd = 120 '+(d>=0?"+ ":"− ")+Math.abs(d)+' − 2P</p><p>공급 Qs = 20 '+(s>=0?"+ ":"− ")+Math.abs(s)+' + 2P</p><p>수요량과 공급량이 같아지는 지점을 풀면 P = (100 + 수요 변화 − 공급 변화) / 4, Q = 20 + 공급 변화 + 2P가 됩니다.</p><p class="muted">수요 증가 → 균형 가격 상승·거래량 증가 / 공급 증가 → 균형 가격 하락·거래량 증가. 두 곡선이 함께 이동하면 변화 크기에 따라 가격 방향이 달라집니다.</p></div>';
}
function calculator(){
app.innerHTML=head("경제 계산 연습","계산 과정을 직접 확인할 수 있는 보조 도구입니다. 계산 결과는 문제풀이 정답과 연결되지 않습니다.")+
'<div class="grid">'+
'<div class="card"><h3>① 기회비용·순편익</h3><p class="tiny">명시적 비용과 포기한 대안의 최대 가치를 합합니다.</p><div class="filters"><label class="field">편익 (만 원)<input id="benefit" type="number" min="0" value="25"></label><label class="field">명시적 비용 (만 원)<input id="explicit" type="number" min="0" value="5"></label><label class="field">포기한 최선의 대안 가치 (만 원)<input id="implicit" type="number" min="0" value="8"></label></div><button class="btn primary" data-calc="op">계산</button><div id="opResult" class="tip" aria-live="polite">값을 입력하고 계산을 눌러 보세요.</div></div>'+
'<div class="card"><h3>② 단리와 복리</h3><p class="tiny">원금·연 이자율·연수를 입력합니다. 세금·수수료 제외.</p><div class="filters"><label class="field">원금 (만 원)<input id="principal" type="number" min="0" value="100"></label><label class="field">연이율 (%)<input id="rate" type="number" min="0" value="5"></label><label class="field">기간 (년)<input id="years" type="number" min="0" value="2"></label></div><button class="btn primary" data-calc="interest">계산</button><div id="interestResult" class="tip" aria-live="polite">단리와 복리의 차이를 비교해 보세요.</div></div>'+
'<div class="card"><h3>③ 환율 계산</h3><p class="tiny">달러 표시 상품 가격을 원화로 환산합니다.</p><div class="filters"><label class="field">달러 가격 ($)<input id="usd" type="number" min="0" value="100"></label><label class="field">원/달러 환율<input id="fx" type="number" min="0" value="1350"></label></div><button class="btn primary" data-calc="fx">계산</button><div id="fxResult" class="tip" aria-live="polite">원화 환산액을 계산해 보세요.</div></div>'+
'<div class="card"><h3>④ 비교 우위</h3><p>갑국: 1시간에 쌀 12 또는 옷 6</p><p>을국: 1시간에 쌀 8 또는 옷 8</p><div class="tip">갑국 쌀 1단위의 기회비용 = 옷 0.5단위<br>을국 쌀 1단위의 기회비용 = 옷 1단위<br><strong>갑국은 쌀, 을국은 옷 생산에 비교 우위</strong></div><p class="tiny">비교 우위는 ‘생산량’ 자체가 아니라 ‘기회비용’을 기준으로 판단합니다.</p></div>'+
'</div>';
}
function review(){
const arr=bank.filter(q=>wrong.has(q.id)),star=bank.filter(q=>saved.has(q.id));
app.innerHTML=head("오답 노트 · 즐겨찾기","오답 목록은 현재 브라우저에만 저장됩니다. 복습에서 정답을 맞히면 오답에서 제외됩니다.")+
'<section class="card"><h3>틀린 문항 '+arr.length+'개 · 즐겨찾기 '+star.length+'개</h3><div class="actions"><button class="btn primary" id="review" '+(arr.length?"":"disabled")+'>오답만 다시 풀기</button><button class="btn" id="stars" '+(star.length?"":"disabled")+'>즐겨찾기만 풀기</button><button class="btn" id="clear" '+(arr.length?"":"disabled")+'>오답 초기화</button></div></section>'+
'<div class="section"><h3>오답 기록</h3>'+(arr.length?'<div class="grid">'+arr.slice(0,80).map(q=>'<div class="card"><span class="label">'+esc(units[q.unit].name)+'</span><p>'+esc(q.stem.slice(0,140))+'</p><span class="tiny">'+esc(q.id)+'</span></div>').join("")+'</div>':'<div class="empty">현재 저장된 오답이 없습니다.</div>')+'</div>';
}
function render(){if(state.page==="home")home();else if(state.page==="quiz")quizSetup();else if(state.page==="concept")concept();else if(state.page==="graph")graph();else if(state.page==="calc")calculator();else if(state.page==="wrong")review()}
tabs.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)go(b.dataset.tab)});
app.addEventListener("click",e=>{
const b=e.target.closest("[data-go]");if(b){go(b.dataset.go);return}
const u=e.target.closest("[data-unit]");if(u){state.unit=u.dataset.unit;go("quiz");return}
const c=e.target.closest("[data-choice]");if(c){choose(Number(c.dataset.choice));return}
if(e.target.id==="start"){start();return}
if(e.target.id==="next"){state.index++;state.answered=null;question();return}
if(e.target.id==="leave"){go("quiz");return}
if(e.target.id==="bookmark"){const q=state.session[state.index];if(saved.has(q.id))saved.delete(q.id);else saved.add(q.id);putStore("saved",saved);e.target.textContent=saved.has(q.id)?"★ 저장됨":"☆ 즐겨찾기";return}
if(e.target.id==="review"){state.unit="all";state.difficulty="all";state.type="all";start(true);return}
if(e.target.id==="stars"){start(false,bank.filter(q=>saved.has(q.id)));return}
if(e.target.id==="clear"&&confirm("오답 기록을 모두 초기화할까요?")){wrong.clear();putStore("wrong",wrong);review();return}
if(e.target.id==="reset"){state.unit="all";state.keyword="";render();return}
if(e.target.id==="graphReset"){state.graphD=0;state.graphS=0;graph();return}
const calc=e.target.closest("[data-calc]");if(calc){
const num=id=>Number(document.getElementById(id).value);
const fmt=n=>Number(n.toFixed(2)).toLocaleString("ko-KR");
if(calc.dataset.calc==="op"){let B=num("benefit"),E=num("explicit"),I=num("implicit");document.getElementById("opResult").textContent="기회비용 "+fmt(E+I)+"만 원 = 명시적 "+fmt(E)+" + 암묵적 "+fmt(I)+" | 순편익 "+fmt(B-E-I)+"만 원";}
if(calc.dataset.calc==="interest"){let P=num("principal"),r=num("rate")/100,t=num("years");document.getElementById("interestResult").textContent="단리 "+fmt(P*(1+r*t))+"만 원 | 복리 "+fmt(P*Math.pow(1+r,t))+"만 원";}
if(calc.dataset.calc==="fx"){document.getElementById("fxResult").textContent="원화 가격 = "+fmt(num("usd")*num("fx"))+"원";}
return;
}
});
app.addEventListener("change",e=>{if(e.target.id==="unitPick"){state.unit=e.target.value;if(state.page==="concept")render()}});
app.addEventListener("input",e=>{
if(e.target.id==="keyword"){state.keyword=e.target.value;let pos=e.target.selectionStart;render();let i=document.getElementById("keyword");if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch(_){}}return}
if(e.target.id==="graphDemand"||e.target.id==="graphSupply"){state.graphD=Number(document.getElementById("graphDemand").value);state.graphS=Number(document.getElementById("graphSupply").value);graph();return}
});
render();
})();