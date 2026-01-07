import { put, list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { DocumentMetadata } from "../documents/route";
import { Question } from "@/lib/types";

// Category patterns for question classification
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  screener: [
    /do you plan to vote/i,
    /will you vote/i,
    /are you registered/i,
    /screen:/i,
    /likely.*voter/i,
  ],
  favorability: [
    /what is your opinion of/i,
    /favorable.*unfavorable/i,
    /do you have a favorable or unfavorable/i,
  ],
  job_approval: [
    /do you approve or disapprove of the job/i,
    /job.*doing/i,
    /approve.*disapprove.*job/i,
  ],
  top_of_ballot: [
    /if the (?:election|primary|caucus) were held today/i,
    /for whom would you vote/i,
    /who would you (?:vote for|support)/i,
    /which candidate/i,
  ],
  persuasion: [
    /more likely or less likely/i,
    /after hearing this/i,
    /would you be more likely/i,
    /does this make you/i,
  ],
  policy: [
    /do you support or oppose/i,
    /do you agree or disagree/i,
    /support.*oppose/i,
  ],
  issue: [
    /which of the following best describes/i,
    /what do you think about/i,
    /how important is/i,
    /most important issue/i,
  ],
  demographics: [
    /(?:^|\s)(?:party|gender|age|ideology|race|income|education|geography)/i,
    /are you a (?:woman|man|male|female)/i,
    /which age range/i,
    /do you consider yourself.*conservative/i,
  ],
};

function categorizeQuestion(text: string): string {
  const textLower = text.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(textLower)) {
        return category;
      }
    }
  }

  return "other";
}

function parseQuestions(text: string, source: string): Question[] {
  const questions: Question[] = [];

  // Split by question markers (Q1:, Q2:, SCREEN:, etc.)
  const questionPattern = /(?:^|\n)\s*(?:Q?\d+[.:]\s*|SCREEN[.:]\s*|DEMOGRAPHICS?[.:]\s*)/gi;
  const parts = text.split(questionPattern);
  const markers = text.match(questionPattern) || [];

  for (let i = 0; i < markers.length && i < parts.length - 1; i++) {
    const marker = markers[i].trim();
    const content = parts[i + 1]?.trim();

    if (!content || content.length < 10) continue;

    // Extract just the question text (stop at response options)
    const lines = content.split("\n");
    const questionLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Stop at response options
      if (
        /^(Yes|No|Undecided|Not sure|Favorable|Unfavorable|Very|Somewhat|Strongly|More likely|Less likely)/i.test(
          trimmed
        )
      ) {
        break;
      }
      questionLines.push(trimmed);
    }

    const questionText = questionLines.join(" ").trim();
    if (questionText.length < 10) continue;

    const category = categorizeQuestion(questionText);
    const id = `${source}_${marker.replace(/[^a-zA-Z0-9]/g, "")}`;

    questions.push({
      id,
      text: questionText,
      full_text: content.substring(0, 500),
      category,
      source,
      marker: marker.replace(/[.:]\s*$/, ""),
    });
  }

  return questions;
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

async function getQuestions(): Promise<Question[]> {
  try {
    const { blobs } = await list({ prefix: "questions-db.json" });
    if (blobs.length === 0) {
      // Fall back to static questions.json
      const staticQuestions = await import("@/data/questions.json");
      return staticQuestions.default.questions;
    }

    const res = await fetch(blobs[0].url);
    if (!res.ok) return [];

    const data = await res.json();
    return data.questions || [];
  } catch {
    return [];
  }
}

async function saveQuestions(questions: Question[]) {
  const stats: Record<string, number> = {};
  questions.forEach((q) => {
    stats[q.category] = (stats[q.category] || 0) + 1;
  });

  const data = {
    questions,
    stats: {
      total_questions: questions.length,
      by_category: stats,
    },
    lastUpdated: new Date().toISOString(),
  };

  await put("questions-db.json", JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
  });
}

export async function POST(request: NextRequest) {
  // Check admin password
  const authHeader = request.headers.get("authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId } = await request.json();

    // Get document metadata
    const documents = await getDocuments();
    const docIndex = documents.findIndex((d) => d.id === documentId);

    if (docIndex === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = documents[docIndex];

    // Update status to processing
    documents[docIndex] = { ...doc, status: "processing" };
    await saveDocuments(documents);

    try {
      // Fetch the document file
      const fileRes = await fetch(doc.url);
      if (!fileRes.ok) throw new Error("Failed to fetch document");

      const buffer = Buffer.from(await fileRes.arrayBuffer());

      // Extract text based on file type
      let text = "";
      if (doc.type === "docx") {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (doc.type === "pdf") {
        // Dynamic import for pdf-parse (CommonJS module)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfModule = await import("pdf-parse") as any;
        const pdfParse = pdfModule.default || pdfModule;
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      }

      // Parse questions
      const sourceName = doc.name.replace(/\.[^.]+$/, "");
      const newQuestions = parseQuestions(text, sourceName);

      if (newQuestions.length === 0) {
        throw new Error("No questions found in document");
      }

      // Get existing questions and merge
      const existingQuestions = await getQuestions();

      // Remove any existing questions from this source
      const filteredQuestions = existingQuestions.filter(
        (q) => q.source !== sourceName
      );

      // Add new questions
      const allQuestions = [...filteredQuestions, ...newQuestions];
      await saveQuestions(allQuestions);

      // Update document status
      documents[docIndex] = {
        ...doc,
        status: "done",
        questionCount: newQuestions.length,
      };
      await saveDocuments(documents);

      return NextResponse.json({
        success: true,
        questionsAdded: newQuestions.length,
        totalQuestions: allQuestions.length,
      });
    } catch (error) {
      // Update document status to error
      documents[docIndex] = {
        ...doc,
        status: "error",
        error: error instanceof Error ? error.message : "Processing failed",
      };
      await saveDocuments(documents);
      throw error;
    }
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
