import AppHeader from '../../components/AppHeader';
import BeyondCurriculumClient from '../../components/BeyondCurriculumClient';
import BeyondPersonalization from '../../components/BeyondPersonalization';

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
        <BeyondPersonalization />
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">your curriculum</p>
            <h2>Freshman부터 Senior까지.</h2>
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
        <BeyondCurriculumClient />
      </section>
    </main>
  );
}
