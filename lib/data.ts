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
    allTimeGross,
    allTimeFee,
    monthGross,
    monthFee,
    activeClients,
    openLeads,
    pendingPayoutAmount,
    recentTransactions,
    recentLeads,
    traffic,
  ] = await Promise.all([
    prisma.transaction.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountPence: true } }),
    prisma.transaction.aggregate({ where: { status: "SUCCEEDED" }, _sum: { platformFeePence: true } }),
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: monthStart } },
      _sum: { amountPence: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: monthStart } },
      _sum: { platformFeePence: true },
    }),
    prisma.client.count({ where: { stripeStatus: "ACTIVE" } }),
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
    allTimeGrossPence: allTimeGross._sum.amountPence ?? 0,
    allTimeFeePence: allTimeFee._sum.platformFeePence ?? 0,
    monthGrossPence: monthGross._sum.amountPence ?? 0,
    monthFeePence: monthFee._sum.platformFeePence ?? 0,
    activeClients,
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
      lead: true,
    },
  });
}

export async function getClientTotals(clientId: string) {
  const [gross, fee, net, txCount] = await Promise.all([
    prisma.transaction.aggregate({ where: { clientId, status: "SUCCEEDED" }, _sum: { amountPence: true } }),
    prisma.transaction.aggregate({ where: { clientId, status: "SUCCEEDED" }, _sum: { platformFeePence: true } }),
    prisma.transaction.aggregate({ where: { clientId, status: "SUCCEEDED" }, _sum: { netAmountPence: true } }),
    prisma.transaction.count({ where: { clientId, status: "SUCCEEDED" } }),
  ]);
  return {
    grossPence: gross._sum.amountPence ?? 0,
    feePence: fee._sum.platformFeePence ?? 0,
    netPence: net._sum.netAmountPence ?? 0,
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
  const [ledger, clientPayouts, balance] = await Promise.all([
    prisma.platformLedgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.clientPayout.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, transactions: true },
      take: 100,
    }),
    prisma.platformLedgerEntry.aggregate({ _sum: { amountPence: true } }),
  ]);

  const stripeBalance = await prisma.transaction.aggregate({
    where: { status: "SUCCEEDED", payoutId: null },
    _sum: { platformFeePence: true },
  });

  return {
    ledger,
    clientPayouts,
    bankBalancePence: balance._sum.amountPence ?? 0,
    unswept: ledger
      .filter((l) => l.type === "FEE_REVENUE")
      .reduce((sum, l) => sum + l.amountPence, 0) -
      ledger
        .filter((l) => l.type === "STRIPE_PAYOUT_IN")
        .reduce((sum, l) => sum + l.amountPence, 0),
    pendingFeeInStripe: stripeBalance._sum.platformFeePence ?? 0,
  };
}

export async function getTrafficData() {
  return prisma.dailyTraffic.findMany({ orderBy: { date: "asc" } });
}
