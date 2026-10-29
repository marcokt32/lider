import React from 'react';
import { Vehicle, DailyTrip, FleetCompany } from '../types/index.ts';
import {
  Car,
  Clock,
  Gauge,
  TrendingUp,
  CheckCircle2,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Sparkles,
} from 'lucide-react';

interface DriverDashboardProps {
  vehicles: Vehicle[];
  myTrips: DailyTrip[];
  activeTrip?: DailyTrip;
  currentFleet: FleetCompany;
  fleetsList: FleetCompany[];
  onSelectFleet: (fleet: FleetCompany) => void;
  onOpenTripModal: (type: 'start' | 'finish', vehicleId?: string, tripId?: string) => void;
  driverName: string;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  vehicles,
  myTrips,
  activeTrip,
  currentFleet,
  fleetsList,
  onSelectFleet,
  onOpenTripModal,
  driverName,
}) => {
  const availableVehicles = vehicles.filter((v) => v.status === 'disponivel');

  const myFinishedTrips = myTrips.filter((t) => t.status === 'finalizado');
  const myTotalKm = myFinishedTrips.reduce((acc, t) => {
    if (t.endKm && t.endKm >= t.startKm) return acc + (t.endKm - t.startKm);
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Fleet Network Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              A Rede &bull; Frota Selecionada
            </span>
            <p className="font-extrabold text-sm text-slate-900 dark:text-white">
              {currentFleet.name}
            </p>
          </div>
        </div>

        {fleetsList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-400 font-medium">Trocar frota:</span>
            {fleetsList.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFleet(f)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  currentFleet.id === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Painel do Motorista
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Olá, {driverName}!
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-lg">
              {activeTrip
                ? `Você está em rota com o veículo ${activeTrip.vehiclePlate}. Quando retornar ao pátio, registre o KM Final.`
                : 'Selecione um veículo disponível abaixo para iniciar sua jornada do dia.'}
            </p>
          </div>

          <div>
            {activeTrip ? (
              <button
                onClick={() => onOpenTripModal('finish', activeTrip.vehicleId, activeTrip.id)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Encerrar Viagem (Registrar KM Final)</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenTripModal('start')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                <span>Pegar Veículo (Registrar KM Inicial)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Trip Banner if in transit */}
      {activeTrip && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  {activeTrip.vehiclePlate}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 animate-pulse">
                  Em Trânsito
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Saída às <strong>{activeTrip.startTime}</strong> com <strong>{activeTrip.startKm.toLocaleString('pt-BR')} KM</strong>
              </p>
              {activeTrip.purpose && (
                <p className="text-[11px] text-slate-400 mt-0.5">Motivo: {activeTrip.purpose}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => onOpenTripModal('finish', activeTrip.vehicleId, activeTrip.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Informar KM Final de Chegada</span>
          </button>
        </div>
      )}

      {/* KPI Cards for Driver */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Carros Disponíveis */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Carros no Pátio</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {availableVehicles.length}
            </span>
            <span className="text-xs text-slate-400">veículos disponíveis</span>
          </div>
        </div>

        {/* Card 2: Status da Jornada */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Minha Jornada Hoje</span>
          <p className="text-lg font-black mt-2 text-slate-900 dark:text-white">
            {activeTrip ? '1 Viagem em Aberto' : 'Livre no Pátio'}
          </p>
        </div>

        {/* Card 3: Meus KM Rodados */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Meus KM Percorridos</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {myTotalKm.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-400">KM no histórico</span>
          </div>
        </div>
      </div>

      {/* Available Vehicles to Pick Up */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Car className="w-4 h-4 text-blue-600" />
          Veículos Disponíveis para Saída na Frota
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableVehicles.map((v) => {
            const kmSince = v.currentKm - (v.lastMaintenanceKm || 0);
            const interval = v.maintenanceIntervalKm || 10000;
            const remaining = interval - kmSince;
            const isOverdue = remaining <= 0;
            const isNear = remaining <= 500 && !isOverdue;

            return (
              <div
                key={v.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-blue-400 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {v.plate}
                    </span>
                    {isOverdue && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Revisão Vencida
                      </span>
                    )}
                    {isNear && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Revisão a {remaining} KM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Odômetro: {v.currentKm.toLocaleString('pt-BR')} KM
                  </p>
                </div>

                {!activeTrip && (
                  <button
                    onClick={() => onOpenTripModal('start', v.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Pegar</span>
                  </button>
                )}
              </div>
            );
          })}

          {availableVehicles.length === 0 && (
            <p className="text-xs text-slate-400 py-4 col-span-3 text-center">
              Nenhum carro disponível no pátio no momento.
            </p>
          )}
        </div>
      </div>

      {/* Driver Personal Trip History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Meu Histórico de Viagens
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {myTrips.map((trip) => {
            const dist = trip.endKm && trip.endKm >= trip.startKm ? trip.endKm - trip.startKm : null;
            return (
              <div key={trip.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {trip.vehiclePlate}
                    </span>
                    <span className="text-slate-400">{trip.date}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        trip.status === 'finalizado'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {trip.status === 'finalizado' ? 'Concluída' : 'Em Andamento'}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Saída: {trip.startTime} ({trip.startKm} KM) &rarr; Retorno: {trip.endTime || '--:--'} ({trip.endKm || '--'} KM)
                  </p>
                </div>

                {dist !== null && (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{dist.toLocaleString('pt-BR')} KM
                  </span>
                )}
              </div>
            );
          })}

          {myTrips.length === 0 && (
            <p className="text-xs text-slate-400 py-4 text-center">
              Você ainda não registrou nenhuma viagem nesta frota.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
