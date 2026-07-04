'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const LINKS = [
  { href: '/conteudos', rotulo: 'Conteúdos' },
  { href: '/simulados', rotulo: 'Simulados' },
  { href: '/simulados/historico', rotulo: 'Histórico' },
];

export default function Nav({ nomeUsuario }: { nomeUsuario: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-terra-500/15 bg-creme-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/conteudos" className="text-lg font-bold text-salvia-700">
          📚 Motor de Estudos
        </Link>
        <nav className="flex gap-1">
          {LINKS.map((l) => {
            const ativo =
              l.href === '/simulados'
                ? pathname === '/simulados' || (pathname.startsWith('/simulados/') && !pathname.startsWith('/simulados/historico'))
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  ativo ? 'bg-salvia-600 text-creme-50' : 'text-terra-700 hover:bg-creme-200'
                }`}
              >
                {l.rotulo}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="hidden text-terra-700 sm:inline">Olá, {nomeUsuario}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg px-3 py-1.5 text-terra-500 transition-colors hover:bg-creme-200 hover:text-terra-800"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
