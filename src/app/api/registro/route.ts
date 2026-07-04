import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, senha, nome } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }
    if (senha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    await prisma.user.create({ data: { email, senhaHash, nome: nome || null } });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
