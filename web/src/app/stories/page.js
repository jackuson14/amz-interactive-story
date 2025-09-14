"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SAMPLE_STORIES } from "@/data/stories";

const SELFIE_KEY = "selfie_v1";

export default function StoriesPage() {
  const [hasSelfie, setHasSelfie] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELFIE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      setHasSelfie(!!parsed?.url);
    } catch {
      setHasSelfie(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-6 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Choose a Sample Story</h1>
          <p className="text-gray-600 text-sm">Pick a story to play. Your selfie {hasSelfie ? "will" : "can"} be composited as the character.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/play" className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Back</Link>
        </div>
      </section>

      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {SAMPLE_STORIES.map((s) => (
            <div key={s.id} className="rounded-xl border p-5 hover:shadow-sm transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100" />
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-xs text-gray-500">{s.scenes.length} scenes</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-700 line-clamp-3">{s.blurb}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={{ pathname: "/story", query: { story: s.id } }}
                  className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500"
                >
                  Start
                </Link>
                <Link
                  href={{ pathname: "/story", query: { story: s.id } }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Preview
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

