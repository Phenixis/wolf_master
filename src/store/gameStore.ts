import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Role } from "../data/roles";

export type PlayerStatus = "alive" | "dead";

export type Player = {
  id: string;
  name: string;
  role: Role;
  status: PlayerStatus;
};

export type GamePhase = "setup" | "role_reveal" | "night" | "mayor_election" | "day" | "ended";

export type GameLogEntry = {
  round: number;
  phase: GamePhase;
  type: string;
  message: string;
};

export type GameState = {
  players: Player[];
  pendingRoles: Role[];
  phase: GamePhase;
  round: number;
  votes: Record<string, string>; // voterId -> targetId
  nightVictimId: string | null;  // who the wolves chose this night
  witchSaveUsed: boolean;
  witchKillUsed: boolean;
  mayorId: string | null;
  loversIds: [string, string] | null;
  winner: "village" | "wolves" | "lovers" | "nobody" | null;
  gameLogs: GameLogEntry[];
};

type GameActions = {
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  registerPlayer: (name: string, role: Role) => void;
  setPendingRoles: (roles: Role[]) => void;
  assignRoles: (roles: Role[]) => void;
  setPhase: (phase: GamePhase) => void;
  eliminatePlayer: (id: string) => void;
  castVote: (voterId: string, targetId: string) => void;
  clearVotes: () => void;
  setNightVictim: (id: string | null) => void;
  useWitchSave: () => void;
  useWitchKill: (targetId: string) => void;
  setMayor: (id: string) => void;
  setLovers: (ids: [string, string]) => void;
  setWinner: (team: GameState["winner"]) => void;
  nextRound: () => void;
  resetGame: () => void;
  addLog: (type: string, message: string) => void;
};

const initialState: GameState = {
  players: [],
  pendingRoles: [],
  phase: "setup",
  round: 0,
  votes: {},
  nightVictimId: null,
  witchSaveUsed: false,
  witchKillUsed: false,
  mayorId: null,
  loversIds: null,
  winner: null,
  gameLogs: [],
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addPlayer: (name) =>
        set((state) => ({
          players: [
            ...state.players,
            {
              id: Date.now().toString(),
              name,
              // Placeholder role — will be overwritten by assignRoles
              role: { id: "villager", name: "Villager", team: "village", description: "", nightAction: false },
              status: "alive",
            },
          ],
        })),

      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        })),

      registerPlayer: (name, role) =>
        set((state) => ({
          players: [
            ...state.players,
            {
              id: Date.now().toString(),
              name,
              role,
              status: "alive",
            },
          ],
        })),

      setPendingRoles: (roles) => set({ pendingRoles: roles }),

      assignRoles: (roles) =>
        set((state) => {
          const shuffled = [...roles].sort(() => Math.random() - 0.5);
          return {
            players: state.players.map((p, i) => ({
              ...p,
              role: shuffled[i % shuffled.length],
            })),
          };
        }),

      setPhase: (phase) => set({ phase }),

      eliminatePlayer: (id) =>
        set((state) => {
          const dying = new Set([id]);
          if (state.loversIds?.includes(id)) {
            const other = state.loversIds.find((lid) => lid !== id);
            if (other) dying.add(other);
          }
          return {
            players: state.players.map((p) =>
              dying.has(p.id) ? { ...p, status: "dead" } : p
            ),
          };
        }),

      castVote: (voterId, targetId) =>
        set((state) => ({
          votes: { ...state.votes, [voterId]: targetId },
        })),

      clearVotes: () => set({ votes: {} }),

      setNightVictim: (id) => set({ nightVictimId: id }),

      useWitchSave: () => set({ witchSaveUsed: true, nightVictimId: null }),

      useWitchKill: (targetId) => {
        set((state) => {
          const dying = new Set([targetId]);
          if (state.loversIds?.includes(targetId)) {
            const other = state.loversIds.find((lid) => lid !== targetId);
            if (other) dying.add(other);
          }
          return {
            witchKillUsed: true,
            players: state.players.map((p) =>
              dying.has(p.id) ? { ...p, status: "dead" } : p
            ),
          };
        });
      },

      setMayor: (id) => set({ mayorId: id }),

      setLovers: (ids) => set({ loversIds: ids }),

      setWinner: (team) => set({ winner: team, phase: "ended" }),

      nextRound: () =>
        set((state) => ({
          round: state.round + 1,
          votes: {},
          nightVictimId: null,
          phase: "night",
        })),

      addLog: (type, message) =>
        set((state) => ({
          gameLogs: [
            ...state.gameLogs,
            { round: state.round, phase: state.phase, type, message },
          ],
        })),

      resetGame: () => set(initialState),
    }),
    {
      name: "wolf-master-game",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectAlivePlayers = (state: GameState) =>
  state.players.filter((p) => p.status === "alive");

export const selectAliveWolves = (state: GameState) =>
  state.players.filter((p) => p.status === "alive" && p.role.team === "wolves");

export const selectAliveVillagers = (state: GameState) =>
  state.players.filter((p) => p.status === "alive" && p.role.team !== "wolves");
