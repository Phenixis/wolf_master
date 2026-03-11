import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useGameStore } from "../store/gameStore";
import { announce } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function RoleRevealScreen({ onDone }: Props) {
  const players = useGameStore((s) => s.players);
  const setPhase = useGameStore((s) => s.setPhase);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = players[currentIndex];

  const handleReveal = () => {
    setRevealed(true);
    announce(`${current.name}, your role is ${current.role.name}. ${current.role.description}`);
  };

  const handleNext = () => {
    setRevealed(false);
    if (currentIndex + 1 >= players.length) {
      setPhase("night");
      onDone();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Role Reveal</Text>
      <Text style={styles.progress}>{currentIndex + 1} / {players.length}</Text>

      <View style={styles.card}>
        <Text style={styles.playerName}>{current?.name}</Text>

        {!revealed ? (
          <TouchableOpacity style={styles.revealBtn} onPress={handleReveal}>
            <Text style={styles.revealBtnText}>Tap to reveal your role</Text>
            <Text style={styles.hint}>(Make sure no one else is watching)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.roleInfo}>
            <Text style={styles.roleName}>{current.role.name}</Text>
            <Text style={styles.roleTeam}>Team: {current.role.team}</Text>
            <Text style={styles.roleDesc}>{current.role.description}</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIndex + 1 >= players.length ? "Start Game" : "Next Player →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", padding: 20 },
  header: { fontSize: 28, fontWeight: "bold", color: "#e94560", marginBottom: 4 },
  progress: { color: "#aaa", marginBottom: 32 },
  card: { backgroundColor: "#16213e", borderRadius: 16, padding: 32, width: "100%", alignItems: "center" },
  playerName: { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 24 },
  revealBtn: { backgroundColor: "#e94560", padding: 20, borderRadius: 12, alignItems: "center" },
  revealBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hint: { color: "#fffa", fontSize: 12, marginTop: 8 },
  roleInfo: { alignItems: "center" },
  roleName: { fontSize: 32, fontWeight: "bold", color: "#e94560", marginBottom: 8 },
  roleTeam: { color: "#aaa", marginBottom: 12 },
  roleDesc: { color: "#ccc", textAlign: "center", marginBottom: 24 },
  nextBtn: { backgroundColor: "#0f3460", padding: 16, borderRadius: 12 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
