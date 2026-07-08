import AppHeader from '../../components/AppHeader';
import LoginForm from '../../components/LoginForm';

export const metadata = { title: '로그인 | 청음록' };

export default function LoginPage() {
  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">auth</p>
        <h1>기록을 저장하려면<br />먼저 로그인하세요.</h1>
        <p className="lead">별점과 감상은 계정에 연결되어 내 청음 아카이브로 쌓입니다.</p>
      </section>
      <section className="section topTight narrow">
        <LoginForm />
      </section>
    </main>
  );
}
