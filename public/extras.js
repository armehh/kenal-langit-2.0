// KenalLangit extras: load AFTER the main script. Wraps existing functions, does not replace the main file.
(()=>{
const X={
ms:{h1:"Kenal langit, ",h2:"hafal lapangan terbang.",sub:"Teroka lapangan terbang Malaysia di peta, kemudian uji sejauh mana awak kenal kod dan namanya.",quiz:"Mula kuiz",explore:"Teroka peta",test:"Uji saya",share:"Kongsi keputusan",copied:"Disalin!",r4:"Kapten",r3:"Pegawai Pertama",r2:"Juruterbang Pelatih",r1:"Penumpang Setia",
  msg:(r,s,n)=>`Saya dapat pangkat ${r} dalam KenalLangit (${s}/${n} betul). Awak kenal berapa banyak lapangan terbang Malaysia?`},
en:{h1:"Know the skies, ",h2:"know your airports.",sub:"Explore Malaysia's airports on the map, then test how well you know their codes and names.",quiz:"Start quiz",explore:"Explore map",test:"Test me",share:"Share result",copied:"Copied!",r4:"Captain",r3:"First Officer",r2:"Trainee Pilot",r1:"Loyal Passenger",
  msg:(r,s,n)=>`I earned the rank of ${r} in KenalLangit (${s}/${n} correct). How many Malaysian airports do you know?`}
};
const x=k=>X[lang][k];

// 1. Hero card on the map (once per browser session)
const hero=document.createElement("div");hero.className="hero";
L.DomEvent.disableClickPropagation(hero);
function hideHero(){hero.remove();try{sessionStorage.setItem("kl-hero","1")}catch(e){}}
function drawHero(){
  hero.innerHTML=`<h1>${x("h1")}<span>${x("h2")}</span></h1><p>${x("sub")}</p><div class="row"><button class="cta" id="hq" style="margin:0">${x("quiz")}</button><button id="he">${x("explore")}</button></div>`;
  hero.querySelector("#hq").onclick=()=>{hideHero();go("quiz")};
  hero.querySelector("#he").onclick=hideHero;
}
let seen=false;try{seen=sessionStorage.getItem("kl-hero")=="1"}catch(e){}
if(!seen){drawHero();$("#map").appendChild(hero)}
const _al=applyLang;
applyLang=function(){_al();if(hero.isConnected)drawHero()};

// 2. Airport code labels + "Test me" button in popups
const _bm=buildMarkers;
buildMarkers=function(){
  _bm();
  apLayer.getLayers().forEach((m,i)=>{
    const a=AIRPORTS[i];
    m.bindTooltip(a.iata,{permanent:true,direction:"right",offset:[8,0],className:"aplabel"});
    m.setPopupContent(m.getPopup().getContent()+`<br><button class="popbtn" data-q="${a.iata}">${x("test")}</button>`);
  });
};
map.on("popupopen",e=>{
  const b=e.popup.getElement().querySelector(".popbtn");if(!b)return;
  b.onclick=()=>{
    const a=AIRPORTS.find(z=>z.iata==b.dataset.q);map.closePopup();
    Q={pool:AIRPORTS,list:[a,...shuffle(AIRPORTS.filter(z=>z!==a)).slice(0,9)],i:0,score:0,streak:0,missed:[],opts:null,finished:false};
    go("quiz");ask();
  };
});

// 3. Cultural fact on the back of flashcards
const _bc=buildCards;
buildCards=function(){
  _bc();
  $$("#lbox .fc").forEach(b=>{
    if(!flip[b.dataset.f])return;
    const a=AIRPORTS.find(z=>z.iata==b.dataset.f);
    b.insertAdjacentHTML("beforeend",`<small style="display:block;margin-top:6px">${a.fact[lang]}</small>`);
  });
};

// 4. Rank title and share button on the result screen
const _fin=finish;
finish=function(){
  _fin();
  const n=Q.list.length,ok=n-Q.missed.length,p=ok/n,k=p>=.9?4:p>=.7?3:p>=.4?2:1;
  const r=x("r"+k);
  $("#qbox h2").insertAdjacentHTML("afterend",`<div class="rank">${["","🧳","🎓","👨‍✈️","🏅"][k]} ${r}</div>`);
  const sb=document.createElement("button");sb.className="cta";sb.style.background="#14264d";sb.textContent=x("share");
  sb.onclick=async()=>{
    const text=x("msg")(r,ok,n);
    try{
      if(navigator.share)await navigator.share({text,url:location.href});
      else{await navigator.clipboard.writeText(text+" "+location.href);sb.textContent=x("copied")}
    }catch(e){}
  };
  $("#again").before(sb);
};

buildMarkers();
})();
