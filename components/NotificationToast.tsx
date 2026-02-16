import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning" | "payment";
  title: string;
  message: string;
  timestamp: string | Date;
  read: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NotificationToastProps {
  notification: Notification | null;
  onDismiss?: () => void;
}

export function NotificationToast({
  notification,
  onDismiss,
}: NotificationToastProps) {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    if (notification) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          onDismiss?.();
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [notification, slideAnim, onDismiss]);

  if (!notification) return null;

  const getBackgroundColor = () => {
    switch (notification.type) {
      case "success":
      case "payment":
        return Colors.light.win;
      case "error":
        return Colors.light.loss;
      case "warning":
        return Colors.light.pending;
      case "info":
      default:
        return Colors.light.primary;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.content}>
          <Ionicons name={getIcon() as any} size={24} color="white" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.message}>{notification.message}</Text>
          </View>
        </View>

        {notification.action && (
          <Pressable
            onPress={() => {
              notification.action?.onPress();
              onDismiss?.();
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>{notification.action.label}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
  message: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.9)",
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
});
