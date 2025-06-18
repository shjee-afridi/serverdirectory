// filepath: c:\Users\shjee\Desktop\test\hd\src\app\login.tsx
'use client'

import { signIn } from 'next-auth/react'

export default function Login() {
  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={() => signIn('discord')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Login with Discord
      </button>
    </div>
  )
}