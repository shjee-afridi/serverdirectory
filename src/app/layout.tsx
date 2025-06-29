import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import ClientProviders from '@/components/ClientProviders';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Navbar from '@/components/Navbar';
import BootstrapClient from '@/components/BootstrapClient';

export const metadata = {
  metadataBase: new URL('https://www.hentaidiscord.com'),
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
  openGraph: {
    title: 'Hentai Discord',
    description: 'Discover and share Discord servers!',
    url: 'https://hentaidiscord.com',
    siteName: 'Hentai Discord',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Hentai Discord Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Hentai Discord',
    description: 'Discover and share Discord servers!',
    images: ['/icon-512x512.png'],
  },
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
        <meta name="keywords" content="Hentai Discord, NSFW Anime Discord, Best Hentai Server, 18+ Anime Community, Anime Roleplay, Adult Anime Chat, Exclusive Hentai Content, Discord NSFW, Top Anime Server, Hentai Chatroom, Anime Discord List, NSFW Discord List, Discord Server Directory, Anime Community, Adult Discord, Discord for Adults, Discord for Anime, Discord Roleplay, Discord 18+, Discord Servers 2025, Trending Discord Servers, Popular Discord Servers, Anime Social, Anime Friends, Anime Dating, Anime Chat, Anime Forums, Anime Groups, Discord Invite, Discord Join, Discord Safe, Discord Verified, Discord Active, Discord Events, Discord Giveaways, Discord Bots, Discord Moderation, Discord Rules, Discord FAQ, Discord Support, Discord Help, Discord Community, Discord Network, Discord Platform, Discord Social, Discord Online, Discord Members, Discord Channels, Discord Categories, Discord Movie, Discord Gaming, Discord Music, Discord Study, Discord Meme, Discord Art, Discord Tech, Discord Programming, Discord Kpop, Discord Sports, Discord Book, Discord Language, Discord LGBTQ, Discord Furry, Discord Minecraft, Discord Valorant, Discord Genshin Impact, Discord Roblox, Discord Among Us, Discord Fortnite, Discord League of Legends, Discord Overwatch, Discord Call of Duty, Discord Aesthetic, Discord Chill, Discord Community, Discord Active, Discord New, Discord Big, Discord Small, Discord International, Discord English, Discord Hindi, Discord Spanish, Discord French, Discord German, Discord Russian, Discord Japanese, Discord Korean, Discord Chinese, sdwd, random, join any Discord server, find Discord server, search Discord server, best Discord server, top Discord server, discord server for everything, discord server for anything, discord server for everyone, discord server for you, discord server for all, discord server for fun, discord server for chat, discord server for games, discord server for anime, discord server for movies, discord server for music, discord server for study, discord server for memes, discord server for art, discord server for tech, discord server for programming, discord server for kpop, discord server for sports, discord server for books, discord server for language, discord server for lgbtq, discord server for furry, discord server for minecraft, discord server for valorant, discord server for genshin impact, discord server for roblox, discord server for among us, discord server for fortnite, discord server for league of legends, discord server for overwatch, discord server for call of duty, discord server for aesthetic, discord server for chill, discord server for community, discord server for active, discord server for new, discord server for big, discord server for small, discord server for international, discord server for english, discord server for hindi, discord server for spanish, discord server for french, discord server for german, discord server for russian, discord server for japanese, discord server for korean, discord server for chinese, discord server for sdwd, discord server for random" />
        <link rel="canonical" href="https://hentaidiscord.com" />
        <link rel="preconnect" href="https://discord.com" />
        <link rel="dns-prefetch" href="https://discord.com" />
        {/* Canonical and preconnect/dns-prefetch added for SEO and performance */}
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
        
        {/* Structured Data: WebSite and BreadcrumbList for enhanced SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://hentaidiscord.com",
              "name": "Hentai Discord",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://hentaidiscord.com/search/{search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://hentaidiscord.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Servers",
                  "item": "https://hentaidiscord.com/servers"
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
      "@type": "Organization",
      "name": "Hentai Discord",
      "url": "https://hentaidiscord.com",
      "description": "Find the best hentai Discord server with active NSFW anime communities, roleplay content.",
      "logo": "https://hentaidiscord.com/icon-512x512.png",
      "sameAs": [
        "https://discord.com/invite/35CXp4rFC2"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "500",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Discord Community Member"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          },
          "reviewBody": "Excellent directory for finding Discord servers with active communities!"
        }
      ]
    }`,
  }}
/>        <script
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
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: `{
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Hentai Discord - Best NSFW Anime Discord Servers",
      "description": "Discover the top hentai Discord servers with active NSFW anime communities, roleplay, and exclusive content.",
      "url": "https://hentaidiscord.com",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Discord Server Directory",
        "description": "A curated list of the best hentai and anime Discord servers with user reviews and ratings",
        "numberOfItems": "1000+",
        "itemListElement": []
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://hentaidiscord.com/search/{search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://hentaidiscord.com"
          }
        ]
      }
    }`,
  }}
/>
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: `{
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Discord Server Directory Service",
      "description": "A comprehensive directory service for finding and discovering Discord servers with user reviews and ratings",
      "provider": {
        "@type": "Organization",
        "name": "Hentai Discord",
        "url": "https://hentaidiscord.com"
      },
      "serviceType": "Directory Service",
      "areaServed": "Worldwide",
      "url": "https://hentaidiscord.com",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Discord Server Listings",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Discord Server Listing",
              "description": "List your Discord server in our directory"
            },
            "price": "0",
            "priceCurrency": "USD"
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "500",
        "bestRating": "5",
        "worstRating": "1"
      }
    }`,
  }}
/>
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: `{
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "name": "Hentai Discord Logo",
      "description": "Official logo and branding for Hentai Discord server directory",
      "url": "https://hentaidiscord.com/icon-512x512.png",
      "width": 512,
      "height": 512,
      "encodingFormat": "image/png",
      "contentUrl": "https://hentaidiscord.com/icon-512x512.png",
      "creator": {
        "@type": "Organization",
        "name": "Hentai Discord"
      },
      "license": "https://hentaidiscord.com/terms",
      "acquireLicensePage": "https://hentaidiscord.com/terms",
      "creditText": "Hentai Discord - Discord Server Directory",
      "copyrightNotice": "© 2025 Hentai Discord. All rights reserved."
    }`,
  }}
/>
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: `{
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Hentai Discord Server Directory",
      "description": "Discover and review Discord servers in our comprehensive directory featuring NSFW anime communities",
      "url": "https://hentaidiscord.com",
      "brand": {
        "@type": "Brand",
        "name": "Hentai Discord"
      },
      "category": "Software > Communication > Directory Service",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": "https://hentaidiscord.com"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "500",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Discord User"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          },
          "reviewBody": "Excellent directory for finding active Discord servers with great communities!"
        }
      ]
    }`,
  }}
/>
      </head>
      <body className="pt-14"> {/* Add padding to prevent content under navbar */}
        <BootstrapClient />
        <Navbar />
        <ClientProviders>
          <PWAInstallPrompt />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}