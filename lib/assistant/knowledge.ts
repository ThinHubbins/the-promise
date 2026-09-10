// lib/assistant/knowledge.ts
//
// Everything the Promise Assistant is allowed to say factually comes from
// this file (plus the live outlet list). It never invents prices, menu
// items, addresses, payment methods, or policies — if something isn't
// filled in here, it tells the customer it doesn't know and points them
// to contact The Promise directly.
//
// >>> FILL IN THE TODOs BELOW WITH YOUR REAL, CURRENT INFORMATION. <<<

import { outlets } from '../../lib/outlets';

export const CONTACT_INFO = {
  // TODO: replace with your real support channels
  phone: 'TODO: e.g. +234 800 000 0000',
  whatsapp: 'TODO: e.g. +234 800 000 0000',
  email: 'TODO: e.g. support@thepromise.example',
  hours: 'TODO: e.g. Mon–Sat, 8am–9pm',
};

export const PAYMENT_METHODS = [
  // TODO: list only the payment methods you actually support.
  // Example: 'Bank transfer to our listed account (shown at checkout)',
  // Example: 'Card payment via our checkout page',
  // Example: 'Cash on delivery, where available',
];

export const ORDER_HELP = {
  // TODO: short, accurate description of your real ordering flow
  howToOrder:
    'TODO: e.g. Browse the menu, tap "Add to Cart" on the dishes you want, open the cart, and follow the checkout steps to pay.',
  howToTrackOrder:
    'Log in and open your Dashboard, then go to the Orders tab — each order shows its live status and tracking timeline there.',
  howToCreateAccount:
    'TODO: e.g. Tap "Sign Up" in the top menu and enter your name, email, and phone number to create an account.',
  howToFindOrders:
    'Your past and current orders are listed under the Orders tab in your Dashboard once you\'re logged in.',
};

export const DELIVERY_INFO = {
  // TODO: describe your actual delivery process/timing/fees/areas
  overview:
    'TODO: e.g. We deliver from the outlet nearest to you. Delivery time and fees depend on your location and are shown at checkout.',
};

export const ACCOUNT_HELP =
  'For account issues (login problems, updating details, etc.), log in and check your Dashboard > Profile tab. If you\'re still stuck, contact The Promise directly and our team will help.';

/**
 * Builds the outlets section of the knowledge base from the single
 * source of truth in lib/outlets.ts, so the assistant is always in
 * sync with the real outlet list — nothing duplicated or invented.
 */
export function formatOutletsForPrompt(): string {
  return outlets
    .map((o) => `- ${o.name}: ${o.address}, ${o.city}, ${o.state}`)
    .join('\n');
}

/**
 * Assembles the full "facts" block injected into the system prompt.
 * Keep this compact — every token here is spent on every request.
 */
export function buildKnowledgeBlock(): string {
  const payments = PAYMENT_METHODS.length
    ? PAYMENT_METHODS.map((p) => `- ${p}`).join('\n')
    : '(Not configured yet — if asked, say you\'re not sure and suggest contacting The Promise.)';

  return `
OUTLETS (real, current list):
${formatOutletsForPrompt()}

HOW TO PLACE AN ORDER:
${ORDER_HELP.howToOrder}

HOW TO TRACK AN ORDER:
${ORDER_HELP.howToTrackOrder}

HOW TO CREATE AN ACCOUNT:
${ORDER_HELP.howToCreateAccount}

WHERE TO FIND MY ORDERS:
${ORDER_HELP.howToFindOrders}

ACCOUNT HELP:
${ACCOUNT_HELP}

DELIVERY:
${DELIVERY_INFO.overview}

PAYMENT METHODS WE ACCEPT:
${payments}

CONTACT THE PROMISE:
- Phone: ${CONTACT_INFO.phone}
- WhatsApp: ${CONTACT_INFO.whatsapp}
- Email: ${CONTACT_INFO.email}
- Hours: ${CONTACT_INFO.hours}
`.trim();
}