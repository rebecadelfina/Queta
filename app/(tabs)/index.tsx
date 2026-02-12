import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, RefreshControl,
  Pressable, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";
import { getTodayStr } from "@/lib/storage";

function PredictionCard({ prediction, locked }: { prediction: any; locked: boolean }) {
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
        <View style={styles.lockedContent}>
          <Ionicons name="lock-closed" size={32} color={Colors.light.textSecondary} />
          <Text style={styles.lockedText}>Desbloqueie para ver</Text>
        </View>
      ) : (
        <>
          <View style={styles.matchRow}>
            <View style={styles.teamContainer}>
              <Ionicons name="shirt" size={20} color={Colors.light.text} />
              <Text style={styles.teamName} numberOfLines={1}>{prediction.homeTeam}</Text>
            </View>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.light.accent} />
              <Text style={styles.matchTime}>{prediction.matchTime}</Text>
            </View>
            <View style={styles.teamContainer}>
              <Text style={styles.teamName} numberOfLines={1}>{prediction.awayTeam}</Text>
              <Ionicons name="shirt-outline" size={20} color={Colors.light.textSecondary} />
            </View>
          </View>

          <View style={styles.marketRow}>
            <View style={styles.marketBadge}>
              <Text style={styles.marketText}>{prediction.market}</Text>
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
  const { currentUser, predictions, hasAccess, daysLeft, isTrial, loading, refreshAll } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const today = getTodayStr();
  const todayPredictions = predictions.filter((p) => p.date === today);
  const isAdmin = currentUser?.isAdmin ?? false;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!currentUser) {
    setTimeout(() => router.replace("/login"), 0);
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>QUETABET BEST</Text>
            <Text style={styles.subtitle}>Prognosticos do Dia</Text>
          </View>
          <View style={styles.headerRight}>
            {isTrial && (
              <View style={styles.trialBadge}>
                <Ionicons name="hourglass" size={12} color={Colors.light.premium} />
                <Text style={styles.trialText}>{daysLeft}d trial</Text>
              </View>
            )}
            {isAdmin && (
              <Pressable
                onPress={() => router.push("/admin")}
                style={({ pressed }) => [styles.adminBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="settings" size={22} color={Colors.light.primary} />
              </Pressable>
            )}
          </View>
        </View>

        {!hasAccess && !isAdmin && (
          <View style={styles.lockedBanner}>
            <Ionicons name="lock-closed" size={24} color={Colors.light.premium} />
            <Text style={styles.lockedBannerText}>Periodo de teste expirado</Text>
            <Text style={styles.lockedBannerSub}>Assine para ver todos os prognosticos</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayPredictions.length}</Text>
            <Text style={styles.statLabel}>Jogos Hoje</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.light.win }]}>
              {todayPredictions.filter((p) => p.result === "win").length}
            </Text>
            <Text style={styles.statLabel}>Ganhos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.light.loss }]}>
              {todayPredictions.filter((p) => p.result === "loss").length}
            </Text>
            <Text style={styles.statLabel}>Perdas</Text>
          </View>
        </View>

        {todayPredictions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>Nenhum prognostico para hoje</Text>
            <Text style={styles.emptySubtext}>Volte mais tarde para novos jogos</Text>
          </View>
        ) : (
          todayPredictions.map((p) => (
            <PredictionCard key={p.id} prediction={p} locked={!hasAccess && !isAdmin} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  trialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.premium + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trialText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.premium,
  },
  adminBtn: { padding: 4 },
  lockedBanner: {
    backgroundColor: Colors.light.premium + "15",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.premium + "30",
  },
  lockedBannerText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.premium,
    marginTop: 8,
  },
  lockedBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
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
    paddingVertical: 3,
    borderRadius: 8,
  },
  leagueText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.primary,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.light.premium + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 9,
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
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    flexShrink: 1,
  },
  timeContainer: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 2,
  },
  matchTime: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.light.accent,
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marketBadge: {
    backgroundColor: Colors.light.accent + "20",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 1,
  },
  marketText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  oddContainer: { alignItems: "center" },
  oddLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  oddValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  lockedContent: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  lockedText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
