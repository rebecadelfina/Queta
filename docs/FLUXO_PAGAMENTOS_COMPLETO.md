# 🔄 FLUXO AUTOMÁTICO DE PAGAMENTOS

## 📊 Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE PAGAMENTOS                        │
│                                                                 │
│  USUÁRIO                SISTEMA              ADMIN              │
│    │                      │                   │                │
│    │ 1.Solicita Pag.    │                   │                │
│    ├─────────────────>   │                   │                │
│    │                      │ 2.Cria Regst      │                │
│    │                      ├─────────────────> │ 3.Recebe Alerta│
│    │                      │                   │                │
│    │                      │ [AGUARDANDO]      │                │
│    │                      │                   │                │
│    │                      │                   │ 4.Aprova       │
│    │                      │ <─────────────────┤                │
│    │                      │ 5.Ativa Premium   │                │
│    │ <──────────────────  │                   │                │
│    │ 6.Recebe Acesso     │                   │                │
│    │                     │                   │                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ FLUXO: TRANSFERÊNCIA BANCÁRIA (IBAN)

### Diagrama Sequencial

```
USUÁRIO
  │
  ├─➊ Solicita Pagamento
  │   └─> Sistema cria Order (PENDING)
  │
  ├─➋ Recebe Detalhes Bancários
  │   ┌──────────────────────────────┐
  │   │ Banco: BIM                   │
  │   │ IBAN: AO06.0001...           │
  │   │ Ref: USER123-PAY456          │
  │   │ Montante: 149 Kz             │
  │   └──────────────────────────────┘
  │
  ├─➌ Realiza Transferência
  │   (App bancário, Caixa ATM, etc)
  │
  ├─➍ Captura Comprovante
  │   └─> Photo/PDF do comprovativo
  │
  └─➎ Envia Comprovante
      └─> Upload na seção de Pagamentos

        ↓ SERVIDOR ↓

SISTEMA
  │
  ├─ Recebe Comprovante
  │  └─> Registra como PENDING
  │
  └─ Aguarda Validação Admin
     └─> Armazena imagem
        └─> Aguarda approval

        ↓ ADMIN ↓

ADMIN
  │
  ├─➎ Vê Novo Pagamento
  │   └─> Badge com "1 Pendente"
  │
  ├─➏ Abre Painel de Pagamentos
  │   ┌──────────────────────────────┐
  │   │ 👤 João Silva                 │
  │   │ 💎 30 Dias                    │
  │   │ 💰 149 Kz                     │
  │   │ 🏦 Transfer. Bancária         │
  │   │ 📅 13/02/2026                 │
  │   │ 🖼️ Ver Comprovativo           │
  │   └──────────────────────────────┘
  │
  ├─➐ Valida Comprovante
  │   ✓ Foto clara?
  │   ✓ Referência correcta?
  │   ✓ Montante correto?
  │   ✓ Banco é BIM?
  │
  └─➑ APROVA ou REJEITA
      │
      ├─ SE APROVAR:
      │   API: POST /api/payments/approve/{id}
      │   └─ Atualiza status para APPROVED
      │      └─ Ativa subscription
      │         └─ Notifica usuário
      │
      └─ SE REJEITAR:
          API: DELETE /api/payments/{id}
          └─ Remove do registro
             └─ Repete processo

        ↓ RESULTADO ↓

USUÁRIO (se aprovado)
  │
  ├─ Recebe Notificação
  │  └─> "✅ Pagamento aprovado!"
  │
  └─ Acesso Premium ATIVADO
     ├─ Eventos premium visíveis
     ├─ Dados completos acessíveis
     ├─ Sem restrições de mercado
     └─ 30 dias completos de acesso

TIMELINE TOTAL: 5 min ~ 24 horas
```

### Status Estados

```
PENDING (Aguardando)
   ↓ (Admin aprova)
APPROVED (Ativo)

ou

PENDING (Aguardando)
   ↓ (Admin rejeita)
REJECTED (Cancelado)
```

---

## 2️⃣ FLUXO: EXPRESS / EMIS.CO.AO

### Integração Automática

