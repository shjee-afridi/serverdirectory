// src/app/terms/page.tsx
'use client';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';

export default function TermsPage() {
  const [tosContent, setTosContent] = useState('');

  useEffect(() => {
    fetch('/pp.md')
      .then(res => res.text())
      .then(setTosContent);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-14">
      <Navbar />
      <ClientProviders>
        <PWAInstallPrompt />
        <main className="max-w-2xl mx-auto px-4 pt-2 pb-6 md:pt-4 md:pb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-10 text-center">Privacy Policy</h1>
          <article
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: marked.parse(tosContent) }}
          />
        </main>
      </ClientProviders>
    </div>
  );
}
