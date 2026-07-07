'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogoMarca, IconeLivro, IconeResumo, IconeProva, IconeHistorico, IconeSair } from '@/components/ui/Icones';

const LINKS = [
  { href: '/conteudos', rotulo: 'Conteúdos', Icone: IconeLivro },
  { href: '/resumos', rotulo: 'Resumos', Icone: IconeResumo },
  { href: '/simulados', rotulo: 'Simulados', Icone: IconeProva },
  { href: '/simulados/historico', rotulo: 'Histórico', Icone: IconeHistorico },
];

export default function Nav({ nomeUsuario }: { nomeUsuario: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-terra-500/15 bg-creme-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5">
        <Link
          href="/conteudos"
          className="flex min-h-[44px] items-center gap-2 font-display text-lg font-bold text-salvia-700"
        >
          <LogoMarca className="h-6 w-6 text-ambar-600" />
          Studie
        </Link>

        <nav className="flex gap-1" aria-label="Navegação principal">
          {LINKS.map(({ href, rotulo, Icone }) => {
            const ativo =
              href === '/simulados'
                ? pathname === '/simulados' ||
                  (pathname.startsWith('/simulados/') && !pathname.startsWith('/simulados/historico'))
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={`relative flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${
                  ativo ? 'text-salvia-800' : 'text-terra-500 hover:bg-creme-200 hover:text-terra-800'
                }`}
              >
                <Icone className="h-[18px] w-[18px]" />
                <span className="hidden sm:inline">{rotulo}</span>
                {ativo && (
                  <span className="absolute inset-x-2 -bottom-[11px] h-[3px] rounded-full bg-ambar-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-terra-500 md:inline">Olá, {nomeUsuario}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn-icone"
            aria-label="Sair da conta"
            title="Sair"
          >
            <IconeSair className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
