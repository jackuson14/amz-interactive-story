"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STORY_PROMPT_KEY = "story_prompt_v1";

export default function PlayIdeaPage() {
  const [storyPrompt, setStoryPrompt] = useState("");

  // Prefill from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORY_PROMPT_KEY);
      if (raw) setStoryPrompt(raw);
    } catch {}
  }, []);

  // Persist as it changes
  useEffect(() => {
    try { localStorage.setItem(STORY_PROMPT_KEY, storyPrompt || ""); } catch {}
  }, [storyPrompt]);

  const canProceed = (storyPrompt || "").trim().length > 0;

  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-3xl sm:text-4xl font-bold">Play</h1>
        <p className="mt-2 text-gray-600">Step 1 of 2: Describe your story idea. Next, you will take a selfie to star in your story.</p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link href="/" className="w-full sm:w-auto text-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Back to home</Link>
        </div>
      </section>

      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border bg-white p-4 sm:p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500"><span className="inline-block w-6 h-6 rounded-full bg-indigo-600 text-white grid place-items-center">1</span> Your story idea</div>
            <h2 className="mt-2 text-lg sm:text-xl font-semibold">Tell us what you want the story to be about</h2>
            <p className="mt-1 text-sm text-gray-600">Example: &quot;a friendly robot helps me explore a candy planet&quot;</p>
            <div className="mt-4 flex flex-col gap-2">
              <input
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                placeholder="Type your idea..."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <Link
                  href="/play/selfie"
                  className="w-full sm:w-auto text-center rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-500 disabled:opacity-50"
                  aria-disabled={!canProceed}
                  onClick={(e) => { if (!canProceed) { e.preventDefault(); } }}
                >
                  Next: Take a selfie
                </Link>
                <p className="text-xs text-gray-500 sm:ml-2">Step 1 of 2</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

