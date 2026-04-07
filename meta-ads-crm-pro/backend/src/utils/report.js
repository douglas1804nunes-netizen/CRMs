const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');

function money(value, currency = 'BRL') {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency
  }).format(amount);
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function drawMetricCard(doc, { x, y, w, h, label, value, accent = '#1d4ed8' }) {
  doc.save();
  doc.roundedRect(x, y, w, h, 12).fillAndStroke('#f8fafc', '#e5e7eb');
  doc.fillColor('#64748b').fontSize(9).text(label, x + 14, y + 14);
  doc.fillColor(accent).font('Helvetica-Bold').fontSize(18).text(value, x + 14, y + 34);
  doc.restore();
}

function addTableHeader(doc, columns, startY) {
  let x = 40;
  doc.save();
  doc.roundedRect(40, startY, 515, 24, 8).fill('#0f172a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  columns.forEach((col) => {
    doc.text(col.label, x + 6, startY + 8, { width: col.width - 12 });
    x += col.width;
  });
  doc.restore();
}

function addTableRows(doc, rows, columns, startY) {
  let y = startY + 28;
  rows.forEach((row, rowIndex) => {
    const fill = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
    let x = 40;
    const rowHeight = 28;
    doc.save();
    doc.roundedRect(40, y, 515, rowHeight, 4).fill(fill);
    doc.fillColor('#0f172a').font('Helvetica').fontSize(9);
    columns.forEach((col) => {
      doc.text(String(row[col.key] ?? '—'), x + 6, y + 9, { width: col.width - 12, ellipsis: true });
      x += col.width;
    });
    doc.restore();
    y += rowHeight + 4;
  });
  return y;
}

function buildExecutivePdf(res, payload) {
  const {
    companyName,
    clientName,
    generatedAt,
    dashboard,
    campaigns,
    leads,
    currency
  } = payload;

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: 'Relatório Executivo - Meta Ads CRM Pro',
      Author: companyName
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="relatorio-meta-ads-crm-pro.pdf"');
  doc.pipe(res);

  doc.rect(0, 0, 595, 842).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(24).text('Relatório Executivo de CRM', 40, 42);
  doc.fillColor('#334155').font('Helvetica').fontSize(11).text(companyName, 40, 78);
  doc.text(`Cliente: ${clientName}`, 40, 95);
  doc.text(`Gerado em: ${dayjs(generatedAt).format('DD/MM/YYYY HH:mm')}`, 40, 112);

  doc.save();
  doc.roundedRect(360, 42, 195, 90, 16).fill('#0f172a');
  doc.fillColor('#93c5fd').font('Helvetica').fontSize(10).text('Painel Profissional Meta Ads', 376, 60);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('CRM + Leads + Campanhas + PDF', 376, 78, { width: 155 });
  doc.restore();

  drawMetricCard(doc, { x: 40, y: 155, w: 122, h: 78, label: 'Total de Leads', value: String(dashboard.totalLeads), accent: '#2563eb' });
  drawMetricCard(doc, { x: 173, y: 155, w: 122, h: 78, label: 'Campanhas', value: String(dashboard.totalCampaigns), accent: '#7c3aed' });
  drawMetricCard(doc, { x: 306, y: 155, w: 122, h: 78, label: 'Investimento', value: money(dashboard.totalSpend, currency), accent: '#059669' });
  drawMetricCard(doc, { x: 439, y: 155, w: 116, h: 78, label: 'CPL Médio', value: money(dashboard.avgCostPerLead, currency), accent: '#ea580c' });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Resumo Estratégico', 40, 258);
  doc.font('Helvetica').fontSize(10).fillColor('#334155');
  const summaryText = [
    `• Taxa de conversão estimada do funil: ${percent(dashboard.estimatedConversionRate)}.`,
    `• Score médio dos leads: ${dashboard.avgLeadScore}.`,
    `• Custo por lead consolidado: ${money(dashboard.avgCostPerLead, currency)}.`,
    `• Campanha líder em volume: ${campaigns[0]?.name || 'Sem dados'}.`
  ].join('\n');
  doc.text(summaryText, 40, 282, { width: 515, lineGap: 4 });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Campanhas importadas do Meta Ads', 40, 360);
  const campaignColumns = [
    { key: 'name', label: 'Campanha', width: 180 },
    { key: 'status', label: 'Status', width: 75 },
    { key: 'objective', label: 'Objetivo', width: 110 },
    { key: 'spendFormatted', label: 'Invest.', width: 70 },
    { key: 'leadsCount', label: 'Leads', width: 40 },
    { key: 'costPerLeadFormatted', label: 'CPL', width: 40 }
  ];
  addTableHeader(doc, campaignColumns, 384);
  const campaignRows = campaigns.slice(0, 8).map((c) => ({
    ...c,
    spendFormatted: money(c.spend, currency),
    costPerLeadFormatted: money(c.costPerLead, currency)
  }));
  let currentY = addTableRows(doc, campaignRows, campaignColumns, 384);

  if (currentY > 700) {
    doc.addPage();
    currentY = 40;
  } else {
    currentY += 14;
  }

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Leads recentes sincronizados', 40, currentY);
  currentY += 24;
  const leadColumns = [
    { key: 'name', label: 'Lead', width: 140 },
    { key: 'email', label: 'E-mail', width: 150 },
    { key: 'source', label: 'Fonte', width: 70 },
    { key: 'campaign_name', label: 'Campanha', width: 110 },
    { key: 'status', label: 'Status', width: 45 }
  ];
  addTableHeader(doc, leadColumns, currentY);
  addTableRows(doc, leads.slice(0, 10), leadColumns, currentY);

  doc.addPage();
  doc.rect(0, 0, 595, 842).fill('#ffffff');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(20).text('Como vender esse CRM para empresas', 40, 50);
  doc.fillColor('#334155').font('Helvetica').fontSize(11).text(
    'Posicione o produto como um painel que reduz trabalho manual, organiza os leads do Meta Ads, identifica campanhas rentáveis e entrega PDF executivo para o cliente final.',
    40,
    90,
    { width: 515, lineGap: 4 }
  );

  const bullets = [
    'Centralização: campanhas, leads e métricas em um único ambiente.',
    'Velocidade comercial: dashboard pronto para reunião e fechamento.',
    'Autoridade: PDF executivo para prestação de contas profissional.',
    'Escalabilidade: backend com Node.js, PostgreSQL e Docker.',
    'Segurança: token da Meta armazenado no servidor, nunca no front público.'
  ];

  let bulletY = 140;
  bullets.forEach((item) => {
    doc.fillColor('#1d4ed8').font('Helvetica-Bold').text('•', 44, bulletY);
    doc.fillColor('#0f172a').font('Helvetica').text(item, 58, bulletY, { width: 490 });
    bulletY += 28;
  });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Próximo passo recomendado', 40, 320);
  doc.fillColor('#334155').font('Helvetica').fontSize(11).text(
    'Hospede o front no GitHub Pages e publique a API + banco em um servidor Docker ou plataforma compatível. Depois, conecte as credenciais reais da Meta no arquivo .env do backend.',
    40,
    346,
    { width: 515, lineGap: 4 }
  );

  doc.end();
}

module.exports = { buildExecutivePdf };
