import {
  Box,
  LayoutDashboard,
  Package,
  Warehouse,
  ShieldCheck,
  ArrowLeftRight,
  Truck,
  FileBarChart,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  Pencil,
  Trash2,
  AlertCircle,
  Tag,
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./Produtos.css";
import { Sidebar } from "../../componentes/sidebar";

type Produto = {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  codigo: string;
  estoque: number;
  preco: string;
  status: "Ativo" | "Estoque baixo";
  imagem: string;
};

export function Produtos() {
  const produtos: Produto[] = [
    {
      id: 1,
      nome: "Mouse Logitech MX Master 3",
      descricao: "Mouse sem fio avançado",
      categoria: "Informática",
      codigo: "PROD-001",
      estoque: 24,
      preco: "R$ 479,90",
      status: "Ativo",
      imagem:
        "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: 2,
      nome: "Teclado Mecânico Redragon",
      descricao: "Switch Blue",
      categoria: "Informática",
      codigo: "PROD-002",
      estoque: 8,
      preco: "R$ 299,90",
      status: "Estoque baixo",
      imagem:
        "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: 3,
      nome: 'Monitor Samsung 24" Full HD',
      descricao: "75Hz, HDMI, 24 polegadas",
      categoria: "Eletrônicos",
      codigo: "PROD-003",
      estoque: 12,
      preco: "R$ 899,90",
      status: "Ativo",
      imagem:
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: 4,
      nome: "Cabo HDMI 2.0 2m",
      descricao: "Alta velocidade",
      categoria: "Acessórios",
      codigo: "PROD-004",
      estoque: 4,
      preco: "R$ 29,90",
      status: "Estoque baixo",
      imagem:
        "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: 5,
      nome: "Headset HyperX Cloud Stinger",
      descricao: "7.1 Surround",
      categoria: "Informática",
      codigo: "PROD-005",
      estoque: 15,
      preco: "R$ 399,90",
      status: "Ativo",
      imagem:
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: 6,
      nome: "Cadeira Gamer XT Racer",
      descricao: "Ergonômica, preta",
      categoria: "Móveis",
      codigo: "PROD-006",
      estoque: 6,
      preco: "R$ 1.299,90",
      status: "Estoque baixo",
      imagem:
        "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: 7,
      nome: "Mesa Escritório 120x60",
      descricao: "Madeira MDF",
      categoria: "Móveis",
      codigo: "PROD-007",
      estoque: 10,
      preco: "R$ 399,90",
      status: "Ativo",
      imagem:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=300&auto=format&fit=crop",
    },
  ];

  return (
    <main className="produtos-page">
        <Sidebar />
      <section className="content">
        <header className="topbar">
          <div>
            <h2>Produtos</h2>
            <p>Gerencie os produtos cadastrados no sistema</p>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Buscar produtos..." />
            </div>

            <button className="icon-button">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>

            <button className="new-product-button">
              <Plus size={18} />
              Novo produto
            </button>
          </div>
        </header>

        <section className="summary-cards">
          <article className="summary-card">
            <div className="summary-icon blue">
              <Box size={24} />
            </div>
            <div>
              <h3>128</h3>
              <p>Produtos cadastrados</p>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon green">
              <Tag size={24} />
            </div>
            <div>
              <h3>98</h3>
              <p>Ativos</p>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon orange">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3>18</h3>
              <p>Estoque baixo</p>
            </div>
          </article>

          <article className="summary-card">
            <div className="summary-icon purple">
              <Archive size={24} />
            </div>
            <div>
              <h3>12</h3>
              <p>Inativos</p>
            </div>
          </article>
        </section>

        <section className="products-panel">
          <div className="panel-header">
            <h3>Lista de produtos</h3>

            <div className="panel-actions">
              <button className="panel-button">
                <Filter size={18} />
                Filtros
              </button>

              <button className="panel-button">
                <Download size={18} />
                Exportar
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Código</th>
                  <th>Estoque</th>
                  <th>Preço</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id}>
                    <td>
                      <div className="product-info">
                        <img src={produto.imagem} alt={produto.nome} />
                        <div>
                          <strong>{produto.nome}</strong>
                          <span>{produto.descricao}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`category-badge ${produto.categoria.toLowerCase().replace(/\s+/g, "-").replace(/â/g, "a").replace(/ó/g, "o")}`}>
                        {produto.categoria}
                      </span>
                    </td>

                    <td>{produto.codigo}</td>
                    <td>{produto.estoque}</td>
                    <td>{produto.preco}</td>

                    <td>
                      <span
                        className={
                          produto.status === "Ativo"
                            ? "status-badge active"
                            : "status-badge low"
                        }
                      >
                        {produto.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button className="edit-button">
                          <Pencil size={18} />
                        </button>

                        <button className="delete-button">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <p>Mostrando 1 a 7 de 128 produtos</p>

            <div className="pagination">
              <button className="page-button">
                <ChevronLeft size={18} />
              </button>
              <button className="page-button active">1</button>
              <button className="page-button">2</button>
              <button className="page-button">3</button>
              <span className="dots">...</span>
              <button className="page-button">19</button>
              <button className="page-button">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}