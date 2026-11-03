import { useEffect, useRef, useState } from "react";
import "./battle.css";
import { useBattleChannel } from "./battleRealtime";
import CharacterPanel from "./Characterpanel";
import type { CharacterLite } from "./Characterpanel";
import { DiceRoller, rollDie } from "./DiceRoller";
import { useRollFeed } from "./rollFeed";
import type { RollInput } from "./rollFeed";
import RollFeedPanel from "./RollFeedPanel";

/* =========================================================
   BATTLE GROUNDS — STEP 2
   Shared encounter state (Preparing / Active / Concluded),
   DM controls, and a read-only table for players.

   The DM's browser is the source of truth. It saves to
   localStorage and broadcasts the encounter over Realtime.
   Players only LISTEN; the DM never listens for encounter
   events, so a player cannot change the DM's encounter.
   Nothing here is stored in a Supabase table.
   ========================================================= */

export type EncounterStatus = "preparing" | "active" | "concluded";
export type CombatantKind = "guest" | "dreadling" | "dreadful";

export type Combatant = {
  id: string;
  kind: CombatantKind;
  refId: string;
  name: string;
  portrait: string;
  ac: number | null;
  hp: number | null;
  maxHp: number | null;
  initiative: number | null;
};

/* A Watcher using Passive Stance: observing, outside the initiative order. */
export type PassiveEntry = {
  refId: string;
  name: string;
  portrait: string;
};

export type Encounter = {
  status: EncounterStatus;
  round: number;
  turnIndex: number;
  combatants: Combatant[];
  passive: PassiveEntry[];
  updatedAt: number;
};

/* Only the fields this page needs, so App.tsx's types fit as they are. */
type GuestLite = {
  id?: string;
  name: string;
  room: string;
  portrait: string;
  ac: number;
  role: string;
  role2: string;
  hp?: number;
  maxHp?: number;
  skills?: Record<string, number>;
};
type DreadlingLite = {
  id: string;
  name: string;
  imageUrl: string;
  hp: string;
  ac: string;
  sourceOfTrauma?: string;
  appearance?: string;
  behavior?: string;
  abilities?: { name: string; description: string }[];
  dreadfulAction?: { name: string; description: string };
  encounterAbility?: string;
  mindDie?: string;
  bodyDie?: string;
  heartDie?: string;
  egoDie?: string;
};
type DreadfulLite = {
  id?: string;
  name: string;
  portrait: string;
  room: string;
  ac: number;
  hp: number;
  maxHp: number;
  title?: string;
  role?: string;
  role2?: string;
  memoryPool?: number;
  maxMemoryPool?: number;
  movement?: number;
  dread?: number;
  skills?: Record<string, number>;
  abilities?: Record<string, { name: string; description: string }>;
  mindDie?: string;
  bodyDie?: string;
  heartDie?: string;
  egoDie?: string;
};

const STORAGE_KEY = "paradiseHotelBattleEncounter";

const EMPTY_ENCOUNTER: Encounter = {
  status: "preparing",
  round: 1,
  turnIndex: 0,
  combatants: [],
  passive: [],
  updatedAt: 0,
};

const STATUS_LABEL: Record<EncounterStatus, string> = {
  preparing: "Preparing",
  active: "Active",
  concluded: "Concluded",
};

