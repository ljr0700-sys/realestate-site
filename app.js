import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);
const views = [...document.querySelectorAll(".view")];

function showView(id){
  views.forEach(v => v.classList.toggle("active", v.id === id));
  document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  window.scrollTo({top:0, behavior:"smooth"});
}
document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));

function msg(el, text, error=false){
  el.textContent = text;
  el.className = error ? "message error" : "message";
}

async function sha256(text){
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function renderSiteHash(){
  const base = `${location.origin}${location.pathname}|REAL8|COIN|TOKEN|NFT`;
  $("siteHash").textContent = await sha256(base);
}
renderSiteHash().catch(()=> $("siteHash").textContent = "이 브라우저에서 해시를 생성하지 못했습니다.");

let localPosts = JSON.parse(localStorage.getItem("real8_posts") || "[]");
let localRewards = JSON.parse(localStorage.getItem("real8_rewards") || "[]");
let rewardConfig = JSON.parse(localStorage.getItem("real8_reward_config") || '{"post":10,"verify":10,"comment":10}');
let approval = JSON.parse(localStorage.getItem("real8_approval") || '{"status":"승인 전","org":"","no":"","date":""}');

function syncRewardLabels(){
  $("rewardPost").textContent = `${rewardConfig.post} P`;
  $("rewardVerify").textContent = `${rewardConfig.verify} P`;
  $("rewardComment").textContent = `${rewardConfig.comment} P`;
  $("adminRewardPost").value = rewardConfig.post;
  $("adminRewardVerify").value = rewardConfig.verify;
  $("adminRewardComment").value = rewardConfig.comment;
  $("approvalStatus").value = approval.status;
  $("approvalOrg").value = approval.org;
  $("approvalNo").value = approval.no;
  $("approvalDate").value = approval.date;
}
syncRewardLabels();

function addReward(action, points, ref){
  const row = {id:crypto.randomUUID(), action, points, ref, created_at:new Date().toISOString()};
  localRewards.unshift(row);
  localStorage.setItem("real8_rewards", JSON.stringify(localRewards));
  renderRewards();
}

function renderRewards(){
  $("rewardLedger").innerHTML = localRewards.slice(0,20).map(r => `
    <div class="item"><strong>${r.action}</strong> · ${r.points}P
    <small>${new Date(r.created_at).toLocaleString()}</small></div>`).join("") || "<div class='item'>아직 보상 기록이 없습니다.</div>";
  updateStats();
}
renderRewards();

async function createPostRecord(post){
  if(configured){
    const { data:{user} } = await supabase.auth.getUser();
    if(!user) throw new Error("로그인이 필요합니다.");
    const { error } = await supabase.from("posts").insert({
      author_id:user.id, category:post.category, title:post.title, region:post.region,
      asset_address:post.assetAddress, content:post.content, record_hash:post.hash
    });
    if(error) throw error;
    const { error:rewardErr } = await supabase.from("rewards").insert({
      user_id:user.id, action:"정보등록", points:rewardConfig.post, reference_id:post.hash
    });
    if(rewardErr) console.warn(rewardErr);
  }else{
    localPosts.unshift(post);
    localStorage.setItem("real8_posts", JSON.stringify(localPosts));
    addReward("정보등록", rewardConfig.post, post.hash);
  }
}

$("postForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const post = {
    id:crypto.randomUUID(),
    category:$("category").value,
    title:$("title").value.trim(),
    region:$("region").value.trim(),
    assetAddress:$("assetAddress").value.trim(),
    content:$("content").value.trim(),
    created_at:new Date().toISOString()
  };
  post.hash = await sha256(`${location.origin}${location.pathname}|${post.assetAddress}|${post.created_at}|${post.id}`);
  try{
    await createPostRecord(post);
    msg($("postMessage"), "정보가 등록되고 고유 해시가 생성되었습니다.");
    e.target.reset();
    await renderPosts();
  }catch(err){ msg($("postMessage"), err.message, true); }
});

async function getPosts(){
  if(configured){
    const {data,error} = await supabase.from("posts").select("*").order("created_at",{ascending:false}).limit(100);
    if(error) throw error;
    return data;
  }
  return localPosts;
}

