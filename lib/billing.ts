// The one pricing rule for the monthly platform subscription:
// £10 per room, capped at £50/month. A single Airbnb unit = £10/mo;
// anything with 5+ rooms pays the £50/mo cap.
const PER_ROOM_FEE_PENCE = 1000;
const SUBSCRIPTION_CAP_PENCE = 5000;

export function computeSubscriptionFeePence(roomCount: number) {
  return Math.min(PER_ROOM_FEE_PENCE * Math.max(roomCount, 1), SUBSCRIPTION_CAP_PENCE);
}

// Approximate UK Stripe rate for a UK-issued card: 1.5% + 20p. The real
// number depends on card type/region — swap this for Stripe's actual fee
// once a live account is connected (it's returned on the balance transaction).
export function computeStripeFeePence(chargeBasisPence: number) {
  return Math.round(chargeBasisPence * 0.015) + 20;
}

// The guest always pays the full tip PLUS any fees on top — the property
// keeps 100% of the tip they chose. transactionFeePercent is 0 for every
// client today (see Client.transactionFeePercent); flip it on later to
// start charging guests your cut instead of the property.
export function computeTipCheckout(tipAmountPence: number, transactionFeePercent: number) {
  const platformFeePence =
    transactionFeePercent > 0 ? Math.round((tipAmountPence * transactionFeePercent) / 100) : 0;
  const stripeFeePence = computeStripeFeePence(tipAmountPence + platformFeePence);
  const totalChargedPence = tipAmountPence + platformFeePence + stripeFeePence;
  return { tipAmountPence, platformFeePence, stripeFeePence, totalChargedPence };
}
