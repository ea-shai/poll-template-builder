import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import staticData from "@/data/questions.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Try to get questions from blob storage first
    const { blobs } = await list({ prefix: "questions-db.json" });

    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    }

    // Fall back to static data
    return NextResponse.json(staticData);
  } catch (error) {
    console.error("Error fetching questions:", error);
    // Fall back to static data on error
    return NextResponse.json(staticData);
  }
}
