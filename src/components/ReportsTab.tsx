import React, { useState } from 'react';
import { Vehicle, Driver, DailyTrip, Maintenance, Fine } from '../types/index.ts';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  Car,
  User,
  Wrench,
  AlertTriangle,
  Award,
  BarChart2,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import { ReportsCharts } from './ReportsCharts.tsx';
import { D3FuelConsumptionChart } from './D3FuelConsumptionChart.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { generateFleetSummaryPDF } from '../utils/pdfFleetSummary.ts';

interface ReportsTabProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  dailyTrips: DailyTrip[];
  maintenances: Maintenance[];
  fines: Fine[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  vehicles,
  drivers,
  dailyTrips,
  maintenances,
  fines,
}) => {
  // Aggregate stats
  const finishedTrips = dailyTrips.filter((t) => t.status === 'finalizado');
  const totalKmTraveled = finishedTrips.reduce((acc, t) => {
    if (t.endKm && t.endKm >= t.startKm) return acc + (t.endKm - t.startKm);
    return acc;
  }, 0);

  const totalMaintenanceCost = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
  const totalFinesCost = fines.reduce((acc, f) => acc + (f.amount || 0), 0);

  // KM by vehicle
  const kmByVehicle: { [plate: string]: { model: string; km: number; trips: number } } = {};
  finishedTrips.forEach((t) => {
    if (!kmByVehicle[t.vehiclePlate]) {
      const v = vehicles.find((veh) => veh.plate === t.vehiclePlate);
      kmByVehicle[t.vehiclePlate] = {
        model: v ? `${v.brand} ${v.model}` : 'Veículo',
        km: 0,
        trips: 0,
      };
    }
    const dist = t.endKm && t.endKm >= t.startKm ? t.endKm - t.startKm : 0;
    kmByVehicle[t.vehiclePlate].km += dist;
    kmByVehicle[t.vehiclePlate].trips += 1;
  });

  // KM by driver
  const kmByDriver: { [name: string]: { km: number; trips: number } } = {};
  finishedTrips.forEach((t) => {
    if (!kmByDriver[t.driverName]) {
      kmByDriver[t.driverName] = { km: 0, trips: 0 };
    }
    const dist = t.endKm && t.endKm >= t.startKm ? t.endKm - t.startKm : 0;
    kmByDriver[t.driverName].km += dist;
    kmByDriver[t.driverName].trips += 1;
  });

  // Export to CSV
  const exportTripsCSV = () => {
    const headers = ['Data', 'Placa', 'Motorista', 'KM Inicial', 'KM Final', 'KM Rodado', 'Hora Saida', 'Hora Retorno', 'Motivo', 'Status'];
    const rows = dailyTrips.map((t) => {
      const dist = t.endKm && t.endKm >= t.startKm ? t.endKm - t.startKm : 0;
      return [
        t.date,
        t.vehiclePlate,
        `"${t.driverName}"`,
        t.startKm,
        t.endKm || '',
        dist,
        t.startTime,
        t.endTime || '',
        `"${t.purpose || ''}"`,
        t.status,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_frotas_lider_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { userProfile } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await new Promise((r) => setTimeout(r, 120));
      generateFleetSummaryPDF(vehicles, drivers, dailyTrips, maintenances, fines, {
        companyName: userProfile?.companyName,
        userName: userProfile?.displayName,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao gerar PDF da frota:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Relatórios Gerenciais da Frota
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Métricas de utilização, quilometragem por carro/motorista e exportação oficial em PDF e CSV
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Prominent PDF Download Button using jsPDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer ${
              pdfSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:scale-[1.02]'
            } disabled:opacity-50`}
            title="Gerar e baixar Resumo Executivo da Frota em formato PDF com jspdf"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : pdfSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>PDF Gerado com Sucesso!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Baixar Resumo da Frota (PDF)</span>
              </>
            )}
          </button>

          <button
            onClick={exportTripsCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            title="Exportar planilha de viagens em CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            title="Imprimir página do relatório"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">KM Total Rodado</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalKmTraveled.toLocaleString('pt-BR')} KM
          </p>
          <span className="text-[11px] text-slate-400">{finishedTrips.length} rotas concluídas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Frota Ativa</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {vehicles.length} veículos
          </p>
          <span className="text-[11px] text-slate-400">{drivers.length} motoristas registrados</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Gastos com Manutenção</span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            R$ {totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">{maintenances.length} ordens de serviço</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Custo com Multas</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            R$ {totalFinesCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400">{fines.length} autuações</span>
        </div>
      </div>

      {/* Recharts Analytics: Quilometragem Mensal & Custos de Manutenção */}
      <ReportsCharts
        vehicles={vehicles}
        dailyTrips={dailyTrips}
        maintenances={maintenances}
      />

      {/* D3.js: Consumo de Combustível por Veículo nos Últimos 30 Dias */}
      <D3FuelConsumptionChart
        vehicles={vehicles}
        dailyTrips={dailyTrips}
      />

      {/* Two Ranking Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicles Ranking */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Car className="w-4 h-4 text-blue-600" />
            Quilometragem por Veículo
          </h3>

          <div className="space-y-3">
            {Object.entries(kmByVehicle)
              .sort(([, a], [, b]) => b.km - a.km)
              .map(([plate, data], idx) => (
                <div
                  key={plate}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {plate}
                      </span>
                      <p className="text-[11px] text-slate-400">{data.model}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      +{data.km.toLocaleString('pt-BR')} KM
                    </p>
                    <p className="text-[10px] text-slate-400">{data.trips} viagens</p>
                  </div>
                </div>
              ))}
            {Object.keys(kmByVehicle).length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma rota concluída ainda.</p>
            )}
          </div>
        </div>

        {/* Drivers Ranking */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            Quilometragem por Motorista
          </h3>

          <div className="space-y-3">
            {Object.entries(kmByDriver)
              .sort(([, a], [, b]) => b.km - a.km)
              .map(([name, data], idx) => (
                <div
                  key={name}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {name}
                      </span>
                      <p className="text-[11px] text-slate-400">{data.trips} rotas realizadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                      +{data.km.toLocaleString('pt-BR')} KM
                    </p>
                  </div>
                </div>
              ))}
            {Object.keys(kmByDriver).length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma rota concluída ainda.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Journeys Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Extrato Completo de Jornadas (KM Inicial e Final)
        </h3>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
              <th className="py-2.5 px-3">Data</th>
              <th className="py-2.5 px-3">Veículo</th>
              <th className="py-2.5 px-3">Motorista</th>
              <th className="py-2.5 px-3">KM Inicial</th>
              <th className="py-2.5 px-3">KM Final</th>
              <th className="py-2.5 px-3">Distância</th>
              <th className="py-2.5 px-3">Horário</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {dailyTrips.map((trip) => {
              const dist = trip.endKm && trip.endKm >= trip.startKm ? trip.endKm - trip.startKm : 0;
              return (
                <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                    {trip.date}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {trip.vehiclePlate}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                    {trip.driverName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                    {trip.startKm.toLocaleString('pt-BR')} KM
                  </td>
                  <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400">
                    {trip.endKm ? `${trip.endKm.toLocaleString('pt-BR')} KM` : '--'}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {trip.status === 'finalizado' ? `+${dist.toLocaleString('pt-BR')} KM` : '--'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {trip.startTime} &rarr; {trip.endTime || '--:--'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        trip.status === 'finalizado'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {trip.status === 'finalizado' ? 'Finalizada' : 'Em Aberto'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
