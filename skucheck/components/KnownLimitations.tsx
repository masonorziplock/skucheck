import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function KnownLimitations() {
  return (
    <div className="beta-card">
      <div className="beta-card-title"><ShieldCheck size={18} /> Known Limitations</div>
      <div className="beta-rules">
        <div><CheckCircle2 size={16} /><span><strong>Available sizes are shown only when public variant data exposes them.</strong><small>Some stores hide all size availability until a shopper opens the product page.</small></span></div>
        <div><AlertTriangle size={16} /><span><strong>Lookup Unavailable does not mean sold out.</strong><small>It means the store could not be checked, timed out, changed markup, or blocked public lookup.</small></span></div>
        <div><AlertTriangle size={16} /><span><strong>Exact quantity by size is rarely public.</strong><small>The app should show availability confidence, not claim pair counts unless a source clearly exposes it.</small></span></div>
        <div><CheckCircle2 size={16} /><span><strong>Sold Out is reserved for confirmed sold-out signals.</strong><small>Failed adapters and hidden inventory are kept separate to prevent bad stock assumptions.</small></span></div>
      </div>
    </div>
  );
}
