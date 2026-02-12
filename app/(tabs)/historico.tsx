import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet, Text, View, ScrollView, RefreshControl, Pressable, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";
import { formatDate, getTodayStr } from "@/lib/storage";

type FilterType = "all" | "win" | "loss";

export default function HistoricoScreen() {
  const insets = useSafeAreaInsets();
  const { predictions, refreshAll } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const today = getTodayStr();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const pastPredictions = useMemo(() => {
    return predictions
      .filter((p) => p.result !== "pending")
      .filter((p) => filter === "all" || p.result === filter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [predictions, filter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof pastPredictions> = {};
    pastPredictions.forEach((p) => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });
    return groups;
  }, [pastPredictions]);

  const totalWins = predictions.filter((p) => p.result === "win").length;
  const totalLosses = predictions.filter((p) => p.result === "loss").length;
  const winRate = totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D1117", "#111B27", "#0D1117"]} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === "web" ? 84 : 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Historico</Text>
        <Text style={styles.subtitle}>Resultados dos prognosticos</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Colors.light.win + "40" }]}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.win} />
            <Text style={[styles.statValue, { color: Colors.light.win }]}>{totalWins}</Text>
            <Text style={styles.statLabel}>Ganhos</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.light.loss + "40" }]}>
            <Ionicons name="close-circle" size={20} color={Colors.light.loss} />
            <Text style={[styles.statValue, { color: Colors.light.loss }]}>{totalLosses}</Text>
            <Text style={styles.statLabel}>Perdas</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.light.primary + "40" }]}>
            <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
            <Text style={[styles.statValue, { color: Colors.light.primary }]}>{winRate}%</Text>
            <Text style={styles.statLabel}>Taxa</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(["all", "win", "loss"] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterBtn,
                filter === f && styles.filterBtnActive,
              ]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === "all" ? "Todos" : f === "win" ? "Ganhos" : "Perdas"}
              </Text>
            </Pressable>
          ))}
        </View>

        {Object.keys(groupedByDate).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
          </View>
        ) : (
          Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)).map((date) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Ionicons name="today" size={14} color={Colors.light.accent} />
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </View>
              {groupedByDate[date].map((p) => (
                <View key={p.id} style={styles.historyCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.leagueBadge}>
                      <Ionicons name="trophy" size={10} color={Colors.light.primary} />
                      <Text style={styles.leagueText}>{p.league}</Text>
                    </View>
                    <View style={[
                      styles.resultDot,
                      { backgroundColor: p.result === "win" ? Colors.light.win : Colors.light.loss },
                    ]} />
                  </View>
                  <View style={styles.teamsRow}>
                    <Text style={styles.teamText}>{p.homeTeam}</Text>
                    <Text style={styles.vsText}>vs</Text>
                    <Text style={styles.teamText}>{p.awayTeam}</Text>
                  </View>
                  <View style={styles.cardBottom}>
                    <View style={styles.marketTag}>
                      <Text style={styles.marketTagText}>{p.market}</Text>
                    </View>
                    <Text style={styles.oddText}>Odd: {p.odd.toFixed(2)}</Text>
                    <View style={[
                      styles.resultBadge,
                      { backgroundColor: (p.result === "win" ? Colors.light.win : Colors.light.loss) + "20" },
                    ]}>
                      <Ionicons
                        name={p.result === "win" ? "checkmark-circle" : "close-circle"}
                        size={12}
                        color={p.result === "win" ? Colors.light.win : Colors.light.loss}
                      />
                      <Text style={[
                        styles.resultText,
                        { color: p.result === "win" ? Colors.light.win : Colors.light.loss },
                      ]}>
                        {p.result === "win" ? "Ganho" : "Perda"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
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
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.light.primary + "20",
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: Colors.light.primary,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  historyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leagueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leagueText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.light.primary,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  teamText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    flex: 1,
    textAlign: "center",
  },
  vsText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marketTag: {
    backgroundColor: Colors.light.accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  marketTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  oddText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
});
