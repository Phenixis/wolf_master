import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, LayoutChangeEvent,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore, Player } from "../store/gameStore";

type Props = {
  onEndGame: () => void;
  nextActionLabel: string;
  onNextAction: () => void;
  onEliminate?: () => void;
};

const NIGHT = {
  bg: "#0d0d1a",
  cardBg: "#0f1629",
  cardBorder: "transparent",
  textPrimary: "#ccc",
  textSecondary: "#4a5a6a",
  textMuted: "#444",
  headerAccent: "#7c83fd",
  accent: "#7c83fd",
  modalBg: "#0f1629",
  modalBorder: "#1a2a3a",
  deadCardBg: "#0a0a0a",
  deadCardBorder: "#222",
  deadText: "#333",
  legendDotBg: "#0f1629",
};

const DAY = {
  bg: "#f2ece0",
  cardBg: "#fff",
  cardBorder: "#d8cfc0",
  textPrimary: "#1a1a1a",
  textSecondary: "#888",
  textMuted: "#999",
  headerAccent: "#c0392b",
  accent: "#c0392b",
  modalBg: "#fff",
  modalBorder: "#e0d8cc",
  deadCardBg: "#e0dbd0",
  deadCardBorder: "#bbb",
  deadText: "#aaa",
  legendDotBg: "#fff",
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

export default function GameBoardScreen({ onEndGame, nextActionLabel, onNextAction, onEliminate }: Readonly<Props>) {
  const players = useGameStore(useShallow((s) => s.players));
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.round);
  const mayorId = useGameStore((s) => s.mayorId);
  const loversIds = useGameStore(useShallow((s) => s.loversIds));
  const nightVictimId = useGameStore((s) => s.nightVictimId);
  const eliminatePlayer = useGameStore((s) => s.eliminatePlayer);
  const resetGame = useGameStore((s) => s.resetGame);
  const addLog = useGameStore((s) => s.addLog);

  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<Player | null>(null);

  const isNight = phase === "night";
  const t = isNight ? NIGHT : DAY;

  const handleLayout = (e: LayoutChangeEvent) =>
    setAreaSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

  const handleEliminate = () => {
    if (!selected) return;
    addLog("eliminated_manual", `⚔️ ${selected.name} was eliminated.`);
    const { loversIds: currentLovers, players: freshPlayers } = useGameStore.getState();
    if (currentLovers?.includes(selected.id)) {
      const otherId = currentLovers.find((id) => id !== selected.id);
      const other = freshPlayers.find((p) => p.id === otherId && p.status === "alive");
      if (other) addLog("eliminated_lover", `💔 ${other.name} died of a broken heart.`);
    }
    eliminatePlayer(selected.id);
    setSelected(null);
    onEliminate?.();
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
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.phaseText, { color: t.headerAccent }]}>{phaseLabel[phase] ?? phase}</Text>
        <Text style={[styles.roundText, { color: t.textMuted }]}>Round {round}</Text>
      </View>

      {/* Circle */}
      <View style={styles.circleArea} onLayout={handleLayout}>
        {areaSize.width > 0 &&
          players.map((player, i) => {
            const pos = getCardPosition(i, players.length, areaSize.width, areaSize.height);
            const isMayor = player.id === mayorId;
            const isLover = loversIds?.includes(player.id) ?? false;
            const isDead = player.status === "dead";
            const isTargeted = player.id === nightVictimId && !isDead;

            let cardBorder = t.cardBorder;
            if (isDead) cardBorder = t.deadCardBorder;
            else if (isTargeted) cardBorder = "#f39c12";
            else if (isMayor) cardBorder = "#f5c518";
            else if (isLover) cardBorder = "#e94560";

            let cardBg = isDead ? t.deadCardBg : t.cardBg;
            if (isTargeted) cardBg = "#1e1408";

            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.card, pos, { backgroundColor: isTargeted ? "#1e1408" : cardBg, borderColor: cardBorder }]}
                onPress={() => !isDead && setSelected(player)}
                activeOpacity={isDead ? 1 : 0.7}
              >
                {isDead && <Text style={styles.deadX}>✕</Text>}
                {isTargeted && <Text style={styles.targetedIcon}>🎯</Text>}
                <Text style={[styles.playerName, { color: isDead ? t.deadText : t.textPrimary }]} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={[styles.roleName, { color: isDead ? t.deadText : t.textSecondary }]} numberOfLines={1}>
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
          <View style={[styles.legendDot, { borderColor: "#f5c518", backgroundColor: t.legendDotBg }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Mayor</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: "#e94560", backgroundColor: t.legendDotBg }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Lover</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: "#f39c12", backgroundColor: "#1e1408" }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Targeted</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: t.deadCardBorder, backgroundColor: t.deadCardBg }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Dead</Text>
        </View>
      </View>

      {/* Next action */}
      <TouchableOpacity style={[styles.nextActionBtn, { backgroundColor: t.accent }]} onPress={onNextAction}>
        <Text style={styles.nextActionBtnText}>{nextActionLabel}</Text>
      </TouchableOpacity>

      {/* End game */}
      <TouchableOpacity style={[styles.endBtn, { borderColor: t.accent }]} onPress={handleEndGame}>
        <Text style={[styles.endBtnText, { color: t.accent }]}>End Game</Text>
      </TouchableOpacity>

      {/* Player action modal */}
      <Modal visible={selected !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.backdrop} onPress={() => setSelected(null)} activeOpacity={1}>
          <View style={[styles.modal, { backgroundColor: t.modalBg, borderColor: t.modalBorder }]}>
            <Text style={[styles.modalName, { color: t.textPrimary }]}>{selected?.name}</Text>
            <Text style={[styles.modalRole, { color: t.textSecondary }]}>{selected?.role.name}</Text>
            {selected?.id === mayorId && <Text style={styles.modalBadge}>★ Mayor</Text>}
            {selected && loversIds?.includes(selected.id) && (
              <Text style={[styles.modalBadge, { color: "#e94560" }]}>♥ Lover</Text>
            )}
            <TouchableOpacity style={styles.eliminateBtn} onPress={handleEliminate}>
              <Text style={styles.eliminateBtnText}>Eliminate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}>
              <Text style={[styles.cancelBtnText, { color: t.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingBottom: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  phaseText: { fontSize: 20, fontWeight: "bold" },
  roundText: { fontSize: 16 },

  circleArea: { flex: 1, position: "relative" },

  card: {
    position: "absolute",
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    padding: 4,
  },

  deadX: { position: "absolute", top: 4, right: 6, color: "#888", fontSize: 12 },
  targetedIcon: { position: "absolute", top: 2, right: 4, fontSize: 10 },
  playerName: { fontSize: 11, fontWeight: "bold", textAlign: "center" },
  roleName: { fontSize: 9, textAlign: "center", marginTop: 2 },

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
  },
  legendText: { fontSize: 12 },

  nextActionBtn: {
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  nextActionBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  endBtn: {
    marginHorizontal: 24,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  endBtnText: { fontSize: 15, fontWeight: "bold" },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
  },
  modalName: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  modalRole: { fontSize: 15, marginBottom: 8 },
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
  cancelBtnText: { fontSize: 14 },
});
