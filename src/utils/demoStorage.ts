import { Vehicle, Driver, DailyTrip, Maintenance, Fine } from '../types/index.ts';

const DEMO_ADMIN_ID = 'demo-admin-gestor-frota';

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'demo-v1',
    adminId: DEMO_ADMIN_ID,
    plate: 'BRA2E19',
    model: 'Strada Freedom 1.3 CS',
    brand: 'Fiat',
    year: 2023,
    currentKm: 28450,
    lastMaintenanceKm: 20000,
    maintenanceIntervalKm: 10000,
    status: 'disponivel',
    notes: 'Carro de atendimento técnico zona norte',
  },
  {
    id: 'demo-v2',
    adminId: DEMO_ADMIN_ID,
    plate: 'RQN4A88',
    model: 'Gol 1.0 MPI Trendline',
    brand: 'Volkswagen',
    year: 2022,
    currentKm: 49820,
    lastMaintenanceKm: 40000,
    maintenanceIntervalKm: 10000, // only 180 km left! (URGENT ALERT)
    status: 'em_uso',
    currentDriverId: 'demo-d1',
    currentDriverName: 'Carlos Eduardo Silveira',
    notes: 'Veículo de entrega rápida e visita a clientes',
  },
  {
    id: 'demo-v3',
    adminId: DEMO_ADMIN_ID,
    plate: 'FLT7D42',
    model: 'Onix Plus LT 1.0 Turbo',
    brand: 'Chevrolet',
    year: 2024,
    currentKm: 11200,
    lastMaintenanceKm: 10000,
    maintenanceIntervalKm: 10000,
    status: 'disponivel',
    notes: 'Diretoria e atendimento corporativo',
  },
  {
    id: 'demo-v4',
    adminId: DEMO_ADMIN_ID,
    plate: 'SAV9F31',
    model: 'Fiorino Hard Working 1.4',
    brand: 'Fiat',
    year: 2021,
    currentKm: 72400,
    lastMaintenanceKm: 70000,
    maintenanceIntervalKm: 10000,
    status: 'manutencao',
    notes: 'Em troca de pastilhas e óleo na oficina AutoCenter',
  },
];

const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'demo-d1',
    adminId: DEMO_ADMIN_ID,
    name: 'Carlos Eduardo Silveira',
    email: 'carlos.frota@empresa.com.br',
    phone: '(11) 98765-4321',
    cnhNumber: '05492817342',
    cnhCategory: 'AB',
    cnhExpiration: '2028-06-15',
    status: 'em_viagem',
  },
  {
    id: 'demo-d2',
    adminId: DEMO_ADMIN_ID,
    name: 'Juliana Mendes Rocha',
    email: 'juliana.atendimento@empresa.com.br',
    phone: '(11) 97654-3210',
    cnhNumber: '03829104921',
    cnhCategory: 'B',
    cnhExpiration: '2027-11-20',
    status: 'ativo',
  },
  {
    id: 'demo-d3',
    adminId: DEMO_ADMIN_ID,
    name: 'Marcos Vinícius Santos',
    email: 'marcos.v@empresa.com.br',
    phone: '(11) 96543-2109',
    cnhNumber: '01928374650',
    cnhCategory: 'D',
    cnhExpiration: '2026-12-10',
    status: 'ativo',
  },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const INITIAL_TRIPS: DailyTrip[] = [
  {
    id: 'demo-trip-1',
    adminId: DEMO_ADMIN_ID,
    vehicleId: 'demo-v2',
    vehiclePlate: 'RQN4A88',
    driverId: 'demo-d1',
    driverName: 'Carlos Eduardo Silveira',
    date: today,
    startKm: 49710,
    startTime: '08:15',
    purpose: 'Rota de vistorias técnicas e visitas a clientes',
    fuelLevel: 'Cheio',
    checklistNotes: 'Pneus e luzes inspecionados sem inconformidades.',
    status: 'em_andamento',
  },
  {
    id: 'demo-trip-2',
    adminId: DEMO_ADMIN_ID,
    vehicleId: 'demo-v1',
    vehiclePlate: 'BRA2E19',
    driverId: 'demo-d2',
    driverName: 'Juliana Mendes Rocha',
    date: yesterday,
    startKm: 28310,
    endKm: 28450,
    startTime: '08:30',
    endTime: '17:45',
    purpose: 'Entrega de documentação e contrato em filiais',
    fuelLevel: '3/4',
    checklistNotes: 'Tudo em ordem. Veículo abastecido com 25L.',
    status: 'finalizado',
  },
];

const INITIAL_MAINTENANCES: Maintenance[] = [
  {
    id: 'demo-m1',
    adminId: DEMO_ADMIN_ID,
    vehicleId: 'demo-v4',
    vehiclePlate: 'SAV9F31',
    serviceType: 'Revisão Preventiva 70.000 KM + Pastilhas de Freio',
    kmAtService: 70000,
    nextKmTarget: 80000,
    cost: 850.0,
    date: yesterday,
    workshop: 'Oficina Central Auto Mecânica',
    notes: 'Substituição de filtro de ar, filtro de combustível e jogo de pastilhas dianteiras.',
    status: 'concluida',
  },
];

const INITIAL_FINES: Fine[] = [
  {
    id: 'demo-f1',
    adminId: DEMO_ADMIN_ID,
    vehicleId: 'demo-v1',
    vehiclePlate: 'BRA2E19',
    driverId: 'demo-d2',
    driverName: 'Juliana Mendes Rocha',
    date: yesterday,
    time: '14:22',
    infraction: 'Transitar em velocidade superior à máxima em até 20% (Av. dos Bandeirantes)',
    amount: 130.16,
    points: 4,
    status: 'pendente',
  },
];

export const getDemoData = () => {
  const v = localStorage.getItem('lider_demo_vehicles');
  const d = localStorage.getItem('lider_demo_drivers');
  const t = localStorage.getItem('lider_demo_trips');
  const m = localStorage.getItem('lider_demo_maintenances');
  const f = localStorage.getItem('lider_demo_fines');

  return {
    vehicles: v ? JSON.parse(v) : INITIAL_VEHICLES,
    drivers: d ? JSON.parse(d) : INITIAL_DRIVERS,
    dailyTrips: t ? JSON.parse(t) : INITIAL_TRIPS,
    maintenances: m ? JSON.parse(m) : INITIAL_MAINTENANCES,
    fines: f ? JSON.parse(f) : INITIAL_FINES,
  };
};

export const saveDemoData = (data: {
  vehicles?: Vehicle[];
  drivers?: Driver[];
  dailyTrips?: DailyTrip[];
  maintenances?: Maintenance[];
  fines?: Fine[];
}) => {
  if (data.vehicles) localStorage.setItem('lider_demo_vehicles', JSON.stringify(data.vehicles));
  if (data.drivers) localStorage.setItem('lider_demo_drivers', JSON.stringify(data.drivers));
  if (data.dailyTrips) localStorage.setItem('lider_demo_trips', JSON.stringify(data.dailyTrips));
  if (data.maintenances) localStorage.setItem('lider_demo_maintenances', JSON.stringify(data.maintenances));
  if (data.fines) localStorage.setItem('lider_demo_fines', JSON.stringify(data.fines));
};
