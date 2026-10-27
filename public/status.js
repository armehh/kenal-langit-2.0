// KenalLangit status.js: delay and status on the flight detail card (data via /api/status, from AirLabs).
// Load AFTER route.js and BEFORE tour.js.
(()=>{
const R={
  ms:{title:"Status penerbangan",load:"Memuatkan status...",none:"Status tidak tersedia untuk penerbangan ini.",err:"Status tidak tersedia buat masa ini.",
      dep:"Berlepas",arr:"Tiba",act:"sebenar",est:"anggaran",ontime:"Tepat masa",late:"Lewat",min:"min",h:"j",
      landed:"Mendarat",plan:"Berjadual",enroute:"Dalam penerbangan",cancel:"Dibatalkan",eta:"Anggaran tiba dalam",src:"Sumber: AirLabs"},
  en:{title:"Flight status",load:"Loading status...",none:"No status is available for this flight.",err:"Status is unavailable right now.",
      dep:"Departed",arr:"Arrives",act:"actual",est:"estimated",ontime:"On time",late:"Delayed",min:"min",h:"h",
      landed:"Landed",plan:"Scheduled",enroute:"En route",cancel:"Cancelled",eta:"Arrives in",src:"Source: AirLabs"}
};
const r=k=>R[lang][k];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cache=new Map();      // callsign -> { v: status | null | "err", t }
const pending=new Set();
const fresh=c=>c&&Date.now()-c.t<(c.v==="err"?60000:300000);
const hm=t=>t?String(t).slice(11,16):"--:--";   // "2026-10-22 09:10" -> "09:10" (local time at that airport)

const st=document.createElement("style");
st.textContent=`
.fst{margin:12px 0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:rgba(20,38,77,.6)}
.fst-t{font-size:.8rem;color:var(--muted);margin-bottom:8px}
.fst-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.chip2{padding:3px 10px;border-radius:999px;font-size:.8rem;font-weight:700}
.b-info{background:#14264d;color:var(--text)}
.b-ok{background:rgba(34,197,139,.18);color:var(--green)}
.b-mid{background:rgba(255,201,51,.18);color:var(--yellow)}
.b-bad{background:rgba(255,71,87,.18);color:var(--red)}
.fst-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:6px 0;border-top:1px solid var(--line);font-size:.9rem}
.fst-row small{color:var(--muted);margin-left:4px}
.fst-row s{color:var(--muted);margin-right:4px}
.fst-bar{height:6px;background:#14264d;border-radius:4px;overflow:hidden;margin:8px 0 4px}
.fst-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--yellow))}
.fst-src{color:var(--muted);font-size:.75rem;margin-top:6px}
.fst p{margin:0;color:var(--muted);font-size:.85rem}`;
document.head.appendChild(st);

function chips(s){
  if(s.status=="cancelled")return `<span class="chip2 b-bad">${r("cancel")}</span>`;
  const d=(s.arr&&s.arr.delayed!=null?s.arr.delayed:s.delayed)||0;
  const word=s.status=="landed"?r("landed"):s.status=="scheduled"?r("plan"):r("enroute");
  let cls="b-ok",txt=r("ontime");
  if(d>45){cls="b-bad";txt=`${r("late")} ${d} ${r("min")}`}
  else if(d>15){cls="b-mid";txt=`${r("late")} ${d} ${r("min")}`}
  return `<span class="chip2 b-info">${word}</span><span class="chip2 ${cls}">${esc(txt)}</span>`;
}
function row(label,p){
  const final=p.actual||p.estimated||p.scheduled;
  const tag=p.actual?r("act"):p.estimated?r("est"):"";
  const sched=p.scheduled&&hm(p.scheduled)!=hm(final)?`<s>${hm(p.scheduled)}</s>`:"";
  const where=[p.terminal?`T${esc(p.terminal)}`:"",p.gate?esc(p.gate):""].filter(Boolean).join(" · ");
  return `<div class="fst-row"><div>${label} <b>${esc(p.iata||"")}</b><small>${where}</small></div><div>${sched}<b>${hm(final)}</b><small>${tag}</small></div></div>`;
}
function eta(m){
  if(m==null)return "";
  return m>=60?`${Math.floor(m/60)}${r("h")} ${m%60}${r("min")}`:`${m} ${r("min")}`;
}
function view(cs){
  const c=cache.get(cs);
  if(!fresh(c))return `<p>${r("load")}</p>`;
  if(c.v==="err")return `<p>${r("err")}</p>`;
  if(c.v===null)return `<p>${r("none")}</p>`;
  const s=c.v;
  const bar=s.status=="en-route"&&s.progress!=null
    ?`<div class="fst-bar"><i style="width:${Math.max(0,Math.min(100,Number(s.progress)||0))}%"></i></div>${s.eta!=null?`<small>${r("eta")} ${eta(s.eta)}</small>`:""}`:"";
  return `<div class="fst-chips">${chips(s)}</div>${row(r("dep"),s.dep)}${row(r("arr"),s.arr)}${bar}<div class="fst-src">${r("src")}</div>`;
}
function paint(cs){
  document.querySelectorAll(`.fst[data-cs="${cs}"]`).forEach(el=>{el.innerHTML=`<div class="fst-t">${r("title")}</div>${view(cs)}`});
}
async function fetchStatus(cs){
  if(fresh(cache.get(cs))||pending.has(cs))return;
  pending.add(cs);
  let v="err";
  try{
    const res=await fetch(`/api/status/${encodeURIComponent(cs)}`);
    if(res.ok)v=(await res.json()).status||null;
  }catch(e){}
  pending.delete(cs);
  cache.set(cs,{v,t:Date.now()});
  paint(cs);
}
function inject(){
  if(flightSrc=="sample")return;                       // sample aircraft have no real status
  const card=document.querySelector(".kp-detail");
  if(!card||card.querySelector(".fst"))return;
  const rt=card.querySelector(".rt"),h=card.querySelector("h3");   // route.js adds .rt first
  if(!rt||!h)return;
  const cs=h.textContent.replace("✈","").trim().toUpperCase();
  if(!/^[A-Z0-9]{2,8}$/.test(cs))return;
  rt.insertAdjacentHTML("afterend",`<div class="fst" data-cs="${cs}"><div class="fst-t">${r("title")}</div>${view(cs)}</div>`);
  fetchStatus(cs);
}
const body=document.querySelector(".kp-body");
if(body)new MutationObserver(inject).observe(body,{childList:true,subtree:true});
inject();
})();
