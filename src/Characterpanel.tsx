import { useEffect, useState } from "react";
import { ProficiencyTags } from "./DiceRoller";
import { ROLE_ABILITIES } from "./roleData";

/* =========================================================
   CHARACTER PANEL (Battle Grounds, Player view)
   Quick access to the player's sheet. A summary bar is always
   visible; the full sheet expands on tap.

   Read-only, except Gifts and Totems: players can tap − and +
   to spend or restore Uses during a fight. Those changes go
   out through onUsesChange so App.tsx can save them.

   The room's "Internal Battle" section (Identity & Dread) sits at the
   top of the opened sheet. A player can drag the lever to change their
   own Dread (it saves through onDreadChange and shows in the room too).
   Without onDreadChange (the DM's view) the lever is read-only.
   ========================================================= */

type Core = "Mind" | "Body" | "Heart" | "Ego";

type SkillName =
  | "Perception"
  | "Knowledge"
  | "Analysis"
  | "Might"
  | "Agility"
  | "Endurance"
  | "Empathy"
  | "Influence"
  | "Expression"
  | "Memory"
  | "Self"
  | "Psyche";

/* A Gift or a Totem. */
export type UseItem = {
  id: string;
  name: string;
  description: string;
  uses: number;
};

export type UseKind = "gifts" | "totems";

/* Only what the panel needs, so App.tsx's Guest fits as it is. */
export type CharacterLite = {
  id?: string;
  name: string;
  room: string;
  title: string;
  role: string;
  role2: string;
  hp: number;
  maxHp: number;
  ac: number;
  memoryPool: number;
  maxMemoryPool: number;
  dread: number;
  movement: number;
  skills: Record<SkillName, number>;
  abilities: Record<Core, { name: string; description: string }>;
  gifts?: UseItem[];
  totems?: UseItem[];
};

const CORE_SKILLS: Record<Core, SkillName[]> = {
  Mind: ["Perception", "Knowledge", "Analysis"],
  Body: ["Might", "Agility", "Endurance"],
  Heart: ["Empathy", "Influence", "Expression"],
  Ego: ["Memory", "Self", "Psyche"],
};

const CORES: Core[] = ["Mind", "Body", "Heart", "Ego"];

function coreDie(total: number): string {
  if (total <= 0) return "—";
  if (total <= 3) return "1d4";
  if (total <= 6) return "1d6";
  if (total <= 9) return "1d8";
  if (total <= 12) return "1d10";
  return "1d12";
}

/* Keep in sync with getDreadMessage in App.tsx */
const DREAD_MESSAGES: Record<number, string> = {
  0: "You feel at peace. The Hotel is quiet. For now, there is nothing to fear.",
  1: "Something about this Hotel is not quite as it should be.",
  2: "When a light is left burning in an empty place, leave it that way.",
  3: "Some doors are locked to keep you out. Not everything inside should be allowed to spread, nor should you be allowed to contaminate it.",
  4: "If the staff tell you that a certain place is off-limits, it is usually best to listen. They may know something you do not.",
  5: "There are things in the Hotel that are harmless when left alone. Disturbing them is another matter.",
  6: "Some of the people here have duties they take very seriously. Do not mistake their kindness for safety.",
  7: "If someone calls you by a name you do not recognize, think carefully before correcting them.",
  8: "Every door leads to a world of its own. What lies beyond reflects the one who calls it home.",
  9: "Some people here know more than they let on. They have their reasons for keeping it to themselves.",
  10: "You carry too much Dread. When you return to your room, be careful what you find waiting.",
  11: "Some people here have already lived through what you have yet to discover.",
  12: "If someone mistakes you for another, do not assume that proving your identity will make things better.",
  13: "The Hotel has its caretakers. Some protect its guests. Others protect the Hotel from what its guests may become.",
  14: "There are places where being noticed means becoming something you were never meant to be.",
  15: "When someone insists you are someone else, perhaps it is safer to let them believe it.",
  16: "Not everything that harms you means to. Some simply believe they are doing what must be done.",
  17: "There are those who see contamination where others see a person. Do not give them reason to be certain.",
  18: "There are eyes above you now, and things crawling in the dark below. Neither has looked away.",
  19: "The Manager has taken note of your presence. Prepare yourself.",
  20: "The Basement awaits your arrival. Come and join them. They await you.",
};

function dreadMessage(dread: number, maxMemory: number): string {
  if (maxMemory <= 0) return "There is no Memory left to protect.";
  return (
    DREAD_MESSAGES[dread] ??
    "Something is terribly wrong. The Hotel is getting closer."
  );
}

