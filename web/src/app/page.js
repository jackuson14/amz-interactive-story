import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden bg-[url('/images/cover.png')] bg-cover bg-center bg-no-repeat">
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 opacity-30" style={{backgroundColor: 'rgba(0,0,0,0.3)'}}></div>
        
        <div className="relative z-10 px-6 sm:px-10 md:px-16 py-20 sm:py-28">
          {/* PollyStory Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/PollyStory_logo.png"
              alt="PollyStory"
              width={200}
              height={100}
              className="drop-shadow-2xl"
              unoptimized
            />
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-2xl">
            <span className="text-white">Stories </span>
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Alive!</span>
          </h1>
          <p className="mt-5 text-xl sm:text-2xl text-white max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-semibold">
            Talk, Move & Be The Main Character
          </p>
          <div className="mt-10">
            <Link
              href="/play/character"
              className="px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 font-bold rounded-full hover:shadow-lg transition-all duration-200 transform hover:scale-105 shadow-xl inline-block"
            >
              Get started
            </Link>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg 
            className="w-8 h-8 text-white drop-shadow-lg" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 sm:px-10 md:px-16 py-20 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
              <img 
                src="/images/hero.png" 
                alt="Your face in the story"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover flex-shrink-0"
              />
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-2">Your face in the story</h3>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  See yourself as the main character<br className="hidden sm:block"/>throughout every magical adventure.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
              <img 
                src="/images/immersive.png" 
                alt="Immersive experience"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover flex-shrink-0"
              />
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-2">Immersive</h3>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Listen, talk and move in the story.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 sm:px-10 md:px-16 py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">How it works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent">01</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Tell us about you</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your name, age, and take a quick selfie or choose a fun character to represent you in the story.
              </p>
            </div>
            
            <div>
              <div className="text-5xl font-bold mb-6 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">02</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Pick your story</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose from age-appropriate adventures perfectly tailored for you, from magical quests to everyday adventures.
              </p>
            </div>
            
            <div>
              <div className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">03</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Start your adventure</h3>
              <p className="text-gray-600 leading-relaxed">
                Listen, talk, and move as the hero of your personalized story with immersive interactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-10 md:px-16 py-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Ready for your adventure?</h3>
            <p className="text-purple-200 mb-6">Join thousands of kids creating magical stories every day!</p>
            <Link 
              href="/play/character" 
              className="bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all inline-block"
            >
              Start Your Story Now!
            </Link>
          </div>
          <div className="border-t border-purple-700 pt-6 text-purple-200 text-sm">
            © {new Date().getFullYear()} Interactive Story. Made by Pak.ai
          </div>
        </div>
      </footer>
    </main>
  );
}
