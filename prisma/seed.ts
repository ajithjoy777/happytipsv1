import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { computeSubscriptionFeePence, computeTipCheckout } from "../lib/billing";

const prisma = new PrismaClient();

// Deterministic pseudo-random so re-running the seed gives the same demo data.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]) => arr[randInt(0, arr.length - 1)];
const id = (prefix: string) =>
  `${prefix}_${Array.from({ length: 14 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[randInt(0, 35)]).join("")}`;

async function main() {
  console.log("Clearing existing data...");
  await prisma.transaction.deleteMany();
  await prisma.clientPayout.deleteMany();
  await prisma.subscriptionInvoice.deleteMany();
  await prisma.platformLedgerEntry.deleteMany();
  await prisma.dailyTraffic.deleteMany();
  await prisma.client.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating team...");
  const [admin, marketer, , support] = await Promise.all([
    prisma.user.create({
      data: { name: "Ajith Joy", email: "ajithjoy777@gmail.com", role: "ADMIN" },
    }),
    prisma.user.create({
      data: { name: "Priya Nair", email: "priya@happytips.app", role: "MARKETING" },
    }),
    prisma.user.create({
      data: { name: "Tom Reilly", email: "tom@happytips.app", role: "FINANCE" },
    }),
    prisma.user.create({
      data: { name: "Sana Malik", email: "sana@happytips.app", role: "SUPPORT" },
    }),
  ]);

  console.log("Creating leads (CRM pipeline)...");
  const leadDefs = [
    { businessName: "The Riverside Inn", propertyType: "HOTEL", contactName: "Helen Brooks", email: "helen@riversideinn.co.uk", stage: "NEW", source: "WEBSITE_FORM", assignedTo: marketer, days: 1, roomCount: 12 },
    { businessName: "Coastal Breeze Airbnb", propertyType: "AIRBNB", contactName: "Marco Reyes", email: "marco@coastalbreeze.example", stage: "NEW", source: "WEBSITE_FORM", assignedTo: marketer, days: 2, roomCount: 1 },
    { businessName: "Maple House B&B", propertyType: "HOTEL", contactName: "Jean Carter", email: "jean@maplehouse.example", stage: "CONTACTED", source: "COLD_OUTREACH", assignedTo: admin, days: 6, roomCount: 4, notes: "Left a voicemail, following up Thursday." },
    { businessName: "Skyline Suites", propertyType: "HOTEL", contactName: "David Osei", email: "david@skylinesuites.example", stage: "CONTACTED", source: "REFERRAL", assignedTo: admin, days: 8, roomCount: 30, notes: "Referred by Lensfield Hotel's GM. Very interested." },
    { businessName: "Willow Cottage", propertyType: "AIRBNB", contactName: "Freya Lindqvist", email: "freya@willowcottage.example", stage: "ONBOARDING", source: "WEBSITE_FORM", assignedTo: support, days: 12, roomCount: 1, notes: "Signed agreement. Waiting on Stripe Connect KYC documents." },
    { businessName: "Harbor View Hotel", propertyType: "HOTEL", contactName: "Michael Chen", email: "michael@harborview.example", stage: "ONBOARDING", source: "EVENT", assignedTo: support, days: 15, roomCount: 25, notes: "QR table cards ordered, Stripe onboarding link sent." },
    { businessName: "Old Town Loft", propertyType: "AIRBNB", contactName: "Ines Almeida", email: "ines@oldtownloft.example", stage: "LOST", source: "COLD_OUTREACH", assignedTo: marketer, days: 20, roomCount: 1, notes: "Went with a competitor's free tip jar app." },
  ] as const;

  for (const l of leadDefs) {
    await prisma.lead.create({
      data: {
        businessName: l.businessName,
        propertyType: l.propertyType,
        contactName: l.contactName,
        email: l.email,
        phone: `+44 7${randInt(100000000, 999999999)}`,
        stage: l.stage,
        source: l.source,
        roomCount: l.roomCount,
        assignedToId: l.assignedTo.id,
        notes: "notes" in l ? l.notes : null,
        createdAt: new Date(Date.now() - l.days * 86400000),
      },
    });
  }

  console.log("Creating active clients (converted leads + direct signups)...");
  const clientDefs = [
    { name: "Lensfield Hotel", slug: "lensfield-hotel", propertyType: "HOTEL", roomCount: 40, staffCount: 18, joinedDays: 90, stripeStatus: "ACTIVE", billingStatus: "ACTIVE", contactName: "Grace Fielding", email: "gm@lensfieldhotel.example" },
    { name: "Birchwood Airbnb", slug: "birchwood-airbnb", propertyType: "AIRBNB", roomCount: 1, staffCount: 2, joinedDays: 60, stripeStatus: "ACTIVE", billingStatus: "PAST_DUE", contactName: "Sam Whitfield", email: "sam@birchwoodstay.example", note: "Card on file was declined for this month's £10 subscription — tipping page is offline until it's paid." },
    { name: "The Grand Oak Hotel", slug: "grand-oak-hotel", propertyType: "HOTEL", roomCount: 60, staffCount: 34, joinedDays: 45, stripeStatus: "ACTIVE", billingStatus: "ACTIVE", contactName: "Priya Deshmukh", email: "ops@grandoakhotel.example" },
    { name: "Meadow Barn Guesthouse", slug: "meadow-barn-airbnb", propertyType: "AIRBNB", roomCount: 3, staffCount: 2, joinedDays: 22, stripeStatus: "ACTIVE", billingStatus: "ACTIVE", contactName: "Liam O'Connor", email: "liam@meadowbarn.example" },
    { name: "Portside Hotel", slug: "portside-hotel", propertyType: "HOTEL", roomCount: 45, staffCount: 26, joinedDays: 10, stripeStatus: "RESTRICTED", billingStatus: "ACTIVE", contactName: "Nadia Farouk", email: "finance@portsidehotel.example", note: "Stripe flagged an ID document mismatch during KYC — needs the owner to re-upload." },
  ] as const;

  const clients = [];
  for (const c of clientDefs) {
    const subscriptionFeePence = computeSubscriptionFeePence(c.roomCount);
    const client = await prisma.client.create({
      data: {
        name: c.name,
        slug: c.slug,
        propertyType: c.propertyType,
        contactName: c.contactName,
        email: c.email,
        phone: `+44 7${randInt(100000000, 999999999)}`,
        staffCount: c.staffCount,
        roomCount: c.roomCount,
        subscriptionFeePence,
        billingStatus: c.billingStatus,
        transactionFeePercent: 0, // off for every early customer — see lib/billing.ts
        stripeAccountId: id("acct"),
        stripeStatus: c.stripeStatus,
        joinedAt: new Date(Date.now() - c.joinedDays * 86400000),
      },
    });
    clients.push({ ...client, joinedDays: c.joinedDays });
  }

  console.log("Billing each client's monthly subscription...");
  for (const client of clients) {
    const months = Math.max(1, Math.floor(client.joinedDays / 30));
    for (let m = 0; m < months; m++) {
      const periodStart = new Date(Date.now() - (m + 1) * 30 * 86400000);
      const periodEnd = new Date(Date.now() - m * 30 * 86400000);
      const isLatest = m === 0;
      const failed = isLatest && client.billingStatus === "PAST_DUE";
      await prisma.subscriptionInvoice.create({
        data: {
          clientId: client.id,
          amountPence: client.subscriptionFeePence,
          periodStart,
          periodEnd,
          status: failed ? "FAILED" : "PAID",
          stripeInvoiceId: id("in"),
          createdAt: periodEnd,
        },
      });
      if (!failed) {
        await prisma.platformLedgerEntry.create({
          data: {
            type: "SUBSCRIPTION_REVENUE",
            amountPence: client.subscriptionFeePence,
            description: `Monthly subscription — ${client.name} (${client.roomCount} room${client.roomCount > 1 ? "s" : ""})`,
            createdAt: periodEnd,
          },
        });
      }
    }
  }

  console.log("Generating tip transactions + payouts per client (100% passthrough to owner)...");
  for (const client of clients) {
    if (client.stripeStatus !== "ACTIVE" || client.billingStatus !== "ACTIVE") continue; // offline until Stripe + billing are both sorted

    const txCount = randInt(30, 90);
    const transactions = [];
    for (let i = 0; i < txCount; i++) {
      const daysAgo = randInt(0, Math.min(client.joinedDays, 60));
      const tipAmountPence = randInt(5, 40) * 100; // £5–£40 tips
      const checkout = computeTipCheckout(tipAmountPence, client.transactionFeePercent);
      transactions.push({
        clientId: client.id,
        guestName: pick(["A guest", "Room 204", "J. Whitmore", "K. Adeyemi", "Anonymous", "M. Santos", "Front desk visitor", "L. Bergström"]),
        tipAmountPence: checkout.tipAmountPence,
        stripeFeePence: checkout.stripeFeePence,
        platformFeePence: checkout.platformFeePence,
        totalChargedPence: checkout.totalChargedPence,
        netAmountPence: checkout.tipAmountPence, // owner always gets the full tip
        stripePaymentIntentId: id("pi"),
        status: "SUCCEEDED" as const,
        createdAt: new Date(Date.now() - daysAgo * 86400000 - randInt(0, 86399) * 1000),
      });
    }
    // A realistic edge case
    const refundCheckout = computeTipCheckout(3000, client.transactionFeePercent);
    transactions.push({
      clientId: client.id,
      guestName: "Refunded — duplicate charge",
      tipAmountPence: refundCheckout.tipAmountPence,
      stripeFeePence: refundCheckout.stripeFeePence,
      platformFeePence: refundCheckout.platformFeePence,
      totalChargedPence: refundCheckout.totalChargedPence,
      netAmountPence: refundCheckout.tipAmountPence,
      stripePaymentIntentId: id("pi"),
      status: "REFUNDED" as const,
      createdAt: new Date(Date.now() - randInt(1, 10) * 86400000),
    });

    await prisma.transaction.createMany({ data: transactions });

    // Group succeeded, unrefunded transactions into weekly payout batches
    const succeeded = await prisma.transaction.findMany({
      where: { clientId: client.id, status: "SUCCEEDED", payoutId: null },
      orderBy: { createdAt: "asc" },
    });

    const weekMs = 7 * 86400000;
    const batches = new Map<number, typeof succeeded>();
    for (const t of succeeded) {
      const bucket = Math.floor(t.createdAt.getTime() / weekMs);
      if (!batches.has(bucket)) batches.set(bucket, []);
      batches.get(bucket)!.push(t);
    }
    const sortedBuckets = [...batches.keys()].sort((a, b) => a - b);
    // Leave the most recent bucket un-paid-out yet, to show a "pending" state
    const bucketsToPay = sortedBuckets.slice(0, -1);
    for (const bucket of bucketsToPay) {
      const txs = batches.get(bucket)!;
      const amount = txs.reduce((sum, t) => sum + t.netAmountPence, 0);
      await prisma.clientPayout.create({
        data: {
          clientId: client.id,
          amountPence: amount,
          stripeTransferId: id("tr"),
          status: "PAID",
          createdAt: new Date((bucket + 1) * weekMs),
          transactions: { connect: txs.map((t) => ({ id: t.id })) },
        },
      });
    }
  }

  console.log("Recording Stripe payouts of our subscription revenue into the business bank account...");
  const revenueEntries = await prisma.platformLedgerEntry.findMany({
    where: { type: { in: ["SUBSCRIPTION_REVENUE", "FEE_REVENUE"] } },
    orderBy: { createdAt: "asc" },
  });
  const biweekMs = 14 * 86400000;
  const revenueBuckets = new Map<number, number>();
  for (const e of revenueEntries) {
    const bucket = Math.floor(e.createdAt.getTime() / biweekMs);
    revenueBuckets.set(bucket, (revenueBuckets.get(bucket) ?? 0) + e.amountPence);
  }
  const sortedRevenueBuckets = [...revenueBuckets.keys()].sort((a, b) => a - b).slice(0, -1); // leave latest un-swept
  for (const bucket of sortedRevenueBuckets) {
    await prisma.platformLedgerEntry.create({
      data: {
        type: "STRIPE_PAYOUT_IN",
        amountPence: revenueBuckets.get(bucket)!,
        description: "Stripe payout of accumulated platform revenue to business bank account",
        createdAt: new Date((bucket + 1) * biweekMs),
      },
    });
  }

  await prisma.platformLedgerEntry.createMany({
    data: [
      { type: "CASH_OUT", amountPence: -4900, description: "Vercel Pro hosting subscription", createdAt: new Date(Date.now() - 20 * 86400000) },
      { type: "CASH_OUT", amountPence: -15000, description: "QR table cards + stands — Harbor View Hotel onboarding", createdAt: new Date(Date.now() - 14 * 86400000) },
      { type: "CASH_OUT", amountPence: -8000, description: "Google Ads — lead generation campaign", createdAt: new Date(Date.now() - 5 * 86400000) },
    ],
  });

  console.log("Linking converted leads to their clients...");
  const lensfieldLead = await prisma.lead.create({
    data: {
      businessName: "Lensfield Hotel",
      propertyType: "HOTEL",
      contactName: "Grace Fielding",
      email: "gm@lensfieldhotel.example",
      phone: "+44 7700 900001",
      stage: "ACTIVE",
      source: "WEBSITE_FORM",
      roomCount: 40,
      assignedToId: admin.id,
      createdAt: new Date(Date.now() - 95 * 86400000),
      notes: "First customer! Converted after a walk-in demo at the front desk.",
    },
  });
  await prisma.client.update({
    where: { slug: "lensfield-hotel" },
    data: { leadId: lensfieldLead.id },
  });

  console.log("Seeding 30 days of website traffic...");
  const trafficRows = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const growth = 1 + (29 - i) * 0.03; // gentle upward trend
    const visitors = Math.round(randInt(80, 160) * growth);
    const leadFormViews = Math.round(visitors * (0.12 + rand() * 0.05));
    const leadsCaptured = Math.round(leadFormViews * (0.2 + rand() * 0.15));
    const tipPageViews = Math.round(randInt(150, 500) * growth);
    const tipsCompleted = Math.round(tipPageViews * (0.35 + rand() * 0.1));
    trafficRows.push({ date, visitors, leadFormViews, leadsCaptured, tipPageViews, tipsCompleted });
  }
  await prisma.dailyTraffic.createMany({ data: trafficRows });

  console.log("Done seeding.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
