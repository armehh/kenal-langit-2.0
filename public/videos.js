// KenalLangit "Video" tab: curated YouTube aviation videos. Load AFTER tour.js (this replaces podcast.js).
// Tap a card to watch inside the page (YouTube player), or use the YouTube link to open it on YouTube.
// Needs: img/characters/pramugari-lambai.webp and the .coach/.bubble/.rabbit styles from characters.js
(()=>{
  // ===================== EDIT HERE: add a video by copying one line =====================
  // [YouTube link or 11-character ID, category, title, channel name (or "")]
  // Categories: galley (cabin crew life) | msia (Malaysia) | learn (learn aviation)
  const VIDEOS=[
  ["https://www.youtube.com/watch?v=0hCCrEcVxYw","galley","Borak Dalam Galley EP 183 - Faizol Is Back!!","Borak Dalam Galley"],
  ["https://www.youtube.com/watch?v=OTBWY3DWXIA","galley","Borak Dalam Galley EP 115 feat Spacedollah - Parents Ingat Sy Jadi Engineer di Emirates","Borak Dalam Galley"],
  ["https://www.youtube.com/watch?v=1ZSQEVbbmYQ","galley","Borak Dalam Galley EP 168 feat Syara - Pakcik Saya Dah Panggil Saya Stewardess Dari Kecik","Borak Dalam Galley"],
  ["https://www.youtube.com/watch?v=6xlja5VW3NA","galley","Double Special - Borak Dalam Galley EP 200 feat Syara dan Faizol","Borak Dalam Galley"],
  ["https://www.youtube.com/watch?v=6aBZ1UQyA7k","galley","Borak Dalam Galley EP 162 feat Ejad Shukri - Sessi Throwback Bersama Fiza Kamaruzzaman","Borak Dalam Galley"],
  ["https://www.youtube.com/watch?v=oPmoc2qV5Os","galley","Ejad Lagi! Borak Dalam Galley EP 205 feat Ejad","Borak Dalam Galley"],
  ["https://www.youtube.com/watch?v=DRku7KotNic","msia","Landing in Kuala Lumpur International Airport - Malaysia",""],
  ["https://www.youtube.com/watch?v=U_RhhH7Cxng","msia","Building Malaysia's Kuala Lumpur International Airport",""],
  ["https://www.youtube.com/watch?v=N1NoIVea1V0","msia","The Journey of Malaysia Airlines' First 737-8",""],
  ["https://www.youtube.com/watch?v=4lBgvUV7N3I","msia","This Is NOT the KLIA You Remember",""],
  ["https://www.youtube.com/watch?v=1qoRmeOI_28","learn","What Are Airport Codes? Understanding IATA and ICAO Codes",""],
  ["https://www.youtube.com/watch?v=y6g7xCyp8YM","learn","Air Traffic Control 101",""],
  ["https://www.youtube.com/watch?v=6OkJR6d5AoE","learn","How Air Traffic Control Works",""]
  ];
  // =====================================================================================
  
  const BASE="img/characters/";
  const X={
  ms:{tab:"Video",title:"Video Aviation",
    sub:"Pilihan video aviation, termasuk rancangan Borak Dalam Galley. Ketik video untuk tonton di sini, atau buka terus di YouTube.",
    hi:"Jom tengok video aviation pilihan kami!",
    all:"Semua",galley:"Kerjaya kru kabin",msia:"Malaysia",learn:"Belajar aviation",
    play:"Tonton di sini",yt:"Buka di YouTube",back:"← Senarai video",prev:"Sebelum",next:"Seterusnya",
    noembed:"Video tidak dapat dimainkan di sini? Buka di YouTube.",
    empty:"Tiada video dalam kategori ini.",
    credit:"Video dimiliki oleh pencipta masing-masing dan dimainkan oleh YouTube. KenalLangit hanya memaparkan pautan."},
  en:{tab:"Videos",title:"Aviation Videos",
    sub:"A hand-picked list of aviation videos, including the Borak Dalam Galley podcast. Tap a video to watch it here, or open it on YouTube.",
    hi:"Let's watch some aviation videos we picked for you!",
    all:"All",galley:"Cabin crew life",msia:"Malaysia",learn:"Learn aviation",
    play:"Watch here",yt:"Open on YouTube",back:"← Video list",prev:"Previous",next:"Next",
    noembed:"Video will not play here? Open it on YouTube.",
    empty:"No videos in this category.",
    credit:"Videos belong to their creators and are played by YouTube. KenalLangit only shows links."}
  };
  const x=k=>X[lang][k];
  const CATS=["all","galley","msia","learn"];
  
  // Accepts a full YouTube link (watch, youtu.be, shorts, embed) or a bare 11-character ID
  const vid=u=>{const m=String(u).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);return m?m[1]:(/^[\w-]{11}$/.test(String(u))?String(u):null)};
  const LIST=VIDEOS.map(v=>({id:vid(v[0]),c:v[1],t:v[2],by:v[3]||""})).filter(v=>v.id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ytUrl=id=>`https://www.youtube.com/watch?v=${id}`;
  const inCat=()=>LIST.filter(v=>filter=="all"||v.c==filter);
  
  let sec,navBtn,box,filter="all",cur=null;
  
  // ---------- styles ----------
  const st=document.createElement("style");
  st.textContent=`
  .panel.vd{max-width:900px}
  .vd h2{margin:0 0 6px}
  .vd .sub{color:var(--muted);line-height:1.45;margin-bottom:6px}
  .vd .chips{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
  .vd .chips button{padding:6px 12px;border-radius:999px;font-size:.85rem}
  .vd .chips button.on{background:var(--cyan);color:#04101f;font-weight:700}
  .vd-grid{display:grid;gap:12px;grid-template-columns:1fr}
  @media (min-width:700px){.vd-grid{grid-template-columns:1fr 1fr}}
  .vd-card{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:14px;background:var(--navy2);overflow:hidden}
  .vd-play{display:flex;flex-direction:column;gap:6px;width:100%;text-align:left;padding:0;border-radius:0;background:none}
  .vd-play:hover{background:rgba(36,87,214,.12)}
  .vd-th{position:relative;display:block;aspect-ratio:16/9;background:linear-gradient(135deg,#12275a,#0a8fb0)}
  .vd-th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .vd-th i{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;background:rgba(6,11,24,.75);border:2px solid var(--cyan);color:var(--cyan);display:flex;align-items:center;justify-content:center;font-style:normal;font-size:1.1rem;padding-left:3px}
  .vd-t{padding:2px 12px 0;font-weight:700;line-height:1.35;font-size:.95rem}
  .vd-by{padding:0 12px;color:var(--muted);font-size:.8rem}
  .vd-yt{margin:8px 12px 12px;align-self:flex-start;color:var(--cyan);font-size:.85rem;text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px}
  .vd-yt:hover{background:var(--line)}
  .vd-frame{position:relative;aspect-ratio:16/9;margin:10px 0;border-radius:14px;overflow:hidden;background:#000;border:1px solid var(--line)}
  .vd-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
  .vd-now{font-size:1.1rem;font-weight:700;line-height:1.35;margin:4px 0}
  .vd-note{color:var(--muted);font-size:.85rem;margin:6px 0 2px}
  .vd-ctl{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.vd-ctl button,.vd-ctl a{flex:1;min-width:110px;text-align:center;padding:10px 8px;margin:0;text-decoration:none;border-radius:10px;font-weight:700}
  .vd-ctl a.cta{flex:2;color:var(--text)}
  .vd-credit{color:var(--muted);font-size:.75rem;margin-top:16px;line-height:1.4}
  .vd-empty{color:var(--muted);text-align:center;padding:26px 8px}
  nav button{min-width:0}nav button b{white-space:nowrap}
  @media (max-width:420px){nav button b{font-size:.7rem}}`;
  document.head.appendChild(st);
  
  // ---------- DOM ----------
  sec=document.createElement("section");sec.id="video";
  sec.innerHTML=`<div class="panel vd"><div class="card" id="vdbox"></div></div>`;
  $("main").appendChild(sec);box=$("#vdbox");
  navBtn=document.createElement("button");navBtn.dataset.tab="video";navBtn.innerHTML=`<span>▶️</span><b></b>`;
  $("nav").insertBefore(navBtn,$('nav [data-tab="board"]'));
  navBtn.onclick=()=>go("video");
  const label=()=>{navBtn.querySelector("b").textContent=x("tab")};label();
  
  // ---------- list view ----------
  const host=()=>`<div class="coach"><img class="rabbit" src="${BASE}pramugari-lambai.webp" alt="" width="63" height="110" decoding="async"><div class="bubble">${x("hi")}</div></div>`;
  function card(v){
    const i=LIST.indexOf(v);
    return `<div class="vd-card">
      <button type="button" class="vd-play" data-i="${i}" aria-label="${esc(x("play"))}: ${esc(v.t)}">
        <span class="vd-th"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><i aria-hidden="true">▶</i></span>
        <span class="vd-t">${esc(v.t)}</span>${v.by?`<span class="vd-by">${esc(v.by)}</span>`:""}
      </button>
      <a class="vd-yt" href="${ytUrl(v.id)}" target="_blank" rel="noopener noreferrer">↗ ${x("yt")}</a>
    </div>`;
  }
  function drawList(){
    cur=null;
    const l=inCat();
    box.innerHTML=`<h2>${x("title")}</h2><p class="sub">${x("sub")}</p>${host()}
    <div class="chips" role="group">${CATS.map(c=>`<button type="button" data-c="${c}"${c==filter?' class="on"':""}>${x(c)}</button>`).join("")}</div>
    ${l.length?`<div class="vd-grid">${l.map(card).join("")}</div>`:`<p class="vd-empty">${x("empty")}</p>`}
    <p class="vd-credit">${x("credit")}</p>`;
    $$("#vdbox .chips button").forEach(b=>b.onclick=()=>{filter=b.dataset.c;drawList()});
    $$("#vdbox .vd-play").forEach(b=>b.onclick=()=>openVideo(+b.dataset.i));
    $$("#vdbox .vd-th img").forEach(im=>im.onerror=()=>im.remove());
  }
  
  // ---------- player view ----------
  function openVideo(i){
    cur=i;const v=LIST[i];
    box.innerHTML=`<button type="button" id="vdback">${x("back")}</button>
    <div class="vd-frame"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0" title="${esc(v.t)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    <div id="vdinfo"></div>`;
    $("#vdback").onclick=drawList;
    drawInfo();
  }
  // Text and buttons only, so a language change never restarts the video
  function drawInfo(){
    const v=LIST[cur],l=inCat(),k=l.indexOf(v),has=k>=0&&l.length>1;
    $("#vdinfo").innerHTML=`<p class="vd-now">${esc(v.t)}</p>${v.by?`<p class="vd-by" style="padding:0">${esc(v.by)}</p>`:""}
    <p class="vd-note">${x("noembed")}</p>
    <div class="vd-ctl">
      <a class="cta" href="${ytUrl(v.id)}" target="_blank" rel="noopener noreferrer">↗ ${x("yt")}</a>
      ${has?`<button type="button" id="vdprev">${x("prev")}</button><button type="button" id="vdnext">${x("next")}</button>`:""}
    </div>`;
    if(has){
      $("#vdprev").onclick=()=>openVideo(LIST.indexOf(l[(k-1+l.length)%l.length]));
      $("#vdnext").onclick=()=>openVideo(LIST.indexOf(l[(k+1)%l.length]));
    }
  }
  
  // ---------- hooks into the existing app ----------
  const _go=go;
  go=function(tab){
    // leaving the tab stops the video by dropping the player
    if(tab!=="video"&&sec.classList.contains("on")&&cur!==null)drawList();
    _go(tab);
    if(tab==="video"&&!box.innerHTML)drawList();
  };
  const _al=applyLang;
  applyLang=function(){
    _al();label();
    if(!sec.classList.contains("on")&&!box.innerHTML)return;
    if(cur===null)drawList();
    else{const b=$("#vdback");if(b)b.textContent=x("back");drawInfo()}
  };
  })();