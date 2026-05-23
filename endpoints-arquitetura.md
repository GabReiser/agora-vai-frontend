# Agora Vai — Arquitetura de API e Contratos de Microsserviços

> **Versão:** 1.0.0 | **Data:** 2026-05-23  
> **Autor:** Arquitetura de Software — Agora Vai Platform

---

## 1. Visão Geral da Arquitetura

### 1.1 Topologia dos Serviços

```
                         ┌──────────────────────────────────────────────┐
                         │              Cliente (SPA/Mobile)            │
                         └──────────────────────┬───────────────────────┘
                                                │ HTTPS
                         ┌──────────────────────▼───────────────────────┐
                         │               API Gateway                    │
                         │  (Kong / Spring Cloud Gateway)               │
                         │  • Autenticação JWT (Bearer Token)           │
                         │  • Rate Limiting por plano (Free / Pro)      │
                         │  • Roteamento para microsserviços            │
                         │  • Correlação de Traces (X-Correlation-Id)   │
                         └──┬─────────┬──────────┬──────────┬───────────┘
                            │         │          │          │
              ┌─────────────▼──┐  ┌───▼──────┐  ┌──▼──────────────┐  ┌──▼──────────────┐
              │ Auth & User    │  │Transaction│  │ Gamification    │  │ AI & Chat       │
              │ Service        │  │ Service   │  │ Service         │  │ Service         │
              │ (Spring Boot)  │  │(Quarkus)  │  │ (Quarkus)       │  │ (Spring Boot)   │
              └────────────────┘  └─────┬─────┘  └────────▲────────┘  └─────────────────┘
                                        │                  │
                              ┌─────────▼──────────────────┘
                              │         Apache Kafka                    │
                              │  (Event Broker — Event-Driven Core)    │
                              └─────────────────────────────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  Open Finance     │
                              │  Service          │
                              │  (Spring Boot)    │
                              └───────────────────┘
```

### 1.2 API Gateway

O **API Gateway** é o único ponto de entrada externo da plataforma. Toda requisição dos clientes passa por ele antes de ser roteada para o microsserviço responsável. Suas responsabilidades incluem:

- **Autenticação JWT:** Validação do `Bearer Token` em todas as rotas protegidas, evitando que cada serviço precise reimplementar essa lógica.
- **Rate Limiting:** Controle de chamadas por plano de assinatura. Usuários do plano **Free** possuem limites mais restritivos do que usuários **Pro**.
- **Roteamento:** Prefixos de rota (ex: `/api/v1/auth`, `/api/v1/transactions`) mapeiam diretamente para o serviço correspondente no cluster Kubernetes.
- **Observabilidade:** Injeção do header `X-Correlation-Id` em cada requisição para rastreamento distribuído (OpenTelemetry + Jaeger).

### 1.3 Padrão Event-Driven — Gamificação

O **Gamification Service** opera de forma **exclusivamente reativa**. Ele **não expõe rotas POST para receber XP diretamente**. Em vez disso, consome eventos do Kafka publicados pelos outros microsserviços, garantindo desacoplamento total.

**Fluxo de exemplo:**
1. O `Transaction Service` persiste um novo lançamento e publica o evento `transaction.created` no Kafka.
2. O `Gamification Service` consome esse evento, aplica as regras de missões e XP em background, e atualiza o perfil do usuário.
3. Nenhuma chamada síncrona entre serviços é feita nesse fluxo.

---

## 2. Definição de Endpoints por Microsserviço

