import { logger } from "../utils/logger";
import { storage } from "../../storage";

export interface PaymentRequest {
  userId: string;
  plan: "7days" | "30days";
  amount: number;
  reference: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  plan: "7days" | "30days";
  amount: number;
  reference: string;
  status: "pending" | "approved" | "rejected";
  method: "express" | "bank_transfer" | "manual";
  createdAt: string;
  approvedAt?: string;
}

/**
 * Serviço de Pagamento
 * Gerencia pagamentos e subscrições
 */
class PaymentService {
  /**
   * Cria novo registro de pagamento pendente
   */
  async createPayment(request: PaymentRequest): Promise<PaymentRecord> {
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.userId,
      plan: request.plan,
      amount: request.amount,
      reference: request.reference,
      status: "pending",
      method: "express",
      createdAt: new Date().toISOString(),
    };

    // Salvar em arquivo local (você pode integrar com DB)
    await this.savePayment(payment);
    logger.info("Payment created", { paymentId: payment.id, userId: request.userId });

    return payment;
  }

  /**
   * Cria transferência bancária para rastreamento
   */
  async createBankTransfer(request: PaymentRequest): Promise<{
    referenceId: string;
    bankDetails: {
      bank: string;
      account: string;
      iban: string;
    };
    amount: number;
    plan: string;
  }> {
    const referenceId = `BT_${request.userId}_${Date.now()}`;
    
    const bankDetails = {
      bank: "BIM - Banco de Investimento de Moçambique",
      account: "123456789",
      iban: "MZ94000300001234567890",
    };

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: request.userId,
      plan: request.plan,
      amount: request.amount,
      reference: referenceId,
      status: "pending",
      method: "bank_transfer",
      createdAt: new Date().toISOString(),
    };

    await this.savePayment(payment);
    logger.info("Bank transfer created", { referenceId, userId: request.userId });

    return {
      referenceId,
      bankDetails,
      amount: request.amount,
      plan: request.plan,
    };
  }

  /**
   * Aprova um pagamento e ativa subscrição
   */
  async approvePayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        logger.error("Payment not found", { paymentId });
        return false;
      }

      // Calcular data de vencimento
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (payment.plan === "7days") {
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate.setDate(endDate.getDate() + 30);
      }

      // Atualizar subscrição do usuário
      const success = await storage.updateUserSubscription(payment.userId, {
        active: true,
        plan: payment.plan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentProofUri: "",
        paymentStatus: "approved",
      });

      if (success) {
        // Marcar pagamento como aprovado
        payment.status = "approved";
        payment.approvedAt = new Date().toISOString();
        await this.savePayment(payment);

        logger.info("Payment approved", {
          paymentId,
          userId: payment.userId,
          plan: payment.plan,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error approving payment", { paymentId, error });
      return false;
    }
  }

  /**
   * Rejeita um pagamento
   */
  async rejectPayment(paymentId: string, reason?: string): Promise<boolean> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        logger.error("Payment not found", { paymentId });
        return false;
      }

      payment.status = "rejected";
      await this.savePayment(payment);

      logger.info("Payment rejected", { paymentId, reason });
      return true;
    } catch (error) {
      logger.error("Error rejecting payment", { paymentId, error });
      return false;
    }
  }

  /**
   * Obtém status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<"pending" | "approved" | "rejected" | null> {
    const payment = await this.getPayment(paymentId);
    return payment?.status || null;
  }

  /**
   * Lista pagamentos de um usuário
   */
  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    try {
      const payments = await storage.getUserPayments(userId);
      return payments || [];
    } catch (error) {
      logger.error("Error fetching user payments", { userId, error });
      return [];
    }
  }

  /**
   * Obter um pagamento
   */
  private async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const payments = await storage.getAllPayments();
      return payments.find((p: PaymentRecord) => p.id === paymentId) || null;
    } catch (error) {
      logger.error("Error fetching payment", { paymentId, error });
      return null;
    }
  }

  /**
   * Salvar pagamento em storage
   */
  private async savePayment(payment: PaymentRecord): Promise<void> {
    try {
      const payments = await storage.getAllPayments();
      const index = payments.findIndex((p: PaymentRecord) => p.id === payment.id);
      if (index >= 0) {
        payments[index] = payment;
      } else {
        payments.push(payment);
      }
      await storage.savePayments(payments);
    } catch (error) {
      logger.error("Error saving payment", { error });
    }
  }
}

export const paymentService = new PaymentService();
