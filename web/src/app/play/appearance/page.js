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

// Get available character images based on age and gender
const getAvailableCharacterImages = (age, gender) => {
  if (!gender || !age) return [];
  
  const genderPrefix = gender === "boy" ? "Male" : "Female";
  
  if (age === "3" || age === "4") {
    // For 3-4yo: Female-Artboard 1,3,5 and Male-Artboard 2,4,6
    const artboardNumbers = gender === "girl" ? [1, 3, 5] : [2, 4, 6];
    return artboardNumbers.map(num => ({
      id: `${genderPrefix}-${num}`,
      path: `/images/3-4yo/${genderPrefix}-Artboard ${num}.jpg`,
      name: `Character ${num}`
    }));
  } else if (age === "5" || age === "6") {
    // For 5-6yo: Female-Artboard 8,10,12 and Male-Artboard 7,9,11  
    const artboardNumbers = gender === "girl" ? [8, 10, 12] : [7, 9, 11];
    return artboardNumbers.map(num => ({
      id: `${genderPrefix}-${num}`,
      path: `/images/5-6yo/${genderPrefix}-Artboard ${num}.jpg`,
      name: `Character ${num}`
    }));
  }
  
  return [];
};

export default function PlayAppearancePage() {
  const router = useRouter();
  
  // Character info state
  const [characterName, setCharacterName] = useState("");
  const [characterAge, setCharacterAge] = useState("");
  const [characterGender, setCharacterGender] = useState("");
  
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

  // Removed character generation state - no longer needed

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
        const gender = characterData.gender || "";
        
        setCharacterName(name);
        setCharacterAge(age);
        setCharacterGender(gender);
        setCharacterType(characterData.type || "selfie");
        setSelectedPresetCharacter(characterData.presetCharacter || null);
        
        console.log("Loaded character data:", { name, age, gender });
        
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

  // Removed generateCharacter function - no longer needed

  useEffect(() => {
    return () => {
      try { stopCamera(); } catch {}
    };
  }, []);

  // Save character data whenever appearance choices change (preserve existing name/age/gender)
  useEffect(() => {
    try {
      // Get existing data
      const existingRaw = localStorage.getItem(CHARACTER_KEY);
      const existingData = existingRaw ? JSON.parse(existingRaw) : {};
      
      // Merge with new appearance data, preserving name, age, and gender
      const characterData = { 
        name: existingData.name || characterName, 
        age: existingData.age || characterAge,
        gender: existingData.gender || characterGender, // Preserve gender!
        type: characterType,
        presetCharacter: selectedPresetCharacter
      };
      localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
    } catch {}
  }, [characterType, selectedPresetCharacter, characterName, characterAge, characterGender]);

  // Allow proceeding if either:
  // - Selfie flow: user has taken a selfie (generation optional)
  // - Preset flow: user selected a preset character
  const canProceed = (characterType === "selfie" && !!selfie) || (characterType === "preset" && !!selectedPresetCharacter);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-r from-orange-400 to-yellow-400">
        <h1 className="text-4xl font-bold text-white mb-2">Create Your Look!</h1>
        <p className="text-orange-100 text-lg">Step 2 of 3: Create your character appearance, {characterName}!</p>
        <div className="mt-6">
          <Link href="/play/character" className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-medium transition-colors backdrop-blur-sm border border-white/20">← Back to Step 1</Link>
        </div>
      </section>

      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white grid place-items-center font-bold text-lg">2</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Appearance</h2>
                <p className="text-gray-600">How do you want to appear in your story?</p>
              </div>
            </div>

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
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-orange-500">📷</span> Camera
                </h3>
                
                {cameraError && (
                  <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{cameraError}</div>
                )}

                <div className="flex flex-wrap items-start gap-6">
                  <div className="flex flex-col gap-3">
                    {!cameraOn ? (
                      <button onClick={startCamera} className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
                        🎬 Start Camera
                      </button>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <button onClick={captureFrame} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg">
                          📸 Capture Photo
                        </button>
                        <button onClick={stopCamera} className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-full font-medium transition-colors">
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
                      <div className="mt-4">
                        <button onClick={clearSelfie} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-green-500">🌟</span> Choose Your Character
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  {getAvailableCharacterImages(characterAge, characterGender).map((characterImg) => (
                    <div
                      key={characterImg.id}
                      onClick={() => setSelectedPresetCharacter(characterImg)}
                      className={`aspect-square rounded-2xl border-3 cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 ${
                        selectedPresetCharacter?.id === characterImg.id
                          ? "border-orange-500 ring-4 ring-orange-300 shadow-2xl scale-105"
                          : "border-white/50 hover:border-orange-300"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <Image
                          src={characterImg.path}
                          alt={characterImg.name}
                          width={200}
                          height={200}
                          className="rounded-lg object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedPresetCharacter && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      <strong>{selectedPresetCharacter.name}</strong> selected! ✨
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">Perfect choice for your story adventure!</p>
                  </div>
                )}
              </div>
            )}

            {/* Next Button */}
            <div className="mt-12 text-center">
              {characterType === "selfie" && selfie && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    ✅ You can continue now, or generate a character for a cartoon version of you.
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Tip: Generating a character makes your stories more personalized, but it’s optional.
                  </p>
                </div>
              )}

              <Link
                href="/play/idea"
                className={`inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
                  canProceed 
                    ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-disabled={!canProceed}
                onClick={(e) => { if (!canProceed) e.preventDefault(); }}
              >
                <span>Next: Choose Story</span>
                <span className="text-2xl">🎯</span>
              </Link>
              <p className="text-sm text-gray-500 mt-3">
                Step 2 of 3 {canProceed && <span className="text-green-600">✓ Complete</span>}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}