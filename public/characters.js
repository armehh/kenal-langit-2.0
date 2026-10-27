// KenalLangit characters: Arnab (rabbit mascot) plus the two cabin crew, Pramugara and Pramugari,
// who take turns guiding the quiz. Load AFTER extras.js.
// Needs: img/characters/arnab-{berdiri,idea,duduk,jalan}.webp
//        img/characters/{pramugara,pramugari}-{berdiri,lambai,tunjuk,tiket,bagus}.webp
(()=>{
const BASE="img/characters/";
// width/height are the source image size, so the layout stays stable while an image loads
const CAST={
  arnab:{poses:["berdiri","idea","duduk","jalan"],w:310,h:587},
  pramugara:{poses:["lambai","tunjuk","bagus"],w:332,h:560},
  pramugari:{poses:["lambai","tunjuk","bagus"],w:321,h:560}
};
Object.entries(CAST).forEach(([who,o])=>o.poses.forEach(p=>{new Image().src=`${BASE}${who}-${p}.webp`}));
// Quiz answers: the three guides take turns, one per question
const TURN=["arnab","pramugari","pramugara"];

const C={
  ms:{tip:"Tip:",setup:"Jom uji pengetahuan awak tentang lapangan terbang Malaysia!",bye:"Terima kasih sudah bermain! Cuba lagi untuk pangkat yang lebih tinggi."},
  en:{tip:"Tip:",setup:"Let's test what you know about Malaysian airports!",bye:"Thanks for playing! Try again for a higher rank."}
};
const c=k=>C[lang][k];
const img=(pose,cls="rabbit",who="arnab")=>{
  const o=CAST[who];
  return `<img class="${cls}" src="${BASE}${who}-${pose}.webp" alt="" width="${Math.round(110*o.w/o.h)}" height="110" decoding="async">`;
};
const coach=(who,pose,html)=>`<div class="coach">${img(pose,"rabbit",who)}<div class="bubble">${html}</div></div>`;

const st=document.createElement("style");
st.textContent=`
.rabbit{height:110px;width:auto;flex:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.45))}
.coach{display:flex;align-items:flex-end;gap:12px;margin-top:14px;animation:klfade .35s ease}
.bubble{position:relative;flex:1;background:#14264d;border:1px solid var(--line);border-radius:14px;padding:10px 12px;font-size:.9rem;line-height:1.4}
.bubble::before{content:"";position:absolute;left:-7px;bottom:18px;width:12px;height:12px;background:#14264d;border-left:1px solid var(--line);border-bottom:1px solid var(--line);transform:rotate(45deg)}
.bubble b{color:var(--yellow)}
.mascot-hero{display:block;height:130px;width:auto;margin:-84px auto 4px;filter:drop-shadow(0 6px 12px rgba(0,0,0,.5))}
`;
document.head.appendChild(st);

// 1. Rabbit peeking over the hero card (extras.js rebuilds the card on language change, so re-dress it)
const dressHero=h=>{if(!h.querySelector(".mascot-hero"))h.insertAdjacentHTML("afterbegin",img("berdiri","mascot-hero"))};
function watchHero(h){dressHero(h);new MutationObserver(()=>dressHero(h)).observe(h,{childList:true})}
const h0=$(".hero");if(h0)watchHero(h0);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
  if(n.classList&&n.classList.contains("hero"))watchHero(n);
}))).observe($("#map"),{childList:true});

// 2. Quiz: welcome on the setup screen, a fact after every answer, goodbye on the result screen
function paint(){
  if(!Q){
    if($("#go")&&!$("#qbox .coach"))$("#qbox h2").insertAdjacentHTML("afterend",coach("pramugara","lambai",c("setup")));
    return;
  }
  if(Q.finished){
    if($("#again")&&!$("#qbox .coach")){
      const anchor=$("#qbox .rank")||$("#qbox h2");
      anchor.insertAdjacentHTML("afterend",coach("pramugari","bagus",c("bye")));
    }
    return;
  }
  const fb=$("#fb");
  if(fb&&fb.textContent&&$("#opts .ok")&&!$("#qbox .coach")){
    const cur=Q.list[Q.i],wrong=!!$("#opts .no"),who=TURN[Q.i%TURN.length];
    const pose=who=="arnab"?(wrong?"idea":"jalan"):(wrong?"tunjuk":"bagus");
    fb.insertAdjacentHTML("afterend",coach(who,pose,(wrong?`<b>${c("tip")}</b> `:"")+cur.fact[lang]));
  }
}
new MutationObserver(paint).observe($("#qbox"),{childList:true,subtree:true});
paint();
})();
