import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, Modal,
  StyleSheet, KeyboardAvoidingView, Platform, LayoutChangeEvent,
} from "react-native";
import { useGameStore } from "../store/gameStore";

type Props = {
  onDone: () => void;
};

const CARD_W = 52;
const CARD_H = 78;

export default function CardPickScreen({ onDone }: Readonly<Props>) {
  const pendingRoles = useGameStore((s) => s.pendingRoles);
  const registerPlayer = useGameStore((s) => s.registerPlayer);

  const N = pendingRoles.length;

  const [picked, setPicked] = useState<(string | null)[]>(new Array(N).fill(null)); // null = not picked, string = player name
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [inputName, setInputName] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });

  const handleLayout = (e: LayoutChangeEvent) => {
    setAreaSize({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  };

  const getCardPosition = (i: number) => {
    const { width, height } = areaSize;
    if (width === 0) return { left: 0, top: 0 };
    const cx = width / 2;
    const cy = height / 2;
    const minR = (N * (CARD_W + 14)) / (2 * Math.PI);
    const maxR = Math.min(width, height) / 2 - CARD_H / 2 - 8;
    const radius = Math.min(Math.max(minR, 80), maxR);
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    return {
      left: cx + radius * Math.cos(angle) - CARD_W / 2,
      top: cy + radius * Math.sin(angle) - CARD_H / 2,
    };
  };

  const handleCardPress = (i: number) => {
    if (picked[i] !== null || activeIndex !== null) return;
    setActiveIndex(i);
    setInputName("");
    setRevealed(false);
  };

  const handleReveal = () => {
    const name = inputName.trim();
    if (!name || activeIndex === null) return;
    setRevealed(true);
  };

  const handleDone = () => {
    if (activeIndex === null) return;
    const name = inputName.trim();
    const role = pendingRoles[activeIndex];
    registerPlayer(name, role);
    const next = [...picked];
    next[activeIndex] = name;
    setPicked(next);
    setActiveIndex(null);
    setRevealed(false);
  };

  const pickedCount = picked.filter(Boolean).length;
  const allPicked = pickedCount === N;

  const activeRole = activeIndex === null ? null : pendingRoles[activeIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a card</Text>
      <Text style={styles.subtitle}>
        {allPicked
          ? "All players have their role!"
          : `${pickedCount}/${N} — tap a face-down card`}
      </Text>

      {/* Circle area */}
      <View style={styles.circleArea} onLayout={handleLayout}>
        {areaSize.width > 0 &&
          pendingRoles.map((_, i) => {
            const pos = getCardPosition(i);
            const playerName = picked[i];
            const isTaken = playerName !== null;

            return (
              <TouchableOpacity
                // eslint-disable-next-line react/no-array-index-key
                key={`card-${i}`}
                style={[styles.card, pos, isTaken ? styles.cardTaken : styles.cardAvailable]}
                onPress={() => handleCardPress(i)}
                activeOpacity={isTaken ? 1 : 0.7}
              >
                {isTaken ? (
                  <>
                    <Text style={styles.cardDoneIcon}>✓</Text>
                    <Text style={styles.cardPlayerName} numberOfLines={1}>
                      {playerName}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.cardSymbol}>🐺</Text>
                )}
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Proceed button */}
      {allPicked && (
        <TouchableOpacity style={styles.proceedBtn} onPress={onDone}>
          <Text style={styles.proceedText}>Continue →</Text>
        </TouchableOpacity>
      )}

      {/* Card pick modal */}
      <Modal visible={activeIndex !== null} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            {revealed ? (
              <>
                <Text style={styles.modalGreeting}>Hello, {inputName.trim()}!</Text>
                <Text style={styles.roleTitle}>{activeRole?.name}</Text>
                <Text style={styles.roleTeam}>Team: {activeRole?.team}</Text>
                <Text style={styles.roleDesc}>{activeRole?.description}</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                  <Text style={styles.doneBtnText}>Done — pass the phone</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Your turn</Text>
                <Text style={styles.modalHint}>Make sure only you can see the screen</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Enter your name"
                  placeholderTextColor="#555"
                  value={inputName}
                  onChangeText={setInputName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleReveal}
                />
                <TouchableOpacity
                  style={[styles.revealBtn, !inputName.trim() && styles.btnDisabled]}
                  onPress={handleReveal}
                  disabled={!inputName.trim()}
                >
                  <Text style={styles.revealBtnText}>Reveal my role</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#e94560", textAlign: "center" },
  subtitle: { color: "#aaa", textAlign: "center", marginTop: 4, marginBottom: 8, fontSize: 14 },

  circleArea: { flex: 1, position: "relative" },

  card: {
    position: "absolute",
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  cardAvailable: {
    backgroundColor: "#0f3460",
    borderColor: "#1a4a7a",
  },
  cardTaken: {
    backgroundColor: "#0d2d0d",
    borderColor: "#1a4a1a",
  },
  cardSymbol: { fontSize: 22 },
  cardDoneIcon: { color: "#4caf50", fontSize: 18, fontWeight: "bold" },
  cardPlayerName: { color: "#4caf50", fontSize: 8, textAlign: "center", marginTop: 2, paddingHorizontal: 2 },

  proceedBtn: {
    backgroundColor: "#e94560",
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  proceedText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#16213e",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  modalHint: { color: "#666", fontSize: 12, marginBottom: 20, textAlign: "center" },
  nameInput: {
    backgroundColor: "#0f3460",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    width: "100%",
    marginBottom: 16,
    textAlign: "center",
  },
  revealBtn: { backgroundColor: "#e94560", padding: 14, borderRadius: 10, width: "100%", alignItems: "center" },
  btnDisabled: { opacity: 0.35 },
  revealBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  modalGreeting: { color: "#aaa", fontSize: 14, marginBottom: 12 },
  roleTitle: { fontSize: 34, fontWeight: "bold", color: "#e94560", marginBottom: 6 },
  roleTeam: { color: "#888", fontSize: 13, marginBottom: 14 },
  roleDesc: { color: "#ccc", textAlign: "center", fontSize: 15, lineHeight: 22, marginBottom: 24 },
  doneBtn: { backgroundColor: "#0f3460", padding: 14, borderRadius: 10, width: "100%", alignItems: "center" },
  doneBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
