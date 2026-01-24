// Arquivo com os endpoints chamados no arquivo de rotas de ESTOQUE

// src/controllers/stockController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

//FUNÇÃO DE ROTA PARA LISTAR TODOS OS PRODUTOS
export const getAllProducts = async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FUNÇÃO DE ROTA PARA LANÇAR ENTRADA PRODUTO (criar)
export const createProduct = async (req, res) => {
  try {
    const nome = String(req.body.nome || '').replace(/\s+/g, ' ').trim();
    const descricao = String(req.body.descricao || '').trim();
    const quantidade = Number.parseInt(req.body.quantidade, 10);
    const categoria = String(req.body.categoria || 'Geral').trim();
    const dataCompra = req.body.dataCompra ? new Date(req.body.dataCompra) : new Date();

    if (!nome) return res.status(400).json({ error: 'O nome do produto é obrigatório.' });
    if (!Number.isInteger(quantidade) || quantidade < 0)
      return res.status(400).json({ error: 'Quantidade inválida.' });

    // Verifica duplicidade por nome (case-insensitive)
    const existe = await prisma.produto.findFirst({
      where: { nome: { equals: nome, mode: 'insensitive' } }
    });
    if (existe) return res.status(400).json({ error: 'Produto já cadastrado.' });

    const data = {
      nome,
      descricao,
      quantidade,
      quantidadeInicial: quantidade,
      categoria,
      dataCompra
    };

    const novo = await prisma.produto.create({ data });
    await prisma.entradaProduto.create({ data: { quantidade, produtoId: novo.id } });
    return res.status(201).json(novo);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ENTRADA/ADICIONAR (reativa ou soma)
export const addProductQuantity = async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const quantidade = Number.parseInt(req.body.quantidade, 10);
    const categoria = String(req.body.categoria || '').trim();
    const descricao = String(req.body.descricao || '').trim();
    const dataCompra = req.body.dataCompra ? new Date(req.body.dataCompra) : new Date();

    if (!nome) return res.status(400).json({ error: 'O nome do produto é obrigatório.' });
    if (!Number.isInteger(quantidade) || quantidade <= 0)
      return res.status(400).json({ error: 'A quantidade deve ser maior que zero.' });

    const encontrados = await prisma.produto.findMany({
      where: { nome: { equals: nome, mode: 'insensitive' } }
    });

    if (encontrados.length === 0) {
      const criado = await prisma.produto.create({
        data: {
          nome,
          descricao,
          quantidade,
          quantidadeInicial: quantidade,
          categoria: categoria || 'Geral',
          dataCompra
        }
      });
      await prisma.entradaProduto.create({ data: { quantidade, produtoId: criado.id } });
      return res.status(201).json({ message: 'Produto criado.', produto: criado, isNovoProduto: true });
    }

    const principal = encontrados.find(p => (p.quantidade ?? 0) > 0) ?? encontrados[0];
    const duplicados = encontrados.filter(p => p.id !== principal.id);
    const estoqueDuplicados = duplicados.reduce((acc, p) => acc + (p.quantidade ?? 0), 0);
    const novoEstoque = (principal.quantidade ?? 0) + quantidade + estoqueDuplicados;

    await prisma.$transaction(async tx => {
      await tx.produto.update({
        where: { id: principal.id },
        data: {
          quantidade: novoEstoque,
          ...(descricao ? { descricao } : {}),
          ...(categoria ? { categoria } : {}),
          ...(req.body.dataCompra ? { dataCompra } : {})
        }
      });

      for (const dup of duplicados) {
        await tx.entradaProduto.updateMany({ where: { produtoId: dup.id }, data: { produtoId: principal.id } });
        await tx.saidaProduto.updateMany({ where: { produtoId: dup.id }, data: { produtoId: principal.id } });
      }
      if (duplicados.length) await tx.produto.deleteMany({ where: { id: { in: duplicados.map(d => d.id) } } });

      await tx.entradaProduto.create({ data: { quantidade, produtoId: principal.id } });
    });

    const atualizado = await prisma.produto.findUnique({ where: { id: principal.id } });
    return res.status(200).json({ message: 'Estoque atualizado.', produto: atualizado });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllInputs = async (_req, res) => {
  try {
    const entradas = await prisma.entradaProduto.findMany({
      include: { produto: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(entradas);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllOutputs = async (_req, res) => {
  try {
    const saidas = await prisma.saidaProduto.findMany({
      include: { produto: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(saidas);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const outputProduct = async (req, res) => {
  try {
    const qtdStr = String(req.body.quantidade ?? '').trim();
    const qtd = Number.parseInt(qtdStr.replace(/[^\d]/g, ''), 10);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      return res.status(400).json({ error: 'A quantidade deve ser maior que zero' });
    }

    const idParam = (req.params.id ?? '').trim();
    let produto = idParam && idParam !== '0' && idParam !== 'null' && idParam !== 'undefined'
      ? await prisma.produto.findUnique({ where: { id: idParam } })
      : null;

    if (!produto && req.body.nome) {
      const nomeTrim = String(req.body.nome).trim();
      produto = await prisma.produto.findFirst({
        where: { nome: { equals: nomeTrim, mode: 'insensitive' } }
      });
    }

    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    if (qtd > (produto.quantidade ?? 0)) {
      return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
    }

    const [produtoAtualizado, saida] = await prisma.$transaction([
      prisma.produto.update({
        where: { id: produto.id },
        data: { quantidade: (produto.quantidade ?? 0) - qtd }
      }),
      prisma.saidaProduto.create({
        data: { quantidade: qtd, produtoId: produto.id }
      })
    ]);

    return res.status(200).json({
      message: `Saída de ${qtd} un. do produto "${produto.nome}" registrada`,
      produtoAtualizado,
      saida
    });
  } catch (error) {
    console.error('Erro outputProduct:', error);
    return res.status(500).json({ error: error.message || 'Erro ao registrar saída' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'ID inválido.' });

    const atual = await prisma.produto.findUnique({ where: { id } });
    if (!atual) return res.status(404).json({ error: 'Produto não encontrado.' });

    const data = {};

    if (req.body.nome !== undefined) {
      const nome = String(req.body.nome || '').replace(/\s+/g, ' ').trim();
      if (!nome) return res.status(400).json({ error: 'O nome do produto é obrigatório.' });

      const duplicado = await prisma.produto.findFirst({
        where: { nome: { equals: nome, mode: 'insensitive' }, NOT: { id } },
        select: { id: true }
      });
      if (duplicado) return res.status(400).json({ error: 'Já existe um produto com esse nome.' });
      data.nome = nome;
    }

    if (req.body.descricao !== undefined)
      data.descricao = String(req.body.descricao || '').trim();

    if (req.body.categoria !== undefined)
      data.categoria = String(req.body.categoria || '').trim() || null;

    if (req.body.dataCompra !== undefined) {
      const d = new Date(req.body.dataCompra);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ error: 'Data de compra inválida.' });
      data.dataCompra = d;
    }

    let novaQuantidade = null;
    if (req.body.quantidade !== undefined) {
      const q = Number.parseInt(req.body.quantidade, 10);
      if (!Number.isInteger(q) || q < 0) return res.status(400).json({ error: 'Quantidade inválida.' });
      novaQuantidade = q;
      data.quantidade = q;
    }

    const atualizado = await prisma.$transaction(async (tx) => {
      if (novaQuantidade !== null && novaQuantidade !== (atual.quantidade ?? 0)) {
        const delta = novaQuantidade - (atual.quantidade ?? 0);
        if (delta > 0) {
          await tx.entradaProduto.create({ data: { quantidade: delta, produtoId: id } });
        } else if (delta < 0) {
          await tx.saidaProduto.create({ data: { quantidade: Math.abs(delta), produtoId: id } });
        }
      }
      return tx.produto.update({ where: { id }, data });
    });

    return res.status(200).json(atualizado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const id = String(req.params.id || '').trim();
  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    await prisma.produto.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
