import Link from 'next/link';
import AuthNav from './AuthNav';

export default function AppHeader() {
  return (
    <header className="siteHeader">
      <nav className="headerNav headerNavLeft" aria-label="주요 메뉴">
        <Link href="/search">Search</Link>
        <Link href="/reviews">Feed</Link>
        <Link href="/news">News</Link>
        <Link href="/about">About</Link>
      </nav>

      <Link className="logo" href="/" aria-label="청음록 메인으로 이동">청음록</Link>

      <nav className="headerNav headerNavRight" aria-label="사용자 메뉴">
        <Link href="/beyond-your-fence">Beyond</Link>
        <Link href="/profile">My Records</Link>
        <Link href="/write">Write</Link>
        <AuthNav />
      </nav>
    </header>
  );
}
