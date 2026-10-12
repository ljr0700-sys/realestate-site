(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]
  ));
  const msg = (id, text) => { const el=$(id); if(el) el.textContent=text; };

  // 메뉴는 Supabase 연결과 상관없이 항상 작동
  function openPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === id));
    document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.page === id));
    window.scrollTo({top:0, behavior:"smooth"});
    if (id==="trade") loadPosts();
    if (id==="virtual") loadVirtual();
    if (id==="culture") loadCulture();
    if (id==="mypage") loadMyPage();
  }
  document.querySelectorAll("nav button[data-page]").forEach(b => {
    b.addEventListener("click", () => openPage(b.dataset.page));
  });

  async function sha256(v) {
    const b = new TextEncoder().encode(v);
    const h = await crypto.subtle.digest("SHA-256", b);
    return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");
  }

  let client = null, user = null, profile = null;
  try {
    const cfg = window.REAL8_CONFIG;
    if (window.supabase && cfg?.SUPABASE_URL && cfg?.SUPABASE_ANON_KEY) {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
  } catch(e) {
    console.error(e);
  }

  async function session() {
    if (!client) return;
    const {data:{session}} = await client.auth.getSession();
    user = session?.user || null;
    profile = null;
    if (user) {
      const {data} = await client.from("profiles").select("*").eq("user_id",user.id).maybeSingle();
      profile = data;
    }
  }

  async function start() {
    const sh=$("siteHash");
    if (sh) {
      try { sh.textContent = await sha256(location.href.split("#")[0] + "|REAL8|BUSINESS"); }
      catch { sh.textContent = "브라우저에서 해시 생성 준비 중"; }
    }
    await session();
  }

  const signup = $("signupForm");
  if(signup) signup.addEventListener("submit", async e => {
    e.preventDefault();
    if(!client) return msg("signupMsg","현재 데이터베이스 연결을 확인해 주세요.");
    const {error} = await client.auth.signUp({
      email:$("signupEmail").value.trim(),
      password:$("signupPassword").value,
      options:{data:{display_name:$("signupName").value.trim()}}
    });
    msg("signupMsg", error ? error.message : "회원가입이 완료되었습니다. 이메일 확인이 필요한 경우 받은편지를 확인해 주세요.");
  });

  const login = $("loginForm");
  if(login) login.addEventListener("submit", async e => {
    e.preventDefault();
    if(!client) return msg("loginMsg","현재 데이터베이스 연결을 확인해 주세요.");
    const {error} = await client.auth.signInWithPassword({
      email:$("loginEmail").value.trim(),
      password:$("loginPassword").value
    });
    msg("loginMsg", error ? error.message : "로그인되었습니다.");
    if(!error) await session();
  });

  const logout=$("logoutBtn");
  if(logout) logout.addEventListener("click", async ()=>{
    if(client) await client.auth.signOut();
    user=null; profile=null;
    if($("profileInfo")) $("profileInfo").textContent="로그아웃되었습니다.";
  });

  const postForm=$("postForm");
  if(postForm) postForm.addEventListener("submit", async e=>{
    e.preventDefault();
    if(!client) return msg("postMsg","데이터베이스 연결을 확인해 주세요.");
    await session();
    if(!user) return msg("postMsg","먼저 로그인해 주세요.");
    const now=new Date().toISOString();
    const category=$("category").value;
    const record_hash=await sha256([location.origin,category,$("assetAddress").value,user.id,now].join("|"));
    const {error}=await client.from("posts").insert({
      author_id:user.id,
      category,
      title:$("postTitle").value.trim(),
      region:[$("region").value,$("district").value].filter(Boolean).join(" "),
      asset_address:$("assetAddress").value.trim(),
      content:$("postContent").value.trim()+"\n거래금액: "+$("price").value.trim(),
      record_hash,
      status:"등록"
    });
    msg("postMsg", error ? error.message : "정보가 등록되고 고유 해시가 생성되었습니다.");
    if(!error){ e.target.reset(); loadPosts(); }
  });

  async function loadPosts(){
    if(!client || !$("postList")) return;
    const {data,error}=await client.from("posts").select("*")
      .in("category",["건축","매매","전세","월세","렌트","바꿔살기"])
      .order("created_at",{ascending:false});
    $("postList").innerHTML = error ? esc(error.message) :
      (data?.length ? data.map(p=>`<div class="item"><b>${esc(p.category)} · ${esc(p.title)}</b><div class="meta">${esc(p.region||"")} · ${new Date(p.created_at).toLocaleString("ko-KR")}</div><div>${esc(p.content)}</div><div class="hash">${esc(p.record_hash)}</div></div>`).join("") : "등록된 정보가 없습니다.");
  }

  const virtualForm=$("virtualForm");
  if(virtualForm) virtualForm.addEventListener("submit", async e=>{
    e.preventDefault();
    if(!client) return msg("virtualMsg","데이터베이스 연결을 확인해 주세요.");
    await session();
    if(!user) return msg("virtualMsg","먼저 로그인해 주세요.");
    const now=new Date().toISOString(), title=$("virtualTitle").value.trim(), content=$("virtualContent").value.trim();
    const record_hash=await sha256([location.origin,"가상건축",title,user.id,now].join("|"));
    const {error}=await client.from("posts").insert({author_id:user.id,category:"가상건축",title,content,record_hash,status:"등록"});
    msg("virtualMsg", error ? error.message : "가상건축 제안이 등록되었습니다.");
    if(!error){ e.target.reset(); loadVirtual(); }
  });

  async function loadVirtual(){
    if(!client || !$("virtualList")) return;
    const {data}=await client.from("posts").select("*").eq("category","가상건축").order("created_at",{ascending:false});
    $("virtualList").innerHTML=data?.length?data.map(p=>`<div class="item"><b>${esc(p.title)}</b><div>${esc(p.content)}</div></div>`).join(""):"등록된 제안이 없습니다.";
  }

  const cultureForm=$("cultureForm");
  if(cultureForm) cultureForm.addEventListener("submit", async e=>{
    e.preventDefault();
    if(!client) return msg("cultureMsg","데이터베이스 연결을 확인해 주세요.");
    await session();
    if(!user) return msg("cultureMsg","먼저 로그인해 주세요.");
    const now=new Date().toISOString(), category=$("cultureCategory").value, title=$("cultureTitle").value.trim(), content=$("cultureContent").value.trim();
    const record_hash=await sha256([location.origin,category,title,user.id,now].join("|"));
    const {error}=await client.from("posts").insert({author_id:user.id,category,title,content,record_hash,status:"등록"});
    msg("cultureMsg", error ? error.message : "생활 정보가 등록되었습니다.");
    if(!error){ e.target.reset(); loadCulture(); }
  });

  async function loadCulture(){
    if(!client || !$("cultureList")) return;
    const cats=["집수리","인테리어","정원","주거문화","지역생활정보"];
    const {data}=await client.from("posts").select("*").in("category",cats).order("created_at",{ascending:false});
    $("cultureList").innerHTML=data?.length?data.map(p=>`<div class="item"><b>${esc(p.category)} · ${esc(p.title)}</b><div>${esc(p.content)}</div></div>`).join(""):"등록된 정보가 없습니다.";
  }

  async function loadMyPage(){
    if(!$("profileInfo")) return;
    if(!client){ $("profileInfo").textContent="데이터베이스 연결을 확인해 주세요."; return; }
    await session();
    if(!user){ $("profileInfo").textContent="로그인 후 이용할 수 있습니다."; return; }
    $("profileInfo").innerHTML=`<b>${esc(profile?.display_name||user.email)}</b><br>${esc(user.email)}`;
    const [{count:p},{count:v},{data:r},{data:my}] = await Promise.all([
      client.from("posts").select("*",{count:"exact",head:true}).eq("author_id",user.id),
      client.from("verifications").select("*",{count:"exact",head:true}).eq("verifier_id",user.id),
      client.from("rewards").select("points,action,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
      client.from("posts").select("title,category,created_at").eq("author_id",user.id).order("created_at",{ascending:false}).limit(20)
    ]);
    $("myPosts").textContent=p||0; $("myVerifications").textContent=v||0;
    $("myPoints").textContent=(r||[]).reduce((s,x)=>s+(Number(x.points)||0),0);
    $("myActivity").innerHTML=(my||[]).map(x=>`<div class="item"><b>${esc(x.category)} · ${esc(x.title)}</b><div class="meta">${new Date(x.created_at).toLocaleString("ko-KR")}</div></div>`).join("");
  }

  const saveAdmin=$("saveAdmin");
  if(saveAdmin) saveAdmin.addEventListener("click",()=>{
    msg("adminMsg","관리 기준이 화면에 저장되었습니다. 실제 암호자산 발행 기능은 비활성화 상태입니다.");
  });

  start();
})();