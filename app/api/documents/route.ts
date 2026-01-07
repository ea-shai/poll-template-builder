import { put, list, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export interface DocumentMetadata {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  status: "pending" | "processing" | "done" | "error";
  type: "pdf" | "docx";
  questionCount?: number;
  error?: string;
}

async function getDocuments(): Promise<DocumentMetadata[]> {
  try {
    const { blobs } = await list({ prefix: "documents.json" });
    if (blobs.length === 0) return [];

    const res = await fetch(blobs[0].url);
    if (!res.ok) return [];

    return await res.json();
  } catch {
    return [];
  }
}

async function saveDocuments(documents: DocumentMetadata[]) {
  await put("documents.json", JSON.stringify(documents, null, 2), {
    access: "public",
    addRandomSuffix: false,
  });
}

export async function GET() {
  try {
    const documents = await getDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ documents: [] });
  }
}

export async function DELETE(request: NextRequest) {
  // Check admin password
  const authHeader = request.headers.get("authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const documents = await getDocuments();
    const doc = documents.find((d) => d.id === id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from blob storage
    try {
      await del(doc.url);
    } catch {
      // File might already be deleted
    }

    // Remove from documents list
    const updatedDocs = documents.filter((d) => d.id !== id);
    await saveDocuments(updatedDocs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
