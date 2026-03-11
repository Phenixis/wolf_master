# Wolf Master

Wolf Master is an application that is used on a phone to manage a party of Werewolf, a version of the game Mafia. It is designed to be used as the "game master" for the game, keeping track of players, their roles, and the flow of the game.

## Features

- Create and manage a list of players
- Assign roles to players (e.g., Werewolf, Villager, Seer)
- Keep track of the game state (e.g., day/night cycle, votes)
- Use text-to-speech to announce game events and player actions
- Provide a user-friendly interface for managing the game

---

## Game Design — How It Works

Wolf Master is designed for **one dedicated Game Master (GM)** who holds the phone throughout the entire game. Players never touch the phone.

### Night Phase
- TTS narrates each step: *"Everyone close your eyes… Wolves, open your eyes and point at your target"*
- Players silently gesture their choices
- The GM observes and taps the target on screen
- This repeats for each role with a night action (Seer, Witch, etc.)

### Day Phase
- TTS announces deaths and kicks off the discussion
- GM tracks votes by tapping player cards
- GM confirms the elimination

This approach mirrors how real Werewolf is played with a human GM — no noise, no phone passing, no secrecy issues. A multi-device mode (each player on their own phone) is considered a future v2 feature.

---

## Tech Stack

**React Native + Expo**
- Cross-platform (iOS & Android) from one codebase
- `expo-speech` covers the TTS requirement natively
- Fast iteration cycle
- No native build tooling needed for most features

---

## Data Models

```ts
type Role = {
  id: string;
  name: string; // "Werewolf", "Villager", "Seer", "Witch"...
  team: "village" | "wolves" | "solo";
  description: string;
  nightAction?: boolean;
};

type Player = {
  id: string;
  name: string;
  role: Role;
  status: "alive" | "dead";
};

type Game = {
  id: string;
  players: Player[];
  phase: "setup" | "night" | "day" | "ended";
  round: number;
  votes: Record<string, string>; // voterId -> targetId
};
```

---

## App Structure

```
src/
  screens/
    HomeScreen         # list of saved/ongoing games
    SetupScreen        # add players, pick role composition
    RoleRevealScreen   # players see their role one-by-one (private)
    GameMasterScreen   # GM dashboard: alive players, current phase
    NightScreen        # guide GM through each night role action
    DayScreen          # discussion timer, vote tracking
    ResultScreen       # winner announcement
  store/
    gameStore.ts       # Zustand store for all game state
  data/
    roles.ts           # built-in role catalogue with descriptions
  utils/
    speech.ts          # expo-speech wrapper for announcements
    gameLogic.ts       # win conditions, vote resolution
```

---

## Key Implementation Points

**1. Role assignment** — shuffle roles into a deck, then reveal one-by-one behind a "tap to see your role" screen so no one else sees.

**2. Night phase flow** — the GM is guided step-by-step: "Wolves, open your eyes → choose a victim → close your eyes → Seer, open your eyes…" with TTS reading each instruction aloud.

**3. State management** — Zustand is lightweight and perfect for toggling player status, tracking votes, and advancing phases. Persist to `AsyncStorage` so games survive app restarts.

**4. TTS** — wrap `expo-speech` with a queue so announcements don't overlap. Include a mute toggle for situations where reading aloud isn't practical.

**5. Win condition check** — run after every elimination:
- Wolves win when `wolves >= villagers`
- Villagers win when all wolves are dead

---

## Milestones

| # | Milestone |
|---|-----------|
| 1 | Player setup + role catalogue + assignment |
| 2 | Night/day cycle loop + GM dashboard |
| 3 | TTS announcement system |
| 4 | Vote tracking + elimination |
| 5 | Win detection + result screen |
| 6 | Persist games, polish UI |