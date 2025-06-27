import ServerPageClient from './ServerPageClient';
import { Metadata } from 'next';

type Props = {
  params: { guildId: string };
};

// Generate dynamic metadata for each server page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Fetch server data for metadata
    const baseUrl = process.env.NEXTAUTH_URL || 'https://hentaidiscord.com';
    const res = await fetch(`${baseUrl}/api/servers/${params.guildId}`, {
      cache: 'no-store' // Always fetch fresh data for SEO
    });
    
    if (!res.ok) {
      return {
        title: 'Server Not Found - Hentai Discord',
        description: 'The Discord server you are looking for could not be found.'
      };
    }
    
    const server = await res.json();
    
    // Create optimized title and description for the server itself
    const serverTitle = server.name;
    const serverDescription = server.description ? 
      server.description.replace(/<[^>]*>/g, '').substring(0, 160) : 
      `Join ${server.name} Discord server with ${server.memberCount || 'thousands of'} active members.`;
    
    // Create keywords based on server data
    const keywords = [
      `${server.name} Discord`,
      `${server.name} Discord server`,
      `join ${server.name}`,
      `${server.name} Discord invite`,
      'Discord server directory',
      'Hentai Discord',
      'Discord servers',
      'anime Discord',
      'NSFW Discord',
      ...(server.categories || []).map((cat: string) => `${cat} Discord servers`),
      ...(server.tags || []).map((tag: string) => `${tag} Discord`)
    ].join(', ');

    return {
      title: `${serverTitle} - Discord Server`,
      description: serverDescription,
      keywords: keywords,
      
      // Open Graph tags for social sharing - focused on the server
      openGraph: {
        title: serverTitle,
        description: serverDescription,
        url: `${baseUrl}/server/${params.guildId}`,
        siteName: server.name,
        images: [
          {
            url: server.icon ? `https://cdn.discordapp.com/icons/${params.guildId}/${server.icon}.png?size=512` : '/icon-512x512.png',
            width: 512,
            height: 512,
            alt: `${server.name} Discord Server Icon`,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      
      // Twitter Card tags - focused on the server
      twitter: {
        card: 'summary_large_image',
        title: serverTitle,
        description: serverDescription,
        images: [server.icon ? `https://cdn.discordapp.com/icons/${params.guildId}/${server.icon}.png?size=512` : '/icon-512x512.png'],
      },
      
      // Additional SEO tags
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      
      // Canonical URL
      alternates: {
        canonical: `${baseUrl}/server/${params.guildId}`
      },
      
      // Additional meta tags
      other: {
        'discord:server_id': params.guildId,
        'discord:server_name': server.name,
        'server:member_count': server.memberCount?.toString() || '0',
        'server:categories': (server.categories || []).join(', '),
        'server:verified': server.verified ? 'true' : 'false',
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Discord Server - Hentai Discord',
      description: 'Discover amazing Discord servers on Hentai Discord directory.'
    };
  }
}

export default function ServerPage({ params }: Props) {
  return <ServerPageClient params={params} />;
}