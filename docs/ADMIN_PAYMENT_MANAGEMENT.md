
# 💳 GUIA DE GESTÃO DE PAGAMENTOS - PAINEL ADMIN

## 📋 Visão Geral

O novo painel de gestão de pagamentos permite que administradores gerenciem e aprovem pagamentos de forma moderna e eficiente. Interface profissional similar a apps de esportes/apostas com fluxo inteligente.

---

## 🎯 Funcionalidades Principais

### 1. **Dashboard de Pagamentos**
- **Badge de alerta** com número de pagamentos pendentes
- **Estatísticas em tempo real**:
  - Total de pagamentos pendentes
  - Total de pagamentos aprovados
  - Visualização rápida de status

### 2. **Listagem de Pagamentos Pendentes**
Cada pagamento é exibido em um cartão moderno com:

#### Informações do Usuário
- Avatar do usuário (ou ícone padrão)
- Nome completo
- ID do usuário (primeiros 8 caracteres)
- Status visual (com cor e ícone)

#### Detalhes do Pagamento
- **Plano**: 7 Dias ou 30 Dias
- **Valor**: Montante em Kz (Kwanza)
- **Método**: 
  - 🏦 Transferência Bancária
  - 🏪 Express/Emis
  - 💳 Stripe
- **Data**: Data da solicitação de pagamento

#### Comprovativo
- Botão para visualizar comprovativo do pagamento
- Imageamento em modal para melhor visualização

### 3. **Ações do Admin**
Dois botões principais para cada pagamento:

#### ✅ **Aprovar Pagamento**
- Ativa automaticamente o acesso premium para o usuário
- Desbloqueio imediato de todos os eventos premium
- Confirmação de aprovação via alert
- Marca o pagamento como "approved"

#### ❌ **Rejeitar Pagamento**
- Remove o pagamento da fila
- Possibilidade de revisar documentação
- Confirmação antes de rejeitar

---

## 🔄 Fluxo de Pagamento Automático

### Processo Completo

```
1. Usuário solicita pagamento
   ↓
2. Sistema cria registro em PENDING
   ↓
3. Admin vê novo pagamento no dashboard
   ↓
4. Admin verifica comprovativo (se necessário)
   ↓
5. Admin clica "Aprovar"
   ↓
6. Sistema ativa Premium automaticamente
   ↓
7. Usuário recebe acesso total
   ↓
8. Pagamento move para "Aprovados"
```

---

## 🚀 Como Usar

### Acessar o Painel
1. Faça login como **admin** (conta especial)
2. Navegue até a aba **"Pag."** no painel admin
3. Verá lista de pagamentos pendentes

### Aprovar um Pagamento
1. Revise os detalhes do pagamento
2. Clique em "Ver Comprovativo" para validar (se necessário)
3. Se válido, clique em **"✅ Aprovar"**
4. Confirme na caixa de diálogo
5. Premium é ativado **instantaneamente**

### Rejeitar um Pagamento
1. Se houver problemas ou documentação inválida
2. Clique em **"❌ Rejeitar"**
3. Confirme na caixa de diálogo
4. Pagamento é removido da fila

### Atualizar Lista
- **Pull-to-refresh**: Puxe para baixo para recarregar
- **Auto-refresh**: Sistema atualiza automaticamente

---

## 💰 Métodos de Pagamento Suportados

### 1. **Transferência Bancária (IBAN)**
- **Método**: 🏦 Transferência Bancária
- **Status**: Exibe "Pendente" até aprovação
- **Comprovativo**: Foto/PDF do comprovante bancário
- **Validação**: Admin verifica referência bancária

**Detalhes Banco no Sistema:**
```
Banco: BIM (Banco de Investimento de Moçambique)
IBAN: AO06.0001.0000.0000.0000.0000.1  [exemplo]
Referência: {USER_ID}-{PAYMENT_ID}
```

### 2. **Express/Emis.co.ao** ✨
- **Método**: 🏪 Express (Emis)
- **Status**: Pode ser PENDING ou já APPROVED
- **Comprovativo**: Referência da Express
- **Validação**: Webhook automático (em produção)

### 3. **Stripe** (Futuro)
- **Método**: 💳 Stripe
- **Status**: Auto-aprovado via webhook
- **Comprovativo**: Automático do Stripe
- **Validação**: Integração automática

---

## 🎨 Design e UX

### Paleta de Cores
| Elemento | Cor | Uso |
|----------|-----|-----|
| Pendente | 🟡 `pending` | Aguardando ação |
| Aprovado | 🟢 `win` | Sucesso |
| Rejeitado | 🔴 `loss` | Erro/Rejeição |
| Primary | 🔵 `primary` | Ações |

