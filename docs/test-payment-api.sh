#!/bin/bash

# ============================================
# TESTE RÁPIDO - ENDPOINTS DE PAGAMENTO
# ============================================
# Este script contém comandos curl prontos
# para testar os endpoints de pagamento
# 
# Como usar:
# 1. Salve este arquivo como: test-payment-api.sh
# 2. Execute: bash test-payment-api.sh
# 3. Ou use os comandos um por um

API_URL="http://localhost:3000/api"
USER_ID="admin"  # Altere conforme necessário

echo "╔════════════════════════════════════════╗"
echo "║  TESTE DE ENDPOINTS DE PAGAMENTO       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# ============================================
# 1. CRIAR PAGAMENTO
# ============================================
echo "📝 1. Criando novo pagamento..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payments/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"plan\": \"30days\",
    \"amount\": 149
  }")

echo "Resposta:"
echo "$PAYMENT_RESPONSE" | jq '.'
echo ""

# Extrair payment ID para usar depois
PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | jq -r '.payment.id')
echo "Payment ID: $PAYMENT_ID"
echo ""

# ============================================
# 2. CRIAR TRANSFERÊNCIA BANCÁRIA
# ============================================
echo "🏦 2. Criando transferência bancária..."
TRANSFER_RESPONSE=$(curl -s -X POST "$API_URL/payments/bank-transfer" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"plan\": \"7days\",
    \"amount\": 49
  }")

echo "Resposta:"
echo "$TRANSFER_RESPONSE" | jq '.'
echo ""

# Extrair reference ID
REFERENCE_ID=$(echo "$TRANSFER_RESPONSE" | jq -r '.referenceId')
echo "Reference ID: $REFERENCE_ID"
echo ""

# ============================================
# 3. VERIFICAR STATUS DO PAGAMENTO
# ============================================
echo "📊 3. Verificando status do pagamento..."
curl -s -X GET "$API_URL/payments/status/$PAYMENT_ID" | jq '.'
echo ""

# ============================================
# 4. APROVAR PAGAMENTO
# ============================================
echo "✅ 4. Aprovando pagamento..."
curl -s -X POST "$API_URL/payments/approve/$PAYMENT_ID" | jq '.'
echo ""

# ============================================
# 5. VERIFICAR STATUS DEPOIS DE APROVAR
# ============================================
echo "📊 5. Verificando status após aprovação..."
curl -s -X GET "$API_URL/payments/status/$PAYMENT_ID" | jq '.'
echo ""

# ============================================
# 6. LISTAR PAGAMENTOS DO USUÁRIO
# ============================================
echo "📋 6. Listando pagamentos do usuário $USER_ID..."
curl -s -X GET "$API_URL/payments/user/$USER_ID" | jq '.'
echo ""

# ============================================
# 7. ATUALIZAR SUBSCRIÇÃO
# ============================================
echo "🔄 7. Atualizando subscrição do usuário..."

START_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
END_DATE=$(date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%SZ")

curl -s -X PUT "$API_URL/users/$USER_ID/subscription" \
  -H "Content-Type: application/json" \
  -d "{
    \"active\": true,
    \"plan\": \"30days\",
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"paymentProofUri\": \"\",
    \"paymentStatus\": \"approved\"
  }" | jq '.'
echo ""

# ============================================
# 8. REJEITAR PAGAMENTO (se necessário)
# ============================================
echo "❌ 8. Criando novo pagamento para rejeitar..."
REJECT_RESPONSE=$(curl -s -X POST "$API_URL/payments/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"plan\": \"7days\",
    \"amount\": 49
  }")

REJECT_ID=$(echo "$REJECT_RESPONSE" | jq -r '.payment.id')
echo "Payment ID gerado: $REJECT_ID"

echo ""
echo "Rejeitando pagamento..."
curl -s -X POST "$API_URL/payments/reject/$REJECT_ID" \
  -H "Content-Type: application/json" \
  -d "{\"reason\": \"Dados inválidos\"}" | jq '.'
echo ""

# ============================================
# 9. WEBHOOK PARA CONFIRMAR PAGAMENTO
# ============================================
echo "🔗 9. Testando webhook de pagamento..."
curl -s -X POST "$API_URL/webhooks/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"transactionId\": \"$PAYMENT_ID\",
    \"status\": \"approved\",
    \"userId\": \"$USER_ID\",
    \"plan\": \"30days\"
  }" | jq '.'
echo ""

echo "╔════════════════════════════════════════╗"
echo "║     ✅ TESTES COMPLETOS!               ║"
echo "╚════════════════════════════════════════╝"
