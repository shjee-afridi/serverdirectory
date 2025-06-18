// src/components/ServiceWorkerRegister.tsx
'use client'
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => {
            // Registration successful
            // console.log('Service worker registered:', reg);
          })
          .catch(err => {
            // Registration failed
            // console.error('Service worker registration failed:', err);
          });
      });
    }
  }, []);
  return null;
}
