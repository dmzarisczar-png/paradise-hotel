import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { supabase } from "./supabase";

/* =========================================================
   PERSONALITY FILES
   - PersonalityFileRoom : GM tab ("File Room"), one file per guest
   - usePlayerFile       : player-side hook (returns released parts only)
   - PersonalityFileView : what the player reads in their Room
   ========================================================= */

const C = {
  panel: "rgba(20, 24, 21, .94)",
  gold: "#c8b991",
  goldBright: "#e4d19c",
  text: "#eee9dc",
  muted: "#9d9a8d",
  danger: "#a65b5b",
  green: "#8fae8f",
  border: "rgba(200,185,145,.24)",
};

/* ---------------------------------------------------------
   Section definitions, in release order (tier 1 to 5)
   --------------------------------------------------------- */

export type FileKey =
  | "header" | "classification"
  | "counterpartName" | "behavioral" | "function"
  | "awareness" | "assessment" | "dreadExposure" | "dreadlings"
  | "emergenceDate" | "origin" | "counterpartExplained" | "connections" | "memory"
  | "hostRelationship" | "dreadfuls" | "observations" | "emergenceTrigger" | "fronting" | "sealedAddendum";

type FieldDef = { k: string; label: string; multiline?: boolean; options?: string[] };

type SectionDef = {
  key: FileKey;
  tier: 1 | 2 | 3 | 4 | 5;
  label: string;
  kind: "fields" | "list";
  fields?: FieldDef[];
  doormanOnly?: boolean;
};

export const TIER_NAMES = ["", "Surface", "Recognition", "Unease", "Revelation", "Truth"];

const TEXT: FieldDef[] = [{ k: "text", label: "Text", multiline: true }];
const NOTE: FieldDef[] = [{ k: "note", label: "GM note shown with the auto text (optional)", multiline: true }];

export const SECTIONS: SectionDef[] = [
  { key: "header", tier: 1, label: "Header", kind: "fields", fields: [
    { k: "personalityNo", label: "Personality No." },
    { k: "apparentAge", label: "Apparent age" },
  ] },
  { key: "classification", tier: 1, label: "Classification and status", kind: "fields", fields: [
    { k: "status", label: "Status", options: ["Active", "Dormant", "Suppressed", "Fragmented", "Integrated"] },
    { k: "integrity", label: "Record integrity", options: ["Intact", "Partial", "Partial, disputed", "Corrupted"] },
  ] },
  { key: "counterpartName", tier: 2, label: "Clinical counterpart (name)", kind: "fields", fields: NOTE },
  { key: "behavioral", tier: 2, label: "Behavioral profile", kind: "fields", fields: TEXT },
  { key: "function", tier: 2, label: "Function within the system", kind: "fields", fields: TEXT },
  { key: "awareness", tier: 3, label: "Awareness", kind: "fields", fields: [
    { k: "value", label: "Awareness", options: ["Unaware", "Suspecting", "Aware"] },
  ] },
  { key: "assessment", tier: 3, label: "Assessment summary", kind: "fields", fields: TEXT },
  { key: "dreadExposure", tier: 3, label: "Dread exposure", kind: "fields", fields: TEXT },
  { key: "dreadlings", tier: 3, label: "Associated Dreadlings", kind: "list" },
  { key: "emergenceDate", tier: 4, label: "Date of emergence", kind: "fields", fields: [{ k: "text", label: "Date or estimated period" }] },
  { key: "origin", tier: 4, label: "Origin and emergence", kind: "fields", fields: TEXT },
  { key: "counterpartExplained", tier: 4, label: "Clinical counterpart (explained)", kind: "fields", fields: NOTE },
  { key: "connections", tier: 4, label: "Personality connections", kind: "list" },
  { key: "memory", tier: 4, label: "Memory profile", kind: "fields", fields: [
    { k: "retained", label: "Retained", multiline: true },
    { k: "missing", label: "Missing", multiline: true },
    { k: "withheld", label: "Withheld", multiline: true },
  ] },
  { key: "hostRelationship", tier: 5, label: "Relationship with the host", kind: "fields", fields: TEXT },
  { key: "dreadfuls", tier: 5, label: "Associated Dreadfuls", kind: "list" },
  { key: "observations", tier: 5, label: "Clinical observations", kind: "list" },
  { key: "emergenceTrigger", tier: 5, label: "Emergence trigger", kind: "fields", fields: [{ k: "text", label: "The exact moment (one line)" }] },
  { key: "fronting", tier: 5, label: "Fronting authority (Gatekeeper)", kind: "fields", fields: NOTE, doormanOnly: true },
  { key: "sealedAddendum", tier: 5, label: "Sealed addendum", kind: "fields", fields: TEXT },
];

/* ---------------------------------------------------------
   Hotel role to clinical counterpart
   --------------------------------------------------------- */

