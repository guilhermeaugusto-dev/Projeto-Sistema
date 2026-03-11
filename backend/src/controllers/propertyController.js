import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const createPatrimonio = async (req, res) => {
  const { numeroTombo, nome, local, responsavel, estado, numeroNotaFiscal, preco } = req.body;
  const imagem = req.file?.buffer || null; 

  try {
    const numeroTomboInt = parseInt(numeroTombo, 10);
    if (!numeroTombo || isNaN(numeroTomboInt)) {
      return res.status(400).json({ error: "numeroTombo é obrigatório e deve ser numérico." });
    }

  
    const existe = await prisma.patrimonio.findUnique({
      where: { numeroTombo: numeroTomboInt },
    });
    if (existe) {
      return res.status(400).json({ error: "Já existe um patrimônio com esse número de tombo." });
    }

    // parse/validação do preço (opcional)
    let precoNumber = null;
    if (preco !== undefined && preco !== null && String(preco).trim() !== '') {
      const precoStr = String(preco).replace(',', '.');
      const parsed = parseFloat(precoStr);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: "Preço inválido." });
      }
      precoNumber = parsed;
    }

    const novoPatrimonio = await prisma.patrimonio.create({
      data: {
        numeroTombo: numeroTomboInt,
        nome,
        local,
        responsavel,
        estado,
        numeroNotaFiscal: numeroNotaFiscal || null,
        ...(imagem ? { imagem } : {}),
        ...(precoNumber !== null ? { preco: precoNumber } : {})
      },
    });

    return res.status(201).json(novoPatrimonio);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePatrimonio = async (req, res) => {
  const { id } = req.params;
  try {
  
    if (!id) {
      return res.status(400).json({ error: "ID não fornecido." });
    }

    const idNumerico = parseInt(id, 10);
    
    if (isNaN(idNumerico)) {
      return res.status(400).json({ error: "ID inválido fornecido." });
    }

    const patrimonioAtual = await prisma.patrimonio.findUnique({
      where: { 
        numeroTombo: idNumerico 
      },
    });

    if (!patrimonioAtual) {
      return res.status(404).json({ error: "Patrimônio não encontrado." });
    }

    const { numeroTombo, nome, local, responsavel, estado, numeroNotaFiscal, preco, imagem: imagemBase64 } = req.body;
    const imagemFile = req.file?.buffer || null;

    console.log('updatePatrimonio chamado:', {
      id: idNumerico,
      temFile: !!req.file,
      fileMimetype: req.file?.mimetype,
      fileSize: req.file?.size,
      bodyKeys: Object.keys(req.body || {}),
    });

    const updates = {};

    // Verificar se numeroTombo foi enviado e é diferente
    if (numeroTombo !== undefined && numeroTombo !== null && numeroTombo !== '') {
      const novoNumero = parseInt(numeroTombo, 10);
      
      if (!isNaN(novoNumero) && novoNumero !== patrimonioAtual.numeroTombo) {
        // Verificar duplicação
        const existe = await prisma.patrimonio.findUnique({
          where: { numeroTombo: novoNumero },
        });
        
        if (existe) {
          return res.status(400).json({ error: "Já existe um patrimônio com esse número de tombo." });
        }
        
        updates.numeroTombo = novoNumero;
      }
    }

    // Outros campos
    if (nome !== undefined && nome !== patrimonioAtual.nome) {
      updates.nome = nome;
    }
    
    if (local !== undefined && local !== patrimonioAtual.local) {
      updates.local = local;
    }
    
    if (responsavel !== undefined && responsavel !== patrimonioAtual.responsavel) {
      updates.responsavel = responsavel;
    }
    
    if (estado !== undefined && estado !== patrimonioAtual.estado) {
      updates.estado = estado;
    }
    
    if (numeroNotaFiscal !== undefined && numeroNotaFiscal !== patrimonioAtual.numeroNotaFiscal) {
      updates.numeroNotaFiscal = numeroNotaFiscal;
    }

    // Atualização da imagem
    if (imagemFile) {
      // Nova imagem enviada via multipart (multer)
      updates.imagem = imagemFile;
    } else if (imagemBase64) {
      // Opcional: suporte a base64 no corpo da requisição
      try {
        updates.imagem = Buffer.from(imagemBase64, 'base64');
      } catch (e) {
        return res.status(400).json({ error: 'Imagem inválida.' });
      }
    }

    // preço (se enviado e diferente)
    if (preco !== undefined) {
      const precoStr = String(preco).trim().replace(',', '.');
      if (precoStr === '') {
        if (patrimonioAtual.preco !== null) updates.preco = null;
      } else {
        const parsed = parseFloat(precoStr);
        if (isNaN(parsed) || parsed < 0) {
          return res.status(400).json({ error: "Preço inválido." });
        }
        if (patrimonioAtual.preco !== parsed) updates.preco = parsed;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json(patrimonioAtual);
    }

    const patrimonioAtualizado = await prisma.patrimonio.update({
      where: { numeroTombo: idNumerico },
      data: updates,
    });

    res.status(200).json(patrimonioAtualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FUNÇÃO ESPECÍFICA PARA ATUALIZAR APENAS A NOTA FISCAL
export const updateNotaFiscal = async (req, res) => {
  const { id } = req.params;
  const { numeroNotaFiscal } = req.body;

  try {
    // Validar se o ID é um número válido
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "ID inválido fornecido." });
    }

    // Buscar o patrimônio atual primeiro
    const patrimonioAtual = await prisma.patrimonio.findUnique({
      where: { numeroTombo: Number(id) },
    });

    if (!patrimonioAtual) {
      return res.status(404).json({ error: "Patrimônio não encontrado." });
    }

    // Atualizar apenas a nota fiscal
    const patrimonioAtualizado = await prisma.patrimonio.update({
      where: { numeroTombo: Number(id) },
      data: {
        numeroNotaFiscal: numeroNotaFiscal || null,
      },
    });

    res.status(200).json(patrimonioAtualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FUNÇÃO PARA LISTAR O PATRIMONIO
export const getAllProperty = async (req, res) => {
  try {
    const patrimonios = await prisma.$queryRaw`
      SELECT
        "numeroTombo",
        "nome",
        "local",
        "responsavel",
        "estado",
        "preco",
        "numeroNotaFiscal",
        ("imagem" IS NOT NULL) AS "temImagem"
      FROM "Patrimonio"
      ORDER BY "numeroTombo" ASC
    `;

    res.status(200).json(patrimonios);

  } catch (error) {
    console.error('Erro em getAllProperty:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getImageProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const patrimonio = await prisma.patrimonio.findUnique({
      where: { numeroTombo: Number(id) },
      select: { imagem: true }
    });

    if (!patrimonio || !patrimonio.imagem) {
      return res.status(404).json({ error: "Imagem não encontrada" });
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.send(patrimonio.imagem);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const deletePatrimonio = async (req, res) => {
  const { id } = req.params; // numeroTombo
  const numero = parseInt(id, 10);
  if (isNaN(numero)) return res.status(400).json({ error: "ID inválido." });

  try {
    await prisma.patrimonio.delete({ where: { numeroTombo: numero } });
    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Patrimônio não encontrado." });
    }
    return res.status(500).json({ error: error.message });
  }
};
