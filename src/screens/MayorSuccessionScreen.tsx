import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore, selectAlivePlayers } from "../store/gameStore";
import { announce } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function MayorSuccessionScreen({ onDone }: Readonly<Props>) {
  const players = useGameStore(useShallow(selectAlivePlayers));
  const setMayor = useGameStore((s) => s.setMayor);
  const addLog = useGameStore((s) => s.addLog);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    announce(
      "The Mayor has died. Before passing, they must choose a successor. " +
      "Game master, select the new mayor."
    );
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const name = players.find((p) => p.id === id)?.name ?? "";
    announce(`${name} is chosen as the new mayor.`);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    const name = players.find((p) => p.id === selectedId)?.name ?? "";
    setMayor(selectedId);
    addLog("mayor_succession", `👑 ${name} became the new Mayor.`);
    announce(`${name} is the new mayor. Their vote breaks ties during eliminations.`);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👑 Mayor's Last Decree</Text>
      <Text style={styles.subtitle}>
        The Mayor has died and must choose a successor.{"\n"}
        Game master, select the new mayor.
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
            {selectedId === item.id && <Text style={styles.badge}>★ Successor</Text>}
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
        <Text style={styles.confirmText}>Confirm Successor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1200", padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#f5c518", marginBottom: 8 },
  subtitle: { color: "#bba96e", fontSize: 14, marginBottom: 24, lineHeight: 20 },
  list: { flex: 1 },
  playerBtn: {
    backgroundColor: "#2a2000",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: { borderColor: "#f5c518" },
  playerName: { color: "#fff", fontSize: 18 },
  badge: { color: "#f5c518", fontSize: 14, fontWeight: "bold" },
  confirmBtn: {
    backgroundColor: "#f5c518",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#1a1200", fontSize: 18, fontWeight: "bold" },
  emptyText: { color: "#bba96e", textAlign: "center", marginTop: 40, fontSize: 15 },
});
