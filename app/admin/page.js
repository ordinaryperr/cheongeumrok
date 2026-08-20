import AppHeader from '../../components/AppHeader';
import AdminDashboard from '../../components/AdminDashboard';

export const metadata = { title: '관리자 대시보드 | 청음록' };

export default function AdminPage() {
  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">admin dashboard</p>
        <h1>서비스를 관찰하고<br />신고를 처리합니다.</h1>
        <p className="lead">최근 가입자, 리뷰, 신고 상태를 한 곳에서 확인하는 운영용 화면입니다.</p>
      </section>
      <section className="section topTight">
        <AdminDashboard />
      </section>
    </main>
  );
}
