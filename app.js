const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  nickname: "", twitter: "", tagline: "", about: "", notice: "",
  cardTitle: "orbit://profile.log",
  fontChoice: "pretendard",
  fontScale: "normal",
  accent1: "#8aa9ff", accent2: "#56d7d1",
  cardBg: "#07101f", cardText: "#eef4ff", starColor: "#dce8ff",
  avatar: "", tags: [], pairs: [],
  showBasic: true, showTags: true, showInfo: true, showPairs: true
};

const typeNames = { hero:"헤더형 · 대", card:"카드형 · 중", "card-full":"카드형 · 중 · 전체폭", text:"글자 only · 소", "text-full":"글자 only · 소 · 전체폭", spacer:"빈칸" };

function readFile(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
  });
}
function esc(s=""){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function uid(){ return Math.random().toString(36).slice(2,9); }


const themePresets = {
  abyss: {
    accent1:"#8098ff",
    accent2:"#4fd3cf",
    cardBg:"#07101f",
    cardText:"#eef4ff",
    starColor:"#dce8ff"
  },
  aurora: {
    accent1:"#8a67d6",
    accent2:"#50bfa5",
    cardBg:"#eef7f4",
    cardText:"#263244",
    starColor:"#8aa6bf"
  },
  monochrome: {
    accent1:"#5f6670",
    accent2:"#8a9098",
    cardBg:"#f2f2f0",
    cardText:"#24262a",
    starColor:"#a6a8ab"
  },
  spring: {
    accent1:"#c56f9f",
    accent2:"#78a977",
    cardBg:"#fff4f7",
    cardText:"#4b3b46",
    starColor:"#d6aabd"
  },
  summer: {
    accent1:"#3f87c7",
    accent2:"#3aaea3",
    cardBg:"#eaf8fb",
    cardText:"#173a49",
    starColor:"#79aebf"
  },
  autumn: {
    accent1:"#b8643f",
    accent2:"#9b7b45",
    cardBg:"#fbf1e3",
    cardText:"#4b3327",
    starColor:"#c5a27e"
  },
  winter: {
    accent1:"#6e87c8",
    accent2:"#87b5cf",
    cardBg:"#f4f8fd",
    cardText:"#26354a",
    starColor:"#9bb3cc"
  }
};

function applyPreset(name){
  const p=themePresets[name];
  if(!p)return;
  state.accent1=p.accent1;
  state.accent2=p.accent2;
  state.cardBg=p.cardBg;
  state.cardText=p.cardText;
  state.starColor=p.starColor;

  $("#accent1").value=p.accent1;
  $("#accent2").value=p.accent2;
  $("#cardBg").value=p.cardBg;
  $("#cardText").value=p.cardText;
  $("#starColor").value=p.starColor;

  $$(".preset-grid button").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.preset===name);
  });
  renderPreview();
}
$$("[data-preset]").forEach(btn=>{
  btn.addEventListener("click",()=>applyPreset(btn.dataset.preset));
});

function bindText(id,key){
  const el=$("#"+id);
  el.addEventListener("input",()=>{ state[key]=el.value; renderPreview(); });
}
["nickname","twitter","tagline","about","notice","cardTitle"].forEach(id=>bindText(id,id));
$("#fontChoice").addEventListener("change", async e=>{
  state.fontChoice=e.target.value;
  renderPreview();
  await ensureSelectedFontReady();
  renderPreview();
});
$("#fontScale").addEventListener("change", e=>{
  state.fontScale=e.target.value;
  renderPreview();
});

function clearPresetActive(){ $$(".preset-grid button").forEach(btn=>btn.classList.remove("active")); }
$("#accent1").addEventListener("input", e=>{state.accent1=e.target.value; clearPresetActive(); renderPreview();});
$("#accent2").addEventListener("input", e=>{state.accent2=e.target.value; clearPresetActive(); renderPreview();});
$("#cardBg").addEventListener("input", e=>{state.cardBg=e.target.value; clearPresetActive(); renderPreview();});
$("#cardText").addEventListener("input", e=>{state.cardText=e.target.value; clearPresetActive(); renderPreview();});
$("#starColor").addEventListener("input", e=>{state.starColor=e.target.value; clearPresetActive(); renderPreview();});
$("#avatarInput").addEventListener("change", async e=>{
  const f=e.target.files[0]; if(!f)return; state.avatar=await readFile(f); renderPreview();
});

