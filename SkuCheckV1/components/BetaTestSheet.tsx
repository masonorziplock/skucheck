import { ClipboardCheck, Search } from "lucide-react";
import { betaTestSkus } from "@/lib/beta-test-skus";

type Props = {
  onRunSearch: (query: string) => void;
};

export default function BetaTestSheet({ onRunSearch }: Props) {
  return (
    <div className="beta-card">
      <div className="beta-card-title"><ClipboardCheck size={18} /> Real-World Test Sheet</div>
      <p className="quiet">Run these before handing the app to anyone else. The goal is clean states, not forcing every query to show stock.</p>
      <div className="beta-test-list">
        {betaTestSkus.map((item) => (
          <button key={item.query} className="beta-test-row" onClick={() => onRunSearch(item.query)}>
            <Search size={15} />
            <span><strong>{item.query}</strong><small>{item.purpose} • Expected: {item.expected}</small></span>
          </button>
        ))}
      </div>
    </div>
  );
}
