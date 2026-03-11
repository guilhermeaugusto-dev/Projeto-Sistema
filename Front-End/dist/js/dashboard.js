async function criarGraficoCategorias(labels, data) {
  const filteredLabels = labels.filter((_, i) => data[i] > 0);
  const filteredData = data.filter(value => value > 0);

  const ctx = document.getElementById('categoriasChart');
  if (!ctx) return;
  if (ctx._chartInstance) ctx._chartInstance.destroy();

  ctx._chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: filteredLabels,
      datasets: [{
        label: 'Quantidade por Categoria',
        data: filteredData,
        backgroundColor: ['#3B3B98', '#4A4AFF', '#28B4B4', '#FF6384', '#FFCE56'],
        hoverOffset: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

async function carregarCategorias(token) {
  try {
    const response = await fetch("http://26.117.112.62:3001/api/stock", {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error('Falha ao carregar produtos');
    const produtos = await response.json();

    const categorias = {};
    produtos.forEach(p => {
      const cat = p.categoria || 'Sem Categoria';
      categorias[cat] = (categorias[cat] || 0) + (Number(p.quantidade) || 0);
    });

    const labels = Object.keys(categorias);
    const data = Object.values(categorias);
    criarGraficoCategorias(labels, data);
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
  }
}

async function carregarEntradasESaidas(token) {
  try {
    const respEntradas = await fetch("http://26.117.112.62:3001/api/stock/input", {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    const respSaidas = await fetch("http://26.117.112.62:3001/api/stock/output", {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    let entradas = [];
    let saidas = [];

    if (respEntradas.ok) {
      const contentType = respEntradas.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        entradas = await respEntradas.json();
      } else {
        const text = await respEntradas.text();
      }
    } else {
      const errorText = await respEntradas.text();
    }

    if (respSaidas.ok) {
      const contentType = respSaidas.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        saidas = await respSaidas.json();
      }
    } else {
      const errorText = await respSaidas.text();
    }

    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const entradasMensais = Array(12).fill(0);
    const saidasMensais = Array(12).fill(0);

    entradas.forEach((entrada) => {
      if (entrada.createdAt) {
        const dataEntrada = new Date(entrada.createdAt);
        
        if (!isNaN(dataEntrada.getTime())) {
          const mes = dataEntrada.getMonth();
          const quantidade = Number(entrada.quantidade) || 0;
          entradasMensais[mes] += quantidade;
        }
      }
    });

    saidas.forEach((saida) => {
      if (saida.createdAt) {
        const dataSaida = new Date(saida.createdAt);
        if (!isNaN(dataSaida.getTime())) {
          const mes = dataSaida.getMonth();
          const quantidade = Number(saida.quantidade) || 0;
          saidasMensais[mes] += quantidade;
        }
      }
    });

    const mesAtual = new Date().getMonth();
    const totalEntradasMesAtual = entradasMensais[mesAtual] || 0;
    const totalSaidasMesAtual = saidasMensais[mesAtual] || 0;

    const entradasEl = document.querySelector(".card.vendas .value");
    if (entradasEl) {
      entradasEl.textContent = totalEntradasMesAtual;
    }
    
    const saidasEl = document.querySelector(".card.receita .value");
    if (saidasEl) {
      saidasEl.textContent = totalSaidasMesAtual;
    }

    const ctx = document.getElementById('vendasMensaisChart');
    if (ctx) {
      if (ctx._chartInstance) {
        ctx._chartInstance.destroy();
      }
      
      ctx._chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: meses,
          datasets: [
            {
              label: 'Entradas',
              data: entradasMensais,
              borderColor: '#28B463',
              backgroundColor: 'rgba(40, 180, 99, 0.2)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Saídas',
              data: saidasMensais,
              borderColor: '#E74C3C',
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { 
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y} unidades`;
                }
              }
            }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            } 
          }
        }
      });
    }

  } catch (error) {
    // Erro tratado silenciosamente
  }
}

async function carregarKPIs(token) {
  try {
    const response = await fetch("http://26.117.112.62:3001/api/auth/kpis", {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    let data = {};
    if (response.ok) data = await response.json();
    
    const clientesEl = document.querySelector(".card.clientes .value");
    const produtosEl = document.querySelector(".card.produtos .value");
    if (clientesEl) clientesEl.textContent = data.usuarios ?? 0;
    if (produtosEl) produtosEl.textContent = data.produtos ?? 0;
  } catch (error) {
    console.error("Erro ao carregar KPIs:", error);
    // fallback: mostrar 0 caso não consiga acessar a rota
    const clientesEl = document.querySelector(".card.clientes .value");
    const produtosEl = document.querySelector(".card.produtos .value");
    if (clientesEl) clientesEl.textContent = 0;
    if (produtosEl) produtosEl.textContent = 0;
  }
}

async function initDashboard() {
  const token = localStorage.getItem('token');
  const nomeUsuario = localStorage.getItem('usuarioNome');
  const role = localStorage.getItem('usuarioRole');

  if (!token) {
    window.location.href = "../login/login-cadastro.html";
    return;
  }

  const userNameEl = document.getElementById("user-name");
  if (userNameEl && nomeUsuario) userNameEl.textContent = String(nomeUsuario);

  const cadastrarItem = document.getElementById('menu-cadastrar');
  if (cadastrarItem) cadastrarItem.style.display = (role === 'ADMIN') ? 'block' : 'none';

  const userIcon = document.getElementById("user-icon");
  const dropdown = document.getElementById("user-dropdown");
  if (userIcon && dropdown) {
    userIcon.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });
    document.addEventListener('click', (e) => {
      if (!userIcon.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("usuarioNome");
      localStorage.removeItem("usuarioRole");
      window.location.href = "../login/login-cadastro.html";
    });
  }

  carregarKPIs(token);
  carregarCategorias(token);
  carregarEntradasESaidas(token);
}

document.addEventListener('DOMContentLoaded', initDashboard);
