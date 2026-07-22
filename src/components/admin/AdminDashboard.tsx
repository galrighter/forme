"use client";

import { useCallback, useEffect, useState } from "react";
import { he } from "@/i18n/he";
import type { Inquiry, InquiryStatus } from "@/lib/db/inquiries";

const s = he.site;

const STATUSES: InquiryStatus[] = ["new", "contacted", "closed"];
const statusLabel: Record<InquiryStatus, string> = {
  new: s.adminStatusNew,
  contacted: s.adminStatusContacted,
  closed: s.adminStatusClosed,
};
const statusColor: Record<InquiryStatus, string> = {
  new: "bg-[#c9a227]/20 text-[#8a6d17]",
  contacted: "bg-blue-100 text-blue-700",
  closed: "bg-stone-200 text-stone-500",
};

type Auth = "checking" | "in" | "out" | "disabled";

export default function AdminDashboard() {
  const [auth, setAuth] = useState<Auth>("checking");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState<InquiryStatus | "">("");
  const [token, setToken] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async (status: InquiryStatus | "") => {
    const qs = status ? `?status=${status}` : "";
    const res = await fetch(`/api/inquiries${qs}`);
    if (res.status === 401) {
      setAuth("out");
      return;
    }
    if (res.status === 503) {
      setAuth("disabled");
      return;
    }
    if (!res.ok) {
      setListError(s.adminLoadError);
      return;
    }
    const body = (await res.json()) as { inquiries: Inquiry[] };
    setInquiries(body.inquiries);
    setListError(null);
    setAuth("in");
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.status === 503) {
      setAuth("disabled");
      return;
    }
    if (!res.ok) {
      setLoginError(s.adminBadToken);
      return;
    }
    setToken("");
    await load(filter);
  }

  async function onLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setInquiries([]);
    setAuth("out");
  }

  async function changeStatus(id: string, status: InquiryStatus) {
    const res = await fetch(`/api/inquiries/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setInquiries((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q)),
      );
    }
  }

  function applyFilter(f: InquiryStatus | "") {
    setFilter(f);
    void load(f);
  }

  if (auth === "checking") {
    return <p className="text-stone-500">{he.loading}</p>;
  }

  if (auth === "disabled") {
    return (
      <p className="rounded-xl border border-stone-200 bg-stone-100 p-4 text-sm text-stone-600">
        {s.adminDisabled}
      </p>
    );
  }

  if (auth === "out") {
    return (
      <form onSubmit={onLogin} className="mx-auto mt-8 flex max-w-sm flex-col gap-4">
        <h2 className="text-lg font-semibold text-stone-900">{s.adminLoginTitle}</h2>
        <div>
          <label htmlFor="admin-token" className="mb-1 block text-sm font-medium text-stone-700">
            {s.adminTokenLabel}
          </label>
          <input
            id="admin-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"
            dir="ltr"
            autoComplete="current-password"
          />
        </div>
        {loginError && <p className="text-sm text-red-600">{loginError}</p>}
        <button
          type="submit"
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 hover:bg-stone-700"
        >
          {s.adminLogin}
        </button>
      </form>
    );
  }

  // auth === "in"
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["", ...STATUSES] as const).map((f) => (
            <button
              key={f || "all"}
              onClick={() => applyFilter(f)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                filter === f
                  ? "bg-stone-900 text-stone-50"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {f === "" ? s.adminFilterAll : statusLabel[f]}
            </button>
          ))}
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-stone-500 hover:text-stone-900"
        >
          {s.adminLogout}
        </button>
      </div>

      {listError && <p className="mb-4 text-sm text-red-600">{listError}</p>}

      {inquiries.length === 0 ? (
        <p className="text-stone-500">{s.adminEmpty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-right text-xs text-stone-400">
                <th className="py-2 pl-3 font-medium">{s.adminColDate}</th>
                <th className="py-2 pl-3 font-medium">{s.adminColKind}</th>
                <th className="py-2 pl-3 font-medium">{s.adminColContact}</th>
                <th className="py-2 pl-3 font-medium">{s.adminColProduct}</th>
                <th className="py-2 pl-3 font-medium">{s.adminColMessage}</th>
                <th className="py-2 pl-3 font-medium">{s.adminColStatus}</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((q) => (
                <tr key={q.id} className="border-b border-stone-100 align-top">
                  <td className="py-3 pl-3 whitespace-nowrap text-stone-500">
                    {new Date(q.created_at).toLocaleDateString("he-IL")}
                  </td>
                  <td className="py-3 pl-3 whitespace-nowrap text-stone-600">
                    {q.kind === "order" ? s.adminKindOrder : s.adminKindContact}
                  </td>
                  <td className="py-3 pl-3">
                    <div className="font-medium text-stone-900">{q.name}</div>
                    <a href={`mailto:${q.email}`} dir="ltr" className="block text-stone-500 hover:underline">
                      {q.email}
                    </a>
                    {q.phone && <div dir="ltr" className="text-stone-500">{q.phone}</div>}
                  </td>
                  <td className="py-3 pl-3 whitespace-nowrap text-stone-600">
                    {q.product_type === "bracelet"
                      ? he.bracelet
                      : q.product_type === "ring"
                        ? he.ring
                        : "—"}
                  </td>
                  <td className="py-3 pl-3 text-stone-700">
                    <div className="max-w-xs whitespace-pre-wrap">{q.message}</div>
                  </td>
                  <td className="py-3 pl-3">
                    <select
                      value={q.status}
                      onChange={(e) => changeStatus(q.id, e.target.value as InquiryStatus)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[q.status]}`}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {statusLabel[st]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
