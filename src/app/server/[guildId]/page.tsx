import ServerPageClient from './ServerPageClient';

type Props = {
  params: { guildId: string };
};

export default function ServerPage({ params }: Props) {
  return <ServerPageClient params={params} />;
}