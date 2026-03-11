import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore, selectAlivePlayers } from "../store/gameStore";
import { announce, stopAll } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function HunterScreen({ onDone }: Readonly<Props>) {
  const players = useGameStore(useShallow(selectAlivePlayers));
  const eliminatePlayer = useGameStore((s) => s.eliminatePlayer);
  const markHunterShotUsed = useGameStore((s) => s.useHunterShot);
  const addLog = useGameStore((s) => s.addLog);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    announce(
      "The Hunter has been eliminated. But before falling, they raise their gun for one last shot. " +
      "Game master, select the Hunter's target."
    );
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const name = players.find((p) => p.id === id)?.name ?? "";
    announce(`${name} is targeted.`);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    const name = players.find((p) => p.id === selectedId)?.name ?? "";
    const { loversIds, players: allPlayers } = useGameStore.getState();
    addLog("eliminated_hunter", `🔫 ${name} was shot by the Hunter.`);
    if (loversIds?.includes(selectedId)) {
      const otherId = loversIds.find((id) => id !== selectedId);
      const other = allPlayers.find((p) => p.id === otherId && p.status === "alive");
      if (other) addLog("eliminated_lover", `💔 ${other.name} died of a broken heart.`);
    }
    markHunterShotUsed();
    eliminatePlayer(selectedId);
    stopAll();
    announce(`${name} has been shot by the Hunter.`);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔫 Hunter's Last Shot</Text>
      <Text style={styles.subtitle}>
        The Hunter has been eliminated.{"\n"}
        They take one last shot before falling.{"\n"}
        Game master, select their target.
      </Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.playerBtn, selectedId === item.id && styles.selected]}
            onPress={() => handleSelect(item.id)}
          >
            <Text style={styles.playerName}>{item.name}</Text>
            {selectedId === item.id && <Text style={styles.badge}>🎯 Target</Text>}
          </TouchableOpacity>
        )}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No players remaining.</Text>
        }
      />

      <TouchableOpacity
        style={[styles.confirmBtn, !selectedId && styles.disabled]}
        onPress={handleConfirm}
        disabled={!selectedId}
      >
        <Text style={styles.confirmText}>Confirm Shot</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a00", padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#e67e22", marginBottom: 8 },
  subtitle: { color: "#bba080", fontSize: 14, marginBottom: 24, lineHeight: 20 },
  list: { flex: 1 },
  playerBtn: {
    backgroundColor: "#2a1400",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: { borderColor: "#e67e22" },
  playerName: { color: "#fff", fontSize: 18 },
  badge: { color: "#e67e22", fontSize: 14, fontWeight: "bold" },
  emptyText: { color: "#555", textAlign: "center", marginTop: 40, fontSize: 15 },
  confirmBtn: {
    backgroundColor: "#e67e22",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
