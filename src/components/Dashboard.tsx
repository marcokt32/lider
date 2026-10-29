import React from 'react';
import { Vehicle, Driver, DailyTrip, Maintenance } from '../types/index.ts';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Wrench,
  UserCheck,
  Plus,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ActiveTab } from './Navbar.tsx';

interface DashboardProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  dailyTrips: DailyTrip[];
  maintenances: Maintenance[];
  onOpenTripModal: (type: 'start' | 'finish', vehicleId?: string, tripId?: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onSeedDemoData: () => void;
  isSeeding: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  vehicles,
  drivers,
  dailyTrips,
  maintenances,
  onOpenTripModal,
  setActiveTab,
  onSeedDemoData,
  isSeeding,
}) => {
  // Counters
  const availableVehicles = vehicles.filter((v) => v.status === 'disponivel');
  const inUseVehicles = vehicles.filter((v) => v.status === 'em_uso');
  const inMaintenanceVehicles = vehicles.filter((v) => v.status === 'manutencao');

  // Active trips
  const activeTrips = dailyTrips.filter((t) => t.status === 'em_andamento');
  const finishedTrips = dailyTrips.filter((t) => t.status === 'finalizado');

  // Total KM traveled in finished trips
  const totalKmTraveled = finishedTrips.reduce((acc, trip) => {
    if (trip.endKm && trip.endKm >= trip.startKm) {
      return acc + (trip.endKm - trip.startKm);
    }
    return acc;
  }, 0);

  // Maintenance alerts: vehicles where (currentKm - lastMaintenanceKm) >= maintenanceIntervalKm or close to it
  const maintenanceAlerts = vehicles.map((v) => {
    const kmSinceLast = v.currentKm - (v.lastMaintenanceKm || 0);
    const interval = v.maintenanceIntervalKm || 10000;
    const remainingKm = interval - kmSinceLast;
    const progressPercent = Math.min(Math.round((kmSinceLast / interval) * 100), 100);
    const isOverdue = remainingKm <= 0;
    const isUrgent = remainingKm <= 500;
    return {
      vehicle: v,
      kmSinceLast,
      interval,
      remainingKm,
      progressPercent,
      isOverdue,
      isUrgent,
    };
  }).filter((item) => item.isUrgent || item.isOverdue);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold backdrop-blur-xs mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Gestão de Frota Corporativa Líder</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Painel Geral de Controle
            </h1>
            <p className="text-blue-200/90 text-xs sm:text-sm mt-1.5 max-w-xl">
              Monitore a disponibilidade dos carros, jornadas abertas com KM Inicial e alertas de
              revisão preventiva a cada 10.000 KM.
            </p>
          </div>

          {/* Quick Actions Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <button
              onClick={() => onOpenTripModal('start')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar KM Inicial (Saída)</span>
            </button>
            <button
              onClick={() => onOpenTripModal('finish')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar KM Final (Retorno)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty Fleet helper */}
      {vehicles.length === 0 && (
        <div className="p-6 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100">
                Sua frota ainda não possui veículos cadastrados!
              </h3>
              <p className="text-xs text-blue-700/80 dark:text-blue-300">
                Deseja carregar dados de demonstração com veículos (Strada, Gol, Onix, Fiorino), motoristas e alertas de revisão para testar imediatamente?
              </p>
            </div>
          </div>
          <button
            onClick={onSeedDemoData}
            disabled={isSeeding}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSeeding ? 'Carregando frota...' : 'Carregar Frota de Exemplo'}</span>
          </button>
        </div>
      )}

      {/* Preventive Maintenance Alert Banner (Clickable Shortcut to Maintenance) */}
      {maintenanceAlerts.length > 0 && (
        <div
          onClick={() => setActiveTab('maintenance')}
          className="p-4 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl hover:border-amber-500 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl mt-0.5 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  Aviso de Manutenção Preventiva Necessária ({maintenanceAlerts.length})
                  <span className="text-xs font-normal text-amber-700 dark:text-amber-300 group-hover:underline flex items-center gap-1">
                    (Clique para gerenciar &rarr;)
                  </span>
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                  Veículos que atingiram ou estão a menos de 500 KM da revisão preventiva programada a cada {vehicles[0]?.maintenanceIntervalKm || 10000} KM:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {maintenanceAlerts.map((item) => (
                    <span
                      key={item.vehicle.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                        item.isOverdue
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <strong>{item.vehicle.plate}</strong> ({item.vehicle.model}):{' '}
                      {item.isOverdue
                        ? `Vencida há ${Math.abs(item.remainingKm)} KM`
                        : `Faltam ${item.remainingKm} KM`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 hidden sm:flex items-center gap-1">
              Ver Manutenções &rarr;
            </span>
          </div>
        </div>
      )}

      {/* 4 Interactive KPI Shortcut Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Carros Disponíveis -> Shortcut to VehiclesTab */}
        <div
          onClick={() => setActiveTab('vehicles')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
              Carros Disponíveis
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {availableVehicles.length}
            </span>
            <span className="text-xs text-slate-400">
              de {vehicles.length} na frota
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{
                width: vehicles.length > 0 ? `${(availableVehicles.length / vehicles.length) * 100}%` : '0%',
              }}
            />
          </div>
        </div>

        {/* Card 2: Em Uso (Viagens Abertas) -> Shortcut to TripsTab */}
        <div
          onClick={() => setActiveTab('trips')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1">
              Jornadas em Aberto
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {activeTrips.length}
            </span>
            <span className="text-xs text-slate-400">
              carro(s) em trânsito
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{
                width: vehicles.length > 0 ? `${(inUseVehicles.length / vehicles.length) * 100}%` : '0%',
              }}
            />
          </div>
        </div>

        {/* Card 3: KM Rodados -> Shortcut to ReportsTab */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
              KM Rodados em Rotas
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {totalKmTraveled.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-400">KM totais</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {finishedTrips.length} jornadas concluídas
          </p>
        </div>

        {/* Card 4: Motoristas Cadastrados -> Shortcut to DriversTab */}
        <div
          onClick={() => setActiveTab('drivers')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-purple-600 transition-colors flex items-center gap-1">
              Motoristas no Quadro
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {drivers.length}
            </span>
            <span className="text-xs text-slate-400">
              {drivers.filter((d) => d.status === 'em_viagem').length} em viagem
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {inMaintenanceVehicles.length} veículo(s) em revisão
          </p>
        </div>
      </div>

      {/* Grid: Active Trips right now & Fleet status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Trips (Em Andamento) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Veículos em Uso Agora
              </h3>
              <p className="text-[11px] text-slate-400">Jornadas com KM Inicial aguardando KM Final</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              {activeTrips.length}
            </span>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {activeTrips.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Nenhum veículo em trânsito no momento.
                </p>
                <button
                  onClick={() => onOpenTripModal('start')}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Registrar Saída com KM Inicial
                </button>
              </div>
            ) : (
              activeTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      {trip.vehiclePlate}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Saída: {trip.startTime}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Condutor: <span className="font-bold">{trip.driverName}</span>
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>KM Inicial: <strong>{trip.startKm.toLocaleString('pt-BR')}</strong></span>
                    <span>{trip.fuelLevel || 'Combustível OK'}</span>
                  </div>
                  <button
                    onClick={() => onOpenTripModal('finish', trip.vehicleId, trip.id)}
                    className="w-full py-2 mt-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Encerrar Viagem (KM Final)</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Fleet Quick Overview & Maintenance Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                Quilometragem & Manutenção Preventiva dos Carros
              </h3>
              <p className="text-[11px] text-slate-400">
                Progresso em direção à revisão programada a cada {vehicles[0]?.maintenanceIntervalKm || 10000} KM
              </p>
            </div>
            <button
              onClick={() => setActiveTab('vehicles')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar Frota</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto">
            {vehicles.map((v) => {
              const kmSinceLast = v.currentKm - (v.lastMaintenanceKm || 0);
              const interval = v.maintenanceIntervalKm || 10000;
              const remaining = interval - kmSinceLast;
              const percent = Math.min(Math.round((kmSinceLast / interval) * 100), 100);
              const isOverdue = remaining <= 0;
              const isNear = remaining <= 500 && !isOverdue;

              return (
                <div key={v.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                        {v.plate.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {v.plate}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {v.brand} {v.model} ({v.year})
                          </span>
                          {v.status === 'disponivel' && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Disponível
                            </span>
                          )}
                          {v.status === 'em_uso' && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Em Uso
                            </span>
                          )}
                          {v.status === 'manutencao' && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Manutenção
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          KM Atual: <strong className="text-slate-700 dark:text-slate-200">{v.currentKm.toLocaleString('pt-BR')} KM</strong>
                          {v.currentDriverName && ` • Com: ${v.currentDriverName}`}
                        </p>
                      </div>
                    </div>

                    {/* Maintenance Alert Badge */}
                    <div className="text-right sm:w-48">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Revisão {interval.toLocaleString('pt-BR')} km:</span>
                        <span
                          className={`font-bold ${
                            isOverdue
                              ? 'text-rose-600'
                              : isNear
                              ? 'text-amber-600'
                              : 'text-slate-600 dark:text-slate-300'
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
