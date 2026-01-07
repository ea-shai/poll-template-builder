"use client";

import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/types";

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onToggle: (category: string) => void;
  counts: Record<string, number>;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onToggle,
  counts,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => categories.forEach(onToggle)}
        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
          selectedCategories.length === 0
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
        }`}
      >
        All ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category);
        return (
          <button
            key={category}
            onClick={() => onToggle(category)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              isSelected
                ? CATEGORY_COLORS[category]
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {CATEGORY_LABELS[category] || category} ({counts[category] || 0})
          </button>
        );
      })}
    </div>
  );
}
