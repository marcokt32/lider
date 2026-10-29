import React, { useState } from 'react';
import { Maintenance, Vehicle } from '../types/index.ts';
import { addMaintenance, completeMaintenance, deleteMaintenance } from '../firebase/firestoreService.ts';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Calendar,
  DollarSign,
  Building,
  Car,
  FileText,
  X,
  Gauge,
  ShieldAlert,
  BellRing,
  Volume2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  triggerTestPushNotification,
} from '../services/notificationService.ts';

interface MaintenanceTabProps {
  maintenances: Maintenance[];
  vehicles: Vehicle[];
  adminId: string;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  maintenances,
  vehicles,
  adminId,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(() => getNotificationPermissionStatus());
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    setPushStatus(getNotificationPermissionStatus());
    if (granted) {
      setTestMsg('Permissão concedida! Você receberá alertas push.');
      setTimeout(() => setTestMsg(null), 4000);
    }
  };

  const handleTestPush = async () => {
    setTestMsg('Enviando...');
    const ok = await triggerTestPushNotification();
    setPushStatus(getNotificationPermissionStatus());
    if (ok) {
      setTestMsg('Notificação de teste enviada!');
    } else {
      setTestMsg('Aviso: Permissão não concedida no navegador.');
    }
    setTimeout(() => setTestMsg(null), 4000);
  };

  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Revisão Preventiva 10.000 KM (Óleo + Filtros)');
  const [kmAtService, setKmAtService] = useState<number>(0);
  const [nextKmTarget, setNextKmTarget] = useState<number>(0);
  const [cost, setCost] = useState<number>(450);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workshop, setWorkshop] = useState('AutoCenter & Mecânica Especializada');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Maintenance['status']>('concluida');

  const openCreateModal = (vId?: string) => {
    const v = vId ? vehicles.find((veh) => veh.id === vId) : vehicles[0];
    if (v) {
      setSelectedVehicleId(v.id);
      setKmAtService(v.currentKm);
      setNextKmTarget(v.currentKm + (v.maintenanceIntervalKm || 10000));
    } else {
      setSelectedVehicleId('');
      setKmAtService(0);
      setNextKmTarget(10000);
    }
    setDate(new Date().toISOString().split('T')[0]);
    setCost(450);
    setNotes('');
    setStatus('concluida');
    setModalOpen(true);
  };

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find((veh) => veh.id === vId);
    if (v) {
      setKmAtService(v.currentKm);
      setNextKmTarget(v.currentKm + (v.maintenanceIntervalKm || 10000));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;

    const v = vehicles.find((veh) => veh.id === selectedVehicleId);
    if (!v) return;

    try {
      setLoading(true);
      await addMaintenance({
        adminId,
        vehicleId: v.id,
        vehiclePlate: v.plate,
        serviceType,
        kmAtService: Number(kmAtService),
        nextKmTarget: Number(nextKmTarget),
        cost: Number(cost),
        date,
        workshop,
        notes,
        status,
      });

      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleComplete = async (m: Maintenance) => {
    try {
      await completeMaintenance(m.id, m.vehicleId, m.kmAtService);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    try {
      await deleteMaintenance(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate preventive alerts for all vehicles
  const preventiveStatusList = vehicles.map((v) => {
    const kmSinceLast = v.currentKm - (v.lastMaintenanceKm || 0);
    const interval = v.maintenanceIntervalKm || 10000;
    const remaining = interval - kmSinceLast;
    const percent = Math.min(Math.round((kmSinceLast / interval) * 100), 100);
    const isOverdue = remaining <= 0;
    const isNear = remaining <= 500 && !isOverdue;
    return {
      vehicle: v,
      kmSinceLast,
      interval,
      remaining,
      percent,
      isOverdue,
      isNear,
    };
  });

  const totalCost = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            Controle de Manutenção Preventiva & Corretiva
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avisos automáticos de revisão a cada 10.000 KM (ou configurado), histórico de serviços e custos
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nova Manutenção</span>
        </button>
      </div>

      {/* Push Notification System Status Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Sistema de Notificações Push para Manutenção Preventiva
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {pushStatus === 'granted' ? 'Ativado no Navegador' : 'Aguardando Permissão'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              O sistema avisa automaticamente o gestor e motoristas quando qualquer carro estiver a <strong>500 KM ou menos</strong> da revisão ou com o odômetro excedido.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pushStatus !== 'granted' ? (
            <button
              onClick={handleRequestPush}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ativar Notificações Push</span>
            </button>
          ) : (
            <button
              onClick={handleTestPush}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Testar Disparo Push</span>
            </button>
          )}
          {testMsg && (
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 animate-in fade-in">
              {testMsg}
            </span>
          )}
        </div>
      </div>

      {/* Preventive Maintenance Radar Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Radar de Manutenção Preventiva por Veículo
              </h3>
              <p className="text-[11px] text-slate-400">
                Acompanhamento contínuo da quilometragem para próximas revisões
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Gasto Total: <span className="text-blue-600 dark:text-blue-400">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {preventiveStatusList.map((item) => (
            <div
              key={item.vehicle.id}
              className={`p-4 rounded-xl border transition-all ${
                item.isOverdue
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
                  : item.isNear
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {item.vehicle.plate} • {item.vehicle.model}
                </span>
                {item.isOverdue ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                    Vencida!
                  </span>
                ) : item.isNear ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    Atenção
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Em Dia
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Odômetro:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {item.vehicle.currentKm.toLocaleString('pt-BR')} KM
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Última Revisão:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {(item.vehicle.lastMaintenanceKm || 0).toLocaleString('pt-BR')} KM
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Ciclo de Revisão:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  A cada {item.interval.toLocaleString('pt-BR')} KM
                </span>
              </div>

              {/* Progress */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-500">Progresso do Ciclo:</span>
                  <span
                    className={`font-bold ${
                      item.isOverdue
                        ? 'text-rose-600'
                        : item.isNear
                        ? 'text-amber-600'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.isOverdue
                      ? `Excedeu ${Math.abs(item.remaining)} KM`
                      : `${item.remaining} KM restantes`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.isOverdue
                        ? 'bg-rose-500'
                        : item.isNear
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => openCreateModal(item.vehicle.id)}
                className="mt-3.5 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Registrar Revisão do {item.vehicle.plate}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Histórico de Manutenções Realizadas
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {maintenances.map((m) => (
            <div key={m.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {m.vehiclePlate}
                    </span>
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                      {m.serviceType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === 'concluida'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {m.status === 'concluida' ? 'Concluída' : 'Agendada'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {m.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      Feita com {m.kmAtService.toLocaleString('pt-BR')} KM
                    </span>
                    {m.workshop && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {m.workshop}
                      </span>
                    )}
                  </div>

                  {m.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                      Obs: {m.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  R$ {m.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {m.status === 'agendada' && (
                  <button
                    onClick={() => handleComplete(m)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Concluir</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(m.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Excluir registro de manutenção"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {confirmDeleteId === m.id && (
                <div className="w-full mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-rose-800 dark:text-rose-200">
                    Deseja excluir este registro de manutenção ({m.vehiclePlate} - {m.serviceType})?
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
                      onClick={() => handleDeleteMaintenance(m.id)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {maintenances.length === 0 && (
            <p className="text-center py-8 text-xs text-slate-400">
              Nenhum registro de manutenção inserido ainda.
            </p>
          )}
        </div>
      </div>

      {/* Modal Nova Manutenção */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in sm:zoom-in-95 slide-in-from-bottom-6 sm:slide-in-from-bottom-0">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">Registrar Manutenção de Veículo</h3>
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
                  Veículo *
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um carro...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.brand} {v.model} (Atual: {v.currentKm} KM)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Serviço *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Revisão Preventiva 10.000 KM (Óleo + Filtros)">
                    Revisão Preventiva 10.000 KM (Óleo + Filtros)
                  </option>
                  <option value="Troca de Óleo de Motor e Filtros">
                    Troca de Óleo de Motor e Filtros
                  </option>
                  <option value="Pastilhas e Discos de Freio">Pastilhas e Discos de Freio</option>
                  <option value="Substituição e Calibragem de Pneus">
                    Substituição e Calibragem de Pneus
                  </option>
                  <option value="Alinhamento e Balanceamento 3D">Alinhamento e Balanceamento 3D</option>
                  <option value="Correia Dentada e Tensores">Correia Dentada e Tensores</option>
                  <option value="Suspensão e Amortecedores">Suspensão e Amortecedores</option>
                  <option value="Manutenção Elétrica / Bateria">Manutenção Elétrica / Bateria</option>
                  <option value="Outro Serviço Corretivo">Outro Serviço Corretivo</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    KM no Momento da Revisão *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={kmAtService}
                    onChange={(e) => setKmAtService(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custo Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Realização
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Maintenance['status'])}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="concluida">Concluída (Zera Alerta Preventivo)</option>
                    <option value="agendada">Agendada (Carro em Oficina)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Oficina Mecânica / Concessionária
                </label>
                <input
                  type="text"
                  value={workshop}
                  onChange={(e) => setWorkshop(e.target.value)}
                  placeholder="Ex: Concessionária Fiat, Oficina Central..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas das Peças / Serviços
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Trocado óleo 5W30 sintético, filtro de óleo e filtro de combustível..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
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
                  {loading ? 'Salvando...' : 'Salvar Manutenção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
