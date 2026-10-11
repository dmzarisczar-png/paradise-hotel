import { Fragment, useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

/* =========================================================
   PARADISE HOTEL
   React conversion foundation based on Paradise_Hotel_V5
   Supabase is the persistence layer.
   ========================================================= */

type Page =
  | "mneme"
  | "memory"
  | "memoryDetail"
  | "home"
  | "hub"
  | "basement"
  | "management"
  | "checkin"
  | "anomalies"
  | "archives"
  | "cycles"
  | "forge"
  | "room"
  | "guide"
  | "services"
  | "gm"
  | "combat";

  

type CycleRecord = {
  id: string;
  cycle: string;
  vinylRecord: string;
  whatHappened: string;
  imageUrl: string;
};

type VinylRecord = {
  id: string;
  vinyl: string;
  vinylRecord: string;
  imageUrl: string;
};



type Core = "Mind" | "Body" | "Heart" | "Ego";

type GuestLevel =
  | "Normal Guest"
  | "Special Guest"
  | "VIP"
  | "VVIP";

type SkillName =
  | "Perception"
  | "Knowledge"
  | "Analysis"
  | "Might"
  | "Agility"
  | "Endurance"
  | "Empathy"
  | "Influence"
  | "Expression"
  | "Memory"
  | "Self"
  | "Psyche";

type Ability = {
  name: string;
  description: string;
};

type Totem = {
  id: string;
  name: string;
  description: string;
  uses: number;
};

/* =========================================================
   ANOMALY RECORDS
   ========================================================= */

type AnomalyEncounter = {
  id: string;
  label: string;
  notes: string;
  author: string;
};

type AnomalyRecord = {
  id: string;

  portrait: string;

  title: string;
  name: string;
  nature: string;
  location: string;
  role: string;

  note: string;

  status: "Active" | "Dormant" | "Destroyed";

  relatedGuestIds: string[];

  encounters: AnomalyEncounter[];

  totemName: string;
  totemDescription: string;
  totemUses: number;
};

function createAnomaly(): AnomalyRecord {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

    portrait: "",

    title: "",
    name: "",
    nature: "",
    location: "",
    role: "",

    note: "",

    status: "Active",

    relatedGuestIds: [],

    encounters: [],

    totemName: "",
    totemDescription: "",
    totemUses: 0,
  };
}

function createEncounter(): AnomalyEncounter {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

    label: "",
    notes: "",
    author: "",
  };
}

type Guest = {
  id?: string;
  name: string;
  password: string;
  stay: string;
  purpose: string;
  important: string;
  fears: string;
  trauma: string;
  lastMemory: string;
  luggage: string;
  room: string;
  title: string;
  role: string;
  role2: string;
  level: GuestLevel;
  notes: string[];

  skills: Record<SkillName, number>;

  hp: number;
  maxHp: number;
  ac: number;
  memoryPool: number;
  maxMemoryPool: number;
  movement: number;
  dread: number;

  portrait: string;
  gifts: {
  id: string;
  name: string;
  description: string;
  uses: number;
}[];

hotelNotes: string;
totems: Totem[];
abilities: Record<Core, Ability>;
};

type Dreadful = Guest & {
  originalGuestId: string;
  corruptionLevel: number;
  corruptionDescription: string;
  isRestored: boolean;
  mindDie: string;
  bodyDie: string;
  heartDie: string;
  egoDie: string;
};

type CombatState = {
  active: boolean;
  round: number;
  turnIndex: number;
  participants: string[];
  initiative: Record<string, number>;
  hp: Record<string, number>;
  log: string[];
};

const CORES: Record<
  Core,
  {
    description: string;
    skills: SkillName[];
    skillDescriptions: Record<string, string>;
  }
> = {
  Mind: {
    description: "Thought, perception, knowledge, and analysis.",
    skills: ["Perception", "Knowledge", "Analysis"],
    skillDescriptions: {
      Perception:
        "Ability to perceive your surroundings through your senses.",
      Knowledge:
        "Your understanding of information and learning things.",
      Analysis:
        "Your ability to think logically and solve problems.",
    },
  },

  Body: {
    description: "Physical strength, movement, reflexes, and endurance.",
    skills: ["Might", "Agility", "Endurance"],
    skillDescriptions: {
      Might: "Your physical strength and power.",
      Agility:
        "Your speed, reflexes, coordination, and ability to react on time.",
      Endurance:
        "Your ability to withstand physical strain.",
    },
  },

  Heart: {
    description: "Connection, influence, communication, and emotion.",
    skills: ["Empathy", "Influence", "Expression"],
    skillDescriptions: {
      Empathy:
        "Your ability to understand and connect with others.",
      Influence:
        "Your ability to persuade, deceive, and command others.",
      Expression:
        "Your ability to communicate and express yourself.",
    },
  },

  Ego: {
    description: "Identity, memory, willpower, and psychological resistance.",
    skills: ["Memory", "Self", "Psyche"],
    skillDescriptions: {
      Memory:
        "Your ability to recall and recognize experiences.",
      Self:
        "Your sense of identity and willpower.",
      Psyche:
        "Your ability to withstand psychological pressure.",
    },
  },
};

const BAR_DRINKS = [
  // FORGET
  {
    name: "The Forget-Me-Not",
    category: "Forget",
    purpose: "Forgetting",
    cost: 1,
    description:
      "A pale drink served cold. The bartender recommends it when something is better left behind.",
  },
  {
    name: "Yesterday's Rain",
    category: "Forget",
    purpose: "Forgetting",
    cost: 2,
    description:
      "A cool, quiet drink with a taste that seems to disappear before you can remember it.",
  },
  {
    name: "Blank Page",
    category: "Forget",
    purpose: "Forgetting",
    cost: 3,
    description:
      "Nearly flavorless. The bartender says it is best enjoyed when you need a little less to carry.",
  },
  {
    name: "Last Call",
    category: "Forget",
    purpose: "Forgetting",
    cost: 4,
    description:
      "A bitter drink served near closing time. Some memories seem quieter afterward.",
  },

  // CELEBRATE
  {
    name: "Second Wind",
    category: "Celebrate",
    purpose: "Celebration",
    cost: 1,
    description:
      "Bright, sweet, and impossible to drink without remembering something worth celebrating.",
  },
  {
    name: "Golden Hour",
    category: "Celebrate",
    purpose: "Celebration",
    cost: 2,
    description:
      "Warm and sparkling, like the last sunlight of a day you wish could last longer.",
  },
  {
    name: "House Party",
    category: "Celebrate",
    purpose: "Celebration",
    cost: 3,
    description:
      "Fizzy, loud, and cheerful. Somehow the Hotel always seems livelier after one.",
  },
  {
    name: "Encore",
    category: "Celebrate",
    purpose: "Celebration",
    cost: 4,
    description:
      "A sweet drink served with a tiny bell. The bartender insists that good moments deserve another round.",
  },

  // TRUTH
  {
    name: "No More Secrets",
    category: "Truth",
    purpose: "Truth",
    cost: 1,
    description:
      "Clear as glass. The bartender says it has a habit of making honest words easier to speak.",
  },
  {
    name: "Open Book",
    category: "Truth",
    purpose: "Truth",
    cost: 2,
    description:
      "A dark drink with a surprisingly gentle taste. It is difficult to keep pretending after the first sip.",
  },
  {
    name: "Straight Answer",
    category: "Truth",
    purpose: "Truth",
    cost: 3,
    description:
      "Sharp, simple, and served without decoration. The bartender does not explain what it reveals.",
  },
  {
    name: "The Confession",
    category: "Truth",
    purpose: "Truth",
    cost: 4,
    description:
      "A deep red drink that seems warmer with every sip. Some words arrive before you are ready for them.",
  },

  // PERCEPTION
  {
    name: "Looking Glass",
    category: "Perception",
    purpose: "Perception",
    cost: 1,
    description:
      "A strange shimmering drink that makes the familiar Hotel look slightly unfamiliar.",
  },
  {
    name: "Through the Veil",
    category: "Perception",
    purpose: "Perception",
    cost: 2,
    description:
      "A translucent drink with something moving beneath the surface. The bartender refuses to say what.",
  },
  {
    name: "False Bottom",
    category: "Perception",
    purpose: "Perception",
    cost: 3,
    description:
      "It tastes different every time you take a sip. Or perhaps you simply remember it differently.",
  },
  {
    name: "Room Without a Door",
    category: "Perception",
    purpose: "Perception",
    cost: 4,
    description:
      "A smoky drink that makes distant sounds seem close and familiar places strangely far away.",
  },
];

const GUEST_LEVEL_LIMITS: Record<GuestLevel, number> = {
  "Normal Guest": 15,
  "Special Guest": 30,
  VIP: 45,
  VVIP: 60,
};


const ALL_SKILLS: SkillName[] = [
  "Perception",
  "Knowledge",
  "Analysis",
  "Might",
  "Agility",
  "Endurance",
  "Empathy",
  "Influence",
  "Expression",
  "Memory",
  "Self",
  "Psyche",
];

function createEmptySkills(): Record<SkillName, number> {
  return {
    Perception: 0,
    Knowledge: 0,
    Analysis: 0,
    Might: 0,
    Agility: 0,
    Endurance: 0,
    Empathy: 0,
    Influence: 0,
    Expression: 0,
    Memory: 0,
    Self: 0,
    Psyche: 0,
  };
}

function createEmptyAbilities(): Record<Core, Ability> {
  return {
    Mind: { name: "", description: "" },
    Body: { name: "", description: "" },
    Heart: { name: "", description: "" },
    Ego: { name: "", description: "" },
  };
}

function blankGuest(): Guest {
  return {
    name: "",
    password: "",
    stay: "",
    purpose: "",
    important: "",
    fears: "",
    trauma: "",
    lastMemory: "",
    luggage: "",
    room: "",
    title: "",
    role: "",
    role2: "",
    level: "Normal Guest",

    skills: createEmptySkills(),

    hp: 0,
maxHp: 0,
dread: 0,
ac: 5,
memoryPool: 0,
maxMemoryPool: 20,
movement: 30,

    portrait: "",
    gifts: [],
    hotelNotes: "",
    totems: [],
notes: [],
abilities: createEmptyAbilities(),
  };
}

/* =========================================================
   DERIVED CHARACTER VALUES
   ========================================================= */

function coreTotal(
  guest: Guest,
  core: Core
): number {
  return CORES[core].skills.reduce(
    (total, skill) => total + Number(guest.skills[skill] || 0),
    0
  );
}

function coreDie(total: number): string {
  if (total <= 0) return "—";
  if (total <= 3) return "d4";
  if (total <= 6) return "d6";
  if (total <= 9) return "d8";
  if (total <= 12) return "d10";
  return "d12";
}
function calculateAC(guest: Guest): number {
  return (
    5 +
    guest.skills.Perception +
    guest.skills.Agility +
    guest.skills.Expression +
    guest.skills.Psyche
  );
}

function calculateHP(guest: Guest): number {
  return (
    guest.skills.Analysis +
    guest.skills.Endurance +
    guest.skills.Influence +
    guest.skills.Self
  ) * 5;
}


function calculateMemoryPool(guest: Guest): number {
  const skillTotal =
    guest.skills.Knowledge +
    guest.skills.Might +
    guest.skills.Empathy +
    guest.skills.Memory;

  return Math.min(20, skillTotal);
}



function getDreadDie(dread: number): string {
  return dread > 0
    ? `1d${dread}`
    : "—";
}

function getDreadMessage(
  dread: number,
  maxMemory: number
): string {
  if (maxMemory <= 0) {
    return "There is no Memory left to protect.";
  }

  const messages: Record<number, string> = {
    0: "You feel at peace. The Hotel is quiet. For now, there is nothing to fear.",
    1: "Something about this Hotel is not quite as it should be.",
    2: "When a light is left burning in an empty place, leave it that way.",
    3: "Some doors are locked to keep you out. Not everything inside should be allowed to spread, nor should you be allowed to contaminate it.",
    4: "If the staff tell you that a certain place is off-limits, it is usually best to listen. They may know something you do not.",
    5: "There are things in the Hotel that are harmless when left alone. Disturbing them is another matter.",
    6: "Some of the people here have duties they take very seriously. Do not mistake their kindness for safety.",
    7: "If someone calls you by a name you do not recognize, think carefully before correcting them.",
    8: "Every door leads to a world of its own. What lies beyond reflects the one who calls it home.",
    9: "Some people here know more than they let on. They have their reasons for keeping it to themselves.",
    10: "You carry too much Dread. When you return to your room, be careful what you find waiting.",
    11: "Some people here have already lived through what you have yet to discover.",
    12: "If someone mistakes you for another, do not assume that proving your identity will make things better.",
    13: "The Hotel has its caretakers. Some protect its guests. Others protect the Hotel from what its guests may become.",
    14: "There are places where being noticed means becoming something you were never meant to be.",
    15: "When someone insists you are someone else, perhaps it is safer to let them believe it.",
    16: "Not everything that harms you means to. Some simply believe they are doing what must be done.",
    17: "There are those who see contamination where others see a person. Do not give them reason to be certain.",
    18: "There are eyes above you now, and things crawling in the dark below. Neither has looked away.",
    19: "The Manager has taken note of your presence. Prepare yourself.",
    20: "The Basement awaits your arrival. Come and join them. They await you.",
  };

  const dreadLevel = Math.max(
    0,
    Math.min(20, Math.floor(dread))
  );

  return (
    messages[dreadLevel] ??
    "Something is terribly wrong. The Hotel is getting closer."
  );
}

