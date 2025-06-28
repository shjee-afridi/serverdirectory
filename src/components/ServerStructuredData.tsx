import React from 'react';

interface ServerStructuredDataProps {
  server: {
    guildId: string;
    name: string;
    description?: string;
    memberCount?: number;
    verified?: boolean;
    categories?: string[];
    tags?: string[];
    icon?: string;
    inviteCode?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export default function ServerStructuredData({ server }: ServerStructuredDataProps) {
  const baseUrl = 'https://www.hentaidiscord.com';
  const serverUrl = `${baseUrl}/server/${server.guildId}`;
  const iconUrl = server.icon 
    ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=512`
    : `${baseUrl}/icon-512x512.png`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": server.name,
    "description": server.description || `Join ${server.name} Discord server with active community discussions.`,
    "url": serverUrl,
    "logo": iconUrl,
    "image": iconUrl,
    "foundingDate": server.createdAt,
    "memberOf": {
      "@type": "WebSite",
      "name": "Hentai Discord",
      "url": baseUrl
    },
    "potentialAction": {
      "@type": "JoinAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": server.inviteCode ? `https://discord.gg/${server.inviteCode}` : serverUrl,
        "inLanguage": "en"
      },
      "name": `Join ${server.name}`
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "10",
      "bestRating": "5",
      "worstRating": "1"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "Discord Users",
      "geographicArea": "Worldwide"
    },
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": server.memberCount || 0,
      "unitText": "members"
    },
    "keywords": [
      `${server.name} Discord`,
      `${server.name} Discord server`,
      `Join ${server.name}`,
      "Discord server",
      "Discord community",
      ...(server.categories || []),
      ...(server.tags || [])
    ].join(", "),
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Community Support",
      "availableLanguage": "English"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Servers",
        "item": `${baseUrl}/servers`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": server.name,
        "item": serverUrl
      }
    ]
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${server.name} - Discord Server`,
    "description": server.description || `Join ${server.name} Discord server with active community discussions.`,
    "url": serverUrl,
    "mainEntity": {
      "@type": "Organization",
      "name": server.name,
      "url": serverUrl,
      "description": server.description
    },
    "breadcrumb": breadcrumbData,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Hentai Discord",
      "url": baseUrl
    },
    "potentialAction": {
      "@type": "ViewAction",
      "target": serverUrl,
      "name": `View ${server.name} Discord Server`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData, null, 2)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageData, null, 2)
        }}
      />
    </>
  );
}
