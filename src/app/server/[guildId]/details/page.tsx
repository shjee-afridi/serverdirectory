'use client'
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react'; // <-- import this
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import Spinner from '@/components/Spinner'; // <-- import Spinner
import { FaServer, FaTags, FaPalette, FaLanguage, FaChevronDown, FaPlus, FaTimes, FaSave, FaInfoCircle, FaTrash, FaLink } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { CATEGORIES } from '@/constants/categories';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const formats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
  'blockquote', 'list', 'bullet', 'indent', 'link'
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

export default function ServerEditPage({ params }: { params: { guildId: string } }) {
  const [server, setServer] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [shortCharCount, setShortCharCount] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [validation, setValidation] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [invite, setInvite] = useState('');
  const [colorTheme, setColorTheme] = useState('black');
  const { data: session, status } = useSession(); // <-- get session
  const [notAllowed, setNotAllowed] = useState(false);
  const [isGuildAdmin, setIsGuildAdmin] = useState(false);
  const [widgetId, setWidgetId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeletedDialog, setShowDeletedDialog] = useState(false);

  // Add state for live Discord banner/splash
  const [discordBanner, setDiscordBanner] = useState<string | null>(null);
  const [discordSplash, setDiscordSplash] = useState<string | null>(null);

  // New state for banner mode
  const [bannerMode, setBannerMode] = useState<'banner' | 'color'>('banner');

  const router = useRouter();

  useEffect(() => {
    if (session && server) {
      fetch('/api/discord/guilds')
        .then(res => res.json())
        .then(guilds => {
          const isAdmin = Array.isArray(guilds) && guilds.some((g: any) => g.id === server.guildId);
          setIsGuildAdmin(isAdmin);
          // Only block if NOT admin AND NOT original lister
          if (!isAdmin && session.user?.id !== server.userId) setNotAllowed(true);
        });
    }
  }, [session, server]);
  // Fetch server data and Discord data
  useEffect(() => {
    fetch(`/api/servers/${params.guildId}`)
      .then(res => {
        if (res.status === 404) throw new Error('not found');
        return res.json();
      })
      .then(data => {
        setServer(data);
        setDescription(data.description || '');
        setCategories(data.categories || []);
        setShortDescription(data.shortDescription || '');
        setTags(data.tags || []);
        setColorTheme(data.colorTheme || 'black');
        setLanguage(data.language || '');
        setInvite(data.link || '');
        setWidgetId(data.widgetId || '');
        setBannerMode(data.bannerMode || 'banner'); // <-- persist bannerMode selection
      })
      .catch(() => setNotFound(true)); // <-- Add this here

    // Fetch Discord stats (member count)
    fetch(`/api/discord/guild-info?guildId=${params.guildId}`)
      .then(res => res.ok ? res.json() : {})
      .then((discord: any) => {
        setIconPreview(
          discord.icon
            ? `https://cdn.discordapp.com/icons/${params.guildId}/${discord.icon}.png`
            : null
        );
        setBannerPreview(
          discord.banner
            ? `https://cdn.discordapp.com/banners/${params.guildId}/${discord.banner}.png`
            : discord.splash
            ? `https://cdn.discordapp.com/splashes/${params.guildId}/${discord.splash}.png`
            : null
        );
        setDiscordBanner(discord.banner || null);
        setDiscordSplash(discord.splash || null);
        if (discord.invite) setInvite(discord.invite); // <-- prefer latest invite
        setMemberCount(discord.approximate_member_count ?? null);
      });
  }, [params.guildId, session]);

  useEffect(() => {
    setCharCount(description.length);
    setShortCharCount(shortDescription.length);
  }, [description, shortDescription]);

  // Clear all server-related state when notFound is true
  useEffect(() => {
    if (notFound) {
      setServer(null);
      setDescription('');
      setCategories([]);
      setShortDescription('');
      setTags([]);
      setColorTheme('black');
      setLanguage('');
      setInvite('');
      setWidgetId('');
    }
  }, [notFound]);

  if (status === 'loading') return <Spinner />;
  if (!session) return <div className="p-8 text-red-600 font-bold">You must be logged in to edit this server.</div>;
  if (notAllowed) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8">
      <div className="bg-gradient-to-r from-red-700/80 to-pink-700/80 border border-red-800 rounded-2xl shadow-xl px-6 py-8 flex flex-col items-center animate-fade-in">
        <FaTimes className="text-4xl sm:text-5xl text-red-300 mb-4 animate-pulse" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Access Denied</h2>
        <p className="text-base sm:text-lg text-red-200 mb-2 text-center">You are not allowed to edit this server listing.</p>
        <a href="/dashboard" className="mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-semibold transition text-sm sm:text-base shadow">Go to Dashboard</a>
      </div>
    </div>
  );
  if (notFound) return <div className="p-8 text-red-600 font-bold">This server listing is unavailable.</div>;
  if (!server) return <Spinner />;

  // Image preview handlers
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setCharCount(value.length);
  };

  // Tag input with color animation
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag) && tags.length < 10 && !tag.includes(' ')) {
        setTags([...tags, tag]);
        setTagInput('');
      }
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Validation
  const validate = () => {
    if (categories.length === 0) {
      setValidation('Please select at least one category.');
      return false;
    }
    if (description.length < 10) {
      setValidation('Description must be at least 10 characters.');
      return false;
    }
    setValidation('');
    return true;
  };

  // Save handler
  const handleSave = async () => {
    if (!validate()) {
      setErrorMessage(validation || 'A required field is missing.');
      setShowErrorDialog(true);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    const res = await fetch('/api/servers/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId: params.guildId,
        description,
        shortDescription,
        categories,
        tags,
        language,
        link: invite,
        icon: server?.icon,
        // Use the latest Discord banner/splash if available, else fallback to DB
        banner: discordBanner || server?.banner,
        splash: discordSplash || server?.splash,
        name: server?.name,
        colorTheme,
        widgetId,
        bannerMode, // <-- include bannerMode
      }),
    });
    setSaving(false);
    setShowConfirm(false);
    if (res.ok) {
      router.push(`/server/${params.guildId}`);
    } else {
      const error = await res.json().catch(() => ({}));
      setErrorMessage(error.error || 'Failed to update server.');
      setShowErrorDialog(true);
      setError('Failed to update server.');
    }
  };

  // Custom delete dialog state
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/servers/${params.guildId}`, { method: 'DELETE' });
      if (res.ok) {
        // Invalidate SWR cache for this server
        mutate(`/api/servers/${params.guildId}`);
        setShowDeleteDialog(false);
        setShowDeletedDialog(true);
        // Optionally, redirect after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete server');
        setShowErrorDialog(true);
      }
    } catch (e) {
      setErrorMessage('Failed to delete server');
      setShowErrorDialog(true);
    }
    setDeleting(false);
  };

  if (notFound) return <div className="p-8 text-red-600 font-bold">This server listing is unavailable.</div>;
  if (!server) return <div>Loading...</div>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black transition-colors">
      <div className="w-full max-w-2xl bg-gray-900/80 rounded-2xl shadow-xl p-2 sm:p-6 md:p-8 border border-gray-800 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-white">
          <FaServer className="text-yellow-400" /> Edit {server.name}
        </h1>
        {/* Banner/Color Mode Picker */}
        <div className="mb-4 sm:mb-6">
          <label className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-2 text-sm sm:text-base">
            <FaPalette /> Server Listing Banner Style:
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-1 rounded-lg font-semibold border transition-colors ${bannerMode === 'banner' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
              onClick={() => setBannerMode('banner')}
            >
              Use Banner
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-lg font-semibold border transition-colors ${bannerMode === 'color' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
              onClick={() => setBannerMode('color')}
            >
              Use Color Theme
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {bannerMode === 'banner'
              ? 'Your server page will use the banner image (if available).'
              : 'Your server page will use your selected color theme as the background.'}
          </div>
        </div>
        {/* Server icon and banner preview */}
        <div className="flex flex-col items-center gap-0 mb-4 sm:mb-6 relative w-full">
          {/* Banner */}
          <div className="w-full flex justify-center relative">
            {bannerMode === 'banner' ? (
              <img
                src={(bannerPreview ? bannerPreview + '?size=2048' : '/blank-banner.png')}
                alt="Server Banner"
                className="rounded-xl border border-gray-700 object-cover shadow w-full max-w-lg h-24 sm:h-32 bg-gray-900"
                style={{ background: '#222', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-xl border border-gray-700 w-full max-w-lg h-24 sm:h-32 bg-gray-900"
                style={{ background: colorTheme }}
              />
            )}
            {/* Icon overlaps banner */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 sm:-bottom-10 z-10">
              <img
                src={iconPreview ? iconPreview + '?size=2048' : '/blank-icon.png'}
                alt="Server Icon"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-gray-900 shadow-lg bg-gray-900 object-cover"
                style={{ minWidth: 64, minHeight: 64 }}
              />
            </div>
          </div>
          {/* Spacer for icon overlap */}
          <div className="h-10 sm:h-12" />
        </div>
        {/* Validation and feedback */}
        {validation && <div className="mb-2 text-red-600 text-xs sm:text-base">{validation}</div>}
        {success && <div className="mb-2 text-green-600 text-xs sm:text-base">{success}</div>}
        {error && <div className="mb-2 text-red-600 text-xs sm:text-base">{error}</div>}
        <div className="mb-4 sm:mb-6">
          <label htmlFor="description" className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaInfoCircle /> Description:</label>
          <ReactQuill
            value={description}
            onChange={setDescription}
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
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        </div>
        <div className="mb-4 sm:mb-6">
          <label htmlFor="shortDescription" className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaInfoCircle /> Short Description:</label>
          <input
            id="shortDescription"
            type="text"
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
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
          <label className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaTags /> Tags (press Enter to add, max 10):</label>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagInput}
            className="block w-full p-2 sm:p-3 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
            placeholder="Type a tag and press Enter"
          />
          <div className="mt-1 sm:mt-2 flex flex-wrap gap-1 sm:gap-2">
            {tags.map(tag => (
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
          <label className="block mb-1 sm:mb-2 font-semibold text-gray-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"><FaLanguage /> Server Language:</label>
          <div className="relative">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="block w-full p-2 sm:p-3 pr-8 sm:pr-10 bg-gray-800 text-white border border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none text-sm sm:text-base"
              required
            >
              <option value="" disabled>
                -- Select a Language --
              </option>
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
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-6">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-base sm:text-lg transition shadow"
            disabled={saving}
          >
            {saving ? <Spinner /> : <FaSave />} Save Changes
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-base sm:text-lg transition shadow"
            disabled={saving}
          >
            <FaTrash /> Delete Server
          </button>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full animate-fade-in flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Confirm Submission</h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-center text-sm sm:text-base">Are you sure you want to save changes to your server listing? Please review your details before proceeding.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full justify-center">
              <button
                onClick={confirmSave}
                className="px-4 sm:px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition shadow flex items-center gap-2 text-sm sm:text-base"
                disabled={saving}
              >
                {saving ? <Spinner /> : <FaSave />} Submit
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 sm:px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-full font-semibold transition shadow text-sm sm:text-base"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full animate-fade-in flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Delete Listing?</h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-center text-sm sm:text-base">Are you sure you want to delete this server listing? This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full justify-center">
              <button
                onClick={confirmDelete}
                className="px-4 sm:px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition shadow flex items-center gap-2 text-sm sm:text-base"
                disabled={deleting}
              >
                {deleting ? <Spinner /> : <FaTrash />} Delete
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 sm:px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-full font-semibold transition shadow text-sm sm:text-base"
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Delete Dialog */}
      {showDeletedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full animate-fade-in flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4 flex items-center gap-2"><FaTrash className="text-red-400" /> Server Deleted</h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-center text-sm sm:text-base">Your server listing has been deleted successfully.</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition shadow text-sm sm:text-base w-full"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
          <div className="bg-gray-900 border border-red-700 rounded-2xl shadow-xl p-4 sm:p-8 max-w-md w-full animate-fade-in flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold text-red-400 mb-2 sm:mb-4 flex items-center gap-2"><FaTimes className="text-red-400" /> Error</h2>
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
    </main>
  );
}
