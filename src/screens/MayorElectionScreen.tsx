import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore, selectAlivePlayers } from "../store/gameStore";
import { announce } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function MayorElectionScreen({ onDone }: Readonly<Props>) {
  const players = useGameStore(useShallow(selectAlivePlayers));
  const setMayor = useGameStore((s) => s.setMayor);
  const setPhase = useGameStore((s) => s.setPhase);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const name = players.find((p) => p.id === id)?.name ?? "";
    announce(`${name} is proposed as mayor.`);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    const name = players.find((p) => p.id === selectedId)?.name ?? "";
    setMayor(selectedId);
    setPhase("day");
    announce(`${name} is elected mayor. The mayor's vote breaks ties during eliminations.`);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mayor Election</Text>
      <Text style={styles.subtitle}>
        Everyone is now awake after the first night.{"\n"}
        Vote to elect a mayor — they will break ties during village eliminations.
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
            {selectedId === item.id && <Text style={styles.badge}>★ Mayor</Text>}
          </TouchableOpacity>
        )}
        style={styles.list}
      />

      <TouchableOpacity
        style={[styles.confirmBtn, !selectedId && styles.disabled]}
        onPress={handleConfirm}
        disabled={!selectedId}
      >
        <Text style={styles.confirmText}>Confirm Mayor</Text>
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
  playerName: { color: "#fff", fontSize: 18 },
  badge: { color: "#e94560", fontSize: 14, fontWeight: "bold" },
  confirmBtn: {
    backgroundColor: "#e94560",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
