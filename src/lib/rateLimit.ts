type RateLimitOptions = {
  windowMs: number; // e.g. 60_000 for 1 minute
  max: number;      // max requests per windowMs
};

const rateLimitStore = new Map<string, { count: number; lastRequest: number }>();

export function rateLimit(req: any, res: any, options: RateLimitOptions) {
  let effectiveOptions = options;
  let key;
  // Loosen rate limit for Discord guilds endpoint
  if (req.url && req.url.startsWith('/api/discord/guilds')) {
    effectiveOptions = { windowMs: 60_000, max: 1000 };
    // Use only the path for the key, not the full URL with query params
    key = `${req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'}:/api/discord/guilds`;
  } else {
    key = `${req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown'}:${req.url}`;
  }
  const now = Date.now();

  let entry = rateLimitStore.get(key);
  if (!entry || now - entry.lastRequest > effectiveOptions.windowMs) {
    entry = { count: 1, lastRequest: now };
  } else {
    entry.count += 1;
    entry.lastRequest = now;
  }
  rateLimitStore.set(key, entry);

  if (entry.count > effectiveOptions.max) {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
    return false;
  }
  return true;
}