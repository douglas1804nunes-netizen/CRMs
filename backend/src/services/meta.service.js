const axios = require('axios');
const { env } = require('../config/env');
const { query } = require('../db');
const { calculateLeadScore } = require('../utils/scoring');

const META_BASE_URL = 'https://graph.facebook.com/v25.0';

function requireMetaEnv() {
  const missing = [];
  if (!env.metaAccessToken) missing.push('META_ACCESS_TOKEN');
  if (!env.metaAdAccountId) missing.push('META_AD_ACCOUNT_ID');
  if (!env.metaFormId) missing.push('META_FORM_ID');

  if (missing.length) {
    const error = new Error(`Variáveis ausentes: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

async function metaGet(path, params = {}) {
  try {
    const response = await axios.get(`${META_BASE_URL}${path}`, {
      params: {
        access_token: env.metaAccessToken,
        ...params
      }
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    const errorType = error.response?.data?.error?.type;
    
    const enhancedError = new Error(errorMessage);
    enhancedError.metaErrorCode = errorCode;
    enhancedError.metaErrorType = errorType;
    enhancedError.originalError = error;
    
    throw enhancedError;
  }
}

async function logSync(syncType, level, message, payload = {}) {
  await query(
    `INSERT INTO sync_logs (sync_type, level, message, payload)
     VALUES ($1, $2, $3, $4)`,
    [syncType, level, message, payload]
  );
}

function normalizeFieldData(fieldData = []) {
  const result = {};
  fieldData.forEach((item) => {
    const key = String(item.name || '').toLowerCase();
    const value = Array.isArray(item.values) ? item.values[0] : item.values;
    result[key] = value;
  });
  return result;
}

function parseActionValue(actions = [], actionType) {
  const item = actions.find((entry) => entry.action_type === actionType);
  return item ? Number(item.value || 0) : 0;
}

function parseCostActionValue(costActions = [], actionType) {
  const item = costActions.find((entry) => entry.action_type === actionType);
  return item ? Number(item.value || 0) : 0;
}

async function testConnection() {
  requireMetaEnv();

  const me = await metaGet('/me', {
    fields: 'id,name'
  });

  return {
    ok: true,
    user: me
  };
}

async function fetchCampaignsWithInsights() {
  requireMetaEnv();

  const campaignsResponse = await metaGet(`/${env.metaAdAccountId}/campaigns`, {
    fields: 'id,name,status,effective_status,objective,created_time,start_time,stop_time',
    limit: 100
  });

  const insightsResponse = await metaGet(`/${env.metaAdAccountId}/insights`, {
    level: 'campaign',
    date_preset: 'last_30d',
    fields: 'campaign_id,campaign_name,impressions,reach,clicks,ctr,cpc,spend,actions,cost_per_action_type',
    limit: 100
  });

  const insightMap = new Map(
    (insightsResponse.data || []).map((item) => [item.campaign_id, item])
  );

  const campaigns = (campaignsResponse.data || []).map((campaign) => {
    const insight = insightMap.get(campaign.id) || {};
    const leadsCount = parseActionValue(insight.actions || [], 'lead');
    const costPerLead =
      parseCostActionValue(insight.cost_per_action_type || [], 'lead') ||
      (leadsCount > 0 ? Number(insight.spend || 0) / leadsCount : 0);

    return {
      meta_campaign_id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      effective_status: campaign.effective_status,
      objective: campaign.objective,
      impressions: Number(insight.impressions || 0),
      reach: Number(insight.reach || 0),
      clicks: Number(insight.clicks || 0),
      ctr: Number(insight.ctr || 0),
      cpc: Number(insight.cpc || 0),
      spend: Number(insight.spend || 0),
      leads_count: leadsCount,
      cost_per_lead: Number(costPerLead || 0),
      raw_json: { campaign, insight }
    };
  });

  return campaigns;
}

function generateMockCampaigns() {
  const campaigns = [
    {
      meta_campaign_id: 'mock_campaign_001',
      name: '🚀 Campanha Lançamento Produto',
      status: 'ACTIVE',
      effective_status: 'ACTIVE',
      objective: 'LEAD_GENERATION',
      impressions: 12543,
      reach: 8234,
      clicks: 342,
      ctr: 2.73,
      cpc: 14.52,
      spend: 4967.34,
      leads_count: 127,
      cost_per_lead: 39.10,
      raw_json: {}
    },
    {
      meta_campaign_id: 'mock_campaign_002',
      name: 'Remarketing - Website Visitors',
      status: 'ACTIVE',
      effective_status: 'ACTIVE',
      objective: 'LINK_CLICKS',
      impressions: 8756,
      reach: 5432,
      clicks: 234,
      ctr: 2.67,
      cpc: 12.34,
      spend: 2889.56,
      leads_count: 89,
      cost_per_lead: 32.47,
      raw_json: {}
    },
    {
      meta_campaign_id: 'mock_campaign_003',
      name: 'Brand Awareness - Cold Audience',
      status: 'ACTIVE',
      effective_status: 'ACTIVE',
      objective: 'REACH',
      impressions: 45234,
      reach: 32100,
      clicks: 678,
      ctr: 1.50,
      cpc: 8.92,
      spend: 6051.76,
      leads_count: 156,
      cost_per_lead: 38.79,
      raw_json: {}
    },
    {
      meta_campaign_id: 'mock_campaign_004',
      name: 'Engajamento - Followers Campaign',
      status: 'PAUSED',
      effective_status: 'PAUSED',
      objective: 'ENGAGEMENT',
      impressions: 22100,
      reach: 15600,
      clicks: 445,
      ctr: 2.01,
      cpc: 5.67,
      spend: 2523.15,
      leads_count: 23,
      cost_per_lead: 109.70,
      raw_json: {}
    },
    {
      meta_campaign_id: 'mock_campaign_005',
      name: 'Conversão - Purchase Intent',
      status: 'ACTIVE',
      effective_status: 'ACTIVE',
      objective: 'CONVERSIONS',
      impressions: 34567,
      reach: 24300,
      clicks: 892,
      ctr: 2.58,
      cpc: 11.23,
      spend: 10023.16,
      leads_count: 234,
      cost_per_lead: 42.83,
      raw_json: {}
    }
  ];

  return campaigns;
}

function generateMockLeads() {
  const firstNames = ['João', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Julia', 'Lucas', 'Sofia', 'Bruno', 'Isabella'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Costa', 'Ferreira', 'Rodrigues', 'Martins', 'Pereira', 'Alves', 'Sousa'];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'empresa.com.br'];
  const phoneAreaCodes = ['11', '21', '31', '41', '51', '61', '71', '81', '85'];
  const campaigns = ['🚀 Campanha Lançamento Produto', 'Remarketing - Website Visitors', 'Brand Awareness - Cold Audience'];
  
  const leads = [];
  for (let i = 0; i < 23; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const areaCode = phoneAreaCodes[Math.floor(Math.random() * phoneAreaCodes.length)];
    const campaignName = campaigns[Math.floor(Math.random() * campaigns.length)];
    
    leads.push({
      meta_lead_id: `mock_lead_${String(i + 1).padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      phone: `${areaCode} 9${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      source: 'Meta Lead Ads',
      campaign_meta_id: `mock_campaign_${String(Math.floor(i / 5) + 1).padStart(3, '0')}`,
      campaign_name: campaignName,
      ad_id: null,
      ad_name: null,
      form_id: env.metaFormId || '2108659393199497',
      status: Math.random() > 0.7 ? 'Convertido' : 'Novo',
      notes: 'Lead de demonstração - dados mockados',
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: campaignName,
      utm_content: `ad_${i}`,
      estimated_revenue: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) + 500 : 0,
      created_at_meta: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      raw_json: {}
    });
  }
  
  return leads;
}

async function upsertCampaigns(campaigns) {
  let synced = 0;

  for (const campaign of campaigns) {
    await query(
      `INSERT INTO campaigns (
        meta_campaign_id, name, status, effective_status, objective, impressions, reach, clicks, ctr, cpc, spend, leads_count, cost_per_lead, synced_at, raw_json
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),$14
      )
      ON CONFLICT (meta_campaign_id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        effective_status = EXCLUDED.effective_status,
        objective = EXCLUDED.objective,
        impressions = EXCLUDED.impressions,
        reach = EXCLUDED.reach,
        clicks = EXCLUDED.clicks,
        ctr = EXCLUDED.ctr,
        cpc = EXCLUDED.cpc,
        spend = EXCLUDED.spend,
        leads_count = EXCLUDED.leads_count,
        cost_per_lead = EXCLUDED.cost_per_lead,
        synced_at = NOW(),
        raw_json = EXCLUDED.raw_json`,
      [
        campaign.meta_campaign_id,
        campaign.name,
        campaign.status,
        campaign.effective_status,
        campaign.objective,
        campaign.impressions,
        campaign.reach,
        campaign.clicks,
        campaign.ctr,
        campaign.cpc,
        campaign.spend,
        campaign.leads_count,
        campaign.cost_per_lead,
        JSON.stringify(campaign.raw_json)
      ]
    );
    synced += 1;
  }

  await logSync('campaigns', 'success', `${synced} campanhas sincronizadas`, { synced });
  return synced;
}

async function hydrateCampaignFromAd(adId) {
  if (!adId) return null;

  try {
    const ad = await metaGet(`/${adId}`, {
      fields: 'id,name,campaign{id,name},adset{id,name}'
    });

    return {
      campaign_id: ad?.campaign?.id || null,
      campaign_name: ad?.campaign?.name || null,
      ad_name: ad?.name || null
    };
  } catch (error) {
    return null;
  }
}

async function fetchLeads() {
  requireMetaEnv();

  const response = await metaGet(`/${env.metaFormId}/leads`, {
    fields: 'id,created_time,field_data,ad_id,ad_name,adset_id,campaign_id,form_id,platform,is_organic'
  });

  const leads = [];
  for (const lead of response.data || []) {
    const fields = normalizeFieldData(lead.field_data);
    let campaignId = lead.campaign_id || null;
    let campaignName = null;
    let adName = lead.ad_name || null;

    if (!campaignId && lead.ad_id) {
      const hydrated = await hydrateCampaignFromAd(lead.ad_id);
      if (hydrated) {
        campaignId = hydrated.campaign_id || campaignId;
        campaignName = hydrated.campaign_name || campaignName;
        adName = hydrated.ad_name || adName;
      }
    }

    leads.push({
      meta_lead_id: lead.id,
      name: fields.full_name || fields.nome_completo || fields.nome || 'Lead sem nome',
      email: fields.email || '',
      phone: fields.phone_number || fields.telefone || fields.telefone_celular || '',
      source: lead.platform || 'Meta Lead Ads',
      campaign_meta_id: campaignId,
      campaign_name: campaignName || 'Campanha não identificada',
      ad_id: lead.ad_id || null,
      ad_name: adName || null,
      form_id: lead.form_id || env.metaFormId,
      status: 'Novo',
      notes: 'Importado automaticamente do Meta Lead Ads',
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: campaignName || '',
      utm_content: adName || '',
      estimated_revenue: 0,
      created_at_meta: lead.created_time || null,
      raw_json: lead
    });
  }

  return leads;
}

async function upsertLeads(leads) {
  let synced = 0;

  for (const lead of leads) {
    const score = calculateLeadScore(lead);

    await query(
      `INSERT INTO leads (
        meta_lead_id, name, email, phone, source, campaign_meta_id, campaign_name, ad_id, ad_name, form_id, status, score, notes,
        utm_source, utm_medium, utm_campaign, utm_content, estimated_revenue, created_at_meta, raw_json
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )
      ON CONFLICT (meta_lead_id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        source = EXCLUDED.source,
        campaign_meta_id = EXCLUDED.campaign_meta_id,
        campaign_name = EXCLUDED.campaign_name,
        ad_id = EXCLUDED.ad_id,
        ad_name = EXCLUDED.ad_name,
        form_id = EXCLUDED.form_id,
        score = EXCLUDED.score,
        utm_source = EXCLUDED.utm_source,
        utm_medium = EXCLUDED.utm_medium,
        utm_campaign = EXCLUDED.utm_campaign,
        utm_content = EXCLUDED.utm_content,
        created_at_meta = EXCLUDED.created_at_meta,
        raw_json = EXCLUDED.raw_json`,
      [
        lead.meta_lead_id,
        lead.name,
        lead.email,
        lead.phone,
        lead.source,
        lead.campaign_meta_id,
        lead.campaign_name,
        lead.ad_id,
        lead.ad_name,
        lead.form_id,
        lead.status,
        score,
        lead.notes,
        lead.utm_source,
        lead.utm_medium,
        lead.utm_campaign,
        lead.utm_content,
        lead.estimated_revenue,
        lead.created_at_meta,
        JSON.stringify(lead.raw_json)
      ]
    );

    synced += 1;
  }

  await logSync('leads', 'success', `${synced} leads sincronizados`, { synced });
  return synced;
}

async function fetchDashboardSummary() {
  const [campaignsResult, leadsResult, leadTotalsResult] = await Promise.all([
    query(
      `SELECT meta_campaign_id, name, status, objective, spend, leads_count, cost_per_lead, clicks, ctr
       FROM campaigns
       ORDER BY spend DESC, synced_at DESC
       LIMIT 20`
    ),
    query(
      `SELECT id, name, email, source, campaign_name, status, score, created_at_local
       FROM leads
       ORDER BY created_at_local DESC
       LIMIT 50`
    ),
    query(
      `SELECT
         COUNT(*)::int AS total_leads,
         COALESCE(AVG(score), 0)::numeric AS avg_score,
         COUNT(*) FILTER (WHERE status = 'Convertido')::int AS converted
       FROM leads`
    )
  ]);

  const campaignRows = campaignsResult.rows;
  const leadRows = leadsResult.rows;
  const leadTotals = leadTotalsResult.rows[0];

  const totalLeads = Number(leadTotals.total_leads || 0);
  const totalCampaigns = campaignRows.length;
  const totalSpend = campaignRows.reduce((sum, item) => sum + Number(item.spend || 0), 0);
  const totalCampaignLeads = campaignRows.reduce((sum, item) => sum + Number(item.leads_count || 0), 0);
  const avgCostPerLead = totalCampaignLeads > 0 ? totalSpend / totalCampaignLeads : 0;
  const avgLeadScore = Math.round(Number(leadTotals.avg_score || 0));
  const converted = Number(leadTotals.converted || 0);
  const estimatedConversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  return {
    dashboard: {
      totalLeads,
      totalCampaigns,
      totalSpend,
      avgCostPerLead,
      avgLeadScore,
      estimatedConversionRate
    },
    campaigns: campaignRows,
    leads: leadRows
  };
}

module.exports = {
  testConnection,
  fetchCampaignsWithInsights,
  generateMockCampaigns,
  generateMockLeads,
  upsertCampaigns,
  fetchLeads,
  upsertLeads,
  fetchDashboardSummary
};
