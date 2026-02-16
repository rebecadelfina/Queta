/**
 * TESTE MANUAL - SISTEMA DE PAGAMENTO
 * 
 * Arquivo: TESTE_MANUAL_PAGAMENTO.md
 * Instruções para testar o sistema de pagamento integrado
 */

# 🧪 Teste Manual - Sistema de Pagamento Integrado

## ✅ O que foi implementado

### 1. Backend (Server)
- ✅ `server/src/services/PaymentService.ts` - Serviço de pagamento
- ✅ `server/storage.ts` - Storage de pagamentos
- ✅ `server/routes.ts` - Rotas de API para pagamento

### 2. Frontend (App)
- ✅ `components/PaymentIntegration.ts` - Funções de pagamento
- ✅ `components/PremiumUnlockModal.tsx` - Modal com loading state
- ✅ `app/(tabs)/index.tsx` - Integração completa com onPaymentPress

### 3. Funcionalidades
- ✅ Criar pagamento (Express)
- ✅ Criar transferência bancária
- ✅ Verificar status de pagamento
- ✅ Aprovar/Rejeitar pagamento
- ✅ Ativar subscrição após pagamento
- ✅ Webhook para confirmação

---

## 🚀 Como Testar Localmente

### Pré-requisitos
```bash
# Terminal 1 - Iniciar servidor backend
cd /seu/caminho/Bet-Prognostic-Hub
npm run server

# Terminal 2 - Iniciar app frontend
npm run start
```

### Teste 1: Fluxo Completo de Pagamento

**Cenário:** Usuário faz upgrade após trial expirar

**Passos:**

1. **Simular Trial Expirado**
   - Abra `lib/storage.ts`
   - Procure por: `const daysLeft = Math.max(0, 3 - Math.ceil(diffDays));`
   - Mude para: `const daysLeft = -1;` (para simular expirado rapidamente)
   - Salve e recarregue o app

2. **Abra o App**
   - Você verá o `TrialBanner` em vermelho: "Trial Expirado"

3. **Clique em Evento Premium**
   - Procure por um evento com badge dourado
   - Clique no ícone de lock
   - Modal `PremiumUnlockModal` deve abrir

4. **Escolha um Plano**
   - Clique em "7 DIAS" ou "30 DIAS"
   - O botão deve mostrar spinner de carregamento
   - Alert com detalhes da transferência deve aparecer

5. **Verificar no Backend**
   - Abra o Network tab (F12 em web)
   - Você deve ver:
     - POST /api/payments/create ✓
     - POST /api/payments/bank-transfer ✓
     - PUT /api/users/:id/subscription ✓

---

## 📊 Teste 2: Endpoints da API

### 2.1 Criar Pagamento

```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin",
    "plan": "30days",
    "amount": 149
  }'

# Esperado:
{
  "success": true,
  "payment": {
    "id": "pay_1707858123456_abc123",
    "userId": "admin",
    "plan": "30days",
    "amount": 149,
    "reference": "PAY_admin_1707858123456",
    "status": "pending",
    "method": "express",
    "createdAt": "2026-02-13T10:15:23.456Z"
  }
}
```

### 2.2 Criar Transferência Bancária

```bash
curl -X POST http://localhost:3000/api/payments/bank-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin",
    "plan": "7days",
    "amount": 49
  }'

# Esperado:
{
  "success": true,
  "referenceId": "BT_admin_1707858123456",
  "bankDetails": {
    "bank": "BIM - Banco de Investimento de Moçambique",
    "account": "123456789",
    "iban": "MZ94000300001234567890"
  },
  "amount": 49,
  "plan": "7days"
}
```

### 2.3 Verificar Status

```bash
curl http://localhost:3000/api/payments/status/pay_1707858123456_abc123

# Esperado:
{
  "status": "pending",
  "paymentId": "pay_1707858123456_abc123"
}
```

### 2.4 Aprovar Pagamento

```bash
curl -X POST http://localhost:3000/api/payments/approve/pay_1707858123456_abc123

# Esperado:
{
  "success": true,
  "message": "Pagamento aprovado com sucesso"
}
```

### 2.5 Rejeitar Pagamento

```bash
curl -X POST http://localhost:3000/api/payments/reject/pay_1707858123456_abc123 \
  -H "Content-Type: application/json" \
  -d '{"reason": "Dados inválidos"}'

# Esperado:
{
  "success": true,
  "message": "Pagamento rejeitado"
}
```

### 2.6 Listar Pagamentos do Usuário

```bash
curl http://localhost:3000/api/payments/user/admin

# Esperado:
{
  "success": true,
  "payments": [
    {
      "id": "pay_1707858123456_abc123",
      "userId": "admin",
      "plan": "30days",
      "status": "pending",
      ...
    }
  ]
}
```

