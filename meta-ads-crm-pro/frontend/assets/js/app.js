import { api } from './api.js';
import {
  renderCampaignTable,
  renderLeadTable,
  renderSyncLogs,
  announce
} from './ui.js';

// Initialize chart instances
let chartSpend, chartCPL, chartLeads;

// Format currency for display
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Format number with thousands separator
function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Render KPI cards
function renderKPIs(campaigns, leads) {
  const totalLeads = leads.reduce((sum, lead) => sum + 1, 0);
  const totalCampaigns = campaigns.length;
  const totalSpend = campaigns.reduce((sum, camp) => sum + (parseFloat(camp.spend) || 0), 0);
  const totalLeadsFromCampaigns = campaigns.reduce((sum, camp) => sum + (parseInt(camp.inline_post_engagement) || 0), 0);
  const avgCPL = totalLeadsFromCampaigns > 0 ? totalSpend / totalLeadsFromCampaigns : 0;

  document.getElementById('metricLeads').textContent = formatNumber(totalLeads);
  document.getElementById('metricCampaigns').textContent = formatNumber(totalCampaigns);
  document.getElementById('metricSpend').textContent = formatCurrency(totalSpend);
  document.getElementById('metricCpl').textContent = formatCurrency(avgCPL);
}

// Render Spend by Campaign chart
function renderSpendChart(campaigns) {
  const chartData = campaigns
    .filter(c => parseFloat(c.spend) > 0)
    .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend))
    .slice(0, 8);

  const options = {
    chart: {
      type: 'bar',
      height: 280,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      sparkline: { enabled: false },
      background: 'transparent'
    },
    colors: ['#00d4ff'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 4,
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      categories: chartData.map(c => c.name.substring(0, 15)),
      labels: {
        style: { fontSize: '11px', colors: '#7a8299', fontWeight: 600 }
      }
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: '#7a8299' },
        formatter: function(value) {
          return 'R$ ' + (value / 1000).toFixed(0) + 'k';
        }
      }
    },
    fill: { opacity: 1 },
    legend: { show: false },
    grid: {
      borderColor: 'rgba(26, 40, 71, 0.4)',
      yaxis: { lines: { show: true } }
    }
  };

  const series = [{
    name: 'Spend',
    data: chartData.map(c => parseFloat(c.spend) || 0)
  }];

  if (chartSpend) {
    chartSpend.destroy();
  }
  chartSpend = new ApexCharts(document.getElementById('chartSpend'), { ...options, series });
  chartSpend.render();
}

// Render CPL by Campaign chart
function renderCPLChart(campaigns) {
  const chartData = campaigns
    .map(c => ({
      name: c.name,
      cpl: (parseFloat(c.spend) || 0) / (parseInt(c.inline_post_engagement) || 1)
    }))
    .filter(c => c.cpl > 0)
    .sort((a, b) => b.cpl - a.cpl)
    .slice(0, 8);

  const options = {
    chart: {
      type: 'area',
      height: 280,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      sparkline: { enabled: false },
      background: 'transparent'
    },
    colors: ['#8b00ff'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.3,
        opacityTo: 0.05
      }
    },
    xaxis: {
      categories: chartData.map(c => c.name.substring(0, 12)),
      labels: {
        style: { fontSize: '11px', colors: '#7a8299', fontWeight: 600 }
      }
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: '#7a8299' },
        formatter: function(value) {
          return 'R$ ' + value.toFixed(0);
        }
      }
    },
    legend: { show: false },
    grid: {
      borderColor: 'rgba(26, 40, 71, 0.4)',
      yaxis: { lines: { show: true } }
    }
  };

  const series = [{
    name: 'CPL',
    data: chartData.map(c => parseFloat(c.cpl.toFixed(2)))
  }];

  if (chartCPL) {
    chartCPL.destroy();
  }
  chartCPL = new ApexCharts(document.getElementById('chartCPL'), { ...options, series });
  chartCPL.render();
}

// Render Leads by Campaign chart (pie)
function renderLeadsChart(campaigns) {
  const chartData = campaigns
    .filter(c => parseInt(c.inline_post_engagement) > 0)
    .sort((a, b) => parseInt(b.inline_post_engagement) - parseInt(a.inline_post_engagement))
    .slice(0, 6);

  const options = {
    chart: {
      type: 'donut',
      height: 280,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      background: 'transparent'
    },
    colors: ['#00d4ff', '#8b00ff', '#ff0080', '#0066ff', '#00ff88', '#ffaa00'],
    labels: chartData.map(c => c.name.substring(0, 18)),
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return Math.round(val) + '%';
      },
      style: {
        fontSize: '11px',
        colors: ['#ffffff']
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '11px',
      labels: { colors: '#b0b8d4' }
    }
  };

  const series = chartData.map(c => parseInt(c.inline_post_engagement) || 0);

  if (chartLeads) {
    chartLeads.destroy();
  }
  chartLeads = new ApexCharts(document.getElementById('chartLeads'), { ...options, series });
  chartLeads.render();
}

