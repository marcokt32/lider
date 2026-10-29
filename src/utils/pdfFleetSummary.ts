import { jsPDF } from 'jspdf';
import { Vehicle, Driver, DailyTrip, Maintenance, Fine } from '../types/index.ts';

interface GeneratePdfOptions {
  companyName?: string;
  userName?: string;
}

export function generateFleetSummaryPDF(
  vehicles: Vehicle[],
  drivers: Driver[],
  dailyTrips: DailyTrip[],
  maintenances: Maintenance[],
  fines: Fine[],
  options?: GeneratePdfOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Helper to ensure page bounds
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = margin;
      drawSubHeader();
    }
  };

  const drawSubHeader = () => {
    doc.setFillColor(30, 58, 138); // Navy blue
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LÍDER GESTOR DE FROTA - RESUMO EXECUTIVO (Continuação)', margin + 4, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${dateStr} ${timeStr}`, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
    currentY += 12;
  };

  // --- 1. COVER / MAIN HEADER ---
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F');

  // Decorative accent line
  doc.setFillColor(59, 130, 246); // #3B82F6
  doc.rect(margin, currentY + 24.5, contentWidth, 1.5, 'F');

  // Header texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LÍDER GESTOR DE FROTA', margin + 6, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(224, 231, 255);
  const company = options?.companyName || 'Líder Atendimento & Serviços';
  doc.text(`Resumo Executivo da Frota Própria • ${company}`, margin + 6, currentY + 16);

  doc.setFontSize(8);
  doc.setTextColor(191, 219, 254);
  doc.text(
    `Emissão: ${dateStr} às ${timeStr} • Responsável: ${options?.userName || 'Gestor de Frota'}`,
    margin + 6,
    currentY + 21
  );

  currentY += 32;

  // --- 2. EXECUTIVE METRICS CARDS ---
  const finishedTrips = dailyTrips.filter((t) => t.status === 'finalizado');
  const activeTrips = dailyTrips.filter((t) => t.status === 'em_andamento');
  const totalKmTraveled = finishedTrips.reduce((acc, t) => {
    if (t.endKm && t.endKm >= t.startKm) return acc + (t.endKm - t.startKm);
    return acc;
  }, 0);

  const totalMaintenanceCost = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);
  const totalFinesCost = fines.reduce((acc, f) => acc + (f.amount || 0), 0);

  const availableVehicles = vehicles.filter((v) => v.status === 'disponivel').length;
  const inUseVehicles = vehicles.filter((v) => v.status === 'em_uso').length;
  const inMaintenanceVehicles = vehicles.filter((v) => v.status === 'manutencao').length;

  const urgentMaintenanceCount = vehicles.filter((v) => {
    const kmSinceLast = v.currentKm - (v.lastMaintenanceKm || 0);
    const interval = v.maintenanceIntervalKm || 10000;
    return interval - kmSinceLast <= 500;
  }).length;

  // 4 KPI boxes
  const cardWidth = (contentWidth - 6) / 4;
  const cardHeight = 20;

  const kpis = [
    {
      title: 'TOTAL DA FROTA',
      value: `${vehicles.length} Veículos`,
      subtitle: `${availableVehicles} disp. | ${inUseVehicles} em uso | ${inMaintenanceVehicles} manut.`,
      color: [239, 246, 255],
      border: [191, 219, 254],
      text: [30, 58, 138],
    },
    {
      title: 'KM TOTAL RODADO',
      value: `${totalKmTraveled.toLocaleString('pt-BR')} KM`,
      subtitle: `${finishedTrips.length} viagens conl. (${activeTrips.length} ativas)`,
      color: [240, 253, 244],
      border: [187, 247, 208],
      text: [22, 101, 52],
    },
    {
      title: 'CUSTO MANUTENÇÃO',
      value: `R$ ${totalMaintenanceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${maintenances.length} registros (${urgentMaintenanceCount} alertas)`,
      color: [254, 242, 242],
      border: [254, 202, 202],
      text: [153, 27, 27],
    },
    {
      title: 'MULTAS & INFRAÇÕES',
      value: `R$ ${totalFinesCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${fines.length} infrações atribuídas`,
      color: [254, 252, 232],
      border: [254, 240, 138],
      text: [133, 77, 14],
    },
  ];

  kpis.forEach((kpi, index) => {
    const cardX = margin + index * (cardWidth + 2);
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, cardX + 3, currentY + 5);

    doc.setFontSize(10.5);
    doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
    doc.text(kpi.value, cardX + 3, currentY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtitle, cardX + 3, currentY + 16.5);
  });

  currentY += cardHeight + 8;

  // --- 3. SECTION: STATUS DA FROTA E VEÍCULOS ---
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Inventário Detalhado dos Veículos', margin, currentY);
  currentY += 4;

  // Table header
  const tableHeaderY = currentY;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, tableHeaderY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, tableHeaderY + 7, margin + contentWidth, tableHeaderY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);

  const colPlaca = margin + 3;
  const colModelo = margin + 26;
  const colAno = margin + 74;
  const colKmAtual = margin + 92;
  const colProxRevisao = margin + 120;
  const colAlertas = margin + 148;
  const colStatus = margin + contentWidth - 4;

  doc.text('PLACA', colPlaca, tableHeaderY + 4.5);
  doc.text('MARCA / MODELO', colModelo, tableHeaderY + 4.5);
  doc.text('ANO', colAno, tableHeaderY + 4.5);
  doc.text('KM ATUAL', colKmAtual, tableHeaderY + 4.5);
  doc.text('PRÓX. REVISÃO', colProxRevisao, tableHeaderY + 4.5);
  doc.text('PREVISÃO (10k)', colAlertas, tableHeaderY + 4.5);
  doc.text('STATUS', colStatus, tableHeaderY + 4.5, { align: 'right' });

  currentY += 7;

  // Table Rows
  vehicles.forEach((v, index) => {
    checkPageBreak(8);

    const kmSinceLast = v.currentKm - (v.lastMaintenanceKm || 0);
    const interval = v.maintenanceIntervalKm || 10000;
    const remainingKm = interval - kmSinceLast;
    const isUrgent = remainingKm <= 500;
    const nextRevisionKm = (v.lastMaintenanceKm || 0) + interval;

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY + 6.5, margin + contentWidth, currentY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(v.plate, colPlaca, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const modelText = `${v.brand} ${v.model}`.substring(0, 26);
    doc.text(modelText, colModelo, currentY + 4.2);

    doc.text(v.year.toString(), colAno, currentY + 4.2);
    doc.text(`${v.currentKm.toLocaleString('pt-BR')} KM`, colKmAtual, currentY + 4.2);
    doc.text(`${nextRevisionKm.toLocaleString('pt-BR')} KM`, colProxRevisao, currentY + 4.2);

    if (isUrgent) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text(`ALERTA: Faltam ${Math.max(0, remainingKm)} KM`, colAlertas, currentY + 4.2);
    } else {
      doc.setTextColor(71, 85, 105);
      doc.text(`Faltam ${remainingKm.toLocaleString('pt-BR')} KM`, colAlertas, currentY + 4.2);
    }

    doc.setFont('helvetica', 'bold');
    let statusLabel = 'Disponível';
    if (v.status === 'em_uso') {
      doc.setTextColor(2, 132, 199);
      statusLabel = 'Em Uso';
    } else if (v.status === 'manutencao') {
      doc.setTextColor(225, 29, 72);
      statusLabel = 'Manutenção';
    } else {
      doc.setTextColor(22, 163, 74);
    }
    doc.text(statusLabel, colStatus, currentY + 4.2, { align: 'right' });

    currentY += 6.5;
  });

  currentY += 8;

  // --- 4. SECTION: MOTORISTAS CADASTRADOS ---
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Condutores Cadastrados e Vinculados', margin, currentY);
  currentY += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);

  const colNome = margin + 3;
  const colCnh = margin + 65;
  const colCat = margin + 98;
  const colValidade = margin + 115;
  const colEmail = margin + 140;

  doc.text('NOME DO CONDUTOR', colNome, currentY + 4.5);
  doc.text('CNH', colCnh, currentY + 4.5);
  doc.text('CATEGORIA', colCat, currentY + 4.5);
  doc.text('VALIDADE', colValidade, currentY + 4.5);
  doc.text('VÍNCULO / E-MAIL', colEmail, currentY + 4.5);

  currentY += 7;

  drivers.forEach((d, index) => {
    checkPageBreak(7.5);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY + 6.5, margin + contentWidth, currentY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(d.name.substring(0, 32), colNome, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(d.cnhNumber || 'N/D', colCnh, currentY + 4.2);
    doc.text(d.cnhCategory || 'B', colCat, currentY + 4.2);
    doc.text(d.cnhExpiration || 'Regular', colValidade, currentY + 4.2);

    const emailDisplay = d.email ? d.email : (d.userId ? 'Conectado no App' : 'Registro Avulso');
    doc.text(emailDisplay.substring(0, 30), colEmail, currentY + 4.2);

    currentY += 6.5;
  });

  currentY += 8;

  // --- 5. SECTION: ÚLTIMAS VIAGENS ---
  checkPageBreak(35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Registro Recente de Viagens e Uso Diário (KM)', margin, currentY);
  currentY += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);

  const colData = margin + 3;
  const colVPlate = margin + 22;
  const colDriver = margin + 45;
  const colKmStart = margin + 90;
  const colKmEnd = margin + 112;
  const colDistance = margin + 135;
  const colTripStatus = margin + contentWidth - 4;

  doc.text('DATA', colData, currentY + 4.5);
  doc.text('PLACA', colVPlate, currentY + 4.5);
  doc.text('CONDUTOR', colDriver, currentY + 4.5);
  doc.text('KM INICIAL', colKmStart, currentY + 4.5);
  doc.text('KM FINAL', colKmEnd, currentY + 4.5);
  doc.text('RODADO', colDistance, currentY + 4.5);
  doc.text('STATUS', colTripStatus, currentY + 4.5, { align: 'right' });

  currentY += 7;

  const recentTrips = [...dailyTrips].slice(0, 12);
  if (recentTrips.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Nenhuma viagem registrada até o momento.', margin + 3, currentY + 6);
    currentY += 10;
  } else {
    recentTrips.forEach((t, index) => {
      checkPageBreak(7.5);

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 6.5, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 6.5, margin + contentWidth, currentY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(t.date, colData, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(t.vehiclePlate, colVPlate, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.text(t.driverName.substring(0, 24), colDriver, currentY + 4.2);

      doc.text(`${t.startKm.toLocaleString('pt-BR')} KM`, colKmStart, currentY + 4.2);
      doc.text(t.endKm ? `${t.endKm.toLocaleString('pt-BR')} KM` : '--', colKmEnd, currentY + 4.2);

      const dist = t.endKm && t.endKm >= t.startKm ? t.endKm - t.startKm : 0;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(dist > 0 ? `${dist.toLocaleString('pt-BR')} KM` : 'Em trânsito', colDistance, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(
        t.status === 'finalizado' ? 22 : 217,
        t.status === 'finalizado' ? 101 : 119,
        t.status === 'finalizado' ? 52 : 6
      );
      doc.text(t.status === 'finalizado' ? 'Finalizada' : 'Em Aberto', colTripStatus, currentY + 4.2, { align: 'right' });

      currentY += 6.5;
    });
  }

  currentY += 8;

  // --- 6. SECTION: HISTÓRICO DE MANUTENÇÃO ---
  if (maintenances.length > 0) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Manutenções Registradas e Custos', margin, currentY);
    currentY += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);

    const colMDate = margin + 3;
    const colMPlate = margin + 25;
    const colMType = margin + 50;
    const colMDesc = margin + 85;
    const colMCost = margin + contentWidth - 4;

    doc.text('DATA', colMDate, currentY + 4.5);
    doc.text('PLACA', colMPlate, currentY + 4.5);
    doc.text('TIPO', colMType, currentY + 4.5);
    doc.text('OFICINA / OBSERVAÇÕES', colMDesc, currentY + 4.5);
    doc.text('VALOR (R$)', colMCost, currentY + 4.5, { align: 'right' });

    currentY += 7;

    maintenances.slice(0, 10).forEach((m, idx) => {
      checkPageBreak(7.5);

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 6.5, 'F');
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + 6.5, margin + contentWidth, currentY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(m.date, colMDate, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(m.vehiclePlate, colMPlate, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      const tipo = m.serviceType || 'Revisão';
      doc.text(tipo.substring(0, 22), colMType, currentY + 4.2);

      const desc = m.notes ? `${m.workshop}: ${m.notes}` : m.workshop || 'Oficina Credenciada';
      doc.text(desc.substring(0, 48), colMDesc, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text(
        `R$ ${(m.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        colMCost,
        currentY + 4.2,
        { align: 'right' }
      );

      currentY += 6.5;
    });
  }

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Líder Gestor de Frota • Sistema de Controle Diário de KM e Manutenção Preventiva', margin, pageHeight - 6);

    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  const fileName = `resumo_frota_lider_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
