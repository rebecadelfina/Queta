import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet, Text, View, ScrollView, RefreshControl, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";
import { getMonthName, formatDate, getWeekOfMonth } from "@/lib/storage";

export default function EscalaScreen() {
  const insets = useSafeAreaInsets();
  const { scaleEntries, refreshAll } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = getMonthName(currentMonth);

  const monthEntries = useMemo(() => {
    return scaleEntries
      .filter((e) => {
        const d = new Date(e.date + "T00:00:00");
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [scaleEntries, currentMonth, currentYear]);

  const weekGroups = useMemo(() => {
    const groups: Record<number, typeof monthEntries> = {};
    monthEntries.forEach((entry) => {
      const week = getWeekOfMonth(entry.date);
      if (!groups[week]) groups[week] = [];
      groups[week].push(entry);
    });
    return groups;
  }, [monthEntries]);

  const totalWins = monthEntries.reduce((acc, e) => acc + e.odds.filter((o) => o.result === "win").length, 0);
  const totalLosses = monthEntries.reduce((acc, e) => acc + e.odds.filter((o) => o.result === "loss").length, 0);
  const totalPending = monthEntries.reduce((acc, e) => acc + e.odds.filter((o) => o.result === "pending").length, 0);
  const totalScheduled = monthEntries.filter((e) => e.isScheduled).length;

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
        <View style={styles.headerRow}>
          <Ionicons name="calendar" size={22} color={Colors.light.primary} />
          <Text style={styles.title}>Escala - {monthName} {currentYear}</Text>
        </View>

        {Object.keys(weekGroups).sort((a, b) => Number(a) - Number(b)).map((weekNum) => {
          const entries = weekGroups[Number(weekNum)];
          const weekWins = entries.reduce((a, e) => a + e.odds.filter((o) => o.result === "win").length, 0);
          const weekLosses = entries.reduce((a, e) => a + e.odds.filter((o) => o.result === "loss").length, 0);
          const weekPending = entries.reduce((a, e) => a + e.odds.filter((o) => o.result === "pending").length, 0);
          const weekScheduled = entries.filter((e) => e.isScheduled).length;

          return (
            <View key={weekNum} style={styles.weekBlock}>
              <View style={styles.weekHeader}>
                <Ionicons name="calendar-outline" size={14} color={Colors.light.accent} />
                <Text style={styles.weekTitle}>{weekNum}a Semana de {monthName}</Text>
              </View>

              {entries.map((entry) => (
                <View key={entry.id} style={styles.dayBlock}>
                  <View style={styles.dayHeader}>
                    <Ionicons name="today" size={14} color={Colors.light.primary} />
                    <Text style={styles.dayDate}>{formatDate(entry.date)}</Text>
                  </View>
                  {entry.isScheduled ? (
                    <View style={styles.scheduledRow}>
                      <Ionicons name="calendar" size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.scheduledText}>AGENDADO (Sem apostas)</Text>
                    </View>
                  ) : (
                    entry.odds.map((odd, idx) => {
                      const icon = odd.result === "win" ? "checkmark-circle" : odd.result === "loss" ? "close-circle" : "time";
                      const color = odd.result === "win" ? Colors.light.win : odd.result === "loss" ? Colors.light.loss : Colors.light.pending;
                      const label = odd.result === "win" ? "Ganho" : odd.result === "loss" ? "Perda" : "Pendente";
                      return (
                        <View key={idx} style={styles.oddRow}>
                          <View style={styles.oddInfo}>
                            <Ionicons name="flag" size={12} color={Colors.light.accent} />
                            <Text style={styles.oddLabel}>{odd.label || `Odd ${idx + 1}`}: {odd.value.toFixed(2)}</Text>
                          </View>
                          <View style={[styles.resultTag, { backgroundColor: color + "20" }]}>
                            <Ionicons name={icon as any} size={12} color={color} />
                            <Text style={[styles.resultTagText, { color }]}>{label}</Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              ))}

              <View style={styles.weekSummary}>
                <Text style={styles.summaryTitle}>Resumo da Semana</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.light.win} />
                    <Text style={styles.summaryText}>Ganhos: {weekWins}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="close-circle" size={14} color={Colors.light.loss} />
                    <Text style={styles.summaryText}>Perdas: {weekLosses}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="time" size={14} color={Colors.light.pending} />
                    <Text style={styles.summaryText}>Pend: {weekPending}</Text>
                  </View>
                  {weekScheduled > 0 && (
                    <View style={styles.summaryItem}>
                      <Ionicons name="calendar" size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.summaryText}>Agend: {weekScheduled}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {monthEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma entrada neste mes</Text>
          </View>
        )}

        {monthEntries.length > 0 && (
          <View style={styles.monthSummary}>
            <View style={styles.monthSummaryHeader}>
              <Ionicons name="bar-chart" size={18} color={Colors.light.primary} />
              <Text style={styles.monthSummaryTitle}>Geral do Mes - {monthName}</Text>
            </View>
            <View style={styles.monthGrid}>
              <View style={[styles.monthStatCard, { borderColor: Colors.light.win + "40" }]}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.light.win} />
                <Text style={[styles.monthStatValue, { color: Colors.light.win }]}>{totalWins}</Text>
                <Text style={styles.monthStatLabel}>Ganhos</Text>
              </View>
              <View style={[styles.monthStatCard, { borderColor: Colors.light.loss + "40" }]}>
                <Ionicons name="close-circle" size={20} color={Colors.light.loss} />
                <Text style={[styles.monthStatValue, { color: Colors.light.loss }]}>{totalLosses}</Text>
                <Text style={styles.monthStatLabel}>Perdas</Text>
              </View>
              <View style={[styles.monthStatCard, { borderColor: Colors.light.pending + "40" }]}>
                <Ionicons name="time" size={20} color={Colors.light.pending} />
                <Text style={[styles.monthStatValue, { color: Colors.light.pending }]}>{totalPending}</Text>
                <Text style={styles.monthStatLabel}>Pendentes</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  weekBlock: {
    marginBottom: 20,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  weekTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.accent,
  },
  dayBlock: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  scheduledRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  scheduledText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  oddRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  oddInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  oddLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  resultTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  weekSummary: {
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary + "20",
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  monthSummary: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary + "30",
    marginBottom: 20,
  },
  monthSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  monthSummaryTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  monthGrid: {
    flexDirection: "row",
    gap: 10,
  },
  monthStatCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 1,
  },
  monthStatValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  monthStatLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
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
    color: Colors.light.textSecondary,
  },
});
