import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero */}
      <section className="px-6 sm:px-10 md:px-16 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Step into the story as the hero
        </h1>
        <p className="mt-5 text-gray-600 max-w-2xl mx-auto">
          Capture your face once and see yourself as the main character in an interactive story.
          Private by default. Works on any modern device.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/play"
            className="rounded-md bg-black text-white px-5 py-3 text-sm font-medium hover:opacity-90"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            See how it works
          </a>
          <a
            href="/api/health"
            className="rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            target="_blank"
            rel="noreferrer"
          >
            Check API health
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 sm:px-10 md:px-16 py-12">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-lg">Your face in the story</h3>
            <p className="mt-2 text-sm text-gray-600">
              We embed your face as the main character throughout the narrative.
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-lg">Private by default</h3>
            <p className="mt-2 text-sm text-gray-600">
              Face data stays on your device in the MVP. Cloud stylization is optional and opt-in.
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-lg">Fast and lightweight</h3>
            <p className="mt-2 text-sm text-gray-600">
              Built for mobile browsers and desktops with smooth, low-latency rendering.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 sm:px-10 md:px-16 py-16 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-6 space-y-4">
            <li className="rounded-lg border p-4">
              <span className="font-semibold">1. Capture</span>
              <p className="text-sm text-gray-600">Take a quick selfie during onboarding.</p>
            </li>
            <li className="rounded-lg border p-4">
              <span className="font-semibold">2. Stylize (optional)</span>
              <p className="text-sm text-gray-600">Use our stylized mode later; MVP uses a simple placeholder.
              </p>
            </li>
            <li className="rounded-lg border p-4">
              <span className="font-semibold">3. Play</span>
              <p className="text-sm text-gray-600">Make choices and watch yourself appear across scenes.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-10 md:px-16 py-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Interactive Story. All rights reserved.
      </footer>
    </main>
  );
}
