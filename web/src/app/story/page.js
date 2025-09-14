"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SAMPLE_STORIES } from "@/data/stories";


const SELFIE_KEY = "selfie_v1";

export default function StoryPage() {
  const [selfie, setSelfie] = useState(null);
  const [idx, setIdx] = useState(0);

  // Load selected sample story via query param (client), with a default fallback
  const [storyId, setStoryId] = useState(null);
  useEffect(() => {
    try {
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const id = qs ? qs.get('story') : null;
      if (id) setStoryId(id);
    } catch {}
  }, []);

  const storyTitle = useMemo(() => {
    const f = SAMPLE_STORIES.find((s) => s.id === storyId);
    return f?.title ?? "Default";
  }, [storyId]);

  const scenes = useMemo(
    () => {
      const f = SAMPLE_STORIES.find((s) => s.id === storyId);
      if (f) return f.scenes;
      return [
        { id: "intro", title: "Arrival", text: "You arrive at the ancient gates as dusk settles over the valley.", bg: "from-amber-100 via-rose-100 to-sky-100" },
        { id: "meet", title: "A Whispered Path", text: "A soft voice beckons you down a lantern-lit trail.", bg: "from-sky-100 via-indigo-100 to-fuchsia-100" },
        { id: "choice", title: "Crossroads", text: "Ahead splits in two: follow the glow or forge your own way.", bg: "from-emerald-100 via-teal-100 to-cyan-100" },
      ];
    },
    [storyId]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELFIE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url) setSelfie(parsed);
      }
    } catch {}
  }, []);

  const current = scenes[idx];
  const next = () => setIdx((v) => Math.min(v + 1, scenes.length - 1));
  const prev = () => setIdx((v) => Math.max(v - 1, 0));

  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-6 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Your Story</h1>
          <p className="text-gray-600 text-sm">Sample: {storyTitle}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/play" className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Back</Link>
          <Link href="/stories" className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500">Browse stories</Link>
        </div>
      </section>

      {/* Scene viewport */}
      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Visual */}
            <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${current.bg}`} style={{ minHeight: 360 }}>
              <div className="absolute inset-0 opacity-40">
                <div className="w-48 h-48 rounded-full bg-white/60 blur-2xl absolute -top-10 -left-10" />
                <div className="w-56 h-56 rounded-full bg-white/40 blur-2xl absolute bottom-0 right-0" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6">
                {selfie ? (
                  <Image src={selfie.url} alt="you" width={192} height={192} className="w-48 h-auto rounded-lg shadow-lg ring-1 ring-black/10" unoptimized />
                ) : (
                  <Image src="/placeholder-head.svg" alt="placeholder" width={192} height={192} className="w-48 h-auto rounded-lg shadow-lg ring-1 ring-black/10" />
                )}
              </div>
            </div>

            {/* Right: Big readable text */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-extrabold">{current.title}</h2>
                <p className="mt-4 text-xl leading-relaxed text-gray-800">{current.text}</p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <button onClick={prev} disabled={idx === 0} className="rounded-md border border-gray-300 px-5 py-3 text-lg text-gray-700 disabled:opacity-40 hover:bg-gray-100">Previous</button>
                <button onClick={next} disabled={idx === scenes.length - 1} className="rounded-md bg-indigo-600 text-white px-5 py-3 text-lg disabled:opacity-40 hover:bg-indigo-500">Next</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

