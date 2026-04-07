# 📊 Setup do Meta Pixel - Meta Ads CRM Pro

## Configuração Rápida

### 1. Obtenha seu Pixel ID
1. Acesse [Facebook Business Suite](https://business.facebook.com)
2. Vá para **Eventos** → **Pixel**
3. Copie seu **Pixel ID**

### 2. Configure a variável de ambiente
No arquivo `.env` (backend):

```env
META_PIXEL_ID=123456789012345
```

Ou edite `.env.example` e copie para `.env`:
```bash
cp backend/.env.example backend/.env
```

### 3. Reinicie o servidor
```bash
docker compose down
docker compose up --build
```

---

## 🎯 Eventos Configurados Automaticamente

| Evento | Quando Ocorre | Dados Rastreados |
|--------|---|---|
| **ViewContent** | Página carregada | URL, timestamp, user-agent |
| **CompleteRegistration** | Conexão Meta testada | status='success' |
| **Lead** | Leads sincronizados | leads_count, campaign_id, score |
| **Subscribe** | Lead qualificado (score > 70) | lead_id, estimated_revenue |

---

## 📍 Pontos de Integração no Código

### Frontend (`frontend/index.html`)
- Script do Pixel carregado no `<head>`
- ID do Pixel carregado dinamicamente do backend
- Event tracking automático via `fbq()`

### Backend (`backend/src/services/pixel.service.js`)
- Serviço `trackPixelEvent()` para enviar eventos
- Normalização de dados de usuário (hash de email/telefone)
- Integração com Meta Conversion API
- Log de eventos na tabela `pixel_events`

### Database (`database/init.sql`)
- Tabela `pixel_events` com campos:
  - `event_name`: nome do evento
  - `event_id`: ID único do evento
  - `user_data`: dados do usuário (hasheados)
  - `custom_data`: dados customizados
  - `meta_response`: resposta da API Meta
  - `status`: success/failed
  - `sentAt`: timestamp do envio

### Routes (`backend/src/routes/meta.routes.js`)
- `POST /api/meta/track-event` - Rastreia evento manual
- `GET /api/meta/pixel-logs` - Retorna logs dos últimos eventos
- `/api/meta/config-status` - Retorna Pixel ID se configurado

### Frontend Rastreamento (`frontend/assets/js/app.js`)
- **Teste Conexão** → Envia `CompleteRegistration`
- **Sincronizar Campanhas** → Envia `Lead` event
- **Sincronizar Leads** → Envia `Lead` event

---

## 🔧 Usar Pixel API Manualmente

### Rastrear evento via API

```javascript
// Frontend
await api.trackPixelEvent('Lead', {
  userData: {
    email: 'email@example.com',
    phone: '11999999999',
    firstName: 'João',
    lastName: 'Silva'
  },
  customData: {
    content_name: 'Lead Premium',
    lead_id: '12345'
  },
  value: 150.00,
  currency: 'BRL'
});
```

### Backend
```javascript
const { trackPixelEvent } = require('./services/pixel.service');

await trackPixelEvent('Purchase', {
  userData: { email: 'user@email.com' },
  value: 500,
  currency: 'BRL'
});
```

---

## 📊 Monitorar Eventos

### Via API
```bash
GET /api/meta/pixel-logs
```

Retorna últimos 50 eventos rastreados com status.

### Via Database
```sql
SELECT event_name, status, COUNT(*) as total
FROM pixel_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_name, status
ORDER BY total DESC;
```

---

## 🔐 Segurança

- Dados sensíveis (email, telefone) são **hasheados com SHA256** antes de enviar para Meta
- Tokens são armazenados no **backend**, não no frontend
- Evento rastreado é **registrado no banco de dados** para auditoria
- Respostas da API Meta são **criptografadas no JSON**

---

## ❓ Troubleshooting

### Pixel não está inicializando
- ✅ Verifique se `META_PIXEL_ID` está configurado em `.env`
- ✅ Reinicie o Docker com `docker compose restart`
- ✅ Abra browser dev tools → Console e procure por erros

### Eventos não chegam na Meta
- ✅ Confira `GET /api/meta/pixel-logs` para ver erros
- ✅ Verifique se `META_ACCESS_TOKEN` está válido
- ✅ Confirme que o Pixel ID existe na conta Business

### Badge "Pixel não configurado"
- Significa que `META_PIXEL_ID` está vazio em `.env`
- Adicione o ID e reinicie o servidor

---

## 📚 Eventos Custominizados

Você pode rastrear eventos customizados. Exemplo:

```javascript
// No frontend, quando um lead for movido para estágio específico
await api.trackPixelEvent('CustomEvent_StageAdvance', {
  userData: { email: lead.email },
  customData: {
    previous_stage: 'novo',
    new_stage: 'qualificado',
    campaign_id: lead.campaign_id
  },
  value: lead.estimated_revenue
});
```

---

## 🚀 Próximos Passos

1. ✅ Configure o `META_PIXEL_ID`
2. ✅ Teste em `/api/meta/config-status` que retorna `pixelConfigured: true`
3. ✅ Sincronize leads e confira `/api/meta/pixel-logs`
4. ✅ Verifique no [Facebook Business Suite → Teste de eventos](https://www.facebook.com/business/tools/events-manager) se está recebendo dados

---

**Dúvidas?** Consulte a documentação oficial da [Meta Conversion API](https://developers.facebook.com/docs/marketing-api/conversion-api/get-started)
