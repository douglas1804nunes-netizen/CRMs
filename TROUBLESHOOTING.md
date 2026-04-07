# 🔧 Troubleshooting Guide

## Problemas Comuns e Soluções

---

## 🔴 Dashboard não carrega (página em branco)

### Sintoma
Browser fica em branco ou mostra erro 404/500

### Solução

**1. Verificar se containers estão rodando**
```bash
docker compose ps
```
Deve mostrar 3 containers com status `Running`

**2. Se algum container está `Exited`**
```bash
docker compose logs  # Ver logs de erro

docker compose up -d  # Reiniciar
```

**3. Portas conflitantes**
Se porta 8080 está em uso:
```bash
# Mude em docker-compose.yml:
# ports:
#   - "8081:80"  # Nova porta

docker compose restart
# Acesse: http://localhost:8081
```

**4. Cache do browser**
```bash
# Hard refresh
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)

# Ou limpe cookies:
F12 > Application > Clear Site Data
```

---

## 🔴 Gráficos não aparecem / estão em branco

### Sintoma
Dashboard carrega, mas gráficos vazios ou cinzentos

### Solução

**1. Sincronizar dados primeiro**
```bash
# Clique no dashboard:
→ CONECTAR
⟳ CAMPANHAS
◈ LEADS
```

**2. Aguarde o banco de dados ser preenchido** (5-10 segundos)

**3. Clique "⟲ REFRESH"** para forçar atualização dos gráficos

**4. Verifique console**
```
F12 > Console
Procure por erros em vermelho
```

**5. Reinicie o container da API**
```bash
docker compose restart api

# Aguarde 3 segundos, depois recarregue
```

---

## 🔴 Erro: "Tried accessing nonexisting field (campaigns)"

### Sintoma
Ao clicar "⟳ CAMPANHAS", mostra erro vermelho

### Explicação
Seu token Meta **não tem permissões suficientes** para acessar campanhas reais

### Solução

**OPÇÃO A: Usar modo demonstração (agora padrão)**
- Sistema detecta erro automaticamente
- Usa dados fake mas realistas
- Tudo funciona normalmente

**OPÇÃO B: Gerar novo token com permissões**
Veja arquivo: `META_TOKEN_SETUP.md`

Passos:
1. Vá para https://developers.facebook.com/
2. Gere novo token com permissões:
   - `ads_management`
   - `leads_retrieval`
3. Atualize `backend/.env`:
   ```
   META_ACCESS_TOKEN=seu_novo_token
   ```
4. Reinicie:
   ```bash
   docker compose up -d
   ```

---

## 🔴 Tabelas vazias (0 campanhas / 0 leads)

### Sintoma
Tabelas CAMPANHAS e LEADS não mostram dados

### Solução

**1. Clique os botões de sync no dashboard**
```
⟳ CAMPANHAS → "✅ 5 campanha(s) sincronizada(s)"
◈ LEADS → "✅ 23 lead(s) sincronizado(s)"
```

**2. Aguarde 2-3 segundos**

**3. Clique "⟲ REFRESH"**

**4. Se ainda vazio, verifique banco de dados**
```bash
docker exec -it metaadscrm_db psql -U metaads -d metaads_crm -c \
  "SELECT COUNT(*) FROM campaigns; SELECT COUNT(*) FROM leads;"
```

**5. Se banco está vazio, forçar sincronização**
```bash
curl -X POST http://localhost:3000/api/meta/sync/campaigns
curl -X POST http://localhost:3000/api/meta/sync/leads
```

---

## 🔴 API retorna erro 500

### Sintoma
```
{
  "ok": false,
  "message": "Erro interno no servidor"
}
```

### Solução

**1. Ver logs do servidor**
```bash
docker compose logs api --tail 50
```

**2. Procure por erros com "Error:", "at", "line"**

**3. Problemas comuns**

**Erro: "Cannot find module"**
```bash
# Node modules não foram instalados
docker compose build --no-cache api
docker compose up -d
```

**Erro: Database connection error**
```bash
# Database não respondendo
docker compose logs db

# Reinicie database
docker compose restart db
docker compose restart api
```

**Erro: Cannot POST /api/...**
```bash
# URL erroneamente formatada
Verifique no frontend/assets/js/api.js
Paths devem ser: /api/meta/sync/campaigns, etc
```

---

## 🔴 Dados são zeros / All KPIs zerados

### Sintoma
Todos os cards KPI mostram 0

### Solução

**1. Sincronizar dados**
```bash
curl -X POST http://localhost:3000/api/meta/sync/campaigns
curl -X POST http://localhost:3000/api/meta/sync/leads
```

**2. Verifique banco de dados**
```bash
docker exec -it metaadscrm_db psql -U metaads -d metaads_crm \
  -c "SELECT * FROM campaigns LIMIT 1;"
```

