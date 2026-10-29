import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Car,
  ShieldCheck,
  Smartphone,
  Gauge,
  Wrench,
  AlertTriangle,
  LogIn,
  UserPlus,
  AlertCircle,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    signInWithGoogle,
    signInEmailPassword,
    signUpEmailPassword,
    signInAsDemo,
    loading: authLoading,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInEmailPassword(email, password);
      } else {
        await signUpEmailPassword(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Falha na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError('Erro ao entrar com Google: ' + (err.message || 'janela fechada'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors antialiased">
      {/* Top Bar */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              LÍDER
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                Frota
              </span>
            </span>
          </div>
        </div>

        {/* Right header actions with very evident Login Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || authLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/30 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
            title="Entrar com Conta Google"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#ffffff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#ffffff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#ffffff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden sm:inline">Entrar com Google</span>
            <span className="sm:hidden">Entrar</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Alternar Modo Escuro"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Presentation & Value proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistema Profissional para Frotas Próprias</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Gestão de Frota, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 dark:from-blue-400 dark:to-indigo-300">
                Controle Diário de KM
              </span>{' '}
              & Manutenção Preventiva.
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Desenvolvido para empresas de atendimento ao cliente e prestação de serviços com frota
              própria. Saiba exatamente quem conduziu cada veículo no dia, acompanhe KM Inicial e
              Final e receba avisos automáticos de revisão a cada 10.000 KM.
            </p>

            {/* Evident Hero Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading || authLoading}
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema (Google)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const card = document.getElementById('login-card-section');
                  if (card) card.scrollIntoView({ behavior: 'smooth' });
                }}
                className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-colors cursor-pointer"
              >
                <span>Acessar com E-mail e Senha</span>
              </button>
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    KM Inicial e Final Diário
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Saídas com checklist e retorno com cálculo automático da distância rodada.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Avisos a cada 10.000 KM
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Radar de alerta preventivo para troca de óleo, freios e revisões programadas.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Motorista Responsável
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Cadastro com CNH e identificação de quem estava com o carro em cada data.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Multas & Relatórios
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Atribuição automática de infração ao condutor e exportação de dados em CSV e PDF.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Buttons for Instant Validation */}
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Validação Instantânea (Testar sem cadastro prévio):
                </span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                <button
                  type="button"
                  onClick={() => signInAsDemo('gestor')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entrar como Gestor (Demonstração)</span>
                </button>
                <button
                  type="button"
                  onClick={() => signInAsDemo('motorista')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Entrar como Motorista (Pátio)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: High Visibility Login Card */}
          <div className="lg:col-span-5" id="login-card-section">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-blue-500/30 dark:border-blue-500/40 shadow-2xl space-y-5 relative">
              {/* Highlight badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                  <LogIn className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  Área de Login e Acesso
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Google & Nuvem Firebase
                </span>
              </div>

              <div className="text-left space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Entrar no Líder Frota' : 'Cadastre sua Empresa'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'login'
                    ? 'Acesse o sistema com sua conta para gerenciar veículos e condutores.'
                    : 'Crie sua conta para iniciar a gestão profissional de frota.'}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Highly Evident Google Login Button */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-400 block">
                  Acesso Rápido Recomendado:
                </span>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading || authLoading}
                  className="w-full py-3.5 px-4 rounded-2xl border-2 border-blue-600 bg-blue-50/40 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 hover:border-blue-700 text-slate-900 dark:text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white p-1.5 flex items-center justify-center shadow-xs shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <span className="text-slate-900 dark:text-white font-black">
                      Entrar com Conta Google
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-xs group-hover:scale-105 transition-transform">
                    1 Clique
                  </span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider absolute">
                  ou e-mail corporativo
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Seu Nome *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Eduardo Silveira"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nome da Empresa / Frota
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Líder Serviços & Transportes"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="gestor@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Senha de Acesso *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || authLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Conectando ao Sistema...</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Cadastrar Frota & Entrar</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Register / Login */}
              <div className="pt-2 text-center text-xs text-slate-500">
                {mode === 'login' ? (
                  <p>
                    Ainda não tem conta?{' '}
                    <button
                      onClick={() => setMode('register')}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Cadastre sua empresa
                    </button>
                  </p>
                ) : (
                  <p>
                    Já possui conta?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Fazer login
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
        <p>Líder - Gestor de Frota &bull; Controle de KM & Manutenção Preventiva</p>
      </footer>
    </div>
  );
};
