import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, RefreshControl,
  Platform, Alert, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";

const { width } = Dimensions.get("window");

function ReservationSection({ house, color, showHistory }: { house: "bantubet" | "elephantebet"; color: string; showHistory: boolean }) {
  const { reservations, addReservation, publishReservation, deleteReservation, currentUser, hasAccess } = useData();
  const isAdmin = currentUser?.isAdmin ?? false;
  const houseName = house === "bantubet" ? "BantuBet" : "ElephanteBet";

  const houseReservations = useMemo(() => {
    const all = reservations.filter((r) => r.house === house);
    if (isAdmin) return all;
    return all.filter((r) => r.published);
  }, [reservations, house, isAdmin]);

  const today = new Date().toISOString().split("T")[0];
  const displayed = useMemo(() => {
    if (showHistory) return houseReservations;
    return houseReservations.filter((r) => {
      const rDate = r.date.split("T")[0];
      return rDate === today;
    });
  }, [houseReservations, showHistory, today]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await addReservation({
        house,
        imageUri: result.assets[0].uri,
        date: new Date().toISOString(),
        published: false,
      });
    }
  };

  const handlePublish = (id: string) => {
    publishReservation(id);
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === "web") {
      deleteReservation(id);
      return;
    }
    Alert.alert("Remover", "Deseja remover esta reserva?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => deleteReservation(id) },
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.houseBadge, { backgroundColor: color + "20" }]}>
          <Ionicons name="storefront" size={16} color={color} />
          <Text style={[styles.houseName, { color }]}>{houseName}</Text>
        </View>
        {isAdmin && (
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [styles.addImageBtn, { backgroundColor: color + "20", opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="add" size={20} color={color} />
          </Pressable>
        )}
      </View>

      {!hasAccess && !isAdmin ? (
        <View style={styles.lockedSection}>
          <Ionicons name="lock-closed" size={28} color={Colors.light.textSecondary} />
          <Text style={styles.lockedText}>Conteudo exclusivo para Premium</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.emptySection}>
          <Ionicons name="image-outline" size={36} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>
            {showHistory ? "Nenhuma reserva no historico" : "Nenhuma reserva disponivel hoje"}
          </Text>
        </View>
      ) : (
        displayed.sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
          <View key={r.id} style={styles.imageContainer}>
            {!r.published && isAdmin && (
              <View style={styles.draftBanner}>
                <Ionicons name="eye-off" size={12} color={Colors.light.pending} />
                <Text style={styles.draftText}>Rascunho - Nao publicado</Text>
              </View>
            )}
            <Image
              source={{ uri: r.imageUri }}
              style={styles.reservationImage}
              contentFit="contain"
            />
            <View style={styles.imageFooter}>
              <Text style={styles.imageDate}>
                {new Date(r.date).toLocaleDateString("pt", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Text>
              {isAdmin && (
                <View style={styles.imageActions}>
                  {!r.published && (
                    <Pressable
                      onPress={() => handlePublish(r.id)}
                      style={({ pressed }) => [styles.publishBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Ionicons name="paper-plane" size={14} color={Colors.light.primary} />
                      <Text style={styles.publishText}>Publicar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleDelete(r.id)}
                    style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Ionicons name="trash" size={14} color={Colors.light.loss} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export default function ReservasScreen() {
  const insets = useSafeAreaInsets();
  const { refreshAll } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

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
        <Text style={styles.title}>Reservas</Text>
        <Text style={styles.subtitle}>Fichas de reserva das casas de apostas</Text>

        <View style={styles.viewToggle}>
          <Pressable
            onPress={() => setShowHistory(false)}
            style={[styles.toggleBtn, !showHistory && styles.toggleBtnActive]}
          >
            <Ionicons name="today" size={14} color={!showHistory ? Colors.light.primary : Colors.light.textSecondary} />
            <Text style={[styles.toggleText, !showHistory && styles.toggleTextActive]}>Hoje</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowHistory(true)}
            style={[styles.toggleBtn, showHistory && styles.toggleBtnActive]}
          >
            <Ionicons name="time" size={14} color={showHistory ? Colors.light.primary : Colors.light.textSecondary} />
            <Text style={[styles.toggleText, showHistory && styles.toggleTextActive]}>Historico</Text>
          </Pressable>
        </View>

        <ReservationSection house="bantubet" color={Colors.light.bantubet} showHistory={showHistory} />
        <ReservationSection house="elephantebet" color={Colors.light.elephantebet} showHistory={showHistory} />
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
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Colors.light.primary + "20",
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  houseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  houseName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  addImageBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  lockedText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  emptySection: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 30,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.pending + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  draftText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.pending,
  },
  reservationImage: {
    width: "100%",
    height: 300,
  },
  imageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  imageActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  publishText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.loss + "15",
  },
});
