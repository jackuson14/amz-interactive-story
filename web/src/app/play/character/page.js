"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const CHARACTER_KEY = "character_v1";

export default function PlayCharacterPage() {
  // Character info state
  const [characterName, setCharacterName] = useState("");
  const [characterAge, setCharacterAge] = useState("");
  const [characterGender, setCharacterGender] = useState("");

  // Load existing data from storage
  useEffect(() => {
    try {
      const characterRaw = localStorage.getItem(CHARACTER_KEY);
      if (characterRaw) {
        const characterData = JSON.parse(characterRaw);
        setCharacterName(characterData.name || "");
        setCharacterAge(characterData.age || "");
        setCharacterGender(characterData.gender || "");
      }
    } catch {}
  }, []);

  // Save character data whenever it changes
  useEffect(() => {
    try {
      const characterData = { 
        name: characterName, 
        age: characterAge,
        gender: characterGender
      };
      localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
    } catch {}
  }, [characterName, characterAge, characterGender]);

  const canProceed = characterName.trim() && characterAge && characterGender;

  return (
    <main className="min-h-screen">
      <section>
        <div className="mx-auto max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left side - Title */}
            <div className="px-12 sm:px-16 md:px-32 py-10 lg:py-20 lg:min-h-screen flex flex-col" style={{backgroundColor: '#8f94c4'}}>
              <Link href="/" className="inline-flex items-center text-white hover:text-gray-200 transition-all hover:scale-105 mb-4 lg:mb-8">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="mb-4 lg:mb-8">
                <div className="text-white text-base font-bold mb-2 lg:mb-4">
                  Step 1 of 3
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white">Tell us about yourself!</h1>
                <p className="text-lg lg:text-xl text-white mt-2 lg:mb-8">Let's create your amazing character for the story adventure!</p>
              </div>
              <div className="hidden lg:flex flex-grow items-end">
                <Image 
                  src="/images/step1.png" 
                  alt="Character creation illustration" 
                  width={400} 
                  height={300} 
                  className="w-full"
                  unoptimized
                />
              </div>
            </div>
            
            {/* Right side - Form fields */}
            <div className="bg-white px-6 sm:px-12 md:px-16 lg:px-32 py-10 lg:py-20 lg:min-h-screen">
              <div className="space-y-6 lg:space-y-8 lg:mt-20">
              <div>
                <label htmlFor="character-name" className="block text-2xl font-bold text-gray-700 mb-4">
                  What&apos;s your name?
                </label>
                <input
                  id="character-name"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Type your awesome name!"
                  className="w-full rounded-2xl border-2 border-purple-300 px-6 py-5 text-xl text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all bg-white hover:border-purple-400"
                />
              </div>
              
              <div>
                <label htmlFor="character-age" className="block text-2xl font-bold text-gray-700 mb-4">
                  How old are you?
                </label>
                <select
                  id="character-age"
                  value={characterAge}
                  onChange={(e) => setCharacterAge(e.target.value)}
                  className="w-full rounded-2xl border-2 border-amber-300 px-6 py-5 text-xl text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-200 transition-all bg-white hover:border-amber-400 cursor-pointer"
                >
                  <option value="">Select your age</option>
                  <option value="3">3 years old</option>
                  <option value="4">4 years old</option>
                  <option value="5">5 years old</option>
                  <option value="6">6 years old</option>
                </select>
              </div>
              
              <div>
                <label className="block text-2xl font-bold text-gray-700 mb-4">
                  Are you a boy or a girl?
                </label>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => setCharacterGender("boy")}
                    className={`w-full rounded-2xl border-3 px-6 py-6 text-xl font-bold transition-all transform hover:scale-105 ${
                      characterGender === "boy" 
                        ? "border-blue-500 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow-lg" 
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    Boy
                  </button>
                  <button
                    type="button"
                    onClick={() => setCharacterGender("girl")}
                    className={`w-full rounded-2xl border-3 px-6 py-6 text-xl font-bold transition-all transform hover:scale-105 ${
                      characterGender === "girl" 
                        ? "border-pink-500 bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 shadow-lg" 
                        : "border-gray-300 bg-white text-gray-700 hover:border-pink-400 hover:bg-pink-50"
                    }`}
                  >
                    Girl
                  </button>
                </div>
              </div>
              
              <div className="pt-6">
                <Link
                  href="/play/appearance"
                  className={`w-full text-center rounded-full py-6 px-10 text-2xl font-bold transition-all duration-200 block transform ${
                    canProceed
                      ? "bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 hover:shadow-xl hover:scale-105 shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  aria-disabled={!canProceed}
                  onClick={(e) => { 
                    if (!canProceed) {
                      e.preventDefault();
                    } else {
                      // Ensure data is saved before navigation
                      try {
                        const characterData = { 
                          name: characterName, 
                          age: characterAge,
                          gender: characterGender
                        };
                        localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
                      } catch {}
                    }
                  }}
                >
                  {canProceed ? "Let's Go! →" : "Fill in all the fun stuff above!"}
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