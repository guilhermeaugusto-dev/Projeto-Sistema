import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();


//FUNÇÃO DE ROTA PARA REGISTRAR UM USUÁRIO
export const register = async (req, res) => {
  const { nome, username, senha } = req.body;

  try {
    const existingUser = await prisma.usuario.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Usuário já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        username,
        senha: hashedPassword,
      },
    });

    return res.status(201).json({ message: "Usuário criado com sucesso", usuario: { id: novoUsuario.id, nome: novoUsuario.nome, username: novoUsuario.username } });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
