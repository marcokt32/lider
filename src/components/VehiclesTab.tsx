import React, { useState, useRef } from 'react';
import { Vehicle } from '../types/index.ts';
import { addVehicle, updateVehicle, deleteVehicle } from '../firebase/firestoreService.ts';
import {
  Car,
  Plus,
  Search,
  Wrench,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Play,
  X,
  Gauge,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Columns3,
} from 'lucide-react';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  adminId: string;
  onOpenTripModal: (type: 'start' | 'finish', vehicleId?: string) => void;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({
  vehicles,
  adminId,
  onOpenTripModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  // Form states
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('Fiat');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [lastMaintenanceKm, setLastMaintenanceKm] = useState<number>(0);
  const [maintenanceIntervalKm, setMaintenanceIntervalKm] = useState<number>(10000);
  const [status, setStatus] = useState<Vehicle['status']>('disponivel');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingVehicle(null);
    setPlate('');
    setModel('');
    setBrand('Fiat');
    setYear(new Date().getFullYear());
    setCurrentKm(0);
    setLastMaintenanceKm(0);
    setMaintenanceIntervalKm(10000);
    setStatus('disponivel');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setPlate(v.plate);
    setModel(v.model);
    setBrand(v.brand);
    setYear(v.year);
    setCurrentKm(v.currentKm);
    setLastMaintenanceKm(v.lastMaintenanceKm || 0);
    setMaintenanceIntervalKm(v.maintenanceIntervalKm || 10000);
    setStatus(v.status);
    setNotes(v.notes || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !model) return;

    try {
      setLoading(true);
      const formattedPlate = plate.toUpperCase().trim();

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          plate: formattedPlate,
          model,
          brand,
          year: Number(year),
          currentKm: Number(currentKm),
          lastMaintenanceKm: Number(lastMaintenanceKm),
          maintenanceIntervalKm: Number(maintenanceIntervalKm),
          status,
          notes,
        });
      } else {
        await addVehicle({
          adminId,
          plate: formattedPlate,
          model,
          brand,
          year: Number(year),
          currentKm: Number(currentKm),
          lastMaintenanceKm: Number(lastMaintenanceKm),
          maintenanceIntervalKm: Number(maintenanceIntervalKm),
          status,
          notes,
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
      await deleteVehicle(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'alert') {
      const kmSince = v.currentKm - (v.lastMaintenanceKm || 0);
      const remaining = (v.maintenanceIntervalKm || 10000) - kmSince;
      return matchesSearch && remaining <= 500;
    }
    return matchesSearch && v.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />
            Veículos da Frota
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastro, monitoramento de odômetro e status operacional de cada carro
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Carro</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por placa, modelo ou marca (ex: BRA2E19, Gol)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'disponivel', label: 'Disponíveis' },
            { id: 'em_uso', label: 'Em Uso' },
            { id: 'manutencao', label: 'Manutenção' },
            { id: 'alert', label: 'Revisão Pendente' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Carousel / Grid Controls & View Switcher */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {filteredVehicles.length} {filteredVehicles.length === 1 ? 'veículo listado' : 'veículos listados'}
          {viewMode === 'carousel' && (
            <span className="hidden sm:inline text-blue-600 dark:text-blue-400 ml-2">
              • Deslize horizontalmente para navegar
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">
          {viewMode === 'carousel' && filteredVehicles.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Carro Anterior"
                aria-label="Carro Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Próximo Carro"
                aria-label="Próximo Carro"
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

      {/* Vehicles Cards List (Carousel / Grid) */}
      <div
        ref={carouselRef}
        className={viewMode === 'carousel' ? 'mobile-carousel-container' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}
      >
        {filteredVehicles.map((v) => {
          const kmSince = v.currentKm - (v.lastMaintenanceKm || 0);
          const interval = v.maintenanceIntervalKm || 10000;
          const remaining = interval - kmSince;
          const percent = Math.min(Math.round((kmSince / interval) * 100), 100);
          const isOverdue = remaining <= 0;
          const isNear = remaining <= 500 && !isOverdue;

          return (
            <div
              key={v.id}
              className={`${viewMode === 'carousel' ? 'mobile-carousel-card' : ''} bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-all`}
            >
              <div>
                {/* Plate and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-black text-sm text-slate-800 dark:text-slate-200 tracking-wider">
                    {v.plate}
                  </div>

                  <div>
                    {v.status === 'disponivel' && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Disponível
                      </span>
                    )}
                    {v.status === 'em_uso' && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        Em Uso
                      </span>
                    )}
                    {v.status === 'manutencao' && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        Manutenção
                      </span>
                    )}
                  </div>
                </div>

                {/* Model and Details */}
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {v.brand} {v.model}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ano: {v.year}</p>

                {/* Current KM */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-blue-600" />
                    Odômetro Atual:
                  </span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {v.currentKm.toLocaleString('pt-BR')} KM
                  </span>
                </div>

                {/* Current Driver if In Use */}
                {v.status === 'em_uso' && v.currentDriverName && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2">
                    Condutor no dia: {v.currentDriverName}
                  </p>
                )}

                {/* Maintenance Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Revisão ({interval.toLocaleString('pt-BR')} km):
                    </span>
                    <span
                      className={`font-bold ${
                        isOverdue
                          ? 'text-rose-600'
                          : isNear
                          ? 'text-amber-600'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isOverdue ? 'Vencida!' : `${remaining} KM restantes`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverdue
                          ? 'bg-rose-500'
                          : isNear
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {v.notes && (
                  <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 italic">
                    "{v.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {v.status === 'disponivel' ? (
                  <button
                    onClick={() => onOpenTripModal('start', v.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Saída</span>
                  </button>
                ) : (
                  <div className="flex-1 text-[11px] font-semibold text-slate-400">
                    {v.status === 'em_uso' ? 'Em trânsito' : 'Em revisão'}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(v)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar veículo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(v.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Excluir veículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confirm Delete Warning */}
              {confirmDeleteId === v.id && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-rose-800 dark:text-rose-200">
                    Deseja realmente remover o veículo {v.plate}?
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-400 text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
                    >
                      Confirmar Exclusão
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Cadastrar / Editar Veículo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingVehicle ? 'Editar Veículo da Frota' : 'Cadastrar Novo Carro na Frota'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Placa (Mercosul ou Antiga) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRA2E19"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marca / Fabricante *
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fiat">Fiat</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Renault">Renault</option>
                    <option value="Ford">Ford</option>
                    <option value="Honda">Honda</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo do Carro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Strada Freedom 1.3 CS"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ano de Fabricação
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={1990}
                    max={2030}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    KM Atual *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={currentKm}
                    onChange={(e) => setCurrentKm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    KM da Última Revisão
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lastMaintenanceKm}
                    onChange={(e) => setLastMaintenanceKm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Revisão a cada (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={maintenanceIntervalKm}
                    onChange={(e) => setMaintenanceIntervalKm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Operacional
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Vehicle['status'])}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="disponivel">Disponível no Pátio</option>
                    <option value="em_uso">Em Uso / Em Viagem</option>
                    <option value="manutencao">Em Manutenção / Oficina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações / Setor
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Atendimento Zona Norte..."
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
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all disabled:opacity-50 text-center cursor-pointer"
                >
                  {loading ? 'Salvando...' : editingVehicle ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