function DreadAtmosphere({
  dread,
  maxDread,
}: {
  dread: number;
  maxDread: number;
}) {
  const safeMax = Math.max(1, maxDread);
  const safeDread = Math.max(0, Math.min(safeMax, dread));
  const ratio = safeDread / safeMax;

  const dustCount =
    safeDread > 0
      ? Math.round(25 + ratio * 125)
      : 0;

  const fogOpacity = safeDread > 0 ? 0.25 + ratio * 0.25 : 0;
  const vignetteOpacity = safeDread > 0 ? ratio * 0.4 : 0;

  return (
    <div
      className="dread-atmosphere"
      aria-hidden="true"
      style={{
        ["--dread-fog-opacity" as string]: fogOpacity,
        ["--dread-vignette-opacity" as string]: vignetteOpacity,
      }}
    >
      {safeDread > 0 && (
        <>
          <div className="dread-vignette" />
          <div className="dread-fog" />

          <div className="dread-dust">
            {Array.from({ length: dustCount }).map((_, index) => (
              <span
                key={index}
                className="dread-dust-mote"
                style={{
                  left: `${(index * 37) % 100}%`,
                  top: `${15 + ((index * 53) % 80)}%`,
                  animationDelay: `${-((index * 1.7) % 12)}s`,
                  animationDuration: `${8 + ((index * 3) % 12)}s`,
                  ["--dust-base-opacity" as string]:
                  0.12 +
                  ratio * 0.23 +
                  (index % 5 === 0 ? 0.2 : 0),
                  width: `${index % 5 === 0 ? 4 : 2 + ratio * 2}px`,
                  height: `${index % 5 === 0 ? 4 : 2 + ratio * 2}px`,
                }}
              />
            ))}
          </div>

          {safeDread > 0 
          && (
            <div
              className="dread-light-flicker"
              style={{
                animationDuration: `${Math.max(5, 12 - ratio * 6)}s`,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
function calculatePassivePerception(guest: Guest): number {
  return 13 + guest.skills.Perception;
}


function normalizeGuest(guest: Guest): Guest {
  const normalized: Guest = {
    ...blankGuest(),
    ...guest,

    skills: {
      ...createEmptySkills(),
      ...(guest.skills || {}),
    },

    abilities: {
      ...createEmptyAbilities(),
      ...(guest.abilities || {}),
    },

    totems: Array.isArray(guest.totems)
      ? guest.totems
      : [],

    
gifts: (() => {
  if (Array.isArray(guest.gifts)) {
    return guest.gifts;
  }

  if (typeof guest.gifts === "string") {
    try {
      const parsed = JSON.parse(guest.gifts);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
})(),


    
notes: (() => {
  if (Array.isArray(guest.notes)) {
    return guest.notes;
  }

  if (typeof guest.notes === "string") {
    try {
      const parsed = JSON.parse(guest.notes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
})(),

  }
  
  // ARMOR CLASS
  normalized.ac = calculateAC(normalized);

  // HP
  normalized.maxHp = calculateHP(normalized);

  if (normalized.maxHp <= 0) {
    normalized.hp = 0;
  } else {
    const hasStoredHp =
      Number.isFinite(Number(guest.hp)) &&
      (
        Number(guest.hp) !== 0 ||
        Number(guest.maxHp) > 0
      );

    if (!hasStoredHp) {
      normalized.hp = normalized.maxHp;
    } else {
      normalized.hp = Math.max(
        0,
        Math.min(
          Number(guest.hp),
          normalized.maxHp
        )
      );
    }
  }

  // MEMORY POOL
    const calculatedMemoryPool =
  calculateMemoryPool(normalized);

  const storedMaxMemoryPool =
    Number(guest.maxMemoryPool);

  // An explicit zero is valid and must be preserved.
  const hasStoredMaxMemoryPool =
    guest.maxMemoryPool !== undefined &&
    guest.maxMemoryPool !== null &&
    Number.isFinite(storedMaxMemoryPool);

  if (!hasStoredMaxMemoryPool) {
    normalized.maxMemoryPool =
      calculatedMemoryPool;
  } else {
    // Preserve permanent Memory loss.
    normalized.maxMemoryPool = Math.max(
      0,
      Math.min(
        storedMaxMemoryPool,
        calculatedMemoryPool
      )
    );
  }

  // CURRENT MEMORY
  if (normalized.maxMemoryPool <= 0) {
    normalized.memoryPool = 0;
  } else {
    const storedMemoryPool =
      Number(guest.memoryPool);

    if (!Number.isFinite(storedMemoryPool)) {
      normalized.memoryPool =
        normalized.maxMemoryPool;
    } else {
      normalized.memoryPool = Math.max(
        0,
        Math.min(
          storedMemoryPool,
          normalized.maxMemoryPool
        )
      );
    }
  }

  return normalized;
}

const ROLE_PROFICIENCIES: Record<string, string[]> = {
  Caretaker: ["Empathy", "Knowledge", "Agility"],
  Dreamer: ["Might", "Expression", "Self"],
  Guardian: ["Endurance", "Perception", "Psyche"],
  Adversary: ["Might", "Agility", "Endurance"],
  Archivist: ["Knowledge", "Analysis", "Memory"],
  Diplomat: ["Expression", "Influence", "Self"],
  Watcher: ["Perception", "Empathy", "Influence"],
  Vessel: ["Memory", "Psyche", "Analysis"],
};


const ROLE_DETAILS: Record<
  string,
  {
    description: string;
    action: string;
    passive: string;
  }
> = {
  Caretaker: {
    description: "Provides care, comfort, and support to others.",
    action: "Gentle Hands",
    passive: "Care Bear",
  },

  Dreamer: {
    description: "Shapes dreams, imagination, and nightmares.",
    action: "Twin Forms: Daydream or Nightmare",
    passive: "Dreamwalk",
  },

  Guardian: {
    description: "Protects others from danger and harm.",
    action: "Come At Me",
    passive: "Iron Clad",
  },

  Adversary: {
    description: "Confronts threats through aggression and opposition.",
    action: "Weaponized",
    passive: "Berserk Blood",
  },

  Archivist: {
    description: "Preserves memories, records, and forgotten truths.",
    action: "Paper Trail",
    passive: "True Record",
  },

  Diplomat: {
    description: "Resolves conflicts through communication and influence.",
    action: "Social Butterfly",
    passive: "Charming",
  },

  Watcher: {
    description: "Observes events and notices what others miss.",
    action: "Passive Stance",
    passive: "Camera View",
  },

  Vessel: {
    description: "Connects with or serves as a bridge between others.",
    action: "One Body",
    passive: "Bridge",
  },
};

const ROLE_GUIDE_DETAILS: Record<
  string,
  {
    description: string;
    actionDescription: string;
    passiveDescription: string;
  }
> = {
  Caretaker: {
    description:
      "You look after the people around you. You keep others calm, help them recover, and make sure nobody is left behind.",
    actionDescription:
      "You are able to provide care for those in need. Healing and comfort are your specialty. Any items that can give either two, food or a simple bandage will inherit your healing or comforting effect.",
    passiveDescription:
      "You know how someone feels using your perception. You know their pain and worries as if it is yours, cause the moment you touch them, you own it too.",
  },

  Dreamer: {
    description:
      "You see things in a different light than the others. You are either optimistic or pessimistic. You either ignore the darkness that lurks or embrace it.",
    actionDescription:
      "You pull a wool of wonder in your eyes and see things in a silver lining. You believe in happy endings and that the good guys will win. You give a +3 in rolls for people around you (15ft).",
    passiveDescription:
      "You are always in a state of dream. Everything is hazy and you don't recall information as much as other people.",
  },

  Guardian: {
    description:
      "You are the one who stands between everyone else and danger. You don't have time to be afraid. You don't have time to wonder why the monsters are here.",
    actionDescription:
      "You are able to force a monster to focus on you. Choose a monster within 30 ft that can see or hear you. You force its attention onto you.",
    passiveDescription:
      "You are the least affected by Dread. You are too busy protecting everyone else, you simply forgot to check on yourself.",
  },

  Adversary: {
    description:
      "You face problems head-on. When something stands in your way, you don't hesitate to confront it, break it, or make it regret ever getting in your way.",
    actionDescription:
      "Any object you touch inherits your will to harm. It changes form into any weapon you wish to wield, except for projectile weapons. The object can become the weapon itself, but it cannot create or transform the bullets, arrows, or other projectiles needed to use it.",
    passiveDescription:
      "You are prone to losing control, especially when affected by Dread. Each successful attack feeds your Berserk. The more you attack, the deeper you lose yourself to it.",
  },

  Archivist: {
    description:
      "You remember what others forget. You collect information, recognize patterns, and hold onto details that might otherwise disappear.",
    actionDescription:
      "Everyone leaves a record. Nothing comes and goes without the Hotel knowing—not even the dead.",
    passiveDescription:
      "You never forget a detail. Once seen, once read, once heard, it stays with you.",
  },

  Diplomat: {
    description:
      "You understand people. You know when to speak, when to listen, when to persuade, and when a small lie might make things easier.",
    actionDescription:
      "You can talk your way through almost anything, even with Anomalies hungry for your memories.",
    passiveDescription:
      "You are naturally likeable. You radiate a soothing aura that helps calm anger and ease emotions that cloud the mind and heart.",
  },

  Watcher: {
    description:
      "You watch and observe from the outside. You can remain a spectator to what unfolds around you, untouched by the encounters happening before your eyes.",
    actionDescription:
      "You can enter Passive Stance once per encounter. At the beginning of Initiative, you may declare Passive Stance and remain outside the encounter.",
    passiveDescription:
      "You can view the world through the lenses of the Hotel's cameras; seeing the past, present, or future."
  },

  Vessel: {
    description:
      "You are everyone and no one. Their memories, their feelings, their dreams, their fears—all of it lives within you, even if you don't know why.",
    actionDescription:
      "You are able to draw upon the strengths of those around you. For a brief moment, you become more than yourself, taking on an ability or trait belonging to another Guest.",
    passiveDescription:
      "You are able to form a bridge between you and a chosen target. There is no limit to how many bridges, it's just that it must be with consent. The deeper the connection, the sturdier the bridge, the easier it is to draw powers from others.",
  },
};

function RoleHover({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        cursor: description ? "help" : "default",
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {label}

      {show && description && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(100% + 10px)",
            transform: "translateX(-50%)",
            width: 280,
            padding: 12,
            background: colors.panel2,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: 13,
            lineHeight: 1.5,
            zIndex: 1000,
            pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,.35)",
          }}
        >
          {description}
        </div>
      )}
    </span>
  );
}

/* =========================================================
   GENERIC UI
   ========================================================= */

const colors = {
  bg: "#080b0a",
  panel: "rgba(20, 24, 21, .94)",
  panel2: "rgba(27, 31, 27, .96)",
  gold: "#c8b991",
  goldBright: "#e4d19c",
  text: "#eee9dc",
  muted: "#9d9a8d",
  danger: "#a65b5b",
  green: "#657d65",
  border: "rgba(200,185,145,.24)",
};

const HOTEL_BACKGROUND =
  "/public/paradise-hotel-background.jpg";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
 backgroundImage:
  `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
  color: colors.text,
  fontFamily:
    "Georgia, 'Times New Roman', serif",
};

const containerStyle: React.CSSProperties = {
  width: "min(1180px, calc(100% - 32px))",
  margin: "0 auto",
};

const panelStyle: React.CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,.35)",
};

const buttonStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: "rgba(200,185,145,.08)",
  color: colors.goldBright,
  padding: "12px 18px",
  borderRadius: 6,
  cursor: "pointer",
  letterSpacing: ".12em",
  fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(0,0,0,.28)",
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  padding: "12px 14px",
  outline: "none",
};

function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...buttonStyle,
        opacity: disabled ? 0.45 : 1,
        background: secondary
          ? "rgba(255,255,255,.025)"
          : "rgba(200,185,145,.1)",
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
        marginBottom: 16,
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: colors.gold,
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
        marginBottom: 16,
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: colors.gold,
        }}
      >
        {label}
      </span>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{
          ...inputStyle,
          resize: "vertical",
        }}
      />
    </label>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function App() {

  const [memoryCreatorOpen, setMemoryCreatorOpen] = useState(false);
  const [memoryEditOpen, setMemoryEditOpen] = useState(false);
  const [memoryName, setMemoryName] = useState("");
  const [memoryHolder, setMemoryHolder] = useState("");
  const [memoryImageUrl, setMemoryImageUrl] = useState("");
  const [memoryDetails, setMemoryDetails] = useState("");
  const [memories, setMemories] = useState<
  {
    id: string;
    name: string;
    holder: string;
    imageUrl: string;
    details: string;
  }[]
>([]);

const [dreadGained, setDreadGained] = useState(false);

const [selectedMemory, setSelectedMemory] = useState<{
  id: string;
  name: string;
  holder: string;
  imageUrl: string;
  details: string;
} | null>(null);

useEffect(() => {
  const loadMemories = async () => {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase memories:", error);
      return;
    }

    setMemories(
      (data ?? []).map((row) => ({
        id: row.id,
        name: row.name ?? "",
        holder: row.holder ?? "",
        imageUrl: row.image_url ?? "",
        details: row.details ?? "",
      }))
    );
  };

  loadMemories();
}, []);

  const [barMenuOpen, setBarMenuOpen] = useState(false);

  const [todaysDrinks, setTodaysDrinks] = useState<typeof BAR_DRINKS>([]);

  const [selectedDrink, setSelectedDrink] = useState<(typeof BAR_DRINKS)[number] | null>(null);

  const [loungeBarOpen, setLoungeBarOpen] = useState(false);

  const [page, setPage] = useState<Page>("home");

  
const [cycleRecords, setCycleRecords] = useState<CycleRecord[]>([]);
const [vinylRecords, setVinylRecords] = useState<VinylRecord[]>([]);

const [cycleDraft, setCycleDraft] = useState({
  cycle: "",
  vinylRecord: "",
  whatHappened: "",
  imageUrl: "",
});

const [vinylDraft, setVinylDraft] = useState({
  vinyl: "",
  vinylRecord: "",
  imageUrl: "",
});

const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
const [editingVinylId, setEditingVinylId] = useState<string | null>(null);

const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
const [selectedVinylId, setSelectedVinylId] = useState<string | null>(null);
const [activeCycleModal, setActiveCycleModal] = useState<CycleRecord | null>(null);
const [activeVinylModal, setActiveVinylModal] = useState<VinylRecord | null>(null);


const loadCycleRecords = async () => {
  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase Cycle load error:", error);
    alert(`Could not load Cycles: ${error.message}`);
    return;
  }

  setCycleRecords(
    (data ?? []).map((row) => ({
      id: row.id,
      cycle: row.cycle ?? "",
      vinylRecord: row.vinyl_record ?? "",
      whatHappened: row.what_happened ?? "",
      imageUrl: row.image_url ?? "",
    }))
  );
};

useEffect(() => {
  void loadCycleRecords();
  void loadVinylRecords();
}, []);


const loadVinylRecords = async () => {
  const { data, error } = await supabase
    .from("vinyl_records")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase Vinyl load error:", error);
    alert(`Could not load Vinyl records: ${error.message}`);
    return;
  }

  setVinylRecords(
    (data ?? []).map((row) => ({
      id: row.id,
      vinyl: row.vinyl ?? "",
      vinylRecord: row.vinyl_record ?? "",
      imageUrl: row.image_url ?? "",
    }))
  );
};

  const [basementPassword, setBasementPassword] = useState("");
  const [basementError, setBasementError] = useState("");
  const [basementAccepted, setBasementAccepted] = useState(false);
  useEffect(() => {
  if (!basementAccepted) return;

  const timeout = window.setTimeout(() => {
    setPage("home");
    setBasementPassword("");
    setBasementError("");
    setBasementAccepted(false);
  }, 30000);

  return () => window.clearTimeout(timeout);
}, [basementAccepted]);
  
  const [showDreadlingForm, setShowDreadlingForm] = useState(false);
  
  const [dreadlingDraft, setDreadlingDraft] = useState({
  name: "",
  imageUrl: "",
  sourceOfTrauma: "",
  appearance: "",
  behavior: "",
  hp: "10",
  ac: "10",
  encounterAbility: "",
  mindDie: "1d4",
  bodyDie: "1d4",
  heartDie: "1d4",
  egoDie: "1d4",
});



const saveCycleRecord = async () => {
  if (!cycleDraft.cycle.trim()) {
    alert("Please enter a Cycle name.");
    return;
  }

  const recordId = editingCycleId || crypto.randomUUID();

  const payload = {
    id: recordId,
    cycle: cycleDraft.cycle,
    vinyl_record: cycleDraft.vinylRecord,
    what_happened: cycleDraft.whatHappened,
    image_url: cycleDraft.imageUrl,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("cycles")
    .upsert(payload);

  if (error) {
    console.error("Supabase Cycle save error:", error);
    alert(`Could not save Cycle: ${error.message}`);
    return;
  }

  const savedRecord: CycleRecord = {
    id: recordId,
    ...cycleDraft,
  };

  setCycleRecords((records) =>
    editingCycleId
      ? records.map((record) =>
          record.id === recordId ? savedRecord : record
        )
      : [...records, savedRecord]
  );

  setCycleDraft({
    cycle: "",
    vinylRecord: "",
    whatHappened: "",
    imageUrl: "",
  });

  setEditingCycleId(null);
  setSelectedCycleId(null);
};



const editCycleRecord = (record: CycleRecord) => {
  setCycleDraft({
    cycle: record.cycle,
    vinylRecord: record.vinylRecord,
    whatHappened: record.whatHappened,
    imageUrl: record.imageUrl || "",
  });
  setEditingCycleId(record.id);
  setSelectedCycleId(record.id);
};


const deleteCycleRecord = async (id: string) => {
  if (!window.confirm("Delete this Cycle record?")) return;

  const { error } = await supabase
    .from("cycles")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase Cycle delete error:", error);
    alert(`Could not delete Cycle: ${error.message}`);
    return;
  }

  setCycleRecords((records) =>
    records.filter((record) => record.id !== id)
  );

  if (selectedCycleId === id) {
    setSelectedCycleId(null);
  }

  if (editingCycleId === id) {
    setEditingCycleId(null);
    setCycleDraft({
      cycle: "",
      vinylRecord: "",
      whatHappened: "",
      imageUrl: "",
    });
  }
};

const editVinylRecord = (record: VinylRecord) => {
  setVinylDraft({
  vinyl: record.vinyl,
  vinylRecord: record.vinylRecord,
  imageUrl: record.imageUrl || "",
});

  setEditingVinylId(record.id);
  setSelectedVinylId(record.id);
};


const deleteVinylRecord = async (id: string) => {
  if (!window.confirm("Delete this Vinyl record?")) return;

  const { error } = await supabase
    .from("vinyl_records")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase Vinyl delete error:", error);
    alert(`Could not delete Vinyl: ${error.message}`);
    return;
  }

  setVinylRecords((records) =>
    records.filter((record) => record.id !== id)
  );

  if (selectedVinylId === id) {
    setSelectedVinylId(null);
  }

  if (editingVinylId === id) {
    setEditingVinylId(null);
    setVinylDraft({
      vinyl: "",
      vinylRecord: "",
      imageUrl: "",
    });
  }
};

const saveVinylRecord = async () => {
  if (!vinylDraft.vinyl.trim()) {
    alert("Please enter a Vinyl name.");
    return;
  }

  const recordId = editingVinylId || crypto.randomUUID();

  const payload = {
    id: recordId,
    vinyl: vinylDraft.vinyl,
    vinyl_record: vinylDraft.vinylRecord,
    image_url: vinylDraft.imageUrl,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("vinyl_records")
    .upsert(payload);

  if (error) {
    console.error("Supabase Vinyl save error:", error);
    alert(`Could not save Vinyl: ${error.message}`);
    return;
  }

  const savedRecord: VinylRecord = {
    id: recordId,
    ...vinylDraft,
  };

  setVinylRecords((records) =>
    editingVinylId
      ? records.map((record) =>
          record.id === recordId ? savedRecord : record
        )
      : [...records, savedRecord]
  );

  setVinylDraft({
    vinyl: "",
    vinylRecord: "",
    imageUrl: "",
  });

  setEditingVinylId(null);
  setSelectedVinylId(null);
};
  
type Dreadling = {
  id: string;
  name: string;
  imageUrl: string;
  sourceOfTrauma: string;
  appearance: string;
  behavior: string;
  hp: string;
  ac: string;
  encounterAbility: string;
  mindDie: string;
  bodyDie: string;
  heartDie: string;
  egoDie: string;
};

const [dreadlings, setDreadlings] = useState<
  {
    id: string;
    name: string;
    imageUrl: string;
    sourceOfTrauma: string;
    appearance: string;
    behavior: string;
    hp: string;
    ac: string;
    encounterAbility: string;
    mindDie: string;
    bodyDie: string;
    heartDie: string;
    egoDie: string;
  }[]
>(() => {
  try {
    const saved = localStorage.getItem("paradiseHotelDreadlings");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
});


useEffect(() => {
  const loadDreadlings = async () => {
    const { data, error } = await supabase
      .from("dreadlings")
      .select("id, data");

    if (error) {
      console.error("Failed to load Dreadlings:", error);
      return;
    }

    if (data && data.length > 0) {
      const savedDreadlings = data.map(
        (row) => row.data as Dreadling
      );

      setDreadlings(savedDreadlings);

      localStorage.setItem(
        "paradiseHotelDreadlings",
        JSON.stringify(savedDreadlings)
      );
      return;
    }

    const saved = localStorage.getItem("paradiseHotelDreadlings");

    if (saved) {
      try {
        const existingDreadlings: Dreadling[] = JSON.parse(saved);

        if (existingDreadlings.length > 0) {
          const { error: saveError } = await supabase
            .from("dreadlings")
            .upsert(
              existingDreadlings.map((item) => ({
                id: item.id,
                data: item,
              }))
            );

          if (saveError) {
            console.error("Failed to migrate Dreadlings:", saveError);
          }
        }
      } catch (parseError) {
        console.error("Failed to read saved Dreadlings:", parseError);
      }
    }
  };

  void loadDreadlings();
}, []);

const [dreadfuls, setDreadfuls] = useState<Dreadful[]>(() => {
  try {
    const saved = localStorage.getItem("paradiseHotelDreadfuls");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
});



useEffect(() => {
  const loadDreadfuls = async () => {
    const { data, error } = await supabase
      .from("dreadfuls")
      .select("id, data");

    if (error) {
      console.error("Failed to load Dreadfuls:", error);
      return;
    }

    if (data && data.length > 0) {
      const savedDreadfuls = data.map(
        (row) => row.data as Dreadful
      );

      setDreadfuls(savedDreadfuls);

      localStorage.setItem(
        "paradiseHotelDreadfuls",
        JSON.stringify(savedDreadfuls)
      );
      return;
    }

    // If Supabase is empty, migrate existing local records.
    const saved = localStorage.getItem("paradiseHotelDreadfuls");

    if (saved) {
      try {
        const existingDreadfuls: Dreadful[] = JSON.parse(saved);

        if (existingDreadfuls.length > 0) {
          const { error: saveError } = await supabase
            .from("dreadfuls")
            .upsert(
              existingDreadfuls.map((item) => ({
                id: item.id,
                data: item,
              }))
            );

          if (saveError) {
            console.error("Failed to migrate Dreadfuls:", saveError);
          }
        }
      } catch (parseError) {
        console.error("Failed to read saved Dreadfuls:", parseError);
      }
    }
  };

  void loadDreadfuls();
}, []);

const [selectedGuestId, setSelectedGuestId] = useState("");
const [showDreadfulForm, setShowDreadfulForm] = useState(false);
const [dreadfulCorruptionLevel, setDreadfulCorruptionLevel] = useState("1");
const [dreadfulCorruptionDescription, setDreadfulCorruptionDescription] = useState("");

const [dreadfulDice, setDreadfulDice] = useState({
  mindDie: "1d4",
  bodyDie: "1d4",
  heartDie: "1d4",
  egoDie: "1d4",
});

  const [selectedDreadful, setSelectedDreadful] = useState<Dreadful | null>(null);
  const [selectedDreadling, setSelectedDreadling] = useState<Dreadling | null>(null);

  const GM_PASSWORD = "allofusareallan";

  const [gmPassword, setGmPassword] = useState("");
  
  const [gmUnlocked, setGmUnlocked] = useState(
  sessionStorage.getItem("gmUnlocked") === "true"
);

  const [roomTab, setRoomTab] =
    useState<"combat" | "information">("combat");

  const [roomChoice, setRoomChoice] = useState<
    "roll" | "existing" | null
  >(null);

  const [checkInStep, setCheckInStep] = useState<
    "registration" | "room" | "assessment"
  >("registration");

  const [roomRolling, setRoomRolling] = useState(false);

  const [roomMessage, setRoomMessage] = useState("");

  const [guest, setGuest] = useState<Guest>(
    blankGuest()
  );

  const [gmSelectedGuestId, setGmSelectedGuestId] = useState("");

  const [gmEditingGuestId, setGmEditingGuestId] = useState("");
  const [gmEditingRoom, setGmEditingRoom] = useState("");
  const [gmEditingPassword, setGmEditingPassword] = useState("");

  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedCombatDreadlingCount, setSelectedCombatDreadlingCount] =
  useState(1);
  const [selectedCombatGuest, setSelectedCombatGuest] = useState("");
  const [selectedCombatDreadling, setSelectedCombatDreadling] = useState("");

  const [recoveryAmounts, setRecoveryAmounts] =
  useState<Record<string, number>>({});

/* -------------------------------------------------------
   ANOMALY RECORDS
   ------------------------------------------------------- */

const [anomalies, setAnomalies] =
  useState<AnomalyRecord[]>([]);

const [guideRoleIndex, setGuideRoleIndex] = useState(0);

useEffect(() => {
  const saveAnomalies = async () => {
    try {
      const rows = anomalies.map(anomalyToRow);

      const { error } = await supabase
        .from("anomalies")
        .upsert(rows, { onConflict: "id" });

if (error) {
console.error(
  "Supabase anomaly save error:",
  error.message,
  error.details,
  error.hint,
  error.code
);  return;
}

    } catch (error) {
      console.error(
        "Could not save anomaly records:",
        error
      );
    }
  };

  if (anomalies.length > 0) {
    saveAnomalies();
  }
}, [anomalies]);

useEffect(() => {
  const loadAnomalies = async () => {
    try {
      const { data, error } = await supabase
        .from("anomalies")
        .select("*");

      if (error) {
        throw error;
      }

console.log("Supabase anomalies:", data);

setAnomalies((data ?? []).map(rowToAnomaly));    } catch (error) {
      console.error(
        "Could not load anomaly records:",
        error
      );
    }
  };

  loadAnomalies();
}, []);

const [anomalySearch, setAnomalySearch] =
  useState("");

const [openAnomalyId, setOpenAnomalyId] =
  useState<string | null>(null);


  const [loginRoom, setLoginRoom] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [combat, setCombat] = useState<CombatState>({
    active: false,
    round: 1,
    turnIndex: 0,
    participants: [],
    initiative: {},
    hp: {},
    log: [],
  });

  
const [combatLoaded, setCombatLoaded] = useState(false);

useEffect(() => {
  try {
    const savedCombat = localStorage.getItem("paradiseHotelCombat");

    if (savedCombat) {
      const parsed = JSON.parse(savedCombat) as CombatState;

      setCombat({
        active: parsed.active ?? false,
        round: parsed.round ?? 1,
        turnIndex: parsed.turnIndex ?? 0,
        participants: Array.isArray(parsed.participants)
          ? parsed.participants
          : [],
        initiative: parsed.initiative ?? {},
        hp: {},
        log: Array.isArray(parsed.log) ? parsed.log : [],
      });
    }
  } catch (error) {
    console.error("Could not restore saved combat:", error);
  } finally {
    setCombatLoaded(true);
  }
}, []);

useEffect(() => {
  if (!combatLoaded) return;

  try {
    localStorage.setItem(
      "paradiseHotelCombat",
      JSON.stringify(combat)
    );
  } catch (error) {
    console.error("Could not save combat:", error);
  }
}, [combat, combatLoaded]);

  const currentGuest = useMemo(
  () => {
    if (gmUnlocked && gmSelectedGuestId) {
      const selectedGuest = guests.find(
        (g) => g.id === gmSelectedGuestId
      );

      if (selectedGuest) {
        return normalizeGuest(selectedGuest);
      }
    }

    return normalizeGuest(guest);
  },
  [guest, guests, gmUnlocked, gmSelectedGuestId]
);

  /* -------------------------------------------------------
     LOAD CHARACTERS
     ------------------------------------------------------- */

  useEffect(() => {
    loadGuests();
  }, []);

  /* -------------------------------------------------------
   SAVE ANOMALY RECORDS
   ------------------------------------------------------- */

  async function loadGuests() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("room", { ascending: true });

      if (error) {
        console.warn("Supabase character load:", error);
        setGuests([]);
        return;
      }

      if (Array.isArray(data)) {
        setGuests(
          data.map((row) =>
            normalizeGuest({
  ...row,
  memoryPool:
    row.memoryPool ??
    row.memory_pool ??
    row.memory ??
    0,

  maxMemoryPool:
    row.maxMemoryPool ??
    row.max_memory_pool ??
    20,
          })
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }
  
    
useEffect(() => {
  const channel = supabase
    .channel("battle-grounds-character-updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "characters",
      },
      () => {
        void loadGuests();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}, []);

  /* -------------------------------------------------------
     GUEST UPDATE
     ------------------------------------------------------- */

  function updateGuest<K extends keyof Guest>(
    key: K,
    value: Guest[K]
  ) {
    setGuest((previous) =>
      normalizeGuest({
        ...previous,
        [key]: value,
      })
    );
  }

  async function rollGuestRoom() {
    if (roomRolling) return;

    setRoomRolling(true);
    setRoomMessage("");

    try {
      const { data, error } = await supabase
        .from("characters")
        .select("room");

      if (error) {
        throw error;
      }

      const occupiedRooms = new Set(
        (data ?? [])
          .map((row) => Number(row.room))
          .filter(
            (room) =>
              Number.isInteger(room) &&
              room >= 1 &&
              room <= 99
          )
      );

      let rolledRoom = 0;

      do {
        rolledRoom =
          Math.floor(Math.random() * 99) + 1;
      } while (occupiedRooms.has(rolledRoom));

      updateGuest(
        "room",
        String(rolledRoom)
      );

      setRoomMessage(
        `The Hotel has assigned Room ${rolledRoom}.`
      );
    } catch (error) {
      console.error(error);

      setRoomMessage(
        "The Hotel could not check room availability. Please try again."
      );
    } finally {
      setRoomRolling(false);
    }
  }

  function useExistingRoom(roomNumber: string) {
    const room = Number(roomNumber);

    if (
      !Number.isInteger(room) ||
      room < 0 ||
      room > 100
    ) {
      setRoomMessage(
        "Please enter a valid room number from 0 to 100."
      );
      return;
    }

    updateGuest(
      "room",
      String(room)
    );

    setRoomMessage(
      `Existing Room ${room} has been entered.`
    );
  }

function getTotalSkillPoints(skills: Record<SkillName, number>): number {
  return ALL_SKILLS.reduce(
    (total, skill) => total + Number(skills[skill] || 0),
    0
  );
}



function updateDread(value: number) {
  const safeValue = Math.max(
    0,
    Math.min(20, Number(value) || 0)
  );

  setGuest((previous) => {
    if (safeValue > previous.dread) {
      setDreadGained(true);
    }

    if (safeValue === 0) {
      setDreadGained(false);
    }

    return normalizeGuest({
      ...previous,
      dread: safeValue,
    });
  });
}


function cycleRecovery() {
  setGuest((previous) => {
    const currentMaxMemory = Math.max(
      0,
      Number(previous.maxMemoryPool) || 0
    );

    const currentMemory = Math.max(
      0,
      Number(previous.memoryPool) || 0
    );

    // Restore half the maximum Memory Pool, rounding up.
    const recoveryAmount = Math.ceil(
      currentMaxMemory / 2
    );

    const recoveredMemory = Math.min(
      currentMaxMemory,
      currentMemory + recoveryAmount
    );

    const updatedGuest = normalizeGuest({
      ...previous,
      memoryPool: recoveredMemory,
    });

    saveGuest(updatedGuest);
    return updatedGuest;
  });
}

function recovery() {
  setGuest((previous) => {
    const currentMemory = Math.max(
      0,
      Number(previous.memoryPool) || 0
    );

    const currentDread = Math.max(
      0,
      Number(previous.dread) || 0
    );

    // Spend current Memory Pool 1:1 to remove Dread.
    const recoveryAmount = Math.min(
      currentMemory,
      currentDread
    );

    const updatedGuest = normalizeGuest({
      ...previous,
      memoryPool: currentMemory - recoveryAmount,
      dread: currentDread - recoveryAmount,
    });

    saveGuest(updatedGuest);
    return updatedGuest;
  });
}



function forceRecovery() {
  setGuest((previous) => {
    const currentMemory = Math.max(
      0,
      Number(previous.memoryPool) || 0
    );

    const currentMaxMemory = Math.max(
      0,
      Number(previous.maxMemoryPool) || 0
    );

    const currentDread = Math.max(
      0,
      Number(previous.dread) || 0
    );

    // Sacrifice maximum Memory to remove Dread.
    const recoveryAmount = Math.min(
      currentMaxMemory,
      currentDread
    );

    const newMaxMemory = Math.max(
      0,
      currentMaxMemory - recoveryAmount
    );

    console.log("FORCE RECOVERY BEFORE NORMALIZE:", {
    currentMemory,
    currentMaxMemory,
    currentDread,
    recoveryAmount,
    newMaxMemory,
  });

    const updatedGuest = normalizeGuest({
      ...previous,
      memoryPool: Math.min(
        currentMemory,
        newMaxMemory
      ),
      maxMemoryPool: newMaxMemory,
      dread: Math.max(
        0,
        currentDread - recoveryAmount
      ),
    });

    console.log("FORCE RECOVERY AFTER NORMALIZE:", {
    memoryPool: updatedGuest.memoryPool,
    maxMemoryPool: updatedGuest.maxMemoryPool,
    dread: updatedGuest.dread,
  });

    saveGuest(updatedGuest);

    return updatedGuest;
  });
}

 async function recoverMaxMemory(
  guestId: string
) {
console.log(
  "RECOVERY DEBUG:",
  guestId,
  recoveryAmounts[guestId]
);

  const amount =
    Number(recoveryAmounts[guestId]) || 0;

  if (amount <= 0) {
    return;
  }

  const target = guests.find(
    (g) => g.id === guestId
  );

  if (!target) {
    return;
  }

  const naturalMaxMemory =
    calculateMemoryPool(target);

  const currentMaxMemory =
    Number(target.maxMemoryPool) || 0;

  const recoveryAmount = Math.min(
    amount,
    Math.max(
      0,
      naturalMaxMemory - currentMaxMemory
    )
  );

  if (recoveryAmount <= 0) {
    return;
  }

  const newMaxMemory =
    currentMaxMemory + recoveryAmount;

  const newMemoryPool = Math.min(
    Number(target.memoryPool) || 0,
    newMaxMemory
  );

  const { error } = await supabase
    .from("characters")
    .update({
      max_memory_pool: newMaxMemory,
      memory_pool: newMemoryPool,
    })
    .eq("id", guestId)
    .select()
    .single();

  if (error) {
    console.error(
      "Max Memory recovery error:",
      error
    );
    return;
  }

const updatedGuest = {
  ...target,
  memoryPool: newMemoryPool,
  maxMemoryPool: newMaxMemory,
};

  setGuests((previous) =>
    previous.map((g) =>
      g.id === guestId
        ? updatedGuest
        : g
    )
  );

  saveGuest(updatedGuest);

  setRecoveryAmounts((previous) => ({
    ...previous,
    [guestId]: 0,
  }));
}

  /* =========================================================
   ANOMALY FUNCTIONS
   ========================================================= */

function anomalyToRow(anomaly: AnomalyRecord) {
  return {
    id: anomaly.id,
    portrait: anomaly.portrait,
    title: anomaly.title,
    name: anomaly.name,
    nature: anomaly.nature,
    location: anomaly.location,
    role: anomaly.role,
    note: anomaly.note,
    status: anomaly.status,
    related_guest_ids: anomaly.relatedGuestIds,
    encounters: anomaly.encounters,
    totem_name: anomaly.totemName,
    totem_description: anomaly.totemDescription,
    totem_uses: anomaly.totemUses,
  };
}

function rowToAnomaly(row: any): AnomalyRecord {
  return {
    id: row.id,
    portrait: row.portrait ?? "",
    title: row.title ?? "",
    name: row.name ?? "",
    nature: row.nature ?? "",
    location: row.location ?? "",
    role: row.role ?? "",
    note: row.note ?? "",
    status: row.status ?? "Active",
    relatedGuestIds: Array.isArray(row.related_guest_ids)
      ? row.related_guest_ids
      : [],
    encounters: Array.isArray(row.encounters)
      ? row.encounters
      : [],
    totemName: row.totem_name ?? "",
    totemDescription: row.totem_description ?? "",
    totemUses: row.totem_uses ?? 0,
  };
}

function addAnomaly() {
  const anomaly = createAnomaly();

  setAnomalies((previous) => [
    ...previous,
    anomaly,
  ]);

  setOpenAnomalyId(anomaly.id);
}

function updateAnomaly(
  id: string,
  changes: Partial<AnomalyRecord>
) {
  setAnomalies((previous) =>
    previous.map((anomaly) =>
      anomaly.id === id
        ? {
            ...anomaly,
            ...changes,
          }
        : anomaly
    )
  );
}

async function deleteAnomaly(id: string) {
  const confirmed = window.confirm(
    "Delete this anomaly record?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const { error } = await supabase
      .from("anomalies")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Supabase anomaly delete error:",
        error.message,
        error.details,
        error.hint,
        error.code
      );
      return;
    }

    setAnomalies((previous) =>
      previous.filter(
        (anomaly) => anomaly.id !== id
      )
    );

    if (openAnomalyId === id) {
      setOpenAnomalyId(null);
    }
  } catch (error) {
    console.error(
      "Could not delete anomaly record:",
      error
    );
  }
}

function updateAnomalyEncounter(
  anomalyId: string,
  encounterId: string,
  changes: Partial<AnomalyEncounter>
) {
  setAnomalies((previous) =>
    previous.map((anomaly) => {
      if (anomaly.id !== anomalyId) {
        return anomaly;
      }

      return {
        ...anomaly,

        encounters:
          anomaly.encounters.map(
            (encounter) =>
              encounter.id === encounterId
                ? {
                    ...encounter,
                    ...changes,
                  }
                : encounter
          ),
      };
    })
  );
}

function addAnomalyEncounter(
  anomalyId: string
) {
  setAnomalies((previous) =>
    previous.map((anomaly) => {
      if (anomaly.id !== anomalyId) {
        return anomaly;
      }

      return {
        ...anomaly,

        encounters: [
          ...anomaly.encounters,
          createEncounter(),
        ],
      };
    })
  );
}

function removeAnomalyEncounter(
  anomalyId: string,
  encounterId: string
) {
  setAnomalies((previous) =>
    previous.map((anomaly) => {
      if (anomaly.id !== anomalyId) {
        return anomaly;
      }

      return {
        ...anomaly,

        encounters:
          anomaly.encounters.filter(
            (encounter) =>
              encounter.id !== encounterId
          ),
      };
    })
  );
}

function toggleRelatedGuest(
  anomalyId: string,
  guestId: string
) {
  setAnomalies((previous) =>
    previous.map((anomaly) => {
      if (anomaly.id !== anomalyId) {
        return anomaly;
      }

      const alreadyRelated =
        anomaly.relatedGuestIds.includes(
          guestId
        );

      return {
        ...anomaly,

        relatedGuestIds: alreadyRelated
          ? anomaly.relatedGuestIds.filter(
              (id) => id !== guestId
            )
          : [
              ...anomaly.relatedGuestIds,
              guestId,
            ],
      };
    })
  );
}

function removeRelatedGuest(
  anomalyId: string,
  guestId: string
) {
  setAnomalies((previous) =>
    previous.map((anomaly) => {
      if (anomaly.id !== anomalyId) {
        return anomaly;
      }

      return {
        ...anomaly,

        relatedGuestIds:
          anomaly.relatedGuestIds.filter(
            (id) => id !== guestId
          ),
      };
    })
  );
}
  /* -------------------------------------------------------
     CHECK-IN
     ------------------------------------------------------- */

  function beginCheckIn() {
    setGuest(blankGuest());
    setMessage("");
    setPage("checkin");
  }

async function saveGuest(guestToSave?: Guest) {

  const prepared = normalizeGuest(
  guestToSave ?? guest
);

try {
  setLoading(true);
  setMessage("");

  if (!prepared.name.trim()) {
    setMessage("The Hotel requires a name.");
    return;
  }

  if (!prepared.room.trim()) {
    setMessage("A room number is required.");
    return;
  }

  if (!prepared.password.trim()) {
    setMessage("A room password is required.");
    return;
  }

    console.log("PASSED VALIDATION");

    const payload = {
      name: prepared.name,
      password: prepared.password,

      room: prepared.room,

      title: prepared.title,
      role: prepared.role,
      role2: prepared.role2,

      days_of_stay: prepared.stay,
      purpose_of_stay: prepared.purpose,
      important_experience: prepared.important,
      fear: prepared.fears,
      traumatic_experience: prepared.trauma,
      last_memory: prepared.lastMemory,
      luggage: prepared.luggage,

      level: prepared.level,

      skills: prepared.skills,
      abilities: prepared.abilities,
      totems: prepared.totems,

      portrait: prepared.portrait,
      gifts: JSON.stringify(prepared.gifts),
notes: prepared.notes,

      movement: prepared.movement,
      dread: prepared.dread,

     current_hp: prepared.hp,
      max_hp: prepared.maxHp,
      ac: prepared.ac,
      memory_pool: prepared.memoryPool,
      max_memory_pool: prepared.maxMemoryPool,

      hotel_notes: prepared.hotelNotes,
    };

    let result;

    if (prepared.id) {
      result = await supabase
        .from("characters")
        .update(payload)
        .eq("id", prepared.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("characters")
        .insert(payload)
        .select()
        .single();
    }


    if (result.error) {
      console.error("Supabase save error:", result.error);

      setMessage(
        `The Hotel could not save the guest: ${result.error.message}`
      );

      return;
    }

    const saved = normalizeGuest({
      ...result.data,

      stay:
        result.data.days_of_stay ??
        prepared.stay,

      purpose:
        result.data.purpose_of_stay ??
        prepared.purpose,

      important:
        result.data.important_experience ??
        prepared.important,

      fears:
        result.data.fear ??
        prepared.fears,

      trauma:
        result.data.traumatic_experience ??
        prepared.trauma,

      lastMemory:
        result.data.last_memory ??
        prepared.lastMemory,

      memoryPool:
        result.data.memory_pool ??
        prepared.memoryPool,

      maxMemoryPool:
       result.data.max_memory_pool ??
      prepared.maxMemoryPool,  

      hotelNotes:
        result.data.hotel_notes ??
        prepared.hotelNotes,

      hp:
        result.data.current_hp ??
        prepared.hp,
    });

    setGuest(saved);

    await loadGuests();

    setMessage(
      `Changes saved. Paradise Hotel remembers, ${saved.name}.`
    );
  } catch (error) {
    console.error("Unexpected save error:", error);

    setMessage(
      "The Hotel encountered an unexpected error while saving."
    );
  } finally {
    setLoading(false);
  }
}

  /* -------------------------------------------------------
     PLAYER LOGIN
     ------------------------------------------------------- */

  async function loginPlayer() {
    if (!loginRoom.trim() || !loginPassword) {
      setMessage("Room number and password are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("room", loginRoom.trim())
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data) {
        setMessage("The Hotel does not recognize you.");
        return;
      }

      const password =
        data.password ??
        data.room_password ??
        data.roomPassword ??
        "";

      if (String(password) !== String(loginPassword)) {
        setMessage("The Hotel does not recognize that password.");
        return;
      }

const loggedIn = normalizeGuest({
  ...data,

  stay:
    data.days_of_stay ??
    data.stay ??
    "",

  purpose:
    data.purpose_of_stay ??
    data.purpose ??
    "",

  important:
    data.important_experience ??
    data.important ??
    "",

  fears:
    data.fear ??
    data.fears ??
    "",

  trauma:
    data.traumatic_experience ??
    data.trauma ??
    "",

  lastMemory:
    data.last_memory ??
    data.lastMemory ??
    "",

  memoryPool:
    data.memory_pool ??
    data.memoryPool ??
    0,

  hp:
    data.current_hp ??
    data.hp ??
    0,

  hotelNotes:
    data.hotel_notes ??
    data.hotelNotes ??
    "",
});

setGuest(loggedIn);
setGmSelectedGuestId("");
setPage("room");
setMessage(`Welcome back to Room ${loggedIn.room}.`);

    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     GM LOGIN
     ------------------------------------------------------- */

  function loginGM() {
    /*
      Keep this compatible with the existing Supabase setup.
      We deliberately do not hard-code a production GM password.
      If the current Supabase project already provides a GM
      authentication layer, this can be connected here without
      changing the UI.
    */

    if (!gmPassword.trim()) {
      setMessage("GM password required.");
      return;
    }

    /*
      Temporary development gate.

      Replace with your existing Supabase GM auth/table call
      if your project already has one.
    */
if (gmPassword === GM_PASSWORD) {
  setGmUnlocked(true);
  setPage("gm");
  setMessage("Management access granted.");
}
    
    else {
      setMessage(
        "GM access denied. The Hotel does not welcome you."
      );
    }
  }

  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

    function logout() {
      setGuest(blankGuest());
      setLoginRoom("");
      setLoginPassword("");
      setGmPassword("");
      setGmUnlocked(false);
      sessionStorage.removeItem("gmUnlocked");
      setPage("home");
      setMessage("");
    }

  /* -------------------------------------------------------
     COMBAT
     ------------------------------------------------------- */
  
function startCombat() {
  setCombat((previous) => ({
    ...previous,
    active: true,
    round: 1,
    turnIndex: 0,
    log: [
      ...previous.log,
      "Combat has begun.",
    ],
  }));

  setPage("combat");
}

  
function nextTurn() {
  setCombat((previous) => {
    if (!previous.active || previous.participants.length === 0) {
      return previous;
    }

    const next = previous.turnIndex + 1;
    const isNewRound = next >= previous.participants.length;
    const nextIndex = isNewRound ? 0 : next;
    const nextRound = isNewRound
      ? previous.round + 1
      : previous.round;

    const nextParticipantId = previous.participants[nextIndex];

    const isDreadling = nextParticipantId.startsWith("dreadling:");
    const dreadlingId = isDreadling
      ? nextParticipantId.slice("dreadling:".length).split(":")[0]
      : "";

    const dreadling = isDreadling
      ? dreadlings.find((item) => item.id === dreadlingId)
      : undefined;

    const guest = isDreadling
      ? undefined
      : guests.find(
          (item) =>
            (item.id || item.room || item.name) === nextParticipantId
        );

    const combatantName = isDreadling
      ? dreadling?.name || "Dreadling"
      : guest?.name || "Unknown Guest";

    return {
      ...previous,
      round: nextRound,
      turnIndex: nextIndex,
      log: [
        ...previous.log,
        ...(isNewRound ? [`Round ${nextRound} begins.`] : []),
        `${combatantName}'s turn begins.`,
      ],
    };
  });
}

  function endCombat() {
      setCombat({
    active: false,
    round: 1,
    turnIndex: 0,
    participants: [],
    initiative: {},
    hp: {},
    log: [],
  });

    setPage("gm");
  }

  /* =======================================================
     HOME
     ======================================================= */

function renderHubPage() {
  return (
    <main style={pageStyle}>
      <div
        style={{
          minHeight: "100vh",
          padding: "40px 24px 60px",
        }}
      >
        <div
          style={{
            width: "min(1100px, 100%)",
            margin: "0 auto",
          }}
        >
          <header
            style={{
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            <div
              style={{
                color: colors.gold,
                letterSpacing: ".32em",
                fontSize: 11,
                marginBottom: 14,
              }}
            >
              PARADISE HOTEL
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 7vw, 64px)",
                fontWeight: 400,
                letterSpacing: ".08em",
                margin: 0,
              }}
            >
              GUEST LOBBY
            </h1>

            <p
              style={{
                color: colors.goldBright,
                fontStyle: "italic",
                fontSize: 18,
                marginTop: 12,
              }}
            >
              Welcome back, {currentGuest.name || "Guest"}.
            </p>

            <div
              style={{
                width: 100,
                height: 1,
                background: colors.gold,
                opacity: 0.5,
                margin: "28px auto 0",
              }}
            />
          </header>

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 15,
            }}
          >
            <button
              type="button"
              onClick={() => setPage("room")}
              style={{
                ...panelStyle,
                textAlign: "left",
                cursor: "pointer",
                minHeight: 190,
              }}
            >
              <div
                style={{
                  color: colors.gold,
                  fontSize: 11,
                  letterSpacing: ".18em",
                  marginBottom: 18,
                }}
              >
                YOUR ROOM
              </div>

              <h2
                style={{
                  color: colors.goldBright,
                  fontWeight: 400,
                  margin: "0 0 10px",
                }}
              >
                My Room
              </h2>

              <p
                style={{
                  color: colors.muted,
                  margin: 0,
                }}
              >
                Return to your character sheet, memories,
                skills, abilities, Totems, and hotel records.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPage("guide")}
              style={{
                ...panelStyle,
                textAlign: "left",
                cursor: "pointer",
                minHeight: 190,
              }}
            >
              <div
                style={{
                  color: colors.gold,
                  fontSize: 11,
                  letterSpacing: ".18em",
                  marginBottom: 18,
                }}
              >
                KNOW THE HOTEL
              </div>

              <h2
                style={{
                  color: colors.goldBright,
                  fontWeight: 400,
                  margin: "0 0 10px",
                }}
              >
                Player Guide
              </h2>

              <p
                style={{
                  color: colors.muted,
                  margin: 0,
                }}
              >
                Learn the rules, Cores, Skills, Dice,
                Dread, abilities, Totems, and how to play.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPage("services")}
              style={{
                ...panelStyle,
                textAlign: "left",
                cursor: "pointer",
                minHeight: 190,
              }}
            >
              <div
                style={{
                  color: colors.gold,
                  fontSize: 11,
                  letterSpacing: ".18em",
                  marginBottom: 18,
                }}
              >
                HOTEL SERVICES
              </div>

              <h2
                style={{
                  color: colors.goldBright,
                  fontWeight: 400,
                  margin: "0 0 10px",
                }}
              >
                Hotel Services
              </h2>

              <p
                style={{
                  color: colors.muted,
                  margin: 0,
                }}
              >
                Visit the Pool, Lounge, Bar, Lobby,
                Room Services, and Maintenance.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPage("anomalies")}
              style={{
                ...panelStyle,
                textAlign: "left",
                cursor: "pointer",
                minHeight: 190,
              }}
            >
              <div
                style={{
                  color: colors.gold,
                  fontSize: 11,
                  letterSpacing: ".18em",
                  marginBottom: 18,
                }}
              >
                HOTEL RECORDS
              </div>

              <h2
                style={{
                  color: colors.goldBright,
                  fontWeight: 400,
                  margin: "0 0 10px",
                }}
              >
                Anomaly Records
              </h2>

              <p
                style={{
                  color: colors.muted,
                  margin: 0,
                }}
              >
                Examine strange phenomena, discoveries,
                and anomalies recorded within Paradise Hotel.
              </p>
            </button>
          </section>

        <button
  type="button"
  
  onClick={() => {
  if (gmUnlocked) {
    setPage("gm");
    return;
  }

  const password = window.prompt("Enter GM password:");

  if (password === GM_PASSWORD) {
    sessionStorage.setItem("gmUnlocked", "true");
    setGmUnlocked(true);
    setPage("gm");
  } else {
    window.alert("Incorrect GM password.");
  }
}}
  style={{
    ...panelStyle,
    textAlign: "left",
    cursor: "pointer",
    minHeight: 150,
    marginTop: 15,
    maxWidth: 265,
  }}
