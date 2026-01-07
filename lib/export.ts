import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { TemplateQuestion, RaceConfig } from "./types";

function replaceVariables(text: string, config: RaceConfig): string {
  let result = text;

  // Replace common variables
  result = result.replace(/\[RACE_NAME\]/gi, config.raceName);
  result = result.replace(/\[DISTRICT\]/gi, config.district);
  result = result.replace(/\[ELECTION_DATE\]/gi, config.electionDate);
  result = result.replace(/\[DATE\]/gi, config.electionDate);
  result = result.replace(/\[PARTY\]/gi, config.party);

  // Replace candidate placeholders
  config.candidates.forEach((candidate, index) => {
    result = result.replace(
      new RegExp(`\\[CANDIDATE_${index + 1}\\]`, "gi"),
      candidate
    );
    result = result.replace(
      new RegExp(`\\[CANDIDATE${index + 1}\\]`, "gi"),
      candidate
    );
  });

  // Replace generic candidate placeholder with first candidate
  if (config.candidates.length > 0) {
    result = result.replace(/\[CANDIDATE_NAME\]/gi, config.candidates[0]);
    result = result.replace(/\[CANDIDATE\]/gi, config.candidates[0]);
  }

  return result;
}

export async function exportToWord(
  questions: TemplateQuestion[],
  config: RaceConfig
): Promise<Blob> {
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  const children: Paragraph[] = [
    // Title
    new Paragraph({
      children: [
        new TextRun({
          text: config.raceName || "Poll Instrument",
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    // Subtitle with details
    new Paragraph({
      children: [
        new TextRun({
          text: [config.district, config.electionDate, config.party]
            .filter(Boolean)
            .join(" | "),
          italics: true,
          size: 22,
          color: "666666",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // Divider
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
      },
      spacing: { after: 400 },
    }),
  ];

  // Add questions
  sortedQuestions.forEach((question, index) => {
    const questionNumber = index + 1;
    const displayText = replaceVariables(
      question.customText || question.text,
      config
    );

    // Question number and text
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Q${questionNumber}: `,
            bold: true,
            size: 24,
          }),
          new TextRun({
            text: displayText,
            size: 24,
          }),
        ],
        spacing: { before: 300, after: 200 },
      })
    );

    // Category tag (smaller, gray)
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[${question.category.toUpperCase()}]`,
            size: 18,
            color: "999999",
            italics: true,
          }),
        ],
        spacing: { after: 300 },
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
