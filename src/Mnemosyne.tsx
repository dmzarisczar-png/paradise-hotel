import { useState } from "react";
import type { CSSProperties, ReactElement } from "react";
import "./Mnemosyne.css";

/* =========================================================
   MNĒMOSYNĒ — THE TREE OF MEMORY
   Three screens:
     MnemeEntrance  the tree standing in the hotel (Services → here)
     MemoryTree     a crown of leaves, each leaf a memory
     MemoryDetail   one memory, hung alone from a limb

   All state and Supabase calls stay in App.tsx. These are
   presentational: they receive data and callbacks as props.
   ========================================================= */

export type MemoryRecord = {
  id: string;
  name: string;
  holder: string;
  imageUrl: string;
  details: string;
  /** a key from EMOTIONS; "" means not yet sorted */
  emotion: string;
};

export type MemoryDraft = {
  name: string;
  holder: string;
  imageUrl: string;
  details: string;
  emotion: string;
};

/* ---------------------------------------------------------
   Feelings: every leaf is coloured by how the memory feels.
   The colours themselves live in Mnemosyne.css ([data-emotion]).

   The `memories` table has no column for this and we are not
   migrating, so the feeling rides along at the start of the
   saved `details` text as a hidden tag. packMemoryDetails /
   unpackMemoryDetails are the only two places that know about
   it; the rest of the app only ever sees `emotion`.
   --------------------------------------------------------- */

export const EMOTIONS: { id: string; label: string; hint: string }[] = [
  { id: "joy", label: "Joy", hint: "A good memory" },
  { id: "love", label: "Love", hint: "Warmth, belonging" },
  { id: "peace", label: "Peace", hint: "Calm, safety" },
  { id: "sorrow", label: "Sorrow", hint: "Loss, grief" },
  { id: "fear", label: "Fear", hint: "Dread, unease" },
  { id: "anger", label: "Anger", hint: "Rage, betrayal" },
  { id: "trauma", label: "Trauma", hint: "A wound that stays" },
  { id: "unsorted", label: "Unsorted", hint: "Not yet understood" },
];

export function emotionOf(id: string) {
  return EMOTIONS.find((e) => e.id === id) ?? EMOTIONS[EMOTIONS.length - 1];
}

const FEELING_TAG = /^\[\[feeling:([a-z]+)\]\]\n?/;

export function unpackMemoryDetails(stored: string | null | undefined): {
  emotion: string;
  details: string;
} {
  const text = stored ?? "";
  const match = FEELING_TAG.exec(text);
  if (!match) return { emotion: "", details: text };
  return { emotion: match[1], details: text.slice(match[0].length) };
}

export function packMemoryDetails(emotion: string, details: string): string {
  const clean = details.trim();
  if (!emotion || emotion === "unsorted") return clean;
  return `[[feeling:${emotion}]]\n${clean}`;
}

/* ---------------------------------------------------------
   Tree artwork
   Leaves are placed with a seeded generator, so the tree is
   identical on every render and never "jumps".
   --------------------------------------------------------- */

type Cluster = { x: number; y: number; r: number; n: number };
type Orb = { x: number; y: number; d: string };
type Branch = { d: string; w: number };

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Leaves({ clusters, seed }: { clusters: Cluster[]; seed: number }) {
  const next = seeded(seed);
  const out: ReactElement[] = [];

  clusters.forEach((c, ci) => {
    for (let i = 0; i < c.n; i++) {
      const angle = next() * Math.PI * 2;
      const dist = Math.sqrt(next()) * c.r;
      const x = +(c.x + Math.cos(angle) * dist).toFixed(1);
      const y = +(c.y + Math.sin(angle) * dist * 0.8).toFixed(1);
      const rot = Math.round(next() * 180);
      const warm = next() > 0.55;

      out.push(
        <ellipse
          key={`${ci}-${i}`}
          cx={x}
          cy={y}
          rx={+(3.2 + next() * 2.6).toFixed(1)}
          ry={+(1.6 + next() * 1.4).toFixed(1)}
          transform={`rotate(${rot} ${x} ${y})`}
          className={warm ? "mn-leaf mn-leaf-warm" : "mn-leaf"}
        />
      );
    }
  });

  return <>{out}</>;
}

