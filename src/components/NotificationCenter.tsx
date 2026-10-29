import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types/index.ts';
import {
  Bell,
  BellRing,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  X,
  Volume2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  triggerTestPushNotification,
  evaluateVehicleMaintenance,
  MaintenanceAlertDetail,
  NotificationPermissionStatus,
} from '../services/notificationService.ts';

interface NotificationCenterProps {
  vehicles: Vehicle[];
  onNavigateToMaintenance?: () => void;
  onOpenMaintenanceModal?: (vehicleId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  vehicles,
  onNavigateToMaintenance,
  onOpenMaintenanceModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
  }, []);

  // Compute active maintenance alerts
  const alerts: MaintenanceAlertDetail[] = vehicles
    .map((v) => evaluateVehicleMaintenance(v))
    .filter((a): a is MaintenanceAlertDetail => a !== null);

  const overdueCount = alerts.filter((a) => a.isOverdue).length;
  const nearCount = alerts.filter((a) => a.isNearLimit).length;
  const totalCount = alerts.length;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermissionStatus());
    if (granted) {
      setTestResult('Permissão concedida! Notificações push ativadas.');
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await triggerTestPushNotification();
      setPermission(getNotificationPermissionStatus());
      if (ok) {
        setTestResult('Notificação push de teste enviada com sucesso!');
      } else {
        setTestResult('Não foi possível enviar a notificação. Verifique a permissão do navegador.');
      }
    } catch {
      setTestResult('Erro ao disparar notificação.');
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
        title="Central de Notificações de Manutenção"
        aria-label="Notificações"
      >
        {totalCount > 0 ? (
          <BellRing className="w-4 h-4 text-rose-500 animate-wiggle" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs">
            {totalCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          <div
            className="notification-backdrop fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs"
            onClick={() => setIsOpen(false)}
          />

          <div className="notification-popover bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4" />
                <span className="font-bold text-xs sm:text-sm">Notificações da Frota</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Permission Control Banner */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  Notificações Push no Navegador:
                </span>
                <span
                  className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                    permission === 'granted'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : permission === 'denied'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {permission === 'granted'
                    ? 'Ativadas'
                    : permission === 'denied'
                    ? 'Bloqueadas'
                    : 'Pendente'}
                </span>
              </div>

              {permission !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ativar Notificações no Dispositivo</span>
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Você receberá alertas em segundo plano
                  </span>
                  <button
                    onClick={handleTestNotification}
                    disabled={testing}
                    className="text-[11px] px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {testing ? 'Enviando...' : 'Testar Push'}
                  </button>
                </div>
              )}

              {testResult && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {testResult}
                </p>
              )}
            </div>

            {/* Alert List */}
            <div className="notification-scroll-body flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 min-h-36 max-h-80">
              {alerts.map((alert) => (
                <div key={alert.vehicleId} className="p-3.5 space-y-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {alert.isOverdue ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {alert.plate}
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-[140px]">
                        {alert.model}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.isOverdue
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {alert.isOverdue ? 'Vencida!' : `${alert.remainingKm} KM restam`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="pt-1 flex items-center justify-end gap-2">
                    {onOpenMaintenanceModal && (
                      <button
                        onClick={() => {
                          onOpenMaintenanceModal(alert.vehicleId);
                          setIsOpen(false);
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Registrar Revisão</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {alerts.length === 0 && (
                <div className="py-8 text-center px-4 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Tudo em dia com a frota!
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Nenhum veículo está próximo ou acima do limite de quilometragem da revisão preventiva.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {onNavigateToMaintenance && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    onNavigateToMaintenance();
                    setIsOpen(false);
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 w-full cursor-pointer"
                >
                  <span>Ver Painel Completo de Manutenção</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
