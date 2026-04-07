import { badgeClass, formatMoney } from './config.js';

let campaignChart;

function safeText(value) {
  return value ?? '—';
}

export function renderConfigStatus(data) {
  const box = document.getElementById('configStatusBox');

  if (!data.configured) {
    box.innerHTML = `
      <p><strong>Back-end ainda não configurado.</strong></p>
      <p>Preencha o arquivo <code>.env</code> do back-end com token, conta, página e formulário.</p>
    `;
    return;
  }

  box.innerHTML = `
    <p><strong>Configuração carregada com sucesso.</strong></p>
    <p><strong>Conta:</strong> ${safeText(data.adAccountId)}</p>
    <p><strong>Página:</strong> ${safeText(data.pageId)}</p>
    <p><strong>Formulário:</strong> ${safeText(data.formId)}</p>
  `;
}

export function renderDashboard({ dashboard }) {
  document.getElementById('metricLeads').textContent = dashboard.totalLeads;
  document.getElementById('metricCampaigns').textContent = dashboard.totalCampaigns;
  document.getElementById('metricSpend').textContent = formatMoney(dashboard.totalSpend);
  document.getElementById('metricCpl').textContent = formatMoney(dashboard.avgCostPerLead);
}

export function renderCampaignTable(items = []) {
  const body = document.getElementById('campaignTableBody');
  body.innerHTML = items.length
    ? items.map((item) => `
      <tr>
        <td>${safeText(item.name)}</td>
        <td><span class="badge ${badgeClass(item.status)}">${safeText(item.status)}</span></td>
        <td>${safeText(item.objective)}</td>
        <td>${formatMoney(item.spend)}</td>
        <td>${safeText(item.leads_count)}</td>
        <td>${formatMoney(item.cost_per_lead)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6">Nenhuma campanha sincronizada ainda.</td></tr>`;
}

export function renderLeadTable(items = []) {
  const body = document.getElementById('leadTableBody');
  body.innerHTML = items.length
    ? items.map((item) => `
      <tr>
        <td>${safeText(item.name)}</td>
        <td>${safeText(item.email || item.phone)}</td>
        <td>${safeText(item.source)}</td>
        <td>${safeText(item.campaign_name)}</td>
        <td><span class="badge ${badgeClass(item.status)}">${safeText(item.status)}</span></td>
        <td>${safeText(item.score)}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6">Nenhum lead sincronizado ainda.</td></tr>`;
}

export function renderSyncLogs(items = []) {
  const box = document.getElementById('syncLogs');
  box.innerHTML = items.length
    ? items.map((item) => `
      <div class="log-item">
        <div class="log-meta">${safeText(item.sync_type)} • ${new Date(item.created_at).toLocaleString('pt-BR')}</div>
        <div>${safeText(item.message)}</div>
      </div>
    `).join('')
    : '<div class="log-item">Sem logs por enquanto.</div>';
}

export function renderCampaignChart(items = []) {
  const canvas = document.getElementById('campaignChart');
  const labels = items.slice(0, 8).map((item) => item.name);
  const spend = items.slice(0, 8).map((item) => Number(item.spend || 0));

  if (campaignChart) {
    campaignChart.destroy();
  }

  campaignChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Investimento',
          data: spend,
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatMoney(value)
          }
        }
      }
    }
  });
}

export function announce(message) {
  window.alert(message);
}
