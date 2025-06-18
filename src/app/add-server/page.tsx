// src/app/add-server/page.tsx
'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Spinner from '@/components/Spinner';
import 'react-quill/dist/quill.snow.css';
import { FaServer, FaTags, FaPalette, FaLanguage, FaChevronDown, FaPlus, FaTimes, FaSave, FaRobot, FaLink, FaInfoCircle } from 'react-icons/fa';
import { CATEGORIES } from '@/constants/categories';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const formats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent', 'link', 'align', 'clean'
];
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    [{ align: [] }],
    ['clean'],
  ],
};

// Add a type for Discord invite object
interface DiscordInvite {
  code: string;
  [key: string]: any;
}

export default function AddServerPage() {
  const { data: session, status } = useSession();
  const [guilds, setGuilds] = useState<any[]>([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [botInvited, setBotInvited] = useState(false);
  const [checkingBot, setCheckingBot] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionHTML, setDescriptionHTML] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [link, setLink] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [shortCharCount, setShortCharCount] = useState(0);
  const [serverInfo, setServerInfo] = useState<{
    icon?: string;
    banner?: string;
    splash?: string;
    name?: string;
    invite?: string | DiscordInvite;
    inviteError?: string;
    canPasteInvite?: boolean;
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [colorTheme, setColorTheme] = useState('black');
  const [widgetId, setWidgetId] = useState('');
  const [allListedServers, setAllListedServers] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch('/api/discord/guilds')
      .then(res => res.ok ? res.json() : [])
      .then(setGuilds);
  }, [session]);

  // Fetch all listed servers (for all users)
  useEffect(() => {
    fetch('/api/servers')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setAllListedServers(Array.isArray(data) ? data : data.servers || []);
      });
  }, []);

  const listedGuildIds = allListedServers.map(server => server.guildId);

  const handleGuildSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGuild(e.target.value);
    setBotInvited(false);
  };

  const checkBotInGuild = async (guildId: string) => {
    setCheckingBot(true);
    const res = await fetch(`/api/discord/bot-in-guild?guildId=${guildId}`);
    const data = await res.json();
    setBotInvited(data.inGuild);
    setCheckingBot(false);
  };

  const handleInviteBot = () => {
    if (!selectedGuild) {
      alert('Please select a server first.');
      return;
    }
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=1366467731200675871&permissions=8&scope=bot&guild_id=${selectedGuild}&redirect_uri=${encodeURIComponent('http://hentaidiscord.com/add-server')}&response_type=code`;
    window.location.href = inviteUrl;
  };

  const fetchServerInfo = async (guildId: string) => {
    const res = await fetch(`/api/discord/guild-info?guildId=${guildId}`);
    if (res.ok) {
      setServerInfo(await res.json());
    } else {
      setServerInfo(null);
    }
  };

  useEffect(() => {
    if (selectedGuild) {
      checkBotInGuild(selectedGuild);
      fetchServerInfo(selectedGuild);
    }
  }, [selectedGuild]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setDescriptionHTML(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleShortDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShortDescription(value);
    setShortCharCount(value.length);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = (e.target as HTMLInputElement).value.trim();
      if (tag.includes(' ')) {
        alert('Tags cannot contain spaces. Please enter a single word.');
        (e.target as HTMLInputElement).value = '';
        return;
      }
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag]);
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const inviteUrl = serverInfo && typeof serverInfo.invite === 'object' && serverInfo.invite && 'code' in serverInfo.invite
    ? `https://discord.gg/${(serverInfo.invite as DiscordInvite).code}`
    : (serverInfo && typeof serverInfo.invite === 'string' ? serverInfo.invite : link);

  const handleSave = async () => {
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    const response = await fetch('/api/servers/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId: selectedGuild,
        description,
        shortDescription,
        categories,
        tags,
        link: inviteUrl,
        language,
        icon: serverInfo?.icon,
        banner: serverInfo?.banner,
        splash: serverInfo?.splash,
        name: serverInfo?.name,
        colorTheme,
        widgetId,
      }),
    });
    setSaving(false);
    setShowConfirm(false);
    if (response.ok) {
      setShowSuccessDialog(true);
    } else {
      const error = await response.json();
      setErrorMessage(error.error || 'Failed to save server details.');
      setShowErrorDialog(true);
    }
  };

  if (session === undefined || status === 'loading') return <Spinner />;
  if (!session) return (<p>Please log in to add a server.</p>);

  return (
    <main className="flex flex-col items-center p-2 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black transition-colors">
      <div className="w-full max-w-2xl bg-gray-900/80 rounded-2xl shadow-xl p-2 sm:p-6 md:p-8 border border-gray-800 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-white">
          <FaServer className="text-yellow-400" /> Add a Server
        </h1>
        {/* Server selection dropdown */}
        <div className="mb-4 sm:mb-6">
          <label htmlFor="guilds" className="block mb-1 sm:mb-2 font-semibold text-gray-200 text-sm sm:text-base">Select a Server:</label>
          <div className="relative">
            <select
              id="guilds"
              value={selectedGuild}
              onChange={handleGuildSelect}
              className="block w-full p-2 sm:p-3 pr-8 sm:pr-10 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none text-sm sm:text-base"
            >
              <option value="" disabled>-- Select a Server --</option>
              {guilds.filter((guild: any) => !listedGuildIds.includes(guild.id)).map((guild: any) => (
                <option key={guild.id} value={guild.id}>{guild.name}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base sm:text-lg" />
          </div>
        </div>
        {/* Invite bot button */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={handleInviteBot}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition shadow text-sm sm:text-base"
          >
            <FaRobot /> Invite Bot to Server
          </button>
          {checkingBot && <span className="text-gray-400 ml-0 sm:ml-2 text-xs sm:text-sm">Checking bot...</span>}
        </div>
        {/* Server info card */}
        {serverInfo && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <img
              src={serverInfo.icon ? `https://cdn.discordapp.com/icons/${selectedGuild}/${serverInfo.icon}.png` : '/blank-icon.png'}
              alt="Server Icon"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border object-cover bg-gray-900"
              style={{ minWidth: 48, minHeight: 48 }}
            />
            <div className="flex-1 w-full">
              <span className="text-lg sm:text-xl font-bold text-white">{serverInfo.name}</span>
              {serverInfo.invite && (
                <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
                  <FaLink className="text-blue-400" />
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="block w-full p-1 sm:p-2 bg-gray-900 text-gray-200 border border-gray-700 rounded text-xs sm:text-base"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Banner image with upload field */}
        {botInvited && (
          <div className="mb-4 sm:mb-6">
            <label className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              <FaServer /> Server Banner (Preview):
            </label>
            {serverInfo && (serverInfo.banner || serverInfo.splash) ? (
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <img
                  src={
                    serverInfo.banner
                      ? `https://cdn.discordapp.com/banners/${selectedGuild}/${serverInfo.banner}.png`
                      : `https://cdn.discordapp.com/splashes/${selectedGuild}/${serverInfo.splash}.png`
                  }
                  alt="Server Banner"
                  className="rounded-lg sm:rounded-xl border border-gray-700 object-cover shadow"
                  style={{ width: '100%', maxWidth: 256, height: 72, maxHeight: 96, objectFit: 'cover', background: '#222' }}
                />
                <span className="text-xs text-gray-400 text-center">Banner is fetched from Discord. To update, change your server banner on Discord.</span>
              </div>
            ) : (
              <div className="w-full h-16 sm:h-24 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-lg sm:rounded-xl text-gray-500 text-xs sm:text-base">
                No banner available
              </div>
            )}
          </div>
        )}
        {/* Form fields for server details */}
        {botInvited && (
          <>
            <div className="mb-4 sm:mb-6">
              <label htmlFor="description" className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaInfoCircle /> Server Description:</label>
              <ReactQuill
                value={description}
                onChange={value => {
                  setDescription(value);
                  setDescriptionHTML(value);
                  setCharCount(value.replace(/<[^>]+>/g, '').length);
                }}
                modules={modules}
                formats={formats}
                className="mb-1 sm:mb-2 bg-gray-900 text-white rounded-lg sm:rounded-xl"
                theme="snow"
              />
              <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400">{charCount}/5000 characters</div>
              <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-300">Preview:</h3>
              <div className="mt-1 sm:mt-2 p-2 sm:p-4 border border-gray-700 rounded bg-gray-950 text-gray-100 text-xs sm:text-base">
                <div
                  className="prose max-w-none prose-invert prose-p:my-1 prose-p:leading-snug prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-strong:text-white prose-a:text-blue-400"
                  style={{ color: '#f3f4f6' }}
                  dangerouslySetInnerHTML={{ __html: descriptionHTML }}
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label htmlFor="shortDescription" className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaInfoCircle /> Short Description:</label>
              <input
                id="shortDescription"
                type="text"
                value={shortDescription}
                onChange={handleShortDescriptionChange}
                maxLength={100}
                className="block w-full p-2 sm:p-3 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                placeholder="A short summary of your server"
              />
              <div className="text-xs sm:text-sm text-gray-400 mt-1">{shortCharCount} / 100 characters</div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaPalette /> Custom Color Theme:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorTheme}
                  onChange={e => setColorTheme(e.target.value)}
                  className="w-8 h-8 sm:w-10 sm:h-10 border rounded"
                  title="Pick a color"
                />
                <span className="ml-2 text-gray-300 text-xs sm:text-base">{colorTheme}</span>
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label htmlFor="tags" className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaTags /> Add Tags:</label>
              <input
                id="tags"
                type="text"
                onKeyDown={handleTagInput}
                className="block w-full p-2 sm:p-3 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                placeholder="Type a tag and press Enter (max 10 tags)"
              />
              <div className="mt-1 sm:mt-2 flex flex-wrap gap-1 sm:gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-full text-xs sm:text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 sm:ml-2 text-white hover:text-red-300"
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label htmlFor="language" className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaLanguage /> Server Language:</label>
              <div className="relative">
                <select
                  id="language"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="block w-full p-2 sm:p-3 pr-8 sm:pr-10 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none text-sm sm:text-base"
                  required
                >
                  <option value="" disabled>-- Select a Language --</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Russian">Russian</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Italian">Italian</option>
                  <option value="Turkish">Turkish</option>
                  <option value="Polish">Polish</option>
                  <option value="Dutch">Dutch</option>
                  <option value="Other">Other</option>
                </select>
                <FaChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base sm:text-lg" />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaTags /> Categories (up to 3):</label>
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-1 sm:mb-2">
                {CATEGORIES.map(cat => {
                  const selected = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setCategories(categories.filter(c => c !== cat));
                        } else if (categories.length < 3) {
                          setCategories([...categories, cat]);
                        }
                      }}
                      className={`px-2 sm:px-3 py-1 rounded-full border transition text-xs sm:text-sm font-semibold
                        ${selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-blue-900'}
                        ${!selected && categories.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      disabled={!selected && categories.length >= 3}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block mb-1 sm:mb-2 font-semibold text-gray-200 text-sm sm:text-base">Discord Widget Server ID (optional):</label>
              <input
                type="text"
                value={widgetId}
                onChange={e => setWidgetId(e.target.value)}
                className="block w-full p-2 sm:p-3 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none mb-1 sm:mb-2 text-sm sm:text-base"
                placeholder="Enter your server's guild ID for the widget (optional)"
              />
            </div>
            {/* Invite error and manual invite input */}
            {serverInfo && serverInfo.inviteError && (
              <div className="mb-4 sm:mb-6 p-2 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-xs sm:text-base">
                <strong>Automatic invite creation failed:</strong> {serverInfo.inviteError}
              </div>
            )}
            {serverInfo && serverInfo.canPasteInvite && (
              <div className="mb-4 sm:mb-6">
                <label htmlFor="manualInvite" className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaLink /> Paste a Discord Invite Link:</label>
                <input
                  id="manualInvite"
                  type="text"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="block w-full p-2 sm:p-3 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-base"
                  placeholder="https://discord.gg/your-invite"
                />
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Please create an invite manually in Discord and paste it here.</p>
              </div>
            )}
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 mt-2 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-base sm:text-lg transition shadow"
            >
              <FaSave /> Save Server Details
            </button>
          </>
        )}
      </div>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full animate-fade-in flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Confirm Submission</h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-center text-sm sm:text-base">Are you sure you want to submit your server listing? Please review your details before proceeding.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full justify-center">
              <button
                onClick={confirmSave}
                className="px-4 sm:px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition shadow flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <FaSave /> Yes, Submit
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 sm:px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition shadow flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
          <div className="bg-gray-900 border border-red-700 rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full animate-fade-in flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-red-400 mb-2 sm:mb-4 flex items-center gap-2"><FaTimes className="text-red-400" /> Failed to Save</h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-center text-sm sm:text-base">{errorMessage}</p>
            <button
              onClick={() => setShowErrorDialog(false)}
              className="px-4 sm:px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition shadow text-sm sm:text-base w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
          <div className="bg-gray-900 border border-green-700 rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full animate-fade-in flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-green-400 mb-2 sm:mb-4 flex items-center gap-2"><FaSave className="text-green-400" /> Server Saved</h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-center text-sm sm:text-base">Server details saved successfully!</p>
            <button
              onClick={() => window.location.href = `/server/${selectedGuild}`}
              className="px-4 sm:px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition shadow text-sm sm:text-base w-full"
            >
              Go to Server Page
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
