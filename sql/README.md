# 📊 SQL Scripts para Analytics Dashboard

## 🚨 IMPORTANTE: Execute na Ordem Correta

Execute estes scripts **na ordem exata** listada abaixo no **Supabase SQL
Editor**:

### 1. **check-database-state.sql**

Primeiro script a executar para verificar o estado atual do banco de dados.

**O que faz:**

- Verifica quantos registros existem em cada tabela
- Mostra amostra de dados de pagamentos
- Lista status únicos dos pagamentos
- Verifica produtos existentes
- Mostra dados recentes (últimos 30 dias)
- Verifica timezone e índices atuais

**Execute primeiro para saber se temos dados para trabalhar.**

### 2. **create-analytics-views-minimal.sql** (RECOMENDADO)

Cria as views necessárias para o analytics dashboard (versão segura).

**O que faz:**

- Cria schema `analytics`
- Cria view `vw_payments_success` (pagamentos bem-sucedidos)
- Cria view `vw_order_revenue_brl` (receita por pedido)
- Cria view `vw_refunds` (reembolsos)
- Cria view `vw_dispute_losses` (perdas por disputas)
- Cria view `vw_subscription_metrics` (métricas de assinaturas)
- Usa COALESCE para campos que podem não existir

**Execute após confirmar que há dados no banco.**

### 2b. **debug-table-structure.sql** (SE HOUVER ERROS)

Use este script se tiver erros de "column does not exist":

**O que faz:**

- Verifica estrutura de todas as tabelas
- Lista colunas existentes vs esperadas
- Identifica diferenças entre Prisma schema e banco real

### 3. **create-indexes.sql**

Cria índices otimizados para performance das consultas.

**O que faz:**

- Índices para pagamentos por status e data
- Índices para reembolsos e disputas
- Índices para assinaturas ativas/canceladas
- Índices compostos para queries de analytics
- Índices para queries com timezone

**Execute após criar as views.**

### 4. **test-queries.sql**

Testa se tudo está funcionando corretamente.

**O que faz:**

- Testa todas as views criadas
- Simula as queries que o tRPC fará
- Testa KPIs, séries temporais, produtos top
- Verifica performance das queries
- Valida timezone das consultas

**Execute por último para validar tudo.**

## 📋 Checklist de Execução

- [ ] 1. Execute `check-database-state.sql`
- [ ] 2. Verifique se há dados suficientes (pelo menos alguns pagamentos)
- [ ] 3. Execute `create-analytics-views-minimal.sql` (versão segura)
- [ ] 4. Se houver erros, execute `debug-table-structure.sql` para investigar
- [ ] 5. Execute `create-indexes.sql`
- [ ] 6. Execute `test-queries.sql`
- [ ] 7. Verifique se os testes retornam dados válidos

## ⚠️ Troubleshooting

### Se não houver dados:

- O banco foi resetado e está vazio
- Você pode restaurar de um backup do Supabase
- Ou usar dados de teste (veja comentários no `test-queries.sql`)

### Se as views falharem:

- Verifique se todas as tabelas existem
- Verifique se o schema `analytics` foi criado
- Execute novamente o `create-analytics-views.sql`

### Se os índices falharem:

- Alguns índices podem já existir (normal)
- Use `CREATE INDEX IF NOT EXISTS` para evitar erros
- Verifique permissões de criação de índices

## 📊 Após Executar os Scripts

Quando todos os scripts estiverem executados com sucesso:

1. **Teste o dashboard**: Acesse `http://localhost:3000/pt/analytics`
2. **Verifique os dados**: Os KPIs devem mostrar valores reais
3. **Teste os filtros**: Mude datas e veja se os dados mudam
4. **Verifique performance**: As queries devem ser rápidas (<1s)

## 🚨 BACKUP

**SEMPRE** faça backup antes de executar qualquer script:

```bash
pnpm db:backup
```

## 💡 Dicas

- Execute um script por vez
- Verifique os resultados de cada script antes de continuar
- Se algo der errado, consulte `docs/CRITICAL-DATABASE-SAFETY.md`
- Mantenha um backup recente sempre à mão
