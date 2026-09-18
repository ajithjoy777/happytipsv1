# Happy Tips — Platform Backend (Demo)

This is a working demo of the backend that would run behind **happytips.com**:
a QR-code tipping platform for hotels and Airbnbs. A guest scans a code, taps
a tip amount, pays by card — **the property keeps 100% of every tip**. Happy
Tips makes money from a **monthly subscription** charged to the property
(£10/room, capped at £50/month), not from the tips themselves.

This repo is the operator's admin panel (leads, clients, transactions,
payouts, team, analytics) **and** the guest-facing tip page, in one Next.js
app, backed by a real database (SQLite for the demo — swap for Postgres in
production, see below).

## What's in the demo

| Area | Route | What it does |
|---|---|---|
| Dashboard | `/admin` | Monthly recurring revenue, tip volume, active clients, open leads, traffic |
| Leads (CRM) | `/admin/leads` | Pipeline: New → Contacted → Onboarding → Active / Lost. Room count sets pricing; convert a lead to a live client with one click |
| Clients | `/admin/clients` | Every hotel/Airbnb on the platform, their subscription, billing status, and Stripe status |
| Client detail | `/admin/clients/[slug]` | QR code, subscription + invoice history, tip history, payout history, the per-tip fee on/off toggle |
| Transactions | `/admin/transactions` | Every tip across every client — tip amount, Stripe fee, platform fee, what the guest paid, what the owner got |
| Payouts & bank | `/admin/payouts` | Your business bank ledger (subscription revenue in, expenses out) + every tip payout sent to owners |
| Team | `/admin/team` | Add employees, assign a role, see what each role can access |
| Analytics | `/admin/analytics` | Website visitors, lead conversion funnel, tip page conversion |
| Guest tip page | `/tip/[slug]` | What a guest sees when they scan the QR code — pick an amount, pay |

Everything is real, working code hitting a real database — there's no
hard-coded fake UI. Convert a lead, and it actually becomes a client with a
real record and a scannable QR code. Submit a tip, and it actually creates a
transaction you'll see in `/admin/transactions` a second later.

## Running it

```bash
npm install
npm run db:seed      # (re)creates prisma/dev.db with realistic demo data
npm run dev
```

Then open:
- `http://localhost:3000` — landing page with links into the demo
- `http://localhost:3000/admin` — the admin panel
- `http://localhost:3000/tip/lensfield-hotel` — a sample guest tip page

Run `npm run db:seed` again any time to reset all demo data back to its
starting state (it's deterministic, so you'll get the same data every time).

## How the money model works (as built)

Happy Tips has **two separate money flows** — don't let them blur together,
they use different Stripe products entirely:

### 1. Subscription (your primary revenue today)

Every property pays a **monthly platform fee**: £10 per room, capped at
£50/month (`lib/billing.ts` → `computeSubscriptionFeePence`). A single
Airbnb unit pays £10; anything with 5+ rooms pays the £50 cap. This is
billed to the owner's card on file — in production, via **Stripe Billing**
(a recurring `Subscription`/`Invoice`), completely separate from the guest
tipping flow. `SubscriptionInvoice` records this history; if a payment
fails, `Client.billingStatus` flips to `PAST_DUE` and the tipping page goes
offline (see Birchwood Airbnb in the seed data for this exact scenario) —
in production that's Stripe Billing's `invoice.payment_failed` /
`invoice.paid` webhooks instead of the "Simulate..." button.

### 2. Guest tips (100% pass-through, fees added on top)

When a guest tips, **the property keeps the entire tip** — nothing is
deducted. Any fees are *added on top* and charged to the guest instead:

```
Guest pays:  tip amount + Stripe's card fee + platform fee (0% today)
Property gets: the full tip amount, no deductions
```

`lib/billing.ts` → `computeTipCheckout` does this math. In production, the
guest's card is charged the **total** via a Stripe PaymentIntent, and a
**destination charge** or **transfer** sends the tip amount to the
property's Stripe Connect account — the property's payout is never touched
by fees.

The **5% platform fee is built but switched off** (`Client.transactionFeePercent`,
default `0`) — per-client, so you can turn it on for one property without
touching the rest. Flip it on from that client's detail page in `/admin`.

### ⚠️ Worth watching closely: Stripe's own cut isn't free money for you

