import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";
import { NotificationService, type Notification } from "@/lib/notifications-service";

interface PaymentData {
  userId: string;
  displayName: string;
  photoUri?: string;
  plan: "7days" | "30days";
  status: "pending" | "approved" | "rejected";
  method: "bank_transfer" | "express" | "stripe";
  amount: number;
  createdAt: string;
  approvedAt?: string;
  paymentProofUri?: string;
  bankDetails?: {
    bank: string;
    account: string;
    reference: string;
  };
}

interface AdminPaymentManagerProps {
  onPaymentApproved?: (userId: string) => void;
}

export function AdminPaymentManager({ onPaymentApproved }: AdminPaymentManagerProps) {
  const { currentUser, allUsers, approveUserSubscription } = useData();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const isAdmin = currentUser?.isAdmin ?? false;

  // Carregar pagamentos pendentes
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const pendingUsers = allUsers
        .filter((u) => u.subscription?.paymentStatus === "pending")
        .map((user) => ({
          userId: user.id,
          displayName: user.displayName,
          photoUri: user.photoUri,
          plan: user.subscription.plan as "7days" | "30days",
          status: "pending" as const,
          method: "bank_transfer" as const,
          amount: user.subscription.plan === "7days" ? 49 : 149,
          createdAt: user.subscription.startDate || new Date().toISOString(),
          paymentProofUri: user.subscription.paymentProofUri,
        }));

      setPayments(pendingUsers);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
    } finally {
      setLoading(false);
    }
  }, [allUsers]);

  useEffect(() => {
    if (isAdmin) {
      loadPayments();
    }
  }, [isAdmin, loadPayments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, [loadPayments]);

  const handleApprovePayment = async (payment: PaymentData) => {
    Alert.alert(
      "Confirmar Aprovação",
      `Aprovar pagamento de ${payment.displayName} (${payment.plan === "7days" ? "7" : "30"} dias)?`,
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Aprovar",
          onPress: async () => {
            try {
              setProcessingId(payment.userId);
              await approveUserSubscription(payment.userId);
              
              // Enviar notificação para o usuário
              await NotificationService.notifyUserApproved(payment.userId);
              
              // Remover da lista
              setPayments((prev) => prev.filter((p) => p.userId !== payment.userId));
              onPaymentApproved?.(payment.userId);

              // Mostrar toast de sucesso
              setNotification({
                id: `success_${Date.now()}`,
                type: "success",
                title: "✅ Pagamento Aprovado",
                message: `${payment.displayName} recebeu acesso premium!`,
                timestamp: new Date().toISOString(),
                read: false,
              });
            } catch (error) {
              console.error("Erro ao aprovar:", error);
              setNotification({
                id: `error_${Date.now()}`,
                type: "error",
                title: "❌ Erro",
                message: "Não foi possível aprovar o pagamento",
                timestamp: new Date().toISOString(),
                read: false,
              });
            } finally {
              setProcessingId(null);
            }
          },
          style: "default",
        },
      ]
    );
  };

  const handleRejectPayment = (payment: PaymentData) => {
    Alert.alert(
      "Rejeitar Pagamento",
      `Deseja rejeitar o pagamento de ${payment.displayName}?`,
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Rejeitar",
          onPress: () => {
            setPayments((prev: PaymentData[]) => prev.filter((p: PaymentData) => p.userId !== payment.userId));
            Alert.alert("✅ Rejeitado", "Pagamento foi rejeitado");
          },
          style: "destructive",
        },
      ]
    );
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "swap-horizontal-outline";
      case "express":
        return "card-outline";
      case "stripe":
        return "wallet-outline";
      default:
        return "cash-outline";
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Transferência Bancária";
      case "express":
        return "Express (Emis)";
      case "stripe":
        return "Stripe";
      default:
        return "Outro";
    }
  };

  const getPlanLabel = (plan: string) => {
    return plan === "7days" ? "7 Dias" : "30 Dias";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return Colors.light.pending;
      case "approved":
        return Colors.light.win;
      case "rejected":
        return Colors.light.loss;
      default:
        return Colors.light.textSecondary;
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acesso negado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com resumo */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="wallet" size={32} color="#2a8f3d" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Gestão de Pagamentos</Text>
            <Text style={styles.headerSubtitle}>
              {payments.length} pendente{payments.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        {payments.length > 0 && (
          <View style={styles.badgeAlert}>
            <Text style={styles.badgeAlertText}>{payments.length}</Text>
          </View>
        )}
      </View>

      {/* Status geral */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={["#ff6b6b40", "#ff6b6b10"]}
          style={styles.statCard}
        >
          <Ionicons name="time-outline" size={24} color="#ff6b6b" />
          <Text style={styles.statValue}>{payments.length}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </LinearGradient>

        <LinearGradient
          colors={["#2a8f3d50", "#2a8f3d10"]}
          style={styles.statCard}
        >
          <Ionicons name="checkmark-circle-outline" size={24} color="#2a8f3d" />
          <Text style={styles.statValue}>
            {allUsers.filter((u) => u.subscription?.paymentStatus === "approved").length}
          </Text>
          <Text style={styles.statLabel}>Aprovados</Text>
        </LinearGradient>
      </View>

      {/* Lista de pagamentos */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2a8f3d" />
            <Text style={styles.loadingText}>Carregando pagamentos...</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#2a8f3d50", "#2a8f3d15"]}
              style={styles.emptyCard}
            >
              <Ionicons name="checkmark-done-circle" size={56} color="#2a8f3d" />
              <Text style={styles.emptyTitle}>Sem Pagamentos Pendentes!</Text>
              <Text style={styles.emptySubtext}>Todos os pagamentos foram processados</Text>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {payments.map((payment, index) => (
              <View key={payment.userId} style={styles.paymentItem}>
                {/* Badge numerada */}
                <View style={styles.paymentNumber}>
                  <Text style={styles.paymentNumberText}>{index + 1}</Text>
                </View>

                {/* Card do pagamento */}
                <LinearGradient
                  colors={["#242a39", "#1a1f2e"]}
                  style={styles.paymentCard}
                >
                  {/* Header do cartão */}
                  <View style={styles.paymentCardHeader}>
                    <View style={styles.userInfo}>
                      {payment.photoUri ? (
                        <Image
                          source={{ uri: payment.photoUri }}
                          style={styles.userAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.userAvatar,
                            { backgroundColor: "#2a8f3d" },
                          ]}
                        >
                          <Ionicons
                            name="person"
                            size={20}
                            color="#fff"
                          />
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{payment.displayName}</Text>
                        <Text style={styles.userBadge}>
                          ID: {payment.userId.substring(0, 8)}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + "20" },
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={getStatusColor(payment.status)}
                      />
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: getStatusColor(payment.status) },
                        ]}
                      >
                        Pendente
                      </Text>
                    </View>
                  </View>

                  {/* Informações do pagamento */}
                  <View style={styles.paymentInfo}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="diamond"
                          size={16}
                          color="#2a8f3d"
                        />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Plano</Text>
                          <Text style={styles.infoValue}>
                            {getPlanLabel(payment.plan)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoItem}>
                        <Ionicons
                          name="cash-outline"
                          size={16}
                          color={Colors.light.accent}
                        />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Valor</Text>
                          <Text style={styles.infoValue}>
                            {payment.plan === "7days" ? "49" : "149"} Kz
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name={getMethodIcon(payment.method) as any}
                          size={16}
                          color={Colors.light.primary}
                        />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Método</Text>
                          <Text style={styles.infoValue}>
                            {getMethodLabel(payment.method)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.infoItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={Colors.light.textSecondary}
                        />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Data</Text>
                          <Text style={styles.infoValue}>
                            {new Date(payment.createdAt).toLocaleDateString("pt-AO")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Comprovativo (se existir) */}
                  {payment.paymentProofUri ? (
                    <Pressable
                      onPress={() => {
                        setSelectedPayment(payment);
                        setProofModalVisible(true);
                      }}
                      style={styles.proofButton}
                    >
                      <LinearGradient
                        colors={["#00FF88", "#00cc6a"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.proofButtonGradient}
                      >
                        <Ionicons
                          name="image-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.proofButtonText}>Ver Comprovativo Enviado</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#fff"
                        />
                      </LinearGradient>
                    </Pressable>
                  ) : (
                    <View style={styles.noProofContainer}>
                      <LinearGradient
                        colors={["#ff6b6b20", "#ff6b6b10"]}
                        style={styles.noProofCard}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, width: "100%" }}>
                          <Ionicons
                            name="alert-circle-outline"
                            size={20}
                            color="#ff6b6b"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.noProofText}>Nenhum comprovativo</Text>
                            <Text style={styles.noProofSubtext}>Aguardando envio do cliente</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {/* Ações */}
                  <View style={styles.actionsContainer}>
                    <Pressable
                      onPress={() => handleRejectPayment(payment)}
                      disabled={processingId === payment.userId}
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.rejectButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Ionicons name="close-circle" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Rejeitar</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleApprovePayment(payment)}
                      disabled={processingId === payment.userId}
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.approveButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      {processingId === payment.userId ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text style={styles.actionButtonText}>Aprovar</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </LinearGradient>
              </View>
            ))}
            <View style={styles.spacer} />
          </View>
        )}
      </ScrollView>

      {/* Modal de comprovativo */}
      <Modal
        visible={proofModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setProofModalVisible(false)}
      >
        <View style={styles.proofModalBackdrop}>
          <View style={styles.proofModalContainer}>
            <Pressable
              onPress={() => setProofModalVisible(false)}
              style={styles.proofModalClose}
            >
              <Ionicons name="close" size={28} color="white" />
            </Pressable>
            {selectedPayment?.paymentProofUri && (
              <Image
                source={{ uri: selectedPayment.paymentProofUri }}
                style={styles.proofImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.proofInfo}>
              <Text style={styles.proofTitle}>
                {selectedPayment?.displayName}
              </Text>
              <Text style={styles.proofSubtitle}>
                {getPlanLabel(selectedPayment?.plan || "7days")} •{" "}
                {getMethodLabel(selectedPayment?.method || "bank_transfer")}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1419",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#1a1f2e",
    borderBottomWidth: 2,
    borderBottomColor: "#2a8f3d",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#a0a9c9",
  },
  badgeAlert: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeAlertText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#a0a9c9",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#a0a9c9",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#a0a9c9",
  },
  paymentsList: {
    gap: 12,
  },
  paymentItem: {
    position: "relative",
  },
  paymentNumber: {
    position: "absolute",
    top: 0,
    left: -8,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a8f3d",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0f1419",
  },
  paymentNumberText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  paymentCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#2a3543",
    backgroundColor: "#1a1f2e",
  },
  paymentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a3543",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  userBadge: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#a0a9c9",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  paymentInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#7a8399",
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#2a3543",
  },
  proofButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  proofButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  proofButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  noProofContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  noProofCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ff6b6b40",
  },
  noProofText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#ff6b6b",
  },
  noProofSubtext: {
    fontSize: 11,
    color: "#ff6b6b80",
    fontFamily: "Inter_400Regular",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    overflow: "hidden",
  },
  rejectButton: {
    backgroundColor: "#ff6b6b",
  },
  approveButton: {
    backgroundColor: "#2a8f3d",
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  spacer: {
    height: 16,
  },
  proofModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  proofModalContainer: {
    width: "85%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1f2e",
    borderWidth: 1.5,
    borderColor: "#2a3543",
  },
  proofModalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  proofImage: {
    width: "100%",
    height: 400,
  },
  proofInfo: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
    backgroundColor: "#0f1419",
  },
  proofTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  proofSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#a0a9c9",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: 20,
  },
});