const COUNTERPARTS: Record<string, { name: string; line: string; link?: string }> = {
  Caretaker: { name: "Caregiver", line: "Soothes and tends to distressed parts of the system." },
  Dreamer: { name: "Coping Personality", line: "Absorbs pain through fantasy, distance, or imagination." },
  Guardian: { name: "Protector", line: "Stands between the system and perceived danger." },
  Adversary: { name: "Persecutor", line: "Hostile, often replaying harm the system once endured." },
  Archivist: { name: "Memory Keeper", line: "Holds experiences the rest of the system cannot." },
  Diplomat: { name: "Social Personality", line: "Handles the outside world and relationships on the system's behalf." },
  Watcher: {
    name: "Internal Regulation Personality",
    line: "Keeps an eye on the order and safety of the whole system.",
    link: "Works alongside Maintenance to keep order.",
  },
  Vessel: {
    name: "Host / Co-host",
    line: "Fronts for the system and shares control.",
    link: "Fronting may be overridden by the Gatekeeper.",
  },
  Timekeeper: { name: "Timekeeper", line: "Tracks time, gaps, and lost periods." },
  Doorman: {
    name: "Gatekeeper",
    line:
      "Controls internal travel between areas of the system, sets the boundaries between them, and governs which memories may come forward.",
    link: "Controls which parts reach the front. See Vessel, Overseer.",
  },
  Overseer: {
    name: "Area Caregiver",
    line: "Looks after an entire region of the internal world.",
    link: "Area access is set by the Gatekeeper.",
  },
  "Mnēmosynē": {
    name: "Lead Memory Keeper",
    line: "The original Memory Keeper, who oversees all the others.",
    link: "Leads the Archivists.",
  },
  Maintenance: {
    name: "Correction Personality",
    line:
      "Guides personalities that are no longer needed to fall asleep, and repairs the system's internal issues alongside Watchers and Internal Regulation Personalities.",
    link: "Works alongside Watchers.",
  },
};

const FRONTING_TEXT =
  "Holds the authority to decide who fronts for the system, and can hold a personality back or push another forward when needed.";

/* ---------------------------------------------------------
   Types and helpers
   --------------------------------------------------------- */

type Entry = {
  id: string;
  released: boolean;
  detail: boolean;
  ref: string;
  [field: string]: any;
};

export type FileRow = {
  character_id: string;
  released: boolean;
  content: Record<string, any>;
  visible: Record<string, boolean>;
  teasers: Record<string, string>;
  gm_notes: string;
  release_log: { at: string; key: string; on: boolean }[];
  updated_at?: string;
};

export type PlayerFile = {
  released: true;
  visible: Record<string, boolean>;
  content: Record<string, any>;
  teasers: Record<string, string>;
  updatedAt: string;
};

type GuestLike = {
  id?: string;
  name?: string;
  room?: string | number;
  role?: string;
  role2?: string;
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const hasDoorman = (g: GuestLike) => g.role === "Doorman" || g.role2 === "Doorman";

const applicableSections = (g: GuestLike) =>
  SECTIONS.filter((s) => !s.doormanOnly || hasDoorman(g));

function blankRow(guest: GuestLike, index: number): FileRow {
  return {
    character_id: String(guest.id),
    released: false,
    content: { header: { personalityNo: String(index + 1).padStart(3, "0") } },
    visible: {},
    teasers: {},
    gm_notes: "",
    release_log: [],
  };
}

const fieldStyle: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  background: "rgba(0,0,0,.28)",
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
};

const smallBtn: CSSProperties = {
  padding: "7px 12px",
  background: "transparent",
  border: `1px solid ${C.border}`,
  color: C.goldBright,
  fontSize: 11,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: C.gold,
  fontSize: 10,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  marginBottom: 5,
};

/* =========================================================
   PLAYER SIDE
   ========================================================= */

export function usePlayerFile(characterId: string, active: boolean) {
  const [file, setFile] = useState<PlayerFile | null>(null);
  const [seen, setSeen] = useState("");

  const seenKey = `ph-file-seen:${characterId}`;

  const load = useCallback(async () => {
    if (!characterId) {
      setFile(null);
      return;
    }
    const { data, error } = await supabase.rpc("player_personality_file", {
      p_character_id: String(characterId),
    });
    if (error) {
      console.warn("Personality file load:", error.message);
      return;
    }
    setFile((data as PlayerFile | null) ?? null);
  }, [characterId]);

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(seenKey) ?? "");
    } catch {
      setSeen("");
    }
    void load();
  }, [load, seenKey]);

  useEffect(() => {
    if (!characterId || !active) return;
    const refresh = () => {
      if (!document.hidden) void load();
    };
    const timer = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [characterId, active, load]);

  const markSeen = useCallback(() => {
    if (!file) return;
    try {
      localStorage.setItem(seenKey, file.updatedAt);
    } catch {
      /* ignore */
    }
    setSeen(file.updatedAt);
  }, [file, seenKey]);

  return { file, unread: !!file && seen !== file.updatedAt, markSeen, reload: load };
}

