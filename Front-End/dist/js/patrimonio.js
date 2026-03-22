document.addEventListener('DOMContentLoaded', () => {
  // --- Token e usuário ---
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('usuarioRole');
  const nomeUsuario = localStorage.getItem('usuarioNome');

  if (!token) {
    window.location.href = "../Views/login/login-cadastro.html";
    return;
  }

  const userNameEl = document.getElementById("user-name");
  if (userNameEl && nomeUsuario) userNameEl.textContent = String(nomeUsuario);

  // Mostrar opção de Cadastrar apenas se for ADMIN
  const cadastrarItem = document.getElementById('menu-cadastrar');
  if (cadastrarItem) {
    cadastrarItem.style.display = (role === 'ADMIN') ? 'block' : 'none';
  }

  // --- Dropdown do usuário e logout ---
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
      if (window.api) window.api.logout();
      localStorage.removeItem("token");
      localStorage.removeItem("usuarioNome");
      localStorage.removeItem("usuarioRole");
      window.location.href = "../login/login-cadastro.html";
    });
  }

  initPatrimonio(token);

  // --- Função para mostrar/esconder modais ---
  function toggleModal(modalElement, show) {
    if (!modalElement) return;
    if (show) {
      modalElement.classList.add('mostrar');
      document.body.style.overflow = 'hidden';
    } else {
      modalElement.classList.remove('mostrar');
      document.body.style.overflow = '';
    }
  }

  function initPatrimonio(token) {
    let todosOsPatrimonios = [];
    let patrimoniosExibidos = [];
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 5;

    const corpoTabela = document.getElementById('corpo-tabela');
    const filtroInput = document.getElementById('filtro-pesquisa');
    const btnAbrirModal = document.getElementById('btn-abrir-criar');
    const modalContainer = document.getElementById('modal-criar-container');
    const btnFecharModal = document.getElementById('fechar-criar');
    const formCadastro = document.getElementById('form-criar-patrimonio');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const btnAbrirFiltro = document.getElementById('btn-abrir-filtro');
    const modalFiltroContainer = document.getElementById('modal-filtro-container');
    const btnFecharFiltroModal = document.getElementById('fechar-filtro-modal');
    const formFiltro = document.getElementById('form-filtro');
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro');
    const filtroEstado = document.getElementById('filtro-estado');

    // --- Modal Transferir ---
    const modalTransferir = document.getElementById('modal-transferir-container');
    const btnFecharTransferir = document.getElementById('fechar-transferir');
    const formTransferir = document.getElementById('form-transferir-patrimonio');
    const inputTransferirId = document.getElementById('transferir-id');

    // --- Modal Detalhes ---
    const modalDetalhes = document.getElementById('modal-detalhes-container');
    const btnFecharDetalhes = document.getElementById('fechar-detalhes');
    const detalhesConteudo = document.getElementById('detalhes-conteudo');

    // --- Modal Editar Número ---
    const modalEditarNumero = document.getElementById('modal-editar-numero-container');
    const btnFecharEditarNumero = document.getElementById('fechar-editar-numero');
    const formEditarNumero = document.getElementById('form-editar-numero');

    // Campos de edição de patrimônio
    const inputEditarNome = document.getElementById('editar-nome-patrimonio');
    const inputEditarLocal = document.getElementById('editar-local-patrimonio');
    const inputEditarResponsavel = document.getElementById('editar-responsavel-patrimonio');
    const selectEditarEstado = document.getElementById('editar-estado-patrimonio');
    const inputEditarImagem = document.getElementById('editar-imagem-patrimonio');
    const inputEditarPreco = document.getElementById('editar-preco');

    // Modal de exportação - elementos
    const btnExportar = document.getElementById('btn-exportar');
    const modalExportarContainer = document.getElementById('modal-exportar-container');
    const btnFecharExportar = document.getElementById('fechar-exportar-modal');
    const btnCancelarExportar = document.getElementById('cancelar-exportar');
    const formExportar = document.getElementById('form-exportar');

    // --- Renderização da tabela ---
    function renderizarTabela() {
      corpoTabela.innerHTML = '';
      const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
      const fim = inicio + ITENS_POR_PAGINA;
      const patrimoniosDaPagina = patrimoniosExibidos.slice(inicio, fim);

      if (patrimoniosDaPagina.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="8" style="text-align:center;">Nenhum patrimônio encontrado.</td></tr>`;
        return;
      }

      patrimoniosDaPagina.forEach(p => {
        let imagemHtml = 'Sem Imagem';
        if (p.temImagem) {
          imagemHtml = `<a href="#" class="ver-imagem-link" data-id="${p.numeroTombo}">Ver Imagem</a>`;
        }

        const novaLinha = document.createElement('tr');
        novaLinha.innerHTML = `
          <td>${String(p.numeroTombo).padStart(5,'0')}</td>
          <td>${p.nome}</td>
          <td>${p.local}</td>
          <td>${p.responsavel}</td>
          <td>${p.estado}</td>
          <td>${p.preco}</td>
          <td>${p.numeroNotaFiscal || 'Não informado'}</td>
          <td>${imagemHtml}</td>
          <td>
            <button class="action-btn transferir-btn" data-id="${p.numeroTombo}">
              <img src="../../imagens/patrimonio.png" alt="Transferir">
            </button>
            <button class="action-btn editar-numero-btn" data-id="${p.numeroTombo}">
              <img src="../../imagens/editar.png" alt="Editar">
            </button>
            <button class="action-btn detalhes-btn" data-id="${p.numeroTombo}">
              <img src="../../imagens/icone-detalhes.png" alt="Detalhes">
            </button>
            <button class="action-btn deletar-btn" data-id="${p.numeroTombo}">
              <img src="../../imagens/lixeira.png" alt="Deletar">
            </button>
            
          </td>
        `;
        corpoTabela.appendChild(novaLinha);
      });

      atualizarPaginacao();
    }

    function atualizarPaginacao() {
      const totalPaginas = Math.ceil(patrimoniosExibidos.length / ITENS_POR_PAGINA);
      btnAnterior.disabled = paginaAtual === 1;
      btnProximo.disabled = paginaAtual >= totalPaginas;
    }

    async function carregarPatrimonios() {
      try {
        const response = await fetch("http://26.117.112.62:3001/api/property", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao buscar os patrimônios');
        todosOsPatrimonios = await response.json();
        patrimoniosExibidos = [...todosOsPatrimonios];
        console.log('Patrimônios carregados:', todosOsPatrimonios);
        renderizarTabela();
      } catch (error) {
        console.error(error);
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">${error.message}</td></tr>`;
      }
    }

    function aplicarFiltros() {
      const termoBusca = filtroInput.value.toLowerCase();
      const estadoSelecionado = filtroEstado.value;

      patrimoniosExibidos = todosOsPatrimonios.filter(p => {
        const nomeValido = p.nome.toLowerCase().includes(termoBusca);
        const numeroTomboValido = String(p.numeroTombo).includes(termoBusca);
        const estadoValido = estadoSelecionado ? p.estado === estadoSelecionado : true;
        return (nomeValido || numeroTomboValido) && estadoValido;
      });

      paginaAtual = 1;
      renderizarTabela();
    }

    // --- Eventos ---
    btnAnterior.addEventListener('click', () => { if (paginaAtual > 1) { paginaAtual--; renderizarTabela(); } });
    btnProximo.addEventListener('click', () => { paginaAtual++; renderizarTabela(); });
    filtroInput.addEventListener('input', aplicarFiltros);

    btnAbrirFiltro.addEventListener('click', () => toggleModal(modalFiltroContainer, true));
    btnFecharFiltroModal.addEventListener('click', () => toggleModal(modalFiltroContainer, false));
    modalFiltroContainer.addEventListener('click', e => { if (e.target === modalFiltroContainer) toggleModal(modalFiltroContainer, false); });
    formFiltro.addEventListener('submit', e => { e.preventDefault(); aplicarFiltros(); toggleModal(modalFiltroContainer, false); });
    btnLimparFiltro.addEventListener('click', () => { formFiltro.reset(); aplicarFiltros(); });

    btnAbrirModal.addEventListener('click', () => toggleModal(modalContainer, true));
    btnFecharModal.addEventListener('click', () => toggleModal(modalContainer, false));
    modalContainer.addEventListener('click', e => { if (e.target === modalContainer) toggleModal(modalContainer, false); });


    btnFecharEditarNumero.addEventListener('click', () => toggleModal(modalEditarNumero, false));
    modalEditarNumero.addEventListener('click', e => { if (e.target === modalEditarNumero) toggleModal(modalEditarNumero, false); });

 
    function confirmarAcao(mensagem) {
      return new Promise((resolve) => {
        let resolvido = false;
        iziToast.question({
          timeout: false,
          close: false,
          overlay: true,
          overlayClose: true,         
          displayMode: 'once',
          zindex: 99999,
          title: 'Confirmação',
          message: mensagem,
          position: 'center',
          buttons: [
            ['<button>Sim</button>', (instance, toast) => {
              if (!resolvido) { resolvido = true; resolve(true); }
              instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }, true],
            ['<button>Não</button>', (instance, toast) => {
              if (!resolvido) { resolvido = true; resolve(false); }
              instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }],
          ],
          onClosed: () => { if (!resolvido) resolve(false); }
        });
      });
    }

    // Ações da tabela (transferir, editar, detalhes, deletar)
    corpoTabela.addEventListener('click', async (e) => {
      const verImagemLink = e.target.closest('.ver-imagem-link');
      if (verImagemLink) {
        e.preventDefault();
        const patrimonioId = verImagemLink.dataset.id;
        if (!patrimonioId) return;

        try {
          const resp = await fetch(`http://26.117.112.62:3001/api/property/patrimonio/${patrimonioId}/imagem`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!resp.ok) throw new Error('Erro ao buscar imagem');

          const blob = await resp.blob();
          const imageUrl = URL.createObjectURL(blob);
          window.open(imageUrl, '_blank', 'noopener');
          setTimeout(() => URL.revokeObjectURL(imageUrl), 60000);
        } catch (error) {
          console.error(error);
          window.iziToast?.error({ title: 'Erro', message: error.message || 'Erro ao buscar imagem' });
        }
        return;
      }

      const btn = e.target.closest('button.action-btn');
      if (!btn) return;

      const patrimonioId = btn.dataset.id;
      if (!patrimonioId) return;

      // Transferir
      if (btn.classList.contains('transferir-btn')) {
        formTransferir.dataset.id = patrimonioId;
        inputTransferirId.value = patrimonioId;
        toggleModal(modalTransferir, true);
        return;
      }

      // Editar número/nota
      if (btn.classList.contains('editar-numero-btn')) {
        const patrimonio = todosOsPatrimonios.find(p => p.numeroTombo == patrimonioId);
        if (!patrimonio) return;

        document.getElementById('editar-numero-id-atual').value = patrimonioId;
        document.getElementById('editar-numero-atual').value = String(patrimonio.numeroTombo).padStart(5,'0');
        document.getElementById('editar-novo-numero').value = '';
        document.getElementById('editar-numero-nota-fiscal').value = patrimonio.numeroNotaFiscal || '';

        if (inputEditarNome) inputEditarNome.value = patrimonio.nome || '';
        if (inputEditarLocal) inputEditarLocal.value = patrimonio.local || '';
        if (inputEditarResponsavel) inputEditarResponsavel.value = patrimonio.responsavel || '';
        if (selectEditarEstado) selectEditarEstado.value = patrimonio.estado || '';
        if (inputEditarPreco) {
          if (patrimonio.preco !== null && patrimonio.preco !== undefined) {
            inputEditarPreco.value = String(patrimonio.preco).replace('.', ',');
          } else {
            inputEditarPreco.value = '';
          }
        }

        if (inputEditarImagem) inputEditarImagem.value = '';
        toggleModal(modalEditarNumero, true);
        return;
      }

      // Detalhes
      if (btn.classList.contains('detalhes-btn')) {
        const patrimonio = todosOsPatrimonios.find(p => p.numeroTombo == patrimonioId);
        if (!patrimonio) return;

        try {
          const resp = await fetch(`http://26.117.112.62:3001/api/transfer/${patrimonioId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!resp.ok) throw new Error('Erro ao buscar movimentações');
          const movimentacoes = await resp.json();

          detalhesConteudo.innerHTML = `
            <p>Total de movimentações: ${movimentacoes.length}</p>
            <ul>
              ${movimentacoes.map(mov => `
                <li style="margin-bottom:10px;">
                  <strong>De:</strong> ${mov.deLocal} / ${mov.deResponsavel}<br>
                  <strong>Para:</strong> ${mov.paraLocal} / ${mov.paraResponsavel}<br>
                  ${mov.observacao ? `<strong>Observação:</strong> ${mov.observacao}<br>` : ''}
                  <strong>Data:</strong> ${new Date(mov.createdAt).toLocaleString()}
                </li>
              `).join('')}
            </ul>
          `;
          toggleModal(modalDetalhes, true);
        } catch (error) {
          console.error(error);
          iziToast.error({ title: 'Erro', message: error.message });
        }
        return;
      }

      // Deletar
      if (btn.classList.contains('deletar-btn')) {
        try {
          const respMovimentacoes = await fetch(`http://26.117.112.62:3001/api/transfer/${patrimonioId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (respMovimentacoes.ok) {
            const movimentacoes = await respMovimentacoes.json();
            
            if (movimentacoes.length > 0) {
              window.iziToast?.error({ 
                title: 'Erro', 
                message: `Este patrimônio não pode ser deletado pois já foi transferido ${movimentacoes.length} vez(es). `,
                position: 'topRight',
                timeout: 8000
              });
              return;
            }
          }

          // Se não há movimentações, prosseguir com a confirmação
          const confirmar = await confirmarAcao('Tem certeza que deseja deletar este patrimônio?');
          if (!confirmar) return;

          try {
            btn.disabled = true;
            const resp = await fetch(`http://26.117.112.62:3001/api/property/${patrimonioId}`, {
              method: 'DELETE',
              headers: { "Authorization": `Bearer ${token}` }
            });

            if (!(resp.ok || resp.status === 204)) {
              const txt = await resp.text();
              throw new Error(txt || 'Falha ao deletar patrimônio.');
            }

            window.iziToast?.success({ 
              title: 'Sucesso', 
              message: 'Patrimônio deletado com sucesso!',
              position: 'topRight'
            });
            await carregarPatrimonios();
          } catch (error) {
            console.error('Erro ao deletar patrimônio:', error);
            window.iziToast?.error({ 
              title: 'Erro', 
              message: error.message || 'Erro ao deletar patrimônio',
              position: 'topRight'
            });
          } finally {
            btn.disabled = false;
          }
          
        } catch (error) {
          console.error('Erro ao verificar movimentações:', error);
          window.iziToast?.error({ 
            title: 'Erro', 
            message: 'Erro ao verificar se o patrimônio pode ser deletado',
            position: 'topRight'
          });
        }
      }
    });

    btnFecharTransferir.addEventListener('click', () => toggleModal(modalTransferir, false));
    modalTransferir.addEventListener('click', e => { if (e.target === modalTransferir) toggleModal(modalTransferir, false); });

    btnFecharDetalhes.addEventListener('click', () => toggleModal(modalDetalhes, false));
    modalDetalhes.addEventListener('click', e => { if (e.target === modalDetalhes) toggleModal(modalDetalhes, false); });

    formTransferir.addEventListener('submit', async (e) => {
      e.preventDefault();
      const patrimonioId = formTransferir.dataset.id;
      const dados = {
        novoLocal: document.getElementById('novo-local').value,
        novoResponsavel: document.getElementById('novo-responsavel').value,
        observacao: document.getElementById('observacao').value,
      };
      try {
        const response = await fetch(`http://26.117.112.62:3001/api/transfer/${patrimonioId}`, {
          method: 'PUT',
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });
        if (!response.ok) throw new Error(await response.text());
        iziToast.success({ title: 'Sucesso', message: 'Patrimônio transferido!' });
        toggleModal(modalTransferir, false);
        formTransferir.reset();
        await carregarPatrimonios();
      } catch (error) {
        iziToast.error({ title: 'Erro', message: error.message });
      }
    });

    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = formCadastro.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Enviando...';
      const formData = new FormData(formCadastro);
      try {
        const response = await fetch('http://26.117.112.62:3001/api/property', {
          method: 'POST',
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        if (!response.ok) throw new Error(await response.text());
        iziToast.success({ title: 'Sucesso', message: 'Patrimônio cadastrado!' });
        toggleModal(modalContainer, false);
        formCadastro.reset();
        await carregarPatrimonios();
      } catch (error) {
        iziToast.error({ title: 'Erro', message: error.message });
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Salvar Patrimônio';
      }
    });

    // Form para editar patrimônio (número do tombo, nota fiscal, dados gerais)
    formEditarNumero.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idAtual = document.getElementById('editar-numero-id-atual').value;
      const novoNumero = document.getElementById('editar-novo-numero').value;
      const numeroNotaFiscal = document.getElementById('editar-numero-nota-fiscal').value;

      const btnSubmit = formEditarNumero.querySelector('button[type="submit"]');

      try {
        const formData = new FormData();

        if (novoNumero && novoNumero.trim() !== '') {
          formData.append('numeroTombo', novoNumero.trim());
        }

        formData.append('numeroNotaFiscal', numeroNotaFiscal || '');

        if (inputEditarNome) formData.append('nome', inputEditarNome.value || '');
        if (inputEditarLocal) formData.append('local', inputEditarLocal.value || '');
        if (inputEditarResponsavel) formData.append('responsavel', inputEditarResponsavel.value || '');
        if (selectEditarEstado) formData.append('estado', selectEditarEstado.value || '');
        if (inputEditarPreco) formData.append('preco', inputEditarPreco.value || '');

        if (inputEditarImagem && inputEditarImagem.files && inputEditarImagem.files[0]) {
          formData.append('imagem', inputEditarImagem.files[0]);
        }

        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = 'Salvando...';
        }

        const response = await fetch(`http://26.117.112.62:3001/api/property/${idAtual}`, {
          method: 'PUT',
          headers: { 
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        iziToast.success({ 
          title: 'Sucesso', 
          message: 'Patrimônio atualizado com sucesso!' 
        });
        
        toggleModal(modalEditarNumero, false);
        formEditarNumero.reset();
        await carregarPatrimonios();
        
      } catch (error) {
        console.error('Erro ao atualizar patrimônio:', error);
        iziToast.error({ 
          title: 'Erro', 
          message: error.message || 'Erro ao atualizar patrimônio'
        });
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Salvar';
        }
      }
    });

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
            await exportarPatrimonio();
        });
    }

    // Função para exportar patrimônio
    async function exportarPatrimonio() {
        try {
            const submitBtn = formExportar.querySelector('button[type="submit"]');
            const textoOriginal = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Gerando...';

      
            const estado = document.getElementById('estado-export').value;
            const localizacao = document.getElementById('localizacao-export').value;
            const dataInicio = document.getElementById('data-inicio').value;
            const dataFim = document.getElementById('data-fim').value;

        
            const params = new URLSearchParams();
            if (estado) params.append('estado', estado);
            if (localizacao) params.append('localizacao', localizacao);
            if (dataInicio) params.append('dataInicio', dataInicio);
            if (dataFim) params.append('dataFim', dataFim);

            const url = `http://26.117.112.62:3001/api/export/patrimonio?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar relatório de patrimônio');
            }

            // Download do arquivo
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            
            // Nome do arquivo baseado nos filtros
            let nomeArquivo = 'patrimonio';
            if (estado) nomeArquivo += `_${estado.replace(/\s+/g, '_')}`;
            if (localizacao) nomeArquivo += `_${localizacao.replace(/\s+/g, '_')}`;
            if (dataInicio) nomeArquivo += `_${dataInicio}`;
            if (dataFim) nomeArquivo += `_ate_${dataFim}`;
            nomeArquivo += `_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            a.download = nomeArquivo;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            fecharModalExportar();
            
            // Mostrar sucesso
            window.iziToast?.success({ 
              title: 'Sucesso', 
              message: 'Relatório de patrimônio gerado com sucesso!', 
              position: 'topRight' 
            });

        } catch (error) {
            console.error('Erro ao exportar patrimônio:', error);
            window.iziToast?.error({ 
              title: 'Erro', 
              message: 'Erro ao gerar relatório de patrimônio', 
              position: 'topRight' 
            });
        } finally {
            const submitBtn = formExportar.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Baixar Planilha';
        }
    }

    carregarPatrimonios();
  }
});
