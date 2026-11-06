import { useState } from "react";
import { ProficiencyTags } from "./DiceRoller";
import { ROLE_ABILITIES } from "./roleData";

/* =========================================================
   CHARACTER PANEL (Battle Grounds, Player view)
   Quick access to the player's sheet. A summary bar is always
   visible; the full sheet expands on tap.

   Read-only, except Gifts and Totems: players can tap − and +
   to spend or restore Uses during a fight. Those changes go
   out through onUsesChange so App.tsx can save them.
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
}: {
  character: CharacterLite;
  onUsesChange?: (kind: UseKind, id: string, uses: number) => void;
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

  return (
    <section className="bg-panel bg-sheet">
      <div className="bg-sheet-head">
        <div className="bg-sheet-id">
          <div className="bg-eyebrow">Your Character</div>
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
        <div className={"bg-chip" + (c.dread > 0 ? " is-dread" : "")}>
          <span>Dread</span>
          <strong>{c.dread}</strong>
        </div>
        <div className="bg-chip">
          <span>Move</span>
          <strong>{c.movement} ft</strong>
        </div>
      </div>

      {open && (
        <div className="bg-sheet-body">
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
            Everything here is read-only except the Uses of your Gifts and
            Totems. Edit the rest of your character from My Room.
          </p>
        </div>
      )}
    </section>
  );
}