
// 간단한 SPA 네비게이션
const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-btn');
const loginBtn = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');

function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });
}

// 상단 메뉴 클릭
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    showPage(btn.dataset.page);
  });
});

// 홈에서 버튼으로 페이지 이동
document.querySelectorAll('[data-page-jump]').forEach(btn => {
  btn.addEventListener('click', () => {
    showPage(btn.dataset.pageJump);
  });
});

// 예시 데이터
const saleItems = [
  {
    id: 1,
    title: "서울 강남구 역세권 아파트",
    region: "서울",
    price: "1,200,000,000",
    yield: "3.5",
    tokenized: "onchain",
    tokenInfo: "FractionToken (테스트넷)"
  },
  {
    id: 2,
    title: "부산 해운대 오션뷰 오피스텔",
    region: "부산",
    price: "650,000,000",
    yield: "4.2",
    tokenized: "ready",
    tokenInfo: "자산화 심사 중"
  },
  {
    id: 3,
    title: "강원도 펜션형 수익 부동산",
    region: "강원",
    price: "900,000,000",
    yield: "6.1",
    tokenized: "onchain",
    tokenInfo: "NFT + RevenueSharingVault"
  }
];

const rentItems = [
  {
    id: 101,
    title: "서울 도심 오피스텔 월세",
    deposit: "20,000,000",
    monthly: "1,000,000",
    availableFrom: "2025-02-01"
  },
  {
    id: 102,
    title: "경기 광교 오피스텔 전세",
    deposit: "250,000,000",
    monthly: "0",
    availableFrom: "즉시 입주"
  }
];

const pensionItems = [
  {
    id: 201,
    title: "강원 평창 스키장 인근 펜션",
    nightly: "250,000",
    tokenBenefit: "토큰 보유자 주말 우선 예약"
  },
  {
    id: 202,
    title: "제주 바닷가 프라이빗 펜션",
    nightly: "300,000",
    tokenBenefit: "토큰 보유 시 10% 할인"
  }
];

// 대표 매물, 매매/임대/펜션 목록 표시
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
  list.innerHTML = "";
  saleItems.slice(0, 3).forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>매매가: ${item.price}원 / 예상 수익률: ${item.yield}%</p>
    `;
    list.appendChild(card);
  });
}

// 마이페이지 예시
function renderMyPage() {
  const myTokens = document.getElementById('myTokens');
  const myTrades = document.getElementById('myTrades');

  myTokens.innerHTML = `
    <li>예시) 강원 펜션 지분 토큰 150개 보유</li>
    <li>예시) 서울 아파트 FractionToken 20개 보유</li>
  `;

  myTrades.innerHTML = `
    <li>2025-01-10 서울 아파트 지분 10개 매수 (테스트넷)</li>
    <li>2025-01-15 강원 펜션 예약(2박) 결제 (테스트넷)</li>
  `;
}

// 토큰화 신청 폼 (현재는 브라우저 메모리에만 저장)
const tokenizationForm = document.getElementById('tokenizationForm');
const localApplications = [];

tokenizationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(tokenizationForm);
  const data = Object.fromEntries(formData.entries());
  localApplications.push(data);
  alert('신청 내용이 브라우저 메모리에 저장되었습니다.\n실제 서비스에서는 서버/DB 및 법률 검토 프로세스가 필요합니다.');
  tokenizationForm.reset();
});

// 지갑 연결(실제 블록체인 연동은 추후 구현)
loginBtn.addEventListener('click', async () => {
  if (!window.ethereum) {
    alert('Metamask와 같은 이더리움 지갑이 필요합니다. 실제 서비스에서는 지갑 연결 후 주소를 저장합니다.');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    loginStatus.textContent = '연결된 지갑: ' + account.substring(0, 8) + '...';
    const walletInfo = document.getElementById('walletInfo');
    if (walletInfo) {
      walletInfo.textContent = '지갑 주소: ' + account;
    }
  } catch (err) {
    console.error(err);
    alert('지갑 연결이 취소되었습니다.');
  }
});

// 초기 렌더링
renderFeatured();
renderSaleList();
renderRentList();
renderPensionList();
renderMyPage();

document.getElementById('saleFilterRegion').addEventListener('change', renderSaleList);
document.getElementById('saleFilterTokenized').addEventListener('change', renderSaleList);
