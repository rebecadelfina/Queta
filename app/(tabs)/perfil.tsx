import React, { useState } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const {
    subscription, hasAccess, daysLeft, isTrial, isAdmin,
    submitPaymentProof, toggleAdmin,
  } = useData();
  const [selectedPlan, setSelectedPlan] = useState<"7days" | "30days">("7days");

  const pickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await submitPaymentProof(result.assets[0].uri, selectedPlan);
      if (Platform.OS !== "web") {
        Alert.alert("Enviado", "Comprovativo enviado com sucesso! Aguarde a aprovacao do administrador.");
      }
    }
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D1117", "#111B27", "#0D1117"]} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === "web" ? 84 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Perfil</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={hasAccess ? "shield-checkmark" : "lock-closed"}
              size={32}
              color={hasAccess ? Colors.light.primary : Colors.light.loss}
            />
          </View>
          <Text style={styles.statusTitle}>
            {isAdmin ? "Administrador" : hasAccess ? (isTrial ? "Periodo de Teste" : "Premium Ativo") : "Sem Acesso"}
          </Text>
          <Text style={styles.statusSub}>
            {isAdmin
              ? "Acesso total ao sistema"
              : hasAccess
              ? (isTrial ? `${daysLeft} dia(s) restante(s) de teste` : `${daysLeft} dia(s) restante(s)`)
              : "Assine para desbloquear prognosticos premium"}
          </Text>
          {subscription?.paymentStatus === "pending" && (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={14} color={Colors.light.pending} />
              <Text style={styles.pendingText}>Pagamento em analise</Text>
            </View>
          )}
        </View>

        {!isAdmin && (!hasAccess || isTrial) && subscription?.paymentStatus !== "pending" && (
          <>
            <Text style={styles.sectionTitle}>Planos Premium</Text>

            <Pressable
              onPress={() => setSelectedPlan("7days")}
              style={[
                styles.planCard,
                selectedPlan === "7days" && styles.planCardActive,
              ]}
            >
              <View style={styles.planTop}>
                <Ionicons name="diamond" size={20} color={Colors.light.premium} />
                <Text style={styles.planDuration}>7 Dias</Text>
              </View>
              <Text style={styles.planPrice}>2.000 Kz</Text>
              <Text style={styles.planDesc}>Acesso a todos os prognosticos premium por 1 semana</Text>
              {selectedPlan === "7days" && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => setSelectedPlan("30days")}
              style={[
                styles.planCard,
                selectedPlan === "30days" && styles.planCardActive,
              ]}
            >
              <View style={styles.planTop}>
                <Ionicons name="diamond" size={20} color={Colors.light.premium} />
                <Text style={styles.planDuration}>30 Dias</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>MELHOR VALOR</Text>
                </View>
              </View>
              <Text style={styles.planPrice}>5.000 Kz</Text>
              <Text style={styles.planDesc}>Acesso a todos os prognosticos premium por 1 mes</Text>
              {selectedPlan === "30days" && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
                </View>
              )}
            </Pressable>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Como Pagar</Text>
              <View style={styles.paymentStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.paymentStepText}>
                  Faca a transferencia bancaria ou pagamento por Multicaixa Express (EMIS)
                </Text>
              </View>
              <View style={styles.paymentStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.paymentStepText}>
                  Envie o comprovativo clicando no botao abaixo
                </Text>
              </View>
              <View style={styles.paymentStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.paymentStepText}>
                  Aguarde a confirmacao do administrador para desbloquear
                </Text>
              </View>
            </View>

            <Pressable
              onPress={pickProof}
              style={({ pressed }) => [styles.payBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="cloud-upload" size={20} color="#000" />
              <Text style={styles.payBtnText}>Enviar Comprovativo</Text>
            </Pressable>
          </>
        )}

        {subscription?.paymentProofUri && (
          <View style={styles.proofSection}>
            <Text style={styles.sectionTitle}>Comprovativo Enviado</Text>
            <View style={styles.proofCard}>
              <Image
                source={{ uri: subscription.paymentProofUri }}
                style={styles.proofImage}
                contentFit="contain"
              />
              <View style={[
                styles.proofStatus,
                {
                  backgroundColor:
                    subscription.paymentStatus === "approved"
                      ? Colors.light.win + "20"
                      : subscription.paymentStatus === "pending"
                      ? Colors.light.pending + "20"
                      : Colors.light.loss + "20",
                },
              ]}>
                <Ionicons
                  name={
                    subscription.paymentStatus === "approved"
                      ? "checkmark-circle"
                      : subscription.paymentStatus === "pending"
                      ? "time"
                      : "close-circle"
                  }
                  size={14}
                  color={
                    subscription.paymentStatus === "approved"
                      ? Colors.light.win
                      : subscription.paymentStatus === "pending"
                      ? Colors.light.pending
                      : Colors.light.loss
                  }
                />
                <Text style={[
                  styles.proofStatusText,
                  {
                    color:
                      subscription.paymentStatus === "approved"
                        ? Colors.light.win
                        : subscription.paymentStatus === "pending"
                        ? Colors.light.pending
                        : Colors.light.loss,
                  },
                ]}>
                  {subscription.paymentStatus === "approved"
                    ? "Aprovado"
                    : subscription.paymentStatus === "pending"
                    ? "Em Analise"
                    : "Rejeitado"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <Pressable
          onPress={toggleAdmin}
          style={({ pressed }) => [styles.adminToggle, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name={isAdmin ? "person" : "shield"} size={20} color={Colors.light.primary} />
          <Text style={styles.adminToggleText}>
            {isAdmin ? "Modo Usuario" : "Modo Administrador"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
        </Pressable>

        {isAdmin && (
          <Pressable
            onPress={() => router.push("/admin")}
            style={({ pressed }) => [styles.adminToggle, { opacity: pressed ? 0.7 : 1, marginTop: 8 }]}
          >
            <Ionicons name="settings" size={20} color={Colors.light.accent} />
            <Text style={styles.adminToggleText}>Painel de Administracao</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statusSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    backgroundColor: Colors.light.pending + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.pending,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  planCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + "08",
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  planDuration: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  saveBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.premium,
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  selectedIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  paymentInfo: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  paymentTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  paymentStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
  },
  paymentStepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  payBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  proofSection: {
    marginBottom: 16,
  },
  proofCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  proofImage: {
    width: "100%",
    height: 200,
  },
  proofStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  proofStatusText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 20,
  },
  adminToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  adminToggleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
});
