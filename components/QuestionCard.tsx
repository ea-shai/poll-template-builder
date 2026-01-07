"use client";

import { Question, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  onAdd?: (question: Question) => void;
  onRemove?: (id: string) => void;
  isSelected?: boolean;
  isEditable?: boolean;
  customText?: string;
  onTextChange?: (id: string, text: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function QuestionCard({
  question,
  onAdd,
  onRemove,
  isSelected,
  isEditable,
  customText,
  onTextChange,
  dragHandleProps,
}: QuestionCardProps) {
  const displayText = customText ?? question.text;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isSelected
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      } transition-colors`}
    >
      <div className="flex items-start gap-3">
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="cursor-grab text-gray-400 hover:text-gray-600 mt-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-medium px-2 py-1 rounded border ${
                CATEGORY_COLORS[question.category]
              }`}
            >
              {CATEGORY_LABELS[question.category] || question.category}
            </span>
            <span className="text-xs text-gray-500">{question.source}</span>
          </div>

          {isEditable ? (
            <textarea
              value={displayText}
              onChange={(e) => onTextChange?.(question.id, e.target.value)}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded p-2 focus:outline-none focus:border-primary-500 resize-y min-h-[60px]"
              placeholder="Edit question text..."
            />
          ) : (
            <p className="text-sm text-gray-700 line-clamp-3">{displayText}</p>
          )}
        </div>

        <div className="flex-shrink-0">
          {onAdd && !isSelected && (
            <button
              onClick={() => onAdd(question)}
              className="text-primary-600 hover:text-primary-800 p-1 rounded hover:bg-primary-50"
              title="Add to template"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
          {onRemove && isSelected && (
            <button
              onClick={() => onRemove(question.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
              title="Remove from template"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
