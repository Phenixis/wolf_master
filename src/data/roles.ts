export type Team = "village" | "wolves" | "solo";

export type Role = {
  id: string;
  name: string;
  team: Team;
  description: string;
  nightAction: boolean;
  nightPrompt?: string; // What the GM TTS says during this role's night turn
};

export const ROLES: Role[] = [
  {
    id: "villager",
    name: "Villager",
    team: "village",
    description: "A simple villager. No special power — use your wits to find the wolves.",
    nightAction: false,
  },
  {
    id: "werewolf",
    name: "Werewolf",
    team: "wolves",
    description: "Each night, wolves silently choose a villager to eliminate.",
    nightAction: true,
    nightPrompt: "Werewolves, open your eyes. Point at the player you want to eliminate. Game master, tap their name.",
  },
  {
    id: "seer",
    name: "Seer",
    team: "village",
    description: "Each night, the Seer can discover the true role of one player.",
    nightAction: true,
    nightPrompt: "Seer, open your eyes. Point at the player whose role you want to discover. Game master, tap their name.",
  },
  {
    id: "witch",
    name: "Witch",
    team: "village",
    description: "The Witch has two potions: one to save the night's victim, one to eliminate any player.",
    nightAction: true,
    nightPrompt: "Witch, open your eyes. The victim tonight is shown on screen. Do you want to use your save potion or kill potion?",
  },
  {
    id: "hunter",
    name: "Hunter",
    team: "village",
    description: "When the Hunter is eliminated, they immediately shoot another player of their choice.",
    nightAction: false,
  },
  {
    id: "cupid",
    name: "Cupid",
    team: "solo",
    description: "On the first night, Cupid links two players as lovers. If one dies, so does the other.",
    nightAction: true,
    nightPrompt: "Cupid, open your eyes. Point at the two players you want to link as lovers. Game master, tap their names.",
  },
  {
    id: "little_girl",
    name: "Little Girl",
    team: "village",
    description: "The Little Girl can spy on the wolves during the night, but risks being caught.",
    nightAction: false,
  },
];

export const getRoleById = (id: string): Role | undefined =>
  ROLES.find((r) => r.id === id);

export const getNightRoles = (): Role[] =>
  ROLES.filter((r) => r.nightAction).sort((a, b) => {
    // Night order: Cupid first, then Wolves, then Seer, then Witch
    const order = ["cupid", "werewolf", "seer", "witch"];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
