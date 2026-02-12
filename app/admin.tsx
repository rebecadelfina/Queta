import React, { useState } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, TextInput,
  Platform, Alert, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";
import { getTodayStr } from "@/lib/storage";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const {
    predictions, addPrediction, updatePrediction, deletePrediction,
    scaleEntries, addScaleEntry,
    subscription, approveSubscription,
    isAdmin,
  } = useData();

  const [tab, setTab] = useState<"predictions" | "scale" | "payments">("predictions");

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [league, setLeague] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [market, setMarket] = useState("");
  const [odd, setOdd] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  const [scaleOddValue, setScaleOddValue] = useState("");
  const [scaleOddLabel, setScaleOddLabel] = useState("");
  const [scaleDate, setScaleDate] = useState(getTodayStr());
  const [scaleIsScheduled, setScaleIsScheduled] = useState(false);

  if (!isAdmin) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={48} color={Colors.light.textSecondary} />
        <Text style={[styles.emptyText, { marginTop: 12 }]}>Acesso restrito</Text>
      </View>
    );
  }

  const handleAddPrediction = async () => {
    if (!homeTeam || !awayTeam || !league || !matchTime || !market || !odd) {
      if (Platform.OS !== "web") {
        Alert.alert("Erro", "Preencha todos os campos");
      }
      return;
    }
    await addPrediction({
      homeTeam, awayTeam, league, matchTime, market,
      odd: parseFloat(odd),
      result: "pending",
      isPremium,
      date: getTodayStr(),
    });
    setHomeTeam(""); setAwayTeam(""); setLeague(""); setMatchTime("");
    setMarket(""); setOdd(""); setIsPremium(false);
  };

  const handleAddScaleOdd = async () => {
    if (!scaleOddValue || !scaleDate) return;
    const existing = scaleEntries.find((e) => e.date === scaleDate);
    if (existing) {
      const newOdds = [...existing.odds, { value: parseFloat(scaleOddValue), result: "pending" as const, label: scaleOddLabel || undefined }];
      await addScaleEntry({ date: scaleDate, odds: newOdds, isScheduled: false });
    } else {
      await addScaleEntry({
        date: scaleDate,
        odds: [{ value: parseFloat(scaleOddValue), result: "pending" as const, label: scaleOddLabel || undefined }],
        isScheduled: scaleIsScheduled,
      });
    }
    setScaleOddValue(""); setScaleOddLabel("");
  };

  const handleAddScheduled = async () => {
    if (!scaleDate) return;
    await addScaleEntry({ date: scaleDate, odds: [], isScheduled: true });
  };

  const handleSetResult = async (id: string, result: "win" | "loss") => {
    await updatePrediction(id, { result });
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const todayPredictions = predictions.filter((p) => p.date === getTodayStr());

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D1117", "#111B27", "#0D1117"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </Pressable>
            <Text style={styles.title}>Painel Admin</Text>
          </View>

          <View style={styles.tabRow}>
            {(["predictions", "scale", "payments"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === "predictions" ? "Jogos" : t === "scale" ? "Escala" : "Pagamentos"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "predictions" && (
            <>
              <Text style={styles.sectionTitle}>Adicionar Prognostico</Text>
              <View style={styles.formCard}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Equipa Casa"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={homeTeam}
                    onChangeText={setHomeTeam}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Equipa Fora"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={awayTeam}
                    onChangeText={setAwayTeam}
                  />
                </View>
                <TextInput
                  style={styles.inputFull}
                  placeholder="Liga (ex: Premier League)"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={league}
                  onChangeText={setLeague}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Hora (ex: 16:30)"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={matchTime}
                    onChangeText={setMatchTime}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Odd"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={odd}
                    onChangeText={setOdd}
                    keyboardType="numeric"
                  />
                </View>
                <TextInput
                  style={styles.inputFull}
                  placeholder="Mercado (ex: +2.5 Golos)"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={market}
                  onChangeText={setMarket}
                />
                <Pressable
                  onPress={() => setIsPremium(!isPremium)}
                  style={styles.toggleRow}
                >
                  <Ionicons
                    name={isPremium ? "checkbox" : "square-outline"}
                    size={22}
                    color={isPremium ? Colors.light.premium : Colors.light.textSecondary}
                  />
                  <Text style={styles.toggleText}>Prognostico Premium</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddPrediction}
                  style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="add-circle" size={18} color="#000" />
                  <Text style={styles.addBtnText}>Adicionar</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>Jogos de Hoje ({todayPredictions.length})</Text>
              {todayPredictions.map((p) => (
                <View key={p.id} style={styles.predCard}>
                  <View style={styles.predTop}>
                    <Text style={styles.predTeams}>{p.homeTeam} vs {p.awayTeam}</Text>
                    {p.isPremium && (
                      <View style={styles.premBadge}>
                        <Ionicons name="diamond" size={8} color={Colors.light.premium} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.predInfo}>{p.league} | {p.matchTime} | {p.market} | Odd: {p.odd}</Text>
                  <View style={styles.predActions}>
                    <Pressable
                      onPress={() => handleSetResult(p.id, "win")}
                      style={[styles.resultBtn, { backgroundColor: Colors.light.win + "20" }]}
                    >
                      <Ionicons name="checkmark" size={16} color={Colors.light.win} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleSetResult(p.id, "loss")}
                      style={[styles.resultBtn, { backgroundColor: Colors.light.loss + "20" }]}
                    >
                      <Ionicons name="close" size={16} color={Colors.light.loss} />
                    </Pressable>
                    <Pressable
                      onPress={() => deletePrediction(p.id)}
                      style={[styles.resultBtn, { backgroundColor: Colors.light.textSecondary + "20" }]}
                    >
                      <Ionicons name="trash" size={16} color={Colors.light.textSecondary} />
                    </Pressable>
                    <View style={[
                      styles.statusDot,
                      {
                        backgroundColor: p.result === "win" ? Colors.light.win
                          : p.result === "loss" ? Colors.light.loss
                          : Colors.light.pending,
                      },
                    ]} />
                  </View>
                </View>
              ))}
            </>
          )}

          {tab === "scale" && (
            <>
              <Text style={styles.sectionTitle}>Adicionar a Escala</Text>
              <View style={styles.formCard}>
                <TextInput
                  style={styles.inputFull}
                  placeholder="Data (AAAA-MM-DD)"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={scaleDate}
                  onChangeText={setScaleDate}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Valor Odd"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={scaleOddValue}
                    onChangeText={setScaleOddValue}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Label (ex: Odd 1)"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={scaleOddLabel}
                    onChangeText={setScaleOddLabel}
                  />
                </View>
                <View style={styles.btnRow}>
                  <Pressable
                    onPress={handleAddScaleOdd}
                    style={({ pressed }) => [styles.addBtn, { flex: 1, opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Ionicons name="add-circle" size={18} color="#000" />
                    <Text style={styles.addBtnText}>Adicionar Odd</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddScheduled}
                    style={({ pressed }) => [styles.schedBtn, { flex: 1, opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Ionicons name="calendar" size={18} color={Colors.light.accent} />
                    <Text style={styles.schedBtnText}>Agendar</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {tab === "payments" && (
            <>
              <Text style={styles.sectionTitle}>Pagamentos Pendentes</Text>
              {subscription && subscription.paymentStatus === "pending" ? (
                <View style={styles.paymentCard}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentPlan}>
                      Plano: {subscription.plan === "7days" ? "7 Dias (2.000 Kz)" : "30 Dias (5.000 Kz)"}
                    </Text>
                    <Text style={styles.paymentDate}>
                      Enviado: {new Date(subscription.startDate).toLocaleDateString("pt")}
                    </Text>
                  </View>
                  <Pressable
                    onPress={approveSubscription}
                    style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#000" />
                    <Text style={styles.approveBtnText}>Aprovar</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyPayments}>
                  <Ionicons name="card-outline" size={36} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyText}>Nenhum pagamento pendente</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  tabBtnActive: {
    backgroundColor: Colors.light.primary + "20",
    borderColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    gap: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputFull: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#000",
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
  },
  schedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.accent + "20",
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.accent + "40",
  },
  schedBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  predCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  predTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  predTeams: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    flex: 1,
  },
  premBadge: {
    backgroundColor: Colors.light.premium + "20",
    padding: 4,
    borderRadius: 4,
  },
  predInfo: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  predActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  resultBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: "auto",
  },
  paymentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  paymentInfo: {
    marginBottom: 12,
  },
  paymentPlan: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  paymentDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  approveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#000",
  },
  emptyPayments: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
});
