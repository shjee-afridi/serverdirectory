'use client'
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import ServerListItem from '@/components/ServerListItem';
import debounce from 'lodash.debounce';
import Spinner from '@/components/Spinner';
import { FaSearch, FaChevronDown, FaGlobe } from 'react-icons/fa';

const LANGUAGES = [
  'All', 'English', 'Spanish', 'French', 'German', 'Russian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Italian', 'Turkish', 'Polish', 'Dutch', 'Other'
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

function useResponsivePerPage() {
  const [perPage, setPerPage] = useState(10);
  useEffect(() => {
    function updatePerPage() {
      if (window.innerWidth < 640) setPerPage(6); // mobile
      else if (window.innerWidth < 1024) setPerPage(8); // tablet
      else setPerPage(10); // desktop
    }
    updatePerPage();
    window.addEventListener('resize', updatePerPage);
    return () => window.removeEventListener('resize', updatePerPage);
  }, []);
  return perPage;
}

export default function SearchPage({ params }: { params: { query: string } }) {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const search = decodeURIComponent(params.query);
  const [inputValue, setInputValue] = useState(search);
  const router = useRouter();
  const perPage = useResponsivePerPage();
  const [page, setPage] = useState(1);

  // Debounced fetch function
  const fetchServers = useCallback(
    debounce(async (searchValue: string, lang: string) => {
      setLoading(true);
      try {
        const url = `/api/servers/search?query=${encodeURIComponent(searchValue)}${lang && lang !== 'All' ? `&language=${encodeURIComponent(lang)}` : ''}`;
        const data = await fetcher(url);
        setServers(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchServers(search, selectedLanguage);
  }, [search, selectedLanguage, fetchServers]);

  // Responsive: close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setShowLanguageDropdown(false);
    if (showLanguageDropdown) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showLanguageDropdown]);

  // Paginate servers
  const paginatedServers = servers.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(servers.length / perPage);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black transition-colors"
      style={{ minHeight: '100dvh' }}>
      {/* Search bar for new queries (copied from home page, visually matched) */}
      <form
        className="mb-2 sm:mb-6 w-full max-w-lg flex items-center bg-gray-800 dark:bg-gray-900 rounded-full shadow-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-400 transition border border-gray-700"
        onSubmit={e => {
          e.preventDefault();
          if (inputValue.trim() && inputValue !== search) {
            router.push(`/search/${encodeURIComponent(inputValue.trim())}`);
          }
        }}
      >
        <FaSearch className="text-gray-400 ml-2 mr-2 text-lg" />
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Search for a server..."
          className="flex-1 bg-transparent outline-none p-2 text-base text-white placeholder-gray-400"
          aria-label="Search servers"
        />
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition"
        >
          Search
        </button>
      </form>

      {/* Modern search header - improved for mobile */}
      {/* <div className="w-full max-w-lg mb-2 sm:mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900/70 shadow mt-2 sm:mt-4 sm:px-0 sm:py-0 sm:rounded-none sm:bg-transparent sm:shadow-none">
        <FaSearch className="text-gray-400 text-lg flex-shrink-0" />
        <span className="text-white text-base sm:text-lg font-semibold truncate whitespace-normal break-words">
          <span className="hidden sm:inline">Search results for: </span>
          <span className="inline sm:hidden">Results:</span>
          <span className="text-blue-400 ml-1 break-all">{search}</span>
        </span>
      </div> */}

      {/* Modern Language Selector as dropdown */}
      <div className="w-full max-w-lg mb-6 sm:mb-8 relative">
        <button
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 rounded-full shadow border border-gray-700 text-gray-200 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          onClick={e => { e.stopPropagation(); setShowLanguageDropdown(v => !v); }}
        >
          <span className="flex items-center gap-2"><FaGlobe className="text-green-400" />{selectedLanguage}</span>
          <FaChevronDown className={`ml-2 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showLanguageDropdown && (
          <div className="absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-lg mt-2 animate-fade-in">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={e => { e.stopPropagation(); setSelectedLanguage(lang); setShowLanguageDropdown(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-green-900 rounded-xl transition text-gray-200 ${selectedLanguage === lang ? 'bg-green-950 font-bold' : ''}`}
              >
                <span className="flex items-center gap-2"><FaGlobe />{lang}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="w-full max-w-7xl animate-fade-in min-h-0">
        {loading ? (
          <Spinner />
        ) : servers.length === 0 ? (
          <div className="text-center text-gray-400 py-8 min-h-0">No servers found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 px-0">
              {paginatedServers.map(server => (
                <ServerListItem
                  key={server._id || server.guildId}
                  server={server}
                  className="shadow-lg shadow-blue-500/30 hover:shadow-blue-400/60 transition-shadow duration-300 border border-blue-500/30 hover:border-blue-400/60 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 hover:from-blue-900 hover:via-blue-800 hover:to-blue-900 animate-fade-in"
                />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-full bg-gray-200 disabled:opacity-50"
                >Prev</button>
                <span className="px-2 py-1 text-gray-400">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded-full bg-gray-200 disabled:opacity-50"
                >Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}