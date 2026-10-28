// KenalLangit home.js: "Utama / Home" dashboard page, opened by tapping the KenalLangit logo in the header (no bottom-bar tab).
// Cards: live sky summary, KUL weather (METAR), your progress (+ top 3), quick actions.
// Uses data the app already fetches (/api/flights, /api/weather/WMKK, /api/leaderboard) + localStorage. No new backend, no AirLabs calls.
// Load AFTER videos.js (and therefore after panel.js, which provides the click-a-plane hook).
(()=>{
// ---- EDIT HERE: your links ----
const ME={name:"Armin Rafiqin",role:{ms:"Pelajar Kejuruteraan Perisian (Pembangunan Sistem Multimedia), UKM",en:"Software Engineering (Multimedia System Development) student, UKM"},
  github:"https://github.com/armehh",githubLabel:"@armehh",linkedin:"https://linkedin.com/in/armin-rafiqin",linkedinLabel:"armin-rafiqin",repo:"https://github.com/armehh/kenal-langit-2.0"};
// [label, url] shown under "Credits"
const CREDITS=[["adsb.lol · airplanes.live · adsb.fi","https://adsb.lol"],["OpenSky Network","https://opensky-network.org"],["AviationWeather.gov (NOAA)","https://aviationweather.gov"],["adsbdb","https://www.adsbdb.com"],["AirLabs","https://airlabs.co"],["OpenStreetMap","https://www.openstreetmap.org/copyright"],["CARTO","https://carto.com/attributions"],["Leaflet","https://leafletjs.com"]];
const H={
ms:{about:"Tentang projek",madeBy:"Dibina oleh",ghBtn:"GitHub",liBtn:"LinkedIn",star:"Beri ⭐ di GitHub",credits:"Kredit",creditsTxt:"Data penerbangan, cuaca, laluan, status dan peta datang daripada sumber awam di bawah. Video kepunyaan pemilik saluran masing-masing di YouTube. Projek pembelajaran, bukan untuk navigasi penerbangan sebenar.",logo:"Halaman utama",hi:n=>`Hai, ${n}`,welcome:"Selamat datang",sub:"Ringkasan langit Malaysia sekarang.",
  live:"Di langit sekarang",sample:"Data contoh",planes:"pesawat",byAir:"Mengikut syarikat",other:"Lain-lain",highest:"Paling tinggi",fastest:"Paling laju",kmh:"km/j",tap:"Ketik untuk lihat di peta.",nodata:"Tiada data penerbangan buat masa ini.",
  wx:"Cuaca KUL",load:"Memuatkan...",temp:"Suhu",wind:"Angin",vis:"Penglihatan",calm:"Tenang",vrb:"Berubah-ubah",obs:"Dilaporkan",ago:"lalu",min:"min",hr:"jam",wxNone:"Tiada laporan METAR terkini.",wxErr:"Cuaca tidak tersedia buat masa ini.",onmap:"Lihat di peta",src:"Sumber: AviationWeather.gov (NOAA)",
  VFR:"VFR · baik untuk terbang",MVFR:"MVFR · sederhana",IFR:"IFR · penglihatan rendah",LIFR:"LIFR · sangat rendah",
  prog:"Kemajuan awak",rank:"Pangkat",noRank:"Main kuiz untuk dapat pangkat.",apKnown:"Lapangan terbang dikenali",units:"Unit Belajar selesai",last:"Kuiz terakhir",best:"Skor terbaik",noQuiz:"Belum ada kuiz.",correct:"betul",pts:"mata",top3:"3 teratas",
  r4:"Kapten",r3:"Pegawai Pertama",r2:"Juruterbang Pelatih",r1:"Penumpang Setia",
  qa:"Tindakan pantas",cont:n=>`Sambung: Unit ${n}`,contAll:"Semak kad lapangan terbang",qz:"Mula kuiz",qzSub:"Pilih mod dan tahap",busy:"Kuiz lapangan tersibuk",busySub:(a,n)=>`${a}: ${n} pesawat berhampiran`},
en:{about:"About this project",madeBy:"Built by",ghBtn:"GitHub",liBtn:"LinkedIn",star:"Star it on GitHub",credits:"Credits",creditsTxt:"Flight, weather, route, status and map data come from the public sources below. Videos belong to their YouTube channel owners. A learning project, not for real flight navigation.",logo:"Home",hi:n=>`Hi, ${n}`,welcome:"Welcome",sub:"Malaysia's sky right now.",
  live:"In the sky now",sample:"Sample data",planes:"aircraft",byAir:"By airline",other:"Other",highest:"Highest",fastest:"Fastest",kmh:"km/h",tap:"Tap to see it on the map.",nodata:"No flight data right now.",
  wx:"KUL weather",load:"Loading...",temp:"Temperature",wind:"Wind",vis:"Visibility",calm:"Calm",vrb:"Variable",obs:"Reported",ago:"ago",min:"min",hr:"h",wxNone:"No recent METAR report.",wxErr:"Weather is unavailable right now.",onmap:"View on map",src:"Source: AviationWeather.gov (NOAA)",
  VFR:"VFR · good flying weather",MVFR:"MVFR · marginal",IFR:"IFR · low visibility",LIFR:"LIFR · very low",
  prog:"Your progress",rank:"Rank",noRank:"Play a quiz to earn a rank.",apKnown:"Airports known",units:"Learn units done",last:"Last quiz",best:"Best score",noQuiz:"No quiz yet.",correct:"correct",pts:"pts",top3:"Top 3",
  r4:"Captain",r3:"First Officer",r2:"Trainee Pilot",r1:"Loyal Passenger",
  qa:"Quick actions",cont:n=>`Continue: Unit ${n}`,contAll:"Review airport cards",qz:"Start a quiz",qzSub:"Pick a mode and level",busy:"Quiz the busiest airport",busySub:(a,n)=>`${a}: ${n} aircraft nearby`}
};
const h=k=>H[lang][k];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:null};
const AL={MAS:"Malaysia Airlines",AXM:"AirAsia",FFM:"Firefly",MXD:"Batik Air Malaysia",AIQ:"Thai AirAsia",SIA:"Singapore Airlines",TGW:"Scoot"};
const pre=f=>(f.cs||"").slice(0,3).toUpperCase();
const key=f=>f.icao||f.cs;
const km=(a,b,c,d)=>{const r=Math.PI/180;return 6371*Math.hypot((c-a)*r,(d-b)*r*Math.cos((a+c)/2*r))};
const RANK_ICON=["","🧳","🎓","👨‍✈️","🏅"];
const MEDAL=["🥇","🥈","🥉"];

// ---------- styles ----------
const st=document.createElement("style");
st.textContent=`
.hm{max-width:900px;margin:0 auto;padding:16px;display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:760px){.hm{grid-template-columns:repeat(2,minmax(0,1fr))}.hm .full{grid-column:1/-1}}
.hm-top h1{font-size:1.5rem;line-height:1.2}.hm-top p{color:var(--muted);margin-top:4px}
.hm .card{padding:16px}
.hm-h{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 12px;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.hm-tag{font-size:.72rem;letter-spacing:0;text-transform:none;padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}
.hm-tag.on{border-color:var(--green);color:var(--green)}
.hm-big{font-size:2.6rem;font-weight:800;line-height:1;color:var(--cyan);text-shadow:0 0 16px rgba(59,232,255,.45)}
.hm-big small{font-size:.95rem;font-weight:500;color:var(--muted);text-shadow:none;margin-left:6px}
.hm-sub{color:var(--muted);font-size:.85rem;margin:12px 0 6px}
.hm-bars{display:grid;gap:7px}
.hm-bar{display:grid;grid-template-columns:minmax(78px,38%) 1fr 2ch;gap:8px;align-items:center;font-size:.85rem}
.hm-bar span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hm-bar i{display:block;height:8px;border-radius:4px;min-width:3px}
.hm-bar b{text-align:right;font-variant-numeric:tabular-nums}
.hm-rows{display:grid;gap:6px;margin-top:12px}
.hm-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border:1px solid var(--line);background:#0a1226}
.hm-row:hover{background:#14264d}
.hm-row .l{color:var(--muted);font-size:.8rem;min-width:5.6rem}.hm-row b{flex:1;font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;color:var(--cyan)}.hm-row .v{font-size:.85rem;white-space:nowrap}
.hm-note{color:var(--muted);font-size:.78rem;margin-top:8px}
.hm-wx{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:.9rem;margin:10px 0 0}.hm-wx dt{color:var(--muted)}.hm-wx dd{margin:0}
.hm-cat{display:inline-block;padding:2px 10px;border-radius:999px;font-size:.78rem;font-weight:700}
.hm-VFR{background:rgba(34,197,139,.18);color:var(--green)}.hm-MVFR{background:rgba(80,140,255,.2);color:#7aa8ff}
.hm-IFR{background:rgba(255,71,87,.18);color:var(--red)}.hm-LIFR{background:rgba(214,100,255,.2);color:#e089ff}
.hm-link{background:none;padding:0;color:var(--cyan);text-decoration:underline;font-size:.85rem}
.hm-rank{display:flex;align-items:center;gap:12px;margin-bottom:12px}.hm-rank .ic{font-size:2rem}.hm-rank b{font-size:1.2rem;color:var(--yellow)}
.hm-stat{margin:10px 0 0}.hm-stat .t{display:flex;justify-content:space-between;font-size:.88rem;margin-bottom:5px}.hm-stat .bar{margin-bottom:0}
.hm-kv{display:flex;justify-content:space-between;gap:8px;font-size:.88rem;padding:8px 0;border-top:1px solid var(--line)}.hm-kv span:first-child{color:var(--muted)}
.hm-top3{margin-top:10px;padding:0;list-style:none}.hm-top3 li{display:flex;justify-content:space-between;gap:8px;padding:7px 0;font-size:.88rem}
.hm-act{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}
.hm-a{display:flex;align-items:center;gap:12px;text-align:left;padding:14px;border:1px solid var(--line);background:#0a1226}
.hm-a.pri{border-color:var(--cyan);background:#10285a}
.hm-a .ic{font-size:1.6rem}.hm-a .m{display:flex;flex-direction:column;min-width:0}.hm-a small{display:block;margin-top:2px}
.hm-m{color:var(--muted)}
.hm-me{display:flex;flex-wrap:wrap;align-items:center;gap:14px;justify-content:space-between}
.hm-me .who{min-width:0;flex:1 1 240px}.hm-me .who b{font-size:1.1rem}.hm-me .who p{color:var(--muted);font-size:.85rem;margin-top:2px}
.hm-links{display:flex;flex-wrap:wrap;gap:8px}
.hm-lk{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1px solid var(--line);background:#0a1226;color:var(--text);text-decoration:none;font-size:.9rem;font-weight:600}
.hm-lk:hover{background:#14264d}.hm-lk:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
.hm-lk.pri{border-color:var(--cyan);background:#10285a}.hm-lk svg{width:18px;height:18px;fill:currentColor;flex:none}
.hm-cr{margin-top:14px;border-top:1px solid var(--line);padding-top:10px}
.hm-cr summary{cursor:pointer;color:var(--cyan);font-size:.88rem}.hm-cr p{color:var(--muted);font-size:.82rem;margin:8px 0}
.hm-cr ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px}.hm-cr li{padding:0;border:0}
.hm-cr a{display:inline-block;padding:3px 10px;border-radius:999px;border:1px solid var(--line);color:var(--muted);font-size:.78rem;text-decoration:none}.hm-cr a:hover{color:var(--text);border-color:var(--cyan)}
.logo{cursor:pointer;border-radius:12px;transition:filter .2s}
.logo:hover,.logo.on{filter:drop-shadow(0 0 8px rgba(59,232,255,.55))}
.logo:focus-visible{outline:2px solid var(--cyan);outline-offset:4px}`;
document.head.appendChild(st);

// ---------- DOM: nav tab + section ----------
const sec=document.createElement("section");sec.id="home";sec.innerHTML=`<div class="hm" id="hbox"></div>`;
$("main").appendChild(sec);
const box=$("#hbox");
// the logo in the header is the Home button
const logo=$("header .logo");
logo.setAttribute("role","button");logo.tabIndex=0;
const label=()=>{const t=h("logo");logo.setAttribute("aria-label",t);logo.title=t};label();
logo.onclick=()=>go("home");
logo.addEventListener("keydown",e=>{if(e.key=="Enter"||e.key==" "){e.preventDefault();go("home")}});
const isOn=()=>sec.classList.contains("on");

// ---------- data: live flights (same hook style as panel.js) ----------
let fl=[],tm;
const _plane=plane;
plane=function(f){
  _plane(f);
  const ls=acLayer.getLayers();
  if(ls.length===1)fl=[];
  fl.push(Object.assign({},f,{marker:ls[ls.length-1]}));
  if(isOn()){clearTimeout(tm);tm=setTimeout(render,80)}
};

// ---------- data: KUL weather (5 min client cache, server also caches) ----------
let wx=null,wxBusy=false;
const wxFresh=()=>wx&&Date.now()-wx.t<(wx.v==="err"?60000:300000);
async function loadWx(){
  if(wxFresh()||wxBusy)return;
  wxBusy=true;let v="err";
  try{const r=await fetch("/api/weather/WMKK");if(r.ok)v=(await r.json()).weather||null}catch(e){}
  wxBusy=false;wx={v,t:Date.now()};
  if(isOn())render();
}

// ---------- data: leaderboard top 3 ----------
let board=null,boardT=0,boardBusy=false;
async function loadBoard3(){
  if(boardBusy||Date.now()-boardT<60000)return;
  boardBusy=true;
  try{const r=await fetch("/api/leaderboard");if(!r.ok)throw 0;board=(await r.json()).slice(0,3)}catch(e){board=null}
  boardBusy=false;boardT=Date.now();
  if(isOn())render();
}

// ---------- remember the last quiz (the app only kept it in memory) ----------
const _fin=finish;
finish=function(){
  _fin();
  try{
    const n=Q.list.length,ok=n-Q.missed.length;
    ls.set("kl-last",{s:Q.score,ok,n,d:Date.now()});
    if(Q.score>ls.get("kl-best",0))ls.set("kl-best",Q.score);
  }catch(e){}
};

// ---------- helpers ----------
function age(t){
  if(t==null)return "";
  const m=Math.max(0,Math.round((Date.now()/1000-t)/60));
  return m<90?`${m} ${h("min")} ${h("ago")}`:`${Math.round(m/60)} ${h("hr")} ${h("ago")}`;
}
function windTxt(m){
  const s=num(m.wspd);if(s==null)return "—";
  if(s===0)return h("calm");
  const d=num(m.wdir)==null?h("vrb"):`${String(Math.round(num(m.wdir))).padStart(3,"0")}°`;
  return `${d} · ${Math.round(s*1.852)} ${h("kmh")} (${Math.round(s)} kt)`;
}
function visTxt(m){
  const sm=num(m.visib);if(sm==null)return "—";
  const k=sm*1.609;
  return `${String(m.visib).includes("+")?"≥ ":""}${k>=10?Math.round(k):k.toFixed(1)} km`;
}
function busiest(){                       // airport with the most aircraft nearest to it (within 100 km)
  if(flightSrc!="live"||!fl.length)return null;
  const c={};
  fl.forEach(f=>{
    let best=null,d=1e9;
    AIRPORTS.forEach(a=>{const x=km(f.lat,f.lng,a.lat,a.lng);if(x<d){d=x;best=a}});
    if(best&&d<=100)c[best.iata]=(c[best.iata]||0)+1;
  });
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];
  return top?{a:AIRPORTS.find(z=>z.iata==top[0]),n:top[1]}:null;
}
const course=()=>ls.get("kl-course",{});
const nextUnit=()=>{const p=course();const i=KL_UNITS.findIndex(u=>(p[u.id]||0)<2);return i<0?null:{u:KL_UNITS[i],i}};

