import {
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  LogOut,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";

import "./dashboard.css";

export function Dashboard() {
  const stats = [
    {
      title: "Produtos cadastrados",
      value: "128",
      description: "Itens ativos no estoque",
      icon: Package,
      type: "blue",
    },
    {
      title: "Patrimônios",
      value: "42",
      description: "Bens registrados",
      icon: ShieldCheck,
      type: "purple",
    },
    {
      title: "Entradas",
      value: "86",
      description: "Movimentações de entrada",
      icon: TrendingUp,
      type: "green",
    },
    {
      title: "Saídas",
      value: "31",
      description: "Movimentações de saída",
      icon: TrendingDown,
      type: "red",
    },
  ];

  const movements = [
    {
      title: "Entrada de produto",
      description: "Mouse Logitech adicionado ao estoque",
      date: "Hoje, 09:40",
      status: "Entrada",
    },
    {
      title: "Saída de produto",
      description: "Teclado mecânico retirado do estoque",
      date: "Hoje, 11:15",
      status: "Saída",
    },
    {
      title: "Novo patrimônio",
      description: "Notebook Dell cadastrado como patrimônio",
      date: "Ontem, 16:22",
      status: "Patrimônio",
    },
    {
      title: "Produto atualizado",
      description: "Monitor Samsung teve quantidade alterada",
      date: "Ontem, 18:05",
      status: "Atualização",
    },
  ];

  const stockItems = [
    {
      name: "Mouse Logitech",
      amount: 24,
      status: "Disponível",
    },
    {
      name: "Teclado Mecânico",
      amount: 8,
      status: "Baixo estoque",
    },
    {
      name: "Monitor Samsung",
      amount: 12,
      status: "Disponível",
    },
    {
      name: "Cabo HDMI",
      amount: 4,
      status: "Baixo estoque",
    },
  ];

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Boxes size={28} />
          </div>

          <div>
            <h1>Sistema Gestão</h1>
          </div>
        </div>

        <nav className="sidebar-menu">
          <a href="#" className="menu-item active">
            <Home size={20} />
            Dashboard
          </a>

          <a href="#" className="menu-item">
            <Package size={20} />
            Produtos
          </a>

          <a href="#" className="menu-item">
            <Warehouse size={20} />
            Estoque
          </a>

          <a href="#" className="menu-item">
            <ShieldCheck size={20} />
            Patrimônio
          </a>

          <a href="#" className="menu-item">
            <Users size={20} />
            Usuários
          </a>

          <a href="#" className="menu-item">
            <Settings size={20} />
            Configurações
          </a>
        </nav>

        <button className="logout-button">
          <LogOut size={20} />
          Sair
        </button>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p>Olá, Guilherme 👋</p>
            <h2>Dashboard</h2>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <Search size={20} />
              <input type="text" placeholder="Buscar no sistema..." />
            </div>

            <button className="add-button">
              <Plus size={20} />
              Novo cadastro
            </button>
          </div>
        </header>

        <section className="stats-grid">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <article className="stat-card" key={item.title}>
                <div className={`stat-icon ${item.type}`}>
                  <Icon size={24} />
                </div>

                <div>
                  <p>{item.title}</p>
                  <h3>{item.value}</h3>
                  <span>{item.description}</span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="dashboard-grid">
          <article className="panel movements-panel">
            <div className="panel-header">
              <div>
                <h3>Movimentações recentes</h3>
                <p>Últimas atividades realizadas no sistema</p>
              </div>

              <button>Ver todas</button>
            </div>

            <div className="movement-list">
              {movements.map((item) => (
                <div className="movement-item" key={item.description}>
                  <div className="movement-icon">
                    <ClipboardList size={20} />
                  </div>

                  <div className="movement-info">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <span>{item.date}</span>
                  </div>

                  <span className="movement-status">{item.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel quick-panel">
            <div className="panel-header">
              <div>
                <h3>Ações rápidas</h3>
                <p>Atalhos principais</p>
              </div>
            </div>

            <div className="quick-actions">
              <button>
                <Package size={20} />
                Cadastrar produto
              </button>

              <button>
                <TrendingUp size={20} />
                Registrar entrada
              </button>

              <button>
                <TrendingDown size={20} />
                Registrar saída
              </button>

              <button>
                <ShieldCheck size={20} />
                Novo patrimônio
              </button>
            </div>
          </article>
        </section>

        <section className="panel stock-panel">
          <div className="panel-header">
            <div>
              <h3>Resumo do estoque</h3>
              <p>Produtos monitorados recentemente</p>
            </div>

            <button>Gerenciar estoque</button>
          </div>

          <div className="stock-table">
            <div className="stock-row stock-head">
              <span>Produto</span>
              <span>Quantidade</span>
              <span>Status</span>
            </div>

            {stockItems.map((item) => (
              <div className="stock-row" key={item.name}>
                <span>{item.name}</span>
                <span>{item.amount}</span>
                <span
                  className={
                    item.status === "Disponível"
                      ? "stock-status available"
                      : "stock-status low"
                  }
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}