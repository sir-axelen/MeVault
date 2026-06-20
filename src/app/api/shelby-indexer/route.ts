import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization");
    
    let apiKey = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.split(" ")[1];
    } else if (process.env.NEXT_PUBLIC_SHELBY_API_KEY) {
      apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY;
    }

    const indexerUrl = process.env.NEXT_PUBLIC_SHELBY_INDEXER || "https://api.shelbynet.shelby.xyz/v1/graphql";

    const response = await fetch(indexerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shelby indexer proxy error:", error);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
