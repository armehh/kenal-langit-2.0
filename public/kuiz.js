// KenalLangit quiz + learn upgrade. Load AFTER the main script and aviation.js, BEFORE extras.js (extras wraps finish/buildCards).
(()=>{
const L=x=>Array.isArray(x)?x[lang=="ms"?0:1]:x;
Object.assign(T.ms,{m3:"IATA → ICAO",m4:"Negeri",m5:"Fakta → Lapangan",m6:"Pengetahuan penerbangan",m7:"Campuran",path:"Laluan",cards:"Kad",back:"← Kembali",check:"Uji pemahaman",nextU:"Unit seterusnya",ap0:"Kenali 18 lapangan terbang",ap0d:"Flashcard ikut kawasan",unit:"Unit",rec:"Seterusnya",units:"unit selesai",mk:["Betul!","Salah."],qn:"soalan",nolv:"Mod ini tiada tahap; semua soalan dari unit Belajar."});
Object.assign(T.en,{m3:"IATA → ICAO",m4:"State",m5:"Fact → Airport",m6:"Aviation knowledge",m7:"Mixed",path:"Path",cards:"Cards",back:"← Back",check:"Check your understanding",nextU:"Next unit",ap0:"Meet the 18 airports",ap0d:"Flashcards by region",unit:"Unit",rec:"Up next",units:"units done",mk:["Correct!","Wrong."],qn:"questions",nolv:"This mode has no levels; questions come from the Learn units."});

// ---------- QUESTION GENERATORS ----------
const nm=a=>[NAMES[a.iata][0],NAMES[a.iata][1]];
const opts=(ok,others)=>shuffle([ok,...others]);
const gen={
 1:(a,P)=>({s:a.iata+"?",a:a.iata,ref:a.iata,air:1,o:opts({id:a.iata,t:nm(a)},shuffle(P.filter(z=>z!==a)).slice(0,3).map(z=>({id:z.iata,t:nm(z)})))}),
 2:(a,P)=>({s:nm(a),a:a.iata,ref:a.iata,air:1,o:opts({id:a.iata,t:a.iata},shuffle(P.filter(z=>z!==a)).slice(0,3).map(z=>({id:z.iata,t:z.iata})))}),
 3:(a,P)=>({s:[`Apakah kod ICAO bagi ${a.iata}?`,`What is the ICAO code for ${a.iata}?`],a:a.iata,ref:a.iata,air:1,o:opts({id:a.iata,t:a.icao},shuffle(P.filter(z=>z!==a)).slice(0,3).map(z=>({id:z.iata,t:z.icao})))}),
 4:a=>{const ss=shuffle([...new Set(AIRPORTS.map(z=>z.state))].filter(s=>s!=a.state)).slice(0,3);
  return{s:[`${a.iata} (${a.city}) terletak di negeri mana?`,`Which state is ${a.iata} (${a.city}) in?`],a:a.state,ref:a.iata,air:1,o:opts({id:a.state,t:a.state},ss.map(s=>({id:s,t:s})))}},
 5:(a,P)=>{const m=f=>f.split(a.city).join("___");
  return{s:[`Lapangan terbang manakah ini? “${m(a.fact.ms)}”`,`Which airport is this? “${m(a.fact.en)}”`],a:a.iata,ref:a.iata,air:1,o:opts({id:a.iata,t:`${a.iata} · ${a.city}`},shuffle(P.filter(z=>z!==a)).slice(0,3).map(z=>({id:z.iata,t:`${z.iata} · ${z.city}`})))}}
};
Object.keys(gen).forEach(k=>{const f=gen[k];gen[k]=(a,P)=>{const q=f(a,P);q.fact=a.fact;return q}});
const KQ=()=>KL_UNITS.flatMap(u=>u.q.map(q=>({s:[q[0],q[1]],a:q[3],ref:u.id,air:0,e:q[4],fact:{ms:q[4][0],en:q[4][1]},o:shuffle(q[2].map((t,i)=>({id:i,t})))})));
function build(){
  const P=poolOf(),m=cfg.md,ai=shuffle(P),kq=shuffle(KQ());
  if(m==6)return kq.slice(0,10);
  if(m==7)return shuffle([...kq.slice(0,4),...ai.slice(0,6).map((a,i)=>gen[[1,2,3,4,5,4][i]](a,P))]);
  return ai.slice(0,10).map(a=>gen[m](a,P));
}

// ---------- QUIZ UI ----------
const MI={1:["🏷️","Teka nama daripada kod","Guess the name from the code"],2:["🔠","Teka kod daripada nama","Guess the code from the name"],3:["🧾","Padankan kod IATA dengan ICAO","Match IATA to ICAO codes"],4:["📍","Di negeri mana lapangan ini?","Which state is it in?"],5:["💡","Teka lapangan daripada fakta","Guess the airport from a fact"],6:["✈️","Soalan am daripada unit Belajar","General questions from the Learn units"],7:["🎲","Gabungan semua jenis soalan","A bit of every question type"]};
setup=function(){
  Q=null;
  $("#qbox").innerHTML=`<div class="qsu"><h2>${t("quiz")}</h2>
  <p class="lbl">1 · ${t("mode")}</p><div class="mgrid">${[1,2,3,4,5,6,7].map(m=>`<button class="mc${m==7?" wide":""}" data-m="${m}"><span class="mi">${MI[m][0]}</span><span><b>${t("m"+m)}</b><small>${MI[m][lang=="ms"?1:2]}</small></span></button>`).join("")}</div>
  <p class="lbl">2 · ${t("level")}</p>${seg("lv",["easy","med","hard"],cfg.lv)}<p class="lvn" id="lvn">${t("nolv")}</p>
  <p class="sum" id="sum"></p><button class="cta" id="go">${t("start")}</button></div>`;
  const refresh=()=>{
    $$("#qbox .mc").forEach(b=>b.classList.toggle("on",+b.dataset.m==cfg.md));
    $$("#lv button").forEach(b=>b.classList.toggle("on",b.dataset.v==cfg.lv));
    const off=cfg.md==6;$("#lv").classList.toggle("off",off);$("#lvn").hidden=!off;
    const n=cfg.md>=6?10:Math.min(10,poolOf().length);
    $("#sum").textContent=`${n} ${t("qn")} · ${t("m"+cfg.md)}${off?"":" · "+t(cfg.lv)}`;
  };
  $$("#qbox .mc").forEach(b=>b.onclick=()=>{cfg.md=+b.dataset.m;refresh()});
  $$("#lv button").forEach(b=>b.onclick=()=>{cfg.lv=b.dataset.v;refresh()});
  $("#go").onclick=()=>{Q={pool:poolOf(),list:build(),i:0,score:0,streak:0,missed:[],missedQ:[],finished:false};ask()};
  refresh();
};
ask=function(){
  if(Q.list[0]&&Q.list[0].iata)Q.list=Q.list.map(a=>gen[1](a,AIRPORTS)); // "Test me" from the map
  Q.missedQ=Q.missedQ||[];
  if(Q.i>=Q.list.length)return finish();
  const q=Q.list[Q.i];
  $("#qbox").innerHTML=`<div class="bar"><i style="width:${Q.i/Q.list.length*100}%"></i></div>
  <div class="meta"><span>${Q.i+1}/${Q.list.length}</span><span>${t("score")}: ${Q.score} · 🔥${Q.streak}</span></div>
  <div class="q" id="qs"></div><div class="opts" id="opts"></div><p class="fb" id="fb"></p>`;
  $("#qs").textContent=L(q.s);
  if(q.s&&!Array.isArray(q.s))$("#qs").style.fontFamily="ui-monospace,Consolas,monospace";
  const box=$("#opts");
  q.o.forEach(o=>{
    const b=document.createElement("button");b.textContent=L(o.t);b.dataset.id=o.id;
    b.onclick=()=>{
      const good=o.id==q.a;
      $$("#opts button").forEach(x=>x.disabled=true);
      b.classList.add(good?"ok":"no");
      if(!good)[...box.children].find(x=>x.dataset.id==q.a).classList.add("ok");
      if(good){Q.score+=10+Q.streak*2;Q.streak++}else{Q.streak=0;Q.missed.push(q.ref);Q.missedQ.push(q)}
      $("#fb").textContent=t("mk")[good?0:1];
      const n=document.createElement("button");n.className="cta";n.textContent=t("next");
      n.onclick=()=>{Q.i++;ask()};box.appendChild(n);n.focus();
    };
    box.appendChild(b);
  });
};
finish=function(){
  Q.finished=true;
  const total=Q.list.length,ok=total-Q.missed.length,mq=Q.missedQ||[];
  missedSet=new Set(mq.filter(q=>q.air).map(q=>q.ref));
  const ans=q=>L(q.o.find(o=>o.id==q.a).t);
  $("#qbox").innerHTML=`<h2>${t("done")}</h2><div class="q">${t("score")}: ${Q.score}</div><p>${t("acc")}: ${ok}/${total}</p>
  <h3>${t("missed")}</h3>${mq.length?`<ul>${mq.map(q=>`<li><small>${L(q.s)}</small><br><b>${ans(q)}</b></li>`).join("")}</ul>`:`<p>${t("none")}</p>`}
  <input id="nick" maxlength="20" placeholder="${t("nick")}"><button class="cta" id="send">${t("send")}</button><p class="fb" id="fb"></p>
  <button class="cta" id="again" style="background:#1e3a6b">${t("again")}</button>${mq.length?`<button class="cta" id="rev" style="background:#1e3a6b">${t("review")}</button>`:""}`;
  $("#nick").value=ls.get("kl-name","");
  $("#again").onclick=setup;
  if($("#rev"))$("#rev").onclick=()=>{LV.v=missedSet.size?"cards":"path";go("learn")};
  $("#send").onclick=async()=>{
    const name=$("#nick").value.trim();if(!name)return $("#nick").focus();
    ls.set("kl-name",name);
    try{
      const r=await fetch("/api/leaderboard",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,score:Q.score,level:cfg.lv,mode:cfg.md})});
      if(!r.ok)throw 0;$("#fb").textContent=t("sent");$("#send").disabled=true;
    }catch(e){$("#fb").textContent=t("fail")}
  };
};

