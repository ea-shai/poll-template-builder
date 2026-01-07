export interface Question {
  id: string;
  text: string;
  full_text: string;
  category: string;
  source: string;
  marker: string;
}

export interface QuestionsData {
  categories: Record<string, string>;
  sources: Array<{ name: string; question_count: number }>;
  questions: Question[];
  stats: {
    total_questions: number;
    by_category: Record<string, number>;
  };
}

export interface RaceConfig {
  raceName: string;
  district: string;
  electionDate: string;
  candidates: string[];
  party: "GOP" | "DEM" | "General";
}

export interface TemplateQuestion extends Question {
  customText?: string;
  order: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  screener: "Screener",
  favorability: "Favorability",
  job_approval: "Job Approval",
  top_of_ballot: "Top of Ballot",
  persuasion: "Persuasion",
  policy: "Policy",
  issue: "Issue",
  demographics: "Demographics",
  other: "Other",
};

export const CATEGORY_COLORS: Record<string, string> = {
  screener: "bg-purple-100 text-purple-800 border-purple-200",
  favorability: "bg-blue-100 text-blue-800 border-blue-200",
  job_approval: "bg-green-100 text-green-800 border-green-200",
  top_of_ballot: "bg-red-100 text-red-800 border-red-200",
  persuasion: "bg-orange-100 text-orange-800 border-orange-200",
  policy: "bg-yellow-100 text-yellow-800 border-yellow-200",
  issue: "bg-teal-100 text-teal-800 border-teal-200",
  demographics: "bg-gray-100 text-gray-800 border-gray-200",
  other: "bg-slate-100 text-slate-800 border-slate-200",
};
