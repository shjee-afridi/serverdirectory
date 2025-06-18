// src/components/ClientProviders.tsx
'use client';
import { SessionProvider } from 'next-auth/react';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ServiceWorkerRegister />
      {children}
    </SessionProvider>
  );
}
