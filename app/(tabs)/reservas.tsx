import React, { useState, useCallback } from "react";
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
const IMAGE_WIDTH = width - 48;

function ReservationSection({ house, color }: { house: "bantubet" | "elephantebet"; color: string }) {
  const { reservations, addReservation, deleteReservation, isAdmin } = useData();
  const houseReservations = reservations.filter((r) => r.house === house);
  const houseName = house === "bantubet" ? "BantuBet" : "ElephanteBet";

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
      });
    }
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
            style={({ pressed }) => [styles.addBtn, { backgroundColor: color + "20", opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="add" size={20} color={color} />
          </Pressable>
        )}
      </View>

      {houseReservations.length === 0 ? (
        <View style={styles.emptySection}>
          <Ionicons name="image-outline" size={36} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma reserva disponivel</Text>
        </View>
      ) : (
        houseReservations.map((r) => (
          <View key={r.id} style={styles.imageContainer}>
            <Image
              source={{ uri: r.imageUri }}
              style={styles.reservationImage}
              contentFit="contain"
            />
            {isAdmin && (
              <Pressable
                onPress={() => handleDelete(r.id)}
                style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="trash" size={16} color={Colors.light.loss} />
              </Pressable>
            )}
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

        <ReservationSection house="bantubet" color={Colors.light.bantubet} />
        <ReservationSection house="elephantebet" color={Colors.light.elephantebet} />
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
  reservationImage: {
    width: "100%",
    height: 300,
    borderRadius: 14,
  },
  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.light.card,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.loss + "40",
  },
});
