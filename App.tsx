import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import SetupScreen from "./src/screens/SetupScreen";
import CardPickScreen from "./src/screens/CardPickScreen";
import CupidScreen from "./src/screens/CupidScreen";
import MayorElectionScreen from "./src/screens/MayorElectionScreen";
import GameBoardScreen from "./src/screens/GameBoardScreen";
import { useGameStore } from "./src/store/gameStore";

type Screen = "home" | "setup" | "card_pick" | "cupid" | "mayor_election" | "game_board";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const players = useGameStore((s) => s.players);

  const handleCardPickDone = () => {
    const hasCupid = players.some((p) => p.role.id === "cupid");
    setScreen(hasCupid ? "cupid" : "mayor_election");
  };

  return (
    <>
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
        <GameBoardScreen onEndGame={() => setScreen("home")} />
      )}
    </>
  );
}