// Update status indicators
function updateStatus(configStatus) {
  // API Status - sempre online se conseguimos fazer a request
  const statusAPIElement = document.getElementById('statusAPI');
  if (statusAPIElement) {
    statusAPIElement.classList.add('online');
  }
  
  // Database Status - sempre online
  const statusDBElement = document.getElementById('statusDB');
  if (statusDBElement) {
    statusDBElement.classList.add('online');
  }
  
  // Meta API Status
  const statusMetaElement = document.getElementById('statusMeta');
  if (statusMetaElement) {
    if (configStatus && configStatus.configured) {
      statusMetaElement.classList.add('online');
    } else {
      statusMetaElement.classList.add('offline');
    }
  }
  
  // Pixel Status
  const statusPixelElement = document.getElementById('statusPixel');
  if (statusPixelElement) {
    if (window.fbq) {
      statusPixelElement.classList.add('online');
    }
  }
}

// Main refresh function
async function refreshAll() {
  try {
    const [configStatus, campaignData, leadData, syncLogs] = await Promise.all([
      api.getConfigStatus(),
      api.getCampaigns(),
      api.getLeads(),
      api.getSyncLogs()
    ]);

    const campaigns = campaignData.items || [];
    const leads = leadData.items || [];

    // Render all sections
    renderKPIs(campaigns, leads);
    renderSpendChart(campaigns);
    renderCPLChart(campaigns);
    renderLeadsChart(campaigns);
    updateStatus(configStatus);
    renderCampaignTable(campaigns);
    renderLeadTable(leads);
    renderSyncLogs(syncLogs.items || []);
  } catch (error) {
    announce(`Erro ao carregar dados: ${error.message}`);
  }
}

async function downloadPdf() {
  const clientName = document.getElementById('clientName').value || 'Cliente Exemplo';
  const blob = await api.getClientPdf(clientName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

// Event listeners
document.getElementById('btnTestConnection').addEventListener('click', async () => {
  try {
    const result = await api.testConnection();
    announce(`✅ Conexão validada com sucesso para ${result.user.name}.`);
    await api.trackPixelEvent('CompleteRegistration', {
      connection_status: 'success',
      timestamp: new Date().toISOString()
    }).catch(() => {});
    if (window.fbq) fbq('track', 'CompleteRegistration');
  } catch (error) {
    announce(`❌ ${error.message}`);
  }
});

document.getElementById('btnSyncCampaigns').addEventListener('click', async () => {
  try {
    const result = await api.syncCampaigns();
    announce(`✅ ${result.synced} campanha(s) sincronizada(s).`);
    await api.trackPixelEvent('Lead', {
      event_type: 'campaign_sync',
      campaigns_synced: result.synced,
      timestamp: new Date().toISOString()
    }).catch(() => {});
    if (window.fbq) fbq('track', 'Lead', { value: result.synced, currency: 'BRL' });
    await refreshAll();
  } catch (error) {
    announce(`❌ ${error.message}`);
  }
});

document.getElementById('btnSyncLeads').addEventListener('click', async () => {
  try {
    const result = await api.syncLeads();
    announce(`✅ ${result.synced} lead(s) sincronizado(s).`);
    await api.trackPixelEvent('Lead', {
      event_type: 'leads_sync',
      leads_synced: result.synced,
      timestamp: new Date().toISOString()
    }).catch(() => {});
    if (window.fbq) fbq('track', 'Lead', { value: result.synced, currency: 'BRL' });
    await refreshAll();
  } catch (error) {
    announce(`❌ ${error.message}`);
  }
});

document.getElementById('btnRefreshDashboard').addEventListener('click', async () => {
  try {
    announce('🔄 Atualizando dados...');
    await refreshAll();
    announce('✅ Dados atualizados com sucesso');
  } catch (error) {
    announce(`❌ ${error.message}`);
  }
});

document.getElementById('btnDownloadPdf').addEventListener('click', async () => {
  try {
    announce('📄 Gerando relatório...');
    await downloadPdf();
    announce('✅ Relatório baixado com sucesso');
  } catch (error) {
    announce(`❌ ${error.message}`);
  }
});

// Initial load
announce('⏳ Carregando dashboard...');
refreshAll().catch((error) => {
  announce(`❌ Falha ao carregar: ${error.message}`);
});
