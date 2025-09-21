"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PRESET_STORIES_BY_AGE } from "@/data/preset-stories";
import { TOPICS_BY_AGE, DEFAULT_TOPICS } from "@/data/topic-configs";

const STORY_PROMPT_KEY = "story_prompt_v1";
const CHARACTER_KEY = "character_v1";

export default function PlayIdeaPage() {
  const [storyPrompt, setStoryPrompt] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterAge, setCharacterAge] = useState("");
  const [selectedStory, setSelectedStory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [showMoreStories, setShowMoreStories] = useState(false);

  // Load character data and story prompt from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORY_PROMPT_KEY);
      if (raw) setStoryPrompt(raw);
      
      const characterRaw = localStorage.getItem(CHARACTER_KEY);
      if (characterRaw) {
        const characterData = JSON.parse(characterRaw);
        setCharacterName(characterData.name || "");
        setCharacterAge(characterData.age || "4");
      }
    } catch {}
  }, []);

  // Persist as it changes
  useEffect(() => {
    try { localStorage.setItem(STORY_PROMPT_KEY, storyPrompt || ""); } catch {}
  }, [storyPrompt]);

  const canProceed = (storyPrompt || "").trim().length > 0;

  const handlePresetStorySelect = (story) => {
    setSelectedStory(story);
    setShowModal(true);
  };

  const handleChooseStory = () => {
    if (selectedStory) {
      const prompt = `${selectedStory.title}: ${selectedStory.oneLiner}`;
      setStoryPrompt(prompt);
      setShowModal(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStory(null);
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-3xl sm:text-4xl font-bold">Play</h1>
        <p className="mt-2 text-gray-600">Step 3 of 3: Choose your story idea. Your character is ready to star in the adventure!</p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link href="/play/appearance" className="w-full sm:w-auto text-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Back to appearance</Link>
        </div>
      </section>

      <section className="px-6 sm:px-10 md:px-16 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Preset Stories Section - MOVED TO TOP */}
          <div className="rounded-xl border bg-white p-4 sm:p-6">
            <h3 className="text-lg font-semibold">
              Based on {characterName ? `${characterName}'s` : "your"} age, these are the suggested stories
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {characterAge 
                ? `Life skills topics perfect for ${characterAge} year olds` 
                : 'Age-appropriate life skills for your child'}
            </p>

            {/* Topic Tabs - Age Appropriate */}
            <div className="mt-6 mb-4">
              <div className="flex flex-wrap gap-2">
                {(TOPICS_BY_AGE[characterAge] || DEFAULT_TOPICS).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic.id);
                      setShowMoreStories(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      selectedTopic === topic.id
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Story Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(PRESET_STORIES_BY_AGE[characterAge] || PRESET_STORIES_BY_AGE[4] || [])
                .filter(story => {
                  if (selectedTopic === "all") return true;
                  return story.topic === selectedTopic;
                })
                .slice(0, showMoreStories ? 12 : 6)
                .map((story) => (
                <div
                  key={story.id}
                  onClick={() => handlePresetStorySelect(story)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md bg-gradient-to-br ${story.color} hover:scale-105`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{story.thumbnail}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{story.title}</h4>
                      <p className="text-sm text-gray-800 mt-1 font-medium">{story.oneLiner}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* More Button */}
            {(PRESET_STORIES_BY_AGE[characterAge] || PRESET_STORIES_BY_AGE[4] || [])
              .filter(story => selectedTopic === "all" || story.topic === selectedTopic).length > 6 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowMoreStories(!showMoreStories)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {showMoreStories ? "Show Less" : "More Stories"}
                </button>
              </div>
            )}
          </div>

          {/* Your Story Idea Section - MOVED TO BOTTOM */}
          <div className="mt-8 rounded-xl border bg-white p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold">Or create your own story</h2>
            <p className="mt-1 text-sm text-gray-600">What topic do you want your kids to learn?</p>
            <div className="mt-4 flex flex-col gap-2">
              <input
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                placeholder="Type your idea..."
                className="w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-500"
              />
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <Link
                  href={{ pathname: "/story", query: canProceed ? { prompt: storyPrompt } : {} }}
                  className="w-full sm:w-auto text-center rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-500 disabled:opacity-50"
                  aria-disabled={!canProceed}
                  onClick={(e) => { if (!canProceed) { e.preventDefault(); } }}
                >
                  Start adventure
                </Link>
                <p className="text-xs text-gray-500 sm:ml-2">Step 3 of 3</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-6 bg-gradient-to-br ${selectedStory.color} rounded-t-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{selectedStory.thumbnail}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedStory.title}</h3>
                    <p className="text-sm text-gray-800 mt-1 font-medium">{selectedStory.oneLiner}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {/* About the Story */}
                <div className="border-l-4 border-indigo-400 pl-4">
                  <h4 className="font-bold text-sm text-gray-600 mb-1">📖 What&apos;s this story about?</h4>
                  <p className="text-gray-800 font-medium">
                    {selectedStory.about || selectedStory.description || selectedStory.oneLiner}
                  </p>
                </div>
                
                {/* What Kids Learn */}
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-bold text-sm text-gray-600 mb-1">🎓 What will kids learn?</h4>
                  <p className="text-gray-800 font-medium">
                    {selectedStory.learning || "Life skills, creativity, and problem-solving"}
                  </p>
                </div>
                
                {/* Story Info Grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-xs text-gray-600">Pages</div>
                    <div className="font-bold text-gray-900">{selectedStory.pages || "5-10"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">
                      {selectedStory.interaction === "speech" ? "🗣️" : 
                       selectedStory.interaction === "movement" ? "🏃" : "🎭"}
                    </div>
                    <div className="text-xs text-gray-600">Interaction</div>
                    <div className="font-bold text-gray-900 capitalize">
                      {selectedStory.interaction === "both" ? "Movement & Speech" : 
                       selectedStory.interaction || "Movement & Speech"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link
                  href={{ 
                    pathname: "/story", 
                    query: selectedStory?.storyId 
                      ? { story: selectedStory.storyId }
                      : { prompt: selectedStory ? `${selectedStory.title}: ${selectedStory.oneLiner}` : "" }
                  }}
                  onClick={handleChooseStory}
                  className="flex-1 bg-indigo-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
                >
                  Choose this story
                </Link>
                <button
                  onClick={closeModal}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