function Redacted({ teaser }: { teaser?: string }) {
  const bar = (w: string): CSSProperties => ({
    height: 11,
    width: w,
    background: C.text,
    opacity: 0.8,
    borderRadius: 2,
  });
  return (
    <div>
      <div style={{ display: "grid", gap: 7 }}>
        <div style={bar("92%")} />
        <div style={bar("78%")} />
        <div style={bar("55%")} />
      </div>
      {teaser ? (
        <p style={{ margin: "10px 0 0", color: C.muted, fontStyle: "italic", fontSize: 12 }}>{teaser}</p>
      ) : null}
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ padding: "16px 0", borderTop: `1px solid ${C.border}` }}>
      <div style={{ ...labelStyle, fontSize: 11, marginBottom: 8 }}>{title}</div>
      {children}
    </section>
  );
}

const bodyText: CSSProperties = {
  margin: 0,
  color: C.text,
  lineHeight: 1.75,
  fontSize: 14,
  whiteSpace: "pre-wrap",
};

const RELIABILITY_COLOR: Record<string, string> = {
  Confirmed: "#8fae8f",
  Disputed: "#d0a85c",
  Retracted: "#c87979",
};

function EntryList({ entries, render }: { entries: Entry[]; render: (e: Entry) => ReactNode }) {
  if (!entries.length) return <p style={{ ...bodyText, color: C.muted }}>No entries.</p>;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {entries.map((e) => (
        <div
          key={e.id}
          style={{ padding: 14, border: `1px solid ${C.border}`, background: "rgba(0,0,0,.12)" }}
        >
          {e.detail === false ? (
            <>
              <div style={{ color: C.goldBright, fontSize: 14, marginBottom: 10 }}>{e.ref || "Unnamed entry"}</div>
              <Redacted />
            </>
          ) : (
            render(e)
          )}
        </div>
      ))}
    </div>
  );
}

