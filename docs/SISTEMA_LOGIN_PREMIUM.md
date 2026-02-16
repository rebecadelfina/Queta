# 🎯 Sistema de Login & Premium - Bet Prognostic Hub

## 📋 Resumo das Funcionalidades

### ✨ Componentes Criados

#### 1. **LoginScreen.tsx**
Tela de login moderna e intuitiva com:
- Toggle entre Login e Registro
- Design moderno com gradientes
- Validação de campos
- Indicadores de carregamento
- Ícones intuitivos
- Exibição de benefícios premium

**Localização:** `components/LoginScreen.tsx`

#### 2. **PremiumUnlockModal.tsx**
Modal elegante para desbloqueio de eventos premium com:
- Apresentação visual dos benefícios
- Dois planos de assinatura:
  - **7 Dias:** 49 MT/semana
  - **30 Dias:** 149 MT/mês (melhor oferta)
- Opção de login para usuários existentes
- Design de gradiente roxo/dourado
- Informações de segurança SSL

**Localização:** `components/PremiumUnlockModal.tsx`

#### 3. **TrialBanner.tsx**
Banner flutuante que exibe status do trial com:
- Contador de dias restantes
- Cores diferenciadas (ativo vs expirado)
- Botão rápido para upgrade
- Design minimalista e informativo

**Localização:** `components/TrialBanner.tsx`

---

## 🔄 Fluxo de Uso

### Fases do Usuário

```
1️⃣ INSTALAÇÃO INICIAL
   └─ Usuário instala o app
   └─ Trial de 3 dias inicia automaticamente
   └─ Sistema rastreia data via localStorage

2️⃣ DURANTE O TRIAL (Dias 1-3)
   ├─ TrialBanner mostra dias restantes
   ├─ Todos os eventos são desbloqueados
   ├─ Eventos premium são visíveis
   └─ Usuário pode explorar conteúdo completo

3️⃣ DIA DO VENCIMENTO
   ├─ TrialBanner muda para "Último dia de teste grátis!"
   └─ Cor muda para aviso (roxo/dourado)

4️⃣ APÓS EXPIRAÇÃO
   ├─ Eventos premium ficam bloqueados
   ├─ TrialBanner mostra "Trial Expirado"
   ├─ Cor muda para alerta (vermelho)
   ├─ Clique em evento premium abre PremiumUnlockModal
   └─ Usuário pode:
      ├─ Login → acesso imediato
      ├─ Registro → acesso após confirmação
      └─ Pagamento → ativa assinatura
```

---

## 🎨 Integração na Página Principal

### Modificações em `app/(tabs)/index.tsx`

1. **Imports adicionados:**
   ```typescript
   import { LoginScreen } from "@/components/LoginScreen";
   import { PremiumUnlockModal } from "@/components/PremiumUnlockModal";
   import { TrialBanner } from "@/components/TrialBanner";
   ```

2. **States criados:**
   ```typescript
   const [showPremiumModal, setShowPremiumModal] = useState(false);
   const [showLoginScreen, setShowLoginScreen] = useState(false);
   ```

3. **Handler para eventos premium:**
   ```typescript
   const handlePremiumLockPress = () => {
     if (trialExpired && !hasAccess && !isAdmin) {
       setShowPremiumModal(true);
     }
   };
   ```

4. **Atualização dos cards:**
   - Eventos premium agora mostram lock após trial expirar
   - Clique no lock abre o modal de desbloqueio

---

## 💾 Rastreamento de Trial

O sistema utiliza o `AsyncStorage` para persistir:

```typescript
// Armazenamento automático
- KEYS.APP_INSTALL_DATE : Data da primeira instalação
- Cálculo automático: 3 dias a partir dessa data

// Funções de verificação
- isTrialExpired() : Verifica se 3 dias passaram
- getDaysLeftInTrial() : Retorna dias restantes (0-3)
- registerInstallationDate() : Registra na primeira vez
```

**Localização:** `lib/storage.ts` (linhas 290-325)

---

## 🔐 Segurança & Acesso

### Hierarquia de Acesso

```
1. ADMIN
   └─ Nunca vê banner de trial
   └─ Todos os eventos são acessíveis
   └─ Acesso total ao sistema

2. USUÁRIO COM ASSINATURA ATIVA
   └─ Trial não se aplica
   └─ Todos os eventos premium desbloqueados
   └─ Acesso indefinido

3. USUÁRIO DURANTE TRIAL
   └─ Trial de 3 dias
   └─ Todos os eventos visíveis
   └─ Sem limite

4. USUÁRIO APÓS TRIAL (sem assinatura)
   └─ Eventos premium bloqueados
   └─ Precisa fazer login/pagar para acessar
```

---

## 💳 Integração de Pagamento

O modal de premium possui dois pontos de integração:

### 1. **onLoginPress**
```typescript
onLoginPress={() => {
  setShowPremiumModal(false);
  setShowLoginScreen(true);
}}
```
→ Abre tela de login para usuários existentes

### 2. **onPaymentPress(plan)**
```typescript
onPaymentPress={(plan) => {
  // plan: "7days" | "30days"
  // TODO: Integrar com seu sistema de pagamento
}}
```
→ Inicia processo de pagamento

### Próximas Etapas (TODO):

```typescript
// Em PremiumUnlockModal.tsx, linha ~155
onPaymentPress={(plan) => {
  // Implementar:
  // 1. Validar plano
  // 2. Criar sessão de pagamento
  // 3. Redirecionar para interface de pagamento
  // 4. Atualizar subscription do usuário
  // 5. Recarregar dados
}}
```

---

## 🎯 Customização

### Cores do Sistema
Definidas em `constants/colors.ts`:
- **Primary:** Azul (eventos normais)
- **Premium:** Dourado (eventos premium)
- **Win/Loss:** Verde/Vermelho (resultados)

### Duração do Trial
Para alterar de 3 dias, editar em `lib/storage.ts`:
```typescript
// Linha 308
return diffDays > 3; // Mudar este número
```

### Textos e Mensagens
Todos os textos podem ser alterados nos componentes:
- LoginScreen.tsx
- PremiumUnlockModal.tsx
- TrialBanner.tsx

---

## ✅ Checklist de Implementação

- [x] Tela de Login moderna e responsiva
- [x] Modal de Premium com planos
- [x] Banner de Trial com contador
- [x] Bloqueio de eventos premium pós-trial
- [x] Rastreamento automático de 3 dias
- [x] Integração na página principal
- [ ] Sistema de pagamento (TODO)
- [ ] Persistência de pagamento em banco de dados
- [ ] Email de confirmação
- [ ] Suporte a múltiplas moedas

---

## 🚀 Próximos Passos

1. **Integrar Sistema de Pagamento**
   - Express (emis.co.ao)
   - Transferência Bancária
   - Qualquer outra solução

2. **Adicionar Tela de Perfil de Pagamento**
   - Histórico de assinaturas
   - Opções de cancelamento
   - Renovação automática

3. **Email de Confirmação**
   - Após pagamento aprovado
   - Antes do vencimento da assinatura

4. **Analytics**
   - Rastrear conversões
   - Taxa de upgrade
   - Métodos de pagamento mais usados

---

## 📞 Suporte

Em caso de dúvidas sobre a implementação, consulte:
- `components/LoginScreen.tsx` - Lógica de autenticação
- `components/PremiumUnlockModal.tsx` - Fluxo de upgrade
- `lib/data-context.tsx` - Gerenciamento de estado
- `lib/storage.ts` - Persistência de dados

---

**Desenvolvido em:** 13 de Fevereiro de 2026  
**Versão:** 1.0
