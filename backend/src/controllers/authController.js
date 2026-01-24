// controllers/authController.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('⚠️ JWT_SECRET não definido. Defina a variável de ambiente JWT_SECRET.');
}

export const register = async (req, res) => {
  const { nome, username, senha, role } = req.body;

  if (!nome || !username || !senha) {
    return res.status(400).json({ error: 'nome, username e senha são obrigatórios.' });
  }

  try {
    const existingUser = await prisma.usuario.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'Nome de usuário já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

    // Validação simples de role — só permite USER ou ADMIN
    const normalizedRole = (role || 'USER').toUpperCase();
    const allowedRoles = ['USER', 'ADMIN'];
    const finalRole = allowedRoles.includes(normalizedRole) ? normalizedRole : 'USER';

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        username,
        senha: hashedPassword,
        role: finalRole,
      },
      select: {
        id: true,
        nome: true,
        username: true,
        role: true,
      },
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso', usuario: novoUsuario });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao registrar o usuário.' });
  }
};

export const login = async (req, res) => {
  const { username, senha } = req.body;
  if (!username || !senha) {
    return res.status(400).json({ error: 'username e senha são obrigatórios.' });
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET ausente ao tentar fazer login.');
    return res.status(500).json({ error: 'Configuração do servidor inválida.' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { username } });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, role: usuario.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        username: usuario.username,
        role: usuario.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao tentar fazer login.' });
  }
};

export const getKPIs = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.count();
    const produtos = await prisma.produto.count();
    return res.status(200).json({ usuarios, produtos });
  } catch (err) {
    console.error('Erro ao carregar KPIs:', err);
    return res.status(500).json({ error: 'Erro ao carregar KPIs' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, username: true, role: true },
      orderBy: { id: 'asc' },
    });
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Ocorreu um erro ao buscar os usuários.' });
  }
};
