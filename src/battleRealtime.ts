import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/* =========================================================
   BATTLE GROUNDS — EPHEMERAL REALTIME
   Uses Supabase Realtime Broadcast + Presence only.
   Nothing here is written to any database table.
   ========================================================= */

const CHANNEL_NAME = "paradise-hotel-battle-grounds";

export type PresenceInfo = {
  clientId: string;
  name: string;
  isDM: boolean;
};

export type BattleEvent = string;
type Handler = (payload: any) => void;

function makeClientId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function useBattleChannel(self: { name: string; isDM: boolean }) {
  const clientId = useRef<string>(makeClientId());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlers = useRef<Map<BattleEvent, Set<Handler>>>(new Map());

  const [connected, setConnected] = useState(false);
  const [present, setPresent] = useState<PresenceInfo[]>([]);

  // Keep the latest identity available to the subscribe callback.
  const selfRef = useRef(self);
  selfRef.current = self;

  useEffect(() => {
    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        broadcast: { self: false },
        presence: { key: clientId.current },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<
        string,
        PresenceInfo[]
      >;
      const list: PresenceInfo[] = [];
      for (const entries of Object.values(state)) {
        if (entries.length > 0) list.push(entries[0]);
      }
      setPresent(list);
    });

    channel.on("broadcast", { event: "*" }, (message: any) => {
      const set = handlers.current.get(message.event);
      if (!set) return;
      set.forEach((fn) => fn(message.payload));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setConnected(true);
        await channel.track({
          clientId: clientId.current,
          name: selfRef.current.name,
          isDM: selfRef.current.isDM,
        } satisfies PresenceInfo);
      } else if (
        status === "CLOSED" ||
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT"
      ) {
        setConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      setConnected(false);
      void supabase.removeChannel(channel);
    };
  }, []);

  // Re-announce if the name or DM flag changes.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !connected) return;
    void channel.track({
      clientId: clientId.current,
      name: self.name,
      isDM: self.isDM,
    } satisfies PresenceInfo);
  }, [self.name, self.isDM, connected]);

  const send = useCallback((event: BattleEvent, payload: unknown) => {
    const channel = channelRef.current;
    if (!channel) return;
    void channel.send({ type: "broadcast", event, payload });
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

  const sessionActive = present.some((p) => p.isDM);
  const participantCount = present.filter((p) => !p.isDM).length;

  return {
    clientId: clientId.current,
    connected,
    present,
    sessionActive,
    participantCount,
    send,
    on,
  };
}