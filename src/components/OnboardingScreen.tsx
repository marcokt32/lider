import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Car,
  ShieldCheck,
  Smartphone,
  Building,
  CreditCard,
  Calendar,
  Phone,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

export const OnboardingScreen: React.FC = () => {
  const { userProfile, completeOnboarding } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [selectedRole, setSelectedRole] = useState<UserRole>('gestor');
  const [loading, setLoading] = useState(false);

  // Gestor fields
  const [companyName, setCompanyName] = useState('Minha Empresa de Serviços');
  const [city, setCity] = useState('São Paulo / SP');
  const [gestorPhone, setGestorPhone] = useState('(11) 98765-4321');

  // Motorista fields
  const [cnhNumber, setCnhNumber] = useState('');
  const [cnhCategory, setCnhCategory] = useState('B');
  const [cnhExpiration, setCnhExpiration] = useState(() => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 3);
    return future.toISOString().split('T')[0];
  });
  const [driverPhone, setDriverPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedRole === 'gestor') {
        await completeOnboarding({
          role: 'gestor',
          companyName: companyName.trim() || 'Minha Frota',
          phone: gestorPhone,
        });
      } else {
        await completeOnboarding({
          role: 'motorista',
          cnhNumber: cnhNumber.trim() || '00000000000',
          cnhCategory,
          cnhExpiration,
          phone: driverPhone,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors antialiased">
      {/* Top Header */}
      <header className="max-w-5xl w-full mx-auto px-4 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight flex items-center gap-1.5">
              LÍDER
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Frota
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Alternar tema"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Form */}
      <main className="max-w-xl w-full mx-auto px-4 py-8 my-auto">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Como você vai usar o Líder Frota?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Olá, <strong>{userProfile?.displayName}</strong>! Selecione sua função para personalizarmos
            sua experiência na plataforma.
          </p>
        </div>

        {/* 2 Big Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('gestor')}
            className={`p-5 rounded-2xl border text-left transition-all relative ${
              selectedRole === 'gestor'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
            }`}
          >
            {selectedRole === 'gestor' && (
              <div className="absolute top-3 right-3 text-blue-600">
                <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Dono de Frota / Gestor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gerenciar veículos, cadastrar motoristas, controlar custos, manutenção e relatórios.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('motorista')}
            className={`p-5 rounded-2xl border text-left transition-all relative ${
              selectedRole === 'motorista'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
            }`}
          >
            {selectedRole === 'motorista' && (
              <div className="absolute top-3 right-3 text-blue-600">
                <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Motorista Profissional
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Participar de frotas da rede, registrar KM Inicial na saída e KM Final no retorno.
            </p>
          </button>
        </div>

        {/* Role Specific Registration Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4"
        >
          {selectedRole === 'gestor' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Empresa / Nome da Frota *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alfa Logística & Serviços"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade / Base Operacional
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo / SP"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone de Contato
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={gestorPhone}
                      onChange={(e) => setGestorPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Registro da CNH *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: 05492817342"
                    value={cnhNumber}
                    onChange={(e) => setCnhNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria da CNH *
                  </label>
                  <select
                    value={cnhCategory}
                    onChange={(e) => setCnhCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="B">B (Carros de Passeio e Furgões)</option>
                    <option value="AB">AB (Motos e Carros)</option>
                    <option value="C">C (Caminhões e Cargas Médias)</option>
                    <option value="D">D (Vans e Ônibus)</option>
                    <option value="E">E (Veículos Articulados)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Validade da CNH *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={cnhExpiration}
                      onChange={(e) => setCnhExpiration(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Configurando...' : 'Concluir Cadastro & Acessar Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/80 py-4 text-center text-xs text-slate-400">
        <p>Líder - Gestor de Frota &bull; Todos os direitos reservados</p>
      </footer>
    </div>
  );
};