// ---------- LEARN: structured path -> unit -> check, plus flashcards ----------
const LV={v:"path",a:{}};
const prog=()=>ls.get("kl-course",{});
const isDone=id=>(prog()[id]||0)>=2;
const st=document.createElement("style");
st.textContent=`.ltabs{display:flex;gap:6px;margin-bottom:12px}.ltabs button{flex:1}.ltabs button.on{background:var(--cyan);color:#04101f;font-weight:700}
.uc{display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin-bottom:8px;padding:14px;border:1px solid var(--line);background:var(--navy2)}
.uc.next{border-color:var(--cyan)}.uc .ic{font-size:1.6rem}.uc .m{flex:1}.uc .s{color:var(--green);font-weight:700}.uc small{display:block}
.pts li{border:0;padding:4px 0}.mq{margin-top:10px;padding:14px}.mq p{margin-bottom:8px}
.qsu .coach{margin:4px 0 6px}.qsu .rabbit{height:72px}.qsu .bubble{font-size:.85rem;padding:8px 10px}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mc.wide{grid-column:1/-1}
.mc{display:flex;align-items:center;gap:10px;text-align:left;padding:12px;border:1px solid var(--line);background:var(--navy2)}
.mc b{display:block}.mc small{display:block;color:var(--muted);line-height:1.25;margin-top:2px}.mi{font-size:1.5rem}
.mc.on{border-color:var(--cyan);background:#10285a;box-shadow:0 0 0 1px var(--cyan),0 0 14px rgba(59,232,255,.2)}
.seg.off{opacity:.4;pointer-events:none}.lvn{color:var(--muted);font-size:.8rem;margin-top:6px}
.sum{color:var(--muted);text-align:center;margin-top:16px;font-size:.9rem}
@media (max-width:380px){.mgrid{grid-template-columns:1fr}}`;
document.head.appendChild(st);

