const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const { initDb } = require('./db');
const metaRoutes = require('./routes/meta.routes');
const reportRoutes = require('./routes/report.routes');
const webhookRoutes = require('./routes/webhooks.routes');

const app = express();

// Middleware para capturar raw body para webhook (necessário para validação HMAC)
// Precisa estar ANTES de qualquer parser JSON
app.post('/api/webhooks/meta', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body.toString('utf-8');
  req.body = JSON.parse(req.rawBody);
  next();
});

app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: env.companyName,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/meta', metaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/webhooks/meta', webhookRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    ok: false,
    message: error.response?.data?.error?.message || error.message || 'Erro interno no servidor'
  });
});

(async () => {
  try {
    await initDb();
    app.listen(env.port, () => {
      console.log(`API iniciada na porta ${env.port}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar a API:', error);
    process.exit(1);
  }
})();
