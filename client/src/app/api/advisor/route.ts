import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Mistral API Key is missing" }, { status: 500 });
    }
    const apiUrl = 'https://api.mistral.ai/v1/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API returned ${response.status}`);
    }

    return new NextResponse(response.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error("Advisor API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}