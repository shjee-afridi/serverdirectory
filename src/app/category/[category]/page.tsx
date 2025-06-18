'use client'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import useSWR from 'swr';

import ServerListItem from '@/components/ServerListItem';
import Spinner from '@/components/Spinner';


const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CategoryPage({ params }: { params: { category: string } }) {
  const { data: servers = [], isLoading } = useSWR(
    params.category ? `/api/servers?category=${encodeURIComponent(params.category)}` : null,
    fetcher
  );

  // useEffect(() => {
  //   if (!search) {
  //     setServers([]);
  //     return;
  //   }
  //   fetchServers(search, selectedLanguage);
  // }, [search, selectedLanguage, fetchServers]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Servers in {params.category}</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        <List
          height={600}
          itemCount={servers.length}
          itemSize={60}
          width={'100%'}
        >
          {({ index, style }: ListChildComponentProps) => (
            <div style={style}>
              <ServerListItem server={servers[index]} />
            </div>
          )}
        </List>
      )}
    </div>
  );
}