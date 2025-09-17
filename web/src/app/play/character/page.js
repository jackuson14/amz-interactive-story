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
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50">
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-r from-orange-100 to-yellow-100 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-4 right-8 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 left-8 w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl opacity-30 rotate-12"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">🎭 Let's Get Started!</h1>
          <p className="text-lg text-gray-700">Step 1 of 3: Tell us about yourself. Then you'll create your character and choose your story!</p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link href="/" className="w-full sm:w-auto text-center rounded-full bg-white border border-orange-200 px-6 py-3 text-sm text-orange-600 font-medium hover:bg-orange-50 transition-colors shadow-sm">🏠 Back to home</Link>
        </div>
      </section>

      <section className="px-6 sm:px-10 md:px-16 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-xl border border-orange-100 relative overflow-hidden">
            {/* Card decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full opacity-30 transform translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-blue-200 to-blue-300 rounded-2xl opacity-20 transform -translate-x-8 translate-y-8 rotate-45"></div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <span className="inline-block w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white grid place-items-center text-lg font-bold shadow-lg">1</span> 
              <div>
                <h2 className="text-sm uppercase tracking-wide text-orange-600 font-semibold">Step One</h2>
                <p className="text-lg font-bold text-gray-900">About You</p>
              </div>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div>
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6">
                  <label htmlFor="character-name" className="block text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🌟 What's your name?
                  </label>
                  <input
                    id="character-name"
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Type your awesome name here!"
                    className="w-full rounded-xl border-2 border-orange-200 px-6 py-4 text-lg text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 bg-white shadow-sm transition-all"
                  />
                </div>
              </div>
              
              <div>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6">
                  <label htmlFor="character-age" className="block text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🎂 How old are you?
                  </label>
                  <select
                    id="character-age"
                    value={characterAge}
                    onChange={(e) => setCharacterAge(e.target.value)}
                    className="w-full rounded-xl border-2 border-blue-200 px-6 py-4 text-lg text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm transition-all"
                  >
                    <option value="">Pick your age! 🎈</option>
                    <option value="4">4 years old 🌱</option>
                    <option value="5">5 years old 🌟</option>
                    <option value="6">6 years old 🚀</option>
                    <option value="7">7 years old ⭐</option>
                    <option value="8">8 years old 🎯</option>
                    <option value="9">9 years old 🏆</option>
                    <option value="10">10 years old 👑</option>
                  </select>
                </div>
              </div>
              
              {characterName && characterAge && (
                <div className="bg-gradient-to-br from-green-100 to-blue-100 border-2 border-green-200 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-200">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    Hi <span className="text-green-600">{characterName}</span>! 
                  </p>
                  <p className="text-lg text-gray-700 mb-3">
                    You're {characterAge} years old and ready for adventure!
                  </p>
                  <p className="text-sm text-green-700 bg-white rounded-full px-4 py-2 inline-block">
                    ✨ Next: Create your character appearance
                  </p>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-orange-100 relative z-10">
                <Link
                  href="/play/appearance"
                  className={`w-full text-center rounded-full py-5 px-8 text-xl font-bold transition-all duration-200 transform block ${
                    canProceed
                      ? "bg-gradient-to-r from-orange-500 to-yellow-400 text-white hover:from-orange-600 hover:to-yellow-500 hover:scale-105 shadow-lg hover:shadow-xl"
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
                          age: characterAge
                        };
                        localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
                      } catch {}
                    }
                  }}
                >
                  {canProceed ? "🎨 Next: Create Character" : "✍️ Fill in your details first"}
                </Link>
                <p className="text-center text-sm text-orange-600 mt-4 font-medium">
                  Step 1 of 3 • Character Creation Next! 🎭
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}