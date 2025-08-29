# Plano de Migração: Separação Users/Customers e Restauração de Autenticação

## 📋 Resumo Executivo

Este documento detalha o plano completo para:

1. Separar a tabela `users` atual em duas: `customers` (compradores) e `users`
   (usuários do sistema)
2. Restaurar a autenticação obrigatória para o dashboard de analytics
3. Garantir que todas as tabelas necessárias sejam criadas corretamente no banco

## 🎯 Objetivos

- **Separação de Conceitos**: Distinguir entre compradores (customers) e
  usuários do sistema (users)
- **Segurança**: Restaurar autenticação obrigatória para rotas sensíveis
- **Integridade**: Manter todos os dados existentes e relacionamentos
- **Compatibilidade**: Garantir que o sistema continue funcionando durante a
  migração

## 📊 Análise do Estado Atual vs Estado Desejado

### Estado Atual (branch: data-visualization-ds)

```
users (tabela atual - mistura compradores e usuários)
├── id (BigInt)
├── email
├── name
├── systemeContactId
├── country
├── language
├── orders (relação)
├── orderItems (relação)
├── subscriptions (relação)
├── disputes (relação)
├── profiles (relação workspace)
├── sessions (relação workspace)
├── workspaceMemberships (relação workspace)
└── invitations (relação workspace)
```

### Estado Desejado (após migração)

```
customers (antiga users - apenas compradores)
├── id (BigInt)
├── email
├── name
├── systemeContactId
├── country
├── language
├── orders (relação)
├── orderItems (relação)
├── subscriptions (relação)
└── disputes (relação)

users (nova tabela - usuários do sistema)
├── id (String UUID)
├── email
├── fullName
├── avatarUrl
├── emailVerified
├── phone
├── locale
├── timezone
├── metadata
├── activeWorkspaceId
├── lastActiveAt
├── profiles (relação)
├── sessions (relação)
├── workspaceMemberships (relação)
├── invitations (relação)
└── activeWorkspace (relação)
```

## 🔄 Plano de Migração do Banco de Dados

### Fase 1: Preparação e Backup

```bash
# 1. Criar backup completo do banco
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verificar integridade dos dados atuais
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM workspace_members;
```

### Fase 2: Migração das Tabelas

#### Passo 1: Renomear tabela users para customers

```sql
-- Renomear tabela
ALTER TABLE users RENAME TO customers;

-- Renomear constraints
ALTER TABLE customers RENAME CONSTRAINT users_pkey TO customers_pkey;
ALTER TABLE customers RENAME CONSTRAINT users_email_key TO customers_email_key;

-- Atualizar sequences se necessário
ALTER SEQUENCE users_id_seq RENAME TO customers_id_seq;
```

#### Passo 2: Criar nova tabela users

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    locale TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    metadata JSONB,
    active_workspace_id TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_active_workspace_id_idx ON users(active_workspace_id);
```

#### Passo 3: Atualizar foreign keys das tabelas relacionadas

```sql
-- Profiles
ALTER TABLE profiles
    DROP CONSTRAINT profiles_user_id_fkey,
    ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE profiles
    ADD CONSTRAINT profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Sessions
ALTER TABLE sessions
    DROP CONSTRAINT sessions_user_id_fkey,
    ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE sessions
    ADD CONSTRAINT sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Workspace Members
ALTER TABLE workspace_members
    DROP CONSTRAINT workspace_members_user_id_fkey,
    ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Invitations
ALTER TABLE invitations
    DROP CONSTRAINT invitations_invited_by_id_fkey,
    ALTER COLUMN invited_by_id TYPE TEXT;

ALTER TABLE invitations
    ADD CONSTRAINT invitations_invited_by_id_fkey
    FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE;

-- Orders (manter apontando para customers)
ALTER TABLE orders
    DROP CONSTRAINT orders_user_id_fkey,
    ADD CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (user_id) REFERENCES customers(id);

-- OrderItems (manter apontando para customers)
ALTER TABLE order_items
    DROP CONSTRAINT order_items_user_id_fkey,
    ADD CONSTRAINT order_items_customer_id_fkey
    FOREIGN KEY (user_id) REFERENCES customers(id);

