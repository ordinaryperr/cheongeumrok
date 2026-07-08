import AppHeader from '../../components/AppHeader';
import ProfileClient from '../../components/ProfileClient';

export const metadata = { title: '내 기록 | 청음록' };

export default function ProfilePage() {
  return (
    <main>
      <AppHeader />
      <ProfileClient />
    </main>
  );
}
