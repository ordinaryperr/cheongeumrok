import AppHeader from '../../components/AppHeader';

export const metadata = {
  title: '구독 관리',
  description: '청음록 구독 플랜과 결제 정보를 관리합니다.',
};

const planFeatures = [
  '무제한 청음 기록',
  '비공개 리뷰와 개인 아카이브',
  '고급 검색 필터',
  '월간 취향 리포트',
];

const invoices = [
  ['2026.07.29', 'Cheongeumrok Plus', '₩9,900', '결제 완료'],
  ['2026.06.29', 'Cheongeumrok Plus', '₩9,900', '결제 완료'],
  ['2026.05.29', 'Cheongeumrok Plus', '₩9,900', '결제 완료'],
];

export default function ManageSubscriptionPage() {
  return (
    <main className="subscriptionPage">
      <AppHeader />

      <section className="subscriptionShell">
        <aside className="subscriptionSidebar" aria-label="구독 관리 메뉴">
          <div className="subscriptionBrand">
            <span>청</span>
            <div>
              <b>Cheongeumrok</b>
              <small>Account Portal</small>
            </div>
          </div>
          <nav className="subscriptionMenu">
            <a className="active" href="#plan">구독</a>
            <a href="#billing">결제 정보</a>
            <a href="#invoices">영수증</a>
            <a href="#support">도움말</a>
          </nav>
        </aside>

        <div className="subscriptionContent">
          <header className="subscriptionHeader">
            <div>
              <p className="eyebrow">manage subscription</p>
              <h1>구독 관리</h1>
              <p>현재 플랜, 결제 수단, 영수증 내역을 한 화면에서 확인합니다.</p>
            </div>
            <a className="secondary" href="/profile">내 기록으로 돌아가기</a>
          </header>

          <section id="plan" className="subscriptionCard planCard">
            <div>
              <p className="cardLabel">현재 플랜</p>
              <h2>Cheongeumrok Plus</h2>
              <p className="subscriptionMuted">다음 결제 예정일: 2026년 8월 29일</p>
            </div>
            <div className="planPrice">
              <b>₩9,900</b>
              <span>/ 월</span>
            </div>
            <div className="featureList">
              {planFeatures.map((feature) => <span key={feature}>✓ {feature}</span>)}
            </div>
            <div className="subscriptionActions">
              <button type="button" className="primary">플랜 변경</button>
              <button type="button" className="dangerButton">구독 취소</button>
            </div>
          </section>

          <div className="subscriptionGrid">
            <section id="billing" className="subscriptionCard">
              <p className="cardLabel">결제 수단</p>
              <h3>Visa •••• 4242</h3>
              <p className="subscriptionMuted">만료일 12/29 · 기본 결제 수단</p>
              <button type="button" className="secondary compactButton">결제 수단 수정</button>
            </section>

            <section id="support" className="subscriptionCard">
              <p className="cardLabel">지원</p>
              <h3>구독 관련 도움이 필요하신가요?</h3>
              <p className="subscriptionMuted">결제 오류, 환불, 플랜 변경 문의를 남겨주세요.</p>
              <a className="secondary compactButton" href="mailto:support@cheongeumrok.app">문의하기</a>
            </section>
          </div>

          <section id="invoices" className="subscriptionCard invoiceCard">
            <div className="invoiceHeader">
              <div>
                <p className="cardLabel">영수증</p>
                <h3>결제 내역</h3>
              </div>
              <button type="button" className="secondary compactButton">전체 다운로드</button>
            </div>
            <div className="invoiceTable">
              {invoices.map(([date, title, price, status]) => (
                <div className="invoiceRow" key={date}>
                  <span>{date}</span>
                  <b>{title}</b>
                  <span>{price}</span>
                  <em>{status}</em>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
