// KenalLangit trip.js: "Jejak" tab. Airports you have been to, a log of flights you have taken, and badges worked out from both.
// Data lives in two localStorage keys that sync.js mirrors to the cloud:
//   kl-visited = { IATA: 1 }                                  airports marked "pernah sampai"
//   kl-flights = [{ id, al, ac, f, t, d }]                    airline, aircraft type, from, to ("INT" = overseas), date "YYYY-MM-DD" or null
// Stats and badges are derived on every draw, never stored. Load AFTER home.js and BEFORE sync.js.
(()=>{
const KV="kl-visited",KF="kl-flights",MAXF=300;
const TT={
ms:{tab:"Jejak",title:"Jejak penerbangan awak",sub:"Tanda lapangan terbang yang pernah awak jejak dan catat penerbangan yang pernah awak naiki.",
  sFl:"Penerbangan",sAp:"Lapangan terbang",sAl:"Syarikat",sAc:"Jenis pesawat",sKm:"Jarak terbang",sBd:"Lencana",
  badges:"Lencana",apT:"Lapangan terbang pernah sampai",apHint:"Ketik untuk tanda atau buang. Penanda di peta bertukar hijau.",
  addT:"Tambah penerbangan",al:"Syarikat penerbangan",alPh:"cth. AirAsia",ac:"Jenis pesawat (pilihan)",acPh:"cth. A320, kosong jika tak pasti",from:"Dari",to:"Ke",date:"Tarikh (pilihan)",pick:"Pilih...",intl:"Luar negara",add:"Tambah",
  addHint:"Lapangan terbang Malaysia dalam laluan akan ditanda pernah sampai. Penerbangan luar negara dicatat sebagai “Luar negara”, dan jaraknya tidak dikira.",
  eAl:"Isi syarikat penerbangan.",eAc:"Jenis pesawat: 2 hingga 8 huruf atau nombor (cth A320), atau kosongkan jika tak pasti.",eRt:"Pilih tempat berlepas dan tiba yang berbeza.",eBoth:"Sekurang-kurangnya satu hujung laluan mesti lapangan terbang Malaysia.",eDate:"Tarikh tidak sah atau di masa depan.",eMax:"Had 300 penerbangan sudah dicapai.",ok:"Ditambah!",
  logT:"Log penerbangan",logEmpty:"Belum ada penerbangan. Tambah yang pertama di atas.",del:"Buang",delAsk:"Buang penerbangan ini daripada log?",
  coll:"Koleksi",collAl:"Syarikat yang pernah dinaiki",collAc:"Jenis pesawat yang pernah dinaiki",none:"Belum ada.",
  note:"Data ini dilaporkan sendiri dan tidak disahkan, jadi ia tidak masuk papan markah.",
  vis:"📍 Pernah sampai",visOn:"✓ Pernah sampai",visOff:"Ketik untuk buang",km:"km",locale:"ms-MY",
  visLock:"🔒 Pernah sampai · log masuk",gateT:"Log masuk untuk guna Jejak",gateB:"Lapangan terbang dan log penerbangan disimpan dalam akaun Google awak supaya kekal dan boleh dibuka di peranti lain.",gateGo:"Log masuk dengan Google",gateNo:"Log masuk tidak tersedia sekarang. Cuba muat semula halaman.",
  eLogin:"Log masuk dengan Google dahulu.",eDup:"Penerbangan ini sudah ada dalam log.",
  rideBtn:"🎫 Pernah naik",rideLock:"🔒 Pernah naik · log masuk",rideDone:"✓ Dalam log penerbangan",rideT:"Catat penerbangan ini",rideDate:"Tarikh dicatat: hari ini. Semak syarikat, jenis pesawat dan laluan sebelum simpan.",save:"Simpan",cancel:"Batal"},
en:{tab:"Trips",title:"Your flight tracker",sub:"Mark the airports you have been to and log the flights you have taken.",
  sFl:"Flights",sAp:"Airports",sAl:"Airlines",sAc:"Aircraft types",sKm:"Distance flown",sBd:"Badges",
  badges:"Badges",apT:"Airports visited",apHint:"Tap to mark or unmark. The marker on the map turns green.",
  addT:"Add a flight",al:"Airline",alPh:"e.g. AirAsia",ac:"Aircraft type (optional)",acPh:"e.g. A320, blank if unsure",from:"From",to:"To",date:"Date (optional)",pick:"Select...",intl:"Overseas",add:"Add",
  addHint:"Malaysian airports on the route are marked as visited. Overseas flights are logged as “Overseas”, and their distance is not counted.",
  eAl:"Enter the airline.",eAc:"Aircraft type: 2 to 8 letters or numbers (e.g. A320), or leave it blank if unsure.",eRt:"Choose different departure and arrival places.",eBoth:"At least one end of the route must be a Malaysian airport.",eDate:"Invalid date, or a date in the future.",eMax:"You have reached the 300-flight limit.",ok:"Added!",
  logT:"Flight log",logEmpty:"No flights yet. Add your first one above.",del:"Remove",delAsk:"Remove this flight from your log?",
  coll:"Collection",collAl:"Airlines flown",collAc:"Aircraft types flown",none:"None yet.",
  note:"This data is self-reported and not verified, so it stays off the leaderboard.",
  vis:"📍 Been here",visOn:"✓ Been here",visOff:"Tap to undo",km:"km",locale:"en-GB",
  visLock:"🔒 Been here · sign in",gateT:"Sign in to use Trips",gateB:"Your visited airports and flight log are saved to your Google account, so they stay safe and open on other devices.",gateGo:"Sign in with Google",gateNo:"Sign-in is not available right now. Please reload the page.",
  eLogin:"Sign in with Google first.",eDup:"This flight is already in your log.",
  rideBtn:"🎫 I've flown this",rideLock:"🔒 I've flown this · sign in",rideDone:"✓ In your flight log",rideT:"Log this flight",rideDate:"Logged for today. Check the airline, aircraft type and route before saving.",save:"Save",cancel:"Cancel"}
};
const tr=k=>TT[lang][k];
const L2=a=>a[lang=="ms"?0:1];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const AP=Object.fromEntries(AIRPORTS.map(a=>[a.iata,a]));

// [name, ...aliases (IATA/ICAO codes)] so "ak", "AXM" and "airasia" all count as one airline
const AIRLINES=[["Malaysia Airlines","MH","MAS"],["AirAsia","AK","AXM"],["AirAsia X","D7","XAX"],["Firefly","FY","FFM"],["Batik Air Malaysia","OD","MXD"],["MASwings","MWG"],["Scoot","TR","TGW"],["Singapore Airlines","SQ","SIA"],["Thai AirAsia","FD","AIQ"]];
const TYPES={A320:"Airbus A320",A20N:"Airbus A320neo",A321:"Airbus A321",A21N:"Airbus A321neo",A330:"Airbus A330",A333:"Airbus A330-300",A339:"Airbus A330-900",A350:"Airbus A350",A359:"Airbus A350-900",A380:"Airbus A380",
  B737:"Boeing 737",B738:"Boeing 737-800",B38M:"Boeing 737 MAX 8",B777:"Boeing 777",B77W:"Boeing 777-300ER",B787:"Boeing 787",B789:"Boeing 787-9",AT72:"ATR 72-500",AT76:"ATR 72-600",DH8D:"Dash 8 Q400",DHC6:"DHC-6 Twin Otter"};

// ---------- data ----------
const gOK=()=>{try{return !!(window.KLSync&&KLSync.state().google)}catch(e){return false}};   // Trips data is only for signed-in Google accounts
const needLogin=()=>{try{return !!(window.KLSync&&KLSync.prompt&&KLSync.prompt())}catch(e){return false}};
const visited=()=>{if(!gOK())return {};const v=ls.get(KV,{});return v&&typeof v=="object"&&!Array.isArray(v)?v:{}};
const flights=()=>{if(!gOK())return [];const f=ls.get(KF,[]);return Array.isArray(f)?f.filter(x=>x&&typeof x=="object"):[]};
const hav=(a,b)=>{const r=Math.PI/180,p=(b.lat-a.lat)*r,q=(b.lng-a.lng)*r,x=Math.sin(p/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(q/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const dist=x=>AP[x.f]&&AP[x.t]?hav(AP[x.f],AP[x.t]):0;           // overseas legs have no coordinates: not counted
const canonAirline=raw=>{
  const s=String(raw||"").replace(/[<>]/g,"").replace(/\s+/g," ").trim().slice(0,30),l=s.toLowerCase();
  const hit=AIRLINES.find(a=>a[0].toLowerCase()==l||a.slice(1).includes(s.toUpperCase()));
  return hit?hit[0]:s;
};
const normType=raw=>String(raw||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtDate=d=>{try{return new Date(d+"T00:00:00").toLocaleDateString(tr("locale"),{day:"numeric",month:"short",year:"numeric"})}catch(e){return d}};
const place=c=>c=="INT"?tr("intl"):c;

function stats(){
  const v=visited(),fl=flights(),reg={};
  AIRPORTS.forEach(a=>{const r=REG(a);reg[r]=reg[r]||{n:0,t:0};reg[r].t++;if(v[a.iata])reg[r].n++});
  const al={},ac={};let km=0;
  fl.forEach(x=>{const k=String(x.al||"").toLowerCase();al[k]=al[k]||{name:x.al,n:0};al[k].n++;if(x.ac)ac[x.ac]=(ac[x.ac]||0)+1;km+=dist(x)});
  return {fl:fl.length,ap:AIRPORTS.filter(a=>v[a.iata]).length,reg,al,ac,km:Math.round(km)};
}

// ---------- badges: [id, icon, name, how to earn, progress(stats) -> [now, target]] ----------
const BADGES=[
 ["ap1","📍",["Pendaratan Pertama","First Landing"],["Tanda 1 lapangan terbang","Mark 1 airport"],s=>[s.ap,1]],
 ["sem","🏞️",["Semua Semenanjung","All Peninsular"],["Tanda semua lapangan terbang Semenanjung","Mark every Peninsular airport"],s=>[s.reg.Semenanjung.n,s.reg.Semenanjung.t]],
 ["sab","🌋",["Semua Sabah","All Sabah"],["Tanda semua lapangan terbang Sabah","Mark every Sabah airport"],s=>[s.reg.Sabah.n,s.reg.Sabah.t]],
 ["sar","🦜",["Penjelajah Sarawak","Sarawak Explorer"],["Tanda semua lapangan terbang Sarawak","Mark every Sarawak airport"],s=>[s.reg.Sarawak.n,s.reg.Sarawak.t]],
 ["all","🇲🇾",["Jelajah Malaysia","Malaysia Complete"],["Tanda semua lapangan terbang","Mark every airport"],s=>[s.ap,AIRPORTS.length]],
 ["f1","🎫",["Penerbangan Pertama","First Flight"],["Catat 1 penerbangan","Log 1 flight"],s=>[s.fl,1]],
 ["f10","🛫",["Kerap Terbang","Frequent Flyer"],["Catat 10 penerbangan","Log 10 flights"],s=>[s.fl,10]],
 ["f50","🏅",["Veteran Langit","Sky Veteran"],["Catat 50 penerbangan","Log 50 flights"],s=>[s.fl,50]],
 ["al3","🏢",["Pelbagai Syarikat","Many Airlines"],["Naiki 3 syarikat berbeza","Fly 3 different airlines"],s=>[Object.keys(s.al).length,3]],
 ["ac5","🛩️",["Koleksi Pesawat","Plane Collector"],["Naiki 5 jenis pesawat berbeza","Fly 5 different aircraft types"],s=>[Object.keys(s.ac).length,5]],
 ["km10","🌏",["10,000 km","10,000 km"],["Terbang 10,000 km","Fly 10,000 km"],s=>[s.km,10000]],
 ["km40","🌍",["Mengelilingi Bumi","Around the World"],["Terbang 40,075 km, seliling Bumi","Fly 40,075 km, once around the Earth"],s=>[s.km,40075]]
];
const earned=s=>BADGES.filter(b=>{const p=b[4](s);return p[0]>=p[1]});

// ---------- styles ----------
const st=document.createElement("style");
st.textContent=`
.tr{max-width:760px;display:grid;gap:14px}
.tr h1{font-size:1.5rem;line-height:1.2}.tr .sub{color:var(--muted);margin-top:4px}
.tr .card{padding:16px}
.tr-h{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 12px;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.tr-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px}
.tr-stat{background:#0a1226;border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.tr-stat b{display:block;font-size:1.5rem;line-height:1.1;color:var(--cyan);font-variant-numeric:tabular-nums}.tr-stat span{font-size:.78rem;color:var(--muted)}
.tr-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.tr-b{display:flex;gap:10px;align-items:center;padding:10px;border-radius:12px;border:1px solid var(--line);background:#0a1226;opacity:.62}
.tr-b .ic{font-size:1.6rem;filter:grayscale(1)}.tr-b .m{min-width:0;display:flex;flex-direction:column}.tr-b b{font-size:.88rem}.tr-b small{font-size:.74rem;line-height:1.3}
.tr-b.on{opacity:1;border-color:var(--yellow);background:#1a2140;box-shadow:0 0 14px rgba(255,201,51,.18)}.tr-b.on .ic{filter:none}
.tr-b .bar{height:4px;margin:5px 0 0}
.tr-reg{display:flex;justify-content:space-between;margin:14px 0 8px;color:var(--yellow);font-weight:700}.tr-reg small{font-weight:400}
.tr-aps{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px}
.tr-ap{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:1px;text-align:left;padding:10px;border:2px solid var(--line);background:#0a1226}
.tr-ap b{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;letter-spacing:2px;color:var(--cyan);font-size:1.1rem}
.tr-ap small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr-ap i{position:absolute;right:8px;top:8px;font-style:normal;color:var(--green);opacity:0}
.tr-ap.on{border-color:var(--green);background:#0c2a22}.tr-ap.on i{opacity:1}
.tr-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tr-form label{display:flex;flex-direction:column;gap:4px;font-size:.85rem;color:var(--muted);min-width:0}.tr-form .w{grid-column:1/-1}
.tr-form input,.tr-form select{margin:0;font:inherit;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--navy);color:var(--text);width:100%;min-width:0}
.tr-form input:focus-visible,.tr-form select:focus-visible{outline:2px solid var(--cyan)}
.tr-form .cta{margin:0;grid-column:1/-1}
.tr-msg{min-height:1.3em;font-size:.88rem;grid-column:1/-1}.tr-msg.err{color:#ff8a93}.tr-msg.ok{color:var(--green)}
.tr-note{color:var(--muted);font-size:.78rem;margin-top:10px;line-height:1.4}
.tr-log{list-style:none;padding:0}
.tr-log li{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}.tr-log li:last-child{border-bottom:0}
.tr-log .m{flex:1;min-width:0;display:flex;flex-direction:column}.tr-log .tr-rt{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;color:var(--cyan)}
.tr-log .x{padding:6px 10px;background:none;color:var(--muted)}.tr-log .x:hover{color:#ff8a93;background:#14264d}
.tr-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.tr-chip{padding:4px 11px;border-radius:999px;border:1px solid var(--line);background:#0a1226;font-size:.84rem}.tr-chip b{color:var(--cyan);margin-left:4px}
.popbtn.visbtn{background:#14264d;border:1px solid var(--line)}.popbtn.visbtn.on{background:var(--green);color:#03150e;border-color:var(--green)}
.rd{margin:10px 0}.popbtn.rd-b{margin:0;background:#14264d;border:1px solid var(--line)}.popbtn.rd-b.on{background:var(--green);color:#03150e;border-color:var(--green);cursor:default}
.rd-form{padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(20,38,77,.6)}.rd-form .tr-h{margin:0}.rd-form .tr-msg{min-height:0}
.ap.vis{background:var(--green);border-color:#fff;box-shadow:0 0 12px var(--green)}
@media (max-width:420px){.tr-form{grid-template-columns:minmax(0,1fr)}.tr-form .w{grid-column:auto}}
@media (max-width:400px){nav button{padding:8px 2px}nav button b{font-size:.6rem;white-space:normal;text-align:center;line-height:1.15}}   /* six tabs: keep the bottom bar inside the screen */
@media (max-width:340px){nav button b{font-size:.54rem}}
`;
document.head.appendChild(st);

// ---------- tab: nav button + section ----------
const sec=document.createElement("section");sec.id="trip";
sec.innerHTML=`<div class="panel tr" id="tbox"><div id="t-top"></div><div id="t-ap"></div><div id="t-add"></div><div id="t-log"></div></div>`;
$("main").appendChild(sec);
const nb=document.createElement("button");nb.dataset.tab="trip";nb.innerHTML=`<span>🧳</span><b></b>`;
$("nav").insertBefore(nb,$('nav [data-tab="video"]')||$('nav [data-tab="board"]'));
nb.onclick=()=>go("trip");
const isOn=()=>sec.classList.contains("on");
const draft={al:"",ac:"",f:"",t:"",d:""};
let msg=null;                                   // {k, t}: feedback under the form

function drawTop(){
  const s=stats(),e=earned(s);
  const tile=(v,l)=>`<div class="tr-stat"><b>${v}</b><span>${l}</span></div>`;
  $("#t-top").innerHTML=`<div><h1>🧳 ${tr("title")}</h1><p class="sub">${tr("sub")}</p></div>
  <div class="card" style="margin-top:14px"><div class="tr-stats">${tile(s.fl,tr("sFl"))}${tile(`${s.ap}/${AIRPORTS.length}`,tr("sAp"))}${tile(Object.keys(s.al).length,tr("sAl"))}${tile(Object.keys(s.ac).length,tr("sAc"))}${tile(s.km.toLocaleString("en")+" "+tr("km"),tr("sKm"))}${tile(`${e.length}/${BADGES.length}`,tr("sBd"))}</div></div>
  <div class="card" style="margin-top:14px"><h2 class="tr-h"><span>🏅 ${tr("badges")}</span></h2><div class="tr-badges">${BADGES.map(b=>{
    const p=b[4](s),on=p[0]>=p[1];
    return `<div class="tr-b${on?" on":""}"><span class="ic">${b[1]}</span><span class="m"><b>${esc(L2(b[2]))}</b><small>${esc(L2(b[3]))}</small>${on?"":`<span class="bar"><i style="width:${Math.min(100,p[0]/p[1]*100)}%"></i></span>`}</span></div>`}).join("")}</div></div>`;
}
function drawAirports(){
  const v=visited(),s=stats();
  let h=`<div class="card"><h2 class="tr-h"><span>📍 ${tr("apT")}</span><span>${s.ap}/${AIRPORTS.length}</span></h2><p class="tr-note" style="margin:-4px 0 0">${tr("apHint")}</p>`;
  ["Semenanjung","Sabah","Sarawak"].forEach(r=>{
    h+=`<div class="tr-reg"><span>${t(r)}</span><small>${s.reg[r].n}/${s.reg[r].t}</small></div><div class="tr-aps">`;
    AIRPORTS.filter(a=>REG(a)==r).forEach(a=>{
      const on=!!v[a.iata];
      h+=`<button type="button" class="tr-ap${on?" on":""}" data-ap="${a.iata}" aria-pressed="${on}"><i aria-hidden="true">✓</i><b>${a.iata}</b><small>${esc(a.city)}</small></button>`;
    });
    h+=`</div>`;
  });
  $("#t-ap").innerHTML=h+`</div>`;
}
const opt=(val,txt,cur)=>`<option value="${esc(val)}"${val==cur?" selected":""}>${esc(txt)}</option>`;
const routes=cur=>`<option value="">${tr("pick")}</option>`+AIRPORTS.map(a=>opt(a.iata,`${a.iata} · ${a.city}`,cur)).join("")+opt("INT",tr("intl"),cur);
const alList=id=>`<datalist id="${id}">${AIRLINES.map(a=>`<option value="${esc(a[0])}">`).join("")}</datalist>`;
const acList=id=>`<datalist id="${id}">${Object.entries(TYPES).map(([k,n])=>`<option value="${k}" label="${esc(n)}">`).join("")}</datalist>`;
function drawForm(){                              // built once per language so typing is never wiped by a redraw
  if(!gOK()){$("#t-add").innerHTML="";return}
  $("#t-add").innerHTML=`<div class="card"><h2 class="tr-h"><span>🛫 ${tr("addT")}</span></h2>
  <form class="tr-form" id="t-form" novalidate>
    <label>${tr("al")}<input name="al" list="t-al-l" maxlength="30" autocomplete="off" placeholder="${esc(tr("alPh"))}" value="${esc(draft.al)}"></label>
    <label>${tr("ac")}<input name="ac" list="t-ac-l" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="${esc(tr("acPh"))}" value="${esc(draft.ac)}"></label>
    <label>${tr("from")}<select name="f">${routes(draft.f)}</select></label>
    <label>${tr("to")}<select name="t">${routes(draft.t)}</select></label>
    <label class="w">${tr("date")}<input name="d" type="date" max="${today()}" value="${esc(draft.d)}"></label>
    ${alList("t-al-l")}${acList("t-ac-l")}
    <button class="cta" type="submit">${tr("add")}</button>
    <p class="tr-msg${msg?" "+msg.k:""}" id="t-msg" role="status">${msg?esc(msg.t):""}</p>
  </form><p class="tr-note" style="margin-top:0">${tr("addHint")}</p></div>`;
}
function drawLog(){
  const fl=flights(),s=stats();
  const rows=fl.map((x,i)=>[x,i]).sort((a,b)=>(b[0].d||"").localeCompare(a[0].d||"")||b[1]-a[1]);
  const info=x=>[x.d&&fmtDate(x.d),Math.round(dist(x))&&`${Math.round(dist(x)).toLocaleString("en")} ${tr("km")}`].filter(Boolean).join(" · ");
  const chips=(o,fmt)=>Object.keys(o).length?`<div class="tr-chips">${Object.values(o).map(fmt).join("")}</div>`:`<p class="tr-note" style="margin:0 0 12px">${tr("none")}</p>`;
  $("#t-log").innerHTML=`<div class="card"><h2 class="tr-h"><span>📒 ${tr("logT")}</span><span>${fl.length}</span></h2>
  ${rows.length?`<ul class="tr-log">${rows.map(([x])=>`<li><span class="m"><b>${esc(x.al)}${x.ac?" · "+esc(TYPES[x.ac]||x.ac):""}</b><span class="tr-rt">${esc(place(x.f))} → ${esc(place(x.t))}</span><small>${esc(info(x))}</small></span><button type="button" class="x" data-del="${esc(x.id)}" aria-label="${esc(tr("del"))}" title="${esc(tr("del"))}">✕</button></li>`).join("")}</ul>`:`<p class="hm-m" style="color:var(--muted)">${tr("logEmpty")}</p>`}</div>
  <div class="card" style="margin-top:14px"><h2 class="tr-h"><span>🧩 ${tr("coll")}</span></h2>
  <div class="lbl" style="margin-top:0">${tr("collAl")}</div>${chips(s.al,a=>`<span class="tr-chip">${esc(a.name)}<b>${a.n}</b></span>`)}
  <div class="lbl" style="margin-top:0">${tr("collAc")}</div>${chips(Object.fromEntries(Object.entries(s.ac).map(([k,n])=>[k,{k,n}])),a=>`<span class="tr-chip" title="${esc(TYPES[a.k]||"")}">${esc(a.k)}<b>${a.n}</b></span>`)}
  <p class="tr-note">${tr("note")}</p></div>`;
}
function drawGate(){                              // not signed in with Google: show only the sign-in card
  $("#t-top").innerHTML=`<div><h1>🧳 ${tr("title")}</h1><p class="sub">${tr("sub")}</p></div>`;
  $("#t-ap").innerHTML=`<div class="card"><h2 class="tr-h"><span>🔒 ${tr("gateT")}</span></h2><p class="tr-note" style="margin:0 0 12px">${tr("gateB")}</p><button class="cta" type="button" id="t-login" style="margin:0">${tr("gateGo")}</button><p class="tr-msg" id="t-gmsg" role="status"></p></div>`;
  $("#t-add").innerHTML="";$("#t-log").innerHTML="";
}
const draw=()=>{if(!gOK())return drawGate();drawTop();drawAirports();drawLog()};

// ---------- actions ----------
function paintMarker(code){
  const i=AIRPORTS.findIndex(a=>a.iata==code),m=apLayer.getLayers()[i];if(!m)return;
  const el=m.getElement&&m.getElement(),dot=el&&el.querySelector(".ap");
  if(dot)dot.classList.toggle("vis",!!visited()[code]);
  const pop=m.getPopup&&m.getPopup(),pe=pop&&pop.isOpen()&&pop.getElement(),b=pe&&pe.querySelector(".visbtn");
  if(b)paintBtn(b,code);
}
function paintBtn(b,code){
  const ok=gOK(),on=ok&&!!visited()[code];
  b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);
  b.textContent=!ok?tr("visLock"):on?`${tr("visOn")} · ${tr("visOff")}`:tr("vis");
}
function setVisited(code,on){
  if(!AP[code]||!gOK())return;
  const v={...visited()};
  if(on)v[code]=1;else delete v[code];
  ls.set(KV,v);paintMarker(code);
}
const toggleVisited=code=>setVisited(code,!visited()[code]);

function addFlight(al,ac,from,to,d){              // returns an error key, or null once the flight is added
  if(!gOK())return "eLogin";
  if(!al)return "eAl";
  if(ac&&ac.length<2)return "eAc";
  if(!from||!to)return "eRt";
  if(from=="INT"&&to=="INT")return "eBoth";
  if(from==to)return "eRt";
  if(d&&!(/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(new Date(d+"T00:00:00"))&&d<=today()))return "eDate";
  const fl=flights();
  if(fl.length>=MAXF)return "eMax";
  if(d&&fl.some(x=>x.al==al&&x.ac==ac&&x.f==from&&x.t==to&&x.d==d))return "eDup";
  ls.set(KF,[...fl,{id:newId(),al,ac,f:from,t:to,d:d||null}]);
  [from,to].forEach(c=>{if(c!="INT")setVisited(c,true)});         // you have been to the airports you flew from and to
  return null;
}
function submit(form){
  const f=new FormData(form);
  const k=addFlight(canonAirline(f.get("al")),normType(f.get("ac")),f.get("f")||"",f.get("t")||"",f.get("d")||"");
  if(k){msg={k:"err",t:tr(k)};$("#t-msg").className="tr-msg err";$("#t-msg").textContent=tr(k);return}
  draft.al=draft.ac=draft.f=draft.t=draft.d="";
  msg={k:"ok",t:tr("ok")};
  drawForm();draw();
}
const tbox=$("#tbox");
tbox.addEventListener("click",e=>{
  if(e.target.closest("#t-login")){if(!needLogin()){const m=$("#t-gmsg");if(m){m.className="tr-msg err";m.textContent=tr("gateNo")}}return}
  const a=e.target.closest("[data-ap]"),x=e.target.closest("[data-del]");
  if(a){toggleVisited(a.dataset.ap);draw();const b=tbox.querySelector(`[data-ap="${a.dataset.ap}"]`);if(b)b.focus({preventScroll:true})}
  else if(x&&confirm(tr("delAsk"))){ls.set(KF,flights().filter(f=>f.id!==x.dataset.del));draw()}
});
tbox.addEventListener("submit",e=>{if(e.target.id=="t-form"){e.preventDefault();submit(e.target)}});
tbox.addEventListener("input",e=>{
  const n=e.target.name;if(!(n in draft))return;
  draft[n]=e.target.value;
  if(msg){msg=null;const m=$("#t-msg");if(m){m.className="tr-msg";m.textContent=""}}
});

// ---------- map: green marker + "Pernah sampai" button in each airport popup ----------
const _bm=buildMarkers;
buildMarkers=function(){
  _bm();
  const v=visited();
  apLayer.getLayers().forEach((m,i)=>{
    const a=AIRPORTS[i];
    m.setPopupContent(m.getPopup().getContent()+`<br><button class="popbtn visbtn" type="button" data-v="${a.iata}"></button>`);
    const el=m.getElement&&m.getElement(),dot=el&&el.querySelector(".ap");
    if(dot)dot.classList.toggle("vis",!!v[a.iata]);
    m.on("add",()=>paintMarker(a.iata));         // the map redraws the icon when the Airports layer is switched off and on
  });
};
map.on("popupopen",e=>{
  const b=e.popup.getElement().querySelector(".visbtn");if(!b)return;
  paintBtn(b,b.dataset.v);
  b.onclick=()=>{if(!gOK()){needLogin();return}toggleVisited(b.dataset.v);if(isOn())draw()};
});

// ---------- aircraft card: "Pernah naik" (panel.js builds .kp-detail, route.js adds .rt with the route) ----------
const rd={cs:"",open:false,al:"",ac:"",f:"",t:"",msg:null},rdDone=new Set();
const KPB=document.querySelector(".kp-body");
function cardInfo(card){                         // airline from the callsign prefix, type from panel.js, route from route.js; "" = unknown
  const h=card.querySelector("h3");if(!h)return null;
  const cs=h.textContent.replace("✈","").trim().toUpperCase();if(!/^[A-Z0-9]{2,8}$/.test(cs))return null;
  const pre=cs.slice(0,3),hit=AIRLINES.find(a=>a.slice(1).includes(pre));
  const codes=[...card.querySelectorAll(".rt .rt-ap b")].map(b=>b.textContent.trim().toUpperCase());
  const code=c=>{const a=AIRPORTS.find(x=>x.iata==c||x.icao==c);return a?a.iata:"INT"};
  const ok=codes.length==2&&!codes.includes("?");
  return {cs,al:hit?hit[0]:"",ac:normType(card.dataset.type),f:ok?code(codes[0]):"",t:ok?code(codes[1]):""};
}
const isLogged=i=>rdDone.has(i.cs+today())||!!(i.al&&i.f&&i.t&&flights().some(x=>x.al==i.al&&x.ac==i.ac&&x.f==i.f&&x.t==i.t&&x.d==today()));
function rdHTML(i){
  if(!gOK())return `<button type="button" class="popbtn rd-b" data-rd="go">${tr("rideLock")}</button>`;
  if(!rd.open)return isLogged(i)?`<button type="button" class="popbtn rd-b on" disabled>${tr("rideDone")}</button>`:`<button type="button" class="popbtn rd-b" data-rd="open">${tr("rideBtn")}</button>`;
  return `<form class="tr-form rd-form" novalidate>
    <h2 class="tr-h w"><span>🎫 ${tr("rideT")}</span></h2>
    <label>${tr("al")}<input name="al" list="rd-al-l" maxlength="30" autocomplete="off" value="${esc(rd.al)}"></label>
    <label>${tr("ac")}<input name="ac" list="rd-ac-l" maxlength="8" autocomplete="off" autocapitalize="characters" value="${esc(rd.ac)}"></label>
    <label>${tr("from")}<select name="f">${routes(rd.f)}</select></label>
    <label>${tr("to")}<select name="t">${routes(rd.t)}</select></label>
    ${alList("rd-al-l")}${acList("rd-ac-l")}
    <p class="tr-note w" style="margin:0">${tr("rideDate")}</p>
    <button class="cta" type="submit">${tr("save")}</button>
    <button type="button" class="w" data-rd="cancel">${tr("cancel")}</button>
    <p class="tr-msg${rd.msg?" err":""}" role="status">${rd.msg?esc(rd.msg):""}</p></form>`;
}
function rdPaint(){
  const card=document.querySelector(".kp-detail"),box=card&&card.querySelector(".rd"),i=card&&cardInfo(card);
  if(!box||!i)return;
  const h=rdHTML(i);box.innerHTML=h;box.dataset.h=h;
}
function injectRide(){                           // runs on every panel redraw (flights refresh every few seconds), so the state lives in rd, not in the DOM
  const card=document.querySelector(".kp-detail");if(!card)return;
  const i=cardInfo(card);if(!i)return;
  let box=card.querySelector(".rd");
  if(!box){
    (card.querySelector("small")||card.querySelector("h3")).insertAdjacentHTML("afterend",`<div class="rd"></div>`);
    box=card.querySelector(".rd");
    if(rd.cs!=i.cs){rd.cs=i.cs;rd.open=false;rd.msg=null}
  }else if(rd.open&&box.querySelector("form"))return;          // never rebuild a form somebody is typing in
  const h=rdHTML(i);
  if(box.dataset.h!==h){box.innerHTML=h;box.dataset.h=h}       // route.js fills the route a moment later: refresh the button when it arrives
}
if(KPB){
  new MutationObserver(injectRide).observe(KPB,{childList:true,subtree:true});
  KPB.addEventListener("click",e=>{
    const b=e.target.closest("[data-rd]"),card=b&&b.closest(".kp-detail"),i=card&&cardInfo(card);if(!i)return;
    const k=b.dataset.rd;
    if(k=="go")return void needLogin();
    if(k=="open"){rd.open=true;rd.msg=null;rd.al=i.al;rd.ac=i.ac;rd.f=i.f;rd.t=i.t}
    else if(k=="cancel"){rd.open=false;rd.msg=null}
    rdPaint();
  });
  KPB.addEventListener("input",e=>{
    const n=e.target.name;if(!e.target.closest(".rd-form")||!(n in {al:1,ac:1,f:1,t:1}))return;
    rd[n]=e.target.value;
    if(rd.msg){rd.msg=null;const m=e.target.closest(".rd-form").querySelector(".tr-msg");if(m){m.className="tr-msg";m.textContent=""}}
  });
  KPB.addEventListener("submit",e=>{
    if(!e.target.closest(".rd-form"))return;
    e.preventDefault();
    const f=new FormData(e.target),card=e.target.closest(".kp-detail"),i=card&&cardInfo(card);
    const k=addFlight(canonAirline(f.get("al")),normType(f.get("ac")),f.get("f")||"",f.get("t")||"",today());
    if(k){rd.msg=tr(k);rdPaint();return}
    if(i)rdDone.add(i.cs+today());
    rd.open=false;rd.msg=null;rdPaint();
    if(isOn())draw();
  });
}

// ---------- hooks into the existing app ----------
const _go=go;
go=function(tab){_go(tab);if(tab=="trip"){drawForm();draw()}};
const label=()=>{nb.querySelector("b").textContent=tr("tab")};
const _al=applyLang;
applyLang=function(){_al();label();if(isOn()){drawForm();draw()}};         // also runs after sync pulls newer data
window.KLTrip={summary:()=>{if(!gOK())return null;const s=stats();return {ap:s.ap,total:AIRPORTS.length,fl:s.fl,km:s.km,bd:earned(s).length,bdTotal:BADGES.length}}};   // read by the Home dashboard
label();buildMarkers();
})();
