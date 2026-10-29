import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  Smartphone,
  Car,
  AlertCircle,
  Building,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    userProfile,
    signInWithGoogle,
    signInEmailPassword,
    signUpEmailPassword,
    signInAsDemo,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInEmailPassword(email, password);
      } else {
        await signUpEmailPassword(email, password, name);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.');
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
      onClose();
    } catch (err: any) {
      setError('Erro ao entrar com Google: ' + (err.message || 'janela fechada'));
    } finally {
      setLoading(false);
    }
  };

  const handleFastDemo = (role: 'gestor' | 'motorista') => {
    signInAsDemo(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Líder - Gestor de Frota</h3>
              <p className="text-xs text-blue-200">Acesso ao Sistema Corporativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Profile Summary if already logged in */}
          {userProfile && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Usuário Conectado:</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                  {userProfile.role}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {userProfile.displayName}
              </p>
              <p className="text-xs text-slate-500">{userProfile.email}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                {userProfile.companyName}
              </p>

              <button
                onClick={signOut}
                className="w-full mt-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
              >
                Desconectar desta Conta
              </button>
            </div>
          )}

          {/* Fast Demo Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Entrada Rápida / Demonstração
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFastDemo('gestor')}
                className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Como Gestor
                  </span>
                </div>
                <p className="text-[10px] text-blue-700/80 dark:text-blue-300 mt-1">
                  Acesso total: frota, relatórios e custos
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleFastDemo('motorista')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Como Motorista
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Uso no pátio: KM inicial e final
                </p>
              </button>
            </div>
          </div>

          {/* Separator */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-semibold absolute">
              Ou Autenticação Real
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border-2 border-blue-600 bg-blue-50/50 dark:bg-slate-800 hover:bg-blue-100/60 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Entrar com o Google</span>
            </div>
            <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-xs">
              Recomendado
            </span>
          </button>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
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
                    placeholder="Ex: Distribuidora e Serviços Silva Ltda"
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
                Senha *
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
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Carregando...'
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar com E-mail</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Nova Conta</span>
                </>
              )}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                Não possui conta ainda?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Cadastre sua empresa
                </button>
              </p>
            ) : (
              <p>
                Já possui conta cadastrada?{' '}
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
  );
};
