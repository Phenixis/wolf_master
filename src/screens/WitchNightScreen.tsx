import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../store/gameStore";
import { announce, stopAll } from "../utils/speech";

type Props = {
  onDone: () => void;
};

export default function WitchNightScreen({ onDone }: Readonly<Props>) {
  const allPlayers = useGameStore(useShallow((s) => s.players));
  const nightVictimId = useGameStore((s) => s.nightVictimId);
  const witchSaveUsed = useGameStore((s) => s.witchSaveUsed);
  const witchKillUsed = useGameStore((s) => s.witchKillUsed);
  const witchSave = useGameStore((s) => s.useWitchSave);
  const witchKill = useGameStore((s) => s.useWitchKill);
  const addLog = useGameStore((s) => s.addLog);

  const [actionTaken, setActionTaken] = useState<"save" | "kill" | null>(null);
  const [pickingKillTarget, setPickingKillTarget] = useState(false);
  const [killTargetId, setKillTargetId] = useState<string | null>(null);
  // Capture names before they disappear from store after actions
  const [savedVictimName, setSavedVictimName] = useState<string | null>(null);
  const [killedTargetName, setKilledTargetName] = useState<string | null>(null);

  const victim = allPlayers.find((p) => p.id === nightVictimId);
  const killTargets = allPlayers.filter((p) => p.status === "alive");

  useEffect(() => {
    const victimName = victim?.name ?? "nobody";
    announce(
      "Everyone close your eyes. Witch, open your eyes. " +
        `The werewolves have targeted ${victimName} tonight.`
    );
  }, []);

  const handleSave = () => {
    if (!victim || witchSaveUsed) return;
    setSavedVictimName(victim.name);
    addLog("witch_save", `🧪 The Witch saved ${victim.name}.`);
    witchSave();
    stopAll();
    setActionTaken("save");
  };

  const handleConfirmKill = () => {
    if (!killTargetId || witchKillUsed) return;
    const target = allPlayers.find((p) => p.id === killTargetId);
    if (!target) return;
    setKilledTargetName(target.name);
    addLog("witch_kill", `🧪 The Witch poisoned ${target.name}.`);
    witchKill(killTargetId);
    stopAll();
    setPickingKillTarget(false);
    setActionTaken("kill");
  };

  const handleDone = () => {
    stopAll();
    announce("Witch, close your eyes.");
    onDone();
  };

  const renderSavePotion = (
    v: typeof victim,
    saveUsed: boolean,
    onSave: () => void
  ) => {
    if (!saveUsed && v) {
      return (
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveBtnText}>🧪 Use Save Potion</Text>
          <Text style={styles.saveBtnSub}>Save {v.name} tonight</Text>
        </TouchableOpacity>
      );
    }
    const label = saveUsed
      ? "🧪 Save Potion — already used"
      : "🧪 Save Potion — no target tonight";
    return (
      <View style={styles.usedBtn}>
        <Text style={styles.usedBtnText}>{label}</Text>
      </View>
    );
  };

  const renderKillPotion = (killUsed: boolean, onKill: () => void) => {
    if (killUsed) {
      return (
        <View style={styles.usedBtn}>
          <Text style={styles.usedBtnText}>☠️ Kill Potion — already used</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.killBtn} onPress={onKill}>
        <Text style={styles.killBtnText}>☠️ Use Kill Potion</Text>
        <Text style={styles.killBtnSub}>Poison any alive player</Text>
      </TouchableOpacity>
    );
  };

  if (pickingKillTarget) {
    return (
      <View style={styles.container}>
        <Text style={styles.titleKill}>☠️ Kill Potion</Text>
        <Text style={styles.subtitle}>Choose a player to poison.</Text>

        <FlatList
          data={killTargets}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => {
            const isSelected = item.id === killTargetId;
            return (
              <TouchableOpacity
                style={[styles.playerBtn, isSelected && styles.selectedKillBtn]}
                onPress={() => setKillTargetId(item.id)}
              >
                <Text style={[styles.playerName, isSelected && styles.selectedText]}>
                  {item.name}
                </Text>
                {item.id === nightVictimId && (
                  <Text style={styles.victimBadge}>🎯 Wolf target</Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No players available.</Text>
          }
        />

        <TouchableOpacity
          style={[styles.confirmKillBtn, !killTargetId && styles.disabledBtn]}
          onPress={handleConfirmKill}
          disabled={!killTargetId}
        >
          <Text style={styles.confirmKillText}>Confirm Kill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            setPickingKillTarget(false);
            setKillTargetId(null);
          }}
        >
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Witch</Text>
      <Text style={styles.subtitle}>
        Everyone close your eyes.{"\n"}
        Witch, open your eyes.
      </Text>

      {/* Tonight's victim */}
      <View style={styles.victimCard}>
        <Text style={styles.victimLabel}>Tonight's target</Text>
        <Text style={styles.victimName}>{victim?.name ?? "Nobody"}</Text>
      </View>

      {/* Post-action feedback */}
      {actionTaken === "save" && (
        <View style={styles.actionResult}>
          <Text style={styles.actionResultText}>
            ✅ Save potion used — {savedVictimName} will survive the night.
          </Text>
        </View>
      )}
      {actionTaken === "kill" && (
        <View style={[styles.actionResult, styles.killResult]}>
          <Text style={styles.actionResultText}>
            ☠️ Kill potion used — {killedTargetName} has been poisoned.
          </Text>
        </View>
      )}

      {/* Potion buttons (only before any action is taken this night) */}
      {actionTaken === null && (
        <View style={styles.actions}>
          {renderSavePotion(victim, witchSaveUsed, handleSave)}
          {renderKillPotion(witchKillUsed, () => setPickingKillTarget(true))}
        </View>
      )}

      <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
        <Text style={styles.doneText}>Witch, close your eyes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d1a", padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#2ecc71", marginBottom: 8 },
  titleKill: { fontSize: 28, fontWeight: "bold", color: "#e74c3c", marginBottom: 8 },
  subtitle: { color: "#aaa", fontSize: 14, marginBottom: 24, lineHeight: 20 },

  victimCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f39c12",
    alignItems: "center",
  },
  victimLabel: { color: "#aaa", fontSize: 12, marginBottom: 6 },
  victimName: { color: "#fff", fontSize: 22, fontWeight: "bold" },

  actions: { gap: 12, marginBottom: 16 },

  saveBtn: {
    backgroundColor: "#0d2b1a",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  saveBtnText: { color: "#2ecc71", fontSize: 16, fontWeight: "bold" },
  saveBtnSub: { color: "#aaa", fontSize: 12, marginTop: 4 },

  killBtn: {
    backgroundColor: "#2b0d0d",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  killBtnText: { color: "#e74c3c", fontSize: 16, fontWeight: "bold" },
  killBtnSub: { color: "#aaa", fontSize: 12, marginTop: 4 },

  usedBtn: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  usedBtnText: { color: "#444", fontSize: 14 },

  actionResult: {
    backgroundColor: "#0d2b1a",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  killResult: {
    backgroundColor: "#2b0d0d",
    borderColor: "#e74c3c",
  },
  actionResultText: { color: "#fff", fontSize: 14, lineHeight: 20 },

  list: { flex: 1 },
  playerBtn: {
    backgroundColor: "#16213e",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedKillBtn: {
    borderWidth: 2,
    borderColor: "#e74c3c",
    backgroundColor: "#2b0d0d",
  },
  playerName: { color: "#ccc", fontSize: 16 },
  selectedText: { color: "#fff", fontWeight: "bold" },
  victimBadge: { color: "#f39c12", fontSize: 12, marginTop: 4 },
  emptyText: { color: "#555", textAlign: "center", marginTop: 20 },

  confirmKillBtn: {
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  confirmKillText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  cancelBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 10,
  },
  cancelText: { color: "#aaa", fontSize: 16 },

  doneBtn: {
    backgroundColor: "#2ecc71",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  disabledBtn: { opacity: 0.4 },
});