function Orbs({ orbs }: { orbs: Orb[] }) {
  return (
    <>
      {orbs.map((o, i) => (
        <circle
          key={i}
          cx={o.x}
          cy={o.y}
          r={3.2}
          className="mn-orb"
          style={{ "--d": o.d } as CSSProperties}
        />
      ))}
    </>
  );
}

function BarkDefs({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#150e08" />
      <stop offset="0.3" stopColor="#3d2d1e" />
      <stop offset="0.52" stopColor="#5a4430" />
      <stop offset="0.74" stopColor="#35271a" />
      <stop offset="1" stopColor="#120c07" />
    </linearGradient>
  );
}

function Limbs({ branches }: { branches: Branch[] }) {
  return (
    <>
      {branches.map((b, i) => (
        <path key={i} d={b.d} strokeWidth={b.w} className="mn-limb-path" />
      ))}
    </>
  );
}

/* ---- the whole tree, for the entrance ---- */

const ENTRANCE_BRANCHES: Branch[] = [
  { d: "M200 250 C190 200 150 170 100 150", w: 10 },
  { d: "M200 250 C215 195 255 165 305 140", w: 10 },
  { d: "M198 235 C196 180 190 130 160 80", w: 8 },
  { d: "M202 235 C206 175 215 125 245 75", w: 8 },
  { d: "M200 225 C200 170 200 120 200 55", w: 7 },
  { d: "M188 270 C150 260 105 270 60 235", w: 6 },
  { d: "M212 270 C250 258 295 268 342 232", w: 6 },
  { d: "M130 165 C120 140 118 120 108 100", w: 3 },
  { d: "M282 154 C292 130 297 112 309 94", w: 3 },
];

const ENTRANCE_CLUSTERS: Cluster[] = [
  { x: 96, y: 146, r: 44, n: 34 },
  { x: 310, y: 138, r: 44, n: 34 },
  { x: 158, y: 76, r: 38, n: 30 },
  { x: 248, y: 72, r: 38, n: 30 },
  { x: 200, y: 50, r: 34, n: 26 },
  { x: 56, y: 232, r: 34, n: 24 },
  { x: 346, y: 230, r: 34, n: 24 },
  { x: 200, y: 118, r: 70, n: 56 },
  { x: 105, y: 96, r: 24, n: 14 },
  { x: 310, y: 92, r: 24, n: 14 },
];

const ENTRANCE_ORBS: Orb[] = [
  { x: 120, y: 125, d: "0s" },
  { x: 285, y: 118, d: "-1.4s" },
  { x: 170, y: 170, d: "-2.6s" },
  { x: 235, y: 160, d: "-0.8s" },
  { x: 75, y: 200, d: "-3.3s" },
  { x: 330, y: 205, d: "-2s" },
  { x: 200, y: 85, d: "-3.9s" },
];

/* small memories already hanging on the entrance tree */
const ENTRANCE_FRAMES = [
  { x: 165, y: 189, h: 28 },
  { x: 235, y: 189, h: 28 },
  { x: 127, y: 262, h: 24 },
  { x: 273, y: 262, h: 24 },
];

