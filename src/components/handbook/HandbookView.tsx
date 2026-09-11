import { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { HANDBOOK_TOPICS, HANDBOOK_CATEGORIES, type HandbookCategory } from "../../data/handbook/topics";
import { RUDIMENTS, type RudimentCategory } from "../../data/handbook/rudiments";

type Section = "topics" | "rudiments";
type TopicFilter = "All" | HandbookCategory;
type RudimentFilter = "All" | RudimentCategory;

// Section 26/65/66: category cards, search, and accordion sections rather
// than a wall of text up front. Doubles as the 40 PAS rudiment library.
export function HandbookView() {
  const [section, setSection] = useState<Section>("topics");
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("All");
  const [rudimentFilter, setRudimentFilter] = useState<RudimentFilter>("All");
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [openRudimentId, setOpenRudimentId] = useState<string | null>(null);

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HANDBOOK_TOPICS.filter((t) => topicFilter === "All" || t.category === topicFilter).filter(
      (t) => !q || t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q))
    );
  }, [query, topicFilter]);

  const filteredRudiments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RUDIMENTS.filter((r) => rudimentFilter === "All" || r.category === rudimentFilter).filter(
      (r) => !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }, [query, rudimentFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSection("topics")}
          aria-pressed={section === "topics"}
          className={[
            "min-h-[40px] rounded-full border px-4 py-1.5 text-sm font-semibold",
            section === "topics" ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
          ].join(" ")}
        >
          Theory Handbook
        </button>
        <button
          type="button"
          onClick={() => setSection("rudiments")}
          aria-pressed={section === "rudiments"}
          className={[
            "min-h-[40px] rounded-full border px-4 py-1.5 text-sm font-semibold",
            section === "rudiments" ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
          ].join(" ")}
        >
          40 Rudiments
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={section === "topics" ? "Search topics..." : "Search rudiments..."}
          className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {section === "topics" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(["All", ...HANDBOOK_CATEGORIES] as TopicFilter[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTopicFilter(c)}
                aria-pressed={topicFilter === c}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  topicFilter === c ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredTopics.map((topic) => {
              const isOpen = openTopicId === topic.id;
              return (
                <div key={topic.id} className="overflow-hidden rounded-lg border border-charcoal-700 bg-charcoal-900/50">
                  <button
                    type="button"
                    onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div>
                      <p className="font-bold">{topic.title}</p>
                      <p className="text-xs text-parchment/50">{topic.summary}</p>
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gold-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gold-400" />}
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t border-charcoal-800 px-4 py-3">
                      {topic.sections.map((s) => (
                        <div key={s.heading}>
                          <p className="text-sm font-semibold text-gold-300">{s.heading}</p>
                          <p className="mt-0.5 break-words text-sm text-parchment/70">{s.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTopics.length === 0 && <p className="py-6 text-center text-sm text-parchment/50">No topics match this search.</p>}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(["All", "Roll", "Diddle", "Flam", "Drag"] as RudimentFilter[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setRudimentFilter(c)}
                aria-pressed={rudimentFilter === c}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  rudimentFilter === c ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredRudiments.map((r) => {
              const isOpen = openRudimentId === r.id;
              return (
                <div key={r.id} className="overflow-hidden rounded-lg border border-charcoal-700 bg-charcoal-900/50">
                  <button
                    type="button"
                    onClick={() => setOpenRudimentId(isOpen ? null : r.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div>
                      <p className="font-bold">
                        {r.number}. {r.name}
                      </p>
                      <p className="break-words font-mono text-xs text-parchment/50">{r.sticking}</p>
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gold-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gold-400" />}
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-charcoal-800 px-4 py-3 text-sm">
                      <p className="break-words text-parchment/70">{r.description}</p>
                      <p className="break-words text-parchment/60">
                        <span className="font-semibold text-gold-300">Purpose: </span>
                        {r.purpose}
                      </p>
                      <p className="break-words text-parchment/60">
                        <span className="font-semibold text-gold-300">Application: </span>
                        {r.application}
                      </p>
                      <p className="text-xs text-parchment/50">
                        Tempo guide — Beginner {r.beginnerBpm} BPM &middot; Intermediate {r.intermediateBpm} BPM &middot; Advanced{" "}
                        {r.advancedBpm} BPM
                      </p>
                      {r.notationCaveat && <p className="text-xs italic text-parchment/40">{r.notationCaveat}</p>}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredRudiments.length === 0 && <p className="py-6 text-center text-sm text-parchment/50">No rudiments match this search.</p>}
          </div>
        </>
      )}
    </div>
  );
}
