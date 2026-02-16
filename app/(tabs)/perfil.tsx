import React, { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, Alert, TextInput, Modal,
  Animated, Dimensions,
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
    currentUser, hasAccess, daysLeft, isTrial, trialExpired, trialDaysLeft,
    submitPaymentProof, updateProfile, changePassword, logout,
  } = useData();
  const [selectedPlan, setSelectedPlan] = useState<"7days" | "30days">("7days");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(currentUser?.displayName || "");
  const [nameError, setNameError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  
  // Feedback modals
  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  // Update subscription countdown every minute
  useEffect(() => {
    const updateTime = () => {
      if (currentUser?.subscription?.expiresAt) {
        const now = new Date().getTime();
        const expiresAt = new Date(currentUser.subscription.expiresAt).getTime();
        const diff = expiresAt - now;

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h`);
          } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m`);
          } else {
            setTimeLeft(`${minutes}m restante(s)`);
          }
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentUser?.subscription?.expiresAt]);
  const showFeedback = (type: "success" | "error" | "info", title: string, message: string) => {
    setFeedbackModal({ visible: true, type, title, message });
    // Auto-close after 2.5 seconds
    if (type === "success") {
      const timer = setTimeout(() => {
        setFeedbackModal(prev => ({ ...prev, visible: false }));
      }, 2500);
      return () => clearTimeout(timer);
    }
  };

  const isAdmin = currentUser.isAdmin;
  const subscription = currentUser.subscription;

  const pickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await submitPaymentProof(result.assets[0].uri, selectedPlan);
      showFeedback("success", "Enviado", "Comprovativo enviado! Aguarde a aprovação.");
    }
  };

  const pickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ photoUri: result.assets[0].uri });
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (!oldPassword || !newPassword) {
      setPwError("Preencha todos os campos");
      return;
    }
    if (newPassword.length < 4) {
      setPwError("A nova palavra-passe deve ter pelo menos 4 caracteres");
      return;
    }
    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      showFeedback("success", "Sucesso", "Palavra-passe alterada com sucesso!");
    } else {
      setPwError("Palavra-passe atual incorreta");
    }
  };

  const handleUpdateDisplayName = async () => {
    setNameError("");
    if (!newDisplayName.trim()) {
      setNameError("O nome não pode estar vazio");
      return;
    }
    if (newDisplayName.trim().length < 2) {
      setNameError("O nome deve ter pelo menos 2 caracteres");
      return;
    }
    try {
      await updateProfile({ displayName: newDisplayName.trim() });
      setShowNameModal(false);
      showFeedback("success", "Sucesso", "Nome atualizado com sucesso!");
    } catch (error) {
      setNameError("Erro ao atualizar o nome");
      showFeedback("error", "Erro", "Não foi possível atualizar o nome");
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      // Redirect to home after logout
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
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

        <View style={styles.profileSection}>
          <Pressable onPress={pickProfilePhoto} style={styles.avatarContainer}>
            {currentUser.photoUri ? (
              <Image source={{ uri: currentUser.photoUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.light.textSecondary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.displayName}>{currentUser.displayName}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={hasAccess ? "shield-checkmark" : "lock-closed"}
              size={32}
              color={hasAccess ? Colors.light.primary : Colors.light.loss}
            />
          </View>
          <Text style={styles.statusTitle}>
            {isAdmin ? "Administrador" : hasAccess ? (isTrial ? "Período de Teste" : "Premium Ativo") : "Sem Acesso"}
          </Text>
          <Text style={styles.statusSub}>
            {isAdmin
              ? "Acesso total ao sistema"
              : hasAccess
              ? (isTrial ? `${daysLeft} dia(s) restante(s) de teste` : `${daysLeft} dia(s) restante(s)`)
              : "Assine para desbloquear prognósticos premium"}
          </Text>
          
          {/* Subscription countdown */}
          {hasAccess && timeLeft && (
            <View style={styles.countdownContainer}>
              <LinearGradient
                colors={[Colors.light.primary + "20", Colors.light.primary + "05"]}
                style={styles.countdownBox}
              >
                <Ionicons name="hourglass" size={16} color={Colors.light.primary} />
                <Text style={styles.countdownText}>Expira em: {timeLeft}</Text>
              </LinearGradient>
            </View>
          )}

          {subscription?.paymentStatus === "pending" && (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={14} color={Colors.light.pending} />
              <Text style={styles.pendingText}>Pagamento em análise</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => setShowNameModal(true)}
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="person" size={20} color={Colors.light.accent} />
            <Text style={styles.actionBtnText}>Alterar Nome</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setShowPasswordModal(true)}
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="key" size={20} color={Colors.light.accent} />
            <Text style={styles.actionBtnText}>Alterar Palavra-Passe</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
        {!isAdmin && (!hasAccess || isTrial) && subscription?.paymentStatus !== "pending" && (
          <>
            {/* Trial Status Banner */}
            {!trialExpired && (
              <View style={[styles.trialBanner, { borderColor: Colors.light.primary + "40" }]}>
                <View style={[styles.trialBannerIcon, { backgroundColor: Colors.light.primary + "20" }]}>
                  <Ionicons name="hourglass-outline" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.trialBannerContent}>
                  <Text style={styles.trialBannerTitle}>Teste Gratuito</Text>
                  <Text style={styles.trialBannerDays}>
                    {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"} restante(s)
                  </Text>
                  <Text style={styles.trialBannerText}>
                    Após expirar, desbloqueie com um plano premium abaixo
                  </Text>
                </View>
              </View>
            )}

            {trialExpired && (
              <View style={[styles.trialBanner, { borderColor: Colors.light.loss + "40", backgroundColor: Colors.light.loss + "08" }]}>
                <View style={[styles.trialBannerIcon, { backgroundColor: Colors.light.loss + "20" }]}>
                  <Ionicons name="lock-closed" size={24} color={Colors.light.loss} />
                </View>
                <View style={styles.trialBannerContent}>
                  <Text style={[styles.trialBannerTitle, { color: Colors.light.loss }]}>Teste Expirado</Text>
                  <Text style={[styles.trialBannerText, { color: Colors.light.textSecondary }]}>
                    Adquira um plano premium para continuar acessando prognosticos
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Planos Premium</Text>

            <Pressable
              onPress={() => setSelectedPlan("7days")}
              style={[styles.planCard, selectedPlan === "7days" && styles.planCardActive]}
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
              style={[styles.planCard, selectedPlan === "30days" && styles.planCardActive]}
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
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <Text style={styles.paymentStepText}>Faca transferencia bancaria ou Multicaixa Express (EMIS)</Text>
              </View>
              <View style={styles.paymentStep}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <Text style={styles.paymentStepText}>Envie o comprovativo clicando no botao abaixo</Text>
              </View>
              <View style={styles.paymentStep}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.paymentStepText}>Aguarde a confirmacao do administrador</Text>
              </View>
            </View>

            <Text style={styles.paymentMethodsTitle}>Opções de Pagamento</Text>
            <View style={styles.paymentMethodsContainer}>
              <View style={styles.paymentMethod}>
                <View style={[styles.paymentMethodIcon, { backgroundColor: Colors.light.primary + "20" }]}>
                  <Ionicons name="swap-horizontal" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodTitle}>Transferência Bancária</Text>
                  <Text style={styles.paymentMethodDesc}>Envie diretamente para nossa conta bancária</Text>
                  <Text style={styles.paymentMethodContact}>📱 Para detalhes, contacte o admin</Text>
                </View>
              </View>

              <View style={styles.paymentMethod}>
                <View style={[styles.paymentMethodIcon, { backgroundColor: Colors.light.accent + "20" }]}>
                  <Ionicons name="card" size={24} color={Colors.light.accent} />
                </View>
                <View style={styles.paymentMethodContent}>
                  <Text style={styles.paymentMethodTitle}>Multicaixa Express (EMIS)</Text>
                  <Text style={styles.paymentMethodDesc}>Pagamento via EMIS.CO.AO</Text>
                  <Text style={styles.paymentMethodContact}>💳 Código: será fornecido pelo admin</Text>
                </View>
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
                    subscription.paymentStatus === "approved" ? "checkmark-circle"
                      : subscription.paymentStatus === "pending" ? "time" : "close-circle"
                  }
                  size={14}
                  color={
                    subscription.paymentStatus === "approved" ? Colors.light.win
                      : subscription.paymentStatus === "pending" ? Colors.light.pending : Colors.light.loss
                  }
                />
                <Text style={[
                  styles.proofStatusText,
                  {
                    color: subscription.paymentStatus === "approved" ? Colors.light.win
                      : subscription.paymentStatus === "pending" ? Colors.light.pending : Colors.light.loss,
                  },
                ]}>
                  {subscription.paymentStatus === "approved" ? "Aprovado"
                    : subscription.paymentStatus === "pending" ? "Em Analise" : "Rejeitado"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {isAdmin && (
          <Pressable
            onPress={() => router.push("/admin")}
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="settings" size={20} color={Colors.light.accent} />
            <Text style={styles.actionBtnText}>Painel de Administracao</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
          </Pressable>
        )}

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="log-out" size={20} color={Colors.light.loss} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar Nome</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Novo nome"
              placeholderTextColor={Colors.light.textSecondary}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              maxLength={50}
            />
            {!!nameError && (
              <Text style={styles.modalError}>{nameError}</Text>
            )}
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => { setShowNameModal(false); setNewDisplayName(currentUser?.displayName || ""); setNameError(""); }}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleUpdateDisplayName} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alterar Palavra-Passe</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Palavra-passe atual"
              placeholderTextColor={Colors.light.textSecondary}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nova palavra-passe"
              placeholderTextColor={Colors.light.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            {!!pwError && (
              <Text style={styles.modalError}>{pwError}</Text>
            )}
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => { setShowPasswordModal(false); setOldPassword(""); setNewPassword(""); setPwError(""); }}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleChangePassword} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.logoutOverlay}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconContainer}>
              <LinearGradient
                colors={[Colors.light.loss + "20", Colors.light.loss + "10"]}
                style={styles.logoutIconGradient}
              >
                <Ionicons name="log-out" size={32} color={Colors.light.loss} />
              </LinearGradient>
            </View>
            
            <Text style={styles.logoutModalTitle}>Sair da Conta?</Text>
            <Text style={styles.logoutModalSubtitle}>
              Tem certeza de que deseja sair? Você precisará fazer login novamente para acessar sua conta.
            </Text>

            <View style={styles.logoutModalBtns}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={({ pressed }) => [
                  styles.logoutModalCancel,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={styles.logoutModalCancelText}>Cancelar</Text>
              </Pressable>
              
              <Pressable
                onPress={confirmLogout}
                disabled={isLoggingOut}
                style={({ pressed }) => [
                  styles.logoutModalConfirm,
                  { opacity: pressed ? 0.8 : 1, opacity: isLoggingOut ? 0.6 : 1 }
                ]}
              >
                {isLoggingOut ? (
                  <Ionicons name="reload" size={16} color="#fff" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                    <Text style={styles.logoutModalConfirmText}>Sair</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={feedbackModal.visible} transparent animationType="fade">
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackCard}>
            <View style={[
              styles.feedbackIconContainer,
              {
                backgroundColor: 
                  feedbackModal.type === "success" ? Colors.light.win + "20"
                  : feedbackModal.type === "error" ? Colors.light.loss + "20"
                  : Colors.light.primary + "20"
              }
            ]}>
              <LinearGradient
                colors={[
                  feedbackModal.type === "success" ? Colors.light.win + "30" : feedbackModal.type === "error" ? Colors.light.loss + "30" : Colors.light.primary + "30",
                  feedbackModal.type === "success" ? Colors.light.win + "10" : feedbackModal.type === "error" ? Colors.light.loss + "10" : Colors.light.primary + "10"
                ]}
                style={styles.feedbackIconGradient}
              >
                <Ionicons 
                  name={
                    feedbackModal.type === "success" ? "checkmark-circle" 
                    : feedbackModal.type === "error" ? "close-circle"
                    : "information-circle"
                  }
                  size={48} 
                  color={
                    feedbackModal.type === "success" ? Colors.light.win
                    : feedbackModal.type === "error" ? Colors.light.loss
                    : Colors.light.primary
                  } 
                />
              </LinearGradient>
            </View>
            
            <Text style={styles.feedbackTitle}>{feedbackModal.title}</Text>
            <Text style={styles.feedbackMessage}>{feedbackModal.message}</Text>

            {feedbackModal.type !== "success" && (
              <Pressable
                onPress={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
                style={({ pressed }) => [
                  styles.feedbackBtn,
                  {
                    backgroundColor: 
                      feedbackModal.type === "success" ? Colors.light.win
                      : feedbackModal.type === "error" ? Colors.light.loss
                      : Colors.light.primary
                  },
                  { opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <Text style={styles.feedbackBtnText}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.light.primary + "40",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.light.cardBorder,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  displayName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  username: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
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
  countdownContainer: {
    marginTop: 16,
    width: "100%",
  },
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary + "40",
  },
  countdownText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  actionsRow: { marginBottom: 16 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginBottom: 8,
  },
  actionBtnText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
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
  paymentMethodsTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
  },
  paymentMethodsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    alignItems: "flex-start",
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  paymentMethodContent: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 2,
  },
  paymentMethodDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  paymentMethodContact: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.accent,
  },
  trialBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.primary + "08",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  trialBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  trialBannerContent: {
    flex: 1,
  },
  trialBannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
    marginBottom: 2,
  },
  trialBannerDays: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.primary,
    marginBottom: 4,
  },
  trialBannerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  proofSection: { marginBottom: 16 },
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
    marginVertical: 16,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.loss + "15",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.loss + "30",
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.loss,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  modalError: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.loss,
    marginBottom: 8,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.light.primary,
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  logoutOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoutModalCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    maxWidth: Dimensions.get("window").width - 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoutIconContainer: {
    marginBottom: 20,
  },
  logoutIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutModalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  logoutModalSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  logoutModalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  logoutModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  logoutModalCancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  logoutModalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.loss,
    flexDirection: "row",
    gap: 6,
  },
  logoutModalConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  feedbackOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  feedbackCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    maxWidth: Dimensions.get("window").width - 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  feedbackIconContainer: {
    marginBottom: 20,
  },
  feedbackIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  feedbackMessage: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  feedbackBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  feedbackBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});