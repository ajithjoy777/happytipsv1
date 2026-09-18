# Happy Tips — Platform Backend (Demo)

This is a working demo of the backend that would run behind **happytips.com**:
a QR-code tipping platform for hotels and Airbnbs. A guest scans a code, taps
a tip amount, pays by card — the platform keeps a flat **£10** fee and the
rest is sent straight to the property's own bank account via Stripe Connect.

This repo is the operator's admin panel (leads, clients, transactions,
payouts, team, analytics) **and** the guest-facing tip page, in one Next.js
app, backed by a real database (SQLite for the demo — swap for Postgres in
production, see below).

## What's in the demo

| Area | Route | What it does |
|---|---|---|
| Dashboard | `/admin` | Revenue, active clients, open leads, pending payouts, traffic |
| Leads (CRM) | `/admin/leads` | Pipeline: New → Contacted → Onboarding → Active / Lost. Convert a lead to a live client with one click |
| Clients | `/admin/clients` | Every hotel/Airbnb on the platform, their Stripe status, and per-client tips + payouts |
| Client detail | `/admin/clients/[slug]` | QR code for that property's tip page, transaction history, payout history |
| Transactions | `/admin/transactions` | Every tip across every client — gross, fee, net, status |
| Payouts & bank | `/admin/payouts` | Your business bank ledger (fee revenue in, expenses out) + every payout sent to owners |
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

1. A guest scans a QR code on a table card / room key / receipt at a
   property → lands on `/tip/[slug]`.
2. They pick an amount and pay by card. In the demo this instantly creates a
   `Transaction` row. In production this becomes a **Stripe PaymentIntent**
   with `application_fee_amount` set to your cut, using **destination
   charges** on the property's **Stripe Connect** account — Stripe splits
   the money automatically at the moment of payment, so you never technically
   "hold" the owner's share.
3. Your £10 lands in your Stripe balance immediately (`FEE_REVENUE` ledger
   entry); the rest lands in the property's Stripe Connect balance.
4. Stripe pays out each side's balance to their real bank account on a
   schedule (the demo models this as weekly for owners, every two weeks for
   your own fee revenue — both configurable in Stripe's dashboard for real).

### ⚠️ Worth reconsidering before you launch: the flat £10 fee

You asked for a flat £10 platform fee per transaction. That's simple to
explain, but it means a £5 or £8 tip would net the owner *nothing or less
than nothing* — the fee would need to come from somewhere. Before this goes
live, decide one of:

- **A percentage fee** (e.g. 10-15% of the tip) — scales with tip size,
  standard in payments, easy to justify to owners.
- **A flat fee only on payouts**, not per tip — accumulate tips, take £10
  once when you pay the batch out (this is what the schema actually
  supports today: `Client.platformFeePence` is per-transaction, but you
  could move it to `ClientPayout` with one line of code).
  A **minimum tip amount** (e.g. £5) so the fee never dominates.

The schema (`prisma/schema.prisma`) is intentionally set up so any of these
are a small change — `platformFeePence` isn't hard-coded, it's a
per-client field, so you could even run a different model per client (e.g.
percentage for small B&Bs, flat fee for high-volume hotels).

## Data model

See `prisma/schema.prisma` for the full picture. The core entities:

- **User** — your team, with a `role` (Admin / Finance / Marketing / Support)
- **Lead** — a prospect hotel/Airbnb moving through your sales pipeline
- **Client** — a live property: Stripe Connect account, QR slug, fee rate
- **Transaction** — one guest tip: gross amount, fee, net, Stripe IDs
- **ClientPayout** — a batch of tips paid out to one owner's bank account
- **PlatformLedgerEntry** — your own business bank account: fee revenue in,
  Stripe payouts in, expenses out
- **DailyTraffic** — website visitor + funnel numbers for `/admin/analytics`

Money is always stored as an integer in pence, never a float — this avoids
the classic "£19.999999999998" rounding bugs.

## What's mocked vs. what's real

**Real:** the database, the CRM pipeline logic, the client/lead lifecycle,
the QR code generation, the guest tip form and its transaction record, the
whole admin UI reading live data.

**Mocked (clearly marked in the code with comments):**
- **Stripe** — no real Stripe account is wired up. `stripeAccountId`,
  `stripePaymentIntentId`, `stripeTransferId` are fake-but-realistic IDs.
  Swapping in real Stripe means: Stripe Connect Express onboarding links
  for `convertLeadToClient`, a real `PaymentIntent` in `submitTip`, and a
  webhook handler for `account.updated` / `payout.paid` instead of the
  "Simulate..." buttons in the admin UI.
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

1. Decide the fee model (see the callout above) — this affects onboarding
   copy and your pitch to owners.
2. Wire up real Stripe Connect (Express accounts) for `convertLeadToClient`
   and a real webhook to replace the "Simulate..." buttons.
3. Add authentication so `/admin` isn't wide open.
4. Move off SQLite to a hosted Postgres database.
5. Put a real analytics snippet on your marketing site feeding `DailyTraffic`.
6. Print your first real QR code (from any client's detail page) and test
   the whole loop with a real card in Stripe test mode.
