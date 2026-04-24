import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { resumeDetails } = await req.json();

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Mistral API Key is missing" }, { status: 500 });
    }

    const apiUrl = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';

    const systemPrompt = `You are an AI portfolio generator. Your task is to extract information from the following resume text and format it into a specific JSON structure.
You MUST respond ONLY with the raw JSON object, without any markdown formatting, backticks, or explanation.
The JSON must match this schema exactly:
{
  "Portfolio_data": {
    "fullName": "",
    "phoneNumber": "",
    "role": "",
    "emailAddress": "",
    "bio": "",
    "resume": "",
    "skills": [],
    "socialLinks": {
        "website": "", "facebook": "", "twitter": "", "instagram": "", "linkedin": "", "github": "", "behance": "", "dribbble": ""
    },
    "education": {
        "degree": "", "fieldOfStudy": "", "institution": "", "graduationYear": ""
    },
    "workExperience": [
        { "jobTitle": "", "organization": "", "duration": "", "description": "" }
    ],
    "achievements": [
        { "title": "", "description": "", "year": "" }
    ],
    "projects": [
        { "name": "", "description": "", "imgLink": "", "stack": [], "SourceCode": "", "livePreview": "" }
    ]
  }
}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: resumeDetails }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API returned ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Clean markdown if mistral still adds it
    if (content.startsWith("\`\`\`json")) {
      content = content.replace(/\`\`\`json\n/g, "").replace(/\`\`\`/g, "").trim();
    } else if (content.startsWith("\`\`\`")) {
      content = content.replace(/\`\`\`\n/g, "").replace(/\`\`\`/g, "").trim();
    }

    const parsedData = JSON.parse(content);

    let portfolioData;
    if (Array.isArray(parsedData)) {
      portfolioData = parsedData;
    } else if (parsedData.Portfolio_data) {
      portfolioData = [parsedData];
    } else {
      portfolioData = [{ Portfolio_data: parsedData }];
    }

    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error("AI Portfolio Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}