import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";
import { DiceRoller, ProficiencyTags } from "./DiceRoller";
import BattleGrounds from "./BattleGrounds";
import { useBattleChannel } from "./battleRealtime";
import { useRollFeed } from "./rollFeed";
import ForgeArchives from "./Forgearchives";

import CyclesArchive from "./CyclesArchive";
import RecordsGallery from "./RecordsGallery";

import RoomDirectory, { GmRoomOverlay } from "./RoomDirectory";


import {
  MnemeEntrance,
  MemoryTree,
  MemoryDetail,
  packMemoryDetails,
  unpackMemoryDetails,
  type MemoryDraft,
  type MemoryRecord,
} from "./Mnemosyne";

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

  const calculatedDustCount =
  safeDread > 0
    ? Math.round(25 + ratio * 125)
    : 0;

const isSmallScreen =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 600px)").matches;

const dustCount = isSmallScreen
  ? Math.min(calculatedDustCount, 40)
  : calculatedDustCount;

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

function rowToGuest(row: any): Guest {
  return normalizeGuest({
    ...row,
    stay: row.days_of_stay ?? row.stay ?? "",
    purpose: row.purpose_of_stay ?? row.purpose ?? "",
    important: row.important_experience ?? row.important ?? "",
    fears: row.fear ?? row.fears ?? "",
    trauma: row.traumatic_experience ?? row.trauma ?? "",
    lastMemory: row.last_memory ?? row.lastMemory ?? "",
    hotelNotes: row.hotel_notes ?? row.hotelNotes ?? "",
    hp: row.current_hp ?? row.hp,
    maxHp: row.max_hp ?? row.maxHp,
    memoryPool: row.memory_pool ?? row.memoryPool ?? row.memory ?? 0,
    maxMemoryPool: row.max_memory_pool ?? row.maxMemoryPool,
  });
}

