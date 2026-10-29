import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Car,
  ShieldCheck,
  UserCheck,
  Sun,
  Moon,
  LogOut,
  Layers,
  Wrench,
  AlertTriangle,
  FileText,
  Clock,
  Menu,
  X,
  Smartphone,
  Building,
  LogIn,
} from 'lucide-react';
import { Vehicle } from '../types/index.ts';
import { NotificationCenter } from './NotificationCenter.tsx';

export type ActiveTab = 'dashboard' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'fines' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTripModal: (type: 'start' | 'finish') => void;
  pendingTripsCount: number;
  maintenanceAlertsCount: number;
  vehicles: Vehicle[];
  onOpenAuthModal?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTripModal,
  pendingTripsCount,
  maintenanceAlertsCount,
  vehicles,
  onOpenAuthModal,
}) => {
  const { currentUser, userProfile, signOut, isGestor, isMotorista } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Tabs for Gestor
  const gestorNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Painel Geral', icon: <Layers className="w-4 h-4" /> },
    {
      id: 'trips',
      label: 'Uso Diário (KM)',
      icon: <Clock className="w-4 h-4" />,
      badge: pendingTripsCount,
      badgeColor: 'bg-amber-500',
    },
    { id: 'vehicles', label: 'Veículos / Frota', icon: <Car className="w-4 h-4" /> },
    { id: 'drivers', label: 'Motoristas & Rede', icon: <UserCheck className="w-4 h-4" /> },
    {
      id: 'maintenance',
      label: 'Manutenção',
      icon: <Wrench className="w-4 h-4" />,
      badge: maintenanceAlertsCount,
      badgeColor: 'bg-rose-500',
    },
    { id: 'fines', label: 'Multas', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText className="w-4 h-4" /> },
  ];

  // Tabs for Motorista (clean & operational)
  const motoristaNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Meu Painel', icon: <Layers className="w-4 h-4" /> },
    { id: 'trips', label: 'Minhas Viagens (KM)', icon: <Clock className="w-4 h-4" /> },
  ];

  const currentNavItems: NavItem[] = isMotorista ? motoristaNavItems : gestorNavItems;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0b0f19] border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Company */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  LÍDER
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Frota
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  {userProfile?.companyName || (isMotorista ? 'Painel do Motorista' : 'Minha Frota')}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {currentNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${
                        item.badgeColor || 'bg-blue-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Tools & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Trip Action Buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => onOpenTripModal('start')}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                title="Registrar KM Inicial de Saída"
              >
                <span>+ KM Inicial</span>
              </button>
              <button
                onClick={() => onOpenTripModal('finish')}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                title="Registrar Retorno com KM Final"
              >
                <span>✓ KM Final</span>
              </button>
            </div>

            {/* Role Fixed Badge (No manual switch button) */}
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              {isGestor ? (
                <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Gestor
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Motorista
                </span>
              )}
            </div>

            {/* Maintenance Push Notification Center */}
            <NotificationCenter
              vehicles={vehicles}
              onNavigateToMaintenance={() => setActiveTab('maintenance')}
            />

            {/* Theme Toggle (Distinct Light & Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Mudar para Modo Claro (Fundo Branco)' : 'Mudar para Modo Escuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Prominent Login Button if unauthenticated (Demo mode) */}
            {!currentUser && onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-600/30 hover:scale-105 transition-all cursor-pointer"
                title="Fazer Login no Firebase para sincronizar dados em nuvem"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Fazer Login</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Sandwich Button (Always available for Side Menu & Account) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              title="Abrir Menu Lateral e Conta"
              aria-label="Abrir Menu Lateral"
            >
              <Menu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {userProfile && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] uppercase shadow-xs">
                  {userProfile.displayName ? userProfile.displayName.charAt(0) : 'U'}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Side Menu Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="fixed inset-y-0 right-0 z-50 w-80 sm:w-88 max-w-[88vw] bg-white dark:bg-[#0f172a] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black text-sm text-slate-900 dark:text-white">LÍDER Frota</span>
                    <p className="text-[10px] text-slate-400 font-medium">Menu do Sistema</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  aria-label="Fechar Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Account Card inside Side Menu */}
              {userProfile && (
                <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg uppercase shadow-md shadow-blue-600/30 shrink-0">
                      {userProfile.displayName ? userProfile.displayName.charAt(0) : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                        {userProfile.displayName || 'Usuário'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {userProfile.email}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isGestor
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {isGestor ? <ShieldCheck className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          {isGestor ? 'Gestor de Frota' : 'Motorista'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {userProfile.companyName && (
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate font-semibold">{userProfile.companyName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Trip Actions in Drawer */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Atalhos de Viagem
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onOpenTripModal('start');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center shadow-xs transition-colors cursor-pointer"
                  >
                    + KM Inicial
                  </button>
                  <button
                    onClick={() => {
                      onOpenTripModal('finish');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-xs transition-colors cursor-pointer"
                  >
                    ✓ KM Final
                  </button>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 py-1">
                  Navegação
                </span>
                {currentNavItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${
                            item.badgeColor || 'bg-blue-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer with Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
              {!currentUser && onOpenAuthModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Fazer Login / Conectar Nuvem</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>{currentUser ? 'Sair da Conta (Logout)' : 'Reiniciar Sessão de Demonstração'}</span>
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Líder Gestor de Frota v1.0 • PWA Ready
              </p>
            </div>
          </aside>
        </>
      )}
    </header>
  );
};
