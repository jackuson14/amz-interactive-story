"use client";
import { useState } from "react";

export default function DesignSystem() {
  const [copiedColor, setCopiedColor] = useState(null);

  // Color palette extracted from cover.png
  const colors = {
    primary: {
      twilight: "#2D3561",      // Deep twilight blue from sky
      dusk: "#4A5899",          // Lighter twilight blue
      night: "#1A1F3A",         // Dark night blue
    },
    accent: {
      moon: "#F9E4B7",          // Warm moon yellow
      starlight: "#FFF8E7",     // Pale star yellow
      glow: "#FECA57",          // Golden glow
    },
    warm: {
      sunset: "#FF9F68",        // Warm sunset orange
      peach: "#FF8A5B",         // Peach tone from horizon
      amber: "#F59E0B",         // Amber from savanna
      sand: "#D4A574",          // Sandy ground color
    },
    earth: {
      savanna: "#8B6B47",       // Brown savanna
      tree: "#5D4E37",          // Dark tree brown
      shadow: "#3E2723",        // Deep shadow brown
    },
    purple: {
      horizon: "#8B5A8F",       // Purple horizon
      dusk: "#A67BA8",          // Light purple from sky gradient
      magic: "#C589C8",         // Magical purple accent
    },
    neutral: {
      gray900: "#1F2937",
      gray700: "#374151", 
      gray500: "#6B7280",
      gray300: "#D1D5DB",
      gray100: "#F3F4F6",
      white: "#FFFFFF",
    }
  };

  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const ColorCard = ({ name, hex }) => (
    <div 
      className="flex flex-col items-center cursor-pointer group"
      onClick={() => copyToClipboard(hex)}
    >
      <div 
        className="w-24 h-24 rounded-lg shadow-lg transition-transform group-hover:scale-110"
        style={{ backgroundColor: hex }}
      />
      <p className="mt-2 text-sm font-medium text-gray-700">{name}</p>
      <p className="text-xs text-gray-500">
        {copiedColor === hex ? "Copied!" : hex}
      </p>
    </div>
  );

  const GradientCard = ({ name, gradient }) => (
    <div className="flex flex-col items-center">
      <div 
        className="w-full h-24 rounded-lg shadow-lg"
        style={{ background: gradient }}
      />
      <p className="mt-2 text-sm font-medium text-gray-700">{name}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-500 to-amber-500 bg-clip-text text-transparent">
            Stories Alive Design System
          </h1>
          <p className="text-gray-600 text-lg">Based on the magical twilight theme from cover.png</p>
        </header>

        {/* Primary Colors */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Primary Colors - Twilight Sky</h2>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(colors.primary).map(([name, hex]) => (
              <ColorCard key={name} name={name} hex={hex} />
            ))}
          </div>
        </section>

        {/* Accent Colors */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Accent Colors - Moonlight</h2>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(colors.accent).map(([name, hex]) => (
              <ColorCard key={name} name={name} hex={hex} />
            ))}
          </div>
        </section>

        {/* Warm Colors */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Warm Colors - Sunset</h2>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(colors.warm).map(([name, hex]) => (
              <ColorCard key={name} name={name} hex={hex} />
            ))}
          </div>
        </section>

        {/* Earth Colors */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Earth Colors - Savanna</h2>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(colors.earth).map(([name, hex]) => (
              <ColorCard key={name} name={name} hex={hex} />
            ))}
          </div>
        </section>

        {/* Purple Colors */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Purple Colors - Magic</h2>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(colors.purple).map(([name, hex]) => (
              <ColorCard key={name} name={name} hex={hex} />
            ))}
          </div>
        </section>

        {/* Gradients */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Magical Gradients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GradientCard 
              name="Twilight Sky" 
              gradient="linear-gradient(180deg, #1A1F3A 0%, #4A5899 50%, #8B5A8F 100%)" 
            />
            <GradientCard 
              name="Sunset Horizon" 
              gradient="linear-gradient(180deg, #4A5899 0%, #A67BA8 50%, #FF9F68 100%)" 
            />
            <GradientCard 
              name="Golden Hour" 
              gradient="linear-gradient(90deg, #FF9F68 0%, #FECA57 50%, #F9E4B7 100%)" 
            />
            <GradientCard 
              name="Starlight" 
              gradient="linear-gradient(135deg, #2D3561 0%, #F9E4B7 100%)" 
            />
            <GradientCard 
              name="Magical Dusk" 
              gradient="linear-gradient(90deg, #8B5A8F 0%, #C589C8 50%, #FECA57 100%)" 
            />
            <GradientCard 
              name="Savanna Dreams" 
              gradient="linear-gradient(180deg, #FF9F68 0%, #D4A574 50%, #8B6B47 100%)" 
            />
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Typography</h2>
          <div className="space-y-4 bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-6xl font-extrabold text-gray-900">Stories Come Alive</h1>
            <h2 className="text-4xl font-bold text-gray-800">Adventure Awaits</h2>
            <h3 className="text-2xl font-semibold text-gray-700">Choose Your Character</h3>
            <p className="text-lg text-gray-600">
              Every child becomes the hero of their own magical story. With personalized adventures
              that adapt to each reader, the possibilities are endless.
            </p>
            <p className="text-base text-gray-500">
              Safe, private, and designed for young imaginations to flourish.
            </p>
          </div>
        </section>

        {/* UI Components */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">UI Components</h2>
          
          {/* Buttons */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Buttons</h3>
            <div className="flex gap-4 flex-wrap">
              <button className="px-6 py-3 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white font-semibold rounded-full hover:shadow-lg transition-all">
                Start Adventure
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg transition-all">
                Choose Story
              </button>
              <button className="px-6 py-3 bg-white border-2 border-indigo-900 text-indigo-900 font-semibold rounded-full hover:bg-indigo-50 transition-all">
                Learn More
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 font-semibold rounded-full hover:shadow-lg transition-all">
                Magic Mode
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Story Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4"></div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Moonlight Adventure</h4>
                <p className="text-gray-600">Join the magical journey under the stars</p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-4"></div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Sunset Safari</h4>
                <p className="text-gray-600">Explore the savanna with friendly animals</p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Magical Dreams</h4>
                <p className="text-gray-600">Where imagination knows no bounds</p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Badges & Tags</h3>
            <div className="flex gap-3 flex-wrap">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Age 4-5</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Adventure</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">10 min read</span>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">Interactive</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">New</span>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Usage Example</h2>
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Twilight Story Header</h3>
            <p className="mb-6 text-purple-200">
              This design captures the magical twilight atmosphere from the cover image,
              perfect for immersive storytelling experiences.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 font-bold rounded-full hover:shadow-lg transition-all">
                Begin Story
              </button>
              <button className="px-6 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all">
                Choose Character
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}