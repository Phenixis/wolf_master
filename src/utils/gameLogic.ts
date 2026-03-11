import { GameState, Player, selectAliveWolves, selectAliveVillagers } from "../store/gameStore";

export type WinResult =
  | { winner: "wolves" }
  | { winner: "village" }
  | { winner: "lovers"; players: [Player, Player] }
  | null;

/**
 * Check win conditions after any elimination.
 * Priority: lovers win > wolves win > village win
 */
export const checkWinCondition = (state: GameState): WinResult => {
  const aliveWolves = selectAliveWolves(state);
  const aliveVillagers = selectAliveVillagers(state);
  const alivePlayers = state.players.filter((p) => p.status === "alive");

  // Lovers win: only the two lovers remain alive
  if (state.loversIds) {
    const [l1, l2] = state.loversIds;
    const bothAlive = alivePlayers.every((p) => p.id === l1 || p.id === l2);
    if (bothAlive && alivePlayers.length === 2) {
      const lover1 = state.players.find((p) => p.id === l1)!;
      const lover2 = state.players.find((p) => p.id === l2)!;
      return { winner: "lovers", players: [lover1, lover2] };
    }
  }

  // Wolves win: wolves >= villagers
  if (aliveWolves.length >= aliveVillagers.length) {
    return { winner: "wolves" };
  }

  // Village wins: no wolves left
  if (aliveWolves.length === 0) {
    return { winner: "village" };
  }

  return null;
};

/**
 * Given the current votes map, return the player id with the most votes.
 * The mayor is elected after the first night and breaks ties: their vote
 * counts as 2, effectively deciding the outcome when votes are equal.
 * Returns null only when there is a tie and no mayor has been elected yet.
 */
export const resolveVotes = (
  votes: Record<string, string>,
  mayorId: string | null
): string | null => {
  const tally: Record<string, number> = {};

  for (const [voterId, targetId] of Object.entries(votes)) {
    const weight = voterId === mayorId ? 2 : 1;
    tally[targetId] = (tally[targetId] ?? 0) + weight;
  }

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) return null; // tie
  return sorted[0][0];
};

/**
 * When a lover dies, return the surviving lover's id (if any).
 */
export const getSurvivingLover = (
  eliminatedId: string,
  loversIds: [string, string] | null,
  players: Player[]
): string | null => {
  if (!loversIds) return null;
  const [l1, l2] = loversIds;
  if (eliminatedId === l1) return players.find((p) => p.id === l2 && p.status === "alive")?.id ?? null;
  if (eliminatedId === l2) return players.find((p) => p.id === l1 && p.status === "alive")?.id ?? null;
  return null;
};
