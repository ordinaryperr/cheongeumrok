import AppHeader from '../../components/AppHeader';
import AlbumCard from '../../components/AlbumCard';
import SearchClient from '../../components/SearchClient';
import { albums } from '../../data/mock';

export const metadata = { title: '검색 | 청음록' };

export default function SearchPage() {
  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">search</p>
        <h1>무엇을 들었나요?</h1>
        <p className="lead">Spotify API로 앨범과 곡을 검색합니다. 좋은 음악을 발견하면 바로 감상 기록으로 이어갈 수 있습니다.</p>
        <SearchClient />
      </section>
      <section className="section topTight">
        <div className="albumGrid">{albums.map((album) => <AlbumCard key={album.id} album={album} />)}</div>
      </section>
    </main>
  );
}
