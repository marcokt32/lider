import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { DriverDashboard } from './components/DriverDashboard.tsx';
import { TripsTab } from './components/TripsTab.tsx';
import { VehiclesTab } from './components/VehiclesTab.tsx';
import { DriversTab } from './components/DriversTab.tsx';
import { MaintenanceTab } from './components/MaintenanceTab.tsx';
import { FinesTab } from './components/FinesTab.tsx';
import { ReportsTab } from './components/ReportsTab.tsx';
import { DailyTripsModal } from './components/DailyTripsModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { OnboardingScreen } from './components/OnboardingScreen.tsx';
import {
  Vehicle,
  Driver,
  DailyTrip,
  Maintenance,
  Fine,
  FleetCompany,
} from './types/index.ts';
import {
  subscribeVehicles,
  subscribeDrivers,
  subscribeDailyTrips,
  subscribeMaintenances,
  subscribeFines,
  seedDemoData,
} from './firebase/firestoreService.ts';
import { getDemoData } from './utils/demoStorage.ts';
import { checkFleetMaintenanceAndNotify } from './services/notificationService.ts';
import {
  Car,
  Sparkles,
  Cloud,
  ArrowRight,
} from 'lucide-react';

function FleetAppContent() {
  const { currentUser, userProfile, loading: authLoading, isGestor, isMotorista } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [dailyTrips, setDailyTrips] = useState<DailyTrip[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fleets list for Driver
  const [currentFleet, setCurrentFleet] = useState<FleetCompany>({
    id: 'demo-admin-gestor-frota',
    name: 'Líder Atendimento & Serviços',
    ownerEmail: 'gestor.lider@frotas.com.br',
  });
  const [fleetsList, setFleetsList] = useState<FleetCompany[]>([
    {
      id: 'demo-admin-gestor-frota',
      name: 'Líder Atendimento & Serviços',
      ownerEmail: 'gestor.lider@frotas.com.br',
    },
    {
      id: 'frota-express-sul',
      name: 'Distribuidora Express Zona Sul',
      ownerEmail: 'diretoria@expressfrotas.com.br',
    },
  ]);

  // Trip Modal
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [tripModalType, setTripModalType] = useState<'start' | 'finish'>('start');
  const [defaultVehicleId, setDefaultVehicleId] = useState<string | undefined>();
  const [defaultTripId, setDefaultTripId] = useState<string | undefined>();

  // Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Load demo data helper
  const loadDemoState = useCallback(() => {
    const demo = getDemoData();
    setVehicles(demo.vehicles);
    setDrivers(demo.drivers);
    setDailyTrips(demo.dailyTrips);
    setMaintenances(demo.maintenances);
    setFines(demo.fines);
    setLoadingData(false);
  }, []);

  // Data fetching effect
  useEffect(() => {
    if (authLoading) return;

    // Real Firebase authenticated user
    if (currentUser) {
      setLoadingData(true);
      const uid = currentUser.uid;

      const unsubVehicles = subscribeVehicles(
        uid,
        (data) => {
          setVehicles(data);
          setLoadingData(false);
        },
        () => setLoadingData(false)
      );

      const unsubDrivers = subscribeDrivers(uid, (data) => setDrivers(data));
      const unsubTrips = subscribeDailyTrips(uid, (data) => setDailyTrips(data));
      const unsubMaintenances = subscribeMaintenances(uid, (data) => setMaintenances(data));
      const unsubFines = subscribeFines(uid, (data) => setFines(data));

      return () => {
        unsubVehicles();
        unsubDrivers();
        unsubTrips();
        unsubMaintenances();
        unsubFines();
      };
    }

    // Demo mode
    if (!currentUser && userProfile) {
      loadDemoState();

      const handleDemoUpdate = () => {
        loadDemoState();
      };

      window.addEventListener('lider_demo_update', handleDemoUpdate);
      return () => {
        window.removeEventListener('lider_demo_update', handleDemoUpdate);
      };
    }
  }, [currentUser, userProfile, authLoading, loadDemoState]);

  // Push notifications: evaluate fleet maintenance whenever vehicles list updates
  useEffect(() => {
    if (vehicles.length > 0) {
      checkFleetMaintenanceAndNotify(vehicles);
    }
  }, [vehicles]);

  // Loading splash while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0f19] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Carregando Líder Frota...
        </p>
      </div>
    );
  }

  // Not signed in and no demo session
  if (!currentUser && !userProfile) {
    return <LoginScreen />;
  }

  // Signed in, but role is null (needs onboarding!)
  if ((currentUser || userProfile) && userProfile?.role === null) {
    return <OnboardingScreen />;
  }

  const effectiveAdminId = currentUser?.uid || userProfile?.uid || 'demo-admin-gestor-frota';

  const handleOpenTripModal = (type: 'start' | 'finish', vehicleId?: string, tripId?: string) => {
    setTripModalType(type);
    setDefaultVehicleId(vehicleId);
    setDefaultTripId(tripId);
    setTripModalOpen(true);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    await seedDemoData(effectiveAdminId);
    if (!currentUser) {
      loadDemoState();
    }
    setIsSeeding(false);
  };

  // Pending active trips & maintenance alerts
  const pendingTrips = dailyTrips.filter((t) => t.status === 'em_andamento');

  // Filter trips for driver
  const myTrips = isMotorista
    ? dailyTrips.filter(
        (t) =>
          t.driverUserId === currentUser?.uid ||
          t.driverName.toLowerCase().includes(userProfile?.displayName.toLowerCase() || '')
      )
    : dailyTrips;

  const myActiveTrip = myTrips.find((t) => t.status === 'em_andamento');

  const maintenanceAlertsCount = vehicles.filter((v) => {
    const kmSinceLast = v.currentKm - (v.lastMaintenanceKm || 0);
    const interval = v.maintenanceIntervalKm || 10000;
    const remainingKm = interval - kmSinceLast;
    return remainingKm <= 500;
  }).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 antialiased flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTripModal={handleOpenTripModal}
        pendingTripsCount={pendingTrips.length}
        maintenanceAlertsCount={maintenanceAlertsCount}
        vehicles={vehicles}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Demo Banner if user is exploring in demo mode */}
      {!currentUser && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                <strong>Modo Demonstração:</strong> Você está testando com dados locais salvos no
                navegador. Todas as funções estão operacionais.
              </span>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-1 bg-white text-amber-900 hover:bg-amber-50 font-extrabold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Conectar ao Firebase (Nuvem)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loadingData ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Sincronizando com o banco de dados...
            </p>
          </div>
        ) : (
          <>
            {/* MOTORISTA INTERFACE */}
            {isMotorista ? (
              <>
                {activeTab === 'dashboard' && (
                  <DriverDashboard
                    vehicles={vehicles}
                    myTrips={myTrips}
                    activeTrip={myActiveTrip}
                    currentFleet={currentFleet}
                    fleetsList={fleetsList}
                    onSelectFleet={setCurrentFleet}
                    onOpenTripModal={handleOpenTripModal}
                    driverName={userProfile?.displayName || 'Motorista'}
                  />
                )}

                {activeTab === 'trips' && (
                  <TripsTab
                    trips={myTrips}
                    vehicles={vehicles}
                    drivers={drivers}
                    onOpenTripModal={handleOpenTripModal}
                  />
                )}
              </>
            ) : (
              /* GESTOR / DONO DE FROTA INTERFACE */
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard
                    vehicles={vehicles}
                    drivers={drivers}
                    dailyTrips={dailyTrips}
                    maintenances={maintenances}
                    onOpenTripModal={handleOpenTripModal}
                    setActiveTab={setActiveTab}
                    onSeedDemoData={handleSeed}
                    isSeeding={isSeeding}
                  />
                )}

                {activeTab === 'trips' && (
                  <TripsTab
                    trips={dailyTrips}
                    vehicles={vehicles}
                    drivers={drivers}
                    onOpenTripModal={handleOpenTripModal}
                  />
                )}

                {activeTab === 'vehicles' && (
                  <VehiclesTab
                    vehicles={vehicles}
                    adminId={effectiveAdminId}
                    onOpenTripModal={handleOpenTripModal}
                  />
                )}

                {activeTab === 'drivers' && (
                  <DriversTab
                    drivers={drivers}
                    dailyTrips={dailyTrips}
                    adminId={effectiveAdminId}
                  />
                )}

                {activeTab === 'maintenance' && (
                  <MaintenanceTab
                    maintenances={maintenances}
                    vehicles={vehicles}
                    adminId={effectiveAdminId}
                  />
                )}

                {activeTab === 'fines' && (
                  <FinesTab
                    fines={fines}
                    vehicles={vehicles}
                    dailyTrips={dailyTrips}
                    adminId={effectiveAdminId}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsTab
                    vehicles={vehicles}
                    drivers={drivers}
                    dailyTrips={dailyTrips}
                    maintenances={maintenances}
                    fines={fines}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-medium">
            <Car className="w-3.5 h-3.5 text-blue-600" />
            <strong>Líder - Gestor de Frota</strong> &bull; Sistema Integrado de KM & Manutenção Preventiva
          </p>
          <p className="text-[11px]">
            {currentUser ? 'Sincronizado na Nuvem (Firestore)' : 'Modo Demonstração • PWA Ready'}
          </p>
        </div>
      </footer>

      {/* Daily Trips Check-in / Check-out Modal */}
      <DailyTripsModal
        isOpen={tripModalOpen}
        type={tripModalType}
        onClose={() => setTripModalOpen(false)}
        vehicles={vehicles}
        drivers={drivers}
        activeTrips={pendingTrips}
        adminId={effectiveAdminId}
        defaultVehicleId={defaultVehicleId}
        defaultTripId={defaultTripId}
      />

      {/* Auth Modal for cloud connection */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FleetAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