### 2.7 Atualizar Subscrição

```bash
curl -X PUT http://localhost:3000/api/users/admin/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "active": true,
    "plan": "30days",
    "startDate": "2026-02-13T10:15:23Z",
    "endDate": "2026-03-14T10:15:23Z",
    "paymentProofUri": "",
    "paymentStatus": "approved"
  }'

# Esperado:
{
  "success": true,
  "message": "Subscrição atualizada com sucesso",
  "subscription": {...}
}
```

---

## 🔄 Teste 3: Fluxo com Login

**Cenário:** Usuário precisa fazer login para pagar

**Passos:**

1. **No Modal Premium, clique "Já tem conta?"**
   - LoginScreen deve abrir
   
2. **Faça login com:**
   - Username: `admin`
   - Password: `admin`
   - Clique "ENTRAR"
   - LoginScreen deve fechar e dados recarregar

3. **Tente pagar novamente**
   - Clique em evento premium
   - Modal abre novamente
   - Clique em plano
   - Pagamento deve processar (pois agora está logado)

---

## ⚠️ Teste 4: Casos de Erro

### 4.1 Usuário não logado ao tentar pagar

```
Esperado: Alert "Você precisa estar logado para pagar"
```

### 4.2 Erro de conexão com servidor

```
Esperado: Alert "Erro ao processar pagamento"
```

### 4.3 Pagamento inválido

```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "admin"}'  # Faltam plan e amount

# Esperado:
{
  "error": "Missing required fields",
  "status": 400
}
```

---

## 💾 Checklisto de Testes

- [ ] App inicia sem errors
- [ ] TrialBanner mostra corretamente
- [ ] Clique em evento premium bloco abre modal
- [ ] Modal mostra 2 planos corretamente
- [ ] Clique em plano mostra loading spinner
- [ ] Alert com detalhes da transferência aparece
- [ ] Backend recebe requisição de pagamento
- [ ] Status mudança após aprovação
- [ ] Subscrição é ativada após pagamento
- [ ] Usuário vê acesso ao evento depois
- [ ] Logout e login funciona
- [ ] Erros são mostrados com mensagens claras

---

## 🔧 Solução de Problemas

### "TypeError: Cannot read property 'processPayment'"

**Solução:** Verifique se `PaymentIntegration.ts` foi importado corretamente:
```typescript
import { processPayment, activateSubscription } from "@/components/PaymentIntegration";
```

### Server não responde na porta 3000

**Solução:**
```bash
# Verifique se servidor está rodando
lsof -i :3000

# Mude a porta em server/index.ts se necessário
```

### API_BASE_URL indefinida

**Solução:** Configure em `.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### Pagamento fica em "pending"

**Solução:** Use o endpoint de aprovação:
```bash
curl -X POST http://localhost:3000/api/payments/approve/{paymentId}
```

---

## 📊 Diagrama de Fluxo

```
┌─────────────────┐
│  Usuário Clica  │
│  Evento Premium │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│ PremiumUnlockModal Abre │
└────────┬────────────────┘
         │
         ├─→ Clique "Já tem conta?" ─→ LoginScreen ─→ Login
         │
         └─→ Clique Plano ─→ onPaymentPress
                            │
                            ↓
                    ┌──────────────────┐
                    │ processPayment() │
                    └────────┬─────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ↓               ↓               ↓
       [Express]      [BankTransfer]   [Stripe]
            │               │               │
            └───────────────┼───────────────┘
                            ↓
                    ┌──────────────────┐
                    │ Alert com Dados  │
                    └────────┬─────────┘
                            │
                            ↓
                    ┌──────────────────┐
                    │ activateSubscription()
                    └────────┬─────────┘
                            │
                            ↓
                    ┌──────────────────┐
                    │ Modal Fecha      │
                    └────────┬─────────┘
                            │
                            ↓
                    ┌──────────────────┐
                    │ Alert Sucesso    │
                    └────────┬─────────┘
                            │
                            ↓
                    ┌──────────────────┐
                    │ Dados Recarregam │
                    │ Acesso Ativado   │
                    └──────────────────┘
```

---

## 🎯 Próximos Passos Reais

Após validar tudo localmente:

1. **Integrar Express/Emis Real**
   - Obter credenciais da Express
   - Implementar webhook real
   - Testar com pagamento real

2. **Adicionar Banco de Dados**
   - Migrar de MemStorage para DB real
   - Persistir pagamentos

3. **Email de Confirmação**
   - Enviar email após pagamento aprovado
   - Lembrete antes de vencer

4. **Analytics**
   - Rastrear conversão
   - Monitorar taxa de sucesso de pagamentos

---

**Desenvolvido em:** 13 de Fevereiro de 2026  
**Versão:** 1.0  
**Status:** Pronto para testes
