import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface TrialBannerProps {
  daysLeft: number;
  trialExpired: boolean;
  onUpgradePress?: () => void;
}

export function TrialBanner({
  daysLeft,
  trialExpired,
  onUpgradePress,
}: TrialBannerProps) {
  if (trialExpired) {
    return (
      <LinearGradient
        colors={["#ff6b6b", "#ff8e72"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <View style={styles.contentExpired}>
          <View style={styles.iconBox}>
            <Ionicons name="warning" size={20} color="white" />
          </View>
          <View style={styles.textContent}>
            <Text style={styles.titleExpired}>Trial Expirado</Text>
            <Text style={styles.descExpired}>
              Faça upgrade para continuar vendo previsões premium
            </Text>
          </View>
          <Pressable style={styles.upgradeBtn} onPress={onUpgradePress}>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.timerBox}>
          <Ionicons name="hourglass" size={16} color="white" />
          <Text style={styles.dayCounter}>{daysLeft}</Text>
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title}>
            {daysLeft === 1
              ? "Último dia de teste grátis!"
              : `${daysLeft} dias de teste grátis`}
          </Text>
          <Text style={styles.desc}>
            Faça upgrade para continuar com Premium
          </Text>
        </View>
        <Pressable style={styles.upgradeBtn} onPress={onUpgradePress}>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  contentExpired: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  timerBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  dayCounter: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
  titleExpired: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
  },
  descExpired: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
  },
  upgradeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
