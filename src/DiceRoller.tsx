import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/* =========================================================
   DICE ROLLER + PROFICIENCY TAGS
   Self-contained: nothing here needs to be imported from App.tsx.
   Exports:
     DiceRoller        floating dice button + roll panel
     ProficiencyTags   proficient-skill tags for the Role section
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

type SkillMap = Record<SkillName, number>;

/* Only the fields the roller needs, so any Guest from App.tsx fits. */
type RollerGuest = {
  skills: SkillMap;
  role: string;
  role2: string;
  dread: number;
};

/* ---------- Look (matches App.tsx) ---------- */

const colors = {
  panel: "rgba(20, 24, 21, .94)",
  gold: "#c8b991",
  goldBright: "#e4d19c",
  text: "#eee9dc",
  muted: "#9d9a8d",
  danger: "#a65b5b",
  border: "rgba(200,185,145,.24)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(0,0,0,.28)",
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  padding: "12px 14px",
  outline: "none",
};

/* ---------- Game data ---------- */

const CORE_SKILLS: Record<Core, SkillName[]> = {
  Mind: ["Perception", "Knowledge", "Analysis"],
  Body: ["Might", "Agility", "Endurance"],
  Heart: ["Empathy", "Influence", "Expression"],
  Ego: ["Memory", "Self", "Psyche"],
};

const CORE_LIST: Core[] = ["Mind", "Body", "Heart", "Ego"];

/* Keep in sync with ROLE_PROFICIENCIES in App.tsx */
const ROLE_PROFICIENCIES: Record<string, string[]> = {
  Caretaker: ["Empathy", "Knowledge", "Agility"],
  Dreamer: ["Might", "Expression", "Self"],
  Guardian: ["Endurance", "Perception", "Psyche"],
  Adversary: ["Might", "Agility", "Endurance"],
  Archivist: ["Knowledge", "Analysis", "Memory"],
  Diplomat: ["Expression", "Influence", "Self"],
  Watcher: ["Perception", "Empathy", "Influence"],
  Vessel: ["Memory", "Psyche", "Analysis"],
  Timekeeper: ["Knowledge", "Perception", "Analysis"],
  Doorman: ["Endurance", "Might", "Agility"],
  Overseer: ["Influence", "Expression", "Empathy"],
  Mnēmosynē: ["Memory", "Psyche", "Self"],
};

const DREAD_EVENTS: { title: string; text: string }[] = [
  { title: "A Shadow Follows You", text: "Roll a Psyche check. On a failure, you roll with disadvantage." },
  { title: "Two Shadows Emerge From the Ground", text: "They will attack on their next turn." },
  { title: "The Lights Go Out Around You", text: "You are Blinded until your Dread is removed." },
  { title: "You Are Shackled in Place", text: "Roll an Agility check. On a failure, you cannot move." },
  { title: "Something Grabs Your Ankle From Beneath the Floor", text: "You will be dragged toward a hostile enemy." },
  { title: "Another Dreadful Event", text: "Roll again on the Dread table, or face two Shadows in combat." },
  { title: "Someone Calls Your Name From the Darkness", text: "Roll a Psyche check. On a failure, you answer its call." },
  { title: "The Hallway Stretches Endlessly", text: "You are trapped in place. Find and destroy the medium to escape." },
  { title: "An Unseen Presence Marks You", text: "Enemies can track your location until the encounter ends." },
  { title: "Your Room Appears Before You", text: "No matter where you are, your room manifests. You must confront what awaits inside before you can leave." },
  { title: "Your Reflection Steps Out of the Mirror", text: "It attacks you as a hostile duplicate." },
  { title: "You Slip Into a Random Room", text: "Roll 1d99 to determine which room you enter." },
  { title: "The Maintenance Mistakes You for a Threat", text: "Roll a low Expression check to hide." },
  { title: "The Walls Begin to Bleed", text: "The entire room fills with Dread (14). Everyone inside must roll a Psyche check." },
  { title: "Someone Wearing Your Face Appears Nearby", text: "It steals your role. You cannot reclaim it until the impostor is killed." },
  { title: "A Dreadful Crawls Out of the Basement", text: "Roll Initiative." },
  { title: "The Cleansing Team Has Found You", text: "Two hostile staff members appear and attempt to capture you." },
  { title: "Hunted From Above and Below", text: "Something hunts you from above while another thing crawls beneath you. Two Dreadfuls emerge. Roll Initiative." },
  { title: "The Man Upstairs Has Sent His Collectors", text: "The Things That Crawl emerge to drag you to the Basement. Roll your highest AC Skill." },
  { title: "The Basement Drags You In", text: "You are pulled into the Basement." },
];

