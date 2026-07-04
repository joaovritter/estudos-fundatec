import type { NextAuthConfig } from 'next-auth';

// Config edge-safe (sem Prisma) — usada também no middleware.
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