const tabs=()=>`<div class="ltabs"><button data-v="path" class="${LV.v=="cards"?"":"on"}">🧭 ${t("path")}</button><button data-v="cards" class="${LV.v=="cards"?"on":""}">🗂️ ${t("cards")}</button></div>`;
const wire=()=>{
  $$("#lbox [data-v]").forEach(b=>{if(b.parentNode.className=="ltabs")b.onclick=()=>{LV.v=b.dataset.v;buildCards()}});
  $$("#lbox [data-nav]").forEach(b=>b.onclick=()=>{LV.v=b.dataset.nav;LV.a={};buildCards();$("#learn").scrollTop=0;$("main").scrollTop=0});
};
function viewPath(){
  const p=prog(),done=KL_UNITS.filter(u=>isDone(u.id)).length,nx=KL_UNITS.find(u=>!isDone(u.id));
  let h=tabs()+`<p><b>${done}/${KL_UNITS.length}</b> ${t("units")}</p><div class="bar"><i style="width:${done/KL_UNITS.length*100}%"></i></div>
  <button class="uc" data-nav="cards"><span class="ic">🗺️</span><span class="m"><b>${t("ap0")}</b><small>${t("ap0d")}</small></span></button>`;
  KL_UNITS.forEach((u,i)=>{h+=`<button class="uc ${nx===u?"next":""}" data-nav="${u.id}"><span class="ic">${u.ic}</span><span class="m"><b>${t("unit")} ${i+1}: ${L(u.t)}</b><small>${nx===u?t("rec"):(p[u.id]!=null?p[u.id]+"/3":"")}</small></span>${isDone(u.id)?'<span class="s">✓</span>':""}</button>`});
  $("#lbox").innerHTML=h;
}
function viewUnit(u){
  const n=u.q.length,i0=KL_UNITS.indexOf(u),nx=KL_UNITS[i0+1];
  let h=`<button data-nav="path">${t("back")}</button><h2 style="margin-top:12px">${u.ic} ${L(u.t)}</h2><ul class="pts">${u.p.map(x=>`<li>${L(x)}</li>`).join("")}</ul><h3>${t("check")}</h3>`;
  u.q.forEach((q,qi)=>{
    const a=LV.a[qi];
    h+=`<div class="card mq"><p><b>${qi+1}. ${L([q[0],q[1]])}</b></p><div class="opts">${q[2].map((o,oi)=>`<button data-q="${qi}" data-o="${oi}" ${a!=null?"disabled":""} class="${a!=null&&oi==q[3]?"ok":a==oi?"no":""}">${L(o)}</button>`).join("")}</div>${a!=null?`<p class="fb"><small>${L(q[4])}</small></p>`:""}</div>`;
  });
  const got=Object.keys(LV.a).length==n,sc=u.q.filter((q,qi)=>LV.a[qi]==q[3]).length;
  if(got)h+=`<p class="q">${t("score")}: ${sc}/${n}${sc>=2?" ✓":""}</p>${nx?`<button class="cta" data-nav="${nx.id}">${t("nextU")}</button>`:""}<button class="cta" style="background:#1e3a6b" data-nav="path">${t("back")}</button>`;
  $("#lbox").innerHTML=h;
  $$("#lbox [data-q]").forEach(b=>b.onclick=()=>{
    LV.a[b.dataset.q]=+b.dataset.o;
    if(Object.keys(LV.a).length==n){const p=prog(),s=u.q.filter((q,qi)=>LV.a[qi]==q[3]).length;p[u.id]=Math.max(p[u.id]||0,s);ls.set("kl-course",p)}
    buildCards();
  });
}
function viewCards(){
  const known=ls.get("kl-known",{}),n=AIRPORTS.filter(a=>known[a.iata]===1).length;
  let h=tabs()+`<p style="color:var(--muted)">${t("flip")}</p><p><b>${n}/${AIRPORTS.length}</b> ${t("known")}</p>`;
  ["Semenanjung","Sabah","Sarawak"].forEach(r=>{
    h+=`<h3>${t(r)}</h3><div class="grid">`;
    AIRPORTS.filter(a=>REG(a)==r).forEach(a=>{
      const s=known[a.iata]===1?"k":known[a.iata]===0?"r":"",f=flip[a.iata];
      h+=`<div class="fcw ${s} ${missedSet.has(a.iata)?"miss":""}"><button class="fc" data-f="${a.iata}">${f?`${nameOf(a,lang)}<br><small>${a.state}</small>`:`<b>${a.iata}</b><br><small>${a.icao}</small>`}</button>
      <div class="act"><button data-k="${a.iata}" data-v="1" aria-label="${t("known")}">✓</button><button data-k="${a.iata}" data-v="0" aria-label="review">↻</button></div></div>`;
    });
    h+=`</div>`;
  });
  $("#lbox").innerHTML=h;
  $$("#lbox .fc").forEach(b=>b.onclick=()=>{flip[b.dataset.f]=!flip[b.dataset.f];buildCards()});
  $$("#lbox .act button").forEach(b=>b.onclick=()=>{known[b.dataset.k]=+b.dataset.v;ls.set("kl-known",known);buildCards()});
}
buildCards=function(){
  const u=KL_UNITS.find(x=>x.id==LV.v);
  if(u)viewUnit(u);else if(LV.v=="cards")viewCards();else viewPath();
  wire();
};
setup();buildCards();
})();
