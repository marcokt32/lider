import React, { useState, useRef } from 'react';
import { Driver, DailyTrip } from '../types/index.ts';
import { addDriver, updateDriver, deleteDriver } from '../firebase/firestoreService.ts';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  History,
  Send,
  Users,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Columns3,
} from 'lucide-react';

interface DriversTabProps {
  drivers: Driver[];
  dailyTrips: DailyTrip[];
  adminId: string;
}

export const DriversTab: React.FC<DriversTabProps> = ({ drivers, dailyTrips, adminId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewHistoryDriver, setViewHistoryDriver] = useState<Driver | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.85;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // In modal: choose between 'invite_email' (network member) vs 'internal' (generic driver)
  const [driverType, setDriverType] = useState<'invite_email' | 'internal'>('invite_email');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cnhNumber, setCnhNumber] = useState('');
  const [cnhCategory, setCnhCategory] = useState('B');
  const [cnhExpiration, setCnhExpiration] = useState('');
  const [status, setStatus] = useState<Driver['status']>('ativo');

  const openCreateModal = () => {
    setEditingDriver(null);
    setDriverType('invite_email');
    setName('');
    setEmail('');
    setPhone('');
    setCnhNumber('');
    setCnhCategory('B');
    const future = new Date();
    future.setFullYear(future.getFullYear() + 3);
    setCnhExpiration(future.toISOString().split('T')[0]);
    setStatus('ativo');
    setModalOpen(true);
  };

  const openEditModal = (d: Driver) => {
    setEditingDriver(d);
    setDriverType(d.email ? 'invite_email' : 'internal');
    setName(d.name);
    setEmail(d.email || '');
    setPhone(d.phone);
    setCnhNumber(d.cnhNumber);
    setCnhCategory(d.cnhCategory);
    setCnhExpiration(d.cnhExpiration);
    setStatus(d.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setLoading(true);
      const isNetwork = driverType === 'invite_email' && !!email.trim();

      if (editingDriver) {
        await updateDriver(editingDriver.id, {
          name,
          email: email.trim(),
          phone,
          cnhNumber: cnhNumber || '00000000000',
          cnhCategory,
          cnhExpiration,
          status,
          isNetworkMember: isNetwork,
          inviteStatus: isNetwork ? (editingDriver.inviteStatus || 'convite_enviado') : 'interno',
        });
      } else {
        await addDriver({
          adminId,
          name,
          email: email.trim(),
          phone,
          cnhNumber: cnhNumber || '00000000000',
          cnhCategory,
          cnhExpiration,
          status,
          isNetworkMember: isNetwork,
          inviteStatus: isNetwork ? 'convite_enviado' : 'interno',
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDriver(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cnhNumber.includes(searchTerm) ||
      (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Quadro de Motoristas & Rede
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adicione motoristas por e-mail para vinculá-los no app ou cadastre motoristas genéricos
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Motorista / Convidar</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nome, e-mail, CNH ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </div>

      {/* Carousel / Grid Controls & View Switcher */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {filteredDrivers.length} {filteredDrivers.length === 1 ? 'motorista listado' : 'motoristas listados'}
          {viewMode === 'carousel' && (
            <span className="hidden sm:inline text-blue-600 dark:text-blue-400 ml-2">
              • Deslize horizontalmente para navegar
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">
          {viewMode === 'carousel' && filteredDrivers.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Motorista Anterior"
                aria-label="Motorista Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Próximo Motorista"
                aria-label="Próximo Motorista"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'carousel'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Visualização em Carrossel"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Carrossel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drivers Cards List (Carousel / Grid) */}
      <div
        ref={carouselRef}
        className={viewMode === 'carousel' ? 'mobile-carousel-container' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}
      >
        {filteredDrivers.map((d) => {
          const expDate = new Date(d.cnhExpiration);
          const now = new Date();
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          const isExpired = diffDays <= 0;
          const isExpiringSoon = diffDays > 0 && diffDays <= 45;

          const driverTrips = dailyTrips.filter((t) => t.driverId === d.id);
          const completedCount = driverTrips.filter((t) => t.status === 'finalizado').length;

          const isNetwork = d.isNetworkMember || !!d.email;

          return (
            <div
              key={d.id}
              className={`${viewMode === 'carousel' ? 'mobile-carousel-card' : ''} bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center ${
                        isNetwork
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {d.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        CNH Cat.{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {d.cnhCategory}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Network / Status Badges */}
                  <div className="text-right space-y-1">
                    {d.status === 'ativo' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 block">
                        Disponível
                      </span>
                    )}
                    {d.status === 'em_viagem' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 block">
                        Em Viagem
                      </span>
                    )}

                    {isNetwork ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 block">
                        Membro da Rede
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 block">
                        Interno / Genérico
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs">
                  {d.email && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{d.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Nº CNH: <strong className="font-mono">{d.cnhNumber}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Validade:{' '}
                      <strong
                        className={
                          isExpired
                            ? 'text-rose-600'
                            : isExpiringSoon
                            ? 'text-amber-600'
                            : 'text-slate-700 dark:text-slate-200'
                        }
                      >
                        {d.cnhExpiration}
                      </strong>
                    </span>
                    {isExpired && (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Vencida!
                      </span>
                    )}
                  </div>

                  {d.phone && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{d.phone}</span>
                    </div>
                  )}
                </div>

                {/* Journeys count */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Jornadas realizadas:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{completedCount}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setViewHistoryDriver(d)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ver Histórico</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(d)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Editar motorista"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(d.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Excluir motorista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {confirmDeleteId === d.id && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-rose-800 dark:text-rose-200">
                    Remover cadastro do motorista {d.name}?
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-400 text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar / Convidar Motorista */}
      {/* Modal Adicionar / Convidar Motorista */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingDriver ? 'Editar Motorista' : 'Adicionar Motorista à Frota'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher in Modal */}
            <div className="px-4 sm:px-6 pt-4 shrink-0">
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDriverType('invite_email')}
                  className={`py-2 px-1 text-center rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px] sm:text-xs ${
                    driverType === 'invite_email'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Convidar E-mail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDriverType('internal')}
                  className={`py-2 px-1 text-center rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px] sm:text-xs ${
                    driverType === 'internal'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Sem E-mail (Geral)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {driverType === 'invite_email' ? (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-1 text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    Vinculação com a Rede do Motorista:
                  </p>
                  <p className="text-[11px] text-blue-600/90 dark:text-blue-300/80">
                    O motorista receberá o convite. Quando ele fizer login com esse e-mail no aplicativo,
                    ele será automaticamente vinculado à sua frota.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-semibold">Cadastro Genérico / Interno:</p>
                  <p className="text-[11px] text-slate-400">
                    Ideal para diaristas ou terceirizados. Ficará registrado na sua frota para controle de
                    quem estava com o carro no dia.
                  </p>
                </div>
              )}

              {driverType === 'invite_email' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail do Motorista no App *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="motorista@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo do Motorista *
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Registro da CNH
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 05492817342"
                    value={cnhNumber}
                    onChange={(e) => setCnhNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria da CNH
                  </label>
                  <select
                    value={cnhCategory}
                    onChange={(e) => setCnhCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="B">B (Carros e Utilitários)</option>
                    <option value="AB">AB (Motos e Carros)</option>
                    <option value="C">C (Caminhões Médios)</option>
                    <option value="D">D (Vans e Ônibus)</option>
                    <option value="E">E (Articulados)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Validade da CNH
                  </label>
                  <input
                    type="date"
                    value={cnhExpiration}
                    onChange={(e) => setCnhExpiration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  {loading
                    ? 'Salvando...'
                    : driverType === 'invite_email'
                    ? 'Enviar Convite & Vincular'
                    : 'Cadastrar Motorista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Journey History Modal */}
      {viewHistoryDriver && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden p-4 sm:p-6 space-y-4 animate-in fade-in sm:zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Histórico de Viagens • {viewHistoryDriver.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Registros de KM inicial e final conduzidos por este motorista
                </p>
              </div>
              <button
                onClick={() => setViewHistoryDriver(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {dailyTrips
                .filter((t) => t.driverId === viewHistoryDriver.id)
                .map((trip) => {
                  const dist = trip.endKm && trip.endKm >= trip.startKm ? trip.endKm - trip.startKm : 0;
                  return (
                    <div key={trip.id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {trip.date} • Veículo {trip.vehiclePlate}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            trip.status === 'finalizado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {trip.status === 'finalizado' ? 'Finalizada' : 'Em Andamento'}
                        </span>
                      </div>
                      <p className="text-slate-500">
                        Saída: {trip.startTime} (KM {trip.startKm.toLocaleString('pt-BR')}) &rarr; Chegada:{' '}
                        {trip.endTime || '--:--'} (KM {trip.endKm ? trip.endKm.toLocaleString('pt-BR') : '--'})
                      </p>
                      {trip.status === 'finalizado' && (
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          Distância percorrida: +{dist.toLocaleString('pt-BR')} KM
                        </p>
                      )}
                    </div>
                  );
                })}
              {dailyTrips.filter((t) => t.driverId === viewHistoryDriver.id).length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  Nenhuma viagem registrada ainda para este motorista.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
