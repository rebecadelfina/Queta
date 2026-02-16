import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { NotificationService, type Notification } from "@/lib/notifications-service";
import { useData } from "@/lib/data-context";

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

const { height } = Dimensions.get("window");

export function NotificationCenter({
  visible,
  onClose,
  userId,
}: NotificationCenterProps) {
  const { currentUser } = useData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeUserId = userId || currentUser?.id;

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const allNotifications = await NotificationService.getNotifications();
      
      // Filtrar notificações do usuário atual
      const userNotifications = allNotifications.filter(
        (n) => !n.userId || n.userId === activeUserId
      );
      
      setNotifications(userNotifications);
      
      // Contar não lidas
      const unread = userNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await NotificationService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await NotificationService.deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "warning":
        return "alert-outline";
      case "payment":
        return "wallet";
      case "info":
      default:
        return "information-circle";
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "success":
        return Colors.light.win;
      case "error":
        return Colors.light.loss;
      case "warning":
        return Colors.light.pending;
      case "payment":
        return Colors.light.premium;
      case "info":
      default:
        return Colors.light.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="chevron-back" size={28} color={Colors.light.text} />
            </Pressable>
            <Text style={styles.title}>Notificações</Text>
            <View style={{ width: 28 }} />
          </View>

          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Marcar tudo como lido</Text>
            </Pressable>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons
              name="notifications-off-outline"
              size={56}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptySubtext}>
              Você está em dia com tudo!
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread,
                ]}
              >
                <LinearGradient
                  colors={[
                    getColor(notification.type) + "15",
                    getColor(notification.type) + "05",
                  ]}
                  style={styles.notificationContent}
                >
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: getColor(notification.type) + "25" },
                      ]}
                    >
                      <Ionicons
                        name={getIcon(notification.type) as any}
                        size={20}
                        color={getColor(notification.type)}
                      />
                    </View>

                    <View style={styles.textContent}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {new Date(notification.timestamp).toLocaleTimeString(
                          "pt-AO",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.notificationActions}>
                    {!notification.read && (
                      <Pressable
                        onPress={() =>
                          handleMarkAsRead(notification.id)
                        }
                        hitSlop={8}
                      >
                        <View
                          style={[
                            styles.unreadDot,
                            {
                              backgroundColor:
                                getColor(notification.type),
                            },
                          ]}
                        />
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() =>
                        handleDeleteNotification(notification.id)
                      }
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={Colors.light.textSecondary}
                      />
                    </Pressable>
                  </View>
                </LinearGradient>

                {notification.action && (
                  <Pressable
                    style={styles.actionButton}
                    disabled={notification.read}
                  >
                    <Text style={styles.actionButtonText}>
                      {notification.action.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={Colors.light.primary}
                    />
                  </Pressable>
                )}
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1419",
  },
  header: {
    backgroundColor: "#1a1f2e",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2a3543",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2a8f3d20",
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#00FF88",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8B9DC3",
  },
  notificationItem: {
    marginBottom: 10,
  },
  notificationItemUnread: {
    opacity: 1,
  },
  notificationContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a3543",
    backgroundColor: "#1a1f2e",
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  notificationMessage: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#8B9DC3",
  },
  notificationTime: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#5a6470",
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: "#2a8f3d25",
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2a8f3d40",
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#00FF88",
  },
});
