import { CheckCircle2, Rocket, ShieldCheck, Smartphone, Store, Users } from "lucide-react";

export default function PrivateBetaGuide() {
  const testerSteps = [
    "Open the Railway link on phone and desktop.",
    "Run one exact SKU search and one keyword search.",
    "Tap a store card and confirm the product/store link opens.",
    "Track one release or product.",
    "Submit feedback from the Beta tab before closing the app.",
  ];

  const adminSteps = [
    "Run Store Check before inviting testers.",
    "Run Production Monitor after test searches.",
    "Confirm Lookup Unavailable is not being counted as Sold Out.",
    "Disable any store that repeatedly times out or returns unclear results.",
    "Export logs after each test session.",
  ];

  return (
    <div className="beta-card">
      <div className="beta-card-title"><Rocket size={18} /> Private Beta Instructions</div>
      <p className="quiet">Use this section before sharing the app. The goal is controlled testing with clear expectations, not public launch volume.</p>
      <div className="beta-rules">
        <div><Users size={16} /><span><strong>Tester flow</strong><small>{testerSteps.join(" • ")}</small></span></div>
        <div><ShieldCheck size={16} /><span><strong>Admin flow</strong><small>{adminSteps.join(" • ")}</small></span></div>
        <div><Smartphone size={16} /><span><strong>Mobile proof</strong><small>Test once on Wi-Fi and once on cellular data so Railway hosting, PWA behavior, and public links are confirmed.</small></span></div>
        <div><Store size={16} /><span><strong>Store rule</strong><small>Healthy stores can stay enabled. Repeated timeouts should remain enabled only if their status clearly shows Lookup Unavailable.</small></span></div>
        <div><CheckCircle2 size={16} /><span><strong>Launch rule</strong><small>Do not scale store count until beta searches, tracking, release cards, and feedback collection all pass on phone and PC.</small></span></div>
      </div>
    </div>
  );
}
