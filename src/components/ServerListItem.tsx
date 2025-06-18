import React from 'react';

function truncateDescription(desc: string, isMobile: boolean = false): string {
  const clean = (desc || 'No description.').replace(/[^\x00-\x7F]+/g, '').trim();
  const maxLength = isMobile ? 60 : 100;
  return clean.length > maxLength ? clean.slice(0, maxLength - 3) + '...' : clean;
}

interface ServerListItemProps {
  server: any;
  className?: string;
}

const ServerListItem = React.memo(function ServerListItem({ server, className = "" }: ServerListItemProps) {
  const hasBanner = !!(server.banner || server.splash);
  const bannerUrl =
    server.banner
      ? `https://cdn.discordapp.com/banners/${server.guildId}/${server.banner}.png`
      : server.splash
      ? `https://cdn.discordapp.com/splashes/${server.guildId}/${server.splash}.png`
      : '/blank-banner.png';
  const iconUrl =
    server.icon
      ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png`
      : '/blank-icon.png';
  const cardBg = hasBanner ? '#18181b' : (server.colorTheme || '#18181b');
  const cardOutline = server.colorTheme || 'rgb(143, 119, 119)';
  const gradientBorder = 'linear-gradient(135deg, #18181b,rgb(143, 119, 119) 60%, #fff)';

  return (
    <li className={`p-0 m-0 list-none flex justify-center w-full`}>
      {/* Gradient border wrapper */}
      <div
        className={`relative rounded-2xl w-full max-w-xs group p-[2px]`}
        style={{
          background: gradientBorder,
          minHeight: 220,
          minWidth: 160,
          maxWidth: 200,
          display: 'inline-block',
          boxShadow: '0 0 0 0 transparent',
          transition: 'box-shadow 0.2s cubic-bezier(.4,0,.2,1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 0 16px 4px ${cardOutline}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
        }}
      >
        {/* Inner card with solid background and no padding for border */}
        <div className="rounded-2xl w-full h-full bg-clip-padding bg-white/0" style={{ background: cardBg }}>
          <a
            href={`/server/${server.guildId}`}
            className="block group relative overflow-hidden rounded-2xl shadow-lg hover:scale-[1.03] transition-transform duration-200 w-full h-full"
            style={{
              minHeight: 200,
              minWidth: 156,
              maxWidth: 196,
            }}
          >
            {/* Banner background */}
            {hasBanner && (
              <div
                className="absolute inset-0 z-0 rounded-2xl"
                style={{
                  backgroundImage: `url('${bannerUrl}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.2,
                  filter: 'blur(1px)',
                }}
              />
            )}          {/* Card content */}
            <div className="relative z-10 flex flex-col items-center h-full p-2 pt-2"> {/* reduced p-4 pt-6 to p-2 pt-2 */}
              {/* Icon */}
              <div
                className="rounded-full flex-shrink-0"
                style={{
                  padding: 2,
                  background: gradientBorder,
                  marginBottom: 8, // reduced from 12
                  display: 'inline-block',
                }}
              >
                <img
                  src={iconUrl}
                  alt={server.name}
                  className="w-16 h-16 rounded-full shadow-lg object-cover bg-gray-900" // reduced from w-20 h-20
                />
              </div>

              {/* Server Name */}
              <div
                className="text-base font-bold text-white text-center drop-shadow-lg line-clamp-1 w-full mb-1 flex-shrink-0"
                style={{
                  // Removed WebkitTextStroke for cleaner look
                  textShadow: '0 1px 2px #000', // simplified shadow
                }}
              >
                {server.name}
              </div>

              {/* Short Description */}
              {/* <div
                className="w-full text-xs text-white bg-black/70 rounded-lg px-2 py-2 text-center mt-1 break-words"
                style={{
                  minHeight: '8rem',
                }}
              >
                {truncateDescription(server.shortDescription)}
              </div> */}
              <div
                className="w-full text-xs text-white bg-black/70 rounded-lg px-2 py-2 text-center mt-1 break-words flex-1 flex items-center min-h-[2rem]"
              >
                <div className="w-full">
                  {truncateDescription(server.shortDescription)}
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </li>
  );
});

export default ServerListItem;
