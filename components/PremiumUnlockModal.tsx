import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { PaymentProofSubmit } from "./PaymentProofSubmit";

const { height, width } = Dimensions.get("window");

interface PremiumUnlockModalProps {
  visible: boolean;
  daysLeft?: number;
  trialExpired?: boolean;
  onClose: () => void;
  onLoginPress: () => void;
  onPaymentPress: (plan: "7days" | "30days") => Promise<void> | void;
}

export function PremiumUnlockModal({
  visible,
  daysLeft = 0,
  trialExpired = false,
  onClose,
  onLoginPress,
  onPaymentPress,
}: PremiumUnlockModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"7days" | "30days" | null>(null);

  const handlePaymentPress = async (plan: "7days" | "30days") => {
    setSelectedPlan(plan);
  };

  const handleProofSubmit = async (referenceId: string, proofUri?: string) => {
    setIsLoading(true);
    try {
      await onPaymentPress(selectedPlan!);
      setSelectedPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        useNativeDriver: true,
        duration: 300,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {selectedPlan ? (
        <PaymentProofSubmit
          plan={selectedPlan}
          amount={selectedPlan === "7days" ? 49 : 149}
          onClose={() => setSelectedPlan(null)}
          onSubmit={handleProofSubmit}
          isSubmitting={isLoading}
        />
      ) : (
        <>
          <View style={styles.backdrop}>
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
          <LinearGradient
            colors={["#1a0033", "#2d004d"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Close Button */}
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.6)" />
            </Pressable>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.diamondIcon}>
                  <LinearGradient
                    colors={["#ffd700", "#ffed4e"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.diamondBg}
                  >
                    <Ionicons name="diamond" size={44} color="white" />
                  </LinearGradient>
                </View>

                {trialExpired ? (
                  <>
                    <Text style={styles.title}>Trial Expirado</Text>
                    <Text style={styles.subtitle}>
                      Seu período de 3 dias grátis terminou
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>Conteúdo Premium</Text>
                    <Text style={styles.subtitle}>
                      {daysLeft > 0
                        ? `${daysLeft} dia${daysLeft > 1 ? "s" : ""} de teste grátis restantes`
                        : "Acesso exclusivo a previsões Premium"}
                    </Text>
                  </>
                )}
              </View>

              {/* Benefits */}
              <View style={styles.benefitsSection}>
                <Text style={styles.sectionTitle}>O que você ganha</Text>
                
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="star" size={20} color="#ffd700" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Previsões Premium</Text>
                    <Text style={styles.benefitDesc}>
                      Acesso a todas as análises exclusivas
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="checkmark-done-circle" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Taxa de Acerto 95%+</Text>
                    <Text style={styles.benefitDesc}>
                      Estatísticas verificadas e transparentes
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="notifications" size={20} color="#FF6B9D" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Notificações em Tempo Real</Text>
                    <Text style={styles.benefitDesc}>
                      Receba alertas imediatos de novas previsões
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="headset" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Suporte Premium 24/7</Text>
                    <Text style={styles.benefitDesc}>
                      Atendimento prioritário em português
                    </Text>
                  </View>
                </View>
              </View>

              {/* Pricing Plans */}
              <View style={styles.pricingSection}>
                <Text style={styles.sectionTitle}>Planos de Assinatura</Text>

                {/* 7 Days Plan */}
                <Pressable
                  style={({ pressed }) => [
                    styles.planCard,
                    styles.planCardStandard,
                    pressed && styles.planCardPressed,
                    isLoading && styles.planCardDisabled,
                  ]}
                  onPress={() => handlePaymentPress("7days")}
                  disabled={isLoading}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>7 Dias</Text>
                    <Text style={styles.planPrice}>
                      49 MT<Text style={styles.planPeriod}>/semana</Text>
                    </Text>
                  </View>
                  <View style={styles.planFeatures}>
                    <Text style={styles.planFeature}>✓ Acesso completo</Text>
                    <Text style={styles.planFeature}>✓ Premium total</Text>
                  </View>
                  <View style={styles.planButton}>
                    {isLoading ? (
                      <ActivityIndicator color="#1a0033" size="small" />
                    ) : (
                      <Text style={styles.planButtonText}>ATIVAR AGORA</Text>
                    )}
                  </View>
                </Pressable>

                {/* 30 Days Plan - Highlighted */}
                <Pressable
                  style={({ pressed }) => [
                    styles.planCard,
                    styles.planCardBest,
                    pressed && styles.planCardPressed,
                    isLoading && styles.planCardDisabled,
                  ]}
                  onPress={() => handlePaymentPress("30days")}
                  disabled={isLoading}
                >
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>MELHOR OFERTA</Text>
                  </View>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>30 Dias</Text>
                    <Text style={styles.planPrice}>
                      149 MT<Text style={styles.planPeriod}>/mês</Text>
                    </Text>
                  </View>
                  <View style={styles.planFeatures}>
                    <Text style={styles.planFeature}>✓ Acesso completo</Text>
                    <Text style={styles.planFeature}>✓ Premium total</Text>
                    <Text style={styles.planFeature}>✓ Economia de 25%</Text>
                  </View>
                  <View style={styles.planButton}>
                    <LinearGradient
                      colors={["#ff6b6b", "#ff8e72"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.planButtonGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.planButtonTextBest}>ATIVAR AGORA</Text>
                      )}
                    </LinearGradient>
                  </View>
                </Pressable>

                {/* Login Option */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && styles.loginButtonPressed,
                  ]}
                  onPress={onLoginPress}
                >
                  <Ionicons name="person-circle" size={20} color={Colors.light.primary} />
                  <Text style={styles.loginButtonText}>
                    Já tem conta? Faça login
                  </Text>
                </Pressable>
              </View>

              {/* Security Info */}
              <View style={styles.securityInfo}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.securityText}>
                  Pagamento seguro com criptografia SSL
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
          </View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: height * 0.95,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    padding: 0,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  diamondIcon: {
    marginBottom: 20,
  },
  diamondBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  benefitsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 18,
  },
  pricingSection: {
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  planCardStandard: {
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  planCardBest: {
    borderColor: "#ff6b6b",
    borderWidth: 2,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  planCardPressed: {
    opacity: 0.8,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  bestBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 16,
  },
  bestBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffd700",
  },
  planPeriod: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
  },
  planFeatures: {
    marginBottom: 16,
    gap: 8,
  },
  planFeature: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  planButton: {
    borderRadius: 10,
    overflow: "hidden",
  },
  planButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  planButtonText: {
    color: "#1a0033",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingVertical: 12,
    textAlign: "center",
  },
  planButtonTextBest: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  loginButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  securityText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
});
