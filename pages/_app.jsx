import React from 'react';
import Head from 'next/head';
import { AppProvider } from '../context/AppContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <AppProvider>
      <Head>
        <title>Digital Graveyard — Preserve. Understand. Revive.</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="A non-morbid preservation archive for abandoned software projects, postmortem autopsies, and open stewardship transfers." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{
          minHeight: '100vh',
          padding: '16px 16px 36px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: 'var(--color-paper-bg)',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-ink)'
        }}
      >
        <div
          className="sketch-border-outer"
          style={{
            width: '100%',
            maxWidth: 1380,
            padding: '24px 32px 32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            minHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-paper)'
          }}
          data-purpose="canvas-container"
        >
          <div>
            <Navbar />
            <main style={{ width: '100%', marginTop: 20 }}>
              <Component {...pageProps} />
            </main>
          </div>
          <Footer />
        </div>
      </div>
    </AppProvider>
  );
}
