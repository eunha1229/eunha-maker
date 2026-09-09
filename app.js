const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  nickname: "", twitter: "", tagline: "", about: "", notice: "",
  cardTitle: "orbit://profile.log",
  fontChoice: "pretendard",
  fontScale: "normal",
  accent1: "#8aa9ff", accent2: "#56d7d1",
  cardBg: "#07101f", cardText: "#eef4ff", starColor: "#dce8ff",
  avatar: "", tags: [], pairs: []
};

const typeNames = { hero:"헤더형 · 대", card:"카드형 · 중", text:"글자 only · 소" };

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
  state.pairs.push({id:uid(),type,name:"",desc:"",image:""});
  renderPairEditor(); renderPreview();
}
function movePair(index,dir){
  const to=index+dir; if(to<0||to>=state.pairs.length)return;
  [state.pairs[index],state.pairs[to]]=[state.pairs[to],state.pairs[index]];
  renderPairEditor(); renderPreview();
}
function renderPairEditor(){
  const box=$("#pairEditor"), tpl=$("#pairEditorTemplate");
  box.innerHTML="";
  state.pairs.forEach((p,index)=>{
    const frag=tpl.content.cloneNode(true);
    const item=$(".pair-edit-item",frag);
    $(".pair-kind",item).textContent=typeNames[p.type];
    $(".pair-name",item).value=p.name;
    $(".pair-desc",item).value=p.desc;
    if(p.type==="text") $(".pair-image-row",item).classList.add("hidden");
    $(".pair-name",item).oninput=e=>{p.name=e.target.value;renderPreview();};
    $(".pair-desc",item).oninput=e=>{p.desc=e.target.value;renderPreview();};
    $(".pair-image",item).onchange=async e=>{const f=e.target.files[0]; if(f){p.image=await readFile(f);renderPreview();}};
    $(".remove-pair",item).onclick=()=>{state.pairs.splice(index,1);renderPairEditor();renderPreview();};
    $(".move-up",item).onclick=()=>movePair(index,-1);
    $(".move-down",item).onclick=()=>movePair(index,1);
    box.appendChild(frag);
  });
}
function pairHtml(p){
  const name=esc(p.name||"PAIR NAME"), desc=esc(p.desc||"페어 설명을 입력해 주세요.");
  if(p.type==="hero") return `<article class="pair-hero">${p.image?`<img src="${p.image}" alt="">`:""}<div class="pair-copy"><div class="pair-name-out">${name}</div><div class="pair-desc-out">${desc}</div></div></article>`;
  if(p.type==="card") return `<article class="pair-card"><div class="pair-image-box">${p.image?`<img src="${p.image}" alt="">`:""}</div><div class="pair-copy"><div class="pair-name-out">${name}</div><div class="pair-desc-out">${desc}</div></div></article>`;
  return `<article class="pair-text"><div><div class="pair-name-out">${name}</div></div><div class="pair-desc-out">${desc}</div></article>`;
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
function renderPreview(){
  document.documentElement.style.setProperty("--a1",state.accent1);
  document.documentElement.style.setProperty("--a2",state.accent2);
  document.documentElement.style.setProperty("--card-bg",state.cardBg||"#07101f");
  document.documentElement.style.setProperty("--card-text",state.cardText||"#eef4ff");
  document.documentElement.style.setProperty("--star-color",state.starColor||"#dce8ff");
  $("#pNickname").textContent=state.nickname||"YOUR NAME";
  $("#pTwitter").textContent=state.twitter||"@twitter_id";
  $("#pTagline").textContent=state.tagline||"별과 바다 사이를 유영하는 계정";
  $("#pAbout").textContent=state.about||"소개를 입력해 주세요.";
  $("#pNotice").textContent=state.notice||"주의사항을 입력해 주세요.";
  $("#pCardTitle").textContent=state.cardTitle||"orbit://profile.log";
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
}

$("#downloadPng").addEventListener("click", async ()=>{
  const btn=$("#downloadPng"), old=btn.textContent; btn.disabled=true; btn.textContent="렌더링 중…";
  try{
    await ensureSelectedFontReady();
    await document.fonts.ready;
    const canvas=await html2canvas($("#card"),{
      scale:2.5, backgroundColor:null, useCORS:true, logging:false,
      imageTimeout:0
    });
    const a=document.createElement("a");
    a.download=`${(state.nickname||"profile").replace(/[\\/:*?"<>|]/g,"_")}_maincard.png`;
    a.href=canvas.toDataURL("image/png");
    a.click();
  }catch(err){
    console.error(err); alert("PNG 저장 중 오류가 발생했어요. 다른 브라우저에서 다시 시도해 주세요.");
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
    const data=JSON.parse(await f.text()); Object.assign(state,data);
    syncControls(); renderTagEditor(); renderPairEditor(); renderPreview();
  }catch{alert("올바른 작업 파일이 아니에요.");}
});
function syncControls(){
  ["nickname","twitter","tagline","about","notice","cardTitle","fontChoice","fontScale","accent1","accent2","cardBg","cardText","starColor"].forEach(k=>{
    const el=$("#"+k); if(el && state[k]!=null) el.value=state[k];
  });
}
syncControls();renderTagEditor();renderPairEditor();renderPreview();
