# 🎨 Guia Visual do Dashboard

## Tema Futurista

O dashboard foi redesenhado com um tema **escuro futurista** completo:

- **Cor de Fundo**: Preto profundo (#0a0e27) com grid de luz
- **Acentos**: Ciano (#00d4ff) + Roxo (#8b00ff)
- **Efeitos**: Scanline animation, glow effects, grid mesh background
- **Tipografia**: Inter (sans-serif) + Space Mono (logs)

## 📱 Layout Principal

```
┌─────────────────────────────────────────────────┐
│ ⬢ Meta Ads CRM - Command Center                │
└─────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ → CONECTAR  ⟳ CAMPANHAS  ◈ LEADS  ⟲ REFRESH  │
└────────────────────────────────────────────────┘

┌────────┬────────┬────────┬────────┐
│ LEADS  │ CAMPAIGN│ SPEND  │ CPL    │
│  23    │   5    │ 26.4k  │  42.05 │
└────────┴────────┴────────┴────────┘

┌─────────────────────────────────────┐
│ 📈 Spend              📊 CPL         │
│ [Graph with Cyan]     [Graph with Cyan]│
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 📋 Leads               ⚙️ Status      │
│ [Graph with Purple]    [Status Dots]  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ CAMPANHAS                            │
│ ┌────────────────────────────────┐  │
│ │ CAMPAIGN │ SPEND │ LEADS │ CPL │  │
│ │ Produto  │ 4.9k  │  127  │ 39  │  │
│ │ Retarg.  │ 2.8k  │   89  │ 32  │  │
│ │ Awareness│ 6.0k  │  156  │ 38  │  │
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ LEADS                                │
│ ┌────────────────────────────────┐  │
│ │ NOME │ EMAIL │ CAMPAIGN │ CPL  │  │
│ │ João │ ... │ Produto  │ 39   │  │
│ │ Maria│ ... │ Retarg.  │ 32   │  │
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Activity Log                         │
│ [$ waiting for events...]            │
│ > Campanhas sincronizadas            │
│ > Leads importados                   │
└──────────────────────────────────────┘
```

## 🎮 Botões de Ação

### → CONECTAR
- **Função**: Testa conexão com API Meta
- **Feedback**: "✅ Conectado" ou "❌ Erro"
- **Afeta**: Status de conexão do sistema

### ⟳ CAMPANHAS
- **Função**: Sincroniza campanhas da Meta
- **Feedback**: "✅ 5 campanha(s) sincronizada(s)"
- **Resultado**: Tabela CAMPANHAS é preenchida

### ◈ LEADS
- **Função**: Sincroniza leads capturados
- **Feedback**: "✅ 23 lead(s) sincronizado(s)"
- **Resultado**: Tabela LEADS é preenchida

### ⟲ REFRESH
- **Função**: Atualiza todos os dados
- **Tempo**: ~2-3 segundos
- **Resultado**: Gráficos e tabelas são atualizadas

## 📊 KPI Cards (Topo)

Cada card mostra uma métrica principal com:
- **Número Grande**: O valor principal
- **Barra Colorida**: Progresso visual (ciano)
- **Rótulo**: Nome da métrica

### Métricas Exibidas
1. **LEADS** - Total de leads capturados
2. **CAMPAIGN** - Total de campanhas
3. **SPEND** - Gasto total em campanhas
4. **CPL** - Custo por lead médio

## 📈 Gráficos

### 1. Spend (Canto Superior Esquerdo)
- **Tipo**: Gráfico de linha
- **Cor**: Ciano (#00d4ff)
- **Mostra**: Tendência de gasto ao longo do tempo
- **Objetivo**: Visualizar gastos em tempo real

### 2. CPL (Canto Superior Direito)
- **Tipo**: Gráfico de linha
- **Cor**: Roxo (#8b00ff)
- **Mostra**: Custo por lead ao longo do tempo
- **Objetivo**: Acompanhar eficiência das campanhas

### 3. Leads (Canto Inferior Esquerdo)
- **Tipo**: Gráfico de barras
- **Cor**: Pink (#ff0080)
- **Mostra**: Quantidade de leads por campanha
- **Objetivo**: Volumes de lead geração

### 4. Status (Canto Inferior Direito)
- **Tipo**: Indicadores circulares (dots)
- **Cores**:
  - 🟢 Verde: Online/Ativo
  - 🔴 Vermelho: Offline/Inativo
  - 🟡 Amarelo: Aguardando
- **Mostra**: Status de componentes do sistema

## 📋 Tabelas

### CAMPANHAS
Columns:
- **CAMPAIGN** - Nome da campanha
- **SPEND** - Investimento total
- **LEADS** - Leads gerados
- **CPL** - Custo por lead
- **CLICKS** - Cliques recebidos

### LEADS
Columns:
- **NOME** - Nome do lead
- **EMAIL** - Email do lead
- **CAMPAIGN** - Campanha origine
- **SOURCE** - Fonte (Meta Lead Ads)
- **STATUS** - Novo/Convertido

## 🎨 Cores e Efeitos

### Core Colors
```
--dark-bg: #0a0e27        (Fundo escuro)
--accent-cyan: #00d4ff    (Ciano brilhante)
--accent-purple: #8b00ff  (Roxo elétrico)
--accent-pink: #ff0080    (Rosa quente)
--accent-blue: #0066ff    (Azul saturado)
```

### Efeitos Visuais
- **Grid Mesh**: Background com padrão geométrico
- **Scanline**: Efeito de linhas horizontais
- **Glow**: Brilho ao redor de elementos focados
- **Blur**: Fundo desfocado em cards
- **Shadow**: Sombras suaves para profundidade

## 📱 Responsividade

- **Desktop**: Layout completo (4 colunas de gráficos)
- **Tablet**: Layout estendido (2 linhas de 2 gráficos)
- **Mobile**: Layout em pilha (1 coluna)

## 🔔 Notificações

### Toasts (Corner Superior Direito)
Sistemas de notificação visual para:
- ✅ Ações bem-sucedidas
- ❌ Erros e problemas
- ℹ️ Informações
- ⚠️ Avisos

### Exemplos
```
✅ Conectado à API Meta
❌ Erro ao sincronizar campanhas
ℹ️ Dashboard atualizado
⚠️ Tentando reconectar...
```

## 🕐 Activity Log

Histórico de eventos em tempo real:
- Sincronizações iniciadas
- Dados atualizados
- Erros ocorridos
- Conexões estabelecidas

Mostra os últimos 10 eventos com timestamp.

## 💡 Dicas de Uso

1. **Primeira Vez**: Clique em "⟳ CAMPANHAS" e "◈ LEADS"
2. **Atualizar Dados**: Use "⟲ REFRESH" a cada minuto
3. **Verificar Status**: Olhe para os dots de status
4. **Logs**: Verifique Activity Log para troubleshooting
5. **Mobile**: Use landscape para melhor visualização

## 🎯 Próximas Atualizações

- [ ] Filtros por data range
- [ ] Export de relatórios
- [ ] Dashboard customizável
- [ ] Dark/Light mode toggle
- [ ] Integração de leads em tempo real