>
  <div
    style={{
      color: colors.gold,
      fontSize: 11,
      letterSpacing: ".18em",
      marginBottom: 18,
    }}
  >
    HOTEL MANAGEMENT
  </div>

  <h2
    style={{
      color: colors.goldBright,
      fontWeight: 400,
      margin: "0 0 10px",
    }}
  >
    GM Control
  </h2>

  <p
    style={{
      color: colors.muted,
      margin: 0,
    }}
  >
    Manage guests, encounters, battles, and other Hotel systems.
  </p>
</button>

          
<div
  style={{
    marginTop: 36,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
  }}
>
  <Button
    secondary
    onClick={() => setPage("home")}
  >
    RETURN TO ENTRANCE
  </Button>

  
<Button
  secondary
  disabled={Number(guest.dread) < 20}
  onClick={() => {
    if (Number(guest.dread) >= 20) {
      setPage("basement");
    }
  }}
>
  BASEMENT
</Button>
</div>

        </div>
      </div>
    </main>
  );
}

function renderAnomaliesPage() {
  const filteredAnomalies =
    anomalies.filter((anomaly) => {
      const search =
        anomalySearch
          .trim()
          .toLowerCase();

      if (!search) {
        return true;
      }

      return (
        anomaly.name
          .toLowerCase()
          .includes(search) ||
        anomaly.title
          .toLowerCase()
          .includes(search) ||
        anomaly.nature
          .toLowerCase()
          .includes(search) ||
        anomaly.location
          .toLowerCase()
          .includes(search) ||
        anomaly.role
          .toLowerCase()
          .includes(search)
      );
    });

  return (
    <main style={pageStyle}>
      <div
        style={{
          minHeight: "100vh",
          padding: "40px 24px 80px",
        }}
      >
        <div
          style={{
            width: "min(1180px, 100%)",
            margin: "0 auto",
          }}
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <header
            style={{
              ...panelStyle,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: colors.gold,
                letterSpacing: ".25em",
                fontSize: 11,
                marginBottom: 12,
              }}
            >
              PARADISE HOTEL
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    color: colors.goldBright,
                    fontWeight: 400,
                    margin: 0,
                    letterSpacing: ".06em",
                  }}
                >
                  ANOMALY RECORDS
                </h1>

                <p
                  style={{
                    color: colors.muted,
                    margin:
                      "12px 0 0",
                    lineHeight: 1.7,
                    maxWidth: 720,
                  }}
                >
                  Records of unusual phenomena,
                  entities, objects, locations,
                  and events encountered within
                  the Hotel.
                </p>
              </div>

              <Button
                onClick={addAnomaly}
              >
                + NEW ANOMALY
              </Button>
            </div>
          </header>


          {/* =================================================
              SEARCH
          ================================================= */}

          <section
            style={{
              ...panelStyle,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".16em",
                textTransform:
                  "uppercase",
                marginBottom: 8,
              }}
            >
              RECORD SEARCH
            </div>

            <input
              value={anomalySearch}
              onChange={(event) =>
                setAnomalySearch(
                  event.target.value
                )
              }
              placeholder="Search name, nature, location, role..."
              style={inputStyle}
            />
          </section>


          {/* =================================================
              HOTEL NOTICE
          ================================================= */}

          <section
            style={{
              ...panelStyle,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".16em",
                marginBottom: 8,
              }}
            >
              HOTEL NOTICE
            </div>

            <p
              style={{
                margin: 0,
                color: colors.muted,
                lineHeight: 1.7,
              }}
            >
              Not everything recorded here
              is understood. Some records may
              be incomplete, contradictory, or
              deliberately left unfinished.
            </p>
          </section>


          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {filteredAnomalies.length === 0 && (
            <section
              style={{
                ...panelStyle,
                minHeight: 280,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <div>
                <div
                  style={{
                    color: colors.gold,
                    fontSize: 42,
                    marginBottom: 16,
                  }}
                >
                  ◈
                </div>

                <h2
                  style={{
                    color:
                      colors.goldBright,
                    fontWeight: 400,
                    margin:
                      "0 0 10px",
                  }}
                >
                  No Records Available
                </h2>

                <p
                  style={{
                    color: colors.muted,
                    maxWidth: 520,
                    margin: "0 auto 20px",
                    lineHeight: 1.7,
                  }}
                >
                  The Hotel has not made any
                  anomaly records available yet.
                </p>

                <Button
                  onClick={addAnomaly}
                >
                  CREATE FIRST RECORD
                </Button>
              </div>
            </section>
          )}


          {/* =================================================
              ANOMALY RECORDS
          ================================================= */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {filteredAnomalies.map(
              (anomaly, index) => {

                const isOpen =
                  openAnomalyId ===
                  anomaly.id;

                const relatedGuests =
                  guests.filter((guest) =>
                    anomaly.relatedGuestIds.includes(
                      String(
                        guest.id ||
                        guest.room ||
                        guest.name
                      )
                    )
                  );

                const statusIsDormant =
                  anomaly.status ===
                  "Dormant";

                const statusIsDestroyed =
                  anomaly.status ===
                  "Destroyed";

                return (
                  <section
                    key={anomaly.id}
                    style={{
                      ...panelStyle,
                      padding: 0,
                      overflow: "hidden",

                      borderColor:
                        statusIsDestroyed
                          ? "rgba(166,91,91,.55)"
                          : statusIsDormant
                            ? "rgba(200,185,145,.35)"
                            : colors.border,
                    }}
                  >

                    {/* =================================================
                        RECORD HEADER
                    ================================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        setOpenAnomalyId(
                          isOpen
                            ? null
                            : anomaly.id
                        )
                      }
                      style={{
                        width: "100%",
                        border: "none",
                        background:
                          "transparent",
                        color:
                          colors.text,
                        padding: 18,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 16,
                        }}
                      >

                        {/* THUMBNAIL */}

                        <div
                          style={{
                            width: 70,
                            height: 70,
                            flexShrink: 0,
                            border:
                              `1px solid ${colors.border}`,
                            background:
                              "rgba(0,0,0,.35)",
                            overflow: "hidden",
                            position:
                              "relative",
                            display: "grid",
                            placeItems:
                              "center",
                          }}
                        >
                          {anomaly.portrait ? (
                            <img
                              src={
                                anomaly.portrait
                              }
                              alt={
                                anomaly.name ||
                                "Anomaly"
                              }
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit:
                                  "cover",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                color:
                                  colors.gold,
                                fontSize: 25,
                              }}
                            >
                              ◈
                            </span>
                          )}

                          {statusIsDormant && (
                            <div
                              style={{
                                position:
                                  "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems:
                                  "center",
                                background:
                                  "rgba(0,0,0,.48)",
                                fontSize: 28,
                              }}
                            >
                              🔒
                            </div>
                          )}

                          {statusIsDestroyed && (
                            <div
                              style={{
                                position:
                                  "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems:
                                  "center",
                                background:
                                  "rgba(0,0,0,.62)",
                                fontSize: 30,
                              }}
                            >
                              ☠
                            </div>
                          )}
                        </div>


                        {/* TITLE */}

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              color:
                                colors.gold,
                              fontSize: 10,
                              letterSpacing:
                                ".15em",
                              marginBottom: 5,
                            }}
                          >
                            RECORD{" "}
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </div>

                          <h2
                            style={{
                              margin: 0,
                              color:
                                colors.goldBright,
                              fontWeight: 400,
                            }}
                          >
                            {anomaly.name ||
                              "Unnamed Anomaly"}
                          </h2>

                          {anomaly.title && (
                            <div
                              style={{
                                color:
                                  colors.muted,
                                marginTop: 4,
                                fontStyle:
                                  "italic",
                              }}
                            >
                              {anomaly.title}
                            </div>
                          )}
                        </div>


                        {/* STATUS */}

                        <div
                          style={{
                            padding:
                              "6px 10px",
                            border:
                              `1px solid ${
                                statusIsDestroyed
                                  ? "rgba(166,91,91,.6)"
                                  : colors.border
                              }`,
                            color:
                              statusIsDestroyed
                                ? "#c87979"
                                : colors.goldBright,
                            fontSize: 9,
                            letterSpacing:
                              ".12em",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {anomaly.status}
                        </div>

                        <div
                          style={{
                            color:
                              colors.gold,
                            fontSize: 18,
                          }}
                        >
                          {isOpen
                            ? "−"
                            : "+"}
                        </div>
                      </div>
                    </button>


                    {/* =================================================
                        EXPANDED RECORD
                    ================================================= */}

                    {isOpen && (
                      <div
                        style={{
                          borderTop:
                            `1px solid ${colors.border}`,
                          padding: 22,
                        }}
                      >

                        {/* =================================================
                            BASIC INFORMATION
                        ================================================= */}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(220px, 300px) minmax(0, 1fr)",
                            gap: 22,
                          }}
                        >

                          {/* PORTRAIT */}

                          <div>
                            <div
                              style={{
                                color:
                                  colors.gold,
                                fontSize: 10,
                                letterSpacing:
                                  ".16em",
                                marginBottom: 10,
                              }}
                            >
                              PORTRAIT
                            </div>

                            <div
                              style={{
                                width: "100%",
                                aspectRatio: "3 / 4",
                                border: `1px solid ${colors.border}`,
                                background: "rgba(0,0,0,.35)",
                                display: "flex",
                                gap: 8,
                                marginTop: 10,
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                              }}
                            >
                              <div>
                              <label
                                style={{
                                  display: "block",
                                  marginBottom: 6,
                                }}
                              >
                                PORTRAIT URL
                              </label>

                              <input
                                type="text"
                                value={anomaly.portrait}
                                onChange={(event) =>
                                  updateAnomaly(anomaly.id, {
                                    portrait: event.target.value,
                                  })
                                }
                                placeholder="Paste image URL..."
                                style={{
                                  ...inputStyle,
                                  width: "100%",
                                }}
                              />
                            </div>

                            </div>
                          </div>


                          {/* FIELDS */}

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(2,minmax(0,1fr))",
                              gap: 16,
                            }}
                          >

                            <Field
                              label="Name"
                              value={
                                anomaly.name
                              }
                              onChange={(
                                value
                              ) =>
                                updateAnomaly(
                                  anomaly.id,
                                  {
                                    name: value,
                                  }
                                )
                              }
                            />

                            <Field
                              label="Title"
                              value={
                                anomaly.title
                              }
                              onChange={(
                                value
                              ) =>
                                updateAnomaly(
                                  anomaly.id,
                                  {
                                    title: value,
                                  }
                                )
                              }
                            />

                            <Field
                              label="Nature"
                              value={
                                anomaly.nature
                              }
                              onChange={(
                                value
                              ) =>
                                updateAnomaly(
                                  anomaly.id,
                                  {
                                    nature: value,
                                  }
                                )
                              }
                            />

                            <Field
                              label="Location"
                              value={
                                anomaly.location
                              }
                              onChange={(
                                value
                              ) =>
                                updateAnomaly(
                                  anomaly.id,
                                  {
                                    location:
                                      value,
                                  }
                                )
                              }
                            />

                            <Field
                              label="Role"
                              value={
                                anomaly.role
                              }
                              onChange={(
                                value
                              ) =>
                                updateAnomaly(
                                  anomaly.id,
                                  {
                                    role: value,
                                  }
                                )
                              }
                            />

                            {/* STATUS */}

                            <label
                              style={{
                                display:
                                  "grid",
                                gap: 7,
                                marginBottom:
                                  16,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  letterSpacing:
                                    ".12em",
                                  textTransform:
                                    "uppercase",
                                  color:
                                    colors.gold,
                                }}
                              >
                                Status
                              </span>

                              <select
                                value={
                                  anomaly.status
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateAnomaly(
                                    anomaly.id,
                                    {
                                      status:
                                        event
                                          .target
                                          .value as AnomalyRecord["status"],
                                    }
                                  )
                                }
                                style={{
                                  ...inputStyle,
                                  cursor:
                                    "pointer",
                                }}
                              >
                                <option value="Active">
                                  Active
                                </option>

                                <option value="Dormant">
                                  Dormant
                                </option>

                                <option value="Destroyed">
                                  Destroyed
                                </option>
                              </select>
                            </label>

                          </div>
                        </div>


                        {/* =================================================
                            NOTE
                        ================================================= */}

                        <div
                          style={{
                            marginTop: 22,
                            borderTop:
                              `1px solid ${colors.border}`,
                            paddingTop: 20,
                          }}
                        >
                          <TextArea
                            label="Record Note"
                            value={
                              anomaly.note
                            }
                            onChange={(
                              value
                            ) =>
                              updateAnomaly(
                                anomaly.id,
                                {
                                  note: value,
                                }
                              )
                            }
                            placeholder="Describe the anomaly, known behavior, warnings, theories, or anything else the Hotel has recorded..."
                          />
                        </div>


                        {/* =================================================
                            RELATED GUESTS
                        ================================================= */}

                        <div
                          style={{
                            marginTop: 10,
                            borderTop:
                              `1px solid ${colors.border}`,
                            paddingTop: 20,
                          }}
                        >
                          <div
                            style={{
                              color:
                                colors.gold,
                              fontSize: 10,
                              letterSpacing:
                                ".16em",
                              marginBottom: 8,
                            }}
                          >
                            GUEST RELATED
                          </div>

                          <p
                            style={{
                              color:
                                colors.muted,
                              fontSize: 12,
                              marginTop: 0,
                            }}
                          >
                            Select guests who are
                            known to be connected
                            to this anomaly.
                          </p>

                          <select
                            value=""
                            onChange={(
                              event
                            ) => {
                              const id =
                                event.target
                                  .value;

                              if (id) {
                                toggleRelatedGuest(
                                  anomaly.id,
                                  id
                                );
                              }
                            }}
                            style={{
                              ...inputStyle,
                              cursor:
                                "pointer",
                              marginBottom: 14,
                            }}
                          >
                            <option value="">
                              + Select a Guest
                            </option>

                                                      
                          {guests
                            .filter((g) =>
                              combat.participants.includes(
                                g.id || g.room || g.name
                              )
                            )
                            .map((guest, index) => {
                              const guestId =
                                guest.id || `guest-${guest.room}-${index}`;

                              const alreadySelected =
                                anomaly.relatedGuestIds.includes(guestId);

                              return (
                                <option
                                  key={guestId}
                                  value={guestId}
                                  disabled={alreadySelected}
                                >
                                  {guest.name || "Unnamed Guest"}
                                  {guest.room ? ` · Room ${guest.room}` : ""}
                                </option>
                              );
                            })}
                          </select>

                          {relatedGuests.length >
                          0 && (
                            <div
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit,minmax(180px,1fr))",
                                gap: 10,
                              }}
                            >
                              {relatedGuests.map(
                                (guest) => {
                                  const guestId =
                                    String(
                                      guest.id ||
                                        guest.room ||
                                        guest.name
                                    );

                                  return (
                                    <div
                                      key={
                                        guestId
                                      }
                                      style={{
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        gap: 10,
                                        padding:
                                          10,
                                        border:
                                          `1px solid ${colors.border}`,
                                        background:
                                          "rgba(0,0,0,.18)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 44,
                                          height: 44,
                                          flexShrink: 0,
                                          overflow:
                                            "hidden",
                                          border:
                                            `1px solid ${colors.border}`,
                                          background:
                                            "rgba(0,0,0,.3)",
                                        }}
                                      >
                                        {guest.portrait ? (
                                          <img
                                            src={
                                              guest.portrait
                                            }
                                            alt={
                                              guest.name
                                            }
                                            style={{
                                              width:
                                                "100%",
                                              height:
                                                "100%",
                                              objectFit:
                                                "cover",
                                            }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              height:
                                                "100%",
                                              display:
                                                "grid",
                                              placeItems:
                                                "center",
                                              color:
                                                colors.gold,
                                            }}
                                          >
                                            ◈
                                          </div>
                                        )}
                                      </div>

                                      <div
                                        style={{
                                          flex: 1,
                                          minWidth:
                                            0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            color:
                                              colors.goldBright,
                                            fontSize:
                                              13,
                                          }}
                                        >
                                          {
                                            guest.name
                                          }
                                        </div>

                                        <div
                                          style={{
                                            color:
                                              colors.muted,
                                            fontSize:
                                              11,
                                            marginTop:
                                              3,
                                          }}
                                        >
                                          {guest.room
                                            ? `Room ${guest.room}`
                                            : "Guest"}
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeRelatedGuest(
                                            anomaly.id,
                                            guestId
                                          )
                                        }
                                        style={{
                                          background:
                                            "transparent",
                                          border:
                                            "none",
                                          color:
                                            "#c87979",
                                          cursor:
                                            "pointer",
                                          fontSize:
                                            16,
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>


                        {/* =================================================
                            ENCOUNTERS
                        ================================================= */}

                        <div
                          style={{
                            marginTop: 22,
                            borderTop:
                              `1px solid ${colors.border}`,
                            paddingTop: 20,
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              gap: 12,
                              flexWrap:
                                "wrap",
                              marginBottom:
                                14,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  color:
                                    colors.gold,
                                  fontSize:
                                    10,
                                  letterSpacing:
                                    ".16em",
                                }}
                              >
                                ENCOUNTER LOG
                              </div>

                              <h3
                                style={{
                                  margin:
                                    "5px 0 0",
                                  color:
                                    colors.goldBright,
                                  fontWeight:
                                    400,
                                }}
                              >
                                Recorded Encounters
                              </h3>
                            </div>

                            <Button
                              secondary
                              onClick={() =>
                                addAnomalyEncounter(
                                  anomaly.id
                                )
                              }
                            >
                              + ADD ENCOUNTER
                            </Button>
                          </div>


                          {anomaly.encounters.length ===
                          0 ? (
                            <div
                              style={{
                                border:
                                  `1px dashed ${colors.border}`,
                                padding: 20,
                                textAlign:
                                  "center",
                                color:
                                  colors.muted,
                                fontSize:
                                  12,
                              }}
                            >
                              No encounters have
                              been recorded.
                            </div>
                          ) : (
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap: 12,
                              }}
                            >
                              {anomaly.encounters.map(
                                (
                                  encounter,
                                  encounterIndex
                                ) => (
                                  <div
                                    key={
                                      encounter.id
                                    }
                                    style={{
                                      border:
                                        `1px solid ${colors.border}`,
                                      padding:
                                        16,
                                      background:
                                        "rgba(0,0,0,.14)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display:
                                          "grid",
                                        gridTemplateColumns:
                                          "repeat(2,minmax(0,1fr))",
                                        gap: 12,
                                      }}
                                    >

                                      <Field
                                        label={`Encounter ${encounterIndex + 1}`}
                                        value={
                                          encounter.label
                                        }
                                        onChange={(
                                          value
                                        ) =>
                                          updateAnomalyEncounter(
                                            anomaly.id,
                                            encounter.id,
                                            {
                                              label:
                                                value,
                                            }
                                          )
                                        }
                                        placeholder="Encounter title or date"
                                      />

                                      <Field
                                        label="Author"
                                        value={
                                          encounter.author
                                        }
                                        onChange={(
                                          value
                                        ) =>
                                          updateAnomalyEncounter(
                                            anomaly.id,
                                            encounter.id,
                                            {
                                              author:
                                                value,
                                            }
                                          )
                                        }
                                        placeholder="Who recorded this?"
                                      />
                                    </div>

                                    <TextArea
                                      label="Encounter Notes"
                                      value={
                                        encounter.notes
                                      }
                                      onChange={(
                                        value
                                      ) =>
                                        updateAnomalyEncounter(
                                          anomaly.id,
                                          encounter.id,
                                          {
                                            notes:
                                              value,
                                          }
                                        )
                                      }
                                      placeholder="What happened?"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeAnomalyEncounter(
                                          anomaly.id,
                                          encounter.id
                                        )
                                      }
                                      style={{
                                        background:
                                          "transparent",
                                        border:
                                          "1px solid rgba(166,91,91,.5)",
                                        color:
                                          "#c87979",
                                        padding:
                                          "8px 12px",
                                        cursor:
                                          "pointer",
                                        fontSize:
                                          10,
                                        letterSpacing:
                                          ".12em",
                                      }}
                                    >
                                      REMOVE ENCOUNTER
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>


                        {/* =================================================
                            TOTEM
                        ================================================= */}

                        <div
                          style={{
                            marginTop: 22,
                            borderTop:
                              `1px solid ${colors.border}`,
                            paddingTop: 20,
                          }}
                        >
                          <div
                            style={{
                              color:
                                colors.gold,
                              fontSize: 10,
                              letterSpacing:
                                ".16em",
                              marginBottom:
                                12,
                            }}
                          >
                            TOTEM / ASSOCIATED OBJECT
                          </div>

                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "minmax(0,1fr) 120px",
                              gap: 12,
                            }}
                          >
                            <Field
                              label="Totem Name"
                              value={
                                anomaly.totemName
                              }
                              onChange={(
                                value
                              ) =>
                                updateAnomaly(
                                  anomaly.id,
                                  {
                                    totemName:
                                      value,
                                  }
                                )
                              }
                            />

                            <label
                              style={{
                                display:
                                  "grid",
                                gap: 7,
                              }}
                            >
                              <span
                                style={{
                                  fontSize:
                                    11,
                                  letterSpacing:
                                    ".12em",
                                  textTransform:
                                    "uppercase",
                                  color:
                                    colors.gold,
                                }}
                              >
                                Uses
                              </span>

                              <input
                                type="number"
                                min={0}
                                value={
                                  anomaly.totemUses
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateAnomaly(
                                    anomaly.id,
                                    {
                                      totemUses:
                                        Math.max(
                                          0,
                                          Number(
                                            event
                                              .target
                                              .value
                                          ) || 0
                                        ),
                                    }
                                  )
                                }
                                style={
                                  inputStyle
                                }
                              />
                            </label>
                          </div>

                          <TextArea
                            label="Totem Description"
                            value={
                              anomaly.totemDescription
                            }
                            onChange={(
                              value
                            ) =>
                              updateAnomaly(
                                anomaly.id,
                                {
                                  totemDescription:
                                    value,
                                }
                              )
                            }
                          />
                        </div>


                        {/* =================================================
                            DELETE
                        ================================================= */}

                        <div
                          style={{
                            marginTop: 22,
                            paddingTop: 18,
                            borderTop:
                              `1px solid ${colors.border}`,
                            display:
                              "flex",
                            justifyContent:
                              "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              deleteAnomaly(
                                anomaly.id
                              )
                            }
                            style={{
                              background:
                                "transparent",
                              border:
                                "1px solid rgba(166,91,91,.5)",
                              color:
                                "#c87979",
                              padding:
                                "10px 14px",
                              cursor:
                                "pointer",
                              fontSize: 10,
                              letterSpacing:
                                ".12em",
                            }}
                          >
                            DELETE ANOMALY RECORD
                          </button>
                        </div>

                      </div>
                    )}
                  </section>
                );
              }
            )}
          </div>


          {/* =================================================
              NAVIGATION
          ================================================= */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 28,
            }}
          >
            <Button
              secondary
              onClick={() =>
                setPage("hub")
              }
            >
              HOME
            </Button>

            <Button
              secondary
              onClick={() =>
                setPage("room")
              }
            >
              MY ROOM
            </Button>
          </div>

        </div>
      </div>
    </main>
  );
}

  function renderHomePage() {
    return (
      <main style={pageStyle}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: colors.gold,
                letterSpacing: ".32em",
                fontSize: 11,
                marginBottom: 18,
              }}
            >
              ESTABLISHED FOR THOSE WHO NEED A PLACE TO STAY
            </div>

            <h1
              style={{
                fontSize:
                  "clamp(42px, 9vw, 86px)",
                letterSpacing: ".08em",
                margin: 0,
                fontWeight: 400,
              }}
            >
              PARADISE HOTEL
            </h1>

            <p
              style={{
                color: colors.goldBright,
                fontStyle: "italic",
                fontSize: 20,
                marginTop: 14,
              }}
            >
              Where dreams come true.
            </p>

            <div
              style={{
                width: 100,
                height: 1,
                background: colors.gold,
                opacity: 0.5,
                margin: "32px auto",
              }}
            />

            <div
              style={{
                ...panelStyle,
                textAlign: "left",
                maxWidth: 420,
                margin: "0 auto",
              }}
            >
              <h2
                style={{
                  color: colors.goldBright,
                  fontWeight: 400,
                  marginTop: 0,
                }}
              >
                Guest Access
              </h2>

              <Field
                label="Room"
                value={loginRoom}
                onChange={setLoginRoom}
                placeholder="Room number"
              />

              <Field
                label="Password"
                value={loginPassword}
                onChange={setLoginPassword}
                type="password"
                placeholder="Room password"
              />

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Button onClick={loginPlayer}>
                  LOG IN
                </Button>

                <Button
                  secondary
                  onClick={beginCheckIn}
                >
                  CHECK-IN
                </Button>
              </div>

              <div
                style={{
                  marginTop: 28,
                  paddingTop: 20,
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >
                  <span
                    style={{
                      color: colors.gold,
                      fontSize: 11,
                      letterSpacing: ".12em",
                    }}
                  >
                    GM ACCESS
                  </span>

                  <input
                    type="password"
                    value={gmPassword}
                    onChange={(e) =>
                      setGmPassword(e.target.value)
                    }
                    style={inputStyle}
                    placeholder="Management password"
                  />
                </label>

                <div style={{ marginTop: 10 }}>
                  <Button
                    secondary
                    onClick={loginGM}
                  >
                    GM LOG IN 🔒
                  </Button>
                </div>
              </div>

              {message && (
                <p
                  style={{
                    marginTop: 18,
                    color: colors.goldBright,
                    lineHeight: 1.5,
                  }}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

function renderBasementPage() {
  const handleBasementPassword = () => {
    if (basementPassword === "idliketoendmyself") {
      setBasementError("");
      setBasementAccepted(true);
    } else {
      setBasementError("The door remains closed.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#080b0a",
        color: colors.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 650,
          padding: 36,
          background: "rgba(20,24,21,0.96)",
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        {!basementAccepted ? (
          <>
            <p
              style={{
                color: colors.gold,
                letterSpacing: "0.2em",
                fontSize: 11,
              }}
            >
              PARADISE HOTEL
            </p>

            <h1
              style={{
                color: colors.goldBright,
                fontWeight: 400,
                letterSpacing: "0.12em",
              }}
            >
              THE BASEMENT
            </h1>

            <p
              style={{
                color: colors.muted,
                lineHeight: 1.8,
                margin: "24px 0",
              }}
            >
              There is no sign on the door.
              <br />
              There is no indication of what lies beyond it.
              <br />
              Only a place to enter the password.
            </p>

            <input
              type="password"
              value={basementPassword}
              onChange={(event) =>
                setBasementPassword(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleBasementPassword();
                }
              }}
              placeholder="Enter password"
              autoComplete="off"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 14,
                background: "#080b0a",
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                color: colors.text,
                fontSize: 15,
                outline: "none",
              }}
            />

            {basementError && (
              <p
                style={{
                  color: colors.muted,
                  marginTop: 14,
                }}
              >
                {basementError}
              </p>
            )}

            <button
              type="button"
              onClick={handleBasementPassword}
              style={{
                width: "100%",
                marginTop: 18,
                padding: 14,
                background: "rgba(200,185,145,0.08)",
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                color: colors.goldBright,
                letterSpacing: "0.12em",
                cursor: "pointer",
              }}
            >
              ENTER
            </button>
          </>
        ) : (
          <>
            <p
              style={{
                color: colors.gold,
                letterSpacing: "0.2em",
                fontSize: 11,
              }}
            >
              A MESSAGE FROM THE MANAGER
            </p>

            <h1
              style={{
                color: colors.goldBright,
                fontWeight: 400,
              }}
            >
              Thank You
            </h1>

            <div
              style={{
                textAlign: "left",
                lineHeight: 1.9,
                color: colors.text,
                whiteSpace: "pre-line",
                marginTop: 28,
              }}
            >
              {`…I see.

You've made your decision.

I'm sorry. I know those words don't mean very much anymore. You've probably heard them more times than you can remember, and perhaps not once from someone who truly understood what you were going through.

I wish I had noticed sooner.

I wish someone had asked how you were doing and stayed long enough to hear the answer. I wish this hotel had been kinder to you. I wish that, somewhere along the way, things hadn't become so terribly difficult.

But wishing doesn't change very much, does it?

So I'll say what I should have said a long time ago.

Thank you.

Thank you for the days you stayed. For the things you did that nobody noticed. For the times you kept going when you had every reason to be tired. For carrying things that were never meant to be yours alone.

You were here. You mattered here. And even if the others never understood how much you gave, I hope you know that I did.

I don't know what happens after this. I wish I could promise you something. I wish I could tell you that you'll wake up someday, that someone will remember, that everything you've been through will lead somewhere.

But I won't make promises I cannot keep.

All I can hope for is that Allan will never need you to carry this much again.

Perhaps, one day, he'll need someone like you. Perhaps someone will come along who carries a little of what you carried, remembers a little of what you knew, and finds their own reason to stay.

But they won't be you.

And I don't think anyone should pretend otherwise.

…I'm going to miss having you here.

I know that may not mean much coming from me. I'm only the Manager, after all. I open doors, keep things in order, and try to make this place feel a little less lonely than it really is.

But I wanted you to know that someone noticed you were here.

Someone is grateful that you stayed as long as you did.

And someone is sorry that it had to hurt this much.

Thank you. For everything.

You can rest now.

Goodbye, dear guest.`}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

  /* =======================================================
     CHECK-IN
     ======================================================= */

function renderCheckInPage() {
  /*
   * -------------------------------------------------------
   * STEP 1 — REGISTRATION
   * -------------------------------------------------------
   */
  if (checkInStep === "registration") {
    return (
      <main style={pageStyle}>
        <div
          style={{
            ...containerStyle,
            padding: "40px 0 80px",
          }}
        >
          <Button
            secondary
            onClick={() => setPage("home")}
          >
            ← HOTEL
          </Button>

          <div
            style={{
              ...panelStyle,
              marginTop: 24,
            }}
          >
            <div
              style={{
                color: colors.gold,
                fontSize: 11,
                letterSpacing: ".2em",
              }}
            >
              01 · REGISTRATION
            </div>

            <h1
              style={{
                fontWeight: 400,
                color: colors.goldBright,
              }}
            >
              Guest Registration
            </h1>

            <p style={{ color: colors.muted }}>
              Please answer honestly. The Hotel appreciates honesty.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(280px,1fr))",
                gap: 24,
              }}
            >

              <Field
                label="Name"
                value={guest.name}
                onChange={(v) =>
                  updateGuest("name", v)
                }
              />

              <Field
                label="Room Password"
                value={guest.password}
                onChange={(v) =>
                  updateGuest("password", v)
                }
                type="password"
              />

              <Field
                label="Days of Stay"
                value={guest.stay}
                onChange={(v) =>
                  updateGuest("stay", v)
                }
                placeholder="e.g. 31, indefinitely, until recovered..."
              />

              <label
                style={{
                  display: "grid",
                  gap: 7,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: colors.gold,
                  }}
                >
                  Guest Level
                </span>

                <select
                  value={guest.level}
                  onChange={(e) => {
                    const newLevel =
                      e.target.value as GuestLevel;

                    const newBudget =
                      GUEST_LEVEL_LIMITS[newLevel];

                    setGuest((previous) => {
                      let remaining = newBudget;

                      const newSkills = {
                        ...previous.skills,
                      };

                      for (const skill of ALL_SKILLS) {
                        const current =
                          Number(
                            newSkills[skill] || 0
                          );

                        const allowed = Math.min(
                          current,
                          5,
                          remaining
                        );

                        newSkills[skill] = allowed;
                        remaining -= allowed;
                      }

                      return normalizeGuest({
                        ...previous,
                        level: newLevel,
                        skills: newSkills,
                      });
                    });
                  }}
                  style={inputStyle}
                >
                  <option value="Normal Guest">
                    Normal Guest — 15 Points
                  </option>

                  <option value="Special Guest">
                    Special Guest — 30 Points
                  </option>

                  <option value="VIP">
                    VIP — 45 Points
                  </option>

                  <option value="VVIP">
                    VVIP — 60 Points
                  </option>
                </select>
              </label>

              <Field
                label="Title"
                value={guest.title}
                onChange={(v) =>
                  updateGuest("title", v)
                }
              />
            </div>

            <TextArea
              label="Purpose of Stay"
              value={guest.purpose}
              onChange={(v) =>
                updateGuest("purpose", v)
              }
            />

            <TextArea
              label="What is important to who you are right now?"
              value={guest.important}
              onChange={(v) =>
                updateGuest("important", v)
              }
            />

            <TextArea
              label="Fears"
              value={guest.fears}
              onChange={(v) =>
                updateGuest("fears", v)
              }
            />

            <TextArea
              label="Traumatic Experience"
              value={guest.trauma}
              onChange={(v) =>
                updateGuest("trauma", v)
              }
            />

            <TextArea
              label="Remember Last"
              value={guest.lastMemory}
              onChange={(v) =>
                updateGuest("lastMemory", v)
              }
            />

            <TextArea
              label="Luggage"
              value={guest.luggage}
              onChange={(v) =>
                updateGuest("luggage", v)
              }
            />

            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop:
                  `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Button
                secondary
                onClick={() => setPage("home")}
              >
                CANCEL
              </Button>

              <Button
                onClick={() => {
                  setMessage("");
                  setRoomChoice(null);
                  setRoomMessage("");
                  setCheckInStep("room");
                }}
              >
                NEXT: ROOM ASSIGNMENT →
              </Button>
            </div>

            {message && (
              <p
                style={{
                  marginTop: 18,
                  color: colors.goldBright,
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  /*
   * -------------------------------------------------------
   * STEP 2 — ROOM ASSIGNMENT
   * -------------------------------------------------------
   */
  if (checkInStep === "room") {
    return (
      <main style={pageStyle}>
        <div
          style={{
            ...containerStyle,
            padding: "40px 0 80px",
          }}
        >
          <Button
            secondary
            onClick={() =>
              setCheckInStep("registration")
            }
          >
            ← REGISTRATION
          </Button>

          <div
            style={{
              ...panelStyle,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: colors.gold,
                fontSize: 11,
                letterSpacing: ".2em",
              }}
            >
              02 · ROOM ASSIGNMENT
            </div>

            <h1
              style={{
                fontWeight: 400,
                color: colors.goldBright,
              }}
            >
              Your Room
            </h1>

            <p
              style={{
                color: colors.muted,
                maxWidth: 620,
                margin:
                  "0 auto 30px",
                lineHeight: 1.7,
              }}
            >
              The Hotel will determine your room.
              New rooms are assigned by a roll of
              1d99. If you already have a room,
              you may enter it instead.
            </p>

            {!roomChoice && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(250px,1fr))",
                  gap: 18,
                  maxWidth: 700,
                  margin: "0 auto",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setRoomChoice("roll");
                    setRoomMessage("");
                  }}
                  style={{
                    ...buttonStyle,
                    padding: 28,
                    minHeight: 150,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      marginBottom: 12,
                    }}
                  >
                    🎲
                  </div>

                  <div
                    style={{
                      color: colors.goldBright,
                      fontSize: 16,
                      letterSpacing: ".08em",
                    }}
                  >
                    I NEED A ROOM
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      color: colors.muted,
                      fontSize: 12,
                    }}
                  >
                    Roll 1d99 for an available room
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoomChoice("existing");
                    setRoomMessage("");
                  }}
                  style={{
                    ...buttonStyle,
                    padding: 28,
                    minHeight: 150,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      marginBottom: 12,
                    }}
                  >
                    🔑
                  </div>

                  <div
                    style={{
                      color: colors.goldBright,
                      fontSize: 16,
                      letterSpacing: ".08em",
                    }}
                  >
                    I ALREADY HAVE A ROOM
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      color: colors.muted,
                      fontSize: 12,
                    }}
                  >
                    Enter your existing room
                  </div>
                </button>
              </div>
            )}

            {roomChoice === "roll" && (
              <div
                style={{
                  maxWidth: 560,
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    padding: 24,
                    border:
                      `1px solid ${colors.border}`,
                    background:
                      "rgba(255,255,255,.025)",
                  }}
                >
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      letterSpacing: ".08em",
                      marginBottom: 20,
                    }}
                  >
                    THE HOTEL WILL ROLL 1d99
                  </div>

                  <Button
                    onClick={rollGuestRoom}
                    disabled={roomRolling}
                  >
                    {roomRolling
                      ? "ROLLING..."
                      : guest.room
                        ? "ROLL 1d99 AGAIN"
                        : "ROLL 1d99"}
                  </Button>

                  {guest.room && (
                    <div
                      style={{
                        marginTop: 28,
                        padding:
                          "24px 16px",
                        borderTop:
                          `1px solid ${colors.border}`,
                      }}
                    >
                      <div
                        style={{
                          color: colors.muted,
                          fontSize: 11,
                          letterSpacing:
                            ".18em",
                        }}
                      >
                        YOUR ROOM
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          color:
                            colors.goldBright,
                          fontSize: 42,
                          letterSpacing:
                            ".08em",
                        }}
                      >
                        {guest.room}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          color: colors.muted,
                          fontSize: 12,
                        }}
                      >
                        This room was assigned
                        by the Hotel.
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    gap: 10,
                    marginTop: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    secondary
                    onClick={() => {
                      setRoomChoice(null);
                      updateGuest("room", "");
                    }}
                  >
                    ← BACK
                  </Button>

                  <Button
                    onClick={saveGuest}
                    disabled={
                      loading || !guest.room
                    }
                  >
                    {loading
                      ? "CHECKING IN..."
                      : "COMPLETE CHECK-IN"}
                  </Button>
                </div>
              </div>
            )}

            {roomChoice === "existing" && (
              <div
                style={{
                  maxWidth: 560,
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    padding: 24,
                    border:
                      `1px solid ${colors.border}`,
                    background:
                      "rgba(255,255,255,.025)",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      color: colors.gold,
                      fontSize: 11,
                      letterSpacing:
                        ".16em",
                      marginBottom: 14,
                    }}
                  >
                    EXISTING ROOM
                  </div>

                  <Field
                    label="Room Number"
                    value={guest.room}
                    onChange={(value) => {
                      const cleaned =
                        value.replace(
                          /\D/g,
                          ""
                        );

                      if (cleaned === "") {
                        updateGuest(
                          "room",
                          ""
                        );
                        setRoomMessage("");
                        return;
                      }

                      const room =
                        Number(cleaned);

                      if (room > 100) {
                        setRoomMessage(
                          "Room numbers cannot be higher than 100."
                        );
                        return;
                      }

                      updateGuest(
                        "room",
                        cleaned
                      );
                      setRoomMessage("");
                    }}
                    placeholder="0–100"
                    type="number"
                  />

                  <p
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      lineHeight: 1.6,
                      marginBottom: 0,
                    }}
                  >
                    Enter the room already
                    assigned to you.
                    <br />
                    Room 0 and Room 100 are
                    valid special rooms.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    gap: 10,
                    marginTop: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    secondary
                    onClick={() => {
                      setRoomChoice(null);
                      updateGuest(
                        "room",
                        ""
                      );
                      setRoomMessage("");
                    }}
                  >
                    ← BACK
                  </Button>

                  <Button
                    onClick={() => {
                      if (!guest.room) {
                        setRoomMessage(
                          "Please enter your existing room number."
                        );
                        return;
                      }

                      useExistingRoom(guest.room);
                      saveGuest();
                    }}
                    disabled={loading}
                  >
                    {loading
                      ? "CHECKING IN..."
                      : "COMPLETE CHECK-IN"}
                  </Button>
                </div>
              </div>
            )}

            {roomMessage && (
              <p
                style={{
                  marginTop: 20,
                  color: colors.goldBright,
                }}
              >
                {roomMessage}
              </p>
            )}

            {message && (
              <p
                style={{
                  marginTop: 18,
                  color: colors.goldBright,
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  /*
   * -------------------------------------------------------
   * FALLBACK
   * -------------------------------------------------------
   */

  setCheckInStep("registration");
  return null;
}

   /* =======================================================
     ROOM / CHARACTER SHEET
     ======================================================= */
    function renderRoomPage() {
  const g = currentGuest;

const maxMemory = Math.max(
  0,
  Number(g.maxMemoryPool) || 0
);

  const dread = Math.max(
    0,
    Math.min(20, Number(g.dread) || 0)
  );

  const dreadDie = getDreadDie(dread);

  const skillBudget = GUEST_LEVEL_LIMITS[g.level];
  const skillSpent = getTotalSkillPoints(g.skills);
  const skillRemaining = Math.max(
    0,
    skillBudget - skillSpent
  );

  const coreData: {
    core: Core;
    skills: SkillName[];
  }[] = [
    {
      core: "Mind",
      skills: [
        "Analysis",
        "Perception",
        "Knowledge",
      ],
    },
    {
      core: "Body",
      skills: [
        "Endurance",
        "Agility",
        "Might",
      ],
    },
    {
      core: "Heart",
      skills: [
        "Influence",
        "Expression",
        "Empathy",
      ],
    },
    {
      core: "Ego",
      skills: [
        "Self",
        "Psyche",
        "Memory",
      ],
    },
  ];

  

  return (
    <main style={pageStyle}>
      <div
        style={{
          ...containerStyle,
          padding: "24px 0 80px",
          position: "relative",
          isolation: "isolate",
          background: `
            radial-gradient(
              circle at 50% 20%,
              rgba(120, 95, 55, 0.10),
              transparent 70%
              )`,
            }}
           >
            <DreadAtmosphere
              dread={dread}
              maxDread={20}
            />

        {/* =====================================================
            CHARACTER HEADER
        ===================================================== */}

        <header
          style={{
            ...panelStyle,
            display: "grid",
            gridTemplateColumns:
              "240px minmax(0,1fr) 150px",
            columnGap: 40,
            rowGap: 20,
            alignItems: "center",
          }}
        >
          {/* PORTRAIT */}

          <div>
            {g.portrait ? (
              <img
                src={g.portrait}
                alt={`${g.name || "Guest"} portrait`}
                style={{
                  width: "100%",
                  height: 250,
                  objectFit: "cover",
                  borderRadius: 8,
                  display: "block",
                  border: `1px solid ${colors.border}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 250,
                  border: `2px dashed ${colors.border}`,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.muted,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No portrait
              </div>
            )}

            <input
              value={g.portrait}
              onChange={(e) =>
                updateGuest(
                  "portrait",
                  e.target.value
                )
              }
              placeholder="Portrait image URL"
              style={{
                ...inputStyle,
                marginTop: 10,
                width: "100%",
              }}
            />
          </div>

          {/* CHARACTER IDENTITY */}

          <div>
            <div
              style={{
                color: colors.gold,
                fontSize: 12,
                letterSpacing: ".3em",
              }}
            >
              PARADISE HOTEL
            </div>

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  }}
>
  <h1
    style={{
      margin: "8px 0 4px",
      fontWeight: 400,
      fontSize: 38,
    }}
  >
    {g.name || "Unnamed Guest"}
  </h1>

<button
  type="button"
  onClick={() => {
    const newName = window.prompt(
      "Enter your name:",
      g.name || ""
    );

    if (newName === null) {
      return;
    }

    const trimmedName = newName.trim();

    if (!trimmedName) {
      return;
    }

    setGuest((previous) =>
      normalizeGuest({
        ...previous,
        name: trimmedName,
      })
    );
  }}
  style={{
  border: "none",
  background: "transparent",
  color: colors.gold,
  padding: 0,
  fontSize: 20,
  cursor: "pointer",
  letterSpacing: ".12em",
}}
>
  ✒️
</button>
</div>

            <div
              style={{
                color: colors.goldBright,
                fontSize: 18,
                marginBottom: 10,
              }}
            >
              {g.title || "Guest"}
            </div>

            <div
              style={{
                color: colors.muted,
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              Room {g.room || "—"}
            </div>

            <div
              style={{
                color: colors.text,
                overflowWrap: "anywhere",
                marginTop: 4,
              }}
            >
              <span
                style={{ color: colors.muted }}
              >
                Role
              </span>{" "}
              · {g.role || "—"}
            </div>

            <div
              style={{
                color: colors.text,
               overflowWrap: "anywhere",
                marginTop: 4,
              }}
            >
              <span
                style={{ color: colors.muted }}
              >
                Secondary
              </span>{" "}
              · {g.role2 || "—"}
            </div> 

            {/* STAY + LEVEL */}

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-end",
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    color: colors.muted,
                    fontSize: 10,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    marginBottom: 5,
                  }}
                >
                  Days of Stay
                </label>

                <input
                  value={g.stay}
                  onChange={(e) =>
                    updateGuest(
                      "stay",
                      e.target.value
                    )
                  }
                  placeholder="e.g. 31 days or indefinitely"
                  style={{
                    ...inputStyle,
                    width: "100%",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    color: colors.muted,
                    fontSize: 10,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    marginBottom: 5,
                  }}
                >
                  Guest Level
                </label>

                <select
                  value={g.level}
                  onChange={(e) =>
                    updateGuest(
                      "level",
                      e.target.value as GuestLevel
                    )
                  }
                  style={{
                    ...inputStyle,
                    width: "100%",
                    minWidth: 150,
                    color: colors.goldBright,
                  }}
                >
                  <option value="Normal Guest">
                    Normal Guest — 15 pts
                  </option>

                  <option value="Special Guest">
                    Special Guest — 30 pts
                  </option>

                  <option value="VIP">
                    VIP — 45 pts
                  </option>

                  <option value="VVIP">
                    VVIP — 60 pts
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* HEADER ACTIONS */}

          <div
            style={{
              display: "grid",
              gap: 10,
              minWidth: 100,
            }}
          >
            <Button
              secondary
              onClick={() =>
                setPage("hub")
              }
            >
              HOME
            </Button>

            <Button
  onClick={() => {
    if (gmUnlocked && gmSelectedGuestId) {
      const selectedGuest = guests.find(
        (g) => g.id === gmSelectedGuestId
      );

      if (selectedGuest) {
        saveGuest(selectedGuest);
        return;
      }
    }

    saveGuest(guest);
  }}
  disabled={loading}
>
  {loading
    ? "SAVING..."
    : "SAVE CHANGES"}
</Button>

            <Button
              secondary
              onClick={logout}
            >
              LOG OUT
            </Button>
          </div>
        </header>

{/* =====================================================
    ROOM TABS
===================================================== */}

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 2,
    marginTop: 20,
    border: `1px solid ${colors.border}`,
    background: colors.border,
  }}