async function renderPosts(){
  try{
    const q = $("searchInput").value.trim().toLowerCase();
    const rows = (await getPosts()).filter(p => !q || `${p.title} ${p.category} ${p.region}`.toLowerCase().includes(q));
    $("postList").innerHTML = rows.map(p => `
      <article class="item">
        <strong>${p.title}</strong>
        <div>${p.category} · ${p.region || "지역 미입력"}</div>
        <p>${p.content}</p>
        <small>해시: ${p.record_hash || p.hash || "-"}</small>
      </article>`).join("") || "<div class='item'>등록된 정보가 없습니다.</div>";
    updateStats();
  }catch(err){ $("postList").innerHTML = `<div class='item'>${err.message}</div>`; }
}
$("searchInput").addEventListener("input", renderPosts);
renderPosts();

let virtualItems = JSON.parse(localStorage.getItem("real8_virtual") || "[]");
$("virtualForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const title=$("virtualTitle").value.trim(), content=$("virtualContent").value.trim();
  if(!title || !content) return;
  virtualItems.unshift({id:crypto.randomUUID(),title,content,created_at:new Date().toISOString()});
  localStorage.setItem("real8_virtual", JSON.stringify(virtualItems));
  e.target.reset(); renderVirtual();
});
function renderVirtual(){
  $("virtualList").innerHTML = virtualItems.map(v=>`<div class="item"><strong>${v.title}</strong><p>${v.content}</p></div>`).join("") || "<div class='item'>등록된 제안이 없습니다.</div>";
}
renderVirtual();

$("signupForm").addEventListener("submit", async(e)=>{
  e.preventDefault();
  if(!configured) return msg($("signupMessage"), "Supabase 연결 전입니다. supabase-config.js에 프로젝트 URL과 anon key를 입력해 주세요.", true);
  const name=$("signupName").value.trim(), email=$("signupEmail").value.trim(), password=$("signupPassword").value;
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});
  if(error) return msg($("signupMessage"), error.message, true);
  msg($("signupMessage"), data.session ? "회원가입과 로그인이 완료되었습니다." : "회원가입되었습니다. 이메일 인증 메일을 확인해 주세요.");
  updateProfile();
});

$("loginForm").addEventListener("submit", async(e)=>{
  e.preventDefault();
  if(!configured) return msg($("loginMessage"), "Supabase 연결 전입니다.", true);
  const {error}=await supabase.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  if(error) return msg($("loginMessage"), error.message, true);
  msg($("loginMessage"), "로그인되었습니다.");
  updateProfile();
});

$("logoutBtn").addEventListener("click", async()=>{
  if(configured) await supabase.auth.signOut();
  msg($("loginMessage"), "로그아웃되었습니다.");
  updateProfile();
});

async function updateProfile(){
  if(!configured){
    $("profileBox").innerHTML = "<strong>Supabase 연결 전</strong><br>현재 화면과 해시·내부기록 기능을 확인할 수 있습니다. 실제 회원 시스템을 사용하려면 연결 설정이 필요합니다.";
    updateStats(); return;
  }
  const {data:{user}} = await supabase.auth.getUser();
  $("profileBox").innerHTML = user ? `<strong>${user.user_metadata?.display_name || "회원"}</strong><br>${user.email}` : "로그인하지 않았습니다.";
  updateStats();
}
updateProfile();

function updateStats(){
  $("statPosts").textContent = configured ? "—" : localPosts.length;
  $("statPoints").textContent = configured ? "—" : localRewards.reduce((a,b)=>a+Number(b.points||0),0);
  $("statVerified").textContent = configured ? "—" : localRewards.filter(r=>r.action==="검증기여").length;
}

$("saveAdmin").addEventListener("click",()=>{
  rewardConfig = {
    post:Number($("adminRewardPost").value||0),
    verify:Number($("adminRewardVerify").value||0),
    comment:Number($("adminRewardComment").value||0)
  };
  approval = {
    status:$("approvalStatus").value,
    org:$("approvalOrg").value.trim(),
    no:$("approvalNo").value.trim(),
    date:$("approvalDate").value
  };
  if(approval.status==="승인 완료" && (!approval.org || !approval.no || !approval.date)){
    alert("승인 완료로 표시하려면 승인기관·승인번호·승인일을 모두 입력하세요.");
    return;
  }
  localStorage.setItem("real8_reward_config",JSON.stringify(rewardConfig));
  localStorage.setItem("real8_approval",JSON.stringify(approval));
  syncRewardLabels();
  alert("설정이 저장되었습니다. 실제 서비스에서는 관리자 계정 권한으로 보호해야 합니다.");
});

if(configured){
  supabase.auth.onAuthStateChange(()=>updateProfile());
}
