import AppHeader from '../../components/AppHeader';
import NewsCard from '../../components/NewsCard';
import { news as mockNews } from '../../data/news';
import { getNewsPosts, mapSupabaseNewsPost } from '../../lib/news';

export const metadata = { title: '뉴스 | 청음록' };
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const { data, error } = await getNewsPosts();
  const news = data?.length ? data.map(mapSupabaseNewsPost) : mockNews;
  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">music news</p>
        <h1>최근 음악 소식</h1>
        <p className="lead">Pitchfork처럼 읽을거리 중심으로, 신보·씬 이야기·음악 문화 에세이를 모아봅니다.</p>
        <div className="heroActions"><a className="secondary" href="/admin/news">뉴스 등록하기</a></div>
      </section>
      <section className="section topTight">
        {error ? <p className="empty">Supabase 뉴스를 불러오지 못해 더미 뉴스를 보여주고 있습니다.</p> : null}
        <div className="newsGrid">
          {news.map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
      </section>
    </main>
  );
}
