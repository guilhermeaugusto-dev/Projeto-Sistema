import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

export const exportDatabase = async (req, res) => {
  try {
    const { categoria, dataCadastroInicio, dataCadastroFim, dataCompraInicio, dataCompraFim, quantidadeMinima, quantidadeMaxima } = req.query;
    const parseLocal = (ymd) => {
      if (!ymd) return null;
      const [y, m, d] = ymd.split('-').map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    };
    const startOfDay = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) : null);
    const endOfDay = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) : null);

    const filtros = {};
    if (categoria && categoria.trim()) {
      filtros.categoria = { contains: categoria.trim(), mode: 'insensitive' };
    }

    // Usar createdAt (com fallback para antigos parâmetros)
    const inicioStr = (dataCadastroInicio && dataCadastroInicio.trim()) || (dataCompraInicio && dataCompraInicio.trim());
    const fimStr    = (dataCadastroFim && dataCadastroFim.trim())     || (dataCompraFim && dataCompraFim.trim());

    const diLocal = parseLocal(inicioStr);
    const dfLocal = parseLocal(fimStr);

    if (diLocal || dfLocal) {
      filtros.createdAt = {};
      if (diLocal) filtros.createdAt.gte = startOfDay(diLocal);
      if (dfLocal) filtros.createdAt.lte = endOfDay(dfLocal);
    }

    if (quantidadeMinima || quantidadeMaxima) {
      filtros.quantidade = {};
      if (quantidadeMinima) filtros.quantidade.gte = parseInt(quantidadeMinima, 10);
      if (quantidadeMaxima) filtros.quantidade.lte = parseInt(quantidadeMaxima, 10);
    }

    const produtos = await prisma.produto.findMany({ where: filtros, orderBy: { createdAt: 'desc' } });

    const workbook = XLSX.utils.book_new();

    if (produtos.length > 0) {
      const produtosFormatados = produtos.map(p => {
        const dataCriacao = new Date(p.createdAt);
        return {
          'Nome': p.nome || '',
          'Descrição': p.descricao || '',
          'Categoria': p.categoria || '',
          'Quantidade': p.quantidade || 0,
          'Data de Cadastro': dataCriacao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          'Dia da Semana (Cadastro)': dataCriacao.toLocaleDateString('pt-BR', { weekday: 'long' }),
          'Hora de Cadastro': dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      });

      const wsProdutos = XLSX.utils.json_to_sheet(produtosFormatados);
      XLSX.utils.book_append_sheet(workbook, wsProdutos, 'Produtos');

      const resumo = [{
        'Total de Produtos': produtos.length,
        'Quantidade Total de Itens': produtos.reduce((total, p) => total + (p.quantidade || 0), 0),
        'Data da Exportação': new Date().toLocaleDateString('pt-BR'),
        'Hora da Exportação': new Date().toLocaleTimeString('pt-BR'),
        'Dia da Semana': new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
        'Filtros Aplicados': '',
        'Categoria': categoria || 'Todas',
        'Data Cadastro Início': inicioStr || 'Não definida',
        'Data Cadastro Fim': fimStr || 'Não definida',
        'Quantidade Mínima': quantidadeMinima || 'Não definida',
        'Quantidade Máxima': quantidadeMaxima || 'Não definida'
      }];

      const wsResumo = XLSX.utils.json_to_sheet(resumo);
      XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

    } else {
      const semDados = [{
        'Mensagem': 'Nenhum produto encontrado com os filtros aplicados',
        'Categoria': categoria || 'Todas',
        'Data Cadastro Início': inicioStr || 'Não definida',
        'Data Cadastro Fim': fimStr || 'Não definida',
        'Quantidade Mínima': quantidadeMinima || 'Não definida',
        'Quantidade Máxima': quantidadeMaxima || 'Não definida',
        'Data da Consulta': new Date().toLocaleDateString('pt-BR'),
        'Hora da Consulta': new Date().toLocaleTimeString('pt-BR'),
        'Dia da Semana': new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
      }];
      const wsSemDados = XLSX.utils.json_to_sheet(semDados);
      XLSX.utils.book_append_sheet(workbook, wsSemDados, 'Sem Dados');
    }

    // Nome do arquivo com datas de CADASTRO
    const dataAtual = new Date();
    let nomeArquivo = 'produtos';
    if (categoria) nomeArquivo += `_${categoria.replace(/\s+/g, '_')}`;
    if (quantidadeMinima) nomeArquivo += `_min${quantidadeMinima}`;
    if (quantidadeMaxima) nomeArquivo += `_max${quantidadeMaxima}`;
    if (inicioStr) nomeArquivo += `_${inicioStr}`;
    if (fimStr) nomeArquivo += `_ate_${fimStr}`;
    nomeArquivo += `_${dataAtual.toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log(`✅ Relatório de produtos gerado: ${nomeArquivo}`);
    console.log(`📊 ${produtos.length} produtos exportados`);
  } catch (error) {
    console.error('❌ Erro ao exportar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
};

export const exportHistorico = async (req, res) => {
  try {
    const {
      tipoMovimentacao,
      categoria,
      dataInicio,
      dataFim,
      quantidadeMinima,
      quantidadeMaxima
    } = req.query;

    console.log('🔍 INÍCIO - Filtros histórico recebidos:', {
      tipoMovimentacao,
      categoria,
      dataInicio,
      dataFim,
      quantidadeMinima,
      quantidadeMaxima
    });

    // Função para criar data local correta
    const criarDataLocal = (dataString, isInicio = true) => {
      if (!dataString) return null;
      const [ano, mes, dia] = dataString.split('-');
      if (isInicio) {
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 0, 0, 0, 0);
      } else {
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 23, 59, 59, 999);
      }
    };

    let movimentacoes = [];

    // FILTRO ESPECÍFICO: Se tipoMovimentacao é "cadastro", APENAS processar cadastros
    if (tipoMovimentacao === 'cadastro') {
      console.log('📝 PROCESSANDO APENAS CADASTROS');
      
      // Construir filtros para produtos
      const filtrosProdutos = {};
      
      // Aplicar filtros de data no banco
      if (dataInicio || dataFim) {
        filtrosProdutos.createdAt = {};
        if (dataInicio) {
          filtrosProdutos.createdAt.gte = criarDataLocal(dataInicio, true);
        }
        if (dataFim) {
          filtrosProdutos.createdAt.lte = criarDataLocal(dataFim, false);
        }
      }

      // Aplicar filtro de categoria no banco
      if (categoria && categoria.trim()) {
        filtrosProdutos.categoria = {
          contains: categoria.trim(),
          mode: 'insensitive'
        };
      }

      const produtos = await prisma.produto.findMany({
        where: filtrosProdutos,
        select: {
          id: true,
          nome: true,
          categoria: true,
          descricao: true,
          quantidade: true,
          quantidadeInicial: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      movimentacoes = produtos.map(p => {
        return {
          nome: p.nome,
          quantidade: p.quantidadeInicial || p.quantidade,
          categoria: p.categoria || '',
          dataMovimentacao: p.createdAt,
          tipo: 'Cadastro'
        };
      });

    } else {
    
      const filtrosData = {};
      if (dataInicio || dataFim) {
        filtrosData.createdAt = {};
        if (dataInicio) {
          filtrosData.createdAt.gte = criarDataLocal(dataInicio, true);
        }
        if (dataFim) {
          filtrosData.createdAt.lte = criarDataLocal(dataFim, false);
        }
      }

      const filtrosCategoria = {};
      if (categoria && categoria.trim()) {
        filtrosCategoria.categoria = {
          contains: categoria.trim(),
          mode: 'insensitive'
        };
      }

      const [produtos, entradas, saidas] = await Promise.all([
        // Produtos (cadastros)
        (!tipoMovimentacao || tipoMovimentacao === 'cadastro') 
          ? prisma.produto.findMany({
              where: { ...filtrosData, ...filtrosCategoria },
              select: {
                id: true,
                nome: true,
                categoria: true,
            
                descricao: true,
                quantidade: true,
                quantidadeInicial: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            }) 
          : Promise.resolve([]),
        
        // Entradas
        (!tipoMovimentacao || tipoMovimentacao === 'entrada')
          ? prisma.entradaProduto.findMany({
              where: {
                ...filtrosData,
                ...(categoria ? {
                  produto: { categoria: { contains: categoria.trim(), mode: 'insensitive' } }
                } : {})
              },
              include: { 
                produto: {
                  select: {
                    nome: true,
                    categoria: true,
              
                    descricao: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            })
          : Promise.resolve([]),
        
        // Saídas
        (!tipoMovimentacao || tipoMovimentacao === 'saida')
          ? prisma.saidaProduto.findMany({
              where: {
                ...filtrosData,
                ...(categoria ? {
                  produto: { categoria: { contains: categoria.trim(), mode: 'insensitive' } }
                } : {})
              },
              include: { 
                produto: {
                  select: {
                    nome: true,
                    categoria: true,
                
                    descricao: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            })
          : Promise.resolve([])
      ]);

      if (produtos.length > 0) {
        const cadastrosData = produtos.map(p => ({
          nome: p.nome,
     
          quantidade: p.quantidadeInicial || p.quantidade,
          categoria: p.categoria || '',
          dataMovimentacao: p.createdAt,
          tipo: 'Cadastro'
      
        }));
        movimentacoes = [...movimentacoes, ...cadastrosData];
      }

      if (entradas.length > 0) {
        const entradasData = entradas.map(e => ({
          nome: e.produto.nome,
      
          quantidade: e.quantidade,
          categoria: e.produto.categoria || '',
          dataMovimentacao: e.createdAt,
          tipo: 'Entrada'
      
        }));
        movimentacoes = [...movimentacoes, ...entradasData];
      }

      if (saidas.length > 0) {
        const saidasData = saidas.map(s => ({
          nome: s.produto.nome,
     
          quantidade: s.quantidade,
          categoria: s.produto.categoria || '',
          dataMovimentacao: s.createdAt,
          tipo: 'Saída'
        }));
        movimentacoes = [...movimentacoes, ...saidasData];
      }
    }

    if (quantidadeMinima || quantidadeMaxima) {
      movimentacoes = movimentacoes.filter(m => {
        let atende = true;
        if (quantidadeMinima) {
          atende = atende && m.quantidade >= parseInt(quantidadeMinima);
        }
        if (quantidadeMaxima) {
          atende = atende && m.quantidade <= parseInt(quantidadeMaxima);
        }
        return atende;
      });
      console.log(`📊 Após filtro de quantidade: ${movimentacoes.length}`);
    }


    movimentacoes.sort((a, b) => new Date(b.dataMovimentacao) - new Date(a.dataMovimentacao));

    const workbook = XLSX.utils.book_new();

    if (movimentacoes.length > 0) {
      const movimentacoesFormatadas = movimentacoes.map(m => {
        const dataMovimentacao = new Date(m.dataMovimentacao);
        return {
          'Nome do Produto': m.nome,
          // 'Preço (R$)' removido
          'Quantidade': m.quantidade,
          'Categoria': m.categoria || '',
          'Data da Movimentação': dataMovimentacao.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          }),
          'Hora da Movimentação': dataMovimentacao.toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }),
          'Dia da Semana': dataMovimentacao.toLocaleDateString('pt-BR', { weekday: 'long' }),
          'Tipo de Movimentação': m.tipo
          // 'Valor Total (R$)' removido
        };
      });

      const wsHistorico = XLSX.utils.json_to_sheet(movimentacoesFormatadas);
      XLSX.utils.book_append_sheet(workbook, wsHistorico, 'Histórico de Movimentações');

      // Resumo sem valores monetários
      const totalCadastros = movimentacoes.filter(m => m.tipo === 'Cadastro').length;
      const totalEntradas = movimentacoes.filter(m => m.tipo === 'Entrada').length;
      const totalSaidas = movimentacoes.filter(m => m.tipo === 'Saída').length;
      
      const resumo = [{
        'Total de Movimentações': movimentacoes.length,
        'Total de Cadastros': totalCadastros,
        'Total de Entradas': totalEntradas,
        'Total de Saídas': totalSaidas,
        // linhas de valores removidas
        'Data da Exportação': new Date().toLocaleDateString('pt-BR'),
        'Hora da Exportação': new Date().toLocaleTimeString('pt-BR'),
        'Dia da Semana': new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
        'Filtros Aplicados': '',
        'Tipo de Movimentação': tipoMovimentacao || 'Todas',
        'Categoria': categoria || 'Todas',
        'Data Início': dataInicio || 'Não definida',
        'Data Fim': dataFim || 'Não definida',
        'Quantidade Mínima': quantidadeMinima || 'Não definida',
        'Quantidade Máxima': quantidadeMaxima || 'Não definida'
      }];

      const wsResumo = XLSX.utils.json_to_sheet(resumo);
      XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');
    } else {
      const semDados = [{
        'Mensagem': 'Nenhuma movimentação encontrada com os filtros aplicados',
        'Tipo de Movimentação': tipoMovimentacao || 'Todas',
        'Categoria': categoria || 'Todas',
        'Data Início': dataInicio || 'Não definida',
        'Data Fim': dataFim || 'Não definida',
        'Quantidade Mínima': quantidadeMinima || 'Não definida',
        'Quantidade Máxima': quantidadeMaxima || 'Não definida',
        'Data da Consulta': new Date().toLocaleDateString('pt-BR'),
        'Hora da Consulta': new Date().toLocaleTimeString('pt-BR'),
        'Dia da Semana': new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
      }];
      const wsSemDados = XLSX.utils.json_to_sheet(semDados);
      XLSX.utils.book_append_sheet(workbook, wsSemDados, 'Sem Dados');
    }

    // Gerar buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    // Nome do arquivo
    const dataAtual = new Date();
    let nomeArquivo = 'historico';
    
    if (tipoMovimentacao) nomeArquivo += `_${tipoMovimentacao}`;
    if (categoria) nomeArquivo += `_${categoria.replace(/\s+/g, '_')}`;
    if (dataInicio) nomeArquivo += `_${dataInicio}`;
    if (dataFim) nomeArquivo += `_ate_${dataFim}`;
    
    nomeArquivo += `_${dataAtual.toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

    console.log(`✅ FIM - Relatório de histórico gerado: ${nomeArquivo}`);
    console.log(`📊 ${movimentacoes.length} movimentações exportadas`);

  } catch (error) {
    console.error('❌ Erro ao exportar histórico:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

export const exportPatrimonio = async (req, res) => {
  try {
    const {
      estado,
      localizacao,
      dataInicio,
      dataFim
    } = req.query;

    console.log('Filtros patrimônio recebidos:', req.query);

    // Construir filtros para patrimônio
    const filtros = {};

    // Filtro por estado
    if (estado && estado.trim()) {
      filtros.estado = estado.trim();
    }

    // Filtro por localização (usando campo 'local' do banco)
    if (localizacao && localizacao.trim()) {
      filtros.local = {
        contains: localizacao.trim(),
        mode: 'insensitive'
      };
    }

    // Filtro por data de cadastro
    if (dataInicio || dataFim) {
      filtros.createdAt = {};
      if (dataInicio) {
        filtros.createdAt.gte = new Date(dataInicio);
      }
      if (dataFim) {
        const dataFimAjustada = new Date(dataFim);
        dataFimAjustada.setHours(23, 59, 59, 999);
        filtros.createdAt.lte = dataFimAjustada;
      }
    }

    console.log('Filtros aplicados:', filtros);

    // Buscar patrimônios com os filtros aplicados
    const patrimonios = await prisma.patrimonio.findMany({
      where: filtros,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Encontrados ${patrimonios.length} patrimônios`);

    // Criar workbook
    const workbook = XLSX.utils.book_new();

    if (patrimonios.length > 0) {
      const patrimoniosFormatados = patrimonios.map(p => {
        const dataCadastro = new Date(p.createdAt);
        return {
          'Nº Tombo': String(p.numeroTombo).padStart(5, '0'),
          'Nome': p.nome || '',
          'Local': p.local || '',
          'Responsável': p.responsavel || '',
          'Estado': p.estado || '',
          'Número Nota Fiscal': p.numeroNotaFiscal || '',
          'Preço (R$)': p.preco ?? '',
          'Data de Cadastro': dataCadastro.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          'Dia da Semana (Cadastro)': dataCadastro.toLocaleDateString('pt-BR', { weekday: 'long' }),
          'Hora de Cadastro': dataCadastro.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      });

      const wsPatrimonio = XLSX.utils.json_to_sheet(patrimoniosFormatados);
      XLSX.utils.book_append_sheet(workbook, wsPatrimonio, 'Patrimônio');

      // Adicionar aba de resumo
      const patrimoniosPorEstado = {};
      const patrimoniosPorLocal = {};

      patrimonios.forEach(p => {
        // Agrupar por estado
        const est = p.estado || 'Não informado';
        patrimoniosPorEstado[est] = (patrimoniosPorEstado[est] || 0) + 1;

        // Agrupar por local
        const loc = p.local || 'Não informado';
        patrimoniosPorLocal[loc] = (patrimoniosPorLocal[loc] || 0) + 1;
      });

      const resumo = [{
        'Total de Patrimônios': patrimonios.length,
        'Data da Exportação': new Date().toLocaleDateString('pt-BR'),
        'Hora da Exportação': new Date().toLocaleTimeString('pt-BR'),
        'Dia da Semana': new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
        'Filtros Aplicados': '',
        'Estado': estado || 'Todos',
        'Localização': localizacao || 'Todas',
        'Data Início': dataInicio || 'Não definida',
        'Data Fim': dataFim || 'Não definida',
        '': '',
        'ESTADOS:': '',
        ...Object.entries(patrimoniosPorEstado).reduce((acc, [est, count]) => {
          acc[`${est}`] = count;
          return acc;
        }, {}),
        ' ': '',
        'LOCAIS:': '',
        ...Object.entries(patrimoniosPorLocal).reduce((acc, [loc, count]) => {
          acc[`${loc}`] = count;
          return acc;
        }, {})
      }];

      const wsResumo = XLSX.utils.json_to_sheet(resumo);
      XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

    } else {
      // Se não houver patrimônios, criar aba informativa
      const semDados = [{
        'Mensagem': 'Nenhum patrimônio encontrado com os filtros aplicados',
        'Estado': estado || 'Todos',
        'Localização': localizacao || 'Todas',
        'Data Início': dataInicio || 'Não definida',
        'Data Fim': dataFim || 'Não definida',
        'Data da Consulta': new Date().toLocaleDateString('pt-BR'),
        'Hora da Consulta': new Date().toLocaleTimeString('pt-BR'),
        'Dia da Semana': new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
      }];
      const wsSemDados = XLSX.utils.json_to_sheet(semDados);
      XLSX.utils.book_append_sheet(workbook, wsSemDados, 'Sem Dados');
    }

    // Gerar buffer do arquivo Excel
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    // Nome do arquivo baseado nos filtros
    const dataAtual = new Date();
    let nomeArquivo = 'patrimonio';
    
    if (estado) nomeArquivo += `_${estado.replace(/\s+/g, '_')}`;
    if (localizacao) nomeArquivo += `_${localizacao.replace(/\s+/g, '_')}`;
    if (dataInicio) nomeArquivo += `_${dataInicio}`;
    if (dataFim) nomeArquivo += `_ate_${dataFim}`;

    nomeArquivo += `_${dataAtual.toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

    console.log(`✅ Relatório de patrimônio gerado: ${nomeArquivo}`);
    console.log(`📊 ${patrimonios.length} patrimônios exportados`);

  } catch (error) {
    console.error('❌ Erro ao exportar patrimônio:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};