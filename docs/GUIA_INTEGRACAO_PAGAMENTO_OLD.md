// GUIA DE INTEGRAÇÃO DE PAGAMENTO
// Arquivo: app/(tabs)/index.tsx - Próximo à linha 700

import { PremiumUnlockModal } from "@/components/PremiumUnlockModal";

// ============================================
// EXEMPLO 1: Integração com Express (emis.co.ao)
// ============================================

const handlePaymentExpress = async (plan: "7days" | "30days") => {
  try {
    // 1. Definir valores e detalhes
    const prices: Record<string, { amount: number; description: string }> = {
      "7days": {
        amount: 49,
        description: "Acesso 7 Dias - Bet Prognostic Hub",
      },
      "30days": {
        amount: 149,
        description: "Acesso 30 Dias - Bet Prognostic Hub",
      },
    };

    const paymentData = prices[plan];

    // 2. Criar requisição para seu backend
    // (seu backend faria a integração com Express/Emis)
    const response = await fetch("/api/payment/express", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser?.id,
        plan: plan,
        amount: paymentData.amount,
        description: paymentData.description,
      }),
    });

    const data = await response.json();

    if (data.paymentUrl) {
      // 3. Redirecionar para página de pagamento
      // Para web:
      // window.location.href = data.paymentUrl;

      // Para React Native:
      // import * as WebBrowser from 'expo-web-browser';
      // await WebBrowser.openBrowserAsync(data.paymentUrl);
    }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    alert("Erro ao iniciar pagamento. Tente novamente.");
  }
};

// ============================================
// EXEMPLO 2: Integração com Transferência Bancária
// ============================================

const handlePaymentBankTransfer = async (plan: "7days" | "30days") => {
  try {
    const prices: Record<string, number> = {
      "7days": 49,
      "30days": 149,
    };

    // 1. Gerar referência única de pagamento
    const referenceId = `${currentUser?.id}-${Date.now()}`;

    // 2. Enviar para backend para registrar pagamento pendente
    const response = await fetch("/api/payment/bank-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser?.id,
        plan: plan,
        amount: prices[plan],
        referenceId: referenceId,
        status: "pending", // Aguardando confirmação
      }),
    });

    const data = await response.json();

    if (data.success) {
      // 3. Mostrar dados bancários para o usuário
      alert(
        `Dados Bancários:\n` +
          `Banco: BIM\n` +
          `Referência: ${referenceId}\n` +
          `Valor: ${prices[plan]} MT\n\n` +
          `Faça a transferência e seu acesso será ativado em até 1 hora.`
      );

      // 4. Fechar modal
      setShowPremiumModal(false);
    }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    alert("Erro ao gerar referência. Tente novamente.");
  }
};

// ============================================
// EXEMPLO 3: Integração com Stripe
// ============================================

const handlePaymentStripe = async (plan: "7days" | "30days") => {
  try {
    // Assumindo que você tem Stripe instalado:
    // npm install @stripe/stripe-react-native

    const prices: Record<string, string> = {
      "7days": "price_7days_stripe_key",
      "30days": "price_30days_stripe_key",
    };

    // 1. Iniciar sessão de checkout
    const response = await fetch("/api/payment/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser?.id,
        priceId: prices[plan],
        plan: plan,
      }),
    });

    const { clientSecret, paymentIntentId } = await response.json();

    // 2. Usar Stripe SDK para confirmar pagamento
    // const result = await initPaymentSheet({
    //   clientSecret,
    //   merchantDisplayName: 'Bet Prognostic Hub',
    // });

    // if (result.error) {
    //   alert('Erro ao processar pagamento');
    //   return;
    // }

    // const paymentResult = await presentPaymentSheet();
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
  }
};

// ============================================
// EXEMPLO 4: Callback para atualizar subscrição
// ============================================

