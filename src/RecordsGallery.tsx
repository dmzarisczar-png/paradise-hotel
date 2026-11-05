import { useMemo, useState } from "react";
import type { ReactNode } from "react";

/* =========================================================
   RECORDS — the Hotel's gallery of anomalies
   Every dreadling, dreadful and strange event the guests have
   faced, hung as a framed exhibit. Open one for its full file.

   Data is the existing `anomalies` table, untouched: App.tsx
   still loads, autosaves and deletes it. This file only shows
   and edits it through the callbacks it is given.
   ========================================================= */

export type EncounterRec = {
  id: string;
  label: string;
  notes: string;
  author: string;
};

export type AnomalyRec = {
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
  encounters: EncounterRec[];
  totemName: string;
  totemDescription: string;
  totemUses: number;
};

type Status = AnomalyRec["status"];
type View = { k: "home" } | { k: "open"; id: string } | { k: "edit"; id: string };

type Props = {
  anomalies: AnomalyRec[];
  onAdd: () => string;
  onUpdate: (id: string, changes: Partial<AnomalyRec>) => void;
  onDelete: (id: string) => void;
  onAddEncounter: (anomalyId: string) => void;
  onUpdateEncounter: (anomalyId: string, encounterId: string, changes: Partial<EncounterRec>) => void;
  onRemoveEncounter: (anomalyId: string, encounterId: string) => void;
  onBack: () => void;
  onRoom: () => void;
};

const STATUSES: Status[] = ["Active", "Dormant", "Destroyed"];

/* ---------- small helpers ---------- */

const kindOf = (a: AnomalyRec) => (a.nature || "").trim() || "Unclassified";
const nameOf = (a: AnomalyRec) => (a.name || "").trim() || (a.title || "").trim() || "Unnamed Record";
const initialOf = (s: string) => (s.trim()[0] || "?").toUpperCase();
const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

/* ---------- pieces ---------- */

function Sigil({ label }: { label: string }) {
  return (
    <div className="rg-sigil" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
      <span>{initialOf(label)}</span>
    </div>
  );
}

function Picture({ src, label }: { src: string; label: string }) {
  const [bad, setBad] = useState(false);
  const url = (src || "").trim();
  return (
    <div className="rg-pic">
      {url && !bad ? <img src={url} alt={label} onError={() => setBad(true)} /> : <Sigil label={label} />}
    </div>
  );
}

function StatusTag({ status }: { status: Status }) {
  return <span className={"rg-status is-" + status.toLowerCase()}>{status}</span>;
}

function Lbl({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <label className="rg-lbl">
      <span className="rg-lbl-t">{title}</span>
      {children}
      {hint && <span className="rg-hint">{hint}</span>}
    </label>
  );
}

function Plate({
  a,
  onOpen,
}: {
  a: AnomalyRec;
  onOpen?: () => void;
}) {
  return (
    <button type="button" className={"rg-plate is-" + a.status.toLowerCase()} onClick={onOpen} disabled={!onOpen}>
      <div className="rg-frame">
        <Picture key={a.portrait} src={a.portrait} label={nameOf(a)} />
        <StatusTag status={a.status} />
        {a.status === "Destroyed" && <span className="rg-stamp">Destroyed</span>}
      </div>
      <div className="rg-plaque">
        <div className="rg-kind">{kindOf(a)}</div>
        <div className="rg-name">{nameOf(a)}</div>
        {a.title.trim() && a.name.trim() && <div className="rg-alias">{a.title}</div>}
        <div className="rg-foot">
          <span className="rg-num">{plural(a.encounters.length, "encounter")}</span>
        </div>
      </div>
    </button>
  );
}

/* ---------- the component ---------- */

