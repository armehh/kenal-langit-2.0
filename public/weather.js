// KenalLangit weather.js: current airport weather (METAR) inside the airport popup.
// Data via /api/weather/:icao (server proxies aviationweather.gov). Load AFTER extras.js and panel.js.
(()=>{
const W={
  ms:{title:"Cuaca terkini (METAR)",load:"Memuatkan cuaca...",none:"Tiada laporan METAR terkini untuk lapangan terbang ini.",err:"Cuaca tidak tersedia buat masa ini.",
      temp:"Suhu",dew:"embun",wind:"Angin",vis:"Penglihatan",cloud:"Awan",qnh:"Tekanan (QNH)",wxl:"Cuaca",obs:"Dilaporkan",ago:"lalu",min:"min",hr:"jam",
      calm:"Tenang",vrb:"Berubah-ubah",gust:"badai",kmh:"km/j",raw:"METAR mentah",src:"Sumber: AviationWeather.gov (NOAA)",
      VFR:"VFR · cuaca baik untuk terbang",MVFR:"MVFR · sederhana",IFR:"IFR · penglihatan atau awan rendah",LIFR:"LIFR · sangat rendah"},
  en:{title:"Current weather (METAR)",load:"Loading weather...",none:"No recent METAR report for this airport.",err:"Weather is unavailable right now.",
      temp:"Temperature",dew:"dew point",wind:"Wind",vis:"Visibility",cloud:"Cloud",qnh:"Pressure (QNH)",wxl:"Weather",obs:"Reported",ago:"ago",min:"min",hr:"h",
      calm:"Calm",vrb:"Variable",gust:"gusting",kmh:"km/h",raw:"Raw METAR",src:"Source: AviationWeather.gov (NOAA)",
      VFR:"VFR · good flying weather",MVFR:"MVFR · marginal",IFR:"IFR · low visibility or cloud",LIFR:"LIFR · very low"}
};
const w=k=>W[lang][k];
const L2=o=>o[lang=="ms"?0:1];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:null};
const cache=new Map();      // icao -> { v: weather | null | "err", t }
const pending=new Set();
const fresh=c=>c&&Date.now()-c.t<(c.v==="err"?60000:300000);

const CV={SKC:["Cerah","Clear"],CLR:["Cerah","Clear"],NSC:["Tiada awan ketara","No significant cloud"],FEW:["Sedikit awan","Few"],SCT:["Awan berselerak","Scattered"],BKN:["Banyak awan","Broken"],OVC:["Mendung","Overcast"],VV:["Penglihatan menegak","Vertical visibility"]};
const WXT={TS:["ribut petir","thunderstorm"],RA:["hujan","rain"],DZ:["gerimis","drizzle"],SH:["hujan renyai","showers"],BR:["kabus nipis","mist"],HZ:["jerebu","haze"],FG:["kabus","fog"],FU:["asap","smoke"],GR:["hujan batu","hail"],"-":["ringan","light"],"+":["lebat","heavy"],VC:["berhampiran","nearby"]};

const st=document.createElement("style");
st.textContent=`
.wx{margin:8px 0 4px;padding-top:8px;border-top:1px solid var(--line);font-size:.85rem}
.wx-t{color:var(--muted);font-size:.75rem;margin-bottom:6px}
.wx-m{color:var(--muted)}
.wx-cat{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.75rem;font-weight:700}
.c-VFR{background:rgba(34,197,139,.18);color:var(--green)}
.c-MVFR{background:rgba(80,140,255,.2);color:#7aa8ff}
.c-IFR{background:rgba(255,71,87,.18);color:var(--red)}
.c-LIFR{background:rgba(214,100,255,.2);color:#e089ff}
.wx dl{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin:8px 0 4px}
.wx dt{color:var(--muted)}
.wx dd{margin:0}
.wx details{margin-top:6px}
.wx summary{cursor:pointer;color:var(--cyan)}
.wx code{display:block;margin-top:4px;padding:6px;background:#091226;border-radius:6px;font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:.75rem;word-break:break-word}
.wx-src{color:var(--muted);font-size:.7rem;margin-top:6px}`;
document.head.appendChild(st);

function wind(m){
  const s=num(m.wspd);if(s==null)return "—";
  if(s===0)return w("calm");
  const d=num(m.wdir)==null?w("vrb"):`${String(Math.round(num(m.wdir))).padStart(3,"0")}°`;
  const g=num(m.wgst)?` ${w("gust")} ${Math.round(num(m.wgst))}`:"";
  return `${d} · ${Math.round(s)}${g} kt (${Math.round(s*1.852)} ${w("kmh")})`;
}
function vis(m){                                   // aviationweather.gov gives statute miles, e.g. "6+"
  const sm=num(m.visib);if(sm==null)return "—";
  const km=sm*1.609;
  return `${String(m.visib).includes("+")?"≥ ":""}${km>=10?Math.round(km):km.toFixed(1)} km`;
}
function qnh(m){
  let a=num(m.altim);if(a==null)return "—";
  if(a<100)a*=33.8639;                             // inHg -> hPa, in case the source sends inches
  return `${Math.round(a)} hPa`;
}
function clouds(m){
  const c=Array.isArray(m.clouds)?m.clouds:[];
  if(!c.length)return "—";
  return c.slice(0,3).map(l=>{
    const n=L2(CV[l.cover]||[l.cover,l.cover]);
    return l.base!=null?`${n} ${Number(l.base).toLocaleString("en")} ft`:n;
  }).join(", ");
}
function phenom(s){
  if(!s)return "";
  return String(s).split(" ").map(tok=>{
    let pre="",t=tok;
    if(t[0]=="-"||t[0]=="+"){pre=L2(WXT[t[0]])+" ";t=t.slice(1)}
    if(t.startsWith("VC")){pre+=L2(WXT.VC)+" ";t=t.slice(2)}
    return pre+(t.match(/.{1,2}/g)||[]).map(p=>L2(WXT[p]||[p,p])).join(" ");
  }).join(", ");
}
function age(t){
  if(t==null)return "";
  const m=Math.max(0,Math.round((Date.now()/1000-t)/60));
  return m<90?`${m} ${w("min")} ${w("ago")}`:`${Math.round(m/60)} ${w("hr")} ${w("ago")}`;
}
function view(icao){
  const c=cache.get(icao);
  if(!fresh(c))return `<div class="wx-m">${w("load")}</div>`;
  if(c.v==="err")return `<div class="wx-m">${w("err")}</div>`;
  if(c.v===null)return `<div class="wx-m">${w("none")}</div>`;
  const m=c.v;
  const rows=[
    [w("temp"),m.temp!=null?`${Math.round(m.temp)}°C${m.dewp!=null?` · ${w("dew")} ${Math.round(m.dewp)}°C`:""}`:"—"],
    [w("wind"),wind(m)],[w("vis"),vis(m)],[w("cloud"),clouds(m)]
  ];
  if(m.wx)rows.push([w("wxl"),phenom(m.wx)]);
  rows.push([w("qnh"),qnh(m)]);
  if(m.observed!=null)rows.push([w("obs"),age(m.observed)]);
  const cat=W[lang][m.cat]?`<span class="wx-cat c-${m.cat}">${esc(w(m.cat))}</span>`:"";
  return `${cat}<dl>${rows.map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>`
    +(m.raw?`<details><summary>${w("raw")}</summary><code>${esc(m.raw)}</code></details>`:"")
    +`<div class="wx-src">${w("src")}</div>`;
}
function paint(icao,popup){
  document.querySelectorAll(`.wx[data-icao="${icao}"]`).forEach(el=>{el.innerHTML=`<div class="wx-t">${w("title")}</div>${view(icao)}`});
  if(popup&&popup.isOpen())popup.update();         // the popup grew, so re-measure it (safe: content is a DOM node, see popupopen below)
}
async function fetchWx(icao,popup){
  if(fresh(cache.get(icao)))return paint(icao,popup);
  if(pending.has(icao))return;
  pending.add(icao);
  let v="err";
  try{
    const r=await fetch(`/api/weather/${icao}`);
    if(r.ok)v=(await r.json()).weather||null;
  }catch(e){}
  pending.delete(icao);
  cache.set(icao,{v,t:Date.now()});
  paint(icao,popup);
}

map.on("popupopen",e=>{
  const el=e.popup.getElement();if(!el)return;
  const box=el.querySelector(".leaflet-popup-content");
  if(!box)return;
  const head=box.querySelector("b");if(!head)return;
  const icao=(head.textContent.split("/")[1]||"").trim();      // popup starts with "KUL / WMKK"
  if(!/^W[MB][A-Z]{2}$/.test(icao))return;
  if(box.querySelector(".wx")){fetchWx(icao,e.popup);return}    // popup reopened: just refresh the data
  // Leaflet's popup.update() rewrites string content and would wipe the weather box.
  // Move the content into a DOM node first, so update() only re-attaches the same node.
  const wrap=document.createElement("div");
  while(box.firstChild)wrap.appendChild(box.firstChild);
  e.popup.setContent(wrap);
  const html=`<div class="wx" data-icao="${icao}"><div class="wx-t">${w("title")}</div>${view(icao)}</div>`;
  const btn=wrap.querySelector(".popbtn");
  if(btn)btn.insertAdjacentHTML("beforebegin",html);else wrap.insertAdjacentHTML("beforeend",html);
  e.popup.update();
  fetchWx(icao,e.popup);
});
})();