const updateUserSubscription = async (
  plan: "7days" | "30days",
  paymentStatus: "pending" | "approved" | "rejected"
) => {
  try {
    // 1. Calcular datas
    const now = new Date();
    const expiryDays = plan === "7days" ? 7 : 30;
    const endDate = new Date(
      now.getTime() + expiryDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // 2. Atualizar no backend
    const response = await fetch(
      `/api/users/${currentUser?.id}/subscription`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: paymentStatus === "approved",
          plan: plan === "7days" ? "7days" : "30days",
          startDate: now.toISOString(),
          endDate: endDate,
          paymentStatus: paymentStatus,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      // 3. Recarregar dados do usuário
      await refreshAll();

      // 4. Fechar modais
      setShowPremiumModal(false);
      setShowLoginScreen(false);

      // 5. Mostrar mensagem de sucesso
      alert("Pagamento confirmado! Seu acesso premium foi ativado.");
    }
  } catch (error) {
    console.error("Erro ao atualizar subscrição:", error);
  }
};

// ============================================
// INTEGRAÇÃO NA PÁGINA PRINCIPAL
// ============================================

// Substituir a função onPaymentPress no componente PremiumUnlockModal:

<PremiumUnlockModal
  visible={showPremiumModal}
  daysLeft={daysLeft}
  trialExpired={trialExpired}
  onClose={() => setShowPremiumModal(false)}
  onLoginPress={() => {
    setShowPremiumModal(false);
    setShowLoginScreen(true);
  }}
  onPaymentPress={(plan) => {
    // ESCOLHA UMA DAS OPÇÕES ACIMA:

    // Opção 1: Express (recomendado para Angola)
    handlePaymentExpress(plan);

    // Opção 2: Transferência Bancária
    // handlePaymentBankTransfer(plan);

    // Opção 3: Stripe
    // handlePaymentStripe(plan);
  }}
/>;

// ============================================
// ESTRUTURA DO BACKEND NECESSÁRIA
// ============================================

/*
Você precisará criar estes endpoints no seu servidor:

POST /api/payment/express
  Body: { userId, plan, amount, description }
  Response: { paymentUrl, transactionId }

POST /api/payment/bank-transfer
  Body: { userId, plan, amount, referenceId, status }
  Response: { success, referenceId }

POST /api/payment/stripe
  Body: { userId, priceId, plan }
  Response: { clientSecret, paymentIntentId }

PUT /api/users/:userId/subscription
  Body: { active, plan, startDate, endDate, paymentStatus }
  Response: { success, subscription }

POST /api/webhooks/payment (para processar callbacks)
  Body: { transactionId, status, userId, plan }
  Response: { success }
*/

// ============================================
// WEBHOOK PARA PROCESSAR PAGAMENTOS
// ============================================

/*
Em seu servidor, implemente um webhook que receba
confirmações de pagamento:

// Exemplo com Express.js
app.post('/api/webhooks/payment', async (req, res) => {
  const { transactionId, status, userId, plan } = req.body;

  try {
    // 1. Validar assinatura do webhook
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Verificar se pagamento já foi processado
    const existingPayment = await db.payments.findOne({ transactionId });
    if (existingPayment) {
      return res.status(200).json({ success: true });
    }

    // 3. Salvar pagamento
    await db.payments.create({
      userId,
      transactionId,
      plan,
      status,
      createdAt: new Date(),
    });

    // 4. Se aprovado, ativar subscrição
    if (status === 'approved') {
      const expiryDays = plan === '7days' ? 7 : 30;
      const endDate = new Date(
        Date.now() + expiryDays * 24 * 60 * 60 * 1000
      );

      await db.users.updateOne(
        { id: userId },
        {
          subscription: {
            active: true,
            plan,
            startDate: new Date(),
            endDate,
            paymentStatus: 'approved',
          },
        }
      );

      // 5. Enviar email de confirmação
      await emailService.sendPaymentConfirmation(userId, plan);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
*/

export {
  handlePaymentExpress,
  handlePaymentBankTransfer,
  handlePaymentStripe,
  updateUserSubscription,
};
