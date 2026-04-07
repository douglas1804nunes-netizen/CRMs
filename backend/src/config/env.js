const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://metaads:metaads@localhost:5432/metaads_crm',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  metaAdAccountId: process.env.META_AD_ACCOUNT_ID || '',
  metaFormId: process.env.META_FORM_ID || '',
  metaPageId: process.env.META_PAGE_ID || '',
  metaPixelId: process.env.META_PIXEL_ID || '',
  metaWebhookToken: process.env.META_WEBHOOK_TOKEN || '',
  metaWebhookUrl: process.env.META_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/meta',
  webhookEncryptionKey: process.env.WEBHOOK_ENCRYPTION_KEY || '',
  companyName: process.env.COMPANY_NAME || 'Meta Ads CRM Pro',
  defaultClientName: process.env.DEFAULT_CLIENT_NAME || 'Cliente Exemplo',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'BRL'
};

module.exports = { env };
