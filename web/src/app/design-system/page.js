"use client";

export default function DesignSystemPage() {
  // Headspace-inspired color palette
  const colors = {
    primary: {
      orange: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316', // Main Headspace orange
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12'
      },
      yellow: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15', // Bright Headspace yellow
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12'
      }
    },
    secondary: {
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Calming green
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      },
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6', // Calming blue
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      }
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    }
  };

  const typography = {
    headings: [
      { name: 'Heading 1', class: 'text-4xl font-bold', sample: 'Be kind to your mind' },
      { name: 'Heading 2', class: 'text-3xl font-bold', sample: 'Start your journey' },
      { name: 'Heading 3', class: 'text-2xl font-semibold', sample: 'Latest articles' },
      { name: 'Heading 4', class: 'text-xl font-semibold', sample: 'Section title' },
      { name: 'Heading 5', class: 'text-lg font-medium', sample: 'Card title' },
      { name: 'Heading 6', class: 'text-base font-medium', sample: 'Small heading' }
    ],
    body: [
      { name: 'Body Large', class: 'text-lg', sample: 'Less stressed. More resilient. Happier. It all starts with just a few minutes a day.' },
      { name: 'Body Regular', class: 'text-base', sample: 'Regular body text for most content and descriptions.' },
      { name: 'Body Small', class: 'text-sm', sample: 'Smaller text for captions and secondary information.' },
      { name: 'Caption', class: 'text-xs', sample: 'Very small text for fine print and labels.' }
    ]
  };

  const components = [
    {
      name: 'Primary Button',
      element: (
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-medium transition-colors">
          Start your journey
        </button>
      )
    },
    {
      name: 'Secondary Button',
      element: (
        <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-full font-medium transition-colors">
          Learn more
        </button>
      )
    },
    {
      name: 'Outline Button',
      element: (
        <button className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-6 py-3 rounded-full font-medium transition-colors">
          Try for free
        </button>
      )
    },
    {
      name: 'Card - Orange',
      element: (
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-6 rounded-2xl max-w-sm">
          <h3 className="text-xl font-bold mb-2">Meditation</h3>
          <p className="text-orange-100">Find peace in just 5 minutes</p>
        </div>
      )
    },
    {
      name: 'Card - Yellow',
      element: (
        <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 text-gray-900 p-6 rounded-2xl max-w-sm">
          <h3 className="text-xl font-bold mb-2">Sleep Stories</h3>
          <p className="text-yellow-800">Drift off to dreamland</p>
        </div>
      )
    },
    {
      name: 'Card - Green',
      element: (
        <div className="bg-gradient-to-br from-green-400 to-green-500 text-white p-6 rounded-2xl max-w-sm">
          <h3 className="text-xl font-bold mb-2">Mindfulness</h3>
          <p className="text-green-100">Be present in the moment</p>
        </div>
      )
    },
    {
      name: 'Card - Blue',
      element: (
        <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-6 rounded-2xl max-w-sm">
          <h3 className="text-xl font-bold mb-2">Focus Music</h3>
          <p className="text-blue-100">Enhance your concentration</p>
        </div>
      )
    }
  ];

  const ColorSwatch = ({ name, hex, bgColor }) => (
    <div className="text-center">
      <div 
        className="w-16 h-16 rounded-lg border border-gray-200 mb-2" 
        style={{ backgroundColor: hex }}
      ></div>
      <div className="text-xs font-medium text-gray-900">{name}</div>
      <div className="text-xs text-gray-500">{hex}</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-r from-orange-50 to-yellow-50">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Design System</h1>
        <p className="text-lg text-gray-700 max-w-3xl">
          Inspired by Headspace&apos;s warm, welcoming, and mindful design philosophy.
          This design system emphasizes accessibility, joy, and calm through vibrant yet soothing colors.
        </p>
      </section>

      <div className="px-6 sm:px-10 md:px-16 py-12 max-w-7xl mx-auto space-y-16">
        
        {/* Color Palette */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Color Palette</h2>
          
          {/* Primary Colors */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Primary Colors</h3>
            
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Orange (Main Brand)</h4>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                {Object.entries(colors.primary.orange).map(([shade, hex]) => (
                  <ColorSwatch 
                    key={shade} 
                    name={shade} 
                    hex={hex}
                  />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Yellow (Energy & Joy)</h4>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
                {Object.entries(colors.primary.yellow).map(([shade, hex]) => (
                  <ColorSwatch 
                    key={shade} 
                    name={shade} 
                    hex={hex}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Colors */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Secondary Colors</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Green (Calm & Growth)</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(colors.secondary.green).slice(0, 5).map(([shade, hex]) => (
                    <ColorSwatch 
                      key={shade} 
                      name={shade} 
                      hex={hex}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Blue (Trust & Clarity)</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(colors.secondary.blue).slice(0, 5).map(([shade, hex]) => (
                    <ColorSwatch 
                      key={shade} 
                      name={shade} 
                      hex={hex}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Typography</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Headings</h3>
              <div className="space-y-4">
                {typography.headings.map((heading, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4">
                    <div className="text-sm text-gray-500 mb-1">{heading.name} ({heading.class})</div>
                    <div className={`${heading.class} text-gray-900`}>{heading.sample}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Body Text</h3>
              <div className="space-y-4">
                {typography.body.map((text, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4">
                    <div className="text-sm text-gray-500 mb-1">{text.name} ({text.class})</div>
                    <div className={`${text.class} text-gray-900`}>{text.sample}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Components */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Components</h2>
          
          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Buttons</h3>
              <div className="flex flex-wrap gap-4">
                {components.slice(0, 3).map((component, index) => (
                  <div key={index} className="text-center">
                    {component.element}
                    <div className="text-sm text-gray-500 mt-2">{component.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {components.slice(3).map((component, index) => (
                  <div key={index}>
                    {component.element}
                    <div className="text-sm text-gray-500 mt-2 text-center">{component.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Design Principles */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Design Principles</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl">🧘</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mindful</h3>
              <p className="text-gray-700">Every interaction should feel intentional and calming, never overwhelming or rushed.</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-900 text-xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Joyful</h3>
              <p className="text-gray-700">Bright colors and playful elements bring warmth and positivity to the experience.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Accessible</h3>
              <p className="text-gray-700">Design for everyone with clear contrast, readable text, and intuitive navigation.</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}