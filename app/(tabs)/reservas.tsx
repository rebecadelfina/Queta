import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet, Text, View, ScrollView, Pressable, RefreshControl,
  Platform, Alert, Dimensions, TextInput, Modal,
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
  const { reservations, addReservation, publishReservation, deleteReservation, currentUser, hasAccess, addResultReservation, updateReservationExpiry } = useData();
  const isAdmin = currentUser?.isAdmin ?? false;
  const houseName = house === "bantubet" ? "BantuBet" : "ElephanteBet";

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [reservationType, setReservationType] = useState<"initial" | "result">("initial");
  const [expiryDays, setExpiryDays] = useState("7");

  const houseReservations = useMemo(() => {
    const all = reservations.filter((r) => r.house === house);
    if (isAdmin) return all;
    return all.filter((r) => r.published);
  }, [reservations, house, isAdmin]);

  const today = new Date().toISOString().split("T")[0];
  const initialReservations = useMemo(() => {
    const initial = houseReservations.filter((r) => r.type === "initial" || !r.type);
    if (showHistory) return initial;
    return initial.filter((r) => {
      const rDate = r.date.split("T")[0];
      return rDate === today;
    });
  }, [houseReservations, showHistory, today]);

  const resultReservations = useMemo(() => {
    return houseReservations.filter((r) => r.type === "result");
  }, [houseReservations]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
      setTicketIdInput("");
      setShowTicketModal(true);
    }
  };

  const handleAddReservation = async () => {
    if (selectedImageUri) {
      if (reservationType === "result") {
        await addResultReservation(house, selectedImageUri, ticketIdInput || undefined, parseInt(expiryDays) || 7);
      } else {
        await addReservation({
          house,
          imageUri: selectedImageUri,
          date: new Date().toISOString(),
          published: false,
          ticketId: ticketIdInput || undefined,
          type: "initial",
        });
      }
      setShowTicketModal(false);
      setSelectedImageUri("");
      setTicketIdInput("");
      setReservationType("initial");
      setExpiryDays("7");
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
      ) : (
        <>
          {/* FICHAS INICIAIS */}
          {!showHistory && (
            <>
              <Text style={[styles.subsectionTitle, { color, marginTop: 12 }]}>Fichas de Aposta</Text>
              {initialReservations.length === 0 ? (
                <View style={styles.emptySection}>
                  <Ionicons name="image-outline" size={36} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyText}>Nenhuma ficha de aposta disponivel hoje</Text>
                </View>
              ) : (
                initialReservations.sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
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
                    {r.ticketId && (
                      <View style={styles.ticketIdBanner}>
                        <Ionicons name="ticket" size={14} color={Colors.light.primary} />
                        <Text style={styles.ticketIdText}>ID: {r.ticketId}</Text>
                      </View>
                    )}
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
            </>
          )}

          {/* FICHAS DE RESULTADO */}
          {showHistory && (
            <>
              <Text style={[styles.subsectionTitle, { color, marginTop: 12 }]}>Fichas de Resultado</Text>
              {resultReservations.length === 0 ? (
                <View style={styles.emptySection}>
                  <Ionicons name="checkmark-circle-outline" size={36} color={Colors.light.textSecondary} />
                  <Text style={styles.emptyText}>Nenhuma ficha de resultado disponivel</Text>
                </View>
              ) : (
                resultReservations.sort((a, b) => b.date.localeCompare(a.date)).map((r) => {
                  const expiresIn = r.expiresAt ? Math.ceil((new Date(r.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  return (
                    <View key={r.id} style={[styles.imageContainer, { borderColor: Colors.light.win + "40", borderWidth: 2 }]}>
                      <View style={[styles.resultBadge, { backgroundColor: Colors.light.win + "15" }]}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.light.win} />
                        <Text style={[styles.resultBadgeText, { color: Colors.light.win }]}>Resultado</Text>
                        {expiresIn > 0 && (
                          <Text style={styles.expiryText}>Expira em {expiresIn}d</Text>
                        )}
                      </View>
                      <Image
                        source={{ uri: r.imageUri }}
                        style={styles.reservationImage}
                        contentFit="contain"
                      />
                      {r.ticketId && (
                        <View style={styles.ticketIdBanner}>
                          <Ionicons name="ticket" size={14} color={Colors.light.primary} />
                          <Text style={styles.ticketIdText}>ID: {r.ticketId}</Text>
                        </View>
                      )}
                      <View style={styles.imageFooter}>
                        <Text style={styles.imageDate}>
                          {new Date(r.date).toLocaleDateString("pt", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </Text>
                        {isAdmin && (
                          <Pressable
                            onPress={() => handleDelete(r.id)}
                            style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
                          >
                            <Ionicons name="trash" size={14} color={Colors.light.loss} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </>
      )}

      <Modal visible={showTicketModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ticketModal}>
            <View style={styles.ticketModalHeader}>
              <Text style={styles.ticketModalTitle}>Adicionar {reservationType === "result" ? "Ficha de Resultado" : "Ficha de Aposta"}</Text>
              <Pressable onPress={() => setShowTicketModal(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </Pressable>
            </View>

            <View style={styles.ticketModalContent}>
              {isAdmin && (
                <View style={styles.typeSelector}>
                  <Text style={styles.typeSelectorLabel}>Tipo de Ficha:</Text>
                  <View style={styles.typeButtons}>
                    <Pressable
                      onPress={() => setReservationType("initial")}
                      style={[
                        styles.typeBtn,
                        reservationType === "initial" && styles.typeBtnActive,
                      ]}
                    >
                      <Ionicons
                        name="document"
                        size={16}
                        color={reservationType === "initial" ? Colors.light.primary : Colors.light.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          reservationType === "initial" && styles.typeBtnTextActive,
                        ]}
                      >
                        Aposta
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setReservationType("result")}
                      style={[
                        styles.typeBtn,
                        reservationType === "result" && styles.typeBtnActive,
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={reservationType === "result" ? Colors.light.win : Colors.light.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          reservationType === "result" && styles.typeBtnTextActive,
                        ]}
                      >
                        Resultado
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <TextInput
                style={styles.ticketInput}
                placeholder="ID da Ficha (opcional)"
                placeholderTextColor={Colors.light.textSecondary}
                value={ticketIdInput}
                onChangeText={setTicketIdInput}
              />

              {reservationType === "result" && (
                <View style={styles.expiryInputSection}>
                  <Text style={styles.expiryLabel}>Dias até expiração:</Text>
                  <TextInput
                    style={styles.expiryInput}
                    placeholder="7"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={expiryDays}
                    onChangeText={setExpiryDays}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <Text style={styles.ticketHint}>
                {reservationType === "result" 
                  ? "Fichas de resultado ficam públicas e expiram automaticamente." 
                  : "Fichas de aposta podem ser rascunho."}
              </Text>
            </View>

            <View style={styles.ticketModalActions}>
              <Pressable
                onPress={handleAddReservation}
                style={({ pressed }) => [styles.ticketConfirmBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="checkmark-circle" size={18} color="#000" />
                <Text style={styles.ticketConfirmText}>{reservationType === "result" ? "Publicar Resultado" : "Adicionar Ficha"}</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTicketModal(false)}
                style={({ pressed }) => [styles.ticketCancelBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="close" size={18} color={Colors.light.loss} />
                <Text style={styles.ticketCancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  // Ticket ID styles
  ticketIdBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.primary + "30",
  },
  ticketIdText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  ticketModal: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.cardBorder,
  },
  ticketModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ticketModalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  ticketModalContent: {
    marginBottom: 20,
  },
  ticketInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginBottom: 8,
  },
  ticketHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    fontStyle: "italic",
  },
  ticketModalActions: {
    flexDirection: "row",
    gap: 10,
  },
  ticketConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ticketConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#000",
  },
  ticketCancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.loss + "15",
    paddingVertical: 12,
    borderRadius: 10,
  },
  ticketCancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.loss,
  },
  subsectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.win + "30",
  },
  resultBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  expiryText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeSelectorLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  typeBtnActive: {
    backgroundColor: Colors.light.primary + "20",
    borderColor: Colors.light.primary,
  },
  typeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  typeBtnTextActive: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
  expiryInputSection: {
    marginVertical: 12,
  },
  expiryLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 6,
  },
  expiryInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
});
