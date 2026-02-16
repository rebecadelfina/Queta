/**
 * INTEGRAÇÃO DE PAGAMENTO - CLIENTE
 * Este arquivo contém as funções para integrar pagamento no app
 * 
 * Localizar em: components/PaymentIntegration.ts
 * Use em: app/(tabs)/index.tsx → onPaymentPress
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export interface PaymentResponse {
  success: boolean;
  payment?: {
    id: string;
    userId: string;
    plan: "7days" | "30days";
    amount: number;
    reference: string;
    status: string;
    createdAt: string;
  };
  error?: string;
  message?: string;
}

export interface BankTransferResponse {
  success?: boolean;
  referenceId: string;
  bankDetails: {
    bank: string;
    account: string;
    iban: string;
  };
  amount: number;
  plan: string;
  error?: string;
}

/**
 * 1. EXPRESS INTEGRATION (Emis.co.ao)
 * Para Angola - recomendado
 */
export async function handlePaymentExpress(
  userId: string,
  plan: "7days" | "30days"
): Promise<{ paymentId: string; redirectUrl?: string }> {
  console.log("💳 Iniciando pagamento com Express...");

  const prices: Record<string, number> = {
    "7days": 49,
    "30days": 149,
  };

  try {
    // 1. Criar pagamento no backend
    const response = await fetch(`${API_BASE_URL}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        plan,
        amount: prices[plan],
      }),
    });

    const data: PaymentResponse = await response.json();

    if (!data.success || !data.payment) {
      throw new Error(data.error || "Erro ao criar pagamento");
    }

    console.log("✅ Pagamento criado:", data.payment.id);

    // 2. Aqui você integraria com Express
    // Exemplo: redirecionaria para página de pagamento da Express
    // const expressUrl = `https://payment.emis.co.ao?reference=${data.payment.reference}&amount=${prices[plan]}`;

    // Para teste local, apenas retornar o ID do pagamento
    return {
      paymentId: data.payment.id,
      // redirectUrl: expressUrl,
    };
  } catch (error) {
    console.error("❌ Erro ao processar pagamento Express:", error);
    throw error;
  }
}

/**
 * 2. BANK TRANSFER INTEGRATION
 * Transferência bancária direta
 */
export async function handleBankTransfer(
  userId: string,
  plan: "7days" | "30days"
): Promise<BankTransferResponse> {
  console.log("🏦 Criando transferência bancária...");

  try {
    const response = await fetch(`${API_BASE_URL}/payments/bank-transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        plan,
        amount: plan === "7days" ? 49 : 149,
      }),
    });

    const data: BankTransferResponse = await response.json();

    if (!data.referenceId) {
      throw new Error(data.error || "Erro ao criar transferência");
    }

    console.log("✅ Transferência criada:", data.referenceId);
    return data;
  } catch (error) {
    console.error("❌ Erro ao processar transferência:", error);
    throw error;
  }
}

/**
 * 3. VERIFICAR STATUS DE PAGAMENTO
 */
export async function checkPaymentStatus(
  paymentId: string
): Promise<"pending" | "approved" | "rejected" | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/payments/status/${paymentId}`
    );
    const data = await response.json();

    if (response.ok && data.status) {
      console.log("📊 Status do pagamento:", data.status);
      return data.status;
    }

    return null;
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    return null;
  }
}

/**
 * 4. ATUALIZAR SUBSCRIÇÃO APÓS PAGAMENTO
 */
export async function activateSubscription(
  userId: string,
  plan: "7days" | "30days"
): Promise<boolean> {
  try {
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (plan === "7days") {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/subscription`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active: true,
        plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentProofUri: "",
        paymentStatus: "approved",
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Subscrição ativada com sucesso!");
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Erro ao ativar subscrição:", error);
    return false;
  }
}

/**
 * 5. LISTAR PAGAMENTOS DO USUÁRIO
 */
export async function getUserPayments(userId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/user/${userId}`);
    const data = await response.json();

    if (data.success) {
      return data.payments;
    }

    return [];
  } catch (error) {
    console.error("❌ Erro ao buscar pagamentos:", error);
    return [];
  }
}

/**
 * FUNÇÃO PRINCIPAL PARA USAR NO MODAL
 * Use esta função em onPaymentPress do PremiumUnlockModal
 */
export async function processPayment(
  userId: string,
  plan: "7days" | "30days",
  method: "express" | "bank_transfer" = "express"
): Promise<{
  success: boolean;
  paymentId?: string;
  bankDetails?: BankTransferResponse["bankDetails"];
  referenceId?: string;
  amount?: number;
  error?: string;
}> {
  try {
    if (method === "bank_transfer") {
      const result = await handleBankTransfer(userId, plan);
      return {
        success: true,
        referenceId: result.referenceId,
        bankDetails: result.bankDetails,
        amount: result.amount,
      };
    } else {
      const result = await handlePaymentExpress(userId, plan);
      return {
        success: true,
        paymentId: result.paymentId,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export default {
  handlePaymentExpress,
  handleBankTransfer,
  checkPaymentStatus,
  activateSubscription,
  getUserPayments,
  processPayment,
};
