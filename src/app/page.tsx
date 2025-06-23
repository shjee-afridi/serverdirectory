'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ServerListItem from '@/components/ServerListItem';
import debounce from 'lodash.debounce';
import { useCallback } from 'react';
import useSWR from 'swr';
import Spinner from '@/components/Spinner';
import { FaSearch, FaChevronDown, FaGlobe, FaLayerGroup, FaFire, FaClock } from 'react-icons/fa';
import { CATEGORIES as CATEGORY_LIST } from '@/constants/categories';


const LANGUAGES = [
  'All', 'English', 'Spanish', 'French', 'German', 'Russian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Italian', 'Turkish', 'Polish', 'Dutch', 'Other'
];

const TABS = [
  { key: 'trending', label: <><FaFire className="inline mr-2 text-orange-400" />Trending</> },
  { key: 'recent', label: <><FaClock className="inline mr-2 text-blue-400" />Recently Added</> }
];
const fetcher = (url: string) => fetch(url).then(res => res.json()); // <-- add this

const CATEGORIES: string[] = ['All', ...CATEGORY_LIST];

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

export default function Home() {
  const [servers, setServers] = useState<any[]>([]);
  const [recentServers, setRecentServers] = useState<any[]>([]);
  const [trendingServers, setTrendingServers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [search, setSearch] = useState('');
  const [minMembers, setMinMembers] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState('bumped');
  const [page, setPage] = useState(1);
  const perPage = useResponsivePerPage();
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'all'>('trending');
  const router = useRouter();
  const [trendingPage, setTrendingPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [trendingTotal, setTrendingTotal] = useState(0);
  const [recentTotal, setRecentTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Fetch main server list (for "All Servers" tab)
  const allServersUrl =
    activeTab === 'all'
      ? `/api/servers?sort=${sort}&page=${page}&perPage=${perPage}`
        + (selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '')
        + (selectedLanguage !== 'All' ? `&language=${encodeURIComponent(selectedLanguage)}` : '')
        + (minMembers ? `&minMembers=${minMembers}` : '')
        + (selectedTags.length ? selectedTags.map(tag => `&tags=${encodeURIComponent(tag)}`).join('') : '')
        + (search ? `&search=${encodeURIComponent(search)}` : '') // <-- add this
      : null;
  const { data: allServersData } = useSWR(allServersUrl, fetcher);

  // For "Trending" tab
  const trendingUrl =
    activeTab === 'trending'
      ? `/api/servers?sort=bumped&page=${trendingPage}&perPage=${perPage}`
        + (selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '')
        + (selectedLanguage !== 'All' ? `&language=${encodeURIComponent(selectedLanguage)}` : '')
        + (minMembers ? `&minMembers=${minMembers}` : '')
        + (selectedTags.length ? selectedTags.map(tag => `&tags=${encodeURIComponent(tag)}`).join('') : '')
      : null;
  const { data: trendingData } = useSWR(trendingUrl, fetcher);

  // For "Recent" tab
  const recentUrl =
    activeTab === 'recent'
      ? `/api/servers?sort=recent&page=${recentPage}&perPage=${perPage}`
        + (selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '')
        + (selectedLanguage !== 'All' ? `&language=${encodeURIComponent(selectedLanguage)}` : '')
        + (minMembers ? `&minMembers=${minMembers}` : '')
        + (selectedTags.length ? selectedTags.map(tag => `&tags=${encodeURIComponent(tag)}`).join('') : '')
      : null;
  const { data: recentData } = useSWR(recentUrl, fetcher);

  // Update state when SWR data changes (optional, or use data directly)
  useEffect(() => {
    if (allServersData) {
      setServers(allServersData.servers);
      setTotal(allServersData.total);
    }
  }, [allServersData]);
  useEffect(() => {
    if (trendingData) {
      setTrendingServers(trendingData.servers);
      setTrendingTotal(trendingData.total);
    }
  }, [trendingData]);
  useEffect(() => {
    if (recentData) {
      setRecentServers(recentData.servers);
      setRecentTotal(recentData.total);
    }
  }, [recentData]);


  useEffect(() => {
    setTrendingPage(1);
    setRecentPage(1);
  }, [selectedCategory, selectedLanguage, minMembers, selectedTags]);

  // Wrap setSearch in debounce (300ms delay)
  const debouncedSetSearch = useCallback(
    debounce((value: string) => setSearch(value), 300),
    []
  );

  // Responsive: close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      setShowCategoryDropdown(false);
      setShowLanguageDropdown(false);
    };
    if (showCategoryDropdown || showLanguageDropdown) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showCategoryDropdown, showLanguageDropdown]);

  return (
    <main className="flex flex-col min-h-screen items-center justify-start p-2 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black transition-colors">
      {/* Add h1 for SEO */}
      <h1 className="visually-hidden">
        Hentai Discord – Discover and Share the Best NSFW Anime Servers
      </h1>
      {/* Modern Search Bar with dark theme support */}
      <form
        className="mb-3 w-full max-w-lg flex items-center bg-gray-800 dark:bg-gray-900 rounded-full shadow-md px-2 py-1 focus-within:ring-2 focus-within:ring-blue-400 transition border border-gray-700"
        onSubmit={e => {
          e.preventDefault();
          if (searchInput.trim()) {
            router.push(`/search/${encodeURIComponent(searchInput.trim())}`);
          }
        }}
      >
        <FaSearch className="text-gray-400 ml-2 mr-2 text-lg" />
        <input
          type="text"
          value={searchInput}
          onChange={e => {
            setSearchInput(e.target.value);
            debouncedSetSearch(e.target.value);
          }}
          placeholder="Search for a server..."
          className="flex-1 bg-transparent outline-none p-2 text-base text-white placeholder-gray-400"
        />
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition"
        >
          Search
        </button>
      </form>

      {/* Modern Category Selector as dropdown */}
      <div className="w-full max-w-lg mb-4 relative">
        <button
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 rounded-full shadow border border-gray-700 text-gray-200 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          onClick={e => { 
            e.stopPropagation(); 
            setShowCategoryDropdown(v => !v); 
            setShowLanguageDropdown(false); // Close language dropdown if open
          }}
        >
          <span className="flex items-center gap-2"><FaLayerGroup className="text-blue-400" />{selectedCategory}</span>
          <FaChevronDown className={`ml-2 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showCategoryDropdown && (
          <div className="absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-lg mt-2 animate-fade-in max-h-60 overflow-y-auto">
            {CATEGORIES.map((cat: string) => (
              <button
                key={cat}
                onClick={e => { e.stopPropagation(); setSelectedCategory(cat); setShowCategoryDropdown(false); setPage(1); }}
                className={`w-full text-left px-4 py-2 hover:bg-blue-900 rounded-xl transition text-gray-200 ${selectedCategory === cat ? 'bg-blue-950 font-bold' : ''}`}
              >
                <span className="flex items-center gap-2"><FaLayerGroup />{cat}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modern Language Selector as dropdown */}
      <div className="w-full max-w-lg mb-8 relative">
        <button
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 rounded-full shadow border border-gray-700 text-gray-200 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          onClick={e => { 
            e.stopPropagation(); 
            setShowLanguageDropdown(v => !v); 
            setShowCategoryDropdown(false); // Close category dropdown if open
          }}
        >
          <span className="flex items-center gap-2"><FaGlobe className="text-green-400" />{selectedLanguage}</span>
          <FaChevronDown className={`ml-2 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showLanguageDropdown && (
          <div className="absolute z-20 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-lg mt-2 animate-fade-in max-h-60 overflow-y-auto">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={e => { e.stopPropagation(); setSelectedLanguage(lang); setShowLanguageDropdown(false); setPage(1); }}
                className={`w-full text-left px-4 py-2 hover:bg-green-900 rounded-xl transition text-gray-200 ${selectedLanguage === lang ? 'bg-green-950 font-bold' : ''}`}
              >
                <span className="flex items-center gap-2"><FaGlobe />{lang}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 mb-6 w-full max-w-lg justify-center">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-full border font-bold transition shadow-sm
              ${activeTab === tab.key
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-none scale-105 shadow-lg'
                : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 hover:text-white'}
            `}
            style={{ transition: 'all 0.2s cubic-bezier(.4,0,.2,1)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content with fade animation */}
      <div className="w-full max-w-6xl animate-fade-in flex-1">
        {activeTab === 'trending' && (
          <div>
            {!trendingData ? (
              <Spinner />
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 px-0">
                {trendingServers.map((server, idx) => (
                  <ServerListItem key={server.guildId || idx} server={server} />
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div>
            {!recentData ? (
              <Spinner />
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 px-0">
                {recentServers.map((server, idx) => (
                  <ServerListItem key={server.guildId || idx} server={server} />
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div>
            <h2 className="text-xl font-bold mb-2">All Servers</h2>
            {!allServersData ? (
              <Spinner />
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 px-0">
                {servers.map((server, idx) => (
                  <ServerListItem key={server.guildId || idx} server={server} />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Pagination */}
        {((activeTab === 'trending' && Math.ceil(trendingTotal / perPage) > 1) ||
          (activeTab === 'recent' && Math.ceil(recentTotal / perPage) > 1) ||
          (activeTab === 'all' && Math.ceil(total / perPage) > 1)) && (
          <div className="flex gap-2 mt-4 justify-center">
            <button
              disabled={activeTab === 'trending' ? trendingPage === 1 : activeTab === 'recent' ? recentPage === 1 : page === 1}
              onClick={() => {
                if (activeTab === 'trending') setTrendingPage(trendingPage - 1);
                else if (activeTab === 'recent') setRecentPage(recentPage - 1);
                else setPage(page - 1);
              }}
              className="px-3 py-1 rounded-full bg-gray-200 disabled:opacity-50"
            >Prev</button>
            <span className="px-2 py-1 text-gray-400">
              Page {activeTab === 'trending' ? trendingPage : activeTab === 'recent' ? recentPage : page} of {activeTab === 'trending' ? Math.ceil(trendingTotal / perPage) : activeTab === 'recent' ? Math.ceil(recentTotal / perPage) : Math.ceil(total / perPage)}
            </span>
            <button
              disabled={activeTab === 'trending' ? trendingPage >= Math.ceil(trendingTotal / perPage) : activeTab === 'recent' ? recentPage >= Math.ceil(recentTotal / perPage) : page >= Math.ceil(total / perPage)}
              onClick={() => {
                if (activeTab === 'trending') setTrendingPage(trendingPage + 1);
                else if (activeTab === 'recent') setRecentPage(recentPage + 1);
                else setPage(page + 1);
              }}
              className="px-3 py-1 rounded-full bg-gray-200 disabled:opacity-50"
            >Next</button>
          </div>
        )}
      </div>
      <footer className="w-full flex flex-col items-center justify-center text-xs text-gray-400 py-2 mt-8 border-t border-gray-800 bg-transparent flex-shrink-0">
        <span>
          HentaiDiscord 2025 &middot; <a href="/terms" className="underline hover:text-blue-400">Terms</a> &middot; <a href="/privacy" className="underline hover:text-blue-400">Privacy</a>
        </span>
      </footer>
    </main>
  );
}

// Tailwind animation utility
// Add this to your globals.css or tailwind.config.js if not present:
// .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(.4,0,.2,1); }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none;} }