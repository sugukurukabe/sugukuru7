import './globals.css';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export const metadata = {
  title: 'スグクル3.0',
  description: '農業特定技能人材の派遣・登録支援事業向け独自OS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 text-gray-900">
        <Sidebar />
        <Header />
        <main className="ml-60 pt-16 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
