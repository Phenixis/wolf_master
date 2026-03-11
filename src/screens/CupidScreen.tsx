import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore, selectAlivePlayers } from "../store/gameStore";
import { announce } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function CupidScreen({ onDone }: Readonly<Props>) {
  const players = useGameStore(useShallow(selectAlivePlayers));
  const setLovers = useGameStore((s) => s.setLovers);
  const addLog = useGameStore((s) => s.addLog);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length !== 2) return;
    const [a, b] = selectedIds;
    const nameA = players.find((p) => p.id === a)?.name ?? "";
    const nameB = players.find((p) => p.id === b)?.name ?? "";
    setLovers([a, b]);
    addLog("lovers_set", `💕 ${nameA} and ${nameB} are linked as lovers.`);
    announce(`Cupid, close your eyes. ${nameA} and ${nameB} are now linked as lovers. If one dies, the other follows.`);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cupid's Turn</Text>
      <Text style={styles.subtitle}>
        Everyone else, close your eyes.{"\n"}
        Cupid, choose 2 players to link as lovers.{"\n"}
        If one of them dies, the other dies too.
      </Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          const selectionIndex = selectedIds.indexOf(item.id);
          return (
            <TouchableOpacity
              style={[styles.playerBtn, isSelected && styles.selected]}
              onPress={() => handleSelect(item.id)}
            >
              <Text style={styles.playerName}>{item.name}</Text>
              {isSelected && (
                <Text style={styles.badge}>
                  {selectionIndex === 0 ? "♥ Lover 1" : "♥ Lover 2"}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
        style={styles.list}
      />

      <TouchableOpacity
        style={[styles.confirmBtn, selectedIds.length !== 2 && styles.disabled]}
        onPress={handleConfirm}
        disabled={selectedIds.length !== 2}
      >
        <Text style={styles.confirmText}>Confirm Lovers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#e94560", marginBottom: 8 },
  subtitle: { color: "#aaa", fontSize: 14, marginBottom: 24, lineHeight: 20 },
  list: { flex: 1 },
  playerBtn: {
    backgroundColor: "#16213e",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: { borderColor: "#e94560" },
  playerName: { color: "#fff", fontSize: 16 },
  badge: { color: "#e94560", fontWeight: "bold", fontSize: 14 },
  confirmBtn: {
    backgroundColor: "#e94560",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
