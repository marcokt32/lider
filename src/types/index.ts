export type VehicleStatus = 'disponivel' | 'em_uso' | 'manutencao';

export interface Vehicle {
  id: string;
  adminId: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  currentKm: number;
  lastMaintenanceKm: number;
  maintenanceIntervalKm: number; // ex: 10000 km
  status: VehicleStatus;
  currentDriverId?: string;
  currentDriverName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DriverStatus = 'ativo' | 'inativo' | 'em_viagem';

export interface Driver {
  id: string;
  adminId: string;
  name: string;
  email?: string;
  phone: string;
  cnhNumber: string;
  cnhCategory: string; // 'B' | 'AB' | 'C' | 'D' | 'E'
  cnhExpiration: string; // YYYY-MM-DD
  status: DriverStatus;
  isNetworkMember?: boolean; // true if linked through email/network
  userId?: string; // firebase user ID of driver if registered
  inviteStatus?: 'vinculado' | 'convite_enviado' | 'interno';
  createdAt?: string;
  updatedAt?: string;
}

export type TripStatus = 'em_andamento' | 'finalizado';

export interface DailyTrip {
  id: string;
  adminId: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverUserId?: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  startKm: number;
  endKm?: number;
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  purpose: string;
  fuelLevel?: string;
  checklistNotes?: string;
  status: TripStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type MaintenanceStatus = 'agendada' | 'concluida';

export interface Maintenance {
  id: string;
  adminId: string;
  vehicleId: string;
  vehiclePlate: string;
  serviceType: string;
  kmAtService: number;
  nextKmTarget: number;
  cost: number;
  date: string;
  workshop: string;
  notes?: string;
  status: MaintenanceStatus;
  createdAt?: string;
}

export type FineStatus = 'pendente' | 'paga' | 'recurso';

export interface Fine {
  id: string;
  adminId: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId?: string;
  driverName?: string;
  date: string;
  time?: string;
  infraction: string;
  amount: number;
  points: number;
  status: FineStatus;
  createdAt?: string;
}

export type UserRole = 'gestor' | 'motorista';

export interface FleetCompany {
  id: string;
  name: string;
  ownerEmail: string;
  vehicleCount?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | null; // null if onboarding not completed yet!
  companyName?: string;
  cnhNumber?: string;
  cnhCategory?: string;
  cnhExpiration?: string;
  phone?: string;
  fleetIds?: string[]; // companies this driver is member of
}

export interface FleetInvite {
  id: string;
  adminId: string;
  companyName: string;
  adminEmail: string;
  driverEmail: string;
  driverName?: string;
  status: 'pendente' | 'aceito' | 'recusado';
  createdAt: string;
}
