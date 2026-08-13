import AppHeader from '../../components/AppHeader';
import FollowingFeed from '../../components/FollowingFeed';

export const metadata = { title: 'Following Feed | 청음록' };

export default function FollowingPage() {
  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">following feed</p>
        <h1>팔로우한 리스너의 기록</h1>
        <p className="lead">내가 따라가는 사람들의 청음 기록을 모아봅니다. 다른 사람의 울타리를 따라가며 새로운 음악을 발견하세요.</p>
      </section>
      <section className="section topTight narrow">
        <FollowingFeed />
      </section>
    </main>
  );
}