function renderSection(key: FileKey, d: any, guest: GuestLike): ReactNode {
  const roles = [guest.role, guest.role2].filter(Boolean) as string[];
  const text = (v?: string) => <p style={bodyText}>{v || "—"}</p>;

  switch (key) {
    case "header":
      return null; // drawn in the page header
    case "classification":
      return null;
    case "counterpartName":
      return (
        <>
          {roles.map((r) =>
            COUNTERPARTS[r] ? (
              <div key={r} style={{ marginBottom: 8, color: C.text }}>
                <span style={{ color: C.muted }}>{r}</span> → {COUNTERPARTS[r].name}
              </div>
            ) : null
          )}
          {d?.note ? text(d.note) : null}
        </>
      );
    case "counterpartExplained":
      return (
        <>
          {roles.map((r) =>
            COUNTERPARTS[r] ? (
              <div key={r} style={{ marginBottom: 12 }}>
                <div style={{ color: C.goldBright }}>{COUNTERPARTS[r].name}</div>
                <p style={bodyText}>{COUNTERPARTS[r].line}</p>
                {COUNTERPARTS[r].link ? (
                  <p style={{ ...bodyText, color: C.muted, fontStyle: "italic", fontSize: 13 }}>
                    {COUNTERPARTS[r].link}
                  </p>
                ) : null}
              </div>
            ) : null
          )}
          {d?.note ? text(d.note) : null}
        </>
      );
    case "fronting":
      return (
        <>
          <p style={bodyText}>{FRONTING_TEXT}</p>
          {d?.note ? <div style={{ marginTop: 10 }}>{text(d.note)}</div> : null}
        </>
      );
    case "awareness":
      return text(d?.value);
    case "memory":
      return (
        <div style={{ display: "grid", gap: 12 }}>
          {[
            ["Retained", d?.retained],
            ["Missing", d?.missing],
            ["Withheld", d?.withheld],
          ].map(([label, v]) => (
            <div key={label}>
              <div style={{ color: C.goldBright, fontSize: 13, marginBottom: 3 }}>{label}</div>
              {text(v)}
            </div>
          ))}
        </div>
      );
    case "connections":
      return (
        <EntryList
          entries={d || []}
          render={(e) => (
            <>
              <div style={{ color: C.goldBright, marginBottom: 6 }}>
                {e.ref || "Connection"}
                {e.name ? ` · ${e.name}` : ""}
                {e.type ? <span style={{ color: C.muted }}> · {e.type}</span> : null}
              </div>
              {e.knows ? <p style={bodyText}>{e.knows}</p> : null}
              {e.denies ? (
                <p style={{ ...bodyText, color: C.muted, fontStyle: "italic", marginTop: 8 }}>
                  {e.denies}
                </p>
              ) : null}
            </>
          )}
        />
      );
    case "dreadlings":
      return (
        <EntryList
          entries={d || []}
          render={(e) => (
            <div style={{ display: "flex", gap: 14 }}>
              {e.imageUrl ? (
                <img
                  src={e.imageUrl}
                  alt=""
                  style={{ width: 64, height: 64, objectFit: "cover", border: `1px solid ${C.border}` }}
                />
              ) : null}
              <div>
                <div style={{ color: C.goldBright, marginBottom: 4 }}>
                  {e.name || "Unnamed"}
                  {e.relation ? <span style={{ color: C.muted }}> · {e.relation}</span> : null}
                </div>
                {e.note ? <p style={bodyText}>{e.note}</p> : null}
              </div>
            </div>
          )}
        />
      );
    case "dreadfuls":
      return (
        <EntryList
          entries={d || []}
          render={(e) => (
            <>
              <div style={{ color: C.goldBright, marginBottom: 4 }}>
                {e.name || "Unnamed"}
                <span style={{ color: C.muted }}>
                  {" "}· Corruption {e.corruptionLevel ?? 0} · {e.isRestored ? "Restored" : "Not restored"}
                </span>
              </div>
              {e.note ? <p style={bodyText}>{e.note}</p> : null}
            </>
          )}
        />
      );
    case "observations":
      return (
        <EntryList
          entries={d || []}
          render={(e) => (
            <>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>
                {[e.clinician, e.date].filter(Boolean).join(" · ") || "Entry"}
                {e.reliability ? (
                  <span
                    style={{
                      marginLeft: 10,
                      color: RELIABILITY_COLOR[e.reliability] || C.muted,
                      border: `1px solid ${RELIABILITY_COLOR[e.reliability] || C.border}`,
                      padding: "1px 7px",
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  >
                    {e.reliability}
                  </span>
                ) : null}
              </div>
              <p style={bodyText}>{e.text}</p>
            </>
          )}
        />
      );
    default:
      return text(d?.text);
  }
}

export function PersonalityFileView({ file, guest }: { file: PlayerFile; guest: GuestLike }) {
  const header = file.content.header;
  const cls = file.content.classification;
  const sections = applicableSections(guest).filter(
    (s) => s.key !== "header" && s.key !== "classification"
  );

  return (
    <article
      style={{
        marginTop: 16,
        padding: "28px 28px 22px",
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        color: C.text,
      }}
    >
      <div style={{ ...labelStyle, fontSize: 11, letterSpacing: ".22em" }}>
        Paradise Hotel · Confidential · Psychiatric case file
      </div>
      <h2 style={{ margin: "6px 0 18px", color: C.goldBright, fontWeight: 400, fontSize: 26 }}>
        Individual Personality Record
      </h2>

      {file.visible.header ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {[
            ["Personality No.", header?.personalityNo],
            ["Name", guest.name],
            ["Room", guest.room],
            ["Apparent age", header?.apparentAge],
          ].map(([l, v]) => (
            <div key={String(l)} style={{ padding: "9px 11px", background: "rgba(0,0,0,.2)" }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>{l}</div>
              <div>{v || "—"}</div>
            </div>
          ))}
        </div>
      ) : file.teasers.header !== undefined ? (
        <Redacted teaser={file.teasers.header} />
      ) : null}

      {file.visible.classification ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 10 }}>
          {[
            ["Hotel role", [guest.role, guest.role2].filter(Boolean).join(" + ")],
            ["Status", cls?.status],
            ["Record integrity", cls?.integrity],
          ].map(([l, v]) => (
            <div key={String(l)} style={{ padding: "9px 11px", background: "rgba(0,0,0,.2)" }}>
              <div style={{ ...labelStyle, marginBottom: 3 }}>{l}</div>
              <div>{v || "—"}</div>
            </div>
          ))}
        </div>
      ) : file.teasers.classification !== undefined ? (
        <div style={{ marginTop: 10 }}>
          <Redacted teaser={file.teasers.classification} />
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        {sections.map((s) => {
          if (file.visible[s.key]) {
            return (
              <Block key={s.key} title={s.label}>
                {renderSection(s.key, file.content[s.key], guest)}
              </Block>
            );
          }
          if (file.teasers[s.key] !== undefined) {
            return (
              <Block key={s.key} title={s.label}>
                <Redacted teaser={file.teasers[s.key]} />
              </Block>
            );
          }
          return null;
        })}
      </div>

      <div
        style={{
          marginTop: 8,
          paddingTop: 12,
          borderTop: `1px solid ${C.border}`,
          color: C.muted,
          fontSize: 12,
        }}
      >
        Host system: Allan · Record maintained by the clinician on file
      </div>
    </article>
  );
}

/* =========================================================
   GM SIDE
   ========================================================= */

const RELATIONS = ["born from", "feeds on", "mimics", "guards against"];
const CONN_TYPES = ["Ally", "Rival", "Protector", "Mirror", "Split from", "Replaced by", "Unknown"];
const RELIABILITY = ["Confirmed", "Disputed", "Retracted"];

/* Text box that grows to fit its content, so short entries leave no empty space. */
function AutoText({
  value,
  onChange,
  min = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el || !el.offsetParent) return; // hidden inside a closed section
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    fit();
  }, [value, fit]);

  // Re-fit when a closed section is opened (width goes from 0 to something).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== lastWidth) {
        lastWidth = el.clientWidth;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <textarea
      ref={ref}
      rows={Math.min(min, 2)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...fieldStyle, resize: "none", overflow: "hidden", lineHeight: 1.5 }}
    />
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {multiline ? (
        <AutoText value={value} min={rows} onChange={onChange} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} style={fieldStyle} />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldStyle, colorScheme: "dark" }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: C.text }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

const rowGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 10,
};
const fullRow: CSSProperties = { gridColumn: "1 / -1" };

function ListEditor({
  section,
  entries,
  onChange,
  guest,
  allGuests,
  rows,
  dreadlings,
  dreadfuls,
}: {
  section: SectionDef;
  entries: Entry[];
  onChange: (next: Entry[]) => void;
  guest: GuestLike;
  allGuests: GuestLike[];
  rows: Record<string, FileRow>;
  dreadlings: any[];
  dreadfuls: any[];
}) {
  const key = section.key;

  const add = (extra?: Partial<Entry>) => {
    const base: Entry = {
      id: newId(),
      released: false,
      detail: key === "observations",
      ref: "",
    };
    const defaults: Record<string, Record<string, any>> = {
      connections: { guestId: "", name: "", type: "Unknown", knows: "", denies: "" },
      dreadlings: { forgeId: "", name: "", imageUrl: "", relation: "born from", note: "" },
      dreadfuls: { forgeId: "", name: "", corruptionLevel: 0, isRestored: false, note: "" },
      observations: { clinician: "", date: "", text: "", reliability: "Confirmed" },
    };
    onChange([...entries, { ...base, ...defaults[key], ...extra }]);
  };

  const set = (id: string, patch: Partial<Entry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const pullDreadfuls = () => {
    const linked = dreadfuls.filter((d) => d.originalGuestId === guest.id);
    const known = new Set(entries.map((e) => e.forgeId));
    const fresh = linked.filter((d) => !known.has(d.id));
    if (!fresh.length) {
      window.alert("No new Dreadfuls are linked to this guest in the Forge.");
      return;
    }
    onChange([
      ...entries,
      ...fresh.map(
        (d): Entry => ({
          id: newId(),
          released: false,
          detail: false,
          ref: "",
          forgeId: d.id,
          name: d.name || "",
          corruptionLevel: d.corruptionLevel ?? 0,
          isRestored: !!d.isRestored,
          note: "",
        })
      ),
    ]);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {entries.map((e) => (
        <div
          key={e.id}
          style={{
            display: "grid",
            gap: 10,
            padding: 12,
            border: `1px solid ${C.border}`,
            background: "rgba(0,0,0,.12)",
          }}
        >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Check checked={e.released} onChange={(v) => set(e.id, { released: v })}>
              {key === "observations" ? "Released" : "Released (shows it exists)"}
            </Check>
            {key !== "observations" && (
              <Check checked={e.detail} onChange={(v) => set(e.id, { detail: v })}>
                Show detail
              </Check>
            )}
            <button
              type="button"
              style={{ ...smallBtn, color: "#c87979", borderColor: "rgba(180,70,70,.55)", marginLeft: "auto" }}
              onClick={() => onChange(entries.filter((x) => x.id !== e.id))}
            >
              Remove
            </button>
          </div>

          <div style={rowGrid}>
            {key !== "observations" && (
              <div style={fullRow}>
                <TextField
                  label="Reference line (all the player sees before detail is released)"
                  value={e.ref}
                  onChange={(v) => set(e.id, { ref: v })}
                />
              </div>
            )}

            {key === "connections" && (
              <>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Linked guest (optional)</span>
                  <select
                    value={e.guestId}
                    onChange={(ev) => {
                      const g = allGuests.find((x) => String(x.id) === ev.target.value);
                      const no = g ? rows[String(g.id)]?.content?.header?.personalityNo : "";
                      set(e.id, {
                        guestId: ev.target.value,
                        name: g?.name || e.name,
                        ref: e.ref || (no ? `See Personality ${no}` : e.ref),
                      });
                    }}
                    style={{ ...fieldStyle, colorScheme: "dark" }}
                  >
                    <option value="">Not a guest / free text</option>
                    {allGuests
                      .filter((g) => g.id && g.id !== guest.id)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} (Room {g.room})
                        </option>
                      ))}
                  </select>
                </label>
                <TextField label="Name shown" value={e.name} onChange={(v) => set(e.id, { name: v })} />
                <SelectField label="Connection type" value={e.type} options={CONN_TYPES} onChange={(v) => set(e.id, { type: v })} />
                <div style={fullRow}>
                  <TextField label="What this personality knows" value={e.knows} multiline onChange={(v) => set(e.id, { knows: v })} />
                </div>
                <div style={fullRow}>
                  <TextField label="What the other would deny" value={e.denies} multiline onChange={(v) => set(e.id, { denies: v })} />
                </div>
              </>
            )}

            {key === "dreadlings" && (
              <>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Dreadling from the Forge</span>
                  <select
                    value={e.forgeId}
                    onChange={(ev) => {
                      const d = dreadlings.find((x) => x.id === ev.target.value);
                      set(e.id, {
                        forgeId: ev.target.value,
                        name: d?.name || e.name,
                        imageUrl: d?.imageUrl || e.imageUrl,
                      });
                    }}
                    style={{ ...fieldStyle, colorScheme: "dark" }}
                  >
                    <option value="">Free text (not built yet)</option>
                    {dreadlings.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name || "Unnamed"}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField label="Name shown" value={e.name} onChange={(v) => set(e.id, { name: v })} />
                <SelectField label="Relationship" value={e.relation} options={RELATIONS} onChange={(v) => set(e.id, { relation: v })} />
                <div style={fullRow}>
                  <TextField label="Note" value={e.note} multiline onChange={(v) => set(e.id, { note: v })} />
                </div>
              </>
            )}

            {key === "dreadfuls" && (
              <>
                <TextField label="Name shown" value={e.name} onChange={(v) => set(e.id, { name: v })} />
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Corruption level</span>
                  <input
                    type="number"
                    min={0}
                    value={e.corruptionLevel}
                    onChange={(ev) => set(e.id, { corruptionLevel: Math.max(0, Number(ev.target.value) || 0) })}
                    style={fieldStyle}
                  />
                </label>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
                  <Check checked={!!e.isRestored} onChange={(v) => set(e.id, { isRestored: v })}>
                    Restored
                  </Check>
                </div>
                <div style={fullRow}>
                  <TextField label="Relationship note" value={e.note} multiline onChange={(v) => set(e.id, { note: v })} />
                </div>
              </>
            )}

            {key === "observations" && (
              <>
                <TextField label="Clinician" value={e.clinician} onChange={(v) => set(e.id, { clinician: v })} />
                <TextField label="Date" value={e.date} onChange={(v) => set(e.id, { date: v })} />
                <SelectField label="Reliability" value={e.reliability} options={RELIABILITY} onChange={(v) => set(e.id, { reliability: v })} />
                <div style={fullRow}>
                  <TextField label="Entry" value={e.text} multiline onChange={(v) => set(e.id, { text: v })} />
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={smallBtn} onClick={() => add()}>
          + Add entry
        </button>
        {key === "dreadfuls" && (
          <button type="button" style={smallBtn} onClick={pullDreadfuls}>
            Pull linked Dreadfuls from the Forge
          </button>
        )}
      </div>
    </div>
  );
}

function FileEditor({
  guest,
  index,
  row,
  rows,
  allGuests,
  dreadlings,
  dreadfuls,
  onSaved,
}: {
  guest: GuestLike;
  index: number;
  row?: FileRow;
  rows: Record<string, FileRow>;
  allGuests: GuestLike[];
  dreadlings: any[];
  dreadfuls: any[];
  onSaved: (row: FileRow) => void;
}) {
  const [draft, setDraft] = useState<FileRow>(() => row ?? blankRow(guest, index));
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const dirty = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const sections = useMemo(() => applicableSections(guest), [guest]);

  const persist = useCallback(
    async (d: FileRow) => {
      const stamped = { ...d, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from("personality_files")
        .upsert(stamped, { onConflict: "character_id" });
      if (error) {
        console.error("Personality file save:", error);
        return false;
      }
      onSaved(stamped);
      return true;
    },
    [onSaved]
  );

  const patch = (fn: (d: FileRow) => FileRow) => {
    dirty.current = true;
    setStatus("pending");
    setDraft(fn);
  };

  useEffect(() => {
    if (!dirty.current) return;
    const t = window.setTimeout(async () => {
      setStatus("saving");
      const ok = await persist(draftRef.current);
      if (ok) dirty.current = false;
      setStatus(ok ? "saved" : "error");
    }, 700);
    return () => window.clearTimeout(t);
  }, [draft, persist]);

  useEffect(
    () => () => {
      if (dirty.current) void persist(draftRef.current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setVisible = (key: string, on: boolean) =>
    patch((d) => ({
      ...d,
      visible: { ...d.visible, [key]: on },
      release_log: [...d.release_log, { at: new Date().toISOString(), key, on }].slice(-40),
    }));

  const setField = (key: string, field: string, value: any) =>
    patch((d) => ({
      ...d,
      content: { ...d.content, [key]: { ...(d.content[key] || {}), [field]: value } },
    }));

  const setTeaser = (key: string, value: string | undefined) =>
    patch((d) => {
      const teasers = { ...d.teasers };
      if (value === undefined) delete teasers[key];
      else teasers[key] = value;
      return { ...d, teasers };
    });

  const next = sections.find((s) => !draft.visible[s.key]);

  const releaseNext = () => {
    if (!next) return;
    patch((d) => ({
      ...d,
      released: true,
      visible: { ...d.visible, [next.key]: true },
      release_log: [...d.release_log, { at: new Date().toISOString(), key: next.key, on: true }].slice(-40),
    }));
  };

  const releasedCount = sections.filter((s) => draft.visible[s.key]).length;
  const sectionLabel = (k: string) => SECTIONS.find((s) => s.key === k)?.label ?? k;

  return (
    <div style={{ marginTop: 14, padding: 20, border: `1px solid ${C.border}`, background: "rgba(0,0,0,.18)" }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <Check
          checked={draft.released}
          onChange={(v) =>
            patch((d) => ({
              ...d,
              released: v,
              release_log: [...d.release_log, { at: new Date().toISOString(), key: "file", on: v }].slice(-40),
            }))
          }
        >
          <b style={{ fontWeight: 600 }}>File released</b> (the File tab appears in their room)
        </Check>
        <button type="button" style={smallBtn} onClick={releaseNext} disabled={!next}>
          {next ? `Release next: ${next.label}` : "Everything released"}
        </button>
        <span style={{ color: C.muted, fontSize: 12 }}>
          {releasedCount} of {sections.length} sections released ·{" "}
          {status === "saved" && "All changes saved"}
          {status === "pending" && "Unsaved…"}
          {status === "saving" && "Saving…"}
          {status === "error" && <span style={{ color: "#e07a7a" }}>Not saved yet</span>}
        </span>
      </div>

      {[1, 2, 3, 4, 5].map((tier) => {
        const inTier = sections.filter((s) => s.tier === tier);
        if (!inTier.length) return null;
        return (
          <div key={tier} style={{ marginBottom: 18 }}>
            <div style={{ ...labelStyle, fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              Tier {tier} · {TIER_NAMES[tier]}
            </div>

            {inTier.map((s) => {
              const on = !!draft.visible[s.key];
              const teaser = draft.teasers[s.key];
              return (
                <details key={s.key} style={{ borderBottom: `1px solid ${C.border}`, padding: "10px 0" }}>
                  <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, listStyle: "none" }}>
                    <span style={{ color: on ? C.green : C.muted, fontSize: 11, minWidth: 66 }}>
                      {on ? "Released" : "Sealed"}
                    </span>
                    <span style={{ color: C.text, flex: 1 }}>{s.label}</span>
                    <span onClick={(ev) => ev.stopPropagation()}>
                      <Check checked={on} onChange={(v) => setVisible(s.key, v)}>
                        Release
                      </Check>
                    </span>
                  </summary>

                  <div style={{ display: "grid", gap: 10, padding: "10px 0 4px" }}>
                    {!on && (
                      <div>
                        <Check checked={teaser !== undefined} onChange={(v) => setTeaser(s.key, v ? "" : undefined)}>
                          Show a sealed placeholder to the player
                        </Check>
                      </div>
                    )}
                    {!on && teaser !== undefined && (
                      <TextField
                        label="Teaser line (optional)"
                        value={teaser}
                        onChange={(v) => setTeaser(s.key, v)}
                      />
                    )}

                    {s.kind === "fields" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: 10,
                        }}
                      >
                      {s.fields?.map((f) => (
                        <div
                          key={f.k}
                          style={{ gridColumn: s.fields && s.fields.length === 1 ? "1 / -1" : undefined }}
                        >
                        {f.options ? (
                          <SelectField
                            key={f.k}
                            label={f.label}
                            value={draft.content[s.key]?.[f.k] ?? ""}
                            options={f.options}
                            onChange={(v) => setField(s.key, f.k, v)}
                          />
                        ) : (
                          <TextField
                            key={f.k}
                            label={f.label}
                            multiline={f.multiline}
                            value={draft.content[s.key]?.[f.k] ?? ""}
                            onChange={(v) => setField(s.key, f.k, v)}
                          />
                        )}
                        </div>
                      ))}
                      </div>
                    )}

                    {s.key === "counterpartName" || s.key === "counterpartExplained" || s.key === "fronting" ? (
                      <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
                        The role counterpart text is filled in automatically from their Hotel roles.
                      </p>
                    ) : null}

                    {s.kind === "list" && (
                      <ListEditor
                        section={s}
                        entries={(draft.content[s.key] as Entry[]) || []}
                        onChange={(nextEntries) =>
                          patch((d) => ({ ...d, content: { ...d.content, [s.key]: nextEntries } }))
                        }
                        guest={guest}
                        allGuests={allGuests}
                        rows={rows}
                        dreadlings={dreadlings}
                        dreadfuls={dreadfuls}
                      />
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        );
      })}

      <TextField
        label="Private GM notes"
        value={draft.gm_notes}
        multiline
        rows={3}
        onChange={(v) => patch((d) => ({ ...d, gm_notes: v }))}
      />

      {draft.release_log.length > 0 && (
        <div style={{ marginTop: 6, color: C.muted, fontSize: 12, lineHeight: 1.7 }}>
          <div style={labelStyle}>Release log</div>
          {[...draft.release_log].reverse().slice(0, 6).map((l, i) => (
            <div key={i}>
              {new Date(l.at).toLocaleString()} · {l.key === "file" ? "File" : sectionLabel(l.key)} ·{" "}
              {l.on ? "released" : "sealed"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PersonalityFileRoom({
  guests,
  dreadlings,
  dreadfuls,
}: {
  guests: GuestLike[];
  dreadlings: any[];
  dreadfuls: any[];
}) {
  const [rows, setRows] = useState<Record<string, FileRow>>({});
  const [openId, setOpenId] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("personality_files").select("*");
    if (error) {
      setLoadError(error.message);
      return;
    }
    setLoadError("");
    const map: Record<string, FileRow> = {};
    (data ?? []).forEach((r: any) => {
      map[String(r.character_id)] = {
        character_id: String(r.character_id),
        released: !!r.released,
        content: r.content ?? {},
        visible: r.visible ?? {},
        teasers: r.teasers ?? {},
        gm_notes: r.gm_notes ?? "",
        release_log: Array.isArray(r.release_log) ? r.release_log : [],
        updated_at: r.updated_at,
      };
    });
    setRows(map);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const list = useMemo(
    () =>
      guests
        .filter((g) => g.id && g.name?.trim())
        .sort((a, b) => Number(a.room) - Number(b.room)),
    [guests]
  );

  const onSaved = useCallback((row: FileRow) => {
    setRows((prev) => ({ ...prev, [row.character_id]: row }));
  }, []);

  return (
    <section style={{ marginTop: 16, padding: 28, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10 }}>
      <div style={{ ...labelStyle, fontSize: 11, letterSpacing: ".2em" }}>Records · Memory</div>
      <h2 style={{ margin: "6px 0 4px", color: C.goldBright, fontWeight: 400, fontSize: 30 }}>File Room</h2>
      <p style={{ margin: "0 0 18px", color: C.muted, maxWidth: 620, lineHeight: 1.6 }}>
        One personality file per guest. Releasing a file makes a File tab appear in their room. Sections are
        released in tier order, and each section can also be released or sealed on its own.
      </p>

      {loadError && (
        <p style={{ color: "#e07a7a" }}>
          Could not load files: {loadError}. Has personality_files.sql been run?
        </p>
      )}

      {list.length === 0 ? (
        <p style={{ color: C.muted }}>No guests have checked in yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 14 }}>
          {list.map((g, i) => {
            const row = rows[String(g.id)];
            const sections = applicableSections(g);
            const count = row ? sections.filter((s) => row.visible[s.key]).length : 0;
            const state = !row ? "Not created" : row.released ? "Released" : "Hidden";
            const isOpen = openId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setOpenId(isOpen ? "" : String(g.id))}
                style={{
                  textAlign: "left",
                  padding: 16,
                  background: isOpen ? "rgba(200,185,145,.12)" : "rgba(255,255,255,.025)",
                  border: `1px solid ${isOpen ? C.gold : C.border}`,
                  color: C.text,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ color: C.muted, fontSize: 11, letterSpacing: ".14em" }}>
                  ROOM {String(g.room).padStart(3, "0")}
                </div>
                <div style={{ color: C.goldBright, fontSize: 20, margin: "4px 0 8px" }}>{g.name}</div>
                <div style={{ fontSize: 12, color: state === "Released" ? C.green : C.muted }}>
                  {state}
                  {row ? ` · ${count}/${sections.length} sections` : ""}
                </div>
                <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,.08)" }}>
                  <div
                    style={{
                      height: 4,
                      width: `${row ? (count / sections.length) * 100 : 0}%`,
                      background: C.gold,
                    }}
                  />
                </div>
                <span style={{ display: "none" }}>{i}</span>
              </button>
            );
          })}
        </div>
      )}

      {openId &&
        (() => {
          const idx = list.findIndex((g) => String(g.id) === openId);
          const g = list[idx];
          if (!g) return null;
          return (
            <FileEditor
              key={openId}
              guest={g}
              index={idx}
              row={rows[openId]}
              rows={rows}
              allGuests={list}
              dreadlings={dreadlings}
              dreadfuls={dreadfuls}
              onSaved={onSaved}
            />
          );
        })()}
    </section>
  );
}