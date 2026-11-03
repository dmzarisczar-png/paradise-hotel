import { useState } from "react";
import { ProficiencyTags } from "./DiceRoller";

/* =========================================================
   CHARACTER PANEL (Battle Grounds, Player view)
   Read-only quick access to the player's sheet. A summary
   bar is always visible; the full sheet expands on tap.
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

export default function CharacterPanel({
  character,
}: {
  character: CharacterLite;
}) {
  const [open, setOpen] = useState(false);
  const c = character;

  const abilities = CORES.filter(
    (core) =>
      c.abilities?.[core]?.name?.trim() ||
      c.abilities?.[core]?.description?.trim()
  );

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
            {[c.role, c.role2].map((role, index) => (
              <div key={index} className="bg-role">
                <div className="bg-eyebrow">
                  {index === 0 ? "Primary" : "Secondary"}
                </div>
                <div className="bg-role-name">{role || "No role selected"}</div>
                {role && (
                  <ProficiencyTags
                    skills={c.skills}
                    role={role}
                    otherRole={index === 0 ? c.role2 : c.role}
                  />
                )}
              </div>
            ))}
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

          <p className="bg-sheet-note">
            This is a read-only view. Edit your character from My Room.
          </p>
        </div>
      )}
    </section>
  );
}