$("#addTag").addEventListener("click", addTag);
$("#tagInput").addEventListener("keydown", e=>{ if(e.key==="Enter"){e.preventDefault();addTag();}});
function normalizeTags(){
  state.tags = (state.tags || []).map((t, i)=>{
    if(typeof t === "string"){
      const defaults=["platform","account","dream"];
      return {text:t, category:defaults[i%3]};
    }
    return {text:t.text||"", category:t.category||"platform"};
  }).filter(t=>t.text);
}
function addTag(){
  const el=$("#tagInput"), v=el.value.trim(); if(!v)return;
  const category=$("#tagCategory").value || "platform";
  state.tags.push({text:v, category});
  el.value="";
  renderTagEditor();
  renderPreview();
}
function renderTagEditor(){
  normalizeTags();
  const box=$("#tagEditor"); box.innerHTML="";
  state.tags.forEach((t,i)=>{
    const d=document.createElement("span");
    d.className="chip-edit";
    d.dataset.cat=t.category;
    d.innerHTML=`${esc(t.text)} <small>${t.category.toUpperCase()}</small> <button data-i="${i}">×</button>`;
    d.querySelector("button").onclick=()=>{state.tags.splice(i,1);renderTagEditor();renderPreview();};
    box.appendChild(d);
  });
}

$$("[data-add-pair]").forEach(b=>b.addEventListener("click",()=>addPair(b.dataset.addPair)));
function addPair(type){
  state.pairs.push({
    id:uid(), type, name:"", desc:"", image:"",
    imageZoom:1, imageX:50, imageY:50
  });
  renderPairEditor(); renderPreview();
}
function movePair(index,dir){
  const to=index+dir; if(to<0||to>=state.pairs.length)return;
  [state.pairs[index],state.pairs[to]]=[state.pairs[to],state.pairs[index]];
  renderPairEditor(); renderPreview();
}

function normalizePairImageState(p){
  if(typeof p.imageZoom!=="number" || !Number.isFinite(p.imageZoom)) p.imageZoom=1;
  if(typeof p.imageX!=="number" || !Number.isFinite(p.imageX)) p.imageX=50;
  if(typeof p.imageY!=="number" || !Number.isFinite(p.imageY)) p.imageY=50;
  p.imageZoom=Math.min(3,Math.max(1,p.imageZoom));
  p.imageX=Math.min(100,Math.max(0,p.imageX));
  p.imageY=Math.min(100,Math.max(0,p.imageY));
}
function isImagePair(p){
  return ["hero","card","card-full"].includes(p.type);
}
function pairImageInlineStyle(p){
  normalizePairImageState(p);
  return `object-position:${p.imageX}% ${p.imageY}%;--pair-zoom:${p.imageZoom};`;
}

function renderPairEditor(){
  const box=$("#pairEditor"), tpl=$("#pairEditorTemplate");
  box.innerHTML="";
  state.pairs.forEach((p,index)=>{
    normalizePairImageState(p);
    const frag=tpl.content.cloneNode(true);
    const item=$(".pair-edit-item",frag);
    $(".pair-kind",item).textContent=typeNames[p.type] || "빈칸";
    $(".pair-name",item).value=p.name||"";
    $(".pair-desc",item).value=p.desc||"";

    const imageRow=$(".pair-image-row",item);
    const adjust=$(".pair-image-adjust",item);
    const zoom=$(".pair-image-zoom",item);

    if(p.type==="text" || p.type==="text-full"){
      imageRow.classList.add("hidden");
    }else if(isImagePair(p)){
      adjust.classList.remove("hidden");
      zoom.value=String(p.imageZoom);
      zoom.oninput=e=>{
        p.imageZoom=Number(e.target.value);
        renderPreview();
      };
      $(".reset-image-position",item).onclick=()=>{
        p.imageZoom=1;
        p.imageX=50;
        p.imageY=50;
        zoom.value="1";
        renderPreview();
      };
    }

    if(p.type==="spacer"){
      item.classList.add("spacer-editor");
      $$(".pair-name, .pair-desc, .pair-image-row, .pair-image-adjust",item).forEach(el=>{
        const label=el.closest("label");
        if(label) label.classList.add("hidden");
        else el.classList.add("hidden");
      });
    }

    $(".pair-name",item).oninput=e=>{p.name=e.target.value;renderPreview();};
    $(".pair-desc",item).oninput=e=>{p.desc=e.target.value;renderPreview();};
    $(".pair-image",item).onchange=async e=>{
      const f=e.target.files[0];
      if(f){
        p.image=await readFile(f);
        p.imageZoom=1;
        p.imageX=50;
        p.imageY=50;
        renderPreview();
      }
    };
    $(".remove-pair",item).onclick=()=>{
      state.pairs.splice(index,1);
      renderPairEditor();
      renderPreview();
    };
    $(".move-up",item).onclick=()=>movePair(index,-1);
    $(".move-down",item).onclick=()=>movePair(index,1);
    box.appendChild(frag);
  });
}