// ---------- render ----------
function liveCard(){
  const n=fl.length,live=flightSrc=="live";
  const by={};fl.forEach(f=>{const k=AL[pre(f)]?pre(f):"_";by[k]=(by[k]||0)+1});
  const rows=Object.entries(by).sort((a,b)=>(a[0]=="_")-(b[0]=="_")||b[1]-a[1]).slice(0,6);
  const mx=Math.max(1,...rows.map(r=>r[1]));
  const hi=fl.filter(f=>f.alt!=null).sort((a,b)=>b.alt-a.alt)[0],fa=fl.filter(f=>f.vel!=null).sort((a,b)=>b.vel-a.vel)[0];
  const row=(lbl,f,val)=>f?`<button class="hm-row" data-a="fk" data-k="${esc(key(f))}"><span class="l">${lbl}</span><b>${esc(f.cs||"—")}</b><span class="v">${val}</span></button>`:"";
  return `<div class="card hm-live"><h2 class="hm-h"><span>✈ ${h("live")}</span><span class="hm-tag${live?" on":""}">${live?"● Live":"○ "+h("sample")}</span></h2>
  ${n?`<div class="hm-big">${n}<small>${h("planes")}</small></div>
  <div class="hm-sub">${h("byAir")}</div><div class="hm-bars">${rows.map(([k,c])=>`<div class="hm-bar"><span>${esc(k=="_"?h("other"):AL[k])}</span><i style="width:${Math.max(3,c/mx*100)}%;background:${(typeof COLORS!="undefined"&&COLORS[k])||"#8da2c7"}"></i><b>${c}</b></div>`).join("")}</div>
  ${hi||fa?`<div class="hm-rows">${row(h("highest"),hi,hi?Math.round(hi.alt*3.281).toLocaleString("en")+" ft":"")}${row(h("fastest"),fa,fa?Math.round(fa.vel*3.6)+" "+h("kmh"):"")}</div><p class="hm-note">${h("tap")}</p>`:""}`
  :`<p class="hm-m">${h("nodata")}</p>`}</div>`;
}
function wxCard(){
  let body;
  if(!wxFresh()||!wx)body=`<p class="hm-m">${h("load")}</p>`;
  else if(wx.v==="err")body=`<p class="hm-m">${h("wxErr")}</p>`;
  else if(wx.v===null)body=`<p class="hm-m">${h("wxNone")}</p>`;
  else{
    const m=wx.v;
    body=`${H.en[m.cat]?`<span class="hm-cat hm-${esc(m.cat)}">${esc(h(m.cat))}</span>`:""}
    <div class="hm-big" style="margin-top:12px">${m.temp!=null?Math.round(m.temp):"—"}<small>°C</small></div>
    <dl class="hm-wx"><dt>${h("wind")}</dt><dd>${esc(windTxt(m))}</dd><dt>${h("vis")}</dt><dd>${esc(visTxt(m))}</dd>${m.observed!=null?`<dt>${h("obs")}</dt><dd>${esc(age(m.observed))}</dd>`:""}</dl>
    <p class="hm-note">${h("src")}</p>`;
  }
  return `<div class="card hm-wxc"><h2 class="hm-h"><span>☁ ${h("wx")}</span><span class="hm-tag">WMKK</span></h2>${body}<p style="margin-top:10px"><button class="hm-link" data-a="kul">${h("onmap")} →</button></p></div>`;
}
function progCard(){
  const kn=ls.get("kl-known",{}),nk=AIRPORTS.filter(a=>kn[a.iata]===1).length,nt=AIRPORTS.length;
  const p=course(),nu=KL_UNITS.filter(u=>(p[u.id]||0)>=2).length,tu=KL_UNITS.length;
  const last=ls.get("kl-last",null),best=ls.get("kl-best",0);
  let rank=`<div class="hm-rank"><span class="ic">🧳</span><div><div class="hm-m" style="font-size:.8rem">${h("rank")}</div><span class="hm-m">${h("noRank")}</span></div></div>`;
  if(last&&last.n){
    const pc=last.ok/last.n,k=pc>=.9?4:pc>=.7?3:pc>=.4?2:1;
    rank=`<div class="hm-rank"><span class="ic">${RANK_ICON[k]}</span><div><div class="hm-m" style="font-size:.8rem">${h("rank")}</div><b>${h("r"+k)}</b></div></div>`;
  }
  const bar=(t,a,b)=>`<div class="hm-stat"><div class="t"><span>${t}</span><b>${a}/${b}</b></div><div class="bar"><i style="width:${a/b*100}%"></i></div></div>`;
  const nm=ls.get("kl-name","");
  return `<div class="card hm-pg"><h2 class="hm-h"><span>🏆 ${h("prog")}</span></h2>${rank}
  ${bar(h("apKnown"),nk,nt)}${bar(h("units"),nu,tu)}
  <div class="hm-kv" style="margin-top:14px"><span>${h("last")}</span><b>${last&&last.n?`${last.s} ${h("pts")} · ${last.ok}/${last.n} ${h("correct")}`:h("noQuiz")}</b></div>
  ${best?`<div class="hm-kv"><span>${h("best")}</span><b>${best} ${h("pts")}</b></div>`:""}
  ${board&&board.length?`<div class="hm-sub" style="margin-top:14px">${h("top3")}</div><ul class="hm-top3">${board.map((e,i)=>`<li><span>${MEDAL[i]} ${esc(e.name)}${nm&&e.name==nm?" ⭐":""}</span><b>${esc(e.score)}</b></li>`).join("")}</ul>`:""}</div>`;
}
function actCard(){
  const nx=nextUnit(),bz=busiest();
  const a=(id,ic,t,s,pri)=>`<button class="hm-a${pri?" pri":""}" data-a="${id}"><span class="ic">${ic}</span><span class="m"><b>${esc(t)}</b><small>${esc(s)}</small></span></button>`;
  return `<div class="card full"><h2 class="hm-h"><span>⚡ ${h("qa")}</span></h2><div class="hm-act">
  ${nx?a("cont","📚",h("cont")(nx.i+1),L1(nx.u.t),true):a("cards","🗂️",h("contAll"),`${AIRPORTS.length} ${lang=="ms"?"lapangan terbang":"airports"}`,true)}
  ${a("quiz","🎯",h("qz"),h("qzSub"))}
  ${bz?a("busy","🔥",h("busy"),h("busySub")(bz.a.iata+" · "+bz.a.city,bz.n)):""}</div></div>`;
}
const GH=`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const LI=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>`;
const ext=(u,cls,inner)=>`<a class="${cls}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
let crOpen=false;
box.addEventListener("toggle",e=>{if(e.target.classList&&e.target.classList.contains("hm-cr"))crOpen=e.target.open},true);
function aboutCard(){
  const links=[ME.github&&ext(ME.github,"hm-lk",`${GH}<span>${h("ghBtn")} · ${esc(ME.githubLabel)}</span>`),
    ME.linkedin&&ext(ME.linkedin,"hm-lk",`${LI}<span>${h("liBtn")} · ${esc(ME.linkedinLabel)}</span>`),
    ME.repo&&ext(ME.repo,"hm-lk pri",`<span>${h("star")}</span>`)].filter(Boolean).join("");
  return `<div class="card hm-about"><h2 class="hm-h"><span>💙 ${h("about")}</span></h2>
  <div class="hm-me"><div class="who"><div class="hm-m" style="font-size:.8rem">${h("madeBy")}</div><b>${esc(ME.name)}</b><p>${esc(ME.role[lang])}</p></div><div class="hm-links">${links}</div></div>
  <details class="hm-cr"${crOpen?" open":""}><summary>${h("credits")}</summary><p>${h("creditsTxt")}</p><ul>${CREDITS.map(c=>`<li>${ext(c[1],"",esc(c[0]))}</li>`).join("")}</ul></details></div>`;
}
const L1=x=>Array.isArray(x)?x[lang=="ms"?0:1]:x;
function render(){
  const nm=ls.get("kl-name","");
  box.innerHTML=`<div class="full hm-top"><h1>${esc(nm?h("hi")(nm):h("welcome"))} 👋</h1><p>${h("sub")}</p></div>
  ${actCard()}${liveCard()}${wxCard()}${progCard()}${aboutCard()}`;
}

// ---------- actions ----------
function dropHero(){const e=document.querySelector(".hero");if(e){e.remove();try{sessionStorage.setItem("kl-hero","1")}catch(x){}}}
function openFlight(k){
  const f=fl.find(x=>key(x)==k);if(!f)return;
  dropHero();go("map");
  setTimeout(()=>{if(f.marker)f.marker.fire("click")},80);    // panel.js: clicking a plane opens its detail card
}
function openAirport(iata){
  const i=AIRPORTS.findIndex(a=>a.iata==iata),m=apLayer.getLayers()[i];if(!m)return;
  dropHero();go("map");
  if(!map.hasLayer(apLayer))map.addLayer(apLayer);
  map.flyTo(m.getLatLng(),9,{duration:.8});map.once("moveend",()=>m.openPopup());
}
function quizAirport(a){                                       // same as the "Test me" button in the airport popup
  Q={pool:AIRPORTS,list:[a,...shuffle(AIRPORTS.filter(z=>z!==a)).slice(0,9)],i:0,score:0,streak:0,missed:[],opts:null,finished:false};
  go("quiz");ask();
}
function openLearn(view,unitId){                               // drives the Learn tab's own buttons (its state is private to kuiz.js)
  go("learn");
  const q=s=>document.querySelector("#lbox "+s);
  if(view=="cards"){const b=q('.ltabs [data-v="cards"]');if(b)b.click();return}
  let b=q(`[data-nav="${unitId}"]`);
  if(!b){const back=q('.ltabs [data-v="path"]')||q('[data-nav="path"]');if(back)back.click();b=q(`[data-nav="${unitId}"]`)}
  if(b)b.click();
}
box.addEventListener("click",e=>{
  const b=e.target.closest("[data-a]");if(!b)return;
  const a=b.dataset.a;
  if(a=="fk")openFlight(b.dataset.k);
  else if(a=="kul")openAirport("KUL");
  else if(a=="quiz")go("quiz");
  else if(a=="busy"){const z=busiest();if(z)quizAirport(z.a)}
  else if(a=="cont"){const n=nextUnit();if(n)openLearn("unit",n.u.id)}
  else if(a=="cards")openLearn("cards");
});

// ---------- hooks into the existing app ----------
const _go=go;
go=function(tab){
  _go(tab);
  logo.classList.toggle("on",tab=="home");
  if(tab=="home"){render();loadWx();loadBoard3()}
};
const _al=applyLang;
applyLang=function(){_al();label();if(isOn())render()};
render();
})();
