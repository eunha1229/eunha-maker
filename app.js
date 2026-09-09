const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  nickname: "", twitter: "", tagline: "", about: "", notice: "",
  cardTitle: "orbit://profile.log",
  accent1: "#8aa9ff", accent2: "#56d7d1",
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

function bindText(id,key){
  const el=$("#"+id);
  el.addEventListener("input",()=>{ state[key]=el.value; renderPreview(); });
}
["nickname","twitter","tagline","about","notice","cardTitle"].forEach(id=>bindText(id,id));

$("#accent1").addEventListener("input", e=>{state.accent1=e.target.value; renderPreview();});
$("#accent2").addEventListener("input", e=>{state.accent2=e.target.value; renderPreview();});
$("#avatarInput").addEventListener("change", async e=>{
  const f=e.target.files[0]; if(!f)return; state.avatar=await readFile(f); renderPreview();
});

$("#addTag").addEventListener("click", addTag);
$("#tagInput").addEventListener("keydown", e=>{ if(e.key==="Enter"){e.preventDefault();addTag();}});
function addTag(){
  const el=$("#tagInput"), v=el.value.trim(); if(!v)return;
  state.tags.push(v); el.value=""; renderTagEditor(); renderPreview();
}
function renderTagEditor(){
  const box=$("#tagEditor"); box.innerHTML="";
  state.tags.forEach((t,i)=>{
    const d=document.createElement("span"); d.className="chip-edit";
    d.innerHTML=`${esc(t)} <button data-i="${i}">×</button>`;
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
  if(p.type==="hero") return `<article class="pair-hero">${p.image?`<img src="${p.image}" alt="">`:""}<div class="pair-copy"><p class="micro">MAJOR CONSTELLATION</p><div class="pair-name-out">${name}</div><div class="pair-desc-out">${desc}</div></div></article>`;
  if(p.type==="card") return `<article class="pair-card"><div class="pair-image-box">${p.image?`<img src="${p.image}" alt="">`:""}</div><div class="pair-copy"><p class="micro">ORBITAL LINK</p><div class="pair-name-out">${name}</div><div class="pair-desc-out">${desc}</div></div></article>`;
  return `<article class="pair-text"><div><p class="micro">SIGNAL</p><div class="pair-name-out">${name}</div></div><div class="pair-desc-out">${desc}</div></article>`;
}
function renderPreview(){
  document.documentElement.style.setProperty("--a1",state.accent1);
  document.documentElement.style.setProperty("--a2",state.accent2);
  $("#pNickname").textContent=state.nickname||"YOUR NAME";
  $("#pTwitter").textContent=state.twitter||"@twitter_id";
  $("#pTagline").textContent=state.tagline||"별과 바다 사이를 유영하는 계정";
  $("#pAbout").textContent=state.about||"소개를 입력해 주세요.";
  $("#pNotice").textContent=state.notice||"주의사항을 입력해 주세요.";
  $("#pCardTitle").textContent=state.cardTitle||"orbit://profile.log";
  const img=$("#pAvatar"), fb=$("#avatarFallback");
  if(state.avatar){img.src=state.avatar;img.style.display="block";fb.style.display="none";}else{img.removeAttribute("src");img.style.display="none";fb.style.display="grid";}
  $("#pTags").innerHTML=state.tags.map(t=>`<span class="chip">${esc(t)}</span>`).join("");
  $("#pPairs").innerHTML=state.pairs.map(pairHtml).join("");
  $("#emptyPairs").style.display=state.pairs.length?"none":"block";
}

$("#downloadPng").addEventListener("click", async ()=>{
  const btn=$("#downloadPng"), old=btn.textContent; btn.disabled=true; btn.textContent="렌더링 중…";
  try{
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
  ["nickname","twitter","tagline","about","notice","cardTitle","accent1","accent2"].forEach(k=>{
    const el=$("#"+k); if(el && state[k]!=null) el.value=state[k];
  });
}
syncControls();renderTagEditor();renderPairEditor();renderPreview();
