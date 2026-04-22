import type { Metadata, Viewport } from 'next'
import { Syne, Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import CookieBanner from '@/components/shared/CookieBanner'
import CursorGlow from '@/components/layout/CursorGlow'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VIDA — L\'écosystème vivant qui transforme ton monde',
  description: 'Une compagne vivante qui t\'accompagne, respecte ton rythme, et transforme chaque action en impact réel sur la planète. Santé holistique, communauté d\'entraide, rituels collectifs.',
  metadataBase: new URL('https://vida.purama.dev'),
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'VIDA — L\'écosystème vivant',
    description: 'Chaque action devient un impact réel. Santé, bien-être, communauté, planète.',
    url: 'https://vida.purama.dev',
    siteName: 'VIDA',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'VIDA — L\'écosystème vivant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIDA — L\'écosystème vivant',
    description: 'Chaque action devient un impact réel sur le monde.',
    images: ['/api/og'],
  },
  robots: { index: true, follow: true },
  // Pas de canonical root — laissé aux pages de définir le leur via
  // generateMetadata si besoin (évite canonical incorrect cross-page).
}

export const viewport: Viewport = {
  themeColor: '#10B981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={`${syne.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('vida-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}else{document.documentElement.dataset.theme='dark'}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-void)] font-[family-name:var(--font-body)] text-[var(--text-primary)] antialiased">
        <div className="aurora" />
        <div className="grid-overlay" />
        <div className="noise-overlay" />
        <CursorGlow />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <CookieBanner />
        </NextIntlClientProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(16,185,129,0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#f0fdf4',
            },
          }}
        />
      </body>
    </html>
  )
}
