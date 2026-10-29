import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Vehicle, DailyTrip, Maintenance } from '../types/index.ts';
import {
  TrendingUp,
  Wrench,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  Calendar,
  Car,
  ChevronRight,
  Info,
} from 'lucide-react';

interface ReportsChartsProps {
  vehicles: Vehicle[];
  dailyTrips: DailyTrip[];
  maintenances: Maintenance[];
}

const PALETTE = [
  '#2563eb', // Blue 600
  '#06b6d4', // Cyan 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#f97316', // Orange 500
  '#6366f1', // Indigo 500
  '#14b8a6', // Teal 500
  '#64748b', // Slate 500
];

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export const ReportsCharts: React.FC<ReportsChartsProps> = ({
  vehicles,
  dailyTrips,
  maintenances,
}) => {
  const [kmChartType, setKmChartType] = useState<'area' | 'bar'>('area');
  const [costChartType, setCostChartType] = useState<'pie' | 'bar'>('pie');
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(false);

  // 1. Process Monthly KM Evolution
  const monthlyKmData = useMemo(() => {
    const finishedTrips = dailyTrips.filter(
      (t) => t.status === 'finalizado' && t.endKm && t.endKm >= t.startKm
    );

    // If no finished trips and demo mode is requested
    const hasRealTrips = finishedTrips.length > 0;

    // Generate month buckets for the last 6 months
    const now = new Date();
    const monthsMap: {
      [key: string]: {
        monthKey: string;
        label: string;
        km: number;
        tripsCount: number;
      };
    } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[monthIdx]}/${String(year).slice(2)}`;
      monthsMap[key] = { monthKey: key, label, km: 0, tripsCount: 0 };
    }

    // Populate with real data
    finishedTrips.forEach((trip) => {
      if (!trip.date) return;
      const key = trip.date.slice(0, 7); // YYYY-MM
      const dist = trip.endKm && trip.endKm >= trip.startKm ? trip.endKm - trip.startKm : 0;

      if (!monthsMap[key]) {
        // If outside the last 6 months range, create the bucket
        const [y, m] = key.split('-').map(Number);
        if (y && m) {
          const label = `${MONTH_NAMES[m - 1]}/${String(y).slice(2)}`;
          monthsMap[key] = { monthKey: key, label, km: 0, tripsCount: 0 };
        }
      }

      if (monthsMap[key]) {
        monthsMap[key].km += dist;
        monthsMap[key].tripsCount += 1;
      }
    });

    let result = Object.values(monthsMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // If completely empty and user enabled demo fallback, provide realistic demonstration values
    const totalKm = result.reduce((acc, curr) => acc + curr.km, 0);
    if ((!hasRealTrips || totalKm === 0) && useDemoFallback) {
      const sampleKms = [1420, 2180, 1890, 2640, 3100, 2850];
      const sampleTrips = [14, 22, 19, 27, 31, 28];
      result = result.map((item, idx) => ({
        ...item,
        km: sampleKms[idx % sampleKms.length],
        tripsCount: sampleTrips[idx % sampleTrips.length],
      }));
    }

    return result;
  }, [dailyTrips, useDemoFallback]);

  // KM Stats
  const totalPeriodKm = useMemo(
    () => monthlyKmData.reduce((acc, curr) => acc + curr.km, 0),
    [monthlyKmData]
  );
  const avgMonthlyKm = useMemo(
    () => (monthlyKmData.length ? Math.round(totalPeriodKm / monthlyKmData.length) : 0),
    [totalPeriodKm, monthlyKmData]
  );
  const peakMonth = useMemo(() => {
    if (!monthlyKmData.length) return null;
    return [...monthlyKmData].sort((a, b) => b.km - a.km)[0];
  }, [monthlyKmData]);

  // 2. Process Maintenance Cost Distribution by Vehicle
  const maintenanceCostData = useMemo(() => {
    const costMap: {
      [plate: string]: {
        vehiclePlate: string;
        model: string;
        cost: number;
        servicesCount: number;
      };
    } = {};

    maintenances.forEach((m) => {
      const cost = m.cost || 0;
      const plate = m.vehiclePlate || 'Desconhecido';

      if (!costMap[plate]) {
        const vehicle = vehicles.find((v) => v.plate === plate);
        costMap[plate] = {
          vehiclePlate: plate,
          model: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo',
          cost: 0,
          servicesCount: 0,
        };
      }

      costMap[plate].cost += cost;
      costMap[plate].servicesCount += 1;
    });

    let items = Object.values(costMap).filter((item) => item.cost > 0);

    // If no real maintenance cost yet and demo is active
    if (items.length === 0 && useDemoFallback) {
      if (vehicles.length > 0) {
        // Map actual vehicles to sample costs
        const demoCosts = [1850, 1200, 950, 680, 420];
        const demoCounts = [4, 2, 3, 1, 1];
        items = vehicles.slice(0, 5).map((v, i) => ({
          vehiclePlate: v.plate,
          model: `${v.brand} ${v.model}`,
          cost: demoCosts[i] || 500,
          servicesCount: demoCounts[i] || 1,
        }));
      } else {
        items = [
          { vehiclePlate: 'ABC-1D23', model: 'Fiat Strada', cost: 1650, servicesCount: 3 },
          { vehiclePlate: 'BRA-2E45', model: 'VW Gol', cost: 1120, servicesCount: 2 },
          { vehiclePlate: 'KLP-9J88', model: 'Chevrolet Onix', cost: 890, servicesCount: 2 },
          { vehiclePlate: 'XYZ-7F12', model: 'Renault Kwid', cost: 540, servicesCount: 1 },
        ];
      }
    }

    // Sort descending by cost
    items.sort((a, b) => b.cost - a.cost);

    const totalCost = items.reduce((acc, curr) => acc + curr.cost, 0);

    return items.map((item, idx) => ({
      ...item,
      color: PALETTE[idx % PALETTE.length],
      percentage: totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(1) : '0',
    }));
  }, [maintenances, vehicles, useDemoFallback]);

  const totalMaintenanceCost = useMemo(
    () => maintenanceCostData.reduce((acc, curr) => acc + curr.cost, 0),
    [maintenanceCostData]
  );

  // Check if we have native real data
  const hasRealKm = dailyTrips.some(
    (t) => t.status === 'finalizado' && t.endKm && t.endKm >= t.startKm
  );
  const hasRealCost = maintenances.some((m) => (m.cost || 0) > 0);
  const showDemoToggle = !hasRealKm || !hasRealCost;

  return (
    <div className="space-y-6">
      {/* Visual Header & Demo Toggle Banner */}
      {showDemoToggle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-200">
              {useDemoFallback
                ? 'Exibindo projeção demonstrativa com gráficos em tempo real.'
                : 'Poucos registros ainda? Ative a pré-visualização para explorar o potencial dos gráficos.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUseDemoFallback((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
              useDemoFallback
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50'
            }`}
          >
            {useDemoFallback ? 'Voltar para Dados Reais' : 'Ver com Dados de Exemplo'}
          </button>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Evolução da Quilometragem Rodada por Mês */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Evolução da Quilometragem Mensal
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Histórico de KM rodado pela frota por mês
                  </p>
                </div>
              </div>

              {/* Chart Type Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setKmChartType('area')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    kmChartType === 'area'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Gráfico de Área Contínua"
                >
                  Área
                </button>
                <button
                  type="button"
                  onClick={() => setKmChartType('bar')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    kmChartType === 'bar'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Gráfico de Barras"
                >
                  Barras
                </button>
              </div>
            </div>

            {/* Quick Metrics Header */}
            <div className="grid grid-cols-3 gap-2 py-2 mb-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Total no Período</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {totalPeriodKm.toLocaleString('pt-BR')} KM
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Média Mensal</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {avgMonthlyKm.toLocaleString('pt-BR')} KM/mês
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Pico de Rodagem</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {peakMonth ? `${peakMonth.label} (${peakMonth.km.toLocaleString('pt-BR')})` : '--'}
                </span>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 w-full">
              {totalPeriodKm === 0 && !useDemoFallback ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ainda sem quilometragem registrada
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Conclua jornadas de veículos para que a evolução mensal apareça neste gráfico.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUseDemoFallback(true)}
                    className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Simular visualização com dados de exemplo
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {kmChartType === 'area' ? (
                    <AreaChart
                      data={monthlyKmData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="kmGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#94a3b8"
                        opacity={0.15}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                      />
                      <Tooltip content={<CustomKmTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="km"
                        name="KM Rodado"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#kmGradient)"
                        activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={monthlyKmData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#94a3b8"
                        opacity={0.15}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                      />
                      <Tooltip content={<CustomKmTooltip />} />
                      <Bar
                        dataKey="km"
                        name="KM Rodado"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Fonte: Jornadas diárias finalizadas</span>
            <span className="font-medium text-slate-500">Unidade: Quilômetros (KM)</span>
          </div>
        </div>

        {/* Chart 2: Distribuição de Custos de Manutenção por Veículo */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Custos de Manutenção por Veículo
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Proporção e distribuição de gastos na frota
                  </p>
                </div>
              </div>

              {/* Chart Type Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setCostChartType('pie')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    costChartType === 'pie'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Gráfico de Rosca"
                >
                  Rosca
                </button>
                <button
                  type="button"
                  onClick={() => setCostChartType('bar')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    costChartType === 'bar'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Ranking de Barras"
                >
                  Ranking
                </button>
              </div>
            </div>

            {/* Quick Metrics Header */}
            <div className="flex items-center justify-between py-2 mb-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-3 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Gasto Total Acumulado</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  R$ {totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Veículos com O.S.</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  {maintenanceCostData.length} unidades
                </span>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 w-full">
              {totalMaintenanceCost === 0 && !useDemoFallback ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nenhum custo de manutenção registrado
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Cadastre ordens de serviço na aba de Manutenções para visualizar a divisão dos custos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUseDemoFallback(true)}
                    className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Simular distribuição com dados de exemplo
                  </button>
                </div>
              ) : costChartType === 'pie' ? (
                <div className="h-full flex flex-col sm:flex-row items-center gap-3">
                  {/* Pie Donut */}
                  <div className="w-full sm:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomCostTooltip />} />
                        <Pie
                          data={maintenanceCostData}
                          dataKey="cost"
                          nameKey="vehiclePlate"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          stroke="#ffffff"
                          strokeWidth={2}
                        >
                          {maintenanceCostData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend list alongside donut */}
                  <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {maintenanceCostData.map((item) => (
                      <div
                        key={item.vehiclePlate}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="truncate">
                            <span className="font-mono font-bold text-slate-900 dark:text-white block text-[11px] truncate">
                              {item.vehiclePlate}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {item.model}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block">
                            R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Horizontal Bar Chart */
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={maintenanceCostData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#94a3b8"
                      opacity={0.15}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <YAxis
                      dataKey="vehiclePlate"
                      type="category"
                      tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomCostTooltip />} />
                    <Bar
                      dataKey="cost"
                      name="Custo Total"
                      radius={[0, 6, 6, 0]}
                    >
                      {maintenanceCostData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Fonte: Histórico de Manutenções</span>
            <span className="font-medium text-slate-500">Moeda: Real (BRL)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip for Monthly KM Evolution Chart
const CustomKmTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl text-xs z-50 min-w-44">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            {data.label}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{data.monthKey}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Total Rodado:</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
              {Number(data.km).toLocaleString('pt-BR')} KM
            </span>
          </div>
          {data.tripsCount !== undefined && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Jornadas Concluídas:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {data.tripsCount} rotas
              </span>
            </div>
          )}
          {data.tripsCount > 0 && (
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Média por Rota:</span>
              <span>{Math.round(data.km / data.tripsCount).toLocaleString('pt-BR')} KM</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Maintenance Cost Distribution Chart
const CustomCostTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl text-xs z-50 min-w-48">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <div>
            <span className="font-mono font-bold text-slate-900 dark:text-white block">
              {data.vehiclePlate}
            </span>
            <span className="text-[10px] text-slate-400">{data.model}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Total Investido:</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
              R$ {Number(data.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">% da Frota:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{data.percentage}%</span>
          </div>
          {data.servicesCount !== undefined && (
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Ordens Realizadas:</span>
              <span>{data.servicesCount} manutenções</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};