-- Subscriptions (manter apontando para customers)
ALTER TABLE subscriptions
    DROP CONSTRAINT subscriptions_user_id_fkey,
    ADD CONSTRAINT subscriptions_customer_id_fkey
    FOREIGN KEY (user_id) REFERENCES customers(id);

-- Disputes (manter apontando para customers)
ALTER TABLE disputes
    DROP CONSTRAINT disputes_user_id_fkey,
    ADD CONSTRAINT disputes_customer_id_fkey
    FOREIGN KEY (user_id) REFERENCES customers(id);
```

#### Passo 4: Migrar dados de usuários administrativos (se existirem)

```sql
-- Inserir usuários administrativos na nova tabela users
-- Este passo deve ser feito manualmente ou via script específico
-- baseado nos emails dos administradores conhecidos
```

## 📝 Alterações no Código

### 1. Atualizar Prisma Schema (`prisma/schema.prisma`)

```prisma
// Modelo Customer (antigo User para compradores)
model Customer {
  id                 BigInt   @id @default(autoincrement())
  createdAt          DateTime @default(now()) @map("created_at")
  email              String   @unique
  name               String
  systemeContactId   BigInt?  @map("systeme_contact_id")
  country            String?
  language           String?
  updatedAt          DateTime @default(now()) @map("updated_at")

  // Relations com vendas
  orders             Order[]
  orderItems         OrderItem[]
  subscriptions      Subscription[]
  disputes           Dispute[]

  @@map("customers")
}

// Modelo User (para autenticação e workspace)
model User {
  id                   String            @id @default(uuid())
  email                String            @unique
  fullName             String?           @map("full_name")
  avatarUrl            String?           @map("avatar_url")
  emailVerified        Boolean           @default(false) @map("email_verified")
  phone                String?
  locale               String            @default("pt-BR")
  timezone             String            @default("America/Sao_Paulo")
  metadata             Json?
  activeWorkspaceId    String?           @map("active_workspace_id")
  lastActiveAt         DateTime          @default(now()) @map("last_active_at")
  createdAt            DateTime          @default(now()) @map("created_at")
  updatedAt            DateTime          @updatedAt @map("updated_at")

  // Relations com workspace
  invitationsSent      Invitation[]
  profile              Profile?
  sessions             Session[]
  activeWorkspace      Workspace?        @relation("UserActiveWorkspace", fields: [activeWorkspaceId], references: [id])
  workspaceMemberships WorkspaceMember[]

  @@map("users")
}

// Atualizar referências em outras models
model Profile {
  userId    String   @unique @map("user_id") // Mudou de BigInt para String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... resto dos campos
}

model Session {
  userId       String   @map("user_id") // Mudou de BigInt para String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... resto dos campos
}

model WorkspaceMember {
  userId      String        @map("user_id") // Mudou de BigInt para String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... resto dos campos
}

model Invitation {
  invitedById String        @map("invited_by_id") // Mudou de BigInt para String
  invitedBy   User          @relation(fields: [invitedById], references: [id], onDelete: Cascade)
  // ... resto dos campos
}

model Order {
  userId          BigInt   @map("user_id") // Mantém BigInt
  customer        Customer @relation(fields: [userId], references: [id]) // Relação com Customer
  // ... resto dos campos
}

model OrderItem {
  userId          BigInt?   @map("user_id") // Mantém BigInt
  customer        Customer? @relation(fields: [userId], references: [id]) // Relação com Customer
  // ... resto dos campos
}

model Subscription {
  userId          BigInt?   @map("user_id") // Mantém BigInt
  customer        Customer? @relation(fields: [userId], references: [id]) // Relação com Customer
  // ... resto dos campos
}

