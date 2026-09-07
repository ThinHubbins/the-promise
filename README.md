# The Promise — Next.js + TypeScript conversion (Step 1 of 2)

Same as the JS version, ported to `.ts`/`.tsx`. All imports are relative — no
path alias (`@/*`) required, so this drops straight into an existing
`tsconfig.json` without edits.

## Files
```
app/
  layout.tsx
  page.tsx
  globals.css
  login/page.tsx
  api/auth/login/route.ts
  api/auth/me/route.ts
components/
  Header.tsx        (Login ⇄ "Your Order" toggle lives here)
  Footer.tsx
  Hero.tsx
  StatsBand.tsx
  MenuSection.tsx    (categories + filterable dish grid, client component)
  AboutSection.tsx
  CtaBand.tsx
  Toast.tsx
  DishIcon.tsx
context/
  AuthContext.tsx    (login/logout/session, localStorage-backed)
  CartContext.tsx    (cart state, shared app-wide)
lib/
  types.ts           (Dish, Category, CartLine, User)
  dishes.ts          (menu data)
  auth.ts            (demo token encode/decode — base64 JSON, NOT secure)
```

## Notes
- `lib/auth.ts` uses `Buffer`, so the two API routes run on the Node.js
  runtime (default for route handlers unless you opt into `edge`).
- The mock backend (`app/api/auth/login/route.ts`) accepts any non-empty
  email/password. `demo@thepromise.ng` returns a pre-filled name.
- Cart/order tracking/payment history are still locked behind login — the
  `/dashboard` route with its three tabs (Track Order, Checkout, Payment
  History) is the next step, same as the JS version's README described.

Say "continue" and I'll build the dashboard page in TypeScript next.
