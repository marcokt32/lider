import React, { useState } from 'react';
import { DailyTrip, Vehicle, Driver } from '../types/index.ts';
import { deleteDailyTrip } from '../firebase/firestoreService.ts';
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  Gauge,
  TrendingUp,
  User,
  Car,
  Fuel,
  FileCheck,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface TripsTabProps {
  trips: DailyTrip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onOpenTripModal: (type: 'start' | 'finish', vehicleId?: string, tripId?: string) => void;
}

export const TripsTab: React.FC<TripsTabProps> = ({
  trips,
  vehicles,
  drivers,
  onOpenTripModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'em_andamento' | 'finalizado'>('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleDeleteTrip = async (trip: DailyTrip) => {
    try {
      setDeletingId(trip.id);
      await deleteDailyTrip(trip.id, trip);
      setConfirmDeleteId(null);
      setFeedbackMsg(`Jornada do veículo ${trip.vehiclePlate} (${trip.date}) foi excluída com sucesso.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao excluir jornada:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch =
      t.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
      t.driverName.toLowerCase().includes(search.toLowerCase()) ||
      t.date.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Controle Diário de KM Inicial & KM Final
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro de saídas e retornos, motorista responsável no dia e quilometragem percorrida
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenTripModal('start')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Saída (KM Inicial)</span>
          </button>
          <button
            onClick={() => onOpenTripModal('finish')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✓ Retorno (KM Final)</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
            aria-label="Fechar mensagem"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por placa, motorista ou data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Todas ({trips.length})
          </button>
          <button
            onClick={() => setFilter('em_andamento')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold ${
              filter === 'em_andamento'
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Em Andamento ({trips.filter((t) => t.status === 'em_andamento').length})
          </button>
          <button
            onClick={() => setFilter('finalizado')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold ${
              filter === 'finalizado'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Finalizadas ({trips.filter((t) => t.status === 'finalizado').length})
          </button>
        </div>
      </div>

      {/* Trips Cards / List */}
      <div className="space-y-3">
        {filteredTrips.map((trip) => {
          const isFinished = trip.status === 'finalizado';
          const distance = isFinished && trip.endKm && trip.endKm >= trip.startKm
            ? trip.endKm - trip.startKm
            : null;

          return (
            <div
              key={trip.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all shadow-xs ${
                !isFinished
                  ? 'border-amber-300/80 dark:border-amber-800/80 bg-amber-500/[0.02]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Vehicle & Driver Details */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      !isFinished
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                    }`}
                  >
                    <Car className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {trip.vehiclePlate}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !isFinished
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isFinished ? 'Viagem Concluída' : 'Em Trânsito (Aguardando Retorno)'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {trip.date}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      Motorista do dia: <span className="font-bold text-slate-900 dark:text-white">{trip.driverName}</span>
                    </p>

                    {trip.purpose && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Motivo: {trip.purpose}
                      </p>
                    )}
                  </div>
                </div>

                {/* KM Numbers and Times */}
                <div className="flex items-center gap-4 sm:gap-6 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Saída</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{trip.startTime}</p>
                    <p className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {trip.startKm.toLocaleString('pt-BR')} KM
                    </p>
                  </div>

                  <div className="text-slate-300 dark:text-slate-600">&rarr;</div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Retorno</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {trip.endTime || '--:--'}
                    </p>
                    <p className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {trip.endKm ? `${trip.endKm.toLocaleString('pt-BR')} KM` : 'Pendente'}
                    </p>
                  </div>

                  {distance !== null && (
                    <div className="pl-3 border-l border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Rodado</p>
                      <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{distance.toLocaleString('pt-BR')} KM
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions: Finish and Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  {!isFinished && (
                    <button
                      onClick={() => onOpenTripModal('finish', trip.vehicleId, trip.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Informar KM Final</span>
                    </button>
                  )}

                  <button
                    onClick={() => setConfirmDeleteId(trip.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer"
                    title="Excluir este registro de jornada"
                    aria-label="Excluir jornada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confirmation Dialog Box */}
              {confirmDeleteId === trip.id && (
                <div className="mt-3.5 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2.5 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-lg shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-rose-950 dark:text-rose-100">
                        Excluir registro da jornada: <span className="font-mono">{trip.vehiclePlate}</span> em {trip.date}?
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                        {!isFinished
                          ? 'Atenção: Esta jornada ainda está em andamento. Ao excluí-la, o veículo e o condutor serão liberados imediatamente para novas saídas.'
                          : 'Este histórico de saída e retorno será permanentemente removido.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === trip.id}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTrip(trip)}
                      disabled={deletingId === trip.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === trip.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Excluindo...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirmar Exclusão</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Extra details row: Checklist & Fuel */}
              {(trip.checklistNotes || trip.fuelLevel) && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                  {trip.fuelLevel && (
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      Combustível: {trip.fuelLevel}
                    </span>
                  )}
                  {trip.checklistNotes && (
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {trip.checklistNotes}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredTrips.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhum registro de uso diário encontrado.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Registre a saída de um veículo com o KM Inicial para acompanhar a rota do dia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
