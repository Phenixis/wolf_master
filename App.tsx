import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import SetupScreen from "./src/screens/SetupScreen";
import CardPickScreen from "./src/screens/CardPickScreen";
import MayorElectionScreen from "./src/screens/MayorElectionScreen";

type Screen = "home" | "setup" | "card_pick" | "mayor_election";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <>
      <StatusBar style="light" />
      {screen === "home" && <HomeScreen onStart={() => setScreen("setup")} />}
      {screen === "setup" && <SetupScreen onReady={() => setScreen("card_pick")} />}
      {screen === "card_pick" && (
        <CardPickScreen onDone={() => setScreen("mayor_election")} />
      )}
      {screen === "mayor_election" && (
        <MayorElectionScreen onDone={() => setScreen("home")} />
      )}
    </>
  );
}
