import PwaRegister from '../components/PwaRegister';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://cheongeumrok.vercel.app'),
  title: {
    default: '청음록 | 음악 평점과 감상 기록',
    template: '%s | 청음록',
  },
  description: '앨범과 곡에 별점과 감상을 남기고, 나만의 청음 기록을 쌓는 음악 기록 서비스.',
  applicationName: '청음록',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: '청음록',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: '청음록 | 음악을 듣고 기록하는 공간',
    description: '앨범과 곡에 별점과 감상을 남기고, 다른 사람의 청음 기록으로 취향을 넓혀보세요.',
    url: 'https://cheongeumrok.vercel.app',
    siteName: '청음록',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: '청음록 - 음악 평점과 감상 기록' }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '청음록 | 음악을 듣고 기록하는 공간',
    description: '앨범과 곡에 별점과 감상을 남기고 나만의 청음 기록을 쌓아보세요.',
    images: ['/og-image.svg'],
  },
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
        <meta name="theme-color" content="#17130f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" sizes="64x64" href="/cheongeumrok-favicon-v6.png" />
        <link rel="shortcut icon" type="image/png" href="/cheongeumrok-favicon-v6.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4" />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
