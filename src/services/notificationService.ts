/**
 * Líder - Gestor de Frota
 * Push Notification Service for Preventive Maintenance Alerts
 */

import { Vehicle } from '../types/index.ts';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface MaintenanceAlertDetail {
  vehicleId: string;
  plate: string;
  model: string;
  currentKm: number;
  intervalKm: number;
  remainingKm: number;
  isOverdue: boolean;
  isNearLimit: boolean;
  message: string;
}

const STORAGE_KEY_NOTIFIED = 'lider_notified_maintenance_v1';

/**
 * Register Service Worker if supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (error) {
    console.warn('Falha ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return false;
  }
}

/**
 * Evaluate a single vehicle's maintenance status
 */
export function evaluateVehicleMaintenance(vehicle: Vehicle): MaintenanceAlertDetail | null {
  const lastKm = vehicle.lastMaintenanceKm || 0;
  const kmSince = vehicle.currentKm - lastKm;
  const interval = vehicle.maintenanceIntervalKm || 10000;
  const remaining = interval - kmSince;

  const isOverdue = remaining <= 0;
  // Alert when within 500 km or overdue
  const isNearLimit = remaining <= 500 && !isOverdue;

  if (!isOverdue && !isNearLimit) {
    return null;
  }

  let message = '';
  if (isOverdue) {
    const over = Math.abs(remaining);
    message = `Vencida! O veículo ${vehicle.plate} (${vehicle.brand} ${vehicle.model}) ultrapassou a revisão preventiva em ${over.toLocaleString('pt-BR')} KM (Odômetro: ${vehicle.currentKm.toLocaleString('pt-BR')} KM).`;
  } else {
    message = `Atenção: O veículo ${vehicle.plate} (${vehicle.brand} ${vehicle.model}) está a apenas ${remaining.toLocaleString('pt-BR')} KM da revisão preventiva de ${interval.toLocaleString('pt-BR')} KM (Odômetro: ${vehicle.currentKm.toLocaleString('pt-BR')} KM).`;
  }

  return {
    vehicleId: vehicle.id,
    plate: vehicle.plate,
    model: `${vehicle.brand} ${vehicle.model}`,
    currentKm: vehicle.currentKm,
    intervalKm: interval,
    remainingKm: remaining,
    isOverdue,
    isNearLimit,
    message,
  };
}

/**
 * Low-level dispatch to push notification (Service Worker or Notification API)
 */
export async function sendNativeNotification(
  title: string,
  body: string,
  tag: string = 'lider-fleet-alert'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag,
    data: { url: '/' },
  };

  // Try service worker first for mobile PWA support with timeout
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 400)),
      ]);
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to standard window Notification
  try {
    new Notification(title, options);
    return true;
  } catch (err) {
    console.warn('Erro ao disparar Notification:', err);
    return false;
  }
}

/**
 * Check de-duplication cache
 */
function getNotifiedCache(): Record<string, { lastKm: number; isOverdue: boolean; timestamp: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFIED);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function updateNotifiedCache(vehicleId: string, currentKm: number, isOverdue: boolean) {
  try {
    const cache = getNotifiedCache();
    cache[vehicleId] = {
      lastKm: currentKm,
      isOverdue,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_NOTIFIED, JSON.stringify(cache));
  } catch (e) {
    console.warn('Falha ao salvar cache de notificações:', e);
  }
}

/**
 * Evaluates entire fleet and dispatches push notifications for any new alerts
 */
export async function checkFleetMaintenanceAndNotify(
  vehicles: Vehicle[],
  forceNotify: boolean = false
): Promise<MaintenanceAlertDetail[]> {
  const alerts: MaintenanceAlertDetail[] = [];
  const permission = getNotificationPermissionStatus();
  const cache = getNotifiedCache();

  for (const vehicle of vehicles) {
    const alert = evaluateVehicleMaintenance(vehicle);
    if (!alert) continue;

    alerts.push(alert);

    if (permission === 'granted') {
      const cached = cache[vehicle.id];
      // Notify if forced, or never notified, or status transitioned to overdue, or driven >= 150 km since last alert
      const shouldNotify =
        forceNotify ||
        !cached ||
        (!cached.isOverdue && alert.isOverdue) ||
        Math.abs(vehicle.currentKm - cached.lastKm) >= 150;

      if (shouldNotify) {
        const title = alert.isOverdue
          ? `🚨 REVISÃO VENCIDA: ${alert.plate}`
          : `⚠️ Manutenção Próxima: ${alert.plate}`;

        await sendNativeNotification(title, alert.message, `maintenance-${alert.vehicleId}`);
        updateNotifiedCache(vehicle.id, vehicle.currentKm, alert.isOverdue);
      }
    }
  }

  return alerts;
}

/**
 * Dispatches test notification so user can confirm push notifications work
 */
export async function triggerTestPushNotification(): Promise<boolean> {
  const permission = getNotificationPermissionStatus();
  if (permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  return await sendNativeNotification(
    '🛠️ Líder Frota • Teste de Notificação',
    'As Notificações Push estão ativas! Você será avisado quando um veículo se aproximar do limite de KM de manutenção.',
    'test-alert'
  );
}
