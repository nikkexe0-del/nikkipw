import '../styles/globals.css';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import WhatsAppPopup from '../src/components/WhatsAppPopup';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // DevTools protection for non-admin users
    const script = document.createElement('script');
    script.innerHTML = `
      (function() {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'F12' || 
              (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
              (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
          }
        }, true);
        document.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          return false;
        }, true);
      })();
    `;
    document.head.appendChild(script);
  }, []);

  return (
    <>
      <Head>
        <title>Science & Fun — Premium Learning Platform</title>
        <meta name="description" content="India's most premium free educational platform. Access top batches, courses & live classes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <WhatsAppPopup />
    </>
  );
}