function loadEncounter(): Encounter {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ENCOUNTER;
    const parsed = JSON.parse(raw) as Partial<Encounter>;
    return {
      status:
        parsed.status === "active" || parsed.status === "concluded"
          ? parsed.status
          : "preparing",
      round: Number(parsed.round) || 1,
      turnIndex: Number(parsed.turnIndex) || 0,
      combatants: Array.isArray(parsed.combatants) ? parsed.combatants : [],
      passive: Array.isArray(parsed.passive) ? parsed.passive : [],
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch {
    return EMPTY_ENCOUNTER;
  }
}

/* Highest initiative first; combatants with no score go last. */
function sortCombatants(list: Combatant[]): Combatant[] {
  return [...list].sort((a, b) => {
    if (a.initiative === null && b.initiative === null) return 0;
    if (a.initiative === null) return 1;
    if (b.initiative === null) return -1;
    return b.initiative - a.initiative;
  });
}

/* Initiative box: commits on blur or Enter so cards don't jump while typing. */
function InitiativeInput({
  value,
  onCommit,
}: {
  value: number | null;
  onCommit: (value: number | null) => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));

  useEffect(() => {
    setText(value === null ? "" : String(value));
  }, [value]);

  function commit() {
    const trimmed = text.trim();
    if (trimmed === "") {
      onCommit(null);
      return;
    }
    const parsed = Number(trimmed);
    onCommit(Number.isFinite(parsed) ? parsed : null);
  }

  return (
    <input
      className="bg-init-input no-spinner"
      type="number"
      inputMode="numeric"
      value={text}
      placeholder="—"
      aria-label="Initiative"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

export default function BattleGrounds({
  isDM,
  playerName,
  guests,
  dreadlings,
  dreadfuls,
  character,
  onBack,
}: {
  isDM: boolean;
  playerName: string;
  guests: GuestLite[];
  dreadlings: DreadlingLite[];
  dreadfuls: DreadfulLite[];
  character?: CharacterLite | null;
  onBack: () => void;
}) {
  const displayName = isDM ? "Game Master" : playerName || "Unnamed Guest";

  const {
    clientId,
    connected,
    present,
    sessionActive,
    participantCount,
    send,
    on,
  } = useBattleChannel({ name: displayName, isDM });

  /* Shared temporary dice feed (Broadcast only, 60-minute lifetime). */
  const feed = useRollFeed({
    send,
    on,
    connected,
    sessionActive,
    isDM,
    clientId,
    name: displayName,
  });

  /* DM owns the encounter. Players hold a read-only copy. */
  const [encounter, setEncounter] = useState<Encounter>(() =>
    isDM ? loadEncounter() : EMPTY_ENCOUNTER
  );
  const [received, setReceived] = useState<Encounter | null>(null);

  const [pickGuest, setPickGuest] = useState("");
  const [pickDreadling, setPickDreadling] = useState("");
  const [dreadlingCount, setDreadlingCount] = useState(1);
  const [pickDreadful, setPickDreadful] = useState("");

  /* ---- DM: save + broadcast on every change ---- */
  useEffect(() => {
    if (!isDM) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encounter));
    } catch {
      /* storage full or blocked: the live broadcast still works */
    }
    send("encounter:state", encounter);
  }, [encounter, isDM, send]);

  /* ---- DM: re-send when someone joins, so late arrivals get state ---- */
  const encounterRef = useRef(encounter);
  encounterRef.current = encounter;

  useEffect(() => {
    if (!isDM || !connected) return;
    send("encounter:state", encounterRef.current);
  }, [present.length, connected, isDM, send]);

  /* ---- Players: listen only ---- */
  useEffect(() => {
    if (isDM) return;
    return on("encounter:state", (payload: Encounter) => {
      if (payload && Array.isArray(payload.combatants)) {
        setReceived({
          ...payload,
          passive: Array.isArray(payload.passive) ? payload.passive : [],
        });
      }
    });
  }, [isDM, on]);

  /* Guests added earlier without HP get it filled in from their record. */
  useEffect(() => {
    if (!isDM) return;
    setEncounter((previous) => {
      let changed = false;
      const combatants = previous.combatants.map((c) => {
        if (c.kind !== "guest" || (c.hp !== null && c.maxHp !== null)) return c;
        const g = guests.find((x) => (x.id || x.room || x.name) === c.refId);
        if (!g || g.hp == null || g.maxHp == null) return c;
        const hp = Number(g.hp);
        const maxHp = Number(g.maxHp);
        if (!Number.isFinite(hp) || !Number.isFinite(maxHp)) return c;
        changed = true;
        return { ...c, hp, maxHp };
      });
      return changed
        ? { ...previous, combatants, updatedAt: Date.now() }
        : previous;
    });
  }, [isDM, guests]);

  const view: Encounter | null = isDM ? encounter : received;

  /* ---- DM actions ---- */
  function update(change: (previous: Encounter) => Encounter) {
    setEncounter((previous) => ({
      ...change(previous),
      updatedAt: Date.now(),
    }));
  }

  function addCombatants(items: Combatant[]) {
    update((previous) => {
      const currentId = previous.combatants[previous.turnIndex]?.id;
      const known = new Set(previous.combatants.map((c) => c.id));
      const fresh = items.filter((c) => !known.has(c.id));
      if (fresh.length === 0) return previous;

      const combatants = sortCombatants([...previous.combatants, ...fresh]);
      const index = currentId
        ? combatants.findIndex((c) => c.id === currentId)
        : 0;

      return { ...previous, combatants, turnIndex: Math.max(0, index) };
    });
  }

  function addGuest() {
    const guest = guests.find((g) => (g.id || g.room || g.name) === pickGuest);
    if (!guest) return;
    const key = guest.id || guest.room || guest.name;

    addCombatants([
      {
        id: `guest:${key}`,
        kind: "guest",
        refId: key,
        name: guest.name,
        portrait: guest.portrait || "",
        ac: Number(guest.ac) || null,
        hp: Number.isFinite(Number(guest.hp)) && guest.hp !== undefined
          ? Number(guest.hp)
          : null,
        maxHp: Number.isFinite(Number(guest.maxHp)) && guest.maxHp !== undefined
          ? Number(guest.maxHp)
          : null,
        initiative: null,
      },
    ]);
    // The DM adding a guest by hand overrides their Passive Stance.
    update((previous) => ({
      ...previous,
      passive: previous.passive.filter((p) => p.refId !== key),
    }));
    setPickGuest("");
  }

  function addDreadlings() {
    const source = dreadlings.find((d) => d.id === pickDreadling);
    if (!source) return;

    const count = Math.max(1, Math.min(20, Math.floor(dreadlingCount) || 1));
    const hp = Number(source.hp) || 0;
    const stamp = Date.now();

    addCombatants(
      Array.from({ length: count }, (_, i) => ({
        id: `dreadling:${source.id}:${stamp}:${i}`,
        kind: "dreadling" as const,
        refId: source.id,
        name: count > 1 ? `${source.name} ${i + 1}` : source.name,
        portrait: source.imageUrl || "",
        ac: Number(source.ac) || null,
        hp,
        maxHp: hp,
        initiative: null,
      }))
    );
    setPickDreadling("");
    setDreadlingCount(1);
  }

  function addDreadful() {
    const source = dreadfuls.find(
      (d) => (d.id || d.name) === pickDreadful
    );
    if (!source) return;
    const key = source.id || source.name;

    addCombatants([
      {
        id: `dreadful:${key}`,
        kind: "dreadful",
        refId: key,
        name: source.name,
        portrait: source.portrait || "",
        ac: Number(source.ac) || null,
        hp: Number(source.hp) || 0,
        maxHp: Number(source.maxHp) || Number(source.hp) || 0,
        initiative: null,
      },
    ]);
    setPickDreadful("");
  }

  function removeCombatant(id: string) {
    update((previous) => {
      const currentId = previous.combatants[previous.turnIndex]?.id;
      const combatants = previous.combatants.filter((c) => c.id !== id);
      let index = currentId
        ? combatants.findIndex((c) => c.id === currentId)
        : 0;
      if (index < 0) {
        index = Math.min(previous.turnIndex, Math.max(0, combatants.length - 1));
      }
      return { ...previous, combatants, turnIndex: index };
    });
  }

  function setInitiative(id: string, value: number | null) {
    update((previous) => {
      const currentId = previous.combatants[previous.turnIndex]?.id;
      const combatants = sortCombatants(
        previous.combatants.map((c) =>
          c.id === id ? { ...c, initiative: value } : c
        )
      );
      const index = currentId
        ? combatants.findIndex((c) => c.id === currentId)
        : 0;
      return { ...previous, combatants, turnIndex: Math.max(0, index) };
    });
  }

  function changeHp(id: string, delta: number) {
    update((previous) => ({
      ...previous,
      combatants: previous.combatants.map((c) => {
        if (c.id !== id || c.hp === null) return c;
        const max = c.maxHp ?? Infinity;
        return { ...c, hp: Math.max(0, Math.min(max, c.hp + delta)) };
      }),
    }));
  }

  function beginEncounter() {
    update((previous) => ({
      ...previous,
      status: "active",
      round: 1,
      turnIndex: 0,
    }));
  }

  function nextTurn() {
    update((previous) => {
      if (previous.status !== "active" || previous.combatants.length === 0) {
        return previous;
      }
      const next = previous.turnIndex + 1;
      const wrapped = next >= previous.combatants.length;
      return {
        ...previous,
        turnIndex: wrapped ? 0 : next,
        round: wrapped ? previous.round + 1 : previous.round,
      };
    });
  }

  function previousTurn() {
    update((previous) => {
      if (previous.status !== "active" || previous.combatants.length === 0) {
        return previous;
      }
      if (previous.turnIndex > 0) {
        return { ...previous, turnIndex: previous.turnIndex - 1 };
      }
      if (previous.round > 1) {
        return {
          ...previous,
          turnIndex: previous.combatants.length - 1,
          round: previous.round - 1,
        };
      }
      return previous;
    });
  }

  /* Skip Turn: the next combatant in line loses their turn. */
  function skipTurn() {
    update((previous) => {
      const count = previous.combatants.length;
      if (previous.status !== "active" || count < 2) return previous;
      const target = previous.turnIndex + 2;
      return {
        ...previous,
        turnIndex: target % count,
        round: previous.round + Math.floor(target / count),
      };
    });
  }

  function concludeEncounter() {
    if (!window.confirm("End this encounter?")) return;
    update((previous) => ({ ...previous, status: "concluded" }));
  }

  function resetEncounter() {
    if (
      encounter.combatants.length > 0 &&
      !window.confirm("Clear this encounter and return to Preparing?")
    ) {
      return;
    }
    update(() => EMPTY_ENCOUNTER);
  }

  /* ---- DM: handle player requests (initiative + Passive Stance) ----
     Players only send a request. The DM's browser checks it against the
     real character data (Agility, role) before changing anything. */
  const guestsRef = useRef(guests);
  guestsRef.current = guests;

  function findGuest(refId: string) {
    return guestsRef.current.find(
      (g) => (g.id || g.room || g.name) === refId
    );
  }

  function handleInitiativeRoll(payload: { refId?: string; d20?: number }) {
    const refId = payload?.refId;
    const d20 = Number(payload?.d20);
    if (!refId || !Number.isInteger(d20) || d20 < 1 || d20 > 20) return;

    const guest = findGuest(refId);
    if (!guest) return;

    // 1d20 + Agility. Agility comes from the saved character, not the message.
    const total = d20 + (Number(guest.skills?.Agility) || 0);
    const id = `guest:${refId}`;

    update((previous) => {
      if (previous.status === "concluded") return previous;
      if (previous.passive.some((p) => p.refId === refId)) return previous;

      const existing = previous.combatants.find((c) => c.id === id);
      if (existing && existing.initiative !== null) return previous; // one roll

      const currentId = previous.combatants[previous.turnIndex]?.id;
      const withRoll: Combatant[] = existing
        ? previous.combatants.map((c) =>
            c.id === id ? { ...c, initiative: total } : c
          )
        : [
            ...previous.combatants,
            {
              id,
              kind: "guest",
              refId,
              name: guest.name,
              portrait: guest.portrait || "",
              ac: Number(guest.ac) || null,
              hp: guest.hp != null ? Number(guest.hp) : null,
              maxHp: guest.maxHp != null ? Number(guest.maxHp) : null,
              initiative: total,
            },
          ];

      const combatants = sortCombatants(withRoll);
      const index = currentId
        ? combatants.findIndex((c) => c.id === currentId)
        : 0;
      return { ...previous, combatants, turnIndex: Math.max(0, index) };
    });
  }

  function handleEndTurn(payload: { refId?: string }) {
    const refId = payload?.refId;
    if (!refId) return;
    update((previous) => {
      if (previous.status !== "active" || previous.combatants.length === 0) {
        return previous;
      }
      // Only the character whose turn it is may end it.
      if (previous.combatants[previous.turnIndex]?.id !== `guest:${refId}`) {
        return previous;
      }
      const next = previous.turnIndex + 1;
      const wrapped = next >= previous.combatants.length;
      return {
        ...previous,
        turnIndex: wrapped ? 0 : next,
        round: wrapped ? previous.round + 1 : previous.round,
      };
    });
  }

  function handleStance(payload: { refId?: string; passive?: boolean }) {
    const refId = payload?.refId;
    if (!refId || typeof payload.passive !== "boolean") return;

    const guest = findGuest(refId);
    if (!guest) return;

    // Only a character whose selected role is Watcher may use Passive Stance.
    if (payload.passive && guest.role !== "Watcher" && guest.role2 !== "Watcher") {
      return;
    }

    const id = `guest:${refId}`;

    update((previous) => {
      if (previous.status === "concluded") return previous;
      const alreadyPassive = previous.passive.some((p) => p.refId === refId);

      if (!payload.passive) {
        if (!alreadyPassive) return previous;
        return {
          ...previous,
          passive: previous.passive.filter((p) => p.refId !== refId),
        };
      }

      if (alreadyPassive) return previous;

      // Once attention is on you (you've rolled initiative), it's too late.
      const existing = previous.combatants.find((c) => c.id === id);
      if (existing && existing.initiative !== null) return previous;

      const currentId = previous.combatants[previous.turnIndex]?.id;
      const combatants = previous.combatants.filter((c) => c.id !== id);
      let index = currentId
        ? combatants.findIndex((c) => c.id === currentId)
        : 0;
      if (index < 0) {
        index = Math.min(previous.turnIndex, Math.max(0, combatants.length - 1));
      }

      return {
        ...previous,
        combatants,
        turnIndex: index,
        passive: [
          ...previous.passive,
          { refId, name: guest.name, portrait: guest.portrait || "" },
        ],
      };
    });
  }

  const actionsRef = useRef({ handleInitiativeRoll, handleStance, handleEndTurn });
  actionsRef.current = { handleInitiativeRoll, handleStance, handleEndTurn };

  useEffect(() => {
    if (!isDM) return;
    const offRoll = on("initiative:roll", (p: any) =>
      actionsRef.current.handleInitiativeRoll(p)
    );
    const offStance = on("stance:set", (p: any) =>
      actionsRef.current.handleStance(p)
    );
    const offEnd = on("turn:end", (p: any) =>
      actionsRef.current.handleEndTurn(p)
    );
    return () => {
      offRoll();
      offStance();
      offEnd();
    };
  }, [isDM, on]);

  /* DM: bring an observing Watcher into the initiative order. */
  function releasePassive(refId: string) {
    const guest = findGuest(refId);
    update((previous) => ({
      ...previous,
      passive: previous.passive.filter((p) => p.refId !== refId),
    }));
    if (guest) {
      addCombatants([
        {
          id: `guest:${refId}`,
          kind: "guest",
          refId,
          name: guest.name,
          portrait: guest.portrait || "",
          ac: Number(guest.ac) || null,
          hp: null,
          maxHp: null,
          initiative: null,
        },
      ]);
    }
  }

  /* ---- Player actions ---- */
  const [myRoll, setMyRoll] = useState<{ d20: number; agility: number } | null>(
    null
  );

  function rollMyInitiative() {
    if (!character) return;
    const refId = character.id || character.room || character.name;
    if (!refId) return;

    const d20 = rollDie(20);
    const agility = Number(character.skills.Agility) || 0;
    setMyRoll({ d20, agility });
    send("initiative:roll", { refId, d20 });

    feed.publish({
      category: "initiative",
      formula: `1d20 + Agility ${agility}`,
      detail: `d20 ${d20} + Agility ${agility}`,
      total: d20 + agility,
      dreadfulEvent: null,
    });
  }

  /* Players can only ask to end their own turn; the DM's page checks it. */
  function endMyTurn() {
    if (!character || !isMyTurn) return;
    const refId = character.id || character.room || character.name;
    if (!refId) return;
    send("turn:end", { refId });
  }

  function setMyStance(passive: boolean) {
    if (!character) return;
    const refId = character.id || character.room || character.name;
    if (!refId) return;
    send("stance:set", { refId, passive });
  }

  /* A skill or ability roll made in the floating dice roller. */
  function handleSkillRoll(report: {
    category: "check" | "save";
    formula: string;
    detail: string;
    total: number;
    dreadfulEvent: string | null;
  }) {
    feed.publish({
      category: report.category,
      formula: report.formula,
      detail: report.detail,
      total: report.total,
      dreadfulEvent: report.dreadfulEvent,
    });
  }

  /* ---- render helpers ---- */
  const status: EncounterStatus = view?.status ?? "preparing";
  const combatants = view?.combatants ?? [];
  const currentId =
    view?.status === "active" ? combatants[view.turnIndex]?.id : undefined;

  const passiveList = view?.passive ?? [];
  const showObserving = passiveList.length > 0 && (isDM || sessionActive);
  const activeIdx = view?.status === "active" ? view.turnIndex : -1;
  const ordered = combatants.map((c, index) => ({ c, index }));
  // Loop: the combatant whose turn it is moves to the front.
  const shown =
    activeIdx > 0
      ? [...ordered.slice(activeIdx), ...ordered.slice(0, activeIdx)]
      : ordered;
  const myKey = character
    ? character.id || character.room || character.name
    : "";
  const isWatcher =
    !!character &&
    (character.role === "Watcher" || character.role2 === "Watcher");
  const me = combatants.find((c) => c.id === `guest:${myKey}`);
  const isMyTurn =
    !!myKey && status === "active" && currentId === `guest:${myKey}`;
  const iAmPassive = passiveList.some((p) => p.refId === myKey);
  const canAct = sessionActive && !!view && status !== "concluded";
  const myAgility = character ? Number(character.skills.Agility) || 0 : 0;

  const availableGuests = guests.filter(
    (g) => !combatants.some((c) => c.id === `guest:${g.id || g.room || g.name}`)
  );
  const availableDreadfuls = dreadfuls.filter(
    (d) => !combatants.some((c) => c.id === `dreadful:${d.id || d.name}`)
  );

  return (
    <main style={{ minHeight: "100vh", padding: "24px 16px 80px" }}>
      <div className="bg-wrap">
        {/* ================= HEADER ================= */}
        <header className="bg-panel">
          <div className="bg-eyebrow">Paradise Hotel</div>
          <h1 style={{ margin: "6px 0 0", fontWeight: 400 }}>
            Battle Grounds
          </h1>

          <div className="bg-indicator">
            <span className="bg-pill">
              <span className={"bg-dot" + (sessionActive ? " is-live" : "")} />
              {!connected
                ? "Connecting…"
                : sessionActive
                  ? "Session active"
                  : "No session running"}
            </span>

            <span className="bg-pill">
              {participantCount} {participantCount === 1 ? "guest" : "guests"}{" "}
              present
            </span>

            <span className={"bg-pill bg-status is-" + status}>
              {STATUS_LABEL[status]}
              {status === "active" && view ? ` · Round ${view.round}` : ""}
            </span>

            <span className="bg-pill">{isDM ? "DM view" : "Player view"}</span>
          </div>

          {present.length > 0 && (
            <ul className="bg-roster">
              {present.map((p) => (
                <li key={p.clientId} className={p.isDM ? "is-dm" : undefined}>
                  {p.isDM ? "DM · " : ""}
                  {p.name}
                </li>
              ))}
            </ul>
          )}

          <div className="bg-actions">
            <button
              type="button"
              className="ph-btn ph-btn-secondary"
              onClick={onBack}
            >
              Leave Battle Grounds
            </button>
          </div>
        </header>

        {/* ================= INITIATIVE TABLE ================= */}
        <section className="bg-panel bg-track-panel">
          <div className="bg-track-head">
            <div>
              <div className="bg-eyebrow">The Table</div>
              <h2 style={{ margin: "6px 0 0" }}>
                Initiative
                {status === "active" && view ? ` · Round ${view.round}` : ""}
              </h2>
            </div>
          </div>

          {isDM && (
            <div className="bg-turnbar">
              {status === "preparing" && (
                <button
                  type="button"
                  className="ph-btn"
                  onClick={beginEncounter}
                  disabled={combatants.length === 0}
                >
                  Begin Encounter
                </button>
              )}

              <button
                type="button"
                className="ph-btn ph-btn-secondary"
                onClick={previousTurn}
                disabled={status !== "active"}
              >
                ‹ Previous Turn
              </button>
              <button
                type="button"
                className="ph-btn"
                onClick={nextTurn}
                disabled={status !== "active"}
              >
                Next Turn ›
              </button>
              <button
                type="button"
                className="ph-btn ph-btn-secondary"
                onClick={skipTurn}
                disabled={status !== "active"}
                title="Skip the next combatant's turn"
              >
                Skip Turn »
              </button>
              <button
                type="button"
                className="ph-btn ph-btn-secondary"
                onClick={concludeEncounter}
                disabled={status !== "active"}
              >
                End Encounter
              </button>

              {status === "concluded" && (
                <button type="button" className="ph-btn" onClick={resetEncounter}>
                  Clear &amp; Prepare New
                </button>
              )}

              {status !== "concluded" && combatants.length > 0 && (
                <button
                  type="button"
                  className="ph-btn ph-btn-secondary"
                  onClick={resetEncounter}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {!isDM && character && (
            <div className="bg-turnbar">
              <button
                type="button"
                className="ph-btn"
                onClick={endMyTurn}
                disabled={!isMyTurn}
              >
                {isMyTurn ? "End Turn" : "End Turn (not your turn)"}
              </button>
            </div>
          )}

        {/* player initiative (compact, inside the table) */}
        {!isDM && character && (
          <div className="bg-init-mini">
            <div className="bg-eyebrow">Your Turn Order</div>

            {!canAct && (
              <p className="bg-empty">
                Initiative opens once the DM has an encounter running.
              </p>
            )}

            {canAct && iAmPassive && (
              <>
                <p className="bg-note">
                  You are in <strong>Passive Stance</strong>. You are
                  observing and are not part of the initiative order.
                </p>
                <div className="bg-actions" style={{ marginTop: 0 }}>
                  <button
                    type="button"
                    className="ph-btn"
                    onClick={() => setMyStance(false)}
                  >
                    Break Stance &amp; Join Initiative
                  </button>
                </div>
              </>
            )}

            {canAct && !iAmPassive && me && me.initiative !== null && (
              <div className="bg-init-result">
                Your initiative: {me.initiative}
              </div>
            )}

            {canAct && !iAmPassive && (!me || me.initiative === null) && (
              <>
                {myRoll && (
                  <p className="bg-note">
                    Rolled d20 {myRoll.d20} + Agility {myRoll.agility} ={" "}
                    <strong>{myRoll.d20 + myRoll.agility}</strong>. Waiting
                    for the DM to place you…
                  </p>
                )}
                <div className="bg-actions" style={{ marginTop: 0 }}>
                  <button
                    type="button"
                    className="ph-btn"
                    onClick={rollMyInitiative}
                  >
                    Roll 1d20 + Agility ({myAgility})
                  </button>

                  {isWatcher && (
                    <button
                      type="button"
                      className="ph-btn ph-btn-secondary"
                      onClick={() => setMyStance(true)}
                    >
                      Passive Stance
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}


          {!isDM && !sessionActive && (
            <p className="bg-empty">
              No session is running. The DM has not opened the Battle
              Grounds yet.
            </p>
          )}

          {!isDM && sessionActive && !view && (
            <p className="bg-empty">Waiting for the DM to open an encounter…</p>
          )}

          {(isDM || (sessionActive && view)) && combatants.length === 0 && (
            <p className="bg-empty">
              {isDM
                ? "No participants yet. Add guests, Dreadlings, or Dreadfuls above."
                : "The encounter is being prepared. No participants yet."}
            </p>
          )}

          {(isDM || sessionActive) && combatants.length > 0 && (
            <ol
              className="bg-list bg-track"
              key={`${view?.round ?? 0}-${activeIdx}`}
            >
              {shown.map(({ c, index }) => {
                const isCurrent = c.id === currentId;
                return (
                  <li
                    key={c.id}
                    className={
                      "bg-card is-" +
                      c.kind +
                      (isCurrent ? " is-current" : "") +
                      (c.hp !== null && c.hp <= 0 ? " is-down" : "")
                    }
                  >
                    <div className="bg-order">{index + 1}</div>

                    <div className="bg-portrait">
                      {c.portrait ? (
                        <img src={c.portrait} alt={c.name} />
                      ) : (
                        <span>◈</span>
                      )}
                    </div>

                    <div className="bg-main">
                      <div className="bg-kind">
                        {c.kind === "dreadful" ? "◆ Dreadful" : c.kind}
                        {c.hp !== null && c.hp <= 0 ? " · down" : ""}
                        {isCurrent ? " · current turn" : ""}
                      </div>
                      <div className="bg-name">{c.name}</div>

                      <div className="bg-stats">
                        {c.ac !== null && <span>AC {c.ac}</span>}
                        {c.hp !== null && (
                          <span>
                            HP {c.hp}
                            {c.maxHp !== null ? ` / ${c.maxHp}` : ""}
                          </span>
                        )}
                      </div>

                      {c.hp !== null && c.maxHp !== null && c.maxHp > 0 && (
                        <div className="bg-hpbar" aria-hidden="true">
                          <span
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, (c.hp / c.maxHp) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-side">
                      {isDM ? (
                        <>
                          <label className="bg-init-label">Init</label>
                          <InitiativeInput
                            value={c.initiative}
                            onCommit={(v) => setInitiative(c.id, v)}
                          />
                          <div className="bg-mini-row">
                            {c.hp !== null && (
                              <>
                                <button
                                  type="button"
                                  className="bg-mini"
                                  aria-label="Lower HP"
                                  onClick={() => changeHp(c.id, -1)}
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  className="bg-mini"
                                  aria-label="Raise HP"
                                  onClick={() => changeHp(c.id, 1)}
                                >
                                  +
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="bg-mini is-remove"
                              aria-label="Remove from encounter"
                              onClick={() => removeCombatant(c.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-init-label">Init</div>
                          <div className="bg-init-value">
                            {c.initiative ?? "—"}
                          </div>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
              {status === "active" && combatants.length > 1 && (
                <li className="bg-loop" aria-hidden="true">
                  <span>↻</span>
                  <small>Back to the top</small>
                </li>
              )}
            </ol>
          )}
        </section>

        {/* ================= BELOW: character / controls | shared feed ================= */}
        <div className="bg-layout">
          <div className="bg-col-main">
            {!isDM && character && <CharacterPanel character={character} />}

        {/* ================= DM ONLY: DREADLING / DREADFUL SHEETS ================= */}
        {isDM && (
          <CombatantSheets
            combatants={combatants}
            dreadlings={dreadlings}
            dreadfuls={dreadfuls}
            currentId={currentId}
            onPublish={feed.publish}
            onSetInitiative={setInitiative}
          />
        )}

        {/* ================= OBSERVING (PASSIVE STANCE) ================= */}
        {showObserving && (
          <section className="bg-panel bg-observing">
            <div className="bg-eyebrow">Observing · Passive Stance</div>
            <ul>
              {passiveList.map((p) => (
                <li key={p.refId}>
                  <span>{p.name}</span>
                  {isDM && (
                    <button
                      type="button"
                      className="ph-btn ph-btn-secondary"
                      onClick={() => releasePassive(p.refId)}
                    >
                      Bring Into Initiative
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
          </div>

          <aside className="bg-col-feed">
            <RollFeedPanel rolls={feed.rolls} isDM={isDM} onClear={feed.clear} />
          </aside>
        </div>

        {/* ================= DM: ADD TO ENCOUNTER (bottom) ================= */}
        {isDM && (
          <section className="bg-panel">
            <div className="bg-eyebrow">Game Master</div>
            <h2 style={{ margin: "6px 0 14px" }}>Add to Encounter</h2>

            {status !== "concluded" && (
              <div className="bg-add-grid">
                <div className="bg-add-row">
                  <label>Add Guest</label>
                  <select
                    value={pickGuest}
                    onChange={(e) => setPickGuest(e.target.value)}
                  >
                    <option value="">Select a guest…</option>
                    {availableGuests.map((g) => {
                      const key = g.id || g.room || g.name;
                      return (
                        <option key={key} value={key}>
                          {g.name}
                          {g.room ? ` · Room ${g.room}` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    className="ph-btn ph-btn-secondary"
                    disabled={!pickGuest}
                    onClick={addGuest}
                  >
                    Add
                  </button>
                </div>

                <div className="bg-add-row">
                  <label>Add Dreadling</label>
                  <select
                    value={pickDreadling}
                    onChange={(e) => setPickDreadling(e.target.value)}
                  >
                    <option value="">Select a Dreadling…</option>
                    {dreadlings.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || "Unnamed Dreadling"}
                      </option>
                    ))}
                  </select>
                  <input
                    className="bg-count-input no-spinner"
                    type="number"
                    min={1}
                    max={20}
                    value={dreadlingCount}
                    aria-label="How many"
                    onChange={(e) => setDreadlingCount(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="ph-btn ph-btn-secondary"
                    disabled={!pickDreadling}
                    onClick={addDreadlings}
                  >
                    Add
                  </button>
                </div>

                <div className="bg-add-row">
                  <label>Add Dreadful</label>
                  <select
                    value={pickDreadful}
                    onChange={(e) => setPickDreadful(e.target.value)}
                  >
                    <option value="">Select a Dreadful…</option>
                    {availableDreadfuls.map((d) => {
                      const key = d.id || d.name;
                      return (
                        <option key={key} value={key}>
                          {d.name || "Unnamed Dreadful"}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    className="ph-btn ph-btn-secondary"
                    disabled={!pickDreadful}
                    onClick={addDreadful}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Floating dice roller (players only). */}
      {!isDM && character && (
        <DiceRoller guest={character} onRoll={handleSkillRoll} />
      )}
    </main>
  );
}


/* =========================================================
   DM DICE — roll for any combatant (Dreadlings, Dreadfuls…)
   ========================================================= */

function parseAndRoll(
  raw: string
): { total: number; detail: string; formula: string } | null {
  const text = raw.replace(/\s+/g, "").toLowerCase();
  if (!text) return null;

  const parts = text.split(/(?=[+-])/);
  let total = 0;
  let diceCount = 0;
  const bits: string[] = [];

  for (const part of parts) {
    const dice = /^([+-]?)(\d*)d(\d+)$/.exec(part);
    if (dice) {
      const sign = dice[1] === "-" ? -1 : 1;
      const count = dice[2] === "" ? 1 : Number(dice[2]);
      const sides = Number(dice[3]);
      if (count < 1 || count > 50 || sides < 2 || sides > 1000) return null;

      const rolls = Array.from({ length: count }, () => rollDie(sides));
      total += sign * rolls.reduce((sum, value) => sum + value, 0);
      diceCount += count;
      const prefix = sign < 0 ? "- " : bits.length > 0 ? "+ " : "";
      bits.push(`${prefix}${count}d${sides} [${rolls.join(", ")}]`);
      continue;
    }

    const constant = /^([+-]?)(\d+)$/.exec(part);
    if (constant) {
      const sign = constant[1] === "-" ? -1 : 1;
      total += sign * Number(constant[2]);
      const prefix = sign < 0 ? "- " : bits.length > 0 ? "+ " : "";
      bits.push(`${prefix}${constant[2]}`);
      continue;
    }

    return null;
  }

  if (diceCount === 0) return null;
  return { total, detail: bits.join(" "), formula: text };
}

const CORE_NAMES = ["Mind", "Body", "Heart", "Ego"] as const;

const MONSTER_CORE_SKILLS: Record<string, string[]> = {
  Mind: ["Perception", "Knowledge", "Analysis"],
  Body: ["Might", "Agility", "Endurance"],
  Heart: ["Empathy", "Influence", "Expression"],
  Ego: ["Memory", "Self", "Psyche"],
};

/* Keep in sync with ROLE_PROFICIENCIES in App.tsx / DiceRoller.tsx */
const MONSTER_ROLE_PROFICIENCIES: Record<string, string[]> = {
  Caretaker: ["Empathy", "Knowledge", "Agility"],
  Dreamer: ["Might", "Expression", "Self"],
  Guardian: ["Endurance", "Perception", "Psyche"],
  Adversary: ["Might", "Agility", "Endurance"],
  Archivist: ["Knowledge", "Analysis", "Memory"],
  Diplomat: ["Expression", "Influence", "Self"],
  Watcher: ["Perception", "Empathy", "Influence"],
  Vessel: ["Memory", "Psyche", "Analysis"],
  Timekeeper: ["Knowledge", "Perception", "Analysis"],
  Doorman: ["Endurance", "Might", "Agility"],
  Overseer: ["Influence", "Expression", "Empathy"],
  Mnēmosynē: ["Memory", "Psyche", "Self"],
};

function dieFor(source: any, core: string): string {
  const value = source?.[core.toLowerCase() + "Die"];
  return typeof value === "string" && value.trim() ? value.trim() : "1d4";
}

function CombatantSheets({
  combatants,
  dreadlings,
  dreadfuls,
  currentId,
  onPublish,
  onSetInitiative,
}: {
  combatants: Combatant[];
  dreadlings: DreadlingLite[];
  dreadfuls: DreadfulLite[];
  currentId: string | undefined;
  onPublish: (roll: RollInput) => void;
  onSetInitiative: (id: string, value: number | null) => void;
}) {
  const monsters = combatants.filter((c) => c.kind !== "guest");

  return (
    <section className="bg-panel">
      <div className="bg-eyebrow">Game Master Only</div>
      <h2 style={{ margin: "6px 0 4px" }}>Dreadling &amp; Dreadful Sheets</h2>
      <p className="bg-feed-note">
        Only you can see these. Rolls made here show in the shared feed under
        the creature&apos;s name.
      </p>

      {monsters.length === 0 ? (
        <p className="bg-empty">
          Add a Dreadling or Dreadful to the encounter to see its sheet here.
        </p>
      ) : (
        <div className="bg-mons">
          {monsters.map((c) => (
            <MonsterSheet
              key={c.id}
              combatant={c}
              isCurrent={c.id === currentId}
              dreadling={
                c.kind === "dreadling"
                  ? dreadlings.find((d) => d.id === c.refId)
                  : undefined
              }
              dreadful={
                c.kind === "dreadful"
                  ? dreadfuls.find((d) => (d.id || d.name) === c.refId)
                  : undefined
              }
              onPublish={onPublish}
              onSetInitiative={onSetInitiative}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MonsterSheet({
  combatant: c,
  isCurrent,
  dreadling,
  dreadful,
  onPublish,
  onSetInitiative,
}: {
  combatant: Combatant;
  isCurrent: boolean;
  dreadling?: DreadlingLite;
  dreadful?: DreadfulLite;
  onPublish: (roll: RollInput) => void;
  onSetInitiative: (id: string, value: number | null) => void;
}) {
  const isDreadful = c.kind === "dreadful";
  const [kind, setKind] = useState<"check" | "save" | "initiative">("check");
  const [mode, setMode] = useState<"skill" | "ability">(
    isDreadful ? "skill" : "ability"
  );
  const [skill, setSkill] = useState("Perception");
  const [core, setCore] = useState<string>("Mind");
  const [damage, setDamage] = useState("1d6");
  const [last, setLast] = useState("");
  const [error, setError] = useState("");

  const source: any = dreadling || dreadful;

  function send(category: RollInput["category"], parts: string[], detail: string[], total: number) {
    onPublish({
      category,
      formula: parts.join(" + "),
      detail: detail.join(" + "),
      total,
      dreadfulEvent: null,
      name: c.name,
    });
    setLast(`${total}`);
    if (category === "initiative") onSetInitiative(c.id, total);
  }

  /* Same rules as a player: 1d20 + skill (+ proficiency),
     or 1d20 + core die when using an ability. */
  function rollLikePlayer() {
    setError("");
    const d20 = rollDie(20);
    const parts = ["1d20"];
    const detail = [`d20 ${d20}`];
    let total = d20;

    if (kind === "initiative") {
      if (isDreadful) {
        const agility = Number(dreadful?.skills?.Agility) || 0;
        total += agility;
        parts.push(`Agility ${agility}`);
        detail.push(`Agility ${agility}`);
      }
    } else if (mode === "skill" && isDreadful) {
      const value = Number(dreadful?.skills?.[skill]) || 0;
      total += value;
      parts.push(`${skill} ${value}`);
      detail.push(`${skill} ${value}`);

      const proficient = [dreadful?.role, dreadful?.role2].some(
        (role) => role && MONSTER_ROLE_PROFICIENCIES[role]?.includes(skill)
      );
      if (proficient) {
        const bonus = Math.max(1, Math.ceil(value / 2));
        total += bonus;
        parts.push(`Proficiency ${bonus}`);
        detail.push(`Proficiency ${bonus}`);
      }
    } else {
      const die = dieFor(source, core);
      const sides = Number(/d(\d+)/.exec(die)?.[1]) || 0;
      if (sides > 0) {
        const value = rollDie(sides);
        total += value;
        parts.push(`${core} d${sides}`);
        detail.push(`${core} d${sides} ${value}`);
      }
    }

    send(kind, parts, detail, total);
  }

  function rollDamage() {
    const result = parseAndRoll(damage);
    if (!result) {
      setError("Use dice like 2d6+3 or 1d8 (up to 50 dice).");
      return;
    }
    setError("");
    send("damage", [result.formula], [result.detail], result.total);
  }

  const previewParts = ["1d20"];
  if (kind === "initiative") {
    if (isDreadful) {
      previewParts.push(`Agility ${Number(dreadful?.skills?.Agility) || 0}`);
    }
  } else if (mode === "skill" && isDreadful) {
    previewParts.push(`${skill} ${Number(dreadful?.skills?.[skill]) || 0}`);
  } else {
    previewParts.push(`${core} ${dieFor(source, core)}`);
  }

  const abilities = dreadling?.abilities || [];
  const dreadfulAbilities = dreadful?.abilities
    ? Object.entries(dreadful.abilities).filter(([, a]) => a && a.name)
    : [];
  const skills = dreadful?.skills ? Object.entries(dreadful.skills) : [];

  return (
    <details className="bg-mon" open={isCurrent || undefined}>
      <summary>
        <span className={"bg-mon-kind is-" + c.kind}>
          {c.kind === "dreadful" ? "◆ Dreadful" : "Dreadling"}
        </span>
        <strong>{c.name}</strong>
        <span className="bg-mon-vitals">
          {c.ac !== null && <>AC {c.ac}</>}
          {c.hp !== null && (
            <>
              {" "}
              · HP {c.hp}
              {c.maxHp !== null ? ` / ${c.maxHp}` : ""}
            </>
          )}
          {isCurrent && " · current turn"}
        </span>
      </summary>

      <div className="bg-mon-body">
        <div className="bg-mon-info">
          <div className="bg-portrait bg-mon-portrait">
            {c.portrait ? <img src={c.portrait} alt={c.name} /> : <span>◈</span>}
          </div>

          <div className="bg-mon-text">
            {dreadling && (
              <>
                {dreadling.sourceOfTrauma && (
                  <p><em>Source of trauma:</em> {dreadling.sourceOfTrauma}</p>
                )}
                {dreadling.appearance && (
                  <p><em>Appearance:</em> {dreadling.appearance}</p>
                )}
                {dreadling.behavior && (
                  <p><em>Behavior:</em> {dreadling.behavior}</p>
                )}
                {abilities.length > 0 && (
                  <ul className="bg-mon-list">
                    {abilities.map((a, i) => (
                      <li key={i}>
                        <strong>{a.name}</strong>
                        <span>{a.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {dreadling.dreadfulAction?.name && (
                  <div className="bg-mon-dread">
                    <strong>Dreadful Action · {dreadling.dreadfulAction.name}</strong>
                    <span>{dreadling.dreadfulAction.description}</span>
                  </div>
                )}
                {dreadling.encounterAbility && (
                  <p><em>Encounter ability:</em> {dreadling.encounterAbility}</p>
                )}
              </>
            )}

            {dreadful && (
              <>
                {(dreadful.title || dreadful.role) && (
                  <p>
                    {[dreadful.title, dreadful.role, dreadful.role2]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <div className="bg-chips-row" style={{ marginTop: 0 }}>
                  <span className="bg-chip">Memory {dreadful.memoryPool ?? 0} / {dreadful.maxMemoryPool ?? 0}</span>
                  <span className="bg-chip is-dread">Dread {dreadful.dread ?? 0}</span>
                  <span className="bg-chip">Move {dreadful.movement ?? 0} ft</span>
                </div>
                {skills.length > 0 && (
                  <div className="bg-mon-skills">
                    {skills.map(([name, value]) => (
                      <span key={name}>{name} <strong>{value}</strong></span>
                    ))}
                  </div>
                )}
                {dreadfulAbilities.length > 0 && (
                  <ul className="bg-mon-list">
                    {dreadfulAbilities.map(([core, a]) => (
                      <li key={core}>
                        <strong>{core} · {a.name}</strong>
                        <span>{a.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {!source && (
              <p className="bg-empty">
                The original record could not be found. It may have been
                deleted from the archives.
              </p>
            )}
          </div>
        </div>

        <div className="bg-mon-roll">
          <div className="bg-eyebrow">Rolls for {c.name}</div>

          <div className="bg-chips-row">
            {(
              [
                ["initiative", "Initiative"],
                ["check", "Ability Check"],
                ["save", "Saving Throw"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={"bg-mini bg-die" + (kind === value ? " is-on" : "")}
                onClick={() => setKind(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {kind !== "initiative" && isDreadful && (
            <div className="bg-chips-row" style={{ marginTop: 0 }}>
              <button
                type="button"
                className={"bg-mini bg-die" + (mode === "skill" ? " is-on" : "")}
                onClick={() => setMode("skill")}
              >
                Skill
              </button>
              <button
                type="button"
                className={"bg-mini bg-die" + (mode === "ability" ? " is-on" : "")}
                onClick={() => setMode("ability")}
              >
                Ability (core die)
              </button>
            </div>
          )}

          {kind !== "initiative" && mode === "skill" && isDreadful && (
            <div className="bg-mon-field">
              <label>Skill</label>
              <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                {Object.entries(MONSTER_CORE_SKILLS).map(([coreName, list]) => (
                  <optgroup key={coreName} label={coreName}>
                    {list.map((name) => (
                      <option key={name} value={name}>
                        {name} ({Number(dreadful?.skills?.[name]) || 0})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {kind !== "initiative" && (mode === "ability" || !isDreadful) && (
            <div className="bg-mon-field">
              <label>Core die</label>
              <select value={core} onChange={(e) => setCore(e.target.value)}>
                {CORE_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name} ({dieFor(source, name)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="bg-feed-note" style={{ margin: 0 }}>
            {previewParts.join(" + ")}
          </p>

          <div className="bg-actions" style={{ marginTop: 0 }}>
            <button type="button" className="ph-btn" onClick={rollLikePlayer}>
              Roll
            </button>
            {last && <span className="bg-mon-last">Last: {last}</span>}
          </div>

          <div className="bg-mon-field">
            <label>Damage dice</label>
            <div className="bg-mon-free">
              <input
                type="text"
                value={damage}
                placeholder="2d6+3"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setDamage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") rollDamage();
                }}
              />
              <button type="button" className="ph-btn ph-btn-secondary" onClick={rollDamage}>
                Roll Damage
              </button>
            </div>
          </div>

          {error && <p className="bg-error">{error}</p>}
        </div>
      </div>
    </details>
  );
}