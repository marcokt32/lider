import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config.ts';
import { Vehicle, Driver, DailyTrip, Maintenance, Fine } from '../types/index.ts';
import { getDemoData, saveDemoData } from '../utils/demoStorage.ts';

const triggerDemoUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lider_demo_update'));
  }
};

// ---------------- VEHICLES ---------------- //

export function subscribeVehicles(
  adminId: string,
  onData: (vehicles: Vehicle[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  const colRef = collection(db, 'vehicles');
  const q = query(colRef, where('adminId', '==', adminId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Vehicle[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Vehicle);
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'vehicles');
    }
  );
}

export async function addVehicle(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const newId = 'demo-v-' + Date.now();
    const newVehicle: Vehicle = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demo.vehicles.push(newVehicle);
    saveDemoData({ vehicles: demo.vehicles });
    triggerDemoUpdate();
    return newId;
  }

  const path = 'vehicles';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const idx = demo.vehicles.findIndex((v: Vehicle) => v.id === id);
    if (idx !== -1) {
      demo.vehicles[idx] = { ...demo.vehicles[idx], ...data, updatedAt: new Date().toISOString() };
      saveDemoData({ vehicles: demo.vehicles });
      triggerDemoUpdate();
    }
    return;
  }

  const path = `vehicles/${id}`;
  try {
    const docRef = doc(db, 'vehicles', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    demo.vehicles = demo.vehicles.filter((v: Vehicle) => v.id !== id);
    saveDemoData({ vehicles: demo.vehicles });
    triggerDemoUpdate();
    return;
  }

  const path = `vehicles/${id}`;
  try {
    await deleteDoc(doc(db, 'vehicles', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- DRIVERS ---------------- //

export function subscribeDrivers(
  adminId: string,
  onData: (drivers: Driver[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  const colRef = collection(db, 'drivers');
  const q = query(colRef, where('adminId', '==', adminId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Driver[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Driver);
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'drivers');
    }
  );
}

export async function addDriver(data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const newId = 'demo-d-' + Date.now();
    const newDriver: Driver = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demo.drivers.push(newDriver);
    saveDemoData({ drivers: demo.drivers });
    triggerDemoUpdate();
    return newId;
  }

  const path = 'drivers';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDriver(id: string, data: Partial<Driver>): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const idx = demo.drivers.findIndex((d: Driver) => d.id === id);
    if (idx !== -1) {
      demo.drivers[idx] = { ...demo.drivers[idx], ...data, updatedAt: new Date().toISOString() };
      saveDemoData({ drivers: demo.drivers });
      triggerDemoUpdate();
    }
    return;
  }

  const path = `drivers/${id}`;
  try {
    const docRef = doc(db, 'drivers', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDriver(id: string): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    demo.drivers = demo.drivers.filter((d: Driver) => d.id !== id);
    saveDemoData({ drivers: demo.drivers });
    triggerDemoUpdate();
    return;
  }

  const path = `drivers/${id}`;
  try {
    await deleteDoc(doc(db, 'drivers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- DAILY TRIPS (KM INICIAL & KM FINAL) ---------------- //

export function subscribeDailyTrips(
  adminId: string,
  onData: (trips: DailyTrip[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  const colRef = collection(db, 'dailyTrips');
  const q = query(colRef, where('adminId', '==', adminId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DailyTrip[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as DailyTrip);
      });
      items.sort((a, b) => (b.date + (b.startTime || '')).localeCompare(a.date + (a.startTime || '')));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'dailyTrips');
    }
  );
}

export async function startDailyTrip(data: {
  adminId: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  startKm: number;
  date: string;
  startTime: string;
  purpose: string;
  fuelLevel?: string;
  checklistNotes?: string;
}): Promise<string> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const newId = 'demo-trip-' + Date.now();
    const newTrip: DailyTrip = {
      ...data,
      id: newId,
      status: 'em_andamento',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demo.dailyTrips.unshift(newTrip);

    // Update vehicle
    const vIdx = demo.vehicles.findIndex((v: Vehicle) => v.id === data.vehicleId);
    if (vIdx !== -1) {
      demo.vehicles[vIdx].status = 'em_uso';
      demo.vehicles[vIdx].currentKm = Math.max(data.startKm, 0);
      demo.vehicles[vIdx].currentDriverId = data.driverId;
      demo.vehicles[vIdx].currentDriverName = data.driverName;
    }

    // Update driver
    const dIdx = demo.drivers.findIndex((d: Driver) => d.id === data.driverId);
    if (dIdx !== -1) {
      demo.drivers[dIdx].status = 'em_viagem';
    }

    saveDemoData({ vehicles: demo.vehicles, drivers: demo.drivers, dailyTrips: demo.dailyTrips });
    triggerDemoUpdate();
    return newId;
  }

  const path = 'dailyTrips';
  try {
    const tripRef = await addDoc(collection(db, path), {
      ...data,
      status: 'em_andamento',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await updateVehicle(data.vehicleId, {
      status: 'em_uso',
      currentKm: Math.max(data.startKm, 0),
      currentDriverId: data.driverId,
      currentDriverName: data.driverName,
    });

    await updateDriver(data.driverId, {
      status: 'em_viagem',
    });

    return tripRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function finishDailyTrip(
  tripId: string,
  vehicleId: string,
  driverId: string,
  endKm: number,
  endTime: string,
  checklistNotes?: string
): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const tIdx = demo.dailyTrips.findIndex((t: DailyTrip) => t.id === tripId);
    if (tIdx !== -1) {
      demo.dailyTrips[tIdx].endKm = endKm;
      demo.dailyTrips[tIdx].endTime = endTime;
      demo.dailyTrips[tIdx].checklistNotes = checklistNotes || '';
      demo.dailyTrips[tIdx].status = 'finalizado';
      demo.dailyTrips[tIdx].updatedAt = new Date().toISOString();
    }

    const vIdx = demo.vehicles.findIndex((v: Vehicle) => v.id === vehicleId);
    if (vIdx !== -1) {
      demo.vehicles[vIdx].status = 'disponivel';
      demo.vehicles[vIdx].currentKm = endKm;
      demo.vehicles[vIdx].currentDriverId = '';
      demo.vehicles[vIdx].currentDriverName = '';
    }

    const dIdx = demo.drivers.findIndex((d: Driver) => d.id === driverId);
    if (dIdx !== -1) {
      demo.drivers[dIdx].status = 'ativo';
    }

    saveDemoData({ vehicles: demo.vehicles, drivers: demo.drivers, dailyTrips: demo.dailyTrips });
    triggerDemoUpdate();
    return;
  }

  const path = `dailyTrips/${tripId}`;
  try {
    const tripRef = doc(db, 'dailyTrips', tripId);
    await updateDoc(tripRef, {
      endKm,
      endTime,
      checklistNotes: checklistNotes || '',
      status: 'finalizado',
      updatedAt: new Date().toISOString(),
    });

    await updateVehicle(vehicleId, {
      status: 'disponivel',
      currentKm: endKm,
      currentDriverId: '',
      currentDriverName: '',
    });

    await updateDriver(driverId, {
      status: 'ativo',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDailyTrip(tripId: string, trip?: DailyTrip): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const existingTrip = trip || demo.dailyTrips.find((t: DailyTrip) => t.id === tripId);

    // If deleting a trip that was in progress, release vehicle and driver
    if (existingTrip && existingTrip.status === 'em_andamento') {
      const vIdx = demo.vehicles.findIndex((v: Vehicle) => v.id === existingTrip.vehicleId);
      if (vIdx !== -1) {
        demo.vehicles[vIdx].status = 'disponivel';
        demo.vehicles[vIdx].currentDriverId = '';
        demo.vehicles[vIdx].currentDriverName = '';
      }
      const dIdx = demo.drivers.findIndex((d: Driver) => d.id === existingTrip.driverId);
      if (dIdx !== -1) {
        demo.drivers[dIdx].status = 'ativo';
      }
    }

    demo.dailyTrips = demo.dailyTrips.filter((t: DailyTrip) => t.id !== tripId);
    saveDemoData({
      vehicles: demo.vehicles,
      drivers: demo.drivers,
      dailyTrips: demo.dailyTrips,
    });
    triggerDemoUpdate();
    return;
  }

  const path = `dailyTrips/${tripId}`;
  try {
    await deleteDoc(doc(db, 'dailyTrips', tripId));

    // Release vehicle and driver if trip was in progress
    if (trip && trip.status === 'em_andamento') {
      if (trip.vehicleId) {
        await updateVehicle(trip.vehicleId, {
          status: 'disponivel',
          currentDriverId: '',
          currentDriverName: '',
        });
      }
      if (trip.driverId) {
        await updateDriver(trip.driverId, {
          status: 'ativo',
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- MAINTENANCES ---------------- //

export function subscribeMaintenances(
  adminId: string,
  onData: (maintenances: Maintenance[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  const colRef = collection(db, 'maintenances');
  const q = query(colRef, where('adminId', '==', adminId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Maintenance[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Maintenance);
      });
      items.sort((a, b) => b.date.localeCompare(a.date));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'maintenances');
    }
  );
}

export async function addMaintenance(data: Omit<Maintenance, 'id' | 'createdAt'>): Promise<string> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const newId = 'demo-m-' + Date.now();
    const newM: Maintenance = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    demo.maintenances.unshift(newM);

    if (data.status === 'concluida') {
      const vIdx = demo.vehicles.findIndex((v: Vehicle) => v.id === data.vehicleId);
      if (vIdx !== -1) {
        demo.vehicles[vIdx].lastMaintenanceKm = data.kmAtService;
        demo.vehicles[vIdx].status = 'disponivel';
      }
    } else {
      const vIdx = demo.vehicles.findIndex((v: Vehicle) => v.id === data.vehicleId);
      if (vIdx !== -1) {
        demo.vehicles[vIdx].status = 'manutencao';
      }
    }

    saveDemoData({ vehicles: demo.vehicles, maintenances: demo.maintenances });
    triggerDemoUpdate();
    return newId;
  }

  const path = 'maintenances';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: new Date().toISOString(),
    });

    if (data.status === 'concluida') {
      await updateVehicle(data.vehicleId, {
        lastMaintenanceKm: data.kmAtService,
        status: 'disponivel',
      });
    } else {
      await updateVehicle(data.vehicleId, {
        status: 'manutencao',
      });
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function completeMaintenance(
  maintenanceId: string,
  vehicleId: string,
  kmAtService: number
): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const mIdx = demo.maintenances.findIndex((m: Maintenance) => m.id === maintenanceId);
    if (mIdx !== -1) {
      demo.maintenances[mIdx].status = 'concluida';
    }
    const vIdx = demo.vehicles.findIndex((v: Vehicle) => v.id === vehicleId);
    if (vIdx !== -1) {
      demo.vehicles[vIdx].lastMaintenanceKm = kmAtService;
      demo.vehicles[vIdx].status = 'disponivel';
    }
    saveDemoData({ vehicles: demo.vehicles, maintenances: demo.maintenances });
    triggerDemoUpdate();
    return;
  }

  const path = `maintenances/${maintenanceId}`;
  try {
    const docRef = doc(db, 'maintenances', maintenanceId);
    await updateDoc(docRef, {
      status: 'concluida',
    });

    await updateVehicle(vehicleId, {
      lastMaintenanceKm: kmAtService,
      status: 'disponivel',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMaintenance(id: string): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    demo.maintenances = demo.maintenances.filter((m: Maintenance) => m.id !== id);
    saveDemoData({ maintenances: demo.maintenances });
    triggerDemoUpdate();
    return;
  }

  const path = `maintenances/${id}`;
  try {
    await deleteDoc(doc(db, 'maintenances', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- FINES / INFRACTIONS ---------------- //

export function subscribeFines(
  adminId: string,
  onData: (fines: Fine[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }

  const colRef = collection(db, 'fines');
  const q = query(colRef, where('adminId', '==', adminId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Fine[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Fine);
      });
      items.sort((a, b) => b.date.localeCompare(a.date));
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'fines');
    }
  );
}

export async function addFine(data: Omit<Fine, 'id' | 'createdAt'>): Promise<string> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const newId = 'demo-f-' + Date.now();
    const newFine: Fine = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    demo.fines.unshift(newFine);
    saveDemoData({ fines: demo.fines });
    triggerDemoUpdate();
    return newId;
  }

  const path = 'fines';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFineStatus(fineId: string, status: Fine['status']): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const fIdx = demo.fines.findIndex((f: Fine) => f.id === fineId);
    if (fIdx !== -1) {
      demo.fines[fIdx].status = status;
      saveDemoData({ fines: demo.fines });
      triggerDemoUpdate();
    }
    return;
  }

  const path = `fines/${fineId}`;
  try {
    const docRef = doc(db, 'fines', fineId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFine(id: string): Promise<void> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    demo.fines = demo.fines.filter((f: Fine) => f.id !== id);
    saveDemoData({ fines: demo.fines });
    triggerDemoUpdate();
    return;
  }

  const path = `fines/${id}`;
  try {
    await deleteDoc(doc(db, 'fines', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Intelligent helper: find driver who used vehicle on a specific date
export async function findDriverForVehicleOnDate(
  adminId: string,
  vehicleId: string,
  date: string
): Promise<{ driverId: string; driverName: string } | null> {
  if (!auth.currentUser) {
    const demo = getDemoData();
    const trip = demo.dailyTrips.find((t: DailyTrip) => t.vehicleId === vehicleId && t.date === date);
    if (trip) {
      return { driverId: trip.driverId, driverName: trip.driverName };
    }
    return null;
  }

  const path = 'dailyTrips';
  try {
    const colRef = collection(db, path);
    const q = query(
      colRef,
      where('adminId', '==', adminId),
      where('vehicleId', '==', vehicleId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const trip = snapshot.docs[0].data() as DailyTrip;
      return { driverId: trip.driverId, driverName: trip.driverName };
    }
    return null;
  } catch (error) {
    console.error('Error finding driver on date:', error);
    return null;
  }
}

// Seed realistic initial fleet data for quick onboarding
export async function seedDemoData(adminId: string): Promise<void> {
  if (!auth.currentUser) {
    // Reset local demo data
    localStorage.removeItem('lider_demo_vehicles');
    localStorage.removeItem('lider_demo_drivers');
    localStorage.removeItem('lider_demo_trips');
    localStorage.removeItem('lider_demo_maintenances');
    localStorage.removeItem('lider_demo_fines');
    triggerDemoUpdate();
    return;
  }

  try {
    const v1Id = await addVehicle({
      adminId,
      plate: 'BRA2E19',
      model: 'Strada Freedom 1.3 CS',
      brand: 'Fiat',
      year: 2023,
      currentKm: 28450,
      lastMaintenanceKm: 20000,
      maintenanceIntervalKm: 10000,
      status: 'disponivel',
      notes: 'Carro de atendimento técnico zona norte',
    });

    const v2Id = await addVehicle({
      adminId,
      plate: 'RQN4A88',
      model: 'Gol 1.0 MPI Trendline',
      brand: 'Volkswagen',
      year: 2022,
      currentKm: 49820,
      lastMaintenanceKm: 40000,
      maintenanceIntervalKm: 10000,
      status: 'em_uso',
      currentDriverName: 'Carlos Eduardo Silveira',
      notes: 'Veículo de entrega rápida e visita a clientes',
    });

    const v3Id = await addVehicle({
      adminId,
      plate: 'FLT7D42',
      model: 'Onix Plus LT 1.0 Turbo',
      brand: 'Chevrolet',
      year: 2024,
      currentKm: 11200,
      lastMaintenanceKm: 10000,
      maintenanceIntervalKm: 10000,
      status: 'disponivel',
      notes: 'Diretoria e atendimento corporativo',
    });

    const v4Id = await addVehicle({
      adminId,
      plate: 'SAV9F31',
      model: 'Fiorino Hard Working 1.4',
      brand: 'Fiat',
      year: 2021,
      currentKm: 72400,
      lastMaintenanceKm: 70000,
      maintenanceIntervalKm: 10000,
      status: 'manutencao',
      notes: 'Em troca de pastilhas e óleo na oficina AutoCenter',
    });

    const d1Id = await addDriver({
      adminId,
      name: 'Carlos Eduardo Silveira',
      email: 'carlos.frota@empresa.com.br',
      phone: '(11) 98765-4321',
      cnhNumber: '05492817342',
      cnhCategory: 'AB',
      cnhExpiration: '2028-06-15',
      status: 'em_viagem',
    });

    const d2Id = await addDriver({
      adminId,
      name: 'Juliana Mendes Rocha',
      email: 'juliana.atendimento@empresa.com.br',
      phone: '(11) 97654-3210',
      cnhNumber: '03829104921',
      cnhCategory: 'B',
      cnhExpiration: '2027-11-20',
      status: 'ativo',
    });

    const d3Id = await addDriver({
      adminId,
      name: 'Marcos Vinícius Santos',
      email: 'marcos.v@empresa.com.br',
      phone: '(11) 96543-2109',
      cnhNumber: '01928374650',
      cnhCategory: 'D',
      cnhExpiration: '2026-12-10',
      status: 'ativo',
    });

    const todayDate = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await addDoc(collection(db, 'dailyTrips'), {
      adminId,
      vehicleId: v2Id,
      vehiclePlate: 'RQN4A88',
      driverId: d1Id,
      driverName: 'Carlos Eduardo Silveira',
      date: todayDate,
      startKm: 49710,
      startTime: '08:15',
      purpose: 'Rota de vistorias técnicas e visitas a clientes',
      fuelLevel: 'Cheio',
      checklistNotes: 'Pneus e luzes inspecionados sem inconformidades.',
      status: 'em_andamento',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await addDoc(collection(db, 'dailyTrips'), {
      adminId,
      vehicleId: v1Id,
      vehiclePlate: 'BRA2E19',
      driverId: d2Id,
      driverName: 'Juliana Mendes Rocha',
      date: yesterdayDate,
      startKm: 28310,
      endKm: 28450,
      startTime: '08:30',
      endTime: '17:45',
      purpose: 'Entrega de documentação e contrato em filiais',
      fuelLevel: '3/4',
      checklistNotes: 'Tudo em ordem. Veículo abastecido com 25L.',
      status: 'finalizado',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    });

    await addDoc(collection(db, 'maintenances'), {
      adminId,
      vehicleId: v4Id,
      vehiclePlate: 'SAV9F31',
      serviceType: 'Revisão Preventiva 70.000 KM + Troca de Pastilhas de Freio',
      kmAtService: 70000,
      nextKmTarget: 80000,
      cost: 850.0,
      date: yesterdayDate,
      workshop: 'Oficina Central Auto Mecânica',
      notes: 'Substituição de filtro de ar, filtro de combustível e jogo de pastilhas dianteiras.',
      status: 'concluida',
      createdAt: new Date().toISOString(),
    });

    await addDoc(collection(db, 'fines'), {
      adminId,
      vehicleId: v1Id,
      vehiclePlate: 'BRA2E19',
      driverId: d2Id,
      driverName: 'Juliana Mendes Rocha',
      date: yesterdayDate,
      time: '14:22',
      infraction: 'Transitar em velocidade superior à máxima em até 20% (Av. dos Bandeirantes)',
      amount: 130.16,
      points: 4,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}
