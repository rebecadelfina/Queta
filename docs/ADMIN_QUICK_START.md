
# 🚨 NOTIFICAÇÕES DE PAGAMENTO - QUICK START

## ⚡ Quick Start (5 minutos)

### 1️⃣ Como Acessar a Área de Pagamentos

```
App → Menu Admin → Aba "Pag." (com badge de número pendente)
```

**Indicadores de Pagamento Pendente:**
- 🔴 Badge vermelho com número na aba
- ⏱️ Card mostrando "Pendente"
- 👤 Nome e ID do usuário

---

### 2️⃣ Etapas para Aprovar um Pagamento

#### Passo 1: Revisar Informações

Você verá:
```
┌─────────────────────────────┐
│ 👤 João Silva               │
│ ID: admin1234               │
│                             │
│ 💎 Plano: 30 Dias           │
│ 💰 Valor: 149 Kz            │
│ 🏦 Método: Transferência    │
│ 📅 Data: 13/02/2026         │
└─────────────────────────────┘
```

#### Passo 2: Ver Comprovativo (se disponível)

- Clique em "🖼️ Ver Comprovativo"
- Visualize a imagem ampliada
- Valide referência bancária ou código de transação

#### Passo 3: Aprovar Pagamento

- Clique em **"✅ Aprovar"** (botão verde)
- Confirme na caixa de diálogo
- Aguarde processamento (loading spinner)

```
A aprovação é INSTANTÂNEA:
✅ Premium ativado
✅ Eventos desbloqueados
✅ Acesso total habilitado
```

---

### 3️⃣ Rejeitar Pagamento

Se há problema com o comprovativo:

1. Clique em **"❌ Rejeitar"** (botão vermelho)
2. Confirme rejeição
3. Pagamento é removido

---

### 4️⃣ Dashboard Stats

```
┌─────────────────────────┐
│ 💼 Gestão de Pagamentos │
│                         │
│ ⏱️  3 PENDENTES         │
│ ✅ 47 APROVADOS        │
│                         │
│ Taxa: ~94% ✨          │
└─────────────────────────┘
```

**O que significa:**
- **Pendentes**: Aguardando sua ação
- **Aprovados**: Já processados com sucesso
- **Taxa**: Percentual de aprovação vs total

---

## 🎯 Padrões de Pagamento

### ✅ Pagamento VÁLIDO

```
Transferência Bancária:
✓ Foto clara do comprovante
✓ Referência = {USER_ID}-{PAYMENT_ID}
✓ Montante correto (149 Kz ou 49 Kz)
✓ Banco: BIM
✓ Data recente

Ação: APROVAR ✅
```

### ❌ Pagamento INVÁLIDO

```
❌ Foto borrada/ilegível
❌ Referência não corresponde
❌ Montante diferente
❌ Banco diferente
❌ Data de semanas atrás
❌ Dados incompletos

Ação: REJEITAR ❌
```

---

## 🔔 Tipos de Notificações/Eventos

### 1. Badge de Alerta
```
┌──┐
│3 │  ← Número de pendentes
└──┘     Vermelho = AÇÃO REQUERIDA
```

### 2. Status Visual
```
⏱️ PENDENTE   = Cinza → Aguardando
✅ APROVADO   = Verde → Sucesso  
❌ REJEITADO  = Vermelho → Negado
```

### 3. Confirmações
```
Alert 1: "Deseja aprovar João Silva (30 dias)?"
         [Cancelar] [Aprovar]

Alert 2: "✅ Sucesso! Acesso premium ativado!"
```

---

## 💳 Métodos de Pagamento

### Tipo 1: Transferência Bancária 🏦
```
Detalhes do Banco:
Banco: BIM
IBAN: AO06.0001.0000.0000.0000.0000.1
Ref: ADMIN-USER123-PAY456

O que fazer:
1. Verificar se referência está no comprovante
2. Validar montante
3. Aprovar se OK
```

### Tipo 2: Express/Emis 🏪
```
Integração: Emis.co.ao
Status: Pode vir PRÉ-APROVADO

O que fazer:
1. Validar ID transação
2. Confirmar montante
3. Aprovar
```

### Tipo 3: Stripe 💳
```
Integração: Stripe Payment
Status: Automático (webhook)

O que fazer:
Geralmente já vem aprovado do Stripe
Apenas confirmar no sistema
```

---

## ⚙️ Configurações Rápidas

### Mudar a Frequência de Verificação
No código (developer only):
```javascript
// AdminPaymentManager.tsx
const REFRESH_INTERVAL = 60000; // 60 segundos
```

### Notificações Push (Futuro)
```javascript
// Será implementado em breve
notify({
  title: "Novo Pagamento!",
  body: "João Silva enviou comprovante",
  sound: true,
});
```

---

## 📊 Métricas de Desempenho

### Ideal
```
⏱️ Tempo médio de aprovação: < 5 minutos
📈 Taxa de aprovação: > 90%
⚙️ Pagamentos/dia: 10-50
✅ Tempo até ativo: < 1 minuto
```

### Como Verificar
1. Revise timestamp do pagamento
2. Revise timestamp da aprovação
3. Calcule diferença

---

## 🚨 Alertas Importantes

### 🔴 CUIDADO!
- Não aprove pagamentos com documentação inválida
- Verifique sempre a referência bancária
- Confirme montante antes de aprovar
- An once aprovado, é IMPOSSÍVEL desfazer

### 🟡 ATENÇÃO
- Pagamentos vêm para você, revise regularmente
- Usuários aguardam resposta
- Priorize pagamentos antigos
- Comunique rejeições ao usuário

---

## ✅ Checklist Diário

- [ ] Verificar badge de pagamentos pendentes
- [ ] Revisar cada comprovante
- [ ] Aprovar pagamentos válidos
- [ ] Rejeitar pagamentos inválidos
- [ ] Verificar stats (aprovados/pendentes)
- [ ] Confirmar que usuários recebem acesso

---

## 🎯 Cenários Comuns

### Cenário A: Novo Usuário Pagou
```
1. Vê "1 Pendente" no badge
2. Abre aba "Pag."
3. Revisa comprovante
4. Clica Aprovar
5. Sucesso! ✅
```

### Cenário B: Rejeitar por Erro
```
1. Vê comprovante com montante errado
2. Clica Rejeitar
3. Confirma rejeição
4. Pagamento removido
5. Usuário pode reenviar
```

### Cenário C: Múltiplos Pendentes
```
1. Vê "15 Pendentes" 
2. Abre aba "Pag."
3. Revisa todos na sequência (1-15)
4. Aprova válidos
5. Rejeita inválidos
6. ~30 minutos no total
```

---

## 🔗 Referências Rápidas

**Documentação Completa:**
→ `ADMIN_PAYMENT_MANAGEMENT.md`

**Guia de Testes:**
→ `TESTE_MANUAL_PAGAMENTO.md`

**Próximos Passos:**
→ `PROXIMOS_PASSOS_COMPLETO.md`

---

## 📞 Suporte Rápido

| Problema | Solução |
|----------|---------|
| Badge não mostra | Reload app (Pull-to-refresh) |
| Aprovação travou | Aguarde até 30s, depois tente novamente |
| Comprovativo cortado | Zoom in (pinch to zoom) ou salve imagem |
| Pagamento vôo | Verifique se `paymentStatus` = "pending" |
| Acesso não ativou | Refresh de dados (pull-to-refresh) |

---

**🎉 Você está pronto para gerenciar pagamentos!**

**Dúvidas? Revise `ADMIN_PAYMENT_MANAGEMENT.md` para guia completo.**
