import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Vehicle, DailyTrip } from '../types/index.ts';
import {
  Fuel,
  TrendingDown,
  DollarSign,
  Gauge,
  Sparkles,
  Info,
  Car,
  Settings2,
} from 'lucide-react';

interface D3FuelConsumptionChartProps {
  vehicles: Vehicle[];
  dailyTrips: DailyTrip[];
}

interface VehicleFuelData {
  vehicleId: string;
  plate: string;
  model: string;
  km30d: number;
  tripsCount: number;
  liters: number;
  cost: number;
  efficiencyKmL: number;
}

export const D3FuelConsumptionChart: React.FC<D3FuelConsumptionChartProps> = ({
  vehicles,
  dailyTrips,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [metric, setMetric] = useState<'liters' | 'cost' | 'km'>('liters');
  const [fuelPrice, setFuelPrice] = useState<number>(5.89); // R$ / litro
  const [avgEfficiency, setAvgEfficiency] = useState<number>(10.5); // km / L
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(false);
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data?: VehicleFuelData;
  }>({ visible: false, x: 0, y: 0 });

  // 1. Filter completed trips in the last 30 days
  const fuelData: VehicleFuelData[] = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Filter finished trips within last 30 days
    const recentTrips = dailyTrips.filter(
      (t) =>
        t.status === 'finalizado' &&
        t.endKm !== undefined &&
        t.endKm >= t.startKm &&
        t.date >= thirtyDaysAgoStr
    );

    // Group by vehicle
    const vehicleMap: {
      [plate: string]: {
        vehicleId: string;
        model: string;
        km: number;
        trips: number;
      };
    } = {};

    recentTrips.forEach((trip) => {
      const plate = trip.vehiclePlate;
      if (!vehicleMap[plate]) {
        const v = vehicles.find((veh) => veh.plate === plate || veh.id === trip.vehicleId);
        vehicleMap[plate] = {
          vehicleId: trip.vehicleId || (v ? v.id : ''),
          model: v ? `${v.brand} ${v.model}` : 'Veículo',
          km: 0,
          trips: 0,
        };
      }
      const dist = trip.endKm ? trip.endKm - trip.startKm : 0;
      vehicleMap[plate].km += dist;
      vehicleMap[plate].trips += 1;
    });

    let items: VehicleFuelData[] = Object.entries(vehicleMap).map(([plate, data]) => {
      const liters = Math.round((data.km / avgEfficiency) * 10) / 10;
      const cost = Math.round(liters * fuelPrice * 100) / 100;
      return {
        vehicleId: data.vehicleId,
        plate,
        model: data.model,
        km30d: data.km,
        tripsCount: data.trips,
        liters,
        cost,
        efficiencyKmL: avgEfficiency,
      };
    });

    // Fallback if no real trip data in last 30 days
    const totalKm = items.reduce((acc, curr) => acc + curr.km30d, 0);
    if ((items.length === 0 || totalKm === 0) && useDemoFallback) {
      if (vehicles.length > 0) {
        const sampleKms = [1680, 1240, 960, 750, 480];
        const sampleTrips = [18, 14, 11, 8, 5];
        items = vehicles.slice(0, 5).map((v, i) => {
          const km = sampleKms[i] || 600;
          const liters = Math.round((km / avgEfficiency) * 10) / 10;
          const cost = Math.round(liters * fuelPrice * 100) / 100;
          return {
            vehicleId: v.id,
            plate: v.plate,
            model: `${v.brand} ${v.model}`,
            km30d: km,
            tripsCount: sampleTrips[i] || 6,
            liters,
            cost,
            efficiencyKmL: avgEfficiency,
          };
        });
      } else {
        items = [
          {
            vehicleId: '1',
            plate: 'ABC-1D23',
            model: 'Fiat Strada',
            km30d: 1850,
            tripsCount: 20,
            liters: Math.round((1850 / avgEfficiency) * 10) / 10,
            cost: Math.round(((1850 / avgEfficiency) * fuelPrice * 100) / 100),
            efficiencyKmL: avgEfficiency,
          },
          {
            vehicleId: '2',
            plate: 'BRA-2E45',
            model: 'VW Gol',
            km30d: 1320,
            tripsCount: 15,
            liters: Math.round((1320 / avgEfficiency) * 10) / 10,
            cost: Math.round(((1320 / avgEfficiency) * fuelPrice * 100) / 100),
            efficiencyKmL: avgEfficiency,
          },
          {
            vehicleId: '3',
            plate: 'KLP-9J88',
            model: 'Chevrolet Onix',
            km30d: 980,
            tripsCount: 12,
            liters: Math.round((980 / avgEfficiency) * 10) / 10,
            cost: Math.round(((980 / avgEfficiency) * fuelPrice * 100) / 100),
            efficiencyKmL: avgEfficiency,
          },
          {
            vehicleId: '4',
            plate: 'XYZ-7F12',
            model: 'Renault Kwid',
            km30d: 640,
            tripsCount: 7,
            liters: Math.round((640 / avgEfficiency) * 10) / 10,
            cost: Math.round(((640 / avgEfficiency) * fuelPrice * 100) / 100),
            efficiencyKmL: avgEfficiency,
          },
        ];
      }
    }

    // Sort descending by metric
    if (metric === 'liters') {
      items.sort((a, b) => b.liters - a.liters);
    } else if (metric === 'cost') {
      items.sort((a, b) => b.cost - a.cost);
    } else {
      items.sort((a, b) => b.km30d - a.km30d);
    }

    return items;
  }, [dailyTrips, vehicles, avgEfficiency, fuelPrice, useDemoFallback, metric]);

  // Aggregate stats
  const totalLiters = useMemo(
    () => fuelData.reduce((acc, curr) => acc + curr.liters, 0),
    [fuelData]
  );
  const totalCost = useMemo(
    () => fuelData.reduce((acc, curr) => acc + curr.cost, 0),
    [fuelData]
  );
  const totalKm30d = useMemo(
    () => fuelData.reduce((acc, curr) => acc + curr.km30d, 0),
    [fuelData]
  );
  const topConsumer = fuelData.length > 0 ? fuelData[0] : null;

  // 2. Render D3 Bar Chart
  useEffect(() => {
    if (!svgRef.current || fuelData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 640;
    const height = 300;
    const margin = { top: 35, right: 25, bottom: 55, left: 60 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Definitions (Gradients)
    const defs = svg.append('defs');

    // Emerald/Teal gradient for Liters
    const litersGradient = defs
      .append('linearGradient')
      .attr('id', 'd3LitersGradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    litersGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    litersGradient.append('stop').attr('offset', '100%').attr('stop-color', '#047857');

    // Amber gradient for Cost
    const costGradient = defs
      .append('linearGradient')
      .attr('id', 'd3CostGradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    costGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
    costGradient.append('stop').attr('offset', '100%').attr('stop-color', '#b45309');

    // Blue gradient for KM
    const kmGradient = defs
      .append('linearGradient')
      .attr('id', 'd3KmGradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');
    kmGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6');
    kmGradient.append('stop').attr('offset', '100%').attr('stop-color', '#1d4ed8');

    // Determine current gradient & max value
    const gradientId =
      metric === 'liters'
        ? 'url(#d3LitersGradient)'
        : metric === 'cost'
        ? 'url(#d3CostGradient)'
        : 'url(#d3KmGradient)';

    const getVal = (d: VehicleFuelData) => {
      if (metric === 'liters') return d.liters;
      if (metric === 'cost') return d.cost;
      return d.km30d;
    };

    const maxVal = d3.max(fuelData, getVal) || 100;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(fuelData.map((d) => d.plate))
      .range([margin.left, width - margin.right])
      .padding(0.38);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.18])
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g.selectAll('.tick line').attr('stroke', '#64748b').attr('stroke-opacity', 0.15)
      );

    // Bars
    const barsGroup = svg.append('g').attr('class', 'bars');

    const bars = barsGroup
      .selectAll('rect')
      .data(fuelData)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.plate) || 0)
      .attr('y', height - margin.bottom)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', gradientId)
      .attr('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))');

    // Animate bars growth
    bars
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(getVal(d)))
      .attr('height', (d) => height - margin.bottom - yScale(getVal(d)));

    // Labels above bars
    const labelsGroup = svg.append('g').attr('class', 'bar-labels');

    labelsGroup
      .selectAll('text')
      .data(fuelData)
      .enter()
      .append('text')
      .attr('x', (d) => (xScale(d.plate) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(getVal(d)) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', metric === 'liters' ? '#059669' : metric === 'cost' ? '#d97706' : '#2563eb')
      .attr('opacity', 0)
      .text((d) => {
        const v = getVal(d);
        if (metric === 'liters') return `${v} L`;
        if (metric === 'cost') return `R$ ${Math.round(v)}`;
        return `${v} km`;
      })
      .transition()
      .delay(400)
      .duration(400)
      .attr('opacity', 1);

    // Mouse Events for Tooltip & Hover interaction
    bars
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 0.85)
          .attr('transform', `translate(0, -2)`);

        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          const clientX = event.clientX - bounds.left;
          const clientY = event.clientY - bounds.top;
          setTooltipData({
            visible: true,
            x: clientX,
            y: clientY - 10,
            data: d,
          });
        }
      })
      .on('mousemove', function (event) {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          const clientX = event.clientX - bounds.left;
          const clientY = event.clientY - bounds.top;
          setTooltipData((prev) => ({
            ...prev,
            x: clientX,
            y: clientY - 10,
          }));
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('transform', 'translate(0, 0)');

        setTooltipData({ visible: false, x: 0, y: 0 });
      });

    // X Axis
    const xAxisGroup = svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickSize(0));

    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1').attr('stroke-width', 1);

    xAxisGroup
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', '#475569')
      .attr('dy', '14px')
      .style('font-family', 'ui-monospace, monospace');

    // Sublabels for vehicle model under plate
    svg
      .append('g')
      .attr('class', 'model-sublabels')
      .selectAll('text')
      .data(fuelData)
      .enter()
      .append('text')
      .attr('x', (d) => (xScale(d.plate) || 0) + xScale.bandwidth() / 2)
      .attr('y', height - margin.bottom + 32)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#94a3b8')
      .text((d) => (d.model.length > 12 ? `${d.model.slice(0, 10)}..` : d.model));

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const n = Number(d);
        if (metric === 'cost') return `R$ ${n}`;
        if (metric === 'liters') return `${n} L`;
        return `${n} km`;
      });

    const yAxisGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis);

    yAxisGroup.select('.domain').remove();
    yAxisGroup
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#64748b');
  }, [fuelData, metric]);

  const hasRealRecentTrips = dailyTrips.some(
    (t) => t.status === 'finalizado' && t.endKm && t.endKm >= t.startKm
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Fuel className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Consumo de Combustível por Veículo (Últimos 30 Dias)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                D3.js
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Análise volumétrica e custo com abastecimento baseados nas rotas do último mês
            </p>
          </div>
        </div>

        {/* View Metric Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setMetric('liters')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                metric === 'liters'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Litros Consumidos"
            >
              Litros (L)
            </button>
            <button
              type="button"
              onClick={() => setMetric('cost')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                metric === 'cost'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Custo Estimado em R$"
            >
              Custo (R$)
            </button>
            <button
              type="button"
              onClick={() => setMetric('km')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                metric === 'km'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Quilometragem (30d)"
            >
              KM
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 block">Total em 30 Dias</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {totalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Litros
          </p>
          <span className="text-[10px] text-slate-400">{totalKm30d.toLocaleString('pt-BR')} KM rodados</span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 block">Custo Estimado</span>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
            R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">R$ {fuelPrice.toFixed(2)} / litro</span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 block">Maior Consumo</span>
          <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1 truncate">
            {topConsumer ? `${topConsumer.plate}` : '--'}
          </p>
          <span className="text-[10px] text-slate-400 truncate block">
            {topConsumer ? `${topConsumer.liters} L • ${topConsumer.model}` : 'Sem dados'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 block">Eficiência da Frota</span>
          <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {avgEfficiency} km/L
          </p>
          <span className="text-[10px] text-slate-400">Média calculada</span>
        </div>
      </div>

      {/* D3 SVG Container with Custom Tooltip */}
      <div ref={containerRef} className="relative w-full h-[310px] bg-white dark:bg-slate-900/40 rounded-xl overflow-hidden">
        {fuelData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Fuel className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Sem dados de combustível nos últimos 30 dias
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Conclua viagens na aba de Uso Diário ou ative a demonstração para explorar o gráfico D3.
            </p>
            <button
              type="button"
              onClick={() => setUseDemoFallback(true)}
              className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Simular gráfico D3 com dados de exemplo
            </button>
          </div>
        ) : (
          <>
            <svg ref={svgRef} className="w-full h-full select-none" />

            {/* Interactive D3 Floating Tooltip */}
            {tooltipData.visible && tooltipData.data && (
              <div
                className="absolute pointer-events-none z-30 -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 text-white dark:bg-slate-800/95 dark:text-white px-3 py-2.5 rounded-xl shadow-xl text-xs border border-slate-700/60 min-w-44 transition-all duration-75"
                style={{
                  left: `${Math.max(80, Math.min(containerRef.current ? containerRef.current.clientWidth - 80 : 200, tooltipData.x))}px`,
                  top: `${Math.max(10, tooltipData.y)}px`,
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-1.5">
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {tooltipData.data.plate}
                  </span>
                  <span className="text-[10px] text-slate-300">{tooltipData.data.model}</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Consumo em 30d:</span>
                    <span className="font-bold text-emerald-300">
                      {tooltipData.data.liters} Litros
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Custo Estimado:</span>
                    <span className="font-bold text-amber-300">
                      R$ {tooltipData.data.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">KM Percorrido:</span>
                    <span className="font-bold text-blue-300">
                      {tooltipData.data.km30d.toLocaleString('pt-BR')} KM
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-700/60 text-slate-400">
                    <span>Viagens realizadas:</span>
                    <span>{tooltipData.data.tripsCount} rotas</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info & Demo controls */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Gráfico construído com <strong>D3.js</strong> com base em odômetro e consumo médio da frota.
          </span>
        </div>

        {(!hasRealRecentTrips || useDemoFallback) && (
          <button
            type="button"
            onClick={() => setUseDemoFallback((prev) => !prev)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer self-start sm:self-auto"
          >
            {useDemoFallback ? 'Usar Dados Reais' : 'Ativar Dados de Exemplo'}
          </button>
        )}
      </div>
    </div>
  );
};
