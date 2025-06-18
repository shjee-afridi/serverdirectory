import NextAuth, { DefaultSession } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord'
import type { JWT } from "next-auth/jwt";
import type { Session, User, Account } from "next-auth";

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds guilds.join gdm.join",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }: { token: JWT; account?: Account | null; user?: User | null }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = session.user ?? {};
      (session.user as { id: string }).id = token.id as string;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  events: {
    async signIn(message: { user: User; account: Account | null; profile?: any; isNewUser?: boolean }) {
      const { user, account } = message;
      // Only store Discord users
      if (account?.provider === 'discord') {
        try {
          const clientPromise = (await import('@/lib/mongodb')).default;
          const client = await clientPromise;
          const db = client.db('discord');
          const users = db.collection('users');
          // Upsert user info
          await users.updateOne(
            { id: user.id },
            {
              $set: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                provider: 'discord',
                updatedAt: new Date(),
              },
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true }
          );
        } catch (e) {
          // Optionally log error
        }
      }
    },
  },
};

export default NextAuth(authOptions);