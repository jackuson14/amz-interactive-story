"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PRESET_STORIES_BY_AGE } from "@/data/preset-stories";
import { TOPICS_BY_AGE, DEFAULT_TOPICS } from "@/data/topic-configs";

const STORY_PROMPT_KEY = "story_prompt_v1";
const CHARACTER_KEY = "character_v1";

export default function PlayIdeaPage() {
  const [storyPrompt, setStoryPrompt] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterAge, setCharacterAge] = useState("");
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [showMoreStories, setShowMoreStories] = useState(false);
  const [storyType, setStoryType] = useState("preset"); // "preset" or "custom"

  // Load character data and story prompt from storage
  useEffect(() => {
    try {
      // Don't prefill the story prompt - let it start empty
      // const raw = localStorage.getItem(STORY_PROMPT_KEY);
      // if (raw) {
      //   setStoryPrompt(raw);
      //   setStoryType("custom"); // If there's a custom prompt, select custom type
      // }
      
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

  const canProceed = (storyType === "custom" && storyPrompt.trim().length > 0) || 
                     (storyType === "preset" && selectedStory);

  const handlePresetStorySelect = (story) => {
    setSelectedStory(story);
  };

  return (
    <main className="min-h-screen">
      {/* Informational Banner */}
      <div className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 py-2 px-4 text-center">
        <p className="text-sm font-medium">
          ℹ️ Stories are personalised based on kids' age. We have preset 1 story for now.
        </p>
      </div>
      
      <section>
        <div className="mx-auto max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left side - Title - Sticky */}
            <div className="px-6 sm:px-12 md:px-16 lg:px-32 py-10 lg:py-20 lg:h-screen lg:sticky lg:top-0 flex flex-col" style={{backgroundColor: '#6c4a88'}}>
              <Link href="/play/appearance" className="inline-flex items-center text-white hover:text-gray-200 transition-all hover:scale-105 mb-4 lg:mb-8">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="mb-4 lg:mb-8">
                <div className="text-white text-base font-bold mb-2 lg:mb-4">
                  Step 3 of 3
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-4 lg:mb-8">Choose Your Story!</h1>
              </div>
              
              {/* Selected Story Display - Desktop only (hidden on mobile) */}
              {storyType === "preset" && selectedStory && (
                <div className="hidden lg:flex flex-col items-center mb-8">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 w-full">
                    {/* Top section - 2 columns */}
                    <div className="flex gap-4 mb-6">
                      {/* Column 1 - Thumbnail (40% width) */}
                      {(selectedStory.title === "Goodnight Zoo" || selectedStory.id === "goodnight-zoo") ? (
                        <div className="w-[40%] aspect-square rounded-lg overflow-hidden flex-shrink-0">
                          <Image 
                            src="/stories/zoo/Thumbnail_Zoo.png" 
                            alt="Goodnight Zoo"
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-[40%] aspect-square flex items-center justify-center bg-white/10 rounded-lg flex-shrink-0">
                          <div className="text-6xl">{selectedStory.thumbnail}</div>
                        </div>
                      )}
                      
                      {/* Column 2 - Title & Subtitle (60% width) */}
                      <div className="flex-1 text-left flex flex-col justify-center">
                        <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">{selectedStory.title}</h3>
                        <p className="text-sm lg:text-base text-white/90">{selectedStory.oneLiner}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 text-left">
                      {/* About the Story */}
                      <div className="border-l-4 border-white/50 pl-4">
                        <h4 className="font-bold text-sm text-white/80 mb-1">What&apos;s this story about?</h4>
                        <p className="text-white/90 text-sm">
                          {selectedStory.about || selectedStory.description || selectedStory.oneLiner}
                        </p>
                      </div>
                      
                      {/* What Kids Learn */}
                      <div className="border-l-4 border-white/50 pl-4">
                        <h4 className="font-bold text-sm text-white/80 mb-1">What will kids learn?</h4>
                        <p className="text-white/90 text-sm">
                          {selectedStory.learning || "Life skills, creativity, and problem-solving"}
                        </p>
                      </div>
                      
                      {/* Story Info Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-white/10 rounded-lg p-3 text-center">
                          <div className="text-xs text-white/70">Pages</div>
                          <div className="font-bold text-white/90 text-lg">
                            {(selectedStory.title === "Goodnight Zoo" || selectedStory.id === "goodnight-zoo") ? "6" : (selectedStory.pages || "5-10")}
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 text-center">
                          <div className="text-xs text-white/70">Interaction</div>
                          <div className="font-bold text-white/90 text-sm">
                            Speech and Movement
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Story Display */}
              {storyType === "custom" && storyPrompt && (
                <div className="flex flex-col items-center mb-8">
                  <p className="text-2xl font-bold text-white mb-4 text-center">Your Story Idea</p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 w-full">
                    <div className="text-center">
                      <div className="text-5xl mb-3">✨</div>
                      <p className="text-lg text-white">{storyPrompt}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-grow"></div>
            </div>
            
            {/* Right side - Story selection - Scrollable */}
            <div className="bg-white px-6 sm:px-12 md:px-16 lg:px-32 py-10 lg:py-20 min-h-screen">
              <div className="space-y-6 lg:space-y-8 lg:mt-20">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-700">Story Selection</h2>
                  <p className="text-gray-600">How would you like to create your story?</p>
                </div>

                {/* Story Type Selection */}
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setStoryType("preset")}
                      className={`p-8 rounded-2xl border-3 text-left transition-all duration-200 transform hover:scale-105 ${
                        storyType === "preset"
                          ? "border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-purple-200 shadow-md hover:shadow-lg"
                      }`}
                    >
                      <h3 className="text-xl font-bold mb-3 text-gray-900">📚 Choose Preset Story</h3>
                      <p className="text-gray-700">Pick from our collection of educational stories!</p>
                    </button>
                    <button
                      onClick={() => setStoryType("custom")}
                      className={`p-8 rounded-2xl border-3 text-left transition-all duration-200 transform hover:scale-105 ${
                        storyType === "custom"
                          ? "border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-blue-200 shadow-md hover:shadow-lg"
                      }`}
                    >
                      <h3 className="text-xl font-bold mb-3 text-gray-900">✨ Create Your Own</h3>
                      <p className="text-gray-700">Write your own unique story idea!</p>
                    </button>
                  </div>
                </div>

                {/* Preset Stories Interface */}
                {storyType === "preset" && (
                  <div className="space-y-6">
                    {/* Topic Tabs */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Specially Curated for {characterAge}-Year-Olds
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Expert-selected topics and stories designed specifically for your child&apos;s developmental stage
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(TOPICS_BY_AGE[characterAge] || DEFAULT_TOPICS).map((topic) => (
                          <button
                            key={topic.id}
                            onClick={() => {
                              setSelectedTopic(topic.id);
                              setShowMoreStories(false);
                            }}
                            className={`px-4 py-2 rounded-2xl font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                              selectedTopic === topic.id
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {topic.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Story Cards Grid */}
                    <div className="space-y-4">
                      {(() => {
                        // Get all stories for the age
                        let stories = PRESET_STORIES_BY_AGE[characterAge] || PRESET_STORIES_BY_AGE[4] || [];
                        
                        // Filter by topic
                        stories = stories.filter(story => {
                          if (selectedTopic === "all") return true;
                          return story.topic === selectedTopic;
                        });
                        
                        // Find Goodnight Zoo story
                        const goodnightZooIndex = stories.findIndex(s => 
                          s.title === "Goodnight Zoo" || s.id === "goodnight-zoo"
                        );
                        
                        // If Goodnight Zoo exists, move it to the front
                        if (goodnightZooIndex > -1) {
                          const goodnightZoo = stories[goodnightZooIndex];
                          stories = [
                            goodnightZoo,
                            ...stories.slice(0, goodnightZooIndex),
                            ...stories.slice(goodnightZooIndex + 1)
                          ];
                        }
                        
                        // Slice for pagination
                        return stories.slice(0, showMoreStories ? 12 : 6);
                      })()
                        .map((story) => {
                          const isGoodnightZoo = story.title === "Goodnight Zoo" || story.id === "goodnight-zoo";
                          const isSelectable = isGoodnightZoo;
                          
                          return (
                            <div key={story.id}>
                              <div
                                onClick={() => isSelectable && handlePresetStorySelect(story)}
                                className={`p-5 rounded-2xl border-3 transition-all duration-200 ${
                                  isSelectable 
                                    ? `cursor-pointer transform hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${story.color} ${
                                        selectedStory?.id === story.id
                                          ? "ring-4 ring-purple-300 shadow-xl"
                                          : "hover:ring-2 hover:ring-purple-200"
                                      }`
                                    : "cursor-not-allowed bg-gray-100 opacity-60 border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  {isGoodnightZoo ? (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                      <Image 
                                        src="/stories/zoo/Thumbnail_Zoo.png" 
                                        alt="Goodnight Zoo"
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-4xl flex-shrink-0">{story.thumbnail}</div>
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-lg">{story.title}</h4>
                                    <p className="text-sm text-gray-700 mt-1">{story.oneLiner}</p>
                                    {!isSelectable && (
                                      <p className="text-xs text-gray-500 mt-2 font-medium">🚧 Coming Soon</p>
                                    )}
                                  </div>
                                  {selectedStory?.id === story.id && (
                                    <div className="text-2xl text-purple-600">✓</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Mobile Story Details - Show inline immediately under this selected story */}
                              {selectedStory?.id === story.id && (
                                <div className="lg:hidden mt-4">
                                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-purple-300">
                                    {/* Top section - 2 columns */}
                                    <div className="flex gap-4 mb-6">
                                      {/* Column 1 - Thumbnail (40% width) */}
                                      {(selectedStory.title === "Goodnight Zoo" || selectedStory.id === "goodnight-zoo") ? (
                                        <div className="w-[40%] aspect-square rounded-lg overflow-hidden flex-shrink-0">
                                          <Image 
                                            src="/stories/zoo/Thumbnail_Zoo.png" 
                                            alt="Goodnight Zoo"
                                            width={200}
                                            height={200}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-[40%] aspect-square flex items-center justify-center bg-purple-200 rounded-lg flex-shrink-0">
                                          <div className="text-5xl">{selectedStory.thumbnail}</div>
                                        </div>
                                      )}
                                      
                                      {/* Column 2 - Title & Subtitle (60% width) */}
                                      <div className="flex-1 text-left flex flex-col justify-center">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedStory.title}</h3>
                                        <p className="text-sm text-gray-700">{selectedStory.oneLiner}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-4 text-left">
                                      {/* About the Story */}
                                      <div className="border-l-4 border-purple-400 pl-4">
                                        <h4 className="font-bold text-sm text-gray-800 mb-1">What&apos;s this story about?</h4>
                                        <p className="text-gray-700 text-sm">
                                          {selectedStory.about || selectedStory.description || selectedStory.oneLiner}
                                        </p>
                                      </div>
                                      
                                      {/* What Kids Learn */}
                                      <div className="border-l-4 border-purple-400 pl-4">
                                        <h4 className="font-bold text-sm text-gray-800 mb-1">What will kids learn?</h4>
                                        <p className="text-gray-700 text-sm">
                                          {selectedStory.learning || "Life skills, creativity, and problem-solving"}
                                        </p>
                                      </div>
                                      
                                      {/* Story Info Grid */}
                                      <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="bg-purple-200 rounded-lg p-3 text-center">
                                          <div className="text-xs text-gray-600">Pages</div>
                                          <div className="font-bold text-gray-900 text-lg">
                                            {(selectedStory.title === "Goodnight Zoo" || selectedStory.id === "goodnight-zoo") ? "6" : (selectedStory.pages || "5-10")}
                                          </div>
                                        </div>
                                        <div className="bg-purple-200 rounded-lg p-3 text-center">
                                          <div className="text-xs text-gray-600">Interaction</div>
                                          <div className="font-bold text-gray-900 text-sm">
                                            Speech and Movement
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                    
                    {/* More Button */}
                    {(PRESET_STORIES_BY_AGE[characterAge] || PRESET_STORIES_BY_AGE[4] || [])
                      .filter(story => selectedTopic === "all" || story.topic === selectedTopic).length > 6 && (
                      <div className="text-center">
                        <button
                          onClick={() => setShowMoreStories(!showMoreStories)}
                          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 font-medium shadow-lg"
                        >
                          {showMoreStories ? "Show Less" : "More Stories"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Story Interface */}
                {storyType === "custom" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">✨ Your Story Idea</h3>
                      <p className="text-sm text-gray-600 mb-4">What topic do you want your kids to learn?</p>
                      <textarea
                        value={storyPrompt}
                        onChange={(e) => setStoryPrompt(e.target.value)}
                        placeholder="Type your story idea here... For example: 'A story about sharing toys with friends' or 'Learning about healthy eating habits'"
                        className="w-full rounded-2xl border-2 border-blue-300 px-5 py-4 text-lg text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all bg-white min-h-[120px] resize-none"
                      />
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">💡 Age-appropriate story ideas for {characterAge}-year-olds:</p>
                        <p className="text-xs text-gray-500">These topics are specially selected for your child&apos;s developmental stage</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          <button
                            onClick={() => setStoryPrompt("A story about making new friends at school")}
                            className="text-left px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-blue-50 transition-colors"
                          >
                            🤝 Making friends
                          </button>
                          <button
                            onClick={() => setStoryPrompt("Learning to share toys with siblings")}
                            className="text-left px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-blue-50 transition-colors"
                          >
                            🧸 Sharing is caring
                          </button>
                          <button
                            onClick={() => setStoryPrompt("Being brave at the doctor's office")}
                            className="text-left px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-blue-50 transition-colors"
                          >
                            🏥 Being brave
                          </button>
                          <button
                            onClick={() => setStoryPrompt("Learning about healthy eating habits")}
                            className="text-left px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-blue-50 transition-colors"
                          >
                            🥗 Healthy eating
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <div className="mt-12 text-center pb-10">
                  <Link
                    href={{ 
                      pathname: "/story", 
                      query: storyType === "preset" && selectedStory?.storyId 
                        ? { story: selectedStory.storyId }
                        : canProceed 
                          ? { prompt: storyPrompt } 
                          : {}
                    }}
                    className={`w-full text-center rounded-full py-6 px-10 text-2xl font-bold transition-all duration-200 block transform ${
                      canProceed
                        ? "bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 hover:shadow-xl hover:scale-105 shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    aria-disabled={!canProceed}
                    onClick={(e) => { 
                      if (!canProceed) e.preventDefault(); 
                    }}
                  >
                    {canProceed ? "Start Your Adventure! 🚀" : 
                     storyType === "preset" ? "Choose a story from the list!" : "Write your story idea!"}
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