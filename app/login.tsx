import React, { useState } from "react";
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform,
  KeyboardAvoidingView, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useData();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleSubmit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Preencha todos os campos");
      return;
    }
    if (isRegister && !displayName.trim()) {
      setError("Informe o seu nome");
      return;
    }
    if (password.length < 4) {
      setError("A palavra-passe deve ter pelo menos 4 caracteres");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const user = await register(username.trim(), password, displayName.trim());
        if (!user) {
          setError("Este nome de usuario ja existe");
          setLoading(false);
          return;
        }
      } else {
        const user = await login(username.trim(), password);
        if (!user) {
          setError("Usuario ou palavra-passe incorretos");
          setLoading(false);
          return;
        }
      }
      router.replace("/(tabs)");
    } catch (e) {
      setError("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D1117", "#0F1923", "#0D1117"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 40, paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="football" size={40} color={Colors.light.primary} />
            </View>
            <Text style={styles.appName}>QUETABET BEST</Text>
            <Text style={styles.tagline}>Prognosticos Premium de Futebol</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.tabSwitch}>
              <Pressable
                onPress={() => { setIsRegister(false); setError(""); }}
                style={[styles.switchBtn, !isRegister && styles.switchBtnActive]}
              >
                <Text style={[styles.switchText, !isRegister && styles.switchTextActive]}>Entrar</Text>
              </Pressable>
              <Pressable
                onPress={() => { setIsRegister(true); setError(""); }}
                style={[styles.switchBtn, isRegister && styles.switchBtnActive]}
              >
                <Text style={[styles.switchText, isRegister && styles.switchTextActive]}>Registar</Text>
              </Pressable>
            </View>

            {isRegister && (
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={18} color={Colors.light.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="at" size={18} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome de usuario"
                placeholderTextColor={Colors.light.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={18} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Palavra-passe"
                placeholderTextColor={Colors.light.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color={Colors.light.loss} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { opacity: pressed || loading ? 0.7 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.submitText}>{isRegister ? "Criar Conta" : "Entrar"}</Text>
              )}
            </Pressable>

            {!isRegister && (
              <View style={styles.adminHint}>
                <Ionicons name="information-circle" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.adminHintText}>Admin: admin / admin123</Text>
              </View>
            )}
          </View>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
              <Text style={styles.featureText}>3 dias de teste gratuito</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="football" size={16} color={Colors.light.primary} />
              <Text style={styles.featureText}>4 a 10 prognosticos diarios</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="ticket" size={16} color={Colors.light.primary} />
              <Text style={styles.featureText}>Reservas BantuBet e ElephanteBet</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { paddingHorizontal: 24 },
  logoSection: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary + "30",
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    gap: 14,
  },
  tabSwitch: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 3,
    marginBottom: 4,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  switchBtnActive: {
    backgroundColor: Colors.light.primary + "20",
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  switchTextActive: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  eyeBtn: { padding: 4 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.loss + "15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.loss,
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  adminHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  adminHintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  features: {
    marginTop: 24,
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
