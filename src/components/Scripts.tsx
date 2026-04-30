'use client';

import Script from 'next/script';

// Mirrors tickettailor-website/src/components/scripts.tsx so the visualiser
// reports into the same GTM containers + cross-domain attribution as the
// main marketing site. Intercom intentionally omitted — chat widget would
// distract from the funnel here.

const Scripts = () => {
  return (
    <>
      <Script
        async
        id="gtm-script"
        src="https://www.googletagmanager.com/gtm.js?id=GTM-K4B6RL&gtm_auth=Uf1tdGnzovcVuPQ65z3Ddw&gtm_preview=env-2&gtm_cookies_win=x"
      />
      <Script id="gtm-script-tag">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=Uf1tdGnzovcVuPQ65z3Ddw&gtm_preview=env-2&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-K4B6RL');`}
      </Script>

      <Script id="gtm-script-2-tag">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-P9676DH2');`}
      </Script>

      <Script
        src="https://js.tickettailor.com/tickettailor-stitching.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://js.tickettailor.com/tickettailor-production.js"
        strategy="afterInteractive"
      />
    </>
  );
};

export default Scripts;
