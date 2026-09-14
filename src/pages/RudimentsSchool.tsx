import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, BookOpen, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";
import { PAS_RUDIMENTS, type RudimentCategory } from "../data/rudiments";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getDb } from "../lib/localDb";

export function RudimentsSchool() {
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | RudimentCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  useLocalDbVersion();
  const db = getDb();

  const filteredRudiments = PAS_RUDIMENTS.filter((r) => {
    const matchesCat = selectedCategory === "ALL" || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sticking.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(r.number).includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const categories: Array<{ key: "ALL" | RudimentCategory; label: string; count: number }> = [
    { key: "ALL", label: "All 40 Rudiments", count: 40 },
    { key: "ROLL", label: "Rolls", count: 15 },
    { key: "PARADIDDLE", label: "Paradiddles", count: 4 },
    { key: "FLAM", label: "Flams", count: 11 },
    { key: "DRAG", label: "Drags", count: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <BookOpen className="h-4 w-4" />
          Percussive Arts Society Standard
        </div>
        <h1 className="mt-1 text-2xl font-black text-parchment md:text-3xl">40 Drum Rudiments School</h1>
        <p className="mt-1 text-sm text-parchment/60">
          The recognized international vocabulary of hand technique, control, evenness, and sticking vocabulary.
        </p>
      </div>

      {/* Open -> Close -> Open Method Card */}
      <section className="rounded-2xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-5 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400">PAS Practice Method</span>
            <h3 className="mt-1 text-sm font-bold text-parchment">Open &rarr; Close &rarr; Open Principle</h3>
            <p className="mt-1 text-xs text-parchment/70 leading-relaxed">
              Start <strong>Open (Slow & Controlled)</strong> &rarr; Gradually accelerate into <strong>Closed (Fastest Controlled Tempo)</strong> &rarr; Decelerate back to <strong>Open (Slow)</strong>. Never sacrifice even spacing or sound quality for raw speed.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Category Filter Chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={[
                "min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
                selectedCategory === cat.key
                  ? "bg-gold-500 text-charcoal-950 shadow-md"
                  : "border border-charcoal-700 bg-charcoal-900/60 text-parchment/70 hover:border-gold-500/40 hover:text-parchment",
              ].join(" ")}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-parchment/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rudiment or sticking..."
            className="w-full rounded-xl border border-charcoal-700 bg-charcoal-900/80 py-2 pl-9 pr-3 text-xs text-parchment placeholder-parchment/40 focus:border-gold-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 40 Rudiments Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRudiments.map((rudiment) => {
          const isMastered = db.progress[rudiment.id]?.status === "MASTERED";

          return (
            <Link
              key={rudiment.id}
              to={`/rudiments/${rudiment.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5 transition-all hover:border-gold-500/50 hover:bg-charcoal-900 shadow-lg hover:shadow-gold-500/5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-charcoal-800 px-2 py-0.5 text-[10px] font-mono font-bold text-gold-400">
                      PAS #{rudiment.number}
                    </span>
                    {isMastered && (
                      <span className="flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-600/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-2.5 w-2.5" /> MASTERED
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-parchment/40">
                    {rudiment.categoryLabel}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-parchment group-hover:text-gold-300">
                  {rudiment.name}
                </h3>

                <div className="mt-2 rounded-lg border border-charcoal-800 bg-charcoal-950/80 px-3 py-2 font-mono text-xs font-bold text-gold-300">
                  {rudiment.sticking}
                </div>

                <p className="mt-2.5 line-clamp-2 text-xs text-parchment/60 leading-relaxed">
                  {rudiment.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-charcoal-800/80 pt-3 text-xs text-parchment/50">
                <span>Default: <strong className="text-parchment">{rudiment.defaultBpm} BPM</strong></span>
                <span className="flex items-center gap-1 font-bold text-gold-400 group-hover:translate-x-0.5 transition-transform">
                  Practice Studio <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Verified Resource Notice */}
      <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/40 p-4 text-xs text-parchment/60 flex items-center justify-between gap-4">
        <div>
          <strong className="text-parchment">Percussive Arts Society Reference:</strong> All 40 names, stickings, and groupings correspond directly to the official PAS 40 International Drum Rudiments standard.
        </div>
        <a
          href="https://www.pas.org/resources/rudiments"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 shrink-0 font-bold"
        >
          PAS Official Reference <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
