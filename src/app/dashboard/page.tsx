'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import Spinner from '@/components/Spinner';
import { FaTachometerAlt, FaPlusCircle, FaServer } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
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

// Add a type for Discord invite object
interface DiscordInvite {
  code: string;
  [key: string]: any;
}

export default function Dashboard() {
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
  const [existingServer, setExistingServer] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [widgetId, setWidgetId] = useState('');
  const [colorTheme, setColorTheme] = useState('black');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allListedServers, setAllListedServers] = useState<any[]>([]);
  const router = useRouter();

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
        // If data is an object with a servers property, use that, else use data directly
        setAllListedServers(Array.isArray(data) ? data : data.servers || []);
      });
  }, []);

  const userGuildIds = guilds.map((g: any) => g.id);
  const listedGuildIds = allListedServers.map((server: any) => server.guildId);

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
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=1366467731200675871&permissions=8&scope=bot&guild_id=${selectedGuild}&redirect_uri=${encodeURIComponent('http://hentaidiscord.com/dashboard')}&response_type=code`;
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

  // Prefill form if editing (optional: you can keep your existing logic for this)
  useEffect(() => {
    if (existingServer) {
      setDescription(existingServer.description || '');
      setDescriptionHTML(existingServer.description || '');
      setCategories(existingServer.categories || []);
      setShortDescription(existingServer.shortDescription || '');
      setTags(existingServer.tags || []);
      setLanguage(existingServer.language || '');
      setLink(existingServer.link || '');
      setColorTheme(existingServer.colorTheme || 'black');
      setWidgetId(existingServer.widgetId || ''); // <-- Fix: prefill widgetId
    }
  }, [existingServer]);

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

  // Always use a string invite URL for display and submission
  const inviteUrl = serverInfo && typeof serverInfo.invite === 'object' && serverInfo.invite && 'code' in serverInfo.invite
    ? `https://discord.gg/${(serverInfo.invite as DiscordInvite).code}`
    : (serverInfo && typeof serverInfo.invite === 'string' ? serverInfo.invite : link);

  const handleSave = async () => {
    if (!selectedGuild || !description || !shortDescription || !(inviteUrl) || !language) {
      alert('Please fill in all fields. Make sure the bot is in your server, an invite could be generated, and a language is selected.');
      return;
    }
    const response = await fetch('/api/servers/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId: selectedGuild,
        description,
        shortDescription,
        categories, // <-- add this
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

    if (response.ok) {
      alert('Server details saved successfully!');
      window.location.href = `/server/${selectedGuild}`;
    } else {
      const error = await response.json();
      alert(`Failed to save server details: ${error.error}`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    // Call your delete API here
    try {
      // await fetch(...)
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (session === undefined || status === 'loading') return <Spinner />;
  if (!session) return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black transition-colors pt-10 sm:pt-20">
      <div className="w-full max-w-md bg-gray-900/80 rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-800 animate-fade-in text-center mx-auto mt-4 sm:mt-12 mb-8 sm:mb-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-red-500">Access Restricted</h2>
        <p className="mb-6 text-zinc-400 text-sm sm:text-base">You must be logged in to access your dashboard and manage your Discord servers.</p>
        <a href="/profile" className="inline-block w-full sm:w-auto px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors">Login with Discord</a>
      </div>
    </main>
  );

  return (
    <main className="flex flex-col items-center justify-center min-h-0 min-h-screen:sm p-2 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black transition-colors">
      <div className="w-full max-w-2xl bg-gray-900/80 rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-800 animate-fade-in my-auto">
        <div className="mt-2 sm:mt-6">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Welcome to your Dashboard!</h2>
            <p className="mb-4 sm:mb-6 text-zinc-600 dark:text-zinc-300 text-sm sm:text-base">
              Manage your Discord server listings, add new servers, and keep track of your submissions all in one place.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-0">
              <button
                onClick={() => router.push('/add-server')}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 font-semibold text-base transition-colors focus:outline-none text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-zinc-700 bg-transparent border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-700 rounded-t-xl sm:rounded-t-none sm:rounded-l-xl"
              >
                <FaPlusCircle className="text-lg" /> Add Server
              </button>
              <button
                onClick={() => router.push('/manage-servers')}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 font-semibold text-base transition-colors focus:outline-none text-zinc-700 dark:text-zinc-200 hover:bg-blue-100 dark:hover:bg-zinc-700 bg-transparent rounded-b-xl sm:rounded-b-none sm:rounded-r-xl"
              >
                <FaServer className="text-lg" /> Manage Servers
              </button>
            </div>
          </div>
        </div>
        <ConfirmDialog
          open={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Listing?"
          description="Are you sure you want to delete this listing? This action cannot be undone."
        />
      </div>
    </main>
  );
}