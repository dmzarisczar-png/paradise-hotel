import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/* =========================================================
   BATTLE GROUNDS — EPHEMERAL REALTIME
   Uses Supabase Realtime Broadcast + Presence only.
   Nothing here is written to any database table.

   The connection is meant to live for the whole visit (not
   just while the Battle tab is open). It rebuilds itself
   when the socket drops, when the tab wakes up, and when the
   network comes back, so rolls always resume on the same feed.
   ========================================================= */

const CHANNEL_NAME = "paradise-hotel-battle-grounds";
const MAX_BACKOFF_MS = 15_000;
const HEALTH_CHECK_MS = 5_000;

export type PresenceInfo = {
  clientId: string;
  name: string;
  isDM: boolean;
  /** true while that person has the Battle Grounds tab open */
  inBattle: boolean;
};

export type BattleEvent = string;
type Handler = (payload: any) => void;

function makeClientId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function useBattleChannel(
  self: { name: string; isDM: boolean },
  enabled = true
) {
  const clientId = useRef<string>(makeClientId());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlers = useRef<Map<BattleEvent, Set<Handler>>>(new Map());
  const reconnectRef = useRef<() => void>(() => {});

  const [connected, setConnected] = useState(false);
  const [present, setPresent] = useState<PresenceInfo[]>([]);
  const [inBattle, setInBattleState] = useState(false);

  // Keep the latest identity available to the subscribe callback.
  const selfRef = useRef(self);
  selfRef.current = self;
  const inBattleRef = useRef(inBattle);
  inBattleRef.current = inBattle;

  const info = useCallback(
    (): PresenceInfo => ({
      clientId: clientId.current,
      name: selfRef.current.name,
      isDM: selfRef.current.isDM,
      inBattle: inBattleRef.current,
    }),
    []
  );

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let attempt = 0;
    let retryTimer: number | undefined;
    let badSince = 0;

    const teardown = () => {
      const old = channelRef.current;
      channelRef.current = null;
      if (old) void supabase.removeChannel(old);
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      window.clearTimeout(retryTimer);
      const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt);
      attempt += 1;
      retryTimer = window.setTimeout(connect, delay);
    };

    function connect() {
      if (stopped) return;
      window.clearTimeout(retryTimer);
      teardown();

      const channel = supabase.channel(CHANNEL_NAME, {
        config: {
          broadcast: { self: false },
          presence: { key: clientId.current },
        },
      });
      channelRef.current = channel;

      channel.on("presence", { event: "sync" }, () => {
        if (channelRef.current !== channel) return;
        const state = channel.presenceState() as Record<string, PresenceInfo[]>;
        const list: PresenceInfo[] = [];
        for (const entries of Object.values(state)) {
          if (entries.length > 0) {
            list.push({ ...entries[entries.length - 1] });
          }
        }
        setPresent(list);
      });

      channel.on("broadcast", { event: "*" }, (message: any) => {
        const set = handlers.current.get(message.event);
        if (!set) return;
        set.forEach((fn) => fn(message.payload));
      });

      channel.subscribe(async (status) => {
        // Ignore callbacks from a channel we already replaced.
        if (stopped || channelRef.current !== channel) return;

        if (status === "SUBSCRIBED") {
          attempt = 0;
          badSince = 0;
          setConnected(true);
          await channel.track(info());
        } else if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          setConnected(false);
          scheduleReconnect();
        }
      });
    }

    reconnectRef.current = () => {
      attempt = 0;
      connect();
    };

    /* Come back to life when the tab wakes or the network returns. */
    const wake = () => {
      if (document.hidden) return;
      const channel = channelRef.current;
      if (!channel || channel.state !== "joined") {
        attempt = 0;
        connect();
      }
    };

    /* Catch silent drops (sleeping laptops, flaky mobile data). */
    const health = window.setInterval(() => {
      const channel = channelRef.current;
      if (!channel || document.hidden) return;

      if (channel.state === "joined") {
        badSince = 0;
        setConnected(true);
        return;
      }

      setConnected(false);
      if (channel.state === "closed" || channel.state === "errored") {
        if (!badSince) badSince = Date.now();
        if (Date.now() - badSince > HEALTH_CHECK_MS) {
          badSince = 0;
          connect();
        }
      }
    }, HEALTH_CHECK_MS);

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    window.addEventListener("focus", wake);

    connect();

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      window.clearInterval(health);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("focus", wake);
      reconnectRef.current = () => {};
      teardown();
      setConnected(false);
      setPresent([]);
    };
  }, [enabled, info]);

  // Re-announce if the name, DM flag or Battle tab state changes.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !connected) return;
    void channel.track(info());
  }, [self.name, self.isDM, inBattle, connected, info]);

  /** Returns false when the message could not be sent right now. */
  const send = useCallback((event: BattleEvent, payload: unknown) => {
    const channel = channelRef.current;
    if (!channel || channel.state !== "joined") return false;
    void channel.send({ type: "broadcast", event, payload });
    return true;
  }, []);

  const on = useCallback((event: BattleEvent, fn: Handler) => {
    let set = handlers.current.get(event);
    if (!set) {
      set = new Set();
      handlers.current.set(event, set);
    }
    set.add(fn);
    return () => {
      set!.delete(fn);
    };
  }, []);

  /** Manually rebuild the connection (the "Reconnect" action). */
  const resume = useCallback(() => reconnectRef.current(), []);

  const setInBattle = useCallback((value: boolean) => {
    setInBattleState(value);
  }, []);

  const battlers = present.filter((p) => p.inBattle);
  const dmOnline = present.some((p) => p.isDM);
  const sessionActive = battlers.some((p) => p.isDM);
  const participantCount = battlers.filter((p) => !p.isDM).length;

  return {
    clientId: clientId.current,
    connected,
    present: battlers,
    dmOnline,
    sessionActive,
    participantCount,
    send,
    on,
    resume,
    setInBattle,
  };
}

export type BattleLink = ReturnType<typeof useBattleChannel>;