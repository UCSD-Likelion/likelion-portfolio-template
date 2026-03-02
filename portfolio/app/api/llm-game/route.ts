import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid image data" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "This is a simple hand-drawn sketch. What object is drawn? Reply with only a single word.",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "low",
              },
            },
          ],
        },
      ],
    });

    const guess = response.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ guess });
  } catch (error) {
    console.error("LLM game API error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
