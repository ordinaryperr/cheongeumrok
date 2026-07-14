import AppHeader from '../../components/AppHeader';

export const metadata = { title: '소개' };

export default function AboutPage() {
  return (
    <main>
      <AppHeader />
      <section className="pageHero small">
        <p className="eyebrow">about cheongeumrok</p>
        <h1>음악을 듣고 지나치지 않도록.</h1>
        <p className="lead">
          청음록은 앨범과 곡에 별점과 감상을 남기고, 시간이 지나도 다시 꺼내볼 수 있는
          나만의 음악 기록장을 목표로 만드는 서비스입니다.
        </p>
        <div className="heroActions">
          <a className="primary" href="/search">첫 기록 남기기</a>
          <a className="secondary" href="/reviews">다른 감상 보기</a>
        </div>
      </section>

      <section className="section topTight">
        <div className="pillarGrid">
          <article className="pillarCard">
            <p>01 · record</p>
            <h3>들은 음악을 기록합니다.</h3>
            <span>앨범과 곡을 검색하고 0.5 단위 별점, 한줄평, 긴 감상을 남깁니다.</span>
          </article>
          <article className="pillarCard">
            <p>02 · archive</p>
            <h3>취향이 쌓이는 프로필.</h3>
            <span>내가 남긴 감상이 프로필에 모이고, 시간이 지나도 다시 찾아볼 수 있습니다.</span>
          </article>
          <article className="pillarCard">
            <p>03 · discover</p>
            <h3>타인의 기록으로 발견합니다.</h3>
            <span>다른 사람의 별점과 감상을 통해 익숙한 음악 너머로 취향을 넓혀갑니다.</span>
          </article>
        </div>
      </section>

      <section className="section narrow topTight">
        <div className="feedbackBox">
          <p className="eyebrow">feedback</p>
          <h2>아직 만드는 중입니다.</h2>
          <p className="bodyText">
            청음록은 현재 MVP 단계입니다. 써보면서 불편했던 점, 있으면 좋을 기능,
            음악 기록 서비스에 기대하는 점을 알려주시면 다음 개선에 반영하겠습니다.
          </p>
          <div className="heroActions">
            <a className="primary" href="mailto:mnmh0311@naver.com?subject=청음록 피드백">피드백 메일 보내기</a>
            <a className="secondary" href="https://github.com/ordinaryperr/cheongeumrok" target="_blank" rel="noreferrer">GitHub 보기</a>
          </div>
        </div>
      </section>
    </main>
  );
}
