import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Coustard, Open_Sans } from 'next/font/google';
import '@/styles/main.scss';

const openSans = Open_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap'
});

const coustard = Coustard({
  weight: ['400', '900'],
  subsets: ['latin'],
  variable: '--font-coustard',
  display: 'swap'
});

const SITE_URL = 'https://eventbrite-preview.vercel.app';
const TITLE = 'See your Eventbrite event on Ticket Tailor';
const DESCRIPTION =
  'Paste any public Eventbrite URL and preview your event on Ticket Tailor instantly. Try our themes, see the per-ticket savings vs Eventbrite, and import in minutes.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Ticket Tailor'
  },
  description: DESCRIPTION,
  keywords: [
    'eventbrite alternative',
    'ticket tailor',
    'event ticketing',
    'eventbrite import',
    'ticketing comparison',
    'event preview'
  ],
  authors: [{ name: 'Ticket Tailor', url: 'https://www.tickettailor.com' }],
  creator: 'Ticket Tailor',
  publisher: 'Ticket Tailor',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Ticket Tailor',
    locale: 'en_GB'
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    creator: '@tickettailor'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' }
  }
};

export const viewport = {
  themeColor: '#222432',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${openSans.variable} ${coustard.variable}`}>
      <head>
        {/* Preload every theme's primary font up-front so switching themes
            doesn't trigger a noticeable webfont fetch. ~150KB total, cached
            after first load. */}
        {[
          '/fonts/dela-gothic-one/DelaGothicOne-Regular.woff2',
          '/fonts/inter/Inter-Regular.woff2',
          '/fonts/lexend/Lexend-Regular.woff2',
          '/fonts/noto-serif/NotoSerif-Regular.woff2',
          '/fonts/oswald/Oswald-Regular.woff2',
          '/fonts/poppins/Poppins-Regular.woff2',
          '/fonts/roboto-mono/RobotoMono-Regular.woff2',
          '/fonts/roboto/Roboto-Regular.woff2',
          '/fonts/rubik/Rubik-Light.woff2'
        ].map((href) => (
          <link
            key={href}
            rel="preload"
            as="font"
            type="font/woff2"
            href={href}
            crossOrigin="anonymous"
          />
        ))}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/brands.min.css"
        />
        {/* Free FA doesn't ship "Font Awesome 6 Pro"; alias the Pro family to
            the Free family so product styles that hardcode it still work, and
            map fa-light/fa-thin to the Free regular weight. */}
        <style>{`
          @font-face {
            font-family: "Font Awesome 6 Pro";
            font-style: normal;
            font-weight: 100 900;
            src: local("Font Awesome 6 Free");
          }
          /* Force non-italic for all FA icon classes — <i> defaults to italic. */
          [class*="fa-"], .fa, .fas, .far, .fal, .fab,
          .fa-solid, .fa-regular, .fa-light, .fa-thin, .fa-brands {
            font-style: normal !important;
          }
          /* Free FA doesn't have fa-light; alias to regular weight. */
          .fa-light, .fa-thin {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 400 !important;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
