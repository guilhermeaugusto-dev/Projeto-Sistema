import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';

const prisma = new PrismaClient();
const rl = readline.createInterface({ input, output });

async function main() {
  console.log('--- Criação do Usuário Administrador ---');

  const nome = await rl.question('Nome completo do admin: ');
  const username = await rl.question('Nome de usuário (para login): ');
  const senha = await rl.question('Senha: ');

  if (!nome || !username || !senha) {
    console.error('Todos os campos são obrigatórios.');
    return;
  }

  const hashedPassword = await bcrypt.hash(senha, 10);

  try {
    const admin = await prisma.usuario.create({
      data: {
        nome,
        username,
        senha: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('🎉 Usuário administrador criado com sucesso!');
    console.log(admin);
  } catch (e) {
    if (e.code === 'P2002') {
        console.error('Erro: O nome de usuário já existe. Tente outro.');
    } else {
        console.error('Ocorreu um erro ao criar o administrador:', e);
    }
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();