// KenalLangit route.js: shows origin -> destination on the flight detail card (data via /api/route, from adsbdb).
// Load AFTER panel.js and BEFORE tour.js.
(()=>{
const R={
  ms:{title:"Laluan",load:"Mencari laluan...",none:"Laluan tidak diketahui untuk penerbangan ini.",err:"Tidak dapat memuatkan laluan. Cuba sebentar lagi.",sample:"Data contoh tiada laluan.",note:"Laluan berjadual daripada adsbdb. Ia mungkin tidak sama dengan laluan sebenar."},
  en:{title:"Route",load:"Looking up route...",none:"No route is known for this flight.",err:"Could not load the route. Try again shortly.",sample:"Sample data has no route.",note:"Scheduled route from adsbdb. It may differ from the actual route."}
};
const r=k=>R[lang][k];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cache=new Map();      // callsign -> { v: route | null | "err", t }
const pending=new Set();
const fresh=c=>c&&Date.now()-c.t<(c.v==="err"?30000:600000);

const st=document.createElement("style");
st.textContent=`
.rt{margin:12px 0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:rgba(20,38,77,.6)}
.rt-t{font-size:.8rem;color:var(--muted);margin-bottom:6px}
.rt-line{display:flex;align-items:center;justify-content:space-between;gap:8px}
.rt-ap{display:flex;flex-direction:column;min-width:0}
.rt-ap:last-child{text-align:right}
.rt-ap b{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:1.5rem;color:var(--cyan);letter-spacing:2px}
.rt-ap small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-mid{flex:none;color:var(--yellow);font-size:1.3rem}
.rt p{margin:0;color:var(--muted);font-size:.85rem}`;
document.head.appendChild(st);

function ap(o){
  const code=o.iata||o.icao||"?";
  const loc=AIRPORTS.find(a=>(o.iata&&a.iata==o.iata)||(o.icao&&a.icao==o.icao));
  return `<div class="rt-ap"><b>${esc(code)}</b><small>${esc(loc?loc.city:(o.city||o.name||""))}</small></div>`;
}
function view(cs){
  if(flightSrc=="sample")return `<p>${r("sample")}</p>`;
  const c=cache.get(cs);
  if(!fresh(c))return `<p>${r("load")}</p>`;
  if(c.v==="err")return `<p>${r("err")}</p>`;
  if(c.v===null)return `<p>${r("none")}</p>`;
  return `<div class="rt-line">${ap(c.v.origin)}<span class="rt-mid">✈</span>${ap(c.v.destination)}</div>`;
}
function paint(cs){
  document.querySelectorAll(`.rt[data-cs="${cs}"]`).forEach(el=>{el.innerHTML=`<div class="rt-t">${r("title")}</div>${view(cs)}`});
}
async function fetchRoute(cs){
  if(flightSrc=="sample"||fresh(cache.get(cs))||pending.has(cs))return;
  pending.add(cs);
  let v="err";
  try{
    const res=await fetch(`/api/route/${encodeURIComponent(cs)}`);
    if(res.ok)v=(await res.json()).route||null;
  }catch(e){}
  pending.delete(cs);
  cache.set(cs,{v,t:Date.now()});
  paint(cs);
}
function inject(){
  const card=document.querySelector(".kp-detail");
  if(!card||card.querySelector(".rt"))return;
  const h=card.querySelector("h3"),dl=card.querySelector("dl");
  if(!h||!dl)return;
  const cs=h.textContent.replace("✈","").trim().toUpperCase();
  if(!/^[A-Z0-9]{2,8}$/.test(cs))return;
  dl.insertAdjacentHTML("beforebegin",`<div class="rt" data-cs="${cs}"><div class="rt-t">${r("title")}</div>${view(cs)}</div>`);
  const note=card.querySelector(".note");
  if(note&&flightSrc!="sample")note.textContent=r("note");   // replaces the old "route not provided" line
  fetchRoute(cs);
}
const body=document.querySelector(".kp-body");
if(body)new MutationObserver(inject).observe(body,{childList:true,subtree:true});
inject();
})();
