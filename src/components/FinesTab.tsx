import React, { useState } from 'react';
import { Fine, Vehicle, DailyTrip } from '../types/index.ts';
import { addFine, updateFineStatus, findDriverForVehicleOnDate, deleteFine } from '../firebase/firestoreService.ts';
import {
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  DollarSign,
  User,
  Car,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';

interface FinesTabProps {
  fines: Fine[];
  vehicles: Vehicle[];
  dailyTrips: DailyTrip[];
  adminId: string;
}

export const FinesTab: React.FC<FinesTabProps> = ({
  fines,
  vehicles,
  dailyTrips,
  adminId,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchingDriver, setSearchingDriver] = useState(false);

  // Form
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:30');
  const [infraction, setInfraction] = useState('Transitar em velocidade superior à máxima em até 20%');
  const [amount, setAmount] = useState<number>(130.16);
  const [points, setPoints] = useState<number>(4);
  const [driverId, setDriverId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverFoundMsg, setDriverFoundMsg] = useState('');

  const openCreateModal = () => {
    if (vehicles.length > 0) setVehicleId(vehicles[0].id);
    setDate(new Date().toISOString().split('T')[0]);
    setTime('14:30');
    setInfraction('Transitar em velocidade superior à máxima em até 20%');
    setAmount(130.16);
    setPoints(4);
    setDriverId('');
    setDriverName('');
    setDriverFoundMsg('');
    setModalOpen(true);
  };

  // Intelligent driver lookup
  const handleAutoFindDriver = async () => {
    if (!vehicleId || !date) return;
    setSearchingDriver(true);
    setDriverFoundMsg('');

    // Check local trips first
    const trip = dailyTrips.find((t) => t.vehicleId === vehicleId && t.date === date);
    if (trip) {
      setDriverId(trip.driverId);
      setDriverName(trip.driverName);
      setDriverFoundMsg(`Encontrado nas viagens de ${date}: ${trip.driverName}`);
      setSearchingDriver(false);
      return;
    }

    // Try server search
    const result = await findDriverForVehicleOnDate(adminId, vehicleId, date);
    if (result) {
      setDriverId(result.driverId);
      setDriverName(result.driverName);
      setDriverFoundMsg(`Identificado automaticamente: ${result.driverName}`);
    } else {
      setDriverFoundMsg('Nenhuma jornada registrada com este carro nesta data.');
    }
    setSearchingDriver(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = vehicles.find((veh) => veh.id === vehicleId);
    if (!v) return;

    try {
      setLoading(true);
      await addFine({
        adminId,
        vehicleId: v.id,
        vehiclePlate: v.plate,
        driverId,
        driverName: driverName || 'Não identificado',
        date,
        time,
        infraction,
        amount: Number(amount),
        points: Number(points),
        status: 'pendente',
      });
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStatusChange = async (fineId: string, newStatus: Fine['status']) => {
    try {
      await updateFineStatus(fineId, newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFine = async (fineId: string) => {
    try {
      await deleteFine(fineId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const totalFinesAmount = fines.reduce((acc, f) => acc + (f.amount || 0), 0);
  const totalPoints = fines.reduce((acc, f) => acc + (f.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Controle de Multas & Infrações
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Associação inteligente ao motorista do dia, pontuação e gestão de pagamento
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Notificação de Multa</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total de Notificações</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {fines.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Valor Total de Multas</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            R$ {totalFinesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Pontos Acumulados</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {totalPoints} pontos
          </p>
        </div>
      </div>

      {/* Fines List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Infrações Registradas
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {fines.map((fine) => (
            <div
              key={fine.id}
              className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {fine.vehiclePlate}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {fine.infraction}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {fine.points} Pontos
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Condutor identificado:{' '}
                    <strong className="text-slate-800 dark:text-slate-100">
                      {fine.driverName || 'Não atribuído'}
                    </strong>
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fine.date} {fine.time && `às ${fine.time}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Amount */}
              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  R$ {fine.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>

                <select
                  value={fine.status}
                  onChange={(e) => handleStatusChange(fine.id, e.target.value as Fine['status'])}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none ${
                    fine.status === 'paga'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : fine.status === 'recurso'
                      ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  <option value="pendente">Pendente de Pagamento</option>
                  <option value="paga">Multa Paga</option>
                  <option value="recurso">Em Recurso / Contestação</option>
                </select>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(fine.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Excluir notificação de multa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {confirmDeleteId === fine.id && (
                <div className="w-full mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-rose-800 dark:text-rose-200">
                    Deseja realmente excluir este lançamento de multa ({fine.vehiclePlate})?
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 text-slate-600 dark:text-slate-400 text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFine(fine.id)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {fines.length === 0 && (
            <p className="text-center py-8 text-xs text-slate-400">
              Nenhuma multa ou infração cadastrada. Ótimo trabalho!
            </p>
          )}
        </div>
      </div>

      {/* Modal Lançar Multa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-amber-600 to-rose-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">Lançar Multa ou Infração de Trânsito</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Veículo Autuado *
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Infração *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Horário da Infração
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Smart Driver Finder Button */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    Localização Inteligente do Motorista:
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFindDriver}
                    disabled={searchingDriver}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors cursor-pointer text-center"
                  >
                    {searchingDriver ? 'Buscando...' : '🔎 Localizar Condutor no Dia'}
                  </button>
                </div>
                {driverFoundMsg && (
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {driverFoundMsg}
                  </p>
                )}
                <input
                  type="text"
                  placeholder="Nome do motorista atribuído"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição da Infração *
                </label>
                <input
                  type="text"
                  required
                  value={infraction}
                  onChange={(e) => setInfraction(e.target.value)}
                  placeholder="Ex: Excesso de velocidade até 20% acima da máxima permitida"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pontos na CNH *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    required
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500"
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
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all disabled:opacity-50 text-center cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Lançar Infração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
