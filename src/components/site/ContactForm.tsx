"use client";

import { useState } from "react";
import { he } from "@/i18n/he";
import { SITE } from "@/lib/site.config";

const s = he.site;

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition-colors focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(s.contactErrorRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(s.contactErrorEmail);
      return;
    }
    setError(null);
    const subject = `${s.brand} — ${name.trim()}`;
    const body = `${message.trim()}\n\n— ${name.trim()} (${email.trim()})`;
    window.location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="c-name" className="mb-1 block text-sm font-medium text-stone-700">
          {s.contactName}
        </label>
        <input
          id="c-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={s.contactNamePlaceholder}
          className={inputCls}
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="c-email" className="mb-1 block text-sm font-medium text-stone-700">
          {s.contactEmail}
        </label>
        <input
          id="c-email"
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
        <label htmlFor="c-msg" className="mb-1 block text-sm font-medium text-stone-700">
          {s.contactMessage}
        </label>
        <textarea
          id="c-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={s.contactMessagePlaceholder}
          rows={5}
          className={`${inputCls} resize-y`}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="mt-1 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
      >
        {s.contactSubmit}
      </button>
    </form>
  );
}
