import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import SetupScreen from "./src/screens/SetupScreen";
import CardPickScreen from "./src/screens/CardPickScreen";
import CupidScreen from "./src/screens/CupidScreen";
import MayorElectionScreen from "./src/screens/MayorElectionScreen";
import MayorSuccessionScreen from "./src/screens/MayorSuccessionScreen";
import HunterScreen from "./src/screens/HunterScreen";
import GameBoardScreen from "./src/screens/GameBoardScreen";
import WerewolfNightScreen from "./src/screens/WerewolfNightScreen";
import SeerNightScreen from "./src/screens/SeerNightScreen";
import DayVoteScreen from "./src/screens/DayVoteScreen";
import GameOverScreen from "./src/screens/GameOverScreen";
import { useGameStore } from "./src/store/gameStore";
import { stopAll, toggleMute, isMuted } from "./src/utils/speech";
import { checkWinCondition } from "./src/utils/gameLogic";

type Screen = "home" | "setup" | "card_pick" | "cupid" | "mayor_election" | "mayor_succession" | "hunter_succession" | "game_board" | "werewolf_night" | "seer_night" | "day_vote" | "game_over";

// Night role processing order (cupid is Day 0 only, handled separately)
const NIGHT_ORDER = ["seer", "werewolf", "witch"];

// Which screen handles each role's night action (expand as screens are added)
const NIGHT_SCREENS: Partial<Record<string, Screen>> = {
  seer: "seer_night",
  werewolf: "werewolf_night",
};

