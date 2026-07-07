import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

// Tipografia com identidade: Fraunces (display acadêmico, tom de livro de
// direito) + Manrope (corpo, leitura longa confortável).
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Studie',
  description: 'Estudos inteligentes para concursos públicos — flashcards, Q&A, resumos e simulados estilo FUNDATEC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
