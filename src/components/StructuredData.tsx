'use client';
import { useEffect, useState } from 'react';

export default function StructuredData() {
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch top servers for structured data
    fetch('/api/servers?sort=bumped&page=1&perPage=10')
      .then(res => res.json())
      .then(data => {
        if (data.servers) {
          setServers(data.servers);
        }
      })
      .catch(err => console.log('Failed to fetch servers for structured data'));
  }, []);

  useEffect(() => {
    if (servers.length > 0) {
      // Create structured data for the item list
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Top Discord Servers",
        "description": "Featured Discord servers with reviews and ratings",
        "numberOfItems": servers.length,
        "itemListElement": servers.map((server, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": server.name,
            "description": server.shortDescription || `Join ${server.name} Discord server`,
            "url": `https://hentaidiscord.com/server/${server.guildId}`,
            "image": server.icon ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=512` : "https://hentaidiscord.com/icon-512x512.png",
            "category": server.categories ? server.categories.join(', ') : "Discord Server",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": server.averageRating && server.reviewCount ? {
              "@type": "AggregateRating",
              "ratingValue": server.averageRating,
              "reviewCount": server.reviewCount,
              "bestRating": "5",
              "worstRating": "1"
            } : null
          }
        }))
      };

      // Add the structured data to the page
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      script.id = 'dynamic-structured-data';
      
      // Remove existing dynamic structured data
      const existing = document.getElementById('dynamic-structured-data');
      if (existing) {
        existing.remove();
      }
      
      document.head.appendChild(script);

      return () => {
        const scriptToRemove = document.getElementById('dynamic-structured-data');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [servers]);

  return null; // This component doesn't render anything
}
