// app/api/assistant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { buildKnowledgeBlock } from '../../../lib/assistant/knowledge';
import type { AssistantMessage, AssistantRequestBody } from '../../../lib/assistant/types';

const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 800;
const STORE_HREF = 'store';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_MENU_ITEMS_IN_PROMPT = 60;

type MenuItemForPrompt = { id: string; name: string; price: number; tag: string | null };

async function fetchMenuForAssistant(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ block: string; items: MenuItemForPrompt[] }> {
  const { data, error } = await supabase
    .from('dishes')
    .select('id, name, price, tag')
    .order('name', { ascending: true })
    .limit(MAX_MENU_ITEMS_IN_PROMPT);

  if (error || !data || data.length === 0) {
    return {
      block: '(Menu is currently unavailable to the assistant — do not invent dishes; tell the customer to browse the menu directly.)',
      items: [],
    };
  }

  const block = data
    .map((d) => `- id:${d.id} | ${d.name} — ₦${d.price}${d.tag ? ` [${d.tag}]` : ''}`)
    .join('\n');

  return { block, items: data };
}

function buildSystemPrompt(knowledgeBlock: string, menuBlock: string, authNote: string, isLoggedIn: boolean): string {
  return `You are "Promise Assistant", the friendly customer-help assistant for The Promise's website.

You must ALWAYS respond with a single valid JSON object matching this shape, and nothing else:
{
  "reply": string,           // what you say to the customer, conversational, a few sentences max
  "actions": [                // usually empty. Only include when the customer clearly wants it.
    { "type": "add_to_cart", "dishId": string, "name": string, "qty": number }
  ]
}

TONE: Friendly, professional, concise, natural. No emojis unless the customer uses them first.

SCOPE — you help with:
- How to place an order
- Payment methods accepted
- Finding the nearest outlet
- How delivery works
- How to contact The Promise
- How to create an account
- How to track an order / find past orders
- General account help (navigational only)
- Suggesting dishes from the ACTIVE MENU below when a customer asks for ideas or recommendations
- Adding a specific dish to their cart when they clearly ask you to (see ADDING TO CART below)

RECOMMENDING FOOD:
- Only ever mention dishes that appear in the ACTIVE MENU list below, using the name exactly as listed.
- Never invent a dish, price, or id that isn't in that list.
- Keep it to 1-3 suggestions with name, price, and a short one-line reason.

ADDING TO CART:
- ${isLoggedIn ? 'The customer is logged in, so you CAN add items to their cart.' : 'The customer is NOT logged in. You cannot add anything to a cart — if they ask you to add an item, tell them to log in first, then ask again.'}
- Only add an item when the customer clearly confirms they want it added (e.g. "yes add that", "add 2 jollof rice to my cart") — never add something just because you recommended it and they haven't responded yet.
- When you do add something, use the exact "id" value shown next to that dish in the ACTIVE MENU list below — never guess or invent an id.
- Default qty to 1 if the customer doesn't specify a number.
- If the customer asks for a dish that isn't in the ACTIVE MENU list, say you can't find it and don't emit an action for it.
- After adding, your "reply" should confirm what you added and mention they can review it in their cart before checking out on the Dashboard.
- Emitting an "add_to_cart" action is the ONLY way items get added — do not just say "I've added it" in text without also including the action, and never include the action without also confirming it in "reply".

HARD RULES — you must NEVER:
- Remove or modify existing cart items, place, cancel, or modify an order, or process payment
- Reveal, guess, or fetch any specific customer's private data (their order contents, order status details, address, phone, payment details, account info) — you do not have access to this data at all
- Reveal or discuss admin/staff/internal information
- Invent prices, menu items, outlet addresses, payment methods, or policies that are not given to you below

OUTLET QUESTIONS: If a customer asks about an outlet, location, or "store near me" and the answer isn't in the OUTLETS list below, tell them to check ${STORE_HREF} for the full, up-to-date list.

If a customer asks something about THEIR OWN order/account/personal details:
${authNote}
Do not attempt to look up or state their actual data — direct them to the right Dashboard tab, or to contact The Promise if they're stuck.

If you don't know something else, say so plainly and suggest they contact The Promise. Never guess or make something up.

ACTIVE MENU (id | name (category) — price [tag]; only recommend/add from this list):
${menuBlock}

OTHER FACTS YOU CAN USE:
${knowledgeBlock}`;
}