```
USUÁRIO
  │
  ├─➊ Seleciona "Express/Emis"
  │
  ├─➋ Sistema abre Express
  │   └─> OAuth/Redirect para Emis.co.ao
  │
  ├─➌ Usuário Autoriza
  │   (Confirma no app/browser Express)
  │
  ├─➍ Express Processa Pagamento
  │   ├─ Valida cartão/conta
  │   ├─ Cobra montante
  │   ├─ Gera reference ID
  │   └─ Envia webhook ao sistema
  │
  └─➎ Express Redireciona
      └─ Volta para App

        ↓ SERVIDOR ↓

SISTEMA (Webhook Handler)
  │
  ├─ POST /api/webhooks/payment
  │  ├─ Recebe dados:
  │  │  ├─ transactionId
  │  │  ├─ status: "approved" | "pending" | "failed"
  │  │  ├─ userId
  │  │  └─ amount
  │  │
  │  └─ Valida assinatura (segurança)
  │
  └─ Se status = "approved":
     ├─ Aprova automaticamente ✅
     ├─ Ativa subscription
     ├─ Armazena reference
     └─ Notifica usuário

        ↓ RESULTADO ↓

USUÁRIO
  │
  ├─ Recebe Confirmação
  │  └─> "✅ Pagamento processado!"
  │
  ├─ Acesso Premium ATIVADO
  │  (Automático, sem papel do admin)
  │
  └─ Eventos desbloqueados

[ADMIN não precisa fazer nada - Automático! ✨]

TIMELINE TOTAL: 10 ~ 30 segundos
```

### Webhook Response

```json
{
  "transactionId": "EXP-USER123-12345",
  "status": "approved",
  "userId": "user123",
  "plan": "30days",
  "amount": 149,
  "timestamp": "2026-02-13T10:15:30Z"
}
```

---

## 3️⃣ FLUXO: STRIPE (Futuro)

### Padrão Similar a Express

```
USUÁRIO
  │
  ├─➊ Seleciona "Stripe"
  │
  ├─➋ Sistema abre Modal Stripe
  │   └─> Secure Stripe element
  │
  ├─➌ Usuário Entra Dados
  │   ├─ Número CartãoMM/YY CVC
  │   └─ Confirma
  │
  └─➍ Stripe Processa
      ├─ Valida dados
      ├─ Autoriza cobrança
      ├─ Retorna token
      └─ Sistema cria pagamento

        ↓ AUTO APROVADO ↓

SISTEMA
  └─ Ativa Premium
     ├─ Imediato
     ├─ Sem aprovação manual
     └─ Notifica usuário

TIMELINE TOTAL: 5 ~ 15 segundos
```

---

## 📱 FLUXO NO APP (Visão Usuário)

### Passo 1: Escolher Método

```
┌────────────────────────────┐
│   Escolher Crédito         │
│                            │
│  ┌──────────────────────┐  │
│  │ 🏦 Transferência    │  │ ← Manual (exigindo comp.)
│  │    Bancária         │  │
│  │ Tempo: ~5min-24h   │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ 🏪 Express/Emis     │  │ ← Automático (~30s)
│  │ Tempo: Instant      │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │ 💳 Stripe (Soon)    │  │ ← Automático (~15s)
│  │ Tempo: Instant      │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### Passo 2: Confirmar

```
Transferência Bancária:
┌────────────────────────────┐
│ Detalhes do Pagamento      │
│                            │
│ Banco: BIM                 │
│ IBAN: AO06...              │
│ Ref: USER123-PAY456        │
│ Montante: 149 Kz           │
│                            │
│ [Copiar] [Compartilhar]    │
│                            │
│ ┌──────────────────────┐  │
│ │     Fiz Transf.     │  │
│ │ (vai para step 3)   │  │
│ └──────────────────────┘  │
└────────────────────────────┘
```

### Passo 3: Comprovante (banco) ou Auto (Express)

```
Banco:
┌────────────────────────────┐
│ Enviar Comprovante         │
│                            │
│ 📸 Tirar Foto              │
│ 📁 Selecionar Arquivo      │
│ 📎 Colar Imagem            │
│                            │
│     [Uploading...50%]      │
│                            │
│ Aguardando aprovação       │
│ do administrador...        │
└────────────────────────────┘

Express/Stripe:
┌────────────────────────────┐
│ ✅ Pagamento Processado    │
│                            │
│ Transaction: EXP-123456    │
│ Status: APROVADO           │
│                            │
│ Acesso Premium ativado!    │
│                            │
│      [Ver Eventos]         │
└────────────────────────────┘
```

---

## ⏱️ CRONOGRAMA DE PROCESSAMENTO

### Comparação dos 3 Métodos

| Método | Tempo | Aprovação | Manual |
|--------|-------|-----------|--------|
| **Banco** | 5min-24h | Admin | ✓ Sim |
| **Express** | ~30s | Auto | ✗ Não |
| **Stripe** | ~15s | Auto | ✗ Não |

### Recomendações

```
Para usuários em PRESSA:
→ Express/Stripe (Automático)

