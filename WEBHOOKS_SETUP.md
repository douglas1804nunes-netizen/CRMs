# 🔄 Setup de Webhooks em Tempo Real - Meta Ads CRM Pro

## O que é uma Webhook?

Uma webhook é um mecanismo que permite que a **Meta envie eventos em tempo real** para seu servidor, em vez de você ficar consultando ("polling") a API da Meta a cada minuto.

**Vantagens:**
- ✅ Leads chegam **instantaneamente** ao CRM
- ✅ Sem necessidade de cliques em "Sincronizar"
- ✅ Menos carga na API
- ✅ Experiência de usuário melhor

---

## 1️⃣ Configuração Inicial

### Passo 1: Gere um Token Seguro

Crie um token aleatório para validar requisições:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Exemplo de output:
```
a3b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2
```

### Passo 2: Configure o Arquivo `.env`

No `backend/.env`:

```env
# Webhook Configuration
META_WEBHOOK_TOKEN=a3b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2
META_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/meta  # URL PÚBLICA do seu servidor
```

> **⚠️ IMPORTANTE:** `META_WEBHOOK_URL` deve ser **acessível pela internet** (não localhost)

### Passo 3: Implante o Código

```bash
docker compose down
docker compose up --build
```

---

## 2️⃣ Configurar Webhook na Meta Business Suite

### Passo A: Acessar Webhooks

