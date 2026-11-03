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
    const now = Date.now();
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
  sessionActive,
  isDM,
  clientId,
  name,
}: {
  send: (event: string, payload: unknown) => void;
  on: (event: string, fn: (payload: any) => void) => () => void;
  connected: boolean;
  sessionActive: boolean;
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
    const now = Date.now();
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
      const now = Date.now();
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
        send("roll:sync", {
          rolls: rollsRef.current,
          clearedAt: clearedAtRef.current,
        });
      }
    });
    const offClear = on("roll:clear", (payload) => applyClear(Number(payload?.at)));

    return () => {
      offNew();
      offSync();
      offRequest();
      offClear();
    };
  }, [on, send, addMany, applyClear, isDM]);

  /* Players ask the DM for the recent history when a session is running. */
  useEffect(() => {
    if (isDM || !connected || !sessionActive) return;
    send("roll:sync-request", {});
  }, [isDM, connected, sessionActive, send]);

  const publish = useCallback(
    (roll: RollInput) => {
      const entry: RollEntry = {
        id: makeId(),
        at: Date.now(),
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
      send("roll:new", entry);
    },
    [addMany, send, clientId, name, isDM]
  );

  /* DM only: wipe the feed for everyone. */
  const clear = useCallback(() => {
    if (!isDM) return;
    const at = Date.now();
    applyClear(at);
    send("roll:clear", { at });
  }, [isDM, applyClear, send]);

  return { rolls, publish, clear };
}