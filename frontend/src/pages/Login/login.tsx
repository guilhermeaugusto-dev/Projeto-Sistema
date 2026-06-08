import { Eye, EyeOff, Lock, Mail, LogIn, Box, Shield, BarChart3 } from "lucide-react";
import { useState } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import * as authService from '../../servicos/autenticar_Login';

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    authService
      .autenticar_Login(email, password)
      .then((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario || {}));
        navigate('/dashboard');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
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
            <h2>Gerencie seu estoque, patrimônio e muito mais.</h2>
            <p>
              Um sistema completo para facilitar o controle da sua empresa com
              eficiência, organização e segurança.
            </p>
          </div>

          <div className="features">
            <div className="feature-item">
              <div className="feature-icon">
                <Box size={22} />
              </div>
              <div>
                <strong>Estoque inteligente</strong>
                <p>Controle entradas, saídas e produtos.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Shield size={22} />
              </div>
              <div>
                <strong>Patrimônio</strong>
                <p>Gerencie bens, categorias e documentos.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <BarChart3 size={22} />
              </div>
              <div>
                <strong>Relatórios</strong>
                <p>Acompanhe indicadores importantes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <form className="login-card" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>Bem-vindo!</h2>
              <p>Faça login para acessar sua conta</p>
            </div>

            <div className="input-group">
              <label htmlFor="email">E-mail</label>

              <div className="input-wrapper">
                <Mail size={20} />
                <input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Senha</label>

              <div className="input-wrapper">
                <Lock size={20} />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="form-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Lembrar de mim</span>
              </label>

              <a href="#">Esqueci minha senha</a>
            </div>

            {error && <p style={{ color: 'crimson', textAlign: 'center' }}>{error}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              <LogIn size={20} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="divider">
              <span></span>
              <p>ou continue com</p>
              <span></span>
            </div>

            <button type="button" className="google-button" onClick={()=> navigate('/dashboard')}>
              <strong>G</strong>
              Continuar com Google
            </button>

            <p className="register-text">
              Ainda não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}