import { prisma } from "@/lib/prisma";

export function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardStats() {
  const monthStart = startOfMonth();

  const [
    allTimeTipVolume,
    monthTipVolume,
    allTimeSubRevenue,
    monthSubRevenue,
    mrrClients,
    activeClients,
    overdueClients,
    openLeads,
    pendingPayoutAmount,
    recentTransactions,
    recentLeads,
    traffic,
  ] = await Promise.all([
    prisma.transaction.aggregate({ where: { status: "SUCCEEDED" }, _sum: { tipAmountPence: true } }),
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: monthStart } },
      _sum: { tipAmountPence: true },
    }),
    prisma.platformLedgerEntry.aggregate({
      where: { type: { in: ["SUBSCRIPTION_REVENUE", "FEE_REVENUE"] } },
      _sum: { amountPence: true },
    }),
    prisma.platformLedgerEntry.aggregate({
      where: { type: { in: ["SUBSCRIPTION_REVENUE", "FEE_REVENUE"] }, createdAt: { gte: monthStart } },
      _sum: { amountPence: true },
    }),
    prisma.client.findMany({ where: { billingStatus: "ACTIVE" }, select: { subscriptionFeePence: true } }),
    prisma.client.count({ where: { stripeStatus: "ACTIVE" } }),
    prisma.client.count({ where: { billingStatus: "PAST_DUE" } }),
    prisma.lead.count({ where: { stage: { notIn: ["ACTIVE", "LOST"] } } }),
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", payoutId: null },
      _sum: { netAmountPence: true },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { client: true },
    }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { assignedTo: true } }),
    prisma.dailyTraffic.findMany({ orderBy: { date: "asc" }, take: 14, skip: 16 }),
  ]);

  return {
    allTimeTipVolumePence: allTimeTipVolume._sum.tipAmountPence ?? 0,
    monthTipVolumePence: monthTipVolume._sum.tipAmountPence ?? 0,
    allTimeSubRevenuePence: allTimeSubRevenue._sum.amountPence ?? 0,
    monthSubRevenuePence: monthSubRevenue._sum.amountPence ?? 0,
    mrrPence: mrrClients.reduce((sum, c) => sum + c.subscriptionFeePence, 0),
    activeClients,
    overdueClients,
    openLeads,
    pendingPayoutPence: pendingPayoutAmount._sum.netAmountPence ?? 0,
    recentTransactions,
    recentLeads,
    traffic,
  };
}

export async function getLeads() {
  return prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: { assignedTo: true, client: true },
  });
}

export async function getUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getClients() {
  return prisma.client.findMany({
    orderBy: { joinedAt: "desc" },
    include: {
      _count: { select: { transactions: true } },
    },
  });
}

export async function getClientBySlug(slug: string) {
  return prisma.client.findUnique({
    where: { slug },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 25 },
      payouts: { orderBy: { createdAt: "desc" }, take: 10 },
      subscriptionInvoices: { orderBy: { createdAt: "desc" }, take: 12 },
      lead: true,
    },
  });
}

export async function getClientTotals(clientId: string) {
  const [tips, net, subRevenue, txCount] = await Promise.all([
    prisma.transaction.aggregate({ where: { clientId, status: "SUCCEEDED" }, _sum: { tipAmountPence: true } }),
    prisma.transaction.aggregate({ where: { clientId, status: "SUCCEEDED" }, _sum: { netAmountPence: true } }),
    prisma.subscriptionInvoice.aggregate({ where: { clientId, status: "PAID" }, _sum: { amountPence: true } }),
    prisma.transaction.count({ where: { clientId, status: "SUCCEEDED" } }),
  ]);
  return {
    tipVolumePence: tips._sum.tipAmountPence ?? 0,
    netPence: net._sum.netAmountPence ?? 0,
    subscriptionPaidPence: subRevenue._sum.amountPence ?? 0,
    txCount,
  };
}

export async function getTransactions() {
  return prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
    take: 200,
  });
}

export async function getPayoutsData() {
  const [ledger, clientPayouts, balance, overdueInvoices] = await Promise.all([
    prisma.platformLedgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.clientPayout.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, transactions: true },
      take: 100,
    }),
    prisma.platformLedgerEntry.aggregate({ _sum: { amountPence: true } }),
    prisma.subscriptionInvoice.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      include: { client: true },
    }),
  ]);

  const revenueIn = ledger
    .filter((l) => l.type === "SUBSCRIPTION_REVENUE" || l.type === "FEE_REVENUE")
    .reduce((sum, l) => sum + l.amountPence, 0);
  const sweptToBank = ledger
    .filter((l) => l.type === "STRIPE_PAYOUT_IN")
    .reduce((sum, l) => sum + l.amountPence, 0);

  return {
    ledger,
    clientPayouts,
    overdueInvoices,
    bankBalancePence: balance._sum.amountPence ?? 0,
    pendingRevenueInStripe: revenueIn - sweptToBank,
  };
}

export async function getTrafficData() {
  return prisma.dailyTraffic.findMany({ orderBy: { date: "asc" } });
}
