import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteName = 'PrimePass Agency Travel'
const siteUrl = 'https://primepassagency.com'
const siteDescription =
  'Viagens personalizadas, cotações rápidas e apoio real para planear a sua próxima viagem com mais segurança.'
const socialImage = '/primepass-logo-dark.jpeg'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/icon.png`,
  image: `${siteUrl}${socialImage}`,
  email: 'primepassagencytravel@primepassagency.com',
  telephone: '+351-961804838',
  sameAs: [siteUrl],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    'agência de viagens',
    'cotações de viagem',
    'viagens personalizadas',
    'passagens aéreas',
    'viagens Portugal',
    'viagens Brasil',
    'PrimePass Agency Travel',
  ],
  alternates: {
    canonical: '/',
  },
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: 'travel',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    locale: 'pt_PT',
    images: [
      {
        url: socialImage,
        width: 1024,
        height: 1024,
        alt: 'Logótipo da PrimePass Agency Travel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [socialImage],
  },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    shortcut: ['/icon.png'],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