### Componentes Visuais
- **Gradient Cards**: Fundo com gradiente para melhor hierarquia
- **Badge Numerada**: Cada pagamento tem número sequencial
- **Ícones Fluent**: Ionicons para consistência visuais
- **Loading States**: Spinner ao processar aprovação

---

## 📊 Estadísticas e Métricas

### Dashboard Stats
- **Pendentes**: Total de pagamentos aguardando
- **Aprovados**: Total processador com sucesso
- **Taxa de conversão**: (Aprovados / Total)

### Exemplo:
```
[⏱️] 3 Pendentes    [✅] 47 Aprovados
```

---

## 🔐 Segurança e Validação

### Validações Automatizadas
- ✅ Verifica se usuário está autenticado
- ✅ Confirma se é admin antes de permitir acesso
- ✅ Valida montante conforme plano
- ✅ Previne aprovações duplicadas

### Dados Sensíveis
- IBANs e referências são exibidas de forma segura
- Comprovativas são visualizados em modal seguro
- Histórico de aprovações é rastreável

---

## 🚨 Troubleshooting

### Problema: "Acesso negado"
**Solução:** Use conta admin. Verifique se `isAdmin: true` no banco de dados.

### Problema: Pagamento não aparece na lista
**Solução:** 
- Atualize a página (pull-to-refresh)
- Verifique se `paymentStatus` = "pending"
- Reinicie o app

### Problema: Aprovação não funciona
**Solução:**
- Verifique conexão de rede
- Confirme que o usuário existe
- Verifique console para erros (dev tools)

### Problema: Comprovativo não carrega
**Solução:**
- Verifique URL da imagem
- Tente novamente em 1 minuto
- Delete cache e reload

---

## 📈 Casos de Uso

### Cenário 1: Aprovação Rápida
```
1. Admin vê badge "3 Pendentes"
2. Admin entra na aba "Pag."
3. Revisa 3 pagamentos em < 1 minuto
4. Aprova todos
5. Sistema notifica usuários automaticamente
```

### Cenário 2: Validação com Comprovativo
```
1. Usuário faz transferência bancária
2. Envia foto do comprovante
3. Admin vê novo pagamento
4. Clica "Ver Comprovativo"
5. Valida referência e montante
6. Aprova se tudo correto
7. Rejeita se houver discrepância
```

### Cenário 3: Múltiplas Aprovações
```
1. Dashboard mostra "15 Pendentes"
2. Admin aprova em lote (estratégia)
3. Sistema processa cada um
4. ~5 minutos para completar
5. Todos os usuários recebem acesso
```

---

## 🔄 Integração com Sistema

### API Endpoints Utilizados
```
POST /api/payments/approve/{paymentId}
  → Aprova pagamento
  → Ativa subscription
  
GET /api/payments/user/{userId}
  → Lista dados do pagamento
  
PUT /api/users/{userId}/subscription
  → Atualiza status premium
```

### DataContext (React)
```javascript
approveUserSubscription(userId)
  → Função chamada ao aprovar
  → Atualiza contexto global
  → Dispara refresh de dados
```

---

## 📱 Interface Responsiva

### Mobile (Padrão)
- Cards com 100% de largura
- Ações em linha (Rejeitar | Aprovar)
- Scroll infinito

### Tablet (Futuro)
- Cards lado a lado (2 colunas)
- Ações em cima
- Grid layout

---

## 🎯 Próximos Passos

### Fase 1: Atual ✅
- [x] Dashboard com stats
- [x] Listagem de pagamentos
- [x] Aprovação/Rejeição manual
- [x] Visualização de comprovativo

### Fase 2: Próxima 🔜
- [ ] Notificações em tempo real
- [ ] Webhook automático para Express/Stripe
- [ ] Exportar relatórios de pagamentos
- [ ] Filtros por plano/método/data

### Fase 3: Futura 🚀
- [ ] Dashboard com gráficos
- [ ] Machine learning para detecção de fraude
- [ ] Integração com gateway de pagamento
- [ ] API pública para integrações

---

## 💡 Dicas

✨ **Dica 1**: Revise comprovativas regularmente (diariamente recomendado)

✨ **Dica 2**: Mantenha notas sobre pagamentos rejeitados para futuro

✨ **Dica 3**: Use a badge de alerta para priorizar pagamentos

✨ **Dica 4**: Rejeite pagamentos inválidos rapidamente

✨ **Dica 5**: Teste com pagamento trial antes de produção

---

## 📞 Suporte

**Em caso de problemas:**
1. Verifique este guia
2. Consulte logs do servidor
3. Reinicie o app
4. Contacte desenvolvedor

**Logs importantes:**
- `Pagamento aprovado por admin: {userId}`
- `Erro ao autorizar: {error}`

---

**Versão**: 1.0  
**Última Atualização**: Janeiro 2026  
**Status**: ✅ Produção Pronta

