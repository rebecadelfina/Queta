import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";

interface PaymentProofSubmitProps {
  plan: "7days" | "30days";
  amount: number;
  onClose: () => void;
  onSubmit: (referenceId: string, proofUri?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function PaymentProofSubmit({
  plan,
  amount,
  onClose,
  onSubmit,
  isSubmitting = false,
}: PaymentProofSubmitProps) {
  const [referenceId, setReferenceId] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"bank" | "express" | null>(null);

  const planLabel = plan === "7days" ? "7 Dias" : "30 Dias";
  const bankDetails = {
    bank: "Banco de Moçambique",
    account: "123456789",
    citizen: "1234567",
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProofImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      Alert.alert("Atenção", "Selecione um método de pagamento");
      return;
    }

    if (!referenceId.trim()) {
      Alert.alert("Atenção", "Digite o número de referência ou comprovativo");
      return;
    }

    if (selectedMethod === "bank" && !proofImage) {
      Alert.alert("Atenção", "Envie uma imagem do comprovativo bancário");
      return;
    }

    try {
      await onSubmit(referenceId, proofImage || undefined);
    } catch (error) {
      Alert.alert("Erro ao Enviar", "Não foi possível enviar o comprovativo");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>Comprovativo de Pagamento</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Summary */}
        <LinearGradient
          colors={["#2a8f3d30", "#2a8f3d10"]}
          style={styles.planSummary}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Plano</Text>
              <Text style={styles.summaryValue}>{planLabel}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valor</Text>
              <Text style={styles.summaryValue}>{amount} MT</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pagamento</Text>

          {/* Bank Transfer Option */}
          <Pressable
            style={[
              styles.methodCard,
              selectedMethod === "bank" && styles.methodCardSelected,
            ]}
            onPress={() => setSelectedMethod("bank")}
          >
            <View style={styles.methodLeft}>
              <View
                style={[
                  styles.methodRadio,
                  selectedMethod === "bank" && styles.methodRadioSelected,
                ]}
              >
                {selectedMethod === "bank" && (
                  <View style={styles.methodRadioDot} />
                )}
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodName}>Transferência Bancária</Text>
                <Text style={styles.methodSubtext}>
                  Transfira para a conta do banco
                </Text>
              </View>
            </View>
            <Ionicons
              name="swap-horizontal"
              size={24}
              color={selectedMethod === "bank" ? "#2a8f3d" : "#666"}
            />
          </Pressable>

          {/* Emis Express Option */}
          <Pressable
            style={[
              styles.methodCard,
              selectedMethod === "express" && styles.methodCardSelected,
            ]}
            onPress={() => setSelectedMethod("express")}
          >
            <View style={styles.methodLeft}>
              <View
                style={[
                  styles.methodRadio,
                  selectedMethod === "express" && styles.methodRadioSelected,
                ]}
              >
                {selectedMethod === "express" && (
                  <View style={styles.methodRadioDot} />
                )}
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodName}>Emis Express</Text>
                <Text style={styles.methodSubtext}>
                  Envie comprovativo por Emis
                </Text>
              </View>
            </View>
            <Ionicons
              name="card"
              size={24}
              color={selectedMethod === "express" ? "#2a8f3d" : "#666"}
            />
          </Pressable>
        </View>

        {/* Bank Details */}
        {selectedMethod === "bank" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Bancários</Text>
            <LinearGradient
              colors={["#0f1419", "#1a1f2e"]}
              style={styles.bankCard}
            >
              <View style={styles.bankDetail}>
                <Text style={styles.bankLabel}>Banco</Text>
                <Text style={styles.bankValue}>{bankDetails.bank}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.bankDetail}>
                <Text style={styles.bankLabel}>Conta</Text>
                <Text style={styles.bankValue}>{bankDetails.account}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.bankDetail}>
                <Text style={styles.bankLabel}>Cidadão</Text>
                <Text style={styles.bankValue}>{bankDetails.citizen}</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Reference ID Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedMethod === "bank"
              ? "Número de Referência / Comprovativo"
              : "ID da Transação"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              selectedMethod === "bank"
                ? "Ex: 12345678 ou descricao do comprovativo"
                : "Ex: TRX123456789"
            }
            placeholderTextColor="#666"
            value={referenceId}
            onChangeText={setReferenceId}
            editable={!isSubmitting}
          />
        </View>

        {/* Proof Image Upload */}
        {selectedMethod === "bank" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enviar Comprovativo</Text>

            {proofImage ? (
              <View style={styles.proofContainer}>
                <Image
                  source={{ uri: proofImage }}
                  style={styles.proofImage}
                />
                <Pressable
                  style={styles.removeImageBtn}
                  onPress={() => setProofImage(null)}
                  disabled={isSubmitting}
                >
                  <Ionicons name="close-circle" size={28} color="#ff6b6b" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={["#2a8f3d", "#1f6428"]}
                  style={styles.uploadGradient}
                >
                  <Ionicons name="image-outline" size={32} color="white" />
                  <Text style={styles.uploadText}>Selecionar Comprovativo</Text>
                  <Text style={styles.uploadSubtext}>
                    PNG, JPG ou PDF até 10MB
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instruções</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>
                Realize a transferência ou envio de pagamento
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>
                Envie o número de referência / comprovativo
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>
                Aguarde a aprovação do administrador
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Enviar Comprovativo</Text>
            </>
          )}
        </Pressable>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#2a3543",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  planSummary: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#a0a9c9",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "white",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(42, 143, 61, 0.3)",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "white",
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1a1f2e",
    borderWidth: 2,
    borderColor: "#2a3543",
    marginBottom: 10,
  },
  methodCardSelected: {
    borderColor: "#2a8f3d",
    backgroundColor: "#2a8f3d15",
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#666",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  methodRadioSelected: {
    borderColor: "#2a8f3d",
  },
  methodRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2a8f3d",
  },
  methodContent: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "white",
    marginBottom: 2,
  },
  methodSubtext: {
    fontSize: 12,
    color: "#a0a9c9",
  },
  bankCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a3543",
  },
  bankDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankLabel: {
    fontSize: 12,
    color: "#a0a9c9",
  },
  bankValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#2a3543",
    marginVertical: 12,
  },
  input: {
    backgroundColor: "#1a1f2e",
    borderWidth: 1,
    borderColor: "#2a3543",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "white",
  },
  proofContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1f2e",
  },
  proofImage: {
    width: "100%",
    height: 220,
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  uploadButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  uploadGradient: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
  uploadSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2a8f3d",
    color: "white",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 28,
    fontSize: 12,
    flexShrink: 0,
  },
  instructionText: {
    fontSize: 13,
    color: "#a0a9c9",
    flex: 1,
    paddingTop: 2,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#1a1f2e",
    borderWidth: 1,
    borderColor: "#2a3543",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#a0a9c9",
  },
  submitButton: {
    backgroundColor: "#2a8f3d",
    flexDirection: "row",
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
