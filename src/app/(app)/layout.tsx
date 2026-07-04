import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Nav from '@/components/Nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen">
      <Nav nomeUsuario={session.user.name || session.user.email || 'estudante'} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
