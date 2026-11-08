import { useCallback, useEffect, useRef, useState } from "react";

/* =========================================================
   SHARED ROLL FEED (temporary)
   Rolls travel over Supabase Realtime Broadcast only.
   Nothing is written to a database table.

   - Every roll carries a timestamp and lives for 60 minutes.
   - Each browser keeps a copy in localStorage so a refresh
     keeps the feed, and expired rolls are dropped on load and
     every 30 seconds, so they never come back.
   - The DM's browser answers "sync" requests, so players who
     join late still see the last hour of rolls.
   - If the connection drops, new rolls wait in an outbox and are
     sent once it resumes; on reconnect each browser also re-shares
     its own recent rolls and asks the DM for anything it missed.

   TIME IS BASED ON THE DM.
   The DM's device is the reference clock. The DM's browser announces
   its time and its timezone ("clock:sync"); every other browser works
   out how far its own clock is off the DM's and uses serverNow() for
   everything: stamping rolls, the 60-minute expiry, and Clear Feed.
   Everyone sees roll times in the DM's timezone.
   Until the DM has been heard from, the website server's time (the
   "Date" header of a tiny request) is used instead.
   ========================================================= */

export type RollCategory = "initiative" | "check" | "save" | "damage";

export type RollEntry = {
  id: string;
  at: number;
  clientId: string;
  name: string;
  isDM: boolean;
  category: RollCategory;
  formula: string;
  detail: string;
  total: number;
  dreadfulEvent: string | null;
};

export type RollInput = {
  category: RollCategory;
  formula: string;
  detail: string;
  total: number;
  dreadfulEvent: string | null;
  name?: string;
};

const STORAGE_KEY = "paradiseHotelRollFeed";
const CLEARED_KEY = "paradiseHotelRollFeedClearedAt";
export const ROLL_LIFETIME_MS = 60 * 60 * 1000;
const MAX_ROLLS = 200;
const CATEGORIES: RollCategory[] = ["initiative", "check", "save", "damage"];

/* ---------- Global (server) clock ---------- */

/* How far this device's clock is from the server's, in milliseconds. */
let clockOffset = 0;

/* "Now", according to the server rather than this device. */
export function serverNow(): number {
  return Date.now() + clockOffset;
}

/* The DM's device is the reference clock. */
let isClockReference = false;
let dmClockSynced = false;

/* Timezone that roll times are shown in (the DM's). */
let feedTimeZone = "UTC";
const timeZoneListeners = new Set<() => void>();

export function getFeedTimeZone(): string {
  return feedTimeZone;
}

export function subscribeFeedTimeZone(listener: () => void): () => void {
  timeZoneListeners.add(listener);
  return () => {
    timeZoneListeners.delete(listener);
  };
}

function setFeedTimeZone(zone: unknown) {
  if (typeof zone !== "string" || !zone || zone === feedTimeZone) return;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone }); // throws if unknown
  } catch {
    return;
  }
  feedTimeZone = zone;
  timeZoneListeners.forEach((listener) => listener());
}

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/* DM: this device's clock and timezone are the reference. */
function becomeClockReference() {
  isClockReference = true;
  clockOffset = 0;
  setFeedTimeZone(deviceTimeZone());
}

/* Everyone else: line up with the DM's clock and timezone. */
function applyDmClock(payload: any) {
  const now = Number(payload?.now);
  if (!Number.isFinite(now)) return;
  clockOffset = now - Date.now();
  dmClockSynced = true;
  setFeedTimeZone(payload?.timeZone);
}

/* Ask the website's own server for the time (the Date header), and work out
   this device's offset. If it can't be reached, the last offset is kept. */
export async function syncClock(): Promise<void> {
  // The DM's clock wins once we have it.
  if (isClockReference || dmClockSynced) return;
  try {
    const before = Date.now();
    const response = await fetch(`${window.location.origin}/?clock=${before}`, {
      method: "HEAD",
      cache: "no-store",
    });
    const after = Date.now();

    const header = response.headers.get("Date");
    if (!header) return;

    let server = Date.parse(header);
    if (!Number.isFinite(server)) return;

    // A cached copy reports when it was made; "Age" says how old it is.
    server += (Number(response.headers.get("Age")) || 0) * 1000;
    // The header only has whole seconds, so on average add half a second.
    server += 500;

    const offset = server - (before + after) / 2;
    if (
      !isClockReference &&
      !dmClockSynced &&
      Math.abs(offset) < 24 * 60 * 60 * 1000
    ) {
      clockOffset = offset;
    }
  } catch {
    /* offline or blocked: keep the last known offset */
  }
}

function isValid(value: any): value is RollEntry {
  return (
    value &&
    typeof value.id === "string" &&
    typeof value.at === "number" &&
    typeof value.name === "string" &&
    typeof value.formula === "string" &&
    typeof value.total === "number" &&
    CATEGORIES.includes(value.category)
  );
}

function stillFresh(roll: RollEntry, now: number): boolean {
  return now - roll.at < ROLL_LIFETIME_MS;
}

function loadRolls(): RollEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = serverNow();
    return parsed.filter((r) => isValid(r) && stillFresh(r, now));
  } catch {
    return [];
  }
}

function loadClearedAt(): number {
  try {
    return Number(localStorage.getItem(CLEARED_KEY)) || 0;
  } catch {
    return 0;
  }
}