/* A name that shows its description when you hover (or focus / tap) it. */
function Tip({ label, text }: { label: string; text?: string }) {
  return (
    <span className="bg-tip" tabIndex={text ? 0 : undefined}>
      {label}
      {text && (
        <span className="bg-tip-text" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}

/* The room's "Internal Battle" section: Dread die, the Dread / Identity
   lever, the Identity die and the Hotel's message. With onChange the lever
   can be dragged (the new number is applied once you stop moving it). */
function InternalBattle({
  dread,
  maxMemory,
  onChange,
}: {
  dread: number;
  maxMemory: number;
  onChange?: (value: number) => void;
}) {
  const saved = Math.max(0, Math.min(20, Math.floor(Number(dread) || 0)));

  /* While the lever is moving, show the number being dragged to. */
  const [draft, setDraft] = useState<number | null>(null);
  const level = draft ?? saved;
  const die = level > 0 ? `1d${level}` : "—";

  /* Apply the dragged number shortly after the lever stops. */
  useEffect(() => {
    if (draft === null || !onChange) return;
    if (draft === saved) {
      setDraft(null);
      return;
    }
    const timer = window.setTimeout(() => onChange(draft), 350);
    return () => window.clearTimeout(timer);
  }, [draft, saved, onChange]);

  return (
    <section className="bg-ib">
      <div className="bg-eyebrow">Internal Battle</div>
      <h3 className="bg-sheet-title bg-ib-title">Identity &amp; Dread</h3>

      <div className="bg-ib-row">
        <div className="bg-ib-side is-dread">
          <span>Dread</span>
          <strong>{die}</strong>
        </div>

        <div className="bg-ib-lever">
          <div className="bg-ib-rail">
            <div className="bg-ib-track" />
            <div className="bg-ib-center" />
            <div
              className="bg-ib-handle"
              style={{ left: `${(level / 20) * 100}%` }}
            >
              <div className="bg-ib-grip" />
            </div>

            {onChange && (
              <input
                className="bg-ib-range"
                type="range"
                min={0}
                max={20}
                step={1}
                value={level}
                aria-label="Dread and Identity balance"
                onChange={(e) => setDraft(Number(e.target.value))}
              />
            )}
          </div>
          <div className="bg-ib-ends">
            <span className="is-dread">Dread</span>
            <span className="is-identity">Identity</span>
          </div>
        </div>

        <div className="bg-ib-side is-identity">
          <span>Identity</span>
          <strong>1d20</strong>
        </div>
      </div>

      <p className="bg-ib-message">{dreadMessage(level, maxMemory)}</p>
    </section>
  );
}

/* Gifts / Totems list with tap − / + for Uses. */
function UseList({
  title,
  kind,
  items,
  onUsesChange,
}: {
  title: string;
  kind: UseKind;
  items: UseItem[];
  onUsesChange?: (kind: UseKind, id: string, uses: number) => void;
}) {
  return (
    <>
      <h3 className="bg-sheet-title">{title}</h3>

      {items.length === 0 ? (
        <p className="bg-empty">No {title} recorded.</p>
      ) : (
        <div className="bg-items">
          {items.map((item) => {
            const uses = Math.max(0, Number(item.uses) || 0);
            return (
              <div key={item.id} className="bg-item">
                <div className="bg-item-name">
                  <Tip
                    label={item.name || `Unnamed ${title.slice(0, -1)}`}
                    text={item.description}
                  />
                </div>

                <div className="bg-uses">
                  <span className="bg-init-label">Uses</span>
                  <button
                    type="button"
                    className="bg-mini"
                    aria-label={`Use one ${item.name || "item"}`}
                    disabled={!onUsesChange || uses <= 0}
                    onClick={() => onUsesChange?.(kind, item.id, uses - 1)}
                  >
                    −
                  </button>
                  <strong className="bg-uses-value">{uses}</strong>
                  <button
                    type="button"
                    className="bg-mini"
                    aria-label={`Restore one ${item.name || "item"}`}
                    disabled={!onUsesChange}
                    onClick={() => onUsesChange?.(kind, item.id, uses + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function CharacterPanel({
  character,
  onUsesChange,
  onDreadChange,
  label = "Your Character",
}: {
  character: CharacterLite;
  onUsesChange?: (kind: UseKind, id: string, uses: number) => void;
  /** drag the Internal Battle lever to change Dread (App.tsx saves it) */
  onDreadChange?: (dread: number) => void;
  /** small heading above the name (the DM view says "Player Sheet") */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const c = character;

  const abilities = CORES.filter(
    (core) =>
      c.abilities?.[core]?.name?.trim() ||
      c.abilities?.[core]?.description?.trim()
  );

  const gifts = Array.isArray(c.gifts) ? c.gifts : [];
  const totems = Array.isArray(c.totems) ? c.totems : [];
  const dread = Math.max(0, Number(c.dread) || 0);

  return (
    <section className="bg-panel bg-sheet">
      <div className="bg-sheet-head">
        <div className="bg-sheet-id">
          <div className="bg-eyebrow">{label}</div>
          <div className="bg-sheet-name">{c.name || "Unnamed Guest"}</div>
          <div className="bg-sheet-sub">
            {[c.title, c.room ? `Room ${c.room}` : ""]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <button
          type="button"
          className="ph-btn ph-btn-secondary"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide Sheet" : "Open Sheet"}
        </button>
      </div>

      <div className="bg-chips">
        <div className="bg-chip">
          <span>HP</span>
          <strong>
            {c.hp} / {c.maxHp}
          </strong>
        </div>
        <div className="bg-chip">
          <span>AC</span>
          <strong>{c.ac}</strong>
        </div>
        <div className="bg-chip">
          <span>Memory</span>
          <strong>
            {c.memoryPool} / {c.maxMemoryPool}
          </strong>
        </div>
        <div className={"bg-chip" + (dread > 0 ? " is-dread" : "")}>
          <span>Dread</span>
          <strong>{dread}</strong>
        </div>
        <div className="bg-chip">
          <span>Move</span>
          <strong>{c.movement} ft</strong>
        </div>
      </div>

      {open && (
        <div className="bg-sheet-body">
          <InternalBattle
            dread={dread}
            maxMemory={Number(c.maxMemoryPool) || 0}
            onChange={onDreadChange}
          />

          <h3 className="bg-sheet-title">Skills</h3>
          <div className="bg-cores">
            {CORES.map((core) => {
              const total = CORE_SKILLS[core].reduce(
                (sum, skill) => sum + Number(c.skills[skill] || 0),
                0
              );
              return (
                <div key={core} className="bg-core">
                  <div className="bg-core-head">
                    <span>{core}</span>
                    <strong>{coreDie(total)}</strong>
                  </div>
                  {CORE_SKILLS[core].map((skill) => (
                    <div key={skill} className="bg-skill">
                      <span>{skill}</span>
                      <strong>{Number(c.skills[skill] || 0)}</strong>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <h3 className="bg-sheet-title">Roles</h3>
          <div className="bg-roles">
            {[c.role, c.role2].map((role, index) => {
              const info = role ? ROLE_ABILITIES[role] : undefined;
              return (
                <div key={index} className="bg-role">
                  <div className="bg-eyebrow">
                    {index === 0 ? "Primary" : "Secondary"}
                  </div>
                  <div className="bg-role-name">
                    {role || "No role selected"}
                  </div>

                  {info && (
                    <div className="bg-role-abilities">
                      <div className="bg-role-line">
                        <span className="bg-eyebrow">Action</span>
                        <Tip label={info.action} text={info.actionText} />
                      </div>
                      <div className="bg-role-line">
                        <span className="bg-eyebrow">Passive</span>
                        <Tip label={info.passive} text={info.passiveText} />
                      </div>
                    </div>
                  )}

                  {role && (
                    <ProficiencyTags
                      skills={c.skills}
                      role={role}
                      otherRole={index === 0 ? c.role2 : c.role}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <h3 className="bg-sheet-title">Abilities</h3>
          {abilities.length === 0 ? (
            <p className="bg-empty">No abilities recorded.</p>
          ) : (
            <div className="bg-abilities">
              {abilities.map((core) => (
                <div key={core} className="bg-ability">
                  <div className="bg-eyebrow">{core}</div>
                  <div className="bg-role-name">
                    {c.abilities[core].name || "Unnamed ability"}
                  </div>
                  {c.abilities[core].description && (
                    <p>{c.abilities[core].description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <UseList
            title="Gifts"
            kind="gifts"
            items={gifts}
            onUsesChange={onUsesChange}
          />
          <UseList
            title="Totems"
            kind="totems"
            items={totems}
            onUsesChange={onUsesChange}
          />

          <p className="bg-sheet-note">
            Everything here is read-only except your Dread lever and the Uses
            of your Gifts and Totems. Edit the rest of your character from
            My Room.
          </p>
        </div>
      )}
    </section>
  );
}