function EntranceTree() {
  return (
    <svg
      className="mn-art"
      viewBox="0 0 400 500"
      role="img"
      aria-label="A tree with glowing leaves, its roots sinking into the hotel floor"
    >
      <defs>
        <BarkDefs id="mnBarkE" />
        <radialGradient id="mnFloorE" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#9fb3a2" stopOpacity="0.38" />
          <stop offset="1" stopColor="#9fb3a2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mnFadeE" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="mnRootMaskE">
          <rect x="0" y="0" width="400" height="440" fill="#fff" />
          <rect x="0" y="440" width="400" height="60" fill="url(#mnFadeE)" />
        </mask>
      </defs>

      <ellipse cx="200" cy="452" rx="170" ry="12" fill="url(#mnFloorE)" />

      <g mask="url(#mnRootMaskE)">
        <g className="mn-limb-group">
          <path d="M164 452 C140 452 118 462 92 492" strokeWidth="8" />
          <path d="M236 452 C262 452 284 462 308 492" strokeWidth="8" />
          <path d="M184 452 C176 468 168 482 160 500" strokeWidth="6" />
          <path d="M216 452 C224 468 232 482 240 500" strokeWidth="6" />
          <path d="M200 452 C200 470 200 485 200 500" strokeWidth="6" />
        </g>

        <path
          d="M164 452 C176 420 182 380 184 330 C186 290 180 255 174 228 L226 228 C220 255 214 290 216 330 C218 380 224 420 236 452 Z"
          fill="url(#mnBarkE)"
        />
        <g className="mn-bark-lines">
          <path d="M190 440 C192 390 194 340 192 290" />
          <path d="M208 440 C207 380 210 330 209 280" />
          <path d="M199 430 C200 380 199 330 200 270" />
        </g>
      </g>

      <g className="mn-limb-group">
        <Limbs branches={ENTRANCE_BRANCHES} />
      </g>

      {ENTRANCE_FRAMES.map((f, i) => (
        <g key={i} className="mn-hung">
          <line x1={f.x} y1={f.y} x2={f.x} y2={f.y + 22} />
          <rect x={f.x - 9} y={f.y + 22} width="18" height={f.h} rx="1" />
          <rect x={f.x - 6} y={f.y + 25} width="12" height={f.h - 6} rx="1" className="mn-hung-pic" />
        </g>
      ))}

      <g className="mn-leaves">
        <Leaves clusters={ENTRANCE_CLUSTERS} seed={7} />
      </g>
      <Orbs orbs={ENTRANCE_ORBS} />
    </svg>
  );
}

/* ---- the crown: boughs, foliage and light that the memory-leaves grow in ---- */

const CROWN_BRANCHES: Branch[] = [
  { d: "M400 470 C400 430 398 380 400 300", w: 22 },
  { d: "M400 455 C340 415 250 395 150 325", w: 15 },
  { d: "M400 455 C460 415 550 395 650 325", w: 15 },
  { d: "M400 400 C330 350 240 300 110 215", w: 12 },
  { d: "M400 400 C470 350 560 300 690 215", w: 12 },
  { d: "M400 345 C362 285 300 215 230 125", w: 8 },
  { d: "M400 345 C438 285 500 215 570 125", w: 8 },
  { d: "M400 310 C400 230 400 160 400 70", w: 7 },
  { d: "M150 325 C110 312 70 282 40 242", w: 4 },
  { d: "M650 325 C690 312 730 282 760 242", w: 4 },
  { d: "M230 125 C200 105 180 75 170 40", w: 3 },
  { d: "M570 125 C600 105 620 75 630 40", w: 3 },
];

const CROWN_CLUSTERS: Cluster[] = [
  { x: 110, y: 215, r: 70, n: 44 },
  { x: 690, y: 215, r: 70, n: 44 },
  { x: 200, y: 330, r: 70, n: 40 },
  { x: 600, y: 330, r: 70, n: 40 },
  { x: 230, y: 125, r: 70, n: 44 },
  { x: 570, y: 125, r: 70, n: 44 },
  { x: 400, y: 90, r: 90, n: 56 },
  { x: 320, y: 230, r: 80, n: 46 },
  { x: 480, y: 230, r: 80, n: 46 },
  { x: 400, y: 380, r: 80, n: 40 },
  { x: 60, y: 300, r: 50, n: 26 },
  { x: 740, y: 300, r: 50, n: 26 },
];

const CROWN_ORBS: Orb[] = [
  { x: 130, y: 190, d: "0s" },
  { x: 250, y: 250, d: "-1.8s" },
  { x: 330, y: 120, d: "-3.1s" },
  { x: 400, y: 215, d: "-0.9s" },
  { x: 470, y: 120, d: "-2.4s" },
  { x: 550, y: 250, d: "-3.6s" },
  { x: 670, y: 190, d: "-1.2s" },
  { x: 180, y: 360, d: "-2.8s" },
  { x: 620, y: 360, d: "-0.4s" },
  { x: 400, y: 330, d: "-1.5s" },
];

