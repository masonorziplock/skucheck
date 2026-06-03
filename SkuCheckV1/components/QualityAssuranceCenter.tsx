"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";

type QACheck = {
  label: string;
  passed: boolean;
  detail: string;
};

type QAPayload = {
  checkedAt: string;
  score: number;
  passed: number;
  total: number;
  checks: QACheck[];
  recommendation: string;
};

type Props = {
  onRunSearch: (query: string) => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
};

const knownTests = [
  { query: "HF4198-001", goal: "SKU resolves and store lookup completes." },
  { query: "hf4198001", goal: "Normalizer repairs Nike/Jordan style code." },
  { query: "Jordan 4", goal: "Keyword resolver returns product intelligence." },
  { query: "ABC123XYZ", goal: "Empty state appears without calling it sold out." },
];

export default function QualityAssuranceCenter({ onRunSearch, onOpenAdmin, onOpenSettings }: Props) {
  const [payload, setPayload] = useState<QAPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runQA() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/qa", { cache: "no-store" });
      if (!response.ok) throw new Error(`QA check failed: ${response.status}`);
      setPayload(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "QA check failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runQA();
  }, []);

  const failed = useMemo(() => payload?.checks.filter((check) => !check.passed) || [], [payload]);

  return (
    <div className="qa-center-screen">
      <div className="qa-hero-card">
        <div className="qa-hero-copy">
          <span className="eyebrow"><ClipboardCheck size={15} /> Quality Assurance Center</span>
          <h2>Keep the app reliable before adding more features.</h2>
          <p>Run build-readiness checks, verify critical app files, then use the guided searches to confirm SKU, keyword, image, and empty-state behavior.</p>
        </div>
        <div className="qa-score-card">
          <strong>{payload ? `${payload.score}%` : "—"}</strong>
          <span>{payload ? `${payload.passed}/${payload.total} checks passed` : "Not checked yet"}</span>
          <button onClick={() => void runQA()} disabled={loading}>{loading ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />} {loading ? "Checking…" : "Run QA"}</button>
        </div>
      </div>

      {error && <div className="qa-warning"><AlertTriangle size={17} /> {error}</div>}

      <div className="qa-grid-two">
        <div className="qa-panel">
          <div className="recent-title"><ShieldCheck size={16} /> Build Readiness</div>
          {payload?.checks.map((item) => (
            <div className="qa-check-row" key={item.label}>
              {item.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            </div>
          )) || <p className="quiet">Running QA checks…</p>}
        </div>

        <div className="qa-panel">
          <div className="recent-title"><Search size={16} /> Guided Search Tests</div>
          {knownTests.map((test) => (
            <button className="qa-test-button" key={test.query} onClick={() => onRunSearch(test.query)}>
              <strong>{test.query}</strong>
              <span>{test.goal}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="qa-panel">
        <div className="recent-title"><AlertTriangle size={16} /> Failure Prevention Rules</div>
        <div className="qa-rules-grid">
          <div><strong>Sold Out</strong><span>Use only when a store confirms product exists and inventory is unavailable.</span></div>
          <div><strong>Lookup Unavailable</strong><span>Use when a store timeout, block, API change, or network failure prevents a reliable answer.</span></div>
          <div><strong>Inventory Hidden</strong><span>Use when product exists but sizes or exact stock are not publicly exposed.</span></div>
          <div><strong>No Match</strong><span>Use only when the store search completes and does not find the product.</span></div>
        </div>
      </div>

      <div className="qa-actions-row">
        <button onClick={onOpenAdmin}>Open Store Health Dashboard</button>
        <button onClick={onOpenSettings}>Open Settings</button>
        <button onClick={() => onRunSearch("HF4198-001")}>Run Baseline SKU Search</button>
      </div>

      {failed.length > 0 && <p className="policy-note">Fix failed QA checks before expanding more stores. This prevents the future headaches caused by broken routes, missing assets, or unreliable status labels.</p>}
    </div>
  );
}
