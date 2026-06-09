import {
  Boxes,
  Home,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Users,
  Warehouse,
} from "lucide-react";
import "./sidebar.css";
import {Link
 } from "react-router-dom";

export function Sidebar() {
  return (
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
        <Link to="/dashboard" className="menu-item">
          <Home size={20} />
          Dashboard
        </Link>

        <Link to="/produtos" className="menu-item">
          <Package size={20} />
          Produtos
        </Link>

        <Link to="/patrimonio" className="menu-item">
          <ShieldCheck size={20} />
          Patrimônio
        </Link>

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
  );
}