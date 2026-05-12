import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { merchants } = await req.json() as { merchants: string[] };

    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ categories: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build a batch categorization prompt for efficiency
    const merchantList = merchants
      .slice(0, 100) // Cap at 100 per request to avoid token limits
      .map((m, i) => `${i + 1}. "${m}"`)
      .join("\n");

    const prompt = `You are a financial transaction categorizer for Indian users. Categorize each merchant/description into the correct category and spending bucket.

Categories to use (pick exactly one):
- Food & Dining
- Shopping  
- Transport
- Bills & Utilities
- Entertainment
- Health & Wellness
- Financial
- Personal Care
- Education
- Others

Buckets:
- fixed (rent, SIP, EMI, insurance - predictable recurring)
- essential (groceries, transport, utilities, health - needed but variable)
- discretionary (dining out, shopping, entertainment, personal care - optional)

Merchants to categorize:
${merchantList}

Return a JSON array with exactly ${Math.min(merchants.length, 100)} objects in order. Each object: { "category": "...", "bucket": "..." }
No markdown, only valid JSON array.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const categories = JSON.parse(cleaned);

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Gemini categorize error:", err);
    // Return fallback categories on error
    return NextResponse.json({
      categories: [],
      error: "Categorization failed — you can assign categories manually"
    });
  }
}
