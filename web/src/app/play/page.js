"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const SELFIE_KEY = "selfie_v1";

export default function PlayPage() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(null);

  // Selfie capture state
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [selfie, setSelfie] = useState(null); // data URL
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      // Wait for dimensions
      const onLoaded = () => {
        const w = videoRef.current?.videoWidth || 640;
        const h = videoRef.current?.videoHeight || 480;
        setVideoDims({ w, h });
      };
      videoRef.current.addEventListener("loadedmetadata", onLoaded, { once: true });
      setCameraOn(true);

    } catch (err) {
      console.error(err);
      setCameraError(
        "Could not access camera. Please grant permission and ensure a camera is available."
      );
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraOn(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const { w, h } = videoDims.w && videoDims.h ? videoDims : { w: 640, h: 480 };
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/png");
    const payload = { url: dataUrl, w, h };
    setSelfie(payload);
    try { localStorage.setItem(SELFIE_KEY, JSON.stringify(payload)); } catch {}
  };
  const clearSelfie = () => {
    setSelfie(null);
    try { localStorage.removeItem(SELFIE_KEY); } catch {}
  };


  useEffect(() => {
    // Prefill selfie from localStorage, if present
    try {
      const raw = localStorage.getItem(SELFIE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url) setSelfie(parsed);
      }
    } catch {}

    return () => {
      // Cleanup on unmount
      try { stopCamera(); } catch {}
    };
  }, []);

  const loadCharacter = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stylize", { method: "POST" });
      const data = await res.json();
      setUrl(data?.result?.url ?? null);
    } catch (e) {
      console.error(e);
      setUrl(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 sm:px-10 md:px-16 py-10 border-b bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-3xl sm:text-4xl font-bold">Play</h1>
        <p className="mt-2 text-gray-600">Capture a selfie below, then continue to play. Your photo stays on this device in the MVP.</p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link href="/" className="w-full sm:w-auto text-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Back to home</Link>
          <Link href="/story" className="w-full sm:w-auto text-center rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-500">Start adventure</Link>
        </div>
      </section>
      {/* Selfie capture */}
      <section className="px-6 sm:px-10 md:px-16 py-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-semibold">Selfie capture</h2>
          <p className="mt-2 text-sm text-gray-600">Grant camera access to capture a single photo. Nothing is uploaded.</p>

          {cameraError && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{cameraError}</div>
          )}

          <div className="mt-5 flex flex-wrap items-start gap-6">
            <div className="flex flex-col gap-3">
              {!cameraOn ? (
                <button onClick={startCamera} className="w-full sm:w-fit rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90">Start camera</button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button onClick={captureFrame} className="w-full sm:w-auto rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90">Capture</button>
                  <button onClick={stopCamera} className="w-full sm:w-auto rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Stop</button>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`mt-2 rounded border bg-black w-full max-w-sm ${cameraOn ? "block" : "hidden"}`}
                style={{ width: "100%", height: "auto" }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div>
              <h3 className="font-medium">Captured photo</h3>
              <p className="text-xs text-gray-500">Preview of your selfie (local only)</p>
              <div className="mt-2">
                {selfie ? (
                  <Image src={selfie.url} alt="captured selfie" width={selfie.w || 256} height={selfie.h || 256} className="w-48 sm:w-56 md:w-64 h-auto rounded border" />
                ) : (
                  <div className="w-64 h-40 border rounded flex items-center justify-center text-gray-400">No selfie yet</div>
                )}
              </div>
              {selfie && (
                <div className="mt-3">
                  <button onClick={clearSelfie} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Retake</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>


      <section className="px-6 sm:px-10 md:px-16 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-xl font-semibold">Character preview</h2>
            <p className="mt-2 text-sm text-gray-600">This is a temporary preview using a placeholder asset.</p>
            <div className="mt-4">
              {selfie ? (
                <Image src={selfie.url} alt="your character" width={selfie.w || 256} height={selfie.h || 256} className="w-48 sm:w-56 md:w-64 h-auto rounded border" />
              ) : url ? (
                <Image src={url} alt="placeholder head" width={256} height={256} className="w-48 sm:w-56 md:w-64 h-auto rounded border" />
              ) : (
                <div className="w-64 h-40 border rounded flex items-center justify-center text-gray-400">No character loaded</div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Planned steps</h2>
            <ol className="mt-2 space-y-3 text-sm text-gray-700">
              <li className="rounded border p-3">1. Selfie capture with camera permissions</li>
              <li className="rounded border p-3">2. Local-only processing and controls</li>
              <li className="rounded border p-3">3. Story scenes with your character composited</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}

