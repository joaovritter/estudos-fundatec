'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogoMarca } from '@/components/ui/Icones';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const res = await signIn('credentials', { email, senha, redirect: false });
    setCarregando(false);
    if (res?.error) {
      setErro('Email ou senha incorretos.');
    } else {
      router.push('/conteudos');
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="cartao w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LogoMarca className="mx-auto mb-3 h-10 w-10 text-ambar-600" />
        <h1 className="mb-1 text-center font-display text-4xl font-bold text-terra-900">
          <span className="grifo">Studie</span>
        </h1>
        <p className="mb-6 text-center text-sm text-terra-500">Estudos inteligentes estilo FUNDATEC</p>

        <form onSubmit={entrar} className="space-y-4">
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
            <label className="mb-1 block text-sm font-medium text-terra-700">Senha</label>
            <input
              type="password"
              className="campo"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {erro && <p className="text-sm text-erro">{erro}</p>}
          <button type="submit" className="btn-primario w-full" disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-terra-500">
          Não tem conta?{' '}
          <Link href="/registro" className="font-medium text-salvia-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
