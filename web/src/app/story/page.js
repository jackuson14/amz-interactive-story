"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SAMPLE_STORIES } from "@/data/stories";
import { parseMarkdownStory } from "@/utils/markdownParser";


const SELFIE_KEY = "selfie_v1";
const CHARACTER_KEY = "character_v1";

export default function StoryPage() {
  const [selfie, setSelfie] = useState(null);
  const [idx, setIdx] = useState(0);
  const [characterName, setCharacterName] = useState("Lily");
  const [characterGender, setCharacterGender] = useState("girl");

  // Custom story and chat state
  const [customScenes, setCustomScenes] = useState(null);
  const [markdownStory, setMarkdownStory] = useState(null);

  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text:string}
  const [prompt, setPrompt] = useState("");

  const autoGenDone = useRef(false);

  // Read-aloud state
  const [reading, setReading] = useState(false);



  // Load selected sample story via query param (client), with a default fallback
  const [storyId, setStoryId] = useState(null);
  useEffect(() => {
    try {
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const id = qs ? qs.get('story') : null;
      const prompt = qs ? qs.get('prompt') : null;
      
      if (id) {
        setStoryId(id);
      } else if (prompt && prompt.includes("Lily's Lost Smile")) {
        // If the prompt mentions Lily's Lost Smile, load that specific story
        setStoryId("lily-lost-smile");
      } else {
        const list = SAMPLE_STORIES;
        if (list?.length) {
          const rid = list[Math.floor(Math.random() * list.length)]?.id;
          if (rid) setStoryId(rid);
        }
      }
    } catch {}
  }, []);

  const storyTitle = useMemo(() => {
    // For The Lost Smile, just use the generic title
    if (storyId === "lily-lost-smile") {
      return "The Lost Smile";
    }
    if (customScenes) return "Your story";
    const f = SAMPLE_STORIES.find((s) => s.id === storyId);
    return f?.title ?? "Default";
  }, [storyId, customScenes, characterName]);

  const baseScenes = useMemo(
    () => {
      const f = SAMPLE_STORIES.find((s) => s.id === storyId);
      if (f) {
        // If it's a markdown story and we have parsed content, use that
        if (f.isMarkdown && markdownStory) {
          return markdownStory.scenes;
        }
        // If it's a markdown story but content isn't loaded yet, return empty array to wait
        if (f.isMarkdown && !markdownStory) {
          return [];
        }
        return f.scenes;
      }
      const first = SAMPLE_STORIES[0];
      return first ? first.scenes : [];
    },
    [storyId, markdownStory]
  );
  const scenes = customScenes ?? baseScenes;
  
  // Show loading state if we're waiting for markdown content
  const isLoadingMarkdown = storyId && SAMPLE_STORIES.find(s => s.id === storyId)?.isMarkdown && !markdownStory;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELFIE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url) setSelfie(parsed);
      }
    } catch {}
    
    try {
      const characterRaw = localStorage.getItem(CHARACTER_KEY);
      if (characterRaw) {
        const characterData = JSON.parse(characterRaw);
        if (characterData?.name) setCharacterName(characterData.name);
        if (characterData?.gender) setCharacterGender(characterData.gender);
      }
    } catch {}
  }, []);

  // Load markdown story content
  useEffect(() => {
    const loadMarkdownStory = async () => {
      console.log('loadMarkdownStory called with storyId:', storyId);
      if (!storyId) return;
      
      const story = SAMPLE_STORIES.find((s) => s.id === storyId);
      console.log('Found story:', story);
      
      if (story?.isMarkdown && story.markdownPath) {
        console.log('Loading markdown from:', story.markdownPath);
        try {
          // Add cache-busting parameter to ensure fresh content
          const cacheBuster = Date.now();
          const response = await fetch(`${story.markdownPath}?v=${cacheBuster}`);
          console.log('Fetch response status:', response.status);
          const markdownContent = await response.text();
          console.log('Markdown content length:', markdownContent.length);
          const parsedStory = parseMarkdownStory(markdownContent, characterName, characterGender);
          console.log('Parsed story:', parsedStory);
          setMarkdownStory(parsedStory);
        } catch (error) {
          console.error('Failed to load markdown story:', error);
        }
      } else {
        console.log('Not a markdown story or no path');
        setMarkdownStory(null);
      }
    };

    loadMarkdownStory();
  }, [storyId, characterName, characterGender]);

  const current = scenes[idx];
  const next = () => setIdx((v) => Math.min(v + 1, scenes.length - 1));
  const prev = () => setIdx((v) => Math.max(v - 1, 0));
  // Generate a simple 3-scene story from the prompt (local mock)
  const handleGenerate = useCallback((ideaArg) => {
    const idea = (ideaArg ?? prompt ?? "").trim();
    if (!idea) return;

    // append messages
    setMessages((m) => [...m, { role: 'user', text: idea }, { role: 'assistant', text: 'Great! I made a gentle 3‑scene story for you.' }]);
    const mkScene = (i, title) => ({ id: `c${i}`, title, text: `"${idea}" — ${title}.`, bg: ['from-amber-100 via-rose-100 to-sky-100','from-sky-100 via-indigo-100 to-fuchsia-100','from-emerald-100 via-teal-100 to-cyan-100','from-lime-100 via-emerald-100 to-teal-100','from-pink-100 via-rose-100 to-amber-100'][ (i-1) % 5 ] });
    const titles = ["Let's Begin", "A New Friend", "A Fun Challenge", "We Work Together", "Happy Ending"];
    const scenes = titles.map((t, i) => mkScene(i + 1, t));
    setCustomScenes(scenes);
    setIdx(0);
    setPrompt("");

  }, [prompt]);

  // Auto-generate from ?prompt or saved prompt (runs once)
  useEffect(() => {
    if (autoGenDone.current) return;
    try {
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      let p = qs ? qs.get('prompt') : null;
      
      // Skip auto-generation if we're loading a specific predefined story
      if (p && p.includes("Lily's Lost Smile")) {
        autoGenDone.current = true;
        return;
      }
      
      // Skip auto-generation if we have a predefined story loaded via storyId
      if (storyId && storyId !== null) {
        autoGenDone.current = true;
        return;
      }
      
      // Skip auto-generation if we have a story query parameter (means loading predefined story)
      if (qs && qs.get('story')) {
        autoGenDone.current = true;
        return;
      }
      
      if (!p && typeof window !== 'undefined') {
        try { p = localStorage.getItem('story_prompt_v1') || null; } catch {}
      }
      if (p && !customScenes && messages.length === 0) {
        setPrompt(p);
        handleGenerate(p);
        autoGenDone.current = true;
      }
    } catch {}
  }, [customScenes, messages.length, handleGenerate, storyId]);

  // Read-aloud helpers
  const speakCurrent = () => {
    try {
      if (typeof window === 'undefined') return;
      const s = window.speechSynthesis;
      if (!s || !current) return;
      const u = new SpeechSynthesisUtterance(`${current.title}. ${current.text}`);
      u.rate = 0.95; // slightly slower for kids
      u.pitch = 1.05; // a bit brighter
      u.onend = () => { setReading(false); };
      s.cancel();
      s.speak(u);
      setReading(true);

    } catch {}
  };
  const stopReading = () => {
    try {
      if (typeof window === 'undefined') return;
      const s = window.speechSynthesis;
      if (!s) return;
      s.cancel();
      setReading(false);

    } catch {}
  };
  // If reading, re-speak when scene changes
  useEffect(() => {
    if (reading) speakCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, scenes]);


  const randomizeStory = () => {
    const list = SAMPLE_STORIES;
    if (!list?.length) return;
    const ids = list.map((s) => s.id);
    let rid = ids[Math.floor(Math.random() * ids.length)];
    if (rid === storyId && ids.length > 1) {
      rid = ids[(ids.indexOf(rid) + 1) % ids.length];
    }
    setIdx(0);
    setStoryId(rid);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('story', rid);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };


  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-6 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Story</h1>
          <p className="text-gray-600 text-sm">Sample: {storyTitle}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/play" className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Back</Link>
          <button onClick={randomizeStory} className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500">New story</button>
        </div>
      </section>

      {/* Scene viewport */}
      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-5xl">
          {isLoadingMarkdown ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-600">Loading story...</div>
            </div>
          ) : scenes.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-600">No story content available</div>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Visual */}
            <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${current.bg} min-h-[260px] md:min-h-[360px]`}>
              {current.image ? (
                // Story has an image - show it as the main visual
                <div className="relative h-full">
                  <Image 
                    src={current.image} 
                    alt={current.title} 
                    fill
                    className="object-cover rounded-xl"
                    unoptimized 
                  />
                  {/* Optional overlay for user selfie in corner */}
                  {selfie && (
                    <div className="absolute bottom-4 right-4">
                      <Image 
                        src={selfie.url} 
                        alt="you" 
                        width={80} 
                        height={80} 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-lg ring-2 ring-white/80" 
                        unoptimized 
                      />
                    </div>
                  )}
                </div>
              ) : (
                // No story image - use original gradient design
                <>
                  <div className="absolute inset-0 opacity-40">
                    <div className="w-48 h-48 rounded-full bg-white/60 blur-2xl absolute -top-10 -left-10" />
                    <div className="w-56 h-56 rounded-full bg-white/40 blur-2xl absolute bottom-0 right-0" />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-6">
                    {selfie && (
                      <Image src={selfie.url} alt="you" width={192} height={192} className="w-32 sm:w-40 md:w-48 h-auto rounded-lg shadow-lg ring-1 ring-black/10" unoptimized />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right: Big readable text */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">{current.title}</h2>
                <p className="mt-4 text-lg md:text-xl leading-relaxed text-gray-800">{current.text}</p>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button onClick={prev} disabled={idx === 0} className="w-full sm:w-auto rounded-md border border-gray-300 px-5 py-3 text-lg text-gray-700 disabled:opacity-40 hover:bg-gray-100">Previous</button>
                <button onClick={() => speakCurrent()} className="w-full sm:w-auto rounded-md border border-gray-300 px-5 py-3 text-lg text-gray-700 hover:bg-gray-100">Read aloud</button>
                <button onClick={() => stopReading()} disabled={!reading} className="w-full sm:w-auto rounded-md border border-gray-300 px-5 py-3 text-lg text-gray-700 disabled:opacity-40 hover:bg-gray-100">Stop</button>
                <button onClick={next} disabled={idx === scenes.length - 1} className="w-full sm:w-auto rounded-md bg-indigo-600 text-white px-5 py-3 text-lg disabled:opacity-40 hover:bg-indigo-500">Next</button>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

    </main>
  );
}

