"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SAMPLE_STORIES } from "@/data/stories";
import { parseMarkdownStory } from "@/utils/markdownParser";
import AIStoryGenerator from "@/components/AIStoryGenerator";


const SELFIE_KEY = "selfie_v1";
const CHARACTER_KEY = "character_v1";
const STORY_PROMPT_KEY = "story_prompt_v1";

export default function StoryPage() {
  const router = useRouter();
  const [selfie, setSelfie] = useState(null);
  const [idx, setIdx] = useState(0);
  const [characterName, setCharacterName] = useState("Lily");
  const [characterGender, setCharacterGender] = useState("girl");

  // Character data from previous flow
  const [characterData, setCharacterData] = useState(null);
  const [hasCompletedFlow, setHasCompletedFlow] = useState(false);

  // Custom story and chat state
  const [customScenes, setCustomScenes] = useState(null);
  const [markdownStory, setMarkdownStory] = useState(null);

  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text:string}
  const [prompt, setPrompt] = useState("");
  const [aiGeneratedMeta, setAiGeneratedMeta] = useState(null);


  const autoGenDone = useRef(false);

  // Read-aloud state
  const [reading, setReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);

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
  const next = useCallback(() => setIdx((v) => Math.min(v + 1, scenes.length - 1)), [scenes.length]);
  const prev = () => setIdx((v) => Math.max(v - 1, 0));

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setRecognizedText(transcript);
          
          // Check for keywords to progress story
          const keywords = ['lion', 'monkey', 'penguin', 'hippo', 'goodnight', "let's go", 'lets go'];
          const lowerTranscript = transcript.toLowerCase();
          
          for (const keyword of keywords) {
            if (lowerTranscript.includes(keyword)) {
              console.log('Keyword detected:', keyword);
              // Progress to next scene
              next();
              // Stop listening after keyword detection
              stopListening();
              break;
            }
          }
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setVoiceError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      } else {
        console.log('Speech recognition not supported');
        setSpeechSupported(false);
      }
    }
  }, [next]);
  
  // Start listening for voice commands
  const startListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setVoiceError('Speech recognition not supported in this browser');
      return;
    }
    
    try {
      setVoiceError('');
      setRecognizedText('');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setVoiceError('Failed to start voice recognition');
    }
  };
  
  // Stop listening for voice commands
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

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

  // Read-aloud helpers with play/pause support
  const speakCurrent = () => {
    try {
      if (typeof window === 'undefined') return;
      const s = window.speechSynthesis;
      if (!s || !current) return;
      
      // If paused, resume
      if (isPaused) {
        s.resume();
        setIsPaused(false);
        setReading(true);
        return;
      }
      
      // Start new speech
      const u = new SpeechSynthesisUtterance(`${current.title}. ${current.text}`);
      u.rate = 0.95; // slightly slower for kids
      u.pitch = 1.05; // a bit brighter
      u.onend = () => { 
        setReading(false); 
        setIsPaused(false);
        // Auto-start listening after read-aloud finishes
        if (speechSupported && !isListening) {
          setTimeout(() => {
            startListening();
          }, 500); // Small delay to ensure speech has fully ended
        }
      };
      u.onpause = () => {
        setIsPaused(true);
        setReading(false);
      };
      s.cancel();
      s.speak(u);
      setReading(true);
      setIsPaused(false);

    } catch {}
  };

  const pauseReading = () => {
    try {
      if (typeof window === 'undefined') return;
      const s = window.speechSynthesis;
      if (!s) return;
      s.pause();
      setIsPaused(true);
      setReading(false);
    } catch {}
  };

  const stopReading = () => {
    try {
      if (typeof window === 'undefined') return;
      const s = window.speechSynthesis;
      if (!s) return;
      s.cancel();
      setReading(false);
      setIsPaused(false);
      // Stop listening when read-aloud is manually stopped
      if (isListening) {
        stopListening();
      }
    } catch {}
  };
  // If reading, re-speak when scene changes
  useEffect(() => {
    if (reading) speakCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, scenes]);

  // Auto-play when story loads or scene changes
  useEffect(() => {
    if (current && !reading && !isPaused) {
      // Stop any existing listening when scene changes
      if (isListening) {
        stopListening();
      }
      // Small delay to ensure page is ready
      const timer = setTimeout(() => {
        speakCurrent();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [current, storyId]); // Trigger when current scene or story changes


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
      {aiError && (
        <section className="px-6 sm:px-10 md:px-16 pt-4">
          <div className="mx-auto max-w-5xl">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {aiError}
            </div>
          </div>
        </section>
      )}

      {/* Scene viewport */}
      {!current ? (
        // Loading state when current scene is not yet available
        <section className="px-6 sm:px-10 md:px-16 py-8">
          <div className="mx-auto max-w-5xl">
            {/* Loading skeletons while generating AI story */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
              <div className="h-[260px] md:h-[360px] rounded-xl bg-gray-200" />
              <div className="space-y-4">
                <div className="h-8 w-2/3 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-11/12 bg-gray-200 rounded" />
                <div className="h-4 w-10/12 bg-gray-200 rounded" />
                <div className="h-10 w-1/2 bg-gray-200 rounded mt-6" />
              </div>
            </div>
          </div>
        </section>
      ) : current.bg && current.bg.startsWith('/') ? (
        // Full-screen background image layout (no padding, no container)
        <section className="relative h-screen">
          {/* Background image */}
          <Image
            src={current.bg}
            alt={current.title}
            fill
            className="object-cover"
            unoptimized
          />
          
          {/* Back button - top left corner */}
          <div className="absolute top-6 left-6 z-20">
            <Link 
              href="/play" 
              className="w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>
          
          {/* Content overlay */}
          <div className="relative z-10 h-full flex">
            {/* Left side - character */}
            <div className="w-1/2 flex items-center justify-center p-8">
              {storyId === "goodnight-zoo" && (
                <div className="flex items-end justify-center h-full pb-16">
                  <Image
                    src={`/stories/zoo/char/boy${Math.min(idx + 1, 2)}.png`}
                    alt="Main character"
                    width={300}
                    height={400}
                    className="drop-shadow-2xl"
                    unoptimized
                  />
                </div>
              )}
            </div>
            
            {/* Right side - text content */}
            <div className="w-1/2 flex flex-col justify-center p-8">
              {/* Story content */}
              <div className="text-white drop-shadow-lg">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-6 drop-shadow-lg">{current.title}</h2>
                <p className="text-xl md:text-2xl leading-relaxed mb-8 drop-shadow-lg">{current.text}</p>

                {/* Navigation buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button onClick={prev} disabled={idx === 0} className="w-full sm:w-auto rounded-md bg-white/90 border border-gray-300 px-5 py-3 text-lg text-gray-700 disabled:opacity-40 hover:bg-white">Previous</button>
                  
                  {/* Voice recognition controls */}
                  {speechSupported && (
                    <div className="w-full">
                      {!isListening ? (
                        <button 
                          onClick={startListening}
                          className="flex items-center justify-center gap-2 rounded-md bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 text-lg transition-colors w-full sm:w-auto"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                          </svg>
                          Listen
                        </button>
                      ) : (
                        <button 
                          onClick={stopListening}
                          className="flex items-center justify-center gap-2 rounded-md bg-red-500 hover:bg-red-600 text-white px-5 py-3 text-lg transition-colors animate-pulse w-full sm:w-auto"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                          </svg>
                          Stop Listening
                        </button>
                      )}
                      
                      {recognizedText && (
                        <div className="mt-2 p-2 bg-white/90 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800">
                            <strong>Heard:</strong> {recognizedText}
                          </p>
                        </div>
                      )}
                      
                      {voiceError && (
                        <div className="mt-2 p-2 bg-white/90 rounded-lg border border-red-200">
                          <p className="text-sm text-red-800">{voiceError}</p>
                        </div>
                      )}
                      
                      <div className="mt-2 p-2 bg-white/90 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          🎤 Voice Commands:
                        </p>
                        <p className="text-xs text-blue-600">
                          Listening starts automatically after reading! Say: &quot;Lion&quot;, &rdquo;Monkey&quot;, &quot;Penguin&quot;, &quot;Hippo&quot;, &quot;Let&apos;s go&quot;, or &quot;Goodnight&quot;
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Play/Pause/Stop audio controls */}
                  <div className="flex gap-2">
                    {!reading && !isPaused && (
                      <button 
                        onClick={speakCurrent} 
                        className="flex items-center gap-2 rounded-md bg-green-500 hover:bg-green-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Play
                      </button>
                    )}
                    
                    {reading && (
                      <button 
                        onClick={pauseReading} 
                        className="flex items-center gap-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                        Pause
                      </button>
                    )}
                    
                    {isPaused && (
                      <button 
                        onClick={speakCurrent} 
                        className="flex items-center gap-2 rounded-md bg-green-500 hover:bg-green-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Resume
                      </button>
                    )}
                    
                    {(reading || isPaused) && (
                      <button 
                        onClick={stopReading} 
                        className="flex items-center gap-2 rounded-md bg-red-500 hover:bg-red-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h12v12H6z"/>
                        </svg>
                        Stop
                      </button>
                    )}
                  </div>
                  
                  <button onClick={next} disabled={idx === scenes.length - 1} className="w-full sm:w-auto rounded-md bg-indigo-600 text-white px-5 py-3 text-lg disabled:opacity-40 hover:bg-indigo-500">Next</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        // Original layout for non-background-image stories
        <>
          <section className="px-6 sm:px-10 md:px-16 py-6 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Story</h1>
              <p className="text-gray-600 text-sm">Sample: {storyTitle}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/play" className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Back</Link>
              <button href="/play" className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-500">New story</button>
            </div>
          </section>
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
            // Original grid layout for gradient backgrounds
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
                  
                  {/* Voice recognition controls */}
                  {speechSupported && (
                    <div className="w-full">
                      {!isListening ? (
                        <button 
                          onClick={startListening}
                          className="flex items-center justify-center gap-2 rounded-md bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 text-lg transition-colors w-full sm:w-auto"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                          </svg>
                          Listen
                        </button>
                      ) : (
                        <button 
                          onClick={stopListening}
                          className="flex items-center justify-center gap-2 rounded-md bg-red-500 hover:bg-red-600 text-white px-5 py-3 text-lg transition-colors animate-pulse w-full sm:w-auto"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                          </svg>
                          Stop Listening
                        </button>
                      )}
                      
                      {recognizedText && (
                        <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800">
                            <strong>Heard:</strong> {recognizedText}
                          </p>
                        </div>
                      )}
                      
                      {voiceError && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-800">{voiceError}</p>
                        </div>
                      )}
                      
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          🎤 Voice Commands:
                        </p>
                        <p className="text-xs text-blue-600">
                          Listening starts automatically after reading! Say: &quot;Lion&quot;, &quot;Monkey&quot;, &quot;Penguin&quot;, &quot;Hippo&quot;, &quot;Let&apos;s go&quot;, or &quot;Goodnight&quot;
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Play/Pause/Stop audio controls */}
                  <div className="flex gap-2">
                    {!reading && !isPaused && (
                      <button 
                        onClick={speakCurrent} 
                        className="flex items-center gap-2 rounded-md bg-green-500 hover:bg-green-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Play
                      </button>
                    )}
                    
                    {reading && (
                      <button 
                        onClick={pauseReading} 
                        className="flex items-center gap-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                        Pause
                      </button>
                    )}
                    
                    {isPaused && (
                      <button 
                        onClick={speakCurrent} 
                        className="flex items-center gap-2 rounded-md bg-green-500 hover:bg-green-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Resume
                      </button>
                    )}
                    
                    {(reading || isPaused) && (
                      <button 
                        onClick={stopReading} 
                        className="flex items-center gap-2 rounded-md bg-red-500 hover:bg-red-600 text-white px-5 py-3 text-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h12v12H6z"/>
                        </svg>
                        Stop
                      </button>
                    )}
                  </div>
                  
                  <button onClick={next} disabled={idx === scenes.length - 1} className="w-full sm:w-auto rounded-md bg-indigo-600 text-white px-5 py-3 text-lg disabled:opacity-40 hover:bg-indigo-500">Next</button>
                </div>
              </div>
            </div>
            )}
          </div>
        </section>
        </>
      )}

    </main>
  );
}

