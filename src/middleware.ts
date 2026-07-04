import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

const ROTAS_PUBLICAS = ['/login', '/registro'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publica =
    ROTAS_PUBLICAS.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname === '/api/registro';

  if (!publica && !req.auth) {
    if (pathname.startsWith('/api')) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }
    return Response.redirect(new URL('/login', req.url));
  }

  // Usuário logado não precisa ver login/registro
  if (req.auth && ROTAS_PUBLICAS.includes(pathname)) {
    return Response.redirect(new URL('/conteudos', req.url));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)'],
};
