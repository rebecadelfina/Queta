import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { paymentService } from "./src/services/PaymentService";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes with /api prefix

  // ============================================
  // PAYMENT ROUTES
  // ============================================

  /**
   * POST /api/payments/create
   * Cria novo pagamento
   */
  app.post("/api/payments/create", async (req, res) => {
    try {
      const { userId, plan, amount } = req.body;

      if (!userId || !plan || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const reference = `PAY_${userId}_${Date.now()}`;
      const payment = await paymentService.createPayment({
        userId,
        plan,
        amount,
        reference,
      });

      res.json({
        success: true,
        payment,
        message: "Pagamento criado com sucesso",
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Erro ao criar pagamento" });
    }
  });

  /**
   * POST /api/payments/bank-transfer
   * Cria transferência bancária
   */
  app.post("/api/payments/bank-transfer", async (req, res) => {
    try {
      const { userId, plan, amount } = req.body;

      if (!userId || !plan || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await paymentService.createBankTransfer({
        userId,
        plan,
        amount,
        reference: `BT_${userId}_${Date.now()}`,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error creating bank transfer:", error);
      res.status(500).json({ error: "Erro ao criar transferência" });
    }
  });

  /**
   * GET /api/payments/status/:paymentId
   * Verifica status do pagamento
   */
  app.get("/api/payments/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const status = await paymentService.getPaymentStatus(paymentId);

      if (!status) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      res.json({ status, paymentId });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });

  /**
   * POST /api/payments/approve/:paymentId
   * Aprova pagamento (uso interno/admin)
   */
  app.post("/api/payments/approve/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const success = await paymentService.approvePayment(paymentId);

      if (!success) {
        return res.status(400).json({ error: "Erro ao aprovar pagamento" });
      }

      res.json({
        success: true,
        message: "Pagamento aprovado com sucesso",
      });
    } catch (error) {
      console.error("Error approving payment:", error);
      res.status(500).json({ error: "Erro ao aprovar pagamento" });
    }
  });

  /**
   * POST /api/payments/reject/:paymentId
   * Rejeita pagamento
   */
  app.post("/api/payments/reject/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      const success = await paymentService.rejectPayment(paymentId, reason);

      if (!success) {
        return res.status(400).json({ error: "Erro ao rejeitar pagamento" });
      }

      res.json({
        success: true,
        message: "Pagamento rejeitado",
      });
    } catch (error) {
      console.error("Error rejecting payment:", error);
      res.status(500).json({ error: "Erro ao rejeitar pagamento" });
    }
  });

  /**
   * GET /api/payments/user/:userId
   * Lista pagamentos de um usuário
   */
  app.get("/api/payments/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const payments = await paymentService.getUserPayments(userId);

      res.json({
        success: true,
        payments,
      });
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ error: "Erro ao buscar pagamentos" });
    }
  });

  /**
   * PUT /api/users/:userId/subscription
   * Atualiza subscrição do usuário
   */
  app.put("/api/users/:userId/subscription", async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = req.body;

      const success = await storage.updateUserSubscription(userId, subscription);

      if (!success) {
        return res
          .status(400)
          .json({ error: "Erro ao atualizar subscrição" });
      }

      res.json({
        success: true,
        message: "Subscrição atualizada com sucesso",
        subscription,
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ error: "Erro ao atualizar subscrição" });
    }
  });

  // ============================================
  // WEBHOOK PARA PAGAMENTOS EXTERNOS
  // ============================================

  /**
   * POST /api/webhooks/payment
   * Webhook para confirmar pagamentos de sistemas externos
   * (Express, Stripe, etc)
   */
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      const { transactionId, status, userId, plan } = req.body;

      if (!transactionId || !status || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validar webhook (você pode adicionar validação de assinatura aqui)

      if (status === "approved" || status === "success") {
        const success = await paymentService.approvePayment(transactionId);
        if (success) {
          res.json({ success: true, message: "Pagamento processado" });
        } else {
          res.status(400).json({ error: "Erro ao processar pagamento" });
        }
      } else if (status === "failed" || status === "rejected") {
        await paymentService.rejectPayment(transactionId);
        res.json({ success: true, message: "Pagamento rejeitado" });
      } else {
        res.status(400).json({ error: "Status inválido" });
      }
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Erro ao processar webhook" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

