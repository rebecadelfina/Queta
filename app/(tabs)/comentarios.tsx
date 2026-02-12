import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, RefreshControl, Pressable,
  Platform, TextInput, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useData } from "@/lib/data-context";

export default function ComentariosScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, comments, addComment, approveComment, deleteComment, refreshAll } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [text, setText] = useState("");
  const isAdmin = currentUser?.isAdmin ?? false;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser) return;
    await addComment(text.trim());
    setText("");
  };

  const visibleComments = isAdmin
    ? comments
    : comments.filter((c) => c.approved);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0D1117", "#111B27", "#0D1117"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: 90 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Comentarios</Text>
          <Text style={styles.subtitle}>Partilhe a sua opiniao</Text>

          {isAdmin && (
            <View style={styles.adminNotice}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.light.primary} />
              <Text style={styles.adminNoticeText}>
                Comentarios pendentes aparecem aqui para aprovacao
              </Text>
            </View>
          )}

          {visibleComments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>Nenhum comentario ainda</Text>
              <Text style={styles.emptySubtext}>Seja o primeiro a comentar</Text>
            </View>
          ) : (
            visibleComments.sort((a, b) => b.date.localeCompare(a.date)).map((c) => (
              <View key={c.id} style={[styles.commentCard, !c.approved && styles.commentPending]}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAvatar}>
                    {c.userPhoto ? (
                      <Image source={{ uri: c.userPhoto }} style={styles.commentPhoto} contentFit="cover" />
                    ) : (
                      <Ionicons name="person" size={16} color={Colors.light.textSecondary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>{c.username}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(c.date).toLocaleDateString("pt", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  {!c.approved && isAdmin && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pendente</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
                {isAdmin && (
                  <View style={styles.commentActions}>
                    {!c.approved && (
                      <Pressable
                        onPress={() => approveComment(c.id)}
                        style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Ionicons name="checkmark" size={16} color={Colors.light.primary} />
                        <Text style={styles.approveText}>Aprovar</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => deleteComment(c.id)}
                      style={({ pressed }) => [styles.deleteCommentBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Ionicons name="trash" size={14} color={Colors.light.loss} />
                    </Pressable>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {currentUser && (
          <View style={[styles.inputBar, { paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 10) }]}>
            <TextInput
              style={styles.inputField}
              placeholder="Escreva um comentario..."
              placeholderTextColor={Colors.light.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              style={({ pressed }) => [styles.sendBtn, { opacity: !text.trim() ? 0.4 : pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="send" size={18} color={Colors.light.primary} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
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
  adminNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.primary + "10",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary + "20",
  },
  adminNoticeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.primary,
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
  commentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  commentPending: {
    borderColor: Colors.light.pending + "40",
    backgroundColor: Colors.light.pending + "05",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  commentPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentUser: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  commentDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  pendingBadge: {
    backgroundColor: Colors.light.pending + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.pending,
  },
  commentText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approveText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.primary,
  },
  deleteCommentBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.loss + "15",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.cardBorder,
  },
  inputField: {
    flex: 1,
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
