import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/* =========================================================
   ROOM DIRECTORY (rd-*)  ·  GM only
   - One key-tag card per occupied room.
   - ENTER ROOM opens the guest's room as an overlay on top of
     the Management page (GmRoomOverlay), so the GM never leaves
     it. Closing the overlay drops you right back where you were.
   - EDIT changes the room number / password inline.
   ========================================================= */

type GuestRow = {
  id?: string;
  name?: string;
  room?: string | number;
  password?: string;
  portrait?: string;
  title?: string;
  role?: string;
  role2?: string;
  level?: string;
};

type Props = {
  guests: GuestRow[];
  /** Open this guest's room (App sets the guest, then shows the overlay). */
  onEnter: (guest: any) => void;
  /** Save a new room number / password. Return an error message, or null on success. */
  onSaveRoom: (id: string, room: string, password: string) => string | null;
  /** Id of the room currently open in the overlay, if any. */
  openId?: string;
};

const pad3 = (n: number) => String(n).padStart(3, "0");

function CardEditor({
  guest,
  onSave,
  onCancel,
}: {
  guest: GuestRow;
  onSave: (room: string, password: string) => string | null;
  onCancel: () => void;
}) {
  const [room, setRoom] = useState(String(guest.room ?? ""));
  const [password, setPassword] = useState(String(guest.password ?? ""));
  const [error, setError] = useState("");

  const submit = () => {
    const msg = onSave(room, password);
    if (msg) setError(msg);
  };

  return (
    <div className="rd-edit">
      <label className="rd-lbl">
        <span>Room number</span>
        <input
          type="number"
          min={0}
          max={100}
          value={room}
          onChange={(e) => {
            setRoom(e.target.value);
            setError("");
          }}
        />
      </label>
      <label className="rd-lbl">
        <span>Password</span>
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="rd-err">{error}</p>}
      <div className="rd-edit-actions">
        <button type="button" className="ph-btn" onClick={submit}>
          Save
        </button>
        <button type="button" className="ph-btn ph-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function RoomDirectory({ guests, onEnter, onSaveRoom, openId }: Props) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");

  const rooms = useMemo(
    () =>
      guests
        .filter((g) => {
          const room = Number(g.room);
          return !!g.name?.trim() && Number.isInteger(room) && room >= 0 && room <= 100;
        })
        .sort((a, b) => Number(a.room) - Number(b.room)),
    [guests]
  );

  const q = query.trim().toLowerCase();
  const shown = rooms.filter(
    (g) =>
      !q ||
      String(g.room).includes(q) ||
      (g.name || "").toLowerCase().includes(q) ||
      (g.title || "").toLowerCase().includes(q)
  );

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  };

  return (
    <section className="rd">
      <style>{RD_CSS}</style>

      <header className="rd-head">
        <div>
          <span className="rd-eyebrow">Front desk · Master keys</span>
          <h2 className="rd-title">Room Directory</h2>
          <p className="rd-muted">
            {rooms.length} {rooms.length === 1 ? "room" : "rooms"} occupied. Enter any room to view and edit
            the guest’s sheet without leaving Management.
          </p>
        </div>
        <input
          className="rd-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search room, guest or title…"
          aria-label="Search rooms"
        />
      </header>

      {shown.length === 0 ? (
        <p className="rd-empty">{rooms.length === 0 ? "No occupied rooms yet." : "No rooms match that search."}</p>
      ) : (
        <div className="rd-grid">
          {shown.map((g) => {
            const id = g.id || "";
            const isEditing = editingId === id;
            const show = !!revealed[id];
            const pw = String(g.password ?? "");
            return (
              <article key={id || String(g.room)} className={"rd-card" + (openId && openId === id ? " is-open" : "")}>
                <div className="rd-top">
                  <div className="rd-tag" aria-label={`Room ${g.room}`}>
                    <i aria-hidden="true" />
                    <span>Room</span>
                    <b>{pad3(Number(g.room))}</b>
                  </div>

                  <div className="rd-who">
                    <div className="rd-portrait">
                      {g.portrait ? <img src={g.portrait} alt="" loading="lazy" /> : <span>{(g.name || "?").trim().charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="rd-name">
                      <strong>{g.name}</strong>
                      {(g.title || g.role) && (
                        <small>{[g.title, g.role].filter(Boolean).join(" · ")}</small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rd-pass">
                  <span>Password</span>
                  <code>{pw ? (show ? pw : "•".repeat(Math.min(pw.length, 10))) : "—"}</code>
                  {pw && (
                    <>
                      <button type="button" onClick={() => setRevealed((r) => ({ ...r, [id]: !show }))}>
                        {show ? "Hide" : "Show"}
                      </button>
                      <button type="button" onClick={() => copy(id, pw)}>
                        {copied === id ? "Copied" : "Copy"}
                      </button>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <CardEditor
                    guest={g}
                    onCancel={() => setEditingId("")}
                    onSave={(room, password) => {
                      const msg = onSaveRoom(id, room, password);
                      if (!msg) setEditingId("");
                      return msg;
                    }}
                  />
                ) : (
                  <div className="rd-actions">
                    <button
                      type="button"
                      className="ph-btn"
                      onClick={() => {
                        if (!g.id) {
                          window.alert("This guest has no ID assigned yet.");
                          return;
                        }
                        onEnter(g);
                      }}
                    >
                      Enter Room
                    </button>
                    <button
                      type="button"
                      className="ph-btn ph-btn-secondary"
                      onClick={() => {
                        if (!g.id) {
                          window.alert("This guest has no ID assigned yet.");
                          return;
                        }
                        setEditingId(id);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   Overlay that hosts the guest's room on top of the GM page.
   ========================================================= */

export function GmRoomOverlay({
  roomLabel,
  onClose,
  children,
}: {
  roomLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rd-overlay" role="dialog" aria-modal="true" aria-label={roomLabel}>
      <style>{RD_CSS}</style>
      <div className="rd-bar">
        <button type="button" className="ph-btn ph-btn-secondary" onClick={onClose}>
          ‹ Back to Management
        </button>
        <span className="rd-bar-label">
          <b>GM view</b> · {roomLabel} · edits autosave
        </span>
      </div>
      <div className="rd-overlay-body">{children}</div>
    </div>
  );
}

const RD_CSS = `
.rd, .rd *, .rd-overlay, .rd-overlay * { box-sizing: border-box; }

.rd {
  position: relative;
  margin-top: 16px;
  padding: 32px;
  background: var(--corners), var(--stone);
  border: 1px solid #060504;
  border-radius: var(--radius-lg);
  box-shadow: var(--frame);
}

.rd-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.rd-eyebrow { color: var(--brass); font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
.rd-title { margin: 6px 0 4px !important; color: var(--brass-hi); font-size: 34px !important; }
.rd-muted { margin: 4px 0 0; max-width: 56ch; color: var(--ash); }
.rd-search { flex: 1 1 260px; max-width: 380px; min-height: 44px; padding: 8px 12px; color: var(--bone); background: rgba(0,0,0,0.45); border: 1px solid var(--line); font: inherit; }
.rd-empty { margin: 8px 0; padding: 28px 18px; color: var(--ash); text-align: center; border: 1px dashed var(--line-strong); }

.rd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 20px; }

.rd-card {
  display: grid;
  gap: 18px;
  align-content: start;
  min-width: 0;
  padding: 20px;
  background: var(--tile);
  border: 1px solid var(--line);
  transition: border-color var(--ease), transform var(--ease);
}
.rd-card:hover { border-color: var(--line-strong); transform: translateY(-1px); }
.rd-card.is-open { border-color: var(--ember-hi); box-shadow: 0 0 0 1px rgba(208,71,46,0.4); }

.rd-top { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; align-items: center; }

/* the brass key-fob */
.rd-tag {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0;
  min-width: 86px;
  padding: 22px 12px 10px;
  text-align: center;
  background: linear-gradient(160deg, #3a2f1c, #1c150c);
  border: 1px solid var(--brass-dim);
  border-radius: 4px 4px 14px 14px;
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(211,169,91,0.25);
}
.rd-tag i { position: absolute; top: 7px; left: 50%; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: #0a0807; border: 1px solid var(--brass); }
.rd-tag span { color: var(--brass-dim); font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
.rd-tag b { color: var(--brass-hi); font-family: var(--font-body); font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; font-size: 30px; font-weight: 700; line-height: 1.1; letter-spacing: 0.04em; }

.rd-who { display: flex; align-items: center; gap: 12px; min-width: 0; }
.rd-portrait { flex: none; display: grid; place-items: center; width: 56px; height: 70px; overflow: hidden; color: var(--brass); background: rgba(0,0,0,0.4); border: 1px solid var(--line); font-family: var(--font-display); font-size: 26px; }
.rd-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rd-name { display: grid; gap: 2px; min-width: 0; }
.rd-name strong { color: var(--bone); font-family: var(--font-display); font-size: 22px; font-weight: 600; line-height: 1.1; overflow-wrap: anywhere; }
.rd-name small { color: var(--ash); font-size: 12px; overflow-wrap: anywhere; }

.rd-pass { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 10px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--line-soft); }
.rd-pass span { color: var(--ash); font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
.rd-pass code { flex: 1 1 auto; min-width: 0; padding: 0 !important; background: none !important; border: 0 !important; box-shadow: none !important; color: var(--bone-soft); font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 14px; letter-spacing: 0.08em; overflow-wrap: anywhere; }
.rd-pass button { width: auto !important; min-height: 0 !important; padding: 3px 10px !important; color: var(--brass); background: none !important; border: 1px solid var(--line); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; box-shadow: none !important; }
.rd-pass button:hover { border-color: var(--line-strong); }

.rd-actions, .rd-edit-actions { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.rd-actions .ph-btn, .rd-edit-actions .ph-btn { width: 100%; }

.rd-edit { display: grid; gap: 14px; padding: 16px; background: var(--surface); border: 1px solid var(--line-strong); }
.rd-lbl { display: grid; gap: 6px; }
.rd-lbl span { color: var(--brass); font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.rd-lbl input { width: 100%; min-height: 44px; padding: 8px 12px; color: var(--bone); background: rgba(0,0,0,0.45); border: 1px solid var(--line); font: inherit; }
.rd-err { margin: 0; color: var(--ember-hi); font-size: 13px; font-weight: 600; }

/* ---------- room overlay ---------- */

.rd-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  flex-direction: column;
  background-image: linear-gradient(rgba(8,11,10,0.9), rgba(8,11,10,0.9)), url("/paradise-hotel-background.jpg");
  background-color: var(--ink);
  background-size: cover;
  background-position: center;
}
.rd-bar { flex: none; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 20px; background: rgba(12, 10, 8, 0.96); border-bottom: 1px solid var(--line-strong); }
.rd-bar-label { color: var(--ash); font-size: 13px; letter-spacing: 0.06em; }
.rd-bar-label b { color: var(--ember-hi); font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.rd-overlay-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 16px; }

@media (max-width: 720px) {
  .rd { padding: 18px; }
  .rd-title { font-size: 28px !important; }
  .rd-search { max-width: none; }
  .rd-bar { padding: 8px 12px; }
}
`;