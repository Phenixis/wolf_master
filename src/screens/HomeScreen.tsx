import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore } from "../store/gameStore";

type Props = {
  onStart: () => void;
  onResume: () => void;
};

export default function HomeScreen({ onStart, onResume }: Readonly<Props>) {
  const resetGame = useGameStore((s) => s.resetGame);
  const players = useGameStore((s) => s.players);

  const hasActiveGame = players.length > 0;

  const handleNewGame = () => {
    resetGame();
    onStart();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐺 Wolf Master</Text>
      <Text style={styles.subtitle}>Werewolf Game Manager</Text>
      {hasActiveGame && (
        <TouchableOpacity style={styles.resumeButton} onPress={onResume}>
          <Text style={styles.resumeButtonText}>Resume Game ({players.length} players)</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={handleNewGame}>
        <Text style={styles.buttonText}>New Game</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a2e" },
  title: { fontSize: 40, fontWeight: "bold", color: "#e94560", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#aaa", marginBottom: 48 },
  resumeButton: {
    backgroundColor: "#0f3460",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e94560",
  },
  resumeButtonText: { color: "#e94560", fontSize: 16, fontWeight: "bold" },
  button: { backgroundColor: "#e94560", paddingHorizontal: 40, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
