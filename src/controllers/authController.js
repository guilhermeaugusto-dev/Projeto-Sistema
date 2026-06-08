// controllers/authController.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(' JWT_SECRET não definido. Defina a variável de ambiente JWT_SECRET.');
}

export const register = async (req, res) => {
  const { nome, email, senha, makeAdmin } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'nome, email e senha são obrigatórios.' });
  }

  try {
    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'O email já está em uso.' });
    }
    
    const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);
    const authenticatedRole = typeof req.user?.role === 'string' ? req.user.role.toUpperCase() : undefined;
    const wantsAdmin = makeAdmin === true || makeAdmin === 'true' || makeAdmin === 1 || makeAdmin === '1';
    const roleToSet = authenticatedRole === 'ADMIN' && wantsAdmin ? 'ADMIN' : undefined;

    const userData = {
      nome,
      email,
      senha: hashedPassword,
    };
    if (roleToSet) userData.role = roleToSet;

    const novoUsuario = await prisma.usuario.create({
      data: userData,
      select: {
        id: true,
        nome: true,
        email: true,
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
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'email e senha são obrigatórios.' });
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET ausente ao tentar fazer login.');
    return res.status(500).json({ error: 'Configuração do servidor inválida.' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
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
      select: { id: true, nome: true, email: true, role: true },
      orderBy: { id: 'asc' },
    });
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Ocorreu um erro ao buscar os usuários.' });
  }
};
