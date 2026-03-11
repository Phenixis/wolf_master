import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { announce, stopAll } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function DayVoteScreen({ onDone }: Readonly<Props>) {
  const allPlayers = useGameStore(useShallow((s) => s.players));
  const eliminatePlayer = useGameStore((s) => s.eliminatePlayer);
  const addLog = useGameStore((s) => s.addLog);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const targets = allPlayers.filter((p) => p.status === "alive");

  useEffect(() => {
    announce(
      "The village wakes up. Discuss and vote for a player to eliminate. " +
      "Game master, tap the name of the voted player."
    );
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const name = allPlayers.find((p) => p.id === id)?.name ?? "";
    announce(`${name} is nominated.`);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    const name = allPlayers.find((p) => p.id === selectedId)?.name ?? "";
    addLog("eliminated_day", `☀️ ${name} was eliminated by the village.`);
    const { loversIds } = useGameStore.getState();
    if (loversIds?.includes(selectedId)) {
      const otherId = loversIds.find((id) => id !== selectedId);
      const other = allPlayers.find((p) => p.id === otherId && p.status === "alive");
      if (other) addLog("eliminated_lover", `💔 ${other.name} died of a broken heart.`);
    }
    eliminatePlayer(selectedId);
    stopAll();
    announce(`${name} has been eliminated by the village.`);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>☀️ Village Vote</Text>
      <Text style={styles.subtitle}>
        Discuss and vote. The player with the most votes is eliminated.{"\n"}
        Game master, tap the chosen player.
      </Text>

      <FlatList
        data={targets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.playerBtn, selectedId === item.id && styles.selected]}
            onPress={() => handleSelect(item.id)}
          >
            <Text style={styles.playerName}>{item.name}</Text>
            {selectedId === item.id && <Text style={styles.badge}>🗳️ Voted</Text>}
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
        <Text style={styles.confirmText}>Eliminate Player</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2ece0", padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#c0392b", marginBottom: 8 },
  subtitle: { color: "#666", fontSize: 14, marginBottom: 24, lineHeight: 20 },
  list: { flex: 1 },
  playerBtn: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d8cfc0",
  },
  selected: { borderColor: "#c0392b" },
  playerName: { color: "#1a1a1a", fontSize: 18 },
  badge: { color: "#c0392b", fontSize: 14, fontWeight: "bold" },
  emptyText: { color: "#999", textAlign: "center", marginTop: 40, fontSize: 15 },
  confirmBtn: {
    backgroundColor: "#c0392b",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: { backgroundColor: "#ccc" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