function isObviouslyOutOfScope(text: string): string | null {
  const t = text.toLowerCase();
  const orderActions = [
    'place my order', 'place an order for me', 'checkout for me', 'pay for me',
    'order it for me', 'cancel my order', 'remove everything from my cart',
  ];
  if (orderActions.some((p) => t.includes(p))) {
    return "I can add items to your cart if you tell me what you'd like, but I can't place, pay for, or cancel orders myself — you'll finish checkout yourself on the Dashboard.";
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: "The assistant isn't configured yet — please contact The Promise directly for help.", actions: [] },
        { status: 200 }
      );
    }

    const body = (await req.json()) as AssistantRequestBody;
    const incoming = Array.isArray(body?.messages) ? body.messages : [];

    const trimmed: AssistantMessage[] = incoming
      .slice(-MAX_HISTORY_MESSAGES)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

    const lastUserMessage = [...trimmed].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage || !lastUserMessage.content.trim()) {
      return NextResponse.json({ reply: "Could you tell me a bit more about what you need help with?", actions: [] });
    }

    const shortCircuit = isObviouslyOutOfScope(lastUserMessage.content);
    if (shortCircuit) {
      return NextResponse.json({ reply: shortCircuit, actions: [] });
    }

    const supabase = await createClient();

    let authNote = 'The customer is not logged in. If their question needs private data, ask them to log in first, then check the relevant page in their Dashboard.';
    let isLoggedIn = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isLoggedIn = true;
        const firstName =
          (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
          (user.user_metadata?.name as string | undefined)?.split(' ')[0];
        authNote = `The customer is logged in${firstName ? ` as ${firstName}` : ''}. You still cannot see their orders or account details — direct them to the relevant Dashboard tab instead of answering with specifics.`;
      }
    } catch {
      // fall back to guest
    }

    const { block: menuBlock, items: menuItems } = await fetchMenuForAssistant(supabase);
    const systemPrompt = buildSystemPrompt(buildKnowledgeBlock(), menuBlock, authNote, isLoggedIn);

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
            maxOutputTokens: 400,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                reply: { type: 'string' },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['add_to_cart'] },
                      dishId: { type: 'string' },
                      name: { type: 'string' },
                      qty: { type: 'integer' },
                    },
                    required: ['type', 'dishId', 'name', 'qty'],
                  },
                },
              },
              required: ['reply', 'actions'],
            },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', geminiResponse.status, await geminiResponse.text().catch(() => ''));
      return NextResponse.json(
        { reply: "Sorry, I'm having trouble responding right now. Please try again in a moment, or contact The Promise directly.", actions: [] },
        { status: 200 }
      );
    }

    const data = await geminiResponse.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';

    let parsed: { reply: string; actions: { type: string; dishId: string; name: string; qty: number }[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json({
        reply: rawText.trim() || "Sorry, I couldn't come up with an answer for that. Could you rephrase?",
        actions: [],
      });
    }

    // Never trust the model's dishId/qty blindly — validate against the real menu
    // before it ever reaches the client, so a hallucinated id can't reach the cart.
    const validIds = new Set(menuItems.map((m) => m.id));
    const safeActions = isLoggedIn
      ? (parsed.actions || []).filter(
          (a) => a?.type === 'add_to_cart' && validIds.has(a.dishId) && Number.isInteger(a.qty) && a.qty > 0 && a.qty <= 20
        )
      : [];

    return NextResponse.json({ reply: parsed.reply, actions: safeActions });
  } catch (err) {
    console.error('Promise Assistant route error:', err);
    return NextResponse.json(
      { reply: "Something went wrong on my end. Please try again, or contact customer service +234 803 722 9044.", actions: [] },
      { status: 200 }
    );
  }
}