>
  <button
    type="button"
    onClick={() => setRoomTab("combat")}
    style={{
      padding: "14px 16px",
      background:
        roomTab === "combat"
          ? "rgba(180,150,90,.28)"
          : colors.panel,
      border: "none",
      color:
        roomTab === "combat"
          ? colors.goldBright
          : colors.muted,
      fontSize: 11,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      cursor: "pointer",
    }}
  >
    Combat
  </button>

  <button
    type="button"
    onClick={() => setRoomTab("information")}
    style={{
      padding: "14px 16px",
      background:
        roomTab === "information"
          ? "rgba(180,150,90,.28)"
          : colors.panel,
      border: "none",
      color:
        roomTab === "information"
          ? colors.goldBright
          : colors.muted,
      fontSize: 11,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      cursor: "pointer",
    }}
  >
    Information
  </button>
</div>

{roomTab === "combat" && (
  <>
{/* =====================================================
    TITLE & ROLES
===================================================== */}

<section
  style={{
    marginTop: 10,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(3, minmax(0, 1fr))",
      gap: 10,
    }}
  >
    {/* TITLE */}
    <div>
      <div
        style={{
          color: colors.gold,
          fontSize: 19,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Title
      </div>

      <input
        type="text"
        value={g.title}
        placeholder="Enter Title"
onChange={(event) => {
  const value = event.target.value;

  if (gmUnlocked && gmSelectedGuestId) {
    setGuests((previous) =>
      previous.map((guestItem) =>
        guestItem.id === gmSelectedGuestId
          ? normalizeGuest({
              ...guestItem,
              title: value,
            })
          : guestItem
      )
    );

    return;
  }

  setGuest((previous) =>
    normalizeGuest({
      ...previous,
      title: value,
    })
  );
}}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 15,
        }}
      />
    </div>

    {/* PRIMARY ROLE*/}
    <div>
      <div
        style={{
          color: colors.gold,
          fontSize: 19,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Primary Role
      </div>

      <select
  value={g.role}
  onChange={(event) =>
    setGuest((previous) =>
      normalizeGuest({
        ...previous,
        role: event.target.value,
      })
    )
  }
style={{
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "rgba(0,0,0,.25)",
  border: `1px solid ${colors.border}`,
  color: colors.text,
  fontSize: 15,
  colorScheme: "dark",
  appearance: "auto",
}}
>
<option style={{ background: "#111", color: colors.text }} value="">
  Select Primary Role
</option>

<option style={{ background: "#111", color: colors.text }} value="Caretaker">
  Caretaker
</option>

<option style={{ background: "#111", color: colors.text }} value="Dreamer">
  Dreamer
</option>

<option style={{ background: "#111", color: colors.text }} value="Guardian">
  Guardian
</option>

<option style={{ background: "#111", color: colors.text }} value="Adversary">
  Adversary
</option>

<option style={{ background: "#111", color: colors.text }} value="Archivist">
  Archivist
</option>

<option style={{ background: "#111", color: colors.text }} value="Diplomat">
  Diplomat
</option>

<option style={{ background: "#111", color: colors.text }} value="Watcher">
  Watcher
</option>

<option style={{ background: "#111", color: colors.text }} value="Vessel">
  Vessel
</option>
</select>

    </div>

    {/* SECONDARY ROLE*/}
    <div>
      <div
        style={{
          color: colors.gold,
          fontSize: 19,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Secondary Role
      </div>

<select
  value={g.role2}
  onChange={(event) =>
    setGuest((previous) =>
      normalizeGuest({
        ...previous,
        role2: event.target.value,
      })
    )
  }
  style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    background: "rgba(0,0,0,.25)",
    border: `1px solid ${colors.border}`,
    color: colors.text,
    fontSize: 15,
  }}
>
  <option style={{ background: "#111", color: colors.text }} value="">
    Select Secondary Role
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Caretaker">
    Caretaker
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Dreamer">
    Dreamer
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Guardian">
    Guardian
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Adversary">
    Adversary
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Archivist">
    Archivist
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Diplomat">
    Diplomat
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Watcher">
    Watcher
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Vessel">
    Vessel
  </option>
</select>
    </div>
  </div>
</section>
 
        {/* =====================================================
            SKILLS
        ===================================================== */}

        <section
          style={{
            ...panelStyle,
            marginTop: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-end",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  color: colors.gold,
                  fontSize: 11,
                  letterSpacing: ".2em",
                  marginBottom: 8,
                }}
              >
                CHARACTER DEVELOPMENT
              </div>

              <h2
                style={{
                  color: colors.goldBright,
                  fontWeight: 400,
                  margin: 0,
                }}
              >
                Skills
              </h2>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  color: colors.muted,
                  fontSize: 12,
                }}
              >
                {g.level}
              </div>

              <div
                style={{
                  color:
                    skillRemaining === 0
                      ? colors.goldBright
                      : colors.gold,
                  fontSize: 15,
                  marginTop: 4,
                }}
              >
                {skillSpent} / {skillBudget}{" "}
                points used
              </div>

              <div
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  marginTop: 3,
                }}
              >
                {skillRemaining} points remaining
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: 18,
            }}
          >
            {coreData.map(
              ({ core, skills }) => {
                const coreTotal =
                  skills.reduce(
                    (sum, skill) =>
                      sum +
                      Number(
                        g.skills[skill] || 0
                      ),
                    0
                  );

                const coreDie =
                  coreTotal <= 0
                    ? "None"
                    : coreTotal <= 3
                    ? "1d4"
                    : coreTotal <= 6
                    ? "1d6"
                    : coreTotal <= 9
                    ? "1d8"
                    : coreTotal <= 12
                    ? "1d10"
                    : "1d12";

                return (
                  <div
                    key={core}
                    style={{
                      border: `1px solid ${colors.border}`,
                      padding: 18,
                      background:
                        "rgba(255,255,255,.015)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 18,
                      }}
                    >
                      <h3
                        style={{
                          color:
                            colors.goldBright,
                          fontWeight: 400,
                          margin: 0,
                        }}
                      >
                        {core}
                      </h3>

                      <div
                        style={{
                          color: "#DC143C",
                          fontSize: 30,
                          letterSpacing: ".08em",
                          fontWeight: 700,
                          textTransform:
                            "uppercase",
                        }}
                      >
                        {coreDie}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      {skills.map(
                        (skill) => {
                          const value =
                            Number(
                              g.skills[
                                skill
                              ] || 0
                            );

                          return (
                            <div
                              key={skill}
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "minmax(0,1fr) auto",
                                alignItems:
                                  "center",
                                gap: 12,
                                paddingBottom:
                                  10,
                                borderBottom:
                                  `1px solid ${colors.border}`,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    color:
                                      colors.goldBright,
                                    fontSize: 14,
                                  }}
                                >
                                  {skill}
                                </div>

                                <div
                                  style={{
                                    color:
                                      colors.muted,
                                    fontSize: 11,
                                    marginTop: 3,
                                  }}
                                >
                                  {value} Skill
                                  Point
                                  {value === 1
                                    ? ""
                                    : "s"}
                                </div>
                              </div>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: 6,
                                }}
                              >
                                <Button
                                  secondary
                                  onClick={() => {
                                    if (
                                      value <=
                                      0
                                    ) {
                                      return;
                                    }

                                    
                                  setGuest((prev) => {
                                    const updated = {
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        [skill]: Number(prev.skills[skill] || 0) - 1,
                                      },
                                    };

                                    return normalizeGuest(updated);
                                  });

                                  }}
                                  disabled={
                                    value <= 0
                                  }
                                >
                                  −
                                </Button>

                                <div
                                  style={{
                                    width: 30,
                                    textAlign:
                                      "center",
                                    color:
                                      colors.goldBright,
                                    fontWeight: 600,
                                  }}
                                >
                                  {value}
                                </div>

                                <Button
                                  secondary
                                  onClick={() => {
                                    if (
                                      value >=
                                        5 ||
                                      skillRemaining <=
                                        0
                                    ) {
                                      return;
                                    }
                                                                        
                                  setGuest((prev) => {
                                    const updated = {
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        [skill]: Number(prev.skills[skill] || 0) + 1,
                                      },
                                    };

                                    const oldCalculatedMax = calculateMemoryPool(prev);
                                    const newCalculatedMax = calculateMemoryPool(updated);
                                    const difference = newCalculatedMax - oldCalculatedMax;

                                    const oldMax = Math.max(
                                      0,
                                      Number(prev.maxMemoryPool) || 0
                                    );

                                    const wasFull =
                                      Number(prev.memoryPool) >= oldMax;

                                    return normalizeGuest({
                                      ...updated,
                                      maxMemoryPool: Math.max(
                                        0,
                                        Math.min(
                                          newCalculatedMax,
                                          oldMax + difference
                                        )
                                      ),
                                      memoryPool: wasFull
                                        ? Math.max(0, Number(prev.memoryPool || 0) + difference)
                                        : prev.memoryPool,
                                    });
                                  });

                                  }}
                                  disabled={
                                    value >= 5 ||
                                    skillRemaining <=
                                      0
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
                
        <div
          style={{
            ...panelStyle,
            marginTop: 10 ,
            padding: "12px 18px",
            color: colors.gold,
            fontSize: 15,
            letterSpacing: ".08em",
            textAlign: "center",
          }}
        >
          Skill Arrangement: First Row — HP. Second Row — AC. Third Row — MP.
        </div>


       {/* =====================================================
            CHARACTER STATISTICS
        ===================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(150px,1fr))",
            gap: 12,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          <EditableStatCard
            label="HP"
            value={g.hp}
            max={g.maxHp}
            onChange={(value) =>
              updateGuest("hp", value)
            }
          />

          <StatCard
            label="AC"
            value={g.ac}
          />

<StatCard
  label="MEMORY POOL"
  value={`${g.memoryPool} / ${g.maxMemoryPool}`}
/>

          <StatCard
            label="DREAD"
            value={g.dread}
            danger={g.dread > 0}
          />

          <StatCard
            label="PASSIVE PERCEPTION"
            value={calculatePassivePerception(g)}
          />

          <StatCard
            label="MOVEMENT"
            value={`${g.movement} ft`}
          />
        </div>


{/* =====================================================
    MEMORY & DREAD
===================================================== */}

<section
  style={{
    marginTop: 24,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  }}
>
  <div
    style={{
      marginBottom: 18,
    }}
  >
    <div
      style={{
        color: colors.gold,
        fontSize: 15,
        letterSpacing: ".16em",
        textTransform: "uppercase",
      }}
    >
      Internal Battle
    </div>

    <h2
      style={{
        margin: "6px 0 0",
        color: colors.goldBright,
        fontWeight: 400,
      }}
    >
      Identity & Dread
    </h2>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "110px minmax(220px, 1fr) 110px",
      alignItems: "center",
      gap: 18,
    }}
  >
                      {/* DREAD */}

                      <div
                        style={{
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            color: "#b86b6b",
                            fontSize: 15,
                            letterSpacing: ".16em",
                            textTransform: "uppercase",
                          }}
                        >
                          Dread
                        </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: "#b86b6b",
                      fontSize: 30,
                      letterSpacing: ".08em",
                    }}
                  >
                   {dreadDie}
                  </div>
    </div>

    {/* LEVER */}

    <div
      style={{
        position: "relative",
        height: 76,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Mechanical track */}

      <div
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          top: "50%",
          height: 10,
          transform: "translateY(-50%)",
          borderRadius: 999,
          background:
            "linear-gradient(90deg, #7e3030 0%, #9d5555 22%, #766e58 50%, #82906d 78%, #667956 100%)",
          border:
            "1px solid rgba(210,195,150,.25)",
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,.8), 0 1px 5px rgba(0,0,0,.5)",
        }}
      />

      {/* Center guide */}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 2,
          height: 24,
          transform: "translate(-50%, -50%)",
          background:
            "rgba(235,220,180,.3)",
          pointerEvents: "none",
        }}
      />

      {/* Lever handle */}

      <div
        style={{
          position: "absolute",
          left: `calc(${(dread / 20) * 100}%)`,
          top: "50%",
          width: 30,
          height: 48,
          transform:
            "translate(-50%, -50%)",
          borderRadius: 6,
          background:
            "linear-gradient(180deg, #292821 0%, #11110f 100%)",
          border:
            "2px solid #d0bd83",
          boxShadow:
            "0 0 0 2px rgba(0,0,0,.65), 0 0 16px rgba(200,185,145,.22)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        {/* Handle grip */}

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 7,
            width: 8,
            height: 30,
            transform: "translateX(-50%)",
            borderRadius: 4,
            background:
              "linear-gradient(180deg, #e1d19b, #8f7b4e)",
            boxShadow:
              "0 0 8px rgba(220,200,140,.3)",
          }}
        />
      </div>

      {/* Actual control */}

      <input
        type="range"
        min={0}
        max={20}
        step={1}
        value={dread}
        onChange={(event) =>
          updateDread(
            Number(event.target.value)
          )
        }
        aria-label="Dread and Memory balance"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          margin: 0,
          opacity: 0,
          cursor: "ew-resize",
          zIndex: 5,
        }}
      />

      {/* DREAD label */}

      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: -2,
          color: "#b86b6b",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: ".14em",
          pointerEvents: "none",
        }}
      >
        DREAD
      </div>

      {/* MEMORY label */}

      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: -2,
          color: "#9cab82",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: ".14em",
          pointerEvents: "none",
        }}
      >
        Identity
      </div>
    </div>

    {/* MEMORY */}

    <div
      style={{
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 13,
          letterSpacing: ".16em",
          textTransform: "uppercase",
        }}
      >
        Identity
      </div>

      <div
        style={{
          marginTop: 6,
          color: colors.goldBright,
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        {"1d20"}
      </div>
    </div>
  </div>


  


{dreadGained && Number(guest.dread) > 0 && (
  <div
    style={{
      color: "#a65b5b",
      fontFamily: "Georgia, serif",
      fontStyle: "italic",
      textAlign: "center",
      padding: "12px",
      animation: "fadeIn 0.5s ease-in",
    }}
  >
    {Number(guest.dread) >= 20 ? (
      <>
        The Basement door is open.
        <div
          style={{
            color: "#9d9a8d",
            fontSize: "13px",
            marginTop: "6px",
          }}
        >
          They are waiting for you.
        </div>
      </>
    ) : (
      <>
        Your Dread has increased.
        <div
          style={{
            color: "#9d9a8d",
            fontSize: "13px",
            marginTop: "6px",
          }}
        >
          The Hotel claims another number from your 1d20.
          <br />
          Your fate is no longer entirely your own.
        </div>
      </>
    )}

    <button
      onClick={() => setDreadGained(false)}
      style={{
        marginTop: "8px",
        background: "transparent",
        border: "none",
        color: "#c8b991",
        cursor: "pointer",
        fontFamily: "Georgia, serif",
      }}
    >
      Understood
    </button>
  </div>
)}



  {/* MESSAGE */}

  <div
    style={{
      marginTop: 24,
      paddingTop: 16,
      borderTop:
        `1px solid ${colors.border}`,
      color: colors.muted,
      fontSize: 15,
      lineHeight: 1.6,
      textAlign: "center",
    }}
  >
    {getDreadMessage(
      dread,
      maxMemory
    )}
  </div>
</section>

<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={cycleRecovery}
    style={{
      padding: "10px 16px",
      border: `1px solid ${colors.border}`,
      background: colors.gold,
      color: "#000000",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
    }}
  >
    Cycle Recovery
  </button>

  <button
    type="button"
    onClick={recovery}
    style={{
      padding: "10px 16px",
      border: `1px solid ${colors.border}`,
      background: colors.gold,
      color: "#000000",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
    }}
  >
    Recovery
  </button>

  <button
  type="button"
  onClick={() => {
    console.log("Force Recovery clicked");
    forceRecovery();
  }}
  style={{
    padding: "10px 16px",
    border: `1px solid ${colors.border}`,
    background: colors.gold,
    color: "#000000",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
  }}
>
  Force Recovery
</button>
</div>

{/* =====================================================
    ABILITIES
===================================================== */}

<section
  style={{
    marginTop: 24,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  }}
>
  <div style={{ marginBottom: 18 }}>
    <div
      style={{
        color: colors.gold,
        fontSize: 10,
        letterSpacing: ".16em",
        textTransform: "uppercase",
      }}
    >
      Core Abilities
    </div>

    <h2
      style={{
        margin: "6px 0 0",
        color: colors.goldBright,
        fontWeight: 400,
      }}
    >
      Abilities
    </h2>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 16,
    }}
  >
    {/* MIND */}
    <div
      style={{
        border: `1px solid ${colors.border}`,
        padding: 18,
        background: "rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Mind
      </div>

      <input
        type="text"
        value={g.abilities.Mind.name}
        placeholder="Mind Ability Name"
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Mind: {
                  ...previous.abilities.Mind,
                  name: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 10,
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 15,
        }}
      />

      <textarea
        value={g.abilities.Mind.description}
        placeholder="Mind Ability Description"
        rows={5}
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Mind: {
                  ...previous.abilities.Mind,
                  description: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />
    </div>

    {/* BODY */}
    <div
      style={{
        border: `1px solid ${colors.border}`,
        padding: 18,
        background: "rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Body
      </div>

      <input
        type="text"
        value={g.abilities.Body.name}
        placeholder="Body Ability Name"
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Body: {
                  ...previous.abilities.Body,
                  name: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 10,
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 15,
        }}
      />

      <textarea
        value={g.abilities.Body.description}
        placeholder="Body Ability Description"
        rows={5}
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Body: {
                  ...previous.abilities.Body,
                  description: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />
    </div>

    {/* HEART */}
    <div
      style={{
        border: `1px solid ${colors.border}`,
        padding: 18,
        background: "rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Heart
      </div>

      <input
        type="text"
        value={g.abilities.Heart.name}
        placeholder="Heart Ability Name"
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Heart: {
                  ...previous.abilities.Heart,
                  name: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 10,
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 15,
        }}
      />

      <textarea
        value={g.abilities.Heart.description}
        placeholder="Heart Ability Description"
        rows={5}
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Heart: {
                  ...previous.abilities.Heart,
                  description: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />
    </div>

    {/* EGO */}
    <div
      style={{
        border: `1px solid ${colors.border}`,
        padding: 18,
        background: "rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Ego
      </div>

      <input
        type="text"
        value={g.abilities.Ego.name}
        placeholder="Ego Ability Name"
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Ego: {
                  ...previous.abilities.Ego,
                  name: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 10,
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 15,
        }}
      />

      <textarea
        value={g.abilities.Ego.description}
        placeholder="Ego Ability Description"
        rows={5}
        onChange={(event) =>
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              abilities: {
                ...previous.abilities,
                Ego: {
                  ...previous.abilities.Ego,
                  description: event.target.value,
                },
              },
            })
          )
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />
    </div>
  </div>
</section>

{/* ROLES */}
<section
  style={{
    marginTop: 24,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  }}
>
  <div style={{ marginBottom: 18 }}>
    <div
      style={{
        color: colors.gold,
        fontSize: 20,
        textAlign: "center",
        letterSpacing: ".16em",
        textTransform: "uppercase",
      }}
    >
      Character Roles
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 16,
    }}
  >
    {[g.role, g.role2].map((role, index) => {
      const details = ROLE_DETAILS[role];

      return (
        <div
          key={`${role}-${index}`}
          style={{
            border: `1px solid ${colors.border}`,
            padding: 18,
            background: "rgba(0,0,0,.12)",
          }}
        >
<h3
  style={{
    margin: "0 0 18px",
    color: colors.goldBright,
    fontWeight: 400,
    fontSize: 22,
  }}
>
  <RoleHover
    label={role || "No Role Selected"}
    description={ROLE_GUIDE_DETAILS[role]?.description}
  />
</h3>

<div
  style={{
    marginBottom: 16,
  }}
>
  <div
    style={{
      color: colors.gold,
      fontSize: 10,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      marginBottom: 6,
    }}
  >
    Proficiencies
  </div>

  <div
    style={{
      color: colors.text,
      fontSize: 14,
    }}
  >
    {ROLE_PROFICIENCIES[role]?.join(" · ") || "—"}
  </div>
</div>

          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Role Action
            </div>

            <div style={{ color: colors.text, fontSize: 18 }}>
  <RoleHover
    label={details?.action || "—"}
    description={ROLE_GUIDE_DETAILS[role]?.actionDescription}
  />
</div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 12,
            }}
          >
            <div
              style={{
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Passive
            </div>

            <div style={{ color: colors.text, fontSize: 18 }}>
  <RoleHover
    label={details?.passive || "—"}
    description={ROLE_GUIDE_DETAILS[role]?.passiveDescription}
  />
</div>
          </div>
        </div>
      );
    })}
  </div>

  <p
  style={{
    margin: "14px 0 0",
    paddingTop: 12,
    borderTop: `1px solid ${colors.border}`,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 1.5,
    fontStyle: "italic",
  }}
>
<strong
  style={{
    color: colors.gold,
    fontSize: 13,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    fontStyle: "normal",
    marginRight: 8,
  }}
>
  Role Proficiency
</strong>

    The Hotel recognizes what comes naturally to you. When making a roll using
    a skill tied to your role, you may use half your skil modifier,
    rounded up. Note: +1 modifier remains +1.
  </p>
</section>

{/* =====================================================
    TOTEMS
===================================================== */}

<section
  style={{
    marginTop: 24,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      marginBottom: 18,
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
        }}
      >
        Personal Objects
      </div>

      <h2
        style={{
          margin: "6px 0 0",
          color: colors.goldBright,
          fontWeight: 400,
        }}
      >
        Totems
      </h2>
    </div>

    <button
      type="button"
      onClick={() => {
        setGuest((previous) =>
          normalizeGuest({
            ...previous,
            totems: [
              ...previous.totems,
              {
                id: crypto.randomUUID(),
                name: "",
                description: "",
                uses: 0,
              },
            ],
          })
        );
      }}
      style={{
        padding: "10px 16px",
        background: "transparent",
        border: `1px solid ${colors.border}`,
        color: colors.goldBright,
        fontSize: 10,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      + ADD TOTEM
    </button>
  </div>

  {g.totems.length === 0 ? (
    <div
      style={{
        padding: 24,
        border: `1px dashed ${colors.border}`,
        color: colors.muted,
        textAlign: "center",
        fontSize: 13,
      }}
    >
      No Totems recorded.
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 16,
      }}
    >
      {g.totems.map((totem, index) => (
        <div
          key={totem.id}
          style={{
            border: `1px solid ${colors.border}`,
            padding: 18,
            background: "rgba(0,0,0,.12)",
          }}
        >
          <div
            style={{
              color: colors.gold,
              fontSize: 10,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Totem {index + 1}
          </div>

          <input
            type="text"
            value={totem.name}
            placeholder="Totem Name"
            onChange={(event) => {
              const value = event.target.value;

              setGuest((previous) =>
                normalizeGuest({
                  ...previous,
                  totems: previous.totems.map((item) =>
                    item.id === totem.id
                      ? {
                          ...item,
                          name: value,
                        }
                      : item
                  ),
                })
              );
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              marginBottom: 10,
              background: "rgba(0,0,0,.25)",
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: 15,
            }}
          />

          <textarea
            value={totem.description}
            placeholder="Totem Description"
            rows={5}
            onChange={(event) => {
              const value = event.target.value;

              setGuest((previous) =>
                normalizeGuest({
                  ...previous,
                  totems: previous.totems.map((item) =>
                    item.id === totem.id
                      ? {
                          ...item,
                          description: value,
                        }
                      : item
                  ),
                })
              );
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              marginBottom: 12,
              background: "rgba(0,0,0,.25)",
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: 13,
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <label
              style={{
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              Uses
            </label>

            <input
              type="number"
              min={0}
              value={totem.uses}
              onChange={(event) => {
                const value = Math.max(
                  0,
                  Number(event.target.value) || 0
                );

                setGuest((previous) =>
                  normalizeGuest({
                    ...previous,
                    totems: previous.totems.map((item) =>
                      item.id === totem.id
                        ? {
                            ...item,
                            uses: value,
                          }
                        : item
                    ),
                  })
                );
              }}
              style={{
                width: 80,
                boxSizing: "border-box",
                padding: "8px 10px",
                background: "rgba(0,0,0,.25)",
                border: `1px solid ${colors.border}`,
                color: colors.text,
                fontSize: 14,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setGuest((previous) =>
                normalizeGuest({
                  ...previous,
                  totems: previous.totems.filter(
                    (item) => item.id !== totem.id
                  ),
                })
              );
            }}
            style={{
              padding: "9px 14px",
              background: "transparent",
              border: "1px solid rgba(180,70,70,.55)",
              color: "#c87979",
              fontSize: 10,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            REMOVE TOTEM
          </button>
        </div>
      ))}
    </div>
  )}
</section>

{/* =====================================================
    GIFTS
===================================================== */}

<section
  style={{
    ...panelStyle,
    marginTop: 16,
  }}
>
  <div
    style={{
      marginBottom: 18,
    }}
  >
    <div
      style={{
        color: colors.gold,
        fontSize: 10,
        letterSpacing: ".16em",
        textTransform: "uppercase",
      }}
    >
      Personal Effects
    </div>

    <h2
      style={{
        margin: "6px 0 0",
        color: colors.goldBright,
        fontWeight: 400,
      }}
    >
      Gifts
    </h2>
  </div>
  <button
    type="button"
    onClick={() => {
      setGuest((previous) =>
        normalizeGuest({
          ...previous,
          gifts: [
            ...previous.gifts,
            {
              id: crypto.randomUUID(),
              name: "",
              description: "",
              uses: 0,
            },
          ],
        })
      );
    }}
    style={{
      padding: "10px 16px",
      background: "transparent",
      border: `1px solid ${colors.border}`,
      color: colors.goldBright,
      fontSize: 10,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      cursor: "pointer",
      marginBottom: 10,
    }}
  >
    + ADD GIFT
  </button>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  }}
>

    {g.gifts.map((gift, index) => (
    <div
      key={gift.id}
      style={{
        border: `1px solid ${colors.border}`,
        padding: 18,
        background: "rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Gift {index + 1}
      </div>
            <input
        type="text"
        value={gift.name}
        placeholder="Gift Name"
        onChange={(event) => {
          const value = event.target.value;

          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              gifts: previous.gifts.map((item) =>
                item.id === gift.id
                  ? {
                      ...item,
                      name: value,
                    }
                  : item
              ),
            })
          );
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 10,
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 15,
        }}
      />

            <textarea
        value={gift.description}
        placeholder="Gift Description"
        rows={5}
        onChange={(event) => {
          const value = event.target.value;

          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              gifts: previous.gifts.map((item) =>
                item.id === gift.id
                  ? {
                      ...item,
                      description: value,
                    }
                  : item
              ),
            })
          );
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 12,
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />
          <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <label
          style={{
            color: colors.gold,
            fontSize: 10,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          Uses
        </label>

        <input
          type="number"
          min={0}
          value={gift.uses}
          onChange={(event) => {
            const value = Math.max(
              0,
              Number(event.target.value) || 0
            );

            setGuest((previous) =>
              normalizeGuest({
                ...previous,
                gifts: previous.gifts.map((item) =>
                  item.id === gift.id
                    ? {
                        ...item,
                        uses: value,
                      }
                    : item
                ),
              })
            );
          }}
          style={{
            width: 80,
            boxSizing: "border-box",
            padding: "8px 10px",
            background: "rgba(0,0,0,.25)",
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: 14,
          }}
        />
      </div>
          <button
        type="button"
        onClick={() => {
          setGuest((previous) =>
            normalizeGuest({
              ...previous,
              gifts: previous.gifts.filter(
                (item) => item.id !== gift.id
              ),
            })
          );
        }}
        style={{
          padding: "9px 14px",
          background: "transparent",
          border: "1px solid rgba(180,70,70,.55)",
          color: "#c87979",
          fontSize: 10,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        REMOVE GIFT
      </button>
    </div>
  ))}
  </div>
</section>

  </>
)}

{roomTab === "information" && (
  <>
        {/* =====================================================
            GUEST MEMORIES
        ===================================================== */}

        <section
          style={{
            ...panelStyle,
            marginTop: 16,
          }}
        >
          <h2
            style={{
              color: colors.goldBright,
              fontWeight: 400,
              margin: 0,
            }}
          >
            Guest Memories & History
          </h2>

          <div
            style={{
              color: colors.muted,
              fontSize: 12,
              marginTop: 5,
              marginBottom: 16,
            }}
          >
            What the guest carries with them
            into Paradise Hotel.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr)",
              gap: 16
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  color: colors.muted,
                  fontSize: 11,
                  marginBottom: 6,
                }}
              >
                Important Experience
              </label>

              <textarea
                value={g.important}
                onChange={(e) =>
                  updateGuest(
                    "important",
                    e.target.value
                  )
                }
                placeholder="What experience is important to who they are right now?"
                rows={5}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: colors.muted,
                  fontSize: 11,
                  marginBottom: 6,
                }}
              >
                Fears
              </label>

              <textarea
                value={g.fears}
                onChange={(e) =>
                  updateGuest(
                    "fears",
                    e.target.value
                  )
                }
                placeholder="What does this guest fear?"
                rows={5}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: colors.muted,
                  fontSize: 11,
                  marginBottom: 6,
                }}
              >
                Traumatic Experience
              </label>

              <textarea
                value={g.trauma}
                onChange={(e) =>
                  updateGuest(
                    "trauma",
                    e.target.value
                  )
                }
                placeholder="What traumatic experience shaped this guest?"
                rows={5}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: colors.muted,
                  fontSize: 11,
                  marginBottom: 6,
                }}
              >
                Remember Last
              </label>

              <textarea
                value={g.lastMemory}
                onChange={(e) =>
                  updateGuest(
                    "lastMemory",
                    e.target.value
                  )
                }
                placeholder="What is the last thing this guest remembers?"
                rows={5}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            PURPOSE OF STAY
        ===================================================== */}

        <section
          style={{
            ...panelStyle,
            marginTop: 16,
          }}
        >
          <h2
            style={{
              color: colors.goldBright,
              fontWeight: 400,
              margin: 0,
            }}
          >
            Purpose of Stay
          </h2>

          <div
            style={{
              color: colors.muted,
              fontSize: 12,
              marginTop: 5,
              marginBottom: 12,
            }}
          >
            Why this guest has come to
            Paradise Hotel.
          </div>

          <textarea
            value={g.purpose}
            onChange={(e) =>
              updateGuest(
                "purpose",
                e.target.value
              )
            }
            placeholder="What brought this guest to Paradise Hotel?"
            rows={5}
            style={{
              ...inputStyle,
              width: "100%",
              resize: "vertical",
            }}
          />
        </section>

{/* =====================================================
    LUGGAGE
===================================================== */}

<section
  style={{
    marginTop: 24,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  }}
>
  <div
    style={{
      marginBottom: 18,
    }}
  >
    <div
      style={{
        color: colors.gold,
        fontSize: 10,
        letterSpacing: ".16em",
        textTransform: "uppercase",
      }}
    >
      Personal Effects
    </div>

    <h2
      style={{
        margin: "6px 0 0",
        color: colors.goldBright,
        fontWeight: 400,
      }}
    >
      Luggage
    </h2>
  </div>

  <textarea
    value={g.luggage}
    placeholder="What did you bring with you?"
    rows={8}
    onChange={(event) =>
      setGuest((previous) =>
        normalizeGuest({
          ...previous,
          luggage: event.target.value,
        })
      )
    }
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "10px 12px",
      background: "rgba(0,0,0,.25)",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      fontSize: 13,
      lineHeight: 1.5,
      resize: "vertical",
    }}
  />
