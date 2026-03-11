document.addEventListener('DOMContentLoaded', async () => {
  if (window.iziToast) {
    window.alert = (msg) => iziToast.info({
      title: 'Aviso',
      message: String(msg ?? ''),
      position: 'topRight'
    });
  }

    const token = window.api.getToken();
    const nomeUsuario = window.api.getUsuarioNome();

    if (!token) {
        console.log("Token não encontrado, redirecionando para o login...");
        window.location.href = "../Views/login/login-cadastro.html";
        return;
    }

    console.log(`Usuário logado: ${nomeUsuario}`);

    const userNameEl = document.getElementById("user-name");
    if (userNameEl && nomeUsuario) {
        userNameEl.textContent = `${nomeUsuario}`;
    }
    const role = window.api.getUsuarioRole ? window.api.getUsuarioRole() : localStorage.getItem('usuarioRole');
    const cadastrarItem = document.getElementById('menu-cadastrar');
    if (cadastrarItem) cadastrarItem.style.display = (role === 'ADMIN') ? 'block' : 'none';

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
            window.api.logout(); 
            localStorage.removeItem("token"); 
            localStorage.removeItem("usuario")
            window.location.href = "../login/login-cadastro.html";
        });
    }


    initEstoque(token);
});

function initEstoque(token) {

    let todosOsProdutos = [];
    let produtosExibidos = [];
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 10;
    let produtoSelecionado = null;

    const corpoTabela = document.getElementById('corpo-tabela');
    const filtroInput = document.getElementById('filtro-pesquisa');
    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    const modalContainer = document.getElementById('modal-container');
    const btnFecharModal = document.getElementById('fechar-modal');
    const formCadastro = document.getElementById('form-cadastro-produto');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const btnAbrirFiltro = document.getElementById('btn-abrir-filtro');
    const modalFiltroContainer = document.getElementById('modal-filtro-container');
    const btnFecharFiltroModal = document.getElementById('fechar-filtro-modal');
    const formFiltro = document.getElementById('form-filtro');
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro');
    const modalDescricaoContainer = document.getElementById('modal-descricao-container');
    const btnFecharDescricao = document.getElementById('fechar-modal-descricao');
    const conteudoDescricao = document.getElementById('conteudo-descricao');
    const modalSaidaContainer = document.getElementById('modal-saida-container');
    const btnFecharSaida = document.getElementById('fechar-modal-saida');
    const formSaida = document.getElementById('form-saida-produto');
    const saidaNomeProduto = document.getElementById('saida-nome-produto');
    const saidaQuantidadeDisponivel = document.getElementById('saida-quantidade-disponivel');
    const quantidadeSaidaInput = document.getElementById('quantidade-saida');
    const modalEntradaContainer = document.getElementById('modal-entrada-container');
    const btnFecharEntrada = document.getElementById('fechar-modal-entrada');
    const formEntrada = document.getElementById('form-entrada-produto');
    const entradaNomeProduto = document.getElementById('entrada-nome-produto');
    const entradaQuantidadeAtual = document.getElementById('entrada-quantidade-atual');
    const quantidadeEntradaInput = document.getElementById('quantidade-entrada');

    const btnExportar = document.getElementById('btn-exportar');
    const modalExportarContainer = document.getElementById('modal-exportar-container');
    const btnFecharExportar = document.getElementById('fechar-exportar-modal');
    const btnCancelarExportar = document.getElementById('cancelar-exportar');
    const formExportar = document.getElementById('form-exportar');

    if (!corpoTabela || !filtroInput || !btnAbrirModal || !modalContainer || !btnFecharModal || !formCadastro ||
        !btnAnterior || !btnProximo || !btnAbrirFiltro || !modalFiltroContainer || !btnFecharFiltroModal ||
        !formFiltro || !btnLimparFiltro || !modalDescricaoContainer || !btnFecharDescricao || !conteudoDescricao ||
        !modalSaidaContainer || !btnFecharSaida || !formSaida || !saidaNomeProduto || !saidaQuantidadeDisponivel || !quantidadeSaidaInput ||
        !modalEntradaContainer || !btnFecharEntrada || !formEntrada || !entradaNomeProduto || !entradaQuantidadeAtual || !quantidadeEntradaInput) {
        console.error("Erro crítico: Um ou mais elementos essenciais não foram encontrados no HTML.");
        return;
    }

    if (btnExportar && modalExportarContainer) {
        btnExportar.addEventListener('click', () => {
            modalExportarContainer.classList.add('mostrar');
            document.body.style.overflow = 'hidden';
        });
    }

    function fecharModalExportar() {
        if (!modalExportarContainer) return;
        modalExportarContainer.classList.remove('mostrar');
        document.body.style.overflow = '';
        if (formExportar) formExportar.reset();
    }

    if (btnFecharExportar) btnFecharExportar.addEventListener('click', fecharModalExportar);
    if (btnCancelarExportar) btnCancelarExportar.addEventListener('click', fecharModalExportar);
    if (modalExportarContainer) {
        modalExportarContainer.addEventListener('click', (e) => {
            if (e.target === modalExportarContainer) fecharModalExportar();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalExportarContainer?.classList.contains('mostrar')) {
            fecharModalExportar();
        }
    });


    if (formExportar) {
        formExportar.addEventListener('submit', async (e) => {
            e.preventDefault();
            await exportarDadosPersonalizados();
        });
    }

    function toLocalYMD(dt) {
      const d = new Date(dt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    // NOVO: helpers para início/fim do dia em horário local
    function startOfDayLocal(ymd) {
      if (!ymd) return null;
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    }
    function endOfDayLocal(ymd) {
      if (!ymd) return null;
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
    }

    function renderizarTabela() {
        corpoTabela.innerHTML = '';
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;

        // Se quiser ver também os com quantidade 0, remova o filter abaixo
        const produtosValidos = produtosExibidos.filter(p => p.quantidade > 0);
        const produtosDaPagina = produtosValidos.slice(inicio, fim);

        if (produtosDaPagina.length === 0 && paginaAtual === 1) {
            corpoTabela.innerHTML = `<tr><td colspan="8" style="text-align:center;">Nenhum produto encontrado.</td></tr>`;
        } else {
            produtosDaPagina.forEach(produto => {
                const novaLinha = document.createElement('tr');
                const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco);

                // Mostra Data de CADASTRO
                const dataCadastroFormatada = produto.createdAt
                  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(produto.createdAt))
                  : '';
                novaLinha.innerHTML = `
                    <td class="coluna-nome">${produto.nome}</td>
                    <td class="coluna-preco">${precoFormatado}</td>
                    <td class="coluna-quantidade">${produto.quantidade}</td>
                    <td class="coluna-categoria">${produto.categoria}</td>
                    <td>${dataCadastroFormatada}</td>
                    <td class="actions-cell">
                      <button class="action-btn descricao-btn" data-id="${produto.id}"><img src="../../imagens/icone-detalhes.png" alt="Detalhes"></button>
                      <button class="action-btn entrada-btn" data-id="${produto.id}"><img src="../../imagens/icone-soma.png" alt="Entrada"></button>
                      <button class="action-btn saida-btn" data-id="${produto.id}"><img src="../../imagens/icone-saida.png" alt="Saída"></button>
                    </td>
                `;
                corpoTabela.appendChild(novaLinha);
            });
        }
        atualizarControlesPaginacao();
    }

    async function carregarProdutos() {
      try {
        const response = await fetch("http://26.117.112.62:3001/api/stock", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Erro ao buscar os produtos");
            let produtos = await response.json();
            produtos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            todosOsProdutos = produtos;
            aplicarFiltros();
        } catch (error) {
            console.error('Erro ao buscar os produtos', error);
            corpoTabela.innerHTML = `<tr><td colspan="8" style="text-align:center; color: red;">${error.message}</td></tr>`;
        }
    }

    function atualizarControlesPaginacao() {
        const totalPaginas = Math.ceil(produtosExibidos.length / ITENS_POR_PAGINA);
        btnAnterior.disabled = paginaAtual === 1;
        btnProximo.disabled = paginaAtual >= totalPaginas;
    }

    function aplicarFiltros() {
        let produtosFiltrados = [...todosOsProdutos];

        // Busca por nome
        const termoBusca = (filtroInput.value || '').toLowerCase();
        if (termoBusca) {
          produtosFiltrados = produtosFiltrados.filter(p => (p.nome || '').toLowerCase().includes(termoBusca));
        }

        // DATAS (cadastro): início e fim
        let inicioVal = document.getElementById('filtro-data-inicio')?.value || '';
        const fimVal   = document.getElementById('filtro-data-fim')?.value || '';

        // Fallback para o campo antigo (se existir)
        if (!inicioVal) {
          const unico = document.getElementById('filtro-data')?.value || '';
          if (unico) inicioVal = unico;
        }

        if (inicioVal) {
          const di = startOfDayLocal(inicioVal);
          produtosFiltrados = produtosFiltrados.filter(p => p.createdAt && new Date(p.createdAt) >= di);
        }
        if (fimVal) {
          const df = endOfDayLocal(fimVal);
          produtosFiltrados = produtosFiltrados.filter(p => p.createdAt && new Date(p.createdAt) <= df);
        }

        // Filtros do modal
        const filtroCategoriaEl = document.getElementById('filtro-categoria');
        const filtroQuantidadeEl = document.getElementById('filtro-quantidade');
        const minEl = document.getElementById('quantidade-minima');
        const maxEl = document.getElementById('quantidade-maxima');

        const filtroCategoria = filtroCategoriaEl ? (filtroCategoriaEl.value || '').toLowerCase() : '';
        const filtroQuantidade = filtroQuantidadeEl ? filtroQuantidadeEl.value : '';
        const minVal = minEl && minEl.value !== '' ? parseInt(minEl.value, 10) : null;
        const maxVal = maxEl && maxEl.value !== '' ? parseInt(maxEl.value, 10) : null;

        if (filtroCategoria) {
          produtosFiltrados = produtosFiltrados.filter(p =>
            p.categoria && p.categoria.toLowerCase().includes(filtroCategoria)
          );
        }

        if (filtroQuantidade === 'maior') {
          produtosFiltrados.sort((a, b) => (b.quantidade ?? 0) - (a.quantidade ?? 0));
        } else if (filtroQuantidade === 'menor') {
          produtosFiltrados.sort((a, b) => (a.quantidade ?? 0) - (b.quantidade ?? 0));
        } else if (filtroQuantidade === 'personalizado') {
          produtosFiltrados = produtosFiltrados.filter(p => {
            const q = p.quantidade ?? 0;
            if (minVal !== null && q < minVal) return false;
            if (maxVal !== null && q > maxVal) return false;
            return true;
          });
        }

        produtosExibidos = produtosFiltrados;
        paginaAtual = 1;
        renderizarTabela();
    }

    function abrirModal() {
        const campoData = document.getElementById('data-criacao');
        if (campoData) {
            const dataAtual = new Date();
            const dataFormatada = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(dataAtual);
            campoData.value = dataFormatada;
        }
        modalContainer.classList.add('mostrar');
    }
    function fecharModal() { modalContainer.classList.remove('mostrar'); }
    function abrirModalFiltro() { modalFiltroContainer.classList.add('mostrar'); }
    function fecharModalFiltro() { modalFiltroContainer.classList.remove('mostrar'); }

    btnFecharModal.addEventListener('click', fecharModal);
    btnAbrirModal.addEventListener('click', abrirModal);
    modalContainer.addEventListener('click', e => { if (e.target === modalContainer) fecharModal(); });

    btnFecharFiltroModal.addEventListener('click', fecharModalFiltro);
    btnAbrirFiltro.addEventListener('click', abrirModalFiltro);
    modalFiltroContainer.addEventListener('click', e => { if (e.target === modalFiltroContainer) fecharModalFiltro(); });

    btnAnterior.addEventListener('click', () => { if (paginaAtual > 1) { paginaAtual--; renderizarTabela(); } });
    btnProximo.addEventListener('click', () => { const totalPaginas = Math.ceil(produtosExibidos.length / ITENS_POR_PAGINA); if (paginaAtual < totalPaginas) { paginaAtual++; renderizarTabela(); } });
    filtroInput.addEventListener('input', aplicarFiltros);
    btnLimparFiltro.addEventListener('click', () => { formFiltro.reset(); aplicarFiltros(); fecharModalFiltro(); });
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeProduto = document.getElementById("nome-produto").value;
        
        // Verificar se já existe um produto com esse nome E com estoque
        const produtoExistente = todosOsProdutos.find(p => 
            p.nome.toLowerCase() === nomeProduto.toLowerCase()
        );

        if (produtoExistente && produtoExistente.quantidade > 0) {
            iziToast.error({ 
                title: 'Erro', 
                message: 'Já existe um produto com esse nome e com estoque. Use o botão de entrada para aumentar a quantidade.', 
                position: 'topRight' 
            });
            return;
        }
        if (produtoExistente && produtoExistente.quantidade === 0) {
            const confirmar = await confirmIzi(`Já existe um produto "${nomeProduto}" sem estoque. Deseja reativar este produto com os novos dados?`);

             if (confirmar) {
               try {
                 const response = await fetch(`http://26.117.112.62:3001/api/stock/adicionar`, {
                   method: "POST",
                   headers: {
                     "Content-Type": "application/json",
                     "Authorization": `Bearer ${token}`
                   },
                   body: JSON.stringify({
                     nome: nomeProduto,
                     descricao: document.getElementById("descricao-produto").value,
                     quantidade: parseInt(document.getElementById("quantidade-produto").value),
                     preco: parseFloat(document.getElementById("preco-produto").value),
                     categoria: document.getElementById("categoria-produto").value,
                     dataCompra: document.getElementById("data-compra").value
                   })
                 });

                 if (!response.ok) {
                   const errorData = await response.json();
                   throw new Error(errorData.error || "Erro ao reativar produto");
                 }

                 const responseData = await response.json();
                 formCadastro.reset();
                 fecharModal();
                 await carregarProdutos();
                 iziToast.success({ 
                     title: 'Sucesso', 
                     message: responseData.message, 
                     position: 'topRight' 
                 });
                 return;
               } catch (error) {
                 iziToast.error({ title: 'Erro', message: error.message, position: 'topRight' });
                 return;
               }
             } else {
               return;
             }
        }

        const produto = {
            nome: nomeProduto,
            descricao: document.getElementById("descricao-produto").value,
            quantidade: parseInt(document.getElementById("quantidade-produto").value),
            preco: parseFloat(document.getElementById("preco-produto").value),
            categoria: document.getElementById("categoria-produto").value,
            dataCompra: document.getElementById("data-compra").value
        };
        
        try {
          const response = await fetch("http://26.117.112.62:3001/api/stock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(produto)
            });

            if (!response.ok) {
                const erroData = await response.json();
                throw new Error(erroData.error || "Erro ao cadastrar produto");
            }

            formCadastro.reset();
            fecharModal();
            await carregarProdutos();
            iziToast.success({ title: 'Sucesso', message: `Produto "${produto.nome}" cadastrado com sucesso!`, position: 'topRight' });
        } catch (error) {
            iziToast.error({ title: 'Erro', message: error.message, position: 'topRight' });
        }
    });

    corpoTabela.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !btn.dataset.id) return;
        const produto = todosOsProdutos.find(p => p.id === btn.dataset.id);
        if (!produto) return;

        if (btn.classList.contains('descricao-btn')) {
            produtoSelecionado = produto;
            const dataCompraFormatada = produto.dataCompra
              ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(produto.dataCompra))
              : '—';

            conteudoDescricao.innerHTML = `
                <p><strong>Nome:</strong> ${produto.nome}</p>
                <p><strong>Descrição:</strong> ${produto.descricao || 'Sem descrição'}</p>
                <p><strong>Categoria:</strong> ${produto.categoria}</p>
                <p><strong>Preço:</strong> ${produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Quantidade:</strong> ${produto.quantidade}</p>
                <p><strong>Data de compra:</strong> ${dataCompraFormatada}</p>
            `;
            modalDescricaoContainer.classList.add('mostrar');
        }

        if (btn.classList.contains('entrada-btn')) {
            produtoSelecionado = produto;
            entradaNomeProduto.textContent = produto.nome;
            entradaQuantidadeAtual.textContent = produto.quantidade;
            quantidadeEntradaInput.value = '';
            modalEntradaContainer.classList.add('mostrar');
        }

        if (btn.classList.contains('saida-btn')) {
            if (produto.quantidade === 0) {
                iziToast.warning({ 
                    title: 'Aviso', 
                    message: 'Este produto não possui estoque disponível para saída.', 
                    position: 'topRight' 
                });
                return;
            }
            
            produtoSelecionado = produto;
            saidaNomeProduto.textContent = produto.nome;
            saidaQuantidadeDisponivel.textContent = produto.quantidade;
            quantidadeSaidaInput.value = '';
            quantidadeSaidaInput.max = produto.quantidade;
            modalSaidaContainer.classList.add('mostrar');
        }
    });

    // Event listeners para modal de entrada
    btnFecharEntrada.addEventListener('click', () => modalEntradaContainer.classList.remove('mostrar'));
    modalEntradaContainer.addEventListener('click', e => { if (e.target === modalEntradaContainer) modalEntradaContainer.classList.remove('mostrar'); });

    btnFecharDescricao.addEventListener('click', () => modalDescricaoContainer.classList.remove('mostrar'));
    modalDescricaoContainer.addEventListener('click', e => { if (e.target === modalDescricaoContainer) modalDescricaoContainer.classList.remove('mostrar'); });

    btnFecharSaida.addEventListener('click', () => modalSaidaContainer.classList.remove('mostrar'));
    modalSaidaContainer.addEventListener('click', e => { if (e.target === modalSaidaContainer) modalSaidaContainer.classList.remove('mostrar'); });

    formSaida.addEventListener('submit', async (e) => {
        e.preventDefault();
        const quantidade = parseInt(quantidadeSaidaInput.value);

        if (!quantidade || quantidade <= 0 || quantidade > produtoSelecionado.quantidade) {
            iziToast.error({ title: 'Erro', message: 'Quantidade inválida', position: 'topRight' });
            return;
        }

        try {
          const response = await fetch(`http://26.117.112.62:3001/api/stock/output/${produtoSelecionado.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ quantidade })
            });

            if (!response.ok) throw new Error("Erro ao registrar saída");
            await carregarProdutos();
            modalSaidaContainer.classList.remove('mostrar');
            iziToast.success({ title: 'Sucesso', message: 'Saída registrada com sucesso!', position: 'topRight' });
        } catch (error) {
            iziToast.error({ title: 'Erro', message: error.message, position: 'topRight' });
        }
    });

    formEntrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        const quantidade = parseInt(quantidadeEntradaInput.value);

        if (!quantidade || quantidade <= 0) {
            iziToast.error({ title: 'Erro', message: 'Quantidade deve ser maior que zero', position: 'topRight' });
            return;
        }

        try {
          const response = await fetch(`http://26.117.112.62:3001/api/stock/adicionar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    nome: produtoSelecionado.nome,
                    quantidade: quantidade,
                    descricao: produtoSelecionado.descricao,
                    preco: produtoSelecionado.preco,
                    categoria: produtoSelecionado.categoria,
                    dataCompra: produtoSelecionado.dataCompra
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.error || errorData.message || `Erro ${response.status}`);
                } catch (parseError) {
                    throw new Error(`Erro ${response.status}: Problema na comunicação com o servidor`);
                }
            }

            const responseData = await response.json();

            await carregarProdutos();
            modalEntradaContainer.classList.remove('mostrar');
            
            iziToast.success({ 
                title: 'Sucesso', 
                message: responseData.message, 
                position: 'topRight' 
            });

        } catch (error) {
            iziToast.error({ title: 'Erro', message: error.message, position: 'topRight' });
        }
    });


    // ===== Filtros do modal: só aplicam ao clicar em "Aplicar" =====
    const filtroData = document.getElementById('filtro-data');
    const filtroCategoriaEl = document.getElementById('filtro-categoria');
    const filtroQuantidadeEl = document.getElementById('filtro-quantidade');
    const quantidadePersonalizada = document.getElementById('quantidade-personalizada');
    const minEl = document.getElementById('quantidade-minima');
    const maxEl = document.getElementById('quantidade-maxima');

    // Não chamamos aplicarFiltros em change/input; apenas controla a UI
    if (filtroQuantidadeEl) {
      const atualizarPersonalizado = () => {
        const isPers = filtroQuantidadeEl.value === 'personalizado';
        if (quantidadePersonalizada) quantidadePersonalizada.style.display = isPers ? 'block' : 'none';
      };
      atualizarPersonalizado();
      filtroQuantidadeEl.addEventListener('change', atualizarPersonalizado);
    }

    if (formFiltro) {
      formFiltro.addEventListener('submit', (e) => {
        e.preventDefault();
        aplicarFiltros();
        fecharModalFiltro();
      });
    }
    btnLimparFiltro.addEventListener('click', () => {
      formFiltro.reset();
      aplicarFiltros();
      fecharModalFiltro();
    });

    carregarProdutos();
}