1. Vá para [Facebook Business Suite](https://business.facebook.com)
2. Selecione sua conta de anúncios
3. Vá para **Ferramentas** → **Gerenciador de Aplicativos**
4. Localize seu aplicativo e clique em **Configuração**

### Passo B: Adicionar Webhook

1. No menu lateral, procure por **Webhooks** ou **Produtos**
2. Procure por **Leads** e clique em **Configurar**
3. Clique em **Adicionar URL de Webhook**

### Passo C: Preencher Dados

**URL do Webhook:**
```
https://seu-dominio.com/api/webhooks/meta
```

**Token de Verificação:**
```
a3b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2
```

(Mesmo valor que você colocou em `META_WEBHOOK_TOKEN`)

### Passo D: Selecionar Eventos

Escolha quais eventos deseja receber:

- ✅ **leadgen** (Lead Ads) ← **SELECIONE**
- ✅ **messaging_postbacks** (Mensagens)
- page_messaging (opcional)

### Passo E: Testar

A Meta vai:
1. ✅ Fazer request GET com challenge
2. ✅ Seu servidor responde com o challenge
3. ✅ Meta valida e ativa a webhook

Se tudo funcionar, você verá: `Ativa` ✅

---

## 3️⃣ Testar a Integração

### Teste 1: Criar um Lead

1. Crie um formulário **Lead Ads** na Meta
2. Preencha o formulário com um lead de teste
3. **Aguarde 2-5 segundos**
4. Verifique no CRM se o lead apareceu
   - Acesse `/api/meta/leads`
   - Procure pelo novo lead

### Teste 2: Monitorar em Tempo Real

```bash
# Ver logs de webhook
curl http://localhost:3000/api/meta/sync-logs?limit=20

# Ver estatísticas de webhook (últimas 24h)
curl http://localhost:3000/api/webhooks/meta/stats
```

### Teste 3: No Console do Navegador

Abra o CRM e monitore:
```javascript
// Terminal do navegador (F12 → Console)
setInterval(async () => {
  const logs = await api.getSyncLogs();
  console.table(logs.items);
}, 5000);
```

---

## 4️⃣ Estrutura de Evento Recebido

Quando um lead é criado, a Meta envia:

```json
{
  "object": "page",
  "entry": [
    {
      "id": "123456789",
      "time": 1704067200,
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "lead_123456",
            "form_id": "1263372088809259",
            "ad_id": "adset_123:ad_456",
            "campaign_id": "camp_789"
          }
        }
      ]
    }
  ]
}
```

**Seu servidor:**
1. ✅ Valida a assinatura (HMAC SHA256)
2. ✅ Busca dados completos do lead na API
3. ✅ Insere no banco de dados
4. ✅ Rastreia no Pixel Meta
5. ✅ Registra no log

---

## 5️⃣ Troubleshooting

### ❌ "Webhook não validou"

**Problema:** Meta diz "Inválido" ao tentar ativar

**Solução:**
- ✅ Verifique se `META_WEBHOOK_URL` começa com `https://` (não http)
- ✅ Confirme que a URL é **acessível pela internet** (teste em `curl`)
- ✅ Verifique se `META_WEBHOOK_TOKEN` é idêntico nos dois lugares

```bash
# Teste sua URL
curl https://seu-dominio.com/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=test123
```

### ❌ "Leads não chegam"

**Problema:** Lead Ads criado mas não aparece no CRM

**Solução:**
1. Verifique se webhook está "Ativa" na Meta
2. Confira os logs:
   ```bash
   curl http://localhost:3000/api/meta/sync-logs
   ```
3. Procure por erro tipo "Falha ao processar lead"
4. Verifique se `META_ACCESS_TOKEN` é válido

### ❌ "Erro 401 - Invalid signature"

**Problema:** Assinatura de webhook inválida

**Solução:**
- ✅ Confirme que o body é **raw JSON** (não string)
- ✅ Verifique se `META_WEBHOOK_TOKEN` está correto
- ✅ O middleware do servidor captura o raw body (veja `server.js`)

### ⚠️ "TLS certificate error"

**Problema:** Meta não consegue fazer HTTPS na sua URL

**Solução:**
- Verifique certificado SSL: `https://www.ssllabs.com/ssltest/`
- Para desenvolvimento local, use **ngrok** para expor localhost:
  ```bash
  ngrok http 3000
  # Isso gera: https://xxxxx.ngrok.io
  # Use isso como META_WEBHOOK_URL
  ```

---

## 6️⃣ Monitoramento e Logs

### Ver Ocorrências de Webhook

```sql
-- Quantos leads foram criados via webhook
SELECT 
  DATE(created_at_local) as data,
  COUNT(*) as total
FROM leads
WHERE source = 'Meta Lead Ads'
GROUP BY DATE(created_at_local)
ORDER BY data DESC;
```

### Ver Erros de Processamento

```sql
SELECT *
FROM sync_logs
WHERE sync_type LIKE 'webhook_%'
AND level = 'error'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 7️⃣ Produção - Deploy Seguro

### Variáveis de Ambiente para Produção

```env
# .env (produção)
META_WEBHOOK_TOKEN=gerar_novo_token_aleatorio_seguro
META_WEBHOOK_URL=https://seucrm.com.br/api/webhooks/meta
WEBHOOK_ENCRYPTION_KEY=chave_encriptacao_32_caracteres

# Não coloque token da API no .env público
META_ACCESS_TOKEN=$(read -s from secure vault)
```

### Checklist de Segurança

- ✅ Webhook Token é **aleatório e forte** (32+ chars)
- ✅ URL usa **HTTPS** (não HTTP)
- ✅ Certificado SSL é **válido e recente**
- ✅ Firewall permite **apenas IPs da Meta**
- ✅ Rate limiting está configurado (para evitar DDoS)
- ✅ Logs estão **criptografados**
- ✅ Banco de dados tem **backups automáticos**

---

## 8️⃣ Comparação: Polling vs Webhook

| Feature | Polling | Webhook |
|---------|---------|---------|
| **Latência** | 1-5 min | Instantânea |
| **Requisições API** | 1440/dia | Sob demanda |
| **Carga Servidor** | Alta | Baixa |
| **Complexidade** | Simples | Média |
| **Custo** | Alto (muitas calls) | Baixo |
| **Experiência UX** | "Sincronize agora" | Tempo real |

---

## 9️⃣ Próximos Passos

1. ✅ Configure `META_WEBHOOK_TOKEN` e `META_WEBHOOK_URL`
2. ✅ Reinicie Docker
3. ✅ Ative webhook na Meta Business Suite
4. ✅ Crie lead de teste
5. ✅ Monitore `/api/meta/sync-logs`
6. ✅ Celebre sincronização em tempo real! 🎉

---

## 📚 Referências

- [Meta Webhooks Docs](https://developers.facebook.com/docs/apps/webhooks)
- [Lead Ads API](https://developers.facebook.com/docs/marketing-api/lead-ads)
- [Conversion API](https://developers.facebook.com/docs/marketing-api/conversion-api)
- [Webhook Security](https://datatracker.ietf.org/doc/html/rfc6234) (HMAC)

---

**Dúvidas?** Consulte os logs:
```bash
docker compose logs -f backend
```
