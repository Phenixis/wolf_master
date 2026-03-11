import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useGameStore, GameLogEntry } from "../store/gameStore";

type Props = {
  onNewGame: () => void;
};

const OUTCOME: Record<string, { emoji: string; title: string; color: string; subtitle: string }> = {
  village: {
    emoji: "🏡",
    title: "Village wins!",
    color: "#4caf50",
    subtitle: "All werewolves have been eliminated. Peace returns to the village.",
  },
  wolves: {
    emoji: "🐺",
    title: "Werewolves win!",
    color: "#e94560",
    subtitle: "The wolves now outnumber the villagers. The village falls into darkness.",
  },
  lovers: {
    emoji: "💕",
    title: "Lovers win!",
    color: "#e91e8c",
    subtitle: "Against all odds, the two lovers are the last ones standing.",
  },
  nobody: {
    emoji: "💀",
    title: "No one wins.",
    color: "#888",
    subtitle: "Everyone is dead. The village is silent.",
  },
};

export default function GameOverScreen({ onNewGame }: Readonly<Props>) {
  const winner = useGameStore((s) => s.winner);
  const players = useGameStore((s) => s.players);
  const loversIds = useGameStore((s) => s.loversIds);
  const gameLogs = useGameStore((s) => s.gameLogs);
  const resetGame = useGameStore((s) => s.resetGame);

  const outcome = OUTCOME[winner ?? "nobody"] ?? OUTCOME.nobody;

  const loversNames =
    winner === "lovers" && loversIds
      ? loversIds
          .map((id) => players.find((p) => p.id === id)?.name ?? "?")
          .join(" & ")
      : null;

  const handleNewGame = () => {
    resetGame();
    onNewGame();
  };

  // Group log entries by round
  type LogGroup = { round: number; entries: GameLogEntry[] };
  const logGroups = gameLogs.reduce<LogGroup[]>((acc, entry) => {
    const last = acc.at(-1);
    if (last?.round === entry.round) {
      last.entries.push(entry);
    } else {
      acc.push({ round: entry.round, entries: [entry] });
    }
    return acc;
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.emoji}>{outcome.emoji}</Text>
      <Text style={[styles.title, { color: outcome.color }]}>{outcome.title}</Text>
      {!!loversNames && <Text style={styles.loversNames}>{loversNames}</Text>}
      <Text style={styles.subtitle}>{outcome.subtitle}</Text>
      <TouchableOpacity style={[styles.btn, { borderColor: outcome.color }]} onPress={handleNewGame}>
        <Text style={[styles.btnText, { color: outcome.color }]}>New Game</Text>
      </TouchableOpacity>

      {logGroups.length > 0 && (
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>📜 Game Log</Text>
          {logGroups.map((group) => (
            <View key={group.round} style={styles.logGroup}>
              <Text style={styles.logGroupHeader}>
                {group.round === 0 ? "Setup" : `Round ${group.round}`}
              </Text>
              {group.entries.map((entry, idx) => (
                <Text key={`${group.round}-${idx}`} style={styles.logEntry}>{entry.message}</Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#1a1a2e" },
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  loversNames: { fontSize: 20, color: "#e91e8c", marginBottom: 8, fontWeight: "bold" },
  subtitle: { color: "#aaa", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 40 },
  btn: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 16,
    marginBottom: 16,
  },
  btnText: { fontSize: 18, fontWeight: "bold" },
  logSection: {
    width: "100%",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#2a2a4a",
    paddingTop: 20,
  },
  logTitle: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1,
  },
  logGroup: {
    marginBottom: 16,
  },
  logGroupHeader: {
    color: "#7c83fd",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  logEntry: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: 2,
  },
});
