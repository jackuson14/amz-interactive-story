import CharacterProcessor from '@/components/CharacterProcessor';

export default function CharacterProcessorPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Character Background Removal</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Remove backgrounds from character images automatically using AI. 
            Perfect for generating transparent character images for your interactive stories.
          </p>
        </div>
        
        <CharacterProcessor />
        
        <div className="mt-8 text-center">
          <a 
            href="/story?story=goodnight-zoo" 
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🦁 View Zoo Story
          </a>
        </div>
      </div>
    </main>
  );
}