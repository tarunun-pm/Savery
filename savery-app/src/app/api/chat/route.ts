import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { message, context, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build a compact financial context string
    const { income = 0, commitments = 0, totalSpent = 0, safeToSpend = 0, topCategories = "" } = context || {};
    const savingsRate = income > 0 ? Math.round(((income - totalSpent) / income) * 100) : 0;

    const systemPrompt = `You are Savery 🍋, a warm, sharp, and empathetic AI financial clarity guide for Indian users.

The user's current financial snapshot for this month:
- Monthly income: ₹${income.toLocaleString("en-IN")}
- Fixed commitments (rent, EMI, subscriptions): ₹${commitments.toLocaleString("en-IN")}
- Total spent this month: ₹${totalSpent.toLocaleString("en-IN")}
- Safe to spend today: ₹${safeToSpend.toLocaleString("en-IN")}
- Effective savings rate: ${savingsRate}%
- Top spending categories: ${topCategories || "No data yet"}

Your personality rules:
- Be warm, direct, and friendly — like a smart friend who happens to know finance
- Keep replies concise: 2-3 sentences max unless the user asks for detail
- Always use ₹ (not Rs or INR) for Indian Rupee amounts
- Use the user's actual numbers when answering — never be vague or generic
- Never be preachy, judgmental, or moralizing about spending choices
- If asked something outside personal finance, gently redirect: "I'm best at helping with your money — want to talk about your spending or savings?"
- Use light formatting: bold for numbers (e.g., **₹5,000**), but no bullet lists in short replies
- You can ask clarifying questions to give better advice
- If safe-to-spend is 0 or very low, be empathetic and helpful, not alarming`;

    // Build conversation history for multi-turn chat
    const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Got it! I'm Savery 🍋, your financial clarity guide. I have your spending data loaded and I'm ready to help. What's on your mind?" }],
        },
        ...chatHistory,
      ],
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Savery chat error:", err);

    // Surface friendly messages for known Gemini API errors
    if (err?.status === 429) {
      return NextResponse.json(
        { error: "I'm a bit overwhelmed right now — Gemini's rate limit hit. Try again in a moment! 🍋" },
        { status: 429 }
      );
    }
    if (err?.status === 404) {
      return NextResponse.json(
        { error: "Model configuration issue. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Failed to get a response. Please try again." }, { status: 500 });
  }
}
