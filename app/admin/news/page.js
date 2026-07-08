import AppHeader from '../../../components/AppHeader';
import NewsAdminForm from '../../../components/NewsAdminForm';

export const metadata = { title: '뉴스 관리자 | 청음록' };

export default function NewsAdminPage() {
  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">news admin</p>
        <h1>뉴스와 에디터 글을<br />등록합니다.</h1>
        <p className="lead">MVP 단계에서는 로그인 사용자만 간단한 뉴스 카드를 등록할 수 있게 운영합니다.</p>
      </section>
      <section className="section topTight narrow">
        <NewsAdminForm />
      </section>
    </main>
  );
}
