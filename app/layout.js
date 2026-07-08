import './globals.css';

export const metadata = {
  title: '청음록 | 음악 평점과 감상 기록',
  description: '앨범과 곡을 듣고 별점, 리뷰, 감상 기록을 남기는 음악 평점 앱',
  icons: {
    icon: [{ url: '/cheongeumrok-favicon-v6.png', type: 'image/png', sizes: '64x64' }],
    shortcut: ['/cheongeumrok-favicon-v6.png'],
    apple: [{ url: '/apple-touch-icon.png?v=4', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" type="image/png" sizes="64x64" href="/cheongeumrok-favicon-v6.png" />
        <link rel="shortcut icon" type="image/png" href="/cheongeumrok-favicon-v6.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4" />
      </head>
      <body>{children}</body>
    </html>
  );
}
