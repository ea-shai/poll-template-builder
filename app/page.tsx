"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import questionsData from "@/data/questions.json";
import { Question, TemplateQuestion, RaceConfig, QuestionsData } from "@/lib/types";
import { QuestionCard } from "@/components/QuestionCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { RaceConfigForm } from "@/components/RaceConfigForm";
import { exportToWord, downloadBlob } from "@/lib/export";

const data = questionsData as QuestionsData;

function SortableQuestionCard({
  question,
  onRemove,
  customText,
  onTextChange,
}: {
  question: TemplateQuestion;
  onRemove: (id: string) => void;
  customText?: string;
  onTextChange: (id: string, text: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionCard
        question={question}
        onRemove={onRemove}
        isSelected
        isEditable
        customText={customText}
        onTextChange={onTextChange}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function Home() {
  // State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateQuestions, setTemplateQuestions] = useState<TemplateQuestion[]>([]);
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [raceConfig, setRaceConfig] = useState<RaceConfig>({
    raceName: "",
    district: "",
    electionDate: "",
    candidates: [""],
    party: "GOP",
  });
  const [showConfig, setShowConfig] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Categories from data
  const categories = useMemo(
    () => Object.keys(data.stats.by_category).sort(),
    []
  );

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    let result = data.questions;

    if (selectedCategories.length > 0) {
      result = result.filter((q) => selectedCategories.includes(q.category));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.text.toLowerCase().includes(query) ||
          q.source.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategories, searchQuery]);

  // Selected question IDs for quick lookup
  const selectedIds = useMemo(
    () => new Set(templateQuestions.map((q) => q.id)),
    [templateQuestions]
  );

  // Handlers
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const addToTemplate = useCallback((question: Question) => {
    setTemplateQuestions((prev) => [
      ...prev,
      { ...question, order: prev.length },
    ]);
  }, []);

  const removeFromTemplate = useCallback((id: string) => {
    setTemplateQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      return filtered.map((q, i) => ({ ...q, order: i }));
    });
    setCustomTexts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTemplateQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((q, i) => ({ ...q, order: i }));
      });
    }
  }, []);

  const handleTextChange = useCallback((id: string, text: string) => {
    setCustomTexts((prev) => ({ ...prev, [id]: text }));
  }, []);

  const handleExport = useCallback(async () => {
    const questionsWithCustomText = templateQuestions.map((q) => ({
      ...q,
      customText: customTexts[q.id],
    }));
    const blob = await exportToWord(questionsWithCustomText, raceConfig);
    const filename = raceConfig.raceName
      ? `${raceConfig.raceName.replace(/\s+/g, "_")}_Poll_Instrument.docx`
      : "Poll_Instrument.docx";
    downloadBlob(blob, filename);
  }, [templateQuestions, customTexts, raceConfig]);

  const clearTemplate = useCallback(() => {
    setTemplateQuestions([]);
    setCustomTexts({});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Poll Template Builder
              </h1>
              <p className="text-sm text-gray-500">
                {data.stats.total_questions} questions from{" "}
                {data.sources.length} instruments
              </p>
            </div>
            <div className="flex items-center gap-3">
              {templateQuestions.length > 0 && (
                <>
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-100"
                  >
                    {showConfig ? "Hide" : "Show"} Config
                  </button>
                  <button
                    onClick={clearTemplate}
                    className="text-sm text-red-600 hover:text-red-800 px-3 py-2 rounded hover:bg-red-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleExport}
                    className="text-sm bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 font-medium"
                  >
                    Export Word Doc
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Question Library */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-3">
                Question Library
              </h2>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Category filters */}
              <div className="mb-4">
                <CategoryFilter
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onToggle={toggleCategory}
                  counts={data.stats.by_category}
                />
              </div>

              {/* Results count */}
              <p className="text-sm text-gray-500 mb-4">
                Showing {filteredQuestions.length} questions
              </p>

              {/* Question list */}
              <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                {filteredQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onAdd={addToTemplate}
                    isSelected={selectedIds.has(question.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Template Builder */}
          <div className="w-[450px] flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Your Template</h2>
                <span className="text-sm text-gray-500">
                  {templateQuestions.length} questions
                </span>
              </div>

              {/* Race Config */}
              {showConfig && templateQuestions.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <RaceConfigForm config={raceConfig} onChange={setRaceConfig} />
                </div>
              )}

              {templateQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">
                    Click + on questions to add them here
                  </p>
                  <p className="text-xs mt-1">
                    Drag to reorder, edit text inline
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={templateQuestions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                      {templateQuestions
                        .sort((a, b) => a.order - b.order)
                        .map((question) => (
                          <SortableQuestionCard
                            key={question.id}
                            question={question}
                            onRemove={removeFromTemplate}
                            customText={customTexts[question.id]}
                            onTextChange={handleTextChange}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
