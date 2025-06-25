// src/app/home/page.tsx
import Home from '../page';
import React from 'react';
import Head from 'next/head';

export default function HomeWithCanonical(props: any) {
  return (
    <>
      <Head>
        <link rel="canonical" href="https://hentaidiscord.com/home" />
        <title>Hentai Discord Home</title>
        <meta name="description" content="Welcome to the Hentai Discord Home page. Discover and share Discord servers! Unique content for /home." />
      </Head>
      <Home {...props} />
    </>
  );
}
