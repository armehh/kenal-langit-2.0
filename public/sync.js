// KenalLangit sync.js: saves progress to the cloud (Firestore via the server) so it survives a device change.
// localStorage stays the fast, synchronous source the rest of the app reads; this file mirrors it to /api/progress.
// Sign-in is anonymous by default; "Connect with Google" links that same account so another device can sign in to it.
// Load AFTER home.js (it wraps ls.set and calls applyLang() to redraw after a pull).
(()=>{
const KEYS={known:"kl-known",course:"kl-course",last:"kl-last",best:"kl-best",name:"kl-name",visited:"kl-visited",flights:"kl-flights"};
const META="kl-sync";                       // { uid, dirty }: which account this device's data was last synced with
const SDK="https://www.gstatic.com/firebasejs/10.12.2/";
const rawSet=ls.set;                        // original setter: writes localStorage without triggering a push
let auth=null,user=null,applying=false,timer=null,pushing=false,configured=false;
const subs=[];

const read=()=>({known:ls.get(KEYS.known,{}),course:ls.get(KEYS.course,{}),last:ls.get(KEYS.last,null),best:ls.get(KEYS.best,0),name:ls.get(KEYS.name,""),visited:ls.get(KEYS.visited,{}),flights:ls.get(KEYS.flights,[])});
const empty=p=>!Object.keys(p.known).length&&!Object.keys(p.course).length&&!p.last&&!p.best&&!p.name&&!Object.keys(p.visited).length&&!p.flights.length;
const meta=()=>ls.get(META,{});
const setMeta=m=>rawSet(META,m);
const notify=()=>subs.forEach(f=>{try{f()}catch(e){}});

function merge(a,b){                        // used only when two sets of progress meet for the first time
  const known={};
  new Set([...Object.keys(a.known),...Object.keys(b.known)]).forEach(k=>{known[k]=(a.known[k]===1||b.known[k]===1)?1:0});
  const course={};
  new Set([...Object.keys(a.course),...Object.keys(b.course)]).forEach(k=>{course[k]=Math.max(a.course[k]||0,b.course[k]||0)});
  const last=!a.last?b.last:!b.last?a.last:(a.last.d>=b.last.d?a.last:b.last);
  const visited={...a.visited,...b.visited};                          // airports: union
  const seen=new Set(),flights=[];                                    // flights: union by id, so both devices' logs survive
  [...(a.flights||[]),...(b.flights||[])].forEach(f=>{if(f&&!seen.has(f.id)){seen.add(f.id);flights.push(f)}});
  return {known,course,last,best:Math.max(a.best||0,b.best||0),name:a.name||b.name||"",visited,flights:flights.slice(0,300)};
}

function apply(p){                          // write remote progress into localStorage, then redraw if anything changed
  const before=JSON.stringify(read());
  applying=true;
  try{for(const f in KEYS)rawSet(KEYS[f],p[f]==null?(f=="best"?0:f=="name"?"":f=="last"?null:f=="flights"?[]:{}):p[f])}finally{applying=false}
  if(JSON.stringify(read())!==before){try{applyLang()}catch(e){}}
}

async function api(method,body,keepalive){
  const tok=await user.getIdToken();
  const r=await fetch("/api/progress",{method,keepalive:!!keepalive,headers:{Authorization:"Bearer "+tok,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw new Error("progress "+r.status);
  return r.json();
}

async function push(keepalive){
  if(!user||pushing)return;
  const p=read();
  if(empty(p)){setMeta({uid:user.uid,dirty:false});return}
  pushing=true;
  try{await api("PUT",p,keepalive);setMeta({uid:user.uid,dirty:false})}
  catch(e){setMeta({uid:user.uid,dirty:true})}      // retried on the next change, when the tab is shown again, or when back online
  finally{pushing=false}
}

function schedule(){clearTimeout(timer);timer=setTimeout(()=>push(),2000)}

// Every write the app makes to a synced key marks this device dirty and schedules a push.
ls.set=(k,v)=>{
  rawSet(k,v);
  if(applying||!Object.values(KEYS).includes(k))return;
  setMeta({uid:meta().uid,dirty:true});
  if(user)schedule();
};

async function reconcile(){
  let remote=null;
  try{remote=(await api("GET")).progress}catch(e){return}        // offline or server problem: stay local, try again later
  const m=meta(),local=read();
  if(m.uid!==user.uid){                                           // first time this device meets this account: merge both sides
    const merged=remote?merge(local,remote):local;
    apply(merged);setMeta({uid:user.uid,dirty:true});await push();
  }else if(m.dirty){await push()}                                 // edits made while offline win
  else if(remote){apply(remote)}                                  // another device may have moved on: take the cloud copy
  else await push();
}

function loadScript(src){
  return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
}

async function boot(){
  let cfg;
  try{const r=await fetch("/api/fbconfig");if(!r.ok)return;cfg=await r.json()}catch(e){return}
  try{
    await loadScript(SDK+"firebase-app-compat.js");
    await loadScript(SDK+"firebase-auth-compat.js");
  }catch(e){return}                                               // SDK blocked or offline: the app keeps working locally
  firebase.initializeApp(cfg);
  auth=firebase.auth();
  configured=true;
  auth.onAuthStateChanged(async u=>{
    if(!u){try{await auth.signInAnonymously()}catch(e){}return}
    user=u;
    await reconcile();
    mountUI();
    notify();try{applyLang()}catch(e){}                           // lets the Home card show the sign-in state
  });
}

addEventListener("online",()=>{if(user&&meta().dirty)push()});
document.addEventListener("visibilitychange",()=>{
  if(!user)return;
  if(document.visibilityState=="hidden"){if(meta().dirty){clearTimeout(timer);push(true)}}   // flush before the tab goes away
  else if(meta().dirty)push();
});

window.KLSync={
  onChange:f=>subs.push(f),
  state:()=>({configured,ready:!!user,google:!!(user&&user.providerData.some(p=>p.providerId=="google.com")),email:user&&user.email||""}),
  async link(){                                                   // keep the same account and add Google to it
    const prov=new firebase.auth.GoogleAuthProvider();
    try{
      await user.linkWithPopup(prov);
      await user.getIdToken(true);                                // refresh so the server sees the Google link before the first push
      await push();notify();try{applyLang()}catch(e){}
    }catch(e){
      if(e.code=="auth/credential-already-in-use"&&e.credential){await auth.signInWithCredential(e.credential)}   // existing Google account: onAuthStateChanged merges this device in
      else if(e.code=="auth/popup-closed-by-user"||e.code=="auth/cancelled-popup-request"){return}
      else throw e;
    }
  },
  prompt(){if(user&&!window.KLSync.state().google){openPop();return true}return false},   // lets the Trips tab open the sign-in popover
  async signOut(){                                                // shared-device safety: remove local progress, then start fresh
    await push();
    Object.values(KEYS).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
    try{localStorage.removeItem(META)}catch(e){}
    await auth.signOut();
    location.reload();
  },
};

// ---------- Header account button + sign-in popover ----------
const A={
ms:{in:"Log masuk",acct:"Akaun",title:"Simpan kemajuan awak",body:"Log masuk dengan Google supaya kemajuan kuiz, Belajar dan Jejak penerbangan boleh dibuka di peranti lain. Jejak hanya untuk akaun Google. Tanpa log masuk, kemajuan hanya terikat pada pelayar ini.",go:"Teruskan dengan Google",later:"Nanti",as:e=>`Disegerakkan sebagai ${e}`,out:"Log keluar",outAsk:"Log keluar dan kosongkan kemajuan di peranti ini? Kemajuan kekal selamat dalam akaun awak.",err:"Tidak dapat log masuk. Cuba lagi."},
en:{in:"Sign in",acct:"Account",title:"Save your progress",body:"Sign in with Google so your quiz, Learn and Trips progress works on other devices. Trips needs a Google account. Without signing in, progress stays tied to this browser.",go:"Continue with Google",later:"Not now",as:e=>`Synced as ${e}`,out:"Sign out",outAsk:"Sign out and clear progress on this device? It stays safe in your account.",err:"Could not sign in. Please try again."}
};
const a=k=>A[lang][k];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const GLOGO='<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const css=document.createElement("style");
css.textContent=`.kl-hr{display:flex;align-items:center;gap:8px}
.kl-acct{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:#10285a;border:1px solid var(--cyan);color:var(--text);font-weight:700;font-size:.9rem}
.kl-av{width:26px;height:26px;border-radius:50%;background:var(--cyan);color:#04101f;display:inline-flex;align-items:center;justify-content:center;font-weight:800}
.kl-pop{position:fixed;top:64px;left:12px;right:12px;max-width:340px;margin-left:auto;z-index:3000;background:var(--navy2);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 14px 40px rgba(0,0,0,.6)}
.kl-pop h3{margin:0 0 8px;color:var(--yellow)}.kl-pop p{color:var(--muted);font-size:.9rem;line-height:1.45}
.kl-g{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:11px;border-radius:10px;background:#fff;color:#1f1f1f;font-weight:700;margin-top:14px}.kl-g:hover{background:#f1f1f1}.kl-g:disabled{opacity:.6}
.kl-x{display:block;margin:10px auto 0;background:none;color:var(--muted);padding:6px 10px;font-size:.85rem}
.kl-err{color:#ff8a93;font-size:.85rem;margin-top:10px}
@media(max-width:380px){.kl-acct b{display:none}}`;
document.head.appendChild(css);

let btn=null,pop=null;
const closePop=()=>{if(pop){pop.remove();pop=null}};
function renderBtn(){
  if(!btn)return;
  const S=KLSync.state();
  btn.innerHTML=S.google?`<span class="kl-av">${esc((S.email||"?")[0].toUpperCase())}</span>`:`<span aria-hidden="true">👤</span><b>${a("in")}</b>`;
  btn.setAttribute("aria-label",S.google?S.email:a("in"));
  btn.title=S.google?S.email:a("in");
}
function openPop(){
  closePop();
  const S=KLSync.state();
  pop=document.createElement("div");
  pop.className="kl-pop";pop.setAttribute("role","dialog");pop.setAttribute("aria-label",a("acct"));
  pop.innerHTML=S.google
    ?`<h3>${a("acct")}</h3><p>${esc(a("as")(S.email))}</p><button class="kl-g" id="klo" style="background:#14264d;color:var(--text)">${a("out")}</button>`
    :`<h3>${a("title")}</h3><p>${a("body")}</p><button class="kl-g" id="klg">${GLOGO}<span>${a("go")}</span></button><p class="kl-err" id="kle" hidden>${a("err")}</p><button class="kl-x" id="klx">${a("later")}</button>`;
  document.body.appendChild(pop);
  const g=pop.querySelector("#klg"),o=pop.querySelector("#klo"),x=pop.querySelector("#klx");
  if(g)g.onclick=()=>{g.disabled=true;KLSync.link().then(closePop).catch(()=>{g.disabled=false;const m=pop&&pop.querySelector("#kle");if(m)m.hidden=false})};
  if(o)o.onclick=()=>{if(confirm(a("outAsk")))KLSync.signOut().catch(()=>{})};
  if(x)x.onclick=closePop;
}
function mountUI(){
  if(btn)return;
  const lb=document.getElementById("lang");if(!lb)return;
  const wrap=document.createElement("div");wrap.className="kl-hr";
  lb.parentNode.insertBefore(wrap,lb);
  btn=document.createElement("button");btn.className="kl-acct";btn.type="button";
  btn.onclick=e=>{e.stopPropagation();pop?closePop():openPop()};
  wrap.append(btn,lb);
  renderBtn();
}
document.addEventListener("click",e=>{if(pop&&!pop.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))closePop()});
document.addEventListener("keydown",e=>{if(e.key=="Escape")closePop()});
const _al=applyLang;
applyLang=function(){_al();renderBtn();if(pop)openPop()};            // redraw the popover too when the language changes

// One gentle nudge, once: right after the first finished quiz, offer to save progress.
const _fin2=finish;
finish=function(){
  _fin2();
  try{
    const S=KLSync.state();
    if(S.ready&&!S.google&&!ls.get("kl-nudge",0)){rawSet("kl-nudge",1);setTimeout(openPop,1500)}
  }catch(e){}
};

boot();
})();
