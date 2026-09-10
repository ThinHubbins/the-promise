'use client';

// components/assistant/PromiseAssistant.tsx
//
// Floating "Promise Assistant" button + chat panel. Mount this once,
// e.g. in app/layout.tsx just before the closing </body>, so it's
// available site-wide.
//
// Adjust these two if your routes are named differently:
const LOGIN_HREF = '/login';
const DASHBOARD_ORDERS_HREF = '/dashboard';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client'; // adjust path if your browser client lives elsewhere
import { useCart } from '../../context/CartContext';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AssistantAction = {
  type: 'add_to_cart';
  dishId: string;
  name: string;
  qty: number;
};

const STARTER_QUESTIONS = [
  'How can I place an order?',
  'How does delivery work?',
  'Find an outlet',
  'How can I contact you?',
];

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm the Promise Assistant. I can help with orders, payments, delivery, outlets, and your account — what do you need?",
};

export default function PromiseAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [justAddedToCart, setJustAddedToCart] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open, justAddedToCart]);

  function applyActions(actions: AssistantAction[]) {
    if (!actions || actions.length === 0) return;

    for (const action of actions) {
      if (action.type === 'add_to_cart') {
        const qty = Math.max(1, Math.min(20, action.qty || 1));
        for (let i = 0; i < qty; i++) {
          addToCart(action.dishId);
        }
      }
    }

    setJustAddedToCart(true);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setJustAddedToCart(false);

    try {
      // Only send the last few turns to keep requests small.
      const history = nextMessages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || "Sorry, something went wrong." }]);
      applyActions(data.actions);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't reach the assistant. Please try again or contact The Promise directly." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function goToCheckout() {
    setOpen(false);
    router.push(DASHBOARD_ORDERS_HREF);
  }

  return (
    <>
      <button
        type="button"
        className="assistant-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close Promise Assistant' : 'Open Promise Assistant'}
      >
        {open ? (
          <svg className="icon" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
        ) : (
          <svg className="icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        )}
        <span>Promise Assistant</span>
      </button>

      {open && (
        <div className="assistant-panel" role="dialog" aria-label="Promise Assistant chat">
          <div className="assistant-head">
            <div>
              <h3>Promise Assistant</h3>
              <span>Here to help — orders, delivery, outlets & more</span>
            </div>
            <button type="button" className="assistant-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg className="icon" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>
          </div>

          <div className="assistant-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`assistant-bubble ${m.role === 'user' ? 'assistant-bubble-user' : 'assistant-bubble-bot'}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="assistant-bubble assistant-bubble-bot assistant-typing">
                <span /><span /><span />
              </div>
            )}

            {justAddedToCart && !loading && (
              <button type="button" className="assistant-chip" onClick={goToCheckout}>
                Go to checkout →
              </button>
            )}

            {isLoggedIn === false && messages.length <= 2 && (
              <div className="assistant-hint">
                Have a question about your own orders or account?{' '}
                <Link href={LOGIN_HREF}>Log in</Link> first so I can point you to the right place.
              </div>
            )}
            {isLoggedIn === true && messages.length <= 2 && (
              <div className="assistant-hint">
                You can view live order status any time in your{' '}
                <Link href={DASHBOARD_ORDERS_HREF}>Dashboard</Link>.
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="assistant-starters">
              {STARTER_QUESTIONS.map((q) => (
                <button key={q} type="button" className="assistant-chip" onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="assistant-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about orders, delivery, outlets…"
              aria-label="Message"
              disabled={loading}
            />
            <button type="submit" className="assistant-send" disabled={loading || !input.trim()} aria-label="Send">
              <svg className="icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}