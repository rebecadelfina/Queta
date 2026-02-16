import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";

const { width, height } = Dimensions.get("window");

interface LoginScreenProps {
  onDismiss?: () => void;
}

export function LoginScreen({ onDismiss }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const { login, register } = useData();

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [scaleAnim, isLogin]);

  const handleSubmit = async () => {
    setError("");

    if (!username || !password) {
      setError("Preencha todos os campos");
      return;
    }

    if (!isLogin && !displayName) {
      setError("Digite seu nome");
      return;
    }

    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await login(username, password);
      } else {
        user = await register(username, password, displayName);
      }

      if (user) {
        setUsername("");
        setPassword("");
        setDisplayName("");
        onDismiss?.();
      } else {
        setError(isLogin ? "Credenciais inválidas" : "Erro ao registrar");
      }
    } catch (err) {
      setError("Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.light.primary, "#1a0033"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.contentWrapper,
              {
                transform: [
                  {
                    scale: scaleAnim,
                  },
                ],
              },
            ]}
          >
            {/* Logo/Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["#ff6b6b", "#ff8e72"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoBg}
                >
                  <Ionicons name="football" size={48} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Bet Prognostic Hub</Text>
              <Text style={styles.subtitle}>
                Suas previsões mais precisas
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Toggle Button */}
              <View style={styles.toggleContainer}>
                <Pressable
                  style={[
                    styles.toggleBtn,
                    isLogin && styles.toggleBtnActive,
                  ]}
                  onPress={() => {
                    setIsLogin(true);
                    setError("");
                    Animated.spring(scaleAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start(() => {
                      Animated.spring(scaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                      }).start();
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isLogin && styles.toggleTextActive,
                    ]}
                  >
                    Entrar
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.toggleBtn,
                    !isLogin && styles.toggleBtnActive,
                  ]}
                  onPress={() => {
                    setIsLogin(false);
                    setError("");
                    Animated.spring(scaleAnim, {
                      toValue: 0,
                      useNativeDriver: true,
                    }).start(() => {
                      Animated.spring(scaleAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                      }).start();
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      !isLogin && styles.toggleTextActive,
                    ]}
                  >
                    Registrar
                  </Text>
                </Pressable>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Input Fields */}
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome de Exibição</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="person"
                      size={20}
                      color={Colors.light.accent}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Seu nome completo"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={displayName}
                      onChangeText={setDisplayName}
                      editable={!loading}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Utilizador</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail"
                    size={20}
                    color={Colors.light.accent}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu utilizador"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={Colors.light.accent}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Sua senha"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color={Colors.light.accent}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  loading && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#ff6b6b", "#ff8e72"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {isLogin ? "ENTRAR" : "REGISTRAR"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Premium Info */}
              <View style={styles.premiumInfo}>
                <View style={styles.premiumRow}>
                  <View style={styles.premiumDot} />
                  <Text style={styles.premiumText}>3 dias grátis</Text>
                </View>
                <View style={styles.premiumRow}>
                  <View style={styles.premiumDot} />
                  <Text style={styles.premiumText}>Previsões Premium</Text>
                </View>
                <View style={styles.premiumRow}>
                  <View style={styles.premiumDot} />
                  <Text style={styles.premiumText}>Suporte 24/7</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  keyboardView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  contentWrapper: {
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 32,
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
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: Colors.light.primary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#ff6b6b",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  submitBtn: {
    marginTop: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  submitBtnPressed: {
    opacity: 0.9,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  premiumInfo: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
    gap: 12,
  },
  premiumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  premiumText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500",
  },
});