**3. Se banco vazio, forçar reset**
```bash
# ⚠️ CUIDADO: Isso apaga o banco!
docker exec -it metaadscrm_db psql -U metaads -d metaads_crm \
  -c "DELETE FROM campaigns; DELETE FROM leads;"

# Resincronizar
curl -X POST http://localhost:3000/api/meta/sync/campaigns
curl -X POST http://localhost:3000/api/meta/sync/leads
```

---

## 🔴 Status mostra "Offline" / conexão vermelha

### Sintoma
Status dot está vermelho, conexão offline

### Solução

**1. Teste conexão**
```bash
curl http://localhost:3000/api/health
```

Deve retornar:
```json
{
  "ok": true,
  "app": "Meta Ads CRM Pro",
  "timestamp": "2026-04-05T18:51:18.123Z"
}
```

**2. Se falhar, reinicie API**
```bash
docker compose restart api
```

**3. Se ainda falhar, veja logs**
```bash
docker compose logs api
```

**4. Última opção: rebuild tudo**
```bash
docker compose down
docker compose up -d --build
```

---

## 🔴 Webhook "Testing" falha

### Sintoma
Teste webhook retorna erro, ngrok mostra erro

### Solução

**1. Verificar ngrok está rodando**
```bash
# Se ngrok não está rodando:
ngrok http 3000
# Anote a URL

# Atualize .env:
META_WEBHOOK_URL=https://sua-ngrok-url/api/webhooks/meta
```

**2. Verificar endpoint webhook**
```bash
curl -X GET http://localhost:3000/api/webhooks/meta/challenge?verify_token=RfT1MEo5bCqXmhkWyPsgH3O7vnUKicuL
```

**3. Fazer teste com payload**
```bash
node test-webhook.js
```

---

## 🔴 Erro: "Port already in use"

### Sintoma
```
Error: EADDRINUSE: address already in use :::3000
```

### Solução

**Opção 1: Mude porta em docker-compose.yml**
```yaml
services:
  api:
    ports:
      - "3001:3000"  # Mudou de 3000 para 3001
```

**Opção 2: Kill processo na porta**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

---

## 🟡 Performance lenta

### Sintoma
Dashboard lento, gráficos demoram para renderizar

### Solução

**1. Reduzir quantidade de dados**
```bash
# Edite meta.routes.js, limite de 50 para 20:
LIMIT 20
```

**2. Aumentar recursos Docker**
```bash
# docker-compose.yml
services:
  api:
    mem_limit: "512m"  # aumentou de 256m
```

**3. Limpar banco de dados**
```bash
# Remove dados antigos
docker exec -it metaadscrm_db psql -U metaads -d metaads_crm \
  -c "DELETE FROM sync_logs WHERE created_at < NOW() - INTERVAL '7 days';"
```

---

## 🟡 Dados não atualizam em tempo real

### Sintoma
Dados permanecem estáticos, não mudam com webhook

### Solução

**1. Webhook não registrado Meta**
```bash
# Configure webhook em Meta App Dashboard
# URL: https://sua-ngrok-url/api/webhooks/meta
# Token: RfT1MEo5bCqXmhkWyPsgH3O7vnUKicuL
```

**2. Ngrok expirou**
```bash
# Tokens ngrok expiram cada 2 horas
pkill ngrok
ngrok http 3000

# Atualizar .env e META app
```

**3. Polling em vez de webhook**
```bash
# Clique "⟲ REFRESH" manualmente
# Ou espere auto-refresh (a cada 30 segundos)
```

---

## 📋 Checklist de Debugging

Quando tudo falha:

- [ ] `docker compose ps` - Todos rodando?
- [ ] `docker compose logs` - Há erros?
- [ ] `curl http://localhost:3000/api/health` - API responde?
- [ ] `curl -X POST http://localhost:3000/api/meta/sync/campaigns` - DB funciona?
- [ ] Browser console (F12) - JavaScript errors?
- [ ] Network tab (F12) - Requisições falhando?
- [ ] Hardware - RAM/CPU disponível?
- [ ] Firewall - Pode acessar localhost:3000?

---

## 🆘 Ainda não funciona?

**Colete informações e abra issue:**

```bash
# Logs da API
docker compose logs api > api.log

# Logs do banco
docker compose logs db > db.log

# Status do sistema
docker compose ps > status.log

# Health check
curl http://localhost:3000/api/health >> status.log
```

Compartilhe estes logs com a equipe de suporte.

---

## 📚 Recursos Úteis

- **Meta Graph API Docs**: https://developers.facebook.com/docs/graph-api
- **Docker Docs**: https://docs.docker.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express.js Docs**: https://expressjs.com/

---

**Última atualização**: 2026-04-05
