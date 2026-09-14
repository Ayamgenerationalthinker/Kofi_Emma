import { useState } from "react";
import { BookOpen, Music, Users, Sparkles, ShieldCheck, Heart, Radio, ChevronRight, Layers, Award } from "lucide-react";

interface Article {
  id: string;
  category: "Musicality" | "Live Church" | "Ghanaian Heritage" | "Beginners" | "Technique";
  title: string;
  readTime: string;
  summary: string;
  content: string[];
}

const ARTICLES: Article[] = [
  {
    id: "art-1",
    category: "Musicality",
    title: "Less is More: Why Mature Drummers Leave Space",
    readTime: "4 min read",
    summary: "The distinction between beginner shedding and professional musicianship is knowing when NOT to play a fill.",
    content: [
      "When drummers first develop speed and chops, there is an overwhelming temptation to fill every measure. Every two bars gets a snare roll; every four bars gets a 32nd-note tom cascade.",
      "In a church service or professional recording, overplaying destroys the song. The drummer's primary responsibility is not to showcase dexterity—it is to establish time, support the vocal lyrics, and anchor the band's low end.",
      "The Golden Rule of Church Drumming: Bad: constant fills. Better: fill at phrase endings. Best: a fill that directly serves the next vocal melody.",
      "Leaving space gives the bass guitar room to breathe, allows keyboard pads to create an emotional atmosphere, and lets the congregation understand every word the worship leader is singing.",
    ],
  },
  {
    id: "art-2",
    category: "Live Church",
    title: "Listening to the Rhythm Section: Bass, Keys & MD",
    readTime: "5 min read",
    summary: "How to lock your kick drum with the bass player and respond instantly to Music Director cues.",
    content: [
      "A great drummer does not play in isolation. In African gospel and church music, the rhythm section functions as a single living organism.",
      "1. Locking with the Bass Player: Your right foot (kick drum) and the bassist's left hand should sound like one unified instrument. Watch their fingers or neck—anticipate their root notes and syncopated pushes.",
      "2. Supporting Keyboard Chords: Keys provide harmony and rhythm. When keys play staccato praise riffs, your snare backbeat must line up with pinpoint precision. When keys hold lush worship pads, feather your kick and lay back.",
      "3. Watching the MD (Music Director): The MD directs section changes using hand signals or talkback mics. Keep your head up. Never stare solely at your snare head.",
    ],
  },
  {
    id: "art-3",
    category: "Live Church",
    title: "How to Recover from Mistakes in Real Time",
    readTime: "3 min read",
    summary: "Dropped a stick? Missed a fill? How professional drummers recover without stopping the church groove.",
    content: [
      "Every drummer drops a stick or misses a turnaround fill eventually. The difference between an amateur and a professional is what happens in the next 2 seconds.",
      "1. NEVER stop the groove: If you lose your right stick, keep the kick on 1 & 3 and left hand on 2 & 4. The congregation will not even realize a stick fell.",
      "2. Never make a face: If you grimace, wince, or apologize on stage, you draw the audience's attention directly to the mistake. Keep your expression confident and serene.",
      "3. Land cleanly on Beat 1: Whatever happened in bar 4, let it go. Land on beat 1 with a solid kick and crash, and lock right back into the pocket.",
    ],
  },
  {
    id: "art-4",
    category: "Ghanaian Heritage",
    title: "The Ghanaian Gospel Drumming Tradition & Kofi Emma Inspiration",
    readTime: "5 min read",
    summary: "The rhythmic heritage of Ghanaian church music: Highlife swing, 6/8 compound worship, and modern gospel pocket.",
    content: [
      "Ghanaian drumming heritage is rooted in rich polyrhythmic traditions—from traditional Gankogui bell timelines and Kpanlogo grooves to the evolution of Highlife and contemporary African church praise.",
      "Kofi Emma (Abele) has inspired thousands of musicians across Ghana and the diaspora with his distinctive linear phrasing, deep pocket, and fluid dynamic control in live church settings.",
      "This application is built to honor that authentic musical tradition: teaching foundational timekeeping, African compound meters (6/8 and 12/8), syncopated highlife pocket, and disciplined church musicianship.",
      "Authenticity Note: Exercises in this coach are inspired by the Ghanaian gospel drumming tradition. Always listen to verified live recordings and study with church mentors to deepen your craft.",
    ],
  },
  {
    id: "art-5",
    category: "Beginners",
    title: "Essential Drumming Terms: The Complete Glossary",
    readTime: "4 min read",
    summary: "Clear, simple explanations of BPM, backbeat, ghost notes, subdivisions, and time signatures.",
    content: [
      "• BPM (Beats Per Minute): The speed or tempo of the music. 60 BPM = 1 beat per second. 120 BPM = 2 beats per second.",
      "• Backbeat: Snare drum hits on beats 2 and 4 in 4/4 time. This provides the punchy pulse people clap along with.",
      "• Ghost Notes: Extremely quiet snare strokes (1-2 inches stick height) played between the loud backbeats to add bounce and texture.",
      "• Subdivision: Dividing the main beat into smaller equal units (e.g., Quarter notes = 1 note per beat, 8th notes = 2 notes per beat, 16th notes = 4 notes per beat, Triplets = 3 notes per beat).",
      "• Time Signature: The top number indicates beats per measure; bottom indicates note value (e.g. 4/4 = 4 quarter notes per bar; 6/8 = 6 eighth notes per bar grouped into 2 main pulses).",
      "• Choke: Hitting a cymbal and instantly grabbing it with your hand to stop all sound abruptly.",
    ],
  },
];

