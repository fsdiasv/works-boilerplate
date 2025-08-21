# Restaurando Autenticação para o Dashboard de Analytics

Este documento descreve os passos necessários para restaurar a obrigatoriedade de login para acessar as rotas do dashboard de analytics.

## Resumo das Alterações Necessárias

Para voltar a exigir autenticação no dashboard de analytics, você precisará reverter as mudanças que tornaram essas rotas públicas.

## Passos para Restaurar a Autenticação

### 1. Atualizar o Middleware

**Arquivo:** `/src/middleware.ts`

Remova `/analytics` da lista de rotas públicas:

```typescript
// Antes (configuração atual - sem autenticação)
const publicRoutes = [
  '/analytics',
]

// Depois (configuração com autenticação obrigatória)
const publicRoutes = [
  // Remover '/analytics' desta lista
]
```

### 2. Atualizar o Router de Analytics (tRPC)

**Arquivo:** `/src/server/api/routers/analytics.ts`

Altere todos os procedures de `publicProcedure` para `protectedProcedure`:

```typescript
// Antes (configuração atual - sem autenticação)
export const analyticsRouter = createTRPCRouter({
  kpis: publicProcedure
    .input(analyticsFiltersSchema)
    .output(kpisOutputSchema)
    .query(async ({ ctx, input }) => { /* ... */ }),

  revenueTimeseries: publicProcedure
    .input(analyticsFiltersSchema)
    .output(revenueTimeseriesOutputSchema)
    .query(async ({ ctx, input }) => { /* ... */ }),

  // ... outros procedures com publicProcedure
})

// Depois (configuração com autenticação obrigatória)
export const analyticsRouter = createTRPCRouter({
  kpis: protectedProcedure  // Mudança aqui
    .input(analyticsFiltersSchema)
    .output(kpisOutputSchema)
    .query(async ({ ctx, input }) => { /* ... */ }),

  revenueTimeseries: protectedProcedure  // Mudança aqui
    .input(analyticsFiltersSchema)
    .output(revenueTimeseriesOutputSchema)
    .query(async ({ ctx, input }) => { /* ... */ }),

  // ... todos os outros procedures também devem usar protectedProcedure
})
```

### 3. Reverter Configuração do WorkspaceProvider (Opcional)

**Arquivo:** `/src/contexts/workspace-context.tsx`

Se desejar, pode remover a configuração de `retry: false` que foi adicionada:

```typescript
// Configuração atual (otimizada para páginas públicas)
const { data: session, isLoading } = api.auth.getSession.useQuery(undefined, {
  enabled: !!user,
  staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  refetchOnWindowFocus: false,
  retry: false, // Esta linha pode ser removida
})

// Configuração padrão (com retry automático)
const { data: session, isLoading } = api.auth.getSession.useQuery(undefined, {
  enabled: !!user,
  staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  refetchOnWindowFocus: false,
})
```

## Verificação das Mudanças

Após implementar essas alterações:

1. **Teste de Acesso Não Autenticado:** Acesse `/analytics` sem estar logado - você deve ser redirecionado para a página de login.

2. **Teste de Acesso Autenticado:** Faça login e acesse `/analytics` - você deve conseguir acessar normalmente.

3. **Teste das Sub-rotas:** Verifique se `/analytics/products`, `/analytics/subscriptions` e `/analytics/disputes` também exigem autenticação.

## Rotas Afetadas

As seguintes rotas voltarão a exigir autenticação:

- `/[locale]/analytics`
- `/[locale]/analytics/products`
- `/[locale]/analytics/subscriptions`
- `/[locale]/analytics/disputes`

## Notas de Segurança

- ✅ **Controle de Acesso:** Com a autenticação restaurada, apenas usuários autenticados poderão acessar dados sensíveis de analytics.
- ✅ **Workspace Context:** O WorkspaceProvider funcionará normalmente para usuários autenticados.
- ✅ **Proteção de Dados:** Os dados financeiros e de vendas estarão protegidos por autenticação.

## Implementação de RBAC (Futuro)

Para maior segurança, considere implementar controle de acesso baseado em funções (RBAC) no futuro:

- Apenas usuários com role `admin` ou `owner` podem acessar analytics
- Filtrar dados baseado no workspace do usuário
- Logs de auditoria para acesso a dados sensíveis