model Dispute {
  userId          BigInt    @map("user_id") // Mantém BigInt
  customer        Customer  @relation(fields: [userId], references: [id]) // Relação com Customer
  // ... resto dos campos
}
```

### 2. Atualizar tRPC Routers

#### `src/server/api/routers/analytics.ts`

- Já está usando `workspaceAdminProcedure` (protegido) ✅
- Atualizar referências de `user` para `customer` nas queries

```typescript
// Exemplo de mudança necessária
const orders = await ctx.db.order.findMany({
  where: {
    status: 'COMPLETED',
    // customer ao invés de user
    customer: {
      email: { contains: filter },
    },
  },
  include: {
    customer: true, // ao invés de user
    orderItems: true,
  },
})
```

#### `src/server/api/routers/auth.ts`

- Manter como está, trabalha com `User` (sistema)
- Já usa `publicProcedure` para getSession ✅

### 3. Atualizar Contexts

#### `src/contexts/auth-context.tsx`

- Verificar se precisa ajustes para trabalhar com nova estrutura User
- Manter lógica de autenticação existente

#### `src/contexts/workspace-context.tsx`

- Verificar relações com User
- Manter lógica de workspace existente

### 4. Atualizar Middleware (`src/middleware.ts`)

- Já tem `/analytics` em protectedRoutes ✅
- Não precisa alterações

## 🧪 Plano de Testes

### Testes de Migração

1. **Backup e Restore**
   - Verificar se backup está completo
   - Testar restore em ambiente de desenvolvimento

2. **Integridade de Dados**
   - Verificar contagem de registros antes e depois
   - Validar foreign keys
   - Testar queries complexas

3. **Funcionalidades**
   - [ ] Login/Logout
   - [ ] Criação de workspace
   - [ ] Acesso ao analytics (com autenticação)
   - [ ] Visualização de orders/customers
   - [ ] Gestão de membros do workspace

### Testes de Regressão

1. **Analytics Dashboard**
   - Todos os gráficos carregando
   - Filtros funcionando
   - Dados corretos sendo exibidos

2. **Autenticação**
   - Login com email/senha
   - OAuth providers
   - Session management

3. **Workspace**
   - Troca de workspace
   - Convites
   - Permissões (admin/member)

## ⚠️ Riscos e Mitigações

| Risco                                         | Impacto | Mitigação                                       |
| --------------------------------------------- | ------- | ----------------------------------------------- |
| Perda de dados durante migração               | Alto    | Backup completo antes de iniciar                |
| Quebra de foreign keys                        | Alto    | Validar todas as relações após migração         |
| Downtime do sistema                           | Médio   | Executar migração em horário de baixo uso       |
| Incompatibilidade de tipos (BigInt vs String) | Alto    | Converter cuidadosamente os IDs                 |
| Falha na autenticação                         | Alto    | Testar extensivamente antes de ir para produção |

## 📅 Cronograma de Execução

### Dia 1: Preparação

- [ ] Criar backup do banco de produção
- [ ] Configurar ambiente de teste
- [ ] Revisar e aprovar plano

### Dia 2: Migração do Banco

- [ ] Executar scripts SQL de migração
- [ ] Validar integridade dos dados
- [ ] Testar queries básicas

### Dia 3: Atualização do Código

- [ ] Atualizar Prisma schema
- [ ] Gerar novo Prisma client
- [ ] Atualizar imports e referências no código
- [ ] Corrigir TypeScript errors

### Dia 4: Testes

- [ ] Executar suite de testes automatizados
- [ ] Testes manuais de funcionalidades críticas
- [ ] Validar performance

### Dia 5: Deploy

- [ ] Deploy em staging
- [ ] Testes finais
- [ ] Deploy em produção
- [ ] Monitoramento pós-deploy

## 📌 Checklist Final

### Pré-Migração

- [ ] Backup do banco de dados criado e validado
- [ ] Ambiente de teste preparado
- [ ] Scripts SQL revisados
- [ ] Código preparado para nova estrutura

### Durante a Migração

- [ ] Tabela `users` renomeada para `customers`
- [ ] Nova tabela `users` criada
- [ ] Foreign keys atualizadas
- [ ] Dados migrados corretamente

### Pós-Migração

- [ ] Prisma schema atualizado
- [ ] Código TypeScript sem erros
- [ ] Testes passando
- [ ] Analytics funcionando com autenticação
- [ ] Workspace management funcionando

## 🔧 Comandos Úteis

```bash
# Gerar migração Prisma
pnpm prisma migrate dev --name separate-users-customers

# Validar schema
pnpm prisma validate

# Gerar client
pnpm prisma generate

# Rodar testes
pnpm test

# Verificar tipos TypeScript
pnpm typecheck
```

## 📞 Contatos de Emergência

Em caso de problemas durante a migração:

1. Restaurar backup imediatamente
2. Reverter código para branch anterior
3. Documentar o problema encontrado
4. Reagendar migração após resolução

---

**Documento criado em:** 2025-08-28 **Última atualização:** 2025-08-28
**Status:** PRONTO PARA REVISÃO
