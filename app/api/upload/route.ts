import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Check admin password
  const authHeader = request.headers.get("authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only .docx and .pdf allowed" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`documents/${file.name}`, file, {
      access: "public",
    });

    // Store document metadata
    const metadata = {
      id: crypto.randomUUID(),
      name: file.name,
      url: blob.url,
      uploadedAt: new Date().toISOString(),
      status: "pending" as const,
      type: file.type.includes("pdf") ? "pdf" : "docx",
    };

    // Get existing documents list
    let documents: typeof metadata[] = [];
    try {
      const existingDocsRes = await fetch(
        `${process.env.BLOB_STORE_URL || ""}/documents.json`
      );
      if (existingDocsRes.ok) {
        documents = await existingDocsRes.json();
      }
    } catch {
      // No existing documents file, start fresh
    }

    documents.push(metadata);

    // Save updated documents list
    await put("documents.json", JSON.stringify(documents, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ success: true, document: metadata });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
