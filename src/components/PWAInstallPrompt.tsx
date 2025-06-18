// src/components/PWAInstallPrompt.tsx
'use client';
import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installUnavailableReason, setInstallUnavailableReason] = useState<string | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Most browsers
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setInstallUnavailableReason('App is already installed.');
        return;
      }
      // iOS Safari
      if ((window.navigator as any).standalone) {
        setIsInstalled(true);
        setInstallUnavailableReason('App is already installed.');
        return;
      }
      setIsInstalled(false);
      setInstallUnavailableReason(null);
    };
    checkInstalled();
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallUnavailableReason('App is already installed.');
    });
    return () => {
      window.removeEventListener('appinstalled', () => {
        setIsInstalled(true);
        setInstallUnavailableReason('App is already installed.');
      });
    };
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    // If not installed and no deferredPrompt, set reason
    if (!isInstalled && !deferredPrompt) {
      setInstallUnavailableReason('Install is not available. You may have already installed, or your browser does not support PWA install.');
    } else if (!isInstalled) {
      setInstallUnavailableReason(null);
    }
  }, [isInstalled, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  return { showPrompt, handleInstall, deferredPrompt, isInstalled, installUnavailableReason };
}

export function useNotificationPrompt() {
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | null>(null);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotifStatus(Notification.permission);
  }, []);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      setNotifMessage('Notifications are not supported in this browser.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission);
      if (permission !== 'granted') {
        setNotifMessage('Permission denied.');
        return;
      }
      // Wait for service worker to be ready
      const reg = await navigator.serviceWorker.ready;
      // Subscribe to push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || undefined;
      if (!vapidPublicKey) {
        setNotifMessage('VAPID public key is not set.');
        return;
      }
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      // Send subscription to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      if (res.ok) {
        setNotifMessage('Notifications enabled!');
      } else {
        setNotifMessage('Failed to register for notifications.');
      }
    } catch (err: any) {
      setNotifMessage('Error enabling notifications: ' + err.message);
    }
  };

  // Helper to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return { notifStatus, notifMessage, handleEnableNotifications };
}

export default function PWAInstallPrompt() {
  // No UI rendered here anymore
  return null;
}
