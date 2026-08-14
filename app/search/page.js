import AppHeader from '../../components/AppHeader';
import AlbumCard from '../../components/AlbumCard';
import SearchClient from '../../components/SearchClient';
import { getSpotifyStarterAlbums } from '../../lib/spotifyArchive';

export const metadata = { title: '검색 | 청음록' };

export default async function SearchPage({ searchParams }) {
  const { q = '' } = await searchParams;
  const initialQuery = Array.isArray(q) ? q[0] || '' : q;
  const starterAlbums = await getSpotifyStarterAlbums();

  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">search</p>
        <h1>무엇을 들었나요?</h1>
        <p className="lead">Spotify API로 앨범과 곡을 검색합니다. 좋은 음악을 발견하면 바로 감상 기록으로 이어갈 수 있습니다.</p>
        <SearchClient initialQuery={initialQuery} />
      </section>
      <section className="section topTight">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">spotify starters</p>
            <h2>먼저 둘러볼 실제 앨범들</h2>
          </div>
        </div>
        <div className="albumGrid">
          {starterAlbums.length ? starterAlbums.map((album) => <AlbumCard key={album.id} album={album} />) : <p className="empty">Spotify 추천 앨범을 불러오지 못했습니다.</p>}
        </div>
      </section>
    </main>
  );
}
