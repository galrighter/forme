"use client";

import { useState } from "react";
import { he } from "@/i18n/he";

const s = he.site;

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition-colors focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20";

type Product = "" | "bracelet" | "ring";

export default function OrderForm() {
  const [product, setProduct] = useState<Product>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(s.orderErrorRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(s.orderErrorEmail);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "order",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          productType: product || undefined,
          message: message.trim(),
          company: company || undefined,
        }),
      });
      if (!res.ok) {
        const code = (await res.json().catch(() => null))?.error?.code;
        setError(code === "rate_limited" ? s.orderErrorRate : s.orderErrorGeneric);
        return;
      }
      setDone(true);
    } catch {
      setError(s.orderErrorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#c9a227] text-stone-900">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-stone-900">{s.orderSuccessTitle}</h2>
        <p className="mt-1 text-sm text-stone-600">{s.orderSuccessBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="o-product" className="mb-1 block text-sm font-medium text-stone-700">
          {s.orderProductType}
        </label>
        <select
          id="o-product"
          value={product}
          onChange={(e) => setProduct(e.target.value as Product)}
          className={inputCls}
        >
          <option value="">{s.orderProductAny}</option>
          <option value="bracelet">{he.bracelet}</option>
          <option value="ring">{he.ring}</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="o-name" className="mb-1 block text-sm font-medium text-stone-700">
            {s.orderName}
          </label>
          <input
            id="o-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={s.orderNamePlaceholder}
            className={inputCls}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="o-phone" className="mb-1 block text-sm font-medium text-stone-700">
            {s.orderPhone}
          </label>
          <input
            id="o-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={s.orderPhonePlaceholder}
            className={inputCls}
            dir="ltr"
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <label htmlFor="o-email" className="mb-1 block text-sm font-medium text-stone-700">
          {s.orderEmail}
        </label>
        <input
          id="o-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={s.contactEmailPlaceholder}
          className={inputCls}
          dir="ltr"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="o-msg" className="mb-1 block text-sm font-medium text-stone-700">
          {s.orderMessage}
        </label>
        <textarea
          id="o-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={s.orderMessagePlaceholder}
          rows={5}
          className={`${inputCls} resize-y`}
        />
      </div>

      {/* honeypot — מוסתר מבני אדם */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-60"
      >
        {submitting ? s.orderSubmitting : s.orderSubmit}
      </button>
    </form>
  );
}
