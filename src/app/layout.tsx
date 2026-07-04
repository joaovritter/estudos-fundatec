import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Motor de Estudos FUNDATEC',
  description: 'Estudos inteligentes para concursos públicos — flashcards, Q&A e simulados estilo FUNDATEC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
