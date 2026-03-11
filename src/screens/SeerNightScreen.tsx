import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { announce, stopAll } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function SeerNightScreen({ onDone }: Readonly<Props>) {
  const allPlayers = useGameStore(useShallow((s) => s.players));
  const seerKnownIds = useGameStore(useShallow((s) => s.seerKnownIds));
  const seerReveal = useGameStore((s) => s.seerReveal);
  const [revealedThisNight, setRevealedThisNight] = useState<string | null>(null);

  const targets = allPlayers.filter((p) => p.status === "alive");

  useEffect(() => {
    announce(
      "Everyone close your eyes. Seer, open your eyes. " +
      "Point at the player whose role you want to discover. Game master, tap their name."
    );
  }, []);

  const handleReveal = (id: string) => {
    if (seerKnownIds.includes(id) || revealedThisNight !== null) return;
    seerReveal(id);
    setRevealedThisNight(id);
    const player = allPlayers.find((p) => p.id === id);
    if (player) {
      announce(`${player.name} is a ${player.role.name}.`);
    }
  };

  const handleDone = () => {
    stopAll();
    announce("Seer, close your eyes.");
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔮 Seer</Text>
      <Text style={styles.subtitle}>
        Everyone close your eyes.{"\n"}
        Seer, open your eyes and choose a player to inspect.
      </Text>

      <FlatList
        data={targets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isKnown = seerKnownIds.includes(item.id);
          const isDisabled = isKnown || revealedThisNight !== null;
          const label = isKnown ? item.role.name : "unknown";

          return (
            <TouchableOpacity
              style={[
                styles.playerBtn,
                isKnown && styles.knownBtn,
                revealedThisNight === item.id && styles.revealedBtn,
                isDisabled && !isKnown && styles.disabledBtn,
              ]}
              onPress={() => handleReveal(item.id)}
              disabled={isDisabled}
            >
              <Text style={[styles.playerName, isDisabled && styles.disabledText]}>
                {item.name}{" "}
                <Text style={[styles.roleLabel, isKnown && styles.knownRole]}>
                  ({label})
                </Text>
              </Text>
            </TouchableOpacity>
          );
        }}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No players to inspect.</Text>
        }
      />

      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneText}>Seer, close your eyes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d1a", padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#9b59b6", marginBottom: 8 },
  subtitle: { color: "#aaa", fontSize: 14, marginBottom: 24, lineHeight: 20 },
  list: { flex: 1 },
  playerBtn: {
    backgroundColor: "#16213e",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  knownBtn: {
    borderColor: "#9b59b6",
    opacity: 0.6,
  },
  revealedBtn: {
    borderColor: "#9b59b6",
    backgroundColor: "#1e1040",
  },
  disabledBtn: {
    opacity: 0.35,
  },
  playerName: { color: "#fff", fontSize: 18 },
  disabledText: { color: "#888" },
  roleLabel: { color: "#888", fontSize: 15 },
  knownRole: { color: "#c39bd3", fontStyle: "italic" },
  emptyText: { color: "#555", textAlign: "center", marginTop: 40, fontSize: 15 },
  doneBtn: {
    backgroundColor: "#9b59b6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  doneText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
