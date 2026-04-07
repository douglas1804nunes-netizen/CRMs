const express = require('express');
const { env } = require('../config/env');
const {
  testConnection,
  fetchCampaignsWithInsights,
  generateMockCampaigns,
  generateMockLeads,
  upsertCampaigns,
  fetchLeads,
  upsertLeads,
  fetchDashboardSummary
} = require('../services/meta.service');
const { trackPixelEvent, getPixelEventLogs } = require('../services/pixel.service');
const { query } = require('../db');

const router = express.Router();

router.get('/config-status', (req, res) => {
  const configured = Boolean(env.metaAccessToken && env.metaAdAccountId && env.metaFormId);
  res.json({
    configured,
    pageId: env.metaPageId ? `${env.metaPageId}` : null,
    formId: env.metaFormId ? `${env.metaFormId}` : null,
    adAccountId: env.metaAdAccountId ? `${env.metaAdAccountId}` : null,
    pixelId: env.metaPixelId ? `${env.metaPixelId}` : null,
    companyName: env.companyName,
    pixelConfigured: Boolean(env.metaPixelId)
  });
});

router.post('/test-connection', async (req, res, next) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/sync/campaigns', async (req, res, next) => {
  try {
    let campaigns;
    try {
      // Tentar buscar dados reais da Meta API
      campaigns = await fetchCampaignsWithInsights();
    } catch (metaError) {
      // Se falhar com erro de permissão ou campo inexistente, usar dados mock
      if (metaError.message && (
        metaError.message.includes('Missing Permissions') ||
        metaError.message.includes('nonexisting field') ||
        metaError.message.includes('Tried accessing')
      )) {
        console.warn('⚠️ Meta API permissions missing, using mock data for demonstration');
        campaigns = generateMockCampaigns();
      } else {
        throw metaError;
      }
    }
    
    const synced = await upsertCampaigns(campaigns);
    res.json({
      ok: true,
      synced,
      campaigns,
      mode: campaigns[0]?.meta_campaign_id?.startsWith('mock_') ? 'demonstration' : 'live'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/sync/leads', async (req, res, next) => {
  try {
    let leads;
    try {
      // Tentar buscar dados reais da Meta API
      leads = await fetchLeads();
    } catch (metaError) {
      // Se falhar com erro de permissão ou campo inexistente, usar dados mock
      if (metaError.message && (
        metaError.message.includes('Missing Permissions') ||
        metaError.message.includes('nonexisting field') ||
        metaError.message.includes('Tried accessing')
      )) {
        console.warn('⚠️ Meta API permissions missing, using mock data for demonstration');
        leads = generateMockLeads();
      } else {
        throw metaError;
      }
    }
    
    const synced = await upsertLeads(leads);
    res.json({
      ok: true,
      synced,
      leads,
      mode: leads[0]?.meta_lead_id?.startsWith('mock_') ? 'demonstration' : 'live'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const result = await fetchDashboardSummary();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/campaigns', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT meta_campaign_id, name, status, effective_status, objective, impressions, reach, clicks, ctr, cpc, spend, leads_count, cost_per_lead, synced_at
       FROM campaigns
       ORDER BY spend DESC, synced_at DESC`
    );
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/leads', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, meta_lead_id, name, email, phone, source, campaign_meta_id, campaign_name, ad_id, ad_name, form_id, status, score,
              notes, utm_source, utm_medium, utm_campaign, utm_content, estimated_revenue, created_at_meta, created_at_local
       FROM leads
       ORDER BY created_at_local DESC`
    );
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/sync-logs', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, sync_type, level, message, created_at
       FROM sync_logs
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/track-event', async (req, res, next) => {
  try {
    const { eventName, data } = req.body;
    const result = await trackPixelEvent(eventName, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/pixel-logs', async (req, res, next) => {
  try {
    const result = await getPixelEventLogs();
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
