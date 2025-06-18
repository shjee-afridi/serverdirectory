'use client'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import ServerListItem from '@/components/ServerListItem';
import { FaUserCircle, FaServer, FaDiscord, FaSignOutAlt, FaStar, FaRegStar, FaEnvelope, FaCommentDots } from 'react-icons/fa';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Profile() {
  const { data: session, status } = useSession();

  // Fetch all servers
  const { data: allServersData = { servers: [] }, isLoading: allServersLoading } = useSWR(
    '/api/servers',
    fetcher
  );
  const allServers = allServersData.servers || [];

  // Fetch user's admin guilds
  const { data: adminGuilds = [], isLoading: adminGuildsLoading } = useSWR(
    session?.accessToken ? '/api/discord/guilds' : null,
    fetcher
  );
  // Defensive: Only use .map if adminGuilds is an array
  const adminGuildIds = useMemo(() => (Array.isArray(adminGuilds) ? adminGuilds.map((g: any) => g.id) : []), [adminGuilds]);

  // Fetch reviews left by the user
  const { data: myReviewsRaw = [], isLoading: reviewsLoading } = useSWR(
    session?.user?.id ? `/api/reviews/by-user?userId=${session.user.id}` : null,
    fetcher
  );
  const reviewsArray = Array.isArray(myReviewsRaw) ? myReviewsRaw : [];

  // Combine: servers where user is lister or admin
  const myServers = useMemo(() => {
    if (!session?.user?.id) return [];
    return allServers.filter(
      (s: any) => s.userId === session.user.id || adminGuildIds.includes(s.guildId)
    );
  }, [allServers, session?.user?.id, adminGuildIds]);

  if (status === 'loading' || allServersLoading || adminGuildsLoading || reviewsLoading) return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  if (!session) {
    return (
      <div className="text-center p-8">
        <div className="mb-4 text-lg font-semibold">You must be logged in to view your profile.</div>
        <button
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold flex items-center gap-2 mx-auto"
          onClick={() => signIn('discord')}
        >
          <FaDiscord className="text-xl" /> Login with Discord
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-2 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black transition-colors">
      <div className="w-full max-w-2xl bg-gray-900/80 rounded-2xl shadow-xl p-8 border border-gray-800 animate-fade-in">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 mb-8 w-full">
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile picture"
              className="w-20 h-20 rounded-full border-4 border-blue-500 shadow object-cover bg-gray-800"
            />
          ) : (
            <FaUserCircle className="w-20 h-20 text-gray-500 bg-gray-800 rounded-full border-4 border-blue-500 shadow" />
          )}
          <div className="flex-1 w-full flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="text-2xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <FaUserCircle className="text-blue-400" />
              {session.user?.name || 'Unknown User'}
            </div>
            <div className="text-gray-400 flex items-center gap-2 mt-1 break-all text-xs sm:text-sm justify-center sm:justify-start w-full">
              <FaEnvelope className="text-gray-500" />
              <span className="break-all">{session.user?.email || ''}</span>
            </div>
          </div>
          <button
            className="w-full sm:w-auto mt-4 sm:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center gap-2 font-semibold shadow justify-center"
            onClick={() => signOut()}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {/* Servers Section */}
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-white">
          <FaServer className="text-yellow-400" /> Your Servers
        </h2>
        {myServers.length === 0 ? (
          <div className="mb-8 text-gray-400 flex flex-col items-center gap-2">
            <FaServer className="text-4xl text-gray-600" />
            <span>You haven&apos;t listed or admin any servers yet.</span>
            <Link
              href="/add-server"
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold flex items-center gap-2 mt-2"
            >
              <FaServer /> Add a Server
            </Link>
          </div>
        ) : (
          <ul className="mb-8 space-y-2 sm:space-y-3">
            {myServers.map((server: any) => (
              <Link
                key={server.guildId}
                href={`/server/${server.guildId}`}
                className="block focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl"
              >
                <li className="bg-gray-800 rounded-xl px-3 py-3 sm:px-5 sm:py-4 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 shadow hover:scale-[1.01] transition-transform border border-gray-700 cursor-pointer hover:bg-gray-700 active:bg-gray-700 w-full">
                  <div className="flex items-center gap-2 sm:gap-4 w-full">
                    <FaServer className="text-yellow-400 text-xl sm:text-2xl flex-shrink-0" />
                    <span className="font-semibold text-white text-base sm:text-lg break-words">{server.name}</span>
                  </div>
                  <span className="mt-2 sm:mt-0 ml-0 sm:ml-auto text-blue-400 text-xs sm:text-sm flex items-center gap-1 justify-end">
                    View <FaDiscord />
                  </span>
                </li>
              </Link>
            ))}
          </ul>
        )}

        {/* Reviews Section */}
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-white">
          <FaCommentDots className="text-blue-400" /> Your Reviews
        </h2>
        {reviewsArray.length === 0 ? (
          <div className="text-gray-400 flex flex-col items-center gap-2 mb-2">
            <FaCommentDots className="text-3xl text-gray-600" />
            <span>You haven&apos;t left any reviews yet.</span>
          </div>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {reviewsArray.map((review: any) => {
              const server = allServers.find((s: any) => s.guildId === review.guildId);
              return (
                <Link
                  key={review._id || review.guildId + '-' + review.userId}
                  href={`/server/${review.guildId}`}
                  className="block focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl"
                >
                  <li className="bg-gray-800 rounded-xl px-3 py-3 sm:px-5 sm:py-4 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shadow border border-gray-700 cursor-pointer hover:bg-gray-700 active:bg-gray-700 hover:scale-[1.01] transition-transform w-full">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-1/2">
                      <FaServer className="text-yellow-400 text-lg sm:text-xl flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white text-base sm:text-lg break-words">
                          {server ? (
                            <span className="text-blue-400 hover:underline">{server.name}</span>
                          ) : (
                            <span className="text-gray-400">{review.guildId}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map(i => (
                            i <= review.rating ? <FaStar key={i} className="text-yellow-400 text-xs sm:text-base" /> : <FaRegStar key={i} className="text-gray-500 text-xs sm:text-base" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 mt-2 sm:mt-0 w-full">
                      <div className="text-white text-sm sm:text-base font-semibold bg-gray-700/70 rounded px-3 py-2 whitespace-pre-line break-words shadow-inner">
                        {review.comment}
                      </div>
                    </div>
                  </li>
                </Link>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}