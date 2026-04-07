const express = require('express');
const { env } = require('../config/env');
const { query } = require('../db');
const { buildExecutivePdf } = require('../utils/report');

const router = express.Router();

router.get('/client-pdf', async (req, res, next) => {
  try {
    const clientName = req.query.clientName || env.defaultClientName;

    const [campaignsResult, leadsResult] = await Promise.all([
      query(
        `SELECT name, status, objective, spend, leads_count AS "leadsCount", cost_per_lead AS "costPerLead"
         FROM campaigns
         ORDER BY spend DESC, synced_at DESC
         LIMIT 15`
      ),
      query(
        `SELECT name, email, source, campaign_name, status, score
         FROM leads
         ORDER BY created_at_local DESC
         LIMIT 15`
      )
    ]);

    const campaigns = campaignsResult.rows;
    const leads = leadsResult.rows;

    const totalLeads = leads.length;
    const totalCampaigns = campaigns.length;
    const totalSpend = campaigns.reduce((sum, item) => sum + Number(item.spend || 0), 0);
    const totalCampaignLeads = campaigns.reduce((sum, item) => sum + Number(item.leadsCount || 0), 0);
    const avgCostPerLead = totalCampaignLeads > 0 ? totalSpend / totalCampaignLeads : 0;
    const converted = leads.filter((item) => item.status === 'Convertido').length;
    const estimatedConversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

    buildExecutivePdf(res, {
      companyName: env.companyName,
      clientName,
      generatedAt: new Date(),
      dashboard: {
        totalLeads,
        totalCampaigns,
        totalSpend,
        avgCostPerLead,
        avgLeadScore: leads.length
          ? Math.round(leads.reduce((sum, item) => sum + Number(item.score || 0), 0) / leads.length)
          : 0,
        estimatedConversionRate
      },
      campaigns,
      leads,
      currency: env.defaultCurrency
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