export default function RecordsGallery({
  anomalies,
  onAdd,
  onUpdate,
  onDelete,
  onAddEncounter,
  onUpdateEncounter,
  onRemoveEncounter,
  onBack,
  onRoom,
}: Props) {
  const [view, setView] = useState<View>({ k: "home" });
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sort, setSort] = useState<"new" | "az">("new");

  const kinds = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>();
    anomalies.forEach((a) => {
      const k = kindOf(a);
      const e = m.get(k.toLowerCase());
      if (e) e.n += 1;
      else m.set(k.toLowerCase(), { label: k, n: 1 });
    });
    return [...m.entries()].sort((x, y) => y[1].n - x[1].n || x[1].label.localeCompare(y[1].label));
  }, [anomalies]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = anomalies.filter((a) => {
      if (kind !== "all" && kindOf(a).toLowerCase() !== kind) return false;
      if (status !== "all" && a.status !== status) return false;
      if (!s) return true;
      return (
        [a.name, a.title, a.nature, a.location, a.role, a.note].some((v) => (v || "").toLowerCase().includes(s)) ||
        a.encounters.some((e) => (e.label || "").toLowerCase().includes(s) || (e.notes || "").toLowerCase().includes(s))
      );
    });
    return sort === "az" ? [...out].sort((x, y) => nameOf(x).localeCompare(nameOf(y))) : [...out].reverse();
  }, [anomalies, q, kind, status, sort]);

  const count = (s: Status) => anomalies.filter((a) => a.status === s).length;
  const current = view.k === "home" ? undefined : anomalies.find((a) => a.id === view.id);
  const startNew = () => setView({ k: "edit", id: onAdd() });

  /* ===================== EDITOR ===================== */
  if (view.k === "edit" && current) {
    const a = current;
    const set = (changes: Partial<AnomalyRec>) => onUpdate(a.id, changes);

    return (
      <Shell>
        <div className="rg-bar">
          <button type="button" className="ph-btn" onClick={() => setView({ k: "open", id: a.id })}>
            Done
          </button>
          <button type="button" className="ph-btn ph-btn-secondary" onClick={() => setView({ k: "home" })}>
            Gallery
          </button>
        </div>

        <div className="rg-editor">
          <aside className="rg-side">
            <Plate a={a} />
            <p className="rg-hint rg-center">Live preview of the exhibit.</p>
          </aside>

          <section className="rg-panel rg-form">
            <h2 className="rg-form-title">Edit Record</h2>

            <div className="rg-two">
              <Lbl title="Name">
                <input value={a.name} onChange={(e) => set({ name: e.target.value })} placeholder="What do the guests call it?" />
              </Lbl>
              <Lbl title="Title / Alias">
                <input value={a.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. The Weeping Concierge" />
              </Lbl>
              <Lbl title="Nature" hint="Dreadling, Dreadful, Event, Object… anything. Used for the gallery filters.">
                <input list="rg-natures" value={a.nature} onChange={(e) => set({ nature: e.target.value })} placeholder="Dreadling" />
                <datalist id="rg-natures">
                  {["Dreadling", "Dreadful", "Event", "Object", "Location", ...kinds.map(([, v]) => v.label)]
                    .filter((v, i, all) => all.indexOf(v) === i)
                    .map((v) => (
                      <option key={v} value={v} />
                    ))}
                </datalist>
              </Lbl>
              <Lbl title="Location">
                <input value={a.location} onChange={(e) => set({ location: e.target.value })} placeholder="Where was it found?" />
              </Lbl>
              <Lbl title="Role">
                <input value={a.role} onChange={(e) => set({ role: e.target.value })} placeholder="What does it do in the Hotel?" />
              </Lbl>
              <Lbl title="Portrait" hint="Paste an image link.">
                <input value={a.portrait} onChange={(e) => set({ portrait: e.target.value })} placeholder="Paste image URL…" />
              </Lbl>
            </div>

            <div className="rg-lbl">
              <span className="rg-lbl-t">Status</span>
              <div className="rg-seg">
                {STATUSES.map((s) => (
                  <button key={s} type="button" className={a.status === s ? "is-on" : ""} onClick={() => set({ status: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Lbl title="Field Notes" hint="Known behavior, warnings, theories, anything the Hotel has on record.">
              <textarea rows={6} value={a.note} onChange={(e) => set({ note: e.target.value })} placeholder="Describe the anomaly…" />
            </Lbl>

            <div className="rg-lbl">
              <span className="rg-lbl-t">Encounters</span>
              {a.encounters.length === 0 && <span className="rg-hint">No encounters recorded yet.</span>}
              <div className="rg-enc-list">
                {a.encounters.map((en, i) => (
                  <div key={en.id} className="rg-enc-edit">
                    <div className="rg-enc-head">
                      <b>Encounter {i + 1}</b>
                      <button type="button" className="rg-x" onClick={() => onRemoveEncounter(a.id, en.id)}>
                        Remove
                      </button>
                    </div>
                    <div className="rg-two">
                      <Lbl title="Title or date">
                        <input value={en.label} onChange={(e) => onUpdateEncounter(a.id, en.id, { label: e.target.value })} placeholder="Encounter title or date" />
                      </Lbl>
                      <Lbl title="Recorded by">
                        <input value={en.author} onChange={(e) => onUpdateEncounter(a.id, en.id, { author: e.target.value })} placeholder="Who recorded this?" />
                      </Lbl>
                    </div>
                    <Lbl title="What happened?">
                      <textarea rows={4} value={en.notes} onChange={(e) => onUpdateEncounter(a.id, en.id, { notes: e.target.value })} placeholder="What happened?" />
                    </Lbl>
                  </div>
                ))}
              </div>
              <div>
                <button type="button" className="ph-btn ph-btn-secondary" onClick={() => onAddEncounter(a.id)}>
                  + Add Encounter
                </button>
              </div>
            </div>

            <div className="rg-two">
              <Lbl title="Totem Name">
                <input value={a.totemName} onChange={(e) => set({ totemName: e.target.value })} placeholder="Optional" />
              </Lbl>
              <Lbl title="Totem Uses">
                <input
                  type="number"
                  min={0}
                  value={a.totemUses}
                  onChange={(e) => set({ totemUses: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Lbl>
            </div>
            <Lbl title="Totem Description">
              <textarea rows={3} value={a.totemDescription} onChange={(e) => set({ totemDescription: e.target.value })} placeholder="What does the totem do?" />
            </Lbl>

            <div className="rg-danger">
              <button type="button" className="ph-btn ph-btn-secondary" onClick={() => onDelete(a.id)}>
                Delete Record
              </button>
            </div>
          </section>
        </div>
      </Shell>
    );
  }

  /* ===================== EXHIBIT ===================== */
  if (view.k === "open" && current) {
    const a = current;
    const idx = list.findIndex((x) => x.id === a.id);
    const prev = idx > 0 ? list[idx - 1] : undefined;
    const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined;
    const hasTotem = !!(a.totemName.trim() || a.totemDescription.trim());

    return (
      <Shell>
        <div className="rg-bar">
          <button type="button" className="ph-btn ph-btn-secondary" onClick={() => setView({ k: "home" })}>
            Gallery
          </button>
          <div className="rg-pager">
            <button type="button" aria-label="Previous record" disabled={!prev} onClick={() => prev && setView({ k: "open", id: prev.id })}>
              ←
            </button>
            <span className="rg-num">{idx >= 0 ? `${idx + 1} / ${list.length}` : "—"}</span>
            <button type="button" aria-label="Next record" disabled={!next} onClick={() => next && setView({ k: "open", id: next.id })}>
              →
            </button>
          </div>
          <button type="button" className="ph-btn" onClick={() => setView({ k: "edit", id: a.id })}>
            Edit
          </button>
        </div>

        <div className={"rg-file is-" + a.status.toLowerCase()}>
          <aside className="rg-side">
            <div className="rg-plate rg-plate-big">
              <div className="rg-frame">
                <Picture key={a.portrait} src={a.portrait} label={nameOf(a)} />
                <StatusTag status={a.status} />
                {a.status === "Destroyed" && <span className="rg-stamp">Destroyed</span>}
              </div>
            </div>

            {hasTotem && (
              <div className="rg-panel rg-totem">
                <div className="rg-eyebrow">Totem</div>
                <div className="rg-totem-name">{a.totemName.trim() || "Unnamed Totem"}</div>
                {a.totemDescription.trim() && <p className="rg-pre">{a.totemDescription}</p>}
                <div className="rg-num rg-uses">
                  Uses <b>{a.totemUses}</b>
                </div>
              </div>
            )}
          </aside>

          <div className="rg-main">
            <header className="rg-panel rg-head">
              <div className="rg-eyebrow">{kindOf(a)}</div>
              <h1 className="rg-h1">{nameOf(a)}</h1>
              {a.title.trim() && a.name.trim() && <div className="rg-alias rg-alias-big">{a.title}</div>}
              <div className="rg-meta">
                <StatusTag status={a.status} />
                {a.location.trim() && (
                  <span>
                    <i>Location</i> {a.location}
                  </span>
                )}
                {a.role.trim() && (
                  <span>
                    <i>Role</i> {a.role}
                  </span>
                )}
                <span className="rg-num">
                  <i>Encounters</i> {a.encounters.length}
                </span>
              </div>
            </header>

            <section className="rg-liner">
              <div className="rg-sub">Field Notes</div>
              {a.note.trim() ? <p className="rg-pre rg-notes">{a.note}</p> : <p className="rg-faint">Nothing has been written about this yet.</p>}

              <div className="rg-sub">Encounters</div>
              {a.encounters.length === 0 ? (
                <p className="rg-faint">No encounters have been recorded.</p>
              ) : (
                <ol className="rg-tl">
                  {a.encounters.map((en, i) => (
                    <li key={en.id}>
                      <div className="rg-tl-head">
                        <b className="rg-ow">{en.label.trim() || `Encounter ${i + 1}`}</b>
                        {en.author.trim() && <span>recorded by {en.author}</span>}
                      </div>
                      {en.notes.trim() && <p className="rg-pre">{en.notes}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </Shell>
    );
  }

  /* ===================== GALLERY ===================== */
  return (
    <Shell>
      <header className="rg-panel rg-top">
        <div>
          <div className="rg-eyebrow">Paradise Hotel</div>
          <h1 className="rg-title">Records</h1>
          <p className="rg-muted">Every dreadling, dreadful and strange event the Hotel has on record, kept on the wall.</p>
        </div>
        <div className="rg-top-right">
          <div className="rg-counts">
            <div>
              <strong>{anomalies.length}</strong>
              <span>Records</span>
            </div>
            <div>
              <strong>{count("Active")}</strong>
              <span>Active</span>
            </div>
            <div>
              <strong>{count("Destroyed")}</strong>
              <span>Destroyed</span>
            </div>
          </div>
          <button type="button" className="ph-btn" onClick={startNew}>
            + New Record
          </button>
        </div>
      </header>

      <section className="rg-panel rg-tools">
        <input className="rg-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, nature, location, notes, encounters…" aria-label="Search records" />

        <div className="rg-filter">
          <span className="rg-lbl-t">Kind</span>
          <div className="rg-chips">
            <button type="button" className={"rg-chip" + (kind === "all" ? " is-on" : "")} onClick={() => setKind("all")}>
              All
            </button>
            {kinds.map(([key, v]) => (
              <button key={key} type="button" className={"rg-chip" + (kind === key ? " is-on" : "")} onClick={() => setKind(key)}>
                {v.label} <small>{v.n}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="rg-filter">
          <span className="rg-lbl-t">Status</span>
          <div className="rg-chips">
            <button type="button" className={"rg-chip" + (status === "all" ? " is-on" : "")} onClick={() => setStatus("all")}>
              Any
            </button>
            {STATUSES.map((s) => (
              <button key={s} type="button" className={"rg-chip" + (status === s ? " is-on" : "")} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
            <span className="rg-spacer" />
            <button type="button" className={"rg-chip" + (sort === "new" ? " is-on" : "")} onClick={() => setSort("new")}>
              Newest
            </button>
            <button type="button" className={"rg-chip" + (sort === "az" ? " is-on" : "")} onClick={() => setSort("az")}>
              A–Z
            </button>
          </div>
        </div>
      </section>

      {anomalies.length === 0 ? (
        <div className="rg-empty">
          <p>The wall is bare. Nothing has been recorded yet.</p>
          <button type="button" className="ph-btn" onClick={startNew}>
            + Record the first anomaly
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="rg-empty">
          <p>No record matches those filters.</p>
          <button
            type="button"
            className="ph-btn ph-btn-secondary"
            onClick={() => {
              setQ("");
              setKind("all");
              setStatus("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="rg-grid">
          {list.map((a) => (
            <Plate key={a.id} a={a} onOpen={() => setView({ k: "open", id: a.id })} />
          ))}
        </div>
      )}

      <div className="rg-bar rg-bar-end">
        <button type="button" className="ph-btn ph-btn-secondary" onClick={onBack}>
          Home
        </button>
        <button type="button" className="ph-btn ph-btn-secondary" onClick={onRoom}>
          My Room
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="rg-page">
      <style>{RG_CSS}</style>
      <div className="rg-wrap">{children}</div>
    </main>
  );
}

const RG_CSS = `
.rg-page, .rg-page * { box-sizing: border-box; }
.rg-page { min-height: 100vh; padding: 32px 24px 96px; }
.rg-wrap { width: min(1320px, 100%); margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; }

.rg-panel, .rg-liner {
  position: relative; min-width: 0; padding: 28px;
  background: var(--corners), var(--stone);
  border: 1px solid #060504; border-radius: var(--radius-lg); box-shadow: var(--frame);
}

.rg-eyebrow, .rg-lbl-t, .rg-sub {
  color: var(--brass); font-family: var(--font-body); font-size: 11px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
}
.rg-muted { margin: 6px 0 0; color: var(--ash); max-width: 640px; }
.rg-hint { color: var(--ash); font-size: 12px; font-weight: 400; letter-spacing: normal; text-transform: none; }
.rg-center { text-align: center; }
.rg-ow { overflow-wrap: anywhere; }
.rg-pre { white-space: pre-wrap; overflow-wrap: anywhere; }
.rg-faint { color: var(--parch-mute); font-style: italic; margin: 0 0 20px; }
.rg-num, .rg-counts strong, .rg-chip small, .rg-uses b {
  font-family: var(--font-body); font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1;
}

/* ---------- gallery header ---------- */
.rg-top { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; }
.rg-title, .rg-h1, .rg-form-title {
  margin: 6px 0 4px !important; color: var(--brass-hi) !important; font-family: var(--font-display) !important;
  font-weight: 600 !important; line-height: 1.05; overflow-wrap: anywhere;
}
.rg-title { font-size: 44px !important; }
.rg-h1 { font-size: 40px !important; }
.rg-form-title { font-size: 30px !important; margin: 0 !important; }
.rg-top-right { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.rg-counts { display: flex; gap: 10px; }
.rg-counts div { display: grid; gap: 2px; min-width: 88px; padding: 10px 14px; text-align: center; background: var(--tile); border: 1px solid var(--line); }
.rg-counts strong { color: var(--brass-hi); font-size: 26px; line-height: 1; }
.rg-counts span { color: var(--ash); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; }

/* ---------- filters ---------- */
.rg-tools { display: grid; gap: 14px; padding: 20px 24px; }
.rg-filter { display: grid; gap: 8px; min-width: 0; }
.rg-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.rg-spacer { flex: 1 1 12px; }
.rg-chip {
  display: inline-flex; align-items: center; gap: 8px; min-height: 38px; padding: 6px 14px; cursor: pointer;
  color: var(--bone-soft); background: rgba(0,0,0,0.3); border: 1px solid var(--line); border-radius: var(--radius-sm);
  font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  overflow-wrap: anywhere; text-align: left;
}
.rg-chip small { color: var(--brass); font-size: 11px; }
.rg-chip.is-on { color: var(--brass-hi); border-color: var(--brass-mid); background: linear-gradient(180deg, rgba(140,29,19,0.4), rgba(0,0,0,0.3)); }
@media (hover: hover) { .rg-chip:hover { border-color: var(--brass-mid); color: var(--bone); } }

/* ---------- the wall ---------- */
.rg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 26px 22px; align-items: stretch; }

.rg-plate {
  position: relative; display: flex; flex-direction: column; width: 100%; min-width: 0; margin: 0; padding: 10px; text-align: left; color: inherit;
  cursor: pointer; appearance: none; -webkit-appearance: none;
  background: linear-gradient(145deg, #2d2418, #14100b); border: 1px solid #060504; border-radius: 3px;
  box-shadow: 0 0 0 1px var(--brass-dim), 0 0 0 4px #0d0907, 0 0 0 5px rgba(211,169,91,0.28), 0 14px 26px rgba(0,0,0,0.55);
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.rg-plate:disabled { cursor: default; opacity: 1; }
.rg-plate-big { cursor: default; }
@media (hover: hover) {
  .rg-plate:not(:disabled):hover {
    transform: translateY(-4px);
    box-shadow: 0 0 0 1px var(--brass-mid), 0 0 0 4px #0d0907, 0 0 0 5px rgba(211,169,91,0.4), 0 18px 32px rgba(0,0,0,0.6), 0 0 28px rgba(208,71,46,0.25);
  }
}
.rg-plate:focus-visible { outline: 2px solid var(--brass-hi); outline-offset: 6px; }

.rg-frame { position: relative; border: 1px solid var(--line-strong); background: #0c0a08; }
.rg-pic { position: relative; aspect-ratio: 4 / 5; overflow: hidden; background: radial-gradient(circle at 50% 38%, #2a2016, #0b0907 72%); }
.rg-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
.rg-pic::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 46px rgba(0,0,0,0.65); }
.rg-sigil { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; gap: 8px; color: var(--brass-dim); }
.rg-sigil svg { width: 64px; height: 64px; opacity: 0.8; }
.rg-sigil span { font-family: var(--font-display); font-size: 40px; font-weight: 600; opacity: 0.55; line-height: 1; }

.is-dormant .rg-pic img, .is-dormant .rg-pic { filter: saturate(0.55) brightness(0.9); }
.is-destroyed .rg-pic img, .is-destroyed .rg-pic { filter: grayscale(1) contrast(1.05) brightness(0.7); }

.rg-status {
  display: inline-flex; align-items: center; gap: 7px; padding: 4px 10px; color: var(--bone-soft);
  background: rgba(0,0,0,0.65); border: 1px solid var(--line-strong);
  font-family: var(--font-body); font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
}
.rg-frame > .rg-status { position: absolute; top: 8px; left: 8px; z-index: 2; }
.rg-status::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.rg-status.is-active { color: var(--ember-hi); border-color: rgba(208,71,46,0.6); }
.rg-status.is-active::before { box-shadow: 0 0 8px var(--ember-hi); }
.rg-status.is-dormant { color: var(--brass); }
.rg-status.is-destroyed { color: var(--ash); }

.rg-stamp {
  position: absolute; left: 50%; top: 50%; z-index: 2; padding: 4px 14px; transform: translate(-50%, -50%) rotate(-16deg);
  color: var(--ember-hi); border: 2px solid var(--ember-hi); background: rgba(0,0,0,0.4); pointer-events: none;
  font-family: var(--font-caps); font-size: 18px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
}

.rg-plaque { display: grid; flex: 1; align-content: start; grid-template-rows: auto auto auto 1fr; gap: 4px; padding: 12px 4px 4px; min-width: 0; }
.rg-kind { color: var(--brass); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; overflow-wrap: anywhere; }
.rg-name { color: var(--brass-hi); font-family: var(--font-display); font-size: 24px; font-weight: 600; line-height: 1.1; overflow-wrap: anywhere; text-shadow: 0 1px 0 #000; }
.rg-alias { color: var(--ash); font-style: italic; font-size: 15px; overflow-wrap: anywhere; }
.rg-alias-big { font-size: 20px; margin-bottom: 4px; }
.rg-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 8px; align-self: end; border-top: 1px solid var(--line); color: var(--ash); font-size: 12px; }


.rg-empty { display: grid; justify-items: center; gap: 12px; padding: 56px 20px; text-align: center; color: var(--ash); border: 1px dashed var(--line-strong); }
.rg-empty p { margin: 0; }

.rg-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.rg-bar-end { justify-content: center; margin-top: 6px; }

/* ---------- exhibit ---------- */
.rg-file { display: grid; grid-template-columns: minmax(260px, 380px) minmax(0, 1fr); gap: 26px; align-items: start; }
.rg-side { display: grid; gap: 18px; min-width: 0; position: sticky; top: 24px; }
.rg-main { display: grid; gap: 22px; min-width: 0; }
.rg-head { display: grid; gap: 4px; }
.rg-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; margin-top: 12px; color: var(--bone-soft); }
.rg-meta i { margin-right: 6px; color: var(--brass); font-style: normal; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.rg-meta span { overflow-wrap: anywhere; }

.rg-pager { display: inline-flex; align-items: center; gap: 12px; margin: 0 auto; }
.rg-pager button {
  display: inline-grid !important; place-items: center; width: 42px; height: 42px; padding: 0; cursor: pointer;
  color: var(--brass-hi); background: rgba(0,0,0,0.35); border: 1px solid var(--line); border-radius: var(--radius-sm); font-size: 20px;
}
.rg-pager button:disabled { opacity: 0.35; cursor: default; }
.rg-pager .rg-num { color: var(--brass); font-size: 12px; font-weight: 700; letter-spacing: 0.14em; }

.rg-totem { display: grid; gap: 8px; padding: 20px; }
.rg-totem-name { color: var(--brass-hi); font-family: var(--font-display); font-size: 24px; font-weight: 600; overflow-wrap: anywhere; }
.rg-totem p { margin: 0; color: var(--bone-soft); }
.rg-uses { color: var(--ash); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
.rg-uses b { margin-left: 6px; color: var(--brass-hi); font-size: 20px; }

/* parchment case file */
.rg-liner { padding: 30px 32px; background: linear-gradient(180deg, var(--parch), var(--parch-2)); color: var(--parch-ink); }
.rg-liner p { color: var(--parch-ink); }
.rg-sub { display: flex; align-items: center; gap: 10px; margin: 0 0 14px; color: var(--parch-head); }
.rg-sub::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(74,54,30,0.45), transparent); }
.rg-notes { margin: 0 0 28px; font-size: 19px; line-height: 1.65; }
.rg-tl { position: relative; margin: 0; padding: 0 0 0 26px; list-style: none; border-left: 1px solid var(--parch-line); display: grid; gap: 20px; }
.rg-tl li { position: relative; min-width: 0; }
.rg-tl li::before { content: ""; position: absolute; left: -31px; top: 6px; width: 9px; height: 9px; background: var(--parch-head); transform: rotate(45deg); }
.rg-tl-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.rg-tl-head b { color: var(--parch-head); font-size: 18px; }
.rg-tl-head span { color: var(--parch-mute); font-size: 13px; font-style: italic; }
.rg-tl p { margin: 6px 0 0; font-size: 17px; line-height: 1.6; }

/* ---------- editor ---------- */
.rg-editor { display: grid; grid-template-columns: minmax(240px, 320px) minmax(0, 1fr); gap: 26px; align-items: start; }
.rg-form { display: grid; gap: 22px; }
.rg-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.rg-lbl { display: grid; gap: 6px; min-width: 0; }
.rg-lbl input, .rg-lbl textarea { width: 100%; min-height: 44px; }
.rg-lbl textarea { line-height: 1.55; }
.rg-seg { display: inline-flex; flex-wrap: wrap; gap: 8px; }
.rg-seg button {
  min-height: 42px; padding: 8px 18px; cursor: pointer; color: var(--bone-soft); background: rgba(0,0,0,0.3);
  border: 1px solid var(--line); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
}
.rg-seg button.is-on { color: var(--brass-hi); border-color: var(--brass-mid); background: linear-gradient(180deg, rgba(140,29,19,0.4), rgba(0,0,0,0.3)); }
.rg-enc-list { display: grid; gap: 14px; }
.rg-enc-edit { display: grid; gap: 12px; padding: 16px; background: var(--tile); border: 1px solid var(--line); }
.rg-enc-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: var(--brass); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
.rg-x { padding: 4px 10px; cursor: pointer; color: var(--ember-hi); background: transparent; border: 1px solid rgba(208,71,46,0.5); border-radius: var(--radius-sm); font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.rg-danger { padding-top: 16px; border-top: 1px solid var(--line); }

/* ---------- phones ---------- */
@media (max-width: 900px) {
  .rg-file, .rg-editor { grid-template-columns: minmax(0, 1fr); }
  .rg-side { position: static; }
  .rg-file .rg-side, .rg-editor .rg-side { max-width: 380px; width: 100%; margin: 0 auto; }
}
@media (max-width: 720px) {
  .rg-page { padding: 16px 12px 88px; }
  .rg-wrap { gap: 16px; }
  .rg-panel { padding: 18px; }
  .rg-liner { padding: 20px; }
  .rg-tools { padding: 16px; }
  .rg-title { font-size: 36px !important; }
  .rg-h1 { font-size: 32px !important; }
  .rg-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; }
  .rg-plate { padding: 6px; }
  .rg-name { font-size: 19px; }
  .rg-alias { font-size: 13px; }
  .rg-stamp { font-size: 13px; padding: 3px 8px; }
  .rg-counts div { min-width: 0; padding: 8px 10px; }
  .rg-two { grid-template-columns: minmax(0, 1fr); }
  .rg-notes { font-size: 18px; }
  .rg-foot { flex-direction: column; align-items: flex-start; }
}
`;