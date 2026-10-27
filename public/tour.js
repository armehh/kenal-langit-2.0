// KenalLangit guided tour (tour.js): 15 steps. Load AFTER extras.js, characters.js and panel.js.
// Images: public/img/guide/step-01.png ... step-15.png. Falls back to the rabbit (img/characters/arnab-*.webp), then to an emoji.
(()=>{
const E={m:"🧑‍✈️",w:"👩‍✈️",b:"🐰"};
// [character, tab, element to highlight, BM text, EN text]
const S=[
["m","map","","Hai! Saya akan tunjuk cara guna KenalLangit.","Hi! Let me show you around KenalLangit."],
["m","map","","Setiap ikon ✈ ialah pesawat di ruang udara Malaysia. Warnanya ikut syarikat penerbangan.","Each ✈ icon is an aircraft over Malaysian airspace, coloured by airline."],
["m","map",".kp","Panel ini menyenaraikan penerbangan semasa. Ketik satu untuk terbang ke lokasinya.","This panel lists current flights. Tap one to fly to it on the map."],
["m","map",".kp-head","Cari kod panggilan atau tapis ikut syarikat penerbangan.","Search by callsign or filter by airline."],
["m","map",".kp-body","Kad butiran menunjukkan ketinggian, laju dan lapangan terbang terdekat.","The detail card shows altitude, speed and the nearest airport."],
["m","map",".kp-tabs","Tab Lapangan Terbang menyenaraikan semua lapangan terbang. Ketik untuk melihatnya di peta.","The Airports tab lists every airport. Tap one to see it on the map."],
["w","map",".ap","Titik merah berdenyut ialah lapangan terbang. Kodnya tertera di sebelah.","Pulsing red dots are airports. Their code is shown beside them."],
["w","map","","Ketik penanda untuk lihat nama dan fakta, kemudian tekan Uji saya.","Click a marker for its name and a fact, then press Test me."],
["w","quiz","#qbox","Di tab Kuiz, pilih tahap dan mod, kemudian tekan Mula.","In the Quiz tab, pick a level and mode, then press Start."],
["w","quiz","#qbox","Jawab betul berturut-turut untuk menaikkan streak dan markah.","Answer correctly in a row to grow your streak and score."],
["w","quiz","#qbox","Di hujung kuiz, awak dapat pangkat dan boleh kongsi keputusan.","At the end you earn a rank and can share your result."],
["b","learn","#lbox","Belum hafal? Tab Belajar ada flashcard. Ketik kad untuk pusingkan.","Not memorised yet? The Learn tab has flashcards. Tap a card to flip it."],
["b","learn","#lbox .act","Tekan ✓ bila sudah tahu, atau ↻ untuk ulang kemudian.","Press ✓ when you know it, or ↻ to review later."],
["b","board","#bbox","Hantar skor awak ke Papan Markah dan kejar tempat teratas.","Submit your score to the Leaderboard and chase the top spot."],
["b","map","","Itu sahaja! Tekan butang ? bila-bila masa untuk ulang panduan.","That's it! Press the ? button any time to replay this guide."]
];
const U={ms:{next:"Seterusnya",back:"Kembali",skip:"Langkau",done:"Selesai",help:"Panduan"},en:{next:"Next",back:"Back",skip:"Skip",done:"Done",help:"Guide"}};
const u=k=>U[lang][k];

const st=document.createElement("style");
st.textContent=`
.kg{position:fixed;z-index:2000;right:12px;bottom:calc(68px + env(safe-area-inset-bottom));display:flex;align-items:flex-end;gap:8px;max-width:min(460px,calc(100vw - 24px))}
.kg[hidden],.kg-help[hidden]{display:none}
.kg-bubble{position:relative;min-width:0;background:var(--navy2);border:1px solid var(--cyan);border-radius:14px;padding:12px 14px;box-shadow:0 12px 32px rgba(0,0,0,.5)}
.kg-bubble::after{content:"";position:absolute;right:-7px;bottom:30px;width:12px;height:12px;background:var(--navy2);border-right:1px solid var(--cyan);border-top:1px solid var(--cyan);transform:rotate(45deg)}
.kg-bubble p{margin:6px 0 10px;line-height:1.45}
.kg-meta{display:flex;justify-content:space-between;color:var(--muted);font-size:.8rem}
.kg-meta button{padding:0;background:none;color:var(--muted);text-decoration:underline}
.kg-nav{display:flex;gap:6px}.kg-nav button{flex:1;padding:8px 10px}
.kg-nav .cta{margin:0;padding:8px 10px}
.kg-nav button:disabled{opacity:.4;cursor:default}
.kg-pic{flex:none;width:130px;height:150px;display:flex;align-items:flex-end;justify-content:center;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))}
.kg-pic img{max-width:100%;max-height:100%;object-fit:contain}
.kg-pic .em{font-size:84px;line-height:1}
.kg-help{position:fixed;z-index:2000;right:12px;bottom:calc(68px + env(safe-area-inset-bottom));width:44px;height:44px;padding:0;border-radius:50%;background:var(--cyan);color:#04101f;font-weight:800;font-size:1.2rem;box-shadow:0 0 0 4px rgba(59,232,255,.25)}
.kg-help:hover{background:#7df0ff}
.kg-hl{outline:2px solid var(--cyan);outline-offset:-2px;box-shadow:0 0 0 5px rgba(59,232,255,.25)}
@media (max-width:700px){.kg-pic{width:96px;height:112px}.kg-pic .em{font-size:60px}}`;
document.head.appendChild(st);

const box=document.createElement("div");box.className="kg";box.hidden=true;box.setAttribute("role","dialog");box.setAttribute("aria-label","Guide");
const help=document.createElement("button");help.className="kg-help";help.type="button";help.textContent="?";help.hidden=true;
document.body.append(box,help);
let i=0,hl=null;

function mark(sel){
  if(hl)hl.classList.remove("kg-hl");
  hl=sel?document.querySelector(sel):null;
  if(hl)hl.classList.add("kg-hl");
}
function draw(){
  const s=S[i],last=i==S.length-1;
  help.setAttribute("aria-label",u("help"));
  box.innerHTML=`<div class="kg-bubble"><div class="kg-meta"><span>${i+1}/${S.length}</span>${last?"":`<button type="button" data-a="skip">${u("skip")}</button>`}</div><p aria-live="polite">${s[lang=="ms"?3:4]}</p><div class="kg-nav"><button type="button" data-a="back"${i?"":" disabled"}>${u("back")}</button><button type="button" class="cta" data-a="next">${last?u("done"):u("next")}</button></div></div><div class="kg-pic"></div>`;
  const pic=box.querySelector(".kg-pic"),img=new Image();
  img.alt="";
  img.onerror=()=>{
    img.onerror=()=>{pic.innerHTML=`<span class="em">${E[s[0]]}</span>`};
    img.src=`img/characters/arnab-${["berdiri","idea","duduk","jalan"][i%4]}.webp`;
  };
  img.src=`img/guide/step-${String(i+1).padStart(2,"0")}.png`;
  pic.appendChild(img);
}
function show(n){
  i=n;const s=S[i];
  go(s[1]);
  if(s[2].startsWith(".kp")){const k=document.querySelector(".kp.closed .kp-toggle");if(k)k.click()}
  draw();
  setTimeout(()=>mark(s[2]),80);
}
function start(){help.hidden=true;box.hidden=false;show(0)}
function close(){
  mark("");box.hidden=true;help.hidden=false;go("map");
  try{localStorage.setItem("kl-tour","1")}catch(e){}
}
box.addEventListener("click",e=>{
  const a=e.target.closest("[data-a]");if(!a)return;
  if(a.dataset.a=="back"&&i>0)show(i-1);
  else if(a.dataset.a=="next")i<S.length-1?show(i+1):close();
  else if(a.dataset.a=="skip")close();
});
help.onclick=start;
addEventListener("keydown",e=>{if(e.key=="Escape"&&!box.hidden)close()});

const _al=applyLang;
applyLang=function(){_al();if(!box.hidden)draw();help.setAttribute("aria-label",u("help"))};

// First visit: start after the hero card is dismissed. Later visits: just show the ? button.
let done=false;try{done=localStorage.getItem("kl-tour")=="1"}catch(e){}
help.setAttribute("aria-label",u("help"));
if(done)help.hidden=false;
else{const w=setInterval(()=>{if(!document.querySelector(".hero")){clearInterval(w);start()}},500)}
})();
