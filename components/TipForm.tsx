"use client";

import { useActionState, useState } from "react";
import { submitTip } from "@/app/tip/[slug]/actions";

const PRESETS = [5, 10, 20, 50];

type State = { ok: boolean; error?: string; amountPence?: number } | null;

export function TipForm({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [amount, setAmount] = useState(10);
  const boundAction = submitTip.bind(null, clientId);
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    return boundAction(formData);
  }, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-brand-lime p-8 text-center text-brand-black">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-xl font-black">Thank you!</h2>
        <p className="mt-1 text-sm">
          Your £{((state.amountPence ?? 0) / 100).toFixed(2)} tip has been sent to the team at {clientName}.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-cream/60">Choose an amount</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setAmount(p)}
              className={`rounded-lg py-2.5 text-sm font-bold ${
                amount === p ? "bg-brand-lime text-brand-black" : "bg-white/10 text-brand-cream hover:bg-white/20"
              }`}
            >
              £{p}
            </button>
          ))}
        </div>
        <input
          type="number"
          name="amount"
          min={1}
          step="0.5"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2.5 text-center text-lg font-bold text-brand-cream outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-cream/60">
          Your name (optional)
        </label>
        <input
          name="guestName"
          placeholder="Anonymous"
          className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-brand-cream outline-none placeholder:text-brand-cream/30"
        />
      </div>

      {state?.error && <p className="text-sm font-medium text-red-400">{state.error}</p>}

      <button
        disabled={pending}
        className="w-full rounded-lg bg-brand-lime py-3 text-sm font-black text-brand-black disabled:opacity-60"
      >
        {pending ? "Processing…" : `Tip £${amount.toFixed(2)} with card`}
      </button>
      <p className="text-center text-[11px] text-brand-cream/40">
        Payments processed securely by Stripe. Demo mode — no real card is charged.
      </p>
    </form>
  );
}
