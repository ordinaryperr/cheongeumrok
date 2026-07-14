import Link from 'next/link';
import AuthNav from './AuthNav';

export default function AppHeader() {
  return (
    <header className="siteHeader">
      <a className="logo" href="/" aria-label="청음록 메인으로 이동">청음록</a>
      <nav>
        <Link href="/search">검색</Link>
        <Link href="/reviews">피드</Link>
        <Link href="/news">뉴스</Link>
        <Link href="/about">소개</Link>
        <Link href="/write">기록하기</Link>
        <Link href="/profile">내 기록</Link>
        <AuthNav />
      </nav>
    </header>
  );
}
