import { NextRequest, NextResponse } from "next/server";

type FeedbackItem = {
  id: string;
  currentQuery: string;
  resolvedSku: string;
  worked: string;
  sizesAccurate: string;
  storeLinksWorked: string;
  notes: string;
  createdAt: string;
};

const feedbackLog: FeedbackItem[] = [];

export async function GET() {
  return NextResponse.json({ items: feedbackLog.slice(-100).reverse(), count: feedbackLog.length, generatedAt: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const item: FeedbackItem = {
    id: `${Date.now()}:${Math.random().toString(16).slice(2)}`,
    currentQuery: String(body.currentQuery || ""),
    resolvedSku: String(body.resolvedSku || ""),
    worked: String(body.worked || "Unknown"),
    sizesAccurate: String(body.sizesAccurate || "Unknown"),
    storeLinksWorked: String(body.storeLinksWorked || "Unknown"),
    notes: String(body.notes || "").slice(0, 1500),
    createdAt: new Date().toISOString(),
  };
  feedbackLog.push(item);
  if (feedbackLog.length > 250) feedbackLog.splice(0, feedbackLog.length - 250);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE() {
  feedbackLog.splice(0, feedbackLog.length);
  return NextResponse.json({ ok: true, count: 0, generatedAt: new Date().toISOString() });
}
