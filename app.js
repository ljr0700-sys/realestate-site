import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;
let currentProfile = null;
let settings = { post_points: 10, verify_points: 10, comment_points: 5, approval_status: "승인 전" };

const $ = (id) => document.getElementById(id);
const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];
const escapeHTML = (v="") => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = (v) => v ? new Date(v).toLocaleString("ko-KR") : "-";
const msg = (el, text, ok=true) => { if(!el) return; el.textContent=text; el.className="message "+(ok?"success":"error"); };
async function sha256(text){ const data=new TextEncoder().encode(text); const hash=await crypto.subtle.digest("SHA-256",data); return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join(""); }

function showView(id){
  qsa(".view").forEach(v=>v.classList.toggle("active",v.id===id));
  qsa("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id && b.classList.contains("nav-btn")));
  $("mainNav")?.classList.remove("open");
  if(id==="market") loadPosts();
  if(id==="virtual") loadVirtuals();
  if(id==="community") loadCommunity();
  if(id==="rewards") loadRewards();
  if(id==="mypage") loadMyPage();
  if(id==="admin") loadAdmin();
  window.scrollTo({top:0,behavior:"smooth"});
}
qsa("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("menuToggle")?.addEventListener("click",()=>$("mainNav").classList.toggle("open"));

async function refreshSession(){
  const { data:{ session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  currentProfile = null;
  if(currentUser){
    const {data} = await supabase.from("profiles").select("*").eq("user_id",currentUser.id).maybeSingle();
    currentProfile=data;
  }
  qsa(".admin-only").forEach(el=>el.classList.toggle("hidden",currentProfile?.role!=="admin"));
  $("homeAuthState").textContent = currentUser ? "로그인됨" : "정상 연결";
  $("homeAuthState").className="ok";
  await loadSettings();
}
supabase.auth.onAuthStateChange(async()=>{ await refreshSession(); });

async function pingDb(){
  const { error } = await supabase.from("profiles").select("user_id",{head:true,count:"exact"});
  $("homeDbState").textContent = error ? "연결 확인 필요" : "정상 연결";
  $("homeDbState").className = error ? "warn" : "ok";
}

async function loadSettings(){
  const {data} = await supabase.from("settings").select("*").eq("id",1).maybeSingle();
  if(data) settings=data;
}

$("signupForm")?.addEventListener("submit", async(e)=>{
  e.preventDefault();
  const name=$("signupName").value.trim(), email=$("signupEmail").value.trim(), password=$("signupPassword").value;
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});
  if(error) return msg($("signupMessage"),error.message,false);
  msg($("signupMessage"),data.session?"회원가입과 로그인이 완료되었습니다.":"회원가입 신청이 완료되었습니다. 이메일 확인이 필요한 경우 받은 편지를 확인해 주세요.");
  if(data.session){ await refreshSession(); showView("mypage"); }
});

$("loginForm")?.addEventListener("submit", async(e)=>{
  e.preventDefault();
  const {error}=await supabase.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  if(error) return msg($("loginMessage"),error.message,false);
  msg($("loginMessage"),"로그인되었습니다.");
  await refreshSession(); showView("mypage");
});

$("logoutBtn")?.addEventListener("click", async()=>{ await supabase.auth.signOut(); await refreshSession(); showView("home"); });

$("profileForm")?.addEventListener("submit", async(e)=>{
  e.preventDefault(); if(!currentUser) return msg($("profileMessage"),"먼저 로그인해 주세요.",false);
  const payload={display_name:$("profileName").value.trim(),region:$("profileRegion").value.trim(),bio:$("profileBio").value.trim(),updated_at:new Date().toISOString()};
  const {error}=await supabase.from("profiles").update(payload).eq("user_id",currentUser.id);
  if(error) return msg($("profileMessage"),error.message,false);
  msg($("profileMessage"),"회원 정보가 저장되었습니다."); await refreshSession(); loadMyPage();
});

$("postForm")?.addEventListener("submit", async(e)=>{
  e.preventDefault(); if(!currentUser) return msg($("postMessage"),"정보를 등록하려면 먼저 로그인해 주세요.",false);
  const now=new Date().toISOString();
  const payload={
    author_id:currentUser.id,category:$("category").value,title:$("title").value.trim(),region:$("region").value.trim(),
    asset_address:$("assetAddress").value.trim(),content:$("content").value.trim(),evidence:$("evidence").value.trim(),status:"등록"
  };
  payload.record_hash=await sha256([location.origin, payload.asset_address, payload.category, payload.title, currentUser.id, now].join("|"));
  const {error}=await supabase.from("posts").insert(payload);
  if(error) return msg($("postMessage"),error.message,false);
  e.target.reset(); msg($("postMessage"),"정보가 등록되고 고유 해시가 생성되었습니다."); loadPosts(); loadRewards();
});

$("virtualForm")?.addEventListener("submit",async(e)=>{
  e.preventDefault(); if(!currentUser) return msg($("virtualMessage"),"로그인 후 등록할 수 있습니다.",false);
  const now=new Date().toISOString();
  const title=$("virtualTitle").value.trim(), content=$("virtualContent").value.trim();
  const record_hash=await sha256([location.origin,"가상건축",title,currentUser.id,now].join("|"));
  const {error}=await supabase.from("posts").insert({author_id:currentUser.id,category:"가상건축",title,content,record_hash,status:"등록"});
  if(error) return msg($("virtualMessage"),error.message,false);
  e.target.reset(); msg($("virtualMessage"),"가상건축 제안이 등록되었습니다."); loadVirtuals();
});

async function loadPosts(){
  const term=$("searchInput")?.value?.trim().toLowerCase()||"";
  let {data,error}=await supabase.from("posts").select("*, profiles!posts_author_id_fkey(display_name)").order("created_at",{ascending:false}).limit(50);
  const el=$("postList"); if(error){el.textContent=error.message;return;}
  if(term) data=data.filter(p=>[p.category,p.title,p.region,p.content].join(" ").toLowerCase().includes(term));
  if(!data.length){el.innerHTML='<div class="empty-box">등록된 정보가 없습니다.</div>';return;}
  el.innerHTML=data.map(p=>postCard(p)).join("");
  attachPostActions(el);
}
$("searchInput")?.addEventListener("input",loadPosts);

function postCard(p){
  return `<article class="item" data-post="${p.id}">
    <div class="item-head"><h4>${escapeHTML(p.title)}</h4><span class="tag">${escapeHTML(p.category)}</span></div>
    <div class="meta">${escapeHTML(p.region||"지역 미입력")} · ${escapeHTML(p.profiles?.display_name||"회원")} · ${fmtDate(p.created_at)} · 상태 ${escapeHTML(p.status||"등록")}</div>
    <p>${escapeHTML(p.content)}</p>
    ${p.evidence?`<div class="meta">근거·출처: ${escapeHTML(p.evidence)}</div>`:""}
    <div class="hash">SHA-256 ${escapeHTML(p.record_hash||"")}</div>
    <div class="item-actions"><button data-action="verify">확인·검증</button><button data-action="comment">의견 남기기</button><button data-action="comments">의견 보기</button></div>
    <div class="comment-box hidden"></div>
  </article>`;
}
function attachPostActions(root){
  qsa(".item",root).forEach(item=>{
    const postId=item.dataset.post;
    qs('[data-action="verify"]',item)?.addEventListener("click",()=>verifyPost(postId));
    qs('[data-action="comment"]',item)?.addEventListener("click",()=>commentPost(postId));
    qs('[data-action="comments"]',item)?.addEventListener("click",()=>loadComments(postId,item));
  });
}
async function verifyPost(postId){
  if(!currentUser) return alert("로그인 후 참여할 수 있습니다.");
  const note=prompt("확인 내용 또는 수정 의견을 간단히 입력해 주세요.","정보를 확인했습니다.");
  if(note===null) return;
  const {error}=await supabase.from("verifications").insert({post_id:postId,verifier_id:currentUser.id,result:"확인",note});
  if(error) alert(error.message); else alert("검증 기록이 저장되었습니다.");
}
async function commentPost(postId){
  if(!currentUser) return alert("로그인 후 의견을 남길 수 있습니다.");
  const content=prompt("의견을 입력해 주세요.");
  if(!content?.trim()) return;
  const {error}=await supabase.from("comments").insert({post_id:postId,author_id:currentUser.id,content:content.trim()});
  if(error) alert(error.message); else alert("의견이 등록되었습니다.");
}
async function loadComments(postId,item){
  const box=qs(".comment-box",item);
  const {data,error}=await supabase.from("comments").select("*, profiles!comments_author_id_fkey(display_name)").eq("post_id",postId).order("created_at");
  box.classList.remove("hidden");
  if(error){box.textContent=error.message;return;}
  box.innerHTML=data.length?data.map(c=>`<div class="comment-row"><b>${escapeHTML(c.profiles?.display_name||"회원")}</b> · ${fmtDate(c.created_at)}<br>${escapeHTML(c.content)}</div>`).join(""):"등록된 의견이 없습니다.";
}

async function loadVirtuals(){
  const {data,error}=await supabase.from("posts").select("*").eq("category","가상건축").order("created_at",{ascending:false}).limit(30);
  $("virtualList").innerHTML=error?escapeHTML(error.message):data?.length?data.map(p=>`<div class="item"><h4>${escapeHTML(p.title)}</h4><p>${escapeHTML(p.content)}</p><div class="meta">${fmtDate(p.created_at)}</div></div>`).join(""):"등록된 제안이 없습니다.";
}
async function loadCommunity(){
  const cats=["주거문화","집수리","인테리어","정원","지역생활정보"];
  const {data,error}=await supabase.from("posts").select("*").in("category",cats).order("created_at",{ascending:false}).limit(30);
  $("communityList").innerHTML=error?escapeHTML(error.message):data?.length?data.map(p=>`<div class="item"><div class="item-head"><h4>${escapeHTML(p.title)}</h4><span class="tag">${escapeHTML(p.category)}</span></div><p>${escapeHTML(p.content)}</p><div class="meta">${fmtDate(p.created_at)}</div></div>`).join(""):"등록된 글이 없습니다.";
}

async function loadRewards(){
  if(!currentUser){ $("rewardLedger").innerHTML='<div class="empty-box">로그인하면 보상 기록을 볼 수 있습니다.</div>'; $("myPoints").textContent="0"; return; }
  const [{data:ledger},{count:posts},{count:vers}] = await Promise.all([
    supabase.from("rewards").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(50),
    supabase.from("posts").select("*",{count:"exact",head:true}).eq("author_id",currentUser.id),
    supabase.from("verifications").select("*",{count:"exact",head:true}).eq("verifier_id",currentUser.id)
  ]);
  const pts=(ledger||[]).reduce((s,r)=>s+(Number(r.points)||0),0);
  $("myPoints").textContent=pts; $("myPostCount").textContent=posts||0; $("myVerifyCount").textContent=vers||0;
  $("rewardLedger").innerHTML=(ledger||[]).length?(ledger||[]).map(r=>`<div class="item"><b>+${r.points} P</b> · ${escapeHTML(r.action)}<div class="meta">${fmtDate(r.created_at)}</div></div>`).join(""):'<div class="empty-box">아직 보상 기록이 없습니다.</div>';
}
async function loadMyPage(){
  if(!currentUser){ $("profileBox").innerHTML="로그인 후 이용할 수 있습니다."; return; }
  await refreshSession();
  $("profileBox").innerHTML=`<b>${escapeHTML(currentProfile?.display_name||currentUser.email)}</b><br><span class="meta">${escapeHTML(currentUser.email)} · ${escapeHTML(currentProfile?.role||"member")}</span>`;
  $("profileName").value=currentProfile?.display_name||""; $("profileRegion").value=currentProfile?.region||""; $("profileBio").value=currentProfile?.bio||"";
  const [{count:p},{count:v},{data:r}] = await Promise.all([
    supabase.from("posts").select("*",{count:"exact",head:true}).eq("author_id",currentUser.id),
    supabase.from("verifications").select("*",{count:"exact",head:true}).eq("verifier_id",currentUser.id),
    supabase.from("rewards").select("points").eq("user_id",currentUser.id)
  ]);
  $("statPosts").textContent=p||0; $("statVerified").textContent=v||0; $("statPoints").textContent=(r||[]).reduce((s,x)=>s+(Number(x.points)||0),0);
}
async function loadAdmin(){
  if(currentProfile?.role!=="admin"){ $("admin").querySelector(".section-title p").textContent="관리자 권한이 없습니다."; return; }
  await loadSettings();
  $("settingPostPoints").value=settings.post_points; $("settingVerifyPoints").value=settings.verify_points; $("settingCommentPoints").value=settings.comment_points; $("settingApproval").value=settings.approval_status;
}
$("adminSettingsForm")?.addEventListener("submit",async(e)=>{
  e.preventDefault(); if(currentProfile?.role!=="admin") return msg($("adminMessage"),"관리자 권한이 없습니다.",false);
  const payload={post_points:+$("settingPostPoints").value,verify_points:+$("settingVerifyPoints").value,comment_points:+$("settingCommentPoints").value,approval_status:$("settingApproval").value,updated_at:new Date().toISOString()};
  const {error}=await supabase.from("settings").update(payload).eq("id",1);
  if(error) return msg($("adminMessage"),error.message,false);
  msg($("adminMessage"),"설정이 저장되었습니다."); await loadSettings();
});

(async function init(){
  $("siteHash").textContent=await sha256(location.origin+"|REAL8|부동산 자산 디지털 플랫폼");
  await refreshSession();
  await pingDb();
  loadPosts();
})();
