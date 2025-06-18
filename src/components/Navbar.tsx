// src/components/Navbar.tsx
'use client';
import { useState } from 'react';
import { usePWAInstall, useNotificationPrompt } from './PWAInstallPrompt';
import Link from 'next/link';
import { FaBars, FaHome, FaUser, FaThLarge, FaDiscord, FaBell, FaBellSlash } from 'react-icons/fa';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { showPrompt, handleInstall, deferredPrompt, isInstalled, installUnavailableReason } = usePWAInstall();
  const { notifStatus, notifMessage, handleEnableNotifications } = useNotificationPrompt();
  // Add a handler for disabling notifications
  const handleDisableNotifications = () => {
    // Browsers do not allow programmatic revocation of notification permission,
    // but we can show a message or guide the user to browser settings.
    alert('To disable notifications, please change the permission in your browser settings.');
  };
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-2 border-b border-white/10 bg-neutral-900 text-white"
      style={{ boxShadow: 'none' }}
    >
      {/* Left: Logo and name */}
      <Link href="/" className="flex items-center gap-2 flex-1 group" onClick={() => setOpen(false)}>
        <img src="/icon-48x48.png" alt="Logo" className="h-8 w-8 rounded group-hover:opacity-80 transition" />
        <span className="font-bold text-lg tracking-wide ml-2 group-hover:text-blue-300 transition">HentaiDiscord</span>
      </Link>
      {/* Right: Desktop nav (Home, Profile, Dashboard, Support, Install App, Notifications) */}
      <div className="hidden md:flex gap-6 items-center">
        <Link href="/" className="flex items-center gap-1 hover:text-blue-200 transition"><FaHome /> Home</Link>
        <Link href="/profile" className="flex items-center gap-1 hover:text-blue-200 transition"><FaUser /> Profile</Link>
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-blue-200 transition"><FaThLarge /> Dashboard</Link>
        <a href="https://discord.gg/35CXp4rFC2" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-200 transition"><FaDiscord /> Support</a>
        <button
          onClick={handleInstall}
          className={`flex items-center gap-1 px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition${(!deferredPrompt || isInstalled) ? ' opacity-50 cursor-not-allowed' : ''}`}
          disabled={!deferredPrompt || isInstalled}
          title={(!deferredPrompt || isInstalled) && installUnavailableReason ? installUnavailableReason : undefined}
        >
          <span>Install App</span>
        </button>
        {notifStatus !== 'granted' ? (
          <button
            onClick={handleEnableNotifications}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            <FaBell /> Enable Notifications
          </button>
        ) : (
          <button
            onClick={handleDisableNotifications}
            className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            <FaBellSlash /> Disable Notifications
          </button>
        )}
        {notifMessage && (
          <span className="ml-2 text-sm text-white bg-green-700 px-2 py-1 rounded">{notifMessage}</span>
        )}
      </div>
      {/* Hamburger icon for mobile */}
      <div className="flex items-center ml-auto">
        <button
          className="md:hidden p-2 focus:outline-none"
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
        >
          <FaBars size={24} />
        </button>
      </div>
      {/* Mobile sidebar (slide in from right) */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-colors duration-300 ${open ? 'bg-black/40 pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <div
          className={`absolute top-0 right-0 w-64 h-full bg-red-600 text-white shadow-lg flex flex-col p-6 gap-4 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <Link href="/" className="flex items-center gap-2 py-2 hover:text-white/80" onClick={() => setOpen(false)}><FaHome /> Home</Link>
          <Link href="/profile" className="flex items-center gap-2 py-2 hover:text-white/80" onClick={() => setOpen(false)}><FaUser /> Profile</Link>
          <Link href="/dashboard" className="flex items-center gap-2 py-2 hover:text-white/80" onClick={() => setOpen(false)}><FaThLarge /> Dashboard</Link>
          <a href="https://discord.gg/35CXp4rFC2" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-2 hover:text-white/80"><FaDiscord /> Support</a>
          <button
            onClick={() => { handleInstall(); setOpen(false); }}
            className={`flex items-center gap-2 py-2 bg-white/10 rounded hover:bg-white/20 transition mt-2${!deferredPrompt ? ' opacity-50 cursor-not-allowed' : ''}`}
            disabled={!deferredPrompt}
          >
            <span>Install App</span>
          </button>
          {notifStatus !== 'granted' ? (
            <button
              onClick={() => { handleEnableNotifications(); setOpen(false); }}
              className="flex items-center gap-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition mt-2"
            >
              <FaBell /> Enable Notifications
            </button>
          ) : (
            <button
              onClick={() => { handleDisableNotifications(); setOpen(false); }}
              className="flex items-center gap-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition mt-2"
            >
              <FaBellSlash /> Disable Notifications
            </button>
          )}
          {notifMessage && (
            <span className="text-sm text-white bg-green-700 px-2 py-1 rounded mt-2">{notifMessage}</span>
          )}
        </div>
      </div>
    </nav>
  );
}
