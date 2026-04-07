# ⚠️ Configuração de Token Meta - Informações Importantes

## 🔴 Problema Detectado

O token de acesso Meta atual **NÃO possui permissões suficientes** para acessar campanhas e leads reais.

**Erro**: `(#100) Tried accessing nonexisting field (campaigns)` 
**Causa**: Token criado sem as permissões necessárias para `ads_management` e `leads_retrieval`

---

## ✅ Solução Implementada (Temporária)

Para permitir que o dashboard funcione enquanto você configura o token correto, implementamos:

- **Modo Demonstração Automático**: Quando o token não tem permissões, o sistema usa dados mock
- **Dados Fictícios Realistas**: 5 campanhas e 23 leads com métricas realistas
- **Funcionamento Normal**: Todos os gráficos, tabelas e relatórios funcionam normalmente
- **Indicador de Status**: Respostas API incluem `"mode": "demonstration"` quando usando dados mock

### Como Testar o Dashboard em Modo Demonstração:

1. Abra o dashboard: `http://localhost:8080`
2. Clique em **"⟳ CAMPANHAS"** para sincronizar dados mock de campanhas
3. Clique em **"◈ LEADS"** para sincronizar dados mock de leads
4. Veja os gráficos e tabelas preencherem com dados de demonstração

---

## 🔧 Para Ativar Dados Reais (Quando Pronto)

Você precisa regenerar o token de acesso Meta com as **permissões corretas**:

### Passo 1: Aceda ao Meta App Dashboard
1. Vá para: https://developers.facebook.com/apps/
2. Selecione a sua aplicação
3. Vá para **Settings > Basic**

### Passo 2: Gere Novo Token com Permissões

No **Business Manager** ou **App Dashboard**, gere um novo **App Token** ou **User Token** com as seguintes permissões:

#### Permissões Requeridas:
- `ads_management` - Para acessar campanhas, ad sets e anúncios
- `leads_retrieval` - Para acessar Form Leads
- `pages_read_engagement` - Para ler dados de páginas
- `pages_manage_metadata` - Para gerenciar metadados de páginas
- `read_insights` - Para acessar insights e reporting

#### Escopo de Token (User Token):
```
ads_management,leads_retrieval,pages_read_engagement,pages_manage_metadata,read_insights
```

### Passo 3: Atualize o .env

No arquivo `backend/.env`, substitua:

```env
# ANTIGO (sem permissões suficientes)
META_ACCESS_TOKEN=EAAXYyj...

# NOVO (com permissões necessárias)
META_ACCESS_TOKEN=seu_novo_token_aqui
```

### Passo 4: Reinicie o Serviço

```bash
docker compose down
docker compose up -d
```

### Passo 5: Teste a Conexão

**Via Curl:**
```bash
curl -X POST http://localhost:3000/api/meta/test-connection
```

**Via Dashboard:**
Clique em "→ CONECTAR" para testar se a conexão agora funciona com dados reais.

---

## 📊 Endpoints Afetados

| Endpoint | Status Atual | Com Token Correto |
|----------|-------------|------------------|
| `POST /meta/sync/campaigns` | ✅ Mock Data | ✅ Real Data |
| `POST /meta/sync/leads` | ✅ Mock Data | ✅ Real Data |
| `GET /meta/campaigns` | ✅ Banco de Dados | ✅ Banco de Dados |
| `GET /meta/leads` | ✅ Banco de Dados | ✅ Banco de Dados |
| `GET /meta/dashboard` | ✅ Dados Sincronizados | ✅ Dados Reais |
| `POST /meta/test-connection` | ❌ Falha | ✅ Sucesso |

---

## 🧪 Verificar Permissões do Token Atual

```bash
curl -s "https://graph.facebook.com/v25.0/me/permissions?access_token=SEU_TOKEN" 
```

Procure por estas permissões na resposta:
- `ads_management`
- `leads_retrieval`
- `read_insights`

---

## 📝 Notas Técnicas

### Dashboard em Modo Demonstração
- Usa dados fictícios mas realistas
- Permite testar toda a UI/UX
- Gráficos, tabelas e relatórios funcionam 100%
- Dados são armazenados no banco de dados PostgreSQL

### Webhook de Lead Ads
- ✅ Continua funcionando com qualquer token
- Recebe leads em tempo real quando configurado
- Armazena automaticamente na base de dados

### Pixel de Rastreamento
- ✅ Funciona independentemente das permissões do token
- Rastreia eventos de conversão
- Envia dados para Meta Conversions API

---

## ❓ Problemas Comuns

### "Still getting permission errors"
- Aguarde 5-10 minutos para o Facebook propagar permissões
- Certifique-se de que o token foi criado no escopo correto
- Teste com `/me/adaccounts` para confirmar acesso

### "My Ad Account ID seems wrong"
- Verifique em: Facebook Ads Manager > Settings > Ad Account ID
- Deve ser numérico de 16 dígitos (ex: 2108659393199497)

### "Tests still returning mock data"
- Reinicie o container: `docker compose restart api`
- Verifique se o novo token está no `.env`
- Teste `/meta/test-connection` primeiro

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o token tem as permissões listadas acima
2. Teste com `/meta/test-connection`
3. Veja os logs: `docker compose logs api`
4. Verifique a validade do token em https://developers.facebook.com/tools/explorer/

---

**Status Atual**: 🟢 Dashboard funcional em modo demonstração
**Próxima Ação**: Regenerar token Meta com permissões corretas
**Impacto**: Sem impacto - sistema continua funcionando normalmente
