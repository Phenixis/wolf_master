import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useGameStore } from "../store/gameStore";
import { ROLES, Role } from "../data/roles";

type Props = {
  onReady: () => void;
};

const NON_VILLAGER = ROLES.filter((r) => r.id !== "villager");
const VILLAGER_ROLE = ROLES.find((r) => r.id === "villager") ?? ROLES[0];

// Priority order for auto-reduction when player count decreases
const REDUCTION_ORDER = ["little_girl", "cupid", "hunter", "witch", "seer", "werewolf"];

const wolvesForCount = (count: number): number => {
  if (count <= 6) return 1;
  if (count <= 9) return 2;
  if (count <= 12) return 3;
  return Math.floor(count / 4);
};

const getRecommendedCounts = (count: number): Record<string, number> => {
  const wolves = wolvesForCount(count);
  const seer = count >= 5 ? 1 : 0;
  const witch = count >= 7 ? 1 : 0;
  const hunter = count >= 9 ? 1 : 0;
  const cupid = count >= 10 ? 1 : 0;
  const little_girl = count >= 12 ? 1 : 0;
  return { werewolf: wolves, seer, witch, hunter, cupid, little_girl };
};

const fitToCount = (counts: Record<string, number>, max: number): Record<string, number> => {
  const result = { ...counts };
  let total = Object.values(result).reduce((a, b) => a + b, 0);
  for (const id of REDUCTION_ORDER) {
    if (total <= max) break;
    const excess = total - max;
    const removed = Math.min(result[id] ?? 0, excess);
    result[id] = (result[id] ?? 0) - removed;
    total -= removed;
  }
  return result;
};

export default function SetupScreen({ onReady }: Readonly<Props>) {
  const [playerCount, setPlayerCount] = useState(6);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>(
    getRecommendedCounts(6)
  );
  const [rolesModified, setRolesModified] = useState(false);

  const setPendingRoles = useGameStore((s) => s.setPendingRoles);
  const resetGame = useGameStore((s) => s.resetGame);

  const totalNonVillager = Object.values(roleCounts).reduce((a, b) => a + b, 0);
  const villagerCount = Math.max(0, playerCount - totalNonVillager);

  const handleCountChange = (count: number) => {
    const n = Math.round(count);
    setPlayerCount(n);
    if (rolesModified) {
      setRoleCounts((prev) => fitToCount(prev, n));
    } else {
      setRoleCounts(getRecommendedCounts(n));
    }
  };

  const adjustRole = (roleId: string, delta: number) => {
    if (delta > 0 && villagerCount === 0) return; // can't add more without villagers to replace
    setRolesModified(true);
    setRoleCounts((prev) => ({
      ...prev,
      [roleId]: Math.max(0, (prev[roleId] ?? 0) + delta),
    }));
  };

  const handleStart = () => {
    resetGame();
    const roleList: Role[] = [
      ...NON_VILLAGER.flatMap((r) => new Array(roleCounts[r.id] ?? 0).fill(r) as Role[]),
      ...new Array(villagerCount).fill(VILLAGER_ROLE) as Role[],
    ];
    const shuffled = [...roleList].sort(() => Math.random() - 0.5);
    setPendingRoles(shuffled);
    onReady();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Game Setup</Text>

      {/* Player count slider */}
      <View style={styles.sliderSection}>
        <Text style={styles.sectionTitle}>Players</Text>
        <Text style={styles.countDisplay}>{playerCount}</Text>
        <Slider
          style={styles.slider}
          minimumValue={4}
          maximumValue={20}
          step={1}
          value={playerCount}
          onValueChange={handleCountChange}
          minimumTrackTintColor="#e94560"
          maximumTrackTintColor="#333"
          thumbTintColor="#e94560"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>4</Text>
          <Text style={styles.sliderLabel}>20</Text>
        </View>
      </View>

      {/* Role picker */}
      <Text style={styles.sectionTitle}>
        Roles{rolesModified ? "" : "  ✦ recommended"}
      </Text>

      {NON_VILLAGER.map((role) => {
        const count = roleCounts[role.id] ?? 0;
        const canIncrease = villagerCount > 0;
        return (
          <View key={role.id} style={styles.roleRow}>
            <Text style={styles.roleName}>{role.name}</Text>
            <TouchableOpacity
              onPress={() => adjustRole(role.id, -1)}
              disabled={count === 0}
            >
              <Text style={[styles.stepper, count === 0 && styles.stepperDisabled]}>−</Text>
            </TouchableOpacity>
            <Text style={styles.roleCount}>{count}</Text>
            <TouchableOpacity
              onPress={() => adjustRole(role.id, 1)}
              disabled={!canIncrease}
            >
              <Text style={[styles.stepper, !canIncrease && styles.stepperDisabled]}>+</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Villager (auto) */}
      <View style={[styles.roleRow, styles.villagerRow]}>
        <Text style={styles.roleName}>Villager</Text>
        <Text style={styles.autoLabel}>auto</Text>
        <Text style={styles.roleCount}>{villagerCount}</Text>
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
        <Text style={styles.startBtnText}>Prepare Cards →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "bold", color: "#e94560", marginBottom: 24 },
  sliderSection: { marginBottom: 28 },
  sectionTitle: { color: "#aaa", fontSize: 13, fontWeight: "600", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
  countDisplay: { fontSize: 48, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 4 },
  slider: { width: "100%", height: 40 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  sliderLabel: { color: "#666", fontSize: 12 },
  roleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#16213e" },
  villagerRow: { opacity: 0.6 },
  roleName: { flex: 1, color: "#fff", fontSize: 15 },
  stepper: { color: "#e94560", fontSize: 24, paddingHorizontal: 14, fontWeight: "300" },
  stepperDisabled: { color: "#333" },
  roleCount: { color: "#fff", fontSize: 16, minWidth: 24, textAlign: "center" },
  autoLabel: { color: "#555", fontSize: 11, marginRight: 8 },
  startBtn: { backgroundColor: "#e94560", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 28 },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

