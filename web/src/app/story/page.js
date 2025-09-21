"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SAMPLE_STORIES } from "@/data/stories";
import { parseMarkdownStory } from "@/utils/markdownParser";
import AIStoryGenerator from "@/components/AIStoryGenerator";
import PoseDetection from "@/components/PoseDetection";
import { useTTS } from "@/hooks/useTTS";
import { useTranscribe } from "@/hooks/useTranscribe";



const SELFIE_KEY = "selfie_v1";
const CHARACTER_KEY = "character_v1";
const STORY_PROMPT_KEY = "story_prompt_v1";

export default function StoryPage() {
  // Story page component
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
  const [markdownLoadError, setMarkdownLoadError] = useState(null);

  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text:string}
  const [prompt, setPrompt] = useState("");
  const [aiGeneratedMeta, setAiGeneratedMeta] = useState(null);


  const autoGenDone = useRef(false);

  // AWS Polly TTS integration
  const tts = useTTS({
    defaultVoice: 'Ivy', // Child-friendly default voice
    onEnd: () => {
      // Auto-start voice recognition ONLY after TTS finishes AND if it's not a movement page
      console.log('🔊 TTS finished - checking if should start listening', {
        speechSupported,
        isListening,
        jumpDetectionActive,
        currentPage: idx
      });

      if (speechSupported && !isListening && !jumpDetectionActive && hasUserInteracted && voiceNavEnabled) {
        console.log('✅ Starting voice recognition after TTS ended');
        setTimeout(() => {
          startListening();
        }, 1000); // Small delay to ensure TTS cleanup is complete
      } else {
        console.log('❌ Not starting voice recognition:', {
          reason: !speechSupported ? 'speech not supported' :
                  isListening ? 'already listening' :
                  jumpDetectionActive ? 'movement page active' :
                  !hasUserInteracted ? 'user has not interacted yet' : 'unknown'
        });
      }
    }
  });

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [voiceError, setVoiceError] = useState("");


  // Amazon Transcribe hook for speech-to-text
  const transcribe = useTranscribe({
    languageCode: 'en-US',
    onTranscript: (result) => {
      if (!result.isFinal) {
        setRecognizedText(result.transcript);
      }
    },
    onFinalTranscript: (result) => {
      const transcript = result.transcript || '';
      const lowerTranscript = transcript.toLowerCase().trim();
      const expectedKeyword = getExpectedKeyword();

      console.log('\ud83c\udfa4 Transcribe final result:', {
        transcript,
        lowerTranscript,
        expectedKeyword,
        idx,
        totalScenes: scenes.length,
        isLastPage: idx === scenes.length - 1,
      });

      if (navigationInProgress.current) {
        console.log('\ud83d\udeab Navigation already in progress, ignoring transcription result');
        return;
      }

      if (expectedKeyword && lowerTranscript.includes(expectedKeyword)) {
        if (expectedKeyword === 'goodnight' && idx === scenes.length - 1) {
          setShowTheEnd(true);
          setVoiceError('');
        } else {
          next();
        }
        stopListening();
      } else if (expectedKeyword) {
        // Special handling for variations
        if ((expectedKeyword === "let's go" || expectedKeyword === "lets go") &&
            (lowerTranscript.includes("lets go") || lowerTranscript.includes("let's go"))) {
          next();
          stopListening();
          return;
        }

        if (expectedKeyword === 'goodnight' &&
            (lowerTranscript.includes('good night') || lowerTranscript.includes('goodnight'))) {
          if (idx === scenes.length - 1) {
            setShowTheEnd(true);
            setVoiceError('');
          } else {
            next();
          }
          stopListening();
          return;
        }
      }

        // Provide gentle guidance when keyword not recognized
        if (expectedKeyword && lowerTranscript) {
          setVoiceError(`Heard "${lowerTranscript}" — try saying "${expectedKeyword}"`);
        }

    },
    onError: (error) => {
      const msg = error?.message || '';
      if (!/aborted|no-speech/i.test(msg)) {
        setVoiceError(`Transcription error: ${msg}`);
      }
    },
  });

  // Jump detection state
  const [jumpDetectionActive, setJumpDetectionActive] = useState(false);

  // The End page state
  const [showTheEnd, setShowTheEnd] = useState(false);
  const [celebrationHandsUpDetected, setCelebrationHandsUpDetected] = useState(false);

  // User interaction state for autoplay policy compliance
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);

  const [voiceNavEnabled, setVoiceNavEnabled] = useState(true);

  // Navigation debouncing to prevent page skipping
  const navigationInProgress = useRef(false);
  const lastNavigationTime = useRef(0);

  // Extract speech keyword from current page instruction
  const getPageSpeechKeyword = useCallback((pageText) => {
    if (!pageText) return null;

    const normalize = (s) => String(s)
      .toLowerCase()
      .replace(/["“”‘’]/g, '')       // remove quotes
      .replace(/[!.,?]/g, '')         // remove punctuation
      .replace(/[-–—]/g, ' ')         // hyphens/dashes to space
      .replace(/\s+/g, ' ')          // collapse whitespace
      .trim();

    console.log('🔍 Extracting keyword from text:', pageText);

    // Look for pattern: Say "keyword" to ... (with optional punctuation)
    const sayPattern = /Say\s+"([^"]+)"[!.]?\s+to/i;
    const match = pageText.match(sayPattern);

    if (match) {
      const keyword = normalize(match[1]);
      console.log('✅ Found keyword:', keyword);
      return keyword;
    }

    console.log('❌ No keyword pattern found');
    return null;
  }, []);


  // getExpectedKeyword is defined after scenes/current are initialized to avoid TDZ


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
  const [storyId, setStoryId] = useState(() => {
    // Initialize storyId immediately to prevent fallback flash
    try {
      if (typeof window !== 'undefined') {
        const qs = new URLSearchParams(window.location.search);
        const id = qs.get('story');
        const prompt = qs.get('prompt');

        if (id) {
          return id;
        } else if (prompt && prompt.includes("Lily's Lost Smile")) {
          return "lily-lost-smile";
        }
      }
    } catch {}
    return null; // Return null instead of random story to prevent flash
  });

  // Fallback to random story only if no URL params and no custom scenes
  useEffect(() => {
    if (!storyId && !customScenes && typeof window !== 'undefined') {
      const qs = new URLSearchParams(window.location.search);
      if (!qs.get('story') && !qs.get('prompt')) {
        // Only set random story if there are truly no URL parameters
        const list = SAMPLE_STORIES;
        if (list?.length) {
          const rid = list[Math.floor(Math.random() * list.length)]?.id;
          if (rid) setStoryId(rid);
        }
      }
    }
  }, [storyId, customScenes]);

  const storyTitle = useMemo(() => {
    // For The Lost Smile, just use the generic title
    if (storyId === "lily-lost-smile") {
      return "The Lost Smile";
    }
    if (customScenes) return "Your story";
    const f = SAMPLE_STORIES.find((s) => s.id === storyId);
    return f?.title ?? "Default";
  }, [storyId, customScenes]);

  const baseScenes = useMemo(
    () => {
      // Don't show any content until storyId is properly set
      if (!storyId) {
        return [];
      }

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
      // Only fallback to first story if we have a storyId but can't find it
      const first = SAMPLE_STORIES[0];
      return first ? first.scenes : [];
    },
    [storyId, markdownStory]
  );
  const scenes = customScenes ?? baseScenes;

  // Show loading state if we're waiting for markdown content (but not when using custom AI scenes)
  const isLoadingMarkdown = !customScenes && storyId && SAMPLE_STORIES.find(s => s.id === storyId)?.isMarkdown && !markdownStory;

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
          
          if (!response.ok) {
            throw new Error(`Failed to load story: ${response.status} ${response.statusText}`);
          }
          
          const markdownContent = await response.text();
          console.log('Markdown content length:', markdownContent.length);
          
          if (!markdownContent || markdownContent.length === 0) {
            throw new Error('Story content is empty');
          }
          
          const parsedStory = parseMarkdownStory(markdownContent, characterName, characterGender);
          console.log('Parsed story:', parsedStory);
          
          if (!parsedStory || !parsedStory.scenes || parsedStory.scenes.length === 0) {
            throw new Error('Failed to parse story content');
          }
          
          setMarkdownStory(parsedStory);
          setMarkdownLoadError(null); // Clear any previous errors
        } catch (error) {
          console.error('Failed to load markdown story:', error);
          // Fallback to default scenes if markdown loading fails
          console.log('Using fallback scenes from story configuration');
          setMarkdownStory(null); // This will cause baseScenes to use story.scenes instead
          setMarkdownLoadError('Story loading failed. Using backup version.');
        }
      } else {
        console.log('Not a markdown story or no path');
        setMarkdownStory(null);
      }
    };

    loadMarkdownStory();
  }, [storyId, characterName, characterGender]);

  const current = scenes[idx];
  // Prefer explicit scene keyword when available; fallback to parsing text
  const getExpectedKeyword = () => {
    // Do not use voice keywords on the last scene; last scene uses jump interaction
    if (idx === scenes.length - 1) return null;
    const page = scenes[idx];
    if (page?.keyword) {
      const normalize = (s) => String(s)
        .toLowerCase()
        .replace(/["\u201c\u201d\u2018\u2019]/g, '')
        .replace(/[!.,?]/g, '')
        .replace(/[-\u2013\u2014]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return normalize(page.keyword);
    }
    return getPageSpeechKeyword(page?.text);
  };


  // Debounced next function to prevent page skipping
  const next = useCallback(() => {
    const now = Date.now();
    const timeSinceLastNav = now - lastNavigationTime.current;

    // Prevent multiple navigation calls within 1.5 seconds
    if (navigationInProgress.current || timeSinceLastNav < 1500) {

      console.log('🚫 Navigation blocked - too soon since last navigation', {
        navigationInProgress: navigationInProgress.current,
        timeSinceLastNav,
        minimumDelay: 1500
      });
      return;
    }

    navigationInProgress.current = true;
    lastNavigationTime.current = now;

    console.log('📄 Navigating to next page', {
      currentPage: idx,
      nextPage: Math.min(idx + 1, scenes.length - 1)
    });

    setIdx((v) => Math.min(v + 1, scenes.length - 1));

    // Reset navigation flag after a delay
    setTimeout(() => {
      navigationInProgress.current = false;
    }, 1500);
  }, [scenes.length, idx]);

  const prev = useCallback(() => {
    setIdx((v) => Math.max(v - 1, 0));
  }, []);

  // Stop listening via Amazon Transcribe
  const stopListening = useCallback(() => {
    console.log('🛑 Stopping transcription', { isListening: transcribe.isListening });
    try {
      transcribe.stopListening();
    } catch (error) {
      console.warn('Error stopping transcription:', error);
    }
    setIsListening(false);
    setRecognizedText('');
  }, [transcribe]);


  // Activate jump detection ONLY on the last scene for goodnight-zoo story
  useEffect(() => {
    const isLastScene = idx === scenes.length - 1 && scenes.length > 0;
    const shouldActivateJumpDetection = storyId === "goodnight-zoo" && isLastScene;

    console.log('Jump detection check:', { storyId, idx, scenes: scenes.length, shouldActivate: shouldActivateJumpDetection });

    setJumpDetectionActive(shouldActivateJumpDetection);

    // Stop voice recognition when jump detection activates
    if (shouldActivateJumpDetection && isListening) {
      console.log('Stopping voice recognition for jump detection');
      stopListening();
    }
  }, [storyId, idx, scenes.length, isListening, stopListening]);

  // Handle jump detection
  const handleJumpDetected = useCallback(() => {
    console.log('Jump detected!');
    const isLastScene = idx === scenes.length - 1;
    if (isLastScene) {
      setShowTheEnd(true);
    } else {
      next();
    }
  }, [idx, scenes.length, next]);


  // Cleanup speech recognition when showing "The End" page
  useEffect(() => {
    if (showTheEnd && isListening) {
      console.log('🌙 Stopping speech recognition for The End page');
      stopListening();
    }
  }, [showTheEnd, isListening, stopListening]);

  // Amazon Transcribe: sync support/listening status with UI state
  useEffect(() => {
    setSpeechSupported(transcribe.isSupported);
  }, [transcribe.isSupported]);

  useEffect(() => {
    if (isListening !== transcribe.isListening) {
      setIsListening(transcribe.isListening);
    }
  }, [transcribe.isListening, isListening]);

  useEffect(() => {
    if (transcribe.error) {
      setVoiceError(transcribe.error);
    }
  }, [transcribe.error]);


  // Start listening for voice commands via Amazon Transcribe
  const startListening = useCallback(async () => {
    console.log('🎤 Starting Amazon Transcribe', {
      supported: transcribe.isSupported,
      ready: transcribe.isReady,
      isListening: transcribe.isListening,
      currentPage: idx,
    });


    if (!voiceNavEnabled) {
      setVoiceError('Voice navigation is turned off');
      return;
    }

    try {
      setVoiceError('');
      setRecognizedText('');

      if (!transcribe.isReady) {
        await transcribe.requestPermission().catch(() => {});
      }

      const ok = await transcribe.startListening();
      if (ok) {
        setIsListening(true);
        console.log('✅ Transcription started successfully');
      } else {
        setIsListening(false);
        setVoiceError('Failed to start voice recognition');
      }
    } catch (error) {
      console.error('❌ Failed to start transcription:', error);
      setIsListening(false);
      setVoiceError('Failed to start voice recognition');
    }
  }, [transcribe, idx]);

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

  // AWS Polly TTS functions
  const speakCurrent = useCallback(async () => {
    try {
      if (!current) return;

      // If paused, resume
      if (tts.isPaused) {
        tts.play();
        return;
      }

      // Create story text with character name replacement (title removed from UI, so don't include in speech)
      const personalizedText = current.text.replace(/Lily/g, characterName);

      // Append the voice instruction at the end (for non-final scenes)
      const kw = getExpectedKeyword();
      const instructionToSpeak = kw ? (current.instruction || `Say "${kw}" to go to the next page.`) : null;
      const finalText = instructionToSpeak ? `${personalizedText} ${instructionToSpeak}` : personalizedText;

      // Stop current audio and synthesize new speech
      const result = await tts.synthesizeAndPlay(finalText);

      if (result.success) {
        // Auto-start listening after read-aloud finishes
        // This will be handled by the audio 'ended' event in useTTS hook
      }
    } catch (error) {
      console.error('Error speaking current scene:', error);
    }
  }, [current, tts, characterName]);

  const pauseReading = useCallback(() => {
    tts.pause();
  }, [tts]);

  const stopReading = useCallback(() => {
    tts.stop();
    // Stop listening when read-aloud is manually stopped
    if (isListening) {
      stopListening();
    }
  }, [tts, isListening, stopListening]);

  // Handle initial user interaction to enable autoplay
  const handleStartStory = useCallback(async () => {
    console.log('🎬 User started the story - enabling autoplay');
    setHasUserInteracted(true);
    setShowStartButton(false);

    // Start playing immediately after user interaction
    if (current) {
      try {
        await speakCurrent();
      } catch (error) {
        console.error('Initial play failed:', error);
      }
    }
  }, [current, speakCurrent, setHasUserInteracted, setShowStartButton]);
  // Auto-play when scene changes (idx changes) - only after user interaction
  useEffect(() => {
    if (!current || !hasUserInteracted) return;

    console.log('Scene changed, stopping current audio and starting new scene');

    // Always stop current audio when scene changes
    tts.stop();

    // Stop any existing listening when scene changes
    if (isListening) {
      stopListening();
    }

    // Small delay to ensure cleanup is complete, then start new audio
    const timer = setTimeout(() => {
      speakCurrent();
    }, 300);

    return () => clearTimeout(timer);
  }, [idx, hasUserInteracted]); // Only trigger when scene index changes AND user has interacted

  // Initial auto-play when story first loads - only after user interaction
  useEffect(() => {
    if (current && idx === 0 && !tts.isPlaying && !tts.isPaused && hasUserInteracted) {
      console.log('Initial story load, starting first scene audio');
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        speakCurrent();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [current, storyId, hasUserInteracted]); // Only trigger when story first loads AND user has interacted

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



  // Handle "The End" page
  if (showTheEnd) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-purple-800 mb-6">
                🌟 The End 🌟
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8">
                What a wonderful bedtime story! All the animals at the zoo are now fast asleep,
                and it&apos;s time for you to have sweet dreams too.
              </p>

              {!celebrationHandsUpDetected ? (
                <>
                  {/* Hands up celebration section - shown before gesture */}
                  <div className="mb-8 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white animate-pulse">
                    <p className="text-2xl font-bold mb-3">
                      🙌 Time to Celebrate! 🙌
                    </p>
                    <p className="text-xl mb-4 font-semibold">
                      Lift both hands up high to unlock another story!
                    </p>
                    <p className="text-sm opacity-90">
                      Show the camera both your hands raised up like you&apos;re cheering!
                    </p>
                  </div>

                  {/* Pose detection component for hands-up celebration */}
                  <PoseDetection
                    isActive={true}
                    detectionMode="handsUp"
                    onHandsUpDetected={() => {
                      console.log('🙌 Celebration hands up detected!');
                      setCelebrationHandsUpDetected(true);
                    }}
                  />

                  <p className="text-lg text-gray-600 mt-6">
                    Raise both hands high to continue! 🙌
                  </p>
                </>
              ) : (
                <>
                  {/* Success message after hands up */}
                  <div className="mb-8 p-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl text-white">
                    <p className="text-2xl font-bold mb-3">
                      🌟 Amazing Celebration! 🌟
                    </p>
                    <p className="text-lg">
                      You did it! Ready for another adventure?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-lg text-gray-600">
                      Thank you for joining us on this magical journey! 🦁🐵🐧🦛
                    </p>
                    <button
                      onClick={() => window.location.href = '/play/idea'}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg animate-bounce"
                    >
                      📚 Choose Another Story
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Start Story Button Overlay */}
      {showStartButton && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎬 Ready for Your Story?</h2>
            <p className="text-gray-600 mb-6">
              Click the button below to start your magical bedtime story with voice narration!
            </p>
            <button
              onClick={handleStartStory}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              🌟 Start Story 🌟
            </button>
            <p className="text-xs text-gray-500 mt-4">
              This enables audio playback for the story
            </p>
          </div>
        </div>
      )}

      {(aiError || markdownLoadError) && (
        <section className="px-6 sm:px-10 md:px-16 pt-4">
          <div className="mx-auto max-w-5xl">
            <div className={`${markdownLoadError ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded`}>
              {aiError || markdownLoadError}
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
        // Storybook layout with background image on left, text on right
        <section className="h-screen flex">
          {/* Left side - Full background image */}
          <div className="w-1/2 relative">
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
                href="/play/idea"
                className="w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all transform hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right side - text content */}
          <div className="w-1/2 bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col justify-center p-12 overflow-y-auto">
              {/* Story content */}
              <div className="max-w-xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">{current.title || 'Story Time'}</h2>
                <p className="text-xl leading-relaxed mb-6 text-gray-700">{current.text}</p>


                {(() => {
                  const kw = getExpectedKeyword();
                  return kw ? (
                    <div className="mb-4 p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                      <p className="text-blue-800 text-lg font-bold text-center">Say &quot;{kw}&quot; to go to the next page</p>
                    </div>
                  ) : null;
                })()}

                {/* Final scene jump instruction */}
                {jumpDetectionActive && (
                  <div className="mb-4 p-4 bg-green-100 rounded-lg border-2 border-green-300">
                    <p className="text-green-800 text-lg font-bold text-center">
                      🎉 Jump to finish the story! 🎉
                    </p>
                    <p className="text-green-700 text-sm text-center mt-1">
                      Stand back from your camera so we can see you, then jump!
                    </p>

	                    {/* Voice navigation toggle */}
	                    <div className="mb-2 flex items-center gap-2">
	                      <label className="text-sm font-medium text-gray-700">Voice navigation</label>
	                      <input
	                        type="checkbox"
	                        checked={voiceNavEnabled}
	                        onChange={(e) => {
	                          setVoiceNavEnabled(e.target.checked);
	                          if (!e.target.checked && isListening) {
	                            stopListening();
	                          }
	                        }}
	                        className="rounded"
	                      />
	                      {isListening && (
	                        <span className="ml-2 text-xs text-gray-600">Listening...</span>
	                      )}
	                    </div>

                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button onClick={prev} disabled={idx === 0} className="w-full sm:w-auto rounded-md bg-white border border-gray-300 px-5 py-3 text-lg text-gray-700 disabled:opacity-40 hover:bg-gray-50">Previous</button>

                  {/* Voice recognition controls - disabled on jungle scene */}
                  {speechSupported && !jumpDetectionActive && (
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
                        {(() => {
                          if (!hasUserInteracted) {
                            return (
                              <p className="text-xs text-gray-600">
                                🎬 Click &quot;Start Story&quot; to begin audio and voice commands
                              </p>
                            );
                          }
                          const expectedKeyword = getExpectedKeyword();
                          if (tts.isPlaying) {
                            return (
                              <p className="text-xs text-orange-600">
                                🔊 Reading story... Voice recognition will start when finished.
                              </p>
                            );
                          }
                          return (
                            <p className="text-xs text-blue-600">
                              {expectedKeyword ?
                                `Say: "${expectedKeyword}" to continue!` :
                                'Listening for voice commands...'
                              }
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* AWS Polly TTS Controls */}
                  <div className="flex flex-col gap-3">
                    {/* Voice Selection */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white drop-shadow-lg">Voice:</label>
                      <select
                        value={tts.selectedVoice}
                        onChange={(e) => tts.setSelectedVoice(e.target.value)}
                        className="text-sm bg-white/90 border border-gray-300 rounded px-2 py-1 text-gray-800"
                      >
                        {tts.availableVoices.map(voice => (
                          <option key={voice.Id} value={voice.Id}>
                            {voice.Id} ({voice.gender}) {voice.isRecommended ? '⭐' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white drop-shadow-lg">Volume:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={tts.volume || 0.9}
                        onChange={(e) => tts.setVolume(parseFloat(e.target.value))}
                        className="flex-1 bg-white/30 rounded-lg h-2 slider"
                      />
                      <span className="text-sm text-white drop-shadow-lg min-w-[3rem]">
                        {Math.round((tts.volume || 0.9) * 100)}%
                      </span>
                    </div>

                    {/* Natural Speech Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white drop-shadow-lg">Natural Speech:</label>
                      <input
                        type="checkbox"
                        checked={tts.naturalSpeech}
                        onChange={(e) => tts.setNaturalSpeech(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-white/80 drop-shadow-lg">
                        {tts.naturalSpeech ? 'Enhanced' : 'Standard'}
                      </span>
                    </div>

                    {/* Play/Pause/Stop Controls */}
                    <div className="flex gap-2">
                      {tts.isLoading && (
                        <div className="flex items-center gap-2 text-white">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Generating speech...</span>
                        </div>
                      )}

                      {!tts.isPlaying && !tts.isPaused && !tts.isLoading && (
                        <button
                          onClick={speakCurrent}
                          className="flex items-center gap-2 rounded-md bg-green-500 hover:bg-green-600 text-white px-5 py-3 text-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Play with Polly
                        </button>
                      )}

                      {tts.isPlaying && (
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

                      {tts.isPaused && (
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

                      {(tts.isPlaying || tts.isPaused) && (
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

                    {/* Progress Bar */}
                    {tts.duration > 0 && (
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-white/80 mb-1">
                          <span>{Math.floor(tts.progress * tts.duration / 100 / 60)}:{Math.floor((tts.progress * tts.duration / 100) % 60).toString().padStart(2, '0')}</span>
                          <span>{Math.floor(tts.duration / 60)}:{Math.floor(tts.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${tts.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {tts.error && (
                      <div className="text-red-200 text-sm bg-red-500/20 rounded px-2 py-1">
                        {tts.error}
                      </div>
                    )}
                  </div>

                  <button onClick={next} disabled={idx === scenes.length - 1} className="w-full sm:w-auto rounded-md bg-indigo-600 text-white px-5 py-3 text-lg disabled:opacity-40 hover:bg-indigo-500">Next</button>
                </div>
              </div>
            </div>
        </section>
      ) : (
        // Storybook layout for regular stories
        <section className="h-screen flex">
          {/* Left side - Full image or gradient */}
          <div className="w-1/2 relative">
            {current.image ? (
              // Story has an image - show it full size
              <Image
                src={current.image}
                alt={current.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              // No story image - use gradient with decorative elements
              <div className={`h-full bg-gradient-to-br ${current.bg} relative`}>
                <div className="absolute inset-0 opacity-40">
                  <div className="w-48 h-48 rounded-full bg-white/60 blur-2xl absolute -top-10 -left-10" />
                  <div className="w-56 h-56 rounded-full bg-white/40 blur-2xl absolute bottom-0 right-0" />
                </div>
              </div>
            )}
            
            {/* Back button - top left corner */}
            <div className="absolute top-6 left-6 z-20">
              <Link
                href="/play/idea"
                className="w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all transform hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right side - text content */}
          <div className="w-1/2 bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col justify-center p-12 overflow-y-auto">
            {isLoadingMarkdown ? (
              <div className="flex items-center justify-center">
                <div className="text-gray-600">Loading story...</div>
              </div>
            ) : scenes.length === 0 ? (
              <div className="flex items-center justify-center">
                <div className="text-gray-600">No story content available</div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">{current.title || storyTitle}</h2>
                <p className="text-xl leading-relaxed mb-6 text-gray-700">{current.text}</p>

                  {(() => {
                    const kw = getExpectedKeyword();
                    return kw ? (
                      <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-lg font-bold text-center">Say &quot;{kw}&quot; to go to the next page</p>
                      </div>
                    ) : null;
                  })()}


                  {/* Final scene jump instruction */}
                  {jumpDetectionActive && (
                    <div className="mt-4 p-4 bg-green-100 border-2 border-green-300 rounded-lg">
                      <p className="text-green-800 text-lg font-bold text-center">
                        🎉 Jump to finish the story! 🎉
                      </p>
                      <p className="text-green-700 text-sm text-center mt-1">
                        Stand back from your camera so we can see you, then jump!


                      </p>
                    </div>
                  )}

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button onClick={prev} disabled={idx === 0} className="w-full sm:w-auto rounded-md border border-gray-300 px-5 py-3 text-lg text-gray-700 disabled:opacity-40 hover:bg-gray-100">Previous</button>

                  {/* Voice recognition controls - disabled on jungle scene */}
                  {speechSupported && !jumpDetectionActive && (
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

	                    {/* Voice navigation toggle */}
	                    <div className="mb-2 flex items-center gap-2">
	                      <label className="text-sm font-medium text-gray-700">Voice navigation</label>
	                      <input
	                        type="checkbox"
	                        checked={voiceNavEnabled}
	                        onChange={(e) => {
	                          setVoiceNavEnabled(e.target.checked);
	                          if (!e.target.checked && isListening) {
	                            stopListening();
	                          }
	                        }}
	                        className="rounded"
	                      />
	                      {isListening && (
	                        <span className="ml-2 text-xs text-gray-600">Listening...</span>
	                      )}
	                    </div>

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
                        {(() => {
                          if (!hasUserInteracted) {
                            return (
                              <p className="text-xs text-gray-600">
                                🎬 Click &quot;Start Story&quot; to begin audio and voice commands
                              </p>
                            );
                          }
                          const expectedKeyword = getExpectedKeyword();
                          if (tts.isPlaying) {
                            return (
                              <p className="text-xs text-orange-600">
                                🔊 Reading story... Voice recognition will start when finished.
                              </p>
                            );
                          }
                          return (
                            <p className="text-xs text-blue-600">
                              {expectedKeyword ?
                                `Say: "${expectedKeyword}" to continue!` :
                                'Listening for voice commands...'
                              }
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* AWS Polly TTS Controls */}
                  <div className="flex flex-col gap-3">
                    {/* Voice Selection */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white drop-shadow-lg">Voice:</label>
                      <select
                        value={tts.selectedVoice}
                        onChange={(e) => tts.setSelectedVoice(e.target.value)}
                        className="text-sm bg-white/90 border border-gray-300 rounded px-2 py-1 text-gray-800"
                      >
                        {tts.availableVoices.map(voice => (
                          <option key={voice.Id} value={voice.Id}>
                            {voice.Id} ({voice.gender}) {voice.isRecommended ? '⭐' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white drop-shadow-lg">Volume:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={tts.volume || 0.9}
                        onChange={(e) => tts.setVolume(parseFloat(e.target.value))}
                        className="flex-1 bg-white/30 rounded-lg h-2 slider"
                      />
                      <span className="text-sm text-white drop-shadow-lg min-w-[3rem]">
                        {Math.round((tts.volume || 0.9) * 100)}%
                      </span>
                    </div>

                    {/* Natural Speech Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white drop-shadow-lg">Natural Speech:</label>
                      <input
                        type="checkbox"
                        checked={tts.naturalSpeech}
                        onChange={(e) => tts.setNaturalSpeech(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-white/80 drop-shadow-lg">
                        {tts.naturalSpeech ? 'Enhanced' : 'Standard'}
                      </span>
                    </div>

                    {/* Play/Pause/Stop Controls */}
                    <div className="flex gap-2">
                      {tts.isLoading && (
                        <div className="flex items-center gap-2 text-white">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Generating speech...</span>
                        </div>
                      )}

                      {!tts.isPlaying && !tts.isPaused && !tts.isLoading && (
                        <button
                          onClick={speakCurrent}
                          className="flex items-center gap-2 rounded-md bg-green-500 hover:bg-green-600 text-white px-5 py-3 text-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Play with Polly
                        </button>
                      )}

                      {tts.isPlaying && (
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

                      {tts.isPaused && (
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

                      {(tts.isPlaying || tts.isPaused) && (
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

                    {/* Progress Bar */}
                    {tts.duration > 0 && (
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-white/80 mb-1">
                          <span>{Math.floor(tts.progress * tts.duration / 100 / 60)}:{Math.floor((tts.progress * tts.duration / 100) % 60).toString().padStart(2, '0')}</span>
                          <span>{Math.floor(tts.duration / 60)}:{Math.floor(tts.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${tts.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {tts.error && (
                      <div className="text-red-200 text-sm bg-red-500/20 rounded px-2 py-1">
                        {tts.error}
                      </div>
                    )}
                  </div>

                  <button onClick={next} disabled={idx === scenes.length - 1} className="w-full sm:w-auto rounded-md bg-indigo-600 text-white px-5 py-3 text-lg disabled:opacity-40 hover:bg-indigo-500">Next</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Jump detection component for jungle scene */}
      <PoseDetection
        isActive={jumpDetectionActive}
        onJumpDetected={handleJumpDetected}
      />

    </main>
  );
}

