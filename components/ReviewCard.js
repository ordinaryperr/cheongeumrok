import Link from 'next/link';

export default function ReviewCard({ review }) {
  return (
    <article className="reviewCard compact">
      <Link
        className={`miniCover ${review.album.coverUrl ? 'imageCover' : ''}`}
        href={`/albums/${review.album.id}`}
        style={review.album.coverUrl ? { backgroundImage: `url(${review.album.coverUrl})` } : undefined}
      >
        <span>{review.album.coverUrl ? '' : review.album.title.slice(0, 1)}</span>
      </Link>
      <div>
        <div className="reviewMeta"><b>@{review.user}</b><span>{review.createdAt}</span></div>
        <Link href={`/albums/${review.album.id}`}><h3>{review.album.title}</h3></Link>
        <p className="artist">{review.album.artist}</p>
        <p className="stars">{'★'.repeat(Math.floor(review.rating))}{review.rating % 1 ? '½' : ''} <span>{review.rating.toFixed(1)}</span></p>
        <p className="reviewText">{review.text}</p>
        <div className="reviewActions"><button>좋아요</button><button>댓글</button><button>저장</button></div>
      </div>
    </article>
  );
}
