import Link from 'next/link';

export default function AlbumCard({ album }) {
  return (
    <Link className="albumCard" href={`/albums/${album.id}`}>
      {album.coverUrl ? <div className="cover imageCover" style={{ backgroundImage: `url(${album.coverUrl})` }}><span /></div> : <div className="cover"><span>{album.title.slice(0, 1)}</span></div>}
      <div>
        <p className="mood">{album.genre} · {album.year}</p>
        <h3>{album.title}</h3>
        <p className="artist">{album.artist}</p>
        <p className="stars">{album.rating ? '★'.repeat(Math.floor(album.rating)) : '별점 대기'}{album.rating % 1 ? '½' : ''} <span>{album.rating ? album.rating.toFixed(1) : '—'} · 리뷰 {album.reviews}</span></p>
        <div className="tags">{album.mood.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
    </Link>
  );
}