/* ---------- Helpers ---------- */

/* Uniform 1..sides using the browser's secure random source.
   Rejection sampling avoids the slight bias plain "% sides" would add. */
export function rollDie(sides: number): number {
  const c = typeof crypto !== "undefined" ? crypto : undefined;

  if (c?.getRandomValues) {
    const range = 0x100000000; // 2^32
    const limit = range - (range % sides);
    const buffer = new Uint32Array(1);

    do {
      c.getRandomValues(buffer);
    } while (buffer[0] >= limit);

    return (buffer[0] % sides) + 1;
  }

  return Math.floor(Math.random() * sides) + 1;
}

function coreTotal(skills: SkillMap, core: Core): number {
  return CORE_SKILLS[core].reduce(
    (sum, skill) => sum + Number(skills[skill] || 0),
    0
  );
}

/* Returns the number of sides, or 0 when the core has no die. */
function coreSidesFor(total: number): number {
  if (total <= 0) return 0;
  if (total <= 3) return 4;
  if (total <= 6) return 6;
  if (total <= 9) return 8;
  if (total <= 12) return 10;
  return 12;
}

function coreLabelFor(total: number): string {
  const sides = coreSidesFor(total);
  return sides ? `d${sides}` : "—";
}

/* ---------- Proficiency tags (Role section) ---------- */