function makeId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function useRollFeed({
  send,
  on,
  connected,
  dmOnline,
  isDM,
  clientId,
  name,
}: {
  send: (event: string, payload: unknown) => boolean;
  on: (event: string, fn: (payload: any) => void) => () => void;
  connected: boolean;
  dmOnline: boolean;
  isDM: boolean;
  clientId: string;
  name: string;
}) {
  const clearedAtRef = useRef<number>(loadClearedAt());
  const [rolls, setRolls] = useState<RollEntry[]>(() =>
    loadRolls().filter((r) => r.at > clearedAtRef.current)
  );
  const rollsRef = useRef(rolls);
  rollsRef.current = rolls;

  /* Keep this device's clock lined up with the server's. */
  useEffect(() => {
    void syncClock();
    const timer = window.setInterval(() => void syncClock(), 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* Re-check the clock whenever the connection (re)starts. */
  useEffect(() => {
    if (connected) void syncClock();
  }, [connected]);

  /* DM: announce this device's time and timezone so everyone lines up. */
  useEffect(() => {
    if (!isDM) return;
    becomeClockReference();
    if (!connected) return;

    const announce = () =>
      send("clock:sync", { now: Date.now(), timeZone: deviceTimeZone() });
    announce();
    const timer = window.setInterval(announce, 60_000);
    return () => window.clearInterval(timer);
  }, [isDM, connected, send]);

  /* The DM cleared the feed: forget everything up to that moment. */
  const applyClear = useCallback((at: number) => {
    if (!Number.isFinite(at) || at <= clearedAtRef.current) return;
    clearedAtRef.current = at;
    try {
      localStorage.setItem(CLEARED_KEY, String(at));
    } catch {
      /* ignore */
    }
    setRolls((previous) => previous.filter((r) => r.at > at));
  }, []);

  const addMany = useCallback((incoming: unknown[]) => {
    const now = serverNow();
    setRolls((previous) => {
      const map = new Map(previous.map((r) => [r.id, r]));
      let changed = false;

      for (const item of incoming) {
        if (!isValid(item) || !stillFresh(item, now)) continue;
        if (item.at <= clearedAtRef.current) continue;
        if (!map.has(item.id)) {
          map.set(item.id, item);
          changed = true;
        }
      }

      if (!changed) return previous;
      return [...map.values()].sort((a, b) => b.at - a.at).slice(0, MAX_ROLLS);
    });
  }, []);

  /* Keep a copy for refreshes. */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rolls));
    } catch {
      /* storage blocked: the live feed still works */
    }
  }, [rolls]);

  /* Drop expired rolls every 30 seconds. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = serverNow();
      setRolls((previous) => {
        const next = previous.filter((r) => stillFresh(r, now));
        return next.length === previous.length ? previous : next;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  /* Listen for rolls and sync traffic. */
  useEffect(() => {
    const offNew = on("roll:new", (payload) => addMany([payload]));
    const offSync = on("roll:sync", (payload) => {
      if (typeof payload?.clearedAt === "number") applyClear(payload.clearedAt);
      addMany(Array.isArray(payload?.rolls) ? payload.rolls : []);
    });
    const offRequest = on("roll:sync-request", () => {
      if (isDM) {
        send("clock:sync", { now: Date.now(), timeZone: deviceTimeZone() });
        send("roll:sync", {
          rolls: rollsRef.current,
          clearedAt: clearedAtRef.current,
        });
      }
    });
    const offClear = on("roll:clear", (payload) => applyClear(Number(payload?.at)));
    const offClock = on("clock:sync", (payload) => {
      if (!isDM) applyDmClock(payload);
    });

    return () => {
      offNew();
      offSync();
      offRequest();
      offClear();
      offClock();
    };
  }, [on, send, addMany, applyClear, isDM]);

  /* Rolls made while offline wait here until the connection is back. */
  const outboxRef = useRef<RollEntry[]>([]);

  /* Every (re)connection: send queued rolls, re-share our own recent
     rolls (others may have missed them during the drop), and ask the
     DM for the history we missed. */
  useEffect(() => {
    if (!connected) return;

    const queued = outboxRef.current;
    outboxRef.current = [];
    queued.forEach((entry) => {
      if (!send("roll:new", entry)) outboxRef.current.push(entry);
    });

    const now = serverNow();
    const mine = rollsRef.current.filter(
      (r) => r.clientId === clientId && now - r.at < 15 * 60 * 1000
    );
    if (mine.length > 0) {
      send("roll:sync", { rolls: mine, clearedAt: clearedAtRef.current });
    }

    if (!isDM) send("roll:sync-request", {});
  }, [connected, isDM, send, clientId]);

  /* A DM who arrives after the players still gets asked for history. */
  useEffect(() => {
    if (isDM || !connected || !dmOnline) return;
    send("roll:sync-request", {});
  }, [isDM, connected, dmOnline, send]);

  const publish = useCallback(
    (roll: RollInput) => {
      const entry: RollEntry = {
        id: makeId(),
        at: serverNow(),
        clientId,
        name: roll.name?.trim() || name,
        isDM,
        category: roll.category,
        formula: roll.formula,
        detail: roll.detail,
        total: roll.total,
        dreadfulEvent: roll.dreadfulEvent,
      };

      addMany([entry]);
      if (!send("roll:new", entry)) outboxRef.current.push(entry);
    },
    [addMany, send, clientId, name, isDM]
  );

  /* DM only: wipe the feed for everyone. */
  const clear = useCallback(() => {
    if (!isDM) return;
    const at = serverNow();
    applyClear(at);
    send("roll:clear", { at });
  }, [isDM, applyClear, send]);

  return { rolls, publish, clear };
}