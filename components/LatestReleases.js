function buildWriteHref(item) {
  const params = new URLSearchParams({
    spotify: item.id,
    type: 'album',
    title: item.title,
    artist: item.artist,
    year: item.year || '',
    coverUrl: item.coverUrl || '',
    externalUrl: item.externalUrl || '',
  });

  if (item.releaseDate) params.set('releaseDate', item.releaseDate);
  return `/write?${params.toString()}`;
}

export default function LatestReleases({ releases = [] }) {
  if (!releases.length) return null;

  return (
    <section className="section topTight">
      <div className="sectionTitle centeredTitle">
        <div>
          <p className="eyebrow">auto updated</p>
          <h2>최신 발매 음악</h2>
        </div>
      </div>
      <div className="spotifyResultGrid">
        {releases.map((item) => (
          <article className="spotifyResultCard" key={item.id}>
            {item.coverUrl ? (
              <div className="spotifyCover" style={{ backgroundImage: `url(${item.coverUrl})` }} aria-label={`${item.title} cover`} />
            ) : (
              <div className="miniCover"><span>{item.title.slice(0, 1)}</span></div>
            )}
            <div>
              <p className="mood">New Release · {item.year}</p>
              <h3>{item.title}</h3>
              <p className="artist">{item.artist}</p>
              <div className="reviewActions">
                <a href={item.externalUrl || '#'} target="_blank" rel="noreferrer">Spotify</a>
                <a href={buildWriteHref(item)}>기록하기</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
