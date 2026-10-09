'use strict';(()=>{const el=document.getElementById('dataset');if(!el)return;const upgradeData=function upgradeData(data){
  if(data.version==="8.0.0")return data;
  if(data.version!=="7.0.0")return data;
  const entries=data.entries,oldQs=data.questions;
  function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
  function split(t){return String(t||"").replace(/\s+/g," ").trim().match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map(x=>x.trim()).filter(x=>x.length>22)||[]}
  function unique(a){return [...new Set(a.filter(Boolean))]}
  function seedOf(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function shuffle(a,seed){a=[...a];let x=(seed>>>0)||123456789;for(let i=a.length-1;i>0;i--){x=(1664525*x+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
  function words(t){const stop=new Set(["the","a","an","and","or","but","of","to","in","on","for","with","as","by","from","that","this","these","those","is","are","was","were","be","been","being","it","its","their","his","her","they","we","you","i","at","into","about","than","through","how","why","what","when"]);return new Set((String(t||"").toLowerCase().match(/[a-z][a-z'-]{2,}/g)||[]).filter(w=>!stop.has(w)))}
  function sim(a,b){const A=words(a),B=words(b);let n=0;for(const w of A)if(B.has(w))n++;return n/Math.max(1,Math.sqrt(A.size*B.size))}
  function nearest(e,n=8){return entries.filter(x=>x.id!==e.id).map(x=>({x,s:sim(e.text+" "+e.title,x.text+" "+x.title)})).sort((a,b)=>b.s-a.s).slice(0,n).map(z=>z.x)}
  function gs(q){const p=String(q.q||"").split(/\n\n+/);return p.reverse().find(x=>x.includes("[ ______ ]"))?.trim()||""}
  function rec(q,i=q.ans){const s=gs(q);return s&&q.opts?.[i]!=null?s.replace("[ ______ ]",q.opts[i]):""}
  function wrongIndex(q,offset=0){
    const c=String(q.opts?.[q.ans]??"").toLowerCase();
    const pref={is:["are","be","being"],are:["is","be","being"],has:["have","having"],have:["has","having"],was:["were","be"],were:["was","be"],than:["then","that"],to:["with","at","for"],that:["what","where","who"],their:["them","there","they"],and:["despite","although","because"],because:["despite","and","although"],who:["what","where","that"],which:["what","where","who"],of:["for","to","with"],in:["at","on","of"],may:["mays","may to","to may"]}[c]||[];
    for(const p of pref){const i=q.opts.findIndex((x,j)=>j!==q.ans&&String(x).toLowerCase()===p);if(i>=0)return i}
    const other=q.opts.map((_,i)=>i).filter(i=>i!==q.ans);return other[offset%other.length];
  }
  function famPool(e,wf,mode){const out=[];for(const x of entries){for(const f of (x.summary?.wordFamilies||[])){if(!f.word||!f.synonym||!f.antonym)continue;const v=mode==="syn"?f.synonym:f.antonym;if(v&&v!==wf.word&&v!==wf.synonym&&v!==wf.antonym)out.push(v)}}return unique(out)}
  function replaceSentence(e,word,repl){const ss=split(e.text),re=new RegExp("\\b"+escRe(word)+"\\b","i"),s=ss.find(x=>re.test(x));return s?s.replace(re,repl):""}
  function meta(wf,cands,kind,seed){const correct=kind==="syn"?wf.synonym:wf.antonym,vals=unique([correct,...cands]).slice(0,5),opts=shuffle(vals,seed).map(v=>kind==="syn"?`In this context, “${wf.word}” is closest in meaning to “${v}.”`:`In this context, “${wf.word}” is most nearly opposite in meaning to “${v}.”`),target=kind==="syn"?`In this context, “${wf.word}” is closest in meaning to “${correct}.”`:`In this context, “${wf.word}” is most nearly opposite in meaning to “${correct}.”`;return{opts,ans:opts.indexOf(target)}}
  const add=[];
  for(const e of entries){
    const current=oldQs.filter(q=>q.pid===e.id),grammar=current.filter(q=>q.type==="문법"&&gs(q)&&q.opts?.length>=4);
    if(grammar.length<5)throw new Error("grammar base shortage: "+e.id);
    const near=nearest(e,10),originals=split(e.text),fam=(e.summary?.wordFamilies||[]).filter(f=>f.word&&f.synonym&&f.antonym);
    if(!fam.length)throw new Error("word family shortage: "+e.id);
    for(let i=0;i<5;i++){
      const b=grammar[i%grammar.length],opts=b.opts.map((_,j)=>rec(b,j));
      add.push({id:`${e.id}-Q${61+i}`,pid:e.id,type:"문법",q:"[수능형 고난도 어법 · 문장 선지] 다음 중 원문의 문맥과 문법 구조를 모두 만족하는 문장을 고르시오. 선지 전체를 읽고 수일치·절의 완전성·접속 관계·준동사·전치사 결합을 함께 판단하세요.",why:`정답 문장은 원문에서 검증된 형태 “${b.opts[b.ans]}”를 사용합니다. ${b.why||""}`,origin:"수능형 문장선지 어법 v8",difficulty:5,opts,ans:b.ans});
    }
    {
      const wf=fam[0],pack=meta(wf,unique([wf.antonym,...famPool(e,wf,"syn")]).slice(0,8),"syn",seedOf(e.id+"v8syn"));
      add.push({id:`${e.id}-Q66`,pid:e.id,type:"유의어",q:"[수능형 유의어 · 문맥 변별] 다음 영어 문장 중 본문에서의 의미와 품사·뉘앙스를 가장 정확히 설명한 것을 고르시오.",why:`본문 문맥에서 “${wf.word}”와 가장 가까운 표현은 “${wf.synonym}”입니다. 단순 관련어가 아니라 실제 문장에 대체했을 때 의미 방향과 문법적 역할이 유지되는지 확인해야 합니다.`,origin:"수능형 유의어 강화 v8",difficulty:5,opts:pack.opts,ans:pack.ans});
    }
    {
      const wf=fam[1]||fam[0],pack=meta(wf,unique([wf.synonym,...famPool(e,wf,"ant")]).slice(0,8),"ant",seedOf(e.id+"v8ant"));
      add.push({id:`${e.id}-Q67`,pid:e.id,type:"반의어",q:"[수능형 반의어 · 문맥 변별] 다음 영어 문장 중 본문에서의 의미 방향을 가장 정확하게 반대로 설명한 것을 고르시오.",why:`본문 문맥에서 “${wf.word}”의 반대 의미는 “${wf.antonym}”입니다. “${wf.synonym}”처럼 같은 방향의 표현이나 단순 관련어와 구별하세요.`,origin:"수능형 반의어 강화 v8",difficulty:5,opts:pack.opts,ans:pack.ans});
    }
    {
      const wf=fam[2]||fam[0],correct=replaceSentence(e,wf.word,wf.synonym),cands=unique([wf.antonym,...famPool(e,wf,"syn")]).slice(0,7);
      if(correct){
        const raw=unique([wf.synonym,...cands]).slice(0,5),source=split(e.text).find(x=>new RegExp("\\b"+escRe(wf.word)+"\\b","i").test(x)),re=new RegExp("\\b"+escRe(wf.word)+"\\b","i"),opts=shuffle(raw.map(v=>source.replace(re,v)),seedOf(e.id+"v8replace"));
        add.push({id:`${e.id}-Q68`,pid:e.id,type:"유사표현",q:`[수능형 문맥 어휘] 다음 중 본문의 “${wf.word}”를 다른 표현으로 바꾸면서 원래 의미와 문법적 역할을 가장 잘 유지한 문장을 고르시오.`,why:`정답은 “${wf.synonym}”으로 바꾼 문장입니다. 다른 선지는 의미 방향·강도·품사 또는 결합 관계가 달라집니다.`,origin:"수능형 문장치환 어휘 v8",difficulty:5,opts,ans:opts.indexOf(correct)});
      }else{
        const pack=meta(wf,unique([wf.antonym,...cands]),"syn",seedOf(e.id+"v8replaceFallback"));
        add.push({id:`${e.id}-Q68`,pid:e.id,type:"유사표현",q:"[수능형 문맥 어휘] 다음 중 본문의 핵심 어휘를 가장 자연스럽게 바꾸어 쓸 수 있다고 설명한 영어 문장을 고르시오.",why:`“${wf.word}”는 이 문맥에서 “${wf.synonym}”과 가장 가깝습니다.`,origin:"수능형 문장치환 어휘 v8",difficulty:5,opts:pack.opts,ans:pack.ans});
      }
    }
    {
      const titles=unique([e.title,...near.map(x=>x.title)]).slice(0,5),opts=shuffle(titles,seedOf(e.id+"v8topic")).map(t=>`The passage mainly focuses on the issue described as “${t}.”`),target=`The passage mainly focuses on the issue described as “${e.title}.”`;
      add.push({id:`${e.id}-Q69`,pid:e.id,type:"주제·제목",q:"[수능형 주제] 다음 중 글 전체의 주제를 가장 정확하게 나타낸 영어 문장을 고르시오. 비슷한 소재가 등장해도 글의 핵심 초점과 범위가 어긋나는 선지를 제외하세요.",why:`글의 중심 주제는 “${e.title}”에 가장 정확히 대응합니다. 주변 소재만 공유하는 선지는 글 전체의 논지를 포괄하지 못합니다.`,origin:"수능형 주제 강화 v8",difficulty:5,opts,ans:opts.indexOf(target)});
    }
    {
      const key=e.summary?.keySentence||originals[0],vals=unique([key,...near.map(x=>x.summary?.keySentence||split(x.text)[0]).filter(Boolean)]).slice(0,5),opts=shuffle(vals,seedOf(e.id+"v8main"));
      add.push({id:`${e.id}-Q70`,pid:e.id,type:"주장·요지",q:"[수능형 주제·요지] 다음 영어 문장 중 필자의 핵심 주장 또는 글 전체를 가장 잘 일반화한 문장을 고르시오. 세부 사례와 중심 주장 사이의 위계를 구분하세요.",why:"정답은 해당 지문의 핵심 문장입니다. 다른 선지는 문법적으로 자연스럽지만 다른 지문의 핵심 논리이거나 이 글의 세부 내용과 범위가 맞지 않습니다.",origin:"수능형 주제·요지 강화 v8",difficulty:5,opts,ans:opts.indexOf(key)});
    }
    for(let i=0;i<3;i++){
      const b=grammar[i%grammar.length],wi=wrongIndex(b,i),wrong=rec(b,wi),correct=rec(b,b.ans);
      add.push({id:`${e.id}-Q${71+i}`,pid:e.id,type:"서술형",q:`[서술형 · 어법 변형] 다음 문장은 본문의 문법 구조를 변형한 것이지만 어법상 잘못된 표현이 하나 포함되어 있다.\n\n${wrong}\n\n조건: 잘못된 “${b.opts[wi]}”를 문맥과 어법에 맞게 고쳐 문장 전체를 완성하시오. 원문의 시제·수식 관계·핵심 의미는 유지할 것.`,why:`정답에서는 “${b.opts[wi]}”를 “${b.opts[b.ans]}”로 고쳐야 합니다. ${b.why||""}`,origin:"문법 변형 서술형 v8",difficulty:5,sample:correct,answer:correct});
    }
    for(let k=0;k<2;k++){
      const b=grammar[(5+k)%grammar.length],wi=wrongIndex(b,k),wrong=rec(b,wi),correct=rec(b,b.ans),fill=shuffle(unique(originals.filter(x=>x!==correct&&x!==wrong)),seedOf(e.id+"v8fill"+k)).slice(0,4),opts=shuffle(unique([wrong,...fill]),seedOf(e.id+"v8error"+k));
      add.push({id:`${e.id}-Q${74+k}`,pid:e.id,type:"문법",q:"[수능형 어법 · 오류 판별] 다음 영어 문장 중 문맥과 어법을 함께 고려할 때 적절하지 않은 문장을 고르시오. 모든 선지가 같은 지문과 관련되므로 단순 키워드가 아니라 문장 구조를 끝까지 확인하세요.",why:`오류가 있는 선지는 원문의 “${b.opts[b.ans]}”를 “${b.opts[wi]}”로 바꾼 문장입니다. ${b.why||""}`,origin:"수능형 어법 오류판별 v8",difficulty:5,opts,ans:opts.indexOf(wrong)});
    }
  }
  data.questions=[...oldQs,...add];
  data.version="8.0.0";
  data.info={...(data.info||{}),questionsEach:75,fixedQuestions:75,questionTotal:data.questions.length,difficultyUpgrade:"수능형 최상위 강화 v8",contextAudit:"2026-10-10",grammarSentenceChoices:true,grammarEssayTransform:true,vocabExpansionV8:true,topicExpansionV8:true,sessionConvenienceV8:true};
  return data;
};const data=upgradeData(JSON.parse(el.textContent));el.textContent=JSON.stringify(data);window.ENGLISH_LAB_V8={version:data.version,questions:data.questions.length};})();