function guestSignature(g: Guest): string {
  const n = normalizeGuest(g);
  return JSON.stringify(
    {
      name: n.name, password: n.password, room: n.room, title: n.title,
      role: n.role, role2: n.role2, level: n.level, stay: n.stay,
      purpose: n.purpose, important: n.important, fears: n.fears,
      trauma: n.trauma, lastMemory: n.lastMemory, luggage: n.luggage,
      hotelNotes: n.hotelNotes, skills: n.skills, abilities: n.abilities,
      totems: n.totems, gifts: n.gifts, notes: n.notes, portrait: n.portrait,
      hp: n.hp, memoryPool: n.memoryPool, maxMemoryPool: n.maxMemoryPool,
      dread: n.dread, movement: n.movement,
    },
    (_k, v) => (v === null || v === undefined ? "" : v)
  );
}




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

  Timekeeper: {
    description: "Tracks and directs the inconsistent flow of time.",
    action: "Time Out",
    passive: "All-Time",
  },

  Doorman: {
    description: "Controls and records on who goes where and why.",
    action: "Open-Door",
    passive: "Unmovable",
  },

  Overseer: {
    description: "Guides and shapes an area accordingly to what is needed.",
    action: "Dominance",
    passive: "Gentle Voice",
  },

  Mnēmosynē: {
    description: "Keeper of all memories",
    action: "Take Root",
    passive: "I Recall",
  },

  Maintenance: {
    description: "Maintains the Hotel and its systems",
    action: "Fix It",
    passive: "Omnisense",
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
      "You can talk your way through almost anything, even with Dreadlings hungry for your memories.",
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

  Timekeeper: {
    description:
      "You track the inconsistent flow of time. You recognize what has happened, what is happening, and what has yet to happen. In a place where time is measured by memory, you understand that the past is never truly past, and the future is never certain.",
    actionDescription:
      "You may briefly interrupt the flow of time within your immediate surroundings. For a moment, movement and events around you come to a standstill, allowing you to act, reposition yourself, or prevent an unfolding situation from progressing. What you can affect is limited, and time will always demand that the moment be returned.",
    passiveDescription:
      "You possess an unusual awareness of time's inconsistencies. You can recognize repeated moments, notice when events occur out of order, and sense when something has been altered, skipped, or caught in a loop. You may not know why time has changed, but you will know that it has.",
  },

  Doorman: {
    description:
      "You control and record who goes where, when they enter, and why they are permitted to pass. Every threshold has meaning, and every arrival carries a purpose. You stand between what is allowed inside and what must remain outside.",
    actionDescription:
      "You may open a passage where one should not exist or force open a way that has been sealed, blocked, or forbidden. For a brief moment, you can establish a connection between two accessible thresholds, allowing yourself and others to pass through. The passage cannot lead somewhere you have no means of identifying or reaching.",
    passiveDescription:
      "You are exceptionally difficult to displace, restrain, or force beyond a threshold you have chosen to guard. You can also sense when a boundary has been crossed without permission, whether the trespasser is a guest, an anomaly, or something the hotel refuses to acknowledge.",
  },

  Overseer: {
    description:
      "You guide and shape an area according to what is needed. You understand the relationship between people, places, and the rules that govern them. Whether through authority, persuasion, or quiet understanding, you can influence an environment until it begins to follow your direction.",
    actionDescription:
      "You impose your will upon your immediate surroundings, briefly shifting an area's conditions to suit your needs. You may alter the atmosphere, influence the behavior of nearby environmental features, or establish a temporary condition that benefits you and your allies. Your influence has limits; you can shape what is present, but you cannot create anything from nothing.",
    passiveDescription:
      "Your presence carries an inexplicable authority that encourages others to listen. Your voice can soothe agitation, steady frightened guests, and make your intentions easier to understand. Even those who distrust you may find themselves listening before deciding whether to obey. Your influence cannot guarantee agreement or override another person's will.",
  },

  Mnēmosynē: {
    description:
      "You are the keeper of all memories. Every experience leaves an impression upon you, whether it belongs to you or someone else. You preserve what time erases, what the mind rejects, and what the hotel would rather remain forgotten. Yet to remember everything is not the same as understanding it.",
    actionDescription:
      "You anchor a memory, identity, or piece of information against forces that would erase, distort, or rewrite it. You may preserve a recollection within yourself or help another person hold on to something they are about to lose. While the effect lasts, the protected memory cannot easily be altered or removed, though the truth it contains may still be misunderstood.",
    passiveDescription:
      "Nothing you have genuinely experienced is ever entirely lost to you. You can revisit fragments of your own memories with unusual clarity and recognize details that others have forgotten. When confronted with familiar people, places, or events, forgotten recollections may resurface unexpectedly. You cannot recall an experience you never encountered, nor does remembering guarantee that your interpretation was correct.",
  },

  Maintenance: {
    description:
      "You maintain the Hotel and its systems. You understand how things work, how they are connected, and how to keep them running smoothly. You can repair, restore, and optimize the environment around you.",
    actionDescription:
      "You can repair or restore a broken or malfunctioning object, device, or system. You may also optimize an area to improve its functionality, efficiency, or safety. Your expertise allows you to identify issues and implement solutions that others might overlook.",
    passiveDescription:
      "You have an intuitive understanding of the Hotel's inner workings. You can identify problems, failures, and how to fix them. Your presence ensures that the system is healthy and functioning properly.",
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
  "/paradise-hotel-background.jpg";

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
      className={secondary ? "ph-btn ph-btn-secondary" : "ph-btn"}
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
      style={S_01}
    >
      <span
        style={S_02}
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
      style={S_01}
    >
      <span
        style={S_02}
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

/* Shared inline styles (identical objects used in several places). */
const S_01: React.CSSProperties = {
        display: "grid",
        gap: 7,
        marginBottom: 16,
      };

const S_02: React.CSSProperties = {
          fontSize: 11,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: colors.gold,
        };

const S_03: React.CSSProperties = {
                  color: colors.gold,
                  fontSize: 11,
                  letterSpacing: ".18em",
                  marginBottom: 18,
                };

const S_04: React.CSSProperties = {
                  color: colors.goldBright,
                  fontWeight: 400,
                  margin: "0 0 10px",
                };

const S_05: React.CSSProperties = {
                  color: colors.muted,
                  margin: 0,
                };



const S_07: React.CSSProperties = {
          color: colors.gold,
          fontSize: 19,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 8,
        };

const S_08: React.CSSProperties = {
                  color: colors.goldBright,
                  fontWeight: 400,
                  margin: 0,
                };

const S_09: React.CSSProperties = {
    marginTop: 24,
    border: `1px solid ${colors.border}`,
    padding: 20,
    background: colors.panel,
  };

const S_10: React.CSSProperties = {
      marginBottom: 18,
    };

const S_11: React.CSSProperties = {
        margin: "6px 0 0",
        color: colors.goldBright,
        fontWeight: 400,
      };

const S_12: React.CSSProperties = {
      padding: "10px 16px",
      border: `1px solid ${colors.border}`,
      background: colors.gold,
      color: "#000000",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
    };

const S_13: React.CSSProperties = {
        color: colors.gold,
        fontSize: 10,
        letterSpacing: ".16em",
        textTransform: "uppercase",
      };

const S_14: React.CSSProperties = {
        border: `1px solid ${colors.border}`,
        padding: 18,
        background: "rgba(0,0,0,.12)",
      };

const S_15: React.CSSProperties = {
          color: colors.gold,
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 10,
        };

const S_16: React.CSSProperties = {
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 10,
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 15,
        };

const S_17: React.CSSProperties = {
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          background: "rgba(0,0,0,.25)",
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        };

const S_18: React.CSSProperties = {
      color: colors.gold,
      fontSize: 10,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      marginBottom: 6,
    };

const S_19: React.CSSProperties = {
                color: colors.gold,
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              };

const S_20: React.CSSProperties = {
                  display: "block",
                  color: colors.muted,
                  fontSize: 11,
                  marginBottom: 6,
                };

const S_21: React.CSSProperties = {
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
      };

const S_22: React.CSSProperties = {
          maxWidth: 900,
          margin: "0 auto",
        };

const S_23: React.CSSProperties = {
                  margin: "0 0 16px",
                  color: colors.gold,
                  fontSize: 17,
                  fontWeight: 600,
                };

const S_24: React.CSSProperties = {
          color: colors.gold,
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          marginBottom: 6,
        };

const S_25: React.CSSProperties = {
          margin: 0,
          color: colors.goldBright,
          fontSize: 22,
          fontWeight: 500,
        };

const S_26: React.CSSProperties = {
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 14,
          marginTop: 14,
        };

const S_27: React.CSSProperties = {
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 14,
        };

const S_28: React.CSSProperties = {
          margin: 0,
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        };

const S_29: React.CSSProperties = {
          margin: "10px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          fontSize: 13,
        };

const S_30: React.CSSProperties = {
          margin: "12px 0 0",
          color: colors.goldBright,
          fontStyle: "italic",
          lineHeight: 1.7,
          fontSize: 13,
        };

const S_31: React.CSSProperties = {
                margin: 0,
                color: colors.muted,
                lineHeight: 1.8,
                fontSize: 14,
              };

const S_32: React.CSSProperties = {
              textAlign: "left",
              padding: 10,
              color: "#8CFF9A",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            };

function AppScreens({
  onPageChange,
}: {
  onPageChange: (page: Page) => void;
}) {

  const [memoryCreatorOpen, setMemoryCreatorOpen] = useState(false);
  const [memoryEditOpen, setMemoryEditOpen] = useState(false);
  const [memoryName, setMemoryName] = useState("");
  const [memoryHolder, setMemoryHolder] = useState("");
  const [memoryImageUrl, setMemoryImageUrl] = useState("");
  const [memoryDetails, setMemoryDetails] = useState("");
  const [memoryEmotion, setMemoryEmotion] = useState("");
  const [memories, setMemories] = useState<MemoryRecord[]>([]);

const [dreadGained, setDreadGained] = useState(false);

const [selectedMemory, setSelectedMemory] = useState<MemoryRecord | null>(null);

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
        ...unpackMemoryDetails(row.details),
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

  // Tell the navigation bar which page is showing, and let it change pages.
  useEffect(() => {
    onPageChange(page);
  }, [page, onPageChange]);

  useEffect(() => {
    const handleNav = (event: Event) => {
      const target = (event as CustomEvent<Page>).detail;
      if (target) setPage(target);
    };

    window.addEventListener("ph-nav", handleNav);
    return () => window.removeEventListener("ph-nav", handleNav);
  }, []);

  
const [cycleRecords, setCycleRecords] = useState<CycleRecord[]>([]);
const [vinylRecords, setVinylRecords] = useState<VinylRecord[]>([]);






















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
  
  
  
  

























type Dreadling = {
  id: string;
  name: string;
  imageUrl: string;
  sourceOfTrauma: string;
  appearance: string;
  behavior: string;
  hp: string;
  ac: string;
  abilities: {
    name: string;
    description: string;
  }[];
  dreadfulAction: {
    name: string;
    description: string;
  };
  encounterAbility?: string;
  mindDie: string;
  bodyDie: string;
  heartDie: string;
  egoDie: string;
};



const [dreadlings, setDreadlings] = useState<Dreadling[]>(() => {
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
  const savedDreadlings: Dreadling[] = data.map((row) => {
    const item = row.data as Partial<Dreadling>;

    return {
      ...item,
      id: item.id || row.id,
      name: item.name || "",
      imageUrl: item.imageUrl || "",
      sourceOfTrauma: item.sourceOfTrauma || "",
      appearance: item.appearance || "",
      behavior: item.behavior || "",
      hp: item.hp || "10",
      ac: item.ac || "10",
      abilities: Array.isArray(item.abilities)
        ? item.abilities
        : item.encounterAbility
          ? [{ name: "Encounter Ability", description: item.encounterAbility }]
          : [{ name: "", description: "" }],
      dreadfulAction: item.dreadfulAction || {
        name: "",
        description: "",
      },
      mindDie: item.mindDie || "1d4",
      bodyDie: item.bodyDie || "1d4",
      heartDie: item.heartDie || "1d4",
      egoDie: item.egoDie || "1d4",
    } as Dreadling;
  });

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
        const existingDreadlings = (
  JSON.parse(saved) as Partial<Dreadling>[]
).map((item) => ({
  ...item,
  id: item.id || Date.now().toString(),
  name: item.name || "",
  imageUrl: item.imageUrl || "",
  sourceOfTrauma: item.sourceOfTrauma || "",
  appearance: item.appearance || "",
  behavior: item.behavior || "",
  hp: item.hp || "10",
  ac: item.ac || "10",
  abilities: Array.isArray(item.abilities)
    ? item.abilities
    : item.encounterAbility
      ? [{ name: "Encounter Ability", description: item.encounterAbility }]
      : [{ name: "", description: "" }],
  dreadfulAction: item.dreadfulAction || {
    name: "",
    description: "",
  },
  mindDie: item.mindDie || "1d4",
  bodyDie: item.bodyDie || "1d4",
  heartDie: item.heartDie || "1d4",
  egoDie: item.egoDie || "1d4",
})) as Dreadling[];
        
          if (existingDreadlings.length > 0) {
            setDreadlings(existingDreadlings);

            localStorage.setItem(
            "paradiseHotelDreadlings",
            JSON.stringify(existingDreadlings)
          );

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

  const [gmViewingId, setGmViewingId] = useState("");
  const [gmRoomOpen, setGmRoomOpen] = useState(false);

  const [guests, setGuests] = useState<Guest[]>([]);
  
  
  

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

  const currentGuest = useMemo(() => normalizeGuest(guest), [guest]);

const guestRef = useRef<Guest>(guest);
const guestsRef = useRef<Guest[]>(guests);
const dirtyRef = useRef(false);
guestRef.current = guest;
guestsRef.current = guests;

const guestSig = guestSignature(guest);
const [autoStatus, setAutoStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
const [retryTick, setRetryTick] = useState(0);

// The sheet that is open in a room (player's own, or the one the GM is viewing)
const liveId = gmViewingId || (page === "room" ? guest.id : "");
const roomIsOpen = page === "room" || gmRoomOpen;

// Autosave: edits to the open room persist shortly after the last change
useEffect(() => {
  if (!liveId || guest.id !== liveId) return;

  const row = guestsRef.current.find((g) => g.id === liveId);
  if (!row) return;

  if (guestSignature(row) === guestSig) {
    dirtyRef.current = false;
    setAutoStatus((s) => (s === "error" ? s : "saved"));
    return;
  }

  dirtyRef.current = true;
  setAutoStatus("pending");
  const timer = window.setTimeout(async () => {
    setAutoStatus("saving");
    const ok = await saveGuest(guest, true);
    if (guestSignature(guestRef.current) === guestSig) {
      if (ok) dirtyRef.current = false;
      setAutoStatus(ok ? "saved" : "error");
      if (!ok) window.setTimeout(() => setRetryTick((t) => t + 1), 5000);
    }
  }, 700);

  return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [guestSig, liveId, retryTick]);

// Live sync: pull changes made elsewhere (GM recovery, the other side's edits)
useEffect(() => {
  if (!liveId || !roomIsOpen || dirtyRef.current) return;

  const row = guests.find((g) => g.id === liveId);
  if (!row) return;

  if (guestSignature(row) !== guestSignature(guestRef.current)) {
    setGuest(normalizeGuest(row));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [guests, liveId, roomIsOpen]);

// Keep the open room fresh even if realtime is not enabled on the table
useEffect(() => {
  if (!liveId || !roomIsOpen) return;

  const refresh = () => {
    if (!document.hidden) void loadGuests();
  };

  const timer = window.setInterval(refresh, 4000);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("online", refresh);
  window.addEventListener("focus", refresh);

  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", refresh);
    window.removeEventListener("online", refresh);
    window.removeEventListener("focus", refresh);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [liveId, roomIsOpen]);

// One dice-feed connection for the whole visit: rolls from the room and the
// Battle tab share it, and it resumes by itself after a disconnect.
const feedName = gmUnlocked ? "Game Master" : guest.name || "Unnamed Guest";
const battleLink = useBattleChannel(
  { name: feedName, isDM: gmUnlocked },
  gmUnlocked || !!guest.id
);
const rollFeed = useRollFeed({
  send: battleLink.send,
  on: battleLink.on,
  connected: battleLink.connected,
  dmOnline: battleLink.dmOnline,
  isDM: gmUnlocked,
  clientId: battleLink.clientId,
  name: feedName,
});

// Write any pending edits before leaving the room
async function flushGuest() {
  if (dirtyRef.current && guestRef.current.id) {
    await saveGuest(guestRef.current, true);
  }
  dirtyRef.current = false;
}

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
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("room", { ascending: true });

  if (error) {
    console.warn("Supabase character load:", error);
    return;
  }

  if (Array.isArray(data)) {
    setGuests(data.map(rowToGuest));
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


function commitGuest(updated: Guest) {
  // The autosave effect persists it.
  setGuest(updated);
}

/* Spend / restore Uses on a Gift or Totem from the Battle Grounds. */
function changeItemUses(
  kind: "gifts" | "totems",
  id: string,
  uses: number
) {
  const base = guestRef.current;
  if (!base.id) return;

  const nextUses = Math.max(0, Math.floor(Number(uses) || 0));

  const updated = normalizeGuest({
    ...base,
    [kind]: (base[kind] as { id: string; uses: number }[]).map((item) =>
      item.id === id ? { ...item, uses: nextUses } : item
    ),
  });

  // Show it right away, then save (the Room autosave isn't running here).
  setGuest(updated);
  setGuests((previous) =>
    previous.map((g) => (g.id === updated.id ? updated : g))
  );
  void saveGuest(updated, true);
}

function cycleRecovery() {
  const maxMemory = Math.max(0, Number(guest.maxMemoryPool) || 0);
  const current = Math.max(0, Number(guest.memoryPool) || 0);
  const amount = Math.ceil(maxMemory / 2);

  commitGuest(
    normalizeGuest({
      ...guest,
      memoryPool: Math.min(maxMemory, current + amount),
    })
  );
}

function recovery() {
  const current = Math.max(0, Number(guest.memoryPool) || 0);
  const dread = Math.max(0, Number(guest.dread) || 0);
  const amount = Math.min(current, dread);

  if (amount <= 0) return;

  commitGuest(
    normalizeGuest({
      ...guest,
      memoryPool: current - amount,
      dread: dread - amount,
    })
  );
}

function forceRecovery() {
  const current = Math.max(0, Number(guest.memoryPool) || 0);
  const maxMemory = Math.max(0, Number(guest.maxMemoryPool) || 0);
  const dread = Math.max(0, Number(guest.dread) || 0);
  const amount = Math.min(maxMemory, dread);

  if (amount <= 0) return;

  const newMax = maxMemory - amount;

  commitGuest(
    normalizeGuest({
      ...guest,
      maxMemoryPool: newMax,
      memoryPool: Math.min(current, newMax),
      dread: dread - amount,
    })
  );
}

 async function recoverMaxMemory(
  guestId: string
) {
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

  // If that room is open right now, refresh it immediately
  if (guestRef.current.id === guestId) {
    dirtyRef.current = false;
    setGuest(normalizeGuest(updatedGuest));
  }

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

  return anomaly.id;
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



  /* -------------------------------------------------------
     CHECK-IN
     ------------------------------------------------------- */

  function beginCheckIn() {
    setGuest(blankGuest());
    setMessage("");
    setPage("checkin");
  }

async function saveGuest(guestToSave?: Guest, quiet = false): Promise<boolean> {
  const prepared = normalizeGuest(guestToSave ?? guest);

  try {
    if (!quiet) {
      setLoading(true);
      setMessage("");
    }

    if (!prepared.name.trim()) {
      if (!quiet) setMessage("The Hotel requires a name.");
      return false;
    }
    if (!String(prepared.room).trim()) {
      if (!quiet) setMessage("A room number is required.");
      return false;
    }
    if (!prepared.password.trim()) {
      if (!quiet) setMessage("A room password is required.");
      return false;
    }

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

    const result = prepared.id
      ? await supabase.from("characters").update(payload).eq("id", prepared.id).select().single()
      : await supabase.from("characters").insert(payload).select().single();

    if (result.error) {
      console.error("Supabase save error:", result.error);
      if (!quiet) {
        setMessage(`The Hotel could not save the guest: ${result.error.message}`);
      }
      return false;
    }

    const saved = rowToGuest(result.data);

    // Only replace the open sheet if we saved *that* guest
    // (GM room edits / max-memory recovery save other guests).
    // A quiet autosave never overwrites edits made while it was in flight.
    const stillSame =
      guestSignature(guestRef.current) === guestSignature(prepared);
    if (
      quiet
        ? saved.id === guestRef.current.id && stillSame
        : !guestRef.current.id || saved.id === guestRef.current.id
    ) {
      setGuest(saved);
    }

    await loadGuests();

    if (!quiet) {
      setMessage(`Changes saved. Paradise Hotel remembers, ${saved.name}.`);
    }
    return true;
  } catch (error) {
    console.error("Unexpected save error:", error);
    if (!quiet) {
      setMessage("The Hotel encountered an unexpected error while saving.");
    }
    return false;
  } finally {
    if (!quiet) setLoading(false);
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

const loggedIn = rowToGuest(data);

setGuest(loggedIn);
setGmViewingId("");
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
     BASEMENT: REMOVE GUEST
     ------------------------------------------------------- */

  async function deleteGuestFromBasement(): Promise<boolean> {
    const id = guestRef.current.id;

    // Never delete from a GM view, and require the Dread 20 gate
    if (!id || gmViewingId) return false;
    if (Number(guestRef.current.dread) < 20) return false;

    dirtyRef.current = false; // stop any pending autosave from re-saving

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Basement deletion failed:", error);
      return false;
    }

    setGuests((prev) => prev.filter((g) => g.id !== id));
    setGuest(blankGuest());
    setLoginRoom("");
    setLoginPassword("");
    return true;
  }

  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

    function logout() {
      if (dirtyRef.current && guestRef.current.id) {
        void saveGuest(guestRef.current, true);
      }
      dirtyRef.current = false;
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
                style={S_03}
              >
                YOUR ROOM
              </div>

              <h2
                style={S_04}
              >
                My Room
              </h2>

              <p
                style={S_05}
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
                style={S_03}
              >
                KNOW THE HOTEL
              </div>

              <h2
                style={S_04}
              >
                Player Guide
              </h2>

              <p
                style={S_05}
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
                style={S_03}
              >
                HOTEL SERVICES
              </div>

              <h2
                style={S_04}
              >
                Hotel Services
              </h2>

              <p
                style={S_05}
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
                style={S_03}
              >
                HOTEL RECORDS
              </div>

              <h2
                style={S_04}
              >
                Anomaly Records
              </h2>

              <p
                style={S_05}
              >
                Examine strange phenomena, discoveries,
                and anomalies recorded within Paradise Hotel.
              </p>
            </button>

            <button
  type="button"
  onClick={() => setPage("combat")}
  style={{
    ...panelStyle,
    textAlign: "left",
    cursor: "pointer",
    minHeight: 190,
  }}
>
  <div
    style={S_03}
  >
    THE ENCOUNTER
  </div>

  <h2
    style={S_04}
  >
    Battle Grounds
  </h2>

  <p style={{ color: colors.muted, margin: 0 }}>
    Join the encounter, roll initiative, and share your dice
    with the table.
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
    style={S_03}
  >
    HOTEL MANAGEMENT
  </div>

  <h2
    style={S_04}
  >
    GM Control
  </h2>

  <p
    style={S_05}
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
    const handleBasementPassword = async () => {
  if (basementPassword !== "idliketoendmyself") {
    setBasementError("The door remains closed.");
    return;
  }

  const ok = await deleteGuestFromBasement();

  if (!ok) {
    setBasementError("The door will not open.");
    return;
  }

  setBasementError("");
  setBasementAccepted(true);
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
          <Button secondary onClick={() => setPage("home")}>
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
                onChange={(v) => updateGuest("name", v)}
              />

              <Field
                label="Room Password"
                value={guest.password}
                onChange={(v) => updateGuest("password", v)}
                type="password"
              />

              <Field
                label="Days of Stay"
                value={guest.stay}
                onChange={(v) => updateGuest("stay", v)}
                placeholder="e.g. 31, indefinitely, until recovered..."
              />

              <label style={S_01}>
                <span style={S_02}>Guest Level</span>

                <select
                  value={guest.level}
                  onChange={(e) => {
                    const newLevel = e.target.value as GuestLevel;
                    const newBudget = GUEST_LEVEL_LIMITS[newLevel];

                    setGuest((previous) => {
                      let remaining = newBudget;

                      const newSkills = {
                        ...previous.skills,
                      };

                      for (const skill of ALL_SKILLS) {
                        const current = Number(newSkills[skill] || 0);
                        const allowed = Math.min(current, 5, remaining);

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
                  <option value="VIP">VIP — 45 Points</option>
                  <option value="VVIP">VVIP — 60 Points</option>
                </select>
              </label>
            </div>

            <TextArea
              label="What is your calling?"
              value={guest.purpose}
              onChange={(v) => updateGuest("purpose", v)}
            />

            <TextArea
              label="What event shaped this character?"
              value={guest.important}
              onChange={(v) => updateGuest("important", v)}
            />

            <TextArea
              label="Fears"
              value={guest.fears}
              onChange={(v) => updateGuest("fears", v)}
            />

            <TextArea
              label="Traumatic Experience"
              value={guest.trauma}
              onChange={(v) => updateGuest("trauma", v)}
            />

            <TextArea
              label="Last Memory"
              value={guest.lastMemory}
              onChange={(v) => updateGuest("lastMemory", v)}
            />

            <TextArea
              label="Luggage Contents"
              value={guest.luggage}
              onChange={(v) => updateGuest("luggage", v)}
            />

            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Button secondary onClick={() => setPage("home")}>
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
            onClick={() => setCheckInStep("registration")}
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
                margin: "0 auto 30px",
                lineHeight: 1.7,
              }}
            >
              The Hotel will determine your room. New rooms are
              assigned by a roll of 1d99. If you already have a
              room, you may enter it instead.
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
                  <div style={{ fontSize: 32, marginBottom: 12 }}>
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
                  <div style={{ fontSize: 32, marginBottom: 12 }}>
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
                    border: `1px solid ${colors.border}`,
                    background: "rgba(255,255,255,.025)",
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
                        padding: "24px 16px",
                        borderTop: `1px solid ${colors.border}`,
                      }}
                    >
                      <div
                        style={{
                          color: colors.muted,
                          fontSize: 11,
                          letterSpacing: ".18em",
                        }}
                      >
                        YOUR ROOM
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          color: colors.goldBright,
                          fontSize: 42,
                          letterSpacing: ".08em",
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
                        This room was assigned by the Hotel.
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
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

                  {/* Appears only once the Hotel has assigned a room */}
                  {guest.room && (
                    <Button
                      onClick={() => saveGuest()}
                      disabled={loading}
                    >
                      {loading
                        ? "CHECKING IN..."
                        : "COMPLETE CHECK-IN — ENTER ROOM"}
                    </Button>
                  )}
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
                    border: `1px solid ${colors.border}`,
                    background: "rgba(255,255,255,.025)",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      color: colors.gold,
                      fontSize: 11,
                      letterSpacing: ".16em",
                      marginBottom: 14,
                    }}
                  >
                    EXISTING ROOM
                  </div>

                  <Field
                    label="Room Number"
                    value={guest.room}
                    onChange={(value) => {
                      const cleaned = value.replace(/\D/g, "");

                      if (cleaned === "") {
                        updateGuest("room", "");
                        setRoomMessage("");
                        return;
                      }

                      const room = Number(cleaned);

                      if (room > 100) {
                        setRoomMessage(
                          "Room numbers cannot be higher than 100."
                        );
                        return;
                      }

                      updateGuest("room", cleaned);
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
                    Enter the room already assigned to you.
                    <br />
                    Room 0 and Room 100 are valid special rooms.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
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
                      : "COMPLETE CHECK-IN — ENTER ROOM"}
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

            <DiceRoller
              guest={g}
              onRoll={(report) =>
                rollFeed.publish({ ...report, name: g.name })
              }
            />

            {gmViewingId && (
  <div
    style={{
      ...panelStyle,
      marginBottom: 12,
      padding: "10px 16px",
      textAlign: "center",
      color: colors.goldBright,
      fontSize: 13,
      letterSpacing: ".08em",
    }}
  >
    GM VIEW · Room {g.room} · live — edits autosave
  </div>
)}

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
              onClick={async () => {
                await flushGuest();
                setPage("hub");
              }}
            >
              HOME
            </Button>

            <div
              role="status"
              aria-live="polite"
              style={{
                textAlign: "center",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.75,
                color: autoStatus === "error" ? "#e07a7a" : undefined,
              }}
            >
              {autoStatus === "saved" && "All changes saved"}
              {autoStatus === "pending" && "Unsaved…"}
              {autoStatus === "saving" && "Saving…"}
              {autoStatus === "error" && "Not saved yet"}
            </div>

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
  <section style={{ ...panelStyle, marginTop: 10, textAlign: "center" }}>
  <Button onClick={() => setPage("combat")}>
    ENTER BATTLE GROUNDS
  </Button>
</section>

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
        style={S_07}
      >
        Title
      </div>

      <input
        type="text"
        value={g.title}
        placeholder="Enter Title"
onChange={(event) => {
  const value = event.target.value;
  setGuest((previous) => normalizeGuest({ ...previous, title: value }));
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
        style={S_07}
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

<option style={{ background: "#111", color: colors.text }} value="Timekeeper">
  Timekeeper
</option>

<option style={{ background: "#111", color: colors.text }} value="Doorman">
  Doorman
</option>

<option style={{ background: "#111", color: colors.text }} value="Overseer">
  Overseer
</option>

<option style={{ background: "#111", color: colors.text }} value="Mnēmosynē">
  Mnēmosynē
</option>

<option style={{ background: "#111", color: colors.text }} value="Maintenance">
  Maintenance
</option>

</select>

    </div>

    {/* SECONDARY ROLE*/}
    <div>
      <div
        style={S_07}
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

  <option style={{ background: "#111", color: colors.text }} value="Timekeeper">
    Timekeeper
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Doorman">
    Doorman
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Overseer">
    Overseer
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Mnēmosynē">
    Mnēmosynē
  </option>

  <option style={{ background: "#111", color: colors.text }} value="Maintenance">
    Maintenance
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
                style={S_08}
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
                        style={S_08}
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
  style={S_09}
>
  <div
    style={S_10}
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
      style={S_11}
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
    style={S_12}
  >
    Cycle Recovery
  </button>

  <button
    type="button"
    onClick={recovery}
    style={S_12}
  >
    Recovery
  </button>

  <button
  type="button"
  onClick={() => {
    console.log("Force Recovery clicked");
    forceRecovery();
  }}
  style={S_12}
>
  Force Recovery
</button>
</div>

{/* =====================================================
    ABILITIES
===================================================== */}

<section
  style={S_09}
>
  <div style={{ marginBottom: 18 }}>
    <div
      style={S_13}
    >
      Core Abilities
    </div>

    <h2
      style={S_11}
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
      style={S_14}
    >
      <div
        style={S_15}
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
        style={S_16}
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
        style={S_17}
      />
    </div>

    {/* BODY */}
    <div
      style={S_14}
    >
      <div
        style={S_15}
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
        style={S_16}
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
        style={S_17}
      />
    </div>

    {/* HEART */}
    <div
      style={S_14}
    >
      <div
        style={S_15}
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
        style={S_16}
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
        style={S_17}
      />
    </div>

    {/* EGO */}
    <div
      style={S_14}
    >
      <div
        style={S_15}
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
        style={S_16}
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
        style={S_17}
      />
    </div>
  </div>
</section>

{/* ROLES */}
<section
  style={S_09}
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
          style={S_14}
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

{ROLE_GUIDE_DETAILS[role]?.description && (
  <p
    style={{
      margin: "-8px 0 16px",
      color: colors.muted,
      fontSize: 13,
      lineHeight: 1.55,
    }}
  >
    {ROLE_GUIDE_DETAILS[role].description}
  </p>
)}

<div
  style={{
    marginBottom: 16,
  }}
>
  <div
    style={S_18}
  >
    Proficiencies
  </div>

  <ProficiencyTags
    skills={g.skills}
    role={role}
    otherRole={index === 0 ? g.role2 : g.role}
  />
</div>

          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={S_18}
            >
              Role Action
            </div>

            <div style={{ color: colors.text, fontSize: 18 }}>
  <RoleHover
    label={details?.action || "—"}
    description={ROLE_GUIDE_DETAILS[role]?.actionDescription}
  />
</div>
{ROLE_GUIDE_DETAILS[role]?.actionDescription && (
  <p style={{ margin: "8px 0 0", color: colors.muted, fontSize: 13, lineHeight: 1.55 }}>
    {ROLE_GUIDE_DETAILS[role].actionDescription}
  </p>
)}
          </div>

          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 12,
            }}
          >
            <div
              style={S_18}
            >
              Passive
            </div>

            <div style={{ color: colors.text, fontSize: 18 }}>
  <RoleHover
    label={details?.passive || "—"}
    description={ROLE_GUIDE_DETAILS[role]?.passiveDescription}
  />
</div>
{ROLE_GUIDE_DETAILS[role]?.passiveDescription && (
  <p style={{ margin: "8px 0 0", color: colors.muted, fontSize: 13, lineHeight: 1.55 }}>
    {ROLE_GUIDE_DETAILS[role].passiveDescription}
  </p>
)}
          </div>
        </div>
      );
    })}
  </div>

<p
  style={{
    width: "100%",
    maxWidth: "none",
    boxSizing: "border-box",
    margin: "14px 0 0",
    paddingTop: 12,
    borderTop: `1px solid ${colors.border}`,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 1.6,
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
  a skill tied to your role, you may use half your skill modifier, rounded
  up. Note: A proficient skill with 0 points still gives +1.
</p>
</section>

{/* =====================================================
    TOTEMS
===================================================== */}

<section
  style={S_09}
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
        style={S_13}
      >
        Personal Objects
      </div>

      <h2
        style={S_11}
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
          style={S_14}
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
            style={S_16}
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
              style={S_19}
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
    style={S_10}
  >
    <div
      style={S_13}
    >
      Personal Effects
    </div>

    <h2
      style={S_11}
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
      style={S_14}
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
        style={S_16}
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
          style={S_19}
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
            style={S_08}
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
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16
            }}
          >
            <div>
              <label
                style={S_20}
              >
                What is your calling?
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
                style={S_20}
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
                style={S_20}
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
                style={S_20}
              >
                Last Memory
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
            style={S_08}
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
  style={S_09}
>
  <div
    style={S_10}
  >
    <div
      style={S_13}
    >
      Personal Effects
    </div>

    <h2
      style={S_11}
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
    style={S_17}
  />
</section>

{/* =====================================================
    MIND MAP
===================================================== */}

<section
  style={S_09}
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
        style={S_13}
      >
        Thoughts & Fragments
      </div>

      <h2
        style={S_11}
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
            style={S_08}
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
      style={S_21}
    >
      <div
        style={S_22}
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
      style={S_21}
    >
      <div
        style={S_22}
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
        style={S_19}
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
      style={S_21}
    >
      <div
        style={S_22}
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
style={S_21}
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
    current === 0 ? 11 : current - 1
  );
};

const nextGuideRole = () => {
  setGuideRoleIndex((current) =>
    current === 11 ? 0 : current + 1
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
style={S_21}
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
                style={S_23}
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
                style={S_23}
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
                style={S_23}
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
                style={S_23}
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Caretaker</h3>

      <p style={skillStyle}>
        You look after the people around you. You keep others calm, help them
        recover, and make sure nobody is left behind.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Gentle Hands</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are able to provide care for those in need. Healing and comfort
          are your specialty. Any items that can give either two, food or a
          simple bandage will inherit your healing or comforting effect.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Care Bear</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You know how someone feels using your perception. You know their pain
          and worries as if it is yours, cause the moment you touch them, you
          own it too.
        </p>

        <p style={S_28}>
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Dreamer</h3>

      <p style={skillStyle}>
        You see things in a different light than the others. You are either
        optimistic or pessimistic. You either ignore the darkness that lurks
        or embrace it.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

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

        <p style={S_29}>Note: Your forms move with your Dread count.</p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Dreamwalk</strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are always in a state of dream. Everything is hazy and you don't
          recall information as much as other people.
        </p>

        <p style={S_30}>
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Guardian</h3>

      <p style={skillStyle}>
        You are the one who stands between everyone else and danger. You don't
        have time to be afraid. You don't have time to wonder why the monsters
        are here.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Come At Me</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are able to force a monster to focus on you. Choose a monster
          within 30 ft that can see or hear you. You force its attention onto
          you.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Iron Clad</strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are the least affected by Dread. You are too busy protecting
          everyone else, you simply forgot to check on yourself.
        </p>

        <p style={S_30}>
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Adversary</h3>

      <p style={skillStyle}>
        You face problems head-on. When something stands in your way, you don't
        hesitate to confront it, break it, or make it regret ever getting in
        your way.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Weaponized</strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          Any object you touch inherits your will to harm. It changes form into
          any weapon you wish to wield, except for projectile weapons. The
          object can become the weapon itself, but it cannot create or
          transform the bullets, arrows, or other projectiles needed to use it.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Berserk Blood</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are prone to losing control, especially when affected by Dread.
          Each successful attack feeds your Berserk. The more you attack, the
          deeper you lose yourself to it.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          While in Berserk, you gain Dread. You attack without discrimination,
          and anything you hate becomes the focus of your wrath.
        </p>

        <strong
          style={{
            display: "block",
            color: colors.text,
            marginTop: 12,
          }}
        >
          Berserk
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          Successful attacks build Berserk. The deeper you enter Berserk, the
          harder it becomes to control who or what you attack.
        </p>

        <p style={S_30}>
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Archivist</h3>

      <p style={skillStyle}>
        You remember what others forget. You collect information, recognize
        patterns, and hold onto details that might otherwise disappear.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Paper Trail</strong>

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

        <p style={S_29}>
          Be careful, though. You might discover something more than you can
          chew.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>True Record</strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You never forget a detail. Once seen, once read, once heard, it stays
          with you.
        </p>

        <p style={S_30}>
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Diplomat</h3>

      <p style={skillStyle}>
        You understand people. You know when to speak, when to listen, when to
        persuade, and when a small lie might make things easier.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Social Butterfly</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You can talk your way through almost anything, even with Dreadlings
          hungry for your memories.
        </p>

        <p style={{ ...skillStyle, marginBottom: 0 }}>
          You roll with <strong style={{ color: colors.text }}>Advantage</strong>{" "}
          when initiating conversations. When two parties come into conflict,
          you can intervene and put the fight on hold, giving everyone a chance
          to settle things civilly.
        </p>

        <p style={S_29}>If you fail to resolve the conflict, you gain Dread.</p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Charming</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are naturally likeable. You radiate a soothing aura that helps
          calm anger and ease emotions that cloud the mind and heart.
        </p>

        <strong
          style={{
            display: "block",
            color: colors.text,
            marginTop: 12,
          }}
        >
          Rapport
        </strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You can build Rapport with people and Dreadlings/Dreadful through
          successful interactions. The stronger the Rapport, the easier it
          becomes to negotiate, persuade, or calm them.
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Watcher</h3>

      <p style={skillStyle}>
        You watch and observe from the outside. You can remain a spectator to
        what unfolds around you, untouched by the encounters happening before
        your eyes.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Passive Stance</strong>

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

        <p style={S_29}>
          You cannot enter Passive Stance if attention is already on you.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Camera View</strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You can view the world through the lenses of the Hotel's cameras;
          seeing the past, present, or future.
        </p>

        <p style={S_30}>
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
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Vessel</h3>

      <p style={skillStyle}>
        You are everyone and no one. Their memories, their feelings, their
        dreams, their fears—all of it lives within you, even if you don't know
        why.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>One Body</strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are able to draw upon the strengths of those around you. For a
          brief moment, you become more than yourself, taking on an ability or
          trait belonging to another Guest.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Bridge</strong>

        <p style={{ ...skillStyle, marginTop: 8, marginBottom: 0 }}>
          You are able to form a bridge between you and a chosen target. There
          is no limit to how many bridges, it's just that it must be with
          consent. The deeper the connection, the sturdier the bridge, the
          easier it is to draw powers from others.
        </p>

        <p style={S_30}>
          You don't know why but everyone seems to be connected in some way or
          another.
        </p>
      </div>
    </div>

    {/* MAINTENANCE */}
    <div
      style={{
        ...coreCardStyle,
        display: guideRoleIndex === 8 ? "block" : "none",
      }}
    >
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Special Role: Maintenance</h3>

      <p style={skillStyle}>
        You maintain the Hotel and its systems. You understand how things work,
        how they are connected, and how to keep them running smoothly. You can
        repair, restore, and optimize the environment around you.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Fix It</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You can repair or restore a broken or malfunctioning object, device,
          or system. You may also optimize an area to improve its
          functionality, efficiency, or safety. Your expertise allows you to
          identify issues and implement solutions that others might overlook.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Omnisense</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You have an intuitive understanding of the Hotel's inner workings.
          You can identify problems, failures, and how to fix them. Your
          presence ensures that the system is healthy and functioning properly.
        </p>

        <p style={S_28}>
          Everything breaks eventually. You are the one who knows when, and the
          one who comes to take what can't be fixed.
        </p>
      </div>
    </div>

    {/* TIMEKEEPER */}
    <div
      style={{
        ...coreCardStyle,
        display: guideRoleIndex === 9 ? "block" : "none",
      }}
    >
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Special Role: Timekeeper</h3>

      <p style={skillStyle}>
        You track the inconsistent flow of time. You recognize what has
        happened, what is happening, and what has yet to happen. In a place
        where time is measured by memory, the past is never truly past,
        and the future is never certain.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Time Out</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You can briefly interrupt the flow of time within your immediate
          surroundings. For a moment, events come to a standstill, allowing
          you to act, reposition yourself, or interfere with an unfolding
          situation. The moment cannot last forever, and time will always
          demand to move forward again.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>All-Time</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You possess an unusual awareness of time's inconsistencies.
          You recognize repeated moments, notice when events occur out
          of order, and sense when something has been altered, skipped,
          or caught in a loop. You may not know why time has changed,
          but you know that it has.
        </p>

        <p style={S_28}>
          Time moves forward. Time moves backward. You remember
          the moments that never happened.
        </p>
      </div>
    </div>

    {/* DOORMAN */}
    <div
      style={{
        ...coreCardStyle,
        display: guideRoleIndex === 10 ? "block" : "none",
      }}
    >
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Special Role: Doorman</h3>

      <p style={skillStyle}>
        You control and record who goes where, when they enter, and why
        they are permitted to pass. Every threshold has meaning, and
        every arrival carries a purpose. You stand between what is
        allowed inside and what must remain outside.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Open-Door</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You can open a passage where one should not exist or force
          open a way that has been sealed, blocked, or forbidden.
          For a brief moment, you can establish a connection between
          two known thresholds, allowing yourself and others to pass
          through. Even the hotel's impossible architecture must
          answer when you invite someone inside.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Unmovable</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You are exceptionally difficult to displace, restrain, or
          force beyond a threshold you have chosen to guard. You can
          also sense when a boundary has been crossed without
          permission, whether the trespasser is a guest, an anomaly,
          or something the hotel refuses to acknowledge.
        </p>

        <p style={S_28}>
          Every door has a lock. Every passage leaves a record.
          You decide who gets to cross.
        </p>
      </div>
    </div>

    {/* OVERSEER */}
    <div
      style={{
        ...coreCardStyle,
        display: guideRoleIndex === 11 ? "block" : "none",
      }}
    >
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Special Role: Overseer</h3>

      <p style={skillStyle}>
        You guide and shape an area according to what is needed.
        You understand the relationship between people, places, and
        the rules that govern them. Through authority, persuasion,
        or quiet understanding, you influence an environment until
        it begins to follow your direction.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Dominance</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You impose your will upon your immediate surroundings,
          briefly shifting an area's conditions to suit your needs.
          You may influence nearby environmental features, change
          the atmosphere, or establish a temporary condition that
          benefits you and your allies. Your influence has limits:
          you can shape what is present, but you cannot create
          something from nothing.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>Gentle Voice</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          Your presence carries an inexplicable authority that
          encourages others to listen. Your voice can soothe
          agitation, steady frightened guests, and make your
          intentions easier to understand. Even those who distrust
          you may find themselves listening before deciding
          whether to obey. Your influence cannot guarantee
          agreement or override another person's will.
        </p>

        <p style={S_28}>
          You do not need to raise your voice. The room already
          knows who is speaking.
        </p>
      </div>
    </div>

    {/* MNĒMOSYNĒ */}
    <div
      style={{
        ...coreCardStyle,
        display: guideRoleIndex === 12 ? "block" : "none",
      }}
    >
      <div style={S_24}>Role Name</div>

      <h3 style={S_25}>Special Role: Mnēmosynē</h3>

      <p style={skillStyle}>
        You are the keeper of all memories. Every experience leaves
        an impression upon you, whether it belongs to you or
        someone else. You preserve what time erases, what the mind
        rejects, and what the hotel would rather remain forgotten.
        Yet to remember everything is not the same as understanding it.
      </p>

      <div style={S_26}>
        <div style={S_24}>Role Action</div>

        <strong style={{ color: colors.text }}>Take Root</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          You anchor a memory, identity, or piece of information
          against forces that would erase, distort, or rewrite it.
          You may preserve a recollection within yourself or help
          another person hold on to something they are about to lose.
          While the effect lasts, the protected memory resists
          alteration, though the truth it contains may still be
          misunderstood.
        </p>
      </div>

      <div style={S_27}>
        <div style={S_24}>Passive</div>

        <strong style={{ color: colors.text }}>I Recall</strong>

        <p style={{ ...skillStyle, marginTop: 8 }}>
          Nothing you have genuinely experienced is ever entirely
          lost to you. You can revisit fragments of your own
          memories with unusual clarity and recognize details
          others have forgotten. When confronted with familiar
          people, places, or events, forgotten recollections may
          resurface unexpectedly. You cannot recall an experience
          you never encountered, nor does remembering guarantee
          that your interpretation was correct.
        </p>

        <p style={S_28}>
          The world may forget you. The hotel may rewrite you.
          But somewhere within you, the truth remains.
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
              style={S_31}
            >
              <strong style={{ color: colors.text }}>
                Your Identity is your anchor, represented by the 1d20.
              </strong>{" "}
              It reminds you of who you are, what you have experienced, and who you have become.
            </p>

            <p
              style={S_31}
            >
              <strong style={{ color: colors.text }}>
                Dread is the Hotel's lingering darkness.
              </strong>{" "}
              The pain, fear, and suffering of those who came before you seep through its halls, waiting for a crack in your resolve through which it can enter.
            </p>

            <p
              style={S_31}
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

const saveGmRoomEdit = (id: string, room: string, password: string): string | null => {
  const target = guests.find((g) => g.id === id);
  if (!target) return "Guest not found.";
  const n = Number(room);
  if (room.trim() === "" || !Number.isInteger(n) || n < 0 || n > 100)
    return "Room must be a whole number from 0 to 100.";
  if (guests.some((g) => g.id !== id && Number(g.room) === n))
    return "That room is already occupied.";
  const updated = { ...target, room: String(n), password };
  setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));
  void saveGuest(updated);
  return null;
};

const closeGmRoom = async () => {
  if (dirtyRef.current) {
    await saveGuest(guestRef.current, true);
    dirtyRef.current = false;
  }
  setGmRoomOpen(false);
  setGmViewingId("");
  await loadGuests();
};

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

              <Button onClick={() => setPage("cycles")}>
                CYCLES
              </Button>

              <Button onClick={() => setPage("forge")}>
              FORGE &amp; ARCHIVES
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

<RoomDirectory
  guests={guests}
  openId={gmRoomOpen ? gmViewingId : ""}
  onSaveRoom={saveGmRoomEdit}
  onEnter={(g) => {
    setGuest(normalizeGuest(g));
    setGmViewingId(g.id);
    setGmRoomOpen(true);
  }}
/>

{gmRoomOpen && (
  <GmRoomOverlay roomLabel={`Room ${guest.room}`} onClose={closeGmRoom}>
    {renderRoomPage()}
  </GmRoomOverlay>
)}

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
            style={S_32}
          >
            Player
          </th>

          <th
            style={S_32}
          >
            Room
          </th>

          <th
            style={S_32}
          >
            Max Memory
          </th>

          <th
            style={S_32}
          >
            Natural Max
          </th>

          <th
            style={S_32}
          >
            Permanent Loss
          </th>

          <th
            style={S_32}
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





async function saveDreadlingRecord(record: any) {
  const exists = dreadlings.some((d) => d.id === record.id);
  const updated = exists
    ? dreadlings.map((d) => (d.id === record.id ? record : d))
    : [...dreadlings, record];
  setDreadlings(updated);
  localStorage.setItem("paradiseHotelDreadlings", JSON.stringify(updated));
  const { error } = await supabase
    .from("dreadlings")
    .upsert({ id: record.id, data: record });
  if (error) {
    console.error("Failed to save Dreadling to Supabase:", error);
    alert("Dreadling saved locally, but failed to save to Supabase.");
  }
}

async function saveDreadfulRecord(record: any) {
  const exists = dreadfuls.some((d) => d.id === record.id);
  const updated = exists
    ? dreadfuls.map((d) => (d.id === record.id ? record : d))
    : [...dreadfuls, record];
  setDreadfuls(updated);
  localStorage.setItem("paradiseHotelDreadfuls", JSON.stringify(updated));
  const { error } = await supabase
    .from("dreadfuls")
    .upsert({ id: record.id, data: record });
  if (error) {
    console.error("Failed to save Dreadful to Supabase:", error);
    alert("Dreadful saved locally, but failed to save to Supabase.");
  }
}

async function deleteForgeRecord(kind: "dreadling" | "dreadful", id: string) {
  const table = kind === "dreadling" ? "dreadlings" : "dreadfuls";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error("Failed to delete record:", error);
    alert("Could not delete the record. Please check the console.");
    return;
  }
  if (kind === "dreadling") {
    const updated = dreadlings.filter((d) => d.id !== id);
    setDreadlings(updated);
    localStorage.setItem("paradiseHotelDreadlings", JSON.stringify(updated));
  } else {
    const updated = dreadfuls.filter((d) => d.id !== id);
    setDreadfuls(updated);
    localStorage.setItem("paradiseHotelDreadfuls", JSON.stringify(updated));
  }
}



const saveCycleFromArchive = async (rec: CycleRecord): Promise<boolean> => {
  const { error } = await supabase.from("cycles").upsert({
    id: rec.id,
    cycle: rec.cycle,
    vinyl_record: rec.vinylRecord,
    what_happened: rec.whatHappened,
    image_url: rec.imageUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) { alert(`Could not save Cycle: ${error.message}`); return false; }
  setCycleRecords((rs) =>
    rs.some((r) => r.id === rec.id) ? rs.map((r) => (r.id === rec.id ? rec : r)) : [...rs, rec]
  );
  return true;
};

const deleteCycleFromArchive = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("cycles").delete().eq("id", id);
  if (error) { alert(`Could not delete Cycle: ${error.message}`); return false; }
  setCycleRecords((rs) => rs.filter((r) => r.id !== id));
  return true;
};

const saveVinylFromArchive = async (rec: VinylRecord): Promise<boolean> => {
  const { error } = await supabase.from("vinyl_records").upsert({
    id: rec.id,
    vinyl: rec.vinyl,
    vinyl_record: rec.vinylRecord,
    image_url: rec.imageUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) { alert(`Could not save Vinyl: ${error.message}`); return false; }
  setVinylRecords((rs) =>
    rs.some((r) => r.id === rec.id) ? rs.map((r) => (r.id === rec.id ? rec : r)) : [...rs, rec]
  );
  return true;
};

const deleteVinylFromArchive = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("vinyl_records").delete().eq("id", id);
  if (error) { alert(`Could not delete Vinyl: ${error.message}`); return false; }
  setVinylRecords((rs) => rs.filter((r) => r.id !== id));
  return true;
};





        const memoryDraft: MemoryDraft = {
  name: memoryName,
  holder: memoryHolder,
  imageUrl: memoryImageUrl,
  details: memoryDetails,
  emotion: memoryEmotion,
};

function changeMemoryDraft(field: keyof MemoryDraft, value: string) {
  if (field === "name") setMemoryName(value);
  else if (field === "holder") setMemoryHolder(value);
  else if (field === "imageUrl") setMemoryImageUrl(value);
  else if (field === "emotion") setMemoryEmotion(value);
  else setMemoryDetails(value);
}

function clearMemoryDraft() {
  setMemoryName("");
  setMemoryHolder("");
  setMemoryImageUrl("");
  setMemoryDetails("");
  setMemoryEmotion("");
}

function openMemoryCreator() {
  clearMemoryDraft();
  setMemoryCreatorOpen(true);
}

function closeMemoryCreator() {
  clearMemoryDraft();
  setMemoryCreatorOpen(false);
}

async function saveNewMemory() {
  if (!memoryName.trim() || !memoryImageUrl.trim()) {
    alert("Memory Name and Image URL are required.");
    return;
  }

  const { data, error } = await supabase
    .from("memories")
    .insert({
      name: memoryName.trim(),
      holder: memoryHolder.trim(),
      image_url: memoryImageUrl.trim(),
      details: packMemoryDetails(memoryEmotion, memoryDetails),
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase memory save:", JSON.stringify(error, null, 2));
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
      ...unpackMemoryDetails(data.details),
    },
  ]);

  closeMemoryCreator();
}

async function saveMemoryEdit() {
  if (!selectedMemory) return;

  const { error } = await supabase
    .from("memories")
    .update({
      name: memoryName.trim(),
      holder: memoryHolder.trim(),
      image_url: memoryImageUrl.trim(),
      details: packMemoryDetails(memoryEmotion, memoryDetails),
    })
    .eq("id", selectedMemory.id);

  if (error) {
    console.error("Failed to update memory:", error);
    alert(`Could not save memory changes: ${error.message}`);
    return;
  }

  const updated: MemoryRecord = {
    id: selectedMemory.id,
    name: memoryName.trim(),
    holder: memoryHolder.trim(),
    imageUrl: memoryImageUrl.trim(),
    details: memoryDetails.trim(),
    emotion: memoryEmotion,
  };

  setMemories((previous) =>
    previous.map((memory) => (memory.id === updated.id ? updated : memory))
  );
  setSelectedMemory(updated);
  setMemoryEditOpen(false);
}

async function deleteMemory(memory: MemoryRecord) {
  if (!window.confirm(`Delete the memory "${memory.name}"?`)) return;

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memory.id);

  if (error) {
    console.error("Supabase memory delete:", JSON.stringify(error, null, 2));
    alert("Failed to delete memory.");
    return;
  }

  setMemories((previous) => previous.filter((item) => item.id !== memory.id));
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
  return (
    <RecordsGallery
      anomalies={anomalies}
      onAdd={addAnomaly}
      onUpdate={updateAnomaly}
      onDelete={deleteAnomaly}
      onAddEncounter={addAnomalyEncounter}
      onUpdateEncounter={updateAnomalyEncounter}
      onRemoveEncounter={removeAnomalyEncounter}
      onBack={() => setPage("hub")}
      onRoom={() => setPage("room")}
    />
  );
}

if (page === "room") {
  return renderRoomPage();
}

if (page === "cycles") {
  return (
    <CyclesArchive
      canEdit={gmUnlocked}
      cycles={cycleRecords}
      vinyls={vinylRecords}
      onSaveCycle={saveCycleFromArchive}
      onDeleteCycle={deleteCycleFromArchive}
      onSaveVinyl={saveVinylFromArchive}
      onDeleteVinyl={deleteVinylFromArchive}
      onBack={() => setPage("gm")}
    />
  );
}

if (page === "forge" || page === "archives") {
  return (
    <ForgeArchives
      isDM={gmUnlocked}
      dreadlings={dreadlings}
      dreadfuls={dreadfuls}
      guests={guests}
      onSaveDreadling={saveDreadlingRecord}
      onSaveDreadful={saveDreadfulRecord}
      onDelete={deleteForgeRecord}
      onBack={() => setPage("gm")}
    />
  );
}

if (page === "memoryDetail" && selectedMemory) {
  return (
    <MemoryDetail
      memory={selectedMemory}
      editing={memoryEditOpen}
      draft={memoryDraft}
      onDraftChange={changeMemoryDraft}
      onStartEdit={() => {
        setMemoryName(selectedMemory.name);
        setMemoryHolder(selectedMemory.holder);
        setMemoryImageUrl(selectedMemory.imageUrl);
        setMemoryDetails(selectedMemory.details);
        setMemoryEmotion(selectedMemory.emotion);
        setMemoryEditOpen(true);
      }}
      onCancelEdit={() => setMemoryEditOpen(false)}
      onSave={saveMemoryEdit}
      onBack={() => {
        setMemoryEditOpen(false);
        setSelectedMemory(null);
        setPage("memory");
      }}
    />
  );
}

if (page === "memory") {
  return (
    <MemoryTree
      memories={memories}
      creatorOpen={memoryCreatorOpen}
      draft={memoryDraft}
      onDraftChange={changeMemoryDraft}
      onOpenCreator={openMemoryCreator}
      onCancelCreator={closeMemoryCreator}
      onSave={saveNewMemory}
      onOpen={(memory) => {
        setSelectedMemory(memory);
        setPage("memoryDetail");
      }}
      onDelete={deleteMemory}
      onLeave={() => setPage("mneme")}
    />
  );
}

if (page === "mneme") {
  return (
    <MnemeEntrance
      onApproach={() => setPage("memory")}
      onLeave={() => setPage("services")}
    />
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
  const myCharacter =
    (guest.id && guests.find((g) => g.id === guest.id)) || currentGuest;

  return (
    <BattleGrounds
      isDM={gmUnlocked}
      guests={guests}
      dreadlings={dreadlings}
      dreadfuls={dreadfuls}
      character={myCharacter}
      onBack={() => setPage("hub")}
      onUsesChange={changeItemUses} 
      link={battleLink}
      feed={rollFeed}
    />
  );
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


/* =========================================================
   NAVIGATION BAR
   Lives outside the page screens so guests can hop between
   Lobby, Room, Guide, Services and Records in one tap.
   ========================================================= */

const NAV_ITEMS: { label: string; page: Page }[] = [
  { label: "Lobby", page: "hub" },
  { label: "Room", page: "room" },
  { label: "Guide", page: "guide" },
  { label: "Services", page: "services" },
  { label: "Records", page: "anomalies" },
  { label: "Battle", page: "combat" },
];

/* Icon + position for the Battle tab (the rest live in index.css). */
const NAV_BATTLE_CSS = `
.ph-nav-item:nth-child(6) {
  --ico: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M4 4 15 15M13 17l4-4M15 15l4 4M20 20l.5.5'/><path d='M20 4 9 15M11 17l-4-4M9 15l-4 4M4 20l-.5.5'/></svg>");
}
`;

function BottomNav({ page }: { page: Page }) {
  const visible = NAV_ITEMS.some((item) => item.page === page);

  useEffect(() => {
    document.body.classList.toggle("has-nav", visible);
    return () => document.body.classList.remove("has-nav");
  }, [visible]);

  if (!visible) return null;

  return (
    <>
    <style>{NAV_BATTLE_CSS}</style>
    <nav className="ph-nav" aria-label="Hotel navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.page}
          type="button"
          className={
            "ph-nav-item" + (page === item.page ? " is-active" : "")
          }
          aria-current={page === item.page ? "page" : undefined}
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent<Page>("ph-nav", { detail: item.page })
            )
          }
        >
          {item.label}
        </button>
      ))}
    </nav>
    </>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  return (
    <>
      <AppScreens onPageChange={setCurrentPage} />
      <BottomNav page={currentPage} />
    </>
  );
}