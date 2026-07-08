export default function NewsCard({ item }) {
  return (
    <article className="newsCard">
      <div className="newsTop">
        <span>{item.category}</span>
        <small>{item.date}</small>
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <div className="newsSource">
        {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source}</a> : item.source}
      </div>
    </article>
  );
}
