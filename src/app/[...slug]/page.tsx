import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import HomePage from '../home/page';

export async function generateMetadata({ params }: { params: { slug?: string[] } }): Promise<Metadata> {
  const searchTerm = params.slug ? params.slug.join(' ') : '';
  const safeTerm = searchTerm.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const title = safeTerm
    ? `${safeTerm} Discord Server | Find Any Discord Community`
    : 'Find Any Discord Server | Hentai Discord';
  const description = safeTerm
    ? `Looking for a Discord server about '${safeTerm}'? Discover top Discord communities for any topic, even if your search is unique!`
    : 'Search and discover any Discord server: anime, movies, gaming, music, study, NSFW, porn, hentai, nudes, onlyfans,milf, teen, dirty roleplay, or even random and unknown servers. Join the best Discord communities now!';
  return {
    title,
    description,
    keywords: [
      safeTerm,
      'Discord Server', 'Anime Discord', 'Movie Discord', 'Gaming Discord', 'Music Discord', 'Study Discord', 'Random Discord', 'NSFW Discord', 'Roleplay Discord', 'Meme Discord', 'Art Discord', 'Tech Discord', 'Programming Discord', 'Kpop Discord', 'Sports Discord', 'Book Discord', 'Language Discord', 'LGBTQ Discord', 'Furry Discord', 'Minecraft Discord', 'Valorant Discord', 'Genshin Impact Discord', 'Roblox Discord', 'Among Us Discord', 'Fortnite Discord', 'League of Legends Discord', 'Overwatch Discord', 'Call of Duty Discord', 'Aesthetic Discord', 'Chill Discord', 'Community Discord', 'Active Discord', 'New Discord', 'Big Discord', 'Small Discord', 'International Discord', 'English Discord', 'Hindi Discord', 'Spanish Discord', 'French Discord', 'German Discord', 'Russian Discord', 'Japanese Discord', 'Korean Discord', 'Chinese Discord', 'porn', 'hentai', 'nudes', 'onlyfans', 'milf', 'teen', 'dirty roleplay', 'adult', 'sex', 'lewd', '18+', 'uncensored', 'erotic', 'xxx', 'nsfw', 'sdwd', 'random', 'join any Discord server', 'find Discord server', 'search Discord server', 'best Discord server', 'top Discord server', 'discord server for everything', 'discord server for anything', 'discord server for everyone', 'discord server for you', 'discord server for all', 'discord server for fun', 'discord server for chat', 'discord server for games', 'discord server for anime', 'discord server for movies', 'discord server for music', 'discord server for study', 'discord server for memes', 'discord server for art', 'discord server for tech', 'discord server for programming', 'discord server for kpop', 'discord server for sports', 'discord server for books', 'discord server for language', 'discord server for lgbtq', 'discord server for furry', 'discord server for minecraft', 'discord server for valorant', 'discord server for genshin impact', 'discord server for roblox', 'discord server for among us', 'discord server for fortnite', 'discord server for league of legends', 'discord server for overwatch', 'discord server for call of duty', 'discord server for aesthetic', 'discord server for chill', 'discord server for community', 'discord server for active', 'discord server for new', 'discord server for big', 'discord server for small', 'discord server for international', 'discord server for english', 'discord server for hindi', 'discord server for spanish', 'discord server for french', 'discord server for german', 'discord server for russian', 'discord server for japanese', 'discord server for korean', 'discord server for chinese', 'discord server for sdwd', 'discord server for random'
    ].join(', '),
  };
}

export default function CatchAllPage({ params }: { params: { slug?: string[] } }) {
  const searchTerm = params.slug ? params.slug.join(' ') : '';
  const safeTerm = searchTerm.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  return (
    <main className="max-w-2xl mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">
        {safeTerm ? `No Discord server found for "${safeTerm}"` : 'Find Any Discord Server'}
      </h1>
      <p className="mb-6">
        {safeTerm
          ? `We couldn't find a Discord server for "${safeTerm}". But you can explore our top Discord communities below!`
          : 'Search and discover any Discord server: anime, movies, gaming, music, study, or even random and unknown servers.'}
      </p>
      <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Go to Homepage</Link>
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Popular Categories</h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {['Anime', 'Movies', 'Gaming', 'Music', 'Study', 'Memes', 'Art', 'Tech', 'Programming', 'Kpop', 'Sports', 'Books', 'Language', 'LGBTQ', 'Furry', 'Minecraft', 'Valorant', 'Genshin Impact', 'Roblox', 'Among Us', 'Fortnite'].map(cat => (
            <li key={cat}>
              <Link href={`/search/${encodeURIComponent(cat.toLowerCase())}`} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition">{cat}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Didn’t find your server?</h2>
        <p>Suggest a new one or <Link href="/" className="text-blue-600 underline">explore our homepage</Link> for more options!</p>
      </div>
      {/*
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Frequently Asked Questions</h2>
        <div className="text-left max-w-xl mx-auto">
          <h3 className="font-bold">Can I find NSFW, porn, hentai, nudes, or OnlyFans Discord servers here?</h3>
          <p>Yes! Our platform helps you discover a wide range of Discord servers, including NSFW, adult, hentai, and other 18+ communities. Even if your search is unique, you'll find top Discord communities to join.</p>
        </div>
      </div>
      */}
    </main>
  );
}
