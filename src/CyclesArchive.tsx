import { useMemo, useState } from "react";
import type { ReactNode } from "react";

/* =========================================================
   CYCLES & VINYL — session archive (cv-*)
   Cycle  = one session, shown as a track on the tracklist.
   Vinyl  = an ongoing plotline / character, shown as a record
            sleeve in the crate.
   Same data as before (cycles + vinyl_records tables).
   Tip for the DM: start any line of "What Happened" with "!"
   to flag it as a key event. It shows up on the Prep Sheet.
   ========================================================= */

export type CycleRec = {
  id: string;
  cycle: string;
  vinylRecord: string;
  whatHappened: string;
  imageUrl: string;
};

export type VinylRec = {
  id: string;
  vinyl: string;
  vinylRecord: string;
  imageUrl: string;
};

type Props = {
  canEdit: boolean;
  cycles: CycleRec[];
  vinyls: VinylRec[];
  onSaveCycle: (record: CycleRec) => Promise<boolean>;
  onDeleteCycle: (id: string) => Promise<boolean> | boolean | void;
  onSaveVinyl: (record: VinylRec) => Promise<boolean>;
  onDeleteVinyl: (id: string) => Promise<boolean> | boolean | void;
  onBack: () => void;
};

type View =
  | { k: "home" }
  | { k: "cycle"; id: string }
  | { k: "vinyl"; id: string }
  | { k: "editCycle"; id: string | null }
  | { k: "editVinyl"; id: string | null };

type Tab = "cycles" | "vinyl" | "prep";

/* ---------- helpers ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
const isKey = (line: string) => /^\s*!/.test(line);
const stripKey = (line: string) => line.replace(/^\s*!+\s*/, "");

function noteLines(text: string) {
  return (text || "").split(/\r?\n/).map((line) => ({ text: line, key: isKey(line) }));
}

function keyEvents(text: string): string[] {
  return noteLines(text)
    .filter((l) => l.key)
    .map((l) => stripKey(l.text).trim())
    .filter(Boolean);
}

function excerpt(text: string, max: number): string {
  const flat = noteLines(text)
    .map((l) => (l.key ? stripKey(l.text) : l.text))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? flat.slice(0, max).trimEnd() + "…" : flat;
}

function linkedVinyls(cycle: CycleRec, vinyls: VinylRec[]): VinylRec[] {
  const hay = (cycle.vinylRecord || "").toLowerCase();
  return vinyls.filter((v) => {
    const name = v.vinyl.trim().toLowerCase();
    return name && hay.includes(name);
  });
}

function cyclesFor(vinyl: VinylRec, cycles: CycleRec[]): CycleRec[] {
  const name = vinyl.vinyl.trim().toLowerCase();
  if (!name) return [];
  return cycles.filter((c) => (c.vinylRecord || "").toLowerCase().includes(name));
}

/* ---------- small visual pieces ---------- */

function Art({ src, alt, fallback }: { src: string; alt: string; fallback: ReactNode }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) return <>{fallback}</>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} />;
}

function Generated({ title }: { title: string }) {
  return (
    <div className="cv-gen">
      <span>Paradise Hotel Records</span>
      <b>{title || "Untitled"}</b>
      <i aria-hidden="true" />
    </div>
  );
}

function Disc({ img, title, spin }: { img: string; title: string; spin?: boolean }) {
  return (
    <div className={"cv-disc" + (spin ? " is-spin" : "")} aria-hidden="true">
      <div className="cv-disc-label">
        <Art
          src={img}
          alt=""
          fallback={<span>{(title || "PH").trim().slice(0, 2).toUpperCase()}</span>}
        />
      </div>
      <i className="cv-disc-hole" />
    </div>
  );
}

/* A record sleeve with the vinyl peeking out of its side. */
function Sleeve({ img, title, spin }: { img: string; title: string; spin?: boolean }) {
  return (
    <div className="cv-sleeve">
      <div className="cv-sleeve-disc">
        <Disc img={img} title={title} spin={spin} />
      </div>
      <div className="cv-sleeve-art">
        <Art src={img} alt={title} fallback={<Generated title={title} />} />
      </div>
    </div>
  );
}