function bindPairImageDragging(){
  $$(".pair-media-frame[data-pair-id]").forEach(frame=>{
    const id=frame.dataset.pairId;
    const p=state.pairs.find(x=>String(x.id)===String(id));
    if(!p || !p.image || !isImagePair(p)) return;

    frame.onpointerdown=e=>{
      if(e.button!==undefined && e.button!==0) return;
      e.preventDefault();
      const startX=e.clientX, startY=e.clientY;
      const startPX=p.imageX, startPY=p.imageY;
      const rect=frame.getBoundingClientRect();
      frame.setPointerCapture?.(e.pointerId);
      frame.classList.add("dragging");

      const move=ev=>{
        const dx=ev.clientX-startX;
        const dy=ev.clientY-startY;
        p.imageX=Math.min(100,Math.max(0,startPX + (dx/Math.max(1,rect.width))*100));
        p.imageY=Math.min(100,Math.max(0,startPY + (dy/Math.max(1,rect.height))*100));
        const img=$(".pair-media-img",frame);
        if(img) img.style.objectPosition=`${p.imageX}% ${p.imageY}%`;
      };
      const up=ev=>{
        frame.classList.remove("dragging");
        frame.removeEventListener("pointermove",move);
        frame.removeEventListener("pointerup",up);
        frame.removeEventListener("pointercancel",up);
        try{frame.releasePointerCapture?.(ev.pointerId)}catch(_){}
      };
      frame.addEventListener("pointermove",move);
      frame.addEventListener("pointerup",up);
      frame.addEventListener("pointercancel",up);
    };
  });
}

function pairHtml(p){
  if(p.type==="spacer") return `<div class="pair-spacer" aria-hidden="true"></div>`;
  normalizePairImageState(p);
  const name=esc(p.name||"PAIR NAME"), desc=esc(p.desc||"페어 설명을 입력해 주세요.");
  const imgStyle=`object-position:${p.imageX}% ${p.imageY}%;`;

  if(p.type==="hero"){
    return `<article class="pair-hero">
      <div class="pair-media-frame pair-hero-image" data-pair-id="${esc(p.id)}" style="--pair-zoom:${p.imageZoom};">
        <div class="pair-media-canvas">
          ${p.image?`<img class="pair-media-img" src="${p.image}" alt="" draggable="false" style="${imgStyle}">`:""}
        </div>
      </div>
      <div class="pair-copy"><div class="pair-name-out">${name}</div><div class="pair-desc-out">${desc}</div></div>
    </article>`;
  }

  if(p.type==="card" || p.type==="card-full"){
    const full=p.type==="card-full" ? " pair-full" : "";
    return `<article class="pair-card${full}">
      <div class="pair-image-box pair-media-frame" data-pair-id="${esc(p.id)}" style="--pair-zoom:${p.imageZoom};">
        <div class="pair-media-canvas">
          ${p.image?`<img class="pair-media-img" src="${p.image}" alt="" draggable="false" style="${imgStyle}">`:""}
        </div>
      </div>
      <div class="pair-copy"><div class="pair-name-out">${name}</div><div class="pair-desc-out">${desc}</div></div>
    </article>`;
  }

  if(p.type==="text" || p.type==="text-full"){
    const full=p.type==="text-full" ? " pair-full" : "";
    return `<article class="pair-text${full}"><div><div class="pair-name-out">${name}</div></div><div class="pair-desc-out">${desc}</div></article>`;
  }
  return `<div class="pair-spacer" aria-hidden="true"></div>`;
}
async function ensureSelectedFontReady(){
  const families={
    "pretendard": '16px "Noto Sans KR"',
    "noto-sans": '16px "Noto Sans KR"',
    "gowun": '16px "Gowun Dodum"',
    "serif": '16px "Noto Serif KR"',
    "hand": '20px "Nanum Pen Script"'
  };
  try{ await document.fonts.load(families[state.fontChoice]||families["pretendard"]); }catch(e){}
}

