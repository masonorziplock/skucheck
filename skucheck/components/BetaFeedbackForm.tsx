"use client";

import { FormEvent, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

type Props = {
  currentQuery?: string;
  resolvedSku?: string;
  onSubmitted?: () => void;
};

export default function BetaFeedbackForm({ currentQuery = "", resolvedSku = "", onSubmitted }: Props) {
  const [worked, setWorked] = useState("Yes");
  const [sizesAccurate, setSizesAccurate] = useState("Unknown");
  const [storeLinksWorked, setStoreLinksWorked] = useState("Yes");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/admin/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentQuery, resolvedSku, worked, sizesAccurate, storeLinksWorked, notes }),
      });
      setSubmitted(true);
      setNotes("");
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="beta-card beta-feedback-form" onSubmit={submit}>
      <div className="beta-card-title"><MessageSquare size={18} /> Beta Feedback</div>
      <p className="quiet">Use this after test searches to capture what worked and what needs review.</p>
      <div className="feedback-grid">
        <label>Search worked?<select value={worked} onChange={(e) => setWorked(e.target.value)}><option>Yes</option><option>No</option><option>Partially</option></select></label>
        <label>Sizes accurate?<select value={sizesAccurate} onChange={(e) => setSizesAccurate(e.target.value)}><option>Unknown</option><option>Yes</option><option>No</option><option>Hidden by store</option></select></label>
        <label>Store links opened?<select value={storeLinksWorked} onChange={(e) => setStoreLinksWorked(e.target.value)}><option>Yes</option><option>No</option><option>Some</option></select></label>
      </div>
      <label className="feedback-notes">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Example: APB had product page but sizes hidden, Kith link opened search page only." /></label>
      <button type="submit" disabled={submitting}><Send size={15} /> {submitting ? "Saving…" : "Save Feedback"}</button>
      {submitted && <p className="success-note">Feedback saved for this beta session.</p>}
    </form>
  );
}
