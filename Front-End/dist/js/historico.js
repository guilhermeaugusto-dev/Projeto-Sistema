document.addEventListener('DOMContentLoaded', () => {
    if (window.api) {
        const token = window.api.getToken();
        const nomeUsuario = window.api.getUsuarioNome();

        if (!token) {
            window.location.href = "../Views/login/login-cadastro.html";
            return;
        }

        const userNameEl = document.getElementById("user-name");
        if (userNameEl && nomeUsuario) {
            userNameEl.textContent = `${nomeUsuario}`;
        }

        const role = window.api.getUsuarioRole ? window.api.getUsuarioRole() : localStorage.getItem('usuarioRole');
        const cadastrarItem = document.getElementById('menu-cadastrar');
        if (cadastrarItem) cadastrarItem.style.display = (role === 'ADMIN') ? 'block' : 'none';
    } else {
        console.warn("API do Electron (window.api) não encontrada. Funções de autenticação e usuário estão desabilitadas.");
    }

    const userIcon = document.getElementById("user-icon");
    const dropdown = document.getElementById("user-dropdown");

    if (userIcon && dropdown) {
        userIcon.addEventListener("click", () => {
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        });
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if(window.api) window.api.logout(); 
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            window.location.href = "../login/login-cadastro.html";
        });
    }

    let produtosExibidos = [];
    let produtosFiltrados = [];
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 10;
    const corpoTabela = document.getElementById('corpo-tabela');

    const inputPesquisa = document.getElementById('filtro-pesquisa');
    const btnAbrirFiltro = document.getElementById('btn-abrir-filtro');
    const modalFiltroContainer = document.getElementById('modal-filtro-container');
    const btnFecharFiltro = document.getElementById('fechar-filtro-modal');
    const formFiltro = document.getElementById('form-filtro');
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro');

    async function carregarHistorico() {
        try {
            const [resProdutos, resSaidas, resEntradas] = await Promise.all([
                fetch('http://localhost:3001/api/stock').then(r => r.json()),
                fetch("http://localhost:3001/api/stock/output").then(r => r.json()),
                fetch("http://localhost:3001/api/stock/input").then(r => r.json())
            ]);

            // Criar mapa de produtos para buscar preços
            const mapaProdutos = {};
            resProdutos.forEach(p => {
                mapaProdutos[p.id] = p;
            });

            // Entradas do cadastro inicial de produtos
            const entradasCadastro = resProdutos.map(p => ({
                id: p.id,
                nome: p.nome,
                preco: p.preco || 0,
                quantidade: p.quantidadeInicial || p.quantidade,
                categoria: p.categoria,
                dataLancamento: p.createdAt,
                tipo: 'cadastro'
            }));

            // Entradas reais (quando você adiciona quantidade)
            const entradasReais = resEntradas.map(e => {
                const produto = mapaProdutos[e.produtoId];
                return {
                    id: e.id,
                    nome: e.produto.nome,
                    preco: produto ? produto.preco || 0 : 0,
                    quantidade: e.quantidade,
                    categoria: e.produto.categoria,
                    dataLancamento: e.createdAt,
                    tipo: 'entrada'
                };
            });

            // Saídas
            const saidas = resSaidas.map(s => {
                const produto = mapaProdutos[s.produtoId];
                return {
                    id: s.id,
                    nome: s.produto.nome,
                    preco: produto ? produto.preco || 0 : 0,
                    quantidade: s.quantidade,
                    categoria: s.produto.categoria,
                    dataLancamento: s.createdAt,
                    tipo: 'saida'
                };
            });

            // Combinar todas as movimentações
            produtosExibidos = [...entradasCadastro, ...entradasReais, ...saidas]
                .sort((a, b) => new Date(b.dataLancamento) - new Date(a.dataLancamento));
            
            produtosFiltrados = [...produtosExibidos];

            aplicarFiltros({ ignorePaginaReset: true });
            
            console.log('Total de cadastros carregados:', entradasCadastro.length);
            console.log('Total de entradas carregadas:', entradasReais.length);
            console.log('Total de saídas carregadas:', saidas.length);
            console.log('Total geral:', produtosExibidos.length);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            corpoTabela.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Erro ao buscar histórico</td></tr>`;
        }
    }

    function renderizarTabelaHistorico() {
        corpoTabela.innerHTML = '';
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const produtosDaPagina = produtosFiltrados.slice(inicio, fim);

        if (produtosDaPagina.length === 0) {
            corpoTabela.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum lançamento encontrado.</td></tr>`;
            atualizarControlesPaginacao(); 
            return;
        }

        produtosDaPagina.forEach(lancamento => {
            const tr = document.createElement('tr');
            const precoFormatado = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(lancamento.preco || 0);
            const dataFormatada = new Intl.DateTimeFormat('pt-BR', { 
                dateStyle: 'short', 
                timeStyle: 'short' 
            }).format(new Date(lancamento.dataLancamento));
            let tipoTexto = '';
            let classeCSS = '';
            
            switch(lancamento.tipo) {
                case 'cadastro':
                    tipoTexto = 'Cadastro';
                    classeCSS = 'cadastro';
                    break;
                case 'entrada':
                    tipoTexto = 'Entrada';
                    classeCSS = 'entrada';
                    break;
                case 'saida':
                    tipoTexto = 'Saída';
                    classeCSS = 'saida';
                    break;
            }
            
            tr.className = classeCSS;
            tr.innerHTML = `
                <td>${lancamento.nome}</td>
                <td>${precoFormatado}</td>
                <td>${lancamento.quantidade}</td>
                <td>${lancamento.categoria || '-'}</td>
                <td>${dataFormatada}</td>
                <td>${tipoTexto}</td>
            `;
            corpoTabela.appendChild(tr);
        });

        atualizarControlesPaginacao();
    }

    function atualizarControlesPaginacao() {
        const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA));
        const btnAnterior = document.getElementById('btn-anterior');
        const btnProximo = document.getElementById('btn-proximo');
        if (btnAnterior) btnAnterior.disabled = paginaAtual === 1;
        if (btnProximo) btnProximo.disabled = paginaAtual >= totalPaginas;
    }

    const btnAnterior = document.getElementById('btn-anterior');
    if (btnAnterior) btnAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarTabelaHistorico();
        }
    });

    const btnProximo = document.getElementById('btn-proximo');
    if (btnProximo) btnProximo.addEventListener('click', () => {
        const totalPaginas = Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarTabelaHistorico();
        }
    });

    function aplicarFiltros(options = {}) {
        const termo = (inputPesquisa?.value || '').trim().toLowerCase();
        const filtroData = (document.getElementById("filtro-data")?.value || '');
        const filtroCategoria = (document.getElementById("filtro-categoria")?.value || '').toLowerCase();
        const filtroQuantidade = (document.getElementById("filtro-quantidade")?.value || '');
        const filtroTipo = (document.getElementById("filtro-tipo")?.value || '').toLowerCase();

        let resultado = produtosExibidos.filter(p => {
            let atende = true;
            if (termo) atende = atende && (p.nome || '').toLowerCase().includes(termo);
            if (filtroData) {
                const dataProduto = new Date(p.dataLancamento).toISOString().split("T")[0];
                atende = atende && dataProduto === filtroData;
            }
            if (filtroCategoria) atende = atende && (p.categoria || '').toLowerCase().includes(filtroCategoria);
            if (filtroTipo) {
                // Mapear tipos de filtro para os tipos internos
                if (filtroTipo === 'entrada') {
                    atende = atende && p.tipo === 'entrada';
                } else if (filtroTipo === 'saida') {
                    atende = atende && p.tipo === 'saida';
                } else if (filtroTipo === 'cadastro') {
                    atende = atende && p.tipo === 'cadastro';
                }
            }
            return atende;
        });

        if (filtroQuantidade === "maior") {
            resultado.sort((a, b) => b.quantidade - a.quantidade);
        } else if (filtroQuantidade === "menor") {
            resultado.sort((a, b) => a.quantidade - b.quantidade);
        }

        produtosFiltrados = resultado;
        if (!options.ignorePaginaReset) paginaAtual = 1;
        renderizarTabelaHistorico();
    }
   
    if (btnAbrirFiltro) {
        btnAbrirFiltro.addEventListener('click', () => {
            if (modalFiltroContainer) {
                modalFiltroContainer.classList.add('mostrar');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (btnFecharFiltro) {
        btnFecharFiltro.addEventListener('click', () => {
            if (modalFiltroContainer) {
                modalFiltroContainer.classList.remove('mostrar');
                document.body.style.overflow = '';
            }
        });
    }

    if (modalFiltroContainer) {
        modalFiltroContainer.addEventListener('click', (e) => {
            if (e.target === modalFiltroContainer) {
                modalFiltroContainer.classList.remove('mostrar');
                document.body.style.overflow = '';
            }
        });
    }

    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', () => aplicarFiltros());
    }

    if (formFiltro) {
        formFiltro.addEventListener('submit', (e) => {
            e.preventDefault();
            aplicarFiltros();
            if (modalFiltroContainer) {
                modalFiltroContainer.classList.remove('mostrar');
                document.body.style.overflow = '';
            }
        });
    }

    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', () => {
            if (formFiltro) formFiltro.reset();
            aplicarFiltros();
            if (modalFiltroContainer) {
                modalFiltroContainer.classList.remove('mostrar');
                document.body.style.overflow = '';
            }
        });
    }

    // Modal de exportação - elementos
    const btnExportar = document.getElementById('btn-exportar');
    const modalExportarContainer = document.getElementById('modal-exportar-container');
    const btnFecharExportar = document.getElementById('fechar-exportar-modal');
    const btnCancelarExportar = document.getElementById('cancelar-exportar');
    const formExportar = document.getElementById('form-exportar');

    // Abrir modal de exportação
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            modalExportarContainer.classList.add('mostrar');
            document.body.style.overflow = 'hidden';
        });
    }

    // Fechar modal de exportação
    function fecharModalExportar() {
        if (!modalExportarContainer) return;
        modalExportarContainer.classList.remove('mostrar');
        document.body.style.overflow = '';
        if (formExportar) formExportar.reset();
    }

    if (btnFecharExportar) {
        btnFecharExportar.addEventListener('click', fecharModalExportar);
    }

    if (btnCancelarExportar) {
        btnCancelarExportar.addEventListener('click', fecharModalExportar);
    }

    if (modalExportarContainer) {
        modalExportarContainer.addEventListener('click', (e) => {
            if (e.target === modalExportarContainer) {
                fecharModalExportar();
            }
        });
    }

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalExportarContainer?.classList.contains('mostrar')) {
            fecharModalExportar();
        }
    });

    // Submit do formulário de exportação
    if (formExportar) {
        formExportar.addEventListener('submit', async (e) => {
            e.preventDefault();
            await exportarHistorico();
        });
    }

    // Função para exportar histórico
    async function exportarHistorico() {
        try {
            const submitBtn = formExportar.querySelector('button[type="submit"]');
            const textoOriginal = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Gerando...';

            // Coletar dados do formulário
            const tipoMovimentacao = document.getElementById('tipo-movimentacao').value;
            const categoria = document.getElementById('categoria-export').value;
            const dataInicio = document.getElementById('data-inicio').value;
            const dataFim = document.getElementById('data-fim').value;
            const quantidadeMinima = document.getElementById('quantidade-minima').value;
            const quantidadeMaxima = document.getElementById('quantidade-maxima').value;

            console.log('Parâmetros de exportação:', {
                tipoMovimentacao,
                categoria,
                dataInicio,
                dataFim,
                quantidadeMinima,
                quantidadeMaxima
            });

            // Construir URL com parâmetros - garantir formato correto das datas
            const params = new URLSearchParams();
            if (tipoMovimentacao) params.append('tipoMovimentacao', tipoMovimentacao);
            if (categoria) params.append('categoria', categoria);
            if (dataInicio) {
                // Garantir formato YYYY-MM-DD
                const dataInicioFormatada = new Date(dataInicio).toISOString().split('T')[0];
                params.append('dataInicio', dataInicioFormatada);
            }
            if (dataFim) {
                // Garantir formato YYYY-MM-DD
                const dataFimFormatada = new Date(dataFim).toISOString().split('T')[0];
                params.append('dataFim', dataFimFormatada);
            }
            if (quantidadeMinima) params.append('quantidadeMinima', quantidadeMinima);
            if (quantidadeMaxima) params.append('quantidadeMaxima', quantidadeMaxima);

            console.log('Parâmetros enviados:', Object.fromEntries(params));

            const token = window.api ? window.api.getToken() : localStorage.getItem('token');
            const url = `http://localhost:3001/api/export/historico?${params.toString()}`;
            
            console.log('URL de exportação:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar relatório de histórico');
            }

            // Download do arquivo
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            
            // Nome do arquivo baseado nos filtros
            let nomeArquivo = 'historico';
            if (tipoMovimentacao) nomeArquivo += `_${tipoMovimentacao}`;
            if (categoria) nomeArquivo += `_${categoria.replace(/\s+/g, '_')}`;
            if (dataInicio) nomeArquivo += `_${dataInicio}`;
            if (dataFim) nomeArquivo += `_ate_${dataFim}`;
            nomeArquivo += `_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            a.download = nomeArquivo;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            fecharModalExportar();

            console.log('Relatório de histórico gerado com sucesso!');

        } catch (error) {
            console.error('Erro ao exportar histórico:', error);
        } finally {
            const submitBtn = formExportar.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Baixar Planilha';
        }
    }

    carregarHistorico();
});