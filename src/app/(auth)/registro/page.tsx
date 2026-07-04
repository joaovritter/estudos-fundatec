'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RegistroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error || 'Erro ao criar conta.');
        return;
      }
      // login automático após registro
      await signIn('credentials', { email, senha, redirect: false });
      router.push('/conteudos');
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="cartao w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="mb-1 text-center text-2xl font-bold text-salvia-700">Criar conta</h1>
        <p className="mb-6 text-center text-sm text-terra-500">Comece a estudar em segundos</p>

        <form onSubmit={registrar} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Nome</label>
            <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Email</label>
            <input
              type="email"
              className="campo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Senha (mín. 6 caracteres)</label>
            <input
              type="password"
              className="campo"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {erro && <p className="text-sm text-erro">{erro}</p>}
          <button type="submit" className="btn-primario w-full" disabled={carregando}>
            {carregando ? 'Criando…' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-terra-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-salvia-600 hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
