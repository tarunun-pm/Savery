import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { transactions, profile, commitments } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare a compact summary of transaction data for the prompt
    const totalSpent = transactions.reduce((s: number, t: any) => s + t.amount, 0);
    const byCategory: Record<string, number> = {};
    transactions.forEach((t: any) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    const topCats = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, total]) => `${cat}: ₹${Math.round(total as number).toLocaleString("en-IN")}`)
      .join(", ");

    const totalCommitments = commitments.reduce((s: number, c: any) => s + c.amount, 0);
    const income = profile?.monthly_income || 0;
    const savingsRate = income > 0 ? Math.round(((income - totalSpent) / income) * 100) : 0;

    const prompt = `You are Savery, an AI financial clarity assistant for Indian users. Analyze this spending data and provide 4 concise, specific, non-judgmental insights in JSON format.

User context:
- Monthly income: ₹${income.toLocaleString("en-IN")}
- Fixed commitments: ₹${totalCommitments.toLocaleString("en-IN")}
- Total spent this month: ₹${Math.round(totalSpent).toLocaleString("en-IN")}
- Effective savings rate: ${savingsRate}%
- Top categories: ${topCats}
- Total transactions: ${transactions.length}

Return a JSON array of exactly 4 insight objects. Each object must have:
- "type": one of "info", "warning", "tip", "positive"
- "icon": a single relevant emoji
- "title": 5-8 word headline (specific, not generic)
- "body": 1-2 sentences, specific to the numbers, helpful and non-preachy

Focus on: biggest spending categories, unusual patterns, savings encouragement, specific actionable tips.
Only return valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean and parse the JSON response
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const insights = JSON.parse(cleaned);

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("Gemini insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
