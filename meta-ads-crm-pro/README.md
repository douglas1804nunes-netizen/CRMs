# Meta Ads CRM Pro

CRM profissional para vender como solução para empresas que anunciam no Meta Ads.  
O sistema centraliza campanhas, captura leads automaticamente, calcula score, organiza pipeline e gera PDF executivo para prestação de contas.

## 🎉 Status Atual

✅ **Dashboard 100% Funcional**  
✅ **Modo Demonstração Ativo** - Dados mock realistas para teste  
✅ **Pronto para Dados Reais** - Quando token Meta for configurado corretamente  

**Teste Agora**: `http://localhost:8080`

### O que melhorou

- ✅ Separação total entre **front-end**, **back-end** e **banco de dados**
- ✅ Lógica simulada substituída por integração pronta para **Meta Marketing API**
- ✅ Armazenamento seguro do token no **servidor**, não no front
- ✅ Sincronização de **campanhas**, **insights** e **leads**
- ✅ Banco **PostgreSQL** com estrutura profissional
- ✅ Geração de **relatório em PDF**
- ✅ Prontidão para **Docker** e **produção**
- ✅ **Modo Demonstração** - Dashboard funciona mesmo sem token Meta válido

## 🚀 Quick Start

### Via Docker (Recomendado)

```bash
docker compose up -d
# Acesse: http://localhost:8080
```

### Testes da API

```bash
# Executar suite de testes
node test-api.js

# Sincronizar campanhas (demo data)
curl -X POST http://localhost:3000/api/meta/sync/campaigns

# Sincronizar leads (demo data)
curl -X POST http://localhost:3000/api/meta/sync/leads

# Ver dashboard
curl http://localhost:3000/api/meta/dashboard
```

### Resultado Esperado

```json
{
  "ok": true,
  "synced": 5,
  "mode": "demonstration"
}
```

## 🔧 Configuração

### Token Meta

O sistema detecta automaticamente quando o token não tem permissões e usa **dados de demonstração**.

**Para ativar dados reais**:
1. Veja: `META_TOKEN_SETUP.md`
2. Gere token com permissões: `ads_management`, `leads_retrieval`
3. Atualize `backend/.env`
4. Reinicie: `docker compose up -d`

## Arquitetura

### Front-end
- HTML + CSS + JavaScript modular
- dashboard executivo
- tabelas de campanhas e leads
- gráfico de investimento por campanha
- botão para gerar relatório PDF

### Back-end
- Node.js + Express
- conexão com PostgreSQL
- integração com Meta Graph / Marketing API
- endpoints para sync e PDF

### Banco de dados
- PostgreSQL
- tabelas:
  - `campaigns`
  - `leads`
  - `sync_logs`

## Estrutura do projeto

```bash
meta-ads-crm-pro/
├── frontend/
│   ├── index.html
│   └── assets/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql
├── docker-compose.yml
└── .github/workflows/deploy-pages.yml
```

## Passo a passo para rodar localmente

### 1) Copie o arquivo de ambiente
Dentro de `backend/`, duplique `.env.example` para `.env`.

### 2) Preencha as variáveis da Meta
Você precisa informar:
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`
- `META_FORM_ID`
- `META_PAGE_ID`

### 3) Suba tudo com Docker
Na raiz do projeto:

```bash
docker compose up --build
```

### 4) Acesse o sistema
- Front-end: `http://localhost:8080`
- API: `http://localhost:3000/api/health`

## Passo a passo para testar o CRM dentro do Meta Ads

### Etapa 1 — Validar acessos
Confirme se o token possui acesso à conta de anúncios, página e formulário do Lead Ads.

### Etapa 2 — Validar conexão no CRM
No painel, clique em **Testar conexão Meta**.

### Etapa 3 — Criar lead de teste
Use o formulário do Lead Ads e gere um lead de teste.

### Etapa 4 — Sincronizar campanhas
Clique em **Sincronizar campanhas** para puxar campanhas e insights.

### Etapa 5 — Sincronizar leads
Clique em **Sincronizar leads** para importar os leads.

### Etapa 6 — Conferir vínculo com campanha
O CRM tenta preencher automaticamente:
- campanha
- anúncio
- formulário
- origem
- score

### Etapa 7 — Gerar PDF executivo
Digite o nome do cliente e clique em **Baixar relatório PDF**.

## Hospedagem no GitHub

### Front-end
O workflow `.github/workflows/deploy-pages.yml` publica a pasta `frontend/` no GitHub Pages.

### Back-end e banco
GitHub Pages **não hospeda back-end nem PostgreSQL**.  
Por isso, a estratégia correta é:

- GitHub Pages para o front
- Docker em VPS / servidor / Render / Railway para a API e o banco

## Argumento comercial para vender a empresas

Use esta proposta:

> “Sua empresa não precisa mais depender de planilhas ou prints do Gerenciador.
> Com este CRM, você centraliza campanhas, leads, origem, score e relatório executivo em PDF.
> Isso acelera atendimento, profissionaliza a operação e facilita a prestação de contas.”

## Endpoints principais

### Saúde da API
```http
GET /api/health
```

### Status de configuração
```http
GET /api/meta/config-status
```

### Testar conexão com Meta
```http
POST /api/meta/test-connection
```

### Sincronizar campanhas
```http
POST /api/meta/sync/campaigns
```

### Sincronizar leads
```http
POST /api/meta/sync/leads
```

### Dashboard
```http
GET /api/meta/dashboard
```

### Relatório PDF
```http
GET /api/reports/client-pdf?clientName=Nome%20do%20Cliente
```

## Melhor caminho de venda

Você pode vender em 3 níveis:

### Plano 1 — CRM base
- dashboard
- campanhas
- leads
- PDF

### Plano 2 — CRM + implantação
- instalação
- conexão com Meta
- treinamento

### Plano 3 — CRM + gestão mensal
- implantação
- acompanhamento
- relatórios recorrentes
- otimização comercial

## Próxima melhoria sugerida

Para a próxima versão, vale incluir:
- login por usuário
- múltiplos clientes em uma mesma base
- funil com arrastar e soltar
- webhook para lead em tempo real
- integração com WhatsApp
