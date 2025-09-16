"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const CHARACTER_KEY = "character_v1";

export default function PlayCharacterPage() {
  // Character info state
  const [characterName, setCharacterName] = useState("");
  const [characterAge, setCharacterAge] = useState("");

  // Load existing data from storage
  useEffect(() => {
    try {
      const characterRaw = localStorage.getItem(CHARACTER_KEY);
      if (characterRaw) {
        const characterData = JSON.parse(characterRaw);
        setCharacterName(characterData.name || "");
        setCharacterAge(characterData.age || "");
      }
    } catch {}
  }, []);

  // Save character data whenever it changes
  useEffect(() => {
    try {
      const characterData = { 
        name: characterName, 
        age: characterAge
      };
      localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
    } catch {}
  }, [characterName, characterAge]);

  const canProceed = characterName.trim() && characterAge;

  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-3xl sm:text-4xl font-bold">Play</h1>
        <p className="mt-2 text-gray-600">Step 1 of 3: Tell us about yourself. Then you'll create your character and choose your story!</p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link href="/" className="w-full sm:w-auto text-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Back to home</Link>
        </div>
      </section>

      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-6">
              <span className="inline-block w-6 h-6 rounded-full bg-indigo-600 text-white grid place-items-center">1</span> 
              About You
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="character-name" className="block text-lg font-semibold text-gray-900 mb-3">
                  What's your name?
                </label>
                <input
                  id="character-name"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="character-age" className="block text-lg font-semibold text-gray-900 mb-3">
                  How old are you?
                </label>
                <select
                  id="character-age"
                  value={characterAge}
                  onChange={(e) => setCharacterAge(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select your age...</option>
                  <option value="4">4 years old</option>
                  <option value="5">5 years old</option>
                  <option value="6">6 years old</option>
                  <option value="7">7 years old</option>
                  <option value="8">8 years old</option>
                  <option value="9">9 years old</option>
                  <option value="10">10 years old</option>
                </select>
              </div>
              
              {characterName && characterAge && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-lg text-green-800">
                    Hi <strong>{characterName}</strong>! You're {characterAge} years old and ready for adventure! 🎉
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Next, you'll create your character appearance.
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                  href="/play/appearance"
                  className={`w-full text-center rounded-lg py-4 px-6 text-lg font-medium transition-colors ${
                    canProceed
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                          age: characterAge
                        };
                        localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
                      } catch {}
                    }
                  }}
                >
                  Next: Create Character
                </Link>
                <p className="text-center text-sm text-gray-500 mt-2">Step 1 of 3</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}