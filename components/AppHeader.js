import Link from 'next/link';
import AuthNav from './AuthNav';

export default function AppHeader() {
  return (
    <header className="siteHeader">
      <nav className="headerNav headerNavLeft" aria-label="주요 메뉴">
        <Link href="/search">검색</Link>
        <Link href="/reviews">피드</Link>
        <Link href="/news">뉴스</Link>
        <Link href="/beyond-your-fence">Beyond</Link>
        <Link href="/about">소개</Link>
      </nav>

      <a className="logo" href="/" aria-label="청음록 메인으로 이동">청음록</a>

      <nav className="headerNav headerNavRight" aria-label="사용자 메뉴">
        <Link href="/profile">내 기록</Link>
        <Link href="/write">기록하기</Link>
        <AuthNav />
      </nav>
    </header>
  );
}
