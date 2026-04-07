const crypto = require('crypto');
const https = require('https');

// Payload simples de teste
const payload = JSON.stringify({
  object: 'page',
  entry: [{
    id: '123456789012345',
    time: Math.floor(Date.now() / 1000),
    changes: [{
      value: {
        leadgen_id: 'test_lead_' + Date.now(),
        form_id: '2108659393199497',
        created_time: Math.floor(Date.now() / 1000)
      },
      field: 'leadgen'
    }]
  }]
});

// Gerar assinatura
const token = 'RfT1MEo5bCqXmhkWyPsgH3O7vnUKicuL';
const hash = crypto
  .createHmac('sha256', token)
  .update(payload)
  .digest('hex');
const signature = 'sha256=' + hash;

console.log('📤 Enviando webhook ao ngrok com HMAC...\n');

const options = {
  hostname: 'purplish-unusefully-everly.ngrok-free.dev',
  path: '/api/webhooks/meta',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length,
    'X-Hub-Signature-256': signature
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status HTTP:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Webhook enviado com sucesso!');
    } else {
      console.log('\n❌ Erro ao processar webhook');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Erro na requisição:', err.message);
});

req.write(payload);
req.end();