function CrownArt() {
  return (
    <svg
      className="mn-art mn-crown-art"
      viewBox="0 0 800 520"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <BarkDefs id="mnBarkK" />
      </defs>
      <path d="M372 520 L428 520 C424 490 418 468 410 440 L390 440 C382 468 376 490 372 520 Z" fill="url(#mnBarkK)" />
      <g className="mn-limb-group">
        <Limbs branches={CROWN_BRANCHES} />
      </g>
      <g className="mn-leaves">
        <Leaves clusters={CROWN_CLUSTERS} seed={23} />
      </g>
      <Orbs orbs={CROWN_ORBS} />
    </svg>
  );
}

/* ---- a short trunk, flaring into roots that go back into the floor ---- */

function RootsArt() {
  return (
    <svg className="mn-art mn-roots" viewBox="0 0 800 250" aria-hidden="true" focusable="false">
      <defs>
        <BarkDefs id="mnBarkR" />
        <linearGradient id="mnFadeR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id="mnRootMaskR">
          <rect x="0" y="0" width="800" height="250" fill="url(#mnFadeR)" />
        </mask>
      </defs>
      <g className="mn-limb-group">
        <path d="M376 14 C350 4 320 -6 296 -26" strokeWidth="8" />
        <path d="M424 14 C450 4 480 -6 504 -26" strokeWidth="8" />
        <path d="M400 6 C400 -6 400 -14 400 -30" strokeWidth="7" />
      </g>
      <g mask="url(#mnRootMaskR)">
        <path
          d="M372 0 L428 0 L428 80 C430 108 440 136 472 168 L328 168 C360 136 370 108 372 80 Z"
          fill="url(#mnBarkR)"
        />
        <g className="mn-limb-group">
          <path d="M380 120 C340 150 260 160 190 200 S 90 230 40 250" strokeWidth="10" />
          <path d="M420 120 C460 150 540 160 610 200 S 710 230 760 250" strokeWidth="10" />
          <path d="M392 140 C370 180 330 210 300 250" strokeWidth="8" />
          <path d="M408 140 C430 180 470 210 500 250" strokeWidth="8" />
          <path d="M400 150 C400 190 400 220 400 250" strokeWidth="7" />
        </g>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------
   Shared form (add a memory / edit a memory)
   Lives outside the screens so typing never loses focus.
   --------------------------------------------------------- */

type FormProps = {
  heading: string;
  saveLabel: string;
  draft: MemoryDraft;
  onChange: (field: keyof MemoryDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function MemoryForm({ heading, saveLabel, draft, onChange, onSave, onCancel }: FormProps) {
  return (
    <div className="mn-panel" role="group" aria-label={heading}>
      <div className="mn-panel-title">{heading}</div>

      <label className="mn-field">
        <span>Memory name</span>
        <input
          type="text"
          value={draft.name}
          placeholder="What is this memory called?"
          onChange={(e) => onChange("name", e.target.value)}
        />
      </label>

      <label className="mn-field">
        <span>Memory holder</span>
        <input
          type="text"
          value={draft.holder}
          placeholder="Whose memory is it?"
          onChange={(e) => onChange("holder", e.target.value)}
        />
      </label>

      <div className="mn-field" role="group" aria-label="How does this memory feel?">
        <span>How does it feel?</span>
        <div className="mn-feel">
          {EMOTIONS.map((e) => {
            const on = (draft.emotion || "unsorted") === e.id;
            return (
              <button
                key={e.id}
                type="button"
                className={"mn-feel-opt" + (on ? " is-on" : "")}
                data-emotion={e.id}
                aria-pressed={on}
                title={e.hint}
                onClick={() => onChange("emotion", e.id)}
              >
                <i className="mn-swatch" aria-hidden="true" />
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mn-field">
        <span>Image URL</span>
        <input
          type="url"
          value={draft.imageUrl}
          placeholder="https://…"
          onChange={(e) => onChange("imageUrl", e.target.value)}
        />
      </label>

      {draft.imageUrl.trim() && (
        <img
          className="mn-preview"
          src={draft.imageUrl}
          alt="Preview of the memory"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          onLoad={(e) => {
            e.currentTarget.style.display = "block";
          }}
        />
      )}

      <label className="mn-field">
        <span>Details</span>
        <textarea
          rows={5}
          value={draft.details}
          placeholder="What does this memory hold?"
          onChange={(e) => onChange("details", e.target.value)}
        />
      </label>

      <div className="mn-panel-actions">
        <button type="button" className="ph-btn" onClick={onSave}>
          {saveLabel}
        </button>
        <button type="button" className="ph-btn ph-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Screen 1 — the entrance
   --------------------------------------------------------- */

export function MnemeEntrance({
  onApproach,
  onLeave,
}: {
  onApproach: () => void;
  onLeave: () => void;
}) {
  return (
    <main className="mn-page">
      <div className="mn-stage mn-stage--narrow">
        <div className="mn-scene">
          <EntranceTree />
        </div>

        <section className="mn-gate">
          <div className="mn-kicker">Guest Services</div>
          <h1 className="mn-title">Mnēmosynē</h1>
          <p className="mn-sub">The Tree of Memory</p>

          <p className="mn-lead">
            A tree stands quietly before you. Its roots disappear into the floor.
          </p>
          <p className="mn-lead mn-lead--soft">
            Somewhere among its branches, something you remember is waiting.
          </p>

          <div className="mn-gate-actions">
            <button type="button" className="ph-btn" onClick={onApproach}>
              Approach the Tree
            </button>
            <button type="button" className="ph-btn ph-btn-secondary" onClick={onLeave}>
              Leave Mnēmosynē
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------
   Screen 2 — the tree, with its memories
   --------------------------------------------------------- */

type TreeProps = {
  memories: MemoryRecord[];
  creatorOpen: boolean;
  draft: MemoryDraft;
  onDraftChange: (field: keyof MemoryDraft, value: string) => void;
  onOpenCreator: () => void;
  onCancelCreator: () => void;
  onSave: () => void;
  onOpen: (memory: MemoryRecord) => void;
  onDelete: (memory: MemoryRecord) => void;
  onLeave: () => void;
};

export function MemoryTree({
  memories,
  creatorOpen,
  draft,
  onDraftChange,
  onOpenCreator,
  onCancelCreator,
  onSave,
  onOpen,
  onDelete,
  onLeave,
}: TreeProps) {
  const count = memories.length;
  const [focus, setFocus] = useState<string | null>(null);
  const feelingOf = (m: MemoryRecord) => emotionOf(m.emotion).id;
  const used = EMOTIONS.map((e) => ({
    ...e,
    n: memories.filter((m) => feelingOf(m) === e.id).length,
  })).filter((e) => e.n > 0);

  return (
    <main className="mn-page">
      <div className="mn-stage">
        <header className="mn-head">
          <h1 className="mn-title">Mnēmosynē</h1>
          <p className="mn-sub">The Tree of Memory</p>
          <p className="mn-lead">
            As you approach Mnēmosynē, its leaves stir, and every memory plays its music of joy and pain.
          </p>

          <p className="mn-count">
            {count === 0
              ? "No memories have grown here yet"
              : `${count} ${count === 1 ? "memory grows" : "memories grow"} on its branches`}
          </p>

          {used.length > 1 && (
            <div className="mn-legend" role="group" aria-label="Show leaves by feeling">
              {used.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={"mn-key" + (focus === e.id ? " is-on" : "")}
                  data-emotion={e.id}
                  aria-pressed={focus === e.id}
                  onClick={() => setFocus(focus === e.id ? null : e.id)}
                >
                  <i className="mn-swatch" aria-hidden="true" />
                  {e.label} <small>{e.n}</small>
                </button>
              ))}
            </div>
          )}

          {!creatorOpen && (
            <button type="button" className="ph-btn" onClick={onOpenCreator}>
              Add a memory
            </button>
          )}
        </header>

        {creatorOpen && (
          <MemoryForm
            heading="Add a memory"
            saveLabel="Save memory"
            draft={draft}
            onChange={onDraftChange}
            onSave={onSave}
            onCancel={onCancelCreator}
          />
        )}

        <section className="mn-tree" aria-label="Memories">
          <div className="mn-crown">
            <div className="mn-foliage" aria-hidden="true" />
            <CrownArt />

            {count === 0 ? (
              <div className="mn-empty">
                <p>Mnēmosynē is quiet.</p>
                <p>Nothing has been remembered here yet.</p>
                {!creatorOpen && (
                  <button type="button" className="ph-btn" onClick={onOpenCreator}>
                    Add the first memory
                  </button>
                )}
              </div>
            ) : (
              <ol className="mn-leaf-grid">
                {memories.map((memory, index) => (
                  <li
                    key={memory.id}
                    className={"mn-lf" + (focus && focus !== feelingOf(memory) ? " is-dim" : "")}
                    data-emotion={feelingOf(memory)}
                    style={
                      {
                        "--d": `${(-((index * 1.7) % 7)).toFixed(1)}s`,
                        "--r": `${((index * 37) % 11) - 5}deg`,
                        "--s": `${18 + ((index * 13) % 5) * 7}px`,
                      } as CSSProperties
                    }
                  >
                    <div className="mn-fruit">
                      <span className="mn-thread" aria-hidden="true" />

                      <button
                        type="button"
                        className="mn-memory"
                        onClick={() => onOpen(memory)}
                        aria-label={`Open memory: ${memory.name} (${emotionOf(memory.emotion).label})`}
                      >
                        <span className="mn-leaf-glow">
                          <span className="mn-leaf-shape">
                            <span className="mn-leaf-pic">
                              {memory.imageUrl ? (
                                <img src={memory.imageUrl} alt="" loading="lazy" />
                              ) : (
                                <span className="mn-frame-empty" aria-hidden="true" />
                              )}
                            </span>
                          </span>
                        </span>
                        <span className="mn-name">{memory.name}</span>
                        <span className="mn-holder">Memory of {memory.holder || "Unknown"}</span>
                      </button>

                      <button
                        type="button"
                        className="mn-let-go"
                        onClick={() => onDelete(memory)}
                        aria-label={`Delete memory: ${memory.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <RootsArt />
        </section>

        <div className="mn-foot">
          <button type="button" className="ph-btn ph-btn-secondary" onClick={onLeave}>
            Step back from the tree
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------
   Screen 3 — one memory
   --------------------------------------------------------- */

type DetailProps = {
  memory: MemoryRecord;
  editing: boolean;
  draft: MemoryDraft;
  onDraftChange: (field: keyof MemoryDraft, value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onBack: () => void;
};

export function MemoryDetail({
  memory,
  editing,
  draft,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onBack,
}: DetailProps) {
  return (
    <main className="mn-page">
      <div className="mn-stage mn-stage--narrow">
        <div className="mn-hang" data-emotion={emotionOf(memory.emotion).id}>
          <span className="mn-hang-limb" aria-hidden="true" />

          <div className="mn-fruit mn-fruit--lone">
            <span className="mn-thread mn-thread--tall" aria-hidden="true" />

            <figure className="mn-relic">
              <div className="mn-frame mn-frame--lg">
                {memory.imageUrl ? (
                  <img src={memory.imageUrl} alt={memory.name} />
                ) : (
                  <span className="mn-frame-empty" aria-hidden="true" />
                )}
              </div>
            </figure>
          </div>
        </div>

        <header className="mn-head mn-head--detail">
          <h1 className="mn-title mn-title--sm">{memory.name}</h1>
          <p className="mn-sub">Memory of {memory.holder || "Unknown"}</p>
          <p className="mn-mood" data-emotion={emotionOf(memory.emotion).id}>
            <i className="mn-swatch" aria-hidden="true" />
            {emotionOf(memory.emotion).label}
          </p>
        </header>

        <section className="mn-note">
          <div className="mn-note-label">Details</div>
          <p className="mn-note-text">{memory.details || "No details recorded."}</p>
        </section>

        {editing && (
          <MemoryForm
            heading="Edit memory"
            saveLabel="Save changes"
            draft={draft}
            onChange={onDraftChange}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        )}

        <div className="mn-actions">
          {!editing && (
            <button type="button" className="ph-btn" onClick={onStartEdit}>
              Edit memory
            </button>
          )}
          <button type="button" className="ph-btn ph-btn-secondary" onClick={onBack}>
            Back to the tree
          </button>
        </div>
      </div>
    </main>
  );
}