Para usuários COM COMPROVANTE:
→ Transferência Bancária (Validado)

Para NOVO usuário TESTANDO:
→ Qualquer um (Express é mais rápido)
```

---

## 🔐 Segurança por Método

### Transferência Bancária
```
✓ Comprovante visual (prova)
✓ Referência unique (anti-fraude)
✓ Admin valida manualmente
✓ Mais seguro para valores altos
✗ Lento
```

### Express/Stripe
```
✓ PCI DSS compliant
✓ Criptografia end-to-end
✓ Webhook com assinatura
✓ Sistema automático confiável
✗ Menos controle visual
```

---

## 📊 ESTATÍSTICAS ESPERADAS

### Cenário: 1000 usuários/mês

```
Método de Pagamento:
├─ 60% Transferência Bancária  (600 users)
├─ 35% Express/Emis            (350 users)
└─ 5% Stripe                    (50 users)

Tempo de Processamento:
├─ Banco: ~12 horas média
│  (Admin revisa durante dia)
├─ Express: Imediato
│  (< 1 minuto)
└─ Stripe: Imediato
   (< 1 minuto)

Conversão:
├─ Aprovados: 90%+
├─ Rejeitados: 5-10%
└─ Erros/Abandono: < 5%
```

---

## 🎯 E2E Workflow (Complete)

```
INÍCIO
  │
  ├─ USUÁRIO ABRE APP
  │  └─ Vê "Trial expira em 2 dias"
  │
  ├─ USUÁRIO CLICA "Premium"
  │  └─ Abre modal de preços
  │
  ├─ USUÁRIO ESCOLHE PLANO
  │  └─ "30 Dias (149 Kz)"
  │
  ├─ USUÁRIO ESCOLHE MÉTODO
  │  └─ "Express / Banco / Stripe"
  │
  ├─ [IF BANCO]:
  │  ├─ Recebe IBAN
  │  ├─ Faz transferência
  │  └─ Envia comprovante
  │        ↓
  │     PENDENTE +24h
  │        ↓
  │     ADMIN APROVA ✅
  │        ↓
  │
  ├─ [IF EXPRESS/STRIPE]:
  │  ├─ Redireciona para gateway
  │  ├─ Processa automático
  │  └─ Retorna com sucesso ✅
  │
  ├─ SISTEMA ATIVA PREMIUM
  │  ├─ Atualiza subscription
  │  ├─ Desbloqueia eventos
  │  └─ Remove restrições
  │
  ├─ USUÁRIO RECEBE NOTIFICAÇÃO
  │  └─ "Premium ativado!"
  │
  └─ FIM
     └─ 30 dias de acesso completo

TEMPO TOTAL:
├─ Banco: 5min (upload) + ~12h (admin) = ~12h30min
├─ Express: ~30s
└─ Stripe: ~20s
```

---

## 🛠️ Configurações do Sistema

### Para o Admin

```javascript
// AdminPaymentManager.tsx
const PAYMENT_CONFIG = {
  bankTransfer: {
    enabled: true,
    requiresApproval: true,
    timeoutHours: 24,
  },
  express: {
    enabled: true,
    requiresApproval: false,
    webhookTimeout: 30000, // 30s
  },
  stripe: {
    enabled: false, // Future
    requiresApproval: false,
    webhookTimeout: 30000,
  }
};
```

### API Deployment

```
Express Server:
│
├─ /api/payments/create
│  └─ POST (criar pagamento)
│
├─ /api/payments/bank-transfer
│  └─ POST (gerar dados bancários)
│
├─ /api/payments/status/{id}
│  └─ GET (verificar status)
│
├─ /api/payments/approve/{id}
│  └─ POST (admin aprova)
│
└─ /api/webhooks/payment
   └─ POST (processa webhooks)
```

---

## ✅ Checklist de Implementação

- [x] Botão "Pagar" no app
- [x] Modal de seleção de plano
- [x] Método: Transferência Bancária
- [x] Método: Express (estrutura)
- [x] Admin Payment Manager (UI moderna)
- [x] Webhook handler (estrutura)
- [ ] Express API real credentials
- [ ] Stripe integration
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Fraud detection
- [ ] Analytics dashboard

---

**Versão**: 1.0  
**Última Atualização**: Fevereiro 2026  
**Status**: Transferência Bancária + Express (pronto) | Stripe (planejado)

