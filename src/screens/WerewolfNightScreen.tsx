import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { announce, stopAll } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function WerewolfNightScreen({ onDone }: Readonly<Props>) {
  const allPlayers = useGameStore(useShallow((s) => s.players));
  const setNightVictim = useGameStore((s) => s.setNightVictim);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const targets = allPlayers.filter(
    (p) => p.status === "alive"
  );

  useEffect(() => {
    announce(
      "Everyone close your eyes. Werewolves, open your eyes. " +
      "Point at the player you want to eliminate tonight. Game master, tap their name."
    );
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const name = allPlayers.find((p) => p.id === id)?.name ?? "";
    announce(`${name} is targeted.`);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    setNightVictim(selectedId);
    const name = allPlayers.find((p) => p.id === selectedId)?.name ?? "";
    stopAll();
    announce(`Werewolves, close your eyes. ${name} has been chosen.`);
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐺 Werewolves</Text>
      <Text style={styles.subtitle}>
        Everyone close your eyes.{"\n"}
        Werewolves, open your eyes and choose a victim.
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
            {selectedId === item.id && <Text style={styles.badge}>🎯 Target</Text>}
          </TouchableOpacity>
        )}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No valid targets remaining.</Text>
        }
      />

      <TouchableOpacity
        style={[styles.confirmBtn, !selectedId && styles.disabled]}
        onPress={handleConfirm}
        disabled={!selectedId}
      >
        <Text style={styles.confirmText}>Confirm Victim</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d1a", padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#c0392b", marginBottom: 8 },
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
  selected: { borderColor: "#c0392b" },
  playerName: { color: "#fff", fontSize: 18 },
  badge: { color: "#c0392b", fontSize: 14, fontWeight: "bold" },
  emptyText: { color: "#555", textAlign: "center", marginTop: 40, fontSize: 15 },
  confirmBtn: {
    backgroundColor: "#c0392b",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
