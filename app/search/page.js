import AppHeader from '../../components/AppHeader';
import AlbumCard from '../../components/AlbumCard';
import LatestReleases from '../../components/LatestReleases';
import SearchClient from '../../components/SearchClient';
import { albums } from '../../data/mock';
import { getSpotifyNewReleases, hasSpotifyCredentials } from '../../lib/spotify';

export const metadata = { title: '검색 | 청음록' };
export const dynamic = 'force-dynamic';

async function getLatestReleases() {
  if (!hasSpotifyCredentials()) return [];

  try {
    return await getSpotifyNewReleases(10);
  } catch {
    return [];
  }
}

export default async function SearchPage() {
  const latestReleases = await getLatestReleases();

  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">search</p>
        <h1>무엇을 들었나요?</h1>
        <p className="lead">Spotify API로 앨범과 곡을 검색합니다. 좋은 음악을 발견하면 바로 감상 기록으로 이어갈 수 있습니다.</p>
        <SearchClient />
      </section>
      <LatestReleases releases={latestReleases} />
      <section className="section topTight">
        <div className="sectionTitle centeredTitle">
          <div>
            <p className="eyebrow">starter archive</p>
            <h2>청음록 추천 시작점</h2>
          </div>
        </div>
        <div className="albumGrid">{albums.map((album) => <AlbumCard key={album.id} album={album} />)}</div>
      </section>
    </main>
  );
}
