import AppHeader from '../../components/AppHeader';
import { curriculumTracks } from '../../data/beyondYourFence';

export const metadata = {
  title: 'Beyond Your Fence',
  description: '기록한 음악을 바탕으로 취향의 울타리 밖으로 나아가는 청음 커리큘럼.',
};

export default function BeyondYourFencePage() {
  return (
    <main className="beyondPage">
      <AppHeader />
      <section className="pageHero beyondHero">
        <p className="eyebrow">listening curriculum</p>
        <h1>Beyond<br />Your Fence</h1>
        <p className="lead">
          추천이 아니라 과제입니다. 청음록은 당신의 기록에서 출발해 익숙한 취향 바깥의 음악을 학년별로 열어줍니다.
          다음 학년은 쉽게 열리지 않습니다. 듣고, 기록하고, 비교하고, 이해해야 합니다.
        </p>
        <div className="beyondManifesto">
          <span>Not recommendations. Assignments.</span>
          <span>Do not skip the semester.</span>
          <span>A record is your attendance.</span>
        </div>
      </section>

      <section className="section topTight beyondOverview">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">your curriculum</p>
            <h2>Freshman부터 Graduate까지.</h2>
          </div>
        </div>
        <div className="gradeRail">
          {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((grade, index) => (
            <div key={grade} className={index === 0 ? 'active' : ''}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{grade}</b>
              <small>{index === 0 ? 'Open' : 'Locked'}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="section topTight curriculumSection">
        <div className="curriculumList">
          {curriculumTracks.map((track) => (
            <article className="curriculumTrack" key={track.id}>
              <div className="trackIntro">
                <p className="eyebrow">{track.signal}</p>
                <h2>{track.genre}</h2>
                <p>{track.reason}</p>
              </div>
              <div className="levelGrid">
                {track.levels.map((level, index) => {
                  const completed = level.status === 'open' ? 1 : 0;
                  const total = level.requirements.length;
                  const progress = Math.round((completed / total) * 100);

                  return (
                    <div className={`levelCard ${level.status}`} key={level.name}>
                      <div className="levelTop">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <em>{level.status === 'open' ? 'Open' : 'Locked'}</em>
                      </div>
                      <h3>{level.name}</h3>
                      <p>{level.description}</p>

                      <div className="semesterProgress" aria-label={`${level.name} progress`}>
                        <div className="progressMeta">
                          <b>{completed} / {total}</b>
                          <span>{progress}% complete</span>
                        </div>
                        <div className="progressBar"><i style={{ width: `${progress}%` }} /></div>
                      </div>

                      <div className="courseAlbums">
                        {level.albums.map((album) => <b key={album}>{album}</b>)}
                      </div>
                      <div className="requirements">
                        <strong>Requirements</strong>
                        {level.requirements.map((item, requirementIndex) => (
                          <span className={requirementIndex < completed ? 'checked' : ''} key={item}>
                            {requirementIndex < completed ? '☑' : '□'} {item}
                          </span>
                        ))}
                      </div>

                      {level.status === 'open' ? (
                        <a className="semesterButton" href="/search">Start {level.name}</a>
                      ) : (
                        <div className="lockedHint">Complete {track.levels[index - 1]?.name || 'previous semester'} requirements to unlock.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
