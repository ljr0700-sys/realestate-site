// 페이지 전환(SPA)
const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-btn');
const loginBtn = document.getElementById('loginBtn');

function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    showPage(btn.dataset.page);
  });
});

document.querySelectorAll('[data-page-jump]').forEach(btn => {
  btn.addEventListener('click', () => {
    showPage(btn.dataset.pageJump);
  });
});

// 매물/임대/펜션 예시 데이터 (지급률 포함)
const saleItems = [
  {
    id: 1,
    title: "서울 강남구 역세권 아파트",
    region: "서울",
    price: "1,200,000,000",
    yield: "3.5",
    payoutRate: "70",
    platformFee: "10",
    reserveRate: "20",
    tokenized: "onchain",
    tokenInfo: "FractionToken (예시)"
  },
  {
    id: 2,
    title: "부산 해운대 오션뷰 오피스텔",
    region: "부산",
    price: "650,000,000",
    yield: "4.2",
    payoutRate: "70",
    platformFee: "10",
    reserveRate: "20",
    tokenized: "ready",
    tokenInfo: "자산화 심사 중"
  },
  {
    id: 3,
    title: "강원도 펜션형 수익 부동산",
    region: "강원",
    price: "900,000,000",
    yield: "6.1",
    payoutRate: "70",
    platformFee: "10",
    reserveRate: "20",
    tokenized: "onchain",
    tokenInfo: "NFT + 수익 분배 금고"
  }
];

const rentItems = [
  {
    id: 101,
    title: "서울 도심 오피스텔 월세",
    deposit: "20,000,000",
    monthly: "1,000,000",
    payoutRate: "70",
    availableFrom: "2025-02-01"
  },
  {
    id: 102,
    title: "경기 광교 오피스텔 전세",
    deposit: "250,000,000",
    monthly: "0",
    payoutRate: "70",
    availableFrom: "즉시 입주"
  }
];

const pensionItems = [
  {
    id: 201,
    title: "강원 평창 스키장 인근 펜션",
    nightly: "250,000",
    payoutRate: "70",
    tokenBenefit: "토큰 보유자 주말 우선 예약"
  },
  {
    id: 202,
    title: "제주 바닷가 프라이빗 펜션",
    nightly: "300,000",
    payoutRate: "70",
    tokenBenefit: "토큰 보유 시 10% 할인"
  }
];

function renderSaleList() {
  const list = document.getElementById('saleList');
  const regionFilter = document.getElementById('saleFilterRegion').value;
  const tokenFilter = document.getElementById('saleFilterTokenized').value;

  list.innerHTML = "";
  saleItems
    .filter(item => !regionFilter || item.region === regionFilter)
    .filter(item => !tokenFilter || item.tokenized === tokenFilter)
    .forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${item.title}</h3>
        <p>지역: ${item.region}</p>
        <p>매매가: ${item.price}원</p>
        <p>예상 수익률: ${item.yield}%</p>
        <p>투자자 지급률(배당률): ${item.payoutRate}%</p>
        <p>플랫폼 수수료: ${item.platformFee}%</p>
        <p>유지보수·세금 등 비율: ${item.reserveRate}%</p>
        <p>블록체인 상태: ${item.tokenized === 'onchain' ? '온체인 등록' : '준비 중'}</p>
        <p>토큰 정보: ${item.tokenInfo}</p>
        <div class="card-footer">
          <button>상세 보기(예시)</button>
          <button>지분 투자(예시)</button>
        </div>
      `;
      list.appendChild(card);
    });
}

function renderRentList() {
  const list = document.getElementById('rentList');
  list.innerHTML = "";
  rentItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>보증금: ${item.deposit}원</p>
      <p>월세: ${item.monthly}원</p>
      <p>임대 수익 지급률(예시): ${item.payoutRate}%</p>
      <p>입주 가능일: ${item.availableFrom}</p>
      <div class="card-footer">
        <button>임대 문의(예시)</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function renderPensionList() {
  const list = document.getElementById('pensionList');
  list.innerHTML = "";
  pensionItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>1박 기준: ${item.nightly}원</p>
      <p>펜션 수익 지급률(예시): ${item.payoutRate}%</p>
      <p>토큰 혜택: ${item.tokenBenefit}</p>
      <div class="card-footer">
        <button>예약(예시)</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function renderFeatured() {
  const list = document.getElementById('featuredList');
  if (!list) return;
  list.innerHTML = "";
  saleItems.slice(0, 3).forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>매매가: ${item.price}원 / 예상 수익률: ${item.yield}%</p>
      <p>투자자 지급률: ${item.payoutRate}% / 플랫폼 수수료: ${item.platformFee}%</p>
    `;
    list.appendChild(card);
  });
}

function renderMyPage() {
  const myTokens = document.getElementById('myTokens');
  const myTrades = document.getElementById('myTrades');

  const currentUser = JSON.parse(localStorage.getItem('re_currentUser') || 'null');

  if (myTokens) {
    myTokens.innerHTML = currentUser
      ? `<li>${currentUser.email} 님 보유 지분 예시</li><li>서울 아파트 지분 20개</li><li>강원 펜션 지분 150개</li>`
      : `<li>로그인 후 보유 지분을 확인합니다.</li>`;
  }

  if (myTrades) {
    myTrades.innerHTML = currentUser
      ? `<li>예시) 2025-01-10 서울 아파트 지분 10개 매수</li><li>예시) 2025-01-15 강원 펜션 2박 예약</li>`
      : `<li>로그인 후 거래 내역을 확인합니다.</li>`;
  }
}

// 자산화 신청 폼 (브라우저 메모리 저장)
const tokenizationForm = document.getElementById('tokenizationForm');
const localApplications = [];

if (tokenizationForm) {
  tokenizationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(tokenizationForm);
    const data = Object.fromEntries(formData.entries());
    localApplications.push(data);
    alert('자산화 신청서가 이 브라우저에 저장되었습니다. (예시)');
    tokenizationForm.reset();
  });
}

// 지갑 연결 (예시)
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    if (!window.ethereum) {
      alert('Metamask 등 이더리움 지갑이 필요합니다. (예시 안내)');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      const walletInfo = document.getElementById('walletInfo');
      if (walletInfo) {
        walletInfo.textContent = '지갑 주소: ' + account;
      }
      alert('지갑이 연결되었습니다.');
    } catch (err) {
      console.error(err);
      alert('지갑 연결이 취소되었거나 실패했습니다.');
    }
  });
}

// 회원 가입 / 로그인 (브라우저 localStorage 사용 – 구조용 예시)
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const user = Object.fromEntries(formData.entries());
    localStorage.setItem('re_user_' + user.email, JSON.stringify(user));
    alert('회원 가입이 완료되었습니다. (브라우저에만 저장)');
    signupForm.reset();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const saved = localStorage.getItem('re_user_' + email);
    if (!saved) {
      alert('해당 이메일로 가입된 사용자가 없습니다.');
      return;
    }
    const user = JSON.parse(saved);
    if (user.password !== password) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    localStorage.setItem('re_currentUser', JSON.stringify(user));
    alert('로그인 되었습니다.');
    renderMyPage();
    showPage('mypage');
  });
}

// 초기 렌더링
renderFeatured();
renderSaleList();
renderRentList();
renderPensionList();
renderMyPage();

const saleFilterRegion = document.getElementById('saleFilterRegion');
const saleFilterTokenized = document.getElementById('saleFilterTokenized');

if (saleFilterRegion) {
  saleFilterRegion.addEventListener('change', renderSaleList);
}
if (saleFilterTokenized) {
  saleFilterTokenized.addEventListener('change', renderSaleList);
}
