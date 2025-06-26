import { Metadata } from 'next';

type Props = {
  params: { guildId: string };
  children: React.ReactNode;
};

async function getServerData(guildId: string) {
  try {
    // Use absolute URL for server-side fetches
    const baseUrl = process.env.NEXTAUTH_URL || 'https://hentaidiscord.com';
    const res = await fetch(`${baseUrl}/api/servers/${guildId}`, {
      cache: 'no-store', // Ensure fresh data for metadata
    });
    
    if (!res.ok) {
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching server data for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const server = await getServerData(params.guildId);
  
  if (!server) {
    return {
      title: 'Server Not Found - Hentai Discord',
      description: 'The requested Discord server could not be found.',
    };
  }

  const title = `${server.name} - Discord Server | Hentai Discord`;
  const description = server.shortDescription || server.description?.substring(0, 160) || 'Join this amazing Discord server!';
  const serverIconUrl = server.icon 
    ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=512`
    : 'https://hentaidiscord.com/icon-512x512.png'; // Use full URL for fallback
  
  const serverUrl = `${process.env.NEXTAUTH_URL || 'https://hentaidiscord.com'}/server/${params.guildId}`;

  return {
    title,
    description,
    openGraph: {
      title: server.name,
      description,
      url: serverUrl,
      siteName: 'Hentai Discord',
      images: [
        {
          url: serverIconUrl,
          width: 512,
          height: 512,
          alt: `${server.name} Discord Server Icon`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: server.name,
      description,
      images: [serverIconUrl],
    },
    other: {
      'theme-color': server.colorTheme || '#7289da',
    },
  };
}

export default async function ServerLayout({ children, params }: Props) {
  const server = await getServerData(params.guildId);
  
  return (
    <>
      {server && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": server.name,
              "description": server.shortDescription || server.description?.substring(0, 200) || 'Join this Discord server!',
              "url": `${process.env.NEXTAUTH_URL || 'https://hentaidiscord.com'}/server/${server.guildId}`,
              "image": server.icon 
                ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=512`
                : 'https://hentaidiscord.com/icon-512x512.png',
              "isPartOf": {
                "@type": "WebSite",
                "name": "Hentai Discord",
                "url": "https://hentaidiscord.com"
              },
              "about": {
                "@type": "Organization",
                "name": server.name,
                "description": server.description || server.shortDescription || 'Discord Server',
                "image": server.icon 
                  ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=512`
                  : 'https://hentaidiscord.com/icon-512x512.png',
                "url": server.link || `${process.env.NEXTAUTH_URL || 'https://hentaidiscord.com'}/server/${server.guildId}`,
                "sameAs": server.link ? [server.link] : undefined
              }
            })
          }}
        />
      )}
      {children}
    </>
  );
}
