"use client";

import { RaceConfig } from "@/lib/types";

interface RaceConfigFormProps {
  config: RaceConfig;
  onChange: (config: RaceConfig) => void;
}

export function RaceConfigForm({ config, onChange }: RaceConfigFormProps) {
  const updateField = <K extends keyof RaceConfig>(
    field: K,
    value: RaceConfig[K]
  ) => {
    onChange({ ...config, [field]: value });
  };

  const updateCandidate = (index: number, value: string) => {
    const newCandidates = [...config.candidates];
    newCandidates[index] = value;
    onChange({ ...config, candidates: newCandidates });
  };

  const addCandidate = () => {
    onChange({ ...config, candidates: [...config.candidates, ""] });
  };

  const removeCandidate = (index: number) => {
    const newCandidates = config.candidates.filter((_, i) => i !== index);
    onChange({ ...config, candidates: newCandidates });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Race Configuration</h3>
      <p className="text-xs text-gray-500">
        Use variables like [CANDIDATE_1], [DISTRICT], [DATE] in questions
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Race Name
          </label>
          <input
            type="text"
            value={config.raceName}
            onChange={(e) => updateField("raceName", e.target.value)}
            placeholder="e.g., GA SD 18 Special Election"
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            District
          </label>
          <input
            type="text"
            value={config.district}
            onChange={(e) => updateField("district", e.target.value)}
            placeholder="e.g., State Senate District 18"
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Election Date
          </label>
          <input
            type="text"
            value={config.electionDate}
            onChange={(e) => updateField("electionDate", e.target.value)}
            placeholder="e.g., January 20th, 2026"
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Party
          </label>
          <select
            value={config.party}
            onChange={(e) =>
              updateField("party", e.target.value as RaceConfig["party"])
            }
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-primary-500"
          >
            <option value="GOP">Republican Primary</option>
            <option value="DEM">Democratic Primary</option>
            <option value="General">General Election</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Candidates
        </label>
        <div className="space-y-2">
          {config.candidates.map((candidate, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-xs text-gray-500 py-2 w-24">
                [CANDIDATE_{index + 1}]
              </span>
              <input
                type="text"
                value={candidate}
                onChange={(e) => updateCandidate(index, e.target.value)}
                placeholder={`Candidate ${index + 1} name`}
                className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-primary-500"
              />
              {config.candidates.length > 1 && (
                <button
                  onClick={() => removeCandidate(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addCandidate}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            + Add candidate
          </button>
        </div>
      </div>
    </div>
  );
}
