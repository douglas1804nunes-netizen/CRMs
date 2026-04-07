const express = require('express');
const {
  validateWebhookSignature,
  processWebhookEvent,
  handleWebhookChallenge,
  getWebhookStats,
  logWebhookEvent
} = require('../services/webhook.service');

const router = express.Router();

/**
 * GET - Desafio de verificação da Meta
 * A Meta envia este request para validar que você controla este endpoint
 */
router.get('/', (req, res) => {
  const hubMode = req.query['hub.mode'];
  const hubChallenge = req.query['hub.challenge'];
  const hubVerifyToken = req.query['hub.verify_token'];

  // Verificar se credentials estão corretos
  // Em produção, use uma variável de ambiente segura
  const verifyToken = process.env.META_WEBHOOK_TOKEN || 'webhook_token_example';

  if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
    console.log('✅ Webhook verificada com sucesso na Meta');
    res.status(200).send(hubChallenge);
  } else {
    console.warn('❌ Falha na verificação da webhook');
    res.sendStatus(403);
  }
});

/**
 * POST - Recebe eventos em tempo real da Meta
 * Body contém array de eventos (leads, mensagens, etc)
 */
router.post('/', async (req, res) => {
  try {
    // Validar assinatura
    const signature = req.headers['x-hub-signature-256'];
    const body = req.rawBody || JSON.stringify(req.body);

    // Se a assinatura for inválida, retornar erro
    if (signature) {
      try {
        const isValid = validateWebhookSignature(body, signature);
        if (!isValid) {
          console.warn('❌ Assinatura de webhook inválida');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      } catch (error) {
        console.warn('Erro ao validar assinatura:', error.message);
        // Continuar mesmo se a validação falhar
      }
    }

    // Processar evento
    const { object, entry } = req.body;

    if (!object || !entry) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    console.log(`📨 Webhook recebida: ${object} com ${entry.length} evento(s)`);

    // Processar assincrono para responder rapidamente
    try {
      const result = await processWebhookEvent(req.body);
      console.log(`✅ Processados ${result.processed} evento(s)`);
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      await logWebhookEvent('webhook_process', 'error', error.message, { error: error.stack });
    }

    // Meta espera resposta 200 imediatamente
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no handler da webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stats - Retorna estatísticas da webhook
 */
router.get('/stats', async (req, res, next) => {
  try {
    const hours = Number(req.query.hours || 24);
    const stats = await getWebhookStats(hours);
    res.json({
      ok: true,
      timeframe: `${hours}h`,
      stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