export function Library() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const filteredArticles = selectedCategory === "ALL" ? ARTICLES : ARTICLES.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <BookOpen className="h-4 w-4" />
          Musicianship & Heritage
        </div>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Drummer's Library</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Master the art of church drumming beyond mechanics: dynamics, listening, Ghanaian highlife heritage, and musical maturity.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "Musicality", "Live Church", "Ghanaian Heritage", "Beginners"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setActiveArticle(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
              selectedCategory === cat
                ? "bg-gold-500 text-charcoal-950"
                : "border border-charcoal-700 bg-charcoal-800/60 text-parchment/60 hover:text-parchment"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Article Viewer Modal / Panel */}
      {activeArticle ? (
        <div className="rounded-2xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
          <button
            type="button"
            onClick={() => setActiveArticle(null)}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gold-400 hover:text-gold-300"
          >
            &larr; Back to all guides
          </button>

          <div className="flex items-center gap-2 text-xs text-gold-400">
            <span className="font-bold uppercase">{activeArticle.category}</span>
            <span>&middot;</span>
            <span className="text-parchment/50">{activeArticle.readTime}</span>
          </div>

          <h2 className="mt-2 text-2xl font-black text-parchment md:text-3xl">{activeArticle.title}</h2>
          <p className="mt-2 text-sm text-gold-300/80 italic border-l-2 border-gold-500 pl-3 py-0.5">
            "{activeArticle.summary}"
          </p>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-parchment/80">
            {activeArticle.content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 border-t border-charcoal-800 pt-4 flex justify-between items-center">
            <span className="text-xs text-parchment/40">Abele Drums Coach &middot; Educational Article</span>
            <button
              type="button"
              onClick={() => setActiveArticle(null)}
              className="rounded-lg bg-charcoal-800 px-4 py-2 text-xs font-semibold text-parchment hover:bg-charcoal-700"
            >
              Close Guide
            </button>
          </div>
        </div>
      ) : (
        /* Articles Grid */
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="group cursor-pointer rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6 transition-all hover:border-gold-500/40 hover:bg-charcoal-900"
            >
              <div className="flex items-center justify-between text-xs text-gold-400">
                <span className="font-bold uppercase">{article.category}</span>
                <span className="text-parchment/40">{article.readTime}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-parchment group-hover:text-gold-300 transition-colors">
                {article.title}
              </h3>
              <p className="mt-2 text-xs text-parchment/60 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-gold-400 group-hover:translate-x-1 transition-transform">
                <span>Read Full Guide</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
