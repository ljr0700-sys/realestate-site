import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {SUPABASE_URL,SUPABASE_ANON_KEY} from "./supabase-config.js";

const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let user=null, profile=null;

async function hash(v){const b=new TextEncoder().encode(v);const h=await crypto.subtle.digest("SHA-256",b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}

document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); $(b.dataset.page).classList.add("active");
  if(b.dataset.page==="trade") loadPosts();
  if(b.dataset.page==="virtual") loadVirtual();
  if(b.dataset.page==="culture") loadCulture();
  if(b.dataset.page==="mypage") loadMyPage();
});

async function session(){
  const {data:{session}}=await supabase.auth.getSession(); user=session?.user||null; profile=null;
  if(user){const {data}=await supabase.from("profiles").select("*").eq("user_id",user.id).maybeSingle();profile=data}
}
await session();
$("siteHash").textContent=await hash(location.origin+"|REAL8|BUSINESS");

$("signupForm").onsubmit=async e=>{
  e.preventDefault();
  const {error}=await supabase.auth.signUp({email:$("signupEmail").value.trim(),password:$("signupPassword").value,options:{data:{display_name:$("signupName").value.trim()}}});
  $("signupMsg").textContent=error?error.message:"회원가입이 완료되었습니다. 이메일 확인이 필요한 경우 받은편지를 확인해 주세요.";
};
$("loginForm").onsubmit=async e=>{
  e.preventDefault();
  const {error}=await supabase.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  $("loginMsg").textContent=error?error.message:"로그인되었습니다."; if(!error) await session();
};
$("logoutBtn").onclick=async()=>{await supabase.auth.signOut();await session();$("profileInfo").textContent="로그아웃되었습니다."};

$("postForm").onsubmit=async e=>{
  e.preventDefault(); if(!user){$("postMsg").textContent="먼저 로그인해 주세요.";return}
  const now=new Date().toISOString(), category=$("category").value;
  const record_hash=await hash([location.origin,category,$("assetAddress").value,user.id,now].join("|"));
  const {error}=await supabase.from("posts").insert({
    author_id:user.id,category,title:$("postTitle").value.trim(),region:[$("region").value,$("district").value].filter(Boolean).join(" "),
    asset_address:$("assetAddress").value.trim(),content:$("postContent").value.trim()+"\n거래금액: "+$("price").value.trim(),
    record_hash,status:"등록"
  });
  $("postMsg").textContent=error?error.message:"정보가 등록되고 고유 해시가 생성되었습니다."; if(!error){e.target.reset();loadPosts()}
};

async function loadPosts(){
  const {data,error}=await supabase.from("posts").select("*").in("category",["건축","매매","전세","월세","렌트","바꿔살기"]).order("created_at",{ascending:false});
  $("postList").innerHTML=error?esc(error.message):(data?.length?data.map(p=>`<div class="item"><b>${esc(p.category)} · ${esc(p.title)}</b><div class="meta">${esc(p.region||"")} · ${new Date(p.created_at).toLocaleString("ko-KR")}</div><div>${esc(p.content)}</div><div class="hash">${esc(p.record_hash)}</div></div>`).join(""):"등록된 정보가 없습니다.");
}

$("virtualForm").onsubmit=async e=>{
  e.preventDefault(); if(!user){$("virtualMsg").textContent="먼저 로그인해 주세요.";return}
  const now=new Date().toISOString(),title=$("virtualTitle").value.trim(),content=$("virtualContent").value.trim();
  const record_hash=await hash([location.origin,"가상건축",title,user.id,now].join("|"));
  const {error}=await supabase.from("posts").insert({author_id:user.id,category:"가상건축",title,content,record_hash,status:"등록"});
  $("virtualMsg").textContent=error?error.message:"가상건축 제안이 등록되었습니다."; if(!error){e.target.reset();loadVirtual()}
};
async function loadVirtual(){
  const {data}=await supabase.from("posts").select("*").eq("category","가상건축").order("created_at",{ascending:false});
  $("virtualList").innerHTML=data?.length?data.map(p=>`<div class="item"><b>${esc(p.title)}</b><div>${esc(p.content)}</div></div>`).join(""):"등록된 제안이 없습니다.";
}

$("cultureForm").onsubmit=async e=>{
  e.preventDefault(); if(!user){$("cultureMsg").textContent="먼저 로그인해 주세요.";return}
  const now=new Date().toISOString(),category=$("cultureCategory").value,title=$("cultureTitle").value.trim(),content=$("cultureContent").value.trim();
  const record_hash=await hash([location.origin,category,title,user.id,now].join("|"));
  const {error}=await supabase.from("posts").insert({author_id:user.id,category,title,content,record_hash,status:"등록"});
  $("cultureMsg").textContent=error?error.message:"생활 정보가 등록되었습니다."; if(!error){e.target.reset();loadCulture()}
};
async function loadCulture(){
  const cats=["집수리","인테리어","정원","주거문화","지역생활정보"];
  const {data}=await supabase.from("posts").select("*").in("category",cats).order("created_at",{ascending:false});
  $("cultureList").innerHTML=data?.length?data.map(p=>`<div class="item"><b>${esc(p.category)} · ${esc(p.title)}</b><div>${esc(p.content)}</div></div>`).join(""):"등록된 정보가 없습니다.";
}

async function loadMyPage(){
  await session(); if(!user){$("profileInfo").textContent="로그인 후 이용할 수 있습니다.";return}
  $("profileInfo").innerHTML=`<b>${esc(profile?.display_name||user.email)}</b><br>${esc(user.email)}`;
  const [{count:p},{count:v},{data:r},{data:my}] = await Promise.all([
    supabase.from("posts").select("*",{count:"exact",head:true}).eq("author_id",user.id),
    supabase.from("verifications").select("*",{count:"exact",head:true}).eq("verifier_id",user.id),
    supabase.from("rewards").select("points,action,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
    supabase.from("posts").select("title,category,created_at").eq("author_id",user.id).order("created_at",{ascending:false}).limit(20)
  ]);
  $("myPosts").textContent=p||0;$("myVerifications").textContent=v||0;$("myPoints").textContent=(r||[]).reduce((s,x)=>s+(Number(x.points)||0),0);
  $("myActivity").innerHTML=(my||[]).map(x=>`<div class="item"><b>${esc(x.category)} · ${esc(x.title)}</b><div class="meta">${new Date(x.created_at).toLocaleString("ko-KR")}</div></div>`).join("");
}

$("saveAdmin").onclick=()=>{$("adminMsg").textContent="관리 기준이 화면에 저장되었습니다. 실제 암호자산 발행 기능은 비활성화 상태입니다."};
