'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import Spinner from '@/components/Spinner';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


type GuildStats = {
  approximate_member_count?: number;
  approximate_presence_count?: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

function ConfirmDialog({ open, onConfirm, onCancel, title, description }: { open: boolean, onConfirm: () => void, onCancel: () => void, title: string, description: string }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Focus trap for accessibility
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      tabIndex={-1}
      ref={dialogRef}
    >
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm outline-none">
        <h2 id="modal-title" className="text-lg font-bold mb-2">{title}</h2>
        <p id="modal-desc" className="mb-4">{description}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </div>
  );
}

function CopyDialog({ open, onClose }: { open: boolean, onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center animate-fade-in">
        <span className="text-green-400 text-3xl mb-2">✔️</span>
        <span className="font-semibold text-white mb-2 text-lg">Invite Link Copied!</span>
        <button
          onClick={onClose}
          className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition shadow"
        >OK</button>
      </div>
    </div>
  );
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ServerPageClient({ params }: { params: { guildId: string } }) {
  const { data: session, status } = useSession();

  // SWR for server data
  const { data: server, error: serverError, isLoading: loadingServer } = useSWR(
    `/api/servers/${params.guildId}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          const err: any = new Error('Not found');
          err.status = 404;
          throw err;
        }
        if (res.status === 429) {
          const err: any = new Error('Rate limited');
          err.status = 429;
          throw err;
        }
        throw new Error('Failed to fetch server');
      }
      return res.json();
    }
  );

  // SWR for Discord stats (member/online count)
  const { data: guildStats } = useSWR(
    `/api/discord/guild-info?guildId=${params.guildId}`,
    fetcher
  );
  const memberCount = guildStats?.approximate_member_count ?? null;
  const onlineCount = guildStats?.approximate_presence_count ?? null;

  // SWR for reviews
  const { data: reviewData, error: reviewError, mutate: mutateReviews } = useSWR(
    `/api/servers/${params.guildId}/review`,
    fetcher
  );
  const reviews = reviewData?.all || [];
  const myReview = reviewData?.mine || null;
  const isBanned = reviewError && reviewError.status === 403;

  // Review form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loadingReview, setLoadingReview] = useState(false);

  // Set rating/comment when myReview changes
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
  }, [myReview]);

  // SWR for bump cooldown info
  const { data: bumpInfo, mutate: mutateBumpInfo } = useSWR(
    session ? `/api/servers/${params.guildId}/bump-info` : null,
    fetcher
  );
  const [bumpCooldown, setBumpCooldown] = useState<number | null>(null);
  const bumpInterval = useRef<NodeJS.Timeout | null>(null);
  const [bumpLoading, setBumpLoading] = useState(false);
  const [bumpError, setBumpError] = useState<string | null>(null);

  // Set bumpCooldown from bumpInfo
  useEffect(() => {
    if (bumpInfo?.nextBump) {
      setBumpCooldown(new Date(bumpInfo.nextBump).getTime() - Date.now());
    } else {
      setBumpCooldown(null);
    }
  }, [bumpInfo]);

  // Timer for bumpCooldown
  useEffect(() => {
    if (bumpCooldown !== null && bumpCooldown > 0) {
      bumpInterval.current = setInterval(() => {
        setBumpCooldown(prev => {
          if (prev !== null) {
            if (prev <= 1000) {
              clearInterval(bumpInterval.current!);
              return 0;
            }
            return prev - 1000;
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(bumpInterval.current!);
    }
  }, [bumpCooldown]);

  // Stats (admin only)
  const isAdmin = session && server && session.user?.id && server.userId === session.user.id;
  const { data: stats } = useSWR(
    isAdmin ? `/api/servers/${params.guildId}/stat` : null,
    fetcher
  );

  // Track visit
  useEffect(() => {
    fetch(`/api/servers/${params.guildId}/stat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'visit' }),
    });
  }, [params.guildId]);

  // Review sorting/pagination
  const [sort, setSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [page, setPage] = useState(1);
  const REVIEWS_PER_PAGE = 5;

  // Define a type for reviews (optional, but recommended)
  type Review = {
    rating: number;
    createdAt: string;
    userId: string;
    username: string;
    avatar?: string;
    comment: string;
    guildId: string;
    _id?: string;
    // ...add other fields as needed
  };

  const sortedReviews = useMemo(() => {
    let sorted = [...reviews];
    if (sort === 'newest') sorted.sort((a: Review, b: Review) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === 'highest' ) sorted.sort((a: Review, b: Review) => b.rating - a.rating);
    if (sort === 'lowest' ) sorted.sort((a: Review, b: Review) => a.rating - b.rating);
    return sorted;
  }, [reviews, sort]);

  const pagedReviews = useMemo(() => {
    const start = (page - 1) * REVIEWS_PER_PAGE;
    return sortedReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [sortedReviews, page]);

  // Average rating
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (
      reviews.reduce((sum: number, r: Review) => sum + (r.rating || 0), 0) / reviews.length
    ).toFixed(2);
  }, [reviews]);

  // Handle bump
  const handleBump = async () => {
    setBumpLoading(true);
    setBumpError(null);
    const res = await fetch(`/api/servers/${params.guildId}/bump`, { method: 'POST' });
    if (res.ok) {
      setBumpCooldown(2 * 60 * 60 * 1000); // 2 hours
      mutateBumpInfo(); // revalidate bump info
    } else {
      const data = await res.json();
      if (data.nextBump) {
        setBumpCooldown(new Date(data.nextBump).getTime() - Date.now());
      }
      setBumpError(data.error || 'Failed to bump');
    }
    setBumpLoading(false);
  };

  const formatCooldown = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
  };

  // Review form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingReview(true);
    await fetch(`/api/servers/${params.guildId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });
    setLoadingReview(false);
    mutateReviews(); // revalidate reviews
  };

  const handleDelete = async () => {
    setLoadingReview(true);
    await fetch(`/api/servers/${params.guildId}/review`, { method: 'DELETE' });
    setLoadingReview(false);
    setRating(0);
    setComment('');
    mutateReviews(); // revalidate reviews
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // Banner selection logic: prefer DB banner, then Discord banner, then splash, then blank
  let bannerUrl: string | null = null;
  let useColorTheme = false;
  if (server && server.bannerMode === 'color') {
    useColorTheme = true;
  } else if (server && server.bannerMode === 'banner') {
    useColorTheme = false;
  }
  if (!useColorTheme) {
    if (server && server.banner) {
      bannerUrl = `https://cdn.discordapp.com/banners/${server.guildId}/${server.banner}.png?size=2048`;
    } else if (guildStats?.banner) {
      bannerUrl = `https://cdn.discordapp.com/banners/${server.guildId}/${guildStats.banner}.png?size=2048`;
    } else if (server && (server.splash || guildStats?.splash)) {
      const splashId = server.splash || guildStats?.splash;
      bannerUrl = splashId ? `https://cdn.discordapp.com/splashes/${server.guildId}/${splashId}.png?size=2048` : null;
    }
  }

  // Chart data for stats
  const statsChartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ['Visits', 'Copied Link', 'Join Clicks', 'Bumps'],
      datasets: [
        {
          label: 'Count',
          data: [stats.visit || 0, stats.copy || 0, stats.join || 0, stats.bump || 0],
          backgroundColor: [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e42', // orange
            '#a78bfa', // purple
          ],
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.7,
        },
      ],
    };
  }, [stats]);

  const statsChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#d1d5db', font: { size: 14 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#374151' },
        ticks: { color: '#d1d5db', font: { size: 14 } },
      },
    },
    maintainAspectRatio: false,
  };

  // Bump Reminder Toggle
  const [bumpReminder, setBumpReminder] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  // Fetch bump reminder status
  useEffect(() => {
    if (!session) return;
    fetch(`/api/servers/${params.guildId}/bump-reminder`)
      .then(res => res.json())
      .then(data => setBumpReminder(!!data.enabled));
  }, [session, params.guildId]);

  const handleToggleReminder = async () => {
    setReminderLoading(true);
    const res = await fetch(`/api/servers/${params.guildId}/bump-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !bumpReminder })
    });
    if (res.ok) setBumpReminder(!bumpReminder);
    setReminderLoading(false);
  };

  if (status === 'loading') {
    return <Spinner />;
  }
  if (loadingServer) {
    return <Spinner />;
  }

  if (serverError && (serverError.status === 404 || serverError.message === 'Not found')) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Server Not Found</h1>
        <p className="text-gray-500">This server does not exist or has been deleted.</p>
      </div>
    );
  }
  if (serverError && (serverError.status === 429 || serverError.message === 'Rate limited')) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">This server listing is unavailable.</h1>
        <p className="text-gray-500">You are being rate limited. Please try again later.</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="p-8 text-red-600 font-bold">
        This server listing is unavailable.
      </div>
    );
  }

  return (
    <main className="min-h-screen flex justify-center items-start bg-gradient-to-br from-gray-950 to-gray-900 dark:from-black dark:to-gray-900 p-0 sm:p-4">
      {/* Add structured data for SEO */}
      {server && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": server.name,
                "description": server.description || `Join ${server.name} Discord server with ${server.memberCount || 'thousands of'} members`,
                "url": `https://hentaidiscord.com/server/${params.guildId}`,
                "logo": server.icon ? `https://cdn.discordapp.com/icons/${params.guildId}/${server.icon}.png?size=512` : null,
                "sameAs": [server.inviteCode ? `https://discord.gg/${server.inviteCode}` : null].filter(Boolean),
                "aggregateRating": reviews.length > 0 ? {
                  "@type": "AggregateRating",
                  "ratingValue": averageRating,
                  "reviewCount": reviews.length,
                  "bestRating": "5",
                  "worstRating": "1"
                } : null,
                "review": reviews.slice(0, 5).map((review: Review) => ({
                  "@type": "Review",
                  "author": {
                    "@type": "Person",
                    "name": review.username
                  },
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": review.rating,
                    "bestRating": "5",
                    "worstRating": "1"
                  },
                  "reviewBody": review.comment,
                  "datePublished": review.createdAt
                }))
              })
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": `${server.name} Discord Server - Hentai Discord`,
                "description": server.description || `Join ${server.name} Discord server with active community`,
                "url": `https://hentaidiscord.com/server/${params.guildId}`,
                "mainEntity": {
                  "@type": "SoftwareApplication",
                  "name": server.name,
                  "applicationCategory": "CommunicationApplication",
                  "operatingSystem": "Discord",
                  "description": server.description,
                  "aggregateRating": reviews.length > 0 ? {
                    "@type": "AggregateRating", 
                    "ratingValue": averageRating,
                    "reviewCount": reviews.length
                  } : null
                },
                "breadcrumb": {
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
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": server.name,
                      "item": `https://hentaidiscord.com/server/${params.guildId}`
                    }
                  ]
                }
              })
            }}
          />
        </>
      )}
      <div className="w-full max-w-2xl mx-auto mb-0 sm:mb-8 bg-neutral-900/90 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden animate-fade-in">
        {/* Banner */}
        <div className="relative w-full h-40 sm:h-56 bg-neutral-800 flex items-center justify-center">
          {useColorTheme ? (
            <div
              className="absolute inset-0 w-full h-full object-cover object-center rounded-none"
              style={{ background: server.colorTheme || '#222', imageRendering: 'auto' }}
            />
          ) : bannerUrl ? (
            <img
              src={bannerUrl}
              alt="Server Banner"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <img
              src="/blank-banner.png"
              alt="Default Banner"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ imageRendering: 'auto' }}
            />
          )}
          {/* Server Icon */}
          <div className="absolute left-4 bottom-[-2.5rem] sm:bottom-[-3rem] z-10">
            <img
              src={server.icon ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=2048` : '/blank-icon.png'}
              alt="Server Icon"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-neutral-900 shadow-lg bg-neutral-800 object-cover"
            />
          </div>
        </div>
        <div className="pt-16 sm:pt-20 pb-6 px-4 sm:px-8">
          {/* Server Name & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg flex-1">{server.name}</h1>
            <div className="flex gap-3 text-sm text-gray-400 flex-wrap">
              {typeof memberCount === 'number' && (
                <span>👥 {memberCount}</span>
              )}
              {typeof onlineCount === 'number' && (
                <span>🟢 {onlineCount} online</span>
              )}
            </div>
          </div>
          {/* Description */}
          <div
            className="mb-3 prose prose-invert bg-neutral-800/80 rounded-xl px-4 py-3 text-base shadow-sm border border-neutral-800"
            style={{ wordBreak: 'break-word' }}
          >
            <style>{`
              .prose p, .prose ul, .prose ol, .prose li, .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
                margin-top: 0.2em !important;
                margin-bottom: 0.2em !important;
                line-height: 1.25 !important;
              }
            `}</style>
            <span dangerouslySetInnerHTML={{ __html: server.description }} />
          </div>
          {/* Categories, Tags, Language */}
          <div className="flex flex-wrap gap-2 mb-3">
            {server.categories?.map((cat: string) => (
              <a key={cat} href={`/category/${encodeURIComponent(cat)}`} className="bg-blue-900/60 text-blue-300 px-2 py-1 rounded-lg text-xs font-semibold hover:bg-blue-800/80 transition">{cat}</a>
            ))}
            {server.tags?.map((tag: string) => (
              <span key={tag} className="bg-green-900/60 text-green-300 px-2 py-1 rounded-lg text-xs font-semibold">#{tag}</span>
            ))}
            <span className="bg-neutral-800 text-gray-400 px-2 py-1 rounded-lg text-xs">{server.language}</span>
          </div>
          {/* Invite & Widget */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <a
              href={typeof server.link === 'object' && server.link.code ? `https://discord.gg/${server.link.code}` : server.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-center transition"
              onClick={async () => {
                await fetch(`/api/servers/${server.guildId}/stat`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'join' }),
                });
              }}
            >Join Server</a>
            <button
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-200 rounded-xl font-bold text-center transition shadow border border-neutral-700"
              onClick={async () => {
                const inviteUrl = typeof server.link === 'object' && server.link.code ? `https://discord.gg/${server.link.code}` : server.link;
                await navigator.clipboard.writeText(inviteUrl);
                await fetch(`/api/servers/${server.guildId}/stat`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'copy' }),
                });
                setShowCopyDialog(true);
                setTimeout(() => setShowCopyDialog(false), 2000);
              }}
            >Copy Link</button>
          </div>
          {server.widgetId && (
            <div className="my-6">
              <iframe
                src={`https://discord.com/widget?id=${server.widgetId}&theme=dark`}
                width="100%"
                height="320"
                allowTransparency={true}
                frameBorder="0"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                title="Discord Widget"
                className="rounded-xl border border-neutral-800 shadow"
              ></iframe>
            </div>
          )}
          {/* Bump Button */}
          <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
            <button
              onClick={handleBump}
              disabled={bumpCooldown !== null && bumpCooldown > 0 || bumpLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition disabled:opacity-50 w-full sm:w-auto"
            >
              {bumpLoading ? 'Bumping...' : 'Bump Server'}
            </button>
            {bumpCooldown !== null && bumpCooldown > 0 && (
              <div className="text-xs text-gray-400 mt-1 sm:mt-0">Next bump: {formatCooldown(bumpCooldown)}</div>
            )}
            {bumpError && <div className="text-xs text-red-500 mt-1 sm:mt-0">{bumpError}</div>}
            {session && (
              <button
                onClick={handleToggleReminder}
                disabled={reminderLoading}
                className={`ml-2 px-4 py-2 flex items-center gap-2 rounded-full font-semibold text-xs transition border border-neutral-700 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${bumpReminder ? 'bg-gradient-to-r from-green-500 to-green-700 text-white' : 'bg-gradient-to-r from-gray-800 to-gray-700 text-gray-200 hover:from-blue-600 hover:to-blue-700 hover:text-white'}
                  ${reminderLoading ? 'opacity-60 cursor-wait' : ''}
                `}
                style={{ minWidth: 170 }}
                aria-pressed={bumpReminder}
              >
                {reminderLoading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : bumpReminder ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Reminder On
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                    Enable Reminder
                  </>
                )}
              </button>
            )}
          </div>
          {/* Admin Controls */}
          {isAdmin && (
            <div className="mb-4 flex gap-2">
              <a
                href={`/server/${params.guildId}/details`}
                className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition"
              >Edit Listing</a>
            </div>
          )}
          {/* Stats (Admin) */}
          {isAdmin && stats && (
            <div className="mb-6 p-4 border border-neutral-800 rounded-xl bg-neutral-800/60 text-gray-200">
              <h2 className="text-lg font-bold mb-2">Server Statistics</h2>
              <div className="w-full max-w-xs mx-auto" style={{ minHeight: 220 }}>
                {statsChartData && (
                  <Bar
                    data={statsChartData}
                    options={statsChartOptions}
                    height={220}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs sm:text-sm">
                <div><span className="font-bold">Visits:</span> {stats.visit || 0}</div>
                <div><span className="font-bold">Copied Link:</span> {stats.copy || 0}</div>
                <div><span className="font-bold">Join Clicks:</span> {stats.join || 0}</div>
                <div><span className="font-bold">Bumps:</span> {stats.bump || 0}</div>
              </div>
            </div>
          )}
          {/* Reviews Section - Modern, Neat, Mobile Friendly */}
          <section className="mt-8 border-t border-neutral-800 pt-8 px-0 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-yellow-400">⭐ {averageRating}</span>
                <span className="text-gray-400 text-lg">/ 5</span>
                <span className="ml-2 text-gray-500 text-base">({reviews.length} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-semibold text-gray-300 text-sm">Sort:</span>
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${sort === 'newest' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-gray-300'}`}
                  onClick={() => { setSort('newest'); setPage(1); }}
                >Newest</button>
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${sort === 'highest' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-gray-300'}`}
                  onClick={() => { setSort('highest'); setPage(1); }}
                >Highest</button>
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${sort === 'lowest' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-gray-300'}`}
                  onClick={() => { setSort('lowest'); setPage(1); }}
                >Lowest</button>
              </div>
            </div>
            {session && (
              <form onSubmit={handleSubmit} className="mb-6 bg-neutral-800/80 rounded-xl p-4 flex flex-col gap-3 shadow border border-neutral-700 relative">
                {loadingReview && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-xl">
                    <Spinner />
                  </div>
                )}
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                  {[1,2,3,4,5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={star <= rating ? 'text-yellow-400 text-2xl' : 'text-gray-700 text-2xl'}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >★</button>
                  ))}
                </div>
                <textarea
                  className="block w-full p-2 border border-neutral-700 rounded-xl bg-neutral-900 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Leave a comment..."
                  rows={3}
                  maxLength={500}
                  required
                  disabled={loadingReview}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="submit"
                    disabled={loadingReview}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition"
                  >
                    {myReview ? 'Update Review' : 'Post Review'}
                  </button>
                  {myReview && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loadingReview}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition"
                    >
                      Delete Review
                    </button>
                  )}
                </div>
              </form>
            )}
            <ul className="divide-y divide-neutral-800">
              {pagedReviews.length === 0 && <li className="text-gray-500 py-6 text-center">No reviews yet.</li>}
              {pagedReviews.map((r: any) => (
                <li key={r.userId} className="py-4 flex items-start gap-3">
                  <img
                    src={r.avatar || '/blank-icon.png'}
                    alt={r.username}
                    className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-800 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-bold text-gray-100 text-base truncate">{r.username}</span>
                      <span className="text-yellow-400 text-lg">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="text-gray-300 whitespace-pre-line break-words text-sm mt-1">{r.comment}</div>
                  </div>
                </li>
              ))}
            </ul>
            {Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE) > 1 && (
              <div className="flex gap-2 mt-6 items-center justify-center">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-xl bg-neutral-800 text-gray-300 disabled:opacity-50"
                >Prev</button>
                <span className="text-gray-400">Page {page} / {Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE) || 1}</span>
                <button
                  disabled={page >= Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE)}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded-xl bg-neutral-800 text-gray-300 disabled:opacity-50"
                >Next</button>
              </div>
            )}
          </section>
        </div>
        {/* Confirm Dialog (unchanged) */}
        <ConfirmDialog
          open={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={async () => {
            setDeleting(true);
            // Call your delete API here
            try {
              await fetch(`/api/servers/${params.guildId}`, { method: 'DELETE' });
              // Optionally redirect or show a toast
            } finally {
              setDeleting(false);
              setShowDeleteDialog(false);
            }
          }}
          title="Delete Server?"
          description="Are you sure you want to delete this server? This action cannot be undone."
        />
        <CopyDialog open={showCopyDialog} onClose={() => setShowCopyDialog(false)} />
      </div>
    </main>
  );
}
