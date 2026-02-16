import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning" | "payment";
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  userId?: string;
  relatedPaymentId?: string;
  action?: {
    label: string;
    actionType: "approve_payment" | "view_premium" | "none";
  };
}

const NOTIFICATIONS_KEY = "notifications";
const MAX_NOTIFICATIONS = 50;

export class NotificationService {
  static async addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">): Promise<string> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      read: false,
    };

    try {
      const notifications = await this.getNotifications();
      const updated = [newNotification, ...notifications].slice(0, MAX_NOTIFICATIONS);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      return id;
    } catch (error) {
      console.error("Erro ao adicionar notificação:", error);
      return id;
    }
  }

  static async getNotifications(): Promise<Notification[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Erro ao obter notificações:", error);
      return [];
    }
  }

  static async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter((n) => !n.read).length;
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Erro ao marcar como lido:", error);
    }
  }

  static async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map((n) => ({ ...n, read: true }));
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Erro ao marcar tudo como lido:", error);
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.filter((n) => n.id !== notificationId);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
    }
  }

  static async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
    }
  }

  // Notificações específicas de pagamento
  static async notifyAdminNewPayment(userId: string, displayName: string, plan: string): Promise<string> {
    return this.addNotification({
      type: "payment",
      title: "💳 Novo Pagamento",
      message: `${displayName} enviou comprovante (${plan})`,
      userId: "admin", // Para filtrar no admin
      relatedPaymentId: userId,
      action: {
        label: "Ver",
        actionType: "approve_payment",
      },
    });
  }

  static async notifyUserApproved(userId: string): Promise<string> {
    return this.addNotification({
      type: "success",
      title: "✅ Pagamento Aprovado!",
      message: "Seu acesso premium foi ativado",
      userId,
      action: {
        label: "Ver Eventos",
        actionType: "view_premium",
      },
    });
  }

  static async notifyUserRejected(userId: string, reason?: string): Promise<string> {
    return this.addNotification({
      type: "error",
      title: "❌ Pagamento Rejeitado",
      message: reason || "Seu pagamento foi rejeitado. Tente novamente.",
      userId,
    });
  }

  static async notifyUserPaymentPending(userId: string): Promise<string> {
    return this.addNotification({
      type: "info",
      title: "⏳ Pagamento Pendente",
      message: "Seu pagamento está aguardando aprovação",
      userId,
    });
  }
}
