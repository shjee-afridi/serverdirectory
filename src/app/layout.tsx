import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Hentai Discord',
  description: 'Discover and share Discord servers!',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'icon', url: '/icon-192x192.png', sizes: '192x192' },
    { rel: 'icon', url: '/icon-512x512.png', sizes: '512x512' },
    { rel: 'icon', url: "/icon-48x48.png", sizes: "48x48" },
    { rel: 'icon', url: "/icon-72x72.png", sizes: "72x72" },
    { rel: 'icon', url: "/icon-96x96.png", sizes: "96x96" },
    { rel: 'icon', url: "/icon-128x128.png", sizes: "128x128" },
    { rel: 'icon', url: "/icon-256x256.png", sizes: "256x256" },

  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Inline critical CSS for above-the-fold rendering */}
        <style>{`
          :root {
            --foreground-rgb: 0, 0, 0;
            --background-start-rgb: 214, 219, 220;
            --background-end-rgb: 255, 255, 255;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --foreground-rgb: 255, 255, 255;
              --background-start-rgb: 0, 0, 0;
              --background-end-rgb: 0, 0, 0;
            }
          }
          body {
            color: rgb(var(--foreground-rgb));
            background: linear-gradient(
              to bottom,
              transparent,
              rgb(var(--background-end-rgb))
            ) rgb(var(--background-start-rgb));
          }
        `}</style>
        <meta name="theme-color" content="#000000" />
        {/* SEO Optimized Meta Tags */}
        <meta name="description" content="Find the top hentai Discord servers with active NSFW anime communities, roleplay, and exclusive content. Join the best 18+ anime chatrooms today!" />
        <meta name="keywords" content="Hentai Discord, NSFW Anime Discord, Best Hentai Server, 18+ Anime Community, Anime Roleplay, Adult Anime Chat, Exclusive Hentai Content, Discord NSFW, Top Anime Server, Hentai Chatroom" />
        <meta name="author" content="Hentai Discord" />

        {/* Open Graph Meta Tags (For Discord, Facebook, etc.) */}
        <meta property="og:title" content="Best Hentai Discord Server - Join Top NSFW Anime Communities" />
        <meta property="og:description" content="Join the best hentai Discord servers with thousands of active members, anime roleplay, and NSFW discussions!" />
        <meta property="og:image" content="https://hentaidiscord.com/embed-image.avif" />
        <meta property="og:url" content="https://hentaidiscord.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Hentai Discord" />

        {/*Twitter Card Meta Tags (For Twitter Embed) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Best Hentai Discord Server - Join Top NSFW Anime Communities" />
        <meta name="twitter:description" content="Explore top hentai Discord servers with exclusive 18+ anime content and a thriving anime community!" />
        <meta name="twitter:image" content="%PUBLIC_URL%/embed-image.avif" />
        <meta name="twitter:url" content="https://hentaidiscord.com" />
        
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: `{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://hentaidiscord.com",
          "name": "Hentai Discord",
          "url": "https://hentaidiscord.com",
          "description": "Find the best hentai Discord server with active NSFW anime communities, roleplay content.",
          "logo": "https://hentaidiscord.com/favicon.avif",
          "sameAs": [
            "https://discord.com/invite/35CXp4rFC2"
          ]
        }
      ]
    }`,
  }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: `{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the best hentai Discord server?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The best hentai Discord server are those with active NSFW anime communities, engaging discussions, and exclusive adult content."
          }
        },
        {
          "@type": "Question",
          "name": "How do I join a hentai Discord server?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can join a hentai Discord server by clicking an invite link on our site and following the verification steps."
          }
        }
      ]
    }`,
  }}
/>
      </head>
      <body className="pt-14"> {/* Add padding to prevent content under navbar */}
        <Navbar />
        <ClientProviders>
          <PWAInstallPrompt />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}