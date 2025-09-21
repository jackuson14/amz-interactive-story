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
    // For 5-6yo: Female-Artboard 8,10,12 and Male-Artboard 11,7,9 (11 moved to first position)  
    const artboardNumbers = gender === "girl" ? [8, 10, 12] : [11, 7, 9];
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
  const [characterType, setCharacterType] = useState("preset"); // "selfie" or "preset"
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
    // Stop the camera after capturing the photo
    stopCamera();
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
    <main className="min-h-screen">
      {/* Informational Banner */}
      <div className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 py-2 px-4 text-center">
        <p className="text-sm font-medium">
          ℹ️ You can use your own photo or choose a character. For best preset character choose the first boy.
        </p>
      </div>
      
      <section>
        <div className="mx-auto max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left side - Title */}
            <div className="px-6 sm:px-12 md:px-16 lg:px-32 py-10 lg:py-20 lg:h-screen lg:sticky lg:top-0 flex flex-col" style={{backgroundColor: '#3b2986'}}>
              <Link href="/play/character" className="inline-flex items-center text-white hover:text-gray-200 transition-all hover:scale-105 mb-4 lg:mb-8">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="mb-4 lg:mb-8">
                <div className="text-white text-base font-bold mb-2 lg:mb-4">
                  Step 2 of 3
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-4 lg:mb-8">Create Your Look!</h1>
              </div>
              
              {/* Selected Character Display - Moved to left panel */}
              {characterType === "preset" && selectedPresetCharacter && (
                <div className="hidden lg:flex mb-8 flex-col items-center">
                  <p className="text-3xl font-bold text-white mb-4 text-center">{characterName || "Your Name"}</p>
                  <div className="w-[25rem] h-[25rem] max-w-full">
                    <Image
                      src={(() => {
                        // Convert path from thumbnail to full body image
                        const basePath = selectedPresetCharacter.path;
                        const pathParts = basePath.split('/');
                        const filename = pathParts[pathParts.length - 1];
                        const folderPath = pathParts.slice(0, -1).join('/');
                        
                        // Extract the artboard number and gender
                        const match = filename.match(/(Female|Male)-Artboard (\d+)/);
                        if (match) {
                          const [, gender, number] = match;
                          // Handle inconsistent naming: some have space before number, some don't
                          // Try with space first, then without
                          if ([1, 4].includes(parseInt(number))) {
                            // These don't have spaces
                            return `${folderPath}/${gender}-Artboard${number}_full.png`;
                          } else {
                            // These have spaces
                            return `${folderPath}/${gender}-Artboard ${number}_full.png`;
                          }
                        }
                        return basePath; // Fallback to original if pattern doesn't match
                      })()}
                      alt={selectedPresetCharacter.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
              
              <div className="flex-grow"></div>
            </div>
            
            {/* Right side - Form fields */}
            <div className="bg-white px-6 sm:px-12 md:px-16 lg:px-32 py-10 lg:py-20 lg:min-h-screen">
              <div className="space-y-6 lg:space-y-8 lg:mt-20">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-700">Your Appearance</h2>
              <p className="text-gray-600">How do you want to appear in your story?</p>
            </div>

            {/* Character Type Selection */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCharacterType("preset")}
                  className={`p-8 rounded-2xl border-3 text-left transition-all duration-200 transform hover:scale-105 ${
                    characterType === "preset"
                      ? "border-green-400 bg-gradient-to-br from-green-50 to-blue-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-green-200 shadow-md hover:shadow-lg"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-3 text-gray-900">🎭 Choose Character</h3>
                  <p className="text-gray-700">Pick from our collection of fun characters!</p>
                </button>
                <button
                  onClick={async () => {
                    setCharacterType("selfie");
                    // Request camera permission when selecting selfie mode
                    if (!cameraOn && !selfie) {
                      await startCamera();
                    }
                  }}
                  className={`p-8 rounded-2xl border-3 text-left transition-all duration-200 transform hover:scale-105 ${
                    characterType === "selfie"
                      ? "border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-orange-200 shadow-md hover:shadow-lg"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-3 text-gray-900">📸 Use My Photo</h3>
                  <p className="text-gray-700">Take a selfie to appear as yourself in the story!</p>
                </button>
              </div>
            </div>

            {/* Selfie Interface */}
            {characterType === "selfie" && (
              <div className="space-y-6">
                {cameraError && (
                  <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{cameraError}</div>
                )}

                <div className="flex items-start gap-6">
                  {/* Camera View */}
                  <div className={`flex flex-col gap-3 ${cameraOn ? '' : 'hidden'}`}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="rounded-lg border bg-black w-80 h-60"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {cameraOn && (
                      <>
                        <div className="flex gap-3">
                          <button onClick={captureFrame} className="flex-1 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-400 text-white px-6 py-3 text-lg font-bold transition-all duration-200 transform hover:scale-105 hover:shadow-xl shadow-lg">
                            ✨ Capture
                          </button>
                          <button onClick={stopCamera} className="rounded-2xl border-2 border-gray-300 bg-white text-gray-700 px-4 py-3 text-base font-medium transition-all duration-200 hover:border-gray-400 hover:bg-gray-50">
                            Stop
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Smile and center your face in the frame!</p>
                      </>
                    )}
                  </div>

                  {/* Your Photo Section */}
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-4 text-gray-900">Your Photo</h4>
                    <div className="flex items-start gap-4">
                      {selfie ? (
                        <>
                          <Image 
                            src={selfie.url} 
                            alt="your photo" 
                            width={selfie.w || 256} 
                            height={selfie.h || 256} 
                            className="w-64 h-auto rounded-lg border shadow-md" 
                          />
                          <button onClick={() => {
                            clearSelfie();
                            startCamera();
                          }} className="rounded-2xl border-2 border-gray-300 bg-white px-6 py-3 text-base text-gray-700 font-medium transition-all duration-200 hover:border-gray-400 hover:bg-gray-50">
                            🔄 Retake Photo
                          </button>
                        </>
                      ) : (
                        <div className="w-64 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
                          <p className="text-lg mb-2">No photo yet</p>
                          {!cameraOn && (
                            <button onClick={startCamera} className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 px-6 py-3 text-base font-bold transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
                              📸 Start Camera
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preset Character Interface */}
            {characterType === "preset" && (
              <div className="space-y-6">
                {/* Character Selection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getAvailableCharacterImages(characterAge, characterGender).map((characterImg, index) => (
                    <div
                      key={characterImg.id}
                      onClick={() => setSelectedPresetCharacter(characterImg)}
                      className={`relative aspect-square rounded-2xl border-3 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-xl overflow-hidden ${
                        selectedPresetCharacter?.id === characterImg.id
                          ? "border-purple-500 ring-4 ring-purple-200 shadow-xl"
                          : "border-gray-200 hover:border-purple-300 shadow-md bg-white"
                      }`}
                    >
                      <Image
                        src={characterImg.path}
                        alt={characterImg.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                      {selectedPresetCharacter?.id === characterImg.id && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="mt-12 text-center">
              {characterType === "selfie" && selfie && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    Your personalized character will be generated as part of your story!
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    We&apos;ll create a cartoon version of you that appears in each story scene.
                  </p>
                </div>
              )}

              <Link
                href="/play/idea"
                className={`w-full text-center rounded-full py-6 px-10 text-2xl font-bold transition-all duration-200 block transform ${
                  canProceed
                    ? "bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 hover:shadow-xl hover:scale-105 shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                aria-disabled={!canProceed}
                onClick={(e) => { if (!canProceed) e.preventDefault(); }}
              >
                {canProceed ? "Let's Choose a Story! →" : "Take a photo or choose a character!"}
              </Link>
            </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}