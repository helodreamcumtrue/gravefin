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
        <title>Project Graveyard — Trustless Escrow for Abandoned Code</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="A blind, escrow-backed marketplace for finishing other people's abandoned software projects." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}
