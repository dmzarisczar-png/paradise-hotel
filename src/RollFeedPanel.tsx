import type { RollEntry, RollCategory } from "./rollFeed";

/* The shared, temporary roll feed. Newest roll first. */

const CATEGORY_LABEL: Record<RollCategory, string> = {
  initiative: "Initiative",
  check: "Ability Check",
  save: "Saving Throw",
  damage: "Damage",
};

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
                    Dreadful Event
                    {isDM ? `: ${roll.dreadfulEvent}` : " triggered"}
                  </div>
                )}
              </div>

              <time className="bg-roll-time">{timeLabel(roll.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}