function Chip({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  if (!onClick) return <span className="cv-chip">{children}</span>;
  return (
    <button
      type="button"
      className="cv-chip is-link"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function Notes({ text, empty }: { text: string; empty: string }) {
  const lines = noteLines(text);
  if (!text.trim()) return <p className="cv-muted">{empty}</p>;
  return (
    <div className="cv-notes">
      {lines.map((l, i) =>
        l.text.trim() === "" ? (
          <div key={i} className="cv-gap" />
        ) : l.key ? (
          <p key={i} className="is-key">
            <span aria-hidden="true">★</span>
            {stripKey(l.text)}
          </p>
        ) : (
          <p key={i}>{l.text}</p>
        )
      )}
    </div>
  );
}

/* =========================================================
   Main component
   ========================================================= */

export default function CyclesArchive({
  canEdit,
  cycles,
  vinyls,
  onSaveCycle,
  onDeleteCycle,
  onSaveVinyl,
  onDeleteVinyl,
  onBack,
}: Props) {
  const [view, setView] = useState<View>({ k: "home" });
  const [tab, setTab] = useState<Tab>("cycles");
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);

  const numbered = useMemo(
    () => cycles.map((c, i) => ({ c, n: i + 1 })),
    [cycles]
  );

  const go = (v: View) => {
    setView(v);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const latest = cycles.length ? cycles[cycles.length - 1] : null;
  const q = query.trim().toLowerCase();

  /* ---------- editors / detail pages ---------- */

  if (view.k === "editCycle") {
    const existing = view.id ? cycles.find((c) => c.id === view.id) || null : null;
    return (
      <Shell>
        <CycleEditor
          key={view.id || "new"}
          existing={existing}
          vinyls={vinyls}
          number={existing ? numbered.find((x) => x.c.id === existing.id)?.n || 0 : cycles.length + 1}
          onCancel={() => go(existing ? { k: "cycle", id: existing.id } : { k: "home" })}
          onSave={async (rec) => {
            const ok = await onSaveCycle(rec);
            if (ok) go({ k: "cycle", id: rec.id });
            return ok;
          }}
          onDelete={
            existing
              ? async () => {
                  if (!window.confirm("Delete this Cycle record?")) return;
                  await onDeleteCycle(existing.id);
                  go({ k: "home" });
                }
              : undefined
          }
        />
      </Shell>
    );
  }

  if (view.k === "editVinyl") {
    const existing = view.id ? vinyls.find((v) => v.id === view.id) || null : null;
    return (
      <Shell>
        <VinylEditor
          key={view.id || "new"}
          existing={existing}
          onCancel={() => {
            setTab("vinyl");
            go(existing ? { k: "vinyl", id: existing.id } : { k: "home" });
          }}
          onSave={async (rec) => {
            const ok = await onSaveVinyl(rec);
            if (ok) {
              setTab("vinyl");
              go({ k: "vinyl", id: rec.id });
            }
            return ok;
          }}
          onDelete={
            existing
              ? async () => {
                  if (!window.confirm("Delete this Vinyl record?")) return;
                  await onDeleteVinyl(existing.id);
                  setTab("vinyl");
                  go({ k: "home" });
                }
              : undefined
          }
        />
      </Shell>
    );
  }

  if (view.k === "cycle") {
    const idx = cycles.findIndex((c) => c.id === view.id);
    const cycle = idx >= 0 ? cycles[idx] : null;
    if (!cycle) {
      return (
        <Shell>
          <div className="cv-panel cv-center">
            <p className="cv-muted">That Cycle no longer exists.</p>
            <button type="button" className="ph-btn" onClick={() => go({ k: "home" })}>
              Back to the Record Room
            </button>
          </div>
        </Shell>
      );
    }
    const links = linkedVinyls(cycle, vinyls);
    const events = keyEvents(cycle.whatHappened);
    const prev = idx > 0 ? cycles[idx - 1] : null;
    const next = idx < cycles.length - 1 ? cycles[idx + 1] : null;
    return (
      <Shell>
        <div className="cv-topbar">
          <button type="button" className="ph-btn ph-btn-secondary" onClick={() => go({ k: "home" })}>
            ‹ Record Room
          </button>
          <span className="cv-eyebrow">Side A · Track {pad(idx + 1)} of {pad(cycles.length)}</span>
        </div>

        <div className="cv-detail">
          <aside className="cv-detail-side">
            <Sleeve img={cycle.imageUrl} title={cycle.cycle} spin />
            <div className="cv-meta">
              <div>
                <span>Track</span>
                <b>{pad(idx + 1)}</b>
              </div>
              <div>
                <span>Key events</span>
                <b>{events.length}</b>
              </div>
              <div>
                <span>Records</span>
                <b>{links.length}</b>
              </div>
            </div>
          </aside>

          <section className="cv-detail-main">
            <header className="cv-detail-head">
              <span className="cv-eyebrow">Cycle {pad(idx + 1)}</span>
              <h1>{cycle.cycle || "Untitled Cycle"}</h1>
              {canEdit && (
                <div className="cv-actions">
                  <button type="button" className="ph-btn" onClick={() => go({ k: "editCycle", id: cycle.id })}>
                    Edit Cycle
                  </button>
                  <button
                    type="button"
                    className="ph-btn ph-btn-secondary"
                    onClick={async () => {
                      if (!window.confirm("Delete this Cycle record?")) return;
                      await onDeleteCycle(cycle.id);
                      go({ k: "home" });
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </header>

            <div className="cv-block">
              <h3 className="cv-sub">Connected Vinyl</h3>
              {links.length > 0 && (
                <div className="cv-chips">
                  {links.map((v) => (
                    <Chip
                      key={v.id}
                      onClick={() => {
                        setTab("vinyl");
                        go({ k: "vinyl", id: v.id });
                      }}
                    >
                      ◉ {v.vinyl}
                    </Chip>
                  ))}
                </div>
              )}
              <p className="cv-muted cv-ow">
                {cycle.vinylRecord.trim() || "None linked."}
              </p>
            </div>

            {events.length > 0 && (
              <div className="cv-block cv-key">
                <h3 className="cv-sub">Key Events</h3>
                <ul>
                  {events.map((e, i) => (
                    <li key={i}>
                      <span aria-hidden="true">★</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="cv-block cv-liner">
              <h3 className="cv-sub is-dark">Liner Notes · What Happened</h3>
              <Notes text={cycle.whatHappened} empty="No session notes yet." />
            </div>

            <nav className="cv-pager" aria-label="Cycle navigation">
              <button
                type="button"
                disabled={!prev}
                onClick={() => prev && go({ k: "cycle", id: prev.id })}
              >
                <span>‹ Previous track</span>
                <b>{prev ? prev.cycle || "Untitled Cycle" : "Start of the record"}</b>
              </button>
              <button
                type="button"
                disabled={!next}
                onClick={() => next && go({ k: "cycle", id: next.id })}
              >
                <span>Next track ›</span>
                <b>{next ? next.cycle || "Untitled Cycle" : "End of the record"}</b>
              </button>
            </nav>
          </section>
        </div>
      </Shell>
    );
  }

  if (view.k === "vinyl") {
    const vinyl = vinyls.find((v) => v.id === view.id) || null;
    if (!vinyl) {
      return (
        <Shell>
          <div className="cv-panel cv-center">
            <p className="cv-muted">That Vinyl no longer exists.</p>
            <button type="button" className="ph-btn" onClick={() => go({ k: "home" })}>
              Back to the Record Room
            </button>
          </div>
        </Shell>
      );
    }
    const appears = cyclesFor(vinyl, cycles);
    const events = keyEvents(vinyl.vinylRecord);
    return (
      <Shell>
        <div className="cv-topbar">
          <button
            type="button"
            className="ph-btn ph-btn-secondary"
            onClick={() => {
              setTab("vinyl");
              go({ k: "home" });
            }}
          >
            ‹ Vinyl Collection
          </button>
          <span className="cv-eyebrow">Side B · Ongoing plot record</span>
        </div>

        <div className="cv-detail">
          <aside className="cv-detail-side">
            <Sleeve img={vinyl.imageUrl} title={vinyl.vinyl} spin />
            <div className="cv-meta">
              <div>
                <span>Appears in</span>
                <b>{appears.length}</b>
              </div>
              <div>
                <span>Key events</span>
                <b>{events.length}</b>
              </div>
            </div>
          </aside>

          <section className="cv-detail-main">
            <header className="cv-detail-head">
              <span className="cv-eyebrow">Vinyl record</span>
              <h1>{vinyl.vinyl || "Untitled Vinyl"}</h1>
              {canEdit && (
                <div className="cv-actions">
                  <button type="button" className="ph-btn" onClick={() => go({ k: "editVinyl", id: vinyl.id })}>
                    Edit Vinyl
                  </button>
                  <button
                    type="button"
                    className="ph-btn ph-btn-secondary"
                    onClick={async () => {
                      if (!window.confirm("Delete this Vinyl record?")) return;
                      await onDeleteVinyl(vinyl.id);
                      setTab("vinyl");
                      go({ k: "home" });
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </header>

            <div className="cv-block cv-liner">
              <h3 className="cv-sub is-dark">Plot Record</h3>
              <Notes text={vinyl.vinylRecord} empty="No plot notes yet." />
            </div>

            <div className="cv-block">
              <h3 className="cv-sub">Played in these Cycles</h3>
              {appears.length === 0 ? (
                <p className="cv-muted">
                  Not linked to any Cycle yet. Mention “{vinyl.vinyl}” in a Cycle’s Vinyl Record field to connect them.
                </p>
              ) : (
                <div className="cv-mini">
                  {appears.map((c) => (
                    <button key={c.id} type="button" onClick={() => go({ k: "cycle", id: c.id })}>
                      <b>{pad(cycles.indexOf(c) + 1)}</b>
                      <span>{c.cycle || "Untitled Cycle"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </Shell>
    );
  }

  /* ---------- home ---------- */

  const filteredCycles = numbered
    .filter(({ c }) =>
      !q ||
      [c.cycle, c.vinylRecord, c.whatHappened].some((s) => (s || "").toLowerCase().includes(q))
    )
    .sort((a, b) => (newestFirst ? b.n - a.n : a.n - b.n));

  const filteredVinyls = vinyls.filter(
    (v) => !q || [v.vinyl, v.vinylRecord].some((s) => (s || "").toLowerCase().includes(q))
  );

  const prepCycles = numbered
    .map(({ c, n }) => ({ c, n, events: keyEvents(c.whatHappened) }))
    .filter((x) => x.events.length > 0)
    .reverse();

  return (
    <Shell>
      <header className="cv-panel cv-head">
        <div>
          <span className="cv-eyebrow">Paradise Hotel · Session Archive</span>
          <h1 className="cv-title">Cycles &amp; Vinyl</h1>
          <p className="cv-muted">
            Every session pressed to a record. Every ongoing story kept in the crate.
          </p>
        </div>
        <div className="cv-head-right">
          <div className="cv-counts">
            <div>
              <strong>{cycles.length}</strong>
              <span>Cycles</span>
            </div>
            <div>
              <strong>{vinyls.length}</strong>
              <span>Vinyl</span>
            </div>
          </div>
          <button type="button" className="ph-btn ph-btn-secondary" onClick={onBack}>
            ‹ Back to Management
          </button>
        </div>
      </header>

      {/* NOW PLAYING */}
      <section className="cv-panel cv-now">
        <div className="cv-now-deck">
          <div className="cv-platter">
            <Disc img={latest?.imageUrl || ""} title={latest?.cycle || "PH"} spin={!!latest} />
            <div className={"cv-arm" + (latest ? " is-down" : "")} aria-hidden="true">
              <i />
            </div>
          </div>
        </div>
        <div className="cv-now-main">
          {latest ? (
            <>
              <span className="cv-eyebrow">▶ Now playing · Latest Cycle</span>
              <h2>{latest.cycle || "Untitled Cycle"}</h2>
              <p className="cv-recap cv-ow">
                {excerpt(latest.whatHappened, 320) || "No session notes yet."}
              </p>
              {linkedVinyls(latest, vinyls).length > 0 && (
                <div className="cv-chips">
                  {linkedVinyls(latest, vinyls).map((v) => (
                    <Chip
                      key={v.id}
                      onClick={() => {
                        setTab("vinyl");
                        go({ k: "vinyl", id: v.id });
                      }}
                    >
                      ◉ {v.vinyl}
                    </Chip>
                  ))}
                </div>
              )}
              <div className="cv-actions">
                <button type="button" className="ph-btn" onClick={() => go({ k: "cycle", id: latest.id })}>
                  Open Liner Notes
                </button>
                {canEdit && (
                  <button type="button" className="ph-btn ph-btn-secondary" onClick={() => go({ k: "editCycle", id: null })}>
                    + New Cycle
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="cv-eyebrow">The turntable is quiet</span>
              <h2>No Cycles recorded yet</h2>
              <p className="cv-recap">
                Press the first session to the record. Once you do, the latest Cycle plays here as a recap
                for your next session.
              </p>
              {canEdit && (
                <div className="cv-actions">
                  <button type="button" className="ph-btn" onClick={() => go({ k: "editCycle", id: null })}>
                    + Record the first Cycle
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* TABS */}
      <section className="cv-panel cv-library">
        <div className="cv-toolbar">
          <div className="cv-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "cycles"} className={tab === "cycles" ? "is-on" : ""} onClick={() => setTab("cycles")}>
              Tracklist <small>{cycles.length}</small>
            </button>
            <button type="button" role="tab" aria-selected={tab === "vinyl"} className={tab === "vinyl" ? "is-on" : ""} onClick={() => setTab("vinyl")}>
              Vinyl Crate <small>{vinyls.length}</small>
            </button>
            <button type="button" role="tab" aria-selected={tab === "prep"} className={tab === "prep" ? "is-on" : ""} onClick={() => setTab("prep")}>
              Prep Sheet
            </button>
          </div>

          {tab !== "prep" && (
            <div className="cv-tools">
              <input
                className="cv-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === "cycles" ? "Search cycles, notes, vinyl…" : "Search vinyl…"}
              />
              {tab === "cycles" && (
                <button type="button" className="ph-btn ph-btn-secondary cv-sort" onClick={() => setNewestFirst((v) => !v)}>
                  {newestFirst ? "Newest first" : "Oldest first"}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  className="ph-btn cv-add"
                  onClick={() => go(tab === "cycles" ? { k: "editCycle", id: null } : { k: "editVinyl", id: null })}
                >
                  {tab === "cycles" ? "+ Cycle" : "+ Vinyl"}
                </button>
              )}
            </div>
          )}
        </div>

        {tab === "cycles" && (
          <>
            {filteredCycles.length === 0 ? (
              <p className="cv-empty">{cycles.length === 0 ? "No Cycles recorded yet." : "Nothing matches that search."}</p>
            ) : (
              <ol className="cv-tracks">
                {filteredCycles.map(({ c, n }) => {
                  const links = linkedVinyls(c, vinyls);
                  const ev = keyEvents(c.whatHappened).length;
                  return (
                    <li key={c.id}>
                      <div
                        className="cv-track"
                        role="button"
                        tabIndex={0}
                        onClick={() => go({ k: "cycle", id: c.id })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            go({ k: "cycle", id: c.id });
                          }
                        }}
                      >
                        <span className="cv-track-n">{pad(n)}</span>
                        <div className="cv-track-art">
                          <Art src={c.imageUrl} alt="" fallback={<Disc img="" title={c.cycle} />} />
                        </div>
                        <div className="cv-track-main">
                          <strong>{c.cycle || "Untitled Cycle"}</strong>
                          <p>{excerpt(c.whatHappened, 170) || "No session notes yet."}</p>
                          <div className="cv-chips">
                            {links.length > 0
                              ? links.map((v) => (
                                  <Chip
                                    key={v.id}
                                    onClick={() => {
                                      setTab("vinyl");
                                      go({ k: "vinyl", id: v.id });
                                    }}
                                  >
                                    ◉ {v.vinyl}
                                  </Chip>
                                ))
                              : c.vinylRecord.trim() && <Chip>{c.vinylRecord.trim().slice(0, 60)}</Chip>}
                            {ev > 0 && <span className="cv-chip is-key">★ {ev} key</span>}
                          </div>
                        </div>
                        <span className="cv-track-go" aria-hidden="true">›</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}

        {tab === "vinyl" && (
          <>
            {filteredVinyls.length === 0 ? (
              <p className="cv-empty">{vinyls.length === 0 ? "No Vinyl records yet." : "Nothing matches that search."}</p>
            ) : (
              <div className="cv-crate">
                {filteredVinyls.map((v) => {
                  const count = cyclesFor(v, cycles).length;
                  return (
                    <div
                      key={v.id}
                      className="cv-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => go({ k: "vinyl", id: v.id })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          go({ k: "vinyl", id: v.id });
                        }
                      }}
                    >
                      <Sleeve img={v.imageUrl} title={v.vinyl} />
                      <div className="cv-card-body">
                        <strong>{v.vinyl || "Untitled Vinyl"}</strong>
                        <p>{excerpt(v.vinylRecord, 110) || "No plot notes yet."}</p>
                        <span className="cv-chip">{count} {count === 1 ? "cycle" : "cycles"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "prep" && (
          <div className="cv-prep">
            <div className="cv-prep-col">
              <h3 className="cv-sub">Key Events · newest first</h3>
              {prepCycles.length === 0 ? (
                <p className="cv-empty">
                  No key events flagged yet. Start any line of a Cycle’s “What Happened” with <b>!</b> and it will show up here.
                </p>
              ) : (
                prepCycles.map(({ c, n, events }) => (
                  <div key={c.id} className="cv-prep-group">
                    <button type="button" onClick={() => go({ k: "cycle", id: c.id })}>
                      <b>{pad(n)}</b>
                      <span>{c.cycle || "Untitled Cycle"}</span>
                    </button>
                    <ul>
                      {events.map((e, i) => (
                        <li key={i}>
                          <span aria-hidden="true">★</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="cv-prep-col">
              <h3 className="cv-sub">Plotlines in the crate</h3>
              {vinyls.length === 0 ? (
                <p className="cv-empty">No Vinyl records yet.</p>
              ) : (
                <div className="cv-plotlines">
                  {vinyls.map((v) => (
                    <button key={v.id} type="button" onClick={() => go({ k: "vinyl", id: v.id })}>
                      <strong>◉ {v.vinyl || "Untitled Vinyl"}</strong>
                      <p>{excerpt(v.vinylRecord, 150) || "No plot notes yet."}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}

/* =========================================================
   Editors
   ========================================================= */

function Lbl({ title, hint, error, children }: { title: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className={"cv-lbl" + (error ? " has-error" : "")}>
      <span className="cv-lbl-t">{title}</span>
      {children}
      {error ? <span className="cv-err">{error}</span> : hint ? <span className="cv-hint">{hint}</span> : null}
    </label>
  );
}

function CycleEditor({
  existing,
  vinyls,
  number,
  onCancel,
  onSave,
  onDelete,
}: {
  existing: CycleRec | null;
  vinyls: VinylRec[];
  number: number;
  onCancel: () => void;
  onSave: (rec: CycleRec) => Promise<boolean>;
  onDelete?: () => void;
}) {
  const [cycle, setCycle] = useState(existing?.cycle || "");
  const [vinylRecord, setVinylRecord] = useState(existing?.vinylRecord || "");
  const [whatHappened, setWhatHappened] = useState(existing?.whatHappened || "");
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const addVinyl = (name: string) => {
    if (vinylRecord.toLowerCase().includes(name.toLowerCase())) return;
    setVinylRecord(vinylRecord.trim() ? `${vinylRecord.trim()}, ${name}` : name);
  };

  const submit = async () => {
    if (!cycle.trim()) {
      setError("Give this Cycle a name or number.");
      return;
    }
    setError("");
    setSaving(true);
    const ok = await onSave({
      id: existing?.id || crypto.randomUUID(),
      cycle,
      vinylRecord,
      whatHappened,
      imageUrl,
    });
    setSaving(false);
    if (!ok) setError("Could not save. Check your connection and try again.");
  };

  return (
    <>
      <div className="cv-topbar">
        <button type="button" className="ph-btn ph-btn-secondary" onClick={onCancel}>
          ‹ Cancel
        </button>
        <span className="cv-eyebrow">{existing ? "Editing" : "Recording"} · Cycle {pad(number)}</span>
      </div>

      <div className="cv-editor">
        <aside className="cv-detail-side">
          <Sleeve img={imageUrl} title={cycle || "New Cycle"} />
          <p className="cv-hint cv-center-text">Live preview of the sleeve.</p>
        </aside>

        <section className="cv-panel cv-form">
          <h2 className="cv-form-title">{existing ? "Edit Cycle" : "Record a new Cycle"}</h2>

          <Lbl title="Cycle" hint="Session name or number." error={error && !cycle.trim() ? error : ""}>
            <input value={cycle} onChange={(e) => setCycle(e.target.value)} placeholder="e.g. Cycle 07 · The Locked Ballroom" />
          </Lbl>

          <Lbl title="Vinyl Record" hint="The plot records this session touched. Tap a name below to add it.">
            <input value={vinylRecord} onChange={(e) => setVinylRecord(e.target.value)} placeholder="Connected plot record" />
          </Lbl>

          {vinyls.length > 0 && (
            <div className="cv-chips cv-pick">
              {vinyls.map((v) => {
                const on = vinylRecord.toLowerCase().includes(v.vinyl.trim().toLowerCase()) && !!v.vinyl.trim();
                return (
                  <button key={v.id} type="button" className={"cv-chip is-link" + (on ? " is-on" : "")} onClick={() => addVinyl(v.vinyl.trim())}>
                    {on ? "✓" : "+"} {v.vinyl}
                  </button>
                );
              })}
            </div>
          )}

          <Lbl title="What Happened?" hint="Start a line with ! to flag a key event. Those appear on the Prep Sheet.">
            <textarea rows={12} value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} placeholder={"Session events, ideas, and plans…\n! The ballroom doors opened by themselves"} />
          </Lbl>

          <Lbl title="Image URL" hint="Optional. Becomes the cover art and the record label.">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
          </Lbl>

          {error && cycle.trim() && <p className="cv-err">{error}</p>}

          <div className="cv-actions">
            <button type="button" className="ph-btn" disabled={saving} onClick={submit}>
              {saving ? "Pressing…" : existing ? "Update Cycle" : "Save Cycle"}
            </button>
            <button type="button" className="ph-btn ph-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            {onDelete && (
              <button type="button" className="ph-btn ph-btn-secondary" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function VinylEditor({
  existing,
  onCancel,
  onSave,
  onDelete,
}: {
  existing: VinylRec | null;
  onCancel: () => void;
  onSave: (rec: VinylRec) => Promise<boolean>;
  onDelete?: () => void;
}) {
  const [vinyl, setVinyl] = useState(existing?.vinyl || "");
  const [vinylRecord, setVinylRecord] = useState(existing?.vinylRecord || "");
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!vinyl.trim()) {
      setError("Give this Vinyl a name.");
      return;
    }
    setError("");
    setSaving(true);
    const ok = await onSave({
      id: existing?.id || crypto.randomUUID(),
      vinyl,
      vinylRecord,
      imageUrl,
    });
    setSaving(false);
    if (!ok) setError("Could not save. Check your connection and try again.");
  };

  return (
    <>
      <div className="cv-topbar">
        <button type="button" className="ph-btn ph-btn-secondary" onClick={onCancel}>
          ‹ Cancel
        </button>
        <span className="cv-eyebrow">{existing ? "Editing" : "Pressing"} · Vinyl record</span>
      </div>

      <div className="cv-editor">
        <aside className="cv-detail-side">
          <Sleeve img={imageUrl} title={vinyl || "New Vinyl"} />
          <p className="cv-hint cv-center-text">Live preview of the sleeve.</p>
        </aside>

        <section className="cv-panel cv-form">
          <h2 className="cv-form-title">{existing ? "Edit Vinyl" : "Press a new Vinyl"}</h2>

          <Lbl title="Vinyl" hint="Guest, staff member, character, or plotline." error={error && !vinyl.trim() ? error : ""}>
            <input value={vinyl} onChange={(e) => setVinyl(e.target.value)} placeholder="e.g. The Widow of Room 412" />
          </Lbl>

          <Lbl title="Vinyl Record" hint="The ongoing story. Start a line with ! to flag a key development.">
            <textarea rows={10} value={vinylRecord} onChange={(e) => setVinylRecord(e.target.value)} placeholder="Record the ongoing story and important developments…" />
          </Lbl>

          <Lbl title="Image URL" hint="Optional. Becomes the sleeve art and the record label.">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
          </Lbl>

          {error && vinyl.trim() && <p className="cv-err">{error}</p>}

          <div className="cv-actions">
            <button type="button" className="ph-btn" disabled={saving} onClick={submit}>
              {saving ? "Pressing…" : existing ? "Update Vinyl" : "Save Vinyl"}
            </button>
            <button type="button" className="ph-btn ph-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            {onDelete && (
              <button type="button" className="ph-btn ph-btn-secondary" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/* =========================================================
   Page shell + styles
   ========================================================= */

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="cv-page">
      <style>{CV_CSS}</style>
      <div className="cv-wrap">{children}</div>
    </main>
  );
}

const CV_CSS = `
.cv-page, .cv-page * { box-sizing: border-box; }

.cv-page {
  min-height: 100vh;
  padding: 32px 24px 96px;
  background-image:
    linear-gradient(rgba(8, 11, 10, 0.8), rgba(8, 11, 10, 0.8)),
    url("/paradise-hotel-background.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.cv-wrap {
  width: min(1320px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

.cv-panel, .cv-block {
  position: relative;
  min-width: 0;
  background: var(--corners), var(--stone);
  border: 1px solid #060504;
  border-radius: var(--radius-lg);
  box-shadow: var(--frame);
}

.cv-panel { padding: 32px; }
.cv-block { padding: 28px; }
.cv-center { text-align: center; }
.cv-center-text { text-align: center; }

.cv-eyebrow {
  color: var(--brass);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.cv-title, .cv-detail-head h1, .cv-now-main h2, .cv-form-title {
  margin: 6px 0 4px;
  color: var(--brass-hi);
  font-family: var(--font-display);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.cv-title { font-size: 38px; line-height: 1.05; }
.cv-muted { margin: 4px 0 0; color: var(--ash); }
.cv-ow { overflow-wrap: anywhere; }
.cv-empty { margin: 8px 0; padding: 28px 18px; color: var(--ash); text-align: center; border: 1px dashed var(--line-strong); }

/* lining numerals so a 1 never looks like an I */
.cv-counts strong, .cv-track-n, .cv-meta b, .cv-tabs small, .cv-mini b, .cv-prep-group b, .cv-chip {
  font-family: var(--font-body);
  font-variant-numeric: lining-nums;
  font-feature-settings: "lnum" 1;
}

.cv-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  color: var(--brass);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.cv-sub::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, var(--line-strong), transparent); }
.cv-liner .cv-sub.is-dark { color: var(--parch-head) !important; text-shadow: none !important; }
.cv-sub.is-dark::after { background: linear-gradient(90deg, rgba(74, 54, 30, 0.45), transparent); }

/* ---------- header ---------- */

.cv-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; }
.cv-head-right { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.cv-counts { display: flex; gap: 10px; }
.cv-counts div { display: grid; gap: 2px; min-width: 92px; padding: 10px 14px; text-align: center; background: var(--tile); border: 1px solid var(--line); }
.cv-counts strong { color: var(--brass-hi); font-size: 26px; line-height: 1; }
.cv-counts span { color: var(--ash); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; }

/* ---------- the disc ---------- */

.cv-disc {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background:
    conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.09) 9%, transparent 22%, transparent 50%, rgba(255,255,255,0.09) 59%, transparent 72%, transparent 100%),
    repeating-radial-gradient(circle at 50% 50%, #0c0a09 0 2px, #181412 2px 3px);
  border: 1px solid #000;
  box-shadow: 0 10px 28px rgba(0,0,0,0.6), inset 0 0 0 5px rgba(0,0,0,0.5);
}

.cv-disc-label {
  position: absolute;
  inset: 32%;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  color: var(--bone);
  background: radial-gradient(circle at 35% 30%, var(--ember-hi), var(--ember) 60%, var(--ember-deep));
  border: 2px solid rgba(0,0,0,0.6);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
}
.cv-disc-label img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cv-disc-hole { position: absolute; inset: 47.5%; border-radius: 50%; background: #0a0807; border: 1px solid rgba(211,169,91,0.5); }

@keyframes cv-spin { to { transform: rotate(360deg); } }
.cv-disc.is-spin { animation: cv-spin 9s linear infinite; }
@media (prefers-reduced-motion: reduce) { .cv-disc.is-spin { animation: none; } }

/* ---------- now playing ---------- */

.cv-now {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  align-items: center;
  background:
    radial-gradient(120% 140% at 0% 50%, rgba(140, 29, 19, 0.2), transparent 60%),
    var(--corners), var(--stone);
}
@media (min-width: 820px) { .cv-now { grid-template-columns: 280px minmax(0, 1fr); } }

.cv-now-deck { display: grid; place-items: center; }
.cv-platter { position: relative; width: min(240px, 70vw); padding: 10px; border-radius: 50%; background: rgba(0,0,0,0.35); border: 1px solid var(--line); }

.cv-arm { position: absolute; top: -6px; right: -26px; width: 6px; height: 150px; background: linear-gradient(90deg, var(--brass-dim), var(--brass-hi), var(--brass-dim)); border-radius: 3px; transform-origin: 3px 6px; transform: rotate(-24deg); transition: transform 600ms var(--ease); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
.cv-arm::before { content: ""; position: absolute; top: -8px; left: -8px; width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, var(--brass-hi), var(--brass-dim)); border: 1px solid #000; }
.cv-arm i { position: absolute; bottom: -8px; left: -4px; width: 14px; height: 18px; background: var(--ink); border: 1px solid var(--brass-dim); border-radius: 2px; }
.cv-arm.is-down { transform: rotate(8deg); }

.cv-now-main { display: grid; gap: 12px; align-content: center; min-width: 0; }
.cv-now-main h2 { margin: 0; font-size: 40px; line-height: 1.05; }
.cv-recap { margin: 0; max-width: 62ch; color: var(--bone-soft); font-size: 17px; line-height: 1.6; }

.cv-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }

/* ---------- chips ---------- */

.cv-chips { display: flex; flex-wrap: wrap; gap: 6px; }

.cv-chip {
  display: inline-block;
  max-width: 100%;
  padding: 3px 10px;
  color: var(--bone-soft);
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--line);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  overflow-wrap: anywhere;
}
button.cv-chip { cursor: pointer; }
.cv-chip.is-link { color: var(--brass-hi); border-color: var(--line-strong); }
.cv-chip.is-link:hover { background: rgba(211,169,91,0.12); }
.cv-chip.is-on { color: var(--fluor); border-color: rgba(159,179,162,0.55); }
.cv-chip.is-key { color: var(--ember-hi); border-color: rgba(208,71,46,0.5); }

/* ---------- library ---------- */

.cv-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.cv-tabs { display: flex; flex-wrap: wrap; gap: 0; }

.cv-tabs button {
  min-height: 44px;
  padding: 8px 20px;
  color: var(--ash);
  background: rgba(0,0,0,0.35);
  border: 1px solid var(--line);
  font-family: var(--font-caps);
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}
.cv-tabs button + button { border-left: 0; }
.cv-tabs button small { margin-left: 6px; color: var(--brass-dim); font-size: 12px; }
.cv-tabs button.is-on { color: var(--brass-hi); background: var(--surface); border-color: var(--line-strong); box-shadow: inset 0 -2px 0 var(--ember-hi); }
.cv-tabs button.is-on small { color: var(--ember-hi); }

.cv-tools { display: flex; flex: 1 1 420px; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; }
.cv-search { flex: 1 1 220px; min-width: 0; width: auto; min-height: 44px; padding: 8px 12px; color: var(--bone); background: rgba(0,0,0,0.45); border: 1px solid var(--line); font: inherit; }

/* ---------- tracklist ---------- */

.cv-tracks { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }

.cv-track {
  display: grid;
  grid-template-columns: 48px 76px minmax(0, 1fr) 24px;
  gap: 18px;
  align-items: center;
  padding: 14px 18px;
  background: var(--tile);
  border: 1px solid var(--line);
  border-left: 3px solid var(--brass-dim);
  cursor: pointer;
  transition: border-color var(--ease), background var(--ease);
}
.cv-track:hover, .cv-track:focus-visible { border-color: var(--line-strong); border-left-color: var(--ember-hi); background: rgba(140, 29, 19, 0.12); outline: none; }

.cv-track-n { color: var(--brass-dim); font-size: 26px; font-weight: 700; text-align: center; }
.cv-track:hover .cv-track-n { color: var(--ember-hi); }

.cv-track-art { width: 76px; height: 76px; overflow: hidden; border: 1px solid var(--line); background: rgba(0,0,0,0.4); display: grid; place-items: center; }
.cv-track-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cv-track-art .cv-disc { width: 90%; box-shadow: none; }

.cv-track-main { display: grid; gap: 6px; min-width: 0; }
.cv-track-main strong { color: var(--brass-hi); font-family: var(--font-display); font-size: 22px; line-height: 1.15; overflow-wrap: anywhere; }
.cv-track-main p { margin: 0; color: var(--ash); overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cv-track-go { color: var(--brass-dim); font-size: 28px; }

/* ---------- vinyl crate ---------- */

.cv-crate { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 28px; }

.cv-card {
  display: grid;
  gap: 16px;
  align-content: start;
  padding: 18px;
  background: var(--tile);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: border-color var(--ease), transform var(--ease);
}
.cv-card:hover, .cv-card:focus-visible { border-color: var(--line-strong); transform: translateY(-2px); outline: none; }
.cv-card:hover .cv-disc, .cv-card:focus-visible .cv-disc { animation: cv-spin 6s linear infinite; }
.cv-card-body { display: grid; gap: 8px; min-width: 0; }
.cv-card-body strong { color: var(--brass-hi); font-family: var(--font-display); font-size: 21px; line-height: 1.15; overflow-wrap: anywhere; }
.cv-card-body p { margin: 0; color: var(--ash); font-size: 14px; overflow-wrap: anywhere; }
.cv-card-body .cv-chip { justify-self: start; }

/* ---------- sleeve (art + vinyl peeking out) ---------- */

.cv-sleeve { position: relative; width: 100%; aspect-ratio: 1.12 / 1; }
.cv-sleeve-art {
  position: absolute; left: 0; top: 0; bottom: 0; width: 89.3%;
  overflow: hidden;
  background: var(--stone-2);
  border: 1px solid #000;
  box-shadow: 0 8px 22px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(211,169,91,0.25);
}
.cv-sleeve-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cv-sleeve-disc { position: absolute; right: 0; top: 3%; width: 84%; }
.cv-sleeve-disc .cv-disc { border-color: rgba(211,169,91,0.4); box-shadow: 0 6px 16px rgba(0,0,0,0.6); }

.cv-gen {
  height: 100%;
  display: grid;
  align-content: space-between;
  gap: 8px;
  padding: 14px;
  background:
    radial-gradient(100% 80% at 80% 0%, rgba(140, 29, 19, 0.45), transparent 60%),
    linear-gradient(160deg, #241d17, #120f0c);
}
.cv-gen span { color: var(--brass); font-size: 8px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
.cv-gen b { color: var(--brass-hi); font-family: var(--font-display); font-size: clamp(16px, 2.4vw, 24px); font-weight: 600; line-height: 1.05; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.cv-gen i { display: block; height: 1px; background: linear-gradient(90deg, var(--brass), transparent); }

/* ---------- prep sheet ---------- */

.cv-prep { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 28px; align-items: start; }
.cv-prep-col { display: grid; gap: 16px; min-width: 0; align-content: start; }
.cv-prep-group { padding: 16px 18px; background: var(--tile); border: 1px solid var(--line); border-left: 3px solid var(--ember-hi); }
.cv-prep-group > button { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; padding: 0; color: var(--brass-hi); background: none; border: 0; font-family: var(--font-display); font-size: 20px; text-align: left; cursor: pointer; }
.cv-prep-group > button b { color: var(--brass-dim); font-size: 14px; }
.cv-prep-group ul, .cv-key ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.cv-prep-group li, .cv-key li { display: flex; gap: 10px; color: var(--bone-soft); overflow-wrap: anywhere; }
.cv-prep-group li span, .cv-key li span { flex: none; color: var(--ember-hi); }

.cv-plotlines { display: grid; gap: 12px; }
.cv-plotlines button { display: grid; gap: 4px; padding: 16px 18px; text-align: left; color: inherit; background: var(--tile); border: 1px solid var(--line); cursor: pointer; }
.cv-plotlines button:hover { border-color: var(--line-strong); }
.cv-plotlines strong { color: var(--brass-hi); font-family: var(--font-display); font-size: 20px; overflow-wrap: anywhere; }
.cv-plotlines p { margin: 0; color: var(--ash); overflow-wrap: anywhere; }

/* ---------- detail page ---------- */

.cv-topbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; }

.cv-detail, .cv-editor { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
@media (min-width: 960px) {
  .cv-detail, .cv-editor { grid-template-columns: 340px minmax(0, 1fr); }
  .cv-detail-side { position: sticky; top: 24px; }
}

.cv-detail-side { display: grid; gap: 20px; min-width: 0; width: 100%; max-width: 420px; justify-self: center; overflow: hidden; padding-bottom: 4px; }

.cv-meta { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 8px; }
.cv-meta div { display: grid; gap: 2px; padding: 10px 6px; text-align: center; background: var(--tile); border: 1px solid var(--line); }
.cv-meta span { color: var(--ash); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; }
.cv-meta b { color: var(--brass-hi); font-size: 22px; }

.cv-detail-main { display: grid; gap: 24px; min-width: 0; }
.cv-detail-head { display: grid; gap: 10px; padding: 32px; background: linear-gradient(120deg, rgba(140, 29, 19, 0.14), transparent 55%), var(--corners), var(--stone); border: 1px solid #060504; border-radius: var(--radius-lg); box-shadow: var(--frame); }
.cv-detail-head h1 { margin: 0; font-size: 40px; line-height: 1.05; }

.cv-key { border-left: 3px solid var(--ember-hi); }

/* liner notes: parchment sleeve insert */
.cv-liner { background: var(--parch); border: 1px solid var(--parch-line); box-shadow: 0 8px 22px rgba(0,0,0,0.45); }
.cv-notes { display: grid; gap: 12px; color: var(--parch-ink); font-family: var(--font-display); font-size: 19px; line-height: 1.6; overflow-wrap: anywhere; }
.cv-notes p { margin: 0; }
.cv-notes .cv-gap { height: 6px; }
.cv-notes .is-key { display: flex; gap: 10px; padding: 8px 12px; color: var(--parch-head); font-weight: 700; background: rgba(140, 29, 19, 0.1); border-left: 3px solid var(--ember); }
.cv-notes .is-key span { flex: none; color: var(--ember); }
.cv-liner .cv-muted { color: var(--parch-mute); }

.cv-mini { display: grid; gap: 8px; }
.cv-mini button { display: flex; align-items: baseline; gap: 12px; padding: 12px 16px; text-align: left; color: var(--bone); background: var(--tile); border: 1px solid var(--line); cursor: pointer; }
.cv-mini button:hover { border-color: var(--line-strong); }
.cv-mini b { color: var(--brass-dim); }
.cv-mini span { font-family: var(--font-display); font-size: 19px; overflow-wrap: anywhere; }

.cv-pager { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 14px; }
.cv-pager button { display: flex !important; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; padding: 16px 20px; text-align: left; color: var(--bone); background: var(--tile); background-image: none; border: 1px solid var(--line); box-shadow: none; text-transform: none; letter-spacing: normal; cursor: pointer; }
.cv-pager button:last-child { text-align: right; align-items: flex-end; }
.cv-pager button:disabled { opacity: 0.4; cursor: default; }
.cv-pager button:not(:disabled):hover { border-color: var(--line-strong); }
.cv-pager span { color: var(--brass); font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
.cv-pager b { font-family: var(--font-display); font-size: 19px; font-weight: 600; text-transform: none; letter-spacing: normal; overflow-wrap: anywhere; }

/* ---------- editor ---------- */

.cv-form { display: grid; gap: 20px; }
.cv-form-title { margin: 0; font-size: 30px; }
.cv-lbl { display: grid; gap: 6px; min-width: 0; }
.cv-lbl-t { color: var(--brass); font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.cv-lbl input, .cv-lbl textarea { width: 100%; min-height: 44px; padding: 10px 12px; color: var(--bone); background: rgba(0,0,0,0.45); border: 1px solid var(--line); font: inherit; }
.cv-lbl textarea { resize: vertical; line-height: 1.55; }
.cv-lbl.has-error input { border-color: var(--ember-hi); }
.cv-hint { color: var(--ash); font-size: 12px; }
.cv-err { color: var(--ember-hi); font-size: 13px; font-weight: 600; }
.cv-pick { margin-top: -8px; }

/* ---------- phones ---------- */

@media (max-width: 720px) {
  .cv-page { padding: 16px 12px 80px; }
  .cv-wrap { gap: 16px; }
  .cv-panel, .cv-block, .cv-detail-head { padding: 18px; }
  .cv-title { font-size: 32px; }
  .cv-now-main h2, .cv-detail-head h1 { font-size: 32px; }
  .cv-track { grid-template-columns: 34px 56px minmax(0, 1fr); gap: 12px; padding: 12px; }
  .cv-track-art { width: 56px; height: 56px; }
  .cv-track-go { display: none; }
  .cv-track-n { font-size: 20px; }
  .cv-tools, .cv-search { width: 100%; }
  .cv-arm { right: -14px; height: 120px; }
  .cv-notes { font-size: 18px; }
}
`;