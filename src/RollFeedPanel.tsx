import { useSyncExternalStore } from "react";
import { getFeedTimeZone, subscribeFeedTimeZone } from "./rollFeed";
import type { RollEntry, RollCategory } from "./rollFeed";

/* The shared, temporary roll feed. Newest roll first. */

const CATEGORY_LABEL: Record<RollCategory, string> = {
  initiative: "Initiative",
  check: "Skill Check",
  save: "Saving Throw",
  damage: "Damage",
};

/* Roll times are shown in the DM's timezone for everyone (the DM's browser
   announces it). Before the DM has been heard from, it shows UTC. */

/* true  = every player sees the name of a triggered Dreadful Event.
   false = players only see "Dreadful Event triggered"; the DM sees the name. */
const SHOW_EVENT_TO_PLAYERS = true;

function timeLabel(at: number, timeZone: string): string {
  return new Date(at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
    timeZoneName: "short",
  });
}

export default function RollFeedPanel({
  rolls,
  isDM,
  onClear,
}: {
  rolls: RollEntry[];
  isDM: boolean;
  onClear?: () => void;
}) {
  const timeZone = useSyncExternalStore(
    subscribeFeedTimeZone,
    getFeedTimeZone
  );

  return (
    <section className="bg-panel">
      <div className="bg-eyebrow">Shared Table</div>
      <h2 style={{ margin: "6px 0 4px" }}>Dice Feed</h2>
      <p className="bg-feed-note">
        Everyone sees these rolls live. Rolls disappear after 60 minutes and are
        never saved.
      </p>

      {isDM && onClear && rolls.length > 0 && (
        <div className="bg-actions" style={{ marginTop: 0, marginBottom: 12 }}>
          <button
            type="button"
            className="ph-btn ph-btn-secondary"
            onClick={() => {
              if (window.confirm("Clear the dice feed for everyone?")) onClear();
            }}
          >
            Clear Feed
          </button>
        </div>
      )}

      {rolls.length === 0 ? (
        <p className="bg-empty">No rolls yet.</p>
      ) : (
        <ol className="bg-feed">
          {rolls.map((roll) => (
            <li key={roll.id} className={"bg-roll is-" + roll.category}>
              <div className="bg-roll-total">{roll.total}</div>

              <div className="bg-roll-body">
                <div className="bg-roll-top">
                  <span className={"bg-badge is-" + roll.category}>
                    {CATEGORY_LABEL[roll.category]}
                  </span>
                  <span className="bg-roll-who">
                    {roll.name}
                    {roll.isDM && <em> · DM</em>}
                  </span>
                </div>

                <div className="bg-roll-formula">{roll.formula}</div>
                {roll.detail && (
                  <div className="bg-roll-detail">{roll.detail}</div>
                )}

                {roll.dreadfulEvent && (
                  <div className="bg-roll-dread">
                    Dreadful Event Triggered
                    {isDM || SHOW_EVENT_TO_PLAYERS
                      ? `: ${roll.dreadfulEvent}`
                      : ""}
                  </div>
                )}
              </div>

              <time
                className="bg-roll-time"
                dateTime={new Date(roll.at).toISOString()}
              >
                {timeLabel(roll.at, timeZone)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}