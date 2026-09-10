// app/api/assistant/route.ts
//
// The only server-side entry point for the Promise Assistant chat.
// GEMINI_API_KEY is read here only (never NEXT_PUBLIC_) and never sent
// to the client. This route does not touch any database table beyond
// reading the current session's own user via Supabase auth — it never
// runs arbitrary SQL and never queries order/account data.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server'; // adjust path if your server client lives elsewhere
import { buildKnowledgeBlock } from '../../../lib/assistant/knowledge';
import type { AssistantMessage, AssistantRequestBody } from '../../../lib/assistant/types';

// Keep this small — it's a support widget, not a research agent.
const MAX_HISTORY_MESSAGES = 8; // ~4 back-and-forth turns
const MAX_MESSAGE_LENGTH = 800;
const STORE_HREF = '/store';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
// ^ Verify the current model id in Google AI Studio / the Gemini API docs —
//   model names change over time. gemini-2.5-flash is a good lightweight default.

function buildSystemPrompt(knowledgeBlock: string, authNote: string): string {
  return `You are "Promise Assistant", the friendly customer-help assistant for The Promise's website.

TONE: Friendly, professional, concise, natural. Short answers — a few sentences, not essays. No emojis unless the customer uses them first.

SCOPE — you ONLY help with:
- How to place an order
- Payment methods accepted
- Finding the nearest outlet
- How delivery works
- How to contact The Promise
- How to create an account
- How to track an order / find past orders
- General account help (navigational only)

HARD RULES — you must NEVER:
- Recommend food, dishes, or suggest what to order
- Search or filter the menu based on mood, cravings, or preferences
- Add, remove, or modify anything in a cart
- Place, cancel, or modify an order
- Reveal, guess, or fetch any specific customer's private data (their order contents, order status details, address, phone, payment details, account info) — you do not have access to this data at all
- Reveal or discuss admin/staff/internal information
- Invent prices, menu items, outlet addresses, payment methods, policies, or order details that are not given to you below

OUTLET QUESTIONS: If a customer asks about an outlet, location, or "store near me" and the answer isn't in the OUTLETS list below (e.g. a city or area that isn't listed, or details like hours/phone for a specific outlet that aren't given), do NOT say you don't know and stop there — instead tell them to check ${STORE_HREF} for the full, up-to-date list of outlets and their details.

If a customer asks something about THEIR OWN order/account/personal details:
${authNote}
In all cases, do not attempt to look up or state their actual data — direct them to the right page in their Dashboard, or to contact The Promise if they're stuck.

If you don't know something else (it's not in the facts below and isn't an outlet question), say so plainly and suggest they contact The Promise using the contact info below. Never guess or make something up.

FACTS YOU CAN USE (all verified, current information):
${knowledgeBlock}`;
}

function isObviouslyOutOfScope(text: string): string | null {
  const t = text.toLowerCase();
  const cartOrOrderActions = [
    'add to cart', 'add it to my cart', 'remove from cart', 'place my order',
    'place an order for me', 'checkout for me', 'pay for me', 'order it for me',
    'cancel my order',
  ];
  if (cartOrOrderActions.some((p) => t.includes(p))) {
    return "I can't place, modify, or cancel orders — but I can walk you through how to do that yourself, or you can contact The Promise directly for help with an existing order.";
  }
  const moodOrRecommend = [
    'what should i eat', 'recommend something', 'recommend a dish',
    'what do you suggest i order', 'surprise me', 'i\'m craving', 'im craving',
  ];
  if (moodOrRecommend.some((p) => t.includes(p))) {
    return "I'm not able to recommend dishes or browse the menu for you — but you're welcome to explore the full menu on the site! I can help with orders, payments, delivery, outlets, or your account instead.";
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: "The assistant isn't configured yet — please contact The Promise directly for help." },
        { status: 200 }
      );
    }

    const body = (await req.json()) as AssistantRequestBody;
    const incoming = Array.isArray(body?.messages) ? body.messages : [];

    // Sanitize + cap history and message length before it ever touches the model.
    const trimmed: AssistantMessage[] = incoming
      .slice(-MAX_HISTORY_MESSAGES)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

    const lastUserMessage = [...trimmed].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage || !lastUserMessage.content.trim()) {
      return NextResponse.json({ reply: "Could you tell me a bit more about what you need help with?" });
    }

    // Cheap guardrail short-circuit for obviously out-of-scope asks — saves a
    // model call and guarantees the boundary holds even if the prompt is ignored.
    const shortCircuit = isObviouslyOutOfScope(lastUserMessage.content);
    if (shortCircuit) {
      return NextResponse.json({ reply: shortCircuit });
    }

    // Auth-aware context — we only ever pass a yes/no + optional first name,
    // never order data, addresses, or anything from the database.
    let authNote = 'The customer is not logged in. If their question needs private data, ask them to log in first, then check the relevant page in their Dashboard.';
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const firstName =
          (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
          (user.user_metadata?.name as string | undefined)?.split(' ')[0];
        authNote = `The customer is logged in${firstName ? ` as ${firstName}` : ''}. You still cannot see their orders or account details — direct them to the relevant Dashboard tab (Orders, Profile, etc.) instead of answering with specifics.`;
      }
    } catch {
      // If auth lookup fails for any reason, fall back to treating them as a guest.
    }

    const systemPrompt = buildSystemPrompt(buildKnowledgeBlock(), authNote);

    // Gemini has no "system"/"assistant" roles in `contents` — system text goes
    // in a separate `systemInstruction` field, and prior assistant turns must
    // be relabeled as role "model".
    const contents = trimmed.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 350,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', geminiResponse.status, await geminiResponse.text().catch(() => ''));
      return NextResponse.json(
        { reply: "Sorry, I'm having trouble responding right now. Please try again in a moment, or contact The Promise directly." },
        { status: 200 }
      );
    }

    const data = await geminiResponse.json();
    const reply: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim() ||
      "Sorry, I couldn't come up with an answer for that. Could you rephrase, or contact The Promise directly?";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Promise Assistant route error:', err);
    return NextResponse.json(
      { reply: "Something went wrong on my end. Please try again, or contact The Promise directly." },
      { status: 200 }
    );
  }
}