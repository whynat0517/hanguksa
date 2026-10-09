'use strict';(()=>{const el=document.getElementById('dataset');if(!el)return;const upgradeV9=function upgradeV9(data){
  if(data.version==="9.0.0")return data;
  if(data.version!=="8.0.0")return data;
  const entries=data.entries, oldQs=data.questions;
  function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
  function split(t){return String(t||"").replace(/\s+/g," ").trim().match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map(x=>x.trim()).filter(x=>x.length>22)||[]}
  function unique(a){return [...new Set(a.filter(Boolean))]}
  function seedOf(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function shuffle(a,seed){a=[...a];let x=(seed>>>0)||123456789;for(let i=a.length-1;i>0;i--){x=(1664525*x+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
  function words(t){const stop=new Set(["the","a","an","and","or","but","of","to","in","on","for","with","as","by","from","that","this","these","those","is","are","was","were","be","been","being","it","its","their","his","her","they","we","you","i","at","into","about","than","through","how","why","what","when"]);return new Set((String(t||"").toLowerCase().match(/[a-z][a-z'-]{2,}/g)||[]).filter(w=>!stop.has(w)))}
  function sim(a,b){const A=words(a),B=words(b);let n=0;for(const w of A)if(B.has(w))n++;return n/Math.max(1,Math.sqrt(A.size*B.size))}
  function nearest(e,n=10){return entries.filter(x=>x.id!==e.id).map(x=>({x,s:sim(e.text+" "+e.title,x.text+" "+x.title)})).sort((a,b)=>b.s-a.s).slice(0,n).map(z=>z.x)}
  function grammarSentence(q){const p=String(q.q||"").split(/\n\n+/);return p.reverse().find(x=>x.includes("[ ______ ]"))?.trim()||""}
  function rec(q,i=q.ans){const s=grammarSentence(q);return s&&q.opts?.[i]!=null?s.replace("[ ______ ]",q.opts[i]):""}
  function wrongIndex(q,offset=0){
    const c=String(q.opts?.[q.ans]??"").toLowerCase();
    const pref={is:["are","be","being"],are:["is","be","being"],has:["have","having"],have:["has","having"],was:["were","be"],were:["was","be"],than:["then","that"],to:["with","at","for"],that:["what","where","who"],their:["them","there","they"],and:["despite","although","because"],because:["despite","and","although"],who:["what","where","that"],which:["what","where","who"],of:["for","to","with"],in:["at","on","of"],may:["mays","may to","to may"]}[c]||[];
    for(const p of pref){const i=q.opts.findIndex((x,j)=>j!==q.ans&&String(x).toLowerCase()===p);if(i>=0)return i}
    const other=q.opts.map((_,i)=>i).filter(i=>i!==q.ans);return other[offset%other.length];
  }
  function famPool(wf,mode){const out=[];for(const x of entries){for(const f of (x.summary?.wordFamilies||[])){if(!f.word||!f.synonym||!f.antonym)continue;const v=mode==="syn"?f.synonym:f.antonym;if(v&&v!==wf.word&&v!==wf.synonym&&v!==wf.antonym)out.push(v)}}return unique(out)}
  function meta(wf,cands,kind,seed){
    const correct=kind==="syn"?wf.synonym:wf.antonym,vals=unique([correct,...cands]).slice(0,5),opts=shuffle(vals,seed).map(v=>kind==="syn"?`The word “${wf.word}” can most naturally be replaced by “${v}” in this context.`:`In this context, “${v}” expresses the clearest opposite of “${wf.word}.”`),target=kind==="syn"?`The word “${wf.word}” can most naturally be replaced by “${correct}” in this context.`:`In this context, “${correct}” expresses the clearest opposite of “${wf.word}.”`;
    return{opts,ans:opts.indexOf(target)}
  }
  function replacement(e,wf){
    const re=new RegExp("\\b"+escRe(wf.word)+"\\b","i"),source=split(e.text).find(x=>re.test(x));
    if(!source)return null;
    const vals=unique([wf.synonym,wf.antonym,...famPool(wf,"syn")]).slice(0,5),opts=shuffle(vals.map(v=>source.replace(re,v)),seedOf(e.id+wf.word+"replace9")),correct=source.replace(re,wf.synonym);
    return{opts,ans:opts.indexOf(correct),source}
  }
  function flip(s){
    const pairs=[[/\bmore\b/i,"less"],[/\bless\b/i,"more"],[/\bhigher\b/i,"lower"],[/\blower\b/i,"higher"],[/\bgreater\b/i,"smaller"],[/\bsmaller\b/i,"greater"],[/\bbetter\b/i,"worse"],[/\bworse\b/i,"better"],[/\boften\b/i,"rarely"],[/\brarely\b/i,"often"],[/\balways\b/i,"never"],[/\bnever\b/i,"always"],[/\bbefore\b/i,"after"],[/\bafter\b/i,"before"],[/\bpositive\b/i,"negative"],[/\bnegative\b/i,"positive"]];
    for(const [re,r] of pairs)if(re.test(s))return s.replace(re,r);
    if(/\bnot\b/i.test(s))return s.replace(/\bnot\s+/i,"");
    const aux=[[/\bcould\b/i,"could not"],[/\bcan\b/i,"cannot"],[/\bwould\b/i,"would not"],[/\bwill\b/i,"will not"],[/\bshould\b/i,"should not"],[/\bmust\b/i,"must not"],[/\bhas\b/i,"has not"],[/\bhave\b/i,"have not"],[/\bis\b/i,"is not"],[/\bare\b/i,"are not"],[/\bwas\b/i,"was not"],[/\bwere\b/i,"were not"]];
    for(const [re,r] of aux)if(re.test(s))return s.replace(re,r);
    return null;
  }
  const add=[];
  for(const e of entries){
    const qE=oldQs.filter(q=>q.pid===e.id), grammar=qE.filter(q=>q.type==="문법"&&grammarSentence(q)&&q.opts?.length>=4), originals=split(e.text),near=nearest(e),fam=(e.summary?.wordFamilies||[]).filter(f=>f.word&&f.synonym&&f.antonym);
    if(grammar.length<5||originals.length<4||fam.length<1)throw new Error("v9 source shortage: "+e.id);

    // 76-78: one subtle grammar error among grammatically valid source sentences.
    for(let k=0;k<3;k++){
      const b=grammar[(k+2)%grammar.length],wi=wrongIndex(b,k),bad=rec(b,wi),good=rec(b,b.ans);
      const fill=shuffle(unique(originals.filter(x=>x!==good&&x!==bad)),seedOf(e.id+"v9gfill"+k)).slice(0,4);
      const opts=shuffle(unique([bad,...fill]),seedOf(e.id+"v9grammarErr"+k));
      add.push({id:`${e.id}-Q${76+k}`,pid:e.id,type:"문법",q:"[수능형 최상위 어법] 다음 영어 문장 중 문맥과 어법을 모두 고려할 때 적절하지 않은 것을 고르시오. 단순 철자 차이가 아니라 수일치·절 구조·접속 관계·준동사·수식 범위를 끝까지 확인하세요.",why:`정답 선지는 원문의 올바른 형태 “${b.opts[b.ans]}”를 “${b.opts[wi]}”로 바꾸어 구조적 오류를 만든 문장입니다. ${b.why||""}`,origin:"수능형 최상위 어법 v9",difficulty:5,opts,ans:opts.indexOf(bad)});
    }

    // 79-80: all options are complete sentences; only one preserves the validated source grammar.
    for(let k=0;k<2;k++){
      const b=grammar[(k+5)%grammar.length],opts=b.opts.map((_,i)=>rec(b,i));
      add.push({id:`${e.id}-Q${79+k}`,pid:e.id,type:"문법",q:"[수능형 문장형 어법] 다음 중 원문의 의미를 유지하면서 어법상 가장 적절한 완전한 영어 문장을 고르시오. 빈칸 하나만 보는 방식이 아니라 문장 전체 구조를 비교하세요.",why:`원문에서 검증된 정답 형태는 “${b.opts[b.ans]}”입니다. ${b.why||""}`,origin:"완전문장 어법 v9",difficulty:5,opts,ans:b.ans});
    }

    // 81-83: vocabulary in full English sentences.
    {
      const wf=fam[0],pack=meta(wf,unique([wf.antonym,...famPool(wf,"syn")]).slice(0,8),"syn",seedOf(e.id+"v9syn"));
      add.push({id:`${e.id}-Q81`,pid:e.id,type:"유의어",q:"[수능형 유의어] 다음 영어 설명 중 본문의 문맥에서 가장 정확한 것을 고르시오. 사전 첫 뜻보다 품사·강도·결합 관계를 우선하세요.",why:`“${wf.word}”와 문맥상 가장 자연스럽게 대응하는 표현은 “${wf.synonym}”입니다.`,origin:"유의어 심화 v9",difficulty:5,opts:pack.opts,ans:pack.ans});
    }
    {
      const wf=fam[1]||fam[0],pack=meta(wf,unique([wf.synonym,...famPool(wf,"ant")]).slice(0,8),"ant",seedOf(e.id+"v9ant"));
      add.push({id:`${e.id}-Q82`,pid:e.id,type:"반의어",q:"[수능형 반의어] 다음 영어 설명 중 본문에서의 의미 방향을 가장 정확하게 뒤집는 것을 고르시오. 관련어와 실제 반의어를 구분하세요.",why:`“${wf.word}”와 문맥상 가장 분명하게 반대되는 표현은 “${wf.antonym}”입니다.`,origin:"반의어 심화 v9",difficulty:5,opts:pack.opts,ans:pack.ans});
    }
    {
      const wf=fam[2]||fam[0],rep=replacement(e,wf);
      if(rep)add.push({id:`${e.id}-Q83`,pid:e.id,type:"유사표현",q:`[수능형 문맥 치환] 다음 중 본문의 “${wf.word}”를 바꾸어 쓰면서 원래 문장의 의미와 어법을 가장 잘 유지한 문장을 고르시오.`,why:`“${wf.synonym}”은 이 문맥에서 “${wf.word}”의 의미와 문법적 역할을 가장 가깝게 유지합니다.`,origin:"문맥 치환 심화 v9",difficulty:5,opts:rep.opts,ans:rep.ans});
      else{const pack=meta(wf,unique([wf.antonym,...famPool(wf,"syn")]).slice(0,8),"syn",seedOf(e.id+"v9sim"));add.push({id:`${e.id}-Q83`,pid:e.id,type:"유사표현",q:"[수능형 문맥 치환] 다음 중 본문의 핵심 표현을 가장 자연스럽게 바꾸어 쓸 수 있다고 설명한 문장을 고르시오.",why:`“${wf.word}”는 이 문맥에서 “${wf.synonym}”과 가장 가깝습니다.`,origin:"문맥 치환 심화 v9",difficulty:5,opts:pack.opts,ans:pack.ans})}
    }

    // 84-86: topic/title/main idea with close, grammatical English distractors.
    {
      const titles=unique([e.title,...near.map(x=>x.title)]).slice(0,5),opts=shuffle(titles,seedOf(e.id+"v9title")).map((t,i)=>["The passage could best be titled","A suitable title for the passage would be","The central issue is captured by the title","The passage is most accurately framed as","The best heading for the discussion is"][i%5]+` “${t}.”`),correctTitle=e.title;
      const ans=opts.findIndex(x=>x.includes(`“${correctTitle}.”`));
      add.push({id:`${e.id}-Q84`,pid:e.id,type:"주제·제목",q:"[수능형 제목] 다음 중 글 전체의 논리와 범위를 가장 정확히 포괄하는 영어 제목 설명을 고르시오. 일부 소재만 겹치는 선지는 제외하세요.",why:`이 글의 핵심 범위와 초점은 “${e.title}”에 가장 정확히 반영됩니다.`,origin:"영어 제목 선지 다양화 v9",difficulty:5,opts,ans});
    }
    {
      const key=e.summary?.keySentence||originals[0],vals=unique([key,...near.map(x=>x.summary?.keySentence||split(x.text)[0]).filter(Boolean)]).slice(0,5),opts=shuffle(vals,seedOf(e.id+"v9main"));
      add.push({id:`${e.id}-Q85`,pid:e.id,type:"주장·요지",q:"[수능형 주제·요지] 다음 영어 문장 중 글 전체의 중심 생각을 가장 정확히 나타내는 것을 고르시오. 모든 선지가 자연스러운 영어 문장이므로 내용의 범위와 논리 방향으로 구분하세요.",why:"정답은 해당 지문의 핵심 문장입니다. 다른 선지는 문법적으로 자연스럽지만 다른 지문의 중심 논리이거나 이 글의 범위를 벗어납니다.",origin:"주제·요지 심화 v9",difficulty:5,opts,ans:opts.indexOf(key)});
    }
    {
      const titles=unique([e.title,...near.slice(0,4).map(x=>x.title)]),opts=shuffle(titles,seedOf(e.id+"v9scope")).map(t=>`Overall, the author develops an argument centered on “${t}” rather than merely mentioning it as a detail.`),target=`Overall, the author develops an argument centered on “${e.title}” rather than merely mentioning it as a detail.`;
      add.push({id:`${e.id}-Q86`,pid:e.id,type:"주제·제목",q:"[수능형 주제 범위] 다음 중 글에서 중심적으로 다루는 범위를 가장 정확히 설명한 영어 문장을 고르시오.",why:"세부 소재와 중심 논제를 구분해야 합니다. 정답 선지만 글 전체를 관통하는 중심 범위를 설명합니다.",origin:"주제 범위 변별 v9",difficulty:5,opts,ans:opts.indexOf(target)});
    }

    // 87-88: subtle content consistency; false sentence remains grammatical.
    for(let k=0;k<2;k++){
      const target=originals[(originals.length-1-k+originals.length)%originals.length],changed=flip(target);
      let falseSentence=changed;
      if(!falseSentence||falseSentence===target){
        const pool=near.flatMap(x=>split(x.text)).sort((a,b)=>sim(target,b)-sim(target,a));
        falseSentence=pool[0];
      }
      const trueOpts=shuffle(originals.filter(x=>x!==target),seedOf(e.id+"v9truth"+k)).slice(0,4),opts=shuffle(unique([falseSentence,...trueOpts]),seedOf(e.id+"v9content"+k));
      add.push({id:`${e.id}-Q${87+k}`,pid:e.id,type:"내용 이해",q:"[수능형 초고난도 내용 일치] 다음 영어 문장 중 본문의 내용과 일치하지 않는 것을 고르시오. 선지의 핵심 단어가 원문과 같더라도 부정·비교·정도·인과·시점이 미세하게 바뀌었는지 확인하세요.",why:"오답 선지는 문법적으로는 자연스럽지만 원문의 의미 관계 한 부분을 뒤집거나, 매우 유사한 다른 지문의 내용을 섞었습니다. 문법이 아니라 내용 논리로 판별해야 합니다.",origin:"미세 함정 내용일치 v9",difficulty:5,opts,ans:opts.indexOf(falseSentence)});
    }

    // 89-90: grammar-based constructed response.
    for(let k=0;k<2;k++){
      const b=grammar[k%grammar.length],wi=wrongIndex(b,k+1),wrong=rec(b,wi),correct=rec(b,b.ans);
      add.push({id:`${e.id}-Q${89+k}`,pid:e.id,type:"서술형",q:`[서술형 · 문법 변형 심화] 다음 영어 문장의 어법 오류를 바로잡아 문장 전체를 다시 쓰시오.\n\n${wrong}\n\n조건: “${b.opts[wi]}”가 포함된 부분의 구조를 분석하고, 본문과 같은 핵심 의미를 유지하면서 완전한 문장으로 고칠 것.`,why:`해당 위치에는 “${b.opts[b.ans]}”가 필요합니다. 정답을 고친 뒤 주어·동사, 절의 완전성, 수식·병렬 관계까지 다시 검산하세요.`,origin:"문법 변형 서술형 심화 v9",difficulty:5,sample:correct,answer:correct});
    }
  }
  data.questions=[...oldQs,...add];
  data.version="9.0.0";
  data.info={...(data.info||{}),questionsEach:90,fixedQuestions:90,questionTotal:data.questions.length,difficultyUpgrade:"수능형 최상위 강화 v9",contextAudit:"2026-10-10",grammarV9:true,vocabV9:true,topicV9:true,contentTrapV9:true,essayGrammarV9:true,questionMapV9:true};
  return data;
};const data=upgradeV9(JSON.parse(el.textContent));el.textContent=JSON.stringify(data);window.ENGLISH_LAB_V9={version:data.version,questions:data.questions.length};})();