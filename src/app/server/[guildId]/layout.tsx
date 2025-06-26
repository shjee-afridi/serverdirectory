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
    ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=256`
    : '/icon-512x512.png'; // Fallback to site icon
  
  const serverUrl = `${process.env.NEXTAUTH_URL || 'https://hentaidiscord.com'}/server/${params.guildId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: serverUrl,
      siteName: 'Hentai Discord',
      images: [
        {
          url: serverIconUrl,
          width: 256,
          height: 256,
          alt: `${server.name} Discord Server Icon`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [serverIconUrl],
    },
    other: {
      'theme-color': server.colorTheme || '#7289da',
    },
  };
}

export default function ServerLayout({ children }: Props) {
  return children;
}
