"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SELFIE_KEY = "selfie_v1";
const CHARACTER_KEY = "character_v1";

// Preset character options
const PRESET_CHARACTERS = [
  {
    id: "brave-knight",
    name: "Brave Knight",
    emoji: "🛡️",
    description: "A courageous knight ready for any quest",
    color: "from-blue-100 to-indigo-100"
  },
  {
    id: "curious-explorer",
    name: "Curious Explorer",
    emoji: "🧭",
    description: "An adventurous explorer who loves to discover new places",
    color: "from-green-100 to-emerald-100"
  },
  {
    id: "magical-wizard",
    name: "Magical Wizard",
    emoji: "🧙‍♂️",
    description: "A wise wizard with amazing magical powers",
    color: "from-purple-100 to-violet-100"
  },
  {
    id: "friendly-astronaut",
    name: "Friendly Astronaut",
    emoji: "👩‍🚀",
    description: "A space traveler ready to explore the stars",
    color: "from-gray-100 to-slate-100"
  },
  {
    id: "smart-scientist",
    name: "Smart Scientist",
    emoji: "👩‍🔬",
    description: "A brilliant scientist who loves experiments and discoveries",
    color: "from-teal-100 to-cyan-100"
  },
  {
    id: "kind-princess",
    name: "Kind Princess",
    emoji: "👸",
    description: "A caring princess who helps everyone in the kingdom",
    color: "from-pink-100 to-rose-100"
  }
];

