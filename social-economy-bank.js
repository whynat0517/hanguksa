(function(){
"use strict";
const source=window.SOCIAL_ECONOMY_DATA,manual=window.SOCIAL_ECONOMY_QUESTIONS;
if(!source||!manual)return;
const bank=[],G=source.glossary;
function mix(a){let b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function add(q){if(!q||q.options.length!==5||new Set(q.options).size!==5||!q.options.includes(q.correct)){throw Error("Invalid economics MCQ "+(q&&q.id));}bank.push(q);}
manual.forEach(q=>add({...q,options:mix(q.options)}));
G.forEach(g=>{
 const others=mix(G.filter(x=>x.unit===g.unit&&x.id!==g.id)).slice(0,4);
 const why1={[g.term]:g.definition+" "+g.example};
 others.forEach(x=>why1[x.term]="이는 ‘"+x.term+"’의 뜻입니다. "+x.definition);
 add({id:"def-"+g.id,unit:g.unit,difficulty:"basic",type:"term",stem:"다음 설명이 뜻하는 개념으로 가장 적절한 것은?\n\n"+g.definition,correct:g.term,options:mix([g.term,...others.map(x=>x.term)]),why:why1,explain:g.term+": "+g.example});
 const why2={[g.definition]:g.example};
 others.forEach(x=>why2[x.definition]="이 문장은 ‘"+x.term+"’의 설명입니다. "+x.example);
 add({id:"reverse-"+g.id,unit:g.unit,difficulty:"advanced",type:"term",stem:"다음 중 ‘"+g.term+"’의 개념에 해당하는 설명은?",correct:g.definition,options:mix([g.definition,...others.map(x=>x.definition)]),why:why2,explain:g.term+": "+g.definition+" "+g.trap});
});
function kr(n){return Number(n.toFixed(2)).toLocaleString("ko-KR")+"만 원";}
function numeric(id,unit,difficulty,type,stem,right,errors,detail){
 const options=[right,...errors],why={};
 if(new Set(options).size!==5)throw Error("Duplicate numeric options: "+id);
 options.forEach(x=>why[x]=(x===right?"정답. ":"오답. 주어진 비용·편익·공식을 적용하면 이 값이 나오지 않습니다. ")+detail);
 add({id,unit,difficulty,type,stem,correct:right,options:mix(options),why,explain:detail});
}
for(const fee of [3,5,7])for(const forgone of [4,6,9]){
 const total=fee+forgone;
 numeric("op-"+fee+"-"+forgone,"B","advanced","calc","강의에 참여하면 수강료 "+fee+"만 원을 지출하고, 대신 할 수 있는 최선의 아르바이트 수입 "+forgone+"만 원을 포기한다. 강의 참여의 기회비용은? (다른 비용 없음)",kr(total),[kr(fee),kr(forgone),kr(total+fee),kr(total+forgone)],"명시적 비용 "+fee+" + 암묵적 비용 "+forgone+" = "+total+"만 원.");
}
for(const benefit of [20,25,30])for(const fee of [4,6])for(const alternative of [8,10]){
 const net=benefit-fee-alternative;
 numeric("net-"+benefit+"-"+fee+"-"+alternative,"B","extreme","calc","어떤 선택의 편익은 "+benefit+"만 원, 실제 지출은 "+fee+"만 원, 포기한 최선의 대안 가치는 "+alternative+"만 원이다. 순편익은?",kr(net),[kr(benefit-fee),kr(benefit-alternative),kr(benefit),kr(net+5)],"기회비용 "+(fee+alternative)+"만 원을 편익 "+benefit+"만 원에서 빼면 순편익은 "+net+"만 원.");
}
for(const p of [100,200,300])for(const rate of [5,10]){
 const r=rate/100,simple=p*(1+2*r),compound=p*(1+r)*(1+r),one=p*(1+r),three=p*(1+3*r);
 numeric("simple-"+p+"-"+rate,"D","advanced","calc",p+"만 원을 연 "+rate+"% 단리로 2년간 맡기면 만기 원리금은? (세금·수수료 제외)",kr(simple),[kr(compound),kr(p),kr(one),kr(three)],"단리 원리금="+p+"×(1+"+rate+"%×2)="+kr(simple)+".");
 numeric("compound-"+p+"-"+rate,"D","advanced","calc",p+"만 원을 연 "+rate+"% 복리로 2년간 맡기면 만기 원리금은? (세금·수수료 제외)",kr(compound),[kr(simple),kr(p),kr(one),kr(three)],"복리 원리금="+p+"×(1+"+rate+"%)²="+kr(compound)+".");
}
for(const base of [1100,1200,1300])for(const addRate of [100,200])for(const dollar of [50,100]){
 const right=(base+addRate)*dollar,format=n=>n.toLocaleString("ko-KR")+"원";
 numeric("fx-"+base+"-"+addRate+"-"+dollar,"E","advanced","calc","원/달러 환율이 "+base+"원에서 "+(base+addRate)+"원으로 올랐다. "+dollar+"달러인 수입품의 원화 표시 가격은? (다른 조건 일정)",format(right),[format(base*dollar),format(right+addRate),format(right+dollar),format(right-addRate)],"환산 가격은 "+(base+addRate)+"×"+dollar+"="+format(right)+".");
}
for(const d of [-20,0,20])for(const s of [-20,0,20]){
 if(d===0&&s===0)continue;
 const price=(100+d-s)/4,quantity=20+s+2*price;
 const statement="수요 Qd=120"+(d>=0?"+":"")+d+"−2P, 공급 Qs=20"+(s>=0?"+":"")+s+"+2P이다. (P는 가격, Q는 거래량)\n";
 const detail="Qd=Qs를 풀면 균형 가격은 "+price+", 균형 거래량은 "+quantity+"이다.";
 numeric("ep-"+d+"-"+s,"C","extreme","graph",statement+"균형 가격은?",String(price),[String(price+5),String(price-5),String(price+10),String(price-10)],detail);
 numeric("eq-"+d+"-"+s,"C","extreme","graph",statement+"균형 거래량은?",String(quantity),[String(quantity+10),String(quantity-10),String(quantity+20),String(quantity-20)],detail);
}
const scenarios=[["쌀","의류",12,6,8,8],["빵","전자기기",10,5,6,6],["곡물","자동차",8,4,6,6],["과일","컴퓨터",16,8,10,10]];
scenarios.forEach((z,i)=>{
 const [a,b,ax,ay,bx,by]=z;
 const c="A국: "+a+" / B국: "+b;
 const opts=[c,"A국: "+b+" / B국: "+a,"두 나라 모두: "+a,"두 나라 모두: "+b,"두 나라 모두 교역 금지"];
 const why={};
 why[c]="A국의 "+a+" 생산 기회비용은 "+(ay/ax)+" "+b+", B국은 "+(by/bx)+" "+b+"이다. 따라서 A국은 "+a+"에, B국은 "+b+"에 비교 우위가 있다.";
 why[opts[1]]="양국의 상대적 기회비용을 거꾸로 적용했다.";
 why[opts[2]]="B국에는 "+b+"의 상대적 기회비용이 더 낮으므로 비교 우위에 따른 특화가 아니다.";
 why[opts[3]]="A국에는 "+a+"의 상대적 기회비용이 더 낮다.";
 why[opts[4]]="서로 다른 비교 우위가 있다면 상호 교역 이익이 발생할 수 있다.";
 add({id:"trade-"+i,unit:"E",difficulty:"extreme",type:"trade",stem:"[1시간 동안 생산할 수 있는 최대량]\nA국: "+a+" "+ax+"개 또는 "+b+" "+ay+"개\nB국: "+a+" "+bx+"개 또는 "+b+" "+by+"개\n\n비교 우위에 따른 특화 방향은?",correct:c,options:mix(opts),why,explain:why[c]});
});
window.SOCIAL_ECONOMY_BANK=bank;
window.SOCIAL_ECONOMY_SHUFFLE=mix;
})();