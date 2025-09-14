export async function POST() {
  try {
    // Simplified: no emotion analysis, return a single placeholder head URL
    return Response.json({ status: "complete", result: { url: "/placeholder-head.svg" } });
  } catch (e) {
    return new Response(
      JSON.stringify({ status: "error", error: String(e) }),
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ status: "complete", result: { url: "/placeholder-head.svg" } });
}

