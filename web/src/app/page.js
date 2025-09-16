import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50">
      {/* Hero */}
      <section className="px-6 sm:px-10 md:px-16 py-20 sm:py-28 text-center relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full opacity-20"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl opacity-30 rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-25"></div>
        <div className="absolute bottom-32 right-1/3 w-14 h-14 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl opacity-20 rotate-12"></div>
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
            Step into the story as the 
            <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">hero</span>
          </h1>
          <p className="mt-5 text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Capture your face once and see yourself as the main character in an interactive story.
            Private by default. Works on any modern device.
          </p>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <Link
            href="/play/character"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            🚀 Get started
          </Link>
          <a
            href="#how-it-works"
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            ✨ See how it works
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 sm:px-10 md:px-16 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why kids love our stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl p-8 text-center transform hover:scale-105 transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Your face in the story</h3>
              <p className="text-gray-700 leading-relaxed">
                See yourself as the main character throughout every magical adventure.
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-3xl p-8 text-center transform hover:scale-105 transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Private by default</h3>
              <p className="text-gray-700 leading-relaxed">
                Your photos stay safe on your device. Privacy first, always.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-8 text-center transform hover:scale-105 transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Fast and fun</h3>
              <p className="text-gray-700 leading-relaxed">
                Instant stories that work perfectly on phones, tablets, and computers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 sm:px-10 md:px-16 py-20 bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-300 to-green-400 rounded-full opacity-10 transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-300 to-blue-400 rounded-full opacity-10 transform -translate-x-20 translate-y-20"></div>
        
        <div className="mx-auto max-w-5xl relative z-10">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">How it works</h2>
          <p className="text-xl text-gray-700 text-center mb-12 max-w-3xl mx-auto">Three simple steps to become the hero of your own adventure</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-white font-bold">1</span>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-xl text-gray-900 mb-3">📸 Tell us about you</h3>
                <p className="text-gray-700 leading-relaxed">Share your name, age, and take a quick selfie or choose a fun character.</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-gray-900 font-bold">2</span>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-xl text-gray-900 mb-3">✨ Pick your story</h3>
                <p className="text-gray-700 leading-relaxed">Choose from age-appropriate adventures perfectly tailored for you.</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-white font-bold">3</span>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-xl text-gray-900 mb-3">🎮 Start your adventure</h3>
                <p className="text-gray-700 leading-relaxed">Read, listen, and make choices as the hero of your personalized story!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-10 md:px-16 py-12 bg-gradient-to-r from-orange-500 to-yellow-400">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Ready for your adventure?</h3>
            <p className="text-orange-100 mb-6">Join thousands of kids creating magical stories every day!</p>
            <Link 
              href="/play/character" 
              className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-50 transition-colors inline-block"
            >
              Start Your Story Now! 🌟
            </Link>
          </div>
          <div className="border-t border-orange-400 pt-6 text-orange-100 text-sm">
            © {new Date().getFullYear()} Interactive Story. Made with ❤️ for curious minds.
          </div>
        </div>
      </footer>
    </main>
  );
}