</section>

{/* =====================================================
    MIND MAP
===================================================== */}

<section
  style={{
    marginTop: 24,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      marginBottom: 18,
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
        }}
      >
        Thoughts & Fragments
      </div>

      <h2
        style={{
          margin: "6px 0 0",
          color: colors.goldBright,
          fontWeight: 400,
        }}
      >
        Mind Map
      </h2>
    </div>

    <button
      type="button"
      onClick={() => {
        setGuest((previous) =>
          normalizeGuest({
            ...previous,
            notes: [
              ...previous.notes,
              "",
            ],
          })
        );
      }}
      style={{
        padding: "10px 16px",
        background: "transparent",
        border: `1px solid ${colors.border}`,
        color: colors.goldBright,
        fontSize: 10,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      + NOTES
    </button>
  </div>

  {g.notes.length === 0 ? (
    <div
      style={{
        padding: 24,
        border: `1px dashed ${colors.border}`,
        color: colors.muted,
        textAlign: "center",
        fontSize: 13,
      }}
    >
      No notes recorded.
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {g.notes.map((note, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <div
            style={{
              minWidth: 28,
              paddingTop: 10,
              color: colors.gold,
              fontSize: 10,
              letterSpacing: ".08em",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </div>

          <textarea
            value={note}
            placeholder="Write a thought, clue, memory, or idea..."
            rows={2}
            onChange={(event) => {
              const value = event.target.value;

              setGuest((previous) =>
                normalizeGuest({
                  ...previous,
                  notes: previous.notes.map(
                    (item, noteIndex) =>
                      noteIndex === index
                        ? value
                        : item
                  ),
                })
              );
            }}
            style={{
              flex: 1,
              boxSizing: "border-box",
              padding: "10px 12px",
              background: "rgba(0,0,0,.25)",
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: 13,
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />

          <button
            type="button"
            onClick={() => {
              setGuest((previous) =>
                normalizeGuest({
                  ...previous,
                  notes: previous.notes.filter(
                    (_, noteIndex) =>
                      noteIndex !== index
                  ),
                })
              );
            }}
            style={{
              padding: "9px 12px",
              marginTop: 1,
              background: "transparent",
              border:
                "1px solid rgba(180,70,70,.55)",
              color: "#c87979",
              fontSize: 10,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            REMOVE
          </button>
        </div>
      ))}
    </div>
  )}
</section>

        {/* =====================================================
            HOTEL NOTES
        ===================================================== */}

        <section
          style={{
            ...panelStyle,
            marginTop: 16,
          }}
        >
          <h2
            style={{
              color: colors.goldBright,
              fontWeight: 400,
              margin: 0,
            }}
          >
            Hotel Notes
          </h2>

          <div
            style={{
              color: colors.muted,
              fontSize: 12,
              marginTop: 5,
              marginBottom: 12,
            }}
          >
            Notes recorded about this guest
            during their stay.
          </div>

          <textarea
            value={g.hotelNotes}
            onChange={(e) =>
              updateGuest(
                "hotelNotes",
                e.target.value
              )
            }
            placeholder="Write anything the Hotel should remember..."
            rows={6}
            style={{
              ...inputStyle,
              width: "100%",
              resize: "vertical",
            }}
          />
        </section>

        </>
      )}
      </div>
    </main>
  );
}

function renderServicesPage(
  loungeBarOpen: boolean,
  setLoungeBarOpen: React.Dispatch<React.SetStateAction<boolean>>
) {

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${colors.border}`,
    background: "rgba(8, 20, 16, 0.95)",
    padding: 22,
  };

  const categoryStyle: React.CSSProperties = {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    marginBottom: 8,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    color: colors.goldBright,
    fontSize: 20,
    fontWeight: 500,
  };

  const textStyle: React.CSSProperties = {
    margin: "10px 0 0",
    color: colors.muted,
    fontSize: 14,
    lineHeight: 1.7,
  };

  const actionButtonStyle: React.CSSProperties = {
    marginTop: 16,
    width: "100%",
    padding: "11px 14px",
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.goldBright,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: ".08em",
  };

  if (loungeBarOpen) {

    if (barMenuOpen) {

    if (selectedDrink) {
  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage:
        `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        color: colors.text,
        padding: "24px 18px 50px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <section style={cardStyle}>
          <div style={categoryStyle}>
            {selectedDrink.purpose}
          </div>

          <h2 style={titleStyle}>
            {selectedDrink.name}
          </h2>

          <p style={textStyle}>
            {selectedDrink.description}
          </p>

          <div
  style={{
    marginTop: 16,
    color: colors.gold,
    fontSize: 13,
  }}
>
  Cost: {selectedDrink.cost} Memory Pool
</div>

<button
  type="button"
onClick={async () => {
  const cost = Number(selectedDrink.cost) || 0;
  const currentMemory = Number(guest.memoryPool) || 0;

  if (currentMemory < cost) {
    alert("You do not have enough Memory Pool.");
    return;
  }

  const updatedGuest = {
    ...guest,
    memoryPool: currentMemory - cost,
  };

  setGuest(updatedGuest);
  setGuests((previous) =>
    previous.map((g) =>
      g.id === updatedGuest.id
        ? updatedGuest
        : g
    )
  );

  await saveGuest(updatedGuest);

  alert(`You order ${selectedDrink.name}.`);
}}
  style={actionButtonStyle}
>
  Drink
</button>

          <button
            type="button"
            onClick={() => setSelectedDrink(null)}
            style={actionButtonStyle}
          >
            Return to Drinks
          </button>
        </section>
      </div>
    </main>
  );
}

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",
        color: colors.text,
        padding: "24px 18px 50px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <section style={cardStyle}>
          <div style={categoryStyle}>Refreshments</div>

          <h2 style={titleStyle}>The Bar</h2>

          <p style={textStyle}>
            Tonight's selection is waiting.
          </p>

          <div
  style={{
    marginTop: 20,
    display: "grid",
    gap: 14,
  }}
>

  {todaysDrinks.map((drink) => (
    <div
      key={drink.name}
      onClick={() => setSelectedDrink(drink)}
      style={{
        padding: "16px",
        border: `1px solid ${colors.border}`,
        background: "rgba(255,255,255,.02)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        {drink.purpose}
      </div>

      <h3
        style={{
          margin: "8px 0 0",
          color: colors.text,
          fontSize: 18,
        }}
      >
        {drink.name}
      </h3>

      <p style={textStyle}>
        {drink.description}
      </p>
    </div>
  ))}
</div>

          <button
            type="button"
            onClick={() => setBarMenuOpen(false)}
            style={actionButtonStyle}
          >
            Return to Lounge & Bar
          </button>
        </section>
      </div>
    </main>
  );
}

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",
        color: colors.text,
        padding: "24px 18px 50px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <section style={cardStyle}>
  <div style={categoryStyle}>Lounge</div>

  <h2 style={titleStyle}>The Lounge</h2>

  <p style={textStyle}>
    A quiet place to rest, talk, and spend time with the other guests
    and staff of the Hotel.
  </p>

  <p style={textStyle}>
    Sometimes, simply being around someone is enough to make the Hotel
    feel a little less heavy.
  </p>

  <p style={textStyle}>
    Play a little music. Enjoy your 'Me' time. Relax.
  </p>

  <div
    style={{
      marginTop: 20,
      padding: "14px 15px",
      borderLeft: `3px solid ${colors.gold}`,
      background: "rgba(255,255,255,.02)",
    }}
  >
    <div
      style={{
        color: colors.muted,
        fontSize: 15,
        lineHeight: 1.6,
      }}
    >
      Guests are encouraged to spend time with others.
      Conversation, companionship, and shared moments can help soothe
      the weight carried through the Hotel.
    </div>
  </div>

  <button
  type="button"
  onClick={() => {
    alert("The Hotel approves of you interacting with the others. Ask the DM how much Dread are reduced.");
  }}
  style={actionButtonStyle}
>
  Interact with other Guests
</button>

    <button
    type="button"
    onClick={() => setLoungeBarOpen(false)}
    style={actionButtonStyle}
  >
    Leave Lounge
  </button>

</section>

      </div>
    </main>
  );
}

  return (
    <main
style={{
  minHeight: "100vh",
  width: "100%",
  backgroundImage: `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",
  color: colors.text,
  padding: "24px 18px 50px",
}}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
<div style={{ marginBottom: 20 }}>
  <Button onClick={() => setPage("hub")}>
    Back
  </Button>
</div>

        <section
          style={{
            borderTop: `1px solid ${colors.gold}`,
            borderBottom: `1px solid ${colors.border}`,
            padding: "28px 4px 24px",
            background: "Transparent",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              color: colors.gold,
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Paradise Hotel
          </div>

          <h1
            style={{
              margin: 0,
              color: colors.goldBright,
              fontSize: 34,
              fontWeight: 400,
            }}
          >
            Hotel Services
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: colors.muted,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            The Hotel provides several services for its guests.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          
{/* INDOOR POOL */}
<section style={cardStyle}>
  <div style={categoryStyle}>Guest Services</div>

  <h2 style={titleStyle}>Indoor Pool</h2>

  <p style={textStyle}>
    The Indoor Pool provides a quiet place to soothe the mind.
    Guests who enter the water may reduce their current Dread by half,
    rounded down.
  </p>

  <p style={textStyle}>
    The water is calm, warm, and remarkably still. Guests are advised
    not to venture toward the bottom of the pool.
  </p>

  <div
    style={{
      marginTop: 18,
      padding: "14px 15px",
      borderLeft: `3px solid ${colors.gold}`,
      background: "rgba(255,255,255,.02)",
    }}
  >
    <div
      style={{
        color: colors.muted,
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      Please remain within the marked depth.
    </div>
  </div>

<button
  type="button"
  onClick={() => setPage("mneme")}
  style={actionButtonStyle}
>
  Visit Mnēmosynē
</button>

</section>

{/* LOUNGE */}
<section
  style={{
    ...cardStyle,
    cursor: "pointer",
  }}
  onClick={() => {
    setBarMenuOpen(false);
    setLoungeBarOpen(true);
  }}
>
  <div style={categoryStyle}>Hospitality</div>

  <h2 style={titleStyle}>Lounge</h2>

  <p style={textStyle}>
    A quiet place to relax, socialize, and spend time with other guests
    and staff.
  </p>

    <p style={textStyle}>
    No negativity is allowed in the Lounge. Only good meals and laughter.
  </p>


  <div
    style={{
      marginTop: 18,
      padding: "14px",
      border: `1px solid ${colors.border}`,
      color: colors.muted,
      fontSize: 15  ,
    }}
  >
    Enter the Lounge.
  </div>
  
</section>

{/* BAR */}
<section
  style={{
    ...cardStyle,
    cursor: "pointer",
  }}
  onClick={() => {
  const categories = ["Forget", "Celebrate", "Truth", "Perception"];

  const selection = categories.map((category) => {
    const options = BAR_DRINKS.filter(
      (drink) => drink.category === category
    );

    return options[Math.floor(Math.random() * options.length)];
  });

  setTodaysDrinks(selection);
  setBarMenuOpen(true);
  setLoungeBarOpen(true);
}}
>
  <div style={categoryStyle}>Hospitality</div>

  <h2 style={titleStyle}>Bar</h2>

  <p style={textStyle}>
    A strange selection of drinks awaits. Every drink has a purpose.
  </p>

  <div
    style={{
      marginTop: 18,
      padding: "14px",
      border: `1px solid ${colors.border}`,
      color: colors.muted,
      fontSize: 15,
    }}
  >
    Enter the Bar.
  </div>
</section>
          
        </div>
      </div>
    </main>
  );
}

function renderGuidePage() {

  const previousGuideRole = () => {
  setGuideRoleIndex((current) =>
    current === 0 ? 7 : current - 1
  );
};

const nextGuideRole = () => {
  setGuideRoleIndex((current) =>
    current === 7 ? 0 : current + 1
  );
};
  
  const sectionStyle: React.CSSProperties = {
    border: `1px solid ${colors.border}`,
    background: "#101812",
    padding: 22,
    marginBottom: 18,
  };

  const sectionTitleStyle: React.CSSProperties = {
    margin: "0 0 16px",
    color: colors.goldBright,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: ".03em",
  };

  const coreCardStyle: React.CSSProperties = {
    border: `1px solid ${colors.border}`,
    background: "#101812",
    padding: 18,
  };

  const skillStyle: React.CSSProperties = {
    margin: "0 0 12px",
    color: colors.muted,
    lineHeight: 1.6,
    fontSize: 14,
  };

  return (
    <main
style={{
  minHeight: "100vh",
  width: "100%",
  backgroundImage:
  `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
  color: colors.text,
  padding: "24px 18px 50px",
}}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        {/* BACK */}
        <div style={{ marginBottom: 18 }}>
          <Button secondary onClick={() => setPage("hub")}>
            BACK
          </Button>
        </div>

        {/* HEADER */}
        <section
          style={{
            borderTop: `1px solid ${colors.gold}`,
            borderBottom: `1px solid ${colors.border}`,
            padding: "28px 4px 24px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              color: colors.gold,
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Paradise Hotel
          </div>

          <h1
            style={{
              margin: 0,
              color: colors.goldBright,
              fontSize: 34,
              fontWeight: 400,
              letterSpacing: ".02em",
            }}
          >
            Player Guide
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: colors.muted,
              lineHeight: 1.6,
              fontSize: 14,
            }}
          >
            A modest guide for guests who wish to understand the Hotel.
          </p>
        </section>

        {/* FOUR CORES */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            The Four Cores and Twelve Skills
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {/* MIND */}
            <div style={coreCardStyle}>
              <h3
                style={{
                  margin: "0 0 16px",
                  color: colors.gold,
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                Mind
              </h3>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Perception</strong>
                <br />
                Your ability to notice details, changes, and things that others might overlook.
              </p>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Knowledge</strong>
                <br />
                Your understanding of people, places, experiences, and the things you have learned.
              </p>

              <p style={{ ...skillStyle, marginBottom: 0 }}>
                <strong style={{ color: colors.text }}>Analysis</strong>
                <br />
                Your ability to connect fragments, recognize patterns, and make sense of what does not immediately fit.
              </p>
            </div>

            {/* BODY */}
            <div style={coreCardStyle}>
              <h3
                style={{
                  margin: "0 0 16px",
                  color: colors.gold,
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                Body
              </h3>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Might</strong>
                <br />
                Your physical strength, force, and ability to push through resistance.
              </p>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Agility</strong>
                <br />
                Your speed, reflexes, coordination, and ability to react when things suddenly change.
              </p>

              <p style={{ ...skillStyle, marginBottom: 0 }}>
                <strong style={{ color: colors.text }}>Endurance</strong>
                <br />
                Your ability to withstand pain, exhaustion, stress, and prolonged physical strain.
              </p>
            </div>

            {/* HEART */}
            <div style={coreCardStyle}>
              <h3
                style={{
                  margin: "0 0 16px",
                  color: colors.gold,
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                Heart
              </h3>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Empathy</strong>
                <br />
                Your ability to sense and experience emotions, even when they are difficult to understand or explain.
              </p>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Influence</strong>
                <br />
                Your ability to affect how others think, feel, respond, or see a situation.
              </p>

              <p style={{ ...skillStyle, marginBottom: 0 }}>
                <strong style={{ color: colors.text }}>Expression</strong>
                <br />
                Your ability to communicate thoughts, feelings, intentions, and parts of yourself.
              </p>
            </div>

            {/* EGO */}
            <div style={coreCardStyle}>
              <h3
                style={{
                  margin: "0 0 16px",
                  color: colors.gold,
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                Ego
              </h3>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Memory</strong>
                <br />
                Your ability to recall experiences, recognize what feels familiar, and hold onto what you have lived through.
              </p>

              <p style={skillStyle}>
                <strong style={{ color: colors.text }}>Self</strong>
                <br />
                Your sense of identity, boundaries, continuity, and the different parts that make you who you are.
              </p>

              <p style={{ ...skillStyle, marginBottom: 0 }}>
                <strong style={{ color: colors.text }}>Psyche</strong>
                <br />
                Your ability to endure fear, Dread, inner conflict, and pressure without losing your sense of yourself.
              </p>
            </div>
          </div>
        </section>

        {/* SKILL ALLOCATION + CORE DICE */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
            gap: 18,
            marginBottom: 18,
          }}
        >
          {/* SKILL ALLOCATION */}
          <section style={{ ...sectionStyle, marginBottom: 0 }}>
            <h2 style={sectionTitleStyle}>Skill Allocation</h2>

            <div
              style={{
                borderLeft: `3px solid ${colors.gold}`,
                padding: "12px 14px",
                background: "rgba(255,255,255,.025)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: colors.muted,
                  lineHeight: 1.7,
                  fontSize: 17,
                }}
              >
                Each individual Skill may contain{" "}
                <strong style={{ color: colors.text }}>
                  0–5 Skill Points
                </strong>
                . Your Guest Level determines your total Skill Point budget.
              </p>
            </div>
          </section>

          {/* CORE DICE */}
          <section style={{ ...sectionStyle, marginBottom: 0 }}>
            <h2 style={sectionTitleStyle}>Core Dice</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                border: `1px solid ${colors.border}`,
              }}
            >
              {[
                ["0", "None"],
                ["1–3", "1d4"],
                ["4–6", "1d6"],
                ["7–9", "1d8"],
                ["10–12", "1d10"],
                ["13+", "1d12"],
              ].map(([points, die], index) => (
                <div
                  key={points}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderBottom:
                      index < 4
                        ? `1px solid ${colors.border}`
                        : "none",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      color: colors.muted,
                      borderRight: `1px solid ${colors.border}`,
                      fontSize: 13,
                    }}
                  >
                    {points}
                  </div>

                  <div
                    style={{
                      padding: "10px 12px",
                      color: colors.goldBright,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {die}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                marginTop: 20,
                color: colors.muted,
                fontSize: 18,
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              <span>Skill Points in Core</span>
              <span>Core Die</span>
            </div>
          </section>
        </div>

        {/* STATISTICS */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Statistics</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {[
              [
                "AC",
                "5 + Perception + Agility + Expression + Psyche",
              ],
              [
                "HP",
                "(Analysis + Endurance + Influence + Self) × 5",
              ],
              [
                "Memory Pool",
                "Knowledge + Might + Empathy + Memory",
              ],
              [
                "Passive Perception",
                "13 + Perception",
              ],
            ].map(([name, formula]) => (
              <div
                key={name}
                style={{
                  border: `1px solid ${colors.border}`,
                  padding: "14px 16px",
                  background: "rgba(255,255,255,.018)",
                }}
              >
                <div
                  style={{
                    color: colors.gold,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}
                >
                  {name}
                </div>

                <code
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                  }}
                >
                  {formula}
                </code>
              </div>
            ))}
          </div>
        </section>

{/* ROLES */}
<section style={sectionStyle}>
  <h2 style={sectionTitleStyle}>Roles</h2>
  
<div
  style={{
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 16,
    alignItems: "center",
  }}
>

<button
  type="button"
  onClick={previousGuideRole}
  style={{
    width: 42,
    height: 42,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.goldBright,
    cursor: "pointer",
    fontSize: 22,
  }}
>
  ←
</button>

    {/* CARETAKER */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 0 ? "block" : "none",
  }}
>
      <div
        style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Role Name
      </div>

      <h3
        style={{
          margin: 0,
          color: colors.goldBright,
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        Caretaker
      </h3>

      <p style={skillStyle}>
        You look after the people around you. You keep others calm, help them
        recover, and make sure nobody is left behind.
      </p>

      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 14,
          marginTop: 14,
        }}
      >
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          Gentle Hands
        </strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are able to provide care for those in need. Healing and comfort
          are your specialty. Any items that can give either two, food or a
          simple bandage will inherit your healing or comforting effect.
        </p>
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 14,
        }}
      >
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          Care Bear
        </strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You know how someone feels using your perception. You know their pain
          and worries as if it is yours, cause the moment you touch them, you
          own it too.
        </p>

        <p style={{
          margin: 0,
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        }}>
          You give care to those in need. You give until there's nothing left
          for you.
        </p>
      </div>
    </div>

    {/* DREAMER */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 1 ? "block" : "none",
  }}
>      
<div style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Role Name
      </div>

      <h3 style={{
        margin: 0,
        color: colors.goldBright,
        fontSize: 22,
        fontWeight: 500,
      }}>
        Dreamer
      </h3>

      <p style={skillStyle}>
        You see things in a different light than the others. You are either
        optimistic or pessimistic. You either ignore the darkness that lurks
        or embrace it.
      </p>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        marginTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          Twin Forms: Daydream or Nightmare
        </strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          <strong style={{ color: colors.text }}>Daydream:</strong>{" "}
          You pull a wool of wonder in your eyes and see things in a silver
          lining. You believe in happy endings and that the good guys will
          win. You give a +3 in rolls for people around you (15ft).
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          <strong style={{ color: colors.text }}>Nightmare:</strong>{" "}
          You pull out the fantasies and face the music. You have true sight
          and are able to see the Dread that lingers in the air. In this form
          you deal additional dread damage if you have dread. You roll a dice
          equal to your dread count.
        </p>

        <p style={{
          margin: "10px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          fontSize: 13,
        }}>
          Note: Your forms move with your Dread count.
        </p>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          Dreamwalk
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are always in a state of dream. Everything is hazy and you don't
          recall information as much as other people.
        </p>

        <p style={{
          margin: "12px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        }}>
          In your eyes, everything is fictitious or a dreadful event.
        </p>
      </div>
    </div>

    {/* GUARDIAN */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 2 ? "block" : "none",
  }}
>
        <div style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Role Name
      </div>

      <h3 style={{
        margin: 0,
        color: colors.goldBright,
        fontSize: 22,
        fontWeight: 500,
      }}>
        Guardian
      </h3>

      <p style={skillStyle}>
        You are the one who stands between everyone else and danger. You don't
        have time to be afraid. You don't have time to wonder why the monsters
        are here.
      </p>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        marginTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          Come At Me
        </strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are able to force a monster to focus on you. Choose a monster
          within 30 ft that can see or hear you. You force its attention onto
          you.
        </p>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          Iron Clad
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are the least affected by Dread. You are too busy protecting
          everyone else, you simply forgot to check on yourself.
        </p>

        <p style={{
          margin: "12px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        }}>
          You spend so much time protecting everyone else that you forget to
          ask who is protecting you.
        </p>
      </div>
    </div>

    {/* ADVERSARY */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 3 ? "block" : "none",
  }}
>
        <div style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Role Name
      </div>

      <h3 style={{
        margin: 0,
        color: colors.goldBright,
        fontSize: 22,
        fontWeight: 500,
      }}>
        Adversary
      </h3>

      <p style={skillStyle}>
        You face problems head-on. When something stands in your way, you don't
        hesitate to confront it, break it, or make it regret ever getting in
        your way.
      </p>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        marginTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          Weaponized
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          Any object you touch inherits your will to harm. It changes form into
          any weapon you wish to wield, except for projectile weapons. The
          object can become the weapon itself, but it cannot create or
          transform the bullets, arrows, or other projectiles needed to use it.
        </p>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          Berserk Blood
        </strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are prone to losing control, especially when affected by Dread.
          Each successful attack feeds your Berserk. The more you attack, the
          deeper you lose yourself to it.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          While in Berserk, you gain Dread. You attack without discrimination,
          and anything you hate becomes the focus of your wrath.
        </p>

        <strong style={{
          display: "block",
          color: colors.text,
          marginTop: 12,
        }}>
          Berserk
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          Successful attacks build Berserk. The deeper you enter Berserk, the
          harder it becomes to control who or what you attack.
        </p>

        <p style={{
          margin: "12px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        }}>
          You learned to fight before you learned to feel, and sometimes anger
          is easier than remembering why you're hurting.
        </p>
      </div>
    </div>

    {/* ARCHIVIST */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 4 ? "block" : "none",
  }}
>
        <div style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Role Name
      </div>

      <h3 style={{
        margin: 0,
        color: colors.goldBright,
        fontSize: 22,
        fontWeight: 500,
      }}>
        Archivist
      </h3>

      <p style={skillStyle}>
        You remember what others forget. You collect information, recognize
        patterns, and hold onto details that might otherwise disappear.
      </p>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        marginTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          Paper Trail
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          Everyone leaves a record. Nothing comes and goes without the Hotel
          knowing—not even the dead.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          When you inspect a person, object, or location, you can see the
          traces they have left behind. This may reveal past events, previous
          owners, actions taken, or other information connected to what you are
          investigating.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          The Hotel keeps every record. You are simply able to read them.
        </p>

        <p style={{
          margin: "10px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          fontSize: 13,
        }}>
          Be careful, though. You might discover something more than you can
          chew.
        </p>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          True Record
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You never forget a detail. Once seen, once read, once heard, it stays
          with you.
        </p>

        <p style={{
          margin: "12px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        }}>
          The cost is that this includes everything. Nothing you'd rather
          forget ever truly fades.
        </p>
      </div>
    </div>

    {/* DIPLOMAT */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 5 ? "block" : "none",
  }}
>
        <div style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Role Name
      </div>

      <h3 style={{
        margin: 0,
        color: colors.goldBright,
        fontSize: 22,
        fontWeight: 500,
      }}>
        Diplomat
      </h3>

      <p style={skillStyle}>
        You understand people. You know when to speak, when to listen, when to
        persuade, and when a small lie might make things easier.
      </p>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        marginTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          Social Butterfly
        </strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You can talk your way through almost anything, even with Anomalies
          hungry for your memories.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          You roll with <strong style={{ color: colors.text }}>Advantage</strong>{" "}
          when initiating conversations. When two parties come into conflict,
          you can intervene and put the fight on hold, giving everyone a chance
          to settle things civilly.
        </p>

        <p style={{
          margin: "10px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          fontSize: 13,
        }}>
          If you fail to resolve the conflict, you gain Dread.
        </p>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          Charming
        </strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are naturally likeable. You radiate a soothing aura that helps
          calm anger and ease emotions that cloud the mind and heart.
        </p>

        <strong style={{
          display: "block",
          color: colors.text,
          marginTop: 12,
        }}>
          Rapport
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You can build Rapport with people and Anomalies through successful
          interactions. The stronger the Rapport, the easier it becomes to
          negotiate, persuade, or calm them.
        </p>
      </div>
    </div>

    {/* WATCHER */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 6 ? "block" : "none",
  }}
>
        <div style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Role Name
      </div>

      <h3 style={{
        margin: 0,
        color: colors.goldBright,
        fontSize: 22,
        fontWeight: 500,
      }}>
        Watcher
      </h3>

      <p style={skillStyle}>
        You watch and observe from the outside. You can remain a spectator to
        what unfolds around you, untouched by the encounters happening before
        your eyes.
      </p>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        marginTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          Passive Stance
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You can enter Passive Stance once per encounter. At the beginning of
          Initiative, you may declare Passive Stance and remain outside the
          encounter.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          While in Passive Stance, you do not enter Initiative and cannot be
          targeted by actions within the encounter.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          You may break Passive Stance at any time and enter Initiative. Your
          Initiative order is determined by when you entered.
        </p>

        <p style={{
          margin: "10px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          fontSize: 13,
        }}>
          You cannot enter Passive Stance if attention is already on you.
        </p>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          Camera View
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You can view the world through the lenses of the Hotel's cameras;
          seeing the past, present, or future.
        </p>

        <p style={{
          margin: "12px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        }}>
          With a high enough roll, you can see through illusions and the
          distortions caused by Mania.
        </p>
      </div>
    </div>

    {/* VESSEL */}
<div
  style={{
    ...coreCardStyle,
    display: guideRoleIndex === 7 ? "block" : "none",
  }}
>
        <div style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".16em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Role Name
      </div>

      <h3 style={{
        margin: 0,
        color: colors.goldBright,
        fontSize: 22,
        fontWeight: 500,
      }}>
        Vessel
      </h3>

      <p style={skillStyle}>
        You are everyone and no one. Their memories, their feelings, their
        dreams, their fears—all of it lives within you, even if you don't know
        why.
      </p>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
        marginTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Role Action
        </div>

        <strong style={{ color: colors.text }}>
          One Body
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are able to draw upon the strengths of those around you. For a
          brief moment, you become more than yourself, taking on an ability or
          trait belonging to another Guest.
        </p>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 14,
      }}>
        <div style={{
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}>
          Passive
        </div>

        <strong style={{ color: colors.text }}>
          Bridge
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are able to form a bridge between you and a chosen target. There
          is no limit to how many bridges, it's just that it must be with
          consent. The deeper the connection, the sturdier the bridge, the
          easier it is to draw powers from others.
        </p>

        <p style={{
          margin: "12px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        }}>
          You don't know why but everyone seems to be connected in some way or
          another.
        </p>
      </div>
    </div>

<button
  type="button"
  onClick={nextGuideRole}
  style={{
    width: 42,
    height: 42,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.goldBright,
    cursor: "pointer",
    fontSize: 22,
  }}
>
  →
</button>

  </div>
</section>

        {/* MEMORY & DREAD */}
        <section
          style={{
            ...sectionStyle,
            borderColor: "rgba(180,140,70,.45)",
            background: "#101812",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: colors.goldBright,
                flexShrink: 0,
              }}
            />

            <h2
              style={{
                ...sectionTitleStyle,
                margin: 0,
              }}
            >
              Identity & Dread
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            <p
              style={{
                margin: 0,
                color: colors.muted,
                lineHeight: 1.8,
                fontSize: 14,
              }}
            >
              <strong style={{ color: colors.text }}>
                Your Identity is your anchor, represented by the 1d20.
              </strong>{" "}
              It reminds you of who you are, what you have experienced, and who you have become.
            </p>

            <p
              style={{
                margin: 0,
                color: colors.muted,
                lineHeight: 1.8,
                fontSize: 14,
              }}
            >
              <strong style={{ color: colors.text }}>
                Dread is the Hotel's lingering darkness.
              </strong>{" "}
              The pain, fear, and suffering of those who came before you seep through its halls, waiting for a crack in your resolve through which it can enter.
            </p>

            <p
              style={{
                margin: 0,
                color: colors.muted,
                lineHeight: 1.8,
                fontSize: 14,
              }}
            >
              Identity and Dread are bound in a fragile balance.{" "}
              <strong style={{ color: colors.text }}>
                Your Identity shield you from the Dread, preserving your sense of self.
              </strong>{" "}
              But as Dread takes hold, your memories begin to fade. The more you succumb, the less certain you become of who you are, what you have lived through, and whether the memories you hold were ever yours to begin with. Remember who you are. The Hotel remembers everything else.
            </p>

            <div
              style={{
                marginTop: 4,
                padding: "15px 17px",
                borderTop: `1px solid ${colors.border}`,
                color: colors.goldBright,
                fontStyle: "italic",
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              <strong>Hold onto your sense of self.</strong> For in Paradise Hotel, as your memories fade, so too does the person you believe yourself to be.
            </div>
          </div>
        </section>

        {/* MOVEMENT + ACTION ECONOMY */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, .8fr) minmax(0, 1.2fr)",
            gap: 18,
          }}
        >
          {/* MOVEMENT */}
          <section style={{ ...sectionStyle, marginBottom: 0 }}>
            <h2 style={sectionTitleStyle}>Movement</h2>

            <p
              style={{
                margin: 0,
                color: colors.muted,
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              Default Movement is{" "}
              <strong style={{ color: colors.text }}>30 feet</strong>,
              unless an ability changes it.
            </p>
          </section>

          {/* ACTION ECONOMY */}
          <section style={{ ...sectionStyle, marginBottom: 0 }}>
            <h2 style={sectionTitleStyle}>Action Economy</h2>

<p
  style={{
    margin: "0 0 14px",
    color: colors.muted,
    lineHeight: 1.7,
    fontSize: 14,
  }}
>
  Each round you have{" "}
  <strong style={{ color: colors.text }}>2 Actions</strong> +{" "}
  <strong style={{ color: colors.text }}>30 ft Movement</strong>.
</p>

<div
  style={{
    padding: "13px 15px",
    border: `1px solid ${colors.border}`,
    color: colors.goldBright,
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1.7,
  }}
>
  Action · Ability Action · Role Action · Skill Action
</div>

<p
  style={{
    margin: "14px 0 0",
    color: colors.muted,
    lineHeight: 1.7,
    fontSize: 14,
  }}
>
  Any two actions may be chosen, including the same type twice.
</p>
            <p
              style={{
                margin: "14px 0 0",
                color: colors.muted,
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              To use a Reaction, roll{" "}
              <code style={{ color: colors.text }}>1d20 + Agility</code>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

  /* =======================================================
     GM HUB
     ======================================================= */

function renderGMPage() {

const guestsWithLoss = guests.filter((g) => {
  const naturalMaxMemory = calculateMemoryPool(g);
  const currentMaxMemory = Number(g.maxMemoryPool) || 0;

  return currentMaxMemory < naturalMaxMemory;
});
  return (
      <main style={pageStyle}>
        <div
          style={{
            ...containerStyle,
            padding: "32px 0 80px",
          }}
        >
          <header
            style={{
              ...panelStyle,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: colors.gold,
                  letterSpacing: ".2em",
                  fontSize: 11,
                }}
              >
                PARADISE HOTEL
              </div>

              <h1
                style={{
                  fontWeight: 400,
                  marginBottom: 0,
                }}
              >
                Management
              </h1>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Button onClick={startCombat}>
                START BATTLE
              </Button>

              <Button onClick={() => setPage("forge")}>
                FORGE
              </Button>
              <Button onClick={() => setPage("cycles")}>
                CYCLES
              </Button>
              <Button onClick={() => setPage("archives")}>
                ARCHIVES
              </Button>

              <Button
                secondary
                onClick={loadGuests}
              >
                REFRESH
              </Button>
              <Button
                secondary
                onClick={() => setPage("hub")}
              >
                RETURN TO LOBBY
              </Button>

              <Button
                secondary
                onClick={logout}
              >
                LOG OUT
              </Button>
            </div>
          </header>

          <section
  style={{
    ...panelStyle,
    marginTop: 16,
  }}
>
  <h2
  style={{
    margin: 0,
    padding: "12px 16px",
    color: colors.goldBright,
    background: "rgba(255, 255, 255, 0.025)",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: ".03em",
  }}
>
    ROOM DIRECTORY
  </h2>

<div
  style={{
    marginTop: 16,
    overflow: "hidden",
    border: `1px solid ${colors.border}`,
    background: "rgba(255, 255, 255, 0.018)",
    borderRadius: 6,
  }}
>
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontFamily: "inherit",
    }}
  >
    <thead>
      <tr
        style={{
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <th
          style={{
            padding: 12,
            textAlign: "left",
            color: colors.goldBright,
            fontWeight: 500,
          }}
        >
          Room Number
        </th>

        <th
          style={{
            padding: 12,
            textAlign: "left",
            color: colors.goldBright,
            fontWeight: 500,
          }}
        >
          Guest Name
        </th>

        <th
          style={{
            padding: 12,
            textAlign: "left",
            color: colors.goldBright,
            fontWeight: 500,
          }}
        >
          Password
        </th>

        <th
          style={{
            padding: 12,
            textAlign: "left",
            color: colors.goldBright,
            fontWeight: 500,
          }}
        >
          Enter Room
        </th>

        <th
          style={{
            padding: 12,
            textAlign: "left",
            color: colors.goldBright,
            fontWeight: 500,
          }}
        >
          Edit
        </th>
      </tr>
    </thead>

    <tbody>
      {guests
        .filter((g) => {
          const room = Number(g.room);

          return (
            g.name?.trim() &&
            Number.isInteger(room) &&
            room >= 0 &&
            room <= 100
          );
        })

.map((g) => (
  <Fragment key={g.id}>
      
    <tr
      style={{
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <td style={{ padding: 12 }}>
        {g.room}
      </td>

      <td style={{ padding: 12 }}>
        {g.name}
      </td>

      <td style={{ padding: 12 }}>
        {g.password}
      </td>

      
          <td style={{ padding: 12 }}>
            <Button
              onClick={() => {
                if (!g.id) {
                  alert("This guest has no ID assigned yet.");
                  return;
                }

                setGmSelectedGuestId(g.id);
                setPage("room");
              }}
            >
              ENTER ROOM
            </Button>
          </td>

      <td style={{ padding: 12 }}>
        <Button
          secondary                    
          onClick={() => {
            if (!g.id) {
              alert("This guest has no ID assigned yet.");
              return;
            }

            setGmSelectedGuestId(g.id);
            setGmEditingGuestId(g.id);
            setGmEditingRoom(String(g.room ?? ""));
            setGmEditingPassword(String(g.password ?? ""));
          }}
        >
          EDIT
        </Button>
      </td>
    </tr>

    {gmEditingGuestId === g.id && (
      <tr>
        <td
          colSpan={5}
          style={{
            padding: 16,
            background: "rgba(255, 255, 255, 0.025)",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          EDITING ROOM {g.room}
        </td>
      </tr>
    )}
  </Fragment>
))
        }
    </tbody>
  </table>
</div>

{gmEditingGuestId !== "" && (
  <div
    style={{
      marginTop: 16,
      padding: 16,
      border: `1px solid ${colors.border}`,
      background: "rgba(255, 255, 255, 0.018)",
      borderRadius: 6,
    }}
  >
    <div
      style={{
        display: "grid",
        gap: 8,
        maxWidth: 240,
      }}
    >
      <label
        style={{
          color: colors.muted,
          fontSize: 15,
        }}
      >
        Room Number
      </label>

      <input
        type="number"
        min={0}
        max={100}
        value={gmEditingRoom}
onChange={(e) => {
  console.log("ROOM INPUT:", e.target.value);
  setGmEditingRoom(e.target.value);
}}

        style={{
          padding: "10px 12px",
          background: "rgba(0, 0, 0, 0.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          borderRadius: 4,
        }}
      />
    </div>

    <div
  style={{
    display: "grid",
    gap: 8,
    maxWidth: 240,
    marginTop: 16,
  }}
>
  <label
    style={{
      color: colors.muted,
      fontSize: 15,
    }}
  >
    Password
  </label>

  <input
    type="text"
    value={gmEditingPassword ?? ""}
    onChange={(e) =>
      setGmEditingPassword(e.target.value)
    }
    style={{
      padding: "10px 12px",
      background: "rgba(0, 0, 0, 0.25)",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      borderRadius: 2,
      marginBottom: 10,
    }}
  />
</div>

<Button
  onClick={() => {
    const target = guests.find(
      (g) => g.id === gmEditingGuestId
    );

    if (!target) {
      return;
    }

    const roomNumber = Number(gmEditingRoom);

const roomAlreadyUsed = guests.some(
  (g) =>
    g.id !== gmEditingGuestId &&
    Number(g.room) === roomNumber
);

if (roomAlreadyUsed) {
  window.alert("That room is already occupied.");
  return;
}

    const updatedGuest = {
  ...target,
  room: gmEditingRoom,
  password: gmEditingPassword,
};

setGuests((previous) =>
  previous.map((g) =>
    g.id === gmEditingGuestId
      ? updatedGuest
      : g
  )
);

saveGuest(updatedGuest);

setGmEditingGuestId("");
  }}
>
  SAVE
</Button>

  </div>
)}
</section>

          <section
            style={{
              ...panelStyle,
              marginTop: 16,
            }}
          >
        <h2
  style={{
    margin: 0,
    padding: "12px 16px",
    color: "#8CFF9A",
    background: "rgba(20, 70, 35, 0.28)",
    border: "1px solid rgba(100, 255, 130, 0.35)",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    boxShadow:
      "inset 0 0 18px rgba(80, 255, 120, 0.06)",
  }}
>
  FORCED RECOVERY
</h2>

{guestsWithLoss.length === 0 ? (
  <p
    style={{
      marginTop: 14,
      padding: "12px 14px",
      color: "#8CFF9A",
      background: "rgba(20, 70, 35, 0.18)",
      border: "1px solid rgba(100, 255, 130, 0.22)",
      borderRadius: 6,
      fontFamily: "monospace",
      fontSize: 12,
      letterSpacing: "0.04em",
    }}
  >
    SYSTEM STATUS: No guests have permanent Max Memory loss.
  </p>
) : (
  <div
  style={{
    marginTop: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(5, 20, 10, 0.35)",
    border: "1px solid rgba(100, 255, 130, 0.20)",
    borderRadius: 6,
    boxShadow:
      "inset 0 0 24px rgba(50, 255, 100, 0.025)",
  }}
>
<div
  style={{
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    background:
      "linear-gradient(to bottom, transparent, rgba(100,255,130,.35), transparent)",
    animation: "recoverySignal 3s linear infinite",
    pointerEvents: "none",
    zIndex: 2,
  }}
/>

    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "monospace",
      }}
    >
      <thead>
        <tr
          style={{
            background: "rgba(30, 90, 45, 0.28)",
            borderBottom:
              "1px solid rgba(100, 255, 130, 0.25)",
          }}
        >
          <th
            style={{
              textAlign: "left",
              padding: 10,
              color: "#8CFF9A",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Player
          </th>

          <th
            style={{
              textAlign: "left",
              padding: 10,
              color: "#8CFF9A",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Room
          </th>

          <th
            style={{
              textAlign: "left",
              padding: 10,
              color: "#8CFF9A",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Max Memory
          </th>

          <th
            style={{
              textAlign: "left",
              padding: 10,
              color: "#8CFF9A",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Natural Max
          </th>

          <th
            style={{
              textAlign: "left",
              padding: 10,
              color: "#8CFF9A",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Permanent Loss
          </th>

          <th
            style={{
              textAlign: "left",
              padding: 10,
              color: "#8CFF9A",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Recovery
          </th>
        </tr>
      </thead>
          
      <tbody>
        {guestsWithLoss.map((g) => {
          const naturalMaxMemory =
            calculateMemoryPool(g);

          const currentMaxMemory =
            Number(g.maxMemoryPool) || 0;

          const permanentLoss =
            naturalMaxMemory - currentMaxMemory;

          return (
            <tr key={g.id || g.room || g.name}>
              <td style={{ padding: 10 }}>
                {g.name}
              </td>

              <td style={{ padding: 10 }}>
                {g.room || "—"}
              </td>

              <td style={{ padding: 10 }}>
                {currentMaxMemory}
              </td>

              <td style={{ padding: 10 }}>
                {naturalMaxMemory}
              </td>

              <td style={{ padding: 10 }}>
                -{permanentLoss}
              </td>

              <td style={{ padding: 10 }}>
                <input
  type="number"
  min="0"
  max={permanentLoss}
  placeholder="Amount"
  value={recoveryAmounts[g.id || ""] ?? ""}
  onChange={(e) => {
    const value = Number(e.target.value);

    setRecoveryAmounts((previous) => ({
      ...previous,
      [g.id || ""]: Number.isFinite(value)
        ? value
        : 0,
    }));
  }}
  style={{
    width: 90,
    padding: "8px 10px",
    background: "rgba(0,0,0,.28)",
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
  }}
/>


              <button
                type="button"
                onClick={() => {
                  if (!g.id) {
                    alert("This guest has no ID assigned yet.");
                    return;
                  }

                  recoverMaxMemory(g.id);
                }}
                style={{
                  marginLeft: 8,
                  padding: "8px 12px",
                  border: `1px solid ${colors.border}`,
                  background: colors.gold,
                  color: "#000000",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  borderRadius: 6,
                }}
              >
                Recover
              </button>
</td>
            </tr>

          );
        })}
      </tbody>
    </table>
  </div>
)}            
</section>
          </div>
        </main>
      );
    }


/* =======================================================
   COMBAT
   ======================================================= */
function renderCombatPage() {
  const combatantIds = combat.participants;

  return (
    <main style={pageStyle}>
      <div
        style={{
          ...containerStyle,
          padding: "32px 0 80px",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            ...panelStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                color: colors.gold,
                fontSize: 11,
                letterSpacing: ".2em",
                textTransform: "uppercase",
              }}
            >
              Paradise Hotel
            </div>

            <h1
              style={{
                margin: "6px 0 0",
                fontWeight: 1000,
                color: colors.text,
              }}
            >
              Battle Ground
            </h1>

            <div
              style={{
                marginTop: 6,
                color: colors.muted,
                fontSize: 20,
              }}
            >
              Round {combat.round}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={nextTurn}>
              NEXT TURN
            </Button>

            <Button secondary onClick={endCombat}>
              END BATTLE
            </Button>
          </div>
        </header>

        {/* COMBATANTS */}
        <section
          style={{
            ...panelStyle,
            marginTop: 16,
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".16em",
                textTransform: "uppercase",
              }}
            >
              Combatants
            </div>

            <div
              style={{
                marginTop: 5,
                color: colors.muted,
                fontSize: 13,
              }}
            >
              The battle continues through the Hotel.
            </div>
          </div>

          {/* ADD PARTICIPANTS */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <select
              value={selectedCombatGuest}
              onChange={(event) =>
                setSelectedCombatGuest(event.target.value)
              }
              style={{
                ...inputStyle,
                flex: "1 1 200px",
                minWidth: 200,
                height: 42,
                boxSizing: "border-box",
              }}
            >
              <option value="">Select a guest...</option>

              {guests
                .filter((guest) => {
                  const id =
                    guest.id || guest.room || guest.name;

                  return !combatantIds.includes(id);
                })
                .map((guest) => {
                  const id =
                    guest.id || guest.room || guest.name;

                  return (
                    <option key={id} value={id}>
                      {guest.name}
                      {guest.room
                        ? ` · Room ${guest.room}`
                        : ""}
                    </option>
                  );
                })}
            </select>

            <select
              value={selectedCombatDreadling}
              onChange={(event) =>
                setSelectedCombatDreadling(event.target.value)
              }
              style={{
                ...inputStyle,
                flex: "1 1 200px",
                minWidth: 200,
                height: 42,
                boxSizing: "border-box",
              }}
            >
              <option value="">Select a Dreadling...</option>

              {dreadlings
                .filter(
                  (dreadling) =>
                    !combatantIds.includes(
                      `dreadling:${dreadling.id}`
                    )
                )
                .map((dreadling) => (
                  <option
                    key={dreadling.id}
                    value={dreadling.id}
                  >
                    {dreadling.name}
                  </option>
                ))}
            </select>

            
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 42,
    padding: "0 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    background: "rgba(255,255,255,.03)",
  }}
>
  <button
    type="button"
    onClick={() =>
      setSelectedCombatDreadlingCount((count) =>
        Math.max(1, count - 1)
      )
    }
    disabled={selectedCombatDreadlingCount <= 1}
    style={{
      border: "none",
      background: "transparent",
      color: colors.goldBright,
      fontSize: 20,
      cursor: "pointer",
    }}
  >
    −
  </button>

  <span
    style={{
      minWidth: 20,
      textAlign: "center",
      color: colors.text,
      fontWeight: 700,
    }}
  >
    {selectedCombatDreadlingCount}
  </span>

  <button
    type="button"
    onClick={() =>
      setSelectedCombatDreadlingCount((count) =>
        Math.min(20, count + 1)
      )
    }
    disabled={selectedCombatDreadlingCount >= 20}
    style={{
      border: "none",
      background: "transparent",
      color: colors.goldBright,
      fontSize: 20,
      cursor: "pointer",
    }}
  >
    +
  </button>
</div>

            <button
              type="button"
              disabled={
                !selectedCombatGuest &&
                !selectedCombatDreadling
              }
              
onClick={() => {
  if (!selectedCombatGuest && !selectedCombatDreadling) {
    return;
  }

  const isGuest = Boolean(selectedCombatGuest);
  const selectedId = isGuest
    ? selectedCombatGuest
    : `dreadling:${selectedCombatDreadling}`;

  setCombat((previous) => {
    const participants = [...previous.participants];
    const initiative = { ...previous.initiative };
    const log = [...previous.log];
    const hp = { ...previous.hp };

    if (isGuest) {
      if (!participants.includes(selectedId)) {
        participants.push(selectedId);
        log.push("Guest added to combat.");
      }
    } else {
      const count = Math.max(
        1,
        Math.min(20, selectedCombatDreadlingCount)
      );

      for (let i = 0; i < count; i++) {
        const copyId = `dreadling:${selectedCombatDreadling}:${Date.now()}:${i}`;

        participants.push(copyId);
        hp[copyId] = Number(
        dreadlings.find((item) => item.id === selectedCombatDreadling)?.hp ?? 0
        );
      }

      log.push(
        `${count} ${count === 1 ? "Dreadling" : "Dreadlings"} added to combat.`
      );
    }

    return {
      ...previous,
      participants,
      initiative,
      hp,
      log,
    };
  });

  setSelectedCombatGuest("");
  setSelectedCombatDreadling("");
  setSelectedCombatDreadlingCount(1);
}}
            >
              + Add to Initiative
            </button>

            <button
              type="button"
              onClick={() => {
                setCombat((previous) => {
                  const currentTurnId =
                    previous.participants[previous.turnIndex];

                  const participants = [
                    ...previous.participants,
                  ].sort(
                    (a, b) =>
                      (previous.initiative[b] ?? 0) -
                      (previous.initiative[a] ?? 0)
                  );

                  return {
                    ...previous,
                    participants,
                    turnIndex: Math.max(
                      0,
                      participants.indexOf(currentTurnId)
                    ),
                    log: [
                      ...previous.log,
                      "Combatants sorted by initiative score.",
                    ],
                  };
                });
              }}
              style={{
                ...inputStyle,
                flex: "1 1 200px",
                minWidth: 200,
                height: 42,
                boxSizing: "border-box",
                fontWeight: 700,
                textAlign: "center",
                background: "rgba(255,255,255,.03)",
                color: colors.goldBright,
                border: `1px solid ${colors.border}`,
                borderRadius: 7,
                cursor: "pointer",
              }}
            >
              ↕ Sort by Initiative
            </button>
          </div>

          {/* INITIATIVE BOARD */}
          {combatantIds.length === 0 ? (
            <p style={{ color: colors.muted }}>
              No participants. Select a guest or Dreadling to begin.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: 12,
              }}
            >
              {combatantIds.map((participantId) => {
                const isDreadling =
                participantId.startsWith("dreadling:");

                const isCurrentTurn =
                  participantId ===
                  combatantIds[combat.turnIndex];

                const position =
                  combatantIds.indexOf(participantId);

                const cardStyle = {
                  border: isCurrentTurn
                    ? `1px solid ${colors.goldBright}`
                    : `1px solid ${colors.border}`,
                  padding: 16,
                  borderRadius: 8,
                  background: isCurrentTurn
                    ? "rgba(228,209,156,.06)"
                    : "rgba(255,255,255,.015)",
                  boxShadow: isCurrentTurn
                    ? "0 0 18px rgba(228,209,156,.08)"
                    : "none",
                  minWidth: 0,
                };

                const portraitStyle = {
                  width: 100,
                  height: 130,
                  flexShrink: 0,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(255,255,255,.02)",
                  overflow: "hidden" as const,
                };

                const statLabelStyle = {
                  color: colors.muted,
                  fontSize: 9,
                  letterSpacing: ".08em",
                };

                const statValueStyle = {
                  marginTop: 3,
                  color: colors.text,
                  fontSize: 16,
                };


const initiativeControls = (
  <div
    style={{
      marginTop: 18,
      paddingTop: 14,
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 10,
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    }}
  >
    {/* Position, initiative score, and action buttons */}
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        width: "100%",
        minWidth: 0,
      }}
    >
      <span
        style={{
          color: colors.goldBright,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        Position #{position + 1}
      </span>

      <label
        style={{
          color: colors.muted,
          fontSize: 11,
          whiteSpace: "nowrap",
        }}
      >
        Initiative Score
      </label>

      <input
        type="number"
        value={combat.initiative[participantId] ?? ""}
        onChange={(event) => {
          const rawValue = event.target.value;

          setCombat((previous) => {
            const initiative = { ...previous.initiative };

            if (rawValue === "") {
              delete initiative[participantId];
            } else {
              initiative[participantId] = Number(rawValue);
            }

            return {
              ...previous,
              initiative,
            };
          });
        }}
        style={{
          width: 76,
          minWidth: 60,
          boxSizing: "border-box",
          padding: "6px 8px",
          border: `1px solid ${colors.border}`,
          borderRadius: 5,
          background: "rgba(255,255,255,.03)",
          color: colors.text,
        }}
      />

      {/* Keep all three buttons together horizontally */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* Move up */}
        <button
          type="button"
          disabled={position === 0}
          title="Move up in initiative"
          aria-label="Move up in initiative"
          onClick={() => {
            setCombat((previous) => {
              const participants = [...previous.participants];
              const index = participants.indexOf(participantId);

              if (index <= 0) return previous;

              const currentTurnId =
                previous.participants[previous.turnIndex];

              [
                participants[index - 1],
                participants[index],
              ] = [
                participants[index],
                participants[index - 1],
              ];

              return {
                ...previous,
                participants,
                turnIndex: Math.max(
                  0,
                  participants.indexOf(currentTurnId)
                ),
                log: [
                  ...previous.log,
                  `${isDreadling ? "Dreadling" : "Combatant"} moved up in initiative.`,
                ],
              };
            });
          }}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            background: "rgba(200,185,145,.06)",
            color: colors.goldBright,
            fontSize: 14,
            cursor: position === 0 ? "not-allowed" : "pointer",
            opacity: position === 0 ? 0.35 : 1,
          }}
        >
          ▲
        </button>

        {/* Move down */}
        <button
          type="button"
          disabled={position === combatantIds.length - 1}
          title="Move down in initiative"
          aria-label="Move down in initiative"
          onClick={() => {
            setCombat((previous) => {
              const participants = [...previous.participants];
              const index = participants.indexOf(participantId);

              if (
                index < 0 ||
                index >= participants.length - 1
              ) {
                return previous;
              }

              const currentTurnId =
                previous.participants[previous.turnIndex];

              [
                participants[index + 1],
                participants[index],
              ] = [
                participants[index],
                participants[index + 1],
              ];

              return {
                ...previous,
                participants,
                turnIndex: Math.max(
                  0,
                  participants.indexOf(currentTurnId)
                ),
                log: [
                  ...previous.log,
                  `${isDreadling ? "Dreadling" : "Combatant"} moved down in initiative.`,
                ],
              };
            });
          }}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            background: "rgba(200,185,145,.06)",
            color: colors.goldBright,
            fontSize: 14,
            cursor:
              position === combatantIds.length - 1
                ? "not-allowed"
                : "pointer",
            opacity:
              position === combatantIds.length - 1 ? 0.35 : 1,
          }}
        >
          ▼
        </button>

        {/* Remove combatant */}
        <button
          type="button"
          title="Remove from combat"
          aria-label="Remove from combat"
          onClick={() => {
            setCombat((previous) => {
              const participants = previous.participants.filter(
                (id) => id !== participantId
              );

              const initiative = { ...previous.initiative };
              const hp = { ...previous.hp };

              delete initiative[participantId];
              delete hp[participantId];

              const currentTurnId =
                previous.participants[previous.turnIndex];

              const nextTurnIndex =
                participants.length === 0
                  ? 0
                  : currentTurnId === participantId
                    ? Math.min(
                        previous.turnIndex,
                        participants.length - 1
                      )
                    : Math.max(
                        0,
                        participants.indexOf(currentTurnId)
                      );

              return {
                ...previous,
                participants,
                initiative,
                hp,
                turnIndex: nextTurnIndex,
                round:
                  participants.length === 0
                    ? 1
                    : previous.round,
                log: [
                  ...previous.log,
                  `${isDreadling ? "Dreadling" : "Combatant"} removed from combat.`,
                ],
              };
            });
          }}
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            border: "1px solid rgba(166,91,91,.4)",
            borderRadius: 6,
            background: "rgba(166,91,91,.08)",
            color: "#d98a8a",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  </div>
);

                {/* DREADLING CARD */}
                if (isDreadling) {
                  const dreadlingId =
                  participantId
                    .slice("dreadling:".length)
                    .split(":")[0];

                const dreadling = dreadlings.find(
                  (item) => item.id === dreadlingId
                );

                  if (!dreadling) return null;

                  return (                    
                  <div
                    style={cardStyle}
                    onClick={() => {
                      setCombat((previous) => ({
                        ...previous,
                        turnIndex: position,
                      }));
                    }}
                  >
                      <div
                        style={{
                          color: colors.danger,
                          fontSize: 10,
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        Dreadling
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                        }}
                      >
                        <div style={portraitStyle}>
                          {dreadling.imageUrl ? (
                            <img
                              src={dreadling.imageUrl}
                              alt={dreadling.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: colors.muted,
                                fontSize: 11,
                                textAlign: "center",
                              }}
                            >
                              No Portrait
                            </div>
                          )}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              color: colors.text,
                              fontSize: 18,
                              fontWeight: 600,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {dreadling.name}
                          </div>

                          {isCurrentTurn && (
                            <div
                              style={{
                                marginTop: 10,
                                color: colors.goldBright,
                                fontSize: 10,
                                letterSpacing: ".12em",
                                textTransform: "uppercase",
                              }}
                            >
                              Current Turn
                            </div>
                          )}

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(2, minmax(0, 1fr))",
                              gap: 8,
                              marginTop: 16,
                            }}
                          >
                            <div>
                              <div style={statLabelStyle}>AC</div>
                              <div style={statValueStyle}>
                                {dreadling.ac || "—"}
                              </div>
                            </div>

                            <div>
                              
<div style={statLabelStyle}>HP</div>
<div style={statValueStyle}>
  {combat.hp[participantId] ?? dreadling.hp ?? "—"}
</div>
<div style={{ display: "flex", gap: 6, marginTop: 6 }}>
  <button
    onClick={() =>
      setCombat((previous) => ({
        ...previous,
        hp: {
          ...previous.hp,
          [participantId]: Math.max(
            0,
            (previous.hp[participantId] ?? Number(dreadling.hp) ?? 0) - 1
          ),
        },
      }))
    }
  >
    −
  </button>
  <button
    onClick={() =>
      setCombat((previous) => ({
        ...previous,
        hp: {
          ...previous.hp,
          [participantId]:
            (previous.hp[participantId] ?? Number(dreadling.hp) ?? 0) + 1,
        },
      }))
    }
  >
    +
  </button>
</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 16,
                          padding: "12px 0",
                          borderTop: `1px solid ${colors.border}`,
                          borderBottom: `1px solid ${colors.border}`,
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                          gap: "9px 16px",
                        }}
                      >
                        {(
                          [
                            ["Mind", dreadling.mindDie],
                            ["Body", dreadling.bodyDie],
                            ["Heart", dreadling.heartDie],
                            ["Ego", dreadling.egoDie],
                          ] as [string, string][]
                        ).map(([core, die]) => (
                          <div
                            key={core}
                            style={{
                              color: colors.text,
                              fontSize: 13,
                            }}
                          >
                            <span
                              style={{
                                color: colors.goldBright,
                                fontWeight: 600,
                              }}
                            >
                              {die || "—"}
                            </span>{" "}
                            <span
                              style={{ color: colors.muted }}
                            >
                              {core}
                            </span>
                          </div>
                        ))}
                      </div>

                      {dreadling.sourceOfTrauma && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              color: colors.gold,
                              fontSize: 10,
                              letterSpacing: ".14em",
                              textTransform: "uppercase",
                            }}
                          >
                            Source of Trauma
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              color: colors.text,
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            {dreadling.sourceOfTrauma}
                          </div>
                        </div>
                      )}

                      {dreadling.appearance && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              color: colors.gold,
                              fontSize: 10,
                              letterSpacing: ".14em",
                              textTransform: "uppercase",
                            }}
                          >
                            Appearance
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              color: colors.text,
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            {dreadling.appearance}
                          </div>
                        </div>
                      )}

                      {dreadling.behavior && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              color: colors.gold,
                              fontSize: 10,
                              letterSpacing: ".14em",
                              textTransform: "uppercase",
                            }}
                          >
                            Behavior
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              color: colors.text,
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            {dreadling.behavior}
                          </div>
                        </div>
                      )}

                      {dreadling.encounterAbility && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              color: colors.gold,
                              fontSize: 10,
                              letterSpacing: ".14em",
                              textTransform: "uppercase",
                            }}
                          >
                            Encounter Ability
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              color: colors.text,
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            {dreadling.encounterAbility}
                          </div>
                        </div>
                      )}

                      {initiativeControls}
                    </div>
                  );
                }

                {/* GUEST CARD */}
                const guest = guests.find(
                  (item) =>
                    (item.id || item.room || item.name) ===
                    participantId
                );

                if (!guest) return null;

                const primaryRole = guest.role || "No Role";
                const secondaryRole = guest.role2 || "No Role";

                const primaryRoleDetails =
                  ROLE_DETAILS[primaryRole];

                const secondaryRoleDetails =
                  ROLE_DETAILS[secondaryRole];

                const primaryProficiencies =
                  ROLE_PROFICIENCIES[primaryRole] ?? [];

                const secondaryProficiencies =
                  ROLE_PROFICIENCIES[secondaryRole] ?? [];

                return (                  
                <div
                  style={cardStyle}
                  onClick={() => {
                    setCombat((previous) => ({
                      ...previous,
                      turnIndex: position,
                    }));
                  }}
                >
                    <div
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                      }}
                    >
                      <div style={portraitStyle}>
                        {guest.portrait ? (
                          <img
                            src={guest.portrait}
                            alt={guest.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: colors.muted,
                              fontSize: 11,
                              textAlign: "center",
                            }}
                          >
                            No Portrait
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            color: colors.text,
                            fontSize: 18,
                            fontWeight: 600,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {guest.name}
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: colors.muted,
                            fontSize: 12,
                          }}
                        >
                          Room {guest.room}
                        </div>

                        {isCurrentTurn && (
                          <div
                            style={{
                              marginTop: 10,
                              color: colors.goldBright,
                              fontSize: 10,
                              letterSpacing: ".12em",
                              textTransform: "uppercase",
                            }}
                          >
                            Current Turn
                          </div>
                        )}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(3, minmax(0, 1fr))",
                            gap: 8,
                            marginTop: 16,
                          }}
                        >
                          <div>
                            <div style={statLabelStyle}>AC</div>
                            <div style={statValueStyle}>
                              {guest.ac}
                            </div>
                          </div>

                          <div>
                            <div style={statLabelStyle}>HP</div>
                            <div style={statValueStyle}>
                              {guest.hp}
                            </div>
                          </div>

                          <div>
                            <div
                              style={{
                                ...statLabelStyle,
                                color:
                                  guest.dread > 0
                                    ? colors.danger
                                    : colors.muted,
                              }}
                            >
                              DREAD
                            </div>
                            <div
                              style={{
                                ...statValueStyle,
                                color:
                                  guest.dread > 0
                                    ? colors.danger
                                    : colors.text,
                              }}
                            >
                              {guest.dread}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CORE DICE */}
                    <div
                      style={{
                        marginTop: 16,
                        padding: "12px 0",
                        borderTop: `1px solid ${colors.border}`,
                        borderBottom: `1px solid ${colors.border}`,
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: "9px 16px",
                      }}
                    >
                      {(
                        ["Mind", "Body", "Heart", "Ego"] as Core[]
                      ).map((core) => (
                        <div
                          key={core}
                          style={{
                            color: colors.text,
                            fontSize: 13,
                          }}
                        >
                          <span
                            style={{
                              color: colors.goldBright,
                              fontWeight: 600,
                            }}
                          >
                            {coreDie(coreTotal(guest, core))}
                          </span>{" "}
                          <span style={{ color: colors.muted }}>
                            {core}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* PRIMARY ROLE */}
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          color: colors.gold,
                          fontSize: 10,
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Primary Role
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          color: colors.text,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {primaryRole}
                      </div>

                      {primaryRoleDetails && (
                        <div
                          style={{
                            marginTop: 5,
                            color: colors.muted,
                            fontSize: 12,
                          }}
                        >
                          <RoleHover
                            label={primaryRoleDetails.action}
                            description={
                              ROLE_GUIDE_DETAILS[primaryRole]
                                ?.actionDescription
                            }
                          />
                          {" · "}
                          <RoleHover
                            label={primaryRoleDetails.passive}
                            description={
                              ROLE_GUIDE_DETAILS[primaryRole]
                                ?.passiveDescription
                            }
                          />
                        </div>
                      )}

                      {primaryProficiencies.length > 0 && (
                        <div
                          style={{
                            marginTop: 6,
                            color: colors.text,
                            fontSize: 11,
                            lineHeight: 1.5,
                          }}
                        >
                          {primaryProficiencies.join(" / ")}
                        </div>
                      )}
                    </div>

                    {/* SECONDARY ROLE */}
                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          color: colors.gold,
                          fontSize: 10,
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Secondary Role
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          color: colors.text,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {secondaryRole}
                      </div>

                      {secondaryRoleDetails && (
                        <div
                          style={{
                            marginTop: 5,
                            color: colors.muted,
                            fontSize: 12,
                          }}
                        >
                          <RoleHover
                            label={secondaryRoleDetails.action}
                            description={
                              ROLE_GUIDE_DETAILS[secondaryRole]
                                ?.actionDescription
                            }
                          />
                          {" · "}
                          <RoleHover
                            label={secondaryRoleDetails.passive}
                            description={
                              ROLE_GUIDE_DETAILS[secondaryRole]
                                ?.passiveDescription
                            }
                          />
                        </div>
                      )}

                      {secondaryProficiencies.length > 0 && (
                        <div
                          style={{
                            marginTop: 6,
                            color: colors.text,
                            fontSize: 11,
                            lineHeight: 1.5,
                          }}
                        >
                          {secondaryProficiencies.join(" / ")}
                        </div>
                      )}
                    </div>

                    {/* ABILITIES */}
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          color: colors.gold,
                          fontSize: 10,
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                        }}
                      >
                        Abilities
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        {(
                          ["Mind", "Body", "Heart", "Ego"] as Core[]
                        ).map((core) => {
                          const ability = guest.abilities?.[core];

                          if (!ability?.name) return null;

                          return (
                            <div
                              key={core}
                              style={{
                                padding: "9px 10px",
                                border: `1px solid ${colors.border}`,
                                background: "rgba(255,255,255,.02)",
                                color: colors.text,
                                fontSize: 12,
                              }}
                            >
                              <RoleHover
                                label={ability.name}
                                description={ability.description}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {initiativeControls}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* BATTLE LOG */}
        <section
          style={{
            ...panelStyle,
            marginTop: 16,
          }}
        >
          <div>
            <div
              style={{
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".16em",
                textTransform: "uppercase",
              }}
            >
              Record
            </div>

            <h2
              style={{
                margin: "5px 0 0",
                fontWeight: 400,
                color: colors.goldBright,
              }}
            >
              Battle Log
            </h2>
          </div>

          {combat.log.length === 0 ? (
            <p style={{ color: colors.muted }}>
              No events.
            </p>
          ) : (
            combat.log.map((entry, index) => (
              <div
                key={`${entry}-${index}`}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "11px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    minWidth: 24,
                    color: colors.gold,
                    fontSize: 11,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {entry}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function renderForgePage() {
  return (
  
    <main
    style={{
    minHeight: "100vh",
    padding: 24,
    backgroundImage: '(url"/pubic/paradise-hotel-background.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    }}
  >  
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            ...panelStyle,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              color: colors.gold,
              letterSpacing: ".2em",
              fontSize: 11,
              marginBottom: 8,
            }}
          >
            PARADISE HOTEL
          </div>

          <h1
            style={{
              fontWeight: 400,
              margin: 0,
              color: colors.goldBright,
            }}
          >
            The Forge
          </h1>

          <p
            style={{
              color: colors.muted,
              marginBottom: 0,
            }}
          >
            Create and manage Dreadlings and Dreadfuls for the Battle Grounds.
          </p>
        </header>

         <div
          style={{
            ...panelStyle,
            display: "flex",
            gap: 12,
            marginBottom: 15,
            flexWrap: "wrap",
          }}
        >
          <Button
  onClick={() => setShowDreadlingForm(true)}
>
  CREATE DREADLING
</Button>


<Button
  secondary
  onClick={() => {
    setSelectedGuestId("");
    setDreadfulCorruptionLevel("1");
    setDreadfulCorruptionDescription("");
    setShowDreadfulForm(true);
  }}
>
  CREATE DREADFUL
</Button>
</div>

{showDreadlingForm && (
  <div
    style={{
      ...panelStyle,
      marginBottom: 20,
      padding: 24,
    }}
  >
    <h2 style={{ color: colors.goldBright, fontWeight: 400 }}>
      Forge a Dreadling
    </h2>

    <p style={{ color: colors.muted }}>
      Give manifested trauma a form. What the personality fears may now
      stand before them.
    </p>

    <label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
      Dreadling Name
    </label>
    <input
  type="text"
  value={dreadlingDraft.name}
  onChange={(e) =>
    setDreadlingDraft({
      ...dreadlingDraft,
      name: e.target.value,
    })
  }
  placeholder="What is this manifestation called?"
  style={{ width: "100%", padding: 10, marginTop: 6 }}
/>


<div style={{ marginBottom: 14 }}>
  <label
    style={{
      display: "block",
      color: colors.gold,
      marginBottom: 6,
    }}
  >
    Portrait Image URL
  </label>

  <input
    type="url"
    value={dreadlingDraft.imageUrl}
    onChange={(e) =>
      setDreadlingDraft({
        ...dreadlingDraft,
        imageUrl: e.target.value,
      })
    }
    placeholder="https://example.com/dreadling.png"
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: 10,
      background: "rgba(0,0,0,0.25)",
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: 6,
    }}
  />
</div>

    <label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
      Source of Trauma
    </label>
    <textarea
  value={dreadlingDraft.sourceOfTrauma}
  onChange={(e) =>
    setDreadlingDraft({
      ...dreadlingDraft,
      sourceOfTrauma: e.target.value,
    })
  }
  placeholder="Which memory, fear, or experience gave it form?"
  rows={3}
  style={{ width: "100%", padding: 10, marginTop: 6 }}
/>

    <label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
      Appearance
    </label>
    <textarea
  value={dreadlingDraft.appearance}
  onChange={(e) =>
    setDreadlingDraft({
      ...dreadlingDraft,
      appearance: e.target.value,
    })
  }
  placeholder="Describe its shape, features, and unsettling details..."
  rows={3}
  style={{ width: "100%", padding: 10, marginTop: 6 }}
/>

    <label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
      Behavior
    </label>
    <textarea
  value={dreadlingDraft.behavior}
  onChange={(e) =>
    setDreadlingDraft({
      ...dreadlingDraft,
      behavior: e.target.value,
    })
  }
  placeholder="How does it act? How does it manifest the trauma?"
  rows={3}
  style={{ width: "100%", padding: 10, marginTop: 6 }}
/>

<label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
  Hit Points (HP)
</label>
<input
  type="number"
  min="1"
  value={dreadlingDraft.hp}
  onChange={(e) =>
    setDreadlingDraft({
      ...dreadlingDraft,
      hp: e.target.value,
    })
  }
  style={{ width: "100%", padding: 10, marginTop: 6 }}
/>

<label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
  Armor Class (AC)
</label>
<input
  type="number"
  min="0"
  value={dreadlingDraft.ac}
  onChange={(e) =>
    setDreadlingDraft({
      ...dreadlingDraft,
      ac: e.target.value,
    })
  }
  style={{ width: "100%", padding: 10, marginTop: 6 }}
/>

<label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
  Threat / Encounter Ability
</label>
<textarea
  value={dreadlingDraft.encounterAbility}
  onChange={(e) =>
    setDreadlingDraft({
      ...dreadlingDraft,
      encounterAbility: e.target.value,
    })
  }
  placeholder="What can this Dreadling do during an encounter?"
  rows={3}
  style={{ width: "100%", padding: 10, marginTop: 6 }}
/>


<h3
  style={{
    color: colors.goldBright,
    fontWeight: 400,
    marginTop: 24,
  }}
>
  Core Dice
</h3>

<p style={{ color: colors.muted }}>
  Assign each core's die manually. These values are not calculated from stats.
</p>

{(
  [
    ["Mind", "mindDie"],
    ["Body", "bodyDie"],
    ["Heart", "heartDie"],
    ["Ego", "egoDie"],
  ] as const
).map(([label, key]) => (
  <div key={key} style={{ marginTop: 14 }}>
    <label
      style={{
        display: "block",
        color: colors.gold,
        marginBottom: 6,
      }}
    >
      {label}
    </label>

    <select
      value={dreadlingDraft[key]}
      onChange={(e) =>
        setDreadlingDraft({
          ...dreadlingDraft,
          [key]: e.target.value,
        })
      }
      style={{
        width: "100%",
        padding: 10,
        background: "#141815",
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
      }}
    >
      <option value="1d4">1d4</option>
      <option value="1d6">1d6</option>
      <option value="1d8">1d8</option>
      <option value="1d10">1d10</option>
      <option value="1d12">1d12</option>
      <option value="1d20">1d20</option>
    </select>
  </div>
))}

    <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
      
<div
  style={{
    display: "flex",
    gap: 12,
    marginTop: 20,
    flexWrap: "wrap",
  }}
>
  <Button
      onClick={async () => {
      if (!dreadlingDraft.name.trim()) {
        alert("Please give your Dreadling a name.");
        return;
      }

      const newDreadling = {
        id: Date.now().toString(),
        ...dreadlingDraft,
      };

              
        const updatedDreadlings = [
          ...dreadlings,
          newDreadling,
        ];

        setDreadlings(updatedDreadlings);

        localStorage.setItem(
          "paradiseHotelDreadlings",
          JSON.stringify(updatedDreadlings)
        );

        const { error } = await supabase
          .from("dreadlings")
          .upsert({
            id: newDreadling.id,
            data: newDreadling,
          });

        if (error) {
          console.error("Failed to save Dreadling to Supabase:", error);
          alert("Dreadling saved locally, but failed to save to Supabase.");
        }

      setDreadlingDraft({
      name: "",
      imageUrl: "",
      sourceOfTrauma: "",
      appearance: "",
      behavior: "",
      hp: "10",
      ac: "10",
      encounterAbility: "",
      mindDie: "1d4",
      bodyDie: "1d4",
      heartDie: "1d4",
      egoDie: "1d4",
    });

      setShowDreadlingForm(false);
    }}
  >
    SAVE DREADLING
  </Button>

  <Button
    secondary
    onClick={() => {
      setShowDreadlingForm(false);
      setDreadlingDraft({
      name: "",
      imageUrl: "",
      sourceOfTrauma: "",
      appearance: "",
      behavior: "",
      hp: "10",
      ac: "10",
      encounterAbility: "",
      mindDie: "1d4",
      bodyDie: "1d4",
      heartDie: "1d4",
      egoDie: "1d4",
    });
    }}
  >
    CANCEL
  </Button>
</div>
    </div>
  </div>
)}


{showDreadfulForm && (
  <div
    style={{
      ...panelStyle,
      marginBottom: 20,
      padding: 24,
    }}
  >
    <h2 style={{ color: colors.goldBright, fontWeight: 400 }}>
      Forge a Dreadful
    </h2>

    <p style={{ color: colors.muted }}>
      A former guest has been corrupted by Dread. Their original character
      remains untouched.
    </p>

    <label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
      Former Guest
    </label>
    <select
      value={selectedGuestId}
      onChange={(e) => setSelectedGuestId(e.target.value)}
      style={{
        width: "100%",
        padding: 10,
        marginTop: 6,
        background: "#141815",
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
      }}
    >
      <option value="">Select a former guest...</option>
      {guests.map((guest, index) => {
        const guestId = guest.id || `guest-${guest.room}-${index}`;
        return (
          <option key={guestId} value={guestId}>
            Room {guest.room} — {guest.name}
          </option>
        );
      })}
    </select>

        <label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
          Corruption Level (1–20)
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={dreadfulCorruptionLevel}
          onChange={(e) => {
            const value = Math.max(1, Math.min(20, Number(e.target.value)));
            setDreadfulCorruptionLevel(String(value));
          }}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />

    <label style={{ display: "block", color: colors.gold, marginTop: 16 }}>
      Corruption Description
    </label>
    <textarea
      value={dreadfulCorruptionDescription}
      onChange={(e) => setDreadfulCorruptionDescription(e.target.value)}
      placeholder="What has Dread changed about this former guest?"
      rows={4}
      style={{ width: "100%", padding: 10, marginTop: 6 }}
    />

    
<div style={{ marginTop: 18 }}>
  <h3 style={{ color: "#e4d19c" }}>Core Dice</h3>
  <p style={{ color: "#9d9a8d" }}>
    Assign a die to each core of this Dreadful.
  </p>

  {(["mindDie", "bodyDie", "heartDie", "egoDie"] as const).map((core) => {
    const coreName = core.replace("Die", "");
    return (
      <div key={core} style={{ marginBottom: 12 }}>
        <label
          style={{
            display: "block",
            marginBottom: 6,
            textTransform: "capitalize",
          }}
        >
          {coreName} Die
        </label>

        <select
          value={dreadfulDice[core]}
          onChange={(e) =>
            setDreadfulDice((previous) => ({
              ...previous,
              [core]: e.target.value,
            }))
          }
          style={{ width: "100%", padding: 10 }}
        >
          {["1d4", "1d6", "1d8", "1d10", "1d12", "1d20"].map((die) => (
            <option key={die} value={die}>
              {die}
            </option>
          ))}
        </select>
      </div>
    );
  })}
</div>

    <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
      <Button
        onClick={async () => {
          if (!selectedGuestId) {
            alert("Please select a former guest.");
            return;
          }

          const selectedGuestIndex = guests.findIndex((guest, index) => {
            const guestId = guest.id || `guest-${guest.room}-${index}`;
            return guestId === selectedGuestId;
          });

          if (selectedGuestIndex === -1) {
            alert("That guest could not be found. Please select them again.");
            return;
          }

          const originalGuest = guests[selectedGuestIndex];
          const originalGuestId =
            originalGuest.id || `guest-${originalGuest.room}-${selectedGuestIndex}`;

          if (
            dreadfuls.some(
              (dreadful) => dreadful.originalGuestId === originalGuestId
            )
          ) {
            alert("A Dreadful version of this guest already exists.");
            return;
          }

                      
            const newDreadful: Dreadful = {
              ...originalGuest,
              id: `dreadful-${Date.now()}`,
              originalGuestId,
              corruptionLevel: Math.max(
                1,
                Math.min(10, Number(dreadfulCorruptionLevel) || 1)
              ),
              corruptionDescription: dreadfulCorruptionDescription,
              isRestored: false,
              mindDie: dreadfulDice.mindDie,
              bodyDie: dreadfulDice.bodyDie,
              heartDie: dreadfulDice.heartDie,
              egoDie: dreadfulDice.egoDie,
            };

            const updatedDreadfuls = [...dreadfuls, newDreadful];
            setDreadfuls(updatedDreadfuls);

            localStorage.setItem(
              "paradiseHotelDreadfuls",
              JSON.stringify(updatedDreadfuls)
            );

            const { error } = await supabase
              .from("dreadfuls")
              .upsert({
                id: newDreadful.id,
                data: newDreadful,
              });

            if (error) {
              console.error("Failed to save Dreadful to Supabase:", error);
              alert("Dreadful saved locally, but failed to save to Supabase.");
            }
          setSelectedGuestId("");
          setDreadfulCorruptionLevel("1");
          setDreadfulCorruptionDescription("");
          setDreadfulDice({
          mindDie: "1d4",
          bodyDie: "1d4",
          heartDie: "1d4",
          egoDie: "1d4",
        });
          setShowDreadfulForm(false);
        }}
      >
        SAVE DREADFUL
      </Button>

      <Button
        secondary
        onClick={() => {
          setShowDreadfulForm(false);
          setSelectedGuestId("");
          setDreadfulCorruptionLevel("1");
          setDreadfulCorruptionDescription("");
        }}
      >
        CANCEL
      </Button>
    </div>
  </div>
)}
  

{/* FORGE RECORD LISTS */}
<div
  style={{
    ...panelStyle,
    marginTop: 24,
    marginBottom: 20,
    padding: 24,
  }}
>
  <h2 style={{ color: colors.goldBright, fontWeight: 400 }}>
    Forged Dreadlings
  </h2>

  {dreadlings.length === 0 ? (
    <p style={{ color: colors.muted }}>
      No Dreadlings have been forged yet.
    </p>
  ) : (
    dreadlings.map((item) => (
      <button
        key={item.id}
        onClick={() => {
          setSelectedDreadling(item);
          setSelectedDreadful(null);
          setPage("archives");
        }}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: 12,
          marginBottom: 8,
          background: "rgba(255,255,255,0.03)",
          color: colors.goldBright,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {item.name || "Unnamed Dreadling"} →
      </button>
    ))
  )}

  <h2
    style={{
      color: colors.goldBright,
      fontWeight: 400,
      marginTop: 28,
    }}
  >
    Forged Dreadfuls
  </h2>

  {dreadfuls.length === 0 ? (
    <p style={{ color: colors.muted }}>
      No Dreadfuls have been forged yet.
    </p>
  ) : (
    dreadfuls.map((item) => (
      <button
        key={item.id}
        onClick={() => {
          setSelectedDreadful(item);
          setSelectedDreadling(null);
          setPage("archives");
        }}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: 12,
          marginBottom: 8,
          background: "rgba(255,255,255,0.03)",
          color: colors.goldBright,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {item.name || "Unnamed Dreadful"} →
      </button>
    ))
  )}
</div>


          <Button
          secondary
          onClick={() => setPage("gm")}
        >
          RETURN TO MANAGEMENT
        </Button>        
      </div>
    </main>
  );
}


function renderCyclesPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 24, background: "#080b0a", color: "#eee9dc" }}>
      <h1 style={{ color: "#e4d19c", letterSpacing: 3 }}>
        CYCLES & VINYL
      </h1>

      <p style={{ color: "#9d9a8d" }}>
        Record the sessions that happened and the stories still unfolding in Paradise Hotel.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

        {/* CYCLES SECTION */}
        <section style={{ background: "rgba(20,24,21,.94)", border: "1px solid rgba(200,185,145,.24)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ color: "#e4d19c" }}>Cycles</h2>
          <p style={{ color: "#9d9a8d" }}>Session Brainstorming</p>
          
          <label>Cycle:</label>
          <input
            value={cycleDraft.cycle}
            onChange={(e) =>
              setCycleDraft({ ...cycleDraft, cycle: e.target.value })
            }
            placeholder="Session name or number"
            style={{
              display: "block",
              width: "100%",
              margin: "8px 0 16px",
              padding: 10,
              boxSizing: "border-box",
            }}
          />

          <label>Vinyl Record:</label>
          
        <input
          value={cycleDraft.vinylRecord}
          onChange={(e) =>
            setCycleDraft({ ...cycleDraft, vinylRecord: e.target.value })
          }
          placeholder="Connected plot record"
          style={{
            display: "block",
            width: "100%",
            margin: "8px 0 16px",
            padding: 10,
            boxSizing: "border-box",
          }}
        />

          <label>What Happened?:</label>
          
        <textarea
          value={cycleDraft.whatHappened}
          onChange={(e) =>
            setCycleDraft({ ...cycleDraft, whatHappened: e.target.value })
          }
          placeholder="Session events, ideas, and plans..."
          rows={5}
          style={{
            display: "block",
            width: "100%",
            margin: "8px 0 16px",
            padding: 10,
            boxSizing: "border-box",
          }}
        />
                  
          <label>Image URL:</label>
          <input
            value={cycleDraft.imageUrl}
            onChange={(e) =>
              setCycleDraft({ ...cycleDraft, imageUrl: e.target.value })
            }
            placeholder="Paste an image URL..."
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 12,
              background: "#141815",
              color: "#eee9dc",
              border: "1px solid rgba(200,185,145,.24)",
              borderRadius: 6,
              boxSizing: "border-box",
            }}
          />
          
        <button type="button" onClick={saveCycleRecord}>
          {editingCycleId ? "UPDATE CYCLE" : "SAVE CYCLE"}
        </button>

      <div style={{ marginTop: 20, borderTop: "1px solid rgba(200,185,145,.24)", paddingTop: 12 }}>
        <h3>Saved Cycles</h3>

        {cycleRecords.length === 0 ? (
          <p style={{ color: "#9d9a8d" }}>No Cycles recorded yet.</p>
        ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 12,
                      }}
                    >
            {cycleRecords.map((record) => (
              <div
                key={record.id}
                onClick={() => setSelectedCycleId(
                  selectedCycleId === record.id ? null : record.id
                )}
                style={{
                  border: "1px solid rgba(200,185,145,.3)",
                  borderRadius: 10,
                  padding: 14,
                  cursor: "pointer",
                  background: selectedCycleId === record.id
                    ? "rgba(200,185,145,.12)"
                    : "rgba(8,11,10,.7)",
                }}
              >
                    
                        {record.imageUrl && (
                          <img
                            src={record.imageUrl}
                            alt={record.cycle || "Cycle"}
                            onClick={() => setActiveCycleModal(record)}
                            title="Click to view Cycle details"
                            style={{
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                              borderRadius: 6,
                              marginBottom: 10,
                              cursor: "pointer",
                            }}
                          />
                        )}


                    
                      <h3
                        style={{
                          color: "#e4d19c",
                          margin: "4px 0 10px",
                          fontSize: 18,
                        }}
                      >
                        {record.cycle || "Untitled Cycle"}
                      </h3>

                <p style={{ color: "#9d9a8d" }}>
                  Vinyl Record: {record.vinylRecord || "None linked"}
                </p>

                {selectedCycleId === record.id && (
                  <>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {record.whatHappened || "No session notes."}
                    </p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          editCycleRecord(record);
                        }}
                      >
                        EDIT
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCycleRecord(record.id);
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

        </section>

        {/* VINYL COLLECTION SECTION */}
        <section style={{ background: "rgba(20,24,21,.94)", border: "1px solid rgba(200,185,145,.24)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ color: "#e4d19c" }}>Vinyl Collection</h2>
          <p style={{ color: "#9d9a8d" }}>Ongoing Hotel Plot Records</p>

          <label>Vinyl:</label>
          
          <input
            value={vinylDraft.vinyl}
            onChange={(e) =>
              setVinylDraft({ ...vinylDraft, vinyl: e.target.value })
            }
            placeholder="Guest, staff member, character, or plotline"
            style={{
              display: "block",
              width: "100%",
              margin: "8px 0 16px",
              padding: 10,
              boxSizing: "border-box",
            }}
          />

          <label>Vinyl Record:</label>
          
          <textarea
            value={vinylDraft.vinylRecord}
            onChange={(e) =>
              setVinylDraft({ ...vinylDraft, vinylRecord: e.target.value })
            }
            placeholder="Record the ongoing story and important developments..."
            rows={5}
            style={{
              display: "block",
              width: "100%",
              margin: "8px 0 16px",
              padding: 10,
              boxSizing: "border-box",
            }}
          />
          
            <label>Image URL:</label>
            <input
              value={vinylDraft.imageUrl}
              onChange={(e) =>
                setVinylDraft({ ...vinylDraft, imageUrl: e.target.value })
              }
              placeholder="Paste an image URL..."
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 12,
                background: "#141815",
                color: "#eee9dc",
                border: "1px solid rgba(200,185,145,.24)",
                borderRadius: 6,
                boxSizing: "border-box",
              }}
            />
          
          <button type="button" onClick={saveVinylRecord}>
            {editingVinylId ? "UPDATE VINYL" : "SAVE VINYL"}
          </button>
          
            <div style={{ marginTop: 20, borderTop: "1px solid rgba(200,185,145,.24)", paddingTop: 12 }}>
              <h3>Vinyl Collection</h3>

              {vinylRecords.length === 0 ? (
                <p style={{ color: "#9d9a8d" }}>No Vinyl records yet.</p>
              ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 12,
                      }}
                    >
                  {vinylRecords.map((record) => (
                    <div
                      key={record.id}
                      onClick={() =>
                        setSelectedVinylId(
                          selectedVinylId === record.id ? null : record.id
                        )
                      }
                      style={{
                        border: "1px solid rgba(200,185,145,.3)",
                        borderRadius: 10,
                        padding: 14,
                        cursor: "pointer",
                        background:
                          selectedVinylId === record.id
                            ? "rgba(200,185,145,.12)"
                            : "rgba(8,11,10,.7)",
                            }}
                          >
                                              
                        {record.imageUrl && (
                          <img
                            src={record.imageUrl}
                            alt={record.vinyl || "Vinyl"}
                            onClick={() => setActiveVinylModal(record)}
                            title="Click to view Vinyl details"
                            style={{
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                              borderRadius: 6,
                              marginBottom: 10,
                              cursor: "pointer",
                            }}
                          />
                        )}

                        
                        <h3
                          style={{
                            color: "#e4d19c",
                            margin: "4px 0 10px",
                            fontSize: 18,
                          }}
                        >
                          {record.vinyl || "Untitled Vinyl"}
                        </h3>

                      {selectedVinylId === record.id && (
                        <>
                          <p style={{ whiteSpace: "pre-wrap" }}>
                            {record.vinylRecord || "No plot notes."}
                          </p>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                editVinylRecord(record);
                              }}
                            >
                              EDIT
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVinylRecord(record.id);
                              }}
                            >
                              DELETE
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

        </section>
      </div>

      
      {activeCycleModal && (
        <div
          onClick={() => setActiveCycleModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 760,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#141815",
              border: "1px solid rgba(200,185,145,.4)",
              borderRadius: 12,
              padding: 24,
              color: "#eee9dc",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h2 style={{ color: "#e4d19c", margin: 0 }}>
                {activeCycleModal.cycle || "Untitled Cycle"}
              </h2>

              <button
                type="button"
                onClick={() => setActiveCycleModal(null)}
              >
                CLOSE ✕
              </button>
            </div>

            {activeCycleModal.imageUrl && (
              <img
                src={activeCycleModal.imageUrl}
                alt={activeCycleModal.cycle}
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "contain",
                  background: "#080b0a",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              />
            )}

            <h3 style={{ color: "#c8b991" }}>Cycle Record</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {activeCycleModal.vinylRecord || "No Cycle record details yet."}
            </p>

            <h3 style={{ color: "#c8b991" }}>What Happened</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {activeCycleModal.whatHappened || "No additional details yet."}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
              <button
                type="button"
                onClick={() => {
                  editCycleRecord(activeCycleModal);
                  setActiveCycleModal(null);
                }}
              >
                EDIT CYCLE
              </button>

              <button
                type="button"
                onClick={() => {
                  const id = activeCycleModal.id;
                  setActiveCycleModal(null);
                  void deleteCycleRecord(id);
                }}
              >
                DELETE CYCLE
              </button>
            </div>
          </div>
        </div>
      )}

      
      {activeVinylModal && (
        <div
          onClick={() => setActiveVinylModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 760,
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#141815",
              border: "1px solid rgba(200,185,145,.4)",
              borderRadius: 12,
              padding: 24,
              color: "#eee9dc",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h2 style={{ color: "#e4d19c", margin: 0 }}>
                {activeVinylModal.vinyl || "Untitled Vinyl"}
              </h2>

              <button
                type="button"
                onClick={() => setActiveVinylModal(null)}
              >
                CLOSE ✕
              </button>
            </div>

            {activeVinylModal.imageUrl && (
              <img
                src={activeVinylModal.imageUrl}
                alt={activeVinylModal.vinyl}
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "contain",
                  background: "#080b0a",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              />
            )}

            <h3 style={{ color: "#c8b991" }}>Vinyl Record</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {activeVinylModal.vinylRecord || "No Vinyl record details yet."}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
              <button
                type="button"
                onClick={() => {
                  editVinylRecord(activeVinylModal);
                  setActiveVinylModal(null);
                }}
              >
                EDIT VINYL
              </button>

              <button
                type="button"
                onClick={() => {
                  const id = activeVinylModal.id;
                  setActiveVinylModal(null);
                  void deleteVinylRecord(id);
                }}
              >
                DELETE VINYL
              </button>
            </div>
          </div>
        </div>
      )}


      <div style={{ marginTop: 24 }}>
        <button type="button" onClick={() => setPage("gm")}>
          RETURN TO MANAGEMENT
        </button>
      </div>
    </main>
  );
}

function renderArchivesPage() {
  const savedDreadlings = dreadlings;
  const savedDreadfuls = dreadfuls;
  
if (selectedDreadling) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        backgroundImage: `url("/public/paradise-hotel-background.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#eee9dc",
      }}
    >
      <button
        onClick={() => setSelectedDreadling(null)}
        style={{
          padding: "10px 16px",
          marginBottom: 24,
          cursor: "pointer",
        }}
      >
        ← BACK TO ARCHIVES
      </button>

      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 24,
          background: "rgba(20, 24, 21, 0.94)",
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
        }}
      >
        {selectedDreadling.imageUrl && (
          <img
            src={selectedDreadling.imageUrl}
            alt={`${selectedDreadling.name || "Dreadling"} portrait`}
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
              borderRadius: 8,
              marginBottom: 20,
            }}
          />
        )}

        <h1>{selectedDreadling.name || "Unnamed Dreadling"}</h1>

        <h2>Manifestation Record</h2>
        <p>
          <strong>Source of Trauma:</strong>{" "}
          {selectedDreadling.sourceOfTrauma || "Unspecified"}
        </p>
        <p>
          <strong>Appearance:</strong>{" "}
          {selectedDreadling.appearance || "None recorded."}
        </p>
        <p>
          <strong>Behavior:</strong>{" "}
          {selectedDreadling.behavior || "None recorded."}
        </p>
        <p>
          <strong>Encounter Ability:</strong>{" "}
          {selectedDreadling.encounterAbility || "None recorded."}
        </p>

        <hr />

        <h2>Combat Profile</h2>
        <p><strong>HP:</strong> {selectedDreadling.hp}</p>
        <p><strong>AC:</strong> {selectedDreadling.ac}</p>

        <h2>Core Dice</h2>
        <p>
          Mind: {selectedDreadling.mindDie} | Body: {selectedDreadling.bodyDie} |
          Heart: {selectedDreadling.heartDie} | Ego: {selectedDreadling.egoDie}
        </p>

        
<button
  onClick={async () => {
    const confirmed = window.confirm(
      `Permanently delete ${selectedDreadling.name || "this Dreadling"}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("dreadlings")
      .delete()
      .eq("id", selectedDreadling.id);

    if (error) {
      console.error("Failed to delete Dreadling:", error);
      alert("Could not delete the Dreadling. Please check the console.");
      return;
    }

    const updatedDreadlings = dreadlings.filter(
      (item) => item.id !== selectedDreadling.id
    );

    setDreadlings(updatedDreadlings);

    localStorage.setItem(
      "paradiseHotelDreadlings",
      JSON.stringify(updatedDreadlings)
    );

    setSelectedDreadling(null);
  }}
  style={{
    marginTop: 24,
    padding: "12px 18px",
    background: "rgba(166,91,91,.12)",
    border: `1px solid ${colors.danger}`,
    color: colors.danger,
    cursor: "pointer",
  }}
>
  DELETE DREADLING
</button>
 
      </section>
    </main>
  );
}



if (selectedDreadful) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        backgroundImage: `url("/public/paradise-hotel-background.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#eee9dc",
      }}
    >
      <button
        onClick={() => setSelectedDreadful(null)}
        style={{
          padding: "10px 16px",
          marginBottom: 24,
          cursor: "pointer",
        }}
      >
        ← BACK TO ARCHIVES
      </button>

      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 24,
          background: "rgba(20, 24, 21, 0.94)",
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
        }}
      >
        {selectedDreadful.portrait && (
          <img
            src={selectedDreadful.portrait}
            alt={`${selectedDreadful.name || "Dreadful"} portrait`}
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
              borderRadius: 8,
              marginBottom: 20,
            }}
          />
        )}

        <h1>{selectedDreadful.name || "Unnamed Dreadful"}</h1>
        <p><strong>Former Room:</strong> {selectedDreadful.room || "Unassigned"}</p>
        <p><strong>Corruption Level:</strong> {selectedDreadful.corruptionLevel}</p>
        <p><strong>Corruption Description:</strong> {selectedDreadful.corruptionDescription || "None recorded."}</p>

        <hr />

        <h2>Combat Profile</h2>
        <p><strong>HP:</strong> {selectedDreadful.hp}</p>
        <p><strong>AC:</strong> {selectedDreadful.ac}</p>

        <h2>Core Dice</h2>
        <p>
          Mind: {selectedDreadful.mindDie} | Body: {selectedDreadful.bodyDie} |
          Heart: {selectedDreadful.heartDie} | Ego: {selectedDreadful.egoDie}
        </p>

        
<button
  onClick={async () => {
    const confirmed = window.confirm(
      `Permanently delete ${selectedDreadful.name || "this Dreadful"}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("dreadfuls")
      .delete()
      .eq("id", selectedDreadful.id);

    if (error) {
      console.error("Failed to delete Dreadful:", error);
      alert("Could not delete the Dreadful. Please check the console.");
      return;
    }

    const updatedDreadfuls = dreadfuls.filter(
      (item) => item.id !== selectedDreadful.id
    );

    setDreadfuls(updatedDreadfuls);

    localStorage.setItem(
      "paradiseHotelDreadfuls",
      JSON.stringify(updatedDreadfuls)
    );

    setSelectedDreadful(null);
  }}
  style={{
    marginTop: 24,
    padding: "12px 18px",
    background: "rgba(166,91,91,.12)",
    border: `1px solid ${colors.danger}`,
    color: colors.danger,
    cursor: "pointer",
  }}
>
  DELETE DREADFUL
</button>


      </section>
    </main>
  );
}

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        backgroundImage: `url("/public/paradise-hotel-background.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#eee9dc",
      }}
    >
      <h1>PARADISE HOTEL ARCHIVES</h1>
      <p>Records of Dreadlings and Dreadful Guests.</p>

      <Button onClick={() => setPage("forge")}>
        RETURN TO FORGE
      </Button>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          background: "rgba(20,24,21,0.94)",
          border: "1px solid rgba(200,185,145,0.24)",
          borderRadius: 12,
        }}
      >
        <h2>DREADLINGS</h2>
        <p>Creatures of trauma and dark memories, created by the Man Upstairs as a way for others to face it.</p>

        
{savedDreadlings.length === 0 ? (
  <p style={{ color: colors.muted }}>
    No Dreadlings have been recorded.
  </p>
) : (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
      width: "100%",
      gap: 18,
      marginTop: 20,
    }}
  >
    {savedDreadlings.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setSelectedDreadling(item);
          setSelectedDreadful(null);
        }}
        style={{
          padding: 0,
          textAlign: "left",
          overflow: "hidden",
          background: "rgba(8, 11, 10, 0.88)",
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          color: colors.text,
          cursor: "pointer",
          transition: "transform 0.2s ease, border-color 0.2s ease",
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={`${item.name || "Dreadling"} portrait`}
            style={{
              width: "100%",
              height: 230,
              objectFit: "cover",
              display: "block",
              borderBottom: `1px solid ${colors.border}`,
            }}
          />
        ) : (
          <div
            style={{
              height: 230,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(200, 185, 145, 0.04)",
              borderBottom: `1px solid ${colors.border}`,
              color: colors.muted,
              letterSpacing: "0.12em",
              fontSize: 11,
            }}
          >
            NO PORTRAIT
          </div>
        )}

        <div style={{ padding: 16 }}>
          <div
            style={{
              color: colors.gold,
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Dreadling · Manifestation
          </div>

          <h3
            style={{
              margin: "0 0 12px",
              color: colors.goldBright,
              fontSize: 19,
              fontWeight: 400,
            }}
          >
            {item.name || "Unnamed Dreadling"}
          </h3>

          <p style={{ margin: "0 0 8px", fontSize: 13, color: colors.muted }}>
            Trauma: {item.sourceOfTrauma || "Unspecified"}
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              fontSize: 12,
              color: colors.text,
            }}
          >
            <span>HP: {item.hp}</span>
            <span>AC: {item.ac}</span>
          </div>

          <p
            style={{
              margin: "16px 0 0",
              color: colors.gold,
              fontSize: 11,
              letterSpacing: "0.08em",
            }}
          >
            OPEN RECORD →
          </p>
        </div>
      </button>
    ))}
  </div>
)}

      </section>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          background: "rgba(20,24,21,0.94)",
          border: "1px solid rgba(200,185,145,0.24)",
          borderRadius: 12,
        }}
      >
        <h2>DREADFULS</h2>
        <p>Guests who are filled with Dread and had transformed themselves as harmful manifestations of the trauma.</p>

        {savedDreadfuls.length === 0 ? (
          <p style={{ color: colors.muted }}>
            No Dreadfuls have been recorded.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              width: "100%",
              gap: 18,
              marginTop: 20,
            }}
          >
            {savedDreadfuls.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedDreadful(item);
                  setSelectedDreadling(null);
                }}
                style={{
                  padding: 0,
                  textAlign: "left",
                  overflow: "hidden",
                  background: "rgba(8, 11, 10, 0.88)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  color: colors.text,
                  cursor: "pointer",
                  minWidth: 0,
                  width: "100%",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                }}
              >
                {item.portrait ? (
                  <img
                    src={item.portrait}
                    alt={`${item.name || "Dreadful"} portrait`}
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      display: "block",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(200, 185, 145, 0.04)",
                      borderBottom: `1px solid ${colors.border}`,
                      color: colors.muted,
                      fontSize: 11,
                      letterSpacing: "0.12em",
                    }}
                  >
                    NO PORTRAIT
                  </div>
                )}

                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      color: colors.gold,
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Dreadful · Corrupted
                  </div>

                  <h3
                    style={{
                      margin: "0 0 12px",
                      color: colors.goldBright,
                      fontSize: 18,
                      fontWeight: 400,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.name || "Unnamed Dreadful"}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 12,
                      color: colors.muted,
                    }}
                  >
                    Former Room: {item.room || "Unassigned"}
                  </p>

                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 12,
                      color: colors.text,
                    }}
                  >
                    Corruption Level: {item.corruptionLevel}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: colors.muted,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.corruptionDescription ||
                      "No corruption description."}
                  </p>

                  <p
                    style={{
                      margin: "16px 0 0",
                      color: colors.gold,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                    }}
                  >
                    OPEN RECORD →
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
              </section>
            </main>
          );
        }


/* =======================================================
   ROUTER
   ======================================================= */

if (page === "home") {
  return renderHomePage();
}

if (page === "checkin") {
  return renderCheckInPage();
}

if (page === "hub") {
  return renderHubPage();
}

if (page === "basement") {
  return renderBasementPage();
}

if (page === "anomalies") {
  return renderAnomaliesPage();
}

if (page === "room") {
  return renderRoomPage();
}

if (page === "forge") {
  return renderForgePage();
}

if (page === "cycles") {
  return renderCyclesPage();
}

if (page === "archives") {
  return renderArchivesPage();
}


if (page === "memoryDetail" && selectedMemory) {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",
        color: colors.text,
        padding: "24px 18px 50px",
      }}
    >
              <div
          className="hotel-panel"
          style={{
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
        <section
          style={{
            padding: "24px",
            background: "rgba(20, 24, 21, .94)",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              color: colors.gold,
              fontSize: 10,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            Memory
          </div>

          <h2
            style={{
              margin: "10px 0 0",
              color: colors.text,
              fontSize: 30,
              fontWeight: 500,
            }}
          >
            {selectedMemory.name}
          </h2>

          <div
            style={{
              marginTop: 6,
              color: colors.muted,
              fontSize: 15,
              fontStyle: "italic",
            }}
          >
            Memory of {selectedMemory.holder || "Unknown"}
          </div>

          <div
            style={{
              marginTop: 32,
              textAlign: "center",
            }}
          >
            <img
              src={selectedMemory.imageUrl}
              alt={selectedMemory.name}
              style={{
                width: "100%",
                maxWidth: 420,
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 32,
              padding: "18px",
              borderLeft: `3px solid ${colors.gold}`,
              background: "rgba(255,255,255,.02)",
            }}
          >
            <div
              style={{
                color: colors.gold,
                fontSize: 11,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Details
            </div>

            <div
              style={{
                color: colors.text,
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {selectedMemory.details || "No details recorded."}
            </div>
          </div>

{memoryEditOpen && (
  <div
    style={{
      marginTop: 20,
      padding: 20,
      background: "rgba(20, 24, 21, 0.95)",
      border: "1px solid rgba(200, 185, 145, 0.35)",
      borderRadius: 12,
      display: "grid",
      gap: 12,
    }}
  >
    <h3>Edit Memory</h3>

    <label>
      Memory Name
      <input
        value={memoryName}
        onChange={(e) => setMemoryName(e.target.value)}
      />
    </label>

    <label>
      Memory Holder
      <input
        value={memoryHolder}
        onChange={(e) => setMemoryHolder(e.target.value)}
      />
    </label>

    <label>
      Image URL
      <input
        value={memoryImageUrl}
        onChange={(e) => setMemoryImageUrl(e.target.value)}
      />
    </label>

    <label>
      Details
      <textarea
        value={memoryDetails}
        onChange={(e) => setMemoryDetails(e.target.value)}
        rows={5}
      />
    </label>

    <button
      type="button"
      onClick={async () => {
          const { error } = await supabase
            .from("memories")
            .update({
              name: memoryName.trim(),
              holder: memoryHolder.trim(),
              image_url: memoryImageUrl.trim(),
              details: memoryDetails.trim(),
            })
            .eq("id", selectedMemory.id);

          if (error) {
            console.error("Failed to update memory:", error);
            alert(`Could not save memory changes: ${error.message}`);
            return;
          }

          const updatedMemory = {
            id: selectedMemory.id,
            name: memoryName.trim(),
            holder: memoryHolder.trim(),
            imageUrl: memoryImageUrl.trim(),
            details: memoryDetails.trim(),
          };

        setMemories((previous) =>
          previous.map((memory) =>
            memory.id === updatedMemory.id ? updatedMemory : memory
          )
        );

        setSelectedMemory(updatedMemory);
        setMemoryEditOpen(false);
      }}
    >
      Save Changes
    </button>

    <button
      type="button"
      onClick={() => setMemoryEditOpen(false)}
    >
      Cancel
    </button>
  </div>
)}

<div
  style={{
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 24,
    alignItems: "center",
  }}
  >

                      <button
              type="button"
              onClick={() => {
                setMemoryName(selectedMemory.name);
                setMemoryHolder(selectedMemory.holder);
                setMemoryImageUrl(selectedMemory.imageUrl);
                setMemoryDetails(selectedMemory.details);
                setMemoryEditOpen(true);
              }}
              style={{
                padding: "10px 18px",
                background: "rgba(200, 185, 145, 0.08)",
                color: "#e4d19c",
                border: "1px solid rgba(200, 185, 145, 0.35)",
                borderRadius: 7,
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              Edit Memory
            </button>


                    <button
            type="button"
            onClick={() => {
              setMemoryEditOpen(false);
              setSelectedMemory(null);
              setPage("memory");
            }}
            style={{
              padding: "10px 18px",
              background: "rgba(200, 185, 145, 0.08)",
              color: "#e4d19c",
              border: "1px solid rgba(200, 185, 145, 0.35)",
              borderRadius: 7,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            ← Back to Memories
          </button>
          </div>
        </section>
      </div>
    </main>
  );
}

if (page === "memory") {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",
        color: colors.text,
        padding: "24px 18px 50px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <section
  style={{
    padding: "24px",
    background: "rgba(20, 24, 21, .94)",
    border: `1px solid ${colors.border}`,
  }}
>

<h2
  style={{
    margin: "10px 0 0",
    color: colors.text,
    fontSize: 28,
    fontWeight: 500,
  }}
>
  Mnēmosynē
</h2>

          <div
            style={{
              marginTop: -3,
              color: colors.muted,
              fontSize: 15,
              fontStyle: "italic",
            }}
          >
            The Tree of Memory
          </div>

          <h1
  style={{
    margin: "18px 0 0",
    color: "#F4E3B1", // Soft pale golden color
    fontSize: 14,
    lineHeight: 1.7,
  }}
>
  As you approach Mnēmosynē, its branches sway, as memories play their music of joy and pain.
</h1>

<div style={{ marginTop: 24 }}>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    }}
  >
    <div
      style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".12em",
        textTransform: "uppercase",
      }}
    >
      Memory Branches
    </div>

    <button
  type="button"
  onClick={() => setMemoryCreatorOpen(true)}
  style={{
    padding: "8px 12px",
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${colors.border}`,
    color: colors.gold,
    cursor: "pointer",
  }}
>
  + Memory
</button>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 18,
    }}
  >

    {memories.length === 0 && (
  <div
    style={{
      gridColumn: "1 / -1",
      padding: "28px 18px",
      border: `1px solid ${colors.border}`,
      background: "rgba(255,255,255,.02)",
      color: colors.muted,
      fontSize: 13,
      lineHeight: 1.7,
      textAlign: "center",
    }}
  >
    Mnēmosynē is quiet.
    <br />
    Nothing has been remembered here yet.
  </div>
)}

    {memories.map((memory, index) => (
  <div
    key={`${memory.name}-${index}`}
    onClick={() => {
  setSelectedMemory(memory);
  setPage("memoryDetail");
}}
    style={{
      border: `1px solid ${colors.border}`,
      background: "rgba(255,255,255,.02)",
      boxShadow: "0 4px 16px rgba(0,0,0,.18)",
      cursor: "pointer",
      overflow: "hidden",
    }}
  >
    <img
      src={memory.imageUrl}
      alt={memory.name}
      style={{
  width: "100%",
  objectFit: "cover",
  display: "block",
  height: 280,
  aspectRatio: "2 / 3",
}}
    />

    <div
  style={{
    padding: "10px 12px",
    color: colors.text,
    fontSize: 13,
    lineHeight: 1.4,
    textAlign: "center",
    borderTop: `1px solid ${colors.border}`,
  }}
>
  <div
  style={{
    color: colors.gold,
  }}
>
  {memory.name}
</div>

<div
  style={{
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    fontStyle: "italic",
  }}
>
  {memory.holder || "Unknown"}
</div>
</div>

<button
  type="button"
  onClick={async (event) => {
  event.stopPropagation();

  if (!window.confirm(`Delete the memory "${memory.name}"?`)) {
    return;
  }

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memory.id);

  if (error) {
    console.error(
      "Supabase memory delete:",
      JSON.stringify(error, null, 2)
    );
    alert("Failed to delete memory.");
    return;
  }

  setMemories((previous) =>
    previous.filter((currentMemory) => currentMemory.id !== memory.id)
  );
}}
  style={{
    width: "100%",
    padding: "9px 12px",
    background: "rgba(166,91,91,.08)",
    border: `1px solid ${colors.border}`,
    color: colors.danger,
    cursor: "pointer",
    fontSize: 12,
  }}
>
  Delete
</button>

  </div>
))}

{memoryCreatorOpen && (
  <div
    style={{
      marginBottom: 18,
      padding: "18px",
      border: `1px solid ${colors.border}`,
      background: "rgba(255,255,255,.02)",
    }}
  >
    <div
      style={{
        color: colors.gold,
        fontSize: 11,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        marginBottom: 14,
      }}
    >
      Add Memory
    </div>

    <input
  type="text"
  placeholder="Memory Name"
  value={memoryName}
  onChange={(event) => setMemoryName(event.target.value)}
  style={{
    width: "100%",
    padding: "12px 14px",
    marginBottom: 10,
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${colors.border}`,
    color: colors.text,
    boxSizing: "border-box",
  }}
/>

    <input
  type="text"
  placeholder="Memory Holder"
  value={memoryHolder}
  onChange={(event) => setMemoryHolder(event.target.value)}
  style={{
    width: "100%",
    padding: "12px 14px",
    marginBottom: 10,
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${colors.border}`,
    color: colors.text,
    boxSizing: "border-box",
  }}
/>

    <input
  type="url"
  placeholder="Memory Image URL"
  value={memoryImageUrl}
  onChange={(event) => setMemoryImageUrl(event.target.value)}
  style={{
    width: "100%",
    padding: "12px 14px",
    marginBottom: 10,
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${colors.border}`,
    color: colors.text,
    boxSizing: "border-box",
  }}
/>

    <textarea
  placeholder="Details"
  rows={4}
  value={memoryDetails}
  onChange={(event) => setMemoryDetails(event.target.value)}
  style={{
    width: "100%",
    padding: "12px 14px",
    marginBottom: 14,
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${colors.border}`,
    color: colors.text,
    boxSizing: "border-box",
    resize: "vertical",
  }}
/>

    <button
      type="button"
      onClick={() => setMemoryCreatorOpen(false)}
      style={{
        padding: "10px 14px",
        background: "rgba(255,255,255,.03)",
        border: `1px solid ${colors.border}`,
        color: colors.text,
        cursor: "pointer",
      }}
    >
      Cancel
    </button>
  
  <button
  type="button"
  onClick={async () => {
  if (!memoryName.trim() || !memoryImageUrl.trim()) {
    alert("Memory Name and Image URL are required.");
    return;
  }

  const newMemory = {
    name: memoryName.trim(),
    holder: memoryHolder.trim(),
    image_url: memoryImageUrl.trim(),
    details: memoryDetails.trim(),
  };

  const { data, error } = await supabase
    .from("memories")
    .insert(newMemory)
    .select()
    .single();

  if (error) {
    console.error(
  "Supabase memory save:",
  JSON.stringify(error, null, 2)
);
    alert("Failed to save memory.");
    return;
  }

  setMemories((previous) => [
    ...previous,
    {
      id: data.id,
      name: data.name ?? "",
      holder: data.holder ?? "",
      imageUrl: data.image_url ?? "",
      details: data.details ?? "",
    },
  ]);

  setMemoryName("");
  setMemoryHolder("");
  setMemoryImageUrl("");
  setMemoryDetails("");
  setMemoryCreatorOpen(false);
}}


  style={{
    marginRight: 8,
    padding: "10px 14px",
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${colors.border}`,
    color: colors.text,
    cursor: "pointer",
  }}
>
  Save Memory
</button>

  </div>
)}

  </div>

  <div
    style={{
      border: `1px solid ${colors.border}`,
      background: "rgba(255,255,255,.02)",
      cursor: "pointer",
      overflow: "hidden",
    }}
  >
  </div>
</div>


          <button
            type="button"
            onClick={() => setPage("mneme")}
            style={{
  marginTop: 24,
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,.03)",
  border: `1px solid ${colors.border}`,
  color: colors.text,
  cursor: "pointer",
}}
          >
            Leave Memory
          </button>
        </section>
      </div>
    </main>
  );
}

if (page === "mneme") {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(rgba(8, 11, 10, 0.72), rgba(8, 11, 10, 0.72)), url("${HOTEL_BACKGROUND}")`,
backgroundSize: "cover",
backgroundPosition: "center",
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",
        color: colors.text,
        padding: "24px 18px 50px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <section
  style={{
    padding: "24px",
    background: "rgba(20, 24, 21, .94)",
    border: `1px solid ${colors.border}`,
  }}
>
<div
  style={{
    color: colors.gold,
    fontSize: 10,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  }}
>
  Guest Services
</div>

<h2
  style={{
    margin: "10px 0 0",
    color: colors.text,
    fontSize: 28,
    fontWeight: 500,
  }}
>
  Mnēmosynē
</h2>

          <div
            style={{
              marginTop: -4,
              color: colors.muted,
              fontSize: 12,
              fontStyle: "italic",
            }}
          >
            The Tree of Memory
          </div>

          <div
  style={{
    marginTop: 24,
    padding: "22px",
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,.02)",
    textAlign: "center",
  }}
>
  <div
    style={{
      color: colors.gold,
      fontSize: 11,
      letterSpacing: ".14em",
      textTransform: "uppercase",
    }}
  >
    Mnēmosynē
  </div>

  <p
    style={{
      margin: "18px 0 0",
      color: colors.text,
      fontSize: 16,
      lineHeight: 1.7,
    }}
  >
    A tree stands quietly before you.
    <br />
    Its roots disappear into the floor.
  </p>

  <p
    style={{
      margin: "14px 0 0",
      color: colors.muted,
      fontSize: 13,
      lineHeight: 1.7,
    }}
  >
    Somewhere among its branches, something you remember
    is waiting.
  </p>
</div>

<button
  type="button"
onClick={() => setPage("memory")}
  style={{
  marginTop: 24,
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,.03)",
  border: `1px solid ${colors.border}`,
  color: colors.text,
  cursor: "pointer",
}}
>
  Approach the Tree
</button>

          <button
            type="button"
            onClick={() => setPage("services")}
            style={{
  marginTop: 8,
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,.03)",
  border: `1px solid ${colors.border}`,
  color: colors.text,
  cursor: "pointer",
}}
          >
            Leave Mnēmosynē
          </button>
        </section>
      </div>
    </main>
  );
}

if (page === "services") {
  return renderServicesPage(loungeBarOpen, setLoungeBarOpen);
}

if (page === "guide") {
  return renderGuidePage();
}

if (page === "gm") {
  if (!gmUnlocked) {
    return (
      <main style={pageStyle}>
        <div
            className="hotel-panel"
            style={{
              ...containerStyle,
              padding: "60px 20px",
              textAlign: "center",
            }}
          >
          <section style={panelStyle}>
            <h1
              style={{
                color: colors.goldBright,
                fontWeight: 400,
              }}
            >
              GM Control Locked
            </h1>

            <p style={{ color: colors.muted }}>
              GM access is required to enter this area.
            </p>

            <Button
              secondary
              onClick={() => setPage("hub")}
            >
              RETURN TO LOBBY
            </Button>
          </section>
        </div>
      </main>
    );
  }

  return renderGMPage();
}

if (page === "combat") {
  return renderCombatPage();
}

return renderHomePage();
}

/* =========================================================
   SUPPORT COMPONENTS
   These are intentionally OUTSIDE App().
   This prevents React from recreating their component
   identity every time App state changes.
   ========================================================= */

function StatCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 18,
        borderColor: danger
          ? "rgba(166,91,91,.55)"
          : colors.border,
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 18,
          letterSpacing: ".14em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 28,
          marginTop: 8,
          color: danger
            ? colors.danger
            : colors.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EditableStatCard({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 18,
        borderColor: colors.border,
      }}
    >
      <div
        style={{
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".14em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 7,
          marginTop: 8,
        }}
      >
        <input
          className="no-spinner"
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => {
            const nextValue = Number(e.target.value);

            onChange(
              Math.max(
                0,
                Math.min(
                  max,
                  Number.isFinite(nextValue)
                    ? nextValue
                    : 0
                )
              )
            );
          }}
          style={{
            ...inputStyle,
            width: 82,
            fontSize: 24,
            textAlign: "center",
            color: colors.text,
            MozAppearance: "textfield",
            appearance: "textfield",
          }}
        />

        <span
          style={{
            color: colors.muted,
            fontSize: 20,
          }}
        >
          /
        </span>

        <span
          style={{
            color: colors.goldBright,
            fontSize: 24,
          }}
        >
          {max}
        </span>
      </div>
    </div>
  );
}