export default function PlayAppearancePage() {
  const router = useRouter();
  
  // Character info state
  const [characterName, setCharacterName] = useState("");
  const [characterAge, setCharacterAge] = useState("");
  
  // Character type selection
  const [characterType, setCharacterType] = useState("selfie"); // "selfie" or "preset"
  const [selectedPresetCharacter, setSelectedPresetCharacter] = useState(null);

  // Selfie state
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [selfie, setSelfie] = useState(null); // {url,w,h}
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Load existing data from storage
  useEffect(() => {
    try {
      const characterRaw = localStorage.getItem(CHARACTER_KEY);
      console.log("Character data raw:", characterRaw);
      
      if (characterRaw) {
        const characterData = JSON.parse(characterRaw);
        console.log("Character data parsed:", characterData);
        
        const name = characterData.name || "";
        const age = characterData.age || "";
        
        setCharacterName(name);
        setCharacterAge(age);
        setCharacterType(characterData.type || "selfie");
        setSelectedPresetCharacter(characterData.presetCharacter || null);
        
        console.log("Loaded character data:", { name, age });
        
        // TEMPORARILY DISABLE REDIRECT - let's see what's happening
        // if (!name.trim() || !age) {
        //   console.log("Would redirect due to incomplete data:", { name, age });
        //   setTimeout(() => router.replace("/play/character"), 500);
        // }
      } else {
        console.log("No character data found in localStorage");
        // TEMPORARILY DISABLE REDIRECT
        // setTimeout(() => router.replace("/play/character"), 500);
      }
    } catch (e) {
      console.error("Error loading character data:", e);
    }
  }, []);

  // Load existing selfie data
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELFIE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url) setSelfie(parsed);
      }
    } catch {}
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const onLoaded = () => {
        const w = videoRef.current?.videoWidth || 640;
        const h = videoRef.current?.videoHeight || 480;
        setVideoDims({ w, h });
      };
      videoRef.current.addEventListener("loadedmetadata", onLoaded, { once: true });
      setCameraOn(true);
    } catch (err) {
      console.error(err);
      setCameraError("Could not access camera. Please grant permission and ensure a camera is available.");
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraOn(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const { w, h } = videoDims.w && videoDims.h ? videoDims : { w: 640, h: 480 };
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/png");
    const payload = { url: dataUrl, w, h };
    setSelfie(payload);
    try { localStorage.setItem(SELFIE_KEY, JSON.stringify(payload)); } catch {}
  };

  const clearSelfie = () => {
    setSelfie(null);
    try { localStorage.removeItem(SELFIE_KEY); } catch {}
  };

  useEffect(() => {
    return () => {
      try { stopCamera(); } catch {}
    };
  }, []);

  // Save character data whenever appearance choices change (preserve existing name/age)
  useEffect(() => {
    try {
      // Get existing data
      const existingRaw = localStorage.getItem(CHARACTER_KEY);
      const existingData = existingRaw ? JSON.parse(existingRaw) : {};
      
      // Merge with new appearance data, preserving name and age
      const characterData = { 
        name: existingData.name || characterName, 
        age: existingData.age || characterAge,
        type: characterType,
        presetCharacter: selectedPresetCharacter
      };
      localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
    } catch {}
  }, [characterType, selectedPresetCharacter, characterName, characterAge]);

  const canProceed = (characterType === "selfie" && selfie) || (characterType === "preset" && selectedPresetCharacter);

  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-3xl sm:text-4xl font-bold">Play</h1>
        <p className="mt-2 text-gray-600">Step 2 of 3: Create your character appearance, {characterName}!</p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link href="/play/character" className="w-full sm:w-auto text-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Back to Step 1</Link>
        </div>
      </section>

      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-6">
              <span className="inline-block w-6 h-6 rounded-full bg-indigo-600 text-white grid place-items-center">2</span> 
              Character Appearance
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-gray-900">How do you want to appear in your story?</h2>
            <p className="text-gray-800 mb-6">Choose to use your own photo or pick from our preset characters.</p>

            {/* Character Type Selection */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCharacterType("selfie")}
                  className={`p-8 rounded-2xl border-3 text-left transition-all duration-200 transform hover:scale-105 ${
                    characterType === "selfie"
                      ? "border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-orange-200 shadow-md hover:shadow-lg"
                  }`}
                >
                  <div className="text-5xl mb-4">📸</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Use My Photo</h3>
                  <p className="text-gray-700">Take a selfie to appear as yourself in the story!</p>
                  {characterType === "selfie" && (
                    <div className="mt-3 text-orange-600 font-medium text-sm">✓ Selected!</div>
                  )}
                </button>
                <button
                  onClick={() => setCharacterType("preset")}
                  className={`p-8 rounded-2xl border-3 text-left transition-all duration-200 transform hover:scale-105 ${
                    characterType === "preset"
                      ? "border-green-400 bg-gradient-to-br from-green-50 to-blue-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-green-200 shadow-md hover:shadow-lg"
                  }`}
                >
                  <div className="text-5xl mb-4">🎭</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Choose Character</h3>
                  <p className="text-gray-700">Pick from our collection of fun characters!</p>
                  {characterType === "preset" && (
                    <div className="mt-3 text-green-600 font-medium text-sm">✓ Selected!</div>
                  )}
                </button>
              </div>
            </div>

            {/* Selfie Interface */}
            {characterType === "selfie" && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Take Your Photo</h3>
                
                {cameraError && (
                  <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{cameraError}</div>
                )}

                <div className="flex flex-wrap items-start gap-6">
                  <div className="flex flex-col gap-3">
                    {!cameraOn ? (
                      <button onClick={startCamera} className="rounded-md bg-black text-white px-6 py-3 text-sm font-medium hover:opacity-90">
                        Start Camera
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button onClick={captureFrame} className="rounded-md bg-black text-white px-6 py-3 text-sm font-medium hover:opacity-90">
                          Capture Photo
                        </button>
                        <button onClick={stopCamera} className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
                          Stop Camera
                        </button>
                      </div>
                    )}

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`mt-2 rounded border bg-black w-full max-w-sm ${cameraOn ? "block" : "hidden"}`}
                      style={{ width: "100%", height: "auto" }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {cameraOn && (
                      <p className="mt-2 text-xs text-gray-500">Tip: Smile and center your face in the frame!</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Your Photo</h4>
                    <div className="mt-2">
                      {selfie ? (
                        <Image 
                          src={selfie.url} 
                          alt="your photo" 
                          width={selfie.w || 256} 
                          height={selfie.h || 256} 
                          className="w-64 h-auto rounded border" 
                        />
                      ) : (
                        <div className="w-64 h-40 border rounded flex items-center justify-center text-gray-400">
                          No photo yet
                        </div>
                      )}
                    </div>
                    {selfie && (
                      <div className="mt-3">
                        <button onClick={clearSelfie} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Retake Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preset Character Interface */}
            {characterType === "preset" && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Choose Your Character</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {PRESET_CHARACTERS.map((character) => (
                    <div
                      key={character.id}
                      onClick={() => setSelectedPresetCharacter(character)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md bg-gradient-to-br ${character.color} ${
                        selectedPresetCharacter?.id === character.id
                          ? "border-indigo-600 ring-2 ring-indigo-300"
                          : "border-gray-300 hover:border-indigo-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">{character.emoji}</div>
                        <h4 className="font-semibold text-gray-900 mb-1">{character.name}</h4>
                        <p className="text-xs text-gray-700">{character.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedPresetCharacter && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      <strong>{selectedPresetCharacter.name}</strong> selected! {selectedPresetCharacter.emoji}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">{selectedPresetCharacter.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Next Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/play/idea"
                className={`w-full text-center rounded-lg py-4 px-6 text-lg font-medium transition-colors block ${
                  canProceed
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-disabled={!canProceed}
                onClick={(e) => { if (!canProceed) e.preventDefault(); }}
              >
                Next: Choose Story
              </Link>
              <p className="text-center text-sm text-gray-500 mt-2">Step 2 of 3</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}