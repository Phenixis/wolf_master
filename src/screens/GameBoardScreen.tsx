import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, LayoutChangeEvent,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore, Player } from "../store/gameStore";

type Props = {
  onEndGame: () => void;
};

const CARD_W = 72;
const CARD_H = 90;

function getCardPosition(i: number, total: number, width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const minR = (total * (CARD_W + 16)) / (2 * Math.PI);
  const maxR = Math.min(width, height) / 2 - CARD_H / 2 - 8;
  const radius = Math.min(Math.max(minR, 80), maxR);
  const angle = (2 * Math.PI * i) / total - Math.PI / 2;
  return {
    left: cx + radius * Math.cos(angle) - CARD_W / 2,
    top: cy + radius * Math.sin(angle) - CARD_H / 2,
  };
}

export default function GameBoardScreen({ onEndGame }: Readonly<Props>) {
  const players = useGameStore(useShallow((s) => s.players));
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.round);
  const mayorId = useGameStore((s) => s.mayorId);
  const loversIds = useGameStore(useShallow((s) => s.loversIds));
  const eliminatePlayer = useGameStore((s) => s.eliminatePlayer);
  const resetGame = useGameStore((s) => s.resetGame);

  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<Player | null>(null);

  const handleLayout = (e: LayoutChangeEvent) =>
    setAreaSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

  const handleEliminate = () => {
    if (!selected) return;
    eliminatePlayer(selected.id);
    setSelected(null);
  };

  const handleEndGame = () => {
    resetGame();
    onEndGame();
  };

  const phaseLabel: Record<string, string> = {
    setup: "Setup",
    role_reveal: "Role Reveal",
    night: "Night",
    mayor_election: "Mayor Election",
    day: "Day",
    ended: "Game Over",
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.phaseText}>{phaseLabel[phase] ?? phase}</Text>
        <Text style={styles.roundText}>Round {round}</Text>
      </View>

      {/* Circle */}
      <View style={styles.circleArea} onLayout={handleLayout}>
        {areaSize.width > 0 &&
          players.map((player, i) => {
            const pos = getCardPosition(i, players.length, areaSize.width, areaSize.height);
            const isMayor = player.id === mayorId;
            const isLover = loversIds?.includes(player.id) ?? false;
            const isDead = player.status === "dead";

            return (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.card,
                  pos,
                  isDead && styles.cardDead,
                  isMayor && styles.cardMayor,
                  isLover && !isMayor && styles.cardLover,
                ]}
                onPress={() => !isDead && setSelected(player)}
                activeOpacity={isDead ? 1 : 0.7}
              >
                {isDead && <Text style={styles.deadX}>✕</Text>}
                <Text style={[styles.playerName, isDead && styles.deadText]} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={[styles.roleName, isDead && styles.deadText]} numberOfLines={1}>
                  {player.role.name}
                </Text>
                {(isMayor || isLover) && (
                  <View style={styles.badges}>
                    {isMayor && <Text style={styles.mayorBadge}>★</Text>}
                    {isLover && <Text style={styles.loverBadge}>♥</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: "#f5c518" }]} />
          <Text style={styles.legendText}>Mayor</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: "#e94560" }]} />
          <Text style={styles.legendText}>Lover</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: "#444", backgroundColor: "#222" }]} />
          <Text style={styles.legendText}>Dead</Text>
        </View>
      </View>

      {/* End game */}
      <TouchableOpacity style={styles.endBtn} onPress={handleEndGame}>
        <Text style={styles.endBtnText}>End Game</Text>
      </TouchableOpacity>

      {/* Player action modal */}
      <Modal visible={selected !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.backdrop} onPress={() => setSelected(null)} activeOpacity={1}>
          <View style={styles.modal}>
            <Text style={styles.modalName}>{selected?.name}</Text>
            <Text style={styles.modalRole}>{selected?.role.name}</Text>
            {selected?.id === mayorId && <Text style={styles.modalBadge}>★ Mayor</Text>}
            {selected && loversIds?.includes(selected.id) && (
              <Text style={[styles.modalBadge, { color: "#e94560" }]}>♥ Lover</Text>
            )}
            <TouchableOpacity style={styles.eliminateBtn} onPress={handleEliminate}>
              <Text style={styles.eliminateBtnText}>Eliminate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", paddingTop: 50, paddingBottom: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  phaseText: { fontSize: 20, fontWeight: "bold", color: "#e94560" },
  roundText: { fontSize: 16, color: "#aaa" },

  circleArea: { flex: 1, position: "relative" },

  card: {
    position: "absolute",
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "transparent",
    padding: 4,
  },
  cardMayor: { borderColor: "#f5c518" },
  cardLover: { borderColor: "#e94560" },
  cardDead: { backgroundColor: "#1e1e1e", borderColor: "#333" },

  deadX: { position: "absolute", top: 4, right: 6, color: "#555", fontSize: 12 },
  playerName: { color: "#fff", fontSize: 11, fontWeight: "bold", textAlign: "center" },
  roleName: { color: "#888", fontSize: 9, textAlign: "center", marginTop: 2 },
  deadText: { color: "#444" },

  badges: { flexDirection: "row", marginTop: 4, gap: 4 },
  mayorBadge: { color: "#f5c518", fontSize: 12 },
  loverBadge: { color: "#e94560", fontSize: 12 },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: "#16213e",
  },
  legendText: { color: "#888", fontSize: 12 },

  endBtn: {
    marginHorizontal: 24,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e94560",
    alignItems: "center",
  },
  endBtnText: { color: "#e94560", fontSize: 15, fontWeight: "bold" },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modal: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  modalName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  modalRole: { fontSize: 15, color: "#aaa", marginBottom: 8 },
  modalBadge: { color: "#f5c518", fontSize: 14, marginBottom: 4 },
  eliminateBtn: {
    backgroundColor: "#e94560",
    padding: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  eliminateBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { padding: 10, width: "100%", alignItems: "center" },
  cancelBtnText: { color: "#666", fontSize: 14 },
});
