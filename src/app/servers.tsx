'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Servers() {
  const { data: servers = [], isLoading } = useSWR('/api/servers', fetcher)

  const handleDelete = async (guildId: string) => {
    await fetch(`/api/servers/${guildId}`, { method: 'DELETE' })
    mutate('/api/servers') // Re-fetch the server list
  }

  return (
    <div className="p-8">
      <h1>Submitted Servers</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {servers.map((server: any, index: number) => (
            <li key={index} className="flex items-center gap-2">
              <a href={server.link} target="_blank" rel="noopener noreferrer">
                {server.name}
              </a>
              <button
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => handleDelete(server.guildId)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}