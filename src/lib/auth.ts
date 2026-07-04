import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const senha = credentials?.senha as string | undefined;
        if (!email || !senha) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(senha, user.senhaHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.nome };
      },
    }),
  ],
});

/** Retorna o userId da sessão ou null. Uso nas API routes. */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
