import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, DailyTrip } from '../types/index.ts';
import { startDailyTrip, finishDailyTrip } from '../firebase/firestoreService.ts';
import {
  evaluateVehicleMaintenance,
  sendNativeNotification,
} from '../services/notificationService.ts';
import {
  X,
  Gauge,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Car,
  Fuel,
  FileCheck,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface DailyTripsModalProps {
  isOpen: boolean;
  type: 'start' | 'finish';
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  activeTrips: DailyTrip[];
  adminId: string;
  defaultVehicleId?: string;
  defaultTripId?: string;
}

export const DailyTripsModal: React.FC<DailyTripsModalProps> = ({
  isOpen,
  type,
  onClose,
  vehicles,
  drivers,
  activeTrips,
  adminId,
  defaultVehicleId,
  defaultTripId,
}) => {
  // Common states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Start trip fields
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [startKm, setStartKm] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [fuelLevel, setFuelLevel] = useState('3/4');
  const [checklist, setChecklist] = useState({
    pneus: true,
    oleo: true,
    luzes: true,
    documentos: true,
  });
  const [startNotes, setStartNotes] = useState('');

  // Finish trip fields
  const [selectedTripId, setSelectedTripId] = useState('');
  const [endKm, setEndKm] = useState<number>(0);
  const [endTime, setEndTime] = useState('');
  const [finishNotes, setFinishNotes] = useState('');

  // Initialize fields on open
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    if (type === 'start') {
      setStartDate(dateStr);
      setStartTime(timeStr);
      setPurpose('Atendimento ao cliente e suporte operacional');
      setFuelLevel('Cheio');

      const initialVehicle = defaultVehicleId
        ? vehicles.find((v) => v.id === defaultVehicleId)
        : vehicles.find((v) => v.status === 'disponivel');

      if (initialVehicle) {
        setSelectedVehicleId(initialVehicle.id);
        setStartKm(initialVehicle.currentKm);
      } else {
        setSelectedVehicleId('');
        setStartKm(0);
      }

      const activeDriver = drivers.find((d) => d.status === 'ativo');
      if (activeDriver) setSelectedDriverId(activeDriver.id);
    } else {
      setEndTime(timeStr);
      const chosenTripId = defaultTripId || (activeTrips.length > 0 ? activeTrips[0].id : '');
      setSelectedTripId(chosenTripId);

      const trip = activeTrips.find((t) => t.id === chosenTripId);
      if (trip) {
        setEndKm(trip.startKm + 35);
      }
    }
  }, [isOpen, type, defaultVehicleId, defaultTripId, vehicles, drivers, activeTrips]);

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find((veh) => veh.id === vId);
    if (v) setStartKm(v.currentKm);
  };

  const handleTripChange = (tId: string) => {
    setSelectedTripId(tId);
    const trip = activeTrips.find((t) => t.id === tId);
    if (trip) {
      setEndKm(trip.startKm + 40);
    }
  };

  if (!isOpen) return null;

  const currentActiveTrip = activeTrips.find((t) => t.id === selectedTripId);
  const calculatedDistance =
    currentActiveTrip && endKm >= currentActiveTrip.startKm
      ? endKm - currentActiveTrip.startKm
      : 0;

  const handleSubmitStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedVehicleId) {
      setErrorMessage('Por favor, selecione um veículo disponível.');
      return;
    }
    if (!selectedDriverId) {
      setErrorMessage('Por favor, selecione o motorista do veículo no dia.');
      return;
    }
    if (startKm < 0) {
      setErrorMessage('O KM Inicial deve ser maior ou igual a zero.');
      return;
    }

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const driver = drivers.find((d) => d.id === selectedDriverId);

    if (!vehicle || !driver) {
      setErrorMessage('Veículo ou motorista não encontrado.');
      return;
    }

    try {
      setLoading(true);
      const checklistText = `Checklist: Pneus (${checklist.pneus ? 'OK' : 'Não'}), Óleo/Água (${checklist.oleo ? 'OK' : 'Não'}), Luzes (${checklist.luzes ? 'OK' : 'Não'}), Documentos (${checklist.documentos ? 'OK' : 'Não'}). ${startNotes ? `Obs: ${startNotes}` : ''}`;

      await startDailyTrip({
        adminId,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plate,
        driverId: driver.id,
        driverName: driver.name,
        startKm: Number(startKm),
        date: startDate,
        startTime: startTime,
        purpose: purpose || 'Atendimento comercial / serviços',
        fuelLevel: fuelLevel,
        checklistNotes: checklistText,
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao registrar saída do veículo. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentActiveTrip) {
      setErrorMessage('Nenhuma viagem em andamento selecionada.');
      return;
    }

    if (endKm < currentActiveTrip.startKm) {
      setErrorMessage(
        `O KM Final (${endKm} KM) não pode ser menor que o KM Inicial (${currentActiveTrip.startKm} KM)!`
      );
      return;
    }

    try {
      setLoading(true);
      await finishDailyTrip(
        currentActiveTrip.id,
        currentActiveTrip.vehicleId,
        currentActiveTrip.driverId,
        Number(endKm),
        endTime || new Date().toTimeString().slice(0, 5),
        finishNotes
      );

      // Check if this new odometer reading triggers a preventive maintenance push notification
      const vehicle = vehicles.find((v) => v.id === currentActiveTrip.vehicleId);
      if (vehicle) {
        const updatedVehicle: Vehicle = {
          ...vehicle,
          currentKm: Number(endKm),
        };
        const alert = evaluateVehicleMaintenance(updatedVehicle);
        if (alert) {
          const title = alert.isOverdue
            ? `🚨 REVISÃO VENCIDA: ${alert.plate}`
            : `⚠️ Manutenção Próxima: ${alert.plate}`;
          sendNativeNotification(title, alert.message, `maintenance-${alert.vehicleId}`);
        }
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao registrar retorno do veículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden">
        {/* Header (Sticky top) */}
        <div
          className={`px-5 sm:px-6 py-4 shrink-0 flex items-center justify-between text-white ${
            type === 'start'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-blue-700 to-indigo-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {type === 'start' ? 'Registrar Saída • KM Inicial' : 'Registrar Retorno • KM Final'}
              </h3>
              <p className="text-[11px] sm:text-xs text-white/80">
                {type === 'start'
                  ? 'Controle de jornada e motorista responsável'
                  : 'Fechamento de rota e cálculo de quilometragem'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content START (Scrollable body) */}
        {type === 'start' ? (
          <form onSubmit={handleSubmitStart} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Veículo Disponível *
              </label>
              <div className="relative">
                <select
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">Selecione um carro da frota...</option>
                  {vehicles
                    .filter((v) => v.status === 'disponivel' || v.id === selectedVehicleId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - {v.brand} {v.model} ({v.currentKm.toLocaleString('pt-BR')} KM)
                      </option>
                    ))}
                </select>
                <Car className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Driver Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Motorista do Dia *
              </label>
              <div className="relative">
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">Selecione o motorista...</option>
                  {drivers
                    .filter((d) => d.status !== 'inativo')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Cat. {d.cnhCategory})
                      </option>
                    ))}
                </select>
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Date, Time & Start KM Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Data de Saída
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hora de Saída
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  KM Inicial *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={startKm}
                    onChange={(e) => setStartKm(Number(e.target.value))}
                    min={0}
                    className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <Gauge className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Purpose & Fuel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo da Viagem / Rota
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ex: Visita a clientes Zona Sul, Entrega..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nível de Combustível
                </label>
                <div className="relative">
                  <select
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cheio">Tanque Cheio</option>
                    <option value="3/4">3/4 Tanque</option>
                    <option value="1/2">1/2 Tanque (Meio)</option>
                    <option value="1/4">1/4 Tanque</option>
                    <option value="Reserva">Reserva (Atenção)</option>
                  </select>
                  <Fuel className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>

            {/* Quick Checklist */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                Vistoria Rápida de Saída (Checklist):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={checklist.pneus}
                    onChange={(e) => setChecklist({ ...checklist, pneus: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Pneus calibrados</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={checklist.oleo}
                    onChange={(e) => setChecklist({ ...checklist, oleo: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Nível óleo / água OK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={checklist.luzes}
                    onChange={(e) => setChecklist({ ...checklist, luzes: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Faróis e setas OK</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={checklist.documentos}
                    onChange={(e) => setChecklist({ ...checklist, documentos: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Documento no veículo</span>
                </label>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Salvando...' : 'Confirmar Saída (Liberar Carro)'}
              </button>
            </div>
          </form>
        ) : (
          /* Content FINISH */
          <form onSubmit={handleSubmitFinish} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {activeTrips.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Nenhuma viagem em andamento!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Todos os veículos da frota já estão no pátio ou nenhuma saída com KM Inicial foi registrada ainda.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            ) : (
              <>
                {/* Select Trip */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Selecione a Viagem a Encerrar *
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => handleTripChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {activeTrips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.vehiclePlate} • {trip.driverName} (Saiu às {trip.startTime} - {trip.startKm} KM)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current Trip Summary Card */}
                {currentActiveTrip && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-blue-600" />
                        {currentActiveTrip.vehiclePlate}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        Em Andamento
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Condutor:</strong> {currentActiveTrip.driverName}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>Saída: {currentActiveTrip.date} às {currentActiveTrip.startTime}</span>
                      <span>KM Inicial: <strong>{currentActiveTrip.startKm.toLocaleString('pt-BR')} KM</strong></span>
                    </div>
                  </div>
                )}

                {/* End KM & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      KM Final (Odômetro de Retorno) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={endKm}
                        onChange={(e) => setEndKm(Number(e.target.value))}
                        min={currentActiveTrip ? currentActiveTrip.startKm : 0}
                        className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <Gauge className="w-4 h-4 text-blue-600 absolute left-2.5 top-3" />
                    </div>
                    {currentActiveTrip && endKm < currentActiveTrip.startKm && (
                      <p className="text-[11px] text-rose-500 mt-1">
                        KM Final não pode ser menor que {currentActiveTrip.startKm} KM.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Horário de Retorno
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                    </div>
                  </div>
                </div>

                {/* Real-time Distance Calculated Box */}
                {currentActiveTrip && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300">
                          Distância Percorrida nesta Rota:
                        </p>
                        <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                          {calculatedDistance.toLocaleString('pt-BR')} KM
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{currentActiveTrip.startKm} KM</span>
                      <ArrowRight className="w-3 h-3 inline mx-1" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{endKm} KM</span>
                    </div>
                  </div>
                )}

                {/* Return Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações de Chegada / Avarias / Combustível
                  </label>
                  <textarea
                    rows={2}
                    value={finishNotes}
                    onChange={(e) => setFinishNotes(e.target.value)}
                    placeholder="Ex: Veículo entregue limpo, abastecido no Posto Shell, sem avarias..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sticky Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-center cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (currentActiveTrip && endKm < currentActiveTrip.startKm)}
                    className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Salvando...' : 'Finalizar Viagem (Liberar Veículo)'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
