const axios = require('axios');
const { v4: uuidv4 } = require('crypto').randomUUID || (() => require('uuid').v4);
const { env } = require('../config/env');
const { query } = require('../db');

const META_BASE_URL = 'https://graph.facebook.com/v25.0';

/**
 * Gera um ID único para o evento do Pixel
 */
function generateEventId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Normaliza dados do usuário para o padrão Meta
 */
function normalizeUserData(data = {}) {
  const userData = {};
  
  // Hash de email
  if (data.email) {
    const crypto = require('crypto');
    userData.em = crypto.createHash('sha256').update(data.email.toLowerCase().trim()).digest('hex');
  }
  
  // Hash de telefone
  if (data.phone) {
    const crypto = require('crypto');
    userData.ph = crypto.createHash('sha256').update(data.phone.replace(/\D/g, '')).digest('hex');
  }
  
  // Dados demográficos
  if (data.firstName) userData.fn = data.firstName.toLowerCase();
  if (data.lastName) userData.ln = data.lastName.toLowerCase();
  if (data.city) userData.ct = data.city.toLowerCase();
  if (data.state) userData.st = data.state.toLowerCase();
  if (data.zipCode) userData.zp = data.zipCode.replace(/\D/g, '');
  if (data.country) userData.country = data.country.toLowerCase();
  
  return userData;
}

/**
 * Rastreia um evento no Meta Pixel usando a Conversion API
 */
async function trackPixelEvent(eventName, eventData = {}) {
  if (!env.metaPixelId || !env.metaAccessToken) {
    const error = new Error('Meta Pixel não configurado. Configure META_PIXEL_ID e META_ACCESS_TOKEN.');
    error.statusCode = 400;
    throw error;
  }

  const eventId = generateEventId();
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Preparar dados do usuário
  const userData = normalizeUserData(eventData.userData || {});
  
  // Preparar dados customizados
  const customData = {
    value: eventData.value || 0,
    currency: eventData.currency || 'BRL',
    ...eventData.customData
  };

  // Remover campos que não devem ir para Meta
  const safeData = { ...eventData };
  delete safeData.userData;
  delete safeData.customData;
  delete safeData.value;
  delete safeData.currency;

  // Construir payload para Conversion API
  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: timestamp,
        event_id: eventId,
        user_data: userData,
        custom_data: customData,
        event_source_url: eventData.eventSourceUrl || '',
        action_source: 'website'
      }
    ],
    access_token: env.metaAccessToken
  };

  let metaResponse = null;
  let status = 'failed';
  const sentAt = new Date();

  try {
    // Enviar evento para Meta Conversion API
    const response = await axios.post(
      `${META_BASE_URL}/${env.metaPixelId}/events`,
      payload
    );

    metaResponse = response.data;
    status = 'success';

    // Log no banco de dados
    await query(
      `INSERT INTO pixel_events (event_name, event_id, user_data, custom_data, meta_response, status, created_at, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [eventName, eventId, JSON.stringify(userData), JSON.stringify(customData), JSON.stringify(metaResponse), status, sentAt]
    );

    return {
      ok: true,
      eventId,
      eventName,
      status,
      message: 'Evento rastreado com sucesso'
    };
  } catch (error) {
    metaResponse = {
      error: error.response?.data?.error || error.message
    };

    // Log no banco de dados mesmo com erro
    await query(
      `INSERT INTO pixel_events (event_name, event_id, user_data, custom_data, meta_response, status, created_at, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [eventName, eventId, JSON.stringify(userData), JSON.stringify(customData), JSON.stringify(metaResponse), status, sentAt]
    );

    const err = new Error(`Falha ao rastrear evento no Pixel: ${error.message}`);
    err.statusCode = error.response?.status || 500;
    throw err;
  }
}

/**
 * Rastreia uma conversão de lead
 */
async function trackLeadConversion(lead) {
  if (!env.metaPixelId) return null;

  try {
    return await trackPixelEvent('Lead', {
      userData: {
        email: lead.email,
        phone: lead.phone,
        firstName: lead.name?.split(' ')[0] || '',
        lastName: lead.name?.split(' ').slice(1).join(' ') || ''
      },
      customData: {
        content_name: lead.campaign_name || 'Lead',
        content_type: 'lead',
        lead_id: lead.id,
        campaign_id: lead.campaign_meta_id,
        source: lead.source
      },
      value: lead.estimated_revenue || 0,
      currency: 'BRL',
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : ''
    });
  } catch (error) {
    console.warn('Erro ao registrar conversão de lead:', error.message);
    return null;
  }
}

/**
 * Rastreia uma conversão de qualificação (lead com score alto)
 */
async function trackLeadQualified(lead) {
  if (!env.metaPixelId) return null;

  try {
    return await trackPixelEvent('Subscribe', {
      userData: {
        email: lead.email,
        phone: lead.phone,
        firstName: lead.name?.split(' ')[0] || '',
        lastName: lead.name?.split(' ').slice(1).join(' ') || ''
      },
      customData: {
        content_name: `${lead.campaign_name} - Qualificado`,
        content_type: 'qualified_lead',
        lead_id: lead.id,
        campaign_id: lead.campaign_meta_id,
        lead_score: lead.score
      },
      value: lead.estimated_revenue || 0,
      currency: 'BRL'
    });
  } catch (error) {
    console.warn('Erro ao registrar qualificação de lead:', error.message);
    return null;
  }
}

/**
 * Obtém logs de eventos do Pixel
 */
async function getPixelEventLogs(limit = 50) {
  try {
    const result = await query(
      `SELECT id, event_name, event_id, status, created_at, sent_at
       FROM pixel_events
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém estatísticas de eventos
 */
async function getPixelEventStats() {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_events,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_events,
        COUNT(DISTINCT event_name) as unique_events
       FROM pixel_events
       WHERE created_at > NOW() - INTERVAL '30 days'`
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  trackPixelEvent,
  trackLeadConversion,
  trackLeadQualified,
  getPixelEventLogs,
  getPixelEventStats,
  generateEventId,
  normalizeUserData
};
