import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const transferPatrimonio = async (req, res) => {
  try {
    const { patrimonioId } = req.params; 
    const { novoLocal, novoResponsavel, observacao } = req.body;

    
    const patrimonio = await prisma.patrimonio.findUnique({
      where: { numeroTombo: Number(patrimonioId) },
    });

    if (!patrimonio) {
      return res.status(404).json({ error: 'Patrimônio não encontrado' });
    }
    const movimentacao = await prisma.movimentacao.create({
      data: {
        patrimonioId: Number(patrimonio.numeroTombo),
        deLocal: patrimonio.local,
        paraLocal: novoLocal || patrimonio.local,
        deResponsavel: patrimonio.responsavel,
        paraResponsavel: novoResponsavel || patrimonio.responsavel,
        observacao: observacao || '',
      },
    });

    const patrimonioAtualizado = await prisma.patrimonio.update({
      where: { numeroTombo: Number(patrimonio.numeroTombo) },
      data: {
        local: novoLocal || patrimonio.local,
        responsavel: novoResponsavel || patrimonio.responsavel,
      },
    });

    return res.status(200).json({
      message: 'Movimentação registrada com sucesso!',
      movimentacao,
      patrimonioAtualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao movimentar patrimônio' });
  }
};

export const getMovimentacoesPorPatrimonio  = async (req, res) => {
  const { patrimonioId } = req.params;
  try {
    const movimentacoes = await prisma.movimentacao.findMany({
      where: { patrimonioId: Number(patrimonioId) },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(movimentacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}