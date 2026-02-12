import React, { useState, useMemo } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, TextInput,
  Platform, Alert, KeyboardAvoidingView, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";
import { getTodayStr, MARKETS, checkUserAccess } from "@/lib/storage";

type TabType = "predictions" | "scale" | "payments" | "users" | "comments";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentUser, predictions, comments, allUsers,
    addPrediction, updatePrediction, deletePrediction,
    scaleEntries, addScaleEntry,
    approveUserSubscription,
    approveComment, deleteComment,
  } = useData();

  const [tab, setTab] = useState<TabType>("predictions");
  const [showMarketPicker, setShowMarketPicker] = useState(false);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [league, setLeague] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [market, setMarket] = useState("");
  const [odd, setOdd] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [marketSearch, setMarketSearch] = useState("");

  const [scaleOddValue, setScaleOddValue] = useState("");
  const [scaleOddLabel, setScaleOddLabel] = useState("");
  const [scaleDate, setScaleDate] = useState(getTodayStr());

  const isAdmin = currentUser?.isAdmin ?? false;

  if (!isAdmin) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={48} color={Colors.light.textSecondary} />
        <Text style={[styles.emptyText, { marginTop: 12 }]}>Acesso restrito</Text>
      </View>
    );
  }

  const filteredMarkets = MARKETS.filter((m) =>
    m.toLowerCase().includes(marketSearch.toLowerCase())
  );

  const pendingPayments = allUsers.filter((u) => u.subscription.paymentStatus === "pending");
  const pendingComments = comments.filter((c) => !c.approved);
  const nonAdminUsers = allUsers.filter((u) => !u.isAdmin);

  const handleAddPrediction = async () => {
    if (!homeTeam || !awayTeam || !league || !matchTime || !market || !odd) {
      if (Platform.OS !== "web") Alert.alert("Erro", "Preencha todos os campos");
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
        isScheduled: false,
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

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: "predictions", label: "Jogos" },
    { key: "scale", label: "Escala" },
    { key: "payments", label: "Pag.", badge: pendingPayments.length },
    { key: "users", label: "Users" },
    { key: "comments", label: "Chat", badge: pendingComments.length },
  ];

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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            <View style={styles.tabRow}>
              {tabs.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                    {t.label}
                  </Text>
                  {!!t.badge && t.badge > 0 && (
                    <View style={styles.badgeCircle}>
                      <Text style={styles.badgeText}>{t.badge}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>

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
                <Pressable
                  onPress={() => setShowMarketPicker(true)}
                  style={styles.marketSelector}
                >
                  <Text style={[styles.marketSelectorText, !market && { color: Colors.light.textSecondary }]}>
                    {market || "Selecionar Mercado"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.light.textSecondary} />
                </Pressable>
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
              <Text style={styles.sectionTitle}>Pagamentos Pendentes ({pendingPayments.length})</Text>
              {pendingPayments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="card-outline" size={36} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyText}>Nenhum pagamento pendente</Text>
                </View>
              ) : (
                pendingPayments.map((user) => (
                  <View key={user.id} style={styles.paymentCard}>
                    <View style={styles.payUserRow}>
                      <View style={styles.payUserAvatar}>
                        {user.photoUri ? (
                          <Image source={{ uri: user.photoUri }} style={styles.payUserPhoto} contentFit="cover" />
                        ) : (
                          <Ionicons name="person" size={16} color={Colors.light.textSecondary} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.payUserName}>{user.displayName}</Text>
                        <Text style={styles.payUserSub}>@{user.username}</Text>
                      </View>
                    </View>
                    <Text style={styles.payPlan}>
                      Plano: {user.subscription.plan === "7days" ? "7 Dias (2.000 Kz)" : "30 Dias (5.000 Kz)"}
                    </Text>
                    {user.subscription.paymentProofUri && (
                      <Image
                        source={{ uri: user.subscription.paymentProofUri }}
                        style={styles.payProofImage}
                        contentFit="contain"
                      />
                    )}
                    <Pressable
                      onPress={() => approveUserSubscription(user.id)}
                      style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#000" />
                      <Text style={styles.approveBtnText}>Aprovar Pagamento</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </>
          )}

          {tab === "users" && (
            <>
              <Text style={styles.sectionTitle}>Usuarios ({nonAdminUsers.length})</Text>
              {nonAdminUsers.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={36} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyText}>Nenhum usuario registado</Text>
                </View>
              ) : (
                nonAdminUsers.map((user) => {
                  const access = checkUserAccess(user);
                  const statusColor = access.hasAccess
                    ? (access.isTrial ? Colors.light.pending : Colors.light.primary)
                    : Colors.light.loss;
                  const statusLabel = access.hasAccess
                    ? (access.isTrial ? `Trial (${access.daysLeft}d)` : `Premium (${access.daysLeft}d)`)
                    : "Sem Acesso";
                  return (
                    <View key={user.id} style={styles.userCard}>
                      <View style={styles.userRow}>
                        <View style={styles.userAvatar}>
                          {user.photoUri ? (
                            <Image source={{ uri: user.photoUri }} style={styles.userAvatarImg} contentFit="cover" />
                          ) : (
                            <Ionicons name="person" size={20} color={Colors.light.textSecondary} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userName}>{user.displayName}</Text>
                          <Text style={styles.userUsername}>@{user.username}</Text>
                        </View>
                        <View style={[styles.userStatusBadge, { backgroundColor: statusColor + "20" }]}>
                          <Text style={[styles.userStatusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                      </View>
                      <View style={styles.userDetails}>
                        <View style={styles.userDetailItem}>
                          <Ionicons name="calendar" size={12} color={Colors.light.textSecondary} />
                          <Text style={styles.userDetailText}>
                            Registado: {new Date(user.createdAt).toLocaleDateString("pt")}
                          </Text>
                        </View>
                        <View style={styles.userDetailItem}>
                          <Ionicons name="card" size={12} color={Colors.light.textSecondary} />
                          <Text style={styles.userDetailText}>
                            Pagamento: {
                              user.subscription.paymentStatus === "approved" ? "Aprovado"
                              : user.subscription.paymentStatus === "pending" ? "Pendente"
                              : user.subscription.paymentStatus === "rejected" ? "Rejeitado"
                              : "Nenhum"
                            }
                          </Text>
                        </View>
                        {user.subscription.plan !== "none" && user.subscription.plan !== "trial" && (
                          <View style={styles.userDetailItem}>
                            <Ionicons name="diamond" size={12} color={Colors.light.premium} />
                            <Text style={styles.userDetailText}>
                              Plano: {user.subscription.plan === "7days" ? "7 Dias" : "30 Dias"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {tab === "comments" && (
            <>
              <Text style={styles.sectionTitle}>Comentarios Pendentes ({pendingComments.length})</Text>
              {pendingComments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="chatbubbles-outline" size={36} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyText}>Nenhum comentario pendente</Text>
                </View>
              ) : (
                pendingComments.map((c) => (
                  <View key={c.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{c.username}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(c.date).toLocaleDateString("pt", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <View style={styles.commentActions}>
                      <Pressable
                        onPress={() => approveComment(c.id)}
                        style={({ pressed }) => [styles.commentApprove, { opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Ionicons name="checkmark" size={16} color={Colors.light.primary} />
                        <Text style={styles.commentApproveText}>Aprovar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => deleteComment(c.id)}
                        style={({ pressed }) => [styles.commentDelete, { opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Ionicons name="trash" size={14} color={Colors.light.loss} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Todos os Comentarios ({comments.length})</Text>
              {comments.filter((c) => c.approved).map((c) => (
                <View key={c.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>{c.username}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(c.date).toLocaleDateString("pt", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{c.text}</Text>
                  <View style={styles.commentActions}>
                    <Pressable
                      onPress={() => deleteComment(c.id)}
                      style={({ pressed }) => [styles.commentDelete, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Ionicons name="trash" size={14} color={Colors.light.loss} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showMarketPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Mercado</Text>
              <Pressable onPress={() => setShowMarketPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Pesquisar mercado..."
              placeholderTextColor={Colors.light.textSecondary}
              value={marketSearch}
              onChangeText={setMarketSearch}
            />
            <ScrollView style={styles.marketList} showsVerticalScrollIndicator={false}>
              {filteredMarkets.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMarket(m);
                    setShowMarketPicker(false);
                    setMarketSearch("");
                  }}
                  style={({ pressed }) => [
                    styles.marketItem,
                    market === m && styles.marketItemActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.marketItemText, market === m && styles.marketItemTextActive]}>
                    {m}
                  </Text>
                  {market === m && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.light.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  tabScroll: { marginBottom: 20 },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  badgeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.light.loss,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
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
  inputRow: { flexDirection: "row", gap: 8 },
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
  marketSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  marketSelectorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    flex: 1,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  btnRow: { flexDirection: "row", gap: 8 },
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
  emptyCard: {
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
  paymentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    gap: 10,
  },
  payUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  payUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  payUserPhoto: { width: 36, height: 36, borderRadius: 18 },
  payUserName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  payUserSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  payPlan: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.premium,
  },
  payProofImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
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
  userCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  userAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  userName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  userUsername: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  userStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userStatusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  userDetails: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  userDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userDetailText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  commentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  commentUser: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  commentDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  commentText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  commentApprove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  commentApproveText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  commentDelete: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.loss + "15",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  modalSearch: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
  },
  marketList: {
    maxHeight: 400,
  },
  marketItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  marketItemActive: {
    backgroundColor: Colors.light.primary + "10",
  },
  marketItemText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    flex: 1,
  },
  marketItemTextActive: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