function hexToRgb(hex){
  let h=(hex||"").replace("#","").trim();
  if(h.length===3) h=h.split("").map(x=>x+x).join("");
  const n=parseInt(h,16);
  if(Number.isNaN(n)) return {r:0,g:0,b:0};
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}
function rgba(hex,a){
  const {r,g,b}=hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function mixHex(hex1,hex2,t){
  const a=hexToRgb(hex1), b=hexToRgb(hex2);
  const c={
    r:Math.round(a.r+(b.r-a.r)*t),
    g:Math.round(a.g+(b.g-a.g)*t),
    b:Math.round(a.b+(b.b-a.b)*t)
  };
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}
function setSafeThemeVars(){
  const root=document.documentElement.style;
  const bg=state.cardBg||"#07101f";
  const text=state.cardText||"#eef4ff";
  const a1=state.accent1||"#8aa9ff";
  const a2=state.accent2||"#56d7d1";
  const star=state.starColor||"#dce8ff";

  root.setProperty("--card-bg-top",mixHex(bg,"#ffffff",.06));
  root.setProperty("--card-line",rgba(text,.18));
  root.setProperty("--card-line-soft",rgba(text,.10));
  root.setProperty("--card-muted",rgba(text,.72));
  root.setProperty("--card-soft",rgba(text,.55));

  root.setProperty("--surface-1",mixHex(bg,text,.04));
  root.setProperty("--surface-2",mixHex(bg,text,.08));
  root.setProperty("--surface-3",rgba(bg,.82));

  root.setProperty("--a1-soft",rgba(a1,.10));
  root.setProperty("--a1-line",rgba(a1,.42));
  root.setProperty("--a1-glow",rgba(a1,.14));
  root.setProperty("--a2-glow",rgba(a2,.14));

  root.setProperty("--star-74",rgba(star,.74));
  root.setProperty("--star-46",rgba(star,.46));
  root.setProperty("--star-58",rgba(star,.58));
  root.setProperty("--star-48",rgba(star,.48));
  root.setProperty("--star-43",rgba(star,.43));

  root.setProperty("--hero-grad-42",rgba(a1,.42));
  root.setProperty("--hero-grad-18",rgba(a1,.18));
  root.setProperty("--pair-image-1",mixHex(bg,a1,.24));
  root.setProperty("--pair-image-2",mixHex(bg,a2,.18));
}


["showBasic","showTags","showInfo","showPairs"].forEach(key=>{
  const el=$("#"+key);
  if(el){
    el.addEventListener("change",()=>{
      state[key]=el.checked;
      renderPreview();
    });
  }
});

function renderPreview(){
  document.documentElement.style.setProperty("--a1",state.accent1);
  document.documentElement.style.setProperty("--a2",state.accent2);
  document.documentElement.style.setProperty("--card-bg",state.cardBg||"#07101f");
  document.documentElement.style.setProperty("--card-text",state.cardText||"#eef4ff");
  document.documentElement.style.setProperty("--star-color",state.starColor||"#dce8ff");
  setSafeThemeVars();
  $("#pNickname").textContent=state.nickname||"YOUR NAME";
  $("#pTwitter").textContent=state.twitter||"@twitter_id";
  $("#pTagline").textContent=state.tagline||"별과 바다 사이를 유영하는 계정";
  $("#pAbout").textContent=state.about||"소개를 입력해 주세요.";
  $("#pNotice").textContent=state.notice||"주의사항을 입력해 주세요.";
  $("#pCardTitle").textContent=state.cardTitle||"orbit://profile.log";

  $("#pBasic").hidden = state.showBasic === false;
  $("#pTags").hidden = state.showTags === false;
  $("#pInfo").hidden = state.showInfo === false;
  $("#pPairSection").hidden = state.showPairs === false;

  const card=$("#card");
  [...card.classList].filter(c=>c.startsWith("font-")||c.startsWith("size-")).forEach(c=>card.classList.remove(c));
  card.classList.add("font-"+(state.fontChoice||"pretendard"));
  card.classList.add("size-"+(state.fontScale||"normal"));
  const img=$("#pAvatar"), fb=$("#avatarFallback");
  if(state.avatar){img.src=state.avatar;img.style.display="block";fb.style.display="none";}else{img.removeAttribute("src");img.style.display="none";fb.style.display="grid";}
  normalizeTags();
  ["platform","account","dream","genre"].forEach(cat=>{
    const row=$(`[data-tag-group="${cat}"]`);
    const chips=$(".tag-group-chips",row);
    const items=state.tags.filter(t=>t.category===cat);
    chips.innerHTML=items.map(t=>`<span class="chip">${esc(t.text)}</span>`).join("");
    row.style.display=items.length ? "grid" : "none";
  });
  $("#pPairs").innerHTML=state.pairs.map(pairHtml).join("");
  $("#emptyPairs").style.display=state.pairs.length?"none":"block";
  bindPairImageDragging();
}

$("#downloadPng").addEventListener("click", async ()=>{
  const btn=$("#downloadPng"), old=btn.textContent; btn.disabled=true; btn.textContent="렌더링 중…";
  try{
    await ensureSelectedFontReady();
    await document.fonts.ready;
    const cardEl=$("#card");
    setSafeThemeVars();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const rect=cardEl.getBoundingClientRect();
    const captureWidth=Math.ceil(rect.width);
    const captureHeight=Math.ceil(rect.height);
    const canvas=await html2canvas(cardEl,{
      scale:2,
      backgroundColor:null,
      useCORS:true,
      allowTaint:false,
      logging:false,
      imageTimeout:15000,
      width:captureWidth,
      height:captureHeight,
      scrollX:0,
      scrollY:-window.scrollY
    });
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
    if(!blob) throw new Error("PNG blob 생성 실패");
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.download=`${(state.nickname||"profile").replace(/[\\/:*?"<>|]/g,"_")}_maincard.png`;
    a.href=url;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(err){
    console.error("PNG export failed:",err);
    alert("PNG 저장에 실패했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요. 계속 실패하면 오류 내용을 알려주세요: " + (err?.message || err));
  }finally{btn.disabled=false;btn.textContent=old;}
});

$("#exportJson").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="abyssal-orbit-work.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
$("#importJson").addEventListener("change",async e=>{
  const f=e.target.files[0]; if(!f)return;
  try{
    const data=JSON.parse(await f.text());
    Object.assign(state,data);
    ["showBasic","showTags","showInfo","showPairs"].forEach(k=>{
      if(typeof state[k] !== "boolean") state[k]=true;
    });
    if(!Array.isArray(state.pairs)) state.pairs=[];
    state.pairs.forEach(normalizePairImageState);
    syncControls(); renderTagEditor(); renderPairEditor(); renderPreview();
  }catch{alert("올바른 작업 파일이 아니에요.");}
});
function syncControls(){
  ["nickname","twitter","tagline","about","notice","cardTitle","fontChoice","fontScale","accent1","accent2","cardBg","cardText","starColor"].forEach(k=>{
    const el=$("#"+k); if(el && state[k]!=null) el.value=state[k];
  });
  ["showBasic","showTags","showInfo","showPairs"].forEach(k=>{
    const el=$("#"+k); if(el) el.checked=state[k] !== false;
  });
}
syncControls();renderTagEditor();renderPairEditor();renderPreview();
