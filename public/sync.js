// KenalLangit sync.js: saves progress to the cloud (Firestore via the server) so it survives a device change.
// localStorage stays the fast, synchronous source the rest of the app reads; this file mirrors it to /api/progress.
// Sign-in is anonymous by default; "Connect with Google" links that same account so another device can sign in to it.
// Load AFTER home.js (it wraps ls.set and calls applyLang() to redraw after a pull).
(()=>{
const KEYS={known:"kl-known",course:"kl-course",last:"kl-last",best:"kl-best",name:"kl-name"};
const META="kl-sync";                       // { uid, dirty }: which account this device's data was last synced with
const SDK="https://www.gstatic.com/firebasejs/10.12.2/";
const rawSet=ls.set;                        // original setter: writes localStorage without triggering a push
let auth=null,user=null,applying=false,timer=null,pushing=false,configured=false;
const subs=[];

const read=()=>({known:ls.get(KEYS.known,{}),course:ls.get(KEYS.course,{}),last:ls.get(KEYS.last,null),best:ls.get(KEYS.best,0),name:ls.get(KEYS.name,"")});
const empty=p=>!Object.keys(p.known).length&&!Object.keys(p.course).length&&!p.last&&!p.best&&!p.name;
const meta=()=>ls.get(META,{});
const setMeta=m=>rawSet(META,m);
const notify=()=>subs.forEach(f=>{try{f()}catch(e){}});

function merge(a,b){                        // used only when two sets of progress meet for the first time
  const known={};
  new Set([...Object.keys(a.known),...Object.keys(b.known)]).forEach(k=>{known[k]=(a.known[k]===1||b.known[k]===1)?1:0});
  const course={};
  new Set([...Object.keys(a.course),...Object.keys(b.course)]).forEach(k=>{course[k]=Math.max(a.course[k]||0,b.course[k]||0)});
  const last=!a.last?b.last:!b.last?a.last:(a.last.d>=b.last.d?a.last:b.last);
  return {known,course,last,best:Math.max(a.best||0,b.best||0),name:a.name||b.name||""};
}

function apply(p){                          // write remote progress into localStorage, then redraw if anything changed
  const before=JSON.stringify(read());
  applying=true;
  try{for(const f in KEYS)rawSet(KEYS[f],p[f]==null?(f=="best"?0:f=="name"?"":f=="last"?null:{}):p[f])}finally{applying=false}
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
      await push();notify();try{applyLang()}catch(e){}
    }catch(e){
      if(e.code=="auth/credential-already-in-use"&&e.credential){await auth.signInWithCredential(e.credential)}   // existing Google account: onAuthStateChanged merges this device in
      else if(e.code=="auth/popup-closed-by-user"||e.code=="auth/cancelled-popup-request"){return}
      else throw e;
    }
  },
  async signOut(){                                                // shared-device safety: remove local progress, then start fresh
    await push();
    Object.values(KEYS).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
    try{localStorage.removeItem(META)}catch(e){}
    await auth.signOut();
    location.reload();
  },
};

boot();
})();