Card processing (~1.5% + 20p per UK transaction, see `computeStripeFeePence`)
is a **real cost paid to Stripe**, not your revenue — the guest pays it, and
it passes straight through to Stripe. That part is fine. The risk is on the
*subscription* side: a hotel doing, say, £3,000/month in tip volume paying
you a flat £50/month subscription is **fine for you** (Stripe's fee comes out
of the guest's payment, not your £50). But if you ever *do* turn on a
platform-absorbed cost anywhere in this flow — e.g. deciding later to eat
Stripe's fee yourself instead of passing it to the guest — a high-tip-volume
property on the £50 cap could cost you more in absorbed fees than it pays
you in subscription. Model this before changing who pays the card fee.

The schema (`prisma/schema.prisma`) is intentionally set up so pricing
changes are small: `subscriptionFeePence` and `transactionFeePercent` are
both per-client fields, not hard-coded, so you can run a different deal for
a specific hotel without a schema change.

## Data model

See `prisma/schema.prisma` for the full picture. The core entities:

- **User** — your team, with a `role` (Admin / Finance / Marketing / Support)
- **Lead** — a prospect hotel/Airbnb moving through your sales pipeline, with
  a room count that determines their future subscription price
- **Client** — a live property: Stripe Connect account + status, room count,
  `subscriptionFeePence`, `billingStatus`, and the `transactionFeePercent`
  on/off toggle
- **SubscriptionInvoice** — one month's platform subscription charge and
  whether it was paid
- **Transaction** — one guest tip: `tipAmountPence` (100% to the owner),
  `stripeFeePence` and `platformFeePence` (both added on top, paid by the
  guest), `totalChargedPence` (what actually hit their card)
- **ClientPayout** — a batch of tips paid out to one owner's bank account
- **PlatformLedgerEntry** — your own business bank account: subscription
  revenue in, Stripe payouts in, expenses out
- **DailyTraffic** — website visitor + funnel numbers for `/admin/analytics`

Money is always stored as an integer in pence, never a float — this avoids
the classic "£19.999999999998" rounding bugs.

## What's mocked vs. what's real

**Real:** the database, the CRM pipeline logic, the client/lead lifecycle,
the QR code generation, the guest tip form and its transaction record, the
whole admin UI reading live data.

**Mocked (clearly marked in the code with comments):**
- **Stripe** — no real Stripe account is wired up. `stripeAccountId`,
  `stripePaymentIntentId`, `stripeTransferId`, `stripeInvoiceId` are
  fake-but-realistic IDs. Swapping in real Stripe means: Stripe Connect
  Express onboarding links for `convertLeadToClient`, a real Stripe Billing
  `Subscription` created at the same time (for the monthly fee), a real
  `PaymentIntent` in `submitTip` (for the tip itself), and webhook handlers
  for `account.updated`, `invoice.paid`/`invoice.payment_failed`, and
  `payout.paid` instead of the "Simulate..." buttons in the admin UI.
- **Login** — there's no real authentication. The Team page shows the
  *intended* role model (who should see what), but anyone can currently
  open `/admin`. Before this is public, add real auth — the fastest options
  for a one-person team are **Clerk** or **NextAuth (Auth.js)**, both drop
  into a Next.js app in under an hour and support role-based access exactly
  matching the `Role` enum already in the schema.
- **Website visitor analytics** — seeded with realistic-looking numbers.
  Real visitor tracking would mean adding a lightweight analytics snippet
  (e.g. Plausible or Vercel Analytics) to your actual marketing site and a
  small webhook/API route here to pull daily totals into `DailyTraffic`.

## Deploying "behind your website"

The cleanest setup for a one-person company:
1. Keep your marketing site (happytips.com) wherever it is now.
2. Deploy this app (e.g. to Vercel — it's a standard Next.js app) to a
   subdomain like `app.happytips.com`, or reverse-proxy `/admin` and `/tip`
   paths from your main site to this app.
3. Swap SQLite for a hosted Postgres database (Vercel Postgres, Supabase, or
   Neon all work with zero schema changes — just change the `provider` in
   `prisma/schema.prisma` from `sqlite` to `postgresql` and update
   `DATABASE_URL`).
4. Add real auth (see above) before anyone but you can reach `/admin`.

## Suggested next steps, roughly in order

1. Model the unit economics (see the Stripe-cost callout above) with your
   real expected tip volumes before pricing changes — this is a spreadsheet
   exercise, not a code change.
2. Wire up real Stripe Connect (Express accounts, for tip payouts) **and**
   Stripe Billing (for the monthly subscription) — these are two different
   Stripe integrations that both need setting up.
3. Add authentication so `/admin` isn't wide open.
4. Move off SQLite to a hosted Postgres database.
5. Put a real analytics snippet on your marketing site feeding `DailyTraffic`.
6. Print your first real QR code (from any client's detail page) and test
   the whole loop — subscription charge and a guest tip — with Stripe test
   cards.
