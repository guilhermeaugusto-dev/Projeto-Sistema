import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Box,
  Shield,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import "../Login/login.css";
import { Link } from "react-router-dom";


export function Registro() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formData.senha !== formData.confirmarSenha) {
      alert("As senhas não conferem.");
      return;
    }

    console.log("Dados do cadastro:", formData);

    // Aqui depois você vai conectar com sua API
    // Exemplo:
    // POST /api/auth/register
  }

  return (
    <main className="login-page">
      <section className="login-container">
        <div className="login-left">
          <div className="brand">
            <div className="brand-icon">
              <Box size={34} />
            </div>

            <div>
              <h1>Sistema de Gestão</h1>
            </div>
          </div>

          <div className="login-text">
            <h2>Crie sua conta e comece a gerenciar tudo em um só lugar.</h2>
            <p>
              Cadastre-se para controlar produtos, estoque, patrimônios,
              movimentações e acompanhar os dados importantes do sistema.
            </p>
          </div>

          <div className="features">
            <div className="feature-item">
              <div className="feature-icon">
                <ClipboardList size={22} />
              </div>
              <div>
                <strong>Cadastro rápido</strong>
                <p>Comece a usar o sistema em poucos minutos.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Shield size={22} />
              </div>
              <div>
                <strong>Acesso seguro</strong>
                <p>Proteja suas informações com login autenticado.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Box size={22} />
              </div>
              <div>
                <strong>Gestão completa</strong>
                <p>Controle estoque, patrimônio e usuários.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <form className="login-card" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>Criar conta 🚀</h2>
              <p>Preencha os dados para se cadastrar</p>
            </div>

            <div className="input-group">
              <label htmlFor="nome">Nome completo</label>

              <div className="input-wrapper">
                <User size={20} />
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Digite seu nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">E-mail</label>

              <div className="input-wrapper">
                <Mail size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="senha">Senha</label>

              <div className="input-wrapper">
                <Lock size={20} />
                <input
                  id="senha"
                  name="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmarSenha">Confirmar senha</label>

              <div className="input-wrapper">
                <Lock size={20} />
                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <label className="terms">
  <input type="checkbox" required />
  <span>
    Eu aceito os{" "}
    <button
      type="button"
      className="terms-link"
      onClick={() => setShowTermsModal(true)}
    >
      termos de uso
    </button>{" "}
    e a{" "}
    <button
      type="button"
      className="terms-link"
      onClick={() => setShowTermsModal(true)}
    >
      política de privacidade
    </button>
    .
  </span>
</label>
            <button type="submit" className="login-button">
              <UserPlus size={20} />
              Criar conta
            </button>

            <p className="register-text">
              Já tem uma conta? <Link to="/">Entrar</Link>
            </p>
          </form>
        </div>
      </section>
      {showTermsModal && (
  <div className="modal-overlay">
    <div className="terms-modal">
      <div className="modal-header">
        <h2>Termos de Uso e Política de Privacidade</h2>

        <button
          type="button"
          className="modal-close"
          onClick={() => setShowTermsModal(false)}
        >
          ×
        </button>
      </div>

      <div className="modal-content">
        <h3>1. Uso do sistema</h3>
        <p>
          Este sistema tem como objetivo auxiliar no controle de estoque,
          patrimônio, usuários e informações administrativas. O usuário deve
          utilizar a plataforma de forma responsável, respeitando as regras de
          acesso e segurança.
        </p>

        <h3>2. Cadastro e responsabilidade</h3>
        <p>
          Ao criar uma conta, o usuário se compromete a fornecer informações
          verdadeiras e manter seus dados atualizados. O usuário também é
          responsável por manter sua senha em segurança.
        </p>

        <h3>3. Privacidade dos dados</h3>
        <p>
          As informações cadastradas no sistema serão utilizadas apenas para
          fins de funcionamento da plataforma, organização interna e controle dos
          recursos cadastrados.
        </p>

        <h3>4. Segurança</h3>
        <p>
          O sistema pode utilizar mecanismos de autenticação para proteger o
          acesso às informações. Recomenda-se não compartilhar login e senha com
          terceiros.
        </p>

        <h3>5. Alterações nos termos</h3>
        <p>
          Estes termos podem ser atualizados conforme a evolução do sistema.
          Recomenda-se que o usuário revise periodicamente as condições de uso.
        </p>

        <h3>6. Aceite</h3>
        <p>
          Ao marcar a opção de aceite, o usuário declara que leu e concorda com
          estes termos genéricos de uso e privacidade.
        </p>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="modal-button"
          onClick={() => setShowTermsModal(false)}
        >
          Entendi
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}