function confirmIzi(message, { title = 'Confirmar', timeout = 20000 } = {}) {
  return new Promise((resolve) => {
    if (!window.iziToast) {
      resolve(window.confirm(message));
      return;
    }
    let resolved = false;
    const toast = iziToast.show({
      timeout, overlay: true, close: false, drag: false, position: 'center',
      title, message,
      buttons: [
        ['<button>Sim</button>', (instance, toastEl) => {
          resolved = true; instance.hide({ transitionOut: 'fadeOut' }, toastEl, 'button'); resolve(true);
        }, true],
        ['<button>Cancelar</button>', (instance, toastEl) => {
          resolved = true; instance.hide({ transitionOut: 'fadeOut' }, toastEl, 'button'); resolve(false);
        }]
      ],
      onClosed: () => { if (!resolved) resolve(false); }
    });
  });
}

async function exportarDadosPersonalizados() {
  try {
     const cat = document.getElementById('categoria-export')?.value || '';
    const di = document.getElementById('data-compra-inicio')?.value || '';
    const df = document.getElementById('data-compra-fim')?.value || '';
    const qmin = document.getElementById('quantidade-minima')?.value || '';
    const qmax = document.getElementById('quantidade-maxima')?.value || '';

    const qs = new URLSearchParams();
    if (cat) qs.append('categoria', cat);
    if (di) qs.append('dataCadastroInicio', di);
    if (df) qs.append('dataCadastroFim', df);
    if (qmin !== '') qs.append('quantidadeMinima', qmin);
    if (qmax !== '') qs.append('quantidadeMaxima', qmax);

    const token = window.api.getToken();
    const url = `http://26.117.112.62:3001/api/export/database?${qs.toString()}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!resp.ok) {
      const txt = await resp.text();
      let msg = 'Falha ao exportar';
      try { msg = JSON.parse(txt).error || JSON.parse(txt).message || msg; } catch {}
      throw new Error(msg);
    }

    const blob = await resp.blob();

    const cd = resp.headers.get('content-disposition') || '';
    const nomeHeader = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(cd)?.[1]?.replace(/['"]/g, '');
    const contentType = resp.headers.get('content-type') || '';
    const extensao = contentType.includes('spreadsheetml') ? 'xlsx' : (contentType.includes('csv') ? 'csv' : 'xlsx');
    const nomeArquivo = nomeHeader || `estoque-${new Date().toISOString().slice(0,10)}.${extensao}`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();

    window.iziToast?.success({ title: 'Sucesso', message: `Arquivo ${nomeArquivo} baixado.`, position: 'topRight' });
    if (typeof fecharModalExportar === 'function') fecharModalExportar();
  } catch (error) {
    console.error('Exportar erro:', error);
    window.iziToast?.error({ title: 'Erro', message: error.message || 'Erro ao exportar', position: 'topRight' });
  }
}