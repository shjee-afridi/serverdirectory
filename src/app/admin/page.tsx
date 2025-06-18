'use client';
import { useSession } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import { useState, useRef, useEffect } from 'react';
import { ADMIN_EMAILS } from '@/lib/isAdmin';
import ServerListItem from '@/components/ServerListItem';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

const fetcher = (url: string) => fetch(url).then(res => res.json());
const PAGE_SIZE = 20;

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
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [actionUserId, setActionUserId] = useState('');
  const [actionGuildId, setActionGuildId] = useState('');
  const [actionType, setActionType] = useState('ban');
  const [serverFilter, setServerFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [serverPage, setServerPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [error, setError] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifUrl, setNotifUrl] = useState('');
  const [notifStatus, setNotifStatus] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const REVIEW_PAGE_SIZE = 20;

  // Always call hooks first!
  const { data: serversData = { servers: [] } } = useSWR('/api/servers', fetcher);
  const servers = serversData.servers || [];
  const { data: reviewsData = { reviews: [] } } = useSWR('/api/reviews', fetcher);
  const reviews = reviewsData.reviews || [];
  // Add SWR for blocks
  const { data: blocksData, mutate: mutateBlocks } = useSWR(
    '/api/admin/blocks',
    fetcher
  );
  const blocks = blocksData?.blocks || [];

  // Add SWR for users from MongoDB
  const { data: usersData = { users: [] } } = useSWR('/api/admin/users', fetcher);
  const allUsers = usersData.users || [];

  // Only allow admin emails
  if (!session || !ADMIN_EMAILS.includes(session.user?.email || '')) {
    return <div className="p-8 text-red-600 font-bold">Forbidden</div>;
  }

  // Determine which fields are required/visible
  const requiresUserId = [
    'ban',
    'blockReview',
    'blockReviewOnServer',
    'blockList'
  ].includes(actionType);
  const requiresGuildId = [
    'blockList',
    'blockReviewOnServer',
    'blockListOnServer',
    'blockGuildRelist' // <-- add this line
  ].includes(actionType);
  const onlyGuildId = actionType === 'blockListOnServer';
  const onlyUserId = actionType === 'ban' || actionType === 'blockReview';

  // Ban/block actions
  const handleBlockAction = async () => {
    setActionPending(true);
    setError('');
    try {
      let userIdToSend = actionUserId;
      if (actionType === 'blockGuildRelist') {
        userIdToSend = 'global';
      }
      const res = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdToSend,
          type: actionType,
          guildId: actionGuildId,
          unblock: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to perform action');
      } else {
        setShowConfirm(false);
        mutateBlocks();
      }
    } catch (e) {
      setError('Failed to perform action');
    } finally {
      setActionPending(false);
    }
  };

  // Example delete server/review (you can add confirmation)
  const handleDeleteServer = async (guildId: string) => {
    await fetch(`/api/servers/${guildId}`, { method: 'DELETE' });
    mutate('/api/servers');
  };
  const handleDeleteReview = async (guildId: string, userId: string) => {
    await fetch(`/api/servers/${guildId}/review`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    mutate('/api/reviews');
  };

  // Ban/Block handler
  const handleBlock = async (userId: string, type: string, guildId?: string) => {
    setError('');
    try {
      const res = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, guildId }),
      });
      if (!res.ok) throw new Error('Failed to block user');
      await mutateBlocks(); // Refresh block list
      alert('Blocked!');
    } catch (e: any) {
      setError(e.message || 'Error blocking user');
    }
  };

  // Unblock/Unban handler
  const handleUnblock = async (userId: string, type: string, guildId?: string) => {
    setError('');
    try {
      await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, guildId, unblock: true }),
      });
      await mutateBlocks(); // Refresh block list
      alert('Unblocked!');
    } catch (e: any) {
      setError(e.message || 'Error unblocking user');
    }
  };

  // Notification send handler
  async function sendNotification(e: React.FormEvent) {
    e.preventDefault();
    setNotifStatus('Sending...');
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: notifTitle, body: notifBody, url: notifUrl })
    });
    if (res.ok) setNotifStatus('Notification sent!');
    else setNotifStatus('Failed to send notification');
  }

  // Autofill Guild ID
  const fillGuildId = (guildId: string) => setActionGuildId(guildId);
  // Autofill User ID
  const fillUserId = (userId: string) => setActionUserId(userId);

  // Filtered lists
  const filteredServers = servers.filter((s: any) =>
    s.name?.toLowerCase().includes(serverFilter.toLowerCase()) ||
    s.guildId?.toLowerCase().includes(serverFilter.toLowerCase())
  );
  const filteredUsers = allUsers.filter((u: any) =>
    (u.name || '').toLowerCase().includes(userFilter.toLowerCase()) ||
    (u.id || '').toLowerCase().includes(userFilter.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userFilter.toLowerCase())
  );

  // Pagination logic
  const serverPageCount = Math.ceil(filteredServers.length / PAGE_SIZE);
  const userPageCount = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const reviewPageCount = Math.ceil(reviews.length / REVIEW_PAGE_SIZE);
  const pagedServers = filteredServers.slice((serverPage - 1) * PAGE_SIZE, serverPage * PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const pagedReviews = reviews.slice((reviewPage - 1) * REVIEW_PAGE_SIZE, reviewPage * REVIEW_PAGE_SIZE);

  // Virtualized row renderers
  const ServerRow = ({ index, style }: ListChildComponentProps) => {
    const server = pagedServers[index];
    if (!server) return null;
    return (
      <div style={style} className="flex border-b items-center">
        <div className="w-1/3 px-2 py-1 truncate">{server.name}</div>
        <div className="w-1/3 px-2 py-1 truncate">{server.guildId}</div>
        <div className="w-1/3 px-2 py-1">
          <button onClick={() => fillGuildId(server.guildId)} className="bg-gray-200 px-2 py-1 rounded mr-2">Autofill Guild ID</button>
        </div>
      </div>
    );
  };
  const UserRow = ({ index, style }: ListChildComponentProps) => {
    const user = pagedUsers[index];
    if (!user) return null;
    return (
      <div style={style} className="flex border-b items-center">
        <div className="w-1/4 px-2 py-1 truncate">{user.id}</div>
        <div className="w-1/4 px-2 py-1 truncate">{user.name || '-'}</div>
        <div className="w-1/4 px-2 py-1 truncate">{user.email || '-'}</div>
        <div className="w-1/4 px-2 py-1">
          <button onClick={() => fillUserId(user.id)} className="bg-gray-200 px-2 py-1 rounded mr-2">Autofill User ID</button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-8 max-w-full w-full">
      <h1 className="text-2xl font-bold mb-4 text-center">Admin Panel</h1>
      <div className="mb-4">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {/* User ID input: show if required */}
        {requiresUserId && (
          <>
            <label className="block mb-1">User ID</label>
            <input value={actionUserId} onChange={e => setActionUserId(e.target.value)} className="border px-2 py-1 mr-4" />
          </>
        )}
        {/* Guild ID input: show if required */}
        {requiresGuildId && (
          <>
            <label className="block mb-1 mt-2">Guild ID</label>
            <input value={actionGuildId} onChange={e => setActionGuildId(e.target.value)} className="border px-2 py-1 mr-4" />
          </>
        )}
        {/* Action Type Dropdown */}
        <div className="mb-4">
          <label className="block font-bold mb-1">Action Type</label>
          <select
            className="border px-2 py-1 rounded w-full max-w-xs"
            value={actionType}
            onChange={e => setActionType(e.target.value)}
          >
            <option value="ban">Ban User (user cannot list or review on any server)</option>
            <option value="blockList">Block user from listing any server</option>
            <option value="blockReview">Block user from reviewing any server</option>
            <option value="blockListOnServer">Block user from listing on specific server</option>
            <option value="blockReviewOnServer">Block user from reviewing on specific server</option>
            <option value="blockGuildRelist">Block this server from being listed again by any admin of that server</option>
          </select>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded mb-2 sm:mb-0"
          disabled={actionPending}
        >
          {actionPending ? 'Processing...' : 'Block/Ban'}
        </button>
        <ConfirmDialog
          open={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleBlockAction}
          title="Are you sure?"
          description="This action cannot be undone."
        />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mt-8 mb-2">All Servers</h2>
        <input
          type="text"
          placeholder="Filter by name or Guild ID..."
          value={serverFilter}
          onChange={e => { setServerFilter(e.target.value); setServerPage(1); }}
          className="border px-2 py-1 mb-2 w-full"
        />
        <div className="border rounded overflow-x-auto" style={{ height: 300 }}>
          <div className="flex font-bold border-b bg-gray-100 min-w-[600px]">
            <div className="w-1/4 px-2 py-1">Name</div>
            <div className="w-1/4 px-2 py-1">Guild ID</div>
            <div className="w-1/4 px-2 py-1">Language</div>
            <div className="w-1/4 px-2 py-1">Actions</div>
          </div>
          {servers
            .filter((s: any) =>
              (!serverFilter ||
                s.name?.toLowerCase().includes(serverFilter.toLowerCase()) ||
                s.guildId?.toLowerCase().includes(serverFilter.toLowerCase()))
            )
            .slice((serverPage - 1) * PAGE_SIZE, serverPage * PAGE_SIZE)
            .map((server: any) => (
              <div key={server.guildId} className="flex border-b items-center min-w-[600px] flex-wrap sm:flex-nowrap">
                <div className="w-1/4 px-2 py-1 truncate">{server.name}</div>
                <div className="w-1/4 px-2 py-1 truncate">{server.guildId}</div>
                <div className="w-1/4 px-2 py-1 truncate">{server.language}</div>
                <div className="w-1/4 px-2 py-1 flex flex-col gap-2 sm:flex-row sm:gap-2">
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded w-full sm:w-auto"
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this server listing?')) {
                        await fetch(`/api/servers/${server.guildId}`, { method: 'DELETE' });
                        mutate('/api/servers');
                        alert('Server deleted.');
                      }
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="bg-gray-200 px-2 py-1 rounded w-full sm:w-auto"
                    onClick={() => fillGuildId(server.guildId)}
                  >
                    Autofill Server ID
                  </button>
                </div>
              </div>
            ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-2">
          <button
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 w-full sm:w-auto"
            onClick={() => setServerPage(p => Math.max(1, p - 1))}
            disabled={serverPage === 1}
          >
            Previous
          </button>
          <span className="text-center">Page {serverPage} of {serverPageCount || 1}</span>
          <button
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 w-full sm:w-auto"
            onClick={() => setServerPage(p => Math.min(serverPageCount, p + 1))}
            disabled={serverPage === serverPageCount || serverPageCount === 0}
          >
            Next
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">All Users</h2>
      <input
        type="text"
        placeholder="Filter by name, email, or User ID..."
        value={userFilter}
        onChange={e => { setUserFilter(e.target.value); setUserPage(1); }}
        className="border px-2 py-1 mb-2 w-full"
      />
      <div className="border rounded overflow-x-auto" style={{ height: 300 }}>
        <div className="flex font-bold border-b bg-gray-100 min-w-[600px]">
          <div className="w-1/4 px-2 py-1">User ID</div>
          <div className="w-1/4 px-2 py-1">Name</div>
          <div className="w-1/4 px-2 py-1">Email</div>
          <div className="w-1/4 px-2 py-1">Actions</div>
        </div>
        <List
          height={260}
          itemCount={pagedUsers.length}
          itemSize={40}
          width={'100%'}
        >
          {({ index, style }: ListChildComponentProps) => {
            const user = pagedUsers[index];
            if (!user) return null;
            return (
              <div style={style} className="flex border-b items-center min-w-[600px] flex-wrap sm:flex-nowrap">
                <div className="w-1/4 px-2 py-1 truncate">{user.id}</div>
                <div className="w-1/4 px-2 py-1 truncate">{user.name || '-'}</div>
                <div className="w-1/4 px-2 py-1 truncate">{user.email || '-'}</div>
                <div className="w-1/4 px-2 py-1 flex flex-col gap-2 sm:flex-row sm:gap-2">
                  <button onClick={() => fillUserId(user.id)} className="bg-gray-200 px-2 py-1 rounded w-full sm:w-auto">Autofill User ID</button>
                </div>
              </div>
            );
          }}
        </List>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-2">
        <button
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 w-full sm:w-auto"
          onClick={() => setUserPage(p => Math.max(1, p - 1))}
          disabled={userPage === 1}
        >
          Previous
        </button>
        <span className="text-center">Page {userPage} of {userPageCount || 1}</span>
        <button
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 w-full sm:w-auto"
          onClick={() => setUserPage(p => Math.min(userPageCount, p + 1))}
          disabled={userPage === userPageCount || userPageCount === 0}
        >
          Next
        </button>
      </div>

      <div className="mb-6">
        <h2 className="font-bold mb-2">All Reviews</h2>
        <div className="border rounded overflow-x-auto">
          <div className="flex font-bold border-b bg-gray-100 min-w-[600px]">
            <div className="w-1/4 px-2 py-1">Username</div>
            <div className="w-1/4 px-2 py-1">Guild ID</div>
            <div className="w-2/4 px-2 py-1">Comment</div>
            <div className="w-1/6 px-2 py-1">Actions</div>
          </div>
          {pagedReviews.map((review: any) => (
            <div key={review._id || (review.guildId + '-' + review.userId)} className="flex border-b items-center min-w-[600px] flex-wrap sm:flex-nowrap">
              <div className="w-1/4 px-2 py-1 truncate">{review.username}</div>
              <div className="w-1/4 px-2 py-1 truncate">{review.guildId}</div>
              <div className="w-2/4 px-2 py-1 truncate">{review.comment}</div>
              <div className="w-1/6 px-2 py-1 flex flex-col gap-2 sm:flex-row sm:gap-2">
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded w-full sm:w-auto"
                  onClick={() => handleDeleteReview(review.guildId, review.userId)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-2">
          <button
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 w-full sm:w-auto"
            onClick={() => setReviewPage(p => Math.max(1, p - 1))}
            disabled={reviewPage === 1}
          >
            Previous
          </button>
          <span className="text-center">Page {reviewPage} of {reviewPageCount || 1}</span>
          <button
            className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 w-full sm:w-auto"
            onClick={() => setReviewPage(p => Math.min(reviewPageCount, p + 1))}
            disabled={reviewPage === reviewPageCount || reviewPageCount === 0}
          >
            Next
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">Ban/Block List</h2>
      <div className="border rounded overflow-x-auto mb-8">
        <div className="flex font-bold border-b bg-gray-100 min-w-[600px]">
          <div className="w-1/4 px-2 py-1">User ID</div>
          <div className="w-1/6 px-2 py-1">Banned</div>
          <div className="w-1/6 px-2 py-1">Block Review</div>
          <div className="w-1/6 px-2 py-1">Block List</div>
          <div className="w-1/6 px-2 py-1">Per-Server Blocks</div>
          <div className="w-1/6 px-2 py-1">Actions</div>
        </div>
        {blocks.map((block: any) => (
          <div key={block.userId} className="flex border-b items-center min-w-[600px] flex-wrap sm:flex-nowrap">
            <div className="w-1/4 px-2 py-1 truncate">{block.userId}</div>
            <div className="w-1/6 px-2 py-1">{block.banned ? 'Yes' : ''}</div>
            <div className="w-1/6 px-2 py-1">{block.blockReview ? 'Yes' : ''}</div>
            <div className="w-1/6 px-2 py-1">{block.blockList ? 'Yes' : ''}</div>
            <div className="w-1/6 px-2 py-1 text-xs">
              {block.blockReviewOn && Object.keys(block.blockReviewOn).length > 0 && (
                <div>ReviewOn: {Object.keys(block.blockReviewOn).join(', ')}</div>
              )}
              {block.blockListOn && Object.keys(block.blockListOn).length > 0 && (
                <div>ListOn: {Object.keys(block.blockListOn).join(', ')}</div>
              )}
            </div>
            <div className="w-1/6 px-2 py-1 flex flex-col gap-1">
              {block.banned && (
                <button className="bg-red-500 text-white px-2 py-1 rounded w-full sm:w-auto" onClick={() => handleUnblock(block.userId, 'ban')}>Unban</button>
              )}
              {block.blockReview && (
                <button className="bg-red-500 text-white px-2 py-1 rounded w-full sm:w-auto" onClick={() => handleUnblock(block.userId, 'blockReview')}>Unblock Review</button>
              )}
              {block.blockList && (
                <button className="bg-red-500 text-white px-2 py-1 rounded w-full sm:w-auto" onClick={() => handleUnblock(block.userId, 'blockList')}>Unblock List</button>
              )}
              {block.blockReviewOn && Object.keys(block.blockReviewOn).map((gid: string) => (
                <button key={gid} className="bg-red-500 text-white px-2 py-1 rounded mt-1 w-full sm:w-auto" onClick={() => handleUnblock(block.userId, 'blockReviewOnServer', gid)}>
                  Unblock ReviewOn {gid}
                </button>
              ))}
              {block.blockListOn && Object.keys(block.blockListOn).map((gid: string) => (
                <button key={gid} className="bg-red-500 text-white px-2 py-1 rounded mt-1 w-full sm:w-auto" onClick={() => handleUnblock(block.userId, 'blockListOnServer', gid)}>
                  Unblock ListOn {gid}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Global Blocked Guilds List */}
      {blocksData?.globalBlock?.blockGuildRelist && (
        <div className="mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold mt-8 mb-2">Globally Blocked Servers (Cannot Be Relisted)</h2>
          <div className="border rounded min-w-[400px]">
            <div className="flex font-bold border-b bg-gray-100">
              <div className="w-1/3 px-2 py-1">Guild ID</div>
              <div className="w-1/3 px-2 py-1">Status</div>
              <div className="w-1/3 px-2 py-1">Actions</div>
            </div>
            {Object.keys(blocksData.globalBlock.blockGuildRelist).map(gid => (
              <div key={gid} className="flex border-b items-center flex-wrap sm:flex-nowrap">
                <div className="w-1/3 px-2 py-1 truncate">{gid}</div>
                <div className="w-1/3 px-2 py-1 text-red-600 font-bold">Blocked</div>
                <div className="w-1/3 px-2 py-1 flex gap-2 flex-col sm:flex-row">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded w-full sm:w-auto"
                    onClick={async () => {
                      await handleUnblock('global', 'blockGuildRelist', gid);
                    }}
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Send Push Notification</h2>
        <form onSubmit={sendNotification} className="flex flex-col gap-2 max-w-md w-full mx-auto">
          <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Title" className="border p-2 rounded" required />
          <textarea value={notifBody} onChange={e => setNotifBody(e.target.value)} placeholder="Body" className="border p-2 rounded" required />
          <input value={notifUrl} onChange={e => setNotifUrl(e.target.value)} placeholder="URL (optional)" className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send Notification</button>
          {notifStatus && <div className="text-sm mt-1">{notifStatus}</div>}
        </form>
      </div>
    </div>
  );
}