export function ProficiencyTags({
  skills,
  role,
  otherRole,
}: {
  skills: SkillMap;
  role: string;
  otherRole: string;
}) {
  const list = ROLE_PROFICIENCIES[role] ?? [];

  if (list.length === 0) {
    return <span style={{ color: colors.muted, fontSize: 14 }}>—</span>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {list.map((skillName) => {
        const points = Number(skills[skillName as SkillName] || 0);
        const bonus = Math.max(1, Math.ceil(points / 2));
        const shared = ROLE_PROFICIENCIES[otherRole]?.includes(skillName);

        return (
          <div
            key={skillName}
            title={
              shared
                ? "Both roles cover this skill. The bonus does not stack."
                : `Half of ${points} skill point${points === 1 ? "" : "s"}, rounded up`
            }
            style={{
              padding: "6px 10px",
              border: `1px solid ${colors.gold}`,
              background: "rgba(200,185,145,.08)",
              fontSize: 13,
              color: colors.text,
              display: "flex",
              gap: 8,
              alignItems: "baseline",
            }}
          >
            <span>{skillName}</span>
            <span
              style={{
                color: bonus > 0 ? colors.goldBright : colors.muted,
                fontWeight: 700,
              }}
            >
              +{bonus}
            </span>
            {shared && (
              <span style={{ color: colors.muted, fontSize: 10 }}>
                BOTH ROLES
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Dice animation ---------- */

type Phase = "idle" | "rolling" | "landed" | "done";

const DICE_CSS = `
@keyframes ph-tumble {
  0%   { transform: rotate(0deg) translateY(0); }
  25%  { transform: rotate(90deg) translateY(-10px); }
  50%  { transform: rotate(180deg) translateY(0); }
  75%  { transform: rotate(270deg) translateY(-10px); }
  100% { transform: rotate(360deg) translateY(0); }
}
@keyframes ph-settle {
  0%   { transform: scale(1.25) rotate(-14deg); }
  60%  { transform: scale(0.96) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes ph-flash {
  0%   { transform: scale(1.4); filter: drop-shadow(0 0 0 rgba(166,91,91,0)); }
  20%  { transform: translateX(-7px) scale(1.15); }
  40%  { transform: translateX(7px) scale(1.1); }
  60%  { transform: translateX(-4px) scale(1.05); }
  100% { transform: translateX(0) scale(1); filter: drop-shadow(0 0 12px rgba(166,91,91,.8)); }
}
@keyframes ph-rise {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes ph-listen {
  0%, 100% { opacity: .35; }
  50%      { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ph-die, .ph-rise, .ph-listen { animation: none !important; }
}
`;

function D20Face({
  value,
  phase,
  triggered,
  hasDread,
}: {
  value: number;
  phase: Phase;
  triggered: boolean;
  hasDread: boolean;
}) {
  const rolling = phase === "rolling";
  const landed = phase === "landed";

  const stroke = rolling
    ? hasDread
      ? colors.danger
      : colors.gold
    : triggered
    ? colors.danger
    : colors.goldBright;

  const animation = rolling
    ? "ph-tumble .55s linear infinite"
    : landed
    ? triggered
      ? "ph-flash .6s ease-out forwards"
      : "ph-settle .4s ease-out"
    : "none";

  return (
    <svg
      className="ph-die"
      width="120"
      height="120"
      viewBox="0 0 100 100"
      aria-label={`d20 showing ${value}`}
      style={{
        animation,
        filter:
          !rolling && !landed && triggered
            ? "drop-shadow(0 0 12px rgba(166,91,91,.8))"
            : undefined,
      }}
    >
      <polygon
        points="50,4 91,27 91,73 50,96 9,73 9,27"
        fill="rgba(0,0,0,.35)"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points="50,20 79,68 21,68"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        opacity=".45"
      />
      <path
        d="M50 4 L50 20 M91 27 L79 68 M9 27 L21 68 M50 96 L50 68"
        stroke={stroke}
        strokeWidth="1"
        opacity=".3"
      />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fill={triggered && !rolling ? colors.danger : colors.goldBright}
        style={{ fontFamily: "Georgia, serif" }}
      >
        {value}
      </text>
    </svg>
  );
}

/* ---------- Dice roller ---------- */

type RollResult = {
  id: number;
  skill: SkillName | null;
  d20: number;
  dread: number;
  skillValue: number;
  proficiencyBonus: number;
  core: Core | null;
  coreLabel: string;
  coreRoll: number;
  total: number;
  triggered: boolean;
};

export type RollReport = {
  category: "check" | "save";
  formula: string;
  detail: string;
  total: number;
  dreadfulEvent: string | null;
};

export function DiceRoller({
  guest,
  onRoll,
}: {
  guest: RollerGuest;
  onRoll?: (report: RollReport) => void;
}) {

  const [open, setOpen] = useState(false);
  const [skill, setSkill] = useState<SkillName>("Perception");
  const [useAbility, setUseAbility] = useState(false);
  const [abilityCore, setAbilityCore] = useState<Core>("Mind");
  const [result, setResult] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [shown, setShown] = useState(20);
  const timers = useRef<number[]>([]);
  const [rollKind, setRollKind] = useState<"check" | "save">("check");

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  useEffect(() => clearTimers, []);

  const dread = Math.max(0, Math.min(20, Number(guest.dread) || 0));
  const skillValue = Number(guest.skills[skill] || 0);

  const proficient = [guest.role, guest.role2].some((role) =>
    ROLE_PROFICIENCIES[role]?.includes(skill)
  );
  const proficiencyBonus = proficient ? Math.max(1, Math.ceil(skillValue / 2)) : 0;

  // Ability rolls use the core die only: no skill points, no proficiency.
  const appliedSkill = useAbility ? 0 : skillValue;
  const appliedProficiency = useAbility ? 0 : proficiencyBonus;

  const core: Core | null = useAbility ? abilityCore : null;
  const coreTotalValue = core ? coreTotal(guest.skills, core) : 0;
  const coreSides = coreSidesFor(coreTotalValue);
  const coreLabel = core ? coreLabelFor(coreTotalValue) : "";

  function roll() {
    if (phase === "rolling" || phase === "landed") return;
    clearTimers();

    const d20 = rollDie(20);
    const coreRoll = coreSides > 0 ? rollDie(coreSides) : 0;

    const next: RollResult = {
      id: Date.now(),
      skill: useAbility ? null : skill,
      d20,
      dread,
      skillValue: appliedSkill,
      proficiencyBonus: appliedProficiency,
      core,
      coreLabel,
      coreRoll,
      total: d20 + appliedSkill + appliedProficiency + coreRoll,
      // The natural d20 is also the Dreadful Event number.
      triggered: dread > 0 && d20 <= dread,
    };

    setResult(next);

const finish = () => {
  setPhase("done");
  setHistory((previous) => [next, ...previous].slice(0, 5));

  onRoll?.({
    category: rollKind,
    formula: preview,
    detail:
      `d20 ${next.d20}` +
      (next.skill ? ` + ${next.skill} ${next.skillValue}` : "") +
      (next.proficiencyBonus > 0
        ? ` + Proficiency ${next.proficiencyBonus}`
        : "") +
      (next.core && next.coreRoll > 0
        ? ` + ${next.core} ${next.coreLabel} (${next.coreRoll})`
        : ""),
    total: next.total,
    dreadfulEvent: next.triggered ? DREAD_EVENTS[next.d20 - 1].title : null,
  });
};

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setShown(d20);
      finish();
      return;
    }

    setPhase("rolling");

    // Numbers flick by, slowing down so the landing feels heavier.
    let elapsed = 0;
    let delay = 45;
    while (elapsed < 1500) {
      timers.current.push(
        window.setTimeout(() => setShown(rollDie(20)), elapsed)
      );
      elapsed += delay;
      delay = Math.round(delay * 1.15) + 5;
    }

    timers.current.push(
      window.setTimeout(() => {
        setShown(d20);
        setPhase("landed");
      }, elapsed)
    );

    // With Dread, hold the silence a little longer before the verdict.
    timers.current.push(
      window.setTimeout(finish, elapsed + (dread > 0 ? 1000 : 350))
    );
  }

  const labelStyle: CSSProperties = {
    display: "block",
    color: colors.gold,
    fontSize: 10,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    marginBottom: 6,
  };

  const selectStyle: CSSProperties = {
    ...inputStyle,
    colorScheme: "dark",
    cursor: "pointer",
  };

  const preview = [
    "1d20",
    useAbility ? null : `${skill} ${skillValue}`,
    !useAbility && proficient ? `Proficiency ${proficiencyBonus}` : null,
    core && coreSides > 0 ? `${core} ${coreLabel}` : null,
  ]
    .filter(Boolean)
    .join(" + ");

  const event =
    result && result.triggered ? DREAD_EVENTS[result.d20 - 1] : null;

  return (
    <>
      <style>{DICE_CSS}</style>

      {/* FLOATING BUTTON */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close dice roller" : "Open dice roller"}
        title="Dice Roller"
        style={{
          position: "fixed",
          right: 16,
          bottom: 88,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: `1px solid ${colors.gold}`,
          background: "rgba(20,24,21,.96)",
          color: colors.goldBright,
          fontSize: open ? 22 : 26,
          cursor: "pointer",
          zIndex: 950,
          boxShadow: "0 6px 20px rgba(0,0,0,.5)",
        }}
      >
        {open ? "✕" : "🎲"}
      </button>

      {/* ROLLER PANEL */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 154,
            width: "min(380px, calc(100vw - 32px))",
            maxHeight: "calc(100vh - 190px)",
            overflowY: "auto",
            boxSizing: "border-box",
            padding: 18,
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,.6)",
            zIndex: 949,
            color: colors.text,
          }}
        >
          <div
            style={{
              color: colors.goldBright,
              fontSize: 18,
              marginBottom: 14,
            }}
          >
            Dice Roller
          </div>

            <label style={labelStyle}>Roll Type</label>
            <select
              value={rollKind}
              onChange={(e) => setRollKind(e.target.value as "check" | "save")}
              style={{ ...selectStyle, marginBottom: 12 }}
            >
              <option value="check">Ability Check</option>
              <option value="save">Saving Throw</option>
            </select>

          {!useAbility && (
            <>
          <label style={labelStyle}>Skill</label>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value as SkillName)}
            style={selectStyle}
          >
            {CORE_LIST.map((c) => (
              <optgroup key={c} label={c}>
                {CORE_SKILLS[c].map((s) => (
                  <option
                    key={s}
                    value={s}
                    style={{ background: "#111", color: colors.text }}
                  >
                    {s} ({Number(guest.skills[s] || 0)})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
            </>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: colors.text,
              cursor: "pointer",
              margin: "12px 0",
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={useAbility}
              onChange={(e) => setUseAbility(e.target.checked)}
            />
            Using an ability (core die only)
          </label>

          {useAbility && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Core Die</label>
              <select
                value={abilityCore}
                onChange={(e) => setAbilityCore(e.target.value as Core)}
                style={selectStyle}
              >
                {CORE_LIST.map((c) => (
                  <option key={c} value={c} style={{ background: "#111" }}>
                    {c} ({coreLabelFor(coreTotal(guest.skills, c))})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{
              color: colors.muted,
              fontSize: 12,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            {preview}
            {core && coreSides === 0 && (
              <span style={{ color: colors.danger }}>
                {" "}
                · {core} has no core die yet
              </span>
            )}
            <br />
            Dread {dread}:{" "}
            {dread > 0
              ? `natural 1–${dread} triggers that Dreadful Event.`
              : "no Dread, no Dreadful Events."}
          </div>

          <button
            type="button"
            onClick={roll}
            disabled={phase === "rolling" || phase === "landed"}
            style={{
              border: `1px solid ${colors.border}`,
              background: "rgba(200,185,145,.1)",
              color: colors.goldBright,
              padding: "12px 18px",
              borderRadius: 6,
              cursor:
                phase === "rolling" || phase === "landed"
                  ? "not-allowed"
                  : "pointer",
              opacity: phase === "rolling" || phase === "landed" ? 0.5 : 1,
              letterSpacing: ".12em",
              fontSize: 12,
            }}
          >
            ROLL
          </button>

          {phase !== "idle" && result && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: 18,
              }}
            >
              <D20Face
                value={shown}
                phase={phase}
                triggered={result.triggered}
                hasDread={dread > 0}
              />

              {phase === "landed" && dread > 0 && (
                <div
                  className="ph-listen"
                  style={{
                    marginTop: 8,
                    color: colors.muted,
                    fontStyle: "italic",
                    fontSize: 13,
                    animation: "ph-listen 1s ease-in-out infinite",
                  }}
                >
                  The Hotel is listening…
                </div>
              )}
            </div>
          )}

          {result && phase === "done" && (
            <div
              className="ph-rise"
              style={{
                animation: "ph-rise .4s ease-out",
                marginTop: 16,
                padding: 14,
                border: `1px solid ${
                  result.triggered ? colors.danger : colors.border
                }`,
                background: result.triggered
                  ? "rgba(166,91,91,.08)"
                  : "rgba(255,255,255,.02)",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  color: colors.goldBright,
                  lineHeight: 1,
                }}
              >
                {result.total}
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: colors.muted,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <span
                  style={{
                    color: result.triggered ? colors.danger : colors.text,
                    fontWeight: 700,
                  }}
                >
                  d20 {result.d20}
                </span>
                {result.skill &&
                  ` + ${result.skill} ${result.skillValue}`}
                {result.proficiencyBonus > 0 &&
                  ` + Proficiency ${result.proficiencyBonus}`}
                {result.core &&
                  result.coreRoll > 0 &&
                  ` + ${result.core} ${result.coreLabel} (${result.coreRoll})`}
                {` = ${result.total}`}
              </div>

              {result.dread > 0 && !result.triggered && (
                <p
                  style={{
                    margin: "10px 0 0",
                    color: colors.muted,
                    fontSize: 12,
                  }}
                >
                  Natural {result.d20} is above your Dread ({result.dread}).
                  The Hotel lets it pass.
                </p>
              )}

              {event && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${colors.danger}`,
                  }}
                >
                  <div
                    className="ph-rise"
                    style={{
                      animation: "ph-rise .6s ease-out .5s backwards",
                      color: colors.danger,
                      fontSize: 10,
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                    }}
                  >
                    Dreadful Event {result.d20} · Dread {result.dread}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: colors.goldBright,
                      fontSize: 17,
                    }}
                  >
                    {event.title}
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: colors.text,
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {event.text}
                  </p>
                </div>
              )}
            </div>
          )}

          {history.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <div style={labelStyle}>Recent Rolls</div>
              {history.slice(1).map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "6px 0",
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.muted,
                    fontSize: 12,
                  }}
                >
                  {entry.skill ?? "Ability"}: d20 {entry.d20} → {entry.total}
                  {entry.triggered && ` · Dreadful Event ${entry.d20}`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