const NIGHT_LABELS: Record<string, string> = {
  seer: "🔮 Seer's turn",
  werewolf: "🐺 Werewolves' turn",
  witch: "🧪 Witch's turn",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [nightQueue, setNightQueue] = useState<string[]>([]);
  const [nightQueueIdx, setNightQueueIdx] = useState(0);
  const [dayVoteCompleted, setDayVoteCompleted] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const [afterSuccession, setAfterSuccession] = useState<(() => void) | null>(null);
  const [afterHunter, setAfterHunter] = useState<(() => void) | null>(null);

  const players = useGameStore((s) => s.players);
  const phase = useGameStore((s) => s.phase);
  const nextRound = useGameStore((s) => s.nextRound);
  const setPhase = useGameStore((s) => s.setPhase);
  const eliminatePlayer = useGameStore((s) => s.eliminatePlayer);
  const setWinner = useGameStore((s) => s.setWinner);

  // If the current mayor just died, show the succession screen before continuing.
  const checkMayorSuccession = (thenDo: () => void) => {
    const { mayorId, players } = useGameStore.getState();
    if (mayorId && players.find((p) => p.id === mayorId)?.status === "dead") {
      setAfterSuccession(() => thenDo);
      setScreen("mayor_succession");
    } else {
      thenDo();
    }
  };

  // If the Hunter just died and hasn't shot yet, show the Hunter screen before continuing.
  // The hunter's shot always happens BEFORE mayor succession (so if hunter = mayor,
  // the shot resolves first, then succession is triggered in the continuation).
  const checkHunterSuccession = (thenDo: () => void) => {
    const { players, hunterShotUsed } = useGameStore.getState();
    const hasDeadHunter =
      !hunterShotUsed &&
      players.some((p) => p.role.id === "hunter" && p.status === "dead");
    if (hasDeadHunter) {
      setAfterHunter(() => thenDo);
      setScreen("hunter_succession");
    } else {
      thenDo();
    }
  };

  const checkAndRoute = () => {
    const result = checkWinCondition(useGameStore.getState());
    if (result) {
      const winMessages: Record<string, string> = {
        wolves: "🐺 The werewolves have won!",
        village: "🏡 The village has won!",
        lovers: "💕 The lovers have won!",
        nobody: "💀 Nobody wins.",
      };
      useGameStore.getState().addLog("game_over", winMessages[result.winner] ?? "Game over.");
      setWinner(result.winner);
      setScreen("game_over");
      return true;
    }
    return false;
  };

  const handleCardPickDone = () => {
    const hasCupid = players.some((p) => p.role.id === "cupid");
    setScreen(hasCupid ? "cupid" : "mayor_election");
  };

  const startNight = () => {
    // Read latest players directly to avoid stale closure
    const alivePlayers = useGameStore.getState().players.filter((p) => p.status === "alive");
    const aliveRoleIds = new Set(alivePlayers.map((p) => p.role.id));
    const queue = NIGHT_ORDER.filter((id) => aliveRoleIds.has(id));
    setNightQueue(queue);
    setNightQueueIdx(0);
    setDayVoteCompleted(false);
    nextRound(); // increments round + sets phase to "night" + clears votes/victim
  };

  const advanceNightQueue = () => {
    stopAll();
    setNightQueueIdx((idx) => idx + 1);
    setScreen("game_board");
  };

  const endNight = () => {
    stopAll();
    const { nightVictimId, players: currentPlayers, loversIds } = useGameStore.getState();
    if (nightVictimId) {
      const victim = currentPlayers.find((p) => p.id === nightVictimId);
      if (victim) {
        useGameStore.getState().addLog("eliminated_night", `🌙 ${victim.name} was killed by the werewolves.`);
        if (loversIds?.includes(nightVictimId)) {
          const otherId = loversIds.find((id) => id !== nightVictimId);
          const other = currentPlayers.find((p) => p.id === otherId && p.status === "alive");
          if (other) useGameStore.getState().addLog("eliminated_lover", `💔 ${other.name} died of a broken heart.`);
        }
      }
      eliminatePlayer(nightVictimId);
    }
    setPhase("day");
    setNightQueue([]);
    setNightQueueIdx(0);
    checkHunterSuccession(() => {
      if (!checkAndRoute()) {
        checkMayorSuccession(() => setScreen("game_board"));
      }
    });
  };

  const getNextAction = (): { label: string; handler: () => void } => {
    if (phase === "mayor_election") {
      return { label: "Start the night", handler: startNight };
    }
    if (phase === "day") {
      if (!dayVoteCompleted) {
        return {
          label: "☀️ Start the Vote",
          handler: () => setScreen("day_vote"),
        };
      }
      return { label: "Start the night", handler: startNight };
    }
    if (phase === "night") {
      if (nightQueueIdx < nightQueue.length) {
        const roleId = nightQueue[nightQueueIdx];
        return {
          label: NIGHT_LABELS[roleId] ?? "Next action",
          handler: () => {
            const target = NIGHT_SCREENS[roleId];
            if (target) {
              setScreen(target);
            } else {
              // Role has no screen yet — acknowledge and skip
              advanceNightQueue();
            }
          },
        };
      }
      return { label: "End the night", handler: endNight };
    }
    return { label: "Next action", handler: () => {} };
  };

  const nextAction = getNextAction();

  const handleToggleMute = () => {
    const next = toggleMute();
    setMuted(next);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      {screen === "home" && (
        <HomeScreen
          onStart={() => setScreen("setup")}
          onResume={() => setScreen("game_board")}
        />
      )}
      {screen === "setup" && <SetupScreen onReady={() => setScreen("card_pick")} />}
      {screen === "card_pick" && (
        <CardPickScreen onDone={handleCardPickDone} />
      )}
      {screen === "cupid" && (
        <CupidScreen onDone={() => setScreen("mayor_election")} />
      )}
      {screen === "mayor_election" && (
        <MayorElectionScreen onDone={() => setScreen("game_board")} />
      )}
      {screen === "game_board" && (
        <GameBoardScreen
          onEndGame={() => setScreen("home")}
          nextActionLabel={nextAction.label}
          onNextAction={nextAction.handler}
          onEliminate={() => {
            checkHunterSuccession(() => {
              if (!checkAndRoute()) {
                checkMayorSuccession(() => setScreen("game_board"));
              }
            });
          }}
        />
      )}
      {screen === "werewolf_night" && (
        <WerewolfNightScreen onDone={advanceNightQueue} />
      )}
      {screen === "seer_night" && (
        <SeerNightScreen onDone={advanceNightQueue} />
      )}
      {screen === "day_vote" && (
        <DayVoteScreen
          onDone={() => {
            setDayVoteCompleted(true);
            checkHunterSuccession(() => {
              if (!checkAndRoute()) {
                checkMayorSuccession(() => setScreen("game_board"));
              }
            });
          }}
        />
      )}
      {screen === "hunter_succession" && (
        <HunterScreen
          onDone={() => {
            const next = afterHunter;
            setAfterHunter(null);
            if (next) next();
          }}
        />
      )}
      {screen === "mayor_succession" && (
        <MayorSuccessionScreen
          onDone={() => {
            const next = afterSuccession;
            setAfterSuccession(null);
            if (next) next();
          }}
        />
      )}
      {screen === "game_over" && (
        <GameOverScreen onNewGame={() => setScreen("home")} />
      )}

      {/* Global mute button */}
      <View style={styles.muteContainer} pointerEvents="box-none">
        <TouchableOpacity style={styles.muteBtn} onPress={handleToggleMute}>
          <Text style={styles.muteBtnText}>{muted ? "🔇" : "🔊"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  muteContainer: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 999,
  },
  muteBtn: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  muteBtnText: { fontSize: 18 },
});
