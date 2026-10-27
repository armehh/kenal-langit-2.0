// KenalLangit side panel: searchable flight + airport lists with detail cards. Load AFTER characters.js.
(()=>{
const P={
ms:{fl:"Penerbangan",ap:"Lapangan Terbang",sq:"Cari kod panggilan, syarikat, negara...",sa:"Cari lapangan terbang...",all:"Semua",other:"Lain-lain",sort:"Isih",s_cs:"Kod panggilan",s_alt:"Ketinggian",s_spd:"Kelajuan",lp:"Pesawat",la:"Lapangan terbang",empty:"Tiada hasil dijumpai.",nodata:"Tiada data penerbangan buat masa ini.",back:"← Kembali",airline:"Syarikat",country:"Negara pendaftaran",icao:"ICAO24",alt:"Ketinggian",spd:"Kelajuan",kmh:"km/j",hdg:"Arah",vr:"Kadar naik/turun",pos:"Kedudukan",near:"Lapangan terbang terdekat",climb:"Naik",desc:"Turun",level:"Mendatar",lost:"Penerbangan ini tiada dalam paparan terkini.",sample:"Ini data contoh, bukan penerbangan sebenar.",route:"Laluan asal dan destinasi tidak disediakan oleh data OpenSky percuma.",open:"Buka panel",close:"Tutup panel",intl:"Antarabangsa",dom:"Domestik"},
en:{fl:"Flights",ap:"Airports",sq:"Search callsign, airline, country...",sa:"Search airports...",all:"All",other:"Other",sort:"Sort",s_cs:"Callsign",s_alt:"Altitude",s_spd:"Speed",lp:"Aircraft",la:"Airports",empty:"No matches.",nodata:"No flight data right now.",back:"← Back",airline:"Airline",country:"Registered in",icao:"ICAO24",alt:"Altitude",spd:"Speed",kmh:"km/h",hdg:"Heading",vr:"Vertical rate",pos:"Position",near:"Nearest airport",climb:"Climbing",desc:"Descending",level:"Level",lost:"This flight is no longer in the latest data.",sample:"This is sample data, not a real flight.",route:"Origin and destination are not provided by the free OpenSky data.",open:"Open panel",close:"Close panel",intl:"International",dom:"Domestic"}
};
const p=k=>P[lang][k];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const AL={MAS:"Malaysia Airlines",AXM:"AirAsia",FFM:"Firefly",MXD:"Batik Air Malaysia",AIQ:"Thai AirAsia",SIA:"Singapore Airlines",TGW:"Scoot"};
const CH=["MAS","AXM","FFM","MXD"],CHL={MAS:"MAS",AXM:"AirAsia",FFM:"Firefly",MXD:"Batik Air"};
const pre=f=>(f.cs||"").slice(0,3).toUpperCase();
const airline=f=>AL[pre(f)]||"";
const key=f=>f.icao||f.cs;
const narrow=()=>innerWidth<=700;
const km=(a,b,c,d)=>{const r=Math.PI/180;return 6371*Math.hypot((c-a)*r,(d-b)*r*Math.cos((a+c)/2*r))};
const nearest=f=>AIRPORTS.map(a=>[a,km(f.lat,f.lng,a.lat,a.lng)]).sort((x,y)=>x[1]-y[1])[0];
const S={tab:"f",q:"",air:"all",sort:"cs",sel:null};
let flights=[],timer;

// ---------- styles ----------
const st=document.createElement("style");
st.textContent=`
.kp{position:absolute;z-index:1000;top:0;left:0;bottom:0;width:340px;max-width:100%;display:flex;flex-direction:column;background:rgba(13,23,48,.95);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-right:1px solid var(--line);transition:transform .25s ease;color:var(--text)}
.kp.closed{transform:translateX(-100%)}
.kp-toggle{position:absolute;left:100%;top:92px;width:30px;height:46px;padding:0;border-radius:0 10px 10px 0;background:rgba(13,23,48,.95);border:1px solid var(--line);border-left:0;font-size:1.2rem}
.kp-head{padding:10px 12px;border-bottom:1px solid var(--line)}
.kp-tabs{display:flex;gap:6px;margin-bottom:8px}.kp-tabs button{flex:1;padding:8px 6px;font-size:.85rem}
.kp-tabs button.on{background:var(--cyan);color:#04101f;font-weight:700}.kp-tabs .n{font-weight:400;opacity:.8}
.kp-head input[type=search]{margin:0 0 8px}
.kp-tools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:.8rem}
.kp-tools .c2{padding:4px 10px;border-radius:999px;font-size:.78rem}.kp-tools .c2.on{background:var(--cyan);color:#04101f}
.kp-tools select{font:inherit;font-size:.8rem;background:var(--navy);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:4px}
.kp-tools label{display:flex;align-items:center;gap:4px;color:var(--muted)}.kp-tools input{width:auto;margin:0}
.kp-body{flex:1;overflow:auto;padding:6px}
.kp-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border-radius:10px;padding:8px}
.kp-row:hover,.kp-row.on{background:#14264d}
.kp-row .m{flex:1;min-width:0;display:flex;flex-direction:column}
.kp-row small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kp-row .r{font-size:.78rem;color:var(--muted);white-space:nowrap}.kp-row .pl{font-size:1.2rem}
.kp-row .code{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;color:var(--cyan);width:2.6rem}
.kp-detail{padding:8px}.kp-detail h3{margin:10px 0 2px;font-size:1.3rem;color:var(--text)}
.kp-detail dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:12px 0;font-size:.9rem}.kp-detail dt{color:var(--muted)}.kp-detail dd{margin:0}
.kp-detail .note{color:var(--muted);font-size:.8rem;margin-top:8px}
.kp-detail .lnk{background:none;padding:0;color:var(--cyan);text-align:left;text-decoration:underline}
.kp.detail .kp-head{display:none}.kp.tab-a .kp-tools{display:none}
#map.kp-open .leaflet-top.leaflet-left{margin-left:340px;transition:margin .25s}
.leaflet-marker-icon.sel .plane{animation:klglow .8s ease-in-out infinite alternate}
@keyframes klglow{from{filter:drop-shadow(0 0 2px #fff)}to{filter:drop-shadow(0 0 12px #3be8ff) drop-shadow(0 0 4px #fff)}}
@media (max-width:700px){
 .kp{top:auto;width:100%;height:55%;border-right:0;border-top:1px solid var(--line)}
 .kp.closed{transform:translateY(100%)}
 .kp-toggle{left:12px;top:auto;bottom:100%;width:46px;height:30px;border-radius:10px 10px 0 0;border:1px solid var(--line);border-bottom:0}
 #map.kp-open .leaflet-top.leaflet-left{margin-left:0}
}`;
document.head.appendChild(st);

// ---------- skeleton ----------
const kp=document.createElement("aside");kp.className="kp";kp.setAttribute("aria-label","Panel");
kp.innerHTML=`<button class="kp-toggle" type="button"></button><div class="kp-head"></div><div class="kp-body"></div>`;
$("#map").appendChild(kp);
L.DomEvent.disableClickPropagation(kp);L.DomEvent.disableScrollPropagation(kp);
const head=kp.querySelector(".kp-head"),body=kp.querySelector(".kp-body"),tog=kp.querySelector(".kp-toggle");

function setOpen(o){
  kp.classList.toggle("closed",!o);$("#map").classList.toggle("kp-open",o&&!narrow());
  tog.textContent=narrow()?(o?"⌄":"⌃"):(o?"‹":"›");tog.setAttribute("aria-label",o?p("close"):p("open"));
}
tog.onclick=()=>setOpen(kp.classList.contains("closed"));

function drawHead(){
  const chips=["all",...CH,"other"].map(k=>`<button class="c2${S.air==k?" on":""}" data-air="${k}">${k=="all"?p("all"):k=="other"?p("other"):CHL[k]}</button>`).join("");
  head.innerHTML=`<div class="kp-tabs"><button data-tab="f" class="${S.tab=="f"?"on":""}">✈ ${p("fl")} <span class="n">${flights.length}</span></button><button data-tab="a" class="${S.tab=="a"?"on":""}">📍 ${p("ap")}</button></div>
  <input type="search" value="${esc(S.q)}" placeholder="${S.tab=="f"?p("sq"):p("sa")}" aria-label="search">
  <div class="kp-tools">${chips}<select aria-label="${p("sort")}">${["cs","alt","spd"].map(k=>`<option value="${k}"${S.sort==k?" selected":""}>${p("sort")}: ${p("s_"+k)}</option>`).join("")}</select>
  <label><input type="checkbox" data-l="ac"${map.hasLayer(acLayer)?" checked":""}> ${p("lp")}</label><label><input type="checkbox" data-l="ap"${map.hasLayer(apLayer)?" checked":""}> ${p("la")}</label></div>`;
  kp.classList.toggle("tab-a",S.tab=="a");
}
head.addEventListener("click",e=>{
  const t1=e.target.closest("[data-tab]"),c=e.target.closest("[data-air]");
  if(t1){S.tab=t1.dataset.tab;S.q="";S.sel=null;drawHead();render();hl()}
  if(c){S.air=c.dataset.air;head.querySelectorAll("[data-air]").forEach(b=>b.classList.toggle("on",b==c));render()}
});
head.addEventListener("input",e=>{if(e.target.type=="search"){S.q=e.target.value;render()}});
head.addEventListener("change",e=>{
  if(e.target.tagName=="SELECT"){S.sort=e.target.value;render()}
  if(e.target.dataset.l){const ly=e.target.dataset.l=="ac"?acLayer:apLayer;e.target.checked?map.addLayer(ly):map.removeLayer(ly)}
});

// ---------- rendering ----------
function visible(){
  const q=S.q.trim().toLowerCase();
  const a=flights.filter(f=>(S.air=="all"||(S.air=="other"?!CH.includes(pre(f)):pre(f)==S.air))&&(!q||[f.cs,airline(f),f.country,f.icao].some(v=>String(v||"").toLowerCase().includes(q))));
  const o={cs:(x,y)=>(x.cs||"~").localeCompare(y.cs||"~"),alt:(x,y)=>(y.alt||0)-(x.alt||0),spd:(x,y)=>(y.vel||0)-(x.vel||0)};
  return a.sort(o[S.sort]);
}
function detail(f){
  const n=nearest(f);
  const vr=f.vr==null?"—":Math.abs(f.vr)<1?p("level"):`${f.vr>0?p("climb"):p("desc")} ${Math.abs(Math.round(f.vr*196.85))} ft/min`;
  const rows=[[p("airline"),esc(airline(f)||"—")],[p("country"),esc(f.country||"—")],[p("icao"),esc(f.icao||"—")],
   [p("alt"),f.alt!=null?`${Math.round(f.alt)} m · ${Math.round(f.alt*3.281)} ft`:"—"],
   [p("spd"),f.vel!=null?`${Math.round(f.vel*3.6)} ${p("kmh")} · ${Math.round(f.vel*1.944)} kt`:"—"],
   [p("hdg"),`${Math.round(f.hdg||0)}°`],[p("vr"),vr],[p("pos"),`${f.lat.toFixed(3)}, ${f.lng.toFixed(3)}`],
   [p("near"),`<button class="lnk" data-ap="${n[0].iata}">${n[0].iata} · ${esc(nameOf(n[0],lang))}</button> (${Math.round(n[1])} km)`]];
  return `<div class="kp-detail"><button data-back>${p("back")}</button><h3 style="color:${col(f)}">✈ ${esc(f.cs||"—")}</h3><small>${esc(airline(f))}</small>
  <dl>${rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join("")}</dl>
  <p class="note">${flightSrc=="sample"?p("sample")+" ":""}${p("route")}</p></div>`;
}
const col=f=>COLORS[pre(f)]||"#ffffff";
function render(){
  const top=body.scrollTop;let h="";
  const sel=S.tab=="f"&&S.sel?flights.find(f=>key(f)==S.sel):null;
  kp.classList.toggle("detail",S.tab=="f"&&!!S.sel);
  if(S.tab=="f"&&S.sel){h=sel?detail(sel):`<div class="kp-detail"><button data-back>${p("back")}</button><p>${p("lost")}</p></div>`}
  else if(S.tab=="f"){
    const v=visible();
    h=v.length?v.map(f=>`<button class="kp-row${key(f)==S.sel?" on":""}" data-k="${esc(key(f))}"><span class="pl" style="color:${col(f)}">✈</span><span class="m"><b>${esc(f.cs||"—")}</b><small>${esc(airline(f)||f.country||"")}</small></span><span class="r">${f.alt!=null?Math.round(f.alt*3.281/100)*100+" ft":""}</span></button>`).join(""):`<p style="padding:12px;color:var(--muted)">${flights.length?p("empty"):p("nodata")}</p>`;
  }else{
    const q=S.q.trim().toLowerCase();
    const v=AIRPORTS.filter(a=>!q||[a.iata,a.icao,a.city,nameOf(a,lang),a.state].some(s=>s.toLowerCase().includes(q)));
    h=v.length?v.map(a=>`<button class="kp-row" data-ap="${a.iata}"><b class="code">${a.iata}</b><span class="m"><b>${esc(a.city)}</b><small>${esc(nameOf(a,lang))}</small></span><span class="r">${a.intl?p("intl"):p("dom")}</span></button>`).join(""):`<p style="padding:12px;color:var(--muted)">${p("empty")}</p>`;
  }
  body.innerHTML=h;body.scrollTop=top;
}
function hl(){flights.forEach(f=>{const el=f.marker&&f.marker.getElement&&f.marker.getElement();if(el)el.classList.toggle("sel",S.tab=="f"&&key(f)==S.sel)})}

// ---------- actions ----------
function selectFlight(k){
  const f=flights.find(x=>key(x)==k);if(!f)return;
  S.sel=k;render();hl();
  map.flyTo([f.lat,f.lng],Math.max(map.getZoom(),8),{duration:.8});
  if(narrow())setOpen(false);
}
function openAirport(iata){
  const i=AIRPORTS.findIndex(a=>a.iata==iata),m=apLayer.getLayers()[i];if(!m)return;
  if(!map.hasLayer(apLayer))map.addLayer(apLayer);
  map.flyTo(m.getLatLng(),9,{duration:.8});map.once("moveend",()=>m.openPopup());
  if(narrow())setOpen(false);
}
body.addEventListener("click",e=>{
  const k=e.target.closest("[data-k]"),a=e.target.closest("[data-ap]"),b=e.target.closest("[data-back]");
  if(b){S.sel=null;kp.classList.remove("detail");render();hl()}
  else if(a)openAirport(a.dataset.ap);
  else if(k)selectFlight(k.dataset.k);
});

// ---------- hook into the existing flight loader ----------
const _plane=plane;
plane=function(f){
  _plane(f);
  const ls=acLayer.getLayers();
  if(ls.length===1)flights=[];                       // first plane of a refresh: start a new list
  flights.push(Object.assign({},f,{marker:ls[ls.length-1]}));
  clearTimeout(timer);timer=setTimeout(()=>{drawHead();render();hl()},0);
};
const _al=applyLang;
applyLang=function(){_al();drawHead();render()};

setOpen(!narrow());drawHead();render();
loadFlights();
})();