> **Convenções:**
> - Todas as rotas são prefixadas com `/api/v1`.
> - Rotas protegidas exigem o header: `Authorization: Bearer <jwt_token>`.
> - Respostas de erro seguem o padrão [RFC 7807 (Problem Details)](https://www.rfc-editor.org/rfc/rfc7807).
> - Campos com `?` são opcionais.

---

### 2.1 Auth & User Service

> **Tecnologia:** Spring Boot 3 + Spring Security + PostgreSQL  
> **Prefixo de rota no Gateway:** `/api/v1/auth` e `/api/v1/users`

---

#### `POST /api/v1/auth/login`

Autentica um usuário existente e retorna um par de tokens JWT.

**Request:**
```json
{
  "email": "joao@email.com",
  "password": "Senha@Segura123"
}
```

**Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Response `401 Unauthorized`:**
```json
{
  "type": "https://agoravai.com.br/errors/invalid-credentials",
  "title": "Credenciais inválidas",
  "status": 401,
  "detail": "E-mail ou senha incorretos."
}
```

---

#### `POST /api/v1/auth/register`

Registra um novo usuário na plataforma. O plano inicial é sempre `FREE`.

**Request:**
```json
{
  "name": "João da Silva",
  "email": "joao@email.com",
  "password": "Senha@Segura123"
}
```

**Response `201 Created`:**
```json
{
  "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
  "name": "João da Silva",
  "email": "joao@email.com",
  "plan": "FREE",
  "createdAt": "2026-05-23T14:30:00Z"
}
```

**Response `409 Conflict`:**
```json
{
  "type": "https://agoravai.com.br/errors/email-already-exists",
  "title": "E-mail já cadastrado",
  "status": 409,
  "detail": "O e-mail joao@email.com já está em uso."
}
```

---

#### `GET /api/v1/users/me`

Retorna o perfil completo do usuário autenticado, incluindo seu plano ativo.

> **Auth:** Obrigatório

**Response `200 OK`:**
```json
{
  "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
  "name": "João da Silva",
  "email": "joao@email.com",
  "avatarUrl": "https://cdn.agoravai.com.br/avatars/joao.png",
  "plan": {
    "id": "plan_pro_monthly",
    "name": "Pro",
    "billingCycle": "MONTHLY",
    "currentPeriodEnd": "2026-06-23T00:00:00Z",
    "status": "ACTIVE"
  },
  "createdAt": "2026-05-23T14:30:00Z"
}
```

---

### 2.2 Transaction Service

> **Tecnologia:** Quarkus + Hibernate Reactive + PostgreSQL + MinIO (armazenamento de extratos)  
> **Prefixo de rota no Gateway:** `/api/v1/transactions`

---

#### `POST /api/v1/transactions`

Cria um único lançamento financeiro manualmente.

> **Auth:** Obrigatório

**Request:**
```json
{
  "description": "Almoço no restaurante",
  "amount": -45.90,
  "type": "EXPENSE",
  "categoryId": "cat_alimentacao",
  "date": "2026-05-23",
  "tags": ["trabalho", "alimentação"],
  "notes": "Reunião com cliente"
}
```

> **Nota:** `amount` negativo = despesa, positivo = receita.

**Response `201 Created`:**
```json
{
  "transactionId": "txn_01HZ5A3N7P8Q2R4S6T0UVWXYZ",
  "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
  "description": "Almoço no restaurante",
  "amount": -45.90,
  "type": "EXPENSE",
  "category": {
    "id": "cat_alimentacao",
    "name": "Alimentação",
    "icon": "🍽️",
    "color": "#F59E0B"
  },
  "date": "2026-05-23",
  "tags": ["trabalho", "alimentação"],
  "notes": "Reunião com cliente",
  "source": "MANUAL",
  "createdAt": "2026-05-23T15:00:00Z"
}
```

---

#### `POST /api/v1/transactions/bulk`

Cria múltiplos lançamentos em uma única chamada. Ideal para importações e confirmação de extratos.

> **Auth:** Obrigatório

**Request:**
```json
{
  "transactions": [
    {
      "description": "Supermercado Extra",
      "amount": -230.50,
      "type": "EXPENSE",
      "categoryId": "cat_mercado",
      "date": "2026-05-20"
    },
    {
      "description": "Salário",
      "amount": 5000.00,
      "type": "INCOME",
      "categoryId": "cat_salario",
      "date": "2026-05-05"
    }
  ]
}
```

**Response `207 Multi-Status`:**
```json
{
  "summary": {
    "total": 2,
    "succeeded": 2,
    "failed": 0
  },
  "results": [
    {
      "index": 0,
      "status": 201,
      "transactionId": "txn_01AAABBBCCC111",
      "description": "Supermercado Extra"
    },
    {
      "index": 1,
      "status": 201,
      "transactionId": "txn_01DDDEEEFFF222",
      "description": "Salário"
    }
  ]
}
```

---

#### `POST /api/v1/transactions/statement/upload`

Recebe um arquivo de extrato bancário (OFX, CSV ou PDF) e retorna uma prévia de conciliação com os lançamentos detectados, sem persistí-los ainda.

> **Auth:** Obrigatório  
> **Content-Type:** `multipart/form-data`

**Request (form-data):**
| Campo | Tipo | Descrição |
|---|---|---|
| `file` | `File` | Arquivo do extrato (OFX, CSV, PDF) |
| `bankCode` | `string` | Código do banco (ex: `"033"` para Santander) |
| `accountId?` | `string` | ID da conta para conciliação (opcional) |

**Response `200 OK`:**
```json
{
  "statementId": "stmt_01HZ6B4C8D9E3F5G7H0IJKLMNO",
  "bank": {
    "code": "033",
    "name": "Santander"
  },
  "period": {
    "from": "2026-05-01",
    "to": "2026-05-31"
  },
  "detectedTransactions": [
    {
      "externalId": "ext_abc123",
      "description": "IFOOD*RESTAURANTE",
      "amount": -38.00,
      "date": "2026-05-10",
      "suggestedCategory": {
        "id": "cat_alimentacao",
        "name": "Alimentação",
        "confidence": 0.94
      },
      "status": "PENDING_CONFIRMATION",
      "duplicateOf": null
    },
    {
      "externalId": "ext_def456",
      "description": "PAGTO SALARIO",
      "amount": 5000.00,
      "date": "2026-05-05",
      "suggestedCategory": {
        "id": "cat_salario",
        "name": "Salário",
        "confidence": 0.99
      },
      "status": "POSSIBLE_DUPLICATE",
      "duplicateOf": "txn_01DDDEEEFFF222"
    }
  ],
  "summary": {
    "total": 2,
    "pendingConfirmation": 1,
    "possibleDuplicates": 1
  }
}
```

---

#### `POST /api/v1/transactions/statement/{statementId}/confirm`

Confirma os lançamentos selecionados da prévia de conciliação e os persiste no banco de dados.

> **Auth:** Obrigatório

**Request:**
```json
{
  "confirmedExternalIds": ["ext_abc123"],
  "ignoredExternalIds": ["ext_def456"]
}
```

**Response `200 OK`:**
```json
{
  "statementId": "stmt_01HZ6B4C8D9E3F5G7H0IJKLMNO",
  "status": "COMPLETED",
  "persisted": 1,
  "ignored": 1,
  "createdTransactionIds": ["txn_01GGGHHH333"]
}
```

---

### 2.3 Gamification Service

> **Tecnologia:** Quarkus + Redis (cache de ranking) + PostgreSQL  
> **Prefixo de rota no Gateway:** `/api/v1/gamification`

> **Importante — Arquitetura Event-Driven:**  
> Este serviço **não possui rotas para receber XP diretamente**. Todo o processamento de XP e missões é feito de forma assíncrona ao consumir os seguintes tópicos do Kafka:
>
> | Tópico Kafka | Evento | Ação |
> |---|---|---|
> | `transaction.created` | `TransactionCreatedEvent` | +XP pela criação de lançamento; verificar missão "Registrou 10 transações" |
> | `transaction.bulk-created` | `BulkTransactionCreatedEvent` | +XP em lote; verificar missão "Importou extrato" |
> | `statement.confirmed` | `StatementConfirmedEvent` | +XP bônus por conciliação completa |
> | `subscription.upgraded` | `SubscriptionUpgradedEvent` | +XP pela missão "Virou Pro"; desbloquear badge especial |
> | `user.registered` | `UserRegisteredEvent` | Criar perfil de gamificação inicial com XP = 0 e Liga = BRONZE |

---

#### `GET /api/v1/gamification/profile`

Retorna o perfil de gamificação do usuário autenticado.

> **Auth:** Obrigatório

**Response `200 OK`:**
```json
{
  "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
  "level": 12,
  "xp": {
    "current": 3450,
    "toNextLevel": 500,
    "total": 3950
  },
  "league": {
    "id": "GOLD",
    "name": "Ouro",
    "iconUrl": "https://cdn.agoravai.com.br/leagues/gold.png",
    "promotionThreshold": 5000,
    "relegationThreshold": 2000
  },
  "streak": {
    "currentDays": 7,
    "longestDays": 21
  },
  "badges": [
    {
      "id": "badge_first_transaction",
      "name": "Primeiro Passo",
      "description": "Registrou sua primeira transação",
      "unlockedAt": "2026-05-23T15:00:00Z",
      "iconUrl": "https://cdn.agoravai.com.br/badges/first-step.png"
    }
  ],
  "activeMissions": [
    {
      "id": "mission_register_10_transactions",
      "name": "Registrador Assíduo",
      "description": "Registre 10 transações",
      "progress": 7,
      "target": 10,
      "xpReward": 200,
      "expiresAt": "2026-05-31T23:59:59Z"
    }
  ]
}
```

---

#### `GET /api/v1/gamification/leaderboard`

Retorna o ranking dos amigos/contatos do usuário autenticado, ordenado por XP da semana atual.

> **Auth:** Obrigatório

**Query Params:**
| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `scope` | `string` | `friends` | `friends` ou `global` |
| `period` | `string` | `weekly` | `weekly` ou `alltime` |
| `page` | `int` | `0` | Página do resultado |
| `size` | `int` | `20` | Itens por página |

**Response `200 OK`:**
```json
{
  "period": "weekly",
  "scope": "friends",
  "generatedAt": "2026-05-23T16:00:00Z",
  "currentUser": {
    "rank": 3,
    "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
    "name": "João da Silva",
    "avatarUrl": "https://cdn.agoravai.com.br/avatars/joao.png",
    "xpThisPeriod": 850,
    "level": 12,
    "league": "GOLD"
  },
  "leaderboard": [
    {
      "rank": 1,
      "userId": "usr_02AAABBBCCC333",
      "name": "Maria Souza",
      "avatarUrl": "https://cdn.agoravai.com.br/avatars/maria.png",
      "xpThisPeriod": 1200,
      "level": 15,
      "league": "PLATINUM"
    },
    {
      "rank": 2,
      "userId": "usr_03DDDEEEFFF444",
      "name": "Carlos Lima",
      "avatarUrl": "https://cdn.agoravai.com.br/avatars/carlos.png",
      "xpThisPeriod": 980,
      "level": 13,
      "league": "GOLD"
    },
    {
      "rank": 3,
      "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
      "name": "João da Silva",
      "avatarUrl": "https://cdn.agoravai.com.br/avatars/joao.png",
      "xpThisPeriod": 850,
      "level": 12,
      "league": "GOLD"
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 3,
    "totalPages": 1
  }
}
```

---

### 2.4 AI & Chat Service

> **Tecnologia:** Spring Boot 3 + Spring AI + integração com LLM (OpenAI / Ollama)  
> **Prefixo de rota no Gateway:** `/api/v1/ai`

---

#### `POST /api/v1/ai/nlp/parse-transaction`

Recebe um texto em linguagem natural e retorna um DTO de transação pré-preenchido, pronto para confirmação do usuário antes de ser persistido.

> **Auth:** Obrigatório

**Request:**
```json
{
  "text": "gastei 20 reais com lanche hoje",
  "locale": "pt-BR"
}
```

**Response `200 OK`:**
```json
{
  "confidence": 0.97,
  "parsed": {
    "description": "Lanche",
    "amount": -20.00,
    "type": "EXPENSE",
    "date": "2026-05-23",
    "suggestedCategory": {
      "id": "cat_alimentacao",
      "name": "Alimentação",
      "confidence": 0.95
    },
    "tags": ["alimentação"]
  },
  "originalText": "gastei 20 reais com lanche hoje",
  "requiresUserConfirmation": true
}
```

**Response `422 Unprocessable Entity`** (quando não é possível extrair informações suficientes):
```json
{
  "type": "https://agoravai.com.br/errors/nlp-insufficient-data",
  "title": "Texto insuficiente para análise",
  "status": 422,
  "detail": "Não foi possível identificar o valor ou a natureza da transação no texto fornecido.",
  "suggestions": ["Tente: 'Gastei R$50 no mercado ontem'", "Tente: 'Recebi R$1000 de freelance'"]
}
```

---

#### `POST /api/v1/ai/insights`

Retorna insights financeiros personalizados baseados no histórico do usuário.

> **Auth:** Obrigatório  
> **Plano:** Exclusivo para usuários **Pro** — retorna `403` para usuários **Free**.

**Request:**
```json
{
  "period": {
    "from": "2026-04-01",
    "to": "2026-05-23"
  },
  "focusAreas": ["spending_patterns", "savings_opportunities", "unusual_expenses"]
}
```

**Response `200 OK`:**
```json
{
  "generatedAt": "2026-05-23T17:00:00Z",
  "period": {
    "from": "2026-04-01",
    "to": "2026-05-23"
  },
  "insights": [
    {
      "id": "insight_001",
      "type": "UNUSUAL_EXPENSE",
      "severity": "WARNING",
      "title": "Gastos com alimentação acima da média",
      "description": "Seus gastos com alimentação em maio (R$ 890,00) estão 34% acima da sua média mensal dos últimos 3 meses (R$ 663,00).",
      "suggestion": "Considere preparar refeições em casa pelo menos 3x por semana para economizar até R$ 200/mês.",
      "relatedCategory": "cat_alimentacao",
      "impactAmount": 227.00
    },
    {
      "id": "insight_002",
      "type": "SAVINGS_OPPORTUNITY",
      "severity": "INFO",
      "title": "Potencial de economia em assinaturas",
      "description": "Você possui 4 serviços de streaming ativos, totalizando R$ 115,00/mês.",
      "suggestion": "Cancelar 1 serviço pouco utilizado pode gerar uma economia de R$ 1.380,00/ano.",
      "relatedCategory": "cat_assinaturas",
      "impactAmount": 1380.00
    }
  ],
  "summary": {
    "totalIncome": 5000.00,
    "totalExpenses": 3240.50,
    "netBalance": 1759.50,
    "savingsRate": 0.35
  }
}
```

**Response `403 Forbidden`** (usuário Free):
```json
{
  "type": "https://agoravai.com.br/errors/plan-restriction",
  "title": "Recurso exclusivo do plano Pro",
  "status": 403,
  "detail": "Os insights de IA estão disponíveis apenas para assinantes do plano Pro.",
  "upgradeUrl": "https://agoravai.com.br/upgrade"
}
```

---

### 2.5 Open Finance Service

> **Tecnologia:** Spring Boot 3 + integração com Pluggy / Belvo API  
> **Prefixo de rota no Gateway:** `/api/v1/open-finance`

---

#### `POST /api/v1/open-finance/sync/initiate`

Inicia o fluxo de sincronização bancária via Open Finance. Retorna uma URL de consentimento para redirecionar o usuário ao ambiente seguro do banco.

> **Auth:** Obrigatório

**Request:**
```json
{
  "bankCode": "341",
  "accountTypes": ["CHECKING", "SAVINGS", "CREDIT_CARD"],
  "callbackUrl": "https://app.agoravai.com.br/open-finance/callback"
}
```

**Response `202 Accepted`:**
```json
{
  "syncSessionId": "sync_01HZ7C5D9E0F4G6H8I2JKLMNOP",
  "status": "AWAITING_CONSENT",
  "consentUrl": "https://api.banco-itau.com.br/open-banking/consent?token=abc123&redirect=...",
  "bank": {
    "code": "341",
    "name": "Itaú",
    "logoUrl": "https://cdn.agoravai.com.br/banks/itau.png"
  },
  "expiresAt": "2026-05-23T17:30:00Z"
}
```

> Após o consentimento do usuário no banco, o serviço recebe o callback, importa as transações via `POST /api/v1/transactions/bulk` internamente, e publica o evento `open-finance.sync-completed` no Kafka.

---

## 3. Modelos de Eventos — Mensageria Kafka

> **Convenção:** Todos os eventos incluem um envelope padrão com metadados de rastreamento. O payload é serializado em **JSON (Schema Registry — Confluent/Avro-compatible)**.

### 3.1 Envelope Padrão de Evento

Todos os eventos publicados no Kafka seguem este envelope:

```json
{
  "eventId": "evt_01HZ8D6E0F1G5H7I9J3KLMNOPQ",
  "eventType": "transaction.created",
  "version": "1.0",
  "source": "transaction-service",
  "correlationId": "req_01HZ4K8X9R3M5P7N2Q6W0YBTC",
  "occurredAt": "2026-05-23T15:00:00.123Z",
  "payload": { }
}
```

---

### 3.2 `TransactionCreatedEvent`

**Tópico:** `transaction.created`  
**Produzido por:** Transaction Service  
**Consumido por:** Gamification Service, AI & Chat Service (para aprendizado de padrões)

```json
{
  "eventId": "evt_01HZ8D6E0F1G5H7I9J3KLMNOPQ",
  "eventType": "transaction.created",
  "version": "1.0",
  "source": "transaction-service",
  "correlationId": "req_01HZ4K8X9R3M5P7N2Q6W0YBTC",
  "occurredAt": "2026-05-23T15:00:00.123Z",
  "payload": {
    "transactionId": "txn_01HZ5A3N7P8Q2R4S6T0UVWXYZ",
    "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
    "amount": -45.90,
    "type": "EXPENSE",
    "categoryId": "cat_alimentacao",
    "source": "MANUAL",
    "date": "2026-05-23"
  }
}
```

**Ações no Gamification Service ao consumir este evento:**
- Adicionar **+10 XP** por transação manual registrada.
- Verificar progresso da missão `mission_register_10_transactions`.
- Verificar se o usuário atingiu streak diário (primeiro lançamento do dia = +5 XP bônus).

---

### 3.3 `BulkTransactionCreatedEvent`

**Tópico:** `transaction.bulk-created`  
**Produzido por:** Transaction Service  
**Consumido por:** Gamification Service

```json
{
  "eventId": "evt_02AAABBB111CCCDDD222",
  "eventType": "transaction.bulk-created",
  "version": "1.0",
  "source": "transaction-service",
  "correlationId": "req_bulk_555",
  "occurredAt": "2026-05-23T15:30:00.000Z",
  "payload": {
    "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
    "transactionCount": 15,
    "source": "STATEMENT_IMPORT",
    "statementId": "stmt_01HZ6B4C8D9E3F5G7H0IJKLMNO",
    "totalAmount": -1250.75
  }
}
```

**Ações no Gamification Service:**
- Adicionar **+5 XP** por transação no lote (máximo de 100 XP por importação).
- Verificar missão `mission_import_statement`.

---

### 3.4 `StatementConfirmedEvent`

**Tópico:** `statement.confirmed`  
**Produzido por:** Transaction Service  
**Consumido por:** Gamification Service

```json
{
  "eventId": "evt_03EEEFFF333GGGHHH444",
  "eventType": "statement.confirmed",
  "version": "1.0",
  "source": "transaction-service",
  "correlationId": "req_stmt_confirm_789",
  "occurredAt": "2026-05-23T15:45:00.000Z",
  "payload": {
    "statementId": "stmt_01HZ6B4C8D9E3F5G7H0IJKLMNO",
    "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
    "confirmedCount": 13,
    "ignoredCount": 2,
    "bankCode": "033"
  }
}
```

**Ações no Gamification Service:**
- Adicionar **+50 XP** bônus pela conciliação completa.
- Desbloquear badge `badge_reconciliation_master` se for a 5ª conciliação.

---

### 3.5 `UserRegisteredEvent`

**Tópico:** `user.registered`  
**Produzido por:** Auth & User Service  
**Consumido por:** Gamification Service

```json
{
  "eventId": "evt_04IIIJJJ555KKKMMM666",
  "eventType": "user.registered",
  "version": "1.0",
  "source": "auth-user-service",
  "correlationId": "req_register_101",
  "occurredAt": "2026-05-23T14:30:00.000Z",
  "payload": {
    "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
    "name": "João da Silva",
    "email": "joao@email.com",
    "plan": "FREE"
  }
}
```

**Ações no Gamification Service:**
- Criar registro de perfil de gamificação com `xp = 0`, `level = 1`, `league = BRONZE`.
- Ativar missões de boas-vindas (ex: `mission_first_transaction`).

---

### 3.6 `SubscriptionUpgradedEvent`

**Tópico:** `subscription.upgraded`  
**Produzido por:** Auth & User Service (via webhook do Stripe/Asaas)  
**Consumido por:** Gamification Service

```json
{
  "eventId": "evt_05NNNOOO777PPPQQQ888",
  "eventType": "subscription.upgraded",
  "version": "1.0",
  "source": "auth-user-service",
  "correlationId": "req_upgrade_202",
  "occurredAt": "2026-05-23T18:00:00.000Z",
  "payload": {
    "userId": "usr_01HZ4K8X9R3M5P7N2Q6W0YBTC",
    "previousPlan": "FREE",
    "newPlan": "PRO",
    "planId": "plan_pro_monthly"
  }
}
```

**Ações no Gamification Service:**
- Adicionar **+100 XP** pela missão `mission_upgrade_to_pro`.
- Desbloquear badge exclusivo `badge_pro_member`.

---

## 4. Resumo de Tópicos Kafka

| Tópico | Produzido por | Consumido por | Partições sugeridas |
|---|---|---|---|
| `user.registered` | Auth & User Service | Gamification Service | 3 |
| `transaction.created` | Transaction Service | Gamification, AI & Chat | 12 |
| `transaction.bulk-created` | Transaction Service | Gamification Service | 6 |
| `statement.confirmed` | Transaction Service | Gamification Service | 3 |
| `subscription.upgraded` | Auth & User Service | Gamification Service | 3 |
| `open-finance.sync-completed` | Open Finance Service | Transaction Service | 3 |

---

## 5. Códigos de Status HTTP — Referência Rápida

| Status | Uso |
|---|---|
| `200 OK` | Leitura bem-sucedida |
| `201 Created` | Recurso criado com sucesso |
| `202 Accepted` | Processamento assíncrono iniciado |
| `207 Multi-Status` | Operação em lote com resultados parciais |
| `400 Bad Request` | Payload inválido / campos faltando |
| `401 Unauthorized` | Token ausente ou expirado |
| `403 Forbidden` | Acesso negado (plano insuficiente ou permissão) |
| `404 Not Found` | Recurso não encontrado |
| `409 Conflict` | Conflito de dados (ex: e-mail duplicado) |
| `422 Unprocessable Entity` | Dados semanticamente inválidos |
| `429 Too Many Requests` | Rate limit atingido |
| `500 Internal Server Error` | Erro inesperado no servidor |
