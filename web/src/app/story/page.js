"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SAMPLE_STORIES } from "@/data/stories";
import AIStoryGenerator from "@/components/AIStoryGenerator";
import { StoryLoadingSkeleton } from "@/components/LoadingSpinner";


const SELFIE_KEY = "selfie_v1";
const CHARACTER_KEY = "character_v1";
const STORY_PROMPT_KEY = "story_prompt_v1";

export default function StoryPage() {
  const router = useRouter();
  const [selfie, setSelfie] = useState(null);
  const [idx, setIdx] = useState(0);

  // Character data from previous flow
  const [characterData, setCharacterData] = useState(null);
  const [hasCompletedFlow, setHasCompletedFlow] = useState(false);

  // Custom story and chat state
  const [customScenes, setCustomScenes] = useState(null);
  const [aiGeneratedMeta, setAiGeneratedMeta] = useState(null);

  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text:string}
  const [prompt, setPrompt] = useState("");

  const autoGenDone = useRef(false);

  // Read-aloud state
  const [reading, setReading] = useState(false);

  // AI Story Generator
  const { generateAIStory, loading: aiLoading, error: aiError, setError: setAiError } = AIStoryGenerator({
    onStoryGenerated: (scenes, meta) => {
      setCustomScenes(scenes);
      setAiGeneratedMeta(meta);
      setIdx(0);
      setMessages(m => [...m,
        { role: 'user', text: meta.prompt },
        { role: 'assistant', text: 'I created your story!' }
      ]);
    }
  });

  // Load data from localStorage (selfie, character, story prompt)
  useEffect(() => {
    try {
      // Load selfie
      const selfieRaw = localStorage.getItem(SELFIE_KEY);
      if (selfieRaw) {
        const parsed = JSON.parse(selfieRaw);
        setSelfie(parsed);
      }

      // Load character data
      const characterRaw = localStorage.getItem(CHARACTER_KEY);
      if (characterRaw) {
        const characterParsed = JSON.parse(characterRaw);
        setCharacterData(characterParsed);
      }

      // Load story prompt
      const storyPromptRaw = localStorage.getItem(STORY_PROMPT_KEY);
      if (storyPromptRaw && storyPromptRaw.trim()) {
        setPrompt(storyPromptRaw);
        setHasCompletedFlow(true);
      }
    } catch (e) {
      console.warn('Error loading data from localStorage:', e);
    }
  }, []); // Run only once on mount

  // Auto-generate story when we have a prompt and haven't generated yet
  useEffect(() => {
    if (hasCompletedFlow && prompt && !autoGenDone.current && !customScenes) {
      autoGenDone.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(async () => {
        setAiError(null);
        try {
          await generateAIStory(prompt);
        } catch (error) {
          console.error('Auto story generation failed:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [hasCompletedFlow, prompt, customScenes, generateAIStory, setAiError]);

  // Load selected sample story via query param (client), with a default fallback
  const [storyId, setStoryId] = useState(null);
  useEffect(() => {
    try {
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const id = qs ? qs.get('story') : null;
      if (id) {
        setStoryId(id);
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
    if (customScenes) {
      return aiGeneratedMeta ? "Your AI Story" : "Your Story";
    }
    const f = SAMPLE_STORIES.find((s) => s.id === storyId);
    return f?.title ?? "Default";
  }, [storyId, customScenes, aiGeneratedMeta]);

  const baseScenes = useMemo(
    () => {
      const f = SAMPLE_STORIES.find((s) => s.id === storyId);
      if (f) return f.scenes;
      const first = SAMPLE_STORIES[0];
      return first ? first.scenes : [];
    },
    [storyId]
  );
  const scenes = customScenes ?? baseScenes;

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
  // Handle story generation - always use AI
  const handleGenerate = useCallback(async (ideaArg) => {
    const idea = (ideaArg ?? prompt ?? "").trim();
    if (!idea) return;

    setAiError(null);

    try {
      await generateAIStory(idea);
      setPrompt("");
    } catch (error) {
      console.error('Story generation failed:', error);
    }
  }, [prompt, generateAIStory, setAiError]);

  // Handle template selection for quick stories
  const handleTemplateSelect = useCallback(async (template) => {
    setAiError(null);

    try {
      await generateAIStory(template.blurb);
    } catch (error) {
      console.error('Template story generation failed:', error);
    }
  }, [generateAIStory, setAiError]);

  // Auto-generate from ?prompt or saved prompt (runs once)
  useEffect(() => {
    if (autoGenDone.current) return;
    try {
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      let p = qs ? qs.get('prompt') : null;
      if (!p && typeof window !== 'undefined') {
        try { p = localStorage.getItem('story_prompt_v1') || null; } catch {}
      }
      if (p && !customScenes && messages.length === 0) {
        setPrompt(p);
        handleGenerate(p);
        autoGenDone.current = true;
      }
    } catch {}
  }, [customScenes, messages.length, handleGenerate]);

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


  const startNewStory = useCallback(() => {
    try {
      // Clear all localStorage data from the flow
      localStorage.removeItem(CHARACTER_KEY);
      localStorage.removeItem(SELFIE_KEY);
      localStorage.removeItem(STORY_PROMPT_KEY);

      // Reset component state
      setCustomScenes(null);
      setAiGeneratedMeta(null);
      setHasCompletedFlow(false);
      setCharacterData(null);
      setSelfie(null);
      setPrompt("");
      autoGenDone.current = false;

      // Navigate to character creation
      router.push('/play/character');
    } catch (error) {
      console.error('Error starting new story:', error);
      // Fallback navigation
      window.location.href = '/play/character';
    }
  }, [router]);


  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-6 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Story</h1>
          <p className="text-gray-600 text-sm">Sample: {storyTitle}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/play" className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Back</Link>
          <button onClick={startNewStory} className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500">New story</button>
        </div>
      </section>



      {/* Scene viewport */}
      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-5xl">
          {aiLoading ? (
            <StoryLoadingSkeleton />
          ) : scenes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Visual */}
            <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${current.bg} min-h-[260px] md:min-h-[360px]`}>

              {/* AI Generated Image */}
              {current.image ? (
                <div className="absolute inset-0">
                  <Image
                    src={current.image}
                    alt={`Illustration for ${current.title}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
              ) : (
                <div className="absolute inset-0 opacity-40">
                  <div className="w-48 h-48 rounded-full bg-white/60 blur-2xl absolute -top-10 -left-10" />
                  <div className="w-56 h-56 rounded-full bg-white/40 blur-2xl absolute bottom-0 right-0" />
                </div>
              )}

              <div className="absolute left-1/2 -translate-x-1/2 bottom-6">
                {selfie && (
                  <Image src={selfie.url} alt="you" width={192} height={192} className="w-32 sm:w-40 md:w-48 h-auto rounded-lg shadow-lg ring-1 ring-black/10" unoptimized />
                )}
              </div>

              {/* AI Generated Image Label */}
              {current.image && (
                <div className="absolute top-3 right-3">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    AI Generated
                  </span>
                </div>
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
          ) : hasCompletedFlow ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">⏳</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Creating Your Story...</h3>
                <p className="text-gray-600 mb-8">
                  {characterData?.name ? `${characterData.name}'s` : 'Your'} adventure is being created!
                  This might take a moment while we generate your personalized story.
                </p>

                {aiError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <span className="font-medium">Story creation failed</span>
                    </div>
                    <div className="mt-1">{aiError}</div>
                    <button
                      onClick={() => handleGenerate()}
                      className="mt-3 w-full rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">🚀</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Adventure!</h3>
                <p className="text-gray-600 mb-8">
                  To create a personalized story, please start with the character creation flow.
                </p>

                <Link
                  href="/play/character"
                  className="inline-block rounded-lg bg-indigo-600 text-white px-8 py-3 text-lg font-medium hover:bg-indigo-500 transition-colors"
                >
                  Create Your Character
                </Link>

                <div className="mt-8">
                  <p className="text-sm text-gray-500 mb-3">Or try a quick story:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_STORIES.slice(0, 3).map((story) => (
                      <button
                        key={story.id}
                        onClick={() => handleTemplateSelect(story)}
                        disabled={aiLoading}
                        className="text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="font-medium text-gray-900 text-sm">{story.title}</div>
                        <div className="text-gray-600 text-xs mt-1">{story.blurb}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}

