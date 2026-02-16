import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView, RefreshControl,
  Pressable, Platform, ActivityIndicator, Image, Modal, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";
import { getTodayStr } from "@/lib/storage";
import { getTeamLogo } from "@/lib/team-logos";
import { LoginScreen } from "@/components/LoginScreen";
import { PremiumUnlockModal } from "@/components/PremiumUnlockModal";
import { TrialBanner } from "@/components/TrialBanner";
import { processPayment, activateSubscription } from "@/components/PaymentIntegration";
import { NotificationService, type Notification } from "@/lib/notifications-service";
import { NotificationToast } from "@/components/NotificationToast";
import { NotificationCenter } from "@/components/NotificationCenter";

function TeamBadge({ teamName, size = "small" }: { teamName: string; size?: "small" | "large" }) {
  const [state, setState] = useState<{ logoUrl: string | null; initials: string; color: string } | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    getTeamLogo(teamName).then((result) => {
      setState(result);
    });
  }, [teamName]);

  if (!state) {
    return (
      <View style={size === "large" ? styles.teamLogoPlaceholderLarge : styles.teamLogoPlaceholder}>
        <Ionicons name="shield" size={size === "large" ? 24 : 16} color={Colors.light.textSecondary} />
      </View>
    );
  }

  // If we have a logo URL and no error, try to display it
  if (state.logoUrl && !imageError) {
    return (
      <Image
        source={{ uri: state.logoUrl }}
        style={size === "large" ? styles.teamLogoLarge : styles.teamLogo}
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  // Fallback: show initials in a colored circle
  return (
    <View style={[size === "large" ? styles.teamInitialsBadgeLarge : styles.teamInitialsBadge, { backgroundColor: state.color }]}>
      <Text style={size === "large" ? styles.teamInitialsLarge : styles.teamInitials}>{state.initials}</Text>
    </View>
  );
}

function PredictionCard({ prediction, locked, blurMarket, onLockPressed }: { prediction: any; locked: boolean; blurMarket?: boolean; onLockPressed?: () => void }) {
  const resultColor = prediction.result === "win"
    ? Colors.light.win
    : prediction.result === "loss"
    ? Colors.light.loss
    : Colors.light.pending;

  const resultIcon = prediction.result === "win"
    ? "checkmark-circle"
    : prediction.result === "loss"
    ? "close-circle"
    : "time";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.leagueBadge}>
          <Ionicons name="trophy" size={12} color={Colors.light.primary} />
          <Text style={styles.leagueText}>{prediction.league}</Text>
        </View>
        {prediction.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={10} color={Colors.light.premium} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>

      {locked && prediction.isPremium ? (
        <Pressable onPress={onLockPressed} style={styles.lockedContent}>
          <Ionicons name="lock-closed" size={32} color={Colors.light.textSecondary} />
          <Text style={styles.lockedText}>Desbloqueie para ver</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.matchRow}>
            <View style={styles.teamContainer}>
              <TeamBadge teamName={prediction.homeTeam} size="large" />
              <Text style={styles.teamName} numberOfLines={1}>{prediction.homeTeam}</Text>
            </View>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.light.accent} />
              <Text style={styles.matchTime}>{prediction.matchTime}</Text>
            </View>
            <View style={styles.teamContainer}>
              <Text style={styles.teamName} numberOfLines={1}>{prediction.awayTeam}</Text>
              <TeamBadge teamName={prediction.awayTeam} size="large" />
            </View>
          </View>

          <View style={styles.marketRow}>
            <View style={[styles.marketBadge, blurMarket && styles.marketBadgeBlurred]}>
              <Text style={[styles.marketText, blurMarket && styles.marketTextBlurred]}>{prediction.market}</Text>
            </View>
            <View style={styles.oddContainer}>
              <Text style={styles.oddLabel}>Odd</Text>
              <Text style={styles.oddValue}>{prediction.odd.toFixed(2)}</Text>
            </View>
            <View style={[styles.resultBadge, { backgroundColor: resultColor + "20" }]}>
              <Ionicons name={resultIcon as any} size={14} color={resultColor} />
              <Text style={[styles.resultText, { color: resultColor }]}>
                {prediction.result === "win" ? "Ganho" : prediction.result === "loss" ? "Perda" : "Pendente"}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, predictions, hasAccess, daysLeft, isTrial, loading, refreshAll, trialExpired, login, register } = useData();
  const [refreshing, setRefreshing] = useState(false);
  
  // New modal states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [notificationCenterVisible, setNotificationCenterVisible] = useState(false);
  
  const today = getTodayStr();
  const todayPredictions = predictions.filter((p) => p.date === today);
  const isAdmin = currentUser?.isAdmin ?? false;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  // Handle premium event click
  const handlePremiumLockPress = () => {
    if (trialExpired && !hasAccess && !isAdmin) {
      setShowPremiumModal(true);
    }
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NotificationToast 
        notification={notification} 
        onDismiss={() => setNotification(null)} 
      />
      
      <LinearGradient
        colors={["#0D1117", "#111B27", "#0D1117"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === "web" ? 84 : 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.modernHeader}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.appName}>QUETABET</Text>
              <Text style={styles.headerSubtitle}>Prognósticos Premium</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable 
                onPress={() => setNotificationCenterVisible(true)}
                style={({ pressed }) => [styles.notificationButton, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="notifications-outline" size={24} color={Colors.light.primary} />
              </Pressable>
              
              {isTrial && (
                <LinearGradient
                  colors={[Colors.light.premium + "30", Colors.light.premium + "10"]}
                  style={styles.modernTrialBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="hourglass-outline" size={14} color={Colors.light.premium} />
                  <Text style={styles.modernTrialText}>{trialExpired ? "Expirado" : `${daysLeft}d`}</Text>
                </LinearGradient>
              )}
            </View>
          </View>
        </View>

        {/* Trial Banner - Show if trial active or expired */}
        {isTrial && (
          <TrialBanner
            daysLeft={daysLeft}
            trialExpired={trialExpired}
            onUpgradePress={() => setShowPremiumModal(true)}
          />
        )}

        {/* Modern Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardModern}>
            <LinearGradient
              colors={[Colors.light.primary + "15", Colors.light.primary + "05"]}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statIconBox}>
                <Ionicons name="football" size={20} color={Colors.light.primary} />
              </View>
              <Text style={styles.statValueModern}>{todayPredictions.length}</Text>
              <Text style={styles.statLabelModern}>Jogos</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCardModern}>
            <LinearGradient
              colors={[Colors.light.win + "15", Colors.light.win + "05"]}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statIconBox}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.light.win} />
              </View>
              <Text style={[styles.statValueModern, { color: Colors.light.win }]}>
                {todayPredictions.filter((p) => p.result === "win").length}
              </Text>
              <Text style={styles.statLabelModern}>Ganhos</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCardModern}>
            <LinearGradient
              colors={[Colors.light.loss + "15", Colors.light.loss + "05"]}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statIconBox}>
                <Ionicons name="close-circle" size={20} color={Colors.light.loss} />
              </View>
              <Text style={[styles.statValueModern, { color: Colors.light.loss }]}>
                {todayPredictions.filter((p) => p.result === "loss").length}
              </Text>
              <Text style={styles.statLabelModern}>Perdas</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Predictions Section */}
        <View style={styles.predictionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prognósticos de Hoje</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{todayPredictions.length}</Text>
            </View>
          </View>

          {todayPredictions.length === 0 ? (
            <View style={styles.modernEmptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="football-outline" size={48} color={Colors.light.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum jogo hoje</Text>
              <Text style={styles.emptySubtext}>Volte mais tarde para novos prognósticos</Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {todayPredictions.map((p) => {
                const isLocked = (trialExpired && !hasAccess && p.isPremium) && !isAdmin;
                return (
                  <PredictionCard 
                    key={p.id} 
                    prediction={p} 
                    locked={isLocked}
                    blurMarket={!isLocked ? false : true}
                    onLockPressed={handlePremiumLockPress} 
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Premium Unlock Modal */}
      <PremiumUnlockModal
        visible={showPremiumModal}
        daysLeft={daysLeft}
        trialExpired={trialExpired}
        onClose={() => setShowPremiumModal(false)}
        onLoginPress={() => {
          setShowPremiumModal(false);
          setShowLoginScreen(true);
        }}
        onPaymentPress={async (plan) => {
          if (!currentUser) {
            alert("Você precisa estar logado para pagar");
            return;
          }

          setIsProcessingPayment(true);

          try {
            // Notificar admin sobre novo pagamento
            const planLabel = plan === "7days" ? "7 Dias" : "30 Dias";
            await NotificationService.notifyAdminNewPayment(
              currentUser.id,
              currentUser.displayName,
              planLabel
            );

            // Notificar usuário que pagamento foi enviado
            setNotification({
              id: `payment_sent_${Date.now()}`,
              type: "info",
              title: "⏳ Pagamento Enviado",
              message: "Seu pagamento foi enviado. Aguarde aprovação do admin.",
              timestamp: new Date().toISOString(),
              read: false,
            });

            // Iniciar pagamento
            const result = await processPayment(currentUser.id, plan, "bank_transfer");

            if (result.success) {
              if (result.bankDetails) {
                // Transferência bancária
                alert(
                  `📋 Detalhes da Transferência\n\n` +
                  `Banco: ${result.bankDetails.bank}\n` +
                  `Referência: ${result.referenceId}\n` +
                  `Valor: ${result.amount} MT\n\n` +
                  `Faça a transferência e em até 1 hora seu acesso será ativado automatically.`
                );
              } else if (result.paymentId) {
                // Express payment
                alert("Redirecionando para página de pagamento...");
                // TODO: Redirecionar para Express quando integrado
              }

              // Ativar subscrição (simulado)
              await activateSubscription(currentUser.id, plan);

              // Recarregar dados
              await refreshAll();

              // Fechar modal
              setShowPremiumModal(false);

              alert("✅ Acesso Premium ativado com sucesso!");
            } else {
              alert(`❌ ${result.error || "Erro ao processar pagamento"}`);
            }
          } catch (error) {
            console.error("Payment error:", error);
            setNotification({
              id: `payment_error_${Date.now()}`,
              type: "error",
              title: "❌ Erro",
              message: "Erro ao processar pagamento. Tente novamente.",
              timestamp: new Date().toISOString(),
              read: false,
            });
          } finally {
            setIsProcessingPayment(false);
          }
        }}
      />

      {/* Login Screen Modal */}
      {showLoginScreen && (
        <Modal
          visible={showLoginScreen}
          animationType="slide"
          onRequestClose={() => setShowLoginScreen(false)}
        >
          <LoginScreen
            onDismiss={() => {
              setShowLoginScreen(false);
              refreshAll();
            }}
          />
        </Modal>
      )}

      {/* Notification Center Modal */}
      <NotificationCenter
        visible={notificationCenterVisible}
        onClose={() => setNotificationCenterVisible(false)}
        userId={currentUser?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  // Modern Header
  modernHeader: {
    marginBottom: 24,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationButton: {
    padding: 8,
  },
  modernTrialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modernTrialText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.premium,
  },

  // Expired Banner
  expiredBanner: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.light.loss + "30",
  },
  expiredContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expiredIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.light.loss + "15",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  expiredText: {
    flex: 1,
  },
  expiredTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.loss,
    marginBottom: 2,
  },
  expiredSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },

  // Modern Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statCardModern: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    height: 110,
  },
  statGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.primary + "20",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.light.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  statValueModern: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statLabelModern: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },

  // Predictions Section
  predictionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  sectionBadge: {
    backgroundColor: Colors.light.primary + "15",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: "center",
  },
  sectionBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  cardsContainer: {
    gap: 12,
  },

  // Modern Empty State
  modernEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },

  // Card Styles
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leagueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leagueText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.light.premium + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.light.premium,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  teamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    flexShrink: 1,
  },
  timeContainer: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 3,
  },
  matchTime: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.light.accent,
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  marketBadge: {
    backgroundColor: Colors.light.accent + "15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 1,
  },
  marketText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  marketBadgeBlurred: {
    backgroundColor: Colors.light.accent + "08",
    opacity: 0.45,
  },
  marketTextBlurred: {
    color: Colors.light.textSecondary,
    opacity: 0.5,
  },
  oddContainer: { alignItems: "center", gap: 2 },
  oddLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  oddValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  lockedContent: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 10,
  },
  lockedText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },

  // Team Logos
  teamLogo: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  teamLogoLarge: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  teamLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  teamLogoPlaceholderLarge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  teamInitialsBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  teamInitialsBadgeLarge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  teamInitials: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  teamInitialsLarge: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  // Old styles (kept for compatibility if needed)
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.light.text },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  trialBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.light.premium + "20" },
  trialText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.premium },
  adminBtn: { padding: 4 },
  lockedBanner: { backgroundColor: Colors.light.premium + "15", borderRadius: 12, padding: 16 },
  lockedBannerText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.premium },
  lockedBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.light.card, borderRadius: 12, padding: 14 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  emptySubtext: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
});
