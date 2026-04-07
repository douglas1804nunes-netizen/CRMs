const crypto = require('crypto');
const { env } = require('../config/env');
const { query } = require('../db');
const { calculateLeadScore } = require('../utils/scoring');
const { trackLeadConversion, trackLeadQualified } = require('./pixel.service');

/**
 * Valida a assinatura da webhook usando HMAC
 * Meta envia: X-Hub-Signature com formato "sha256=hash"
 */
function validateWebhookSignature(body, signature) {
  if (!env.metaWebhookToken) {
    console.warn('META_WEBHOOK_TOKEN não configurado - pulando validação');
    return false;
  }

  // Body deve ser string para gerar hash correto
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  
  const hash = crypto
    .createHmac('sha256', env.metaWebhookToken)
    .update(bodyString)
    .digest('hex');

  const expectedSignature = `sha256=${hash}`;
  
  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Processa evento de webhook da Meta
 * Tipos: lead, page_messaging, messaging_postbacks, etc
 */
async function processWebhookEvent(event) {
  const { object, entry } = event;

  if (object !== 'page') {
    console.log(`Evento ${object} ignorado - só processamos page events`);
    return { processed: 0 };
  }

  let processed = 0;

  for (const item of entry) {
    const { id, time, messaging, changes } = item;

    // Processar leads
    if (changes) {
      for (const change of changes) {
        const { field, value } = change;

        if (field === 'leadgen') {
          processed += await processLeadgenEvent(value, time);
        } else if (field === 'feed') {
          // Para comentários, mensagens em posts
        }
      }
    }

    // Processar mensagens de chat
    if (messaging) {
      for (const message of messaging) {
        processed += await processMessagingEvent(message, time);
      }
    }
  }

  return { processed };
}

/**
 * Processa evento leadgen (Lead Ads da Meta)
 */
async function processLeadgenEvent(value, timestamp) {
  if (!value || !value.leadgen_id) {
    return 0;
  }

  try {
    const leadId = value.leadgen_id;
    const formId = value.form_id;
    const adId = value.ad_id;

    // Verificar se lead já existe
    const existing = await query(
      'SELECT id FROM leads WHERE meta_lead_id = $1',
      [leadId]
    );

    if (existing.rows.length > 0) {
      console.log(`Lead ${leadId} já existe - ignorando duplicado`);
      return 0;
    }

    // Buscar dados do lead na API da Meta
    const leadData = await fetchLeadFromMeta(leadId);
    if (!leadData) {
      console.warn(`Só conseguimos obter dados do lead ${leadId}`);
      return 0;
    }

    // Normalizar dados
    const normalizedLead = normalizeLeadData(leadData, adId, formId);

    // Inserir no banco
    const insertResult = await query(
      `INSERT INTO leads (
        meta_lead_id, name, email, phone, source, 
        campaign_meta_id, campaign_name, ad_id, ad_name, form_id,
        status, score, created_at_meta, created_at_local, raw_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
      RETURNING id, name, email, campaign_name, score, estimated_revenue`,
      [
        normalizedLead.meta_lead_id,
        normalizedLead.name,
        normalizedLead.email,
        normalizedLead.phone,
        'Meta Lead Ads',
        normalizedLead.campaign_meta_id,
        normalizedLead.campaign_name,
        normalizedLead.ad_id,
        normalizedLead.ad_name,
        normalizedLead.form_id,
        'Novo',
        normalizedLead.score,
        new Date(timestamp * 1000),
        JSON.stringify(leadData)
      ]
    );

    if (insertResult.rows.length > 0) {
      const newLead = insertResult.rows[0];
      
      // Log de webhook processado
      await logWebhookEvent('leadgen', 'success', `Lead ${newLead.id} criado via webhook`, {
        meta_lead_id: leadId,
        lead_id: newLead.id,
        name: newLead.name
      });

      // Rastrear no Pixel
      try {
        await trackLeadConversion({
          id: newLead.id,
          email: newLead.email,
          name: newLead.name,
          campaign_name: newLead.campaign_name,
          campaign_meta_id: normalizedLead.campaign_meta_id,
          source: 'Meta Lead Ads',
          estimated_revenue: 0
        });
      } catch (err) {
        console.warn('Erro ao rastrear lead no Pixel:', err.message);
      }

      return 1;
    }

    return 0;
  } catch (error) {
    await logWebhookEvent('leadgen', 'error', `Erro ao processar lead: ${error.message}`, {
      error: error.message
    });
    console.error('Erro ao processar leadgen event:', error);
    return 0;
  }
}

/**
 * Processa evento de mensagem (chat/comentário)
 */
async function processMessagingEvent(message, timestamp) {
  // Pode implementar rastreamento de conversas futuramente
  return 0;
}

/**
 * Busca dados do lead direto da API Meta
 */
async function fetchLeadFromMeta(leadId) {
  const axios = require('axios');
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${leadId}`,
      {
        params: {
          fields: 'id,created_time,field_data,ad_id,ad_name,adset_id,campaign_id,form_id,platform',
          access_token: env.metaAccessToken
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar lead ${leadId}:`, error.message);
    return null;
  }
}

/**
 * Normaliza dados do lead para o padrão do CRM
 */
function normalizeLeadData(leadData, adId, formId) {
  const fields = normalizeFieldData(leadData.field_data || []);
  
  const lead = {
    meta_lead_id: leadData.id,
    name: fields.fullname || fields.name || 'Lead sem nome',
    email: fields.email || fields.email_address || '',
    phone: fields.phone_number || fields.phone || '',
    campaign_meta_id: leadData.campaign_id || null,
    campaign_name: null,
    ad_id: adId || leadData.ad_id || null,
    ad_name: leadData.ad_name || null,
    form_id: formId || leadData.form_id || null,
    score: 50 // Score padrão inicial
  };

  // Calcular score baseado em dados preenchidos
  if (lead.name) lead.score += 10;
  if (lead.email) lead.score += 20;
  if (lead.phone) lead.score += 15;

  return lead;
}

/**
 * Normaliza field_data do lead
 */
function normalizeFieldData(fieldData = []) {
  const result = {};
  fieldData.forEach((item) => {
    const key = String(item.name || '').toLowerCase().trim();
    const value = Array.isArray(item.values) ? item.values[0] : item.values;
    result[key] = value;
  });
  return result;
}

/**
 * Registra webhook processado no banco
 */
async function logWebhookEvent(eventType, level, message, payload = {}) {
  try {
    await query(
      `INSERT INTO sync_logs (sync_type, level, message, payload)
       VALUES ($1, $2, $3, $4)`,
      [`webhook_${eventType}`, level, message, JSON.stringify(payload)]
    );
  } catch (error) {
    console.error('Erro ao registrar webhook event:', error);
  }
}

/**
 * Testa conectividade da webhook (desafio da Meta)
 */
function handleWebhookChallenge(query) {
  if (query && query.hub && query.hub.challenge) {
    return query.hub.challenge;
  }
  return null;
}

/**
 * Obtém estatísticas da webhook
 */
async function getWebhookStats(hours = 24) {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN level = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as failed,
        COUNT(DISTINCT sync_type) as event_types
       FROM sync_logs
       WHERE sync_type LIKE 'webhook_%'
       AND created_at > NOW() - INTERVAL '1 hour' * $1`,
      [hours]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar webhook stats:', error);
    return null;
  }
}

module.exports = {
  validateWebhookSignature,
  processWebhookEvent,
  processLeadgenEvent,
  handleWebhookChallenge,
  getWebhookStats,
  logWebhookEvent,
  normalizeLeadData,
  normalizeFieldData
};
