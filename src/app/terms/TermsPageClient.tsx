'use client';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';

export default function TermsPageClient() {
  const [tosContent, setTosContent] = useState('');

  useEffect(() => {
    fetch('/tos.md')
      .then(res => res.text())
      .then(setTosContent);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-14">
      <Navbar />
      <ClientProviders>
        <PWAInstallPrompt />
        {/* Structured Data for Terms Page */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Terms of Service - Hentai Discord',
              description:
                'Terms of Service, licensing, copyright, and legal information for Hentai Discord',
              url: 'https://hentaidiscord.com/terms',
              mainEntity: {
                '@type': 'DigitalDocument',
                name: 'Terms of Service',
                description: 'Legal terms, licensing, and copyright information',
                author: {
                  '@type': 'Organization',
                  name: 'Hentai Discord',
                },
                datePublished: '2025-06-10',
                dateModified: '2025-06-27',
                license: 'https://hentaidiscord.com/terms',
                copyrightHolder: {
                  '@type': 'Organization',
                  name: 'Hentai Discord',
                },
                copyrightYear: '2025',
              },
            }),
          }}
        />
        <main className="max-w-2xl mx-auto px-4 pt-2 pb-6 md:pt-4 md:pb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-10 text-center">Terms of Service</h1>
          <article
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: marked.parse(tosContent) }}
          />
        </main>
      </ClientProviders>
    </div>
  );
}
