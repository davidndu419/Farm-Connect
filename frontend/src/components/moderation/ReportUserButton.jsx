import { REPORT_CATEGORIES } from "@farm-connect/contracts";
import { useState } from "react";
import { submitUserReport } from "../../api/adminApi.js";

const labels = {
  spam: "Spam or unwanted messages",
  scam: "Scam or suspicious activity",
  harassment: "Harassment or threats",
  prohibited_content: "Prohibited content",
  impersonation: "Impersonation",
  other: "Other"
};

export function ReportUserButton({ userId, userName, conversationId, className = "" }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("scam");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await submitUserReport({
        reportedUserId: userId,
        category,
        details,
        ...(conversationId ? { conversationId } : {})
      });
      setNotice("Report sent to the admin team.");
      setDetails("");
      setOpen(false);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={className}>
        <button className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50" onClick={() => setOpen(true)} type="button">
          <span aria-hidden="true">⚑</span> Report user
        </button>
        {notice ? <p className="mt-2 text-xs font-bold text-leaf" role="status">{notice}</p> : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#102d21]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="report-user-title">
          <form className="w-full max-w-lg rounded-3xl bg-white p-6 text-ink shadow-card sm:p-8" onSubmit={submit}>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-red-700">Safety report</p>
                <h2 className="mt-1 font-display text-2xl font-bold" id="report-user-title">Report {userName || "this user"}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">Reports are private. An administrator will review the account and any linked conversation.</p>
              </div>
              <button className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/5 text-xl" onClick={() => setOpen(false)} type="button" aria-label="Close">×</button>
            </div>

            <label className="mt-6 block text-sm font-bold">
              What happened?
              <select className="form-input mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>
                {REPORT_CATEGORIES.map((value) => <option value={value} key={value}>{labels[value]}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold">
              Details
              <textarea className="form-input mt-2 min-h-32 resize-y" maxLength="1000" minLength="10" required placeholder="Explain what happened so the admin can review it fairly." value={details} onChange={(event) => setDetails(event.target.value)} />
            </label>
            <p className="mt-1 text-right text-xs text-ink/45">{details.length}/1000</p>
            {error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-bold" onClick={() => setOpen(false)} type="button">Cancel</button>
              <button className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50" disabled={submitting || details.trim().length < 10} type="submit">
                {submitting ? "Sending…